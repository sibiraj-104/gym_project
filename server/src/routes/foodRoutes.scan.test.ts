import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { redis } from '../config/redis';
import { generateJWT } from '../utils/token';
import { cloudinary } from '../config/cloudinary';
import { analyzeFoodImage } from '../utils/gemini';

// Mock the Gemini and Cloudinary utilities
jest.mock('../utils/gemini', () => ({
  analyzeFoodImage: jest.fn(),
}));

jest.mock('../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

const testUserId = new mongoose.Types.ObjectId().toString();
const token = generateJWT(testUserId);

describe('POST /api/food/scan Integration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.connection.close();
    }
    await redis.quit();
  });

  beforeEach(async () => {
    await redis.flushall();
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    const res = await request(app)
      .post('/api/food/scan')
      .attach('image', Buffer.from('fake-bytes'), 'food.jpg');

    expect(res.status).toBe(401);
  });

  it('returns 400 if no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/food/scan')
      .set('Cookie', [`token=${token}`]);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 if file has invalid extension (not an image)', async () => {
    const res = await request(app)
      .post('/api/food/scan')
      .set('Cookie', [`token=${token}`])
      .attach('image', Buffer.from('some text content'), 'not-an-image.txt');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Only image files');
  });

  it('successfully uploads image and returns estimated nutrition on food image', async () => {
    // 1. Mock Cloudinary upload_stream to invoke callback with success result
    const mockCloudinaryUrl = 'https://cloudinary.com/abcd/food_scan.jpg';
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        _options: unknown,
        callback: (err: Error | null, result?: { secure_url: string }) => void,
      ) => {
        // Return a mock stream object with end method
        return {
          end: () => {
            callback(null, { secure_url: mockCloudinaryUrl });
          },
        };
      },
    );

    // 2. Mock Gemini response for a food item
    const mockGeminiResponse = {
      name: 'Salad with dressing',
      nutrition: {
        calories: 220,
        protein: 4.5,
        carbs: 12.2,
        fat: 18.1,
        fiber: 3.0,
        sugar: 2.1,
        sodium: 250,
      },
      confidence: 0.92,
    };
    (analyzeFoodImage as jest.Mock).mockResolvedValue(mockGeminiResponse);

    const res = await request(app)
      .post('/api/food/scan')
      .set('Cookie', [`token=${token}`])
      .attach('image', Buffer.from('fake-jpeg-bytes'), 'meal.jpg');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Salad with dressing');
    expect(res.body.confidence).toBe(0.92);
    expect(res.body.imageUrl).toBe(mockCloudinaryUrl);
    expect(res.body.nutrition.calories).toBe(220);
    expect(res.body.nutrition.protein).toBe(4.5);

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(1);
    expect(analyzeFoodImage).toHaveBeenCalledWith(mockCloudinaryUrl);
  });

  it('returns 400 with NOT_FOOD code if Gemini determines image is not food', async () => {
    // 1. Mock Cloudinary success
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        _options: unknown,
        callback: (err: Error | null, result?: { secure_url: string }) => void,
      ) => {
        return {
          end: () => {
            callback(null, { secure_url: 'https://cloudinary.com/cat.jpg' });
          },
        };
      },
    );

    // 2. Mock Gemini error response for a cat image
    (analyzeFoodImage as jest.Mock).mockResolvedValue({
      error: 'Not a food item',
      confidence: 0,
    });

    const res = await request(app)
      .post('/api/food/scan')
      .set('Cookie', [`token=${token}`])
      .attach('image', Buffer.from('fake-cat-image'), 'cat.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NOT_FOOD');
    expect(res.body.error.message).toContain(
      'does not appear to be a food item',
    );
  });

  it('enforces daily rate limit of 20 scans per user', async () => {
    // Mock Cloudinary and Gemini
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        _options: unknown,
        callback: (err: Error | null, result?: { secure_url: string }) => void,
      ) => {
        return { end: () => callback(null, { secure_url: 'url' }) };
      },
    );
    (analyzeFoodImage as jest.Mock).mockResolvedValue({
      name: 'Apple',
      nutrition: {
        calories: 50,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        fiber: 2.4,
        sugar: 10,
        sodium: 1,
      },
      confidence: 0.99,
    });

    // Make 20 successful scans
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post('/api/food/scan')
        .set('Cookie', [`token=${token}`])
        .attach('image', Buffer.from('image'), 'test.jpg');

      expect(res.status).toBe(200);
    }

    // The 21st scan should fail with 429
    const resBlocked = await request(app)
      .post('/api/food/scan')
      .set('Cookie', [`token=${token}`])
      .attach('image', Buffer.from('image'), 'test.jpg');

    expect(resBlocked.status).toBe(429);
    expect(resBlocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});

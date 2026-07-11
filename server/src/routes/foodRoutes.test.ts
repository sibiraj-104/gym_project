import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { redis } from '../config/redis';
import { generateJWT } from '../utils/token';
import { FoodItem } from '../models/FoodItem';

// Mock user for authorization
const testUserId = new mongoose.Types.ObjectId().toString();
const token = generateJWT(testUserId);

describe('Food Routes Integration Tests', () => {
  let fetchSpy: jest.SpyInstance;

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
    await FoodItem.deleteMany({});
    await redis.flushall();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/food/search', () => {
    it('returns 401 if unauthorized', async () => {
      const res = await request(app).get('/api/food/search?q=banana');
      expect(res.status).toBe(401);
    });

    it('returns 400 if search query is too short', async () => {
      const res = await request(app)
        .get('/api/food/search?q=a')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('calls external APIs on cache miss, caches results, and hits cache on second call', async () => {
      const mockOFFResponse = {
        products: [
          {
            code: '1111111111111',
            product_name: 'Organic Banana',
            brands: 'Dole',
            nutriments: {
              'energy-kcal_100g': 89,
              proteins_100g: 1.1,
              carbohydrates_100g: 22.8,
              fat_100g: 0.3,
            },
          },
        ],
      };

      const mockUSDAResponse = {
        foods: [
          {
            fdcId: 100001,
            description: 'Avocado',
            brandName: 'Fresh',
            foodNutrients: [
              { nutrientId: 1008, nutrientName: 'Energy', value: 160 },
              { nutrientId: 1003, nutrientName: 'Protein', value: 2 },
              { nutrientId: 1005, nutrientName: 'Carbs', value: 8.5 },
              { nutrientId: 1004, nutrientName: 'Fat', value: 14.7 },
            ],
          },
        ],
      };

      // Mock fetch implementation
      fetchSpy.mockImplementation((url: string) => {
        if (url.includes('openfoodfacts')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockOFFResponse),
          } as Response);
        } else if (url.includes('nal.usda.gov')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockUSDAResponse),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      // First search request (Cache Miss)
      const res1 = await request(app)
        .get('/api/food/search?q=banana&limit=5')
        .set('Cookie', [`token=${token}`]);

      expect(res1.status).toBe(200);
      expect(res1.body.results.length).toBe(2); // Banana + Avocado
      expect(res1.body.results[0].name).toBe('Organic Banana');
      expect(res1.body.results[1].name).toBe('Avocado');
      expect(fetchSpy).toHaveBeenCalledTimes(2); // One to OFF, one to USDA

      // Clear spy calls
      fetchSpy.mockClear();

      // Second search request (Cache Hit)
      const res2 = await request(app)
        .get('/api/food/search?q=banana&limit=5')
        .set('Cookie', [`token=${token}`]);

      expect(res2.status).toBe(200);
      expect(res2.body.results.length).toBe(2);
      expect(fetchSpy).not.toHaveBeenCalled(); // No external API calls made!
    });
  });

  describe('GET /api/food/barcode/:code', () => {
    const validBarcode = '5449000000096';

    it('returns 401 if unauthorized', async () => {
      const res = await request(app).get(`/api/food/barcode/${validBarcode}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 if barcode parameter is invalid', async () => {
      const res = await request(app)
        .get('/api/food/barcode/invalidbarcode123')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(400);
    });

    it('returns local DB item directly if it exists', async () => {
      // Create local item
      const localItem = new FoodItem({
        name: 'Local Coke',
        barcode: validBarcode,
        servingSize: 250,
        nutrition: { calories: 100, protein: 0, carbs: 25, fat: 0 },
        source: 'userAdded',
      });
      await localItem.save();

      const res = await request(app)
        .get(`/api/food/barcode/${validBarcode}`)
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.product.name).toBe('Local Coke');
      expect(fetchSpy).not.toHaveBeenCalled(); // No fetch
    });

    it('returns 404 if not found in database or external API', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 0, product: null }),
      } as unknown as Response);

      const res = await request(app)
        .get(`/api/food/barcode/${validBarcode}`)
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('calls external API on cache miss, caches it, and hits cache on second call', async () => {
      const mockProductResponse = {
        status: 1,
        product: {
          code: validBarcode,
          product_name: 'Coca Cola Zero',
          brands: 'Coca-Cola',
          nutriments: {
            'energy-kcal_100g': 0,
            proteins_100g: 0,
            carbohydrates_100g: 0,
            fat_100g: 0,
          },
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProductResponse),
      } as unknown as Response);

      // First call (Cache Miss)
      const res1 = await request(app)
        .get(`/api/food/barcode/${validBarcode}`)
        .set('Cookie', [`token=${token}`]);

      expect(res1.status).toBe(200);
      expect(res1.body.product.name).toBe('Coca Cola Zero');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      fetchSpy.mockClear();

      // Second call (Cache Hit)
      const res2 = await request(app)
        .get(`/api/food/barcode/${validBarcode}`)
        .set('Cookie', [`token=${token}`]);

      expect(res2.status).toBe(200);
      expect(res2.body.product.name).toBe('Coca Cola Zero');
      expect(fetchSpy).not.toHaveBeenCalled(); // No fetch call
    });
  });
});

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { User } from '../models/User';
import { verifyGoogleToken } from '../utils/token';
import { UserRole } from 'gymfuel-shared';

// Mock the verifyGoogleToken utility
jest.mock('../utils/token', () => {
  const original = jest.requireActual('../utils/token');
  return {
    ...original,
    verifyGoogleToken: jest.fn(),
  };
});

const mockedVerifyGoogleToken = verifyGoogleToken as jest.MockedFunction<
  typeof verifyGoogleToken
>;

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    // Connect to database before all tests
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Disconnect and clean up
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Clear the user collection before each test
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/auth/google', () => {
    it('returns 200 and sets JWT cookie when token is valid (new user creation)', async () => {
      mockedVerifyGoogleToken.mockResolvedValueOnce({
        uid: 'google_uid_123',
        email: 'testuser@example.com',
        name: 'Test User',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'valid_google_token' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Authentication successful');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body.user.googleId).toBeUndefined(); // Verify googleId is not leaked

      // Check cookie
      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader[0]).toContain('token=');
      expect(cookieHeader[0]).toContain('HttpOnly');

      // Verify user was created in DB
      const userInDb = await User.findOne({ email: 'testuser@example.com' });
      expect(userInDb).toBeDefined();
      expect(userInDb?.googleId).toBe('google_uid_123');
    });

    it('returns 200 and logs in existing user without duplication', async () => {
      // Pre-create user
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        googleId: 'existing_google_uid',
        role: UserRole.USER,
        isOnboarded: false,
      });

      mockedVerifyGoogleToken.mockResolvedValueOnce({
        uid: 'existing_google_uid',
        email: 'existing@example.com',
        name: 'Existing User',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'valid_token' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Existing User');

      const count = await User.countDocuments({
        email: 'existing@example.com',
      });
      expect(count).toBe(1);
    });

    it('returns 401 when Google token verification fails', async () => {
      mockedVerifyGoogleToken.mockRejectedValueOnce(
        new Error('Invalid signature'),
      );

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'invalid_token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain(
        'Invalid Google Token: Invalid signature',
      );
    });

    it('returns 400 when token is missing in request body', async () => {
      const res = await request(app).post('/api/auth/google').send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears token cookie and returns 200', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');

      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader[0]).toContain('token=;');
    });
  });
});

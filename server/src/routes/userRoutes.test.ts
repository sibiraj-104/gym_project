import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { User } from '../models/User';
import { generateJWT } from '../utils/token';
import { UserRole } from 'gymfuel-shared';

describe('User Routes Integration Tests', () => {
  let testUserId: string;
  let authToken: string;

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
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create a default test user
    const createdUser = await User.create({
      name: 'Active Member',
      email: 'member@gymfuel.com',
      role: UserRole.USER,
      isOnboarded: false,
    });

    testUserId = createdUser.id;
    authToken = generateJWT(createdUser.id, createdUser.role);
  });

  describe('GET /api/user/profile', () => {
    it('returns 200 OK and profile details for authenticated user', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('member@gymfuel.com');
      expect(res.body.user.isOnboarded).toBe(false);
    });

    it('returns 401 Unauthorized when no cookie is sent', async () => {
      const res = await request(app).get('/api/user/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/user/onboarding', () => {
    const validOnboardingData = {
      age: 25,
      weight: 70, // 70 kg
      height: 175, // 175 cm
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'build_muscle',
    };

    it('saves user profile and goal calculations, then returns 200 OK', async () => {
      const res = await request(app)
        .put('/api/user/onboarding')
        .set('Cookie', [`token=${authToken}`])
        .send(validOnboardingData);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Onboarding completed successfully');
      expect(res.body.user.isOnboarded).toBe(true);
      expect(res.body.user.profile).toBeDefined();
      expect(res.body.user.profile.age).toBe(25);
      expect(res.body.user.profile.weight).toBe(70);

      // Verify TDEE math & surplus:
      // BMR = 10*70 + 6.25*175 - 5*25 + 5 = 1673.75
      // TDEE = 1673.75 * 1.55 = 2594.3 -> rounded to 2594
      // Build muscle target = TDEE + 300 surplus = 2894 kcal
      expect(res.body.user.goals.targetCalories).toBe(2894);
      expect(res.body.user.goals.targetProtein).toBe(140); // 70 * 2.0 = 140g
      expect(res.body.user.goals.targetFat).toBe(80); // 25% of 2894 = 723.5 / 9 = 80g
      expect(res.body.user.goals.targetCarbs).toBe(404); // Remaining: 2894 - (140*4 + 80*9) = 2894 - (560 + 720) = 1614 / 4 = 404g
      expect(res.body.user.goals.targetWaterGlasses).toBe(9); // 8 + (70 - 60)/10 = 9

      // Verify DB persists the changes
      const updatedUser = await User.findById(testUserId);
      expect(updatedUser?.isOnboarded).toBe(true);
      expect(updatedUser?.goals?.targetCalories).toBe(2894);
    });

    it('returns 400 Validation Error for out-of-range inputs', async () => {
      const invalidData = {
        ...validOnboardingData,
        age: 5, // below min of 10
      };

      const res = await request(app)
        .put('/api/user/onboarding')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 Unauthorized if request has no auth cookie', async () => {
      const res = await request(app)
        .put('/api/user/onboarding')
        .send(validOnboardingData);

      expect(res.status).toBe(401);
    });
  });
});

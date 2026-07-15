import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/User';
import MealLog from '../models/MealLog';
import NutritionAlert from '../models/NutritionAlert';
import { generateJWT } from '../utils/token';
import { UserRole, AlertType, FitnessGoal } from 'gymfuel-shared';
import { checkUserAlerts, runDailyAlertEngine } from '../services/alertEngine';

describe('Alert Routes & Alert Engine Tests', () => {
  let testUserId: string;
  let authToken: string;

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
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await MealLog.deleteMany({});
    await NutritionAlert.deleteMany({});

    // Create a default test user with goals
    const createdUser = await User.create({
      name: 'Active Member',
      email: 'member@gymfuel.com',
      role: UserRole.USER,
      isOnboarded: true,
      goals: {
        type: FitnessGoal.MAINTAIN_WEIGHT,
        targetCalories: 2000,
        targetProtein: 140,
        targetCarbs: 220,
        targetFat: 60,
        targetWaterGlasses: 8,
      },
    });

    testUserId = createdUser.id;
    authToken = generateJWT(createdUser.id, createdUser.role);
  });

  describe('Alerts Configuration API Endpoints', () => {
    it('returns empty array when user has no alert rules configured', async () => {
      const res = await request(app)
        .get('/api/nutrition/alerts')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeDefined();
      expect(res.body.alerts).toHaveLength(0);
    });

    it('allows bulk configuring multiple alert rules', async () => {
      const configPayload = {
        alerts: [
          {
            type: AlertType.CALORIES,
            thresholdPct: 50,
            isEnabled: true,
            emailEnabled: true,
            pushEnabled: false,
          },
          {
            type: AlertType.WATER,
            thresholdPct: 75,
            isEnabled: true,
            emailEnabled: false,
            pushEnabled: true,
          },
        ],
      };

      const res = await request(app)
        .post('/api/nutrition/alerts')
        .set('Cookie', [`token=${authToken}`])
        .send(configPayload);

      expect(res.status).toBe(200);
      expect(res.body.alerts).toHaveLength(2);

      // Verify db persistence
      const savedAlerts = await NutritionAlert.find({ userId: testUserId });
      expect(savedAlerts).toHaveLength(2);
      expect(
        savedAlerts.find((a) => a.type === AlertType.CALORIES)?.thresholdPct,
      ).toBe(50);
      expect(
        savedAlerts.find((a) => a.type === AlertType.WATER)?.emailEnabled,
      ).toBe(false);
    });

    it('allows configuring a single alert rule', async () => {
      const configPayload = {
        type: AlertType.PROTEIN,
        thresholdPct: 80,
        isEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
      };

      const res = await request(app)
        .post('/api/nutrition/alerts')
        .set('Cookie', [`token=${authToken}`])
        .send(configPayload);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe(AlertType.PROTEIN);
      expect(res.body.thresholdPct).toBe(80);

      // Retrieve configured alerts list
      const listRes = await request(app)
        .get('/api/nutrition/alerts')
        .set('Cookie', [`token=${authToken}`]);

      expect(listRes.status).toBe(200);
      expect(listRes.body.alerts).toHaveLength(1);
      expect(listRes.body.alerts[0].type).toBe(AlertType.PROTEIN);
    });

    it('rejects configuration if required fields are missing or invalid', async () => {
      const badPayload = {
        type: 'invalid_type',
        thresholdPct: 150, // exceeds 100% max limit
      };

      const res = await request(app)
        .post('/api/nutrition/alerts')
        .set('Cookie', [`token=${authToken}`])
        .send(badPayload);

      expect(res.status).toBe(400);
    });
  });

  describe('Daily Alert Scanning Engine', () => {
    beforeEach(async () => {
      // Configure rules for the user:
      // Calories: warning if < 50%
      // Water: warning if < 75%
      await NutritionAlert.create([
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          type: AlertType.CALORIES,
          thresholdPct: 50,
          isEnabled: true,
          emailEnabled: true,
        },
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          type: AlertType.WATER,
          thresholdPct: 75,
          isEnabled: true,
          pushEnabled: true,
        },
      ]);
    });

    it('detects threshold breaches when daily totals are below target thresholds', async () => {
      const todayStr = '2026-07-15';

      // Scenario: User logged calories: 800/2000 (40%), water: 5/8 (62.5%)
      // Both are below thresholds (40% < 50% for calories, 62.5% < 75% for water)
      await MealLog.create({
        userId: new mongoose.Types.ObjectId(testUserId),
        date: todayStr,
        meals: [],
        totals: {
          calories: 800,
          protein: 80,
          carbs: 100,
          fat: 20,
          fiber: 5,
          waterGlasses: 5,
        },
      });

      const triggered = await checkUserAlerts(testUserId, todayStr);
      expect(triggered).toHaveLength(2);

      const caloriesBreach = triggered.find(
        (t) => t.type === AlertType.CALORIES,
      );
      const waterBreach = triggered.find((t) => t.type === AlertType.WATER);

      expect(caloriesBreach).toBeDefined();
      expect(caloriesBreach?.consumed).toBe(800);
      expect(caloriesBreach?.target).toBe(2000);
      expect(caloriesBreach?.emailSent).toBe(true);

      expect(waterBreach).toBeDefined();
      expect(waterBreach?.consumed).toBe(5);
      expect(waterBreach?.target).toBe(8);
      expect(waterBreach?.pushSent).toBe(true);
    });

    it('does not trigger warning if user meets or exceeds configured thresholds', async () => {
      const todayStr = '2026-07-15';

      // Scenario: User logged calories: 1200/2000 (60%), water: 6/8 (75%)
      // Both meet or exceed thresholds (60% >= 50% for calories, 75% >= 75% for water)
      await MealLog.create({
        userId: new mongoose.Types.ObjectId(testUserId),
        date: todayStr,
        meals: [],
        totals: {
          calories: 1200,
          protein: 90,
          carbs: 150,
          fat: 30,
          fiber: 10,
          waterGlasses: 6,
        },
      });

      const triggered = await checkUserAlerts(testUserId, todayStr);
      expect(triggered).toHaveLength(0);
    });

    it('runs the global scanner engine and reports triggered alerts count', async () => {
      const todayStr = '2026-07-15';

      // Scenario: No meal log logged today (consumed = 0, breaches all active rules)
      const count = await runDailyAlertEngine(todayStr);
      expect(count).toBe(2);
    });
  });
});

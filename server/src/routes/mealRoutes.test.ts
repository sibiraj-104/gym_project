import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { redis } from '../config/redis';
import { generateJWT } from '../utils/token';
import { FoodItem } from '../models/FoodItem';
import { MealLog } from '../models/MealLog';
import { User } from '../models/User';
import { MealType } from 'gymfuel-shared';

describe('Meal Logging Routes Integration Tests', () => {
  let testUserId: string;
  let token: string;
  let localFoodId: string;
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
    await MealLog.deleteMany({});
    await FoodItem.deleteMany({});
    await User.deleteMany({});
    await redis.flushall();
    fetchSpy = jest.spyOn(global, 'fetch');

    // Create a test user
    const user = new User({
      name: 'Test Logger',
      email: 'log@gymfuel.com',
      role: 'user',
      isOnboarded: true,
      goals: {
        type: 'build_muscle',
        targetCalories: 2500,
        targetProtein: 150,
        targetCarbs: 300,
        targetFat: 80,
        targetWaterGlasses: 8,
      },
    });
    const savedUser = await user.save();
    testUserId = savedUser._id.toString();
    token = generateJWT(testUserId);

    // Create a local food item
    const food = new FoodItem({
      name: 'Oatmeal',
      brand: 'Quaker',
      servingSize: 40,
      servingUnit: 'g',
      nutrition: {
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 3,
        fiber: 4,
        sugar: 1,
        sodium: 0,
      },
      source: 'userAdded',
    });
    const savedFood = await food.save();
    localFoodId = savedFood._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/meals/log', () => {
    it('returns 401 if unauthorized', async () => {
      const res = await request(app).post('/api/meals/log').send({
        foodId: localFoodId,
        portionGrams: 80,
        mealType: MealType.BREAKFAST,
      });
      expect(res.status).toBe(401);
    });

    it('successfully logs a local food item, calculates portion macros, and updates daily totals', async () => {
      const res = await request(app)
        .post('/api/meals/log')
        .set('Cookie', [`token=${token}`])
        .send({
          foodId: localFoodId,
          portionGrams: 80, // 2x serving size
          mealType: MealType.BREAKFAST,
          date: '2026-07-11',
        });

      expect(res.status).toBe(201);
      expect(res.body.meals.length).toBe(1);
      expect(res.body.meals[0].foodName).toBe('Oatmeal');
      expect(res.body.meals[0].portionGrams).toBe(80);

      // 2x serving size: 150 cal * 2 = 300 cal
      expect(res.body.meals[0].nutrition.calories).toBe(300);
      expect(res.body.meals[0].nutrition.protein).toBe(10);
      expect(res.body.meals[0].nutrition.carbs).toBe(54);
      expect(res.body.meals[0].nutrition.fat).toBe(6);

      // Verify daily totals match
      expect(res.body.totals.calories).toBe(300);
      expect(res.body.totals.protein).toBe(10);
      expect(res.body.totals.carbs).toBe(54);
      expect(res.body.totals.fat).toBe(6);

      // Verify user streak count is initialized to 1
      const user = await User.findById(testUserId);
      expect(user?.streakCount).toBe(1);
    });

    it('increments user streak if they logged a meal yesterday', async () => {
      // 1. Pre-create a log with meals for yesterday
      const yesterdayStr = '2026-07-10';
      const yesterdayLog = new MealLog({
        userId: testUserId,
        date: yesterdayStr,
        meals: [
          {
            foodId: localFoodId,
            foodName: 'Oatmeal',
            mealType: MealType.BREAKFAST,
            portionGrams: 40,
            nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3 },
            loggedAt: new Date(),
          },
        ],
        totals: {
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
          fiber: 0,
          waterGlasses: 0,
        },
      });
      await yesterdayLog.save();

      // Ensure user starts with streakCount = 1
      await User.findByIdAndUpdate(testUserId, { streakCount: 1 });

      // 2. Log a meal for today (2026-07-11)
      const res = await request(app)
        .post('/api/meals/log')
        .set('Cookie', [`token=${token}`])
        .send({
          foodId: localFoodId,
          portionGrams: 40,
          mealType: MealType.BREAKFAST,
          date: '2026-07-11',
        });

      expect(res.status).toBe(201);

      // Streak should be incremented to 2
      const user = await User.findById(testUserId);
      expect(user?.streakCount).toBe(2);
    });

    it('resolves and auto-saves an external Open Food Facts food item on first log', async () => {
      const mockBarcode = '8888888888888';
      const mockOFFProduct = {
        status: 1,
        product: {
          code: mockBarcode,
          product_name: 'External OFF Yogurt',
          brands: 'Yoplait',
          serving_quantity: 100,
          serving_size: '100 g',
          nutriments: {
            'energy-kcal_100g': 100,
            proteins_100g: 10,
            carbohydrates_100g: 5,
            fat_100g: 2,
          },
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockOFFProduct),
      } as unknown as Response);

      const res = await request(app)
        .post('/api/meals/log')
        .set('Cookie', [`token=${token}`])
        .send({
          foodId: `off:${mockBarcode}`,
          portionGrams: 200,
          mealType: MealType.SNACK,
          date: '2026-07-11',
        });

      expect(res.status).toBe(201);
      expect(res.body.meals[0].foodName).toBe('External OFF Yogurt');
      // 200g @ 100 cal/100g = 200 cal
      expect(res.body.meals[0].nutrition.calories).toBe(200);

      // Verify it was saved to the FoodItem collection locally
      const savedFood = await FoodItem.findOne({ barcode: mockBarcode });
      expect(savedFood).toBeDefined();
      expect(savedFood?.name).toBe('External OFF Yogurt');
    });
  });

  describe('GET /api/meals/log/today', () => {
    it('returns daily log summary with goal and remaining calories', async () => {
      // Create a log for today
      const todayStr = '2026-07-11';
      const log = new MealLog({
        userId: testUserId,
        date: todayStr,
        meals: [
          {
            foodId: localFoodId,
            foodName: 'Oatmeal',
            mealType: MealType.BREAKFAST,
            portionGrams: 80,
            nutrition: { calories: 300, protein: 10, carbs: 54, fat: 6 },
            loggedAt: new Date(),
          },
        ],
        totals: {
          calories: 300,
          protein: 10,
          carbs: 54,
          fat: 6,
          fiber: 0,
          waterGlasses: 1,
        },
      });
      await log.save();

      const res = await request(app)
        .get(`/api/meals/log/today?date=${todayStr}`)
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.date).toBe(todayStr);
      expect(res.body.meals.length).toBe(1);
      expect(res.body.totals.calories).toBe(300);
      expect(res.body.goalCalories).toBe(2500); // from user config
      expect(res.body.remainingCalories).toBe(2200); // 2500 - 300
    });
  });

  describe('GET /api/meals/log/history', () => {
    it('returns meal logs within range sorted descending', async () => {
      const log1 = new MealLog({
        userId: testUserId,
        date: '2026-07-09',
        meals: [],
        totals: {
          calories: 100,
          protein: 10,
          carbs: 10,
          fat: 2,
          fiber: 0,
          waterGlasses: 0,
        },
      });
      const log2 = new MealLog({
        userId: testUserId,
        date: '2026-07-10',
        meals: [],
        totals: {
          calories: 200,
          protein: 20,
          carbs: 20,
          fat: 4,
          fiber: 0,
          waterGlasses: 0,
        },
      });
      await log1.save();
      await log2.save();

      const res = await request(app)
        .get('/api/meals/log/history?startDate=2026-07-08&endDate=2026-07-10')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].date).toBe('2026-07-10'); // desc sorted
      expect(res.body[1].date).toBe('2026-07-09');
    });
  });

  describe('DELETE /api/meals/log/entry', () => {
    it('deletes a meal entry at index and updates daily totals', async () => {
      const todayStr = '2026-07-11';
      const log = new MealLog({
        userId: testUserId,
        date: todayStr,
        meals: [
          {
            foodId: localFoodId,
            foodName: 'Oatmeal',
            mealType: MealType.BREAKFAST,
            portionGrams: 40,
            nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3 },
            loggedAt: new Date(),
          },
          {
            foodId: localFoodId,
            foodName: 'Oatmeal Double',
            mealType: MealType.LUNCH,
            portionGrams: 80,
            nutrition: { calories: 300, protein: 10, carbs: 54, fat: 6 },
            loggedAt: new Date(),
          },
        ],
        totals: {
          calories: 450,
          protein: 15,
          carbs: 81,
          fat: 9,
          fiber: 0,
          waterGlasses: 0,
        },
      });
      const savedLog = await log.save();

      const res = await request(app)
        .delete('/api/meals/log/entry')
        .set('Cookie', [`token=${token}`])
        .send({
          logId: savedLog._id.toString(),
          entryIndex: 1, // delete Oatmeal Double (lunch)
        });

      expect(res.status).toBe(200);
      expect(res.body.meals.length).toBe(1);
      expect(res.body.meals[0].foodName).toBe('Oatmeal');
      expect(res.body.totals.calories).toBe(150);
      expect(res.body.totals.protein).toBe(5);
      expect(res.body.totals.carbs).toBe(27);
      expect(res.body.totals.fat).toBe(3);
    });
  });
});

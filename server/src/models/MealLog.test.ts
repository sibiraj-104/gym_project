import mongoose from 'mongoose';
import { MealLog } from './MealLog';
import { MealType } from 'gymfuel-shared';

describe('MealLog Model Unit Tests', () => {
  let testUserId: mongoose.Types.ObjectId;

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
    await MealLog.deleteMany({});
    testUserId = new mongoose.Types.ObjectId();
  });

  it('successfully creates a valid meal log with totals and meals', async () => {
    const validLog = new MealLog({
      userId: testUserId,
      date: '2026-07-11',
      meals: [
        {
          foodId: 'food-001',
          foodName: 'Scrambled Eggs',
          mealType: MealType.BREAKFAST,
          portionGrams: 100,
          nutrition: {
            calories: 140,
            protein: 12,
            carbs: 1,
            fat: 10,
          },
        },
      ],
      totals: {
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
        fiber: 0,
        waterGlasses: 2,
      },
    });

    const saved = await validLog.save();
    expect(saved._id).toBeDefined();
    expect(saved.userId.toString()).toBe(testUserId.toString());
    expect(saved.meals.length).toBe(1);
    expect(saved.meals[0].foodName).toBe('Scrambled Eggs');
    expect(saved.totals.calories).toBe(140);
  });

  it('fails validation for invalid date format', async () => {
    const invalidLog = new MealLog({
      userId: testUserId,
      date: '11-07-2026', // invalid, should be YYYY-MM-DD
      totals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        waterGlasses: 0,
      },
    });

    await expect(invalidLog.save()).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('enforces unique compound index on userId + date', async () => {
    const log1 = new MealLog({
      userId: testUserId,
      date: '2026-07-11',
      totals: {
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2,
        fiber: 0,
        waterGlasses: 0,
      },
    });
    await log1.save();

    // Try saving another log for the same user on the same day -> should fail
    const log2 = new MealLog({
      userId: testUserId,
      date: '2026-07-11', // duplicate date for same user
      totals: {
        calories: 200,
        protein: 20,
        carbs: 20,
        fat: 4,
        fiber: 0,
        waterGlasses: 1,
      },
    });

    await expect(log2.save()).rejects.toThrow();

    // Saving a log for a different user on the same day -> should succeed
    const differentUser = new mongoose.Types.ObjectId();
    const logDifferentUser = new MealLog({
      userId: differentUser,
      date: '2026-07-11',
      totals: {
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2,
        fiber: 0,
        waterGlasses: 0,
      },
    });
    await expect(logDifferentUser.save()).resolves.toBeDefined();

    // Saving a log for the same user on a different day -> should succeed
    const logDifferentDay = new MealLog({
      userId: testUserId,
      date: '2026-07-12', // different day
      totals: {
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2,
        fiber: 0,
        waterGlasses: 0,
      },
    });
    await expect(logDifferentDay.save()).resolves.toBeDefined();
  });
});

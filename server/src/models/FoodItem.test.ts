import mongoose from 'mongoose';
import { FoodItem } from './FoodItem';
import { FoodSource } from 'gymfuel-shared';

describe('FoodItem Model Unit Tests', () => {
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
    await FoodItem.deleteMany({});
  });

  it('successfully creates a valid food item with required fields', async () => {
    const validFood = new FoodItem({
      name: 'Organic Banana',
      brand: 'Chiquita',
      servingSize: 100,
      servingUnit: 'g',
      nutrition: {
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3,
      },
      source: FoodSource.OPEN_FOOD_FACTS,
    });

    const saved = await validFood.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('Organic Banana');
    expect(saved.isApproved).toBe(false); // default value
    expect(saved.reportCount).toBe(0); // default value
  });

  it('fails validation if name is too short', async () => {
    const invalidFood = new FoodItem({
      name: 'a', // min length is 2
      servingSize: 100,
      nutrition: {
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3,
      },
      source: FoodSource.OPEN_FOOD_FACTS,
    });

    await expect(invalidFood.save()).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('enforces sparse unique index on barcode', async () => {
    // Save first item with a barcode
    const item1 = new FoodItem({
      name: 'Greek Yogurt',
      barcode: '1234567890123',
      servingSize: 150,
      nutrition: { calories: 120, protein: 15, carbs: 6, fat: 2 },
      source: FoodSource.USER_ADDED,
    });
    await item1.save();

    // Try saving second item with the same barcode -> should fail
    const item2 = new FoodItem({
      name: 'Plain Yogurt',
      barcode: '1234567890123', // duplicate
      servingSize: 150,
      nutrition: { calories: 110, protein: 14, carbs: 5, fat: 2 },
      source: FoodSource.USER_ADDED,
    });

    await expect(item2.save()).rejects.toThrow();

    // Allow multiple food items with undefined/null barcode (sparse unique index validation)
    const itemNoBarcode1 = new FoodItem({
      name: 'Apple',
      servingSize: 100,
      nutrition: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      source: FoodSource.OPEN_FOOD_FACTS,
    });
    const itemNoBarcode2 = new FoodItem({
      name: 'Orange',
      servingSize: 100,
      nutrition: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
      source: FoodSource.OPEN_FOOD_FACTS,
    });

    await expect(itemNoBarcode1.save()).resolves.toBeDefined();
    await expect(itemNoBarcode2.save()).resolves.toBeDefined();
  });

  it('supports text search index on name and brand fields', async () => {
    const item = new FoodItem({
      name: 'Whole Grain Oatmeal',
      brand: 'Quaker Oats',
      servingSize: 40,
      nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3 },
      source: FoodSource.USER_ADDED,
    });
    await item.save();

    // Need to wait for indexes to build if not already built, but deleteMany/save handles it.
    // We can query using $text
    const results = await FoodItem.find({
      $text: { $search: 'Oatmeal Quaker' },
    });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Whole Grain Oatmeal');
  });
});

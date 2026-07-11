import { parseOpenFoodFacts, parseUSDAFood } from './foodParser';
import { FoodSource } from 'gymfuel-shared';

describe('foodParser Unit Tests', () => {
  it('correctly parses Open Food Facts product structure', () => {
    const mockOFFProduct = {
      code: '5449000000096',
      product_name: 'Coca Cola Zero',
      brands: 'Coca-Cola',
      image_front_url: 'https://images.com/cocacola.jpg',
      serving_quantity: 250,
      serving_size: '250 ml',
      nutriments: {
        'energy-kcal_100g': 0.3,
        proteins_100g: 0,
        carbohydrates_100g: 0,
        fat_100g: 0,
        fiber_100g: 0,
        sugars_100g: 0,
        sodium_100g: 0.01,
      },
    };

    const parsed = parseOpenFoodFacts(mockOFFProduct);

    expect(parsed.name).toBe('Coca Cola Zero');
    expect(parsed.brand).toBe('Coca-Cola');
    expect(parsed.barcode).toBe('5449000000096');
    expect(parsed.servingSize).toBe(250);
    expect(parsed.servingUnit).toBe('ml');
    expect(parsed.nutrition.calories).toBe(0);
    expect(parsed.nutrition.sodium).toBe(10); // 0.01g * 1000 = 10mg
    expect(parsed.source).toBe(FoodSource.OPEN_FOOD_FACTS);
  });

  it('correctly parses USDA food item structure', () => {
    const mockUSDAFood = {
      fdcId: 173972,
      description: 'Raw Avocado',
      brandName: 'Dole',
      servingSize: 50,
      servingSizeUnit: 'g',
      foodNutrients: [
        {
          nutrientId: 1008,
          nutrientName: 'Energy',
          value: 160,
          unitName: 'KCAL',
        },
        {
          nutrientId: 1003,
          nutrientName: 'Protein',
          value: 2.0,
          unitName: 'G',
        },
        {
          nutrientId: 1005,
          nutrientName: 'Carbohydrate, by difference',
          value: 8.53,
          unitName: 'G',
        },
        {
          nutrientId: 1004,
          nutrientName: 'Total lipid (fat)',
          value: 14.66,
          unitName: 'G',
        },
        {
          nutrientId: 1079,
          nutrientName: 'Fiber, total dietary',
          value: 6.7,
          unitName: 'G',
        },
        {
          nutrientId: 2000,
          nutrientName: 'Sugars, total including NLEA',
          value: 0.66,
          unitName: 'G',
        },
        {
          nutrientId: 1093,
          nutrientName: 'Sodium, Na',
          value: 7,
          unitName: 'MG',
        },
      ],
    };

    const parsed = parseUSDAFood(mockUSDAFood);

    expect(parsed.name).toBe('Raw Avocado');
    expect(parsed.brand).toBe('Dole');
    expect(parsed.servingSize).toBe(50);
    expect(parsed.servingUnit).toBe('g');
    expect(parsed.nutrition.calories).toBe(160);
    expect(parsed.nutrition.protein).toBe(2);
    expect(parsed.nutrition.carbs).toBe(8.5);
    expect(parsed.nutrition.fat).toBe(14.7);
    expect(parsed.nutrition.fiber).toBe(6.7);
    expect(parsed.nutrition.sugar).toBe(0.7);
    expect(parsed.nutrition.sodium).toBe(7);
    expect(parsed.source).toBe(FoodSource.USDA);
  });
});

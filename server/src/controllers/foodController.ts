// ============================================================
// GymFuel — Food Controller
// Implements food searching (Open Food Facts + USDA) and barcode
// lookups with Redis caching and error tolerance.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { FoodItem } from '../models/FoodItem';
import { parseOpenFoodFacts, parseUSDAFood } from '../utils/foodParser';
import { foodSearchSchema, barcodeSchema } from 'gymfuel-shared';

// Cache TTLs in seconds
const SEARCH_CACHE_TTL = 300; // 5 minutes
const BARCODE_CACHE_TTL = 3600; // 1 hour

/**
 * GET /api/food/search?q=
 * Searches Open Food Facts + USDA, merges and deduplicates results.
 */
export async function searchFood(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Validate query parameters
    const parsedQuery = foodSearchSchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsedQuery.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { q, page, limit } = parsedQuery.data;
    const cacheKey = `gf_search:${q.toLowerCase()}:p:${page}:l:${limit}`;

    // 2. Check Redis cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      logger.debug(`Redis cache hit for food search: ${q}`);
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    logger.debug(
      `Redis cache miss for food search: ${q}. Fetching external APIs...`,
    );

    // 3. Fetch concurrently from Open Food Facts and USDA
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      q,
    )}&json=true&page=${page}&page_size=${limit}&fields=code,product_name,brands,image_front_url,nutriments,serving_quantity,serving_size`;

    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
      q,
    )}&pageSize=${limit}&pageNumber=${page}&api_key=${env.USDA_API_KEY || 'DEMO_KEY'}`;

    const [offResult, usdaResult] = await Promise.allSettled([
      fetch(offUrl).then((r) => {
        if (!r.ok)
          throw new Error(`Open Food Facts search failed: ${r.statusText}`);
        return r.json();
      }),
      fetch(usdaUrl).then((r) => {
        if (!r.ok) throw new Error(`USDA search failed: ${r.statusText}`);
        return r.json();
      }),
    ]);

    interface SearchResultItem {
      _id: string;
      name: string;
      brand?: string;
      barcode?: string;
      servingSize: number;
      servingUnit: string;
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
        sugar?: number;
        sodium?: number;
      };
      imageUrl?: string;
      source: string;
      isApproved: boolean;
    }

    const results: SearchResultItem[] = [];
    const seenNames = new Set<string>();

    // Parse Open Food Facts results
    if (offResult.status === 'fulfilled' && offResult.value.products) {
      for (const prod of offResult.value.products) {
        try {
          const parsed = parseOpenFoodFacts(prod);
          const item = {
            _id: `off:${parsed.barcode}`,
            ...parsed,
          };
          const nameKey = `${item.name.toLowerCase()}:${(item.brand || '').toLowerCase()}`;
          if (!seenNames.has(nameKey)) {
            seenNames.add(nameKey);
            results.push(item);
          }
        } catch (e) {
          logger.warn('Failed to parse Open Food Facts product', {
            product: prod.code,
            error: e instanceof Error ? e.message : e,
          });
        }
      }
    } else if (offResult.status === 'rejected') {
      logger.error('Open Food Facts API error:', { error: offResult.reason });
    }

    // Parse USDA results
    if (usdaResult.status === 'fulfilled' && usdaResult.value.foods) {
      for (const food of usdaResult.value.foods) {
        try {
          const parsed = parseUSDAFood(food);
          const item = {
            _id: `usda:${food.fdcId}`,
            ...parsed,
          };
          const nameKey = `${item.name.toLowerCase()}:${(item.brand || '').toLowerCase()}`;
          if (!seenNames.has(nameKey)) {
            seenNames.add(nameKey);
            results.push(item);
          }
        } catch (e) {
          logger.warn('Failed to parse USDA food', {
            fdcId: food.fdcId,
            error: e instanceof Error ? e.message : e,
          });
        }
      }
    } else if (usdaResult.status === 'rejected') {
      logger.error('USDA API error:', { error: usdaResult.reason });
    }

    // Slice combined results to the limit requested
    const finalResults = results.slice(0, limit);

    const responseBody = {
      results: finalResults,
      count: finalResults.length,
      page,
      limit,
    };

    // 4. Save to Redis cache
    await redis.setex(cacheKey, SEARCH_CACHE_TTL, JSON.stringify(responseBody));

    res.status(200).json(responseBody);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/food/barcode/:code
 * Look up product by EAN/UPC barcode. Checks DB first, then Redis, then Open Food Facts API.
 */
export async function lookupBarcode(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Validate barcode parameter
    const parsedParams = barcodeSchema.safeParse(req.params);
    if (!parsedParams.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid barcode parameter',
          details: parsedParams.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { code } = parsedParams.data;

    // 2. Check local database first
    const localFood = await FoodItem.findOne({ barcode: code });
    if (localFood) {
      logger.debug(`Local database hit for barcode: ${code}`);
      res.status(200).json({ product: localFood });
      return;
    }

    // 3. Check Redis cache
    const cacheKey = `gf_barcode:${code}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      logger.debug(`Redis cache hit for barcode lookup: ${code}`);
      res.status(200).json({ product: JSON.parse(cachedData) });
      return;
    }

    logger.debug(
      `Redis cache miss for barcode lookup: ${code}. Fetching Open Food Facts...`,
    );

    // 4. Fetch from Open Food Facts Barcode API
    const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,brands,image_front_url,nutriments,serving_quantity,serving_size`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Product with barcode ${code} not found`,
          },
        });
        return;
      }
      throw new Error(
        `Open Food Facts API request failed: ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (!data.product || data.status === 0) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Product with barcode ${code} not found`,
        },
      });
      return;
    }

    const parsed = parseOpenFoodFacts(data.product);
    const responseProduct = {
      _id: `off:${parsed.barcode}`,
      ...parsed,
    };

    // 5. Cache in Redis
    await redis.setex(
      cacheKey,
      BARCODE_CACHE_TTL,
      JSON.stringify(responseProduct),
    );

    res.status(200).json({ product: responseProduct });
  } catch (err) {
    next(err);
  }
}

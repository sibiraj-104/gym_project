// ============================================================
// GymFuel — Gemini AI Client
// Uses Google Gemini 2.0 Flash to analyze meal images and estimate
// nutritional contents with a fallback error for non-food items.
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface GeminiNutritionResponse {
  name: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  confidence: number;
  error?: string;
}

// Check if Gemini API key is configured
const apiKey = env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Analyzes a food image URL (fetches the image and passes base64 inlineData to Gemini).
 * Returns estimated nutrition details or throws an error.
 */
export async function analyzeFoodImage(
  imageUrl: string,
): Promise<GeminiNutritionResponse> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  logger.debug(`Fetching image data from ${imageUrl} for Gemini analysis...`);

  // Fetch the image to get buffer and mimetype
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to fetch image from Cloudinary: ${imageResponse.statusText}`,
    );
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Analyze this food image.
Your task is to identify the food items in the image and estimate their total nutritional contents.

If the image is NOT food or does not contain any food, you MUST return an error payload matching:
{
  "error": "Not a food item"
}

If the image contains food, estimate:
1. A concise descriptive name of the food (e.g. "Grilled chicken breast with broccoli").
2. The total estimated nutrition contents (calories in kcal, protein in grams, carbs in grams, fat in grams, fiber in grams, sugar in grams, sodium in mg).
3. A confidence score between 0.0 and 1.0 representing your estimation confidence.

Your output must be a valid JSON object matching the following structure:
{
  "name": string,
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  },
  "confidence": number,
  "error": string (optional, only if not food)
}`;

  logger.debug('Sending food image to Gemini 2.0 Flash...');

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    },
  ]);

  const textResponse = result.response.text();
  logger.debug('Received response from Gemini:', textResponse);

  try {
    const json = JSON.parse(textResponse) as GeminiNutritionResponse;
    return json;
  } catch (err) {
    logger.error('Failed to parse Gemini response as JSON:', {
      response: textResponse,
      error: err,
    });
    throw new Error('Gemini returned an invalid response format.');
  }
}

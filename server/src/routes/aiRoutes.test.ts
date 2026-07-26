import request from 'supertest';
import app from '../server';
import { buildAICoachPrompt } from '../controllers/aiController';
import { getRedisClient } from '../config/redis';

// Mock Auth Middleware
jest.mock('../middleware/auth', () => ({
  authenticateUser: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.user = { _id: '507f1f77bcf86cd799439011', email: 'test@gymfuel.com' };
    next();
  },
}));

// Mock Mongoose Models for Fast Isolated Unit Testing
jest.mock('../models/AIChatHistory', () => {
  const mockChatDoc = {
    userId: '507f1f77bcf86cd799439011',
    messages: [
      { role: 'user', content: 'Hello', timestamp: new Date() },
      { role: 'model', content: 'Hi there!', timestamp: new Date() },
    ],
    save: jest.fn().mockResolvedValue(true),
  };

  return {
    AIChatHistory: {
      findOne: jest.fn().mockResolvedValue(mockChatDoc),
    },
  };
});

jest.mock('../models/User', () => ({
  User: {
    findById: jest
      .fn()
      .mockResolvedValue({ targetCalories: 2200, targetProtein: 160 }),
  },
}));

jest.mock('../models/MealLog', () => ({
  MealLog: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

jest.mock('../models/WorkoutLog', () => ({
  WorkoutLog: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

describe('AI Coach & Prompt Building Unit Tests', () => {
  it('buildAICoachPrompt formats context-aware prompt correctly', () => {
    const profile = {
      targetCalories: 2500,
      targetProtein: 180,
      targetCarbs: 250,
      targetFat: 70,
    };
    const meals = [
      { name: 'Chicken Rice', totalCalories: 600, totalProtein: 50 },
    ];
    const workouts = [
      { name: 'Chest Day', durationMinutes: 45, totalVolume: 2500 },
    ];

    const prompt = buildAICoachPrompt(
      profile,
      meals,
      workouts,
      'How can I optimize recovery?',
    );

    expect(prompt).toContain('Target Calories: 2500 kcal');
    expect(prompt).toContain('Chicken Rice: 600 kcal');
    expect(prompt).toContain('Chest Day: 45 mins');
    expect(prompt).toContain('How can I optimize recovery?');
  });

  it('POST /api/ai/chat validates missing message parameter', async () => {
    const res = await request(app).post('/api/ai/chat').send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Message content is required');
  });

  it('POST /api/ai/chat generates AI response and saves history', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'What should I eat post workout?' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(res.body.chatHistory).toBeDefined();
  });

  it('GET /api/ai/chat/history retrieves message history array', async () => {
    const res = await request(app).get('/api/ai/chat/history');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('POST /api/ai/chat enforces rate limiting (10 requests/hr max)', async () => {
    const redis = getRedisClient();
    const rateLimitKey = 'ratelimit:ai_chat:507f1f77bcf86cd799439011';

    // Simulate 10 requests already made
    await redis.set(rateLimitKey, '10');

    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'Should I do cardio?' });

    expect(res.status).toBe(429);
    expect(res.body.message).toContain('Rate limit exceeded');

    // Clean up
    await redis.del(rateLimitKey);
  });
});

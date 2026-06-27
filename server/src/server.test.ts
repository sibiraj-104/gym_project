import request from 'supertest';
import app from './server';

describe('Server Integration Tests', () => {
  // Test 1: Health check endpoint
  it('GET /api/system/health returns 200 OK and status ok', async () => {
    const res = await request(app).get('/api/system/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  // Test 2: Onboarding validation with valid data
  it('PUT /api/user/onboarding returns 200 OK for valid inputs', async () => {
    const payload = {
      age: 25,
      weight: 75,
      height: 180,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'build_muscle',
    };

    const res = await request(app).put('/api/user/onboarding').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Onboarding completed successfully');
    expect(res.body.data.goal).toBe('build_muscle');
  });

  // Test 3: Onboarding validation with invalid data
  it('PUT /api/user/onboarding returns 400 Bad Request for invalid inputs', async () => {
    const payload = {
      age: 5, // invalid (minimum is 10)
      weight: 75,
      height: 180,
      goal: 'invalid_goal', // invalid enum
    };

    const res = await request(app).put('/api/user/onboarding').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toHaveLength(4); // age, gender, activityLevel, goal
  });
});

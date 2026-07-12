import request from 'supertest';
import app from '../server';

describe('Calculator Routes Integration Tests', () => {
  // ─── GET /api/calculator/bmi ───────────────────────────────────────────────
  describe('GET /api/calculator/bmi', () => {
    it('returns 200 OK and correct BMI result for valid input', async () => {
      const res = await request(app)
        .get('/api/calculator/bmi')
        .query({ weight: 70, height: 175 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        bmi: 22.9,
        classification: 'Normal',
      });
    });

    it('returns 400 Bad Request if parameters are missing', async () => {
      const res = await request(app)
        .get('/api/calculator/bmi')
        .query({ weight: 70 }); // missing height

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 Bad Request if parameters are out of bounds', async () => {
      const res = await request(app)
        .get('/api/calculator/bmi')
        .query({ weight: -10, height: 175 }); // weight out of range

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── GET /api/calculator/tdee ──────────────────────────────────────────────
  describe('GET /api/calculator/tdee', () => {
    it('returns 200 OK and TDEE + macro targets for valid input', async () => {
      const res = await request(app).get('/api/calculator/tdee').query({
        weight: 70,
        height: 175,
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'build_muscle',
      });

      expect(res.status).toBe(200);
      expect(res.body.tdee).toBe(2594);
      expect(res.body.targets).toBeDefined();
      expect(res.body.targets.targetCalories).toBe(2894); // TDEE (2594) + 300 surplus for build_muscle
      expect(res.body.targets.targetProtein).toBe(140); // 70kg * 2.0g/kg
    });

    it('returns 400 Bad Request if parameters are invalid', async () => {
      const res = await request(app).get('/api/calculator/tdee').query({
        weight: 70,
        height: 175,
        age: 25,
        gender: 'invalid_gender',
        activityLevel: 'moderate',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── GET /api/calculator/protein ───────────────────────────────────────────
  describe('GET /api/calculator/protein', () => {
    it('returns 200 OK and protein targets for valid input', async () => {
      const res = await request(app)
        .get('/api/calculator/protein')
        .query({ weight: 70, goal: 'build_muscle' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        min: 140,
        max: 168,
      });
    });

    it('returns 400 Bad Request if goal is invalid', async () => {
      const res = await request(app)
        .get('/api/calculator/protein')
        .query({ weight: 70, goal: 'invalid_goal' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── GET /api/calculator/1rm ───────────────────────────────────────────────
  describe('GET /api/calculator/1rm', () => {
    it('returns 200 OK and estimated 1-Rep Max for valid input', async () => {
      const res = await request(app)
        .get('/api/calculator/1rm')
        .query({ weight: 100, reps: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        oneRepMax: 117,
      });
    });

    it('returns 400 Bad Request if reps exceed bounds', async () => {
      const res = await request(app)
        .get('/api/calculator/1rm')
        .query({ weight: 100, reps: 50 }); // max is 30

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

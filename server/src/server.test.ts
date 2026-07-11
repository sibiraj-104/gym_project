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
});

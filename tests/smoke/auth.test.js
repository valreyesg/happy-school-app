const request = require('supertest');
const app = require('../../backend/src/app');

describe('POST /api/auth/login', () => {
  it('returns 401 with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns accessToken and refreshToken on valid login', async () => {
    const email = process.env.SMOKE_TEST_EMAIL;
    const password = process.env.SMOKE_TEST_PASSWORD;
    if (!email || !password) {
      console.warn('SMOKE_TEST_EMAIL/PASSWORD not set — skipping valid login test');
      return;
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('usuario');
  });
});

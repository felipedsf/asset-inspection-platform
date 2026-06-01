process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const { db } = require('../db/database');
const seed = require('../db/seed');

beforeAll(async () => {
  // Re-seed the test database
  await seed();
});

afterAll((done) => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err.message);
    done();
  });
});

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should authenticate an admin and return a token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@platform.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.email).toBe('admin@platform.com');
    });

    it('should authenticate an inspector and return a token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inspector@platform.com',
          password: 'inspector123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('inspector');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@platform.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@platform.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info for authenticated requests', async () => {
      // First login to get a token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@platform.com',
          password: 'admin123'
        });

      const token = loginRes.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('admin@platform.com');
      expect(response.body.role).toBe('admin');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');
      expect(response.status).toBe(403);
    });
  });
});

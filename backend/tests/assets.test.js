process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const { db } = require('../db/database');
const seed = require('../db/seed');

let adminToken = '';
let inspectorToken = '';

beforeAll(async () => {
  await seed();

  // Login as admin
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@platform.com', password: 'admin123' });
  adminToken = adminLogin.body.token;

  // Login as inspector
  const inspectorLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'inspector@platform.com', password: 'inspector123' });
  inspectorToken = inspectorLogin.body.token;
});

afterAll((done) => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err.message);
    done();
  });
});

describe('Assets API', () => {
  describe('GET /api/assets', () => {
    it('should list all assets for authenticated users', async () => {
      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${inspectorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('code');
    });

    it('should deny access if unauthorized', async () => {
      const response = await request(app).get('/api/assets');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/assets/search', () => {
    it('should return matching assets based on search query', async () => {
      const response = await request(app)
        .get('/api/assets/search?q=Turbine')
        .set('Authorization', `Bearer ${inspectorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.some(a => a.code === 'WT-001')).toBe(true);
    });
  });

  describe('POST /api/assets', () => {
    const newAsset = {
      name: 'Hydro Electric Dam',
      code: 'HE-005',
      type: 'hydro',
      status: 'active'
    };

    it('should allow admins to create assets', async () => {
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAsset);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe('HE-005');
    });

    it('should prevent inspectors from creating assets', async () => {
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send(newAsset);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/assets/:id', () => {
    it('should allow admins to update assets', async () => {
      const response = await request(app)
        .put('/api/assets/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Wind Turbine Alpha Updated',
          code: 'WT-001',
          type: 'turbine',
          status: 'maintenance'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Wind Turbine Alpha Updated');
      expect(response.body.status).toBe('maintenance');
    });

    it('should prevent inspectors from updating assets', async () => {
      const response = await request(app)
        .put('/api/assets/1')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          name: 'Wind Turbine Alpha Updated',
          code: 'WT-001',
          type: 'turbine',
          status: 'maintenance'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('should prevent inspectors from deleting assets', async () => {
      const response = await request(app)
        .delete('/api/assets/2')
        .set('Authorization', `Bearer ${inspectorToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admins to delete assets', async () => {
      const response = await request(app)
        .delete('/api/assets/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});

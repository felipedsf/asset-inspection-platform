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

describe('Inspections API', () => {
  describe('GET /api/inspections', () => {
    it('should list all inspections with details', async () => {
      const response = await request(app)
        .get('/api/inspections')
        .set('Authorization', `Bearer ${inspectorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('asset_name');
      expect(response.body[0]).toHaveProperty('inspector_name');
    });
  });

  describe('POST /api/inspections', () => {
    it('should allow an inspector to create a draft inspection', async () => {
      const response = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          asset_id: 1,
          findings: 'Drone inspection of solar panel array. Visually clean.',
          recommendations: 'No actions required.'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('draft');
      expect(response.body.findings).toContain('Drone inspection');
    });

    it('should return 400 if asset_id or findings are missing', async () => {
      const response = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${inspectorToken}`)
        .send({
          findings: 'Incomplete'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/inspections/:id', () => {
    it('should retrieve a single inspection with details', async () => {
      const response = await request(app)
        .get('/api/inspections/1')
        .set('Authorization', `Bearer ${inspectorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body).toHaveProperty('asset_name');
      expect(response.body.asset_code).toBe('WT-001');
    });
  });

  // Note for students: Write tests below to reproduce and verify the fixes for:
  // - Bug 3: Race condition during concurrent file uploads
  // - Bug 5: Business logic bypass allowing editing approved inspections
});

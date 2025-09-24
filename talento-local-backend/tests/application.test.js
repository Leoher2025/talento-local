// src/tests/application.test.js
const request = require('supertest');
const app = require('../app');
const { query } = require('../config/database');
const jwt = require('jsonwebtoken');

describe('Sistema de Aplicaciones', () => {
  let workerToken;
  let clientToken;
  let jobId;
  let applicationId;
  let workerId = 1;
  let clientId = 2;

  beforeAll(async () => {
    // Limpiar datos de prueba existentes
    await query('DELETE FROM applications WHERE worker_id IN ($1, $2)', [workerId, 999]);
    await query('DELETE FROM jobs WHERE client_id = $1', [clientId]);
    
    // Generar tokens de prueba
    workerToken = jwt.sign(
      { id: workerId, email: 'worker@test.com', role: 'worker' },
      process.env.JWT_SECRET
    );
    
    clientToken = jwt.sign(
      { id: clientId, email: 'client@test.com', role: 'client' },
      process.env.JWT_SECRET
    );

    // Crear un trabajo de prueba
    const jobResult = await query(
      `INSERT INTO jobs (title, description, budget, location, category_id, client_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['Plomería urgente', 'Reparar fuga en baño', 150.00, 'Zona 10', 1, clientId, 'active']
    );
    jobId = jobResult.rows[0].id;
  });

  afterAll(async () => {
    // Limpiar después de las pruebas
    await query('DELETE FROM applications WHERE job_id = $1', [jobId]);
    await query('DELETE FROM jobs WHERE id = $1', [jobId]);
  });

  describe('POST /api/applications/apply', () => {
    test('Debería permitir a un trabajador aplicar a un trabajo', async () => {
      const response = await request(app)
        .post('/api/applications/apply')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          jobId: jobId,
          message: 'Tengo 5 años de experiencia en plomería, puedo resolver el problema rápidamente',
          proposedBudget: 140.00
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      applicationId = response.body.data.id;
    });

    test('No debería permitir aplicar dos veces al mismo trabajo', async () => {
      const response = await request(app)
        .post('/api/applications/apply')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          jobId: jobId,
          message: 'Segunda aplicación al mismo trabajo',
          proposedBudget: 130.00
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Ya has aplicado a este trabajo');
    });

    test('No debería permitir a un cliente aplicar a trabajos', async () => {
      const response = await request(app)
        .post('/api/applications/apply')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          jobId: jobId,
          message: 'Intento de aplicación como cliente',
          proposedBudget: 150.00
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('Debería validar el mensaje mínimo', async () => {
      const response = await request(app)
        .post('/api/applications/apply')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          jobId: jobId,
          message: 'Mensaje corto',
          proposedBudget: 150.00
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/applications/my-applications', () => {
    test('Trabajador debería poder ver sus aplicaciones', async () => {
      const response = await request(app)
        .get('/api/applications/my-applications')
        .set('Authorization', `Bearer ${workerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Debería poder filtrar por estado', async () => {
      const response = await request(app)
        .get('/api/applications/my-applications?status=pending')
        .set('Authorization', `Bearer ${workerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach(app => {
        expect(app.status).toBe('pending');
      });
    });
  });

  describe('GET /api/applications/job/:jobId', () => {
    test('Cliente debería poder ver aplicaciones de su trabajo', async () => {
      const response = await request(app)
        .get(`/api/applications/job/${jobId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Cliente no debería ver aplicaciones de trabajos ajenos', async () => {
      const response = await request(app)
        .get('/api/applications/job/99999')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/applications/:applicationId/accept', () => {
    test('Cliente debería poder aceptar una aplicación', async () => {
      const response = await request(app)
        .patch(`/api/applications/${applicationId}/accept`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('accepted');
    });

    test('No debería poder aceptar aplicación ajena', async () => {
      const response = await request(app)
        .patch('/api/applications/99999/accept')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/applications/stats', () => {
    test('Debería obtener estadísticas del trabajador', async () => {
      const response = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${workerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total_applications');
      expect(response.body.data).toHaveProperty('success_rate');
    });

    test('Debería obtener estadísticas del cliente', async () => {
      const response = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total_applications');
      expect(response.body.data).toHaveProperty('pending_applications');
    });
  });
});
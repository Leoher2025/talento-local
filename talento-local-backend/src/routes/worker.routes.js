// src/routes/worker.routes.js
// Rutas para búsqueda de trabajadores

const express = require('express');
const router = express.Router();
const WorkerController = require('../controllers/worker.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// GET /api/workers/search - Buscar trabajadores (solo clientes)
router.get(
  '/search',
  authenticate,
  authorize('client'),
  WorkerController.searchWorkers
);

// GET /api/workers/:workerId - Obtener perfil de trabajador
router.get(
  '/:workerId',
  authenticate,
  WorkerController.getWorkerProfile
);

module.exports = router;
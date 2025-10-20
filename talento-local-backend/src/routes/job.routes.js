//- Definición de rutas para trabajos
const express = require('express');
const router = express.Router();
const JobController = require('../controllers/job.controller');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const { validateCreateJob, validateUpdateJob, validateJobFilters } = require('../middlewares/job.validation.middleware');

// ============================
// RUTAS PÚBLICAS
// ============================

// GET /api/jobs/categories - Obtener todas las categorías
router.get('/categories', JobController.getCategories);

// GET /api/jobs/locations - Obtener ubicaciones disponibles
router.get('/locations', JobController.getLocations);

// GET /api/jobs/budget-ranges - Obtener rangos de presupuesto
router.get('/budget-ranges', JobController.getBudgetRanges);

// GET /api/jobs/search-stats - Obtener estadísticas
router.get('/search-stats', JobController.getSearchStats);

// GET /api/jobs - Obtener lista de trabajos activos (con filtros opcionales)
router.get(
  '/',
  optionalAuth, // Autenticación opcional para personalizar resultados
  validateJobFilters,
  JobController.getAll
);

// GET /api/jobs/:id - Obtener detalle de un trabajo
router.get(
  '/:id',
  optionalAuth,
  JobController.getById
);

// ============================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// ============================

// POST /api/jobs - Crear nuevo trabajo (solo clientes)
router.post(
  '/',
  authenticate,
  authorize('client'),
  validateCreateJob,
  JobController.create
);

// GET /api/jobs/my/all - Obtener mis trabajos publicados
router.get(
  '/my/all',
  authenticate,
  JobController.getMyJobs
);

// PUT /api/jobs/:id - Actualizar trabajo (solo el dueño)
router.put(
  '/:id',
  authenticate,
  authorize('client'),
  validateUpdateJob,
  JobController.update
);

// GET /api/jobs/my/assigned - Obtener trabajos asignados a mí (TRABAJADORES)
router.get(
  '/my/assigned',
  authenticate,
  authorize('worker'),
  JobController.getWorkerJobs
);

// PATCH /api/jobs/:id/status - Cambiar estado del trabajo
router.patch(
  '/:jobId/status',
  authenticate,
  JobController.updateJobStatus
);

// DELETE /api/jobs/:id - Eliminar trabajo (solo el dueño)
router.delete(
  '/:id',
  authenticate,
  authorize('client'),
  JobController.delete
);

module.exports = router;
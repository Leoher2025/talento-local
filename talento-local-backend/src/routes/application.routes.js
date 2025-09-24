// src/routes/application.routes.js
// Definición de rutas para aplicaciones a trabajos
const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/application.controller');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const { 
  validateCreateApplication, 
  validateApplicationStatus,
  validateApplicationFilters,
  validateCheckApplication
} = require('../middlewares/application.validation.middleware');

// ============================
// RUTAS PROTEGIDAS - TRABAJADOR
// ============================

// POST /api/applications - Aplicar a un trabajo (solo trabajadores)
router.post(
  '/',
  authenticate,
  authorize('worker'),
  validateCreateApplication,
  ApplicationController.create
);

// GET /api/applications/my - Obtener mis aplicaciones como trabajador
router.get(
  '/my',
  authenticate,
  authorize('worker'),
  validateApplicationFilters,
  ApplicationController.getMyApplications
);

// GET /api/applications/check/:jobId - Verificar si ya aplicó
router.get(
  '/check/:jobId',
  authenticate,
  authorize('worker'),
  validateCheckApplication,
  ApplicationController.checkIfApplied
);

// PATCH /api/applications/:id/cancel - Cancelar mi aplicación
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('worker'),
  ApplicationController.cancelApplication
);

// ============================
// RUTAS PROTEGIDAS - CLIENTE
// ============================

// GET /api/applications/job/:jobId - Obtener aplicaciones de mi trabajo
router.get(
  '/job/:jobId',
  authenticate,
  authorize('client'),
  ApplicationController.getJobApplications
);

// PATCH /api/applications/:id/accept - Aceptar aplicación
router.patch(
  '/:id/accept',
  authenticate,
  authorize('client'),
  validateApplicationStatus,
  ApplicationController.acceptApplication
);

// PATCH /api/applications/:id/reject - Rechazar aplicación
router.patch(
  '/:id/reject',
  authenticate,
  authorize('client'),
  validateApplicationStatus,
  ApplicationController.rejectApplication
);

// ============================
// RUTAS COMUNES (AMBOS ROLES)
// ============================

// GET /api/applications/stats - Obtener estadísticas
router.get(
  '/stats',
  authenticate,
  ApplicationController.getStats
);

// GET /api/applications/:id - Obtener detalle de aplicación
router.get(
  '/:id',
  authenticate,
  ApplicationController.getById
);

module.exports = router;
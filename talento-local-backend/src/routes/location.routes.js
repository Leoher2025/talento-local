// src/routes/location.routes.js
// Rutas para funcionalidades de geolocalización

const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/location.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// PUT /api/location - Actualizar ubicación del usuario
router.put('/', authenticate, LocationController.updateLocation);

// GET /api/location/workers/nearby - Buscar trabajadores cercanos
router.get('/workers/nearby', authenticate, LocationController.getNearbyWorkers);

// GET /api/location/jobs/nearby - Buscar ofertas cercanas
router.get('/jobs/nearby', authenticate, LocationController.getNearbyJobs);

// GET /api/location/reverse-geocode - Obtener dirección de coordenadas
router.get('/reverse-geocode', authenticate, LocationController.reverseGeocode);

module.exports = router;
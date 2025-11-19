// src/routes/favorite.routes.js
// Rutas para gestión de favoritos

const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favorite.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/favorites - Agregar a favoritos
router.post('/', FavoriteController.addFavorite);

// POST /api/favorites/toggle - Toggle favorito (agregar/quitar)
router.post('/toggle', FavoriteController.toggleFavorite);

// DELETE /api/favorites/:favoriteType/:favoriteId - Eliminar de favoritos
router.delete('/:favoriteType/:favoriteId', FavoriteController.removeFavorite);

// GET /api/favorites/check/:favoriteType/:favoriteId - Verificar si es favorito
router.get('/check/:favoriteType/:favoriteId', FavoriteController.checkFavorite);

// GET /api/favorites - Obtener todos los favoritos
router.get('/', FavoriteController.getAllFavorites);

// GET /api/favorites/workers - Obtener trabajadores favoritos
router.get('/workers', FavoriteController.getFavoriteWorkers);

// GET /api/favorites/jobs - Obtener trabajos favoritos
router.get('/jobs', FavoriteController.getFavoriteJobs);

// GET /api/favorites/count - Obtener contador
router.get('/count', FavoriteController.getFavoritesCount);

// PATCH /api/favorites/:favoriteType/:favoriteId/notes - Actualizar notas
router.patch('/:favoriteType/:favoriteId/notes', FavoriteController.updateNotes);

module.exports = router;
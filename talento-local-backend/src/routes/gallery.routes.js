// src/routes/gallery.routes.js
// Rutas para gestión de galería de trabajos

const express = require('express');
const router = express.Router();
const GalleryController = require('../controllers/gallery.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadGalleryPhoto, handleMulterError } = require('../middlewares/upload.middleware');

// ============================
// RUTAS PÚBLICAS
// ============================

// GET /api/gallery/worker/:workerId - Ver galería de un trabajador (público)
router.get(
  '/worker/:workerId',
  GalleryController.getGallery
);

// ============================
// RUTAS PROTEGIDAS (SOLO TRABAJADORES)
// ============================

// GET /api/gallery/my - Obtener mi galería
router.get(
  '/my',
  authenticate,
  authorize('worker'),
  GalleryController.getMyGallery
);

// POST /api/gallery - Subir foto a galería
router.post(
  '/',
  authenticate,
  authorize('worker'),
  uploadGalleryPhoto.single('photo'),
  handleMulterError,
  GalleryController.uploadPhoto
);

// PUT /api/gallery/:photoId - Actualizar foto
router.put(
  '/:photoId',
  authenticate,
  authorize('worker'),
  GalleryController.updatePhoto
);

// DELETE /api/gallery/:photoId - Eliminar foto
router.delete(
  '/:photoId',
  authenticate,
  authorize('worker'),
  GalleryController.deletePhoto
);

// PATCH /api/gallery/:photoId/featured - Marcar como destacada
router.patch(
  '/:photoId/featured',
  authenticate,
  authorize('worker'),
  GalleryController.setFeatured
);

// PUT /api/gallery/reorder - Reordenar fotos
router.put(
  '/reorder',
  authenticate,
  authorize('worker'),
  GalleryController.reorderPhotos
);

module.exports = router;
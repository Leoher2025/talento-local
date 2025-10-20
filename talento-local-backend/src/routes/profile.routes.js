// src/routes/profile.routes.js
// Rutas para manejo de perfiles

const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadProfilePicture, uploadGalleryPhoto } = require('../middlewares/upload.middleware');

// ============================
// RUTAS DE PERFIL
// ============================

// Obtener mi perfil (requiere autenticación)
router.get(
  '/me',
  authenticate,
  ProfileController.getMyProfile
);

// Actualizar mi perfil (requiere autenticación)
router.put(
  '/me',
  authenticate,
  ProfileController.updateProfile
);

// GET /api/profile/categories - Obtener categorías del trabajador
router.get('/categories', authenticate, ProfileController.getWorkerCategories);

// PUT /api/profile/categories - Actualizar categorías del trabajador
router.put('/categories', authenticate, ProfileController.updateWorkerCategories);

// Obtener perfil por ID (público con restricciones)
router.get(
  '/:userId',
  authenticate,
  ProfileController.getProfileById
);

// ============================
// FOTO DE PERFIL
// ============================

// Subir foto de perfil
router.post(
  '/upload-picture',
  authenticate,
  uploadProfilePicture.single('profilePicture'),
  ProfileController.uploadProfilePicture
);

// Eliminar foto de perfil
router.delete(
  '/delete-picture',
  authenticate,
  ProfileController.deleteProfilePicture
);

// ============================
// GALERÍA DE TRABAJOS
// ============================

// Obtener galería de un trabajador
router.get(
  '/:userId/gallery',
  authenticate,
  ProfileController.getGallery
);

// Subir foto a galería
router.post(
  '/gallery',
  authenticate,
  uploadGalleryPhoto.single('photo'),
  ProfileController.uploadGalleryPhoto
);

// Eliminar foto de galería
router.delete(
  '/gallery/:photoId',
  authenticate,
  ProfileController.deleteGalleryPhoto
);

// ============================
// ESTADÍSTICAS
// ============================

// Obtener estadísticas de usuario
router.get(
  '/:userId/stats',
  authenticate,
  ProfileController.getStats
);

// ============================
// CONFIGURACIÓN
// ============================

// Actualizar configuración de notificaciones y privacidad
router.put(
  '/preferences/settings',
  authenticate,
  ProfileController.updateSettings
);

// Actualizar configuración de notificaciones
router.put(
  '/preferences/notifications',
  authenticate,
  (req, res, next) => {
    req.body = { notifications: req.body };
    next();
  },
  ProfileController.updateSettings
);

// Actualizar configuración de privacidad
router.put(
  '/preferences/privacy',
  authenticate,
  (req, res, next) => {
    req.body = { privacy: req.body };
    next();
  },
  ProfileController.updateSettings
);

// ============================
// TELÉFONO
// ============================

// Actualizar teléfono
router.put(
  '/phone',
  authenticate,
  ProfileController.updatePhone
);

module.exports = router;
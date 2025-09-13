// - Archivo principal de rutas
// Centraliza y organiza todas las rutas de la API

const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth.routes');
// const userRoutes = require('./user.routes'); // Implementaremos después
// const profileRoutes = require('./profile.routes'); // Implementaremos después
// const jobRoutes = require('./job.routes'); // Implementaremos después
// const categoryRoutes = require('./category.routes'); // Implementaremos después

// ============================
// RUTAS DE LA API
// ============================

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de usuarios (próximo módulo)
// router.use('/users', userRoutes);

// Rutas de perfiles (próximo módulo)
// router.use('/profiles', profileRoutes);

// Rutas de trabajos (próximo módulo)
// router.use('/jobs', jobRoutes);

// Rutas de categorías (próximo módulo)
// router.use('/categories', categoryRoutes);

// ============================
// DOCUMENTACIÓN DE LA API
// ============================
router.get('/', (req, res) => {
  res.json({
    message: 'API de Talento Local v1.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        verifyEmail: 'GET /api/auth/verify-email/:token',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password/:token',
        changePassword: 'POST /api/auth/change-password',
        resendVerification: 'POST /api/auth/resend-verification',
        me: 'GET /api/auth/me',
        deleteAccount: 'DELETE /api/auth/account'
      },
      // Agregar más endpoints conforme los implementemos
    }
  });
});

module.exports = router;
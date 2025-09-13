// src/routes/auth.routes.js - Definición de rutas de autenticación
// Endpoints para registro, login, verificación, etc.

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  sanitizeInput
} = require('../middlewares/validation.middleware');

// ============================
// RUTAS PÚBLICAS
// ============================

// POST /api/auth/register - Registro de nuevo usuario
router.post(
  '/register',
  sanitizeInput,
  validateRegister,
  AuthController.register
);

// POST /api/auth/login - Inicio de sesión
router.post(
  '/login',
  sanitizeInput,
  validateLogin,
  AuthController.login
);

// POST /api/auth/refresh - Renovar access token
router.post(
  '/refresh',
  AuthController.refreshToken
);

// POST /api/auth/logout - Cerrar sesión
router.post(
  '/logout',
  AuthController.logout
);

// GET /api/auth/verify-email/:token - Verificar email
router.get(
  '/verify-email/:token',
  AuthController.verifyEmail
);

// POST /api/auth/forgot-password - Solicitar restablecimiento de contraseña
router.post(
  '/forgot-password',
  sanitizeInput,
  validateForgotPassword,
  AuthController.forgotPassword
);

// POST /api/auth/reset-password/:token - Restablecer contraseña
router.post(
  '/reset-password/:token',
  sanitizeInput,
  validateResetPassword,
  AuthController.resetPassword
);

// ============================
// RUTAS PROTEGIDAS
// ============================

// POST /api/auth/change-password - Cambiar contraseña (usuario autenticado)
router.post(
  '/change-password',
  authenticate,
  sanitizeInput,
  validateChangePassword,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      // Verificar contraseña actual
      const UserModel = require('../models/user.model');
      const user = await UserModel.findById(userId);
      
      // Obtener hash de la contraseña
      const { query } = require('../config/database');
      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      if (!result.rows[0]) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const isValid = await UserModel.verifyPassword(
        currentPassword,
        result.rows[0].password_hash
      );
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }
      
      // Actualizar contraseña
      await UserModel.updatePassword(userId, newPassword);
      
      // Revocar todos los tokens
      const TokenService = require('../services/token.service');
      await TokenService.revokeAllUserTokens(userId);
      
      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente. Por favor, vuelve a iniciar sesión.'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/resend-verification - Reenviar email de verificación
router.post(
  '/resend-verification',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const email = req.user.email;
      
      // Verificar si ya está verificado
      if (req.user.verificationStatus === 'fully_verified' || 
          req.user.verificationStatus === 'email_verified') {
        return res.status(400).json({
          success: false,
          message: 'El email ya está verificado'
        });
      }
      
      // Enviar nuevo email de verificación
      const EmailService = require('../services/email.service');
      await EmailService.sendVerificationEmail(email, userId);
      
      res.json({
        success: true,
        message: 'Email de verificación enviado'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me - Obtener información del usuario actual
router.get(
  '/me',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Obtener información completa del usuario
      const { query } = require('../config/database');
      const userQuery = `
        SELECT 
          u.id, u.email, u.phone, u.role,
          u.verification_status, u.email_verified_at, u.phone_verified_at,
          u.created_at, u.last_login_at,
          p.first_name, p.last_name, p.display_name,
          p.profile_picture_url, p.bio,
          p.city, p.department, p.country,
          p.rating_average, p.total_ratings, p.total_jobs_completed
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `;
      
      const result = await query(userQuery, [userId]);
      
      if (!result.rows[0]) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const userData = result.rows[0];
      
      res.json({
        success: true,
        data: {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          verificationStatus: userData.verification_status,
          emailVerifiedAt: userData.email_verified_at,
          phoneVerifiedAt: userData.phone_verified_at,
          createdAt: userData.created_at,
          lastLoginAt: userData.last_login_at,
          profile: {
            firstName: userData.first_name,
            lastName: userData.last_name,
            displayName: userData.display_name,
            profilePictureUrl: userData.profile_picture_url,
            bio: userData.bio,
            location: {
              city: userData.city,
              department: userData.department,
              country: userData.country
            },
            stats: {
              ratingAverage: parseFloat(userData.rating_average) || 0,
              totalRatings: userData.total_ratings || 0,
              totalJobsCompleted: userData.total_jobs_completed || 0
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/auth/account - Eliminar cuenta (soft delete)
router.delete(
  '/account',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Soft delete del usuario
      const UserModel = require('../models/user.model');
      await UserModel.softDelete(userId);
      
      // Revocar todos los tokens
      const TokenService = require('../services/token.service');
      await TokenService.revokeAllUserTokens(userId);
      
      res.json({
        success: true,
        message: 'Cuenta eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
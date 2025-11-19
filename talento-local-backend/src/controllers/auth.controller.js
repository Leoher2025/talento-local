// - Controlador de Autenticación
// Maneja registro, login, logout y verificación de usuarios

const UserModel = require('../models/user.model');
const TokenService = require('../services/token.service');
const EmailService = require('../services/email.service');
const logger = require('../utils/logger');

class AuthController {
  // ============================
  // REGISTRO DE USUARIO
  // ============================
  static async register(req, res, next) {
    try {
      const { email, phone, password, role, firstName, lastName } = req.body;

      // Verificar si el usuario ya existe
      const userExists = await UserModel.exists(email, phone);
      if (userExists) {
        return res.status(409).json({
          success: false,
          message: 'El email o teléfono ya está registrado'
        });
      }

      // Crear usuario en transacción
      const { transaction } = require('../config/database');
      const newUser = await transaction(async (client) => {
        // 1. Crear usuario
        const userQuery = `
          INSERT INTO users (email, phone, password_hash, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, phone, role, verification_status, created_at
        `;

        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);
        const userResult = await client.query(userQuery, [
          email.toLowerCase(),
          phone,
          passwordHash,
          role
        ]);
        const user = userResult.rows[0];

        // 2. Crear perfil básico
        const profileQuery = `
          INSERT INTO profiles (user_id, first_name, last_name, display_name)
          VALUES ($1, $2, $3, $4)
          RETURNING id, first_name, last_name
        `;

        const displayName = `${firstName} ${lastName}`;
        await client.query(profileQuery, [
          user.id,
          firstName,
          lastName,
          displayName
        ]);

        return user;
      });

      // Generar tokens
      const accessToken = TokenService.generateAccessToken(newUser);
      const refreshToken = await TokenService.generateRefreshToken(newUser.id);

      // Enviar email de verificación (async, no bloqueante)
      EmailService.sendVerificationEmail(newUser.email, newUser.id)
        .catch(err => logger.error('Error enviando email de verificación:', err));

      // Responder al cliente
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            verificationStatus: newUser.verification_status
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

      logger.info(`✅ Nuevo usuario registrado: ${email}`);
    } catch (error) {
      logger.error('Error en registro:', error);
      next(error);
    }
  }

  // ============================
  // LOGIN DE USUARIO
  // ============================
  static async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;

      // Buscar usuario por email
      const user = await UserModel.findByEmail(email);

      // Registrar intento de login
      const loginAttemptQuery = `
        INSERT INTO login_attempts (email, ip_address, user_agent, success)
        VALUES ($1, $2, $3, $4)
      `;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      if (!user) {
        // Registrar intento fallido
        await require('../config/database').query(
          loginAttemptQuery,
          [email, ipAddress, userAgent, false]
        );

        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar si el usuario está activo
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta ha sido desactivada'
        });
      }

      // Verificar si el usuario está baneado
      if (user.is_banned) {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta ha sido suspendida'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        // Registrar intento fallido
        await require('../config/database').query(
          loginAttemptQuery,
          [email, ipAddress, userAgent, false]
        );

        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Registrar intento exitoso
      await require('../config/database').query(
        loginAttemptQuery,
        [email, ipAddress, userAgent, true]
      );

      // Actualizar último login
      await UserModel.updateLastLogin(user.id);

      // Generar tokens
      const accessToken = TokenService.generateAccessToken(user);
      const refreshToken = await TokenService.generateRefreshToken(
        user.id,
        rememberMe ? '30d' : '7d'
      );

      // Obtener perfil del usuario
      const profileQuery = `
        SELECT first_name, last_name, profile_picture_url, bio
        FROM profiles
        WHERE user_id = $1
      `;
      const profileResult = await require('../config/database').query(
        profileQuery,
        [user.id]
      );
      const profile = profileResult.rows[0];

      // Responder con datos del usuario
      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            verificationStatus: user.verification_status,
            profile: profile || null
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

      logger.info(`✅ Usuario logueado: ${email}`);
    } catch (error) {
      logger.error('Error en login:', error);
      next(error);
    }
  }

  // ============================
  // REFRESH TOKEN
  // ============================
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requerido'
        });
      }

      // Verificar y renovar tokens
      const tokens = await TokenService.refreshAccessToken(refreshToken);

      if (!tokens) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido o expirado'
        });
      }

      res.json({
        success: true,
        message: 'Token renovado exitosamente',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      logger.error('Error renovando token:', error);
      next(error);
    }
  }

  // ============================
  // LOGOUT
  // ============================
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id; // Del middleware de autenticación

      // Revocar refresh token si se proporciona
      if (refreshToken) {
        await TokenService.revokeRefreshToken(refreshToken);
      }

      // Revocar todos los tokens del usuario si está autenticado
      if (userId) {
        await TokenService.revokeAllUserTokens(userId);
      }

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });

      logger.info(`✅ Usuario ${userId} cerró sesión`);
    } catch (error) {
      logger.error('Error en logout:', error);
      next(error);
    }
  }

  // ============================
  // VERIFICAR EMAIL
  // ============================
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      // Verificar token
      const verificationQuery = `
        SELECT user_id, expires_at, used_at
        FROM verification_tokens
        WHERE token = $1 AND type = 'email'
      `;

      const result = await require('../config/database').query(
        verificationQuery,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token de verificación inválido'
        });
      }

      const verification = result.rows[0];

      // Verificar si ya fue usado
      if (verification.used_at) {
        return res.status(400).json({
          success: false,
          message: 'Este token ya fue utilizado'
        });
      }

      // Verificar si expiró
      if (new Date(verification.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'El token ha expirado'
        });
      }

      // Marcar email como verificado
      await UserModel.verifyEmail(verification.user_id);

      // Marcar token como usado
      await require('../config/database').query(
        `UPDATE verification_tokens 
         SET used_at = CURRENT_TIMESTAMP 
         WHERE token = $1`,
        [token]
      );

      res.json({
        success: true,
        message: 'Email verificado exitosamente'
      });

      logger.info(`✅ Email verificado para usuario ${verification.user_id}`);
    } catch (error) {
      logger.error('Error verificando email:', error);
      next(error);
    }
  }

  // ============================
  // SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA
  // ============================
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Buscar usuario
      const user = await UserModel.findByEmail(email);

      // Siempre responder con éxito (seguridad)
      res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });

      // Si el usuario existe, enviar email
      if (user) {
        await EmailService.sendPasswordResetEmail(email, user.id);
        logger.info(`📧 Email de restablecimiento enviado a ${email}`);
      }
    } catch (error) {
      logger.error('Error en forgot password:', error);
      next(error);
    }
  }

  // ============================
  // RESTABLECER CONTRASEÑA
  // ============================
  static async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      // Verificar token
      const verificationQuery = `
        SELECT user_id, expires_at, used_at
        FROM verification_tokens
        WHERE token = $1 AND type = 'password_reset'
      `;

      const result = await require('../config/database').query(
        verificationQuery,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido'
        });
      }

      const verification = result.rows[0];

      // Validaciones del token
      if (verification.used_at) {
        return res.status(400).json({
          success: false,
          message: 'Este token ya fue utilizado'
        });
      }

      if (new Date(verification.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'El token ha expirado'
        });
      }

      // Actualizar contraseña
      await UserModel.updatePassword(verification.user_id, newPassword);

      // Marcar token como usado
      await require('../config/database').query(
        `UPDATE verification_tokens 
         SET used_at = CURRENT_TIMESTAMP 
         WHERE token = $1`,
        [token]
      );

      // Revocar todos los refresh tokens del usuario
      await TokenService.revokeAllUserTokens(verification.user_id);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

      logger.info(`✅ Contraseña restablecida para usuario ${verification.user_id}`);
    } catch (error) {
      logger.error('Error restableciendo contraseña:', error);
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const userId = req.user.id;

      const UserModel = require('../models/user.model');
      const ProfileModel = require('../models/profile.model');
      const VerificationModel = require('../models/verification.model');

      const user = await UserModel.findById(userId);
      const profile = await ProfileModel.getByUserId(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // ✅ Obtener estado de verificación
      const verificationStatus = await VerificationModel.getVerificationStatus(userId);

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verification_status: user.verification_status,
          phone_verified: user.phone_verified,
          profile_picture_verified: user.profile_picture_verified,
          is_active: user.is_active,
          created_at: user.created_at,
          profile: profile,
          verification: verificationStatus
        }
      });
    } catch (error) {
      logger.error('Error obteniendo usuario actual:', error);
      next(error);
    }
  }
}

module.exports = AuthController;
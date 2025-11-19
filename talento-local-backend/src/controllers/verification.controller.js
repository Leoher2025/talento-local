// src/controllers/verification.controller.js
// Controlador para verificación de identidad (SMS, Email, Foto)
const VerificationModel = require('../models/verification.model');
const { sendSMS } = require('../config/twilio');
const logger = require('../utils/logger');

class VerificationController {
  // ============================
  // ENVIAR CÓDIGO SMS
  // ============================
  static async sendSMSCode(req, res, next) {
    try {
      const userId = req.user.id;
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono es requerido'
        });
      }

      // Validar formato de teléfono (guatemalteco)
      const phoneRegex = /^(\+502)?[2-7]\d{7}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de teléfono inválido. Usa formato: +502XXXXXXXX o XXXXXXXX'
        });
      }

      // Normalizar teléfono
      const normalizedPhone = phone.startsWith('+502') ? phone : `+502${phone}`;

      // Verificar si el teléfono ya está en uso
      const isInUse = await VerificationModel.isPhoneInUse(normalizedPhone, userId);
      if (isInUse) {
        return res.status(400).json({
          success: false,
          message: 'Este teléfono ya está verificado por otro usuario'
        });
      }

      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Guardar código en BD
      await VerificationModel.createCode(userId, normalizedPhone, code, 'sms');

      // Enviar SMS
      const message = `Tu código de verificación de Talento Local es: ${code}. Expira en 10 minutos.`;
      
      try {
        await sendSMS(normalizedPhone, message);
      } catch (smsError) {
        logger.error('Error enviando SMS:', smsError);
        
        // Si falla el SMS pero estamos en desarrollo, continuar
        if (process.env.NODE_ENV !== 'development') {
          throw new Error('No se pudo enviar el SMS. Intenta más tarde.');
        }
        
        // En desarrollo, mostrar código en consola
        logger.info(`[MODO DEV] Código SMS para ${normalizedPhone}: ${code}`);
      }

      logger.info(`Código SMS enviado a usuario ${userId}: ${normalizedPhone}`);

      res.json({
        success: true,
        message: 'Código enviado exitosamente',
        data: {
          phone: normalizedPhone,
          expiresIn: 600, // segundos
          // SOLO EN DESARROLLO - REMOVER EN PRODUCCIÓN
          ...(process.env.NODE_ENV === 'development' && { code })
        }
      });
    } catch (error) {
      logger.error('Error enviando código SMS:', error);
      next(error);
    }
  }

  // ============================
  // VERIFICAR CÓDIGO SMS
  // ============================
  static async verifySMSCode(req, res, next) {
    try {
      const userId = req.user.id;
      const { code } = req.body;

      if (!code || code.length !== 6) {
        return res.status(400).json({
          success: false,
          message: 'Código inválido'
        });
      }

      // Verificar código
      const verification = await VerificationModel.verifyCode(userId, code, 'sms');

      if (!verification) {
        // Incrementar intentos
        await VerificationModel.incrementAttempts(userId, 'sms');

        return res.status(400).json({
          success: false,
          message: 'Código inválido o expirado'
        });
      }

      // Marcar teléfono como verificado
      await VerificationModel.markPhoneVerified(userId, verification.phone);

      logger.info(`Teléfono verificado para usuario ${userId}`);

      res.json({
        success: true,
        message: 'Teléfono verificado exitosamente',
        data: {
          phone_verified: true
        }
      });
    } catch (error) {
      logger.error('Error verificando código SMS:', error);
      next(error);
    }
  }

  // ============================
  // REENVIAR CÓDIGO
  // ============================
  static async resendCode(req, res, next) {
    try {
      const userId = req.user.id;

      // Obtener código activo
      const activeCode = await VerificationModel.getActiveCode(userId, 'sms');

      if (!activeCode) {
        return res.status(400).json({
          success: false,
          message: 'No hay código activo para reenviar'
        });
      }

      // Verificar que no se reenvíe muy rápido (min 1 minuto)
      const timeSinceCreated = Date.now() - new Date(activeCode.created_at).getTime();
      if (timeSinceCreated < 60000) {
        return res.status(429).json({
          success: false,
          message: 'Debes esperar al menos 1 minuto antes de reenviar el código'
        });
      }

      // Reenviar SMS
      const message = `Tu código de verificación de Talento Local es: ${activeCode.code}. Expira en 10 minutos.`;
      
      try {
        await sendSMS(activeCode.phone, message);
      } catch (smsError) {
        logger.error('Error reenviando SMS:', smsError);
        
        if (process.env.NODE_ENV !== 'development') {
          throw new Error('No se pudo reenviar el SMS. Intenta más tarde.');
        }
        
        logger.info(`[MODO DEV] Código SMS: ${activeCode.code}`);
      }

      logger.info(`Código SMS reenviado a usuario ${userId}`);

      res.json({
        success: true,
        message: 'Código reenviado exitosamente'
      });
    } catch (error) {
      logger.error('Error reenviando código:', error);
      next(error);
    }
  }

  // ============================
  // MARCAR FOTO DE PERFIL VERIFICADA
  // ============================
  static async markProfilePictureVerified(req, res, next) {
    try {
      const userId = req.user.id;

      // Verificar que tenga foto de perfil
      const ProfileModel = require('../models/profile.model');
      const profile = await ProfileModel.getByUserId(userId);

      if (!profile || !profile.profile_picture_url) {
        return res.status(400).json({
          success: false,
          message: 'Debes subir una foto de perfil primero'
        });
      }

      await VerificationModel.markProfilePictureVerified(userId);

      logger.info(`Foto de perfil verificada para usuario ${userId}`);

      res.json({
        success: true,
        message: 'Foto de perfil verificada',
        data: {
          profile_picture_verified: true
        }
      });
    } catch (error) {
      logger.error('Error verificando foto de perfil:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER ESTADO DE VERIFICACIÓN
  // ============================
  static async getStatus(req, res, next) {
    try {
      const userId = req.user.id;

      const status = await VerificationModel.getVerificationStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error obteniendo estado de verificación:', error);
      next(error);
    }
  }
}

module.exports = VerificationController;
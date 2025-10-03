// src/services/notification.service.js
// Servicio para enviar notificaciones push

const admin = require('firebase-admin');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const path = require('path');

// Inicializar Firebase Admin
try {
  const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  logger.info('Firebase Admin inicializado correctamente');
} catch (error) {
  logger.error('Error inicializando Firebase Admin:', error);
}

class NotificationService {

  // ============================
  // GUARDAR TOKEN DE DISPOSITIVO
  // ============================
  static async saveDeviceToken(userId, token, deviceType, deviceName = null) {
    try {
      // Desactivar tokens antiguos del mismo dispositivo
      await query(
        `UPDATE device_tokens 
         SET is_active = false 
         WHERE token = $1`,
        [token]
      );

      // Insertar o actualizar token
      const result = await query(
        `INSERT INTO device_tokens (user_id, token, device_type, device_name, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (token) 
         DO UPDATE SET 
           user_id = EXCLUDED.user_id,
           is_active = true,
           last_used_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, token, deviceType, deviceName]
      );

      logger.info(`Token guardado para usuario ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error guardando token:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR TOKEN
  // ============================
  static async removeDeviceToken(token) {
    try {
      await query(
        `UPDATE device_tokens 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE token = $1`,
        [token]
      );
      logger.info('Token desactivado');
    } catch (error) {
      logger.error('Error eliminando token:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TOKENS DE UN USUARIO
  // ============================
  static async getUserTokens(userId) {
    try {
      const result = await query(
        `SELECT token FROM device_tokens 
         WHERE user_id = $1 AND is_active = true`,
        [userId]
      );
      return result.rows.map(row => row.token);
    } catch (error) {
      logger.error('Error obteniendo tokens:', error);
      throw error;
    }
  }

  // ============================
  // ENVIAR NOTIFICACIÓN CON EXPO
  // ============================
  static async sendNotification(userId, notification) {
    try {
      const { title, body, data, type, relatedId, relatedType } = notification;

      // Obtener tokens del usuario
      const tokens = await this.getUserTokens(userId);

      if (tokens.length === 0) {
        logger.warn(`Usuario ${userId} no tiene tokens activos`);
        return { success: false, message: 'No tokens found' };
      }

      // Preparar mensajes para Expo
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          type,
          ...data
        },
      }));

      // Enviar a Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      logger.info(`Notificación enviada via Expo:`, result);

      // Guardar registro de notificación
      await this.saveNotificationRecord(userId, {
        title,
        body,
        data,
        type,
        relatedId,
        relatedType
      });

      return {
        success: true,
        result
      };
    } catch (error) {
      logger.error('Error enviando notificación:', error);
      throw error;
    }
  }

  // ============================
  // GUARDAR REGISTRO DE NOTIFICACIÓN
  // ============================
  static async saveNotificationRecord(userId, notification) {
    try {
      const { title, body, data, type, relatedId, relatedType } = notification;

      await query(
        `INSERT INTO notifications 
         (user_id, title, body, data, type, related_id, related_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, title, body, JSON.stringify(data), type, relatedId, relatedType]
      );
    } catch (error) {
      logger.error('Error guardando registro de notificación:', error);
    }
  }

  // ============================
  // ELIMINAR TOKENS INVÁLIDOS
  // ============================
  static async removeInvalidTokens(tokens) {
    try {
      if (tokens.length === 0) return;

      await query(
        `UPDATE device_tokens 
         SET is_active = false 
         WHERE token = ANY($1)`,
        [tokens]
      );

      logger.info(`${tokens.length} tokens inválidos desactivados`);
    } catch (error) {
      logger.error('Error eliminando tokens inválidos:', error);
    }
  }

  // ============================
  // OBTENER NOTIFICACIONES DEL USUARIO
  // ============================
  static async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR NOTIFICACIÓN COMO LEÍDA
  // ============================
  static async markAsRead(notificationId, userId) {
    try {
      await query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );
    } catch (error) {
      logger.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR TODAS COMO LEÍDAS
  // ============================
  static async markAllAsRead(userId) {
    try {
      await query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
    } catch (error) {
      logger.error('Error marcando todas como leídas:', error);
      throw error;
    }
  }

  // ============================
  // CONTAR NO LEÍDAS
  // ============================
  static async getUnreadCount(userId) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM notifications
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error contando no leídas:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
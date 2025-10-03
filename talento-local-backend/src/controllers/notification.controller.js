// src/controllers/notification.controller.js
// Controlador para gestión de notificaciones

const NotificationService = require('../services/notification.service');
const logger = require('../utils/logger');

class NotificationController {

  // ============================
  // REGISTRAR TOKEN DE DISPOSITIVO
  // ============================
  static async registerToken(req, res, next) {
    try {
      const userId = req.user.id;
      const { token, deviceType, deviceName } = req.body;

      if (!token || !deviceType) {
        return res.status(400).json({
          success: false,
          message: 'Token y tipo de dispositivo son requeridos'
        });
      }

      const result = await NotificationService.saveDeviceToken(
        userId,
        token,
        deviceType,
        deviceName
      );

      res.json({
        success: true,
        message: 'Token registrado correctamente',
        data: result
      });
    } catch (error) {
      logger.error('Error registrando token:', error);
      next(error);
    }
  }

  // ============================
  // ELIMINAR TOKEN
  // ============================
  static async removeToken(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token es requerido'
        });
      }

      await NotificationService.removeDeviceToken(token);

      res.json({
        success: true,
        message: 'Token eliminado correctamente'
      });
    } catch (error) {
      logger.error('Error eliminando token:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER MIS NOTIFICACIONES
  // ============================
  static async getMyNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const notifications = await NotificationService.getUserNotifications(
        userId,
        limit,
        offset
      );

      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (error) {
      logger.error('Error obteniendo notificaciones:', error);
      next(error);
    }
  }

  // ============================
  // MARCAR COMO LEÍDA
  // ============================
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      await NotificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notificación marcada como leída'
      });
    } catch (error) {
      logger.error('Error marcando como leída:', error);
      next(error);
    }
  }

  // ============================
  // MARCAR TODAS COMO LEÍDAS
  // ============================
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
      });
    } catch (error) {
      logger.error('Error marcando todas como leídas:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER CONTADOR DE NO LEÍDAS
  // ============================
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      const count = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      logger.error('Error obteniendo contador:', error);
      next(error);
    }
  }

  // ============================
  // ENVIAR NOTIFICACIÓN DE PRUEBA (SOLO DESARROLLO)
  // ============================
  static async sendTestNotification(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Esta ruta solo está disponible en desarrollo'
        });
      }

      const userId = req.user.id;

      await NotificationService.sendNotification(userId, {
        title: 'Notificación de Prueba',
        body: 'Esta es una notificación de prueba desde el servidor',
        data: { test: true },
        type: 'test'
      });

      res.json({
        success: true,
        message: 'Notificación de prueba enviada'
      });
    } catch (error) {
      logger.error('Error enviando notificación de prueba:', error);
      next(error);
    }
  }
}

module.exports = NotificationController;
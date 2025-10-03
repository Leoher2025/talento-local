// src/routes/notification.routes.js
// Rutas para notificaciones

const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/notifications/token - Registrar token
router.post('/token', NotificationController.registerToken);

// DELETE /api/notifications/token - Eliminar token
router.delete('/token', NotificationController.removeToken);

// GET /api/notifications - Obtener mis notificaciones
router.get('/', NotificationController.getMyNotifications);

// GET /api/notifications/unread-count - Contador de no leídas
router.get('/unread-count', NotificationController.getUnreadCount);

// PATCH /api/notifications/:notificationId/read - Marcar como leída
router.patch('/:notificationId/read', NotificationController.markAsRead);

// PATCH /api/notifications/read-all - Marcar todas como leídas
router.patch('/read-all', NotificationController.markAllAsRead);

// POST /api/notifications/test - Enviar notificación de prueba (desarrollo)
router.post('/test', NotificationController.sendTestNotification);

module.exports = router;
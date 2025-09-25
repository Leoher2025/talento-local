// src/routes/chat.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const chatValidation = require('../middlewares/chat.validation.middleware');

// ============================
// CONVERSACIONES
// ============================

// Obtener o crear conversación (requiere autenticación)
router.post(
  '/conversations',
  authenticate,
  chatValidation.validateCreateConversation,
  chatController.getOrCreateConversation
);

// Obtener todas las conversaciones del usuario (requiere autenticación)
router.get(
  '/conversations',
  authenticate,
  chatController.getUserConversations
);

// Obtener detalles de una conversación específica (requiere autenticación)
router.get(
  '/conversations/:conversationId',
  authenticate,
  chatValidation.validateConversationId,
  chatController.getConversationById
);

// Archivar conversación (requiere autenticación)
router.patch(
  '/conversations/:conversationId/archive',
  authenticate,
  chatValidation.validateConversationId,
  chatController.archiveConversation
);

// Desarchivar conversación (requiere autenticación)
router.patch(
  '/conversations/:conversationId/unarchive',
  authenticate,
  chatValidation.validateConversationId,
  chatController.unarchiveConversation
);

// Bloquear usuario en conversación (requiere autenticación)
router.patch(
  '/conversations/:conversationId/block',
  authenticate,
  chatValidation.validateConversationId,
  chatController.blockUser
);

// Desbloquear usuario en conversación (requiere autenticación)
router.patch(
  '/conversations/:conversationId/unblock',
  authenticate,
  chatValidation.validateConversationId,
  chatController.unblockUser
);

// ============================
// MENSAJES
// ============================

// Obtener mensajes de una conversación (requiere autenticación)
router.get(
  '/conversations/:conversationId/messages',
  authenticate,
  chatValidation.validateConversationId,
  chatController.getMessages
);

// Enviar mensaje (requiere autenticación)
router.post(
  '/conversations/:conversationId/messages',
  authenticate,
  chatValidation.validateConversationId,
  chatValidation.validateMessage,
  chatController.sendMessage
);

// Marcar mensajes como leídos (requiere autenticación)
router.patch(
  '/conversations/:conversationId/messages/read',
  authenticate,
  chatValidation.validateConversationId,
  chatController.markAsRead
);

// Reportar mensaje (requiere autenticación)
router.post(
  '/messages/:messageId/report',
  authenticate,
  chatValidation.validateMessageId,
  chatValidation.validateReport,
  chatController.reportMessage
);

// ============================
// ESTADÍSTICAS
// ============================

// Obtener contador de mensajes no leídos (requiere autenticación)
router.get(
  '/unread-count',
  authenticate,
  chatController.getUnreadCount
);

module.exports = router;
// src/routes/chat.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const chatValidation = require('../middlewares/chat.validation.middleware');

// Aplicar autenticación a todas las rutas
//router.use(authMiddleware);

// ============================
// CONVERSACIONES
// ============================

// Obtener o crear conversación
router.post(
  '/conversations',
  chatValidation.validateCreateConversation,
  chatController.getOrCreateConversation
);

// Obtener todas las conversaciones del usuario
router.get(
  '/conversations',
  chatController.getUserConversations
);

// Obtener detalles de una conversación específica
router.get(
  '/conversations/:conversationId',
  chatValidation.validateConversationId,
  chatController.getConversationById
);

// Archivar conversación
router.patch(
  '/conversations/:conversationId/archive',
  chatValidation.validateConversationId,
  chatController.archiveConversation
);

// Desarchivar conversación
router.patch(
  '/conversations/:conversationId/unarchive',
  chatValidation.validateConversationId,
  chatController.unarchiveConversation
);

// Bloquear usuario en conversación
router.patch(
  '/conversations/:conversationId/block',
  chatValidation.validateConversationId,
  chatController.blockUser
);

// Desbloquear usuario en conversación
router.patch(
  '/conversations/:conversationId/unblock',
  chatValidation.validateConversationId,
  chatController.unblockUser
);

// ============================
// MENSAJES
// ============================

// Obtener mensajes de una conversación
router.get(
  '/conversations/:conversationId/messages',
  chatValidation.validateConversationId,
  chatController.getMessages
);

// Enviar mensaje
router.post(
  '/conversations/:conversationId/messages',
  [
    chatValidation.validateConversationId,
    chatValidation.validateMessage
  ],
  chatController.sendMessage
);

// Marcar mensajes como leídos
router.patch(
  '/conversations/:conversationId/messages/read',
  chatValidation.validateConversationId,
  chatController.markAsRead
);

// Reportar mensaje
router.post(
  '/messages/:messageId/report',
  [
    chatValidation.validateMessageId,
    chatValidation.validateReport
  ],
  chatController.reportMessage
);

// ============================
// ESTADÍSTICAS
// ============================

// Obtener contador de mensajes no leídos
router.get(
  '/unread-count',
  chatController.getUnreadCount
);

module.exports = router;
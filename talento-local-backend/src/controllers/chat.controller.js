// src/controllers/chat.controller.js
const ChatModel = require('../models/chat.model');
const logger = require('../utils/logger');

class ChatController {
  // ============================
  // CONVERSACIONES
  // ============================
  
  // Obtener o crear conversación
  async getOrCreateConversation(req, res, next) {
    try {
      const { jobId, clientId, workerId } = req.body;
      const userId = req.user.id;
      
      // Verificar que el usuario sea parte de la conversación
      if (userId !== clientId && userId !== workerId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para crear esta conversación'
        });
      }
      
      const conversation = await ChatModel.getOrCreateConversation({
        job_id: jobId,
        client_id: clientId,
        worker_id: workerId
      });
      
      logger.info(`Conversación obtenida/creada: ${conversation.id}`);
      
      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener conversaciones del usuario
  async getUserConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const { status = 'active', page = 1, limit = 20 } = req.query;
      
      const result = await ChatModel.getUserConversations(userId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: result.conversations,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Obtener detalles de una conversación
  async getConversationById(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      const conversation = await ChatModel.getConversationById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }
      
      // Verificar que el usuario sea parte de la conversación
      if (conversation.client_id !== userId && conversation.worker_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }
  
  // ============================
  // MENSAJES
  // ============================
  
  // Obtener mensajes de una conversación
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user.id;
      
      // Verificar acceso a la conversación
      const conversation = await ChatModel.getConversationById(conversationId);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      const result = await ChatModel.getMessages(conversationId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Enviar mensaje
  async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { message, messageType = 'text' } = req.body;
      const userId = req.user.id;
      
      // Verificar acceso a la conversación
      const conversation = await ChatModel.getConversationById(conversationId);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      // Verificar que la conversación no esté archivada
      if (conversation.status === 'archived') {
        return res.status(400).json({
          success: false,
          message: 'No se pueden enviar mensajes a conversaciones archivadas'
        });
      }
      
      const newMessage = await ChatModel.sendMessage({
        conversation_id: conversationId,
        sender_id: userId,
        message,
        message_type: messageType
      });
      
      logger.info(`Mensaje enviado en conversación: ${conversationId}`);
      
      res.status(201).json({
        success: true,
        data: newMessage
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Marcar mensajes como leídos
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      // Verificar acceso
      const conversation = await ChatModel.getConversationById(conversationId);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      await ChatModel.markMessagesAsRead(conversationId, userId);
      
      res.json({
        success: true,
        message: 'Mensajes marcados como leídos'
      });
    } catch (error) {
      next(error);
    }
  }
  
  // ============================
  // GESTIÓN DE CONVERSACIONES
  // ============================
  
  // Archivar conversación
  async archiveConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      // Verificar acceso
      const conversation = await ChatModel.getConversationById(conversationId);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      const updated = await ChatModel.updateConversationStatus(conversationId, 'archived');
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Desarchivar conversación
  async unarchiveConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      // Verificar acceso
      const conversation = await ChatModel.getConversationById(conversationId);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      const updated = await ChatModel.updateConversationStatus(conversationId, 'active');
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Bloquear usuario
  async blockUser(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      // Verificar acceso
      const conversation = await ChatModel.getConversationById(conversationId);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      const blockedBy = conversation.client_id === userId ? 'client' : 'worker';
      const updated = await ChatModel.blockConversation(conversationId, blockedBy);
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Desbloquear usuario
  async unblockUser(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      // Verificar acceso y que sea quien bloqueó
      const conversation = await ChatModel.getConversationById(conversationId);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }
      
      const unblockedBy = conversation.client_id === userId ? 'client' : 'worker';
      if (conversation.blocked_by !== unblockedBy) {
        return res.status(403).json({
          success: false,
          message: 'Solo quien bloqueó puede desbloquear'
        });
      }
      
      const updated = await ChatModel.unblockConversation(conversationId);
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
  
  // ============================
  // ESTADÍSTICAS Y CONTADORES
  // ============================
  
  // Obtener contador de mensajes no leídos
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await ChatModel.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Reportar mensaje
  async reportMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { reason, description } = req.body;
      const userId = req.user.id;
      
      // Verificar que el mensaje existe y el usuario tiene acceso
      const message = await ChatModel.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Mensaje no encontrado'
        });
      }
      
      // Verificar acceso a la conversación
      const conversation = await ChatModel.getConversationById(message.conversation_id);
      if (!conversation || (conversation.client_id !== userId && conversation.worker_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este mensaje'
        });
      }
      
      const report = await ChatModel.reportMessage({
        message_id: messageId,
        reported_by: userId,
        reason,
        description
      });
      
      logger.info(`Mensaje reportado: ${messageId} por usuario: ${userId}`);
      
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
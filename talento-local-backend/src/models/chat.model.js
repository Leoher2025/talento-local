// src/models/chat.model.js
// Modelo completo para manejo de conversaciones y mensajes con PostgreSQL

const { pool } = require('../config/database');

class ChatModel {
  // ============================
  // CONVERSACIONES
  // ============================

  // Obtener o crear conversación
  static async getOrCreateConversation({ job_id, client_id, worker_id }) {
    try {
      // Primero intentar obtener una conversación existente
      const existingQuery = `
        SELECT * FROM conversation_details
        WHERE client_id = $1::uuid 
        AND worker_id = $2::uuid
        ${job_id ? 'AND job_id = $3::uuid' : ''}
      `;

      const values = job_id ? [client_id, worker_id, job_id] : [client_id, worker_id];
      const existing = await pool.query(existingQuery, values);

      if (existing.rows.length > 0) {
        return existing.rows[0];
      }

      // Si no existe, crear nueva conversación
      const insertQuery = `
        INSERT INTO conversations (job_id, client_id, worker_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [job_id, client_id, worker_id]);

      // Obtener la conversación con todos los detalles
      const detailsQuery = `
        SELECT * FROM conversation_details 
        WHERE id = $1::uuid
      `;

      const details = await pool.query(detailsQuery, [result.rows[0].id]);
      return details.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener conversaciones de un usuario con paginación
  static async getUserConversations(userId, { status = 'active', page = 1, limit = 20 } = {}) {
    try {
      const offset = (page - 1) * limit;

      // Query para obtener conversaciones
      const query = `
        SELECT * FROM conversation_details
        WHERE (client_id = $1::uuid OR worker_id = $2::uuid)
        AND status = $3::conversation_status
        ORDER BY last_message_time DESC NULLS LAST, updated_at DESC
        LIMIT $4 OFFSET $5
      `;

      const result = await pool.query(query, [userId, userId, status, limit, offset]);

      // Query para obtener el total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM conversations
        WHERE (client_id = $1::uuid OR worker_id = $2::uuid)
        AND status = $3::conversation_status
      `;

      const countResult = await pool.query(countQuery, [userId, userId, status]);
      const total = parseInt(countResult.rows[0].total);

      return {
        conversations: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener conversación por ID
  static async getConversationById(conversationId) {
    try {
      const query = `
        SELECT * FROM conversation_details
        WHERE id = $1::uuid
      `;

      const result = await pool.query(query, [conversationId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Actualizar estado de conversación
  static async updateConversationStatus(conversationId, status) {
    try {
      const query = `
        UPDATE conversations
        SET status = $2::conversation_status, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
        RETURNING *
      `;

      const result = await pool.query(query, [conversationId, status]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Bloquear conversación
  static async blockConversation(conversationId, blockedBy) {
    try {
      const field = blockedBy === 'client' ? 'client_blocked' : 'worker_blocked';
      const query = `
        UPDATE conversations
        SET ${field} = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
        RETURNING *
      `;

      const result = await pool.query(query, [conversationId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Desbloquear conversación
  static async unblockConversation(conversationId) {
    try {
      const query = `
        UPDATE conversations
        SET client_blocked = false, worker_blocked = false, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
        RETURNING *
      `;

      const result = await pool.query(query, [conversationId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================
  // MENSAJES
  // ============================

  // Enviar mensaje
  static async sendMessage({
    conversation_id,
    sender_id,
    message_text,
    message_type = 'text',
    file_url = null,
    file_type = null,
    file_size = null
  }) {
    try {
      // Obtener el receptor de la conversación
      const conversationQuery = `
        SELECT client_id, worker_id 
        FROM conversations 
        WHERE id = $1::uuid
      `;

      const conversationResult = await pool.query(conversationQuery, [conversation_id]);
      const conversation = conversationResult.rows[0];

      // Determinar el receptor
      const receiver_id = conversation.client_id === sender_id
        ? conversation.worker_id
        : conversation.client_id;

      // Insertar el mensaje
      const insertQuery = `
        INSERT INTO messages (
          conversation_id, sender_id, receiver_id, 
          message_text, message_type, status,
          file_url, file_type, file_size
        )
        VALUES ($1, $2, $3, $4, $5, 'sent'::message_status, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        conversation_id,
        sender_id,
        receiver_id,
        message_text,
        message_type,
        file_url,
        file_type,
        file_size
      ]);

      // Actualizar el último mensaje de la conversación
      const updateConversationQuery = `
        UPDATE conversations
        SET 
          last_message_text = $2,
          last_message_time = CURRENT_TIMESTAMP,
          ${conversation.client_id === receiver_id ? 'client_unread_count' : 'worker_unread_count'} = 
          ${conversation.client_id === receiver_id ? 'client_unread_count' : 'worker_unread_count'} + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
      `;

      await pool.query(updateConversationQuery, [conversation_id, message_text]);

      // Crear notificación para el receptor
      const notificationQuery = `
      INSERT INTO chat_notifications (message_id, user_id, conversation_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id) DO NOTHING
    `;

      await pool.query(notificationQuery, [
        result.rows[0].id,
        receiver_id,
        conversation_id
      ]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener mensajes de una conversación con paginación
  static async getMessages(conversationId, { page = 1, limit = 50 } = {}) {
    try {
      const offset = (page - 1) * limit;

      // Query para obtener mensajes con información del remitente
      const query = `
        SELECT 
          m.*,
          u.email as sender_email,
          p.first_name as sender_first_name,
          p.last_name as sender_last_name,
          p.profile_picture_url as sender_picture,
          CONCAT(p.first_name, ' ', p.last_name) as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE m.conversation_id = $1::uuid 
        AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [conversationId, limit, offset]);

      // Query para obtener el total de mensajes
      const countQuery = `
        SELECT COUNT(*) as total
        FROM messages
        WHERE conversation_id = $1::uuid 
        AND is_deleted = false
      `;

      const countResult = await pool.query(countQuery, [conversationId]);
      const total = parseInt(countResult.rows[0].total);

      // Revertir el orden para mostrar los mensajes cronológicamente
      const messages = result.rows.reverse();

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener mensaje por ID
  static async getMessageById(messageId) {
    try {
      const query = `
        SELECT * FROM messages
        WHERE id = $1::uuid
      `;

      const result = await pool.query(query, [messageId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Marcar mensajes como leídos
  static async markMessagesAsRead(conversationId, userId) {
    try {
      // Marcar todos los mensajes no leídos como leídos
      const updateQuery = `
        UPDATE messages
        SET 
          status = 'read'::message_status,
          read_at = CURRENT_TIMESTAMP
        WHERE 
          conversation_id = $1::uuid
          AND receiver_id = $2::uuid
          AND status != 'read'::message_status
      `;

      await pool.query(updateQuery, [conversationId, userId]);

      // Resetear el contador de no leídos en la conversación
      const conversationQuery = `
        SELECT client_id FROM conversations WHERE id = $1::uuid
      `;

      const conversationResult = await pool.query(conversationQuery, [conversationId]);
      const conversation = conversationResult.rows[0];

      const field = conversation.client_id === userId ? 'client_unread_count' : 'worker_unread_count';

      const resetCounterQuery = `
        UPDATE conversations
        SET ${field} = 0
        WHERE id = $1::uuid
      `;

      await pool.query(resetCounterQuery, [conversationId]);

      // Marcar notificaciones como leídas
      const notificationQuery = `
        UPDATE chat_notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = $1::uuid AND user_id = $2::uuid AND is_read = false
      `;

      await pool.query(notificationQuery, [conversationId, userId]);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Eliminar mensaje (soft delete)
  static async deleteMessage(messageId, userId) {
    try {
      const query = `
        UPDATE messages
        SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid AND sender_id = $2::uuid
        RETURNING *
      `;

      const result = await pool.query(query, [messageId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ============================
  // ESTADÍSTICAS Y CONTADORES
  // ============================

  // Obtener contador de mensajes no leídos
  static async getUnreadCount(userId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT m.conversation_id) as unread_conversations,
          COUNT(*) as total_unread_messages
        FROM messages m
        WHERE m.receiver_id = $1::uuid
        AND m.status != 'read'::message_status
        AND m.is_deleted = false
      `;

      const result = await pool.query(query, [userId]);

      return {
        conversations: parseInt(result.rows[0].unread_conversations) || 0,
        messages: parseInt(result.rows[0].total_unread_messages) || 0
      };
    } catch (error) {
      throw error;
    }
  }

  // ============================
  // REPORTES
  // ============================

  // Reportar mensaje
  static async reportMessage({ message_id, reported_by, reason, description }) {
    try {
      const query = `
        INSERT INTO reported_messages (message_id, reported_by, reason, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (message_id, reported_by) DO UPDATE
        SET reason = $3, description = $4, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await pool.query(query, [
        message_id,
        reported_by,
        reason,
        description
      ]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ChatModel;
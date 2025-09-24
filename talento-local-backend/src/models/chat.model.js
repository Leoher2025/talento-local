// src/models/chat.model.js
// Modelo para manejo de conversaciones y mensajes con PostgreSQL

const { pool } = require('../config/database');

class ChatModel {
  // ============================
  // CONVERSACIONES
  // ============================

  // Obtener o crear conversación
  static async getOrCreateConversation({ job_id, client_id, worker_id }) {
    try {
      // Verificar si existe ya una conversación
      let query = `
        SELECT * FROM conversation_details
        WHERE client_id = $1::uuid AND worker_id = $2::uuid
      `;
      const values = [client_id, worker_id];

      if (job_id) {
        query += ' AND job_id = $3::uuid';
        values.push(job_id);
      }

      const existing = await pool.query(query, values);

      if (existing.rows.length > 0) {
        return existing.rows[0];
      }

      // Crear nueva conversación
      const insert = `
        INSERT INTO conversations (job_id, client_id, worker_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const result = await pool.query(insert, [job_id, client_id, worker_id]);

      const details = await pool.query(
        'SELECT * FROM conversation_details WHERE id = $1::uuid',
        [result.rows[0].id]
      );

      return details.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener conversaciones de un usuario
  static async getUserConversations(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM get_user_conversations($1::uuid)',
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener conversación por ID
  static async getConversationById(conversationId, userId) {
    try {
      const query = `
        SELECT * FROM conversation_details
        WHERE id = $1::uuid AND (client_id = $2::uuid OR worker_id = $2::uuid)
      `;
      const result = await pool.query(query, [conversationId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Bloquear conversación
  static async blockConversation(conversationId, userId, block = true) {
    try {
      const query = `
        UPDATE conversations
        SET blocked_by = CASE WHEN $2::boolean THEN $1::uuid ELSE NULL END,
            blocked_at = CASE WHEN $2::boolean THEN CURRENT_TIMESTAMP ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3::uuid
        RETURNING *
      `;
      const result = await pool.query(query, [userId, block, conversationId]);
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
    attachment_url,
    attachment_type,
    attachment_size
  }) {
    try {
      const query = `
        INSERT INTO messages (
          conversation_id, sender_id, message_text, message_type,
          attachment_url, attachment_type, attachment_size
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await pool.query(query, [
        conversation_id,
        sender_id,
        message_text,
        message_type,
        attachment_url,
        attachment_type,
        attachment_size
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener mensajes de una conversación
  static async getMessages(conversationId, userId, { page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    try {
      const query = `
        SELECT m.*, 
               u.email as sender_email,
               p.first_name as sender_first_name,
               p.last_name as sender_last_name,
               p.profile_picture_url as sender_picture
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE m.conversation_id = $1::uuid AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await pool.query(query, [conversationId, limit, offset]);

      const countRes = await pool.query(
        `SELECT COUNT(*) as total 
         FROM messages 
         WHERE conversation_id = $1::uuid AND is_deleted = false`,
        [conversationId]
      );

      return {
        data: result.rows.reverse(),
        pagination: {
          page,
          limit,
          total: parseInt(countRes.rows[0].total),
          pages: Math.ceil(countRes.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Marcar mensajes como leídos
  static async markAllAsRead(conversationId, userId) {
    try {
      await pool.query(
        `UPDATE messages 
         SET is_read = true, read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1::uuid AND sender_id != $2::uuid AND is_read = false`,
        [conversationId, userId]
      );

      await pool.query(
        `UPDATE unread_counts 
         SET unread_count = 0, last_read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1::uuid AND conversation_id = $2::uuid`,
        [userId, conversationId]
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Eliminar mensaje
  static async deleteMessage(messageId, userId) {
    try {
      const result = await pool.query(
        `UPDATE messages 
         SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND sender_id = $2::uuid
         RETURNING *`,
        [messageId, userId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener conteo de no leídos
  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT SUM(unread_count) as total 
         FROM unread_counts WHERE user_id = $1::uuid`,
        [userId]
      );
      return parseInt(result.rows[0].total) || 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ChatModel;

// src/models/profile.model.js
// Modelo para manejo de perfiles de usuario

const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

class ProfileModel {
  // ============================
  // OBTENER PERFIL POR USER ID
  // ============================
  static async getByUserId(userId) {
    try {
      const selectQuery = `
        SELECT 
          p.*,
          u.email,
          u.phone,
          u.role,
          u.verification_status,
          u.is_active,
          u.created_at as user_created_at
        FROM profiles p
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
      `;
      
      const result = await query(selectQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR PERFIL
  // ============================
  static async update(userId, profileData) {
    try {
      const allowedFields = [
        'first_name',
        'last_name',
        'display_name',
        'bio',
        'profile_picture_url',
        'city',
        'department',
        'address',
        'skills',
        'experience',
        'hourly_rate',
        'availability_status',
        'latitude',
        'longitude'
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

      // Construir query dinámicamente
      for (const [key, value] of Object.entries(profileData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        return await this.getByUserId(userId);
      }

      values.push(userId);

      const updateQuery = `
        UPDATE profiles
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramCount}
        RETURNING *
      `;

      const result = await query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new Error('Perfil no encontrado');
      }

      // Retornar perfil actualizado con datos del usuario
      return await this.getByUserId(userId);
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR FOTO DE PERFIL
  // ============================
  static async updateProfilePicture(userId, imageUrl) {
    try {
      const updateQuery = `
        UPDATE profiles
        SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [imageUrl, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Perfil no encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando foto de perfil:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR FOTO DE PERFIL
  // ============================
  static async deleteProfilePicture(userId) {
    try {
      const updateQuery = `
        UPDATE profiles
        SET profile_picture_url = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Perfil no encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error eliminando foto de perfil:', error);
      throw error;
    }
  }

  // ============================
  // GALERÍA DE TRABAJOS
  // ============================
  static async addGalleryPhoto(userId, photoData) {
    try {
      const insertQuery = `
        INSERT INTO work_gallery (worker_id, image_url, thumbnail_url, caption, display_order)
        VALUES ($1, $2, $3, $4, COALESCE(
          (SELECT MAX(display_order) + 1 FROM work_gallery WHERE worker_id = $1),
          1
        ))
        RETURNING *
      `;

      const values = [
        userId,
        photoData.image_url,
        photoData.thumbnail_url || photoData.image_url,
        photoData.caption || ''
      ];

      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error agregando foto a galería:', error);
      throw error;
    }
  }

  static async getGallery(workerId) {
    try {
      const selectQuery = `
        SELECT *
        FROM work_gallery
        WHERE worker_id = $1
        ORDER BY display_order, created_at DESC
      `;

      const result = await query(selectQuery, [workerId]);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo galería:', error);
      throw error;
    }
  }

  static async deleteGalleryPhoto(photoId, userId) {
    try {
      const deleteQuery = `
        DELETE FROM work_gallery
        WHERE id = $1 AND worker_id = $2
        RETURNING *
      `;

      const result = await query(deleteQuery, [photoId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Foto no encontrada o sin permisos');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error eliminando foto de galería:', error);
      throw error;
    }
  }

  // ============================
  // ESTADÍSTICAS
  // ============================
  static async getStats(userId) {
    try {
      const statsQuery = `
        SELECT 
          p.rating_average,
          p.total_ratings,
          p.total_jobs_completed,
          p.response_time_minutes,
          p.completion_rate,
          u.created_at as member_since,
          (
            SELECT COUNT(*) 
            FROM jobs 
            WHERE client_id = $1 OR assigned_worker_id = $1
          ) as total_jobs,
          (
            SELECT COUNT(*) 
            FROM jobs 
            WHERE (client_id = $1 OR assigned_worker_id = $1) 
            AND status = 'completed'
          ) as completed_jobs,
          (
            SELECT COUNT(*) 
            FROM jobs 
            WHERE assigned_worker_id = $1 
            AND status = 'in_progress'
          ) as active_jobs
        FROM profiles p
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
      `;

      const result = await query(statsQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR CONFIGURACIÓN
  // ============================
  static async updateSettings(userId, settings) {
    try {
      const { notifications, privacy } = settings;

      if (notifications) {
        const notifQuery = `
          UPDATE profiles
          SET 
            notification_new_jobs = COALESCE($1, notification_new_jobs),
            notification_messages = COALESCE($2, notification_messages),
            notification_applications = COALESCE($3, notification_applications),
            notification_promotions = COALESCE($4, notification_promotions),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $5
          RETURNING *
        `;

        await query(notifQuery, [
          notifications.new_jobs,
          notifications.messages,
          notifications.applications,
          notifications.promotions,
          userId
        ]);
      }

      if (privacy) {
        const privacyQuery = `
          UPDATE profiles
          SET 
            show_phone = COALESCE($1, show_phone),
            show_email = COALESCE($2, show_email),
            show_location = COALESCE($3, show_location),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $4
          RETURNING *
        `;

        await query(privacyQuery, [
          privacy.show_phone,
          privacy.show_email,
          privacy.show_location,
          userId
        ]);
      }

      return await this.getByUserId(userId);
    } catch (error) {
      logger.error('Error actualizando configuración:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR TELÉFONO
  // ============================
  static async updatePhone(userId, phone) {
    try {
      const updateQuery = `
        UPDATE users
        SET phone = $1, phone_verified_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING phone
      `;

      const result = await query(updateQuery, [phone, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando teléfono:', error);
      throw error;
    }
  }
}

module.exports = ProfileModel;
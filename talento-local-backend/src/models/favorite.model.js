// src/models/favorite.model.js
// Modelo para gestión de favoritos

const { query } = require('../config/database');
const logger = require('../utils/logger');

class FavoriteModel {
  // ============================
  // AGREGAR A FAVORITOS
  // ============================
  static async addFavorite({ userId, favoriteType, favoriteId, notes = null }) {
    try {
      const insertQuery = `
        INSERT INTO favorites (user_id, favorite_type, favorite_id, notes)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, favorite_type, favorite_id) 
        DO UPDATE SET notes = EXCLUDED.notes, created_at = NOW()
        RETURNING *
      `;

      const result = await query(insertQuery, [userId, favoriteType, favoriteId, notes]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error agregando favorito:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR DE FAVORITOS
  // ============================
  static async removeFavorite({ userId, favoriteType, favoriteId }) {
    try {
      const deleteQuery = `
        DELETE FROM favorites
        WHERE user_id = $1 
          AND favorite_type = $2 
          AND favorite_id = $3
        RETURNING *
      `;

      const result = await query(deleteQuery, [userId, favoriteType, favoriteId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error eliminando favorito:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICAR SI ES FAVORITO
  // ============================
  static async isFavorite({ userId, favoriteType, favoriteId }) {
    try {
      const selectQuery = `
        SELECT EXISTS(
          SELECT 1 FROM favorites
          WHERE user_id = $1 
            AND favorite_type = $2 
            AND favorite_id = $3
        ) as is_favorite
      `;

      const result = await query(selectQuery, [userId, favoriteType, favoriteId]);
      return result.rows[0].is_favorite;
    } catch (error) {
      logger.error('Error verificando favorito:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TRABAJADORES FAVORITOS
  // ============================
  static async getFavoriteWorkers(userId) {
    try {
      const selectQuery = `
      SELECT 
        f.id as favorite_id,
        f.notes,
        f.created_at as favorited_at,
        p.user_id,
        p.first_name,
        p.last_name,
        p.bio,
        p.profile_picture_url,
        p.city,
        p.department,
        p.latitude,
        p.longitude,
        p.skills,
        p.created_at,
        p.updated_at,
        u.email,
        u.phone,
        u.verification_status,
        u.phone_verified,
        u.profile_picture_verified,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM favorites f
      INNER JOIN profiles p ON f.favorite_id = p.user_id
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN reviews r ON p.user_id = r.reviewee_id
      WHERE f.user_id = $1 
        AND f.favorite_type = 'worker'
        AND u.is_active = true
      GROUP BY 
        f.id, f.notes, f.created_at,
        p.user_id, p.first_name, p.last_name, p.bio, p.profile_picture_url,
        p.city, p.department, p.latitude, p.longitude, p.skills, 
        p.created_at, p.updated_at,
        u.email, u.phone, u.verification_status, u.phone_verified, u.profile_picture_verified
      ORDER BY f.created_at DESC
    `;

      const result = await query(selectQuery, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo trabajadores favoritos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TRABAJOS FAVORITOS
  // ============================
  static async getFavoriteJobs(userId) {
    try {
      const selectQuery = `
      SELECT 
        f.id as favorite_id,
        f.notes,
        f.created_at as favorited_at,
        j.id,
        j.client_id,
        j.title,
        j.description,
        j.category_id,
        j.budget_amount,
        j.budget_type,
        j.currency,
        j.address,
        j.address_details,
        j.city,
        j.department,
        j.latitude,
        j.longitude,
        j.status,
        j.urgency,
        j.needed_date,
        j.expires_at,
        j.created_at,
        j.updated_at,
        p.first_name as client_first_name,
        p.last_name as client_last_name,
        p.profile_picture_url as client_picture,
        COUNT(DISTINCT a.id) as applications_count
      FROM favorites f
      INNER JOIN jobs j ON f.favorite_id = j.id
      INNER JOIN profiles p ON j.client_id = p.user_id
      LEFT JOIN job_applications a ON j.id = a.job_id
      WHERE f.user_id = $1 
        AND f.favorite_type = 'job'
        AND j.status != 'cancelled'
      GROUP BY 
        f.id, f.notes, f.created_at,
        j.id, j.client_id, j.title, j.description, j.category_id,
        j.budget_amount, j.budget_type, j.currency, j.address, j.address_details,
        j.city, j.department, j.latitude, j.longitude, j.status, j.urgency,
        j.needed_date, j.expires_at, j.created_at, j.updated_at,
        p.first_name, p.last_name, p.profile_picture_url
      ORDER BY f.created_at DESC
    `;

      const result = await query(selectQuery, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo trabajos favoritos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TODOS LOS FAVORITOS
  // ============================
  static async getAllFavorites(userId) {
    try {
      const workers = await this.getFavoriteWorkers(userId);
      const jobs = await this.getFavoriteJobs(userId);

      return {
        workers,
        jobs,
        total: workers.length + jobs.length
      };
    } catch (error) {
      logger.error('Error obteniendo todos los favoritos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER CONTADOR DE FAVORITOS
  // ============================
  static async getFavoritesCount(userId) {
    try {
      const countQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE favorite_type = 'worker') as workers_count,
          COUNT(*) FILTER (WHERE favorite_type = 'job') as jobs_count,
          COUNT(*) as total_count
        FROM favorites
        WHERE user_id = $1
      `;

      const result = await query(countQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo contador de favoritos:', error);
      throw error;
    }
  }

  // ============================
  // AGREGAR MÚLTIPLES IDS COMO FAVORITOS
  // ============================
  static async checkMultipleFavorites({ userId, favoriteType, favoriteIds }) {
    try {
      if (!favoriteIds || favoriteIds.length === 0) {
        return [];
      }

      const placeholders = favoriteIds.map((_, i) => `$${i + 3}`).join(',');
      const selectQuery = `
        SELECT favorite_id
        FROM favorites
        WHERE user_id = $1 
          AND favorite_type = $2
          AND favorite_id IN (${placeholders})
      `;

      const result = await query(selectQuery, [userId, favoriteType, ...favoriteIds]);
      return result.rows.map(row => row.favorite_id);
    } catch (error) {
      logger.error('Error verificando múltiples favoritos:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR NOTAS
  // ============================
  static async updateNotes({ userId, favoriteType, favoriteId, notes }) {
    try {
      const updateQuery = `
        UPDATE favorites
        SET notes = $1
        WHERE user_id = $2 
          AND favorite_type = $3 
          AND favorite_id = $4
        RETURNING *
      `;

      const result = await query(updateQuery, [notes, userId, favoriteType, favoriteId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando notas:', error);
      throw error;
    }
  }
}

module.exports = FavoriteModel;
// src/models/review.model.js
// Modelo para manejo de reviews y calificaciones

const { query } = require('../config/database');
const logger = require('../utils/logger');

class ReviewModel {
  // ============================
  // CREAR REVIEW
  // ============================
  static async create(reviewData) {
    try {
      const insertQuery = `
        INSERT INTO reviews (
          job_id,
          reviewer_id,
          reviewee_id,
          review_type,
          rating,
          comment,
          communication_rating,
          professionalism_rating,
          quality_rating,
          punctuality_rating,
          would_recommend,
          is_verified
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        reviewData.job_id,
        reviewData.reviewer_id,
        reviewData.reviewee_id,
        reviewData.review_type,
        reviewData.rating,
        reviewData.comment || null,
        reviewData.communication_rating || null,
        reviewData.professionalism_rating || null,
        reviewData.quality_rating || null,
        reviewData.punctuality_rating || null,
        reviewData.would_recommend !== undefined ? reviewData.would_recommend : true,
        reviewData.is_verified || false
      ];

      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creando review:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICAR SI PUEDE DEJAR REVIEW
  // ============================
  static async canLeaveReview(jobId, reviewerId, revieweeId) {
    try {
      const checkQuery = `
        SELECT can_leave_review($1, $2, $3) as can_review
      `;

      const result = await query(checkQuery, [jobId, reviewerId, revieweeId]);
      return result.rows[0].can_review;
    } catch (error) {
      logger.error('Error verificando permisos de review:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER REVIEW POR ID
  // ============================
  static async getById(reviewId) {
    try {
      const selectQuery = `
        SELECT * FROM reviews_detailed
        WHERE id = $1
      `;

      const result = await query(selectQuery, [reviewId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo review:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER REVIEWS DE UN USUARIO
  // ============================
  static async getByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        minRating = null
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['reviewee_id = $1'];
      let values = [userId];
      let paramCount = 1;

      if (minRating) {
        paramCount++;
        whereConditions.push(`rating >= $${paramCount}`);
        values.push(minRating);
      }

      const whereClause = whereConditions.join(' AND ');

      const selectQuery = `
        SELECT * FROM reviews_detailed
        WHERE ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      values.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews
        WHERE ${whereClause}
      `;

      const [reviewsResult, countResult] = await Promise.all([
        query(selectQuery, values),
        query(countQuery, values.slice(0, -2))
      ]);

      return {
        reviews: reviewsResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page,
          limit,
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Error obteniendo reviews del usuario:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER REVIEWS DE UN TRABAJO
  // ============================
  static async getByJobId(jobId) {
    try {
      const selectQuery = `
        SELECT * FROM reviews_detailed
        WHERE job_id = $1
        ORDER BY created_at DESC
      `;

      const result = await query(selectQuery, [jobId]);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo reviews del trabajo:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER ESTADÍSTICAS DE REVIEWS
  // ============================
  static async getStats(userId) {
    try {
      const statsQuery = `
        SELECT * FROM get_user_review_stats($1)
      `;

      const result = await query(statsQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo estadísticas de reviews:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR REVIEW
  // ============================
  static async update(reviewId, reviewerId, updateData) {
    try {
      const allowedFields = [
        'rating',
        'comment',
        'communication_rating',
        'professionalism_rating',
        'quality_rating',
        'punctuality_rating',
        'would_recommend'
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      // Agregar is_edited flag
      updates.push(`is_edited = true`);
      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(reviewId, reviewerId);

      const updateQuery = `
        UPDATE reviews
        SET ${updates.join(', ')}
        WHERE id = $${paramCount} AND reviewer_id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new Error('Review no encontrada o no tienes permiso para editarla');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando review:', error);
      throw error;
    }
  }

  // ============================
  // AGREGAR RESPUESTA A REVIEW
  // ============================
  static async addResponse(reviewId, revieweeId, responseText) {
    try {
      const updateQuery = `
        UPDATE reviews
        SET 
          response = $1,
          response_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND reviewee_id = $3
        RETURNING *
      `;

      const result = await query(updateQuery, [responseText, reviewId, revieweeId]);

      if (result.rows.length === 0) {
        throw new Error('Review no encontrada o no tienes permiso para responder');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error agregando respuesta a review:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR REVIEW
  // ============================
  static async delete(reviewId, reviewerId) {
    try {
      const deleteQuery = `
        DELETE FROM reviews
        WHERE id = $1 AND reviewer_id = $2
        RETURNING *
      `;

      const result = await query(deleteQuery, [reviewId, reviewerId]);

      if (result.rows.length === 0) {
        throw new Error('Review no encontrada o no tienes permiso para eliminarla');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error eliminando review:', error);
      throw error;
    }
  }

  // ============================
  // VOTAR ÚTIL/NO ÚTIL
  // ============================
  static async voteHelpful(reviewId, userId, isHelpful) {
    try {
      const upsertQuery = `
        INSERT INTO review_helpful_votes (review_id, user_id, is_helpful)
        VALUES ($1, $2, $3)
        ON CONFLICT (review_id, user_id)
        DO UPDATE SET 
          is_helpful = $3,
          created_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await query(upsertQuery, [reviewId, userId, isHelpful]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error votando review:', error);
      throw error;
    }
  }

  // ============================
  // REPORTAR REVIEW
  // ============================
  static async report(reviewId, reporterId, reason, description = null) {
    try {
      const insertQuery = `
        INSERT INTO review_reports (review_id, reporter_id, reason, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await query(insertQuery, [reviewId, reporterId, reason, description]);

      // Marcar la review como flagged
      await query(
        'UPDATE reviews SET is_flagged = true WHERE id = $1',
        [reviewId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error reportando review:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICAR SI USUARIO VOTÓ
  // ============================
  static async getUserVote(reviewId, userId) {
    try {
      const selectQuery = `
        SELECT is_helpful FROM review_helpful_votes
        WHERE review_id = $1 AND user_id = $2
      `;

      const result = await query(selectQuery, [reviewId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo voto del usuario:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER REVIEWS DADOS POR UN USUARIO
  // ============================
  static async getReviewsByReviewer(reviewerId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10
      } = options;

      const offset = (page - 1) * limit;

      const selectQuery = `
        SELECT * FROM reviews_detailed
        WHERE reviewer_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews
        WHERE reviewer_id = $1
      `;

      const [reviewsResult, countResult] = await Promise.all([
        query(selectQuery, [reviewerId, limit, offset]),
        query(countQuery, [reviewerId])
      ]);

      return {
        reviews: reviewsResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page,
          limit,
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Error obteniendo reviews del reviewer:', error);
      throw error;
    }
  }
}

module.exports = ReviewModel;
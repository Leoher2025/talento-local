// src/controllers/review.controller.js
// Controlador para manejo de reviews y calificaciones

const ReviewModel = require('../models/review.model');
const logger = require('../utils/logger');
const NotificationHelpers = require('../utils/notificationHelpers');
const JobModel = require('../models/job.model');
const { query } = require('../config/database');
class ReviewController {
  // ============================
  // CREAR REVIEW
  // ============================
  static async createReview(req, res, next) {
    try {
      const reviewerId = req.user.id;
      const {
        jobId,
        revieweeId,
        reviewType,
        rating,
        comment,
        communicationRating,
        professionalismRating,
        qualityRating,
        punctualityRating,
        wouldRecommend
      } = req.body;

      // Verificar si puede dejar review
      const canReview = await ReviewModel.canLeaveReview(
        jobId,
        reviewerId,
        revieweeId
      );

      if (!canReview) {
        return res.status(403).json({
          success: false,
          message: 'No puedes dejar una review para este trabajo. Verifica que el trabajo esté completado y que no hayas dejado una review previamente.'
        });
      }

      const reviewData = {
        job_id: jobId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        review_type: reviewType,
        rating,
        comment,
        communication_rating: communicationRating,
        professionalism_rating: professionalismRating,
        quality_rating: qualityRating,
        punctuality_rating: punctualityRating,
        would_recommend: wouldRecommend,
        is_verified: true // Verificado automáticamente si pasó la validación
      };

      const review = await ReviewModel.create(reviewData);

      // ✅ ENVIAR NOTIFICACIÓN AL REVIEWEE
      const job = await JobModel.getById(req.body.jobId);
      const reviewer = await query(
        'SELECT first_name, last_name FROM profiles WHERE user_id = $1',
        [reviewerId]
      );
      const reviewerName = `${reviewer.rows[0].first_name} ${reviewer.rows[0].last_name}`;

      await NotificationHelpers.notifyNewReview(
        req.body.revieweeId,
        reviewerName,
        req.body.rating,
        job.title
      );

      res.status(201).json({
        success: true,
        message: 'Review creada exitosamente',
        data: review
      });

      logger.info(`Review creada: ${review.id} por usuario ${reviewerId}`);
    } catch (error) {
      logger.error('Error creando review:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER REVIEW POR ID
  // ============================
  static async getReviewById(req, res, next) {
    try {
      const { reviewId } = req.params;

      const review = await ReviewModel.getById(reviewId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review no encontrada'
        });
      }

      // Verificar si el usuario actual votó
      let userVote = null;
      if (req.user) {
        userVote = await ReviewModel.getUserVote(reviewId, req.user.id);
      }

      res.json({
        success: true,
        data: {
          ...review,
          userVote: userVote?.is_helpful || null
        }
      });
    } catch (error) {
      logger.error('Error obteniendo review:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER REVIEWS DE UN USUARIO
  // ============================
  static async getUserReviews(req, res, next) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        minRating
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        minRating: minRating ? parseInt(minRating) : null
      };

      const result = await ReviewModel.getByUserId(userId, options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error obteniendo reviews del usuario:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER ESTADÍSTICAS DE REVIEWS
  // ============================
  static async getUserReviewStats(req, res, next) {
    try {
      const { userId } = req.params;

      const stats = await ReviewModel.getStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER REVIEWS DE UN TRABAJO
  // ============================
  static async getJobReviews(req, res, next) {
    try {
      const { jobId } = req.params;

      const reviews = await ReviewModel.getByJobId(jobId);

      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      logger.error('Error obteniendo reviews del trabajo:', error);
      next(error);
    }
  }

  // ============================
  // ACTUALIZAR REVIEW
  // ============================
  static async updateReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const reviewerId = req.user.id;
      const updateData = req.body;

      const updatedReview = await ReviewModel.update(
        reviewId,
        reviewerId,
        updateData
      );

      res.json({
        success: true,
        message: 'Review actualizada exitosamente',
        data: updatedReview
      });

      logger.info(`Review actualizada: ${reviewId}`);
    } catch (error) {
      logger.error('Error actualizando review:', error);
      next(error);
    }
  }

  // ============================
  // AGREGAR RESPUESTA A REVIEW
  // ============================
  static async addResponse(req, res, next) {
    try {
      const { reviewId } = req.params;
      const revieweeId = req.user.id;
      const { response } = req.body;

      const updatedReview = await ReviewModel.addResponse(
        reviewId,
        revieweeId,
        response
      );

      res.json({
        success: true,
        message: 'Respuesta agregada exitosamente',
        data: updatedReview
      });

      logger.info(`Respuesta agregada a review: ${reviewId}`);
    } catch (error) {
      logger.error('Error agregando respuesta:', error);
      next(error);
    }
  }

  // ============================
  // ELIMINAR REVIEW
  // ============================
  static async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const reviewerId = req.user.id;

      await ReviewModel.delete(reviewId, reviewerId);

      res.json({
        success: true,
        message: 'Review eliminada exitosamente'
      });

      logger.info(`Review eliminada: ${reviewId}`);
    } catch (error) {
      logger.error('Error eliminando review:', error);
      next(error);
    }
  }

  // ============================
  // VOTAR ÚTIL/NO ÚTIL
  // ============================
  static async voteHelpful(req, res, next) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;
      const { isHelpful } = req.body;

      await ReviewModel.voteHelpful(reviewId, userId, isHelpful);

      res.json({
        success: true,
        message: 'Voto registrado exitosamente'
      });
    } catch (error) {
      logger.error('Error votando review:', error);
      next(error);
    }
  }

  // ============================
  // REPORTAR REVIEW
  // ============================
  static async reportReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const reporterId = req.user.id;
      const { reason, description } = req.body;

      await ReviewModel.report(reviewId, reporterId, reason, description);

      res.json({
        success: true,
        message: 'Review reportada exitosamente. Será revisada por nuestro equipo.'
      });

      logger.info(`Review reportada: ${reviewId} por usuario ${reporterId}`);
    } catch (error) {
      logger.error('Error reportando review:', error);
      next(error);
    }
  }

  // ============================
  // MIS REVIEWS (DADAS POR MÍ)
  // ============================
  static async getMyReviews(req, res, next) {
    try {
      const reviewerId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await ReviewModel.getReviewsByReviewer(reviewerId, options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error obteniendo mis reviews:', error);
      next(error);
    }
  }

  // ============================
  // VERIFICAR SI PUEDE DEJAR REVIEW
  // ============================
  static async checkCanReview(req, res, next) {
    try {
      const reviewerId = req.user.id;
      const { jobId, revieweeId } = req.query;

      const canReview = await ReviewModel.canLeaveReview(
        jobId,
        reviewerId,
        revieweeId
      );

      res.json({
        success: true,
        data: {
          canReview
        }
      });
    } catch (error) {
      logger.error('Error verificando permisos:', error);
      next(error);
    }
  }
}

module.exports = ReviewController;
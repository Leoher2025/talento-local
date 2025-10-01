// src/routes/review.routes.js
// Rutas para el sistema de reviews

const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateCreateReview,
  validateUpdateReview,
  validateAddResponse,
  validateVoteHelpful,
  validateReportReview,
  validateGetReviews,
  validateCheckCanReview,
  validateReviewId,
  validateJobId
} = require('../middlewares/review.validation.middleware');

// ============================
// RUTAS PÚBLICAS
// ============================

// Obtener reviews de un usuario (público)
router.get(
  '/user/:userId',
  validateGetReviews,
  ReviewController.getUserReviews
);

// Obtener estadísticas de reviews de un usuario
router.get(
  '/user/:userId/stats',
  validateGetReviews,
  ReviewController.getUserReviewStats
);

// Obtener review por ID
router.get(
  '/:reviewId',
  validateReviewId,
  ReviewController.getReviewById
);

// Obtener reviews de un trabajo
router.get(
  '/job/:jobId',
  validateJobId,
  ReviewController.getJobReviews
);

// ============================
// RUTAS PROTEGIDAS
// ============================

// Verificar si puede dejar review
router.get(
  '/check/can-review',
  authenticate,
  validateCheckCanReview,
  ReviewController.checkCanReview
);

// Obtener mis reviews (reviews que he dado)
router.get(
  '/my/given',
  authenticate,
  ReviewController.getMyReviews
);

// Crear review
router.post(
  '/',
  authenticate,
  validateCreateReview,
  ReviewController.createReview
);

// Actualizar review
router.put(
  '/:reviewId',
  authenticate,
  validateUpdateReview,
  ReviewController.updateReview
);

// Agregar respuesta a una review
router.post(
  '/:reviewId/response',
  authenticate,
  validateAddResponse,
  ReviewController.addResponse
);

// Eliminar review
router.delete(
  '/:reviewId',
  authenticate,
  validateReviewId,
  ReviewController.deleteReview
);

// Votar útil/no útil
router.post(
  '/:reviewId/vote',
  authenticate,
  validateVoteHelpful,
  ReviewController.voteHelpful
);

// Reportar review
router.post(
  '/:reviewId/report',
  authenticate,
  validateReportReview,
  ReviewController.reportReview
);

module.exports = router;
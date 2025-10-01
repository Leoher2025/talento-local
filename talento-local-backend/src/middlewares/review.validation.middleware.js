// src/middlewares/review.validation.middleware.js
// Validaciones para el sistema de reviews

const { body, param, query, validationResult } = require('express-validator');

// Función auxiliar para validar UUID
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validación para crear review
const validateCreateReview = [
  body('jobId')
    .notEmpty().withMessage('El ID del trabajo es requerido')
    .custom(isValidUUID).withMessage('ID de trabajo inválido'),

  body('revieweeId')
    .notEmpty().withMessage('El ID del usuario a calificar es requerido')
    .custom(isValidUUID).withMessage('ID de usuario inválido'),

  body('reviewType')
    .notEmpty().withMessage('El tipo de review es requerido')
    .isIn(['worker_review', 'client_review'])
    .withMessage('Tipo de review inválido'),

  body('rating')
    .notEmpty().withMessage('La calificación es requerida')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5'),

  body('comment')
    .optional()
    .isLength({ max: 2000 }).withMessage('El comentario no puede exceder 2000 caracteres')
    .trim(),

  body('communicationRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de comunicación debe ser entre 1 y 5'),

  body('professionalismRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de profesionalismo debe ser entre 1 y 5'),

  body('qualityRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de calidad debe ser entre 1 y 5'),

  body('punctualityRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de puntualidad debe ser entre 1 y 5'),

  body('wouldRecommend')
    .optional()
    .isBoolean().withMessage('wouldRecommend debe ser un booleano'),

  handleValidationErrors
];

// Validación para actualizar review
const validateUpdateReview = [
  param('reviewId')
    .custom(isValidUUID).withMessage('ID de review inválido'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5'),

  body('comment')
    .optional()
    .isLength({ max: 2000 }).withMessage('El comentario no puede exceder 2000 caracteres')
    .trim(),

  body('communicationRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de comunicación debe ser entre 1 y 5'),

  body('professionalismRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de profesionalismo debe ser entre 1 y 5'),

  body('qualityRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de calidad debe ser entre 1 y 5'),

  body('punctualityRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación de puntualidad debe ser entre 1 y 5'),

  body('wouldRecommend')
    .optional()
    .isBoolean().withMessage('wouldRecommend debe ser un booleano'),

  handleValidationErrors
];

// Validación para agregar respuesta
const validateAddResponse = [
  param('reviewId')
    .custom(isValidUUID).withMessage('ID de review inválido'),

  body('response')
    .notEmpty().withMessage('La respuesta es requerida')
    .isLength({ min: 1, max: 1000 }).withMessage('La respuesta debe tener entre 1 y 1000 caracteres')
    .trim(),

  handleValidationErrors
];

// Validación para votar
const validateVoteHelpful = [
  param('reviewId')
    .custom(isValidUUID).withMessage('ID de review inválido'),

  body('isHelpful')
    .notEmpty().withMessage('isHelpful es requerido')
    .isBoolean().withMessage('isHelpful debe ser un booleano'),

  handleValidationErrors
];

// Validación para reportar
const validateReportReview = [
  param('reviewId')
    .custom(isValidUUID).withMessage('ID de review inválido'),

  body('reason')
    .notEmpty().withMessage('La razón es requerida')
    .isIn(['spam', 'inappropriate', 'false_information', 'harassment', 'off_topic', 'other'])
    .withMessage('Razón inválida'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
    .trim(),

  handleValidationErrors
];

// Validación para obtener reviews con filtros
const validateGetReviews = [
  param('userId')
    .optional()
    .custom(isValidUUID).withMessage('ID de usuario inválido'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página debe ser un número positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50')
    .toInt(),

  query('sortBy')
    .optional()
    .isIn(['created_at', 'rating', 'helpful_count'])
    .withMessage('Campo de ordenamiento inválido'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Orden debe ser ASC o DESC'),

  query('minRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Calificación mínima debe ser entre 1 y 5')
    .toInt(),

  handleValidationErrors
];

// Validación para verificar permisos
const validateCheckCanReview = [
  query('jobId')
    .notEmpty().withMessage('jobId es requerido')
    .custom(isValidUUID).withMessage('ID de trabajo inválido'),

  query('revieweeId')
    .notEmpty().withMessage('revieweeId es requerido')
    .custom(isValidUUID).withMessage('ID de usuario inválido'),

  handleValidationErrors
];

// Validación para ID de review
const validateReviewId = [
  param('reviewId')
    .custom(isValidUUID).withMessage('ID de review inválido'),

  handleValidationErrors
];

// Validación para ID de trabajo
const validateJobId = [
  param('jobId')
    .custom(isValidUUID).withMessage('ID de trabajo inválido'),

  handleValidationErrors
];

module.exports = {
  validateCreateReview,
  validateUpdateReview,
  validateAddResponse,
  validateVoteHelpful,
  validateReportReview,
  validateGetReviews,
  validateCheckCanReview,
  validateReviewId,
  validateJobId
};
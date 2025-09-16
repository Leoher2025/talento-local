// src/middlewares/job.validation.middleware.js - Validaciones para trabajos
const { body, query, param, validationResult } = require('express-validator');

// Manejador de errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// ============================
// VALIDACIÓN PARA CREAR TRABAJO
// ============================
const validateCreateJob = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('La descripción debe tener entre 20 y 2000 caracteres'),
  
  body('categoryId')
    .isUUID()
    .withMessage('Categoría inválida'),
  
  body('budgetAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El presupuesto debe ser un número positivo'),
  
  body('budgetType')
    .optional()
    .isIn(['fixed', 'hourly', 'negotiable'])
    .withMessage('Tipo de presupuesto inválido'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('La dirección es requerida'),
  
  body('addressDetails')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Los detalles de dirección son muy largos'),
  
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ciudad es requerida'),
  
  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El departamento es requerido'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida'),
  
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Urgencia inválida'),
  
  body('neededDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Fecha inválida')
    .custom((value) => {
      if (!value) return true; // Si es null o vacío, es válido
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    })
    .withMessage('La fecha debe ser futura'),
  
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Máximo 5 imágenes permitidas'),
  
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('URL de imagen inválida'),
  
  handleValidationErrors
];

// ============================
// VALIDACIÓN PARA ACTUALIZAR TRABAJO
// ============================
const validateUpdateJob = [
  param('id')
    .isUUID()
    .withMessage('ID de trabajo inválido'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('La descripción debe tener entre 20 y 2000 caracteres'),
  
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Categoría inválida'),
  
  body('budgetAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El presupuesto debe ser un número positivo'),
  
  body('budgetType')
    .optional()
    .isIn(['fixed', 'hourly', 'negotiable'])
    .withMessage('Tipo de presupuesto inválido'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Dirección inválida'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ciudad inválida'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Departamento inválido'),
  
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Urgencia inválida'),
  
  body('neededDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha inválida'),
  
  handleValidationErrors
];

// ============================
// VALIDACIÓN PARA FILTROS DE BÚSQUEDA
// ============================
const validateJobFilters = [
  query('categoryId')
    .optional()
    .isUUID()
    .withMessage('ID de categoría inválido'),
  
  query('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ciudad inválida'),
  
  query('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Departamento inválido'),
  
  query('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Urgencia inválida'),
  
  query('budgetMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Presupuesto mínimo inválido'),
  
  query('budgetMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Presupuesto máximo inválido')
    .custom((value, { req }) => {
      if (req.query.budgetMin && parseFloat(value) < parseFloat(req.query.budgetMin)) {
        return false;
      }
      return true;
    })
    .withMessage('El presupuesto máximo debe ser mayor al mínimo'),
  
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida'),
  
  query('radiusKm')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Radio debe estar entre 1 y 100 km'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Límite debe estar entre 1 y 50'),
  
  query('sortBy')
    .optional()
    .isIn(['created_at', 'budget_amount', 'urgency', 'needed_date', 'distance'])
    .withMessage('Campo de ordenamiento inválido'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Orden debe ser ASC o DESC'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateJob,
  validateUpdateJob,
  validateJobFilters
};
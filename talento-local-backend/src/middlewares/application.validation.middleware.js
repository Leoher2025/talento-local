// src/middlewares/application.validation.middleware.js
// Middleware de validación para aplicaciones - CORREGIDO PARA UUID

const { body, param, query, validationResult } = require('express-validator');

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

// Función auxiliar para validar UUID
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// Validación para crear aplicación
const validateCreateApplication = [
  body('jobId')
    .notEmpty().withMessage('El ID del trabajo es requerido')
    .custom(isValidUUID).withMessage('ID de trabajo debe ser un UUID válido'),
  
  body('message')
    .notEmpty().withMessage('El mensaje es requerido')
    .isLength({ min: 20 }).withMessage('El mensaje debe tener al menos 20 caracteres')
    .isLength({ max: 1000 }).withMessage('El mensaje no puede exceder 1000 caracteres')
    .trim(),
  
  body('proposedBudget')
    .optional()
    .isFloat({ min: 0 }).withMessage('El presupuesto debe ser un número positivo'),
  
  handleValidationErrors
];

// Validación para cambio de estado
const validateApplicationStatus = [
  param('id')
    .notEmpty().withMessage('ID de aplicación requerido')
    .isUUID().withMessage('ID de aplicación debe ser un UUID válido'),
  
  handleValidationErrors
];

// Validación para filtros de aplicaciones
const validateApplicationFilters = [
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'cancelled', 'withdrawn'])
    .withMessage('Estado inválido'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  
  handleValidationErrors
];

// Validación para verificar si aplicó
const validateCheckApplication = [
  param('jobId')
    .notEmpty().withMessage('ID del trabajo requerido')
    .isUUID().withMessage('ID del trabajo debe ser un UUID válido'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateApplication,
  validateApplicationStatus,
  validateApplicationFilters,
  validateCheckApplication
};
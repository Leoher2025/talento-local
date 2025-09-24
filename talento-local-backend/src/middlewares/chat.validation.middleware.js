// src/middlewares/chat.validation.middleware.js
// Middleware completo de validación para el sistema de chat

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

// Validación para crear/obtener conversación
const validateCreateConversation = [
  body('jobId')
    .optional()
    .custom(isValidUUID).withMessage('ID de trabajo debe ser un UUID válido'),

  body('clientId')
    .notEmpty().withMessage('ID del cliente es requerido')
    .custom(isValidUUID).withMessage('ID del cliente debe ser un UUID válido'),

  body('workerId')
    .notEmpty().withMessage('ID del trabajador es requerido')
    .custom(isValidUUID).withMessage('ID del trabajador debe ser un UUID válido'),

  handleValidationErrors
];

// Validación para enviar mensaje
const validateSendMessage = [
  body('conversationId')
    .notEmpty().withMessage('ID de conversación es requerido')
    .custom(isValidUUID).withMessage('ID de conversación debe ser un UUID válido'),

  body('receiverId')
    .notEmpty().withMessage('ID del receptor es requerido')
    .custom(isValidUUID).withMessage('ID del receptor debe ser un UUID válido'),

  body('messageType')
    .optional()
    .isIn(['text', 'image', 'audio', 'file', 'system'])
    .withMessage('Tipo de mensaje inválido'),

  body('messageText')
    .if(body('messageType').equals('text') || body('messageType').isEmpty())
    .notEmpty().withMessage('El mensaje no puede estar vacío')
    .isLength({ max: 1000 }).withMessage('El mensaje no puede exceder 1000 caracteres')
    .trim(),

  body('fileUrl')
    .if(body('messageType').isIn(['image', 'audio', 'file']))
    .notEmpty().withMessage('URL del archivo es requerida')
    .isURL().withMessage('URL del archivo inválida'),

  body('fileName')
    .if(body('messageType').equals('file'))
    .notEmpty().withMessage('Nombre del archivo es requerido')
    .isLength({ max: 255 }).withMessage('Nombre del archivo muy largo'),

  body('fileSize')
    .if(body('messageType').isIn(['image', 'audio', 'file']))
    .optional()
    .isInt({ min: 0, max: 10485760 }).withMessage('Tamaño del archivo debe ser menor a 10MB'),

  handleValidationErrors
];

// Validación para parámetros de conversación
const validateConversationId = [
  param('conversationId')
    .notEmpty().withMessage('ID de conversación requerido')
    .custom(isValidUUID).withMessage('ID de conversación debe ser un UUID válido'),

  handleValidationErrors
];

// Validación para parámetros de mensaje
const validateMessageId = [
  param('messageId')
    .notEmpty().withMessage('ID de mensaje requerido')
    .custom(isValidUUID).withMessage('ID de mensaje debe ser un UUID válido'),

  handleValidationErrors
];

// Validación para filtros de conversaciones
const validateConversationFilters = [
  query('status')
    .optional()
    .isIn(['active', 'archived', 'blocked'])
    .withMessage('Estado de conversación inválido'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página debe ser un número positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
    .toInt(),

  handleValidationErrors
];

// Validación para filtros de mensajes
const validateMessageFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página debe ser un número positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
    .toInt(),

  handleValidationErrors
];

// Validación para archivar/desarchivar
const validateArchiveConversation = [
  body('archive')
    .optional()
    .isBoolean().withMessage('Archive debe ser booleano'),

  handleValidationErrors
];

// Validación para bloquear/desbloquear
const validateBlockConversation = [
  body('block')
    .optional()
    .isBoolean().withMessage('Block debe ser booleano'),

  handleValidationErrors
];

// Validar mensaje
const validateMessage = [
  body('message')
    .notEmpty().withMessage('El mensaje no puede estar vacío')
    .isLength({ min: 1, max: 5000 }).withMessage('El mensaje debe tener entre 1 y 5000 caracteres')
    .trim(),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'document', 'voice', 'location'])
    .withMessage('Tipo de mensaje inválido'),
  handleValidationErrors
];

// Validar reporte
const validateReport = [
  body('reason')
    .notEmpty().withMessage('La razón del reporte es requerida')
    .isIn(['spam', 'harassment', 'inappropriate', 'fraud', 'other'])
    .withMessage('Razón de reporte inválida'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres')
    .trim(),
  handleValidationErrors
];

module.exports = {
  validateCreateConversation,
  validateSendMessage,
  validateConversationId,
  validateMessageId,
  validateConversationFilters,
  validateMessageFilters,
  validateArchiveConversation,
  validateBlockConversation,
  validateMessage,
  validateReport
};
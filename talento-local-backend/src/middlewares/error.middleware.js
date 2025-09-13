// Manejo centralizado de errores
// Captura y formatea todos los errores de la aplicación

const logger = require('../utils/logger');

// Clase personalizada para errores de la aplicación
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log del error
  logger.error('Error capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  // Error de Mongoose - ID inválido
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = new AppError(message, 404);
  }
  
  // Error de Mongoose - Duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `El campo ${field} ya está en uso`;
    error = new AppError(message, 400);
  }
  
  // Error de Mongoose - Validación
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new AppError(message, 400);
  }
  
  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new AppError(message, 401);
  }
  
  // Error de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new AppError(message, 401);
  }
  
  // Error de PostgreSQL - Violación de llave foránea
  if (err.code === '23503') {
    const message = 'No se puede realizar esta operación debido a referencias existentes';
    error = new AppError(message, 400);
  }
  
  // Error de PostgreSQL - Violación de unicidad
  if (err.code === '23505') {
    const message = 'Ya existe un registro con estos datos';
    error = new AppError(message, 409);
  }
  
  // Error de PostgreSQL - Violación de not null
  if (err.code === '23502') {
    const message = 'Faltan campos requeridos';
    error = new AppError(message, 400);
  }
  
  // Respuesta de error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack
    })
  });
};

// Middleware para capturar errores asíncronos
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware para rutas no encontradas (404)
const notFound = (req, res, next) => {
  const message = `Ruta no encontrada - ${req.originalUrl}`;
  const error = new AppError(message, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};
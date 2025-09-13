// - Validación de datos de entrada
// Usa express-validator para validar y sanitizar datos

const { body, param, query, validationResult } = require('express-validator');

// ============================
// MANEJADOR DE ERRORES DE VALIDACIÓN
// ============================
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
// VALIDACIONES DE AUTENTICACIÓN
// ============================
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .toLowerCase(),
  
  body('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Número de teléfono inválido'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden'),
  
  body('role')
    .isIn(['client', 'worker'])
    .withMessage('Rol inválido'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me debe ser booleano'),
  
  handleValidationErrors
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .toLowerCase(),
  
  handleValidationErrors
];

const validateResetPassword = [
  param('token')
    .isHexadecimal()
    .withMessage('Token inválido')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token inválido'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Las contraseñas no coinciden'),
  
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('La nueva contraseña debe ser diferente a la actual'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Las contraseñas no coinciden'),
  
  handleValidationErrors
];

// ============================
// VALIDACIONES DE PERFIL
// ============================
const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La biografía no puede exceder 500 caracteres'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 100;
    })
    .withMessage('Debes tener entre 18 y 100 años'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Género inválido'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ciudad debe tener entre 2 y 100 caracteres'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El departamento debe tener entre 2 y 100 caracteres'),
  
  body('serviceRadiusKm')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El radio de servicio debe estar entre 1 y 100 km'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida'),
  
  handleValidationErrors
];

// ============================
// VALIDACIONES GENERALES
// ============================
const validateId = [
  param('id')
    .isUUID()
    .withMessage('ID inválido'),
  
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),
  
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'rating', 'distance'])
    .withMessage('Campo de ordenamiento inválido'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc'),
  
  handleValidationErrors
];

// ============================
// SANITIZACIÓN DE DATOS
// ============================
const sanitizeInput = (req, res, next) => {
  // Sanitizar strings en el body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remover espacios al inicio y final
        req.body[key] = req.body[key].trim();
        
        // Prevenir inyección de HTML/Scripts
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
  validateId,
  validatePagination,
  sanitizeInput
};
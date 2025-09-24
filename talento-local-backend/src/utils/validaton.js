// src/utils/validation.js

/**
 * Validar datos de registro de usuario
 */
const validateUserRegistration = (data) => {
  const errors = [];
  const { name, email, password, user_type } = data;

  // Validar nombre
  if (!name || name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Email inválido');
  }

  // Validar password
  if (!password || password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  // Validar tipo de usuario
  if (!user_type || !['client', 'worker'].includes(user_type)) {
    errors.push('Tipo de usuario inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar datos de login
 */
const validateUserLogin = (data) => {
  const errors = [];
  const { email, password } = data;

  if (!email) {
    errors.push('Email es requerido');
  }

  if (!password) {
    errors.push('Contraseña es requerida');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar datos de trabajo
 */
const validateJobData = (data) => {
  const errors = [];
  const { title, description, budget, category, location } = data;

  // Validar título
  if (!title || title.trim().length < 5) {
    errors.push('El título debe tener al menos 5 caracteres');
  }

  if (title && title.length > 100) {
    errors.push('El título no puede exceder 100 caracteres');
  }

  // Validar descripción
  if (!description || description.trim().length < 20) {
    errors.push('La descripción debe tener al menos 20 caracteres');
  }

  if (description && description.length > 2000) {
    errors.push('La descripción no puede exceder 2000 caracteres');
  }

  // Validar presupuesto
  if (!budget || isNaN(budget) || budget <= 0) {
    errors.push('El presupuesto debe ser un número mayor a 0');
  }

  if (budget && budget > 1000000) {
    errors.push('El presupuesto no puede exceder $1,000,000');
  }

  // Validar categoría
  const validCategories = [
    'desarrollo_web',
    'diseno_grafico',
    'redaccion',
    'marketing',
    'contabilidad',
    'consultoria',
    'traduccion',
    'fotografia',
    'video',
    'otros'
  ];

  if (!category || !validCategories.includes(category)) {
    errors.push('Categoría inválida');
  }

  // Validar ubicación
  if (!location || location.trim().length < 2) {
    errors.push('La ubicación debe tener al menos 2 caracteres');
  }

  if (location && location.length > 100) {
    errors.push('La ubicación no puede exceder 100 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar datos de aplicación
 */
const validateApplicationData = (data) => {
  const errors = [];
  const { jobId, message, proposedBudget } = data;

  // Validar jobId
  if (!jobId || isNaN(jobId) || jobId <= 0) {
    errors.push('ID de trabajo inválido');
  }

  // Validar mensaje
  if (!message || message.trim().length < 20) {
    errors.push('El mensaje debe tener al menos 20 caracteres');
  }

  if (message && message.length > 1000) {
    errors.push('El mensaje no puede exceder 1000 caracteres');
  }

  // Validar presupuesto propuesto
  if (!proposedBudget || isNaN(proposedBudget) || proposedBudget <= 0) {
    errors.push('El presupuesto propuesto debe ser un número mayor a 0');
  }

  if (proposedBudget && proposedBudget > 1000000) {
    errors.push('El presupuesto propuesto no puede exceder $1,000,000');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar datos de perfil de usuario
 */
const validateProfileData = (data) => {
  const errors = [];
  const { name, phone, bio, skills, location } = data;

  // Validar nombre (opcional en actualización)
  if (name && name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (name && name.length > 50) {
    errors.push('El nombre no puede exceder 50 caracteres');
  }

  // Validar teléfono (opcional)
  if (phone && phone.length > 20) {
    errors.push('El teléfono no puede exceder 20 caracteres');
  }

  // Validar biografía (opcional)
  if (bio && bio.length > 500) {
    errors.push('La biografía no puede exceder 500 caracteres');
  }

  // Validar habilidades (opcional)
  if (skills && (!Array.isArray(skills) || skills.length > 20)) {
    errors.push('Las habilidades deben ser un array con máximo 20 elementos');
  }

  // Validar ubicación (opcional)
  if (location && location.length > 100) {
    errors.push('La ubicación no puede exceder 100 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar email para reset de contraseña
 */
const validatePasswordReset = (data) => {
  const errors = [];
  const { email } = data;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Email inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar nueva contraseña
 */
const validateNewPassword = (data) => {
  const errors = [];
  const { password, confirmPassword } = data;

  if (!password || password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (password !== confirmPassword) {
    errors.push('Las contraseñas no coinciden');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar parámetros de paginación
 */
const validatePaginationParams = (data) => {
  const errors = [];
  let { page = 1, limit = 10 } = data;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) {
    errors.push('La página debe ser un número mayor a 0');
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    errors.push('El límite debe ser un número entre 1 y 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: { page, limit }
  };
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateJobData,
  validateApplicationData,
  validateProfileData,
  validatePasswordReset,
  validateNewPassword,
  validatePaginationParams
};
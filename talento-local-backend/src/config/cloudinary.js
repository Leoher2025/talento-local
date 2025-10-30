// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validar configuración
const validateConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.warn(`Cloudinary no configurado. Variables faltantes: ${missing.join(', ')}`);
    return false;
  }
  
  logger.info('Cloudinary configurado correctamente');
  return true;
};

validateConfig();

module.exports = cloudinary;
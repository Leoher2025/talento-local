// src/config/twilio.js
const twilio = require('twilio');
const logger = require('../utils/logger');

// Configurar cliente de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Validar configuración
const validateConfig = () => {
  if (!accountSid || !authToken || !phoneNumber) {
    logger.warn('Twilio no configurado. SMS deshabilitado en modo desarrollo.');
    return false;
  }
  
  try {
    client = twilio(accountSid, authToken);
    logger.info('Twilio configurado correctamente');
    return true;
  } catch (error) {
    logger.error('Error configurando Twilio:', error);
    return false;
  }
};

const isConfigured = validateConfig();

// Función para enviar SMS
const sendSMS = async (to, message) => {
  if (!isConfigured) {
    logger.warn(`[MODO DEV] SMS no enviado a ${to}: ${message}`);
    
    // En desarrollo, simular envío exitoso
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[SIMULADO] Código: ${message.match(/\d{6}/)?.[0] || 'N/A'}`);
      return { success: true, simulated: true };
    }
    
    throw new Error('Twilio no está configurado');
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: phoneNumber,
      to: to
    });

    logger.info(`SMS enviado exitosamente a ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error(`Error enviando SMS a ${to}:`, error);
    throw error;
  }
};

module.exports = {
  sendSMS,
  isConfigured
};
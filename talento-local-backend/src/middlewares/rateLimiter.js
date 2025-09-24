// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');

// Límite general de API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana
  message: 'Demasiadas solicitudes, por favor intente más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:api:'
  })
});

// Límite para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login
  message: 'Demasiados intentos de login, por favor intente más tarde',
  skipSuccessfulRequests: true,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:login:'
  })
});

// Límite para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora
  message: 'Demasiados registros desde esta IP, intente más tarde',
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:register:'
  })
});

// Límite para aplicaciones a trabajos
const applicationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 aplicaciones por hora
  message: 'Has alcanzado el límite de aplicaciones por hora',
  keyGenerator: (req) => req.user?.id || req.ip,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:applications:'
  })
});

// Límite para creación de trabajos
const jobCreationLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 20, // 20 trabajos por día
  message: 'Has alcanzado el límite de publicaciones por día',
  keyGenerator: (req) => req.user?.id || req.ip,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:jobs:'
  })
});

// Límite para mensajes de chat
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 mensajes por minuto
  message: 'Demasiados mensajes, por favor espere un momento',
  keyGenerator: (req) => req.user?.id || req.ip,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:messages:'
  })
});

// Límite para subida de archivos
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 uploads por hora
  message: 'Demasiadas subidas de archivos, intente más tarde',
  keyGenerator: (req) => req.user?.id || req.ip,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:uploads:'
  })
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  applicationLimit,
  jobCreationLimit,
  messageLimiter,
  uploadLimiter
};
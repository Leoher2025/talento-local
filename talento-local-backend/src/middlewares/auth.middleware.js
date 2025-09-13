// Middleware de autenticación y autorización
// Protege rutas y verifica permisos de usuarios

const TokenService = require('../services/token.service');
const UserModel = require('../models/user.model');
const logger = require('../utils/logger');

// ============================
// VERIFICAR AUTENTICACIÓN
// ============================
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso no proporcionado'
      });
    }
    
    // Extraer token
    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token
    const decoded = TokenService.verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso inválido o expirado'
      });
    }
    
    // Buscar usuario actualizado
    const user = await UserModel.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }
    
    // Verificar si el usuario está baneado
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta suspendida'
      });
    }
    
    // Adjuntar usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verification_status
    };
    
    next();
  } catch (error) {
    logger.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor al verificar autenticación'
    });
  }
};

// ============================
// VERIFICAR ROL
// ============================
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
    
    // Verificar que el usuario tenga uno de los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Acceso denegado: Usuario ${req.user.id} con rol ${req.user.role} intentó acceder a ruta con roles ${allowedRoles}`);
      
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }
    
    next();
  };
};

// ============================
// VERIFICAR VERIFICACIÓN DE EMAIL
// ============================
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  
  const verificationStatus = req.user.verificationStatus;
  
  if (verificationStatus === 'unverified' || verificationStatus === 'phone_verified') {
    return res.status(403).json({
      success: false,
      message: 'Debes verificar tu email para acceder a este recurso'
    });
  }
  
  next();
};

// ============================
// VERIFICAR VERIFICACIÓN COMPLETA
// ============================
const requireFullVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  
  if (req.user.verificationStatus !== 'fully_verified') {
    return res.status(403).json({
      success: false,
      message: 'Debes verificar tu cuenta completamente para acceder a este recurso'
    });
  }
  
  next();
};

// ============================
// AUTENTICACIÓN OPCIONAL
// ============================
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Si no hay token, continuar sin autenticar
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    // Intentar verificar token
    const token = authHeader.substring(7);
    const decoded = TokenService.verifyAccessToken(token);
    
    if (decoded) {
      const user = await UserModel.findById(decoded.id);
      if (user && user.is_active && !user.is_banned) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          verificationStatus: user.verification_status
        };
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // En caso de error, continuar sin autenticar
    req.user = null;
    next();
  }
};

// ============================
// RATE LIMITING POR USUARIO
// ============================
const userRateLimit = (maxRequests = 100, windowMinutes = 15) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    // Limpiar requests antiguos
    if (requests.has(userId)) {
      const userRequests = requests.get(userId);
      const recentRequests = userRequests.filter(
        timestamp => now - timestamp < windowMs
      );
      
      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Demasiadas peticiones. Por favor, intenta más tarde.'
        });
      }
      
      recentRequests.push(now);
      requests.set(userId, recentRequests);
    } else {
      requests.set(userId, [now]);
    }
    
    next();
  };
};

// ============================
// VERIFICAR PROPIETARIO DEL RECURSO
// ============================
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }
      
      const userId = req.user.id;
      const resourceId = req.params.id || req.params.userId;
      
      // Admins pueden acceder a todo
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Verificar propiedad según el tipo de recurso
      let isOwner = false;
      
      switch (resourceType) {
        case 'user':
          isOwner = userId === resourceId;
          break;
          
        case 'profile':
          const profileQuery = `
            SELECT user_id FROM profiles WHERE id = $1
          `;
          const profileResult = await require('../config/database').query(
            profileQuery,
            [resourceId]
          );
          isOwner = profileResult.rows[0]?.user_id === userId;
          break;
          
        // Agregar más casos según necesites
        default:
          isOwner = false;
      }
      
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error verificando propiedad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  requireEmailVerification,
  requireFullVerification,
  optionalAuth,
  userRateLimit,
  checkResourceOwnership
};
// Servicio de manejo de tokens JWT
// Genera, verifica y gestiona tokens de acceso y refresh

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class TokenService {
  // ============================
  // GENERAR ACCESS TOKEN
  // ============================
  static generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verification_status
    };
    
    const options = {
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'talento-local',
      audience: 'talento-local-app'
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  // ============================
  // GENERAR REFRESH TOKEN
  // ============================
  static async generateRefreshToken(userId, expiresIn = '7d') {
    // Generar token único
    const token = crypto.randomBytes(40).toString('hex');
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    const days = parseInt(expiresIn) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);
    
    // Guardar en base de datos
    const insertQuery = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, token
    `;
    
    await query(insertQuery, [userId, token, expiresAt]);
    
    logger.debug(`Refresh token generado para usuario ${userId}`);
    return token;
  }

  // ============================
  // VERIFICAR ACCESS TOKEN
  // ============================
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'talento-local',
        audience: 'talento-local-app'
      });
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Access token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Access token inválido');
      }
      return null;
    }
  }

  // ============================
  // RENOVAR ACCESS TOKEN
  // ============================
  static async refreshAccessToken(refreshToken) {
    try {
      // Verificar refresh token en BD
      const selectQuery = `
        SELECT rt.user_id, rt.expires_at, rt.revoked_at,
               u.email, u.role, u.verification_status
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = $1
      `;
      
      const result = await query(selectQuery, [refreshToken]);
      
      if (result.rows.length === 0) {
        logger.warn('Refresh token no encontrado');
        return null;
      }
      
      const tokenData = result.rows[0];
      
      // Verificar si fue revocado
      if (tokenData.revoked_at) {
        logger.warn('Intento de usar refresh token revocado');
        return null;
      }
      
      // Verificar si expiró
      if (new Date(tokenData.expires_at) < new Date()) {
        logger.debug('Refresh token expirado');
        return null;
      }
      
      // Generar nuevo access token
      const newAccessToken = this.generateAccessToken({
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role,
        verification_status: tokenData.verification_status
      });
      
      // Opcionalmente, rotar el refresh token
      const newRefreshToken = await this.generateRefreshToken(tokenData.user_id);
      
      // Revocar el refresh token anterior
      await this.revokeRefreshToken(refreshToken);
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Error renovando token:', error);
      return null;
    }
  }

  // ============================
  // REVOCAR REFRESH TOKEN
  // ============================
  static async revokeRefreshToken(token) {
    const updateQuery = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token = $1 AND revoked_at IS NULL
      RETURNING id
    `;
    
    const result = await query(updateQuery, [token]);
    
    if (result.rows.length > 0) {
      logger.debug('Refresh token revocado');
    }
    
    return result.rows.length > 0;
  }

  // ============================
  // REVOCAR TODOS LOS TOKENS DE UN USUARIO
  // ============================
  static async revokeAllUserTokens(userId) {
    const updateQuery = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND revoked_at IS NULL
      RETURNING id
    `;
    
    const result = await query(updateQuery, [userId]);
    
    logger.info(`${result.rowCount} tokens revocados para usuario ${userId}`);
    return result.rowCount;
  }

  // ============================
  // LIMPIAR TOKENS EXPIRADOS (CRON JOB)
  // ============================
  static async cleanExpiredTokens() {
    try {
      // Eliminar refresh tokens expirados o revocados hace más de 30 días
      const deleteRefreshQuery = `
        DELETE FROM refresh_tokens
        WHERE expires_at < CURRENT_TIMESTAMP
        OR (revoked_at IS NOT NULL AND revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
      `;
      
      const refreshResult = await query(deleteRefreshQuery);
      
      // Eliminar tokens de verificación usados o expirados
      const deleteVerificationQuery = `
        DELETE FROM verification_tokens
        WHERE used_at IS NOT NULL 
        OR expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days')
      `;
      
      const verificationResult = await query(deleteVerificationQuery);
      
      logger.info(`Limpieza de tokens: ${refreshResult.rowCount} refresh, ${verificationResult.rowCount} verificación`);
    } catch (error) {
      logger.error('Error limpiando tokens:', error);
    }
  }

  // ============================
  // GENERAR TOKEN DE VERIFICACIÓN
  // ============================
  static async generateVerificationToken(userId, type = 'email') {
    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    
    // Establecer expiración según el tipo
    const expiresAt = new Date();
    if (type === 'email') {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas
    } else if (type === 'password_reset') {
      expiresAt.setHours(expiresAt.getHours() + 2); // 2 horas
    } else if (type === 'phone') {
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos
    }
    
    // Guardar en base de datos
    const insertQuery = `
      INSERT INTO verification_tokens (user_id, token, type, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, token
    `;
    
    await query(insertQuery, [userId, token, type, expiresAt]);
    
    logger.debug(`Token de ${type} generado para usuario ${userId}`);
    return token;
  }

  // ============================
  // VERIFICAR TOKEN DE VERIFICACIÓN
  // ============================
  static async verifyVerificationToken(token, type) {
    const selectQuery = `
      SELECT user_id, expires_at, used_at
      FROM verification_tokens
      WHERE token = $1 AND type = $2
    `;
    
    const result = await query(selectQuery, [token, type]);
    
    if (result.rows.length === 0) {
      return { valid: false, reason: 'Token no encontrado' };
    }
    
    const tokenData = result.rows[0];
    
    if (tokenData.used_at) {
      return { valid: false, reason: 'Token ya utilizado' };
    }
    
    if (new Date(tokenData.expires_at) < new Date()) {
      return { valid: false, reason: 'Token expirado' };
    }
    
    return { valid: true, userId: tokenData.user_id };
  }
}

module.exports = TokenService;
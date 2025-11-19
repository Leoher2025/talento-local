// src/models/verification.model.js
// Modelo para gestión de verificaciones (SMS, Email)
const { query } = require('../config/database');
const logger = require('../utils/logger');

class VerificationModel {
  // ============================
  // CREAR CÓDIGO DE VERIFICACIÓN
  // ============================
  static async createCode(userId, phone, code, type = 'sms') {
    try {
      // Eliminar códigos anteriores no verificados del mismo tipo
      await query(
        'DELETE FROM verification_codes WHERE user_id = $1 AND type = $2 AND is_verified = false',
        [userId, type]
      );

      // Crear nuevo código (expira en 10 minutos)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const insertQuery = `
        INSERT INTO verification_codes (
          user_id, phone, code, type, expires_at
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await query(insertQuery, [
        userId,
        phone,
        code,
        type,
        expiresAt
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creando código de verificación:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICAR CÓDIGO
  // ============================
  static async verifyCode(userId, code, type = 'sms') {
    try {
      const selectQuery = `
        SELECT * FROM verification_codes
        WHERE user_id = $1 
          AND code = $2 
          AND type = $3
          AND is_verified = false
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await query(selectQuery, [userId, code, type]);

      if (result.rows.length === 0) {
        return null;
      }

      const verification = result.rows[0];

      // Marcar como verificado
      const updateQuery = `
        UPDATE verification_codes
        SET is_verified = true, verified_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const updated = await query(updateQuery, [verification.id]);

      return updated.rows[0];
    } catch (error) {
      logger.error('Error verificando código:', error);
      throw error;
    }
  }

  // ============================
  // INCREMENTAR INTENTOS
  // ============================
  static async incrementAttempts(userId, type = 'sms') {
    try {
      const updateQuery = `
        UPDATE verification_codes
        SET attempts = attempts + 1
        WHERE user_id = $1 
          AND type = $2
          AND is_verified = false
        RETURNING *
      `;

      const result = await query(updateQuery, [userId, type]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error incrementando intentos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER CÓDIGO ACTIVO
  // ============================
  static async getActiveCode(userId, type = 'sms') {
    try {
      const selectQuery = `
        SELECT * FROM verification_codes
        WHERE user_id = $1 
          AND type = $2
          AND is_verified = false
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await query(selectQuery, [userId, type]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo código activo:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR TELÉFONO COMO VERIFICADO
  // ============================
  static async markPhoneVerified(userId, phone) {
    try {
      const updateQuery = `
        UPDATE users
        SET 
          phone = $1,
          phone_verified = true,
          phone_verified_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [phone, userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error marcando teléfono como verificado:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICAR SI TELÉFONO ESTÁ EN USO
  // ============================
  static async isPhoneInUse(phone, excludeUserId = null) {
    try {
      let selectQuery = 'SELECT id FROM users WHERE phone = $1 AND phone_verified = true';
      const params = [phone];

      if (excludeUserId) {
        selectQuery += ' AND id != $2';
        params.push(excludeUserId);
      }

      const result = await query(selectQuery, params);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando teléfono:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR FOTO DE PERFIL COMO VERIFICADA
  // ============================
  static async markProfilePictureVerified(userId) {
    try {
      const updateQuery = `
        UPDATE users
        SET profile_picture_verified = true
        WHERE id = $1
        RETURNING *
      `;

      const result = await query(updateQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error marcando foto como verificada:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER ESTADO DE VERIFICACIÓN
  // ============================
  static async getVerificationStatus(userId) {
    try {
      const selectQuery = `
      SELECT 
        u.email,
        u.verification_status,
        u.phone,
        u.phone_verified,
        u.phone_verified_at,
        p.profile_picture_url,
        u.profile_picture_verified
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `;

      const result = await query(selectQuery, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];

      return {
        email_verified: user.verification_status === 'verified',
        phone_verified: user.phone_verified || false,
        profile_picture_verified: user.profile_picture_verified || false,
        has_profile_picture: !!user.profile_picture_url,
        is_fully_verified:
          user.verification_status === 'verified' &&
          user.phone_verified === true &&
          user.profile_picture_verified === true
      };
    } catch (error) {
      logger.error('Error obteniendo estado de verificación:', error);
      throw error;
    }
  }  
  // ============================
  // LIMPIAR CÓDIGOS EXPIRADOS
  // ============================
  static async cleanExpiredCodes() {
    try {
      const deleteQuery = `
        DELETE FROM verification_codes
        WHERE expires_at < NOW() AND is_verified = false
      `;

      const result = await query(deleteQuery);
      logger.info(`Códigos expirados eliminados: ${result.rowCount}`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error limpiando códigos expirados:', error);
      throw error;
    }
  }
}

module.exports = VerificationModel;
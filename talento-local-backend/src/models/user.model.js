// - Modelo de Usuario
// Maneja todas las operaciones de base de datos relacionadas con usuarios

const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class UserModel {
  // ============================
  // CREAR USUARIO
  // ============================
  static async create(userData) {
    const { email, phone, password, role } = userData;
    
    try {
      // Encriptar contraseña
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Query SQL para insertar usuario
      const insertQuery = `
        INSERT INTO users (email, phone, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, phone, role, verification_status, created_at
      `;
      
      const values = [email.toLowerCase(), phone, passwordHash, role];
      const result = await query(insertQuery, values);
      
      logger.info('✅ Usuario creado:', email);
      return result.rows[0];
    } catch (error) {
      // Manejo de errores específicos
      if (error.code === '23505') { // Violación de unicidad
        if (error.constraint === 'users_email_key') {
          throw new Error('El email ya está registrado');
        }
        if (error.constraint === 'users_phone_key') {
          throw new Error('El número de teléfono ya está registrado');
        }
      }
      throw error;
    }
  }

  // ============================
  // BUSCAR USUARIO POR EMAIL
  // ============================
  static async findByEmail(email) {
    const selectQuery = `
      SELECT 
        id, email, phone, password_hash, role, 
        verification_status, is_active, is_banned,
        email_verified_at, phone_verified_at,
        last_login_at, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;
    
    const result = await query(selectQuery, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  // ============================
  // BUSCAR USUARIO POR ID
  // ============================
  static async findById(id) {
    const selectQuery = `
      SELECT 
        id, email, phone, role, 
        verification_status, is_active, is_banned,
        email_verified_at, phone_verified_at,
        last_login_at, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    
    const result = await query(selectQuery, [id]);
    return result.rows[0] || null;
  }

  // ============================
  // BUSCAR USUARIO POR TELÉFONO
  // ============================
  static async findByPhone(phone) {
    const selectQuery = `
      SELECT 
        id, email, phone, password_hash, role,
        verification_status, is_active, is_banned,
        created_at, updated_at
      FROM users 
      WHERE phone = $1
    `;
    
    const result = await query(selectQuery, [phone]);
    return result.rows[0] || null;
  }

  // ============================
  // VERIFICAR CONTRASEÑA
  // ============================
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ============================
  // ACTUALIZAR ÚLTIMO LOGIN
  // ============================
  static async updateLastLogin(userId) {
    const updateQuery = `
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING last_login_at
    `;
    
    const result = await query(updateQuery, [userId]);
    return result.rows[0];
  }

  // ============================
  // VERIFICAR EMAIL
  // ============================
  static async verifyEmail(userId) {
    const updateQuery = `
      UPDATE users 
      SET 
        email_verified_at = CURRENT_TIMESTAMP,
        verification_status = CASE 
          WHEN phone_verified_at IS NOT NULL THEN 'fully_verified'::verification_status
          ELSE 'email_verified'::verification_status
        END
      WHERE id = $1
      RETURNING verification_status, email_verified_at
    `;
    
    const result = await query(updateQuery, [userId]);
    return result.rows[0];
  }

  // ============================
  // VERIFICAR TELÉFONO
  // ============================
  static async verifyPhone(userId) {
    const updateQuery = `
      UPDATE users 
      SET 
        phone_verified_at = CURRENT_TIMESTAMP,
        verification_status = CASE 
          WHEN email_verified_at IS NOT NULL THEN 'fully_verified'::verification_status
          ELSE 'phone_verified'::verification_status
        END
      WHERE id = $1
      RETURNING verification_status, phone_verified_at
    `;
    
    const result = await query(updateQuery, [userId]);
    return result.rows[0];
  }

  // ============================
  // CAMBIAR CONTRASEÑA
  // ============================
  static async updatePassword(userId, newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email
    `;
    
    const result = await query(updateQuery, [passwordHash, userId]);
    return result.rows[0];
  }

  // ============================
  // ACTUALIZAR USUARIO
  // ============================
  static async update(userId, updateData) {
    // Construir query dinámicamente basado en los campos a actualizar
    const allowedFields = ['email', 'phone', 'role', 'is_active'];
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }
    
    values.push(userId);
    
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${paramCount}
      RETURNING id, email, phone, role, verification_status, is_active
    `;
    
    const result = await query(updateQuery, values);
    return result.rows[0];
  }

  // ============================
  // VERIFICAR SI USUARIO EXISTE
  // ============================
  static async exists(email, phone = null) {
    let checkQuery;
    let values;
    
    if (phone) {
      checkQuery = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE email = $1 OR phone = $2
      `;
      values = [email.toLowerCase(), phone];
    } else {
      checkQuery = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE email = $1
      `;
      values = [email.toLowerCase()];
    }
    
    const result = await query(checkQuery, values);
    return parseInt(result.rows[0].count) > 0;
  }

  // ============================
  // ELIMINAR USUARIO (SOFT DELETE)
  // ============================
  static async softDelete(userId) {
    const updateQuery = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, is_active
    `;
    
    const result = await query(updateQuery, [userId]);
    return result.rows[0];
  }

  // ============================
  // BANEAR/DESBANEAR USUARIO
  // ============================
  static async setBanStatus(userId, isBanned) {
    const updateQuery = `
      UPDATE users 
      SET is_banned = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, is_banned
    `;
    
    const result = await query(updateQuery, [isBanned, userId]);
    return result.rows[0];
  }
}

module.exports = UserModel;
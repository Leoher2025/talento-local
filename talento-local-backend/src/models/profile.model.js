// src/models/profile.model.js
// Modelo para manejo de perfiles de usuario

const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

class ProfileModel {
  // ============================
  // OBTENER PERFIL POR USER ID
  // ============================
  static async getByUserId(userId) {
    try {
      const selectQuery = `
      SELECT 
        p.*,
        u.email,
        u.phone,
        u.role,
        u.verification_status,
        u.is_active,
        u.created_at as user_created_at,
        -- Estadísticas de reviews
        COALESCE(
          (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id),
          0
        ) as total_reviews,
        COALESCE(
          (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE reviewee_id = u.id),
          0
        ) as avg_rating,
        -- Contador de fotos de galería (NUEVO)
        COALESCE(
          (SELECT COUNT(*) FROM gallery_photos WHERE worker_id = u.id),
          0
        ) as gallery_photos_count
      FROM profiles p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `;

      const result = await query(selectQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR PERFIL
  // ============================
  static async update(userId, profileData) {
    try {
      const allowedFields = [
        'first_name',
        'last_name',
        'display_name',
        'bio',
        'profile_picture_url',
        'city',
        'department',
        'address',
        'skills',
        'experience',
        'hourly_rate',
        'availability_status',
        'latitude',
        'longitude'
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

      // Construir query dinámicamente
      for (const [key, value] of Object.entries(profileData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        return await this.getByUserId(userId);
      }

      values.push(userId);

      const updateQuery = `
        UPDATE profiles
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramCount}
        RETURNING *
      `;

      const result = await query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new Error('Perfil no encontrado');
      }

      // Retornar perfil actualizado con datos del usuario
      return await this.getByUserId(userId);
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR FOTO DE PERFIL
  // ============================
  static async updateProfilePicture(userId, imageUrl) {
    try {
      const updateQuery = `
        UPDATE profiles
        SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [imageUrl, userId]);

      if (result.rows.length === 0) {
        throw new Error('Perfil no encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando foto de perfil:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR FOTO DE PERFIL
  // ============================
  static async deleteProfilePicture(userId) {
    try {
      const updateQuery = `
        UPDATE profiles
        SET profile_picture_url = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [userId]);

      if (result.rows.length === 0) {
        throw new Error('Perfil no encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error eliminando foto de perfil:', error);
      throw error;
    }
  }

  // ============================
  // GALERÍA DE TRABAJOS
  // ============================
  static async addGalleryPhoto(userId, photoData) {
    try {
      const insertQuery = `
        INSERT INTO work_gallery (worker_id, image_url, thumbnail_url, caption, display_order)
        VALUES ($1, $2, $3, $4, COALESCE(
          (SELECT MAX(display_order) + 1 FROM work_gallery WHERE worker_id = $1),
          1
        ))
        RETURNING *
      `;

      const values = [
        userId,
        photoData.image_url,
        photoData.thumbnail_url || photoData.image_url,
        photoData.caption || ''
      ];

      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error agregando foto a galería:', error);
      throw error;
    }
  }

  static async getGallery(workerId) {
    try {
      const selectQuery = `
        SELECT *
        FROM work_gallery
        WHERE worker_id = $1
        ORDER BY display_order, created_at DESC
      `;

      const result = await query(selectQuery, [workerId]);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo galería:', error);
      throw error;
    }
  }

  static async deleteGalleryPhoto(photoId, userId) {
    try {
      const deleteQuery = `
        DELETE FROM work_gallery
        WHERE id = $1 AND worker_id = $2
        RETURNING *
      `;

      const result = await query(deleteQuery, [photoId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Foto no encontrada o sin permisos');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error eliminando foto de galería:', error);
      throw error;
    }
  }

  // ============================
  // ESTADÍSTICAS
  // ============================
  static async getStats(userId) {
    try {
      const statsQuery = `
        SELECT 
          p.rating_average,
          p.total_ratings,
          p.total_jobs_completed,
          p.response_time_minutes,
          p.completion_rate,
          u.created_at as member_since,
          (
            SELECT COUNT(*) 
            FROM jobs 
            WHERE client_id = $1 OR assigned_worker_id = $1
          ) as total_jobs,
          (
            SELECT COUNT(*) 
            FROM jobs 
            WHERE (client_id = $1 OR assigned_worker_id = $1) 
            AND status = 'completed'
          ) as completed_jobs,
          (
            SELECT COUNT(*) 
            FROM jobs 
            WHERE assigned_worker_id = $1 
            AND status = 'in_progress'
          ) as active_jobs
        FROM profiles p
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.user_id = $1
      `;

      const result = await query(statsQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR CONFIGURACIÓN
  // ============================
  static async updateSettings(userId, settings) {
    try {
      const { notifications, privacy } = settings;

      if (notifications) {
        const notifQuery = `
          UPDATE profiles
          SET 
            notification_new_jobs = COALESCE($1, notification_new_jobs),
            notification_messages = COALESCE($2, notification_messages),
            notification_applications = COALESCE($3, notification_applications),
            notification_promotions = COALESCE($4, notification_promotions),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $5
          RETURNING *
        `;

        await query(notifQuery, [
          notifications.new_jobs,
          notifications.messages,
          notifications.applications,
          notifications.promotions,
          userId
        ]);
      }

      if (privacy) {
        const privacyQuery = `
          UPDATE profiles
          SET 
            show_phone = COALESCE($1, show_phone),
            show_email = COALESCE($2, show_email),
            show_location = COALESCE($3, show_location),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $4
          RETURNING *
        `;

        await query(privacyQuery, [
          privacy.show_phone,
          privacy.show_email,
          privacy.show_location,
          userId
        ]);
      }

      return await this.getByUserId(userId);
    } catch (error) {
      logger.error('Error actualizando configuración:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR TELÉFONO
  // ============================
  static async updatePhone(userId, phone) {
    try {
      const updateQuery = `
        UPDATE users
        SET phone = $1, phone_verified_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING phone
      `;

      const result = await query(updateQuery, [phone, userId]);

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando teléfono:', error);
      throw error;
    }
  }

  // ============================
  // Estadisticas
  // ============================

  static async getByUserId(userId) {
    try {
      const selectQuery = `
      SELECT 
        p.*,
        u.email,
        u.phone,
        u.role,
        u.verification_status,
        u.is_active,
        u.created_at as user_created_at,
        -- Estadísticas de reviews
        COALESCE(
          (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id),
          0
        ) as total_reviews,
        COALESCE(
          (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE reviewee_id = u.id),
          0
        ) as avg_rating
      FROM profiles p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `;

      const result = await query(selectQuery, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  // ============================
  // BUSCAR TRABAJADORES CON FILTROS
  // ============================
  static async searchWorkers(filters = {}) {
    try {
      const {
        search,
        categoryId,
        city,
        department,
        minRating,
        latitude,
        longitude,
        radiusKm = 50,
        sortBy = 'rating_average',
        sortOrder = 'DESC',
        page = 1,
        limit = 20
      } = filters;

      let whereConditions = ["u.role = 'worker'", "u.is_active = true"];
      let queryParams = [];
      let paramIndex = 1;
      let joins = `LEFT JOIN users u ON p.user_id = u.id`;

      // Filtro por categoría
      if (categoryId) {
        joins += ` INNER JOIN worker_categories wc ON u.id = wc.worker_id`;
        whereConditions.push(`wc.category_id = $${paramIndex}`);
        queryParams.push(categoryId);
        paramIndex++;
      }

      // Búsqueda de texto
      if (search && search.trim()) {
        whereConditions.push(
          `(p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.skills ILIKE $${paramIndex} OR p.bio ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      // Filtro por ciudad
      if (city) {
        whereConditions.push(`p.city ILIKE $${paramIndex}`);
        queryParams.push(`%${city}%`);
        paramIndex++;
      }

      // Filtro por departamento
      if (department) {
        whereConditions.push(`p.department ILIKE $${paramIndex}`);
        queryParams.push(`%${department}%`);
        paramIndex++;
      }

      // Filtro por rating mínimo
      if (minRating) {
        whereConditions.push(`p.rating_average >= $${paramIndex}`);
        queryParams.push(minRating);
        paramIndex++;
      }

      // Agregar cálculo de distancia si hay coordenadas
      let distanceSelect = '';
      if (latitude && longitude) {
        distanceSelect = `,
        (
          6371 * acos(
            cos(radians($${paramIndex})) * 
            cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians($${paramIndex + 1})) + 
            sin(radians($${paramIndex})) * 
            sin(radians(p.latitude))
          )
        ) as distance_km
      `;
        queryParams.push(latitude, longitude);
        paramIndex += 2;

        if (radiusKm) {
          whereConditions.push(`
          (
            6371 * acos(
              cos(radians($${paramIndex - 2})) * 
              cos(radians(p.latitude)) * 
              cos(radians(p.longitude) - radians($${paramIndex - 1})) + 
              sin(radians($${paramIndex - 2})) * 
              sin(radians(p.latitude))
            )
          ) <= ${radiusKm}
        `);
        }
      }

      // Ordenamiento
      const validSortFields = {
        'rating_average': 'p.rating_average',
        'completed_jobs': 'completed_jobs',
        'created_at': 'p.created_at',
        'distance': 'distance_km'
      };

      let orderByClause = 'p.rating_average DESC';

      if (validSortFields[sortBy]) {
        const sortField = validSortFields[sortBy];
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        orderByClause = `${sortField} ${order}`;

        if (sortBy === 'distance' && (!latitude || !longitude)) {
          orderByClause = 'p.rating_average DESC';
        }
      }

      // Paginación
      const offset = (page - 1) * limit;

      // Query principal (con categorías)
      const mainQuery = `
      SELECT DISTINCT ON (p.user_id)
        p.*,
        u.email,
        u.role,
        u.verification_status,
        (
          SELECT COUNT(*) 
          FROM jobs 
          WHERE assigned_worker_id = u.id AND status = 'completed'
        ) as completed_jobs,
        (
          SELECT COUNT(*) 
          FROM reviews 
          WHERE reviewee_id = u.id
        ) as total_reviews
        ${distanceSelect}
      FROM profiles p
      ${joins}
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.user_id, ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

      queryParams.push(limit, offset);

      // ✅ Query de conteo (SIN columnas JSON, solo contar)
      const countQuery = `
      SELECT COUNT(DISTINCT p.user_id) as total
      FROM profiles p
      ${joins}
      WHERE ${whereConditions.join(' AND ')}
    `;

      const [workersResult, countResult] = await Promise.all([
        query(mainQuery, queryParams),
        query(countQuery, queryParams.slice(0, -2))
      ]);

      // ✅ Obtener categorías por separado para cada trabajador
      const workersWithCategories = await Promise.all(
        workersResult.rows.map(async (worker) => {
          const categoriesResult = await query(
            `SELECT 
            wc.category_id,
            c.name as category_name,
            c.icon as category_icon,
            wc.experience_years,
            wc.is_primary
           FROM worker_categories wc
           INNER JOIN categories c ON wc.category_id = c.id
           WHERE wc.worker_id = $1
           ORDER BY wc.is_primary DESC, wc.created_at ASC`,
            [worker.user_id]
          );

          return {
            ...worker,
            categories: categoriesResult.rows
          };
        })
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        workers: workersWithCategories,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error buscando trabajadores:', error);
      throw error;
    }
  }
  // ============================
  // OBTENER CATEGORÍAS DEL TRABAJADOR
  // ============================
  static async getWorkerCategories(userId) {
    try {
      const result = await query(
        `SELECT 
        wc.*,
        c.name as category_name,
        c.icon as category_icon
       FROM worker_categories wc
       INNER JOIN categories c ON wc.category_id = c.id
       WHERE wc.worker_id = $1
       ORDER BY wc.is_primary DESC, wc.created_at ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo categorías del trabajador:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR CATEGORÍAS DEL TRABAJADOR
  // ============================
  static async updateWorkerCategories(userId, categories) {
    try {
      // categories es un array de objetos: [{ categoryId, experienceYears, isPrimary }]

      // Eliminar categorías existentes
      await query(
        'DELETE FROM worker_categories WHERE worker_id = $1',
        [userId]
      );

      // Insertar nuevas categorías
      if (categories && categories.length > 0) {
        const values = categories.map((cat, index) => {
          const baseIndex = index * 4 + 1;
          return `($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
        }).join(', ');

        const params = categories.flatMap(cat => [
          userId,
          cat.categoryId,
          cat.experienceYears || 0,
          cat.isPrimary || false
        ]);

        await query(
          `INSERT INTO worker_categories (worker_id, category_id, experience_years, is_primary)
         VALUES ${values}`,
          params
        );
      }

      logger.info(`Categorías actualizadas para trabajador ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error actualizando categorías del trabajador:', error);
      throw error;
    }
  }

  // Al final de la clase ProfileModel, ANTES de module.exports

  // ============================
  // ACTUALIZAR UBICACIÓN CON COORDENADAS
  // ============================
  static async updateLocation(userId, locationData) {
    try {
      const { city, department, latitude, longitude } = locationData;

      const updateQuery = `
      UPDATE profiles
      SET 
        city = $1,
        department = $2,
        latitude = $3,
        longitude = $4,
        location_updated_at = NOW()
      WHERE user_id = $5
      RETURNING *
    `;

      const result = await query(updateQuery, [
        city,
        department,
        latitude,
        longitude,
        userId
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando ubicación:', error);
      throw error;
    }
  }

  // ============================
  // BUSCAR TRABAJADORES CERCANOS
  // ============================
  static async getNearbyWorkers({ latitude, longitude, radius = 10, categoryId = null, minRating = null, limit = 50 }) {
    try {
      let queryText = `
      SELECT 
        p.*,
        u.email,
        u.phone,
        u.role,
        u.verification_status,
        u.phone_verified,
        u.profile_picture_verified,
        calculate_distance($1, $2, p.latitude, p.longitude) as distance_km,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM profiles p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN reviews r ON p.user_id = r.reviewee_id
      WHERE 
        u.role = 'worker'
        AND u.is_active = true
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        AND calculate_distance($1, $2, p.latitude, p.longitude) <= $3
    `;

      const params = [latitude, longitude, radius];
      let paramIndex = 4;

      // Filtro por categoría
      if (categoryId) {
        queryText += ` AND $${paramIndex} = ANY(p.skills)`;
        params.push(categoryId);
        paramIndex++;
      }

      queryText += `
      GROUP BY p.id,p.user_id, p.first_name, p.last_name, p.bio, p.profile_picture_url, 
               p.city, p.department, p.latitude, p.longitude,
              p.created_at, p.updated_at,
               u.email, u.phone, u.role, u.verification_status, u.phone_verified, u.profile_picture_verified
    `;

      // Filtro por calificación mínima
      if (minRating) {
        queryText += ` HAVING COALESCE(AVG(r.rating), 0) >= $${paramIndex}`;
        params.push(minRating);
        paramIndex++;
      }

      queryText += `
      ORDER BY distance_km ASC
      LIMIT $${paramIndex}
    `;
      params.push(limit);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      logger.error('Error buscando trabajadores cercanos:', error);
      throw error;
    }
  }
}

module.exports = ProfileModel;
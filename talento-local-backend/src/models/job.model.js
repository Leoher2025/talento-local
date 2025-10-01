// - Modelo para manejo de trabajos
const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

class JobModel {
  // ============================
  // CREAR TRABAJO
  // ============================
  static async create(jobData, clientId) {
    try {
      const {
        title,
        description,
        categoryId,
        budgetAmount,
        budgetType,
        address,
        addressDetails,
        city,
        department,
        latitude,
        longitude,
        urgency,
        neededDate,
        images = []
      } = jobData;

      return await transaction(async (client) => {
        // 1. Insertar el trabajo
        const jobQuery = `
          INSERT INTO jobs (
            title, description, category_id, 
            budget_amount, budget_type,
            address, address_details, city, department,
            latitude, longitude,
            urgency, needed_date, client_id,
            status, published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *
        `;

        const jobValues = [
          title,
          description,
          categoryId,
          budgetAmount || null,
          budgetType || 'negotiable',
          address,
          addressDetails || null,
          city,
          department,
          latitude || null,
          longitude || null,
          urgency || 'medium',
          neededDate || null,
          clientId,
          'active',
          new Date()
        ];

        const jobResult = await client.query(jobQuery, jobValues);
        const job = jobResult.rows[0];

        // 2. Insertar imágenes si hay
        if (images.length > 0) {
          const imageValues = images.map((img, index) =>
            `('${job.id}', '${img.url}', '${img.thumbnail || img.url}', '${img.caption || ''}', ${index})`
          ).join(',');

          const imageQuery = `
            INSERT INTO job_images (job_id, image_url, thumbnail_url, caption, display_order)
            VALUES ${imageValues}
          `;

          await client.query(imageQuery);
        }

        logger.info(`✅ Trabajo creado: ${job.id}`);
        return job;
      });
    } catch (error) {
      logger.error('Error creando trabajo:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TRABAJOS ACTIVOS
  // ============================
  static async getActiveJobs(filters = {}) {
    try {
      const {
        categoryId,
        city,
        department,
        urgency,
        budgetMin,
        budgetMax,
        latitude,
        longitude,
        radiusKm = 10,
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = filters;

      let whereConditions = ['j.status = $1'];
      let values = ['active'];
      let paramCount = 1;

      // Filtros opcionales
      if (categoryId) {
        paramCount++;
        whereConditions.push(`j.category_id = $${paramCount}`);
        values.push(categoryId);
      }

      if (city) {
        paramCount++;
        whereConditions.push(`LOWER(j.city) = LOWER($${paramCount})`);
        values.push(city);
      }

      if (department) {
        paramCount++;
        whereConditions.push(`LOWER(j.department) = LOWER($${paramCount})`);
        values.push(department);
      }

      if (urgency) {
        paramCount++;
        whereConditions.push(`j.urgency = $${paramCount}`);
        values.push(urgency);
      }

      if (budgetMin) {
        paramCount++;
        whereConditions.push(`j.budget_amount >= $${paramCount}`);
        values.push(budgetMin);
      }

      if (budgetMax) {
        paramCount++;
        whereConditions.push(`j.budget_amount <= $${paramCount}`);
        values.push(budgetMax);
      }

      // Filtro por distancia (si se proporcionan coordenadas)
      let distanceSelect = '';
      let distanceJoin = '';
      let distanceWhere = '';
      let distanceOrder = '';

      if (latitude && longitude) {
        distanceSelect = `, 
          ST_Distance(
            ST_MakePoint(j.longitude, j.latitude)::geography,
            ST_MakePoint($${paramCount + 1}, $${paramCount + 2})::geography
          ) / 1000 as distance_km`;

        distanceWhere = ` AND ST_DWithin(
          ST_MakePoint(j.longitude, j.latitude)::geography,
          ST_MakePoint($${paramCount + 1}, $${paramCount + 2})::geography,
          $${paramCount + 3} * 1000
        )`;

        values.push(longitude, latitude, radiusKm);
        paramCount += 3;

        if (sortBy === 'distance') {
          distanceOrder = 'distance_km';
        }
      }

      // Construir query
      const whereClause = whereConditions.join(' AND ');
      const orderBy = distanceOrder || `j.${sortBy}`;
      const offset = (page - 1) * limit;

      const selectQuery = `
        SELECT 
          j.*,
          c.name as category_name,
          c.icon as category_icon,
          u.email as client_email,
          p.first_name as client_first_name,
          p.last_name as client_last_name,
          p.profile_picture_url as client_picture,
          p.rating_average as client_rating,
          COALESCE(j.applications_count, 0) as applications_count,
          array_agg(
            DISTINCT jsonb_build_object(
              'id', ji.id,
              'url', ji.image_url,
              'thumbnail', ji.thumbnail_url,
              'caption', ji.caption
            )
          ) FILTER (WHERE ji.id IS NOT NULL) as images
          ${distanceSelect}
        FROM jobs j
        LEFT JOIN categories c ON j.category_id = c.id
        LEFT JOIN users u ON j.client_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN job_images ji ON j.id = ji.job_id
        WHERE ${whereClause} ${distanceWhere}
        GROUP BY j.id, c.name, c.icon, u.email, p.first_name, p.last_name, 
                 p.profile_picture_url, p.rating_average
        ORDER BY ${orderBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      values.push(limit, offset);

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM jobs j
        WHERE ${whereClause} ${distanceWhere}
      `;

      // Ejecutar queries
      const [jobsResult, countResult] = await Promise.all([
        query(selectQuery, values),
        query(countQuery, values.slice(0, -2)) // Sin limit y offset
      ]);

      return {
        jobs: jobsResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page,
          limit,
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Error obteniendo trabajos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TRABAJO POR ID
  // ============================
  static async getById(jobId) {
    try {
      const selectQuery = `
        SELECT 
          j.*,
          c.name as category_name,
          c.icon as category_icon,
          u.email as client_email,
          p.first_name as client_first_name,
          p.last_name as client_last_name,
          p.profile_picture_url as client_picture,
          p.rating_average as client_rating,
          p.total_jobs_completed as client_jobs_completed,
          w.email as worker_email,
          wp.first_name as worker_first_name,
          wp.last_name as worker_last_name,
          wp.profile_picture_url as worker_picture,
          wp.rating_average as worker_rating,
          array_agg(
            DISTINCT jsonb_build_object(
              'id', ji.id,
              'url', ji.image_url,
              'thumbnail', ji.thumbnail_url,
              'caption', ji.caption,
              'order', ji.display_order
            )
          ) FILTER (WHERE ji.id IS NOT NULL) as images
        FROM jobs j
        LEFT JOIN categories c ON j.category_id = c.id
        LEFT JOIN users u ON j.client_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN users w ON j.assigned_worker_id = w.id
        LEFT JOIN profiles wp ON w.id = wp.user_id
        LEFT JOIN job_images ji ON j.id = ji.job_id
        WHERE j.id = $1
        GROUP BY j.id, c.name, c.icon, u.email, p.first_name, p.last_name,
                 p.profile_picture_url, p.rating_average, p.total_jobs_completed,
                 w.email, wp.first_name, wp.last_name, wp.profile_picture_url,
                 wp.rating_average
      `;

      const result = await query(selectQuery, [jobId]);

      if (result.rows.length === 0) {
        return null;
      }

      // Incrementar contador de vistas
      await query(
        'UPDATE jobs SET views_count = views_count + 1 WHERE id = $1',
        [jobId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo trabajo:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TRABAJOS DE UN CLIENTE
  // ============================
  static async getByClientId(clientId, status = null) {
    try {
      let whereConditions = ['j.client_id = $1'];
      let values = [clientId];

      if (status) {
        whereConditions.push('j.status = $2');
        values.push(status);
      }

      const selectQuery = `
        SELECT 
          j.*,
          c.name as category_name,
          c.icon as category_icon,
          COALESCE(j.applications_count, 0) as applications_count,
          array_agg(
            DISTINCT jsonb_build_object(
              'id', ji.id,
              'url', ji.image_url,
              'thumbnail', ji.thumbnail_url
            )
          ) FILTER (WHERE ji.id IS NOT NULL) as images
        FROM jobs j
        LEFT JOIN categories c ON j.category_id = c.id
        LEFT JOIN job_images ji ON j.id = ji.job_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY j.id, c.name, c.icon
        ORDER BY j.created_at DESC
      `;

      const result = await query(selectQuery, values);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo trabajos del cliente:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR TRABAJO
  // ============================
  static async update(jobId, updateData, clientId) {
    try {
      // Verificar que el trabajo pertenece al cliente
      const ownerCheck = await query(
        'SELECT client_id, status FROM jobs WHERE id = $1',
        [jobId]
      );

      if (ownerCheck.rows.length === 0) {
        throw new Error('Trabajo no encontrado');
      }

      if (ownerCheck.rows[0].client_id !== clientId) {
        throw new Error('No tienes permisos para editar este trabajo');
      }

      if (ownerCheck.rows[0].status !== 'active' && ownerCheck.rows[0].status !== 'draft') {
        throw new Error('No se puede editar un trabajo en progreso o completado');
      }

      // Construir query de actualización
      const allowedFields = [
        'title', 'description', 'category_id',
        'budget_amount', 'budget_type',
        'address', 'address_details', 'city', 'department',
        'latitude', 'longitude', 'urgency', 'needed_date'
      ];

      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      values.push(jobId);

      const updateQuery = `
        UPDATE jobs 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(updateQuery, values);
      logger.info(`✅ Trabajo actualizado: ${jobId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando trabajo:', error);
      throw error;
    }
  }

  // ============================
  // CAMBIAR ESTADO DEL TRABAJO
  // ============================
  static async updateStatus(jobId, newStatus, userId) {
    try {
      // Obtener información del trabajo
      const jobCheck = await query(
        'SELECT client_id, assigned_worker_id, status FROM jobs WHERE id = $1',
        [jobId]
      );

      if (jobCheck.rows.length === 0) {
        throw new Error('Trabajo no encontrado');
      }

      const job = jobCheck.rows[0];

      // Validar transiciones de estado permitidas
      const validTransitions = {
        'draft': ['active', 'cancelled'],
        'active': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
      };

      if (!validTransitions[job.status]?.includes(newStatus)) {
        throw new Error(`No se puede cambiar de ${job.status} a ${newStatus}`);
      }

      // Verificar permisos según el nuevo estado
      if (newStatus === 'in_progress') {
        // Solo el trabajador asignado puede iniciar el trabajo
        if (job.assigned_worker_id !== userId) {
          throw new Error('Solo el trabajador asignado puede iniciar el trabajo');
        }
      } else if (newStatus === 'completed') {
        // Solo el CLIENTE puede marcar como completado
        if (job.client_id !== userId) {
          throw new Error('Solo el cliente puede marcar el trabajo como completado');
        }
      } else if (newStatus === 'cancelled') {
        // Solo el cliente puede cancelar
        if (job.client_id !== userId) {
          throw new Error('Solo el cliente puede cancelar el trabajo');
        }
      }

      // Construir query de actualización
      let updateQuery = `
      UPDATE jobs 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;

      const values = [newStatus, jobId];

      // Agregar timestamps específicos según el estado
      if (newStatus === 'completed') {
        updateQuery += ', completed_at = CURRENT_TIMESTAMP';
      } else if (newStatus === 'cancelled') {
        updateQuery += ', cancelled_at = CURRENT_TIMESTAMP';
      } else if (newStatus === 'in_progress') {
        updateQuery += ', started_at = CURRENT_TIMESTAMP';
      }

      updateQuery += ' WHERE id = $2 RETURNING *';

      const result = await query(updateQuery, values);

      logger.info(`Estado del trabajo ${jobId} cambiado de ${job.status} a ${newStatus} por usuario ${userId}`);

      return result.rows[0];
    } catch (error) {
      logger.error('Error cambiando estado del trabajo:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR TRABAJO
  // ============================
  static async delete(jobId, clientId) {
    try {
      // Verificar que el trabajo pertenece al cliente y está en estado válido
      const ownerCheck = await query(
        'SELECT client_id, status FROM jobs WHERE id = $1',
        [jobId]
      );

      if (ownerCheck.rows.length === 0) {
        throw new Error('Trabajo no encontrado');
      }

      if (ownerCheck.rows[0].client_id !== clientId) {
        throw new Error('No tienes permisos para eliminar este trabajo');
      }

      if (ownerCheck.rows[0].status === 'in_progress' || ownerCheck.rows[0].status === 'completed') {
        throw new Error('No se puede eliminar un trabajo en progreso o completado');
      }

      // Eliminar (las imágenes y aplicaciones se eliminan por CASCADE)
      await query('DELETE FROM jobs WHERE id = $1', [jobId]);

      logger.info(`✅ Trabajo eliminado: ${jobId}`);
      return true;
    } catch (error) {
      logger.error('Error eliminando trabajo:', error);
      throw error;
    }
  }
}

module.exports = JobModel;
// src/models/application.model.js
// Modelo para manejo de aplicaciones - Versión final con tu estructura

const { pool } = require('../config/database');

class ApplicationModel {
  // Crear nueva aplicación
  static async create(applicationData) {
    const { job_id, worker_id, message, proposed_budget } = applicationData;
    
    try {
      // Verificar si ya aplicó
      const checkQuery = `
        SELECT id FROM job_applications 
        WHERE job_id = $1::uuid AND worker_id = $2::uuid
      `;
      const existing = await pool.query(checkQuery, [job_id, worker_id]);
      
      if (existing.rows.length > 0) {
        throw new Error('Ya has aplicado a este trabajo');
      }

      // Crear aplicación (usando las columnas que existen en tu tabla)
      const query = `
        INSERT INTO job_applications (job_id, worker_id, message, proposed_budget, status)
        VALUES ($1::uuid, $2::uuid, $3, $4, 'pending'::application_status)
        RETURNING *
      `;
      
      const values = [job_id, worker_id, message, proposed_budget];
      const result = await pool.query(query, values);
      
      // Obtener información adicional
      const detailQuery = `
        SELECT * FROM application_details WHERE id = $1::uuid
      `;
      
      const details = await pool.query(detailQuery, [result.rows[0].id]);
      return details.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener aplicaciones por trabajador
  static async getByWorkerId(workerId, filters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT * FROM application_details
        WHERE worker_id = $1::uuid
      `;
      
      const values = [workerId];
      let valueIndex = 2;
      
      if (status) {
        query += ` AND status = $${valueIndex}::application_status`;
        values.push(status);
        valueIndex++;
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
      values.push(limit, offset);
      
      const result = await pool.query(query, values);
      
      // Contar total
      let countQuery = `
        SELECT COUNT(*) as total
        FROM job_applications
        WHERE worker_id = $1::uuid
      `;
      const countValues = [workerId];
      
      if (status) {
        countQuery += ` AND status = $2::application_status`;
        countValues.push(status);
      }
      
      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].total);
      
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener aplicaciones por trabajo
  static async getByJobId(jobId, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    
    try {
      const query = `
        SELECT * FROM application_details
        WHERE job_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [jobId, limit, offset]);
      
      // Contar total
      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM job_applications WHERE job_id = $1::uuid',
        [jobId]
      );
      const total = parseInt(countResult.rows[0].total);
      
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener aplicación por ID
  static async getById(applicationId) {
    try {
      const query = `SELECT * FROM application_details WHERE id = $1::uuid`;
      const result = await pool.query(query, [applicationId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Actualizar estado de aplicación
  static async updateStatus(applicationId, status) {
    try {
      const query = `
        UPDATE job_applications 
        SET status = $1::application_status, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2::uuid
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, applicationId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Aceptar aplicación y rechazar las demás
  static async acceptApplication(applicationId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Obtener información de la aplicación
      const appResult = await client.query(
        'SELECT job_id FROM job_applications WHERE id = $1::uuid',
        [applicationId]
      );
      
      if (!appResult.rows[0]) {
        throw new Error('Aplicación no encontrada');
      }
      
      const jobId = appResult.rows[0].job_id;
      
      // Aceptar la aplicación seleccionada
      await client.query(
        `UPDATE job_applications 
         SET status = 'accepted'::application_status, reviewed_at = CURRENT_TIMESTAMP 
         WHERE id = $1::uuid`,
        [applicationId]
      );
      
      // Rechazar todas las demás aplicaciones del mismo trabajo
      await client.query(
        `UPDATE job_applications 
         SET status = 'rejected'::application_status, reviewed_at = CURRENT_TIMESTAMP
         WHERE job_id = $1::uuid AND id != $2::uuid AND status = 'pending'::application_status`,
        [jobId, applicationId]
      );
      
      // Obtener el worker_id de la aplicación aceptada
      const workerResult = await client.query(
        'SELECT worker_id FROM job_applications WHERE id = $1::uuid',
        [applicationId]
      );
      
      // Actualizar el trabajo con el trabajador asignado
      await client.query(
        `UPDATE jobs 
         SET status = 'in_progress'::job_status, 
             assigned_worker_id = $1::uuid,
             assigned_at = CURRENT_TIMESTAMP
         WHERE id = $2::uuid`,
        [workerResult.rows[0].worker_id, jobId]
      );
      
      await client.query('COMMIT');
      
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Verificar si el trabajador ya aplicó
  static async hasWorkerApplied(workerId, jobId) {
    try {
      const query = `
        SELECT id FROM job_applications 
        WHERE worker_id = $1::uuid AND job_id = $2::uuid
      `;
      
      const result = await pool.query(query, [workerId, jobId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Verificar propiedad del trabajo
  static async verifyJobOwnership(jobId, clientId) {
    try {
      const query = `
        SELECT id FROM jobs 
        WHERE id = $1::uuid AND client_id = $2::uuid
      `;
      
      const result = await pool.query(query, [jobId, clientId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas del trabajador
  static async getWorkerStats(workerId) {
    try {
      const query = `
        SELECT 
          COUNT(*)::INTEGER as total_applications,
          COUNT(*) FILTER (WHERE status = 'pending'::application_status)::INTEGER as pending_applications,
          COUNT(*) FILTER (WHERE status = 'accepted'::application_status)::INTEGER as accepted_applications,
          COUNT(*) FILTER (WHERE status = 'rejected'::application_status)::INTEGER as rejected_applications,
          COUNT(*) FILTER (WHERE status = 'cancelled'::application_status)::INTEGER as cancelled_applications,
          CASE 
            WHEN COUNT(*) > 0 THEN 
              ROUND(COUNT(*) FILTER (WHERE status = 'accepted'::application_status)::DECIMAL / COUNT(*)::DECIMAL * 100, 2)
            ELSE 0
          END as success_rate
        FROM job_applications
        WHERE worker_id = $1::uuid
      `;
      
      const result = await pool.query(query, [workerId]);
      
      // Convertir a números para asegurar compatibilidad
      const stats = result.rows[0];
      return {
        total_applications: parseInt(stats.total_applications) || 0,
        pending_applications: parseInt(stats.pending_applications) || 0,
        accepted_applications: parseInt(stats.accepted_applications) || 0,
        rejected_applications: parseInt(stats.rejected_applications) || 0,
        cancelled_applications: parseInt(stats.cancelled_applications) || 0,
        success_rate: parseFloat(stats.success_rate) || 0
      };
    } catch (error) {
      console.error('Error en getWorkerStats:', error);
      // Retornar estadísticas vacías si hay error
      return {
        total_applications: 0,
        pending_applications: 0,
        accepted_applications: 0,
        rejected_applications: 0,
        cancelled_applications: 0,
        success_rate: 0
      };
    }
  }

  // Obtener estadísticas del cliente
  static async getClientStats(clientId) {
    try {
      const query = `
        SELECT 
          COUNT(ja.*)::INTEGER as total_applications,
          COUNT(ja.*) FILTER (WHERE ja.status = 'pending'::application_status)::INTEGER as pending_applications,
          COUNT(ja.*) FILTER (WHERE ja.status = 'accepted'::application_status)::INTEGER as accepted_applications,
          COUNT(ja.*) FILTER (WHERE ja.status = 'rejected'::application_status)::INTEGER as rejected_applications
        FROM job_applications ja
        INNER JOIN jobs j ON ja.job_id = j.id
        WHERE j.client_id = $1::uuid
      `;
      
      const result = await pool.query(query, [clientId]);
      
      // Convertir a números para asegurar compatibilidad
      const stats = result.rows[0];
      return {
        total_applications: parseInt(stats.total_applications) || 0,
        pending_applications: parseInt(stats.pending_applications) || 0,
        accepted_applications: parseInt(stats.accepted_applications) || 0,
        rejected_applications: parseInt(stats.rejected_applications) || 0
      };
    } catch (error) {
      console.error('Error en getClientStats:', error);
      // Retornar estadísticas vacías si hay error
      return {
        total_applications: 0,
        pending_applications: 0,
        accepted_applications: 0,
        rejected_applications: 0
      };
    }
  }
}

module.exports = ApplicationModel;
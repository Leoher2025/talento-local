// - Controlador para manejo de trabajos
const JobModel = require('../models/job.model');
const logger = require('../utils/logger');
const NotificationHelpers = require('../utils/notificationHelpers');
const { query } = require('../config/database');

class JobController {
  // ============================
  // CREAR NUEVO TRABAJO
  // ============================
  static async create(req, res, next) {
    try {
      const clientId = req.user.id;
      const { role } = req.user;

      // Verificar que sea un cliente
      if (role !== 'client') {
        return res.status(403).json({
          success: false,
          message: 'Solo los clientes pueden publicar trabajos'
        });
      }

      // Convertir los nombres de campos de camelCase a snake_case para la BD
      const jobData = {
        title: req.body.title,
        description: req.body.description,
        categoryId: req.body.categoryId,
        budgetAmount: req.body.budgetAmount,
        budgetType: req.body.budgetType,
        address: req.body.address,
        addressDetails: req.body.addressDetails,
        city: req.body.city,
        department: req.body.department,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        urgency: req.body.urgency,
        neededDate: req.body.neededDate,
        images: req.body.images || []
      };

      console.log('Datos recibidos:', jobData);

      // Crear el trabajo
      const newJob = await JobModel.create(jobData, clientId);

      res.status(201).json({
        success: true,
        message: 'Trabajo publicado exitosamente',
        data: newJob
      });

      logger.info(`Cliente ${clientId} creó trabajo ${newJob.id}`);
    } catch (error) {
      logger.error('Error creando trabajo:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER TODOS LOS TRABAJOS ACTIVOS (CON FILTROS)
  // ============================
  static async getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        categoryId: req.query.categoryId,
        city: req.query.city,
        department: req.query.department,
        budgetMin: req.query.budgetMin ? parseFloat(req.query.budgetMin) : undefined,
        budgetMax: req.query.budgetMax ? parseFloat(req.query.budgetMax) : undefined,
        budgetType: req.query.budgetType,
        urgency: req.query.urgency,
        latitude: req.query.latitude ? parseFloat(req.query.latitude) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude) : undefined,
        radiusKm: req.query.radiusKm ? parseInt(req.query.radiusKm) : 50,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await JobModel.getActiveJobs(filters);

      res.json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
        filters: filters // Retornar filtros aplicados
      });
    } catch (error) {
      logger.error('Error obteniendo trabajos:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER TRABAJO POR ID
  // ============================
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const job = await JobModel.getById(id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      logger.error('Error obteniendo trabajo:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER MIS TRABAJOS (CLIENTE)
  // ============================
  static async getMyJobs(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const jobs = await JobModel.getByClientId(userId, status);

      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      logger.error('Error obteniendo trabajos del cliente:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER TRABAJOS ASIGNADOS AL TRABAJADOR
  // ============================
  static async getWorkerJobs(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const jobs = await JobModel.getByWorkerId(userId, status);

      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      logger.error('Error obteniendo trabajos del trabajador:', error);
      next(error);
    }
  }

  // ============================
  // ACTUALIZAR TRABAJO
  // ============================
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      // Mapear campos de camelCase a snake_case para la BD
      const updateData = {};

      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.category_id !== undefined) updateData.category_id = req.body.category_id;
      if (req.body.categoryId !== undefined) updateData.category_id = req.body.categoryId; // Soporte para ambos
      if (req.body.budget_amount !== undefined) updateData.budget_amount = req.body.budget_amount;
      if (req.body.budgetAmount !== undefined) updateData.budget_amount = req.body.budgetAmount;
      if (req.body.budget_type !== undefined) updateData.budget_type = req.body.budget_type;
      if (req.body.budgetType !== undefined) updateData.budget_type = req.body.budgetType;
      if (req.body.address !== undefined) updateData.address = req.body.address;
      if (req.body.address_details !== undefined) updateData.address_details = req.body.address_details;
      if (req.body.addressDetails !== undefined) updateData.address_details = req.body.addressDetails;
      if (req.body.city !== undefined) updateData.city = req.body.city;
      if (req.body.department !== undefined) updateData.department = req.body.department;
      if (req.body.latitude !== undefined) updateData.latitude = req.body.latitude;
      if (req.body.longitude !== undefined) updateData.longitude = req.body.longitude;
      if (req.body.urgency !== undefined) updateData.urgency = req.body.urgency;
      if (req.body.needed_date !== undefined) updateData.needed_date = req.body.needed_date;
      if (req.body.neededDate !== undefined) updateData.needed_date = req.body.neededDate;

      console.log('Datos de actualización recibidos:', req.body);
      console.log('Datos mapeados para BD:', updateData);

      // Verificar que sea el dueño
      if (req.user.role !== 'client') {
        return res.status(403).json({
          success: false,
          message: 'Solo el cliente puede editar el trabajo'
        });
      }

      const updatedJob = await JobModel.update(id, updateData, clientId);

      res.json({
        success: true,
        message: 'Trabajo actualizado exitosamente',
        data: updatedJob
      });

      logger.info(`Trabajo ${id} actualizado por cliente ${clientId}`);
    } catch (error) {
      logger.error('Error actualizando trabajo:', error);

      if (error.message.includes('permisos')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }

  // ============================
  // ACTUALIZAR ESTADO DEL TRABAJO
  // ============================
  static async updateJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Obtener el trabajo
      const job = await JobModel.getById(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }

      // Validaciones según el nuevo estado
      if (status === 'in_progress') {
        // Solo el trabajador asignado puede marcar como "en progreso"
        if (userId !== job.assigned_worker_id) {
          return res.status(403).json({
            success: false,
            message: 'Solo el trabajador asignado puede iniciar el trabajo'
          });
        }
      } else if (status === 'completed') {
        // ✅ CAMBIO: Solo el CLIENTE puede marcar como completado
        if (userId !== job.client_id) {
          return res.status(403).json({
            success: false,
            message: 'Solo el cliente puede marcar el trabajo como completado'
          });
        }

        // Verificar que el trabajo esté en progreso
        if (job.status !== 'in_progress') {
          return res.status(400).json({
            success: false,
            message: 'El trabajo debe estar en progreso para marcarlo como completado'
          });
        }
      } else if (status === 'cancelled') {
        // Solo el cliente o admin pueden cancelar
        if (userId !== job.client_id && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Solo el cliente puede cancelar el trabajo'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
      }

      // Actualizar el estado
      const updatedJob = await JobModel.updateStatus(jobId, status, userId);

      // ✅ ENVIAR NOTIFICACIONES
      if (status === 'in_progress' && job.client_id) {
        // Notificar al cliente que el trabajo ha iniciado
        await NotificationHelpers.notifyJobStatusChange(job.client_id, job, status);
      } else if (status === 'completed') {
        // Notificar al trabajador que el cliente ha completado
        if (job.assigned_worker_id) {
          await NotificationHelpers.notifyJobStatusChange(job.assigned_worker_id, job, status);
        }
      } else if (status === 'cancelled') {
        // Notificar a la otra parte
        const notifyUserId = userId === job.client_id ? job.assigned_worker_id : job.client_id;
        if (notifyUserId) {
          await NotificationHelpers.notifyJobStatusChange(notifyUserId, job, status);
        }
      }

      res.json({
        success: true,
        message: `Trabajo marcado como ${status}`,
        data: updatedJob
      });

      logger.info(`Trabajo ${jobId} actualizado a estado: ${status}`);
    } catch (error) {
      logger.error('Error actualizando estado del trabajo:', error);
      next(error);
    }
  }

  // ============================
  // ELIMINAR TRABAJO
  // ============================
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      if (req.user.role !== 'client') {
        return res.status(403).json({
          success: false,
          message: 'Solo el cliente puede eliminar el trabajo'
        });
      }

      await JobModel.delete(id, clientId);

      res.json({
        success: true,
        message: 'Trabajo eliminado exitosamente'
      });

      logger.info(`Trabajo ${id} eliminado por cliente ${clientId}`);
    } catch (error) {
      logger.error('Error eliminando trabajo:', error);

      if (error.message.includes('permisos')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('No se puede eliminar')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }

  // ============================
  // OBTENER CATEGORÍAS
  // ============================
  static async getCategories(req, res, next) {
    try {
      const { query } = require('../config/database');

      const result = await query(`
        SELECT id, slug, name, description, icon, display_order
        FROM categories
        WHERE is_active = true
        ORDER BY display_order, name
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error obteniendo categorías:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER UBICACIONES DISPONIBLES
  // ============================
  static async getLocations(req, res, next) {
    try {
      const locations = await JobModel.getAvailableLocations();

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      logger.error('Error obteniendo ubicaciones:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER RANGOS DE PRESUPUESTO
  // ============================
  static async getBudgetRanges(req, res, next) {
    try {
      const ranges = await JobModel.getBudgetRanges();

      res.json({
        success: true,
        data: ranges
      });
    } catch (error) {
      logger.error('Error obteniendo rangos de presupuesto:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER ESTADÍSTICAS DE BÚSQUEDA
  // ============================
  static async getSearchStats(req, res, next) {
    try {
      const stats = await query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(DISTINCT category_id) as total_categories,
        COUNT(DISTINCT city) as total_cities,
        AVG(budget_amount) as avg_budget
      FROM jobs
      WHERE status = 'active'
    `);

      const urgencyStats = await query(`
      SELECT 
        urgency,
        COUNT(*) as count
      FROM jobs
      WHERE status = 'active'
      GROUP BY urgency
    `);

      res.json({
        success: true,
        data: {
          ...stats.rows[0],
          urgency_distribution: urgencyStats.rows
        }
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      next(error);
    }
  }
}
// Función auxiliar para obtener etiquetas de estado en español
function getStatusLabel(status) {
  const labels = {
    'active': 'activo',
    'in_progress': 'en progreso',
    'completed': 'completado',
    'cancelled': 'cancelado',
    'draft': 'borrador'
  };
  return labels[status] || status;
}

module.exports = JobController;
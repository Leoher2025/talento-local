// - Controlador para manejo de trabajos
const JobModel = require('../models/job.model');
const logger = require('../utils/logger');

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
  // OBTENER LISTA DE TRABAJOS
  // ============================
  static async getAll(req, res, next) {
    try {
      const filters = {
        categoryId: req.query.categoryId,
        city: req.query.city,
        department: req.query.department,
        urgency: req.query.urgency,
        budgetMin: req.query.budgetMin ? parseFloat(req.query.budgetMin) : undefined,
        budgetMax: req.query.budgetMax ? parseFloat(req.query.budgetMax) : undefined,
        latitude: req.query.latitude ? parseFloat(req.query.latitude) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude) : undefined,
        radiusKm: req.query.radiusKm ? parseInt(req.query.radiusKm) : 10,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await JobModel.getActiveJobs(filters);

      res.json({
        success: true,
        data: result.jobs,
        pagination: result.pagination
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
  // CAMBIAR ESTADO DEL TRABAJO
  // ============================
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'El estado es requerido'
        });
      }

      const updatedJob = await JobModel.updateStatus(id, status, userId);

      res.json({
        success: true,
        message: `Trabajo ${status === 'completed' ? 'completado' : status === 'cancelled' ? 'cancelado' : 'actualizado'} exitosamente`,
        data: updatedJob
      });

      logger.info(`Estado del trabajo ${id} cambiado a ${status} por usuario ${userId}`);
    } catch (error) {
      logger.error('Error cambiando estado del trabajo:', error);
      
      if (error.message.includes('permisos') || error.message.includes('Solo')) {
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
      
      if (error.message.includes('No se puede cambiar')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
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
}

module.exports = JobController;
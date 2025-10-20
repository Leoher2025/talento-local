// src/controllers/worker.controller.js
// Controlador para búsqueda de trabajadores

const ProfileModel = require('../models/profile.model');
const logger = require('../utils/logger');

class WorkerController {

  // ============================
  // BUSCAR TRABAJADORES
  // ============================
  static async searchWorkers(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        categoryId: req.query.categoryId,
        city: req.query.city,
        department: req.query.department,
        minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
        latitude: req.query.latitude ? parseFloat(req.query.latitude) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude) : undefined,
        radiusKm: req.query.radiusKm ? parseInt(req.query.radiusKm) : 50,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        sortBy: req.query.sortBy || 'rating_average',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await ProfileModel.searchWorkers(filters);

      res.json({
        success: true,
        data: result.workers,
        pagination: result.pagination,
        filters: filters
      });
    } catch (error) {
      logger.error('Error buscando trabajadores:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER PERFIL DE TRABAJADOR
  // ============================
  static async getWorkerProfile(req, res, next) {
    try {
      const { workerId } = req.params;

      const profile = await ProfileModel.getByUserId(workerId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      next(error);
    }
  }
}

module.exports = WorkerController;
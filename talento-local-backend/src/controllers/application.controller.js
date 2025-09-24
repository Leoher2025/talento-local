// src/controllers/application.controller.js
// Controlador para manejo de aplicaciones a trabajos
const ApplicationModel = require('../models/application.model');
const logger = require('../utils/logger');

class ApplicationController {
  // Crear nueva aplicación
  async create(req, res, next) {
    try {
      const { jobId, message, proposedBudget } = req.body;
      const workerId = req.user.id;

      // Crear aplicación
      const application = await ApplicationModel.create({
        job_id: jobId,
        worker_id: workerId,
        message,
        proposed_budget: proposedBudget
      });

      logger.info(`Nueva aplicación creada: ${application.id} por usuario ${workerId}`);

      res.status(201).json({
        success: true,
        message: 'Aplicación enviada exitosamente',
        data: application
      });
    } catch (error) {
      if (error.message === 'Ya has aplicado a este trabajo') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Obtener mis aplicaciones (trabajador)
  async getMyApplications(req, res, next) {
    try {
      const workerId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      const result = await ApplicationModel.getByWorkerId(workerId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener aplicaciones de un trabajo (cliente)
  async getJobApplications(req, res, next) {
    try {
      const { jobId } = req.params;
      const clientId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      // Verificar que el trabajo pertenece al cliente
      const isOwner = await ApplicationModel.verifyJobOwnership(jobId, clientId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver estas aplicaciones'
        });
      }

      const result = await ApplicationModel.getByJobId(jobId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener detalle de aplicación
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const application = await ApplicationModel.getById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Aplicación no encontrada'
        });
      }

      // Verificar que el usuario tiene permiso para ver esta aplicación
      if (application.worker_id !== userId && application.client_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta aplicación'
        });
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  // Verificar si ya aplicó
  async checkIfApplied(req, res, next) {
    try {
      const { jobId } = req.params;
      const workerId = req.user.id;

      const hasApplied = await ApplicationModel.hasWorkerApplied(workerId, jobId);

      res.json({
        success: true,
        data: {
          has_applied: hasApplied,
          job_id: parseInt(jobId)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Aceptar aplicación
  async acceptApplication(req, res, next) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      // Verificar que la aplicación existe
      const application = await ApplicationModel.getById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Aplicación no encontrada'
        });
      }

      // Verificar que el cliente es dueño del trabajo
      const isOwner = await ApplicationModel.verifyJobOwnership(application.job_id, clientId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para aceptar esta aplicación'
        });
      }

      // Aceptar aplicación (rechaza las demás automáticamente)
      await ApplicationModel.acceptApplication(id);

      logger.info(`Aplicación ${id} aceptada por cliente ${clientId}`);

      res.json({
        success: true,
        message: 'Aplicación aceptada exitosamente',
        data: {
          application_id: parseInt(id),
          status: 'accepted'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Rechazar aplicación
  async rejectApplication(req, res, next) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      // Verificar que la aplicación existe
      const application = await ApplicationModel.getById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Aplicación no encontrada'
        });
      }

      // Verificar que el cliente es dueño del trabajo
      const isOwner = await ApplicationModel.verifyJobOwnership(application.job_id, clientId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para rechazar esta aplicación'
        });
      }

      // Rechazar aplicación
      await ApplicationModel.updateStatus(id, 'rejected');

      logger.info(`Aplicación ${id} rechazada por cliente ${clientId}`);

      res.json({
        success: true,
        message: 'Aplicación rechazada',
        data: {
          application_id: parseInt(id),
          status: 'rejected'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancelar aplicación (trabajador)
  async cancelApplication(req, res, next) {
    try {
      const { id } = req.params;
      const workerId = req.user.id;

      // Verificar que la aplicación existe
      const application = await ApplicationModel.getById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Aplicación no encontrada'
        });
      }

      // Verificar que el trabajador es dueño de la aplicación
      if (application.worker_id !== workerId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para cancelar esta aplicación'
        });
      }

      // Solo se pueden cancelar aplicaciones pendientes
      if (application.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo puedes cancelar aplicaciones pendientes'
        });
      }

      // Cancelar aplicación
      await ApplicationModel.updateStatus(id, 'cancelled');

      logger.info(`Aplicación ${id} cancelada por trabajador ${workerId}`);

      res.json({
        success: true,
        message: 'Aplicación cancelada exitosamente',
        data: {
          application_id: parseInt(id),
          status: 'cancelled'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas
  async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let stats;
      if (userRole === 'worker') {
        stats = await ApplicationModel.getWorkerStats(userId);
      } else {
        stats = await ApplicationModel.getClientStats(userId);
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApplicationController();
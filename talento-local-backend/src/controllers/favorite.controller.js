// src/controllers/favorite.controller.js
// Controlador para gestión de favoritos

const FavoriteModel = require('../models/favorite.model');
const logger = require('../utils/logger');

class FavoriteController {
  // ============================
  // AGREGAR A FAVORITOS
  // ============================
  static async addFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { favoriteType, favoriteId, notes } = req.body;

      // Validar datos requeridos
      if (!favoriteType || !favoriteId) {
        return res.status(400).json({
          success: false,
          message: 'Tipo y ID de favorito son requeridos'
        });
      }

      // Validar tipo
      if (!['worker', 'job'].includes(favoriteType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de favorito inválido'
        });
      }

      // Evitar que se agregue a sí mismo como favorito
      if (favoriteType === 'worker' && favoriteId === userId) {
        return res.status(400).json({
          success: false,
          message: 'No puedes agregarte a ti mismo como favorito'
        });
      }

      const favorite = await FavoriteModel.addFavorite({
        userId,
        favoriteType,
        favoriteId,
        notes
      });

      logger.info(`Usuario ${userId} agregó favorito ${favoriteType}: ${favoriteId}`);

      res.json({
        success: true,
        message: 'Agregado a favoritos',
        data: favorite
      });
    } catch (error) {
      logger.error('Error agregando favorito:', error);
      next(error);
    }
  }

  // ============================
  // ELIMINAR DE FAVORITOS
  // ============================
  static async removeFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { favoriteType, favoriteId } = req.params;

      // Validar tipo
      if (!['worker', 'job'].includes(favoriteType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de favorito inválido'
        });
      }

      const removed = await FavoriteModel.removeFavorite({
        userId,
        favoriteType,
        favoriteId
      });

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Favorito no encontrado'
        });
      }

      logger.info(`Usuario ${userId} eliminó favorito ${favoriteType}: ${favoriteId}`);

      res.json({
        success: true,
        message: 'Eliminado de favoritos'
      });
    } catch (error) {
      logger.error('Error eliminando favorito:', error);
      next(error);
    }
  }

  // ============================
  // TOGGLE FAVORITO
  // ============================
  static async toggleFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { favoriteType, favoriteId } = req.body;

      // Validar datos
      if (!favoriteType || !favoriteId) {
        return res.status(400).json({
          success: false,
          message: 'Tipo y ID de favorito son requeridos'
        });
      }

      if (!['worker', 'job'].includes(favoriteType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de favorito inválido'
        });
      }

      // Verificar si ya es favorito
      const isFavorite = await FavoriteModel.isFavorite({
        userId,
        favoriteType,
        favoriteId
      });

      if (isFavorite) {
        // Eliminar
        await FavoriteModel.removeFavorite({ userId, favoriteType, favoriteId });
        
        res.json({
          success: true,
          message: 'Eliminado de favoritos',
          data: { is_favorite: false }
        });
      } else {
        // Agregar
        await FavoriteModel.addFavorite({ userId, favoriteType, favoriteId });
        
        res.json({
          success: true,
          message: 'Agregado a favoritos',
          data: { is_favorite: true }
        });
      }
    } catch (error) {
      logger.error('Error haciendo toggle de favorito:', error);
      next(error);
    }
  }

  // ============================
  // VERIFICAR SI ES FAVORITO
  // ============================
  static async checkFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { favoriteType, favoriteId } = req.params;

      const isFavorite = await FavoriteModel.isFavorite({
        userId,
        favoriteType,
        favoriteId
      });

      res.json({
        success: true,
        data: { is_favorite: isFavorite }
      });
    } catch (error) {
      logger.error('Error verificando favorito:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER TODOS LOS FAVORITOS
  // ============================
  static async getAllFavorites(req, res, next) {
    try {
      const userId = req.user.id;

      const favorites = await FavoriteModel.getAllFavorites(userId);

      res.json({
        success: true,
        data: favorites
      });
    } catch (error) {
      logger.error('Error obteniendo favoritos:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER TRABAJADORES FAVORITOS
  // ============================
  static async getFavoriteWorkers(req, res, next) {
    try {
      const userId = req.user.id;

      const workers = await FavoriteModel.getFavoriteWorkers(userId);

      res.json({
        success: true,
        data: workers,
        total: workers.length
      });
    } catch (error) {
      logger.error('Error obteniendo trabajadores favoritos:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER TRABAJOS FAVORITOS
  // ============================
  static async getFavoriteJobs(req, res, next) {
    try {
      const userId = req.user.id;

      const jobs = await FavoriteModel.getFavoriteJobs(userId);

      res.json({
        success: true,
        data: jobs,
        total: jobs.length
      });
    } catch (error) {
      logger.error('Error obteniendo trabajos favoritos:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER CONTADOR DE FAVORITOS
  // ============================
  static async getFavoritesCount(req, res, next) {
    try {
      const userId = req.user.id;

      const count = await FavoriteModel.getFavoritesCount(userId);

      res.json({
        success: true,
        data: count
      });
    } catch (error) {
      logger.error('Error obteniendo contador:', error);
      next(error);
    }
  }

  // ============================
  // ACTUALIZAR NOTAS
  // ============================
  static async updateNotes(req, res, next) {
    try {
      const userId = req.user.id;
      const { favoriteType, favoriteId } = req.params;
      const { notes } = req.body;

      const updated = await FavoriteModel.updateNotes({
        userId,
        favoriteType,
        favoriteId,
        notes
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Favorito no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Notas actualizadas',
        data: updated
      });
    } catch (error) {
      logger.error('Error actualizando notas:', error);
      next(error);
    }
  }
}

module.exports = FavoriteController;
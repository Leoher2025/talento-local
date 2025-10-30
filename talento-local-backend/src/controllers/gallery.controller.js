// src/controllers/gallery.controller.js
// Controlador para gestión de galería de trabajos - VERSIÓN LOCAL
const GalleryModel = require('../models/gallery.model');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

class GalleryController {
  // ============================
  // SUBIR FOTO A GALERÍA
  // ============================
  static async uploadPhoto(req, res, next) {
    try {
      const workerId = req.user.id;
      const { description, categoryId, isFeatured } = req.body;

      if (req.user.role !== 'worker') {
        return res.status(403).json({
          success: false,
          message: 'Solo los trabajadores pueden subir fotos a la galería'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Debes subir una foto'
        });
      }

      const currentCount = await GalleryModel.countByWorker(workerId);
      if (currentCount >= 20) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          success: false,
          message: 'Has alcanzado el límite de 20 fotos en tu galería'
        });
      }

      // ✅ URL relativa (se guarda en BD)
      const photoUrl = `/uploads/gallery/${req.file.filename}`;

      const photo = await GalleryModel.create({
        workerId,
        photoUrl,
        description: description || null,
        categoryId: categoryId || null,
        displayOrder: currentCount,
        isFeatured: isFeatured === 'true' || isFeatured === true
      });

      logger.info(`Foto de galería subida: ${photo.id} por trabajador ${workerId}`);

      res.status(201).json({
        success: true,
        message: 'Foto subida exitosamente',
        data: {
          ...photo,
          photo_url: `${process.env.API_URL || 'http://192.168.101.7:5000'}${photoUrl}` // ✅ URL completa para el frontend
        }
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      logger.error('Error subiendo foto a galería:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER GALERÍA
  // ============================
  static async getGallery(req, res, next) {
    try {
      const { workerId } = req.params;
      const { categoryId } = req.query;

      const photos = await GalleryModel.getByWorkerId(workerId, {
        categoryId
      });

      // ✅ Construir URLs completas
      const baseUrl = process.env.API_URL || 'http://192.168.101.3:5000';
      const photosWithFullUrl = photos.map(photo => ({
        ...photo,
        photo_url: photo.photo_url.startsWith('http')
          ? photo.photo_url
          : `${baseUrl}${photo.photo_url}`
      }));

      res.json({
        success: true,
        data: photosWithFullUrl,
        total: photosWithFullUrl.length
      });
    } catch (error) {
      logger.error('Error obteniendo galería:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER MI GALERÍA
  // ============================
  static async getMyGallery(req, res, next) {
    try {
      const workerId = req.user.id;
      const { categoryId } = req.query;

      const photos = await GalleryModel.getByWorkerId(workerId, {
        categoryId
      });

      // ✅ Construir URLs completas
      const baseUrl = process.env.API_URL || 'http://192.168.101.3:5000';
      const photosWithFullUrl = photos.map(photo => ({
        ...photo,
        photo_url: photo.photo_url.startsWith('http')
          ? photo.photo_url
          : `${baseUrl}${photo.photo_url}`
      }));

      res.json({
        success: true,
        data: photosWithFullUrl,
        total: photosWithFullUrl.length
      });
    } catch (error) {
      logger.error('Error obteniendo mi galería:', error);
      next(error);
    }
  }

  // ============================
  // ACTUALIZAR FOTO
  // ============================
  static async updatePhoto(req, res, next) {
    try {
      const { photoId } = req.params;
      const workerId = req.user.id;
      const { description, categoryId, displayOrder, isFeatured } = req.body;

      // Verificar que la foto existe y pertenece al usuario
      const photo = await GalleryModel.getById(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Foto no encontrada'
        });
      }

      if (photo.worker_id !== workerId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar esta foto'
        });
      }

      // Actualizar
      const updatedPhoto = await GalleryModel.update(photoId, {
        description,
        categoryId,
        displayOrder,
        isFeatured
      });

      logger.info(`Foto de galería actualizada: ${photoId}`);

      res.json({
        success: true,
        message: 'Foto actualizada exitosamente',
        data: updatedPhoto
      });
    } catch (error) {
      logger.error('Error actualizando foto:', error);
      next(error);
    }
  }

  // ============================
  // ELIMINAR FOTO
  // ============================
  static async deletePhoto(req, res, next) {
    try {
      const { photoId } = req.params;
      const workerId = req.user.id;

      // Verificar que la foto existe y pertenece al usuario
      const photo = await GalleryModel.getById(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Foto no encontrada'
        });
      }

      if (photo.worker_id !== workerId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta foto'
        });
      }

      // Eliminar archivo físico
      const filePath = path.join(__dirname, '../../public', photo.photo_url);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Archivo eliminado: ${filePath}`);
      } else {
        logger.warn(`Archivo no encontrado: ${filePath}`);
      }

      // Eliminar de BD
      await GalleryModel.delete(photoId);

      logger.info(`Foto de galería eliminada: ${photoId}`);

      res.json({
        success: true,
        message: 'Foto eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando foto:', error);
      next(error);
    }
  }

  // ============================
  // MARCAR COMO DESTACADA
  // ============================
  static async setFeatured(req, res, next) {
    try {
      const { photoId } = req.params;
      const workerId = req.user.id;

      // Verificar que la foto existe y pertenece al usuario
      const photo = await GalleryModel.getById(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Foto no encontrada'
        });
      }

      if (photo.worker_id !== workerId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar esta foto'
        });
      }

      // Marcar como destacada
      const updatedPhoto = await GalleryModel.setFeatured(photoId, workerId);

      logger.info(`Foto marcada como destacada: ${photoId}`);

      res.json({
        success: true,
        message: 'Foto marcada como destacada',
        data: updatedPhoto
      });
    } catch (error) {
      logger.error('Error marcando foto como destacada:', error);
      next(error);
    }
  }

  // ============================
  // REORDENAR FOTOS
  // ============================
  static async reorderPhotos(req, res, next) {
    try {
      const workerId = req.user.id;
      const { photoIds } = req.body;

      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar un array de IDs'
        });
      }

      await GalleryModel.reorder(workerId, photoIds);

      logger.info(`Fotos reordenadas por trabajador ${workerId}`);

      res.json({
        success: true,
        message: 'Fotos reordenadas exitosamente'
      });
    } catch (error) {
      logger.error('Error reordenando fotos:', error);
      next(error);
    }
  }
}

module.exports = GalleryController;
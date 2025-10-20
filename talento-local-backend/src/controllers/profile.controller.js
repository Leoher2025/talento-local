// src/controllers/profile.controller.js
// Controlador para manejo de perfiles de usuario

const ProfileModel = require('../models/profile.model');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

class ProfileController {
  // ============================
  // OBTENER MI PERFIL
  // ============================
  static async getMyProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const profile = await ProfileModel.getByUserId(userId);

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

  // ============================
  // OBTENER PERFIL POR ID
  // ============================
  static async getProfileById(req, res, next) {
    console.log('❌ Entrando a getProfileById con userId:', req.params.userId);
    try {
      const { userId } = req.params;

      const profile = await ProfileModel.getByUserId(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Filtrar información sensible si no es el propio perfil
      if (req.user.id !== parseInt(userId)) {
        delete profile.email;
        delete profile.phone;
        delete profile.address;
        // Respetar configuración de privacidad
        if (!profile.show_email) delete profile.email;
        if (!profile.show_phone) delete profile.phone;
        if (!profile.show_location) {
          delete profile.address;
          delete profile.latitude;
          delete profile.longitude;
        }
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error('Error obteniendo perfil por ID:', error);
      next(error);
    }
  }

  // ============================
  // ACTUALIZAR PERFIL
  // ============================
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profileData = req.body;

      // Validar que no se intente cambiar el user_id
      delete profileData.user_id;
      delete profileData.id;
      delete profileData.created_at;
      delete profileData.updated_at;

      const updatedProfile = await ProfileModel.update(userId, profileData);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedProfile
      });
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      next(error);
    }
  }

  // ============================
  // SUBIR FOTO DE PERFIL
  // ============================
  static async uploadProfilePicture(req, res, next) {
    try {
      const userId = req.user.id;

      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ninguna imagen'
        });
      }

      // Construir la URL de la imagen
      // En producción, esto sería una URL de S3 o Cloudinary
      const imageUrl = `/uploads/profiles/${req.file.filename}`;

      // Actualizar en la base de datos
      const updatedProfile = await ProfileModel.updateProfilePicture(userId, imageUrl);

      res.json({
        success: true,
        message: 'Foto de perfil actualizada',
        data: {
          url: imageUrl,
          profile: updatedProfile
        }
      });
    } catch (error) {
      logger.error('Error subiendo foto de perfil:', error);
      // Eliminar archivo si hay error
      if (req.file) {
        await fs.unlink(req.file.path).catch(err =>
          logger.error('Error eliminando archivo:', err)
        );
      }
      next(error);
    }
  }

  // ============================
  // ELIMINAR FOTO DE PERFIL
  // ============================
  static async deleteProfilePicture(req, res, next) {
    try {
      const userId = req.user.id;

      // Obtener perfil actual para obtener la URL de la imagen
      const currentProfile = await ProfileModel.getByUserId(userId);

      if (currentProfile.profile_picture_url) {
        // Eliminar archivo físico
        const imagePath = path.join(
          __dirname,
          '../../public',
          currentProfile.profile_picture_url
        );

        await fs.unlink(imagePath).catch(err =>
          logger.error('Error eliminando archivo:', err)
        );
      }

      // Actualizar en la base de datos
      const updatedProfile = await ProfileModel.deleteProfilePicture(userId);

      res.json({
        success: true,
        message: 'Foto de perfil eliminada',
        data: updatedProfile
      });
    } catch (error) {
      logger.error('Error eliminando foto de perfil:', error);
      next(error);
    }
  }

  // ============================
  // GALERÍA DE TRABAJOS
  // ============================
  static async getGallery(req, res, next) {
    try {
      const { userId } = req.params;

      const gallery = await ProfileModel.getGallery(userId);

      res.json({
        success: true,
        data: gallery
      });
    } catch (error) {
      logger.error('Error obteniendo galería:', error);
      next(error);
    }
  }

  static async uploadGalleryPhoto(req, res, next) {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ninguna imagen'
        });
      }

      // Verificar que el usuario sea un trabajador
      if (req.user.role !== 'worker') {
        return res.status(403).json({
          success: false,
          message: 'Solo los trabajadores pueden subir fotos a la galería'
        });
      }

      const imageUrl = `/uploads/gallery/${req.file.filename}`;

      const photoData = {
        image_url: imageUrl,
        thumbnail_url: imageUrl, // En producción, generar thumbnail
        caption: req.body.caption || ''
      };

      const galleryPhoto = await ProfileModel.addGalleryPhoto(userId, photoData);

      res.json({
        success: true,
        message: 'Foto agregada a la galería',
        data: galleryPhoto
      });
    } catch (error) {
      logger.error('Error subiendo foto a galería:', error);
      if (req.file) {
        await fs.unlink(req.file.path).catch(err =>
          logger.error('Error eliminando archivo:', err)
        );
      }
      next(error);
    }
  }

  static async deleteGalleryPhoto(req, res, next) {
    try {
      const userId = req.user.id;
      const { photoId } = req.params;

      const deletedPhoto = await ProfileModel.deleteGalleryPhoto(photoId, userId);

      // Eliminar archivo físico
      if (deletedPhoto.image_url) {
        const imagePath = path.join(
          __dirname,
          '../../public',
          deletedPhoto.image_url
        );

        await fs.unlink(imagePath).catch(err =>
          logger.error('Error eliminando archivo:', err)
        );
      }

      res.json({
        success: true,
        message: 'Foto eliminada de la galería',
        data: deletedPhoto
      });
    } catch (error) {
      logger.error('Error eliminando foto de galería:', error);
      next(error);
    }
  }

  // ============================
  // ESTADÍSTICAS
  // ============================
  static async getStats(req, res, next) {
    try {
      const { userId } = req.params;

      const stats = await ProfileModel.getStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      next(error);
    }
  }

  // ============================
  // CONFIGURACIÓN
  // ============================
  static async updateSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const { notifications, privacy } = req.body;

      const updatedProfile = await ProfileModel.updateSettings(userId, {
        notifications,
        privacy
      });

      res.json({
        success: true,
        message: 'Configuración actualizada',
        data: updatedProfile
      });
    } catch (error) {
      logger.error('Error actualizando configuración:', error);
      next(error);
    }
  }

  // ============================
  // ACTUALIZAR TELÉFONO
  // ============================
  static async updatePhone(req, res, next) {
    try {
      const userId = req.user.id;
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono es requerido'
        });
      }

      const result = await ProfileModel.updatePhone(userId, phone);

      res.json({
        success: true,
        message: 'Teléfono actualizado. Se requiere verificación.',
        data: result
      });
    } catch (error) {
      logger.error('Error actualizando teléfono:', error);
      next(error);
    }
  }

  // ============================
  // OBTENER CATEGORÍAS DEL TRABAJADOR
  // ============================
  static async getWorkerCategories(req, res, next) {
    console.log('✅ Entrando a getWorkerCategories');
    try {
      const userId = req.user.id;

      const categories = await ProfileModel.getWorkerCategories(userId);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error obteniendo categorías del trabajador:', error);
      next(error);
    }
  }

  // ============================
  // ACTUALIZAR CATEGORÍAS DEL TRABAJADOR
  // ============================
  static async updateWorkerCategories(req, res, next) {
    try {
      const userId = req.user.id;
      const { categories } = req.body;

      // Validar que sea trabajador
      if (req.user.role !== 'worker') {
        return res.status(403).json({
          success: false,
          message: 'Solo los trabajadores pueden actualizar categorías'
        });
      }

      // Validar formato de categorías
      if (!Array.isArray(categories)) {
        return res.status(400).json({
          success: false,
          message: 'Las categorías deben ser un array'
        });
      }

      // Validar que cada categoría tenga categoryId
      for (const cat of categories) {
        if (!cat.categoryId) {
          return res.status(400).json({
            success: false,
            message: 'Cada categoría debe tener un categoryId'
          });
        }
      }

      // Validar que solo haya una categoría principal
      const primaryCategories = categories.filter(cat => cat.isPrimary);
      if (primaryCategories.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Solo puede haber una categoría principal'
        });
      }

      await ProfileModel.updateWorkerCategories(userId, categories);

      // Obtener categorías actualizadas
      const updatedCategories = await ProfileModel.getWorkerCategories(userId);

      res.json({
        success: true,
        message: 'Categorías actualizadas exitosamente',
        data: updatedCategories
      });

      logger.info(`Categorías actualizadas para usuario ${userId}`);
    } catch (error) {
      logger.error('Error actualizando categorías:', error);
      next(error);
    }
  }
}

module.exports = ProfileController;
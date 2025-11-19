// src/controllers/location.controller.js
// Controlador para funcionalidades de geolocalización

const ProfileModel = require('../models/profile.model');
const logger = require('../utils/logger');

class LocationController {
  // ============================
  // ACTUALIZAR UBICACIÓN DEL USUARIO
  // ============================
  static async updateLocation(req, res, next) {
    try {
      const userId = req.user.id;
      const { city, department, latitude, longitude } = req.body;

      // Validar datos requeridos
      if (!city || !department) {
        return res.status(400).json({
          success: false,
          message: 'Ciudad y departamento son requeridos'
        });
      }

      // Validar coordenadas si se proporcionan
      if (latitude !== undefined && longitude !== undefined) {
        if (latitude < -90 || latitude > 90) {
          return res.status(400).json({
            success: false,
            message: 'Latitud inválida (debe estar entre -90 y 90)'
          });
        }

        if (longitude < -180 || longitude > 180) {
          return res.status(400).json({
            success: false,
            message: 'Longitud inválida (debe estar entre -180 y 180)'
          });
        }
      }

      const updatedProfile = await ProfileModel.updateLocation(userId, {
        city,
        department,
        latitude,
        longitude
      });

      logger.info(`Ubicación actualizada para usuario ${userId}`);

      res.json({
        success: true,
        message: 'Ubicación actualizada exitosamente',
        data: updatedProfile
      });
    } catch (error) {
      logger.error('Error actualizando ubicación:', error);
      next(error);
    }
  }

  // ============================
  // BUSCAR TRABAJADORES CERCANOS
  // ============================
  static async getNearbyWorkers(req, res, next) {
    try {
      const { latitude, longitude, radius, categoryId, minRating } = req.query;

      // Validar coordenadas requeridas
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridas'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = radius ? parseFloat(radius) : 10; // Default 10km

      // Validar coordenadas
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas'
        });
      }

      const workers = await ProfileModel.getNearbyWorkers({
        latitude: lat,
        longitude: lng,
        radius: rad,
        categoryId: categoryId || null,
        minRating: minRating ? parseFloat(minRating) : null,
        limit: 50
      });

      logger.info(`Búsqueda de trabajadores cercanos: ${workers.length} resultados`);

      res.json({
        success: true,
        data: workers,
        total: workers.length,
        filters: {
          latitude: lat,
          longitude: lng,
          radius: rad,
          categoryId: categoryId || null,
          minRating: minRating || null
        }
      });
    } catch (error) {
      logger.error('Error buscando trabajadores cercanos:', error);
      next(error);
    }
  }

  // ============================
  // BUSCAR OFERTAS DE TRABAJO CERCANAS
  // ============================
  static async getNearbyJobs(req, res, next) {
    try {
      const { latitude, longitude, radius } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridas'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = radius ? parseFloat(radius) : 10;

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas'
        });
      }

      const queryText = `
        SELECT 
          jp.*,
          p.first_name,
          p.last_name,
          p.profile_picture_url,
          calculate_distance($1, $2, jp.latitude, jp.longitude) as distance_km
        FROM jobs jp
        INNER JOIN profiles p ON jp.client_id = p.user_id
        WHERE 
          jp.status = 'active'
          AND jp.latitude IS NOT NULL
          AND jp.longitude IS NOT NULL
          AND calculate_distance($1, $2, jp.latitude, jp.longitude) <= $3
        ORDER BY distance_km ASC
        LIMIT 50
      `;

      const { query } = require('../config/database');
      const result = await query(queryText, [lat, lng, rad]);

      logger.info(`Búsqueda de trabajos cercanos: ${result.rows.length} resultados`);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        filters: {
          latitude: lat,
          longitude: lng,
          radius: rad
        }
      });
    } catch (error) {
      logger.error('Error buscando trabajos cercanos:', error);
      next(error);
    }
  }

  // ============================
  // GEOCODIFICACIÓN REVERSA (Obtener dirección de coordenadas)
  // ============================
  static async reverseGeocode(req, res, next) {
    try {
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridas'
        });
      }

      // Aquí podrías integrar Google Maps Geocoding API
      // Por ahora retornamos un placeholder
      res.json({
        success: true,
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: 'Dirección no disponible (implementar Geocoding API)',
          city: null,
          department: null
        }
      });
    } catch (error) {
      logger.error('Error en geocodificación reversa:', error);
      next(error);
    }
  }
}

module.exports = LocationController;
// src/models/gallery.model.js
// Modelo para gestión de galería de trabajos
const { query } = require('../config/database');
const logger = require('../utils/logger');

class GalleryModel {
  // ============================
  // CREAR FOTO
  // ============================
  static async create(galleryData) {
    try {
      const {
        workerId,
        photoUrl,
        description,
        categoryId,
        displayOrder,
        isFeatured
      } = galleryData;

      const insertQuery = `
        INSERT INTO gallery_photos (
          worker_id, photo_url, description, category_id, 
          display_order, is_featured
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await query(insertQuery, [
        workerId,
        photoUrl,
        description || null,
        categoryId || null,
        displayOrder || 0,
        isFeatured || false
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creando foto de galería:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER GALERÍA DE TRABAJADOR
  // ============================
  static async getByWorkerId(workerId, filters = {}) {
    try {
      const { categoryId, limit = 50 } = filters;

      let whereConditions = ['worker_id = $1'];
      let queryParams = [workerId];
      let paramIndex = 2;

      if (categoryId) {
        whereConditions.push(`category_id = $${paramIndex}`);
        queryParams.push(categoryId);
        paramIndex++;
      }

      const selectQuery = `
        SELECT 
          gp.*,
          c.name as category_name,
          c.icon as category_icon
        FROM gallery_photos gp
        LEFT JOIN categories c ON gp.category_id = c.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY gp.is_featured DESC, gp.display_order ASC, gp.created_at DESC
        LIMIT $${paramIndex}
      `;

      queryParams.push(limit);

      const result = await query(selectQuery, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo galería:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER FOTO POR ID
  // ============================
  static async getById(photoId) {
    try {
      const selectQuery = `
        SELECT 
          gp.*,
          c.name as category_name
        FROM gallery_photos gp
        LEFT JOIN categories c ON gp.category_id = c.id
        WHERE gp.id = $1
      `;

      const result = await query(selectQuery, [photoId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error obteniendo foto:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR FOTO
  // ============================
  static async update(photoId, updateData) {
    try {
      const { description, categoryId, displayOrder, isFeatured } = updateData;

      const updateQuery = `
        UPDATE gallery_photos
        SET 
          description = COALESCE($1, description),
          category_id = COALESCE($2, category_id),
          display_order = COALESCE($3, display_order),
          is_featured = COALESCE($4, is_featured),
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;

      const result = await query(updateQuery, [
        description,
        categoryId,
        displayOrder,
        isFeatured,
        photoId
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error actualizando foto:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR FOTO
  // ============================
  static async delete(photoId) {
    try {
      const deleteQuery = `
        DELETE FROM gallery_photos
        WHERE id = $1
        RETURNING *
      `;

      const result = await query(deleteQuery, [photoId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error eliminando foto:', error);
      throw error;
    }
  }

  // ============================
  // CONTAR FOTOS DE TRABAJADOR
  // ============================
  static async countByWorker(workerId) {
    try {
      const countQuery = `
        SELECT COUNT(*) as total
        FROM gallery_photos
        WHERE worker_id = $1
      `;

      const result = await query(countQuery, [workerId]);
      return parseInt(result.rows[0].total);
    } catch (error) {
      logger.error('Error contando fotos:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR COMO DESTACADA
  // ============================
  static async setFeatured(photoId, workerId) {
    try {
      // Primero, quitar featured de todas las fotos del trabajador
      await query(
        'UPDATE gallery_photos SET is_featured = false WHERE worker_id = $1',
        [workerId]
      );

      // Luego, marcar esta como featured
      const updateQuery = `
        UPDATE gallery_photos
        SET is_featured = true
        WHERE id = $1 AND worker_id = $2
        RETURNING *
      `;

      const result = await query(updateQuery, [photoId, workerId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error marcando foto como destacada:', error);
      throw error;
    }
  }

  // ============================
  // REORDENAR FOTOS
  // ============================
  static async reorder(workerId, photoIds) {
    try {
      // photoIds es un array con el orden deseado [id1, id2, id3...]
      const updatePromises = photoIds.map((photoId, index) => {
        return query(
          'UPDATE gallery_photos SET display_order = $1 WHERE id = $2 AND worker_id = $3',
          [index, photoId, workerId]
        );
      });

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      logger.error('Error reordenando fotos:', error);
      throw error;
    }
  }
}

module.exports = GalleryModel;
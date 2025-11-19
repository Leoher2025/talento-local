// src/services/galleryService.js
// Servicio para gestión de galería de trabajos

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class GalleryService {
  constructor() {
    this.baseURL = API_URL || 'http://192.168.101.10:5000/api';
  }

  // Método genérico para hacer peticiones
  async fetchAPI(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;

      // Agregar token si existe
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      console.log('Fetching:', url);
      const response = await fetch(url, options);
      const data = await response.json();

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('Error en fetchAPI:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER GALERÍA
  // ============================

  // Obtener galería de un trabajador (público)
  async getWorkerGallery(workerId, categoryId = null) {
    try {
      let endpoint = `/gallery/worker/${workerId}`;
      if (categoryId) {
        endpoint += `?categoryId=${categoryId}`;
      }

      const response = await this.fetchAPI(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo galería:', error);
      throw error;
    }
  }

  // Obtener mi galería
  async getMyGallery(categoryId = null) {
    try {
      let endpoint = '/gallery/my';
      if (categoryId) {
        endpoint += `?categoryId=${categoryId}`;
      }

      const response = await this.fetchAPI(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo mi galería:', error);
      throw error;
    }
  }

  // ============================
  // SUBIR FOTO
  // ============================
  async uploadPhoto(photoUri, description = '', categoryId = null, isFeatured = false) {
    try {
      const formData = new FormData();
      
      // Agregar la foto
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'gallery-photo.jpg'
      });

      // Agregar campos opcionales
      if (description) {
        formData.append('description', description);
      }
      if (categoryId) {
        formData.append('categoryId', categoryId);
      }
      formData.append('isFeatured', isFeatured.toString());

      const token = await AsyncStorage.getItem('accessToken');

      const response = await fetch(`${this.baseURL}/gallery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error subiendo foto');
      }

      return data;
    } catch (error) {
      console.error('Error subiendo foto:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR FOTO
  // ============================
  async updatePhoto(photoId, updates) {
    try {
      const response = await this.fetchAPI(`/gallery/${photoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      return response;
    } catch (error) {
      console.error('Error actualizando foto:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR FOTO
  // ============================
  async deletePhoto(photoId) {
    try {
      const response = await this.fetchAPI(`/gallery/${photoId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Error eliminando foto:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR COMO DESTACADA
  // ============================
  async setFeatured(photoId) {
    try {
      const response = await this.fetchAPI(`/gallery/${photoId}/featured`, {
        method: 'PATCH'
      });

      return response;
    } catch (error) {
      console.error('Error marcando como destacada:', error);
      throw error;
    }
  }

  // ============================
  // REORDENAR FOTOS
  // ============================
  async reorderPhotos(photoIds) {
    try {
      const response = await this.fetchAPI('/gallery/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photoIds })
      });

      return response;
    } catch (error) {
      console.error('Error reordenando fotos:', error);
      throw error;
    }
  }
}

export default new GalleryService();
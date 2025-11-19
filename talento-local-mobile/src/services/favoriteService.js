// src/services/favoriteService.js
// Servicio para gestión de favoritos

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class FavoriteService {
  constructor() {
    this.baseURL = API_URL || 'http://192.168.101.3:5000/api';
  }

  // Método genérico para hacer peticiones
  async fetchAPI(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;

      // Agregar token
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      // Headers por defecto
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

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
  // AGREGAR A FAVORITOS
  // ============================
  async addFavorite(favoriteType, favoriteId, notes = null) {
    try {
      const response = await this.fetchAPI('/favorites', {
        method: 'POST',
        body: JSON.stringify({ favoriteType, favoriteId, notes })
      });

      return response;
    } catch (error) {
      console.error('Error agregando favorito:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR DE FAVORITOS
  // ============================
  async removeFavorite(favoriteType, favoriteId) {
    try {
      const response = await this.fetchAPI(`/favorites/${favoriteType}/${favoriteId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      throw error;
    }
  }

  // ============================
  // TOGGLE FAVORITO
  // ============================
  async toggleFavorite(favoriteType, favoriteId) {
    try {
      const response = await this.fetchAPI('/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ favoriteType, favoriteId })
      });

      return response;
    } catch (error) {
      console.error('Error haciendo toggle:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICAR SI ES FAVORITO
  // ============================
  async isFavorite(favoriteType, favoriteId) {
    try {
      const response = await this.fetchAPI(`/favorites/check/${favoriteType}/${favoriteId}`);
      return response.data.is_favorite;
    } catch (error) {
      console.error('Error verificando favorito:', error);
      return false;
    }
  }

  // ============================
  // OBTENER TODOS LOS FAVORITOS
  // ============================
  async getAllFavorites() {
    try {
      const response = await this.fetchAPI('/favorites');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TRABAJADORES FAVORITOS
  // ============================
  async getFavoriteWorkers() {
    try {
      const response = await this.fetchAPI('/favorites/workers');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo trabajadores favoritos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER TRABAJOS FAVORITOS
  // ============================
  async getFavoriteJobs() {
    try {
      const response = await this.fetchAPI('/favorites/jobs');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo trabajos favoritos:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER CONTADOR
  // ============================
  async getFavoritesCount() {
    try {
      const response = await this.fetchAPI('/favorites/count');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo contador:', error);
      return { workers_count: 0, jobs_count: 0, total_count: 0 };
    }
  }

  // ============================
  // ACTUALIZAR NOTAS
  // ============================
  async updateNotes(favoriteType, favoriteId, notes) {
    try {
      const response = await this.fetchAPI(`/favorites/${favoriteType}/${favoriteId}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ notes })
      });

      return response;
    } catch (error) {
      console.error('Error actualizando notas:', error);
      throw error;
    }
  }
}

export default new FavoriteService();
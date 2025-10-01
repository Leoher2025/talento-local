// src/services/reviewService.js
// Servicio para manejo de reviews y calificaciones

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class ReviewService {
  constructor() {
    this.baseURL = `${API_URL}/reviews`;
  }

  // Método auxiliar para hacer peticiones
  async fetchAPI(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

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
  // CREAR REVIEW
  // ============================
  async createReview(reviewData) {
    try {
      const response = await this.fetchAPI('/', {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
      return response;
    } catch (error) {
      console.error('Error creando review:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER REVIEWS DE UN USUARIO
  // ============================
  async getUserReviews(userId, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
        ...(params.minRating && { minRating: params.minRating })
      }).toString();

      const response = await this.fetchAPI(`/user/${userId}?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo reviews del usuario:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER ESTADÍSTICAS DE REVIEWS
  // ============================
  async getUserReviewStats(userId) {
    try {
      const response = await this.fetchAPI(`/user/${userId}/stats`);
      return response;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER REVIEW POR ID
  // ============================
  async getReviewById(reviewId) {
    try {
      const response = await this.fetchAPI(`/${reviewId}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo review:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER REVIEWS DE UN TRABAJO
  // ============================
  async getJobReviews(jobId) {
    try {
      const response = await this.fetchAPI(`/job/${jobId}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo reviews del trabajo:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER MIS REVIEWS (DADAS POR MÍ)
  // ============================
  async getMyReviews(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10
      }).toString();

      const response = await this.fetchAPI(`/my/given?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo mis reviews:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICAR SI PUEDE DEJAR REVIEW
  // ============================
  async checkCanReview(jobId, revieweeId) {
    try {
      const response = await this.fetchAPI(
        `/check/can-review?jobId=${jobId}&revieweeId=${revieweeId}`
      );
      return response;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      throw error;
    }
  }

  // ============================
  // ACTUALIZAR REVIEW
  // ============================
  async updateReview(reviewId, updateData) {
    try {
      const response = await this.fetchAPI(`/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      return response;
    } catch (error) {
      console.error('Error actualizando review:', error);
      throw error;
    }
  }

  // ============================
  // AGREGAR RESPUESTA
  // ============================
  async addResponse(reviewId, responseText) {
    try {
      const response = await this.fetchAPI(`/${reviewId}/response`, {
        method: 'POST',
        body: JSON.stringify({ response: responseText })
      });
      return response;
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      throw error;
    }
  }

  // ============================
  // ELIMINAR REVIEW
  // ============================
  async deleteReview(reviewId) {
    try {
      const response = await this.fetchAPI(`/${reviewId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error eliminando review:', error);
      throw error;
    }
  }

  // ============================
  // VOTAR ÚTIL/NO ÚTIL
  // ============================
  async voteHelpful(reviewId, isHelpful) {
    try {
      const response = await this.fetchAPI(`/${reviewId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ isHelpful })
      });
      return response;
    } catch (error) {
      console.error('Error votando review:', error);
      throw error;
    }
  }

  // ============================
  // REPORTAR REVIEW
  // ============================
  async reportReview(reviewId, reason, description = '') {
    try {
      const response = await this.fetchAPI(`/${reviewId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, description })
      });
      return response;
    } catch (error) {
      console.error('Error reportando review:', error);
      throw error;
    }
  }
}

export default new ReviewService();
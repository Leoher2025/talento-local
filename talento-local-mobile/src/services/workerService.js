// src/services/workerService.js
// Servicio para búsqueda y gestión de trabajadores

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class WorkerService {
  constructor() {
    this.baseURL = `${API_URL}/workers`;
  }

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

  // Buscar trabajadores con filtros
  async searchWorkers(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.minRating) queryParams.append('minRating', filters.minRating);
      if (filters.latitude && filters.longitude) {
        queryParams.append('latitude', filters.latitude);
        queryParams.append('longitude', filters.longitude);
        if (filters.radiusKm) queryParams.append('radiusKm', filters.radiusKm);
      }
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      
      queryParams.append('page', filters.page || 1);
      queryParams.append('limit', filters.limit || 20);

      const endpoint = `/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.fetchAPI(endpoint);
      
      return {
        workers: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1
        },
        filters: response.filters || {}
      };
    } catch (error) {
      console.error('Error buscando trabajadores:', error);
      return {
        workers: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 }
      };
    }
  }

  // Obtener perfil de trabajador
  async getWorkerProfile(workerId) {
    try {
      const response = await this.fetchAPI(`/${workerId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  }
}

export default new WorkerService();
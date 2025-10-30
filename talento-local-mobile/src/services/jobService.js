//- Servicio para comunicación con el backend de trabajos
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class JobService {
  constructor() {
    this.baseURL = API_URL || 'http://192.168.101.3:5000/api';
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

      // Headers por defecto
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      console.log('Fetching:', url);
      console.log('Options:', options);

      const response = await fetch(url, options);
      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        // Mostrar errores de validación específicos
        if (data.errors) {
          console.error('Errores de validación:', data.errors);
        }
        throw new Error(data.message || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('Error en fetchAPI:', error);
      throw error;
    }
  }

  // ============================
  // CATEGORÍAS
  // ============================

  async getCategories() {
    try {
      const response = await this.fetchAPI('/jobs/categories');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return [];
    }
  }

  // ============================
  // TRABAJOS
  // ============================

  // Obtener trabajos con filtros avanzados
  async getJobs(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Búsqueda de texto
      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      // Categoría
      if (filters.categoryId) {
        queryParams.append('categoryId', filters.categoryId);
      }

      // Ubicación
      if (filters.city) {
        queryParams.append('city', filters.city);
      }
      if (filters.department) {
        queryParams.append('department', filters.department);
      }

      // Presupuesto
      if (filters.budgetMin !== undefined) {
        queryParams.append('budgetMin', filters.budgetMin);
      }
      if (filters.budgetMax !== undefined) {
        queryParams.append('budgetMax', filters.budgetMax);
      }
      if (filters.budgetType) {
        queryParams.append('budgetType', filters.budgetType);
      }

      // Urgencia
      if (filters.urgency) {
        queryParams.append('urgency', filters.urgency);
      }

      // Coordenadas para búsqueda por distancia
      if (filters.latitude && filters.longitude) {
        queryParams.append('latitude', filters.latitude);
        queryParams.append('longitude', filters.longitude);
        if (filters.radiusKm) {
          queryParams.append('radiusKm', filters.radiusKm);
        }
      }

      // Ordenamiento
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }

      // Paginación
      queryParams.append('page', filters.page || 1);
      queryParams.append('limit', filters.limit || 20);

      const endpoint = `/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.fetchAPI(endpoint);

      return {
        jobs: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1
        },
        filters: response.filters || {}
      };
    } catch (error) {
      console.error('Error obteniendo trabajos:', error);
      return {
        jobs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };
    }
  }

  // Obtener ubicaciones disponibles
  async getLocations() {
    try {
      const response = await this.fetchAPI('/jobs/locations');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo ubicaciones:', error);
      return [];
    }
  }

  // Obtener rangos de presupuesto
  async getBudgetRanges() {
    try {
      const response = await this.fetchAPI('/jobs/budget-ranges');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo rangos:', error);
      return [];
    }
  }

  // Obtener estadísticas de búsqueda
  async getSearchStats() {
    try {
      const response = await this.fetchAPI('/jobs/search-stats');
      return response.data || {};
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {};
    }
  }

  // Obtener detalle de un trabajo
  async getJobById(jobId) {
    try {
      const response = await this.fetchAPI(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo trabajo:', error);
      throw error;
    }
  }

  // Crear nuevo trabajo
  async createJob(jobData) {
    try {

      const response = await this.fetchAPI('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData)
      });

      return response;
    } catch (error) {
      console.error('Error creando trabajo:', error);
      throw error;
    }
  }

  // Obtener mis trabajos publicados
  async getMyJobs(status = null) {
    try {
      const endpoint = status
        ? `/jobs/my/all?status=${status}`
        : '/jobs/my/all';

      const response = await this.fetchAPI(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo mis trabajos:', error);
      return [];
    }
  }

  // Actualizar trabajo
  async updateJob(jobId, updateData) {
    try {
      const response = await this.fetchAPI(`/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return response;
    } catch (error) {
      console.error('Error actualizando trabajo:', error);
      throw error;
    }
  }

  // Cambiar estado del trabajo
  async updateJobStatus(jobId, status) {
    try {
      const response = await this.fetchAPI(`/jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      return response;
    } catch (error) {
      console.error('Error cambiando estado:', error);
      throw error;
    }
  }

  // Eliminar trabajo
  async deleteJob(jobId) {
    try {
      const response = await this.fetchAPI(`/jobs/${jobId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Error eliminando trabajo:', error);
      throw error;
    }
  }

  // ============================
  // APLICACIONES (para el futuro)
  // ============================

  // Aplicar a un trabajo
  async applyToJob(jobId, applicationData) {
    try {
      const response = await this.fetchAPI(`/jobs/${jobId}/apply`, {
        method: 'POST',
        body: JSON.stringify(applicationData)
      });

      return response;
    } catch (error) {
      console.error('Error aplicando al trabajo:', error);
      throw error;
    }
  }

  // Obtener trabajos asignados a mí como trabajador
  async getMyAssignedJobs(status = null) {
    try {
      const endpoint = status
        ? `/jobs/my/assigned?status=${status}`
        : '/jobs/my/assigned';

      const response = await this.fetchAPI(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis trabajos asignados:', error);
      throw error;
    }
  }

  // Obtener aplicaciones de un trabajo
  async getJobApplications(jobId) {
    try {
      const response = await this.fetchAPI(`/jobs/${jobId}/applications`);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo aplicaciones:', error);
      return [];
    }
  }
}

export default new JobService();
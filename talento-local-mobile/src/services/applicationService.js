// src/services/application.service.js
// Servicio para comunicación con el backend de aplicaciones
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class ApplicationService {
  constructor() {
    this.baseURL = API_URL || 'http://192.168.101.14:5000/api';
  }

  // Método genérico para hacer peticiones (igual que jobService)
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
  // APLICACIONES - TRABAJADOR
  // ============================
  
  // Aplicar a un trabajo
  async applyToJob(applicationData) {
    try {
      const response = await this.fetchAPI('/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData)
      });
      
      return response;
    } catch (error) {
      console.error('Error aplicando al trabajo:', error);
      throw error;
    }
  }

  // Obtener mis aplicaciones como trabajador
  async getMyApplications(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar filtros si existen
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/applications/my${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchAPI(endpoint);
      
      return {
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error obteniendo mis aplicaciones:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };
    }
  }

  // Verificar si ya aplicó a un trabajo
  async checkIfApplied(jobId) {
    try {
      const response = await this.fetchAPI(`/applications/check/${jobId}`);
      return response;
    } catch (error) {
      console.error('Error verificando aplicación:', error);
      return { data: { has_applied: false } };
    }
  }

  // Cancelar mi aplicación
  async cancelApplication(applicationId) {
    try {
      const response = await this.fetchAPI(`/applications/${applicationId}/cancel`, {
        method: 'PATCH'
      });
      
      return response;
    } catch (error) {
      console.error('Error cancelando aplicación:', error);
      throw error;
    }
  }

  // ============================
  // APLICACIONES - CLIENTE
  // ============================
  
  // Obtener aplicaciones de un trabajo (como cliente)
  async getJobApplications(jobId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar filtros si existen
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/applications/job/${jobId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchAPI(endpoint);
      
      return {
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error obteniendo aplicaciones del trabajo:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };
    }
  }

  // Aceptar una aplicación
  async acceptApplication(applicationId) {
    try {
      const response = await this.fetchAPI(`/applications/${applicationId}/accept`, {
        method: 'PATCH'
      });
      
      return response;
    } catch (error) {
      console.error('Error aceptando aplicación:', error);
      throw error;
    }
  }

  // Rechazar una aplicación
  async rejectApplication(applicationId) {
    try {
      const response = await this.fetchAPI(`/applications/${applicationId}/reject`, {
        method: 'PATCH'
      });
      
      return response;
    } catch (error) {
      console.error('Error rechazando aplicación:', error);
      throw error;
    }
  }

  // ============================
  // COMÚN - AMBOS ROLES
  // ============================
  
  // Obtener estadísticas
  async getStats() {
    try {
      const response = await this.fetchAPI('/applications/stats');
      return response;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        data: {
          total_applications: 0,
          pending_applications: 0,
          accepted_applications: 0,
          rejected_applications: 0,
          success_rate: 0
        }
      };
    }
  }

  // Obtener detalle de una aplicación
  async getApplicationById(applicationId) {
    try {
      const response = await this.fetchAPI(`/applications/${applicationId}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo aplicación:', error);
      throw error;
    }
  }

  // ============================
  // UTILIDADES LOCALES
  // ============================
  
  // Guardar borrador de aplicación localmente
  async saveDraft(jobId, data) {
    try {
      const key = `application_draft_${jobId}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error('Error guardando borrador:', error);
      return false;
    }
  }

  // Obtener borrador guardado
  async getDraft(jobId) {
    try {
      const key = `application_draft_${jobId}`;
      const draft = await AsyncStorage.getItem(key);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Error obteniendo borrador:', error);
      return null;
    }
  }

  // Eliminar borrador
  async deleteDraft(jobId) {
    try {
      const key = `application_draft_${jobId}`;
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error eliminando borrador:', error);
      return false;
    }
  }
}

export default new ApplicationService();
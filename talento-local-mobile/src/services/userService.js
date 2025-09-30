// src/services/userService.js
// Servicio para manejo de perfiles y usuarios

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class UserService {
  constructor() {
    this.baseURL = API_URL;
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
      
      const response = await fetch(url, options);
      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

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
  // PERFIL DE USUARIO
  // ============================

  // Obtener perfil por ID
  async getProfile(userId) {
    try {
      const response = await this.fetchAPI(`/profiles/${userId}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  // Obtener mi perfil
  async getMyProfile() {
    try {
      const response = await this.fetchAPI('/profiles/me');
      return response;
    } catch (error) {
      console.error('Error obteniendo mi perfil:', error);
      throw error;
    }
  }

  // Actualizar perfil
  async updateProfile(profileData) {
    try {
      const response = await this.fetchAPI('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      return response;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  // ============================
  // FOTO DE PERFIL
  // ============================

  // Subir foto de perfil
  async uploadProfilePicture(imageUri) {
    try {
      const formData = new FormData();
      
      // Preparar imagen para upload
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('profilePicture', {
        uri: imageUri,
        name: filename,
        type: type
      });
      
      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${this.baseURL}/profiles/upload-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al subir la imagen');
      }
      
      return data;
    } catch (error) {
      console.error('Error subiendo foto de perfil:', error);
      throw error;
    }
  }

  // Eliminar foto de perfil
  async deleteProfilePicture() {
    try {
      const response = await this.fetchAPI('/profiles/delete-picture', {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error eliminando foto de perfil:', error);
      throw error;
    }
  }

  // ============================
  // GALERÍA DE TRABAJOS (PARA TRABAJADORES)
  // ============================

  // Obtener galería de trabajos
  async getWorkGallery(workerId) {
    try {
      const response = await this.fetchAPI(`/profiles/${workerId}/gallery`);
      return response;
    } catch (error) {
      console.error('Error obteniendo galería:', error);
      throw error;
    }
  }

  // Subir foto a la galería
  async uploadGalleryPhoto(imageUri, caption = '') {
    try {
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: imageUri,
        name: filename,
        type: type
      });
      
      if (caption) {
        formData.append('caption', caption);
      }

      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${this.baseURL}/profiles/gallery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al subir la imagen');
      }

      return data;
    } catch (error) {
      console.error('Error subiendo foto a galería:', error);
      throw error;
    }
  }

  // Eliminar foto de la galería
  async deleteGalleryPhoto(photoId) {
    try {
      const response = await this.fetchAPI(`/profiles/gallery/${photoId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error eliminando foto de galería:', error);
      throw error;
    }
  }

  // ============================
  // VERIFICACIÓN
  // ============================

  // Verificar teléfono
  async verifyPhone(code) {
    try {
      const response = await this.fetchAPI('/profiles/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      return response;
    } catch (error) {
      console.error('Error verificando teléfono:', error);
      throw error;
    }
  }

  // Solicitar verificación de identidad
  async requestIdentityVerification(documentData) {
    try {
      const formData = new FormData();
      
      // Documento frontal
      if (documentData.frontImage) {
        formData.append('documentFront', {
          uri: documentData.frontImage,
          name: 'document_front.jpg',
          type: 'image/jpeg'
        });
      }

      // Documento reverso
      if (documentData.backImage) {
        formData.append('documentBack', {
          uri: documentData.backImage,
          name: 'document_back.jpg',
          type: 'image/jpeg'
        });
      }

      // Tipo de documento
      formData.append('documentType', documentData.type);

      const token = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${this.baseURL}/profiles/verify-identity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la verificación');
      }

      return data;
    } catch (error) {
      console.error('Error en verificación de identidad:', error);
      throw error;
    }
  }

  // ============================
  // ESTADÍSTICAS
  // ============================

  // Obtener estadísticas del usuario
  async getUserStats(userId) {
    try {
      const response = await this.fetchAPI(`/profiles/${userId}/stats`);
      return response;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ============================
  // PREFERENCIAS
  // ============================

  // Actualizar preferencias de notificaciones
  async updateNotificationPreferences(preferences) {
    try {
      const response = await this.fetchAPI('/profiles/preferences/notifications', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      return response;
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      throw error;
    }
  }

  // Actualizar configuración de privacidad
  async updatePrivacySettings(settings) {
    try {
      const response = await this.fetchAPI('/profiles/preferences/privacy', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      return response;
    } catch (error) {
      console.error('Error actualizando privacidad:', error);
      throw error;
    }
  }
}

export default new UserService();
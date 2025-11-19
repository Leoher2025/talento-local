// src/services/verificationService.js
// Servicio para verificación de identidad

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class VerificationService {
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
  // VERIFICACIÓN SMS
  // ============================

  // Enviar código SMS
  async sendSMSCode(phone) {
    try {
      const response = await this.fetchAPI('/verification/send-sms', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });

      return response;
    } catch (error) {
      console.error('Error enviando código SMS:', error);
      throw error;
    }
  }

  // Verificar código SMS
  async verifySMSCode(code) {
    try {
      const response = await this.fetchAPI('/verification/verify-sms', {
        method: 'POST',
        body: JSON.stringify({ code })
      });

      return response;
    } catch (error) {
      console.error('Error verificando código SMS:', error);
      throw error;
    }
  }

  // Reenviar código
  async resendCode() {
    try {
      const response = await this.fetchAPI('/verification/resend-code', {
        method: 'POST'
      });

      return response;
    } catch (error) {
      console.error('Error reenviando código:', error);
      throw error;
    }
  }

  // ============================
  // ESTADO DE VERIFICACIÓN
  // ============================

  // Obtener estado de verificación
  async getStatus() {
    try {
      const response = await this.fetchAPI('/verification/status');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado de verificación:', error);
      throw error;
    }
  }

  // ============================
  // FOTO DE PERFIL
  // ============================

  // Marcar foto como verificada (manual)
  async verifyPhoto() {
    try {
      const response = await this.fetchAPI('/verification/verify-photo', {
        method: 'POST'
      });

      return response;
    } catch (error) {
      console.error('Error verificando foto:', error);
      throw error;
    }
  }
}

export default new VerificationService();
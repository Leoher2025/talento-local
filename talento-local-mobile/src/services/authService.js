// src/services/authService.js - Servicio para comunicación con el backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

class AuthService {
  constructor() {
    // URL base del API (cambiar según tu configuración)
    // Para desarrollo local con dispositivo físico, usa tu IP local
    // Para emulador Android: 10.0.2.2
    // Para emulador iOS: localhost
    this.baseURL = API_URL || 'http://192.168.101.14:5000/api'; // Cambia a tu IP local
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
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }
      
      return data;
    } catch (error) {
      console.error('Error en fetchAPI:', error);
      throw error;
    }
  }

  // Login
  async login(email, password) {
    try {
      const response = await this.fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe: true })
      });
      
      return response;
    } catch (error) {
      console.error('Error en login service:', error);
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión'
      };
    }
  }

  // Registro
  async register(userData) {
    try {
      const response = await this.fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      return response;
    } catch (error) {
      console.error('Error en register service:', error);
      return {
        success: false,
        message: error.message || 'Error al registrar usuario'
      };
    }
  }

  // Logout
  async logout(refreshToken) {
    try {
      const response = await this.fetchAPI('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
      
      return response;
    } catch (error) {
      console.error('Error en logout service:', error);
      return { success: false };
    }
  }

  // Refresh Token
  async refreshToken(refreshToken) {
    try {
      const response = await this.fetchAPI('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error en refresh token:', error);
      return null;
    }
  }

  // Verificar token
  async verifyToken(token) {
    try {
      // Decodificar el JWT para verificar expiración
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Date.now() / 1000;
      
      // Verificar si el token ha expirado
      if (payload.exp && payload.exp < now) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  }

  // Obtener perfil del usuario actual
  async getProfile() {
    try {
      const response = await this.fetchAPI('/auth/me', {
        method: 'GET'
      });
      
      return response;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return { success: false };
    }
  }

  // Verificar email
  async verifyEmail(token) {
    try {
      const response = await this.fetchAPI(`/auth/verify-email/${token}`, {
        method: 'GET'
      });
      
      return response;
    } catch (error) {
      console.error('Error verificando email:', error);
      return { success: false };
    }
  }

  // Solicitar restablecimiento de contraseña
  async forgotPassword(email) {
    try {
      const response = await this.fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      return response;
    } catch (error) {
      console.error('Error en forgot password:', error);
      return {
        success: false,
        message: error.message || 'Error al solicitar restablecimiento'
      };
    }
  }

  // Cambiar contraseña
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.fetchAPI('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: newPassword
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar contraseña'
      };
    }
  }
}

export default new AuthService();
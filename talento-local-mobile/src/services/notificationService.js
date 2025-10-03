// src/services/notificationService.js
// Servicio para gestionar notificaciones push con Expo

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { API_URL } from '../utils/constants';

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.baseURL = `${API_URL}/notifications`;
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
  // OBTENER TOKEN DE EXPO
  // ============================
  async getExpoPushToken() {
    try {
      if (!Device.isDevice) {
        console.log('Las notificaciones push solo funcionan en dispositivos físicos');
        return null;
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permisos de notificación no concedidos');
        return null;
      }

      // Obtener token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
      });

      console.log('Expo Push Token obtenido:', token.data);

      // Configurar canal de Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error obteniendo Expo Push Token:', error);
      return null;
    }
  }

  // ============================
  // REGISTRAR TOKEN EN EL SERVIDOR
  // ============================
  async registerToken() {
    try {
      const token = await this.getExpoPushToken();

      if (!token) {
        console.log('No se pudo obtener token de notificaciones');
        return false;
      }

      const deviceType = Platform.OS;
      const deviceName = Device.deviceName || Platform.select({
        ios: 'iPhone',
        android: 'Android Device'
      });

      await this.fetchAPI('/token', {
        method: 'POST',
        body: JSON.stringify({
          token,
          deviceType,
          deviceName
        })
      });

      // Guardar token localmente
      await AsyncStorage.setItem('pushToken', token);
      console.log('Token registrado en el servidor');

      return true;
    } catch (error) {
      console.error('Error registrando token:', error);
      return false;
    }
  }

  // ============================
  // ELIMINAR TOKEN
  // ============================
  async removeToken() {
    try {
      const token = await AsyncStorage.getItem('pushToken');

      if (token) {
        await this.fetchAPI('/token', {
          method: 'DELETE',
          body: JSON.stringify({ token })
        });

        await AsyncStorage.removeItem('pushToken');
      }

      console.log('Token eliminado');
    } catch (error) {
      console.error('Error eliminando token:', error);
    }
  }

  // ============================
  // CONFIGURAR LISTENERS
  // ============================
  setupNotificationListeners(onNotification, onNotificationOpened) {
    // Listener para notificaciones recibidas
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);

      if (onNotification) {
        onNotification(notification);
      }
    });

    // Listener para cuando se toca una notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notificación tocada:', response);

      if (onNotificationOpened) {
        onNotificationOpened(response.notification);
      }
    });

    // ✅ CORRECCIÓN: Retornar función que llama .remove() en cada listener
    return () => {
      if (notificationListener && notificationListener.remove) {
        notificationListener.remove();
      }
      if (responseListener && responseListener.remove) {
        responseListener.remove();
      }
    };
  }

  // ============================
  // OBTENER MIS NOTIFICACIONES
  // ============================
  async getNotifications(limit = 50, offset = 0) {
    try {
      const response = await this.fetchAPI(`?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR COMO LEÍDA
  // ============================
  async markAsRead(notificationId) {
    try {
      await this.fetchAPI(`/${notificationId}/read`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Error marcando como leída:', error);
      throw error;
    }
  }

  // ============================
  // MARCAR TODAS COMO LEÍDAS
  // ============================
  async markAllAsRead() {
    try {
      await this.fetchAPI('/read-all', {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      throw error;
    }
  }

  // ============================
  // OBTENER CONTADOR NO LEÍDAS
  // ============================
  async getUnreadCount() {
    try {
      const response = await this.fetchAPI('/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Error obteniendo contador:', error);
      return 0;
    }
  }

  // ============================
  // ENVIAR NOTIFICACIÓN LOCAL (PRUEBA)
  // ============================
  async sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Inmediata
    });
  }
}

export default new NotificationService();
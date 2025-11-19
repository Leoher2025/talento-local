// src/services/locationService.js
// Servicio para manejo de geolocalización

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';
import { Linking, Platform, Alert } from 'react-native';

class LocationService {
  constructor() {
    this.baseURL = API_URL || 'http://192.168.101.3:5000/api';
    this.currentLocation = null;
  }

  // ============================
  // PERMISOS DE UBICACIÓN
  // ============================

  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Talento Local necesita acceso a tu ubicación para mostrarte trabajadores cercanos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  async hasPermissions() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }

  // ============================
  // OBTENER UBICACIÓN ACTUAL
  // ============================

  async getCurrentLocation() {
    try {
      const hasPermission = await this.hasPermissions();
      
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Guardar última ubicación
      await AsyncStorage.setItem(
        'lastKnownLocation',
        JSON.stringify(this.currentLocation)
      );

      return this.currentLocation;
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      
      // Intentar usar última ubicación conocida
      return await this.getLastKnownLocation();
    }
  }

  async getLastKnownLocation() {
    try {
      const saved = await AsyncStorage.getItem('lastKnownLocation');
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Ubicación por defecto (Guatemala City)
      return {
        latitude: 14.6349,
        longitude: -90.5069,
      };
    } catch (error) {
      console.error('Error obteniendo última ubicación:', error);
      return {
        latitude: 14.6349,
        longitude: -90.5069,
      };
    }
  }

  // ============================
  // API CALLS
  // ============================

  async fetchAPI(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = await AsyncStorage.getItem('accessToken');

      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
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

  // ============================
  // ACTUALIZAR UBICACIÓN DEL USUARIO
  // ============================

  async updateUserLocation(locationData) {
    try {
      const response = await this.fetchAPI('/location', {
        method: 'PUT',
        body: JSON.stringify(locationData),
      });

      return response;
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      throw error;
    }
  }

  // ============================
  // BUSCAR TRABAJADORES CERCANOS
  // ============================

  async getNearbyWorkers({ latitude, longitude, radius = 10, categoryId = null, minRating = null }) {
    try {
      let endpoint = `/location/workers/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      
      if (categoryId) {
        endpoint += `&categoryId=${categoryId}`;
      }
      
      if (minRating) {
        endpoint += `&minRating=${minRating}`;
      }

      const response = await this.fetchAPI(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error buscando trabajadores cercanos:', error);
      throw error;
    }
  }

  // ============================
  // BUSCAR OFERTAS CERCANAS
  // ============================

  async getNearbyJobs({ latitude, longitude, radius = 10 }) {
    try {
      const endpoint = `/location/jobs/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      const response = await this.fetchAPI(endpoint);
      return response.data || [];
    } catch (error) {
      console.error('Error buscando ofertas cercanas:', error);
      throw error;
    }
  }

  // ============================
  // GEOCODIFICACIÓN REVERSA
  // ============================

  async reverseGeocode(latitude, longitude) {
    try {
      const endpoint = `/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}`;
      const response = await this.fetchAPI(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error en geocodificación reversa:', error);
      throw error;
    }
  }

  // ============================
  // NAVEGACIÓN GPS
  // ============================

  openInMaps(latitude, longitude, label = 'Destino') {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
    });
  }

  openInGoogleMaps(latitude, longitude) {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir Google Maps');
    });
  }

  openInWaze(latitude, longitude) {
    const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Waze no está instalado');
    });
  }

  showNavigationOptions(latitude, longitude, label = 'Destino') {
    Alert.alert(
      'Navegar a',
      label,
      [
        {
          text: 'Google Maps',
          onPress: () => this.openInGoogleMaps(latitude, longitude),
        },
        {
          text: 'Waze',
          onPress: () => this.openInWaze(latitude, longitude),
        },
        {
          text: 'App de Mapas',
          onPress: () => this.openInMaps(latitude, longitude, label),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }

  // ============================
  // CALCULAR DISTANCIA (Cliente side)
  // ============================

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // en kilómetros
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }
}

export default new LocationService();
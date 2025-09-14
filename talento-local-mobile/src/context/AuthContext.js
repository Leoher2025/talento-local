// src/context/AuthContext.js - Manejo global del estado de autenticación
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import authService from '../services/authService';

// Crear el contexto
const AuthContext = createContext({});

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay una sesión guardada al iniciar la app
  useEffect(() => {
    checkAuthState();
  }, []);

  // Verificar estado de autenticación
  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      
      // Obtener tokens guardados
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (accessToken && userData) {
        // Verificar si el token sigue siendo válido
        const isValid = await authService.verifyToken(accessToken);
        
        if (isValid) {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } else if (refreshToken) {
          // Intentar renovar el token
          const newTokens = await authService.refreshToken(refreshToken);
          if (newTokens) {
            await AsyncStorage.setItem('accessToken', newTokens.accessToken);
            await AsyncStorage.setItem('refreshToken', newTokens.refreshToken);
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
          } else {
            // Tokens expirados, limpiar sesión
            await logout();
          }
        } else {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de login
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      const response = await authService.login(email, password);
      
      if (response.success) {
        // Guardar tokens y datos del usuario
        await AsyncStorage.setItem('accessToken', response.data.tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        Toast.show({
          type: 'success',
          text1: '¡Bienvenido!',
          text2: 'Has iniciado sesión exitosamente'
        });
        
        return { success: true };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error al iniciar sesión',
          text2: response.message || 'Credenciales inválidas'
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo conectar con el servidor'
      });
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Función de registro
  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        // Guardar tokens y datos del usuario
        await AsyncStorage.setItem('accessToken', response.data.tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        Toast.show({
          type: 'success',
          text1: '¡Cuenta creada!',
          text2: 'Tu registro ha sido exitoso'
        });
        
        return { success: true };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error al registrar',
          text2: response.message || 'No se pudo crear la cuenta'
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo conectar con el servidor'
      });
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      // Llamar al endpoint de logout si hay refresh token
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      // Limpiar almacenamiento local
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
      
      setUser(null);
      setIsAuthenticated(false);
      
      Toast.show({
        type: 'info',
        text1: 'Sesión cerrada',
        text2: 'Has cerrado sesión exitosamente'
      });
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Actualizar datos del usuario
  const updateUser = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error actualizando usuario:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
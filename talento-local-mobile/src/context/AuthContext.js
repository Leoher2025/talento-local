// src/context/AuthContext.js - Manejo global del estado de autenticación
import { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

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
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Verificar si hay una sesión guardada al iniciar la app
  useEffect(() => {
    checkAuthState();
  }, []);

  // Función para actualizar contador de notificaciones
  const updateUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadNotifications(count);
    } catch (error) {
      console.error('Error actualizando contador:', error);
    }
  };

  // Configurar listeners de notificaciones
  useEffect(() => {
    let unsubscribe;

    if (user) {
      // Configurar listeners
      unsubscribe = notificationService.setupNotificationListeners(
        // Callback cuando llega notificación
        (notification) => {
          console.log('Nueva notificación:', notification);
          updateUnreadCount();
        },
        // Callback cuando se abre notificación
        (notification) => {
          console.log('Notificación abierta:', notification);
          handleNotificationNavigation(notification);
        }
      );

      // Actualizar contador al iniciar
      updateUnreadCount();
    }

    // Cleanup al desmontar o cuando cambia user
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  // Manejar navegación desde notificación
  const handleNotificationNavigation = (notification) => {
    const data = notification.request?.content?.data || notification.data;

    if (!data) return;

    // Navegar según el tipo de notificación
    switch (data.screen) {
      case 'ChatScreen':
        // navigation.navigate('ChatScreen', { conversationId: data.conversationId });
        break;
      case 'JobDetail':
        // navigation.navigate('JobDetail', { jobId: data.jobId });
        break;
      case 'ManageApplications':
        // navigation.navigate('ManageApplications', { jobId: data.jobId });
        break;
      default:
        break;
    }
  };

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
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

        // Reestructurar los datos del usuario para un acceso más fácil
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          phone: response.data.user.phone,
          role: response.data.user.role,
          verificationStatus: response.data.user.verificationStatus,
          // Aplanar los datos del perfil para acceso más fácil
          first_name: response.data.user.profile?.first_name || '',
          last_name: response.data.user.profile?.last_name || '',
          profile_picture_url: response.data.user.profile?.profile_picture_url || null,
          // Mantener también el objeto profile completo
          profile: response.data.user.profile
        };

        setUser(userData);
        setIsAuthenticated(true);

        // Guardar en almacenamiento local
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        // Registrar token de notificaciones
        await notificationService.registerToken();

        Toast.show({
          type: 'success',
          text1: '¡Bienvenido!',
          text2: `Hola ${userData.first_name || userData.email}`
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
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

        // Reestructurar los datos del usuario similar al login
        const userDataFormatted = {
          id: response.data.user.id,
          email: response.data.user.email,
          phone: response.data.user.phone,
          role: response.data.user.role,
          verificationStatus: response.data.user.verificationStatus,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          profile_picture_url: null,
          profile: response.data.user.profile
        };

        await AsyncStorage.setItem('userData', JSON.stringify(userDataFormatted));

        setUser(userDataFormatted);
        setIsAuthenticated(true);

        Toast.show({
          type: 'success',
          text1: '¡Cuenta creada!',
          text2: 'Tu registro ha sido exitoso'
        });

        // Registrar token de notificaciones
        await notificationService.registerToken();

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

      // Eliminar token de notificaciones
      await notificationService.removeToken();

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
  const updateUser = async (updatedUserData) => {
    try {
      // Actualizar el estado del usuario con los nuevos datos
      const newUserData = {
        ...user,
        ...updatedUserData
      };

      setUser(newUserData);

      // Guardar en almacenamiento local
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));

      console.log('Usuario actualizado:', newUserData);
      return true;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return false;
    }
  };

  // Recargar datos del usuario desde el servidor
  const refreshUserData = async () => {
    try {
      console.log('🔄 refreshUserData: Iniciando...');
      const response = await authService.getProfile();
      console.log('📥 refreshUserData: Respuesta:', JSON.stringify(response, null, 2));

      if (response.success) {
        const userData = {
          ...user,
          ...response.data.user,
          profile: response.data.profile,
          // ✅ Asegurarse de que profile_picture_url esté en el nivel superior
          profile_picture_url: response.data.profile?.profile_picture_url || response.data.user?.profile_picture_url,
          first_name: response.data.profile?.first_name || response.data.user?.first_name,
          last_name: response.data.profile?.last_name || response.data.user?.last_name,
        };

        console.log('💾 refreshUserData: Guardando userData:', JSON.stringify(userData, null, 2));
        setUser(userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ refreshUserData error:', error);
      return false;
    }
  };

  // Valor del contexto que se exporta
  const value = {
    // Estados
    user,
    isLoading,
    isAuthenticated,

    // Funciones
    login,
    register,
    logout,
    updateUser,
    refreshUserData,
    checkAuthState,
    unreadNotifications,
    updateUnreadCount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
// src/navigation/AppNavigator.js - Navegación principal de la app
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

// Importar pantallas
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Pantallas de trabajos
import JobsListScreen from '../screens/jobs/JobsListScreen';
import CreateJobScreen from '../screens/jobs/CreateJobScreen';
import MyJobsScreen from '../screens/jobs/MyJobsScreen';
// import JobDetailScreen from '../screens/jobs/JobDetailScreen'; // Próxima a crear
// import EditJobScreen from '../screens/jobs/EditJobScreen'; // Próxima a crear

const Stack = createNativeStackNavigator();

// Stack de autenticación (usuarios no logueados)
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Iniciar Sesión',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          title: 'Crear Cuenta',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ 
          title: 'Recuperar Contraseña',
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
};

// Stack principal (usuarios logueados)
const MainStack = () => {
  const { user } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Talento Local',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Mi Perfil',
        }}
      />
      <Stack.Screen 
        name="JobsList" 
        component={JobsListScreen}
        options={{ 
          title: 'Trabajos Disponibles',
        }}
      />
      <Stack.Screen 
        name="CreateJob" 
        component={CreateJobScreen}
        options={{ 
          title: 'Publicar Trabajo',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="MyJobs" 
        component={MyJobsScreen}
        options={{ 
          title: 'Mis Trabajos',
        }}
      />
      {/* Próximas pantallas
      <Stack.Screen 
        name="JobDetail" 
        component={JobDetailScreen}
        options={{ 
          title: 'Detalle del Trabajo',
        }}
      />
      <Stack.Screen 
        name="EditJob" 
        component={EditJobScreen}
        options={{ 
          title: 'Editar Trabajo',
        }}
      />
      */}
    </Stack.Navigator>
  );
};

// Navegador principal
export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          // Mostrar splash screen mientras carga
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : isAuthenticated ? (
          // Usuario autenticado - mostrar app principal
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          // Usuario no autenticado - mostrar auth
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
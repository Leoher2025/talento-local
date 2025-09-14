// App.js - Punto de entrada principal de la aplicación móvil
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { toastConfig } from './src/utils/toastConfig';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
        <Toast config={toastConfig} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
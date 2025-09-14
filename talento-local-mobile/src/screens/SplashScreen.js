// src/screens/SplashScreen.js - Pantalla de carga inicial
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../utils/constants';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🛠️</Text>
        <Text style={styles.title}>Talento Local</Text>
        <Text style={styles.subtitle}>Conectando talento con oportunidades</Text>
      </View>
      
      <ActivityIndicator 
        size="large" 
        color={COLORS.primary} 
        style={styles.loader}
      />
      
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  
  logo: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  
  loader: {
    marginBottom: SPACING.md,
  },
  
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
});
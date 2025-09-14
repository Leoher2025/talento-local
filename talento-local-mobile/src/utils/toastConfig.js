// src/utils/toastConfig.js - Configuración personalizada para Toast Messages
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from './constants';

// Configuración de los diferentes tipos de toast
export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.container, styles.success]}>
      <Text style={styles.title}>✅ {text1}</Text>
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  ),
  
  error: ({ text1, text2 }) => (
    <View style={[styles.container, styles.error]}>
      <Text style={styles.title}>❌ {text1}</Text>
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  ),
  
  info: ({ text1, text2 }) => (
    <View style={[styles.container, styles.info]}>
      <Text style={styles.title}>ℹ️ {text1}</Text>
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  ),
  
  warning: ({ text1, text2 }) => (
    <View style={[styles.container, styles.warning]}>
      <Text style={styles.title}>⚠️ {text1}</Text>
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  success: {
    backgroundColor: COLORS.success,
  },
  
  error: {
    backgroundColor: COLORS.error,
  },
  
  info: {
    backgroundColor: COLORS.info,
  },
  
  warning: {
    backgroundColor: COLORS.warning,
  },
  
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  
  message: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    opacity: 0.9,
  },
});
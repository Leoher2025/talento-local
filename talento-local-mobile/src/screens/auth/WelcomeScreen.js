// src/screens/auth/WelcomeScreen.js - Pantalla de bienvenida/onboarding
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con Logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>🛠️</Text>
          <Text style={styles.title}>Talento Local</Text>
          <Text style={styles.subtitle}>
            Encuentra el trabajo perfecto o el profesional ideal
          </Text>
        </View>

        {/* Ilustración o características */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔍</Text>
            <Text style={styles.featureTitle}>Busca</Text>
            <Text style={styles.featureText}>
              Encuentra profesionales calificados en tu área
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💼</Text>
            <Text style={styles.featureTitle}>Conecta</Text>
            <Text style={styles.featureText}>
              Contacta directamente con trabajadores locales
            </Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⭐</Text>
            <Text style={styles.featureTitle}>Califica</Text>
            <Text style={styles.featureText}>
              Lee reseñas y comparte tu experiencia
            </Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al continuar, aceptas nuestros{' '}
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.link}>Términos de Servicio</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> y </Text>
            <TouchableOpacity>
              <Text style={styles.link}>Política de Privacidad</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  
  logo: {
    fontSize: 100,
    marginBottom: SPACING.md,
  },
  
  title: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  
  featuresContainer: {
    marginVertical: SPACING.xl,
  },
  
  feature: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  
  featureIcon: {
    fontSize: 50,
    marginBottom: SPACING.sm,
  },
  
  featureTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  featureText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  buttonContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  
  link: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
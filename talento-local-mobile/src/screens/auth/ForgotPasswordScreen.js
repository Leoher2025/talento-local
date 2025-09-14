// src/screens/auth/ForgotPasswordScreen.js - Pantalla de recuperación de contraseña
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, VALIDATION } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import authService from '../../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  // Validar email
  const validateEmail = () => {
    if (!email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      setError('Email inválido');
      return false;
    }
    return true;
  };

  // Manejar envío de email
  const handleSendEmail = async () => {
    if (!validateEmail()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.forgotPassword(email.toLowerCase().trim());
      
      if (response.success) {
        setEmailSent(true);
        Toast.show({
          type: 'success',
          text1: 'Email enviado',
          text2: 'Revisa tu bandeja de entrada',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'No se pudo enviar el email',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo conectar con el servidor',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar contenido según el estado
  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.title}>¡Email Enviado!</Text>
            <Text style={styles.subtitle}>
              Hemos enviado instrucciones para restablecer tu contraseña a:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>¿Qué hacer ahora?</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>1.</Text>
              <Text style={styles.infoText}>
                Revisa tu bandeja de entrada
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>2.</Text>
              <Text style={styles.infoText}>
                Haz clic en el enlace del email
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>3.</Text>
              <Text style={styles.infoText}>
                Crea tu nueva contraseña
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Volver al Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}
          >
            <Text style={styles.resendButtonText}>
              ¿No recibiste el email? Intentar de nuevo
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.icon}>🔐</Text>
            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.subtitle}>
              No te preocupes, te ayudaremos a recuperarla
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={COLORS.text.secondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>

            <Text style={styles.helpText}>
              Te enviaremos un enlace a tu email para que puedas crear una nueva contraseña.
            </Text>

            {/* Botón de Enviar */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendEmail}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Enviar Email</Text>
              )}
            </TouchableOpacity>

            {/* Link a login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.loginLinkText}>
                Recordé mi contraseña, volver al login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  keyboardView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: SPACING.sm,
  },
  
  backButtonText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
  },
  
  icon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  
  successIcon: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  
  emailText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  
  form: {
    flex: 1,
  },
  
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  
  label: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  buttonDisabled: {
    opacity: 0.6,
  },
  
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  
  loginLink: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  
  loginLinkText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.base,
    textDecorationLine: 'underline',
  },
  
  infoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.xl,
  },
  
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  
  infoNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  
  resendButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  
  resendButtonText: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.sm,
    textDecorationLine: 'underline',
  },
});
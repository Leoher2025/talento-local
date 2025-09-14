// src/screens/auth/LoginScreen.js - Pantalla de inicio de sesión
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
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, VALIDATION } from '../../utils/constants';
import Toast from 'react-native-toast-message';

export default function LoginScreen({ navigation }) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!VALIDATION.EMAIL_REGEX.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Mínimo ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar login
  const handleLogin = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Errores en el formulario',
        text2: 'Por favor revisa los campos marcados',
      });
      return;
    }

    const result = await login(email.toLowerCase().trim(), password);
    
    if (!result.success) {
      // El toast ya se muestra en el contexto
    }
  };

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
            
            <Text style={styles.logo}>🛠️</Text>
            <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para continuar
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Campo Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={COLORS.text.secondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: null });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Campo Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.text.secondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: null });
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Olvidé mi contraseña */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            {/* Botón de Login */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>O</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botones sociales (opcional para futuro) */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                disabled={isLoading}
              >
                <Text style={styles.socialIcon}>📧</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                disabled={isLoading}
              >
                <Text style={styles.socialIcon}>📘</Text>
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Link a registro */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                ¿No tienes cuenta?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Regístrate</Text>
              </TouchableOpacity>
            </View>
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
  
  logo: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  
  form: {
    flex: 1,
  },
  
  inputContainer: {
    marginBottom: SPACING.md,
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
  
  passwordContainer: {
    position: 'relative',
  },
  
  passwordInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    paddingRight: SPACING.xl + 20,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },
  
  eyeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  
  eyeIcon: {
    fontSize: FONT_SIZES.xl,
  },
  
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
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
  
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  
  separatorText: {
    marginHorizontal: SPACING.md,
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.sm,
  },
  
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
  },
  
  socialIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.xs,
  },
  
  socialText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  
  footerText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  
  linkText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
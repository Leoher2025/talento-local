// src/screens/auth/RegisterScreen.js - Pantalla de registro de usuarios
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
  Switch,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, VALIDATION, USER_ROLES } from '../../utils/constants';
import Toast from 'react-native-toast-message';

export default function RegisterScreen({ navigation }) {
  const { register, isLoading } = useAuth();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.CLIENT, // Por defecto es cliente
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    } else if (formData.firstName.length < VALIDATION.NAME_MIN_LENGTH) {
      newErrors.firstName = `Mínimo ${VALIDATION.NAME_MIN_LENGTH} caracteres`;
    }

    // Validar apellido
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    } else if (formData.lastName.length < VALIDATION.NAME_MIN_LENGTH) {
      newErrors.lastName = `Mínimo ${VALIDATION.NAME_MIN_LENGTH} caracteres`;
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar teléfono (opcional pero si se ingresa debe ser válido)
    if (formData.phone && !VALIDATION.PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = 'Número de teléfono inválido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Mínimo ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe contener mayúsculas, minúsculas y números';
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar términos y condiciones
    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar registro
  const handleRegister = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Errores en el formulario',
        text2: 'Por favor revisa los campos marcados',
      });
      return;
    }

    const result = await register({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.trim() || null,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
    });

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
            
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a nuestra comunidad
            </Text>
          </View>

          {/* Selector de Rol */}
          <View style={styles.roleSelector}>
            <Text style={styles.label}>¿Qué tipo de cuenta quieres crear?</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === USER_ROLES.CLIENT && styles.roleButtonActive
                ]}
                onPress={() => updateField('role', USER_ROLES.CLIENT)}
                disabled={isLoading}
              >
                <Text style={styles.roleIcon}>🏠</Text>
                <Text style={[
                  styles.roleButtonText,
                  formData.role === USER_ROLES.CLIENT && styles.roleButtonTextActive
                ]}>
                  Cliente
                </Text>
                <Text style={styles.roleDescription}>
                  Busco profesionales
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === USER_ROLES.WORKER && styles.roleButtonActive
                ]}
                onPress={() => updateField('role', USER_ROLES.WORKER)}
                disabled={isLoading}
              >
                <Text style={styles.roleIcon}>🔧</Text>
                <Text style={[
                  styles.roleButtonText,
                  formData.role === USER_ROLES.WORKER && styles.roleButtonTextActive
                ]}>
                  Trabajador
                </Text>
                <Text style={styles.roleDescription}>
                  Ofrezco servicios
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Nombre y Apellido en una fila */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Juan"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.firstName}
                  onChangeText={(text) => updateField('firstName', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Pérez"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.lastName}
                  onChangeText={(text) => updateField('lastName', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={COLORS.text.secondary}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Teléfono */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono (opcional)</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="50212345678"
                placeholderTextColor={COLORS.text.secondary}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
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

            {/* Confirmar Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Términos y Condiciones */}
            <View style={styles.termsContainer}>
              <Switch
                value={acceptTerms}
                onValueChange={setAcceptTerms}
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                thumbColor={acceptTerms ? COLORS.white : COLORS.gray[100]}
                disabled={isLoading}
              />
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.link}>términos y condiciones</Text>
                {' '}y la{' '}
                <Text style={styles.link}>política de privacidad</Text>
              </Text>
            </View>
            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {/* Botón de Registro */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            {/* Link a login */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                ¿Ya tienes cuenta?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Inicia Sesión</Text>
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
    marginBottom: SPACING.lg,
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
  
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
  },
  
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  
  roleSelector: {
    marginBottom: SPACING.lg,
  },
  
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  
  roleButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  
  roleIcon: {
    fontSize: 30,
    marginBottom: SPACING.xs,
  },
  
  roleButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },
  
  roleButtonTextActive: {
    color: COLORS.primary,
  },
  
  roleDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  form: {
    flex: 1,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  inputContainer: {
    marginBottom: SPACING.md,
  },
  
  halfInput: {
    flex: 1,
    marginHorizontal: SPACING.xs,
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
  
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingRight: SPACING.lg,
  },
  
  termsText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
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
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
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
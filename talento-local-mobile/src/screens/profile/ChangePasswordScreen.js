// src/screens/profile/ChangePasswordScreen.js
// Pantalla para cambiar contraseña

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import authService from '../../services/authService';

export default function ChangePasswordScreen({ navigation }) {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validar contraseña actual
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    // Validar nueva contraseña
    if (!formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    // Validar confirmación
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    try {
      // Validar formulario
      if (!validateForm()) {
        return;
      }

      setIsLoading(true);

      // Llamar al servicio
      const response = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: '¡Contraseña actualizada!',
          text2: 'Tu contraseña se ha cambiado correctamente',
        });

        // Mostrar alerta y logout
        Alert.alert(
          'Contraseña Actualizada',
          'Por seguridad, debes iniciar sesión nuevamente con tu nueva contraseña.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                });
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // Manejar errores específicos
        if (response.message?.includes('incorrecta')) {
          setErrors({ currentPassword: 'La contraseña actual es incorrecta' });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: response.message || 'No se pudo cambiar la contraseña',
          });
        }
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ocurrió un error al cambiar la contraseña',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
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
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            <Text style={styles.description}>
              Por tu seguridad, necesitamos verificar tu contraseña actual antes de cambiarla.
            </Text>

            {/* Contraseña Actual */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña actual</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    errors.currentPassword && styles.inputError,
                  ]}
                  value={formData.currentPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, currentPassword: text });
                    setErrors({ ...errors, currentPassword: null });
                  }}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor={COLORS.text.secondary}
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('current')}
                >
                  <Text style={styles.eyeIcon}>
                    {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              )}
            </View>

            {/* Nueva Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    errors.newPassword && styles.inputError,
                  ]}
                  value={formData.newPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, newPassword: text });
                    setErrors({ ...errors, newPassword: null });
                  }}
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor={COLORS.text.secondary}
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('new')}
                >
                  <Text style={styles.eyeIcon}>
                    {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
              <Text style={styles.hint}>
                Mínimo 6 caracteres
              </Text>
            </View>

            {/* Confirmar Nueva Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar nueva contraseña</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  value={formData.confirmPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, confirmPassword: text });
                    setErrors({ ...errors, confirmPassword: null });
                  }}
                  placeholder="Confirma tu nueva contraseña"
                  placeholderTextColor={COLORS.text.secondary}
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('confirm')}
                >
                  <Text style={styles.eyeIcon}>
                    {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Consejos de seguridad */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>🔒 Consejos de seguridad:</Text>
              <Text style={styles.tipText}>• Usa una combinación de letras, números y símbolos</Text>
              <Text style={styles.tipText}>• No uses información personal fácil de adivinar</Text>
              <Text style={styles.tipText}>• No reutilices contraseñas de otros sitios</Text>
            </View>

            {/* Botón de cambiar contraseña */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword || isLoading) &&
                styles.submitButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitIcon}>🔐</Text>
                  <Text style={styles.submitButtonText}>Cambiar Contraseña</Text>
                </>
              )}
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
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  backButton: {
    padding: SPACING.xs,
  },
  
  backIcon: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.primary,
  },
  
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  placeholder: {
    width: 30,
  },
  
  content: {
    padding: SPACING.lg,
  },
  
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  inputContainer: {
    position: 'relative',
  },
  
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    paddingRight: 50,
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  
  eyeIcon: {
    fontSize: FONT_SIZES.xl,
  },
  
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  
  hint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  
  tipsContainer: {
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.xl,
  },
  
  tipsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: SPACING.sm,
  },
  
  tipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  
  submitIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },
  
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});
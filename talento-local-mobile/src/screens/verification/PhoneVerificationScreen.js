// src/screens/verification/PhoneVerificationScreen.js
// Pantalla para verificar teléfono con SMS

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import verificationService from '../../services/verificationService';
import { useAuth } from '../../context/AuthContext';

export default function PhoneVerificationScreen({ navigation }) {
  const { user, loadVerificationStatus } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Ingreso de teléfono, 2: Verificación de código
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const codeInputs = useRef([]);

  // Countdown para reenviar código
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, step]);

  const formatPhoneNumber = (text) => {
    // Remover caracteres no numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Limitar a 8 dígitos
    const limited = cleaned.substring(0, 8);
    
    // Formatear: XXXX-XXXX
    if (limited.length > 4) {
      return limited.substring(0, 4) + '-' + limited.substring(4);
    }
    
    return limited;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const handleSendCode = async () => {
    if (phone.replace('-', '').length !== 8) {
      Alert.alert('Error', 'Ingresa un número de teléfono válido de 8 dígitos');
      return;
    }

    try {
      setIsLoading(true);
      
      // Agregar código de país
      const fullPhone = `+502${phone.replace('-', '')}`;
      
      await verificationService.sendSMSCode(fullPhone);
      
      Toast.show({
        type: 'success',
        text1: 'Código enviado',
        text2: 'Revisa tus mensajes SMS'
      });
      
      setStep(2);
      setCountdown(60);
      setCanResend(false);
      
      // Focus en el primer input
      setTimeout(() => {
        codeInputs.current[0]?.focus();
      }, 500);
      
    } catch (error) {
      console.error('Error enviando código:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo enviar el código'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus al siguiente input
    if (text && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }

    // Verificar automáticamente cuando se complete el código
    if (newCode.every(digit => digit !== '') && !isLoading) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeString = null) => {
    const verificationCode = codeString || code.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }

    try {
      setIsLoading(true);
      
      await verificationService.verifySMSCode(verificationCode);
      
      // Recargar estado de verificación
      await loadVerificationStatus();
      
      Toast.show({
        type: 'success',
        text1: '¡Verificado!',
        text2: 'Tu teléfono ha sido verificado exitosamente'
      });
      
      // Regresar a la pantalla anterior
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
      
    } catch (error) {
      console.error('Error verificando código:', error);
      
      // Limpiar código
      setCode(['', '', '', '', '', '']);
      codeInputs.current[0]?.focus();
      
      Toast.show({
        type: 'error',
        text1: 'Código inválido',
        text2: 'Verifica el código e intenta nuevamente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setIsLoading(true);
      
      await verificationService.resendCode();
      
      Toast.show({
        type: 'success',
        text1: 'Código reenviado',
        text2: 'Revisa tus mensajes SMS'
      });
      
      setCountdown(60);
      setCanResend(false);
      
    } catch (error) {
      console.error('Error reenviando código:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo reenviar el código'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificar Teléfono</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Contenido */}
        <View style={styles.body}>
          {step === 1 ? (
            // PASO 1: Ingreso de teléfono
            <>
              <Text style={styles.icon}>📱</Text>
              <Text style={styles.title}>Verifica tu número</Text>
              <Text style={styles.subtitle}>
                Te enviaremos un código de verificación por SMS
              </Text>

              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+502</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="0000-0000"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  maxLength={9} // 8 dígitos + 1 guión
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Enviar Código</Text>
                )}
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Asegúrate de que el número sea correcto. El código llegará por SMS.
                </Text>
              </View>
            </>
          ) : (
            // PASO 2: Verificación de código
            <>
              <Text style={styles.icon}>🔐</Text>
              <Text style={styles.title}>Ingresa el código</Text>
              <Text style={styles.subtitle}>
                Enviamos un código de 6 dígitos a{'\n'}
                <Text style={styles.phoneHighlight}>+502 {phone}</Text>
              </Text>

              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (codeInputs.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {isLoading && (
                <ActivityIndicator 
                  size="large" 
                  color={COLORS.primary} 
                  style={styles.loader}
                />
              )}

              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendCode}>
                    <Text style={styles.resendText}>
                      Reenviar código
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.countdownText}>
                    Reenviar código en {countdown}s
                  </Text>
                )}
              </View>

              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.changePhoneText}>
                  Cambiar número de teléfono
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  body: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  phoneHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  countryCode: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
  },
  phoneInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  buttonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoBox: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  codeInput: {
    width: 50,
    height: 60,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  loader: {
    marginVertical: SPACING.lg,
  },
  resendContainer: {
    marginBottom: SPACING.lg,
  },
  resendText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  changePhoneText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textDecorationLine: 'underline',
  },
});
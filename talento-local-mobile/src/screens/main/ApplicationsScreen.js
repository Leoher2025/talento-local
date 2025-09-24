// src/screens/main/ApplicationsScreen.js - Pantalla para aplicar a un trabajo
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import applicationService from  '../../services/applicationService';
import jobService from '../../services/jobService';

export default function ApplicationsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { jobId } = route.params;

  const [job, setJob] = useState(null);
  const [message, setMessage] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    loadJobDetails();
    checkIfApplied();
  }, [jobId]);

  useEffect(() => {
    setCharCount(message.length);
  }, [message]);

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      const jobData = await jobService.getJobById(jobId);
      setJob(jobData);
      
      // Pre-llenar con el presupuesto del trabajo si existe
      if (jobData.budget_amount) {
        setProposedBudget(jobData.budget_amount.toString());
      }
    } catch (error) {
      console.error('Error cargando trabajo:', error);
      Alert.alert('Error', 'No se pudo cargar los detalles del trabajo');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await applicationService.checkIfApplied(jobId);
      setHasApplied(response.data?.has_applied || false);
    } catch (error) {
      console.error('Error verificando aplicación:', error);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (message.length < 20) {
      Alert.alert('Error', 'El mensaje debe tener al menos 20 caracteres');
      return;
    }

    if (message.length > 1000) {
      Alert.alert('Error', 'El mensaje no puede exceder 1000 caracteres');
      return;
    }

    if (proposedBudget && isNaN(proposedBudget)) {
      Alert.alert('Error', 'El presupuesto debe ser un número válido');
      return;
    }

    Alert.alert(
      'Confirmar Aplicación',
      '¿Estás seguro de que deseas aplicar a este trabajo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aplicar', onPress: submitApplication }
      ]
    );
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    try {
      await applicationService.applyToJob({
        jobId,
        message,
        proposedBudget: proposedBudget ? parseFloat(proposedBudget) : null
      });

      Alert.alert(
        '✅ ¡Éxito!',
        'Tu aplicación ha sido enviada exitosamente',
        [
          {
            text: 'Ver mis aplicaciones',
            onPress: () => navigation.navigate('MyApplications')
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo enviar la aplicación'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando detalles del trabajo...</Text>
      </View>
    );
  }

  if (hasApplied) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aplicar al Trabajo</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.appliedContainer}>
          <Text style={styles.appliedIcon}>✅</Text>
          <Text style={styles.appliedTitle}>Ya has aplicado a este trabajo</Text>
          <Text style={styles.appliedSubtitle}>
            Tu aplicación está siendo revisada por el cliente
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MyApplications')}
          >
            <Text style={styles.primaryButtonText}>Ver mis aplicaciones</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aplicar al Trabajo</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Información del trabajo */}
          <View style={styles.jobCard}>
            <Text style={styles.jobTitle}>{job?.title}</Text>
            <Text style={styles.jobDescription} numberOfLines={3}>
              {job?.description}
            </Text>
            
            <View style={styles.jobInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💰</Text>
                <Text style={styles.infoText}>
                  {job?.budget_type === 'fixed' 
                    ? `Q${job?.budget_amount || '0'}`
                    : job?.budget_type === 'hourly'
                    ? `Q${job?.budget_amount || '0'}/hora`
                    : 'A convenir'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText}>{job?.city}, {job?.department}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🏷️</Text>
                <Text style={styles.infoText}>{job?.category_name}</Text>
              </View>
            </View>
          </View>

          {/* Formulario de aplicación */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Tu Propuesta</Text>

            {/* Mensaje */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Mensaje para el cliente *</Text>
                <Text style={[
                  styles.charCounter,
                  charCount < 20 && styles.charCounterError
                ]}>
                  {charCount}/1000
                </Text>
              </View>
              
              <TextInput
                style={[
                  styles.textArea,
                  charCount < 20 && charCount > 0 && styles.inputError
                ]}
                placeholder="Explica por qué eres la persona ideal para este trabajo, tu experiencia relevante y cómo planeas abordar el proyecto..."
                placeholderTextColor={COLORS.text.secondary}
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
                maxLength={1000}
                textAlignVertical="top"
              />
              
              {charCount > 0 && charCount < 20 && (
                <Text style={styles.errorText}>
                  Mínimo 20 caracteres ({20 - charCount} restantes)
                </Text>
              )}
            </View>

            {/* Presupuesto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Presupuesto propuesto (opcional)</Text>
              <View style={styles.budgetInputContainer}>
                <Text style={styles.currencySymbol}>Q</Text>
                <TextInput
                  style={styles.budgetInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="decimal-pad"
                  value={proposedBudget}
                  onChangeText={setProposedBudget}
                />
              </View>
              <Text style={styles.helpText}>
                Presupuesto del cliente: Q{job?.budget_amount || 'No especificado'}
              </Text>
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Tips para una buena aplicación</Text>
              <Text style={styles.tipItem}>• Sé específico sobre tu experiencia relevante</Text>
              <Text style={styles.tipItem}>• Menciona trabajos similares que hayas realizado</Text>
              <Text style={styles.tipItem}>• Explica tu enfoque para resolver el problema</Text>
              <Text style={styles.tipItem}>• Sé profesional y cordial en tu mensaje</Text>
            </View>
          </View>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || charCount < 20) && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || charCount < 20}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitIcon}>📤</Text>
                <Text style={styles.submitButtonText}>Enviar Aplicación</Text>
              </>
            )}
          </TouchableOpacity>
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
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  backButton: {
    padding: SPACING.xs,
    width: 40,
  },
  
  backIcon: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.primary,
  },
  
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  
  appliedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  
  appliedIcon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  
  appliedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  
  appliedSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  
  jobCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  
  jobTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  jobDescription: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  
  jobInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  
  infoIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },
  
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  
  formSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  label: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  
  charCounter: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  
  charCounterError: {
    color: COLORS.error,
  },
  
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    minHeight: 120,
    backgroundColor: COLORS.white,
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  
  currencySymbol: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginRight: SPACING.xs,
  },
  
  budgetInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },
  
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  
  tipsCard: {
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
  },
  
  tipsTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: SPACING.sm,
  },
  
  tipItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  
  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  submitIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.xs,
  },
  
  submitButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },
  
  buttonDisabled: {
    backgroundColor: COLORS.gray[400],
    opacity: 0.7,
  },
  
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    textAlign: 'center',
  },
});
// src/screens/jobs/EditJobScreen.js - Pantalla para editar un trabajo existente
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import jobService from '../../services/jobService';

export default function EditJobScreen({ route, navigation }) {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [originalJob, setOriginalJob] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    budgetAmount: '',
    budgetType: 'negotiable',
    address: '',
    addressDetails: '',
    city: '',
    department: '',
    urgency: 'medium',
    neededDate: '',
  });
  
  const [errors, setErrors] = useState({});

  // Cargar datos al montar
  useEffect(() => {
    loadInitialData();
  }, [jobId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar categorías y detalle del trabajo en paralelo
      const [cats, jobData] = await Promise.all([
        jobService.getCategories(),
        jobService.getJobById(jobId)
      ]);

      setCategories(cats);
      
      // Verificar que el usuario sea el dueño
      if (jobData.client_id !== user?.id) {
        Alert.alert(
          'Sin permisos',
          'No tienes permisos para editar este trabajo',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Verificar que el trabajo esté en estado editable
      if (jobData.status !== 'active' && jobData.status !== 'draft') {
        Alert.alert(
          'No editable',
          'Solo puedes editar trabajos activos',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      setOriginalJob(jobData);
      
      // Llenar el formulario con los datos actuales
      setFormData({
        title: jobData.title || '',
        description: jobData.description || '',
        categoryId: jobData.category_id || '',
        budgetAmount: jobData.budget_amount ? String(jobData.budget_amount) : '',
        budgetType: jobData.budget_type || 'negotiable',
        address: jobData.address || '',
        addressDetails: jobData.address_details || '',
        city: jobData.city || '',
        department: jobData.department || '',
        urgency: jobData.urgency || 'medium',
        neededDate: jobData.needed_date ? jobData.needed_date.split('T')[0] : '',
      });
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el trabajo',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 20) {
      newErrors.description = 'La descripción debe tener al menos 20 caracteres';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Selecciona una categoría';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es requerido';
    }

    if (formData.budgetType === 'fixed' && !formData.budgetAmount) {
      newErrors.budgetAmount = 'Ingresa el presupuesto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificar si hay cambios
  const hasChanges = () => {
    if (!originalJob) return false;
    
    return (
      formData.title !== originalJob.title ||
      formData.description !== originalJob.description ||
      formData.categoryId !== originalJob.category_id ||
      formData.budgetAmount !== String(originalJob.budget_amount || '') ||
      formData.budgetType !== originalJob.budget_type ||
      formData.address !== originalJob.address ||
      formData.addressDetails !== (originalJob.address_details || '') ||
      formData.city !== originalJob.city ||
      formData.department !== originalJob.department ||
      formData.urgency !== originalJob.urgency ||
      formData.neededDate !== (originalJob.needed_date ? originalJob.needed_date.split('T')[0] : '')
    );
  };

  // Manejar actualización del trabajo
  const handleUpdateJob = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Errores en el formulario',
        text2: 'Por favor revisa los campos marcados',
      });
      return;
    }

    if (!hasChanges()) {
      Toast.show({
        type: 'info',
        text1: 'Sin cambios',
        text2: 'No has realizado ningún cambio',
      });
      return;
    }

    Alert.alert(
      'Confirmar cambios',
      '¿Estás seguro de que quieres guardar los cambios?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Guardar', 
          onPress: async () => {
            setIsSaving(true);

            try {
              // Preparar datos para enviar (solo los que cambiaron)
              const updateData = {};
              
              if (formData.title !== originalJob.title) {
                updateData.title = formData.title.trim();
              }
              if (formData.description !== originalJob.description) {
                updateData.description = formData.description.trim();
              }
              if (formData.categoryId !== originalJob.category_id) {
                updateData.category_id = formData.categoryId;
              }
              if (formData.budgetAmount !== String(originalJob.budget_amount || '')) {
                updateData.budget_amount = formData.budgetAmount ? parseFloat(formData.budgetAmount) : null;
              }
              if (formData.budgetType !== originalJob.budget_type) {
                updateData.budget_type = formData.budgetType;
              }
              if (formData.address !== originalJob.address) {
                updateData.address = formData.address.trim();
              }
              if (formData.addressDetails !== (originalJob.address_details || '')) {
                updateData.address_details = formData.addressDetails.trim() || null;
              }
              if (formData.city !== originalJob.city) {
                updateData.city = formData.city.trim();
              }
              if (formData.department !== originalJob.department) {
                updateData.department = formData.department.trim();
              }
              if (formData.urgency !== originalJob.urgency) {
                updateData.urgency = formData.urgency;
              }
              if (formData.neededDate !== (originalJob.needed_date ? originalJob.needed_date.split('T')[0] : '')) {
                updateData.needed_date = formData.neededDate || null;
              }

              console.log('Enviando actualización:', updateData);

              const response = await jobService.updateJob(jobId, updateData);

              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: '¡Trabajo actualizado!',
                  text2: 'Los cambios se han guardado exitosamente',
                });

                // Navegar de vuelta al detalle
                navigation.navigate('JobDetail', { jobId });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.message || 'No se pudo actualizar el trabajo',
                });
              }
            } catch (error) {
              console.error('Error actualizando trabajo:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo conectar con el servidor',
              });
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  // Manejar cancelación
  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro de que quieres descartar los cambios?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { 
            text: 'Descartar', 
            style: 'destructive',
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const urgencyOptions = [
    { label: 'Baja - No hay prisa', value: 'low' },
    { label: 'Media - En los próximos días', value: 'medium' },
    { label: 'Alta - Lo antes posible', value: 'high' },
    { label: 'Urgente - Necesito ayuda HOY', value: 'urgent' },
  ];

  const budgetTypeOptions = [
    { label: 'Precio fijo', value: 'fixed' },
    { label: 'Por hora', value: 'hourly' },
    { label: 'Negociable', value: 'negotiable' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando trabajo...</Text>
        </View>
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
              onPress={handleCancel}
            >
              <Text style={styles.backButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Editar Trabajo</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateJob}
              disabled={isSaving || !hasChanges()}
            >
              <Text style={[
                styles.saveButtonText,
                (!hasChanges() || isSaving) && styles.saveButtonTextDisabled
              ]}>
                Guardar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Indicador de cambios */}
          {hasChanges() && (
            <View style={styles.changesIndicator}>
              <Text style={styles.changesText}>Tienes cambios sin guardar</Text>
            </View>
          )}

          {/* Formulario */}
          <View style={styles.form}>
            {/* Título */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Ej: Reparar fuga de agua en la cocina"
                placeholderTextColor={COLORS.text.secondary}
                value={formData.title}
                onChangeText={(text) => updateField('title', text)}
                maxLength={200}
                editable={!isSaving}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
              <Text style={styles.charCount}>{formData.title.length}/200</Text>
            </View>

            {/* Categoría */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Categoría *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.categoryId}
                  onValueChange={(value) => updateField('categoryId', value)}
                  enabled={!isSaving}
                  style={styles.picker}
                >
                  {categories.map((cat) => (
                    <Picker.Item
                      key={cat.id}
                      label={`${cat.icon} ${cat.name}`}
                      value={cat.id}
                    />
                  ))}
                </Picker>
              </View>
              {errors.categoryId && (
                <Text style={styles.errorText}>{errors.categoryId}</Text>
              )}
            </View>

            {/* Descripción */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descripción detallada *</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                placeholder="Describe el trabajo que necesitas con el mayor detalle posible..."
                placeholderTextColor={COLORS.text.secondary}
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                multiline
                numberOfLines={4}
                maxLength={2000}
                editable={!isSaving}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
              <Text style={styles.charCount}>{formData.description.length}/2000</Text>
            </View>

            {/* Tipo de Presupuesto */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de presupuesto</Text>
              <View style={styles.radioGroup}>
                {budgetTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioButton,
                      formData.budgetType === option.value && styles.radioButtonActive
                    ]}
                    onPress={() => updateField('budgetType', option.value)}
                    disabled={isSaving}
                  >
                    <Text style={[
                      styles.radioText,
                      formData.budgetType === option.value && styles.radioTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Presupuesto (si es fijo o por hora) */}
            {formData.budgetType !== 'negotiable' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Presupuesto {formData.budgetType === 'hourly' ? 'por hora' : ''} (Q)
                </Text>
                <TextInput
                  style={[styles.input, errors.budgetAmount && styles.inputError]}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.budgetAmount}
                  onChangeText={(text) => updateField('budgetAmount', text)}
                  keyboardType="decimal-pad"
                  editable={!isSaving}
                />
                {errors.budgetAmount && (
                  <Text style={styles.errorText}>{errors.budgetAmount}</Text>
                )}
              </View>
            )}

            {/* Urgencia */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>¿Qué tan urgente es?</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.urgency}
                  onValueChange={(value) => updateField('urgency', value)}
                  enabled={!isSaving}
                  style={styles.picker}
                >
                  {urgencyOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Ubicación */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📍 Ubicación del trabajo</Text>
            </View>

            {/* Dirección */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dirección *</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="Ej: Zona 10, 4ta Avenida 15-25"
                placeholderTextColor={COLORS.text.secondary}
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
                editable={!isSaving}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>

            {/* Detalles de dirección */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Detalles adicionales (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Apartamento, torre, referencias..."
                placeholderTextColor={COLORS.text.secondary}
                value={formData.addressDetails}
                onChangeText={(text) => updateField('addressDetails', text)}
                editable={!isSaving}
              />
            </View>

            {/* Ciudad y Departamento */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>Ciudad *</Text>
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  placeholder="Ciudad"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.city}
                  onChangeText={(text) => updateField('city', text)}
                  editable={!isSaving}
                />
                {errors.city && (
                  <Text style={styles.errorText}>{errors.city}</Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>Departamento *</Text>
                <TextInput
                  style={[styles.input, errors.department && styles.inputError]}
                  placeholder="Departamento"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.department}
                  onChangeText={(text) => updateField('department', text)}
                  editable={!isSaving}
                />
                {errors.department && (
                  <Text style={styles.errorText}>{errors.department}</Text>
                )}
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.saveMainButton,
                  (!hasChanges() || isSaving) && styles.buttonDisabled
                ]}
                onPress={handleUpdateJob}
                disabled={isSaving || !hasChanges()}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveMainButtonText}>
                    {hasChanges() ? 'Guardar Cambios' : 'Sin Cambios'}
                  </Text>
                )}
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
    paddingBottom: SPACING.xl,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
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
    padding: SPACING.sm,
  },
  
  backButtonText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.secondary,
  },
  
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  saveButton: {
    padding: SPACING.sm,
  },
  
  saveButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  saveButtonTextDisabled: {
    color: COLORS.text.disabled,
  },
  
  changesIndicator: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  
  changesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '500',
  },
  
  form: {
    padding: SPACING.lg,
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
  
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  
  charCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  
  picker: {
    height: 50,
  },
  
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  
  radioButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  
  radioButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  
  radioText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
  },
  
  radioTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  sectionHeader: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  halfInput: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
  },
  
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  
  cancelButtonText: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  
  saveMainButton: {
    backgroundColor: COLORS.primary,
  },
  
  saveMainButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  
  buttonDisabled: {
    opacity: 0.6,
  },
});
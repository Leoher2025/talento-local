// src/screens/jobs/CreateJobScreen.js - Pantalla para crear un nuevo trabajo
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

export default function CreateJobScreen({ route, navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const { suggestedWorkerId, workerName } = route?.params || {}; // ✅ Recibir trabajador sugerido

  // Estado del formulario
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    budgetType: 'fixed',
    budgetAmount: '',
    location: '',
    city: '',
    department: '',
    latitude: null,
    longitude: null,
    urgency: 'medium',
    estimatedDuration: '',
    requiredSkills: '',
    suggestedWorkerId: suggestedWorkerId || null, // ✅ Guardar trabajador sugerido
  });

  const [errors, setErrors] = useState({});

  // Cargar categorías al montar
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('Cargando categorías...');
      const cats = await jobService.getCategories();
      console.log('Categorías cargadas:', cats);
      setCategories(cats);
      if (cats.length > 0 && !formData.categoryId) {
        console.log('Estableciendo categoría por defecto:', cats[0].id);
        setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las categorías',
      });
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

  // Manejar creación del trabajo
  const handleCreateJob = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Errores en el formulario',
        text2: 'Por favor revisa los campos marcados',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Preparar datos con el nombre correcto del campo
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : null,
        budgetType: formData.budgetType,
        address: formData.address.trim(),
        addressDetails: formData.addressDetails.trim() || null,
        city: formData.city.trim(),
        department: formData.department.trim(),
        urgency: formData.urgency,
      };

      // Solo agregar neededDate si tiene valor
      if (formData.neededDate && formData.neededDate.trim() !== '') {
        jobData.neededDate = formData.neededDate;
      }

      console.log('Enviando datos del trabajo:', jobData);

      const response = await jobService.createJob(jobData);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: '¡Trabajo publicado!',
          text2: 'Tu trabajo ha sido publicado exitosamente',
        });

        // Limpiar formulario
        setFormData({
          title: '',
          description: '',
          categoryId: categories[0]?.id || '',
          budgetAmount: '',
          budgetType: 'negotiable',
          address: '',
          addressDetails: '',
          city: 'Guatemala',
          department: 'Guatemala',
          urgency: 'medium',
          neededDate: '',
        });

        // Navegar a la lista de mis trabajos
        navigation.navigate('MyJobs');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'No se pudo publicar el trabajo',
        });
      }
    } catch (error) {
      console.error('Error completo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo conectar con el servidor',
      });
    } finally {
      setIsLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* ✅ AGREGAR: Banner informativo si hay trabajador sugerido */}
        {workerName && (
          <View style={styles.suggestedWorkerBanner}>
            <Text style={styles.bannerIcon}>👤</Text>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Trabajador Sugerido</Text>
              <Text style={styles.bannerText}>
                Este trabajo será visible para {workerName}
              </Text>
            </View>
          </View>
        )}
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
              <Text style={styles.title}>Publicar Trabajo</Text>
            </View>

            {/* Formulario */}
            <View style={styles.form}>
              {/* Título */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>¿Qué necesitas? *</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Ej: Reparar fuga de agua en la cocina"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.title}
                  onChangeText={(text) => updateField('title', text)}
                  maxLength={200}
                  editable={!isLoading}
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
                    enabled={!isLoading}
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
                  editable={!isLoading}
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
                      disabled={isLoading}
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
                    editable={!isLoading}
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
                    enabled={!isLoading}
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
                  editable={!isLoading}
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
                  editable={!isLoading}
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
                    editable={!isLoading}
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
                    editable={!isLoading}
                  />
                  {errors.department && (
                    <Text style={styles.errorText}>{errors.department}</Text>
                  )}
                </View>
              </View>

              {/* Botón de Publicar */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleCreateJob}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Publicar Trabajo</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScrollView>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },

  backButtonText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
  },

  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
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

  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },

  suggestedWorkerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
  },

  bannerIcon: {
    fontSize: FONT_SIZES['2xl'],
    marginRight: SPACING.md,
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: 2,
  },

  bannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
});
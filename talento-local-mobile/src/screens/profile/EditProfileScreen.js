// src/screens/profile/EditProfileScreen.js
// Pantalla para editar el perfil del usuario - Versión standalone

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES, API_URL, STATIC_URL } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import userService from '../../services/userService';
import CategorySelector from '../../components/CategorySelector';
import galleryService from '../../services/galleryService';

export default function EditProfileScreen({ navigation }) {

  const { user, refreshUserData } = useAuth();

  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [galleryCount, setGalleryCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    // Campos adicionales para trabajadores
    skills: '',
    experience: '',
    hourlyRate: '',
    // Ubicación
    city: '',
    state: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
    if (user?.role === 'worker') {
      loadWorkerCategories();
      loadGalleryCount();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.role === 'worker') {
        loadGalleryCount(); // Recargar contador cada vez que vuelves a esta pantalla
      }
    }, [user?.role])
  );

  const loadWorkerCategories = async () => {
    try {
      const categories = await userService.getWorkerCategories();
      setSelectedCategories(categories);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadGalleryCount = async () => {
    try {
      const photos = await galleryService.getMyGallery();
      setGalleryCount(photos.length);
    } catch (error) {
      console.error('Error cargando contador de galería:', error);
    }
  };

  const handleCategoriesChange = async (categories) => {
    try {
      setSelectedCategories(categories);
      // Guardar inmediatamente
      await userService.updateWorkerCategories(categories);
      Toast.show({
        type: 'success',
        text1: 'Habilidades actualizadas',
        text2: 'Tus categorías se han guardado correctamente',
      });
    } catch (error) {
      console.error('Error guardando categorías:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron guardar las categorías',
      });
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      // Usar datos del contexto primero
      setFormData({
        firstName: user?.profile?.first_name || user?.first_name || '',
        lastName: user?.profile?.last_name || user?.last_name || '',
        phone: user?.phone || '',
        bio: user?.profile?.bio || '',
        skills: user?.profile?.skills || '',
        experience: user?.profile?.experience || '',
        hourlyRate: user?.profile?.hourly_rate || '',
        city: user?.profile?.city || '',
        state: user?.profile?.state || '',
        address: user?.profile?.address || '',
      });

      // Construir URL completa para la imagen si es necesario
      const profilePicUrl = user?.profile?.profile_picture_url || user?.profile_picture_url;
      if (profilePicUrl) {
        const imageUrl = profilePicUrl.startsWith('http')
          ? profilePicUrl
          : `${STATIC_URL}${profilePicUrl}`;
        setProfileImage(imageUrl);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el perfil',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    // Solicitar permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Necesitamos acceso a tu galería para cambiar la foto de perfil',
      );
      return;
    }

    // Abrir selector de imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],  // Actualizado para evitar warning
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      // Subir imagen automáticamente
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Solicitar permisos de cámara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Necesitamos acceso a tu cámara para tomar una foto',
      );
      return;
    }

    // Abrir cámara
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      // Subir imagen automáticamente
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    try {
      setIsSaving(true);
      console.log('Subiendo imagen:', imageUri);

      const response = await userService.uploadProfilePicture(imageUri);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Foto actualizada',
          text2: 'Tu foto de perfil se ha actualizado',
        });

        // Construir URL completa
        const imageUrl = response.data.fullUrl ||
          (response.data.url.startsWith('http')
            ? response.data.url
            : `${STATIC_URL}${response.data.url}`);

        setProfileImage(imageUrl);

        // ✅ Recargar datos del servidor
        await refreshUserData();

        setHasChanges(true);
        console.log('Imagen subida y perfil actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error subiendo foto:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo subir la foto',
      });

      // Revertir a la imagen anterior si hay error
      const fallbackUrl = user?.profile?.profile_picture_url || user?.profile_picture_url;
      if (fallbackUrl) {
        const imageUrl = fallbackUrl.startsWith('http')
          ? fallbackUrl
          : `${API_URL}${fallbackUrl}`;
        setProfileImage(imageUrl);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageOptions = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      'Selecciona una opción',
      [
        { text: 'Tomar foto', onPress: takePhoto },
        { text: 'Elegir de galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  const handleSave = async () => {
    try {
      // Validaciones
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        Alert.alert('Error', 'El nombre y apellido son obligatorios');
        return;
      }

      setIsSaving(true);

      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        city: formData.city.trim(),
        department: formData.state.trim(),
        address: formData.address.trim(),
        ...(coordinates && {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        })
      };

      // Agregar campos de trabajador si aplica
      if (user?.role === USER_ROLES.WORKER) {
        profileData.skills = formData.skills.trim();
        profileData.experience = formData.experience.trim();
        profileData.hourly_rate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null;
      }

      const response = await userService.updateProfile(profileData);

      if (response.success) {
        // ✅ Recargar datos del servidor
        await refreshUserData();

        Toast.show({
          type: 'success',
          text1: 'Perfil actualizado',
          text2: 'Tus datos se han guardado correctamente',
        });

        navigation.goBack();
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo guardar el perfil',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // obtener ubicación:
  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      const locationService = require('../../services/locationService').default;
      const location = await locationService.getCurrentLocation();

      if (location) {
        setCoordinates({
          latitude: location.latitude,
          longitude: location.longitude
        });

        Toast.show({
          type: 'success',
          text1: 'Ubicación obtenida',
          text2: 'Se guardará al actualizar el perfil'
        });
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo obtener la ubicación'
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
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
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.saveText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Foto de Perfil */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={handleImageOptions}
              disabled={isSaving}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>
                    {formData.firstName?.[0]?.toUpperCase() || '👤'}
                  </Text>
                </View>
              )}
              <View style={styles.photoOverlay}>
                <Text style={styles.photoOverlayText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Toca para cambiar foto</Text>
            {isSaving && <Text style={styles.savingText}>Guardando...</Text>}
          </View>

          {user?.role === 'worker' && (
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => navigation.navigate('MyGallery')}
            >
              <Text style={styles.galleryIcon}>📸</Text>
              <View style={styles.galleryInfo}>
                <Text style={styles.galleryTitle}>Mi Galería de Trabajos</Text>
                <Text style={styles.gallerySubtitle}>
                  {galleryCount} {galleryCount === 1 ? 'foto' : 'fotos'}
                </Text>
              </View>
              <Text style={styles.galleryArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Formulario */}
          <View style={styles.form}>
            {/* Información Personal */}
            <Text style={styles.sectionTitle}>Información Personal</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => updateFormField('firstName', text)}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => updateFormField('lastName', text)}
                placeholder="Tu apellido"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => updateFormField('phone', text)}
                placeholder="Tu número de teléfono"
                placeholderTextColor={COLORS.text.secondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Biografía</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => updateFormField('bio', text)}
                placeholder="Cuéntanos sobre ti..."
                placeholderTextColor={COLORS.text.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Campos para Trabajadores */}
            {user?.role === USER_ROLES.WORKER && (
              <>
                <Text style={styles.sectionTitle}>Información Profesional</Text>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Habilidades y Categorías</Text>
                  <Text style={styles.sectionSubtitle}>
                    Selecciona las áreas en las que tienes experiencia
                  </Text>

                  <TouchableOpacity
                    style={styles.categorySelectorButton}
                    onPress={() => setShowCategorySelector(true)}
                  >
                    <Text style={styles.categorySelectorIcon}>🏷️</Text>
                    <View style={styles.categorySelectorContent}>
                      <Text style={styles.categorySelectorTitle}>
                        {selectedCategories.length > 0
                          ? `${selectedCategories.length} ${selectedCategories.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}`
                          : 'Seleccionar categorías'}
                      </Text>
                      {selectedCategories.length > 0 && (
                        <View style={styles.selectedCategoriesPreview}>
                          {selectedCategories.slice(0, 3).map((cat, index) => (
                            <View key={index} style={styles.previewChip}>
                              <Text style={styles.previewChipText}>
                                {cat.category_icon} {cat.category_name}
                                {cat.is_primary && ' ⭐'}
                              </Text>
                            </View>
                          ))}
                          {selectedCategories.length > 3 && (
                            <Text style={styles.moreCategories}>
                              +{selectedCategories.length - 3} más
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    <Text style={styles.categorySelectorArrow}>→</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Experiencia</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.experience}
                    onChangeText={(text) => updateFormField('experience', text)}
                    placeholder="Años de experiencia"
                    placeholderTextColor={COLORS.text.secondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tarifa por hora (Q)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.hourlyRate}
                    onChangeText={(text) => updateFormField('hourlyRate', text)}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.text.secondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </>
            )}

            {/* Ubicación */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ubicación</Text>

              <View style={styles.locationHeader}>
                <Text style={styles.label}>Ciudad y Departamento</Text>
                <TouchableOpacity
                  style={styles.getLocationButton}
                  onPress={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.getLocationButtonText}>📍 Usar mi ubicación</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ciudad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ciudad"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.city}
                  onChangeText={(value) => updateFormField('city', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Departamento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Departamento"
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.state}
                  onChangeText={(value) => updateFormField('state', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dirección</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => updateFormField('address', text)}
                  placeholder="Tu dirección completa"
                  placeholderTextColor={COLORS.text.secondary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              {coordinates && (
                <View style={styles.coordinatesInfo}>
                  <Text style={styles.coordinatesText}>
                    ✓ Ubicación GPS guardada
                  </Text>
                </View>
              )}
            </View>

           {/*} <View style={styles.inputGroup}>
              <Text style={styles.label}>Departamento</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => updateFormField('state', text)}
                placeholder="Tu departamento"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => updateFormField('address', text)}
                placeholder="Tu dirección completa"
                placeholderTextColor={COLORS.text.secondary}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>*/}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* ✅ AGREGAR: Modal de selector de categorías */}
      <CategorySelector
        visible={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        selectedCategories={selectedCategories}
        onCategoriesChange={handleCategoriesChange}
      />
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
    backgroundColor: COLORS.background,
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
  },

  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  saveText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '600',
  },

  photoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },

  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.sm,
  },

  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  photoPlaceholderText: {
    fontSize: FONT_SIZES['4xl'],
    color: COLORS.white,
    fontWeight: 'bold',
  },

  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  photoOverlayText: {
    fontSize: FONT_SIZES.lg,
  },

  photoHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  savingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },

  form: {
    paddingHorizontal: SPACING.lg,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },

  inputGroup: {
    marginBottom: SPACING.md,
  },

  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
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
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },

  categorySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },

  categorySelectorIcon: {
    fontSize: FONT_SIZES['2xl'],
    marginRight: SPACING.md,
  },

  categorySelectorContent: {
    flex: 1,
  },

  categorySelectorTitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },

  selectedCategoriesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },

  previewChip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },

  previewChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },

  moreCategories: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    alignSelf: 'center',
  },

  categorySelectorArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.secondary,
  },

  // En los StyleSheet.create:

  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryIcon: {
    fontSize: FONT_SIZES['2xl'],
    marginRight: SPACING.md,
  },
  galleryInfo: {
    flex: 1,
  },
  galleryTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  gallerySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  galleryArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.secondary,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  getLocationButton: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    minWidth: 120,
    alignItems: 'center',
  },
  getLocationButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  coordinatesInfo: {
    backgroundColor: COLORS.success + '10',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  coordinatesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.lg,
  },

  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
});
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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES, API_URL, STATIC_URL } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import userService from '../../services/userService';

export default function EditProfileScreen({ navigation }) {
  // Solo obtener el user del contexto, no updateUser

  /*console.log('=== DEBUG AuthContext ===');
  console.log('AuthContext completo:', useAuth);
  console.log('Tipo de authContext:', typeof useAuth);
  console.log('Claves disponibles:', Object.keys(useAuth || {}));
  console.log('updateUser existe?:', 'updateUser' in (useAuth || {}));
  console.log('=== FIN DEBUG ===');*/

  const { user, refreshUserData } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Habilidades</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.skills}
                    onChangeText={(text) => updateFormField('skills', text)}
                    placeholder="Ej: Plomería, Electricidad, Carpintería..."
                    placeholderTextColor={COLORS.text.secondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
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
            <Text style={styles.sectionTitle}>Ubicación</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => updateFormField('city', text)}
                placeholder="Tu ciudad"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
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
});
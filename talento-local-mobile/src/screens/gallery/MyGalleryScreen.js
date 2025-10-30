// src/screens/gallery/MyGalleryScreen.js
// Pantalla para gestionar mi galería de trabajos (solo trabajadores)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT_SIZES, SPACING, RADIUS, STATIC_URL, JOB_CATEGORIES } from '../../utils/constants';
import galleryService from '../../services/galleryService';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';

export default function MyGalleryScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [filterCategory, setFilterCategory] = useState(null);

  useEffect(() => {
    loadGallery();
  }, [filterCategory]);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const data = await galleryService.getMyGallery(filterCategory);
      setPhotos(data);
    } catch (error) {
      console.error('Error cargando galería:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar la galería'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setShowUploadModal(true);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Debes seleccionar una imagen');
      return;
    }

    if (photos.length >= 20) {
      Alert.alert('Límite alcanzado', 'Solo puedes tener máximo 20 fotos en tu galería');
      return;
    }

    try {
      setIsUploading(true);

      await galleryService.uploadPhoto(
        selectedImage,
        description.trim(),
        selectedCategory || null,
        isFeatured
      );

      Toast.show({
        type: 'success',
        text1: '¡Listo!',
        text2: 'Foto subida exitosamente'
      });

      // Resetear formulario
      setShowUploadModal(false);
      setSelectedImage(null);
      setDescription('');
      setSelectedCategory('');
      setIsFeatured(false);

      // Recargar galería
      loadGallery();
    } catch (error) {
      console.error('Error subiendo foto:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo subir la foto'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (photoId) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro de que deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await galleryService.deletePhoto(photoId);
              Toast.show({
                type: 'success',
                text1: 'Foto eliminada'
              });
              loadGallery();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo eliminar la foto'
              });
            }
          }
        }
      ]
    );
  };

  const handleSetFeatured = async (photoId) => {
    try {
      await galleryService.setFeatured(photoId);
      Toast.show({
        type: 'success',
        text1: 'Foto destacada actualizada'
      });
      loadGallery();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo marcar como destacada'
      });
    }
  };

  const renderPhoto = ({ item }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.photo_url }} style={styles.photo} />
      
      {item.is_featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>⭐ Destacada</Text>
        </View>
      )}

      <View style={styles.photoInfo}>
        {item.category_name && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category_icon} {item.category_name}
            </Text>
          </View>
        )}

        {item.description && (
          <Text style={styles.photoDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.photoActions}>
          {!item.is_featured && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetFeatured(item.id)}
            >
              <Text style={styles.actionText}>⭐ Destacar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={[styles.actionText, styles.deleteText]}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando galería...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Galería</Text>
        <Text style={styles.photoCount}>{photos.length}/20</Text>
      </View>

      {/* Filtro por categoría */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[styles.filterText, !filterCategory && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>

          {JOB_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.filterChip, filterCategory === category.id && styles.filterChipActive]}
              onPress={() => setFilterCategory(category.id)}
            >
              <Text style={[styles.filterText, filterCategory === category.id && styles.filterTextActive]}>
                {category.icon} {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de fotos */}
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>Sin fotos aún</Text>
          <Text style={styles.emptyText}>
            Agrega fotos de tus trabajos realizados para mostrar tu experiencia
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      )}

      {/* Botón flotante para agregar */}
      {photos.length < 20 && (
        <TouchableOpacity style={styles.fab} onPress={pickImage}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal de subida */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Foto</Text>

            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            )}

            <TextInput
              style={styles.input}
              placeholder="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Categoría (opcional)</Text>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={setSelectedCategory}
                style={styles.picker}
              >
                <Picker.Item label="Sin categoría" value="" />
                {JOB_CATEGORIES.map((cat) => (
                  <Picker.Item key={cat.id} label={`${cat.icon} ${cat.name}`} value={cat.id} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsFeatured(!isFeatured)}
            >
              <View style={[styles.checkbox, isFeatured && styles.checkboxActive]}>
                {isFeatured && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Marcar como destacada</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowUploadModal(false);
                  setSelectedImage(null);
                  setDescription('');
                  setSelectedCategory('');
                  setIsFeatured(false);
                }}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.uploadButtonText}>Subir Foto</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  photoCount: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  grid: {
    padding: SPACING.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
  photoCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.warning + 'DD',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  featuredText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  photoInfo: {
    padding: SPACING.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  photoDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.sm,
    marginRight: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20',
    marginRight: 0,
  },
  actionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  deleteText: {
    color: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    resizeMode: 'cover',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  picker: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    borderRadius: 4,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[200],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  uploadButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  uploadButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },
});
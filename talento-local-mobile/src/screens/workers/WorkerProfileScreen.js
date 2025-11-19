// src/screens/workers/WorkerProfileScreen.js
// Pantalla de perfil detallado de un trabajador (vista para clientes)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, STATIC_URL } from '../../utils/constants';
import workerService from '../../services/workerService';
import reviewService from '../../services/reviewService';
import Toast from 'react-native-toast-message';
import galleryService from '../../services/galleryService';
import VerificationBadge from '../../components/VerificationBadge';

export default function WorkerProfileScreen({ route, navigation }) {
  const { workerId } = route.params;

  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gallery, setGallery] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showAllGallery, setShowAllGallery] = useState(false);

  useEffect(() => {
    loadWorkerProfile();
  }, [workerId]);

  const loadWorkerProfile = async () => {
    try {
      setIsLoading(true);

      const [profileData, reviewsData] = await Promise.all([
        workerService.getWorkerProfile(workerId),
        reviewService.getUserReviews(workerId)
      ]);

      setWorker(profileData);
      setReviews(reviewsData.reviews || []);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el perfil del trabajador',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = () => {
    // Navegar a crear trabajo o contactar directamente
    navigation.navigate('CreateJob', {
      suggestedWorkerId: workerId,
      workerName: `${worker.first_name} ${worker.last_name}`
    });
  };

  useEffect(() => {
    if (workerId) {
      loadGallery();
    }
  }, [workerId]);

  const loadGallery = async () => {
    try {
      setIsLoadingGallery(true);
      const data = await galleryService.getWorkerGallery(workerId);
      setGallery(data);
    } catch (error) {
      console.error('Error cargando galería:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró el perfil</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profilePic = worker.profile_picture_url
    ? (worker.profile_picture_url.startsWith('http')
      ? worker.profile_picture_url
      : `${STATIC_URL}${worker.profile_picture_url}`)
    : null;

  const rating = parseFloat(worker.rating_average || 0);
  const totalReviews = parseInt(worker.total_reviews || 0);
  const completedJobs = parseInt(worker.completed_jobs || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Trabajador</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Foto y nombre */}
        <View style={styles.profileHeader}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {worker.first_name?.[0]?.toUpperCase() || '👤'}
              </Text>
            </View>
          )}

          <Text style={styles.name}>
            {worker.first_name} {worker.last_name}
          </Text>

          {/* ✅ AGREGAR Badge */}
          <VerificationBadge
            emailVerified={worker?.verification_status === 'verified'}
            phoneVerified={worker?.phone_verified}
            profilePictureVerified={worker?.profile_picture_verified}
            size="small"
          />
          <Text style={styles.workerRole}>{worker?.role}</Text>
          {/*worker.verification_status === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )*/}

          {/* Rating */}
          {rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStars}>⭐ {rating.toFixed(1)}</Text>
              {totalReviews > 0 && (
                <Text style={styles.reviewsCount}>({totalReviews} reseñas)</Text>
              )}
            </View>
          )}

          {/* Ubicación */}
          {worker.city && (
            <Text style={styles.location}>
              📍 {worker.city}, {worker.department}
            </Text>
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Trabajos Completados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalReviews}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
        </View>

        {/* Bio */}
        {worker.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acerca de</Text>
            <Text style={styles.bio}>{worker.bio}</Text>
          </View>
        )}

        {/* Categorías/Habilidades */}
        {worker.categories && worker.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <View style={styles.categoriesContainer}>
              {worker.categories.map((cat, index) => (
                <View
                  key={index}
                  style={[
                    styles.categoryChip,
                    cat.is_primary && styles.categoryChipPrimary
                  ]}
                >
                  <Text style={styles.categoryChipIcon}>{cat.category_icon}</Text>
                  <View style={styles.categoryChipContent}>
                    <Text style={[
                      styles.categoryChipName,
                      cat.is_primary && styles.categoryChipNamePrimary
                    ]}>
                      {cat.category_name}
                      {cat.is_primary && ' ⭐'}
                    </Text>
                    {cat.experience_years > 0 && (
                      <Text style={styles.categoryExperience}>
                        {cat.experience_years} {cat.experience_years === 1 ? 'año' : 'años'} de experiencia
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Habilidades adicionales (el campo de texto libre) */}
        {worker.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habilidades Adicionales</Text>
            <View style={styles.skillsContainer}>
              {worker.skills.split(',').map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Galería de Trabajos */}
        {gallery.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Trabajos Realizados</Text>

            {isLoadingGallery ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {gallery.slice(0, 6).map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.galleryItem}
                    onPress={() => {
                      setSelectedGalleryPhoto(photo);
                      setShowGalleryModal(true);
                    }}
                  >
                    <Image
                      source={{ uri: photo.photo_url }}
                      style={styles.galleryImage}
                    />
                    {photo.is_featured && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>⭐</Text>
                      </View>
                    )}
                    {photo.category_name && (
                      <View style={styles.galleryCategory}>
                        <Text style={styles.galleryCategoryText}>
                          {photo.category_icon} {photo.category_name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {gallery.length > 6 && (
                  <TouchableOpacity
                    style={styles.seeMoreGallery}
                    onPress={() => setShowAllGallery(true)}
                  >
                    <Text style={styles.seeMoreText}>
                      Ver todas{'\n'}({gallery.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Reseñas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Reseñas ({totalReviews})
            </Text>
            {totalReviews > 3 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('UserReviews', {
                  userId: workerId,
                  userName: `${worker.first_name} ${worker.last_name}`
                })}
              >
                <Text style={styles.seeAllText}>Ver todas →</Text>
              </TouchableOpacity>
            )}
          </View>

          {reviews.length > 0 ? (
            reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View>
                    <Text style={styles.reviewerName}>
                      {review.reviewer_first_name} {review.reviewer_last_name}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('es-GT')}
                    </Text>
                  </View>
                  <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>
              Aún no hay reseñas para este trabajador
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Botón de contacto fijo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContact}
        >
          <Text style={styles.contactButtonText}>Contactar y Crear Trabajo</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para ver foto en grande */}
      <Modal
        visible={showGalleryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGalleryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setShowGalleryModal(false)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          {selectedGalleryPhoto && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedGalleryPhoto.photo_url }}
                style={styles.modalImage}
                resizeMode="contain"
              />

              {selectedGalleryPhoto.description && (
                <View style={styles.modalDescription}>
                  <Text style={styles.modalDescriptionText}>
                    {selectedGalleryPhoto.description}
                  </Text>
                </View>
              )}

              {selectedGalleryPhoto.category_name && (
                <View style={styles.modalCategory}>
                  <Text style={styles.modalCategoryText}>
                    {selectedGalleryPhoto.category_icon} {selectedGalleryPhoto.category_name}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Modal para ver toda la galería */}
      <Modal
        visible={showAllGallery}
        animationType="slide"
        onRequestClose={() => setShowAllGallery(false)}
      >
        <SafeAreaView style={styles.fullGalleryContainer}>
          <View style={styles.fullGalleryHeader}>
            <TouchableOpacity onPress={() => setShowAllGallery(false)}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.fullGalleryTitle}>Trabajos Realizados</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView contentContainerStyle={styles.fullGalleryGrid}>
            {gallery.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.fullGalleryItem}
                onPress={() => {
                  setSelectedGalleryPhoto(photo);
                  setShowAllGallery(false);
                  setShowGalleryModal(true);
                }}
              >
                <Image
                  source={{ uri: photo.photo_url }}
                  style={styles.fullGalleryImage}
                />
                {photo.is_featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>⭐</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
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

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },

  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
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

  headerBackButton: {
    padding: SPACING.sm,
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

  headerSpacer: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  profileHeader: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.md,
  },

  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  profileImageText: {
    fontSize: 48,
    color: COLORS.white,
    fontWeight: 'bold',
  },

  name: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },

  verifiedIcon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: 'bold',
    marginRight: 4,
  },

  verifiedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  ratingStars: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.warning,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },

  reviewsCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  location: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },

  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray[200],
  },

  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  bio: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  skillChip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  skillText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  reviewCard: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },

  reviewerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  reviewDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  reviewRating: {
    fontSize: FONT_SIZES.base,
    color: COLORS.warning,
    fontWeight: '600',
  },

  reviewComment: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  noReviewsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },

  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },

  contactButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  contactButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },

  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },

  backButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },

  categoriesContainer: {
    gap: SPACING.sm,
  },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },

  categoryChipPrimary: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '10',
  },

  categoryChipIcon: {
    fontSize: FONT_SIZES['2xl'],
    marginRight: SPACING.md,
  },

  categoryChipContent: {
    flex: 1,
  },

  categoryChipName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },

  categoryChipNamePrimary: {
    color: COLORS.warning,
  },

  categoryExperience: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  galleryScroll: {
    paddingVertical: SPACING.sm,
  },
  galleryItem: {
    width: 120,
    height: 120,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.warning + 'DD',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredText: {
    fontSize: FONT_SIZES.xs,
  },
  galleryCategory: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  galleryCategoryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: 'center',
  },
  seeMoreGallery: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Estilos de galería
  galleryScroll: {
    paddingVertical: SPACING.sm,
  },
  galleryItem: {
    width: 120,
    height: 120,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.gray[200],
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.warning + 'DD',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredText: {
    fontSize: FONT_SIZES.xs,
  },
  galleryCategory: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  galleryCategoryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: 'center',
  },
  seeMoreGallery: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  seeMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Estilos de modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    fontWeight: '300',
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
  modalDescription: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: RADIUS.md,
    maxWidth: '90%',
  },
  modalDescriptionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  modalCategory: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  modalCategoryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // Estilos de galería completa
  fullGalleryContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fullGalleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  fullGalleryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  fullGalleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  fullGalleryItem: {
    width: '48%',
    height: 150,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[200],
    position: 'relative',
  },
  fullGalleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
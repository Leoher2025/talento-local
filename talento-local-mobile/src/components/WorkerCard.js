// src/components/WorkerCard.js
// Tarjeta para mostrar información de un trabajador

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, STATIC_URL, JOB_CATEGORIES } from '../utils/constants';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';

export default function WorkerCard({
  worker,
  onPress,
  showDistance = false,
  onNavigate = null
}) {
  // Obtener imagen de perfil
  const getProfileImage = () => {
    if (worker.profile_picture_url) {
      if (worker.profile_picture_url.startsWith('http')) {
        return worker.profile_picture_url;
      }
      return `${STATIC_URL}${worker.profile_picture_url}`;
    }
    return null;
  };

  // Obtener categorías del trabajador
  const getWorkerCategories = () => {
    if (!worker.skills || worker.skills.length === 0) {
      return [];
    }

    return JOB_CATEGORIES.filter(cat =>
      worker.skills.includes(cat.id)
    ).slice(0, 3); // Mostrar máximo 3
  };

  const profileImage = getProfileImage();
  const categories = getWorkerCategories();
  const rating = parseFloat(worker.average_rating || 0);
  const reviewCount = parseInt(worker.total_reviews || 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header con foto y nombre */}
      <View style={styles.header}>
        {/* Foto de perfil */}
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {worker.first_name?.[0]?.toUpperCase() || '?'}
                {worker.last_name?.[0]?.toUpperCase() || ''}
              </Text>
            </View>
          )}

          {/* Badge de verificación */}
          {(worker.phone_verified || worker.verification_status === 'verified') && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}

          {/* ✅ Botón de favorito */}
          <FavoriteButton
            favoriteType="worker"
            favoriteId={worker.user_id}
            size="small"
            style={styles.favoriteButtonCard}
          />
        </View>

        {/* Información básica */}
        <View style={styles.info}>
          <Text style={styles.name}>
            {worker.first_name} {worker.last_name}
          </Text>

          {/* Calificación */}
          {rating > 0 && (
            <View style={styles.ratingContainer}>
              <StarRating rating={rating} size={14} />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} ({reviewCount})
              </Text>
            </View>
          )}

          {/* Ubicación */}
          {(worker.city || worker.department) && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>
                {worker.city}{worker.city && worker.department ? ', ' : ''}{worker.department}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Distancia (si está disponible) */}
      {showDistance && worker.distance_km !== undefined && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceIcon}>📍</Text>
          <Text style={styles.distanceText}>
            {worker.distance_km < 1
              ? `${Math.round(worker.distance_km * 1000)}m de distancia`
              : `${worker.distance_km.toFixed(1)}km de distancia`
            }
          </Text>
        </View>
      )}

      {/* Bio (si existe) */}
      {worker.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {worker.bio}
        </Text>
      )}

      {/* Categorías/Skills */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryChip}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          ))}
          {worker.skills && worker.skills.length > 3 && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>+{worker.skills.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Botón de navegación (si está disponible) */}
      {onNavigate && worker.latitude && worker.longitude && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={onNavigate}
        >
          <Text style={styles.navigateButtonText}>🧭 Cómo llegar</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.gray[200],
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  verifiedIcon: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: 4,
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  distanceIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs,
  },
  distanceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  categoryIcon: {
    fontSize: FONT_SIZES.xs,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  navigateButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  navigateButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  favoriteButtonCard: {
    alignSelf: 'flex-end',
  },
});
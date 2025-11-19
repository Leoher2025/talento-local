// src/screens/workers/WorkersSearchScreen.js
// Pantalla de búsqueda de trabajadores con geolocalización

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, STATIC_URL } from '../../utils/constants';
import workerService from '../../services/workerService';
import locationService from '../../services/locationService';
import WorkerFilters from '../../components/WorkerFilters';
import WorkerMap from '../../components/WorkerMap';
import Slider from '@react-native-community/slider';
import Toast from 'react-native-toast-message';
import FavoriteButton from '../../components/FavoriteButton';

export default function WorkersSearchScreen({ route, navigation }) {
  const { categoryId } = route?.params || {};

  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(
    categoryId ? { categoryId: categoryId } : {}
  );
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(
    categoryId ? 1 : 0
  );

  // Estados de geolocalización
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(10); // km
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'map'

  useFocusEffect(
    useCallback(() => {
      loadWorkers(1, true);
    }, [filters, searchText, useLocation, radius])
  );

  useEffect(() => {
    if (categoryId) {
      setFilters({ categoryId: categoryId });
      setActiveFiltersCount(1);
    }
  }, [categoryId]);

  // Cargar ubicación al activar filtro
  useEffect(() => {
    if (useLocation && !userLocation) {
      loadUserLocation();
    }
  }, [useLocation]);

  const loadUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const location = await locationService.getCurrentLocation();

      if (location) {
        setUserLocation(location);
        Toast.show({
          type: 'success',
          text1: 'Ubicación obtenida',
          text2: 'Mostrando trabajadores cercanos'
        });
      } else {
        setUseLocation(false);
        Alert.alert(
          'Error',
          'No se pudo obtener tu ubicación. Verifica los permisos.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setUseLocation(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo obtener la ubicación'
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const loadWorkers = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setIsLoading(page === 1);
      } else {
        setIsLoadingMore(true);
      }

      let result;

      // Si está activado el filtro de ubicación
      if (useLocation && userLocation) {
        const workersData = await locationService.getNearbyWorkers({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: radius,
          categoryId: filters.categoryId || null,
          minRating: filters.minRating || null
        });

        result = {
          workers: workersData,
          pagination: {
            page: 1,
            totalPages: 1,
            total: workersData.length
          }
        };
      } else {
        // Búsqueda normal
        const searchFilters = {
          ...filters,
          search: searchText.trim(),
          page,
          limit: 20
        };

        result = await workerService.searchWorkers(searchFilters);
      }

      if (page === 1) {
        setWorkers(result.workers || result.data || []);
      } else {
        setWorkers(prev => [...prev, ...(result.workers || result.data || [])]);
      }

      setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los trabajadores',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setPagination({ ...pagination, page: 1 });
    loadWorkers(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && !useLocation && pagination.page < pagination.totalPages) {
      loadWorkers(pagination.page + 1);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    setPagination({ ...pagination, page: 1 });

    const count = Object.keys(newFilters).filter(key =>
      newFilters[key] && !['sortBy', 'sortOrder', 'page', 'limit'].includes(key)
    ).length;
    setActiveFiltersCount(count);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchText('');
    setUseLocation(false);
    setRadius(10);
    setActiveFiltersCount(0);
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadWorkers(1, true);
  };

  const handleToggleView = () => {
    if (viewMode === 'list') {
      if (!useLocation) {
        Alert.alert(
          'Ubicación requerida',
          'Para ver el mapa, activa el filtro de ubicación',
          [{ text: 'OK' }]
        );
        return;
      }
      setViewMode('map');
    } else {
      setViewMode('list');
    }
  };

  const handleNavigateToWorker = (worker) => {
    if (worker.latitude && worker.longitude) {
      locationService.showNavigationOptions(
        worker.latitude,
        worker.longitude,
        `${worker.first_name} ${worker.last_name}`
      );
    } else {
      Alert.alert('Error', 'Este trabajador no tiene ubicación configurada');
    }
  };

  const renderWorkerCard = ({ item }) => {
    const profilePic = item.profile_picture_url
      ? (item.profile_picture_url.startsWith('http')
        ? item.profile_picture_url
        : `${STATIC_URL}${item.profile_picture_url}`)
      : null;

    const rating = parseFloat(item.rating_average || item.average_rating || 0) || 0;
    const completedJobs = parseInt(item.completed_jobs || 0) || 0;
    const totalReviews = parseInt(item.total_reviews || 0) || 0;

    return (
      <View style={styles.workerCard}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('WorkerProfile', { workerId: item.user_id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.first_name?.[0]?.toUpperCase() || '👤'}
                </Text>
              </View>
            )}

            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>
                {item.first_name || 'Sin nombre'} {item.last_name || ''}
              </Text>

              {rating > 0 && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>⭐ {rating.toFixed(1)}</Text>
                  {totalReviews > 0 && (
                    <Text style={styles.reviewsText}>({totalReviews})</Text>
                  )}
                </View>
              )}

              {(item.city || item.department) && (
                <Text style={styles.locationText}>
                  📍 {item.city || 'Ciudad no especificada'}
                  {item.department && `, ${item.department}`}
                </Text>
              )}

              {/* Mostrar distancia si está disponible */}
              {useLocation && item.distance_km !== undefined && (
                <Text style={styles.distanceText}>
                  📍 {item.distance_km < 1
                    ? `${Math.round(item.distance_km * 1000)}m de distancia`
                    : `${item.distance_km.toFixed(1)}km de distancia`
                  }
                </Text>
              )}
            </View>

            {(item.verification_status === 'verified' || item.phone_verified) && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>

          {item.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}

          {item.skills && (
            <View style={styles.skillsContainer}>
              {item.skills.split(',').slice(0, 3).map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill.trim()}</Text>
                </View>
              ))}
              {item.skills.split(',').filter(s => s.trim()).length > 3 && (
                <Text style={styles.moreSkills}>
                  +{item.skills.split(',').filter(s => s.trim()).length - 3}
                </Text>
              )}
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedJobs}</Text>
              <Text style={styles.statLabel}>Trabajos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rating.toFixed(1)} ⭐</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalReviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botón de navegación (solo si hay ubicación) */}
        {useLocation && item.latitude && item.longitude && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => handleNavigateToWorker(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.navigateButtonText}>🧭 Cómo llegar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => navigation.navigate('WorkerProfile', { workerId: item.user_id })}
          activeOpacity={0.7}
        >
          <Text style={styles.viewProfileText}>Ver Perfil Completo</Text>
        </TouchableOpacity>

        {/* ✅ Botón de favorito */}
        <FavoriteButton
          favoriteType="worker"
          favoriteId={item.user_id}
          size="small"
        />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👷</Text>
      <Text style={styles.emptyTitle}>Sin resultados</Text>
      <Text style={styles.emptyText}>
        {searchText || activeFiltersCount > 0 || useLocation
          ? 'No encontramos trabajadores con estos criterios'
          : 'No hay trabajadores disponibles'}
      </Text>
      {(searchText || activeFiltersCount > 0 || useLocation) && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
          <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (isLoading && workers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Buscando trabajadores...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar trabajadores..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Text style={styles.filterIcon}>⚙️</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros de ubicación y vista */}
      <View style={styles.locationFilters}>
        {/* Toggle vista */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={styles.viewButtonText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'map' && styles.viewButtonActive]}
            onPress={handleToggleView}
            disabled={!useLocation}
          >
            <Text style={[
              styles.viewButtonText,
              !useLocation && styles.viewButtonDisabled
            ]}>🗺️</Text>
          </TouchableOpacity>
        </View>

        {/* Switch de ubicación */}
        <View style={styles.locationSwitch}>
          <Text style={styles.locationLabel}>📍 Cerca de mí</Text>
          <Switch
            value={useLocation}
            onValueChange={(value) => {
              setUseLocation(value);
              if (!value) {
                loadWorkers(1, true);
              }
            }}
            trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        {/* Slider de radio */}
        {useLocation && (
          <View style={styles.radiusSlider}>
            <Text style={styles.radiusLabel}>Radio: {radius}km</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={radius}
              onValueChange={setRadius}
              onSlidingComplete={() => loadWorkers(1, true)}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.gray[300]}
              thumbTintColor={COLORS.primary}
            />
          </View>
        )}
      </View>

      {/* Estado de carga de ubicación */}
      {isLoadingLocation && (
        <View style={styles.locationLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.locationLoadingText}>Obteniendo ubicación...</Text>
        </View>
      )}

      {/* Contador */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {pagination.total} {pagination.total === 1 ? 'trabajador encontrado' : 'trabajadores encontrados'}
        </Text>
        {(activeFiltersCount > 0 || useLocation) && (
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido: Mapa o Lista */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <WorkerMap
            workers={workers}
            userLocation={userLocation}
            radius={radius}
            onMarkerPress={(worker) => navigation.navigate('WorkerProfile', { workerId: worker.user_id })}
          />
        </View>
      ) : (
        <FlatList
          data={workers}
          renderItem={renderWorkerCard}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Modal filtros */}
      <WorkerFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
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
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  backIcon: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.primary,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    paddingVertical: SPACING.sm,
  },
  filterButton: {
    position: 'relative',
    padding: SPACING.xs,
  },
  filterIcon: {
    fontSize: FONT_SIZES.lg,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationFilters: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  viewToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  viewButton: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },
  viewButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  viewButtonDisabled: {
    opacity: 0.3,
  },
  locationSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  locationLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  radiusSlider: {
    marginTop: SPACING.sm,
  },
  radiusLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    gap: SPACING.sm,
  },
  locationLoadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  resultsCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  clearFiltersText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  workerCard: {
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
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    fontWeight: '600',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  distanceText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  bio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  skillChip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  skillText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  moreSkills: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    alignSelf: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray[100],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray[200],
  },
  navigateButton: {
    backgroundColor: COLORS.info + '20',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  navigateButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.info,
  },
  viewProfileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
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
    marginBottom: SPACING.md,
  },
  clearButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  clearButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
});
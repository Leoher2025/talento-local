// src/screens/main/FindWorkersScreen.js - Búsqueda de trabajadores con mapa
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  Switch
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, JOB_CATEGORIES } from '../../utils/constants';
import workerService from '../../services/workerService';
import locationService from '../../services/locationService';
import WorkerCard from '../../components/WorkerCard';
import WorkerMap from '../../components/WorkerMap';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import Toast from 'react-native-toast-message';

export default function FindWorkersScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  
  // Estados de geolocalización
  const [userLocation, setUserLocation] = useState(null);
  const [useLocation, setUseLocation] = useState(false);
  const [radius, setRadius] = useState(10); // km
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Vista de mapa o lista
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'map'

  useFocusEffect(
    useCallback(() => {
      loadWorkers();
    }, [])
  );

  // Cargar ubicación al activar filtro de ubicación
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

  const loadWorkers = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      let workersData;

      // Si está activado el filtro de ubicación
      if (useLocation && userLocation) {
        workersData = await locationService.getNearbyWorkers({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: radius,
          categoryId: selectedCategory || null,
          minRating: minRating || null
        });
      } else {
        // Búsqueda normal
        const filters = {};
        
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }
        
        if (selectedCategory) {
          filters.categoryId = selectedCategory;
        }
        
        if (minRating > 0) {
          filters.minRating = minRating;
        }

        const response = await workerService.searchWorkers(filters);
        workersData = response.data || [];
      }

      setWorkers(workersData);
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los trabajadores'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = () => {
    loadWorkers();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinRating(0);
    setUseLocation(false);
    setRadius(10);
    loadWorkers();
  };

  const handleWorkerPress = (worker) => {
    navigation.navigate('WorkerProfile', { 
      workerId: worker.user_id,
      workerData: worker 
    });
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con búsqueda */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar trabajadores..."
            placeholderTextColor={COLORS.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

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
      </View>

      {/* Filtros */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {/* Filtro de ubicación */}
        <View style={styles.filterChip}>
          <Text style={styles.filterLabel}>📍 Cerca de mí</Text>
          <Switch
            value={useLocation}
            onValueChange={(value) => {
              setUseLocation(value);
              if (value) {
                loadUserLocation();
              }
            }}
            trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        {/* Slider de radio */}
        {useLocation && (
          <View style={styles.filterChipWide}>
            <Text style={styles.filterLabel}>Radio: {radius}km</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={radius}
              onValueChange={setRadius}
              onSlidingComplete={handleSearch}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.gray[300]}
              thumbTintColor={COLORS.primary}
            />
          </View>
        )}

        {/* Categoría */}
        <View style={styles.filterChip}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value);
              handleSearch();
            }}
            style={styles.picker}
          >
            <Picker.Item label="Todas las categorías" value="" />
            {JOB_CATEGORIES.map((category) => (
              <Picker.Item 
                key={category.id} 
                label={`${category.icon} ${category.name}`} 
                value={category.id} 
              />
            ))}
          </Picker>
        </View>

        {/* Calificación mínima */}
        <View style={styles.filterChip}>
          <Picker
            selectedValue={minRating}
            onValueChange={(value) => {
              setMinRating(value);
              handleSearch();
            }}
            style={styles.picker}
          >
            <Picker.Item label="Cualquier calificación" value={0} />
            <Picker.Item label="⭐ 1+" value={1} />
            <Picker.Item label="⭐ 2+" value={2} />
            <Picker.Item label="⭐ 3+" value={3} />
            <Picker.Item label="⭐ 4+" value={4} />
            <Picker.Item label="⭐ 5" value={5} />
          </Picker>
        </View>

        {/* Limpiar filtros */}
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClearFilters}
        >
          <Text style={styles.clearButtonText}>Limpiar ✕</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Estado de carga de ubicación */}
      {isLoadingLocation && (
        <View style={styles.locationLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.locationLoadingText}>Obteniendo ubicación...</Text>
        </View>
      )}

      {/* Contenido */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando trabajadores...</Text>
        </View>
      ) : viewMode === 'map' ? (
        // Vista de Mapa
        <View style={styles.mapContainer}>
          <WorkerMap
            workers={workers}
            userLocation={userLocation}
            radius={radius}
            onMarkerPress={handleWorkerPress}
          />
          
          {/* Contador de resultados sobre el mapa */}
          <View style={styles.mapCounter}>
            <Text style={styles.mapCounterText}>
              {workers.length} trabajador{workers.length !== 1 ? 'es' : ''} encontrado{workers.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      ) : (
        // Vista de Lista
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadWorkers(true)}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Contador de resultados */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {workers.length} trabajador{workers.length !== 1 ? 'es' : ''} encontrado{workers.length !== 1 ? 's' : ''}
            </Text>
            {useLocation && userLocation && (
              <Text style={styles.locationInfo}>
                📍 En un radio de {radius}km
              </Text>
            )}
          </View>

          {workers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No se encontraron trabajadores</Text>
              <Text style={styles.emptyText}>
                {useLocation 
                  ? 'Intenta aumentar el radio de búsqueda'
                  : 'Intenta con otros filtros o activa la búsqueda por ubicación'
                }
              </Text>
            </View>
          ) : (
            workers.map((worker) => (
              <WorkerCard
                key={worker.user_id}
                worker={worker}
                onPress={() => handleWorkerPress(worker)}
                showDistance={useLocation}
                onNavigate={useLocation ? () => handleNavigateToWorker(worker) : null}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },
  searchButton: {
    marginLeft: SPACING.sm,
    width: 45,
    height: 45,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
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
  filtersScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filtersContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  filterChipWide: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    minWidth: 200,
  },
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  picker: {
    height: 30,
    width: 150,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  clearButton: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '600',
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
  mapContainer: {
    flex: 1,
  },
  mapCounter: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mapCounterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
  },
  resultsHeader: {
    marginBottom: SPACING.md,
  },
  resultsCount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  locationInfo: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
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
    paddingHorizontal: SPACING.xl,
  },
});
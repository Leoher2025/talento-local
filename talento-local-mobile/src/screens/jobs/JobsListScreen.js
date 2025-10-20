// src/screens/jobs/JobsListScreen.js
// Pantalla de búsqueda y lista de trabajos con filtros avanzados

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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import jobService from '../../services/jobService';
import JobFilters from '../../components/JobFilters';
import Toast from 'react-native-toast-message';

export default function JobsListScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadJobs(1, true);
    }, [filters, searchText])
  );

  const loadJobs = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setIsLoading(page === 1);
      } else {
        setIsLoadingMore(true);
      }

      const searchFilters = {
        ...filters,
        search: searchText.trim(),
        page,
        limit: 20
      };

      const result = await jobService.getJobs(searchFilters);

      if (page === 1) {
        setJobs(result.jobs);
      } else {
        setJobs(prev => [...prev, ...result.jobs]);
      }

      setPagination(result.pagination);
    } catch (error) {
      console.error('Error cargando trabajos:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los trabajos',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setPagination({ ...pagination, page: 1 });
    loadJobs(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.page < pagination.totalPages) {
      loadJobs(pagination.page + 1);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    setPagination({ ...pagination, page: 1 });
    
    // Contar filtros activos
    const count = Object.keys(newFilters).filter(key => 
      newFilters[key] && !['sortBy', 'sortOrder', 'page', 'limit'].includes(key)
    ).length;
    setActiveFiltersCount(count);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchText('');
    setActiveFiltersCount(0);
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadJobs(1, true);
  };

  const renderJobCard = ({ item }) => {
    const distance = item.distance_km ? `${parseFloat(item.distance_km).toFixed(1)} km` : null;

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        activeOpacity={0.7}
      >
        {/* Header con categoría y distancia */}
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{item.category_icon}</Text>
            <Text style={styles.categoryName}>{item.category_name}</Text>
          </View>
          {distance && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>📍 {distance}</Text>
            </View>
          )}
        </View>

        {/* Título */}
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Descripción */}
        <Text style={styles.jobDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Información */}
        <View style={styles.jobInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={styles.infoText}>
              {item.budget_type === 'fixed'
                ? `Q${parseFloat(item.budget_amount || 0).toFixed(2)}`
                : item.budget_type === 'hourly'
                  ? `Q${parseFloat(item.budget_amount || 0).toFixed(2)}/h`
                  : 'Negociable'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{item.city}</Text>
          </View>

          {item.urgency && (
            <View style={[styles.urgencyBadge, getUrgencyStyle(item.urgency)]}>
              <Text style={styles.urgencyText}>
                {getUrgencyIcon(item.urgency)} {getUrgencyLabel(item.urgency)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.timeAgo}>
            {getTimeAgo(item.created_at)}
          </Text>
          {item.applications_count > 0 && (
            <Text style={styles.applicationsCount}>
              {item.applications_count} {item.applications_count === 1 ? 'aplicación' : 'aplicaciones'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>Sin resultados</Text>
      <Text style={styles.emptyText}>
        {searchText || activeFiltersCount > 0
          ? 'No encontramos trabajos con estos criterios'
          : 'No hay trabajos disponibles en este momento'}
      </Text>
      {(searchText || activeFiltersCount > 0) && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearFilters}
        >
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

  if (isLoading && jobs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Buscando trabajos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con búsqueda */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar trabajos..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Contador de resultados */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {pagination.total} {pagination.total === 1 ? 'trabajo encontrado' : 'trabajos encontrados'}
        </Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de trabajos */}
      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      {/* Modal de filtros */}
      <JobFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </SafeAreaView>
  );
}

// Funciones auxiliares
function getUrgencyIcon(urgency) {
  const icons = {
    urgent: '🔥',
    high: '⚡',
    medium: '⏱️',
    low: '😌'
  };
  return icons[urgency] || '';
}

function getUrgencyLabel(urgency) {
  const labels = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  };
  return labels[urgency] || '';
}

function getUrgencyStyle(urgency) {
  const styles = {
    urgent: { backgroundColor: COLORS.error + '20' },
    high: { backgroundColor: COLORS.warning + '20' },
    medium: { backgroundColor: COLORS.info + '20' },
    low: { backgroundColor: COLORS.success + '20' }
  };
  return styles[urgency] || {};
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-GT');
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

  listContent: {
    flexGrow: 1,
    padding: SPACING.md,
  },

  jobCard: {
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

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },

  categoryIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },

  categoryName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  distanceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.info + '20',
    borderRadius: RADIUS.sm,
  },

  distanceText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
    fontWeight: '600',
  },

  jobTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  jobDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },

  jobInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: 4,
  },

  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  urgencyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },

  urgencyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },

  timeAgo: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },

  applicationsCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
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
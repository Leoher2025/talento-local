// src/screens/jobs/JobsListScreen.js - Pantalla para ver lista de trabajos disponibles
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES } from '../../utils/constants';
import jobService from '../../services/jobService';

export default function JobsListScreen({ navigation }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [selectedCategory]);

  const loadInitialData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadCategories(),
      loadJobs()
    ]);
    setIsLoading(false);
  };

  const loadCategories = async () => {
    try {
      const cats = await jobService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadJobs = async (page = 1, refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      
      const filters = {
        page,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      };

      if (selectedCategory) {
        filters.categoryId = selectedCategory;
      }

      const response = await jobService.getJobs(filters);
      
      if (page === 1) {
        setJobs(response.jobs);
      } else {
        setJobs(prev => [...prev, ...response.jobs]);
      }
      
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error cargando trabajos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadJobs(1, true);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !isLoading) {
      loadJobs(pagination.page + 1);
    }
  };

  const handleCategoryPress = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return COLORS.error;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.info;
      default: return COLORS.success;
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'urgent': return '🔥 Urgente';
      case 'high': return '⚡ Alta';
      case 'medium': return '⏱️ Media';
      default: return '😌 Baja';
    }
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoriesContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive
            ]}
            onPress={() => handleCategoryPress(item.id)}
          >
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text style={[
              styles.categoryName,
              selectedCategory === item.id && styles.categoryNameActive
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderJobCard = ({ item }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      activeOpacity={0.7}
    >
      {/* Header del trabajo */}
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
            <Text style={styles.urgencyText}>{getUrgencyText(item.urgency)}</Text>
          </View>
        </View>
      </View>

      {/* Categoría */}
      <View style={styles.jobCategory}>
        <Text style={styles.categoryIcon}>{item.category_icon}</Text>
        <Text style={styles.jobCategoryText}>{item.category_name}</Text>
      </View>

      {/* Descripción */}
      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Información adicional */}
      <View style={styles.jobInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{item.city}, {item.department}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>💰</Text>
          <Text style={styles.infoText}>
            {item.budget_type === 'fixed' 
              ? `Q${item.budget_amount || '0'}`
              : item.budget_type === 'hourly'
              ? `Q${item.budget_amount || '0'}/hora`
              : 'Negociable'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.jobFooter}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {item.client_first_name} {item.client_last_name}
          </Text>
          {item.client_rating > 0 && (
            <Text style={styles.clientRating}>
              ⭐ {item.client_rating.toFixed(1)}
            </Text>
          )}
        </View>
        
        <Text style={styles.jobDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Contador de aplicaciones (para trabajadores) */}
      {user?.role === USER_ROLES.WORKER && (
        <View style={styles.applicationsCount}>
          <Text style={styles.applicationsText}>
            👥 {item.applications_count || 0} aplicaciones
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No hay trabajos disponibles</Text>
      <Text style={styles.emptyText}>
        {selectedCategory 
          ? 'No hay trabajos en esta categoría'
          : 'Sé el primero en publicar un trabajo'}
      </Text>
      {selectedCategory && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.clearFilterText}>Limpiar filtro</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && jobs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando trabajos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtros de categorías */}
      {renderCategoryFilter()}
      
      {/* Lista de trabajos */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={() => 
          pagination.page < pagination.totalPages && (
            <ActivityIndicator 
              style={styles.footerLoader}
              color={COLORS.primary}
            />
          )
        }
      />

      {/* Botón flotante para crear trabajo (solo clientes) */}
      {user?.role === USER_ROLES.CLIENT && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateJob')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: COLORS.background,
  },
  
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
  },
  
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  
  categoryIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.xs,
  },
  
  categoryName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
  },
  
  categoryNameActive: {
    color: COLORS.white,
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
    shadowRadius: 3,
    elevation: 3,
  },
  
  jobHeader: {
    marginBottom: SPACING.sm,
  },
  
  jobTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  jobTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  
  urgencyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  
  urgencyText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  
  jobCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  jobCategoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  
  jobDescription: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  
  jobInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  infoIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },
  
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  clientName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  clientRating: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    marginLeft: SPACING.sm,
  },
  
  jobDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  
  applicationsCount: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  
  applicationsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  
  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  clearFilterButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  
  clearFilterText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  
  footerLoader: {
    paddingVertical: SPACING.lg,
  },
  
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  
  fabText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    fontWeight: '300',
  },
});
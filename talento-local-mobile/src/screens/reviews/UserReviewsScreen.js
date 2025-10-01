// src/screens/reviews/UserReviewsScreen.js
// Pantalla para ver las reviews de un usuario

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
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import ReviewCard from '../../components/ReviewCard';
import StarRating from '../../components/StarRating';
import reviewService from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';

export default function UserReviewsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userId, userName } = route.params;

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [selectedFilter]);

  const loadData = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setPage(1);
      } else {
        setIsLoading(true);
      }

      // Cargar estadísticas y reviews en paralelo
      const [statsResponse, reviewsResponse] = await Promise.all([
        reviewService.getUserReviewStats(userId),
        reviewService.getUserReviews(userId, {
          page: refresh ? 1 : page,
          limit: 10,
          minRating: selectedFilter === 'all' ? null : parseInt(selectedFilter),
        })
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (reviewsResponse.success) {
        const newReviews = reviewsResponse.data.reviews;
        
        if (refresh) {
          setReviews(newReviews);
        } else {
          setReviews(prev => [...prev, ...newReviews]);
        }

        setHasMore(
          reviewsResponse.data.pagination.page < 
          reviewsResponse.data.pagination.totalPages
        );
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    loadData(true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
      loadData();
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setPage(1);
    setReviews([]);
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Estadísticas */}
      {stats && (
        <View style={styles.statsCard}>
          <View style={styles.statsMain}>
            <Text style={styles.averageRating}>
              {parseFloat(stats.average_rating || 0).toFixed(1)}
            </Text>
            <StarRating
              rating={parseFloat(stats.average_rating || 0)}
              size={20}
            />
            <Text style={styles.totalReviews}>
              Basado en {stats.total_reviews} {stats.total_reviews === 1 ? 'calificación' : 'calificaciones'}
            </Text>
          </View>

          {/* Distribución de calificaciones */}
          <View style={styles.ratingDistribution}>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats[`rating_${rating}_count`] || 0;
              const percentage = stats.total_reviews > 0
                ? (count / stats.total_reviews) * 100
                : 0;

              return (
                <View key={rating} style={styles.distributionRow}>
                  <Text style={styles.distributionLabel}>{rating} ★</Text>
                  <View style={styles.distributionBar}>
                    <View
                      style={[
                        styles.distributionFill,
                        { width: `${percentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionCount}>{count}</Text>
                </View>
              );
            })}
          </View>

          {/* Porcentaje de recomendación */}
          {stats.would_recommend_percentage !== null && (
            <View style={styles.recommendSection}>
              <Text style={styles.recommendPercentage}>
                {parseFloat(stats.would_recommend_percentage || 0).toFixed(0)}%
              </Text>
              <Text style={styles.recommendText}>
                de los usuarios recomiendan a {userName}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filtrar por:</Text>
        <View style={styles.filterButtons}>
          <FilterButton
            label="Todas"
            value="all"
            selected={selectedFilter === 'all'}
            onPress={() => handleFilterChange('all')}
          />
          {[5, 4, 3, 2, 1].map(rating => (
            <FilterButton
              key={rating}
              label={`${rating}★`}
              value={rating.toString()}
              selected={selectedFilter === rating.toString()}
              onPress={() => handleFilterChange(rating.toString())}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderReview = ({ item }) => (
    <ReviewCard
      review={item}
      currentUserId={user?.id}
      showReviewer
      showReviewee={false}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⭐</Text>
      <Text style={styles.emptyTitle}>Sin calificaciones</Text>
      <Text style={styles.emptyText}>
        {selectedFilter === 'all'
          ? `${userName} aún no tiene calificaciones`
          : `No hay calificaciones de ${selectedFilter} estrellas`}
      </Text>
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando calificaciones...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calificaciones</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
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
      />
    </SafeAreaView>
  );
}

// Componente auxiliar para botones de filtro
function FilterButton({ label, value, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selected && styles.filterButtonSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        selected && styles.filterButtonTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
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

  placeholder: {
    width: 30,
  },

  listContent: {
    padding: SPACING.lg,
    flexGrow: 1,
  },

  headerContent: {
    marginBottom: SPACING.lg,
  },

  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statsMain: {
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    marginBottom: SPACING.md,
  },

  averageRating: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  totalReviews: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },

  ratingDistribution: {
    marginBottom: SPACING.md,
  },

  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  distributionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    width: 40,
  },

  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },

  distributionFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
  },

  distributionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    width: 30,
    textAlign: 'right',
  },

  recommendSection: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },

  recommendPercentage: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },

  recommendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  filterContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  filterTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },

  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },

  filterButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },

  filterButtonTextSelected: {
    color: COLORS.white,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  },

  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
});
// src/screens/favorites/FavoritesScreen.js
// Pantalla principal de favoritos

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, STATIC_URL } from '../../utils/constants';
import favoriteService from '../../services/favoriteService';
import FavoriteButton from '../../components/FavoriteButton';
import Toast from 'react-native-toast-message';

export default function FavoritesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('workers'); // 'workers' o 'jobs'
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [counts, setCounts] = useState({ workers_count: 0, jobs_count: 0 });

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [workersData, jobsData, countsData] = await Promise.all([
        favoriteService.getFavoriteWorkers(),
        favoriteService.getFavoriteJobs(),
        favoriteService.getFavoritesCount(),
      ]);

      setWorkers(workersData);
      setJobs(jobsData);
      setCounts(countsData);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los favoritos'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (favoriteType, favoriteId) => {
    try {
      await favoriteService.removeFavorite(favoriteType, favoriteId);

      if (favoriteType === 'worker') {
        setWorkers(workers.filter(w => w.user_id !== favoriteId));
        setCounts({ ...counts, workers_count: counts.workers_count - 1 });
      } else {
        setJobs(jobs.filter(j => j.id !== favoriteId));
        setCounts({ ...counts, jobs_count: counts.jobs_count - 1 });
      }

      Toast.show({
        type: 'success',
        text1: 'Eliminado',
        text2: 'Se eliminó de tus favoritos'
      });
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo eliminar'
      });
    }
  };

  const renderWorkerCard = (worker) => {
    const profilePic = worker.profile_picture_url
      ? (worker.profile_picture_url.startsWith('http')
        ? worker.profile_picture_url
        : `${STATIC_URL}${worker.profile_picture_url}`)
      : null;

    const rating = parseFloat(worker.average_rating || 0);

    return (
      <TouchableOpacity
        key={worker.user_id}
        style={styles.card}
        onPress={() => navigation.navigate('WorkerProfile', { workerId: worker.user_id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {worker.first_name?.[0]?.toUpperCase() || '👤'}
              </Text>
            </View>
          )}

          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>
              {worker.first_name} {worker.last_name}
            </Text>

            {rating > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>⭐ {rating.toFixed(1)}</Text>
                {worker.total_reviews > 0 && (
                  <Text style={styles.reviewsText}>({worker.total_reviews})</Text>
                )}
              </View>
            )}

            {(worker.city || worker.department) && (
              <Text style={styles.locationText}>
                📍 {worker.city}{worker.department && `, ${worker.department}`}
              </Text>
            )}
          </View>

          <FavoriteButton
            favoriteType="worker"
            favoriteId={worker.user_id}
            initialIsFavorite={true}
            size="small"
            onToggle={(isFav) => {
              if (!isFav) {
                setWorkers(workers.filter(w => w.user_id !== worker.user_id));
                setCounts({ ...counts, workers_count: counts.workers_count - 1 });
              }
            }}
          />
        </View>

        {worker.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {worker.bio}
          </Text>
        )}

        {worker.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>📝 Notas:</Text>
            <Text style={styles.notesText}>{worker.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderJobCard = (job) => {
    return (
      <TouchableOpacity
        key={job.id}
        style={styles.card}
        onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{job.title}</Text>

            {job.budget_amount && (
              <Text style={styles.budget}>
                💰 {job.currency || 'Q'}{parseFloat(job.budget_amount).toFixed(2)}
              </Text>
            )}

            {(job.city || job.address) && (
              <Text style={styles.locationText}>
                📍 {job.city || job.address}
              </Text>
            )}
          </View>

          <FavoriteButton
            favoriteType="job"
            favoriteId={job.id}
            initialIsFavorite={true}
            size="small"
            onToggle={(isFav) => {
              if (!isFav) {
                setJobs(jobs.filter(j => j.id !== job.id));
                setCounts({ ...counts, jobs_count: counts.jobs_count - 1 });
              }
            }}
          />
        </View>

        {job.description && (
          <Text style={styles.description} numberOfLines={2}>
            {job.description}
          </Text>
        )}

        <View style={styles.jobMeta}>
          <Text style={styles.metaText}>
            {job.client_first_name} {job.client_last_name}
          </Text>
          <Text style={styles.metaText}>
            {job.applications_count || 0} aplicaciones
          </Text>
        </View>

        {job.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>📝 Notas:</Text>
            <Text style={styles.notesText}>{job.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  const currentData = activeTab === 'workers' ? workers : jobs;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ Mis Favoritos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workers' && styles.tabActive]}
          onPress={() => setActiveTab('workers')}
        >
          <Text style={[styles.tabText, activeTab === 'workers' && styles.tabTextActive]}>
            👷 Trabajadores ({counts.workers_count || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'jobs' && styles.tabActive]}
          onPress={() => setActiveTab('jobs')}
        >
          <Text style={[styles.tabText, activeTab === 'jobs' && styles.tabTextActive]}>
            💼 Trabajos ({counts.jobs_count || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadFavorites(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        {currentData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'workers' ? '👷' : '💼'}
            </Text>
            <Text style={styles.emptyTitle}>Sin favoritos</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'workers'
                ? 'Aún no has guardado trabajadores favoritos'
                : 'Aún no has guardado trabajos favoritos'}
            </Text>
          </View>
        ) : (
          currentData.map(item =>
            activeTab === 'workers' ? renderWorkerCard(item) : renderJobCard(item)
          )
        )}
      </ScrollView>
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
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
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
  cardHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
  bio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  budget: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  notesContainer: {
    backgroundColor: COLORS.warning + '10',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  notesLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
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
  },
});
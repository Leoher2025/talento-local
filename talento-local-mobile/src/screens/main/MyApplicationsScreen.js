// src/screens/main/MyApplicationsScreen.js - Pantalla para ver mis aplicaciones como trabajador
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
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import applicationService from '../../services/applicationService';

export default function MyApplicationsScreen({ navigation }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const statusFilters = [
    { key: 'all', label: 'Todas', icon: '📋' },
    { key: 'pending', label: 'Pendientes', icon: '⏳', color: COLORS.warning },
    { key: 'accepted', label: 'Aceptadas', icon: '✅', color: COLORS.success },
    { key: 'rejected', label: 'Rechazadas', icon: '❌', color: COLORS.error }
  ];

  useFocusEffect(
    useCallback(() => {
      loadApplications(1);
      loadStats();
    }, [selectedStatus])
  );

  const loadApplications = async (page = 1, refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      if (page === 1) setIsLoading(true);

      const filters = {
        page,
        limit: 10
      };
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      const response = await applicationService.getMyApplications(filters);
      
      if (page === 1) {
        setApplications(response.data);
      } else {
        setApplications(prev => [...prev, ...response.data]);
      }
      
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error cargando aplicaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las aplicaciones');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await applicationService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleRefresh = () => {
    loadApplications(1, true);
    loadStats();
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !isLoading) {
      loadApplications(pagination.page + 1);
    }
  };

  const handleCancelApplication = async (applicationId) => {
    Alert.alert(
      'Cancelar Aplicación',
      '¿Estás seguro de que deseas cancelar esta aplicación?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await applicationService.cancelApplication(applicationId);
              Alert.alert('✅ Éxito', 'Aplicación cancelada');
              handleRefresh();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la aplicación');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'accepted': return COLORS.success;
      case 'rejected': return COLORS.error;
      case 'cancelled': return COLORS.gray[500];
      default: return COLORS.gray[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptada';
      case 'rejected': return 'Rechazada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const renderHeader = () => (
    <>
      {/* Estadísticas */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statNumber}>{stats.total_applications || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>
              {stats.accepted_applications || 0}
            </Text>
            <Text style={styles.statLabel}>Aceptadas</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>
              {stats.pending_applications || 0}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>
              {stats.success_rate || 0}%
            </Text>
            <Text style={styles.statLabel}>Éxito</Text>
          </View>
        </View>
      )}

      {/* Filtros de estado */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === item.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedStatus(item.key)}
            >
              <Text style={styles.filterIcon}>{item.icon}</Text>
              <Text style={[
                styles.filterText,
                selectedStatus === item.key && styles.filterTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );

  const renderApplication = ({ item }) => (
    <TouchableOpacity
      style={styles.applicationCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.job_id })}
      activeOpacity={0.7}
    >
      {/* Header de la aplicación */}
      <View style={styles.cardHeader}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) + '20' }
        ]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.applicationDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Información del trabajo */}
      <Text style={styles.jobTitle} numberOfLines={2}>
        {item.job_title}
      </Text>
      
      <View style={styles.clientInfo}>
        <Text style={styles.clientLabel}>Cliente:</Text>
        <Text style={styles.clientName}>{item.client_name || 'Usuario'}</Text>
      </View>

      {/* Detalles del trabajo */}
      <View style={styles.jobDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.job_location}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>💰</Text>
          <Text style={styles.detailText}>
            Q{item.proposed_budget || item.job_budget || '0'}
          </Text>
        </View>
      </View>

      {/* Mi propuesta */}
      <View style={styles.proposalSection}>
        <Text style={styles.proposalLabel}>Tu propuesta:</Text>
        <Text style={styles.proposalText} numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      {/* Acciones según estado */}
      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('JobDetail', { jobId: item.job_id })}
          >
            <Text style={styles.viewIcon}>👁️</Text>
            <Text style={styles.viewButtonText}>Ver trabajo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelApplication(item.id)}
          >
            <Text style={styles.cancelIcon}>❌</Text>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => navigation.navigate('Chat', { 
            jobId: item.job_id,
            clientId: item.client_id,
            clientName: item.client_name
          })}
        >
          <Text style={styles.contactIcon}>💬</Text>
          <Text style={styles.contactButtonText}>Contactar cliente</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No tienes aplicaciones</Text>
      <Text style={styles.emptyText}>
        {selectedStatus === 'all' 
          ? "Busca trabajos y aplica para comenzar"
          : `No tienes aplicaciones ${getStatusText(selectedStatus).toLowerCase()}s`}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('JobsList')}
      >
        <Text style={styles.browseButtonText}>Buscar trabajos</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && applications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando aplicaciones...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Aplicaciones</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => navigation.navigate('JobsList')}
        >
          <Text style={styles.filterIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApplication}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          applications.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          pagination.page < pagination.totalPages && (
            <ActivityIndicator 
              style={styles.footerLoader}
              color={COLORS.primary}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  backButton: {
    padding: SPACING.xs,
    width: 40,
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
  
  filterButton: {
    padding: SPACING.xs,
    width: 40,
    alignItems: 'flex-end',
  },
  
  filterIcon: {
    fontSize: FONT_SIZES.xl,
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
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  
  statsCard: {
    alignItems: 'center',
  },
  
  statNumber: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
  },
  
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
  },
  
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  
  listContent: {
    padding: SPACING.md,
  },
  
  emptyListContent: {
    flexGrow: 1,
  },
  
  applicationCard: {
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
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.full,
  },
  
  statusIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs / 2,
  },
  
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  
  applicationDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  
  jobTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  clientInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  
  clientLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginRight: SPACING.xs,
  },
  
  clientName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  jobDetails: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  
  detailIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs / 2,
  },
  
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  
  proposalSection: {
    marginTop: SPACING.xs,
  },
  
  proposalLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  
  proposalText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    lineHeight: 18,
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  
  viewIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },
  
  viewButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.white,
  },
  
  cancelIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },
  
  cancelButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  
  contactIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },
  
  contactButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
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
    marginBottom: SPACING.lg,
  },
  
  browseButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  
  browseButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },
  
  footerLoader: {
    paddingVertical: SPACING.lg,
  },
});
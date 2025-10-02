// src/screens/jobs/MyJobsScreen.js - Pantalla para ver mis trabajos (cliente/trabajador)
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
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import jobService from '../../services/jobService';

export default function MyJobsScreen({ navigation }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const isWorker = user?.role === USER_ROLES.WORKER;

  useEffect(() => {
    loadJobs();
  }, [selectedTab]);

  const loadJobs = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      let myJobs;

      if (isWorker) {
        // Para trabajadores: obtener trabajos asignados
        myJobs = await jobService.getMyAssignedJobs(
          selectedTab === 'all' ? null : selectedTab
        );
      } else {
        // Para clientes: obtener trabajos publicados
        myJobs = await jobService.getMyJobs(
          selectedTab === 'all' ? null : selectedTab
        );
      }

      setJobs(myJobs || []);
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
    }
  };

  const handleRefresh = () => {
    loadJobs(true);
  };

  const handleDeleteJob = (jobId, jobTitle) => {
    Alert.alert(
      'Eliminar trabajo',
      `¿Estás seguro de que quieres eliminar "${jobTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobService.deleteJob(jobId);
              Toast.show({
                type: 'success',
                text1: 'Trabajo eliminado',
                text2: 'El trabajo ha sido eliminado exitosamente',
              });
              loadJobs();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No se pudo eliminar el trabajo',
              });
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (jobId, newStatus, jobTitle) => {
    const statusText = {
      completed: 'completar',
      cancelled: 'cancelar',
      in_progress: 'iniciar',
    };

    Alert.alert(
      `¿${statusText[newStatus]} trabajo?`,
      `¿Estás seguro de que quieres ${statusText[newStatus]} "${jobTitle}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              await jobService.updateJobStatus(jobId, newStatus);
              Toast.show({
                type: 'success',
                text1: 'Estado actualizado',
                text2: `El trabajo ha sido ${statusText[newStatus]}`,
              });
              loadJobs();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo cambiar el estado',
              });
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { backgroundColor: COLORS.success + '20' };
      case 'in_progress':
        return { backgroundColor: COLORS.info + '20' };
      case 'completed':
        return { backgroundColor: COLORS.primary + '20' };
      case 'cancelled':
        return { backgroundColor: COLORS.error + '20' };
      default:
        return { backgroundColor: COLORS.gray[200] };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {[
        { key: 'all', label: 'Todos' },
        { key: 'active', label: 'Activos' },
        { key: 'in_progress', label: 'En Progreso' },
        { key: 'completed', label: 'Completados' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
          onPress={() => setSelectedTab(tab.key)}
        >
          <Text style={[
            styles.tabText,
            selectedTab === tab.key && styles.tabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderJobCard = ({ item }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      activeOpacity={0.7}
    >
      {/* Header con estado */}
      <View style={styles.jobHeader}>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* Título y categoría */}
      <Text style={styles.jobTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryIcon}>{item.category_icon}</Text>
        <Text style={styles.categoryName}>{item.category_name}</Text>
      </View>

      {/* Información del cliente (para trabajadores) */}
      {isWorker && item.client_first_name && (
        <View style={styles.clientInfo}>
          <Text style={styles.clientLabel}>Cliente:</Text>
          <Text style={styles.clientName}>
            {item.client_first_name} {item.client_last_name}
          </Text>
          {item.client_rating && parseFloat(item.client_rating) > 0 && (
            <Text style={styles.clientRating}>
              ⭐ {parseFloat(item.client_rating).toFixed(1)}
            </Text>
          )}
        </View>
      )}

      {/* Información general */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Presupuesto:</Text>
          <Text style={styles.infoValue}>
            {item.budget_type === 'fixed'
              ? `Q${parseFloat(item.budget_amount || 0).toFixed(2)}`
              : item.budget_type === 'hourly'
                ? `Q${parseFloat(item.budget_amount || 0).toFixed(2)}/hora`
                : 'Negociable'}
          </Text>
        </View>
        {!isWorker && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Aplicaciones:</Text>
            <Text style={styles.infoValue}>{item.applications_count || 0}</Text>
          </View>
        )}
      </View>

      {/* Ubicación */}
      <Text style={styles.locationText}>
        📍 {item.city}, {item.department}
      </Text>

      {/* Fechas */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          Publicado: {new Date(item.created_at).toLocaleDateString('es-GT')}
        </Text>
        {item.completed_at && (
          <Text style={styles.dateText}>
            Completado: {new Date(item.completed_at).toLocaleDateString('es-GT')}
          </Text>
        )}
      </View>

      {/* Acciones para CLIENTES */}
      {!isWorker && (item.status === 'active' || item.status === 'in_progress') && (
        <View style={styles.actionsContainer}>
          {item.status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('EditJob', { jobId: item.id })}
              >
                <Text style={styles.actionButtonText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteJob(item.id, item.title)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusChange(item.id, 'completed', item.title)}
            >
              <Text style={styles.completeButtonText}>✅ Completar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleStatusChange(item.id, 'cancelled', item.title)}
          >
            <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Acciones para TRABAJADORES */}
      {isWorker && item.status === 'active' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleStatusChange(item.id, 'in_progress', item.title)}
          >
            <Text style={styles.startButtonText}>🚀 Iniciar Trabajo</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {isWorker
          ? selectedTab === 'all'
            ? 'No tienes trabajos asignados'
            : `No tienes trabajos ${getStatusText(selectedTab).toLowerCase()}`
          : selectedTab === 'all'
            ? 'No has publicado ningún trabajo'
            : `No tienes trabajos ${getStatusText(selectedTab).toLowerCase()}`}
      </Text>
      {!isWorker && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateJob')}
        >
          <Text style={styles.createButtonText}>Publicar mi primer trabajo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && jobs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {isWorker ? 'Cargando tus trabajos asignados...' : 'Cargando tus trabajos...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs de filtro */}
      {renderTabs()}

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
        ListEmptyComponent={renderEmptyState}
      />

      {/* Botón flotante solo para clientes */}
      {!isWorker && (
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
  },

  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },

  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },

  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  tabTextActive: {
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
    shadowRadius: 3,
    elevation: 3,
  },

  jobHeader: {
    marginBottom: SPACING.sm,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },

  statusText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  jobTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  categoryIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },

  categoryName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },

  clientLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginRight: SPACING.xs,
  },

  clientName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginRight: SPACING.xs,
  },

  clientRating: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },

  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },

  infoItem: {
    flexDirection: 'row',
  },

  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginRight: SPACING.xs,
  },

  infoValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  locationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },

  dateContainer: {
    marginBottom: SPACING.sm,
  },

  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },

  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: SPACING.xs,
  },

  actionButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray[100],
  },

  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
  },

  deleteButton: {
    backgroundColor: `${COLORS.error}20`,
  },

  deleteButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },

  completeButton: {
    backgroundColor: `${COLORS.success}20`,
  },

  completeButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },

  cancelButton: {
    backgroundColor: `${COLORS.warning}20`,
  },

  cancelButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
  },

  startButton: {
    backgroundColor: `${COLORS.primary}20`,
  },

  startButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
  },

  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },

  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  createButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
  },

  createButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
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
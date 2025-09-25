// src/screens/main/ManageApplicationsScreen.js - Pantalla para gestionar aplicaciones como cliente
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
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import applicationService from '../../services/applicationService';
import jobService from '../../services/jobService';
import chatService from '../../services/chatService';

export default function ManageApplicationsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { jobId } = route.params;

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const statusFilters = [
    { key: 'all', label: 'Todas', icon: '📋' },
    { key: 'pending', label: 'Pendientes', icon: '⏳', color: COLORS.warning },
    { key: 'accepted', label: 'Aceptada', icon: '✅', color: COLORS.success },
    { key: 'rejected', label: 'Rechazadas', icon: '❌', color: COLORS.error }
  ];

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Cargar detalles del trabajo
      const jobData = await jobService.getJobById(jobId);
      setJob(jobData);

      // Cargar aplicaciones
      const response = await applicationService.getJobApplications(jobId);
      setApplications(response.data);

      // Si hay una aplicación aceptada, seleccionarla automáticamente
      const accepted = response.data.find(app => app.status === 'accepted');
      if (accepted) {
        setSelectedApplication(accepted.id);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId, workerName) => {
    Alert.alert(
      'Aceptar Aplicación',
      `¿Estás seguro de que deseas aceptar la aplicación de ${workerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          style: 'default',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await applicationService.acceptApplication(applicationId);
              Alert.alert('✅ Éxito', 'Aplicación aceptada exitosamente');
              await loadData(); // Recargar datos
            } catch (error) {
              console.error('Error aceptando aplicación:', error);
              Alert.alert('Error', 'No se pudo aceptar la aplicación');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectApplication = async (applicationId, workerName) => {
    Alert.alert(
      'Rechazar Aplicación',
      `¿Estás seguro de que deseas rechazar la aplicación de ${workerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await applicationService.rejectApplication(applicationId);
              Alert.alert('✅ Éxito', 'Aplicación rechazada');
              await loadData(); // Recargar datos
            } catch (error) {
              console.error('Error rechazando aplicación:', error);
              Alert.alert('Error', 'No se pudo rechazar la aplicación');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // FUNCIÓN IMPORTANTE PARA EL CHAT
  const handleContactWorker = async (application) => {
    try {
      console.log("Creando conversación con trabajador:", {
        jobId: jobId,
        clientId: user.id,
        workerId: application.worker_id
      });

      // Importar el servicio de chat si no está importado
      const chatService = require('../../services/chatService').default;

      // Obtener o crear conversación
      const response = await chatService.getOrCreateConversation(
        jobId,
        user.id, // Cliente (el dueño del trabajo)
        application.worker_id // Trabajador que aplicó
      );

      console.log("Conversación creada/obtenida:", response);

      // Navegar al chat
      navigation.navigate('ChatScreen', {
        conversationId: response.data.id,
        otherUserName: application.worker_name,
        jobTitle: job?.title
      });
    } catch (error) {
      console.error('Error abriendo chat:', error);
      Alert.alert('Error', 'No se pudo abrir el chat');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData().finally(() => setIsRefreshing(false));
  };

  const handleViewWorkerProfile = (workerId) => {
    navigation.navigate('WorkerProfile', { workerId });
  };

  const getFilteredApplications = () => {
    if (filterStatus === 'all') return applications;
    return applications.filter(app => app.status === filterStatus);
  };

  const renderHeader = () => (
    <>
      {/* Información del trabajo */}
      <View style={styles.jobInfoCard}>
        <Text style={styles.jobTitle}>{job?.title}</Text>
        <Text style={styles.jobDescription} numberOfLines={2}>
          {job?.description}
        </Text>

        <View style={styles.jobStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statText}>
              {applications.length} aplicante{applications.length !== 1 && 's'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statText}>
              Publicado {job && new Date(job.created_at).toLocaleDateString()}
            </Text>
          </View>
          {job?.urgency === 'urgent' && (
            <View style={[styles.urgencyBadge, { backgroundColor: COLORS.error + '20' }]}>
              <Text style={[styles.urgencyText, { color: COLORS.error }]}>
                🔥 Urgente
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Filtros */}
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
                filterStatus === item.key && styles.filterChipActive
              ]}
              onPress={() => setFilterStatus(item.key)}
            >
              <Text style={styles.filterIcon}>{item.icon}</Text>
              <Text style={[
                styles.filterText,
                filterStatus === item.key && styles.filterTextActive
              ]}>
                {item.label}
                {item.key === 'pending' && ` (${applications.filter(a => a.status === 'pending').length})`}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );

  const renderApplication = ({ item }) => {
    const isSelected = selectedApplication === item.id;
    const isAccepted = item.status === 'accepted';
    const isPending = item.status === 'pending';
    const isRejected = item.status === 'rejected';

    return (
      <TouchableOpacity
        style={[
          styles.applicationCard,
          isSelected && styles.selectedCard,
          isAccepted && styles.acceptedCard
        ]}
        onPress={() => setSelectedApplication(item.id)}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        {/* Header con foto y nombre del trabajador */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.workerInfo}
            onPress={() => navigation.navigate('Profile', { userId: item.worker_id })}
          >
            <Image
              source={{
                uri: item.worker_image || 'https://via.placeholder.com/50'
              }}
              style={styles.workerImage}
            />
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{item.worker_name}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingIcon}>⭐</Text>
                <Text style={styles.rating}>
                  {item.worker_rating ? parseFloat(item.worker_rating).toFixed(1) : '0.0'}
                </Text>
                {item.worker_verified && item.worker_verified !== 'unverified' && (
                  <Text style={styles.verifiedIcon}>✓</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Badge de estado */}
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: isAccepted
                ? COLORS.success + '20'
                : isPending
                  ? COLORS.warning + '20'
                  : COLORS.error + '20'
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                color: isAccepted
                  ? COLORS.success
                  : isPending
                    ? COLORS.warning
                    : COLORS.error
              }
            ]}>
              {isAccepted ? '✅ Aceptada' : isPending ? '⏳ Pendiente' : '❌ Rechazada'}
            </Text>
          </View>
        </View>

        {/* Propuesta del trabajador */}
        <View style={styles.proposalSection}>
          <Text style={styles.proposalLabel}>Propuesta:</Text>
          <Text
            style={styles.proposalText}
            numberOfLines={isSelected ? undefined : 3}
          >
            {item.message}
          </Text>
        </View>

        {/* Presupuesto propuesto */}
        {item.proposed_budget && (
          <View style={styles.budgetSection}>
            <Text style={styles.budgetIcon}>💰</Text>
            <Text style={styles.budgetLabel}>Presupuesto propuesto:</Text>
            <Text style={styles.budgetAmount}>Q{item.proposed_budget}</Text>
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.applicationMeta}>
          <Text style={styles.metaText}>
            📅 Aplicó el {new Date(item.created_at).toLocaleDateString()} a las{' '}
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Botones de acción (solo si está seleccionado) */}
        {isSelected && (
          <View style={styles.actionButtons}>
            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                  onPress={() => handleRejectApplication(item.id, item.worker_name)}
                  disabled={isProcessing}
                >
                  <Text style={styles.rejectIcon}>❌</Text>
                  <Text style={styles.rejectButtonText}>Rechazar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
                  onPress={() => handleAcceptApplication(item.id, item.worker_name)}
                  disabled={isProcessing}
                >
                  <Text style={styles.acceptIcon}>✅</Text>
                  <Text style={styles.acceptButtonText}>Aceptar</Text>
                </TouchableOpacity>
              </>
            )}

            {isAccepted && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleContactWorker(item)}
              >
                <Text style={styles.contactIcon}>💬</Text>
                <Text style={styles.contactButtonText}>Contactar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile', { userId: item.worker_id })}
            >
              <Text style={styles.profileIcon}>👤</Text>
              <Text style={styles.profileButtonText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>
        {filterStatus === 'all'
          ? 'No hay aplicaciones todavía'
          : `No hay aplicaciones ${statusFilters.find(s => s.key === filterStatus)?.label.toLowerCase()}`}
      </Text>
      <Text style={styles.emptyText}>
        {filterStatus === 'all'
          ? 'Cuando los trabajadores apliquen a tu oferta, aparecerán aquí'
          : 'Prueba cambiando el filtro para ver otras aplicaciones'}
      </Text>
      {filterStatus !== 'all' && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={styles.clearFilterText}>Ver todas</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
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
        <Text style={styles.headerTitle}>Gestionar Aplicaciones</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditJob', { jobId })}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getFilteredApplications()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApplication}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          getFilteredApplications().length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* Overlay de procesamiento */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.processingText}>Procesando...</Text>
          </View>
        </View>
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

  editButton: {
    padding: SPACING.xs,
    width: 40,
    alignItems: 'flex-end',
  },

  editIcon: {
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

  listContent: {
    padding: SPACING.md,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  jobInfoCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  jobTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  jobDescription: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },

  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
    marginTop: SPACING.xs,
  },

  statIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs / 2,
  },

  statText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  urgencyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },

  urgencyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
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

  filterIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs / 2,
  },

  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
  },

  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
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

  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  acceptedCard: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },

  workerInfo: {
    flexDirection: 'row',
    flex: 1,
  },

  workerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray[200],
  },

  workerDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },

  workerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs / 2,
  },

  ratingIcon: {
    fontSize: FONT_SIZES.sm,
  },

  rating: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs / 2,
  },

  verifiedIcon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: 'bold',
  },

  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.full,
  },

  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  proposalSection: {
    marginBottom: SPACING.sm,
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

  budgetSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.sm,
  },

  budgetIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },

  budgetLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginRight: SPACING.xs,
  },

  budgetAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  applicationMeta: {
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },

  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },

  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },

  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginRight: SPACING.xs,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.md,
  },

  rejectIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs / 2,
  },

  rejectButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '600',
  },

  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.xs,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
  },

  acceptIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs / 2,
  },

  acceptButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },

  contactButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },

  contactIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs / 2,
  },

  contactButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },

  profileButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },

  profileIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs / 2,
  },

  profileButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },

  buttonDisabled: {
    opacity: 0.6,
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
    textAlign: 'center',
  },

  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },

  clearFilterButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },

  clearFilterText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },

  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  processingContent: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },

  processingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },
});
// src/screens/jobs/JobDetailScreen.js - Pantalla de detalle del trabajo
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import chatService from '../../services/chatService';

// Componente de paso de estado
function StatusStep({ icon, label, active, completed }) {
  return (
    <View style={styles.statusStep}>
      <View style={[
        styles.statusIcon,
        active && styles.statusIconActive,
        completed && styles.statusIconCompleted
      ]}>
        <Text style={styles.statusIconText}>{icon}</Text>
      </View>
      <Text style={[
        styles.statusLabel,
        (active || completed) && styles.statusLabelActive
      ]}>
        {label}
      </Text>
    </View>
  );
}

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadJobDetail();
  }, [jobId]);

  const loadJobDetail = async () => {
    try {
      setIsLoading(true);
      const jobData = await jobService.getJobById(jobId);
      setJob(jobData);
      console.log('Detalle del trabajo:', jobData);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el trabajo',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

    const handleDelete = () => {
    Alert.alert(
      'Eliminar trabajo',
      '¿Estás seguro de que quieres eliminar este trabajo?',
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
              navigation.goBack();
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

  const handleApply = async () => {
    // Verificar si el usuario ya aplicó
    try {
      const response = await applicationService.checkIfApplied(jobId);
      if (response.data?.has_applied) {
        Alert.alert(
          'Ya aplicaste',
          'Ya has enviado una aplicación para este trabajo',
          [
            {
              text: 'Ver mis aplicaciones',
              onPress: () => navigation.navigate('MyApplications')
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Error verificando aplicación:', error);
    }

    // Navegar a la pantalla de aplicación
    navigation.navigate('Applications', { jobId: job.id });
  };

  const handleContact = async () => {
    try {
      // Determinar los IDs según el rol
      let clientId, workerId;

      if (isOwner) {
        // Si es el dueño (cliente), contactar al trabajador asignado
        if (!job.assigned_worker_id) {
          Alert.alert('Info', 'No hay trabajador asignado a este trabajo');
          return;
        }
        clientId = user.id;
        workerId = job.assigned_worker_id;
      } else if (isWorker) {
        // Si es trabajador, contactar al cliente
        clientId = job.client_id;
        workerId = user.id;
      } else {
        Alert.alert('Error', 'No tienes permiso para contactar');
        return;
      }

      console.log("Creando conversación:", {
        jobId: job.id,
        clientId: clientId,
        workerId: workerId
      });

      // Obtener o crear conversación - CORREGIDO
      const response = await chatService.getOrCreateConversation(
        job.id,
        clientId,
        workerId
      );

      // Navegar al chat
      navigation.navigate('ChatScreen', {
        conversationId: response.data.id,
        otherUserName: isOwner
          ? `${job.worker_first_name} ${job.worker_last_name}`
          : `${job.client_first_name} ${job.client_last_name}`,
        jobTitle: job.title
      });
    } catch (error) {
      console.error('Error abriendo chat:', error);
      Alert.alert('Error', 'No se pudo abrir el chat');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'activo',
      'in_progress': 'en progreso',
      'completed': 'completado',
      'cancelled': 'cancelado',
      'draft': 'borrador'
    };
    return labels[status] || status;
  };

  const handleStatusChange = (newStatus) => {
    const statusText = {
      completed: 'completar',
      cancelled: 'cancelar',
      in_progress: 'marcar en progreso',
    };

    Alert.alert(
      `¿${statusText[newStatus]} trabajo?`,
      `¿Estás seguro de que quieres ${statusText[newStatus]} este trabajo?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              setIsUpdatingStatus(true); // ✅ AGREGAR
              await jobService.updateJobStatus(jobId, newStatus);
              Toast.show({
                type: 'success',
                text1: 'Estado actualizado',
                text2: `El trabajo ha sido ${statusText[newStatus]}`,
              });
              loadJobDetail(); // Recargar para ver el nuevo estado
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo cambiar el estado',
              });
            } finally {
              setIsUpdatingStatus(false); // ✅ AGREGAR
            }
          },
        },
      ]
    );
  };

  const handleOpenMap = () => {
    // Abrir la ubicación en el mapa
    const { latitude, longitude, address, city } = job;

    if (latitude && longitude) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${latitude},${longitude}`;
      const label = encodeURIComponent(`${address}, ${city}`);
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
      });

      Linking.openURL(url);
    } else {
      // Si no hay coordenadas, buscar por dirección
      const fullAddress = encodeURIComponent(`${address}, ${city}, ${job.department}, Guatemala`);
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${fullAddress}`,
        android: `https://www.google.com/maps/search/?api=1&query=${fullAddress}`
      });

      Linking.openURL(url);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'in_progress': return COLORS.info;
      case 'completed': return COLORS.primary;
      case 'cancelled': return COLORS.error;
      default: return COLORS.gray[500];
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '✅ Activo';
      case 'in_progress': return '🔄 En Progreso';
      case 'completed': return '✓ Completado';
      case 'cancelled': return '❌ Cancelado';
      default: return status;
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
      case 'urgent': return '🔥 Urgente - Necesito ayuda HOY';
      case 'high': return '⚡ Alta - Lo antes posible';
      case 'medium': return '⏱️ Media - En los próximos días';
      default: return '😌 Baja - No hay prisa';
    }
  };

  const formatBudget = () => {
    if (!job) return '';

    // Convertir a número si es string
    const amount = typeof job.budget_amount === 'string'
      ? parseFloat(job.budget_amount)
      : job.budget_amount;

    if (job.budget_type === 'fixed' && amount) {
      return `Q${amount.toFixed(2)}`;
    } else if (job.budget_type === 'hourly' && amount) {
      return `Q${amount.toFixed(2)}/hora`;
    } else {
      return 'Negociable';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCompleteConfirmation = () => {
    Alert.alert(
      'Marcar como Completado',
      '¿Estás seguro de que el trabajo ha sido completado satisfactoriamente? Una vez marcado, podrás dejar una calificación.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sí, Completado',
          onPress: () => handleStatusChange('completed'),
          style: 'default'
        }
      ]
    );
  };

  const handleCancelConfirmation = () => {
    Alert.alert(
      'Cancelar Trabajo',
      '¿Estás seguro de que deseas cancelar este trabajo?',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Sí, Cancelar',
          onPress: () => handleStatusChange('cancelled'),
          style: 'destructive'
        }
      ]
    );
  };

  const handleStartChat = async (otherUserId) => {
    try {
      // Crear o obtener conversación
      const conversationData = {
        jobId: job.id,
        clientId: job.client_id,
        workerId: job.assigned_worker_id
      };

      const response = await chatService.getOrCreateConversation(conversationData);

      if (response.success) {
        navigation.navigate('ChatScreen', {
          conversationId: response.data.id,
          otherUserId: otherUserId,
          jobId: job.id
        });
      }
    } catch (error) {
      console.error('Error iniciando chat:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo iniciar el chat',
      });
    }
  };

  // Determinar si el usuario es el dueño del trabajo
  const isOwner = user?.id === job?.client_id;
  const isWorker = user?.role === USER_ROLES.WORKER;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar el trabajo</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con estado */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.statusFlow}>
            <StatusStep
              icon="📝"
              label="Publicado"
              active={true}
              completed={['active', 'in_progress', 'completed'].includes(job.status)}
            />
            <View style={styles.statusLine} />
            <StatusStep
              icon="🚀"
              label="En Progreso"
              active={job.status === 'in_progress'}
              completed={job.status === 'completed'}
            />
            <View style={styles.statusLine} />
            <StatusStep
              icon="✓"
              label="Completado"
              active={job.status === 'completed'}
              completed={job.status === 'completed'}
            />
          </View>
        </View>

        {/* Título y categoría */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{job.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{job.category_icon}</Text>
            <Text style={styles.categoryName}>{job.category_name}</Text>
          </View>
        </View>

        {/* Urgencia */}
        <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(job.urgency)}20` }]}>
          <Text style={[styles.urgencyText, { color: getUrgencyColor(job.urgency) }]}>
            {getUrgencyText(job.urgency)}
          </Text>
        </View>

        {/* Información del cliente */}
        {!isOwner && (
          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>Publicado por</Text>
            <View style={styles.clientInfo}>
              <View style={styles.clientAvatar}>
                <Text style={styles.avatarText}>
                  {job.client_first_name?.[0]?.toUpperCase() || '👤'}
                </Text>
              </View>
              <View style={styles.clientDetails}>
                <Text style={styles.clientName}>
                  {job.client_first_name} {job.client_last_name}
                </Text>
                {job.client_rating && parseFloat(job.client_rating) > 0 && (
                  <Text style={styles.clientRating}>
                    ⭐ {parseFloat(job.client_rating).toFixed(1)} • {job.client_jobs_completed || 0} trabajos
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Presupuesto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Presupuesto</Text>
          <View style={styles.budgetContainer}>
            <Text style={styles.budgetAmount}>{formatBudget()}</Text>
            <Text style={styles.budgetType}>
              {job.budget_type === 'fixed' ? 'Precio fijo' :
                job.budget_type === 'hourly' ? 'Por hora' : 'A convenir'}
            </Text>
          </View>
        </View>

        {/* Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={handleOpenMap}
            activeOpacity={0.7}
          >
            <View style={styles.locationInfo}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationTexts}>
                <Text style={styles.locationAddress}>{job.address}</Text>
                {job.address_details && (
                  <Text style={styles.locationDetails}>{job.address_details}</Text>
                )}
                <Text style={styles.locationCity}>{job.city}, {job.department}</Text>
              </View>
            </View>
            <Text style={styles.mapLinkText}>Ver en mapa →</Text>
          </TouchableOpacity>
        </View>

        {/* Fecha necesaria */}
        {job.needed_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fecha necesaria</Text>
            <Text style={styles.neededDate}>
              📅 {new Date(job.needed_date).toLocaleDateString('es-GT')}
            </Text>
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Publicado:</Text>
            <Text style={styles.infoValue}>{formatDate(job.created_at)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Vistas:</Text>
            <Text style={styles.infoValue}>{job.views_count || 0}</Text>
          </View>
          {isOwner && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Aplicaciones:</Text>
              <Text style={styles.infoValue}>{job.applications_count || 0}</Text>
            </View>
          )}
        </View>

        {/* Trabajador asignado (si hay) */}
        {job.assigned_worker_id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajador Asignado</Text>
            <View style={styles.workerInfo}>
              <View style={styles.workerAvatar}>
                <Text style={styles.avatarText}>
                  {job.worker_first_name?.[0]?.toUpperCase() || '🔧'}
                </Text>
              </View>
              <View style={styles.workerDetails}>
                <Text style={styles.workerName}>
                  {job.worker_first_name} {job.worker_last_name}
                </Text>
                {job.worker_rating && parseFloat(job.worker_rating) > 0 && (
                  <Text style={styles.workerRating}>
                    ⭐ {parseFloat(job.worker_rating).toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Botones de acción según estado y rol */}
        <View style={styles.actionsSection}>
          {/* TRABAJADOR: Aplicar al trabajo */}
          {job.status === 'active' &&
            isWorker &&
            !isOwner &&
            !job.assigned_worker_id && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => navigation.navigate('Applications', { jobId: job.id })}
              >
                <Text style={styles.actionButtonIcon}>📝</Text>
                <Text style={styles.actionButtonText}>Aplicar al Trabajo</Text>
              </TouchableOpacity>
            )}

          {isOwner ? (
            // Acciones para el dueño del trabajo
            <>
              {job.status === 'active' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => navigation.navigate('EditJob', { jobId: job.id })}
                  >
                    <Text style={styles.primaryButtonText}>✏️ Editar Trabajo</Text>
                  </TouchableOpacity>

                  {job.applications_count > 0 && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.secondaryButton]}
                      onPress={() => navigation.navigate('ManageApplications', { jobId: job.id })}
                    >
                      <Text style={styles.secondaryButtonText}>
                        👥 Ver Aplicaciones ({job.applications_count})
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={handleDelete}
                  >
                    <Text style={styles.dangerButtonText}>🗑️ Eliminar</Text>
                  </TouchableOpacity>
                </>
              )}

              {job.status === 'in_progress' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.successButton]}
                    onPress={() => handleStatusChange('completed')}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.successButtonText}>✅ Marcar como Completado</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={handleContact}
                  >
                    <Text style={styles.secondaryButtonText}>💬 Contactar Trabajador</Text>
                  </TouchableOpacity>
                </>
              )}

              {(job.status === 'active' || job.status === 'in_progress') && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.warningButton]}
                  onPress={() => handleStatusChange('cancelled')}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <ActivityIndicator color={COLORS.warning} />
                  ) : (
                    <Text style={styles.warningButtonText}>❌ Cancelar Trabajo</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* ✅ Botón para calificar trabajador - CLIENTE */}
              {job.status === 'completed' && job.assigned_worker_id && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => navigation.navigate('CreateReview', {
                    jobId: job.id,
                    revieweeId: job.assigned_worker_id,
                    revieweeName: `${job.worker_first_name} ${job.worker_last_name}`,
                    reviewType: 'worker_review'
                  })}
                >
                  <Text style={styles.reviewButtonIcon}>⭐</Text>
                  <Text style={styles.reviewButtonText}>Calificar Trabajador</Text>
                </TouchableOpacity>
              )}
            </>
          ) : isWorker ? (
            // Acciones para trabajadores
            <>
              {job.status === 'active' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>📝 Aplicar a este trabajo</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={handleContact}
                  >
                    <Text style={styles.secondaryButtonText}>💬 Hacer una pregunta</Text>
                  </TouchableOpacity>
                </>
              )}

              {job.status === 'in_progress' && job.assigned_worker_id === user.id && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleContact}
                >
                  <Text style={styles.secondaryButtonText}>💬 Contactar Cliente</Text>
                </TouchableOpacity>
              )}

              {/* ✅ Botón para calificar cliente - TRABAJADOR */}
              {job.status === 'completed' && job.assigned_worker_id === user.id && job.client_id && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => navigation.navigate('CreateReview', {
                    jobId: job.id,
                    revieweeId: job.client_id,
                    revieweeName: `${job.client_first_name} ${job.client_last_name}`,
                    reviewType: 'client_review'
                  })}
                >
                  <Text style={styles.reviewButtonIcon}>⭐</Text>
                  <Text style={styles.reviewButtonText}>Calificar Cliente</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
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

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },

  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  backButton: {
    padding: SPACING.sm,
  },

  backButtonText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
  },

  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },

  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },

  titleSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },

  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },

  categoryIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.xs,
  },

  categoryName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  urgencyBadge: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },

  urgencyText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  section: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },

  clientSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
  },

  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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

  clientDetails: {
    flex: 1,
  },

  clientName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },

  clientRating: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  budgetAmount: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },

  budgetType: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },

  locationInfo: {
    flex: 1,
    flexDirection: 'row',
  },

  locationIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },

  locationTexts: {
    flex: 1,
  },

  locationAddress: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  locationDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs / 2,
  },

  locationCity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs / 2,
  },

  mapLinkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  neededDate: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },

  infoSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
  },

  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  infoValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },

  workerDetails: {
    flex: 1,
  },

  workerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },

  workerRating: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  secondaryButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.primary,
  },

  successButton: {
    backgroundColor: COLORS.success,
  },

  successButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  dangerButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
  },

  dangerButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  warningButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },

  warningButtonText: {
    color: COLORS.warning,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },

  reviewButtonIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },

  actionsSection: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  actionButtonIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },

  actionButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.white,
  },

  startButton: {
    backgroundColor: COLORS.primary,
  },

  completeButton: {
    backgroundColor: COLORS.success,
  },

  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
  },

  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.error,
  },

  reviewButton: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },

  statusFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },

  statusStep: {
    alignItems: 'center',
  },

  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  statusIconActive: {
    backgroundColor: COLORS.primary + '30',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  statusIconCompleted: {
    backgroundColor: COLORS.success,
  },

  statusIconText: {
    fontSize: FONT_SIZES.lg,
  },

  statusLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  statusLabelActive: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  statusLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: SPACING.xs,
  },

  chatButton: {
    backgroundColor: COLORS.info + '20',
    borderWidth: 1,
    borderColor: COLORS.info,
  },

  chatButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.info,
  },
});
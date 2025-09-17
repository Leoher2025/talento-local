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

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

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
            }
          },
        },
      ]
    );
  };

  const handleApply = async () => {
    // Esta función la implementaremos cuando tengamos el sistema de aplicaciones
    Alert.alert(
      'Aplicar al trabajo',
      'Esta función estará disponible pronto',
      [{ text: 'OK' }]
    );
  };

  const handleContact = () => {
    // Esta función la implementaremos cuando tengamos el sistema de chat
    Alert.alert(
      'Contactar',
      'El sistema de mensajería estará disponible pronto',
      [{ text: 'OK' }]
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
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
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

        {/* Acciones según el rol y estado */}
        <View style={styles.actionsSection}>
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
                      onPress={() => Alert.alert('Próximamente', 'Ver aplicaciones estará disponible pronto')}
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
                  >
                    <Text style={styles.successButtonText}>✅ Marcar como Completado</Text>
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
                >
                  <Text style={styles.warningButtonText}>❌ Cancelar Trabajo</Text>
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
  
  actionsSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.lg,
  },
  
  actionButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
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
});
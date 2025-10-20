// src/screens/main/HomeScreen.js - Pantalla principal de la app
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES, JOB_CATEGORIES } from '../../utils/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import applicationService from '../../services/applicationService';
import jobService from '../../services/jobService';

export default function HomeScreen({ navigation }) {
  const { user, logout, unreadNotifications } = useAuth();
  const isWorker = user?.role === USER_ROLES.WORKER; 

  // Renderizar vista según el rol del usuario
  const renderContent = () => {
    if (user?.role === USER_ROLES.WORKER) {
      return <WorkerHomeView navigation={navigation} />;
    } else {
      return <ClientHomeView navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header con notificaciones */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {isWorker
                ? '¿Listo para trabajar hoy?'
                : '¿Qué necesitas hoy?'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Botón de notificaciones */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido según el rol */}
        {renderContent()}

        {/* Botón temporal de logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Vista para Trabajadores
// Vista para Trabajadores
const WorkerHomeView = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    rating: 0,
    pendingApplications: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    loadWorkerStats();
  }, []);

  const loadWorkerStats = async () => {
    try {
      setIsLoadingStats(true);

      // Cargar estadísticas de aplicaciones
      const appStats = await applicationService.getStats();

      // Cargar trabajos asignados
      const assignedJobs = await jobService.getMyAssignedJobs();

      // Calcular estadísticas
      const activeJobs = assignedJobs?.filter(j =>
        ['active', 'in_progress'].includes(j.status)
      ).length || 0;

      const completedJobs = assignedJobs?.filter(j =>
        j.status === 'completed'
      ).length || 0;

      setStats({
        activeJobs,
        completedJobs,
        rating: user?.profile?.rating_average || 0,
        pendingApplications: appStats.data?.pending_applications || 0,
        totalApplications: appStats.data?.total_applications || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <View style={styles.content}>
      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('MyJobs')}
        >
          <Text style={styles.statNumber}>{stats.activeJobs}</Text>
          <Text style={styles.statLabel}>Trabajos Activos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('MyJobs')}
        >
          <Text style={styles.statNumber}>{stats.completedJobs}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {parseFloat(stats.rating || 0).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>⭐ Calificación</Text>
        </View>
      </View>

      {/* Tarjeta de aplicaciones */}
      <TouchableOpacity
        style={styles.applicationsCard}
        onPress={() => navigation.navigate('MyApplications')}
      >
        <View style={styles.applicationCardHeader}>
          <View>
            <Text style={styles.applicationsTitle}>Mis Aplicaciones</Text>
            <Text style={styles.applicationsSubtitle}>
              {stats.totalApplications} aplicaciones totales
            </Text>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingCount}>{stats.pendingApplications}</Text>
            <Text style={styles.pendingLabel}>Pendientes</Text>
          </View>
        </View>
        <Text style={styles.viewAllLink}>Ver todas →</Text>
      </TouchableOpacity>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: COLORS.primary + '10' }]}
          onPress={() => navigation.navigate('JobsList')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Buscar Trabajos</Text>
            <Text style={styles.actionSubtitle}>
              Encuentra trabajos cerca de ti
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: COLORS.success + '10' }]}
          onPress={() => navigation.navigate('MyJobs')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Mis Trabajos</Text>
            <Text style={styles.actionSubtitle}>
              Ver trabajos asignados
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: COLORS.warning + '10' }]}
          onPress={() => navigation.navigate('MyApplications')}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Mis Aplicaciones</Text>
            <Text style={styles.actionSubtitle}>
              {stats.pendingApplications} pendientes de respuesta
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: COLORS.info + '10' }]}
          onPress={() => navigation.navigate('ConversationsScreen')}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Mensajes</Text>
            <Text style={styles.actionSubtitle}>
              Conversaciones con clientes
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Trabajos recomendados */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trabajos Cercanos</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('JobsList')}
          >
            <Text style={styles.sectionLink}>Ver todos →</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.comingSoon}>
          Pronto verás trabajos recomendados aquí
        </Text>
      </View>
    </View>
  );
};

// Vista para Clientes
const ClientHomeView = ({ navigation }) => {
  return (
    <View style={styles.content}>
      {/* Búsqueda rápida */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => navigation.navigate('WorkersSearch')}
      >
        <Text style={styles.searchIcon}>👷</Text>
        <Text style={styles.searchPlaceholder}>
          Buscar profesionales...
        </Text>
      </TouchableOpacity>

      {/* Accesos rápidos principales */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('CreateJob')}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Publicar Trabajo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('MyJobs')}
        >
          <Text style={styles.quickActionIcon}>📝</Text>
          <Text style={styles.quickActionText}>Mis Trabajos</Text>
        </TouchableOpacity>
      </View>

      {/* Categorías */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías Populares</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkersSearch')}
          >
            <Text style={styles.sectionLink}>Ver todas →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesGrid}>
          {JOB_CATEGORIES.slice(0, 6).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('WorkersSearch', { categoryId: category.id })}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trabajadores destacados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profesionales Destacados</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyText}>
            Pronto verás los mejores profesionales aquí
          </Text>
        </View>
      </View>

      {/* Boton para ir a Conversaciones */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('ConversationsScreen')}
      >
        <Text style={styles.floatingButtonText}>💬 Mis Mensajes</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
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

  greeting: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },

  subGreeting: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  profileButton: {
    padding: SPACING.sm,
  },

  profileIcon: {
    fontSize: FONT_SIZES.xl,
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  statNumber: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },

  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.lg,
  },

  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  quickActionIcon: {
    fontSize: 30,
    marginBottom: SPACING.xs,
  },

  quickActionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  searchIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  section: {
    marginBottom: SPACING.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  sectionLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  categoryCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  categoryIcon: {
    fontSize: 30,
    marginBottom: SPACING.xs,
  },

  categoryName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.primary,
    textAlign: 'center',
  },

  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: SPACING.md,
  },

  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },

  actionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  floatingButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginTop: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  floatingButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },

  logoutText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  chatIcon: {
    fontSize: 24,
    color: COLORS.white,
  },

  applicationsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  applicationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  applicationsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },

  applicationsSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  pendingBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  pendingCount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.warning,
  },

  pendingLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    marginTop: 2,
  },

  viewAllLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'right',
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },

  actionIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },

  actionInfo: {
    flex: 1,
  },

  actionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },

  actionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  actionArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.secondary,
  },

  comingSoon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },

  headerLeft: {
    flex: 1,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  notificationButton: {
    position: 'relative',
    padding: SPACING.sm,
  },

  notificationIcon: {
    fontSize: FONT_SIZES.xl,
  },

  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
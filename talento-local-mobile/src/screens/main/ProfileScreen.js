// src/screens/main/ProfileScreen.js - Pantalla de perfil del usuario
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES, API_URL, STATIC_URL } from '../../utils/constants';
import StarRating from '../../components/StarRating';
import reviewService from '../../services/reviewService';
import notificationService from '../../services/notificationService'; //Quitar despues ya que solo es de prueba

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const [reviewStats, setReviewStats] = React.useState(null);

  React.useEffect(() => {
    loadReviewStats();
  }, []);

  const loadReviewStats = async () => {
    try {
      const response = await reviewService.getUserReviewStats(user.id);
      if (response.success) {
        setReviewStats(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Quitar despues solo es de prueba
  const handleTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Toast.show({
        type: 'success',
        text1: 'Notificación enviada',
        text2: 'Revisa tu bandeja de notificaciones',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo enviar la notificación',
      });
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleTerms = () => {
    navigation.navigate('StaticContent', {
      type: 'terms',
      title: 'Términos y Condiciones'
    });
  };

  const handlePrivacy = () => {
    navigation.navigate('StaticContent', {
      type: 'privacy',
      title: 'Política de Privacidad'
    });
  };

  const handleHelp = () => {
    navigation.navigate('StaticContent', {
      type: 'help',
      title: 'Ayuda y Soporte'
    });
  };

  const handleAbout = () => {
    navigation.navigate('StaticContent', {
      type: 'about',
      title: 'Acerca de'
    });
  };

  const getVerificationBadge = () => {
    switch (user?.verificationStatus) {
      case 'fully_verified':
        return { text: 'Verificado', color: COLORS.success };
      case 'email_verified':
        return { text: 'Email Verificado', color: COLORS.warning };
      case 'phone_verified':
        return { text: 'Teléfono Verificado', color: COLORS.warning };
      default:
        return { text: 'No Verificado', color: COLORS.error };
    }
  };

  const verificationBadge = getVerificationBadge();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información del Perfil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleEditProfile}
          >
            {user?.profile_picture_url || user?.profile?.profile_picture_url ? (
              <Image
                source={{
                  uri: (user?.profile_picture_url || user?.profile?.profile_picture_url).startsWith('http')
                    ? (user?.profile_picture_url || user?.profile?.profile_picture_url)
                    : `${STATIC_URL}${user?.profile_picture_url || user?.profile?.profile_picture_url}`
                }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.profile?.first_name?.[0]?.toUpperCase() ||
                  user?.first_name?.[0]?.toUpperCase() || '👤'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>
            {user?.profile?.first_name || user?.first_name} {user?.profile?.last_name || user?.last_name}
          </Text>

          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={[styles.badge, { backgroundColor: verificationBadge.color }]}>
            <Text style={styles.badgeText}>{verificationBadge.text}</Text>
          </View>

          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>
              {user?.role === USER_ROLES.WORKER ? '🔧 Trabajador' : '🏠 Cliente'}
            </Text>
          </View>
        </View>

        {/* Estadísticas (para trabajadores) */}
        {user?.role === USER_ROLES.WORKER && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Mis Estadísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {user?.profile?.totalJobsCompleted || 0}
                </Text>
                <Text style={styles.statLabel}>Trabajos</Text>
              </View>
              {/* Sección de Calificaciones */}
              {reviewStats && reviewStats.total_reviews > 0 && (
                <TouchableOpacity
                  style={styles.ratingsSection}
                  onPress={() => navigation.navigate('UserReviews', {
                    userId: user.id,
                    userName: `${user.profile?.first_name || user.first_name} ${user.profile?.last_name || user.last_name}`
                  })}
                >
                  <View style={styles.ratingSummary}>
                    <View style={styles.ratingMain}>
                      <Text style={styles.ratingNumber}>
                        {parseFloat(reviewStats.average_rating || 0).toFixed(1)}
                      </Text>
                      <StarRating
                        rating={parseFloat(reviewStats.average_rating || 0)}
                        size={16}
                      />
                    </View>
                    <Text style={styles.ratingCount}>
                      {reviewStats.total_reviews} {reviewStats.total_reviews === 1 ? 'calificación' : 'calificaciones'}
                    </Text>
                  </View>
                  <Text style={styles.viewReviewsText}>Ver todas →</Text>
                </TouchableOpacity>
              )}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {user?.profile?.totalRatings || 0}
                </Text>
                <Text style={styles.statLabel}>Reseñas</Text>
              </View>
            </View>
          </View>
        )}

        {/* Opciones del Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuText}>Editar Perfil</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🔐</Text>
            <Text style={styles.menuText}>Cambiar Contraseña</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notificaciones</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Más Opciones */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => navigation.navigate('StaticContent', {
              type: 'help',
              title: 'Ayuda y Soporte'
            })}
          >
            {/* ... */}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleHelp}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>Ayuda y Soporte</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTerms}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuText}>Términos y Condiciones</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePrivacy}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Política de Privacidad</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>Acerca de</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          // En el render, agrega este botón (solo en desarrollo):
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
            >
              <Text style={styles.testButtonText}>🔔 Probar Notificación</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Información de la versión */}
        <Text style={styles.versionText}>
          Talento Local v1.0.0
        </Text>
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

  profileHeader: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },

  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  roleContainer: {
    marginTop: SPACING.xs,
  },

  roleText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  statsSection: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },

  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },

  menuIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },

  menuText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },

  menuArrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray[400],
  },

  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
  },

  logoutIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },

  logoutText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.error,
  },

  versionText: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xl,
  },

  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    overflow: 'hidden',  // ✅ Importante
  },

  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  avatarText: {
    fontSize: FONT_SIZES['4xl'],
    color: COLORS.white,
    fontWeight: 'bold',
  },

  ratingsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  ratingSummary: {
    flex: 1,
  },

  ratingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  ratingNumber: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },

  ratingCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  viewReviewsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
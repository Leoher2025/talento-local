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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES } from '../../utils/constants';
import Toast from 'react-native-toast-message';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleEditProfile = () => {
    Toast.show({
      type: 'info',
      text1: 'Próximamente',
      text2: 'Esta función estará disponible pronto',
    });
  };

  const handleChangePassword = async () => {
    Toast.show({
      type: 'info',
      text1: 'Próximamente',
      text2: 'Esta función estará disponible pronto',
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
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.profile?.firstName?.[0]?.toUpperCase() || '👤'}
            </Text>
          </View>
          
          <Text style={styles.userName}>
            {user?.profile?.firstName} {user?.profile?.lastName}
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
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {user?.profile?.ratingAverage || '0.0'}
                </Text>
                <Text style={styles.statLabel}>Calificación</Text>
              </View>
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
          <Text style={styles.sectionTitle}>Más</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>Ayuda y Soporte</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuText}>Términos y Condiciones</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Política de Privacidad</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>Acerca de</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
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
  
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  avatarText: {
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.white,
    fontWeight: 'bold',
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
});
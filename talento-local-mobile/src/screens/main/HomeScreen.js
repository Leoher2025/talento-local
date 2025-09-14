// src/screens/main/HomeScreen.js - Pantalla principal de la app
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, USER_ROLES, JOB_CATEGORIES } from '../../utils/constants';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  // Renderizar vista según el rol del usuario
  const renderContent = () => {
    if (user?.role === USER_ROLES.WORKER) {
      return <WorkerHomeView />;
    } else {
      return <ClientHomeView />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header personalizado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hola, {user?.profile?.firstName || 'Usuario'} 👋
            </Text>
            <Text style={styles.subGreeting}>
              {user?.role === USER_ROLES.WORKER 
                ? '¿Listo para trabajar hoy?'
                : '¿Qué necesitas hoy?'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
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
const WorkerHomeView = () => {
  return (
    <View style={styles.content}>
      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Trabajos Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0.0</Text>
          <Text style={styles.statLabel}>Calificación</Text>
        </View>
      </View>

      {/* Sección de trabajos disponibles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trabajos Disponibles</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>
            No hay trabajos disponibles en tu área
          </Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ajustar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Vista para Clientes
const ClientHomeView = () => {
  return (
    <View style={styles.content}>
      {/* Búsqueda rápida */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>
          Buscar profesionales...
        </Text>
      </View>

      {/* Categorías */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías Populares</Text>
        <View style={styles.categoriesGrid}>
          {JOB_CATEGORIES.slice(0, 6).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
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

      {/* Botón de publicar trabajo */}
      <TouchableOpacity style={styles.floatingButton}>
        <Text style={styles.floatingButtonText}>+ Publicar Trabajo</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
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
  
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
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
});
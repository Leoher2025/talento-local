// src/screens/verification/VerificationStatusScreen.js
// Pantalla para ver el estado completo de verificación

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import verificationService from '../../services/verificationService';

export default function VerificationStatusScreen({ navigation }) {
  const { user, loadVerificationStatus } = useAuth();
  
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [])
  );

  const loadStatus = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const data = await verificationService.getStatus();
      setStatus(data);
      
      // Actualizar en el contexto también
      await loadVerificationStatus();
    } catch (error) {
      console.error('Error cargando estado:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getVerificationLevel = () => {
    if (!status) return 'none';
    
    const { email_verified, phone_verified, profile_picture_verified } = status;
    
    if (email_verified && phone_verified && profile_picture_verified) {
      return 'complete';
    } else if ((email_verified && phone_verified) || (email_verified && profile_picture_verified)) {
      return 'intermediate';
    } else if (email_verified) {
      return 'basic';
    }
    
    return 'none';
  };

  const getLevelInfo = (level) => {
    const levels = {
      none: {
        icon: '❌',
        title: 'Sin Verificar',
        color: COLORS.gray[400],
        description: 'Completa al menos una verificación'
      },
      basic: {
        icon: '✓',
        title: 'Verificado',
        color: COLORS.success,
        description: 'Email verificado'
      },
      intermediate: {
        icon: '✓✓',
        title: 'Verificado Plus',
        color: COLORS.info,
        description: 'Mayor credibilidad (+30% visibilidad)'
      },
      complete: {
        icon: '⭐',
        title: 'Profesional Verificado',
        color: COLORS.warning,
        description: 'Máxima confianza (+50% visibilidad)'
      }
    };
    
    return levels[level];
  };

  const VerificationItem = ({ title, description, verified, onPress, buttonText }) => (
    <View style={styles.verificationItem}>
      <View style={styles.verificationLeft}>
        <View style={[
          styles.verificationIcon,
          { backgroundColor: verified ? COLORS.success + '20' : COLORS.gray[200] }
        ]}>
          <Text style={styles.verificationIconText}>
            {verified ? '✓' : '○'}
          </Text>
        </View>
        
        <View style={styles.verificationInfo}>
          <Text style={styles.verificationTitle}>{title}</Text>
          <Text style={styles.verificationDescription}>{description}</Text>
        </View>
      </View>

      {!verified && onPress && (
        <TouchableOpacity 
          style={styles.verifyButton}
          onPress={onPress}
        >
          <Text style={styles.verifyButtonText}>{buttonText || 'Verificar'}</Text>
        </TouchableOpacity>
      )}

      {verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>Verificado ✓</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const level = getVerificationLevel();
  const levelInfo = getLevelInfo(level);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStatus(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificación</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Nivel actual */}
        <View style={[styles.levelCard, { borderColor: levelInfo.color }]}>
          <Text style={styles.levelIcon}>{levelInfo.icon}</Text>
          <Text style={[styles.levelTitle, { color: levelInfo.color }]}>
            {levelInfo.title}
          </Text>
          <Text style={styles.levelDescription}>{levelInfo.description}</Text>

          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(
                      (status?.email_verified ? 33 : 0) +
                      (status?.phone_verified ? 33 : 0) +
                      (status?.profile_picture_verified ? 34 : 0)
                    )}%`,
                    backgroundColor: levelInfo.color
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {status?.email_verified && status?.phone_verified && status?.profile_picture_verified
                ? '3/3 verificaciones completas'
                : `${
                    (status?.email_verified ? 1 : 0) +
                    (status?.phone_verified ? 1 : 0) +
                    (status?.profile_picture_verified ? 1 : 0)
                  }/3 verificaciones`
              }
            </Text>
          </View>
        </View>

        {/* Lista de verificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verificaciones</Text>

          <VerificationItem
            title="Email"
            description="Confirma tu dirección de correo"
            verified={status?.email_verified}
            onPress={() => {/* Ya implementado en auth */}}
            buttonText="Configurar"
          />

          <VerificationItem
            title="Teléfono"
            description="Verifica tu número con SMS"
            verified={status?.phone_verified}
            onPress={() => navigation.navigate('PhoneVerification')}
          />

          <VerificationItem
            title="Foto de Perfil"
            description="Sube una foto clara de tu rostro"
            verified={status?.profile_picture_verified}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        {/* Beneficios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beneficios de la Verificación</Text>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Mayor Confianza</Text>
              <Text style={styles.benefitText}>
                Los usuarios confían más en perfiles verificados
              </Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>📈</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Más Visibilidad</Text>
              <Text style={styles.benefitText}>
                Apareces primero en los resultados de búsqueda
              </Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>⭐</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Badge Profesional</Text>
              <Text style={styles.benefitText}>
                Destaca con insignias de verificación en tu perfil
              </Text>
            </View>
          </View>

          {user?.role === 'worker' && (
            <View style={styles.benefitCard}>
              <Text style={styles.benefitIcon}>💼</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Más Oportunidades</Text>
                <Text style={styles.benefitText}>
                  Los clientes prefieren contratar trabajadores verificados
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Info de seguridad */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityIcon}>🔐</Text>
          <Text style={styles.securityTitle}>Tu seguridad es nuestra prioridad</Text>
          <Text style={styles.securityText}>
            • Tus datos están protegidos y cifrados{'\n'}
            • No compartimos tu información con terceros{'\n'}
            • Puedes cancelar la verificación en cualquier momento
          </Text>
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
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  levelCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  levelIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  levelTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  levelDescription: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  verificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  verificationIconText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  verificationInfo: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  verificationDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  verifyButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  verifiedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  verifiedBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.success,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitIcon: {
    fontSize: FONT_SIZES['2xl'],
    marginRight: SPACING.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  benefitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  securityInfo: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  securityTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  securityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
});
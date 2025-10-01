// src/screens/reviews/CreateReviewScreen.js
// Pantalla para crear una nueva review

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';
import StarRating from '../../components/StarRating';
import reviewService from '../../services/reviewService';
import Toast from 'react-native-toast-message';

export default function CreateReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId, revieweeId, revieweeName, reviewType } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Estados del formulario
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [communicationRating, setCommunicationRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setIsCheckingPermission(true);
      const response = await reviewService.checkCanReview(jobId, revieweeId);
      
      if (response.success && response.data.canReview) {
        setCanReview(true);
      } else {
        Alert.alert(
          'No puedes dejar una review',
          'Solo puedes calificar trabajos completados y no puedes dejar más de una review por trabajo.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo verificar los permisos',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (rating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor selecciona una calificación general',
      });
      return;
    }

    if (comment.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El comentario debe tener al menos 10 caracteres',
      });
      return;
    }

    try {
      setIsLoading(true);

      const reviewData = {
        jobId,
        revieweeId,
        reviewType,
        rating,
        comment: comment.trim(),
        communicationRating: communicationRating || undefined,
        professionalismRating: professionalismRating || undefined,
        qualityRating: qualityRating || undefined,
        punctualityRating: punctualityRating || undefined,
        wouldRecommend,
      };

      const response = await reviewService.createReview(reviewData);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Review enviada',
          text2: 'Tu calificación ha sido publicada',
        });
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo enviar la review',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!canReview) {
    return null;
  }

  const isFormValid = rating > 0 && comment.trim().length >= 10;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calificar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información del reviewee */}
        <View style={styles.revieweeInfo}>
          <Text style={styles.revieweeLabel}>Calificando a:</Text>
          <Text style={styles.revieweeName}>{revieweeName}</Text>
        </View>

        {/* Calificación General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calificación General *</Text>
          <View style={styles.ratingContainer}>
            <StarRating
              rating={rating}
              size={40}
              editable
              onRatingChange={setRating}
              color={COLORS.warning}
            />
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
          )}
        </View>

        {/* Comentario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentario *</Text>
          <TextInput
            style={styles.textArea}
            value={comment}
            onChangeText={setComment}
            placeholder="Comparte tu experiencia... (mínimo 10 caracteres)"
            placeholderTextColor={COLORS.text.secondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>
            {comment.length}/2000 caracteres
          </Text>
        </View>

        {/* Calificaciones Detalladas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calificaciones Detalladas (Opcional)</Text>
          <Text style={styles.sectionSubtitle}>
            Ayuda a otros con calificaciones más específicas
          </Text>

          <DetailedRatingInput
            label="Comunicación"
            icon="💬"
            rating={communicationRating}
            onRatingChange={setCommunicationRating}
          />

          <DetailedRatingInput
            label="Profesionalismo"
            icon="👔"
            rating={professionalismRating}
            onRatingChange={setProfessionalismRating}
          />

          <DetailedRatingInput
            label="Calidad del trabajo"
            icon="✨"
            rating={qualityRating}
            onRatingChange={setQualityRating}
          />

          <DetailedRatingInput
            label="Puntualidad"
            icon="⏰"
            rating={punctualityRating}
            onRatingChange={setPunctualityRating}
          />
        </View>

        {/* Recomendación */}
        <View style={styles.section}>
          <View style={styles.recommendRow}>
            <View style={styles.recommendText}>
              <Text style={styles.recommendLabel}>
                ¿Recomendarías a {revieweeName}?
              </Text>
              <Text style={styles.recommendSubtext}>
                Esto ayudará a otros usuarios
              </Text>
            </View>
            <Switch
              value={wouldRecommend}
              onValueChange={setWouldRecommend}
              trackColor={{ false: COLORS.gray[300], true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Botón de enviar */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid || isLoading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Publicar Calificación</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Tu calificación será pública y visible para todos los usuarios
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente auxiliar para calificaciones detalladas
function DetailedRatingInput({ label, icon, rating, onRatingChange }) {
  return (
    <View style={styles.detailedRatingContainer}>
      <View style={styles.detailedRatingHeader}>
        <Text style={styles.detailedRatingIcon}>{icon}</Text>
        <Text style={styles.detailedRatingLabel}>{label}</Text>
      </View>
      <StarRating
        rating={rating}
        size={24}
        editable
        onRatingChange={onRatingChange}
        color={COLORS.warning}
      />
    </View>
  );
}

// Función auxiliar para obtener etiqueta de calificación
function getRatingLabel(rating) {
  switch (rating) {
    case 1:
      return 'Muy malo';
    case 2:
      return 'Malo';
    case 3:
      return 'Regular';
    case 4:
      return 'Bueno';
    case 5:
      return 'Excelente';
    default:
      return '';
  }
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
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  backButton: {
    padding: SPACING.xs,
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

  placeholder: {
    width: 30,
  },

  scrollContent: {
    padding: SPACING.lg,
  },

  revieweeInfo: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },

  revieweeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },

  revieweeName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },

  ratingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },

  ratingLabel: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  textArea: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  charCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },

  detailedRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },

  detailedRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  detailedRatingIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },

  detailedRatingLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
  },

  recommendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  recommendText: {
    flex: 1,
    marginRight: SPACING.md,
  },

  recommendLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 4,
  },

  recommendSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },

  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  submitButtonDisabled: {
    backgroundColor: COLORS.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },

  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },

  disclaimer: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});
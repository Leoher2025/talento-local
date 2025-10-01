// src/components/ReviewCard.js
// Componente para mostrar una review en formato de tarjeta

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, STATIC_URL } from '../utils/constants';
import StarRating from './StarRating';
import reviewService from '../services/reviewService';
import Toast from 'react-native-toast-message';

export default function ReviewCard({
  review,
  onVoteUpdate,
  currentUserId,
  showReviewee = true,
  showReviewer = true,
}) {
  const [userVote, setUserVote] = useState(review.userVote);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.not_helpful_count || 0);

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return date.toLocaleDateString();
  };

  // Manejar voto
  const handleVote = async (isHelpful) => {
    try {
      // Si ya votó lo mismo, no hacer nada
      if (userVote === isHelpful) return;

      await reviewService.voteHelpful(review.id, isHelpful);

      // Actualizar contadores
      if (userVote === null) {
        // Primera vez que vota
        if (isHelpful) {
          setHelpfulCount(prev => prev + 1);
        } else {
          setNotHelpfulCount(prev => prev + 1);
        }
      } else {
        // Cambiando de voto
        if (isHelpful) {
          setHelpfulCount(prev => prev + 1);
          setNotHelpfulCount(prev => prev - 1);
        } else {
          setHelpfulCount(prev => prev - 1);
          setNotHelpfulCount(prev => prev + 1);
        }
      }

      setUserVote(isHelpful);

      if (onVoteUpdate) {
        onVoteUpdate(review.id, isHelpful);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo registrar el voto',
      });
    }
  };

  // Reportar review
  const handleReport = () => {
    Alert.alert(
      'Reportar review',
      'Selecciona la razón del reporte',
      [
        {
          text: 'Spam',
          onPress: () => submitReport('spam'),
        },
        {
          text: 'Inapropiado',
          onPress: () => submitReport('inappropriate'),
        },
        {
          text: 'Información falsa',
          onPress: () => submitReport('false_information'),
        },
        {
          text: 'Acoso',
          onPress: () => submitReport('harassment'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const submitReport = async (reason) => {
    try {
      await reviewService.reportReview(review.id, reason);
      Toast.show({
        type: 'success',
        text1: 'Reporte enviado',
        text2: 'Revisaremos esta review pronto',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo enviar el reporte',
      });
    }
  };

  // Obtener foto de perfil
  const getProfilePicture = (user) => {
    if (user.reviewer_picture || user.reviewee_picture) {
      const pic = user.reviewer_picture || user.reviewee_picture;
      return pic.startsWith('http') ? pic : `${STATIC_URL}${pic}`;
    }
    return null;
  };

  // Decidir qué usuario mostrar
  const displayUser = showReviewer ? {
    name: review.reviewer_name,
    picture: review.reviewer_picture,
  } : {
    name: review.reviewee_name,
    picture: review.reviewee_picture,
  };

  const profilePic = displayUser.picture?.startsWith('http') 
    ? displayUser.picture 
    : displayUser.picture 
      ? `${STATIC_URL}${displayUser.picture}` 
      : null;

  return (
    <View style={styles.card}>
      {/* Header con usuario */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {displayUser.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{displayUser.name}</Text>
            <Text style={styles.date}>{formatDate(review.created_at)}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleReport} style={styles.reportButton}>
          <Text style={styles.reportIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Calificación */}
      <View style={styles.ratingSection}>
        <StarRating rating={review.rating} size={20} showNumber />
        {review.would_recommend && (
          <View style={styles.recommendBadge}>
            <Text style={styles.recommendText}>✓ Recomendado</Text>
          </View>
        )}
      </View>

      {/* Comentario */}
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}

      {/* Calificaciones detalladas */}
      {(review.communication_rating || review.professionalism_rating || 
        review.quality_rating || review.punctuality_rating) && (
        <View style={styles.detailedRatings}>
          {review.communication_rating && (
            <DetailedRating label="Comunicación" rating={review.communication_rating} />
          )}
          {review.professionalism_rating && (
            <DetailedRating label="Profesionalismo" rating={review.professionalism_rating} />
          )}
          {review.quality_rating && (
            <DetailedRating label="Calidad" rating={review.quality_rating} />
          )}
          {review.punctuality_rating && (
            <DetailedRating label="Puntualidad" rating={review.punctuality_rating} />
          )}
        </View>
      )}

      {/* Respuesta del reviewee */}
      {review.response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Respuesta:</Text>
          <Text style={styles.responseText}>{review.response}</Text>
        </View>
      )}

      {/* Votos útiles */}
      <View style={styles.footer}>
        <Text style={styles.helpfulLabel}>¿Te resultó útil?</Text>
        
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              userVote === true && styles.voteButtonActive
            ]}
            onPress={() => handleVote(true)}
          >
            <Text style={[
              styles.voteIcon,
              userVote === true && styles.voteIconActive
            ]}>👍</Text>
            <Text style={styles.voteCount}>{helpfulCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.voteButton,
              userVote === false && styles.voteButtonActive
            ]}
            onPress={() => handleVote(false)}
          >
            <Text style={[
              styles.voteIcon,
              userVote === false && styles.voteIconActive
            ]}>👎</Text>
            <Text style={styles.voteCount}>{notHelpfulCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {review.is_edited && (
        <Text style={styles.editedLabel}>Editado</Text>
      )}
    </View>
  );
}

// Componente auxiliar para calificaciones detalladas
function DetailedRating({ label, rating }) {
  return (
    <View style={styles.detailedRatingItem}>
      <Text style={styles.detailedRatingLabel}>{label}</Text>
      <View style={styles.detailedRatingBar}>
        <View 
          style={[
            styles.detailedRatingFill,
            { width: `${(rating / 5) * 100}%` }
          ]}
        />
      </View>
      <Text style={styles.detailedRatingValue}>{rating}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },

  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  reportButton: {
    padding: SPACING.xs,
  },

  reportIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.secondary,
  },

  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },

  recommendBadge: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.success + '20',
    borderRadius: RADIUS.sm,
  },

  recommendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '600',
  },

  comment: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },

  detailedRatings: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  detailedRatingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  detailedRatingLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    width: 100,
  },

  detailedRatingBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.xs,
    overflow: 'hidden',
  },

  detailedRatingFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
  },

  detailedRatingValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    width: 20,
    textAlign: 'right',
  },

  responseContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },

  responseLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },

  responseText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    lineHeight: 18,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },

  helpfulLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },

  voteButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },

  voteButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },

  voteIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: 4,
  },

  voteIconActive: {
    opacity: 1,
  },

  voteCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },

  editedLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
});
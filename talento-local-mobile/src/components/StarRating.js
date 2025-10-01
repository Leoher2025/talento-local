// src/components/StarRating.js
// Componente para mostrar y seleccionar calificación con estrellas

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../utils/constants';

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 24,
  editable = false,
  onRatingChange,
  showNumber = false,
  color = COLORS.warning,
}) {
  const handlePress = (selectedRating) => {
    if (editable && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxStars; i++) {
      const filled = i <= rating;
      const StarComponent = editable ? TouchableOpacity : View;

      stars.push(
        <StarComponent
          key={i}
          onPress={() => handlePress(i)}
          disabled={!editable}
          style={styles.starButton}
        >
          <Text style={[styles.star, { fontSize: size, color: filled ? color : COLORS.gray[300] }]}>
            {filled ? '★' : '☆'}
          </Text>
        </StarComponent>
      );
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      {showNumber && (
        <Text style={styles.ratingText}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  starsContainer: {
    flexDirection: 'row',
  },

  starButton: {
    padding: 2,
  },

  star: {
    textAlign: 'center',
  },

  ratingText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
});
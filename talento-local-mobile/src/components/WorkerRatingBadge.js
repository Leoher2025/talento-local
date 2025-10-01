// src/components/WorkerRatingBadge.js
// Badge pequeño para mostrar rating de trabajador

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../utils/constants';

export default function WorkerRatingBadge({ rating, totalRatings, size = 'medium' }) {
  if (!rating || rating === 0) return null;

  const isSmall = size === 'small';
  const avgRating = parseFloat(rating).toFixed(1);

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <Text style={[styles.star, isSmall && styles.starSmall]}>⭐</Text>
      <Text style={[styles.rating, isSmall && styles.ratingSmall]}>
        {avgRating}
      </Text>
      {totalRatings > 0 && (
        <Text style={[styles.count, isSmall && styles.countSmall]}>
          ({totalRatings})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  containerSmall: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },

  star: {
    fontSize: FONT_SIZES.sm,
    marginRight: 2,
  },

  starSmall: {
    fontSize: FONT_SIZES.xs,
  },

  rating: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  ratingSmall: {
    fontSize: FONT_SIZES.xs,
  },

  count: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginLeft: 2,
  },

  countSmall: {
    fontSize: 10,
  },
});
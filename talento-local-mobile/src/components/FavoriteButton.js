// src/components/FavoriteButton.js
// Botón para agregar/quitar de favoritos

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONT_SIZES } from '../utils/constants';
import favoriteService from '../services/favoriteService';
import Toast from 'react-native-toast-message';

export default function FavoriteButton({ 
  favoriteType, 
  favoriteId, 
  initialIsFavorite = false,
  size = 'medium', // 'small', 'medium', 'large'
  style,
  onToggle
}) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFavoriteStatus();
  }, [favoriteId]);

  const loadFavoriteStatus = async () => {
    try {
      const status = await favoriteService.isFavorite(favoriteType, favoriteId);
      setIsFavorite(status);
    } catch (error) {
      console.error('Error cargando estado de favorito:', error);
    }
  };

  const handleToggle = async () => {
    try {
      setIsLoading(true);

      const response = await favoriteService.toggleFavorite(favoriteType, favoriteId);
      const newStatus = response.data.is_favorite;

      setIsFavorite(newStatus);

      Toast.show({
        type: 'success',
        text1: newStatus ? '❤️ Agregado a favoritos' : '💔 Eliminado de favoritos',
        text2: newStatus 
          ? 'Lo encontrarás en tu lista de favoritos'
          : 'Ya no está en tus favoritos',
        position: 'bottom'
      });

      if (onToggle) {
        onToggle(newStatus);
      }
    } catch (error) {
      console.error('Error haciendo toggle:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sizeStyles = {
    small: styles.buttonSmall,
    medium: styles.buttonMedium,
    large: styles.buttonLarge,
  };

  const iconSizes = {
    small: FONT_SIZES.lg,
    medium: FONT_SIZES.xl,
    large: FONT_SIZES['2xl'],
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles[size],
        isFavorite && styles.buttonActive,
        style
      ]}
      onPress={handleToggle}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isFavorite ? COLORS.white : COLORS.error} />
      ) : (
        <Text style={[styles.icon, { fontSize: iconSizes[size] }]}>
          {isFavorite ? '❤️' : '🤍'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonSmall: {
    width: 36,
    height: 36,
  },
  buttonMedium: {
    width: 44,
    height: 44,
  },
  buttonLarge: {
    width: 52,
    height: 52,
  },
  buttonActive: {
    backgroundColor: COLORS.error + '20',
  },
  icon: {
    lineHeight: FONT_SIZES['2xl'] + 4,
  },
});
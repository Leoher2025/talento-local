// src/components/VerificationBadge.js
// Componente reutilizable para mostrar badge de verificación

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';

export default function VerificationBadge({ 
  emailVerified, 
  phoneVerified, 
  profilePictureVerified,
  size = 'medium', // 'small', 'medium', 'large'
  showText = true 
}) {
  // Determinar nivel de verificación
  const getLevel = () => {
    if (emailVerified && phoneVerified && profilePictureVerified) {
      return 'complete';
    } else if ((emailVerified && phoneVerified) || (emailVerified && profilePictureVerified)) {
      return 'intermediate';
    } else if (emailVerified) {
      return 'basic';
    }
    return 'none';
  };

  const level = getLevel();

  const config = {
    none: {
      show: false,
    },
    basic: {
      icon: '✓',
      text: 'Verificado',
      color: COLORS.success,
      bgColor: COLORS.success + '20',
    },
    intermediate: {
      icon: '✓✓',
      text: 'Verificado Plus',
      color: COLORS.info,
      bgColor: COLORS.info + '20',
    },
    complete: {
      icon: '⭐',
      text: 'Profesional',
      color: COLORS.warning,
      bgColor: COLORS.warning + '20',
    }
  };

  if (level === 'none' || !config[level].show === false) {
    return null;
  }

  const sizeConfig = {
    small: {
      container: styles.containerSmall,
      icon: styles.iconSmall,
      text: styles.textSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: styles.iconMedium,
      text: styles.textMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: styles.iconLarge,
      text: styles.textLarge,
    }
  };

  const levelConfig = config[level];
  const sizes = sizeConfig[size];

  return (
    <View 
      style={[
        styles.container,
        sizes.container,
        { backgroundColor: levelConfig.bgColor, borderColor: levelConfig.color }
      ]}
    >
      <Text style={[sizes.icon]}>{levelConfig.icon}</Text>
      {showText && (
        <Text style={[sizes.text, { color: levelConfig.color }]}>
          {levelConfig.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  
  // Small
  containerSmall: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  iconSmall: {
    fontSize: FONT_SIZES.xs,
    marginRight: 2,
  },
  textSmall: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  // Medium
  containerMedium: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  iconMedium: {
    fontSize: FONT_SIZES.sm,
    marginRight: 4,
  },
  textMedium: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // Large
  containerLarge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  iconLarge: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },
  textLarge: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});
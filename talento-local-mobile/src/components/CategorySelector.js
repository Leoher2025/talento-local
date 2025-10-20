// src/components/CategorySelector.js
// Componente para seleccionar categorías/habilidades del trabajador

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import jobService from '../services/jobService';

export default function CategorySelector({ 
  selectedCategories = [], 
  onCategoriesChange,
  visible,
  onClose 
}) {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(selectedCategories);
  const [experienceYears, setExperienceYears] = useState({});
  const [primaryCategory, setPrimaryCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Inicializar con las categorías seleccionadas
    if (selectedCategories.length > 0) {
      setSelected(selectedCategories.map(c => c.categoryId || c.category_id));
      
      const years = {};
      selectedCategories.forEach(c => {
        const id = c.categoryId || c.category_id;
        years[id] = (c.experienceYears || c.experience_years || 0).toString();
      });
      setExperienceYears(years);

      const primary = selectedCategories.find(c => c.isPrimary || c.is_primary);
      if (primary) {
        setPrimaryCategory(primary.categoryId || primary.category_id);
      }
    }
  }, [selectedCategories]);

  const loadCategories = async () => {
    try {
      const data = await jobService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const toggleCategory = (categoryId) => {
    if (selected.includes(categoryId)) {
      // Remover
      setSelected(selected.filter(id => id !== categoryId));
      const newYears = { ...experienceYears };
      delete newYears[categoryId];
      setExperienceYears(newYears);
      
      // Si era la principal, quitar
      if (primaryCategory === categoryId) {
        setPrimaryCategory(null);
      }
    } else {
      // Agregar
      setSelected([...selected, categoryId]);
      setExperienceYears({
        ...experienceYears,
        [categoryId]: '0'
      });
    }
  };

  const handleExperienceChange = (categoryId, value) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    setExperienceYears({
      ...experienceYears,
      [categoryId]: numericValue
    });
  };

  const handleSetPrimary = (categoryId) => {
    setPrimaryCategory(primaryCategory === categoryId ? null : categoryId);
  };

  const handleSave = () => {
    const result = selected.map(categoryId => ({
      categoryId,
      experienceYears: parseInt(experienceYears[categoryId] || 0),
      isPrimary: categoryId === primaryCategory
    }));

    onCategoriesChange(result);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Selecciona tus Habilidades</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Selecciona las categorías en las que tienes experiencia
          </Text>

          <ScrollView style={styles.scrollView}>
            {categories.map(category => {
              const isSelected = selected.includes(category.id);
              const isPrimary = primaryCategory === category.id;

              return (
                <View key={category.id} style={styles.categoryItem}>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      isSelected && styles.categoryButtonSelected
                    ]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryName,
                      isSelected && styles.categoryNameSelected
                    ]}>
                      {category.name}
                    </Text>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.categoryDetails}>
                      <View style={styles.experienceContainer}>
                        <Text style={styles.experienceLabel}>Años de experiencia:</Text>
                        <TextInput
                          style={styles.experienceInput}
                          keyboardType="numeric"
                          value={experienceYears[category.id] || '0'}
                          onChangeText={(value) => handleExperienceChange(category.id, value)}
                          maxLength={2}
                        />
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          isPrimary && styles.primaryButtonActive
                        ]}
                        onPress={() => handleSetPrimary(category.id)}
                      >
                        <Text style={[
                          styles.primaryButtonText,
                          isPrimary && styles.primaryButtonTextActive
                        ]}>
                          {isPrimary ? '⭐ Principal' : 'Marcar como principal'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              {selected.length} {selected.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
            </Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                selected.length === 0 && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={selected.length === 0}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  closeButton: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.secondary,
  },

  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },

  scrollView: {
    padding: SPACING.lg,
  },

  categoryItem: {
    marginBottom: SPACING.md,
  },

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },

  categoryButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },

  categoryIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },

  categoryName: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },

  categoryNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  checkmark: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  categoryDetails: {
    marginTop: SPACING.sm,
    marginLeft: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.md,
  },

  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  experienceLabel: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  experienceInput: {
    width: 60,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.sm,
    textAlign: 'center',
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },

  primaryButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },

  primaryButtonActive: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '20',
  },

  primaryButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  primaryButtonTextActive: {
    color: COLORS.warning,
    fontWeight: '600',
  },

  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },

  selectedCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },

  saveButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },

  saveButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },
});
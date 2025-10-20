// src/components/WorkerFilters.js
// Componente modal de filtros para búsqueda de trabajadores

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import jobService from '../services/jobService';

export default function WorkerFilters({ visible, onClose, onApply, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    city: '',
    department: '',
    minRating: '',
    sortBy: 'rating_average',
    sortOrder: 'DESC',
    ...initialFilters
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const cats = await jobService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleApply = () => {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onApply(cleanFilters);
  };

  const handleReset = () => {
    setFilters({
      city: '',
      department: '',
      minRating: '',
      sortBy: 'rating_average',
      sortOrder: 'DESC'
    });
  };

  const ratings = [
    { value: 5, label: '5 Estrellas', icon: '⭐⭐⭐⭐⭐' },
    { value: 4, label: '4+ Estrellas', icon: '⭐⭐⭐⭐' },
    { value: 3, label: '3+ Estrellas', icon: '⭐⭐⭐' }
  ];

  const sortOptions = [
    { value: 'rating_average', label: 'Mejor Calificados' },
    { value: 'completed_jobs', label: 'Más Trabajos' },
    { value: 'created_at', label: 'Más Recientes' }
  ];

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
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Ubicación */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Ubicación</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Departamento"
                  value={filters.department}
                  onChangeText={(text) => setFilters({ ...filters, department: text })}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Ciudad"
                  value={filters.city}
                  onChangeText={(text) => setFilters({ ...filters, city: text })}
                />
              </View>
            </View>

            {/* Calificación mínima */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Calificación Mínima</Text>
              <View style={styles.chipContainer}>
                {ratings.map(rating => (
                  <TouchableOpacity
                    key={rating.value}
                    style={[styles.chip, filters.minRating === rating.value && styles.chipActive]}
                    onPress={() => setFilters({ 
                      ...filters, 
                      minRating: filters.minRating === rating.value ? '' : rating.value 
                    })}
                  >
                    <Text style={[styles.chipText, filters.minRating === rating.value && styles.chipTextActive]}>
                      {rating.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ordenar por */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Ordenar por</Text>
              <View style={styles.chipContainer}>
                {sortOptions.map(sort => (
                  <TouchableOpacity
                    key={sort.value}
                    style={[styles.chip, filters.sortBy === sort.value && styles.chipActive]}
                    onPress={() => setFilters({ ...filters, sortBy: sort.value })}
                  >
                    <Text style={[styles.chipText, filters.sortBy === sort.value && styles.chipTextActive]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
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
    maxHeight: '80%',
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
  scrollView: {
    padding: SPACING.lg,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },
  inputHalf: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  resetButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    fontWeight: '600',
  },
});
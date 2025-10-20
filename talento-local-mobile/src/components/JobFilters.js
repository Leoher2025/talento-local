// src/components/JobFilters.js
// Componente modal de filtros avanzados

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

export default function JobFilters({ visible, onClose, onApply, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    categoryId: '',
    city: '',
    department: '',
    budgetMin: '',
    budgetMax: '',
    budgetType: '',
    urgency: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    ...initialFilters
  });

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (visible) {
      loadFilterData();
    }
  }, [visible]);

  const loadFilterData = async () => {
    try {
      const [cats, locs] = await Promise.all([
        jobService.getCategories(),
        jobService.getLocations()
      ]);
      setCategories(cats);
      setLocations(locs);
    } catch (error) {
      console.error('Error cargando datos de filtros:', error);
    }
  };

  const handleApply = () => {
    // Limpiar valores vacíos
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
      categoryId: '',
      city: '',
      department: '',
      budgetMin: '',
      budgetMax: '',
      budgetType: '',
      urgency: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  };

  const budgetTypes = [
    { value: 'fixed', label: 'Precio Fijo' },
    { value: 'hourly', label: 'Por Hora' },
    { value: 'negotiable', label: 'Negociable' }
  ];

  const urgencies = [
    { value: 'low', label: 'Baja', icon: '😌' },
    { value: 'medium', label: 'Media', icon: '⏱️' },
    { value: 'high', label: 'Alta', icon: '⚡' },
    { value: 'urgent', label: 'Urgente', icon: '🔥' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Más Recientes' },
    { value: 'budget_amount', label: 'Presupuesto' },
    { value: 'urgency', label: 'Urgencia' }
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Categoría */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipContainer}>
                  <TouchableOpacity
                    style={[styles.chip, !filters.categoryId && styles.chipActive]}
                    onPress={() => setFilters({ ...filters, categoryId: '' })}
                  >
                    <Text style={[styles.chipText, !filters.categoryId && styles.chipTextActive]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, filters.categoryId === cat.id && styles.chipActive]}
                      onPress={() => setFilters({ ...filters, categoryId: cat.id })}
                    >
                      <Text style={styles.chipIcon}>{cat.icon}</Text>
                      <Text style={[styles.chipText, filters.categoryId === cat.id && styles.chipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

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

            {/* Presupuesto */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Presupuesto</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Mínimo"
                  keyboardType="numeric"
                  value={filters.budgetMin}
                  onChangeText={(text) => setFilters({ ...filters, budgetMin: text })}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Máximo"
                  keyboardType="numeric"
                  value={filters.budgetMax}
                  onChangeText={(text) => setFilters({ ...filters, budgetMax: text })}
                />
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipContainer}>
                  {budgetTypes.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.chip, filters.budgetType === type.value && styles.chipActive]}
                      onPress={() => setFilters({ 
                        ...filters, 
                        budgetType: filters.budgetType === type.value ? '' : type.value 
                      })}
                    >
                      <Text style={[styles.chipText, filters.budgetType === type.value && styles.chipTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Urgencia */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Urgencia</Text>
              <View style={styles.chipContainer}>
                {urgencies.map(urg => (
                  <TouchableOpacity
                    key={urg.value}
                    style={[styles.chip, filters.urgency === urg.value && styles.chipActive]}
                    onPress={() => setFilters({ 
                      ...filters, 
                      urgency: filters.urgency === urg.value ? '' : urg.value 
                    })}
                  >
                    <Text style={styles.chipIcon}>{urg.icon}</Text>
                    <Text style={[styles.chipText, filters.urgency === urg.value && styles.chipTextActive]}>
                      {urg.label}
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
              
              {/* Orden ASC/DESC */}
              <View style={styles.orderContainer}>
                <TouchableOpacity
                  style={[styles.orderButton, filters.sortOrder === 'DESC' && styles.orderButtonActive]}
                  onPress={() => setFilters({ ...filters, sortOrder: 'DESC' })}
                >
                  <Text style={[styles.orderButtonText, filters.sortOrder === 'DESC' && styles.orderButtonTextActive]}>
                    Mayor a menor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderButton, filters.sortOrder === 'ASC' && styles.orderButtonActive]}
                  onPress={() => setFilters({ ...filters, sortOrder: 'ASC' })}
                >
                  <Text style={[styles.orderButtonText, filters.sortOrder === 'ASC' && styles.orderButtonTextActive]}>
                    Menor a mayor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
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
    marginBottom: SPACING.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
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

  chipIcon: {
    fontSize: FONT_SIZES.base,
    marginRight: SPACING.xs,
  },

  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  chipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  orderContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },

  orderButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },

  orderButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },

  orderButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },

  orderButtonTextActive: {
    color: COLORS.primary,
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
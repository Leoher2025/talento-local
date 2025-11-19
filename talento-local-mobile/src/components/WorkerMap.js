// src/components/WorkerMap.js
// Componente de mapa interactivo para mostrar trabajadores

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';

export default function WorkerMap({ 
  workers = [], 
  userLocation = null,
  radius = 10,
  onMarkerPress,
  onMapPress,
  style 
}) {
  const mapRef = useRef(null);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Centrar mapa cuando cambia la ubicación
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    }
  }, [userLocation]);

  // Ajustar mapa para mostrar todos los marcadores
  const fitToMarkers = () => {
    if (mapRef.current && workers.length > 0) {
      const coordinates = workers
        .filter(w => w.latitude && w.longitude)
        .map(w => ({
          latitude: w.latitude,
          longitude: w.longitude,
        }));

      if (userLocation) {
        coordinates.push({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
      }

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  };

  useEffect(() => {
    // Pequeño delay para que el mapa se renderice
    const timer = setTimeout(() => {
      fitToMarkers();
    }, 500);

    return () => clearTimeout(timer);
  }, [workers]);

  const handleMarkerPress = (worker) => {
    setSelectedWorker(worker);
    if (onMarkerPress) {
      onMarkerPress(worker);
    }
  };

  if (!userLocation) {
    return (
      <View style={[styles.container, style, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton
        onPress={onMapPress}
      >
        {/* Círculo de radio de búsqueda */}
        {userLocation && (
          <Circle
            center={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            radius={radius * 1000} // convertir km a metros
            strokeColor={COLORS.primary + '80'}
            fillColor={COLORS.primary + '20'}
            strokeWidth={2}
          />
        )}

        {/* Marcadores de trabajadores */}
        {workers.map((worker, index) => {
          if (!worker.latitude || !worker.longitude) return null;

          return (
            <Marker
              key={worker.user_id || index}
              coordinate={{
                latitude: worker.latitude,
                longitude: worker.longitude,
              }}
              onPress={() => handleMarkerPress(worker)}
              pinColor={selectedWorker?.user_id === worker.user_id ? COLORS.primary : COLORS.secondary}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.marker,
                  selectedWorker?.user_id === worker.user_id && styles.markerSelected
                ]}>
                  <Text style={styles.markerText}>
                    {worker.first_name?.[0]}{worker.last_name?.[0]}
                  </Text>
                </View>
                {worker.distance_km && (
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>
                      {worker.distance_km < 1 
                        ? `${Math.round(worker.distance_km * 1000)}m`
                        : `${worker.distance_km.toFixed(1)}km`
                      }
                    </Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Botón para ajustar vista */}
      <TouchableOpacity
        style={styles.fitButton}
        onPress={fitToMarkers}
      >
        <Text style={styles.fitButtonText}>🎯</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  markerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  distanceBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  distanceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  fitButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fitButtonText: {
    fontSize: FONT_SIZES.xl,
  },
});
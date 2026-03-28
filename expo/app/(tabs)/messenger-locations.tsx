import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { MapPin, Navigation, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMessengers } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATIONS_STORAGE_KEY = '@messenger_locations';

interface MessengerLocation {
  messengerId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export default function MessengerLocationsScreen() {
  const messengers = useMessengers();
  const [locations, setLocations] = useState<Record<string, MessengerLocation>>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATIONS_STORAGE_KEY);
      if (stored) {
        setLocations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLocations();
    setTimeout(() => setRefreshing(false), 500);
  };

  const openInMaps = (latitude: number, longitude: number, name: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${name}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${name})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Alert.alert(
        'Abrir en Mapas',
        `¿Deseas abrir la ubicación de ${name} en la aplicación de mapas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Abrir', 
            onPress: () => {
              Linking.openURL(url);
            }
          },
        ]
      );
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} d`;
  };

  const activeMessengers = messengers.filter(m => m.isAvailable);
  const messengersWithLocation = activeMessengers.filter(m => locations[m.id]);
  const messengersWithoutLocation = activeMessengers.filter(m => !locations[m.id]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Ubicación de Mensajeros',
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MapPin color={Colors.light.primary} size={24} />
              <Text style={styles.statNumber}>{messengersWithLocation.length}</Text>
              <Text style={styles.statLabel}>Con Ubicación</Text>
            </View>
            <View style={styles.statCard}>
              <Navigation color={Colors.light.warning} size={24} />
              <Text style={styles.statNumber}>{activeMessengers.length}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw 
              color={Colors.light.primary} 
              size={20} 
              style={refreshing ? styles.spinning : undefined}
            />
            <Text style={styles.refreshText}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messengersWithLocation.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mensajeros con Ubicación</Text>
              {messengersWithLocation.map((messenger) => {
                const location = locations[messenger.id];
                return (
                  <TouchableOpacity
                    key={messenger.id}
                    style={styles.messengerCard}
                    onPress={() => openInMaps(location.latitude, location.longitude, messenger.name)}
                  >
                    <View style={styles.messengerHeader}>
                      <View style={styles.messengerInfo}>
                        <View style={styles.statusIndicator} />
                        <View>
                          <Text style={styles.messengerName}>{messenger.name}</Text>
                          <Text style={styles.messengerPhone}>{messenger.phone}</Text>
                        </View>
                      </View>
                      <MapPin color={Colors.light.primary} size={24} />
                    </View>
                    
                    <View style={styles.locationInfo}>
                      <View style={styles.coordinates}>
                        <Text style={styles.coordinateLabel}>Lat:</Text>
                        <Text style={styles.coordinateValue}>
                          {location.latitude.toFixed(6)}
                        </Text>
                      </View>
                      <View style={styles.coordinates}>
                        <Text style={styles.coordinateLabel}>Lng:</Text>
                        <Text style={styles.coordinateValue}>
                          {location.longitude.toFixed(6)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.footer}>
                      <Text style={styles.timestamp}>
                        Actualizado: {getTimeAgo(location.updatedAt)}
                      </Text>
                      <View style={styles.viewMapButton}>
                        <Navigation color={Colors.light.primary} size={16} />
                        <Text style={styles.viewMapText}>Ver en Mapa</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {messengersWithoutLocation.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sin Ubicación Registrada</Text>
              {messengersWithoutLocation.map((messenger) => (
                <View key={messenger.id} style={styles.messengerCardInactive}>
                  <View style={styles.messengerHeader}>
                    <View style={styles.messengerInfo}>
                      <View style={[styles.statusIndicator, styles.statusInactive]} />
                      <View>
                        <Text style={styles.messengerName}>{messenger.name}</Text>
                        <Text style={styles.messengerPhone}>{messenger.phone}</Text>
                      </View>
                    </View>
                    <MapPin color={Colors.light.muted} size={24} />
                  </View>
                  <Text style={styles.noLocationText}>
                    No hay ubicación disponible
                  </Text>
                </View>
              ))}
            </View>
          )}

          {activeMessengers.length === 0 && (
            <View style={styles.emptyState}>
              <MapPin color={Colors.light.muted} size={64} />
              <Text style={styles.emptyTitle}>No hay mensajeros activos</Text>
              <Text style={styles.emptyText}>
                Activa mensajeros desde la sección de Gestión de Mensajeros
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  refreshButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  messengerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  messengerCardInactive: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    opacity: 0.6,
  },
  messengerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  messengerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.success,
  },
  statusInactive: {
    backgroundColor: Colors.light.muted,
  },
  messengerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  messengerPhone: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 2,
  },
  locationInfo: {
    flexDirection: 'row' as const,
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
  },
  coordinates: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  viewMapButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  viewMapText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  noLocationText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
});

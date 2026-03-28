import { useFilteredPickups, usePickups } from '@/contexts/PickupContext';
import { useAuth, useMessengers } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { PICKUP_STATUS_LABELS, ZONE_LABELS, type PickupStatus, type Zone, type Pickup } from '@/types/delivery';
import { useState, useMemo } from 'react';
import { Search, Filter, Package, CheckCircle, Calendar, Clock, MapPin, User, Phone, MessageCircle } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';

export default function PickupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const messengers = useMessengers();
  const isMessenger = user?.role === 'messenger';
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PickupStatus | undefined>(undefined);
  const [zoneFilter, setZoneFilter] = useState<Zone | undefined>(undefined);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showMessengersList, setShowMessengersList] = useState<boolean>(false);

  const { updateStatus } = usePickups();
  const allPickups = useFilteredPickups(statusFilter, zoneFilter, search);
  
  const pickups = useMemo(() => {
    if (isMessenger && user) {
      return allPickups.filter(p => p.messengerId === user.id);
    }
    return allPickups;
  }, [allPickups, isMessenger, user]);

  const handleMarkAsCollected = async (pickup: Pickup) => {
    if (pickup.status === 'collected') {
      Alert.alert('Información', 'Esta recolección ya está marcada como completada.');
      return;
    }

    Alert.alert(
      'Confirmar Recolección',
      `¿Marcar la recolección #${pickup.id.slice(-6)} como completada?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await updateStatus(pickup.id, 'collected');
              Alert.alert('Éxito', 'La recolección ha sido marcada como completada.');
            } catch (error) {
              console.error('Error updating pickup status:', error);
              Alert.alert('Error', 'No se pudo actualizar el estado de la recolección.');
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'No se puede realizar la llamada en este dispositivo.');
        }
      })
      .catch((error) => {
        console.error('Error al intentar llamar:', error);
        Alert.alert('Error', 'No se pudo realizar la llamada.');
      });
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Error', 'WhatsApp no está instalado en este dispositivo.');
        }
      })
      .catch((error) => {
        console.error('Error al abrir WhatsApp:', error);
        Alert.alert('Error', 'No se pudo abrir WhatsApp.');
      });
  };

  return (
    <View style={styles.container}>
      {!isMessenger && (
        <View style={styles.newButtonContainer}>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => router.push('/new-pickup')}
          >
            <Package color="#FFFFFF" size={20} />
            <Text style={styles.newButtonText}>Nueva Recolección</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messengersListButton}
            onPress={() => setShowMessengersList(!showMessengersList)}
          >
            <User color={Colors.light.primary} size={20} />
            <Text style={styles.messengersListButtonText}>Mensajeros</Text>
          </TouchableOpacity>
        </View>
      )}

      {showMessengersList && !isMessenger && (
        <View style={styles.messengersListContainer}>
          <Text style={styles.messengersListTitle}>Lista de Mensajeros</Text>
          {messengers.length === 0 ? (
            <View style={styles.emptyMessengers}>
              <User color={Colors.light.muted} size={48} />
              <Text style={styles.emptyMessengersText}>No hay mensajeros registrados</Text>
              <Text style={styles.emptyMessengersSubtext}>Agrega mensajeros desde la sección de Gestión</Text>
            </View>
          ) : (
            <ScrollView style={styles.messengersList}>
              {messengers.map((messenger) => (
                <View key={messenger.id} style={styles.messengerCard}>
                  <View style={styles.messengerInfo}>
                    <View style={styles.messengerAvatar}>
                      <User color={Colors.light.primary} size={24} />
                    </View>
                    <View style={styles.messengerDetails}>
                      <Text style={styles.messengerName}>{messenger.name}</Text>
                      <Text style={styles.messengerPhone}>{messenger.phone}</Text>
                    </View>
                  </View>
                  <View style={styles.messengerActions}>
                    <TouchableOpacity
                      style={styles.messengerWhatsappButton}
                      onPress={() => handleWhatsApp(messenger.phone)}
                    >
                      <MessageCircle color="#FFFFFF" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.messengerCallButton}
                      onPress={() => handleCall(messenger.phone)}
                    >
                      <Phone color="#FFFFFF" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={Colors.light.muted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o mensajero..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.light.muted}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter color={showFilters ? Colors.light.primary : Colors.light.muted} size={20} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              <TouchableOpacity
                style={[styles.chip, !statusFilter && styles.chipActive]}
                onPress={() => setStatusFilter(undefined)}
              >
                <Text style={[styles.chipText, !statusFilter && styles.chipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {(['scheduled', 'collected', 'cancelled'] as PickupStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.chip, statusFilter === status && styles.chipActive]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[styles.chipText, statusFilter === status && styles.chipTextActive]}>
                    {PICKUP_STATUS_LABELS[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Zona:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              <TouchableOpacity
                style={[styles.chip, !zoneFilter && styles.chipActive]}
                onPress={() => setZoneFilter(undefined)}
              >
                <Text style={[styles.chipText, !zoneFilter && styles.chipTextActive]}>Todas</Text>
              </TouchableOpacity>
              {(['zona_1', 'zona_2', 'zona_3', 'zona_4', 'zona_5'] as Zone[]).map((zone) => (
                <TouchableOpacity
                  key={zone}
                  style={[styles.chip, zoneFilter === zone && styles.chipActive]}
                  onPress={() => setZoneFilter(zone)}
                >
                  <Text style={[styles.chipText, zoneFilter === zone && styles.chipTextActive]}>
                    {ZONE_LABELS[zone]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {pickups.length === 0 ? (
          <View style={styles.emptyState}>
            <Package color={Colors.light.muted} size={64} />
            <Text style={styles.emptyText}>No se encontraron recolecciones</Text>
            <Text style={styles.emptySubtext}>
              {search || statusFilter || zoneFilter
                ? 'Intenta ajustar los filtros'
                : 'Agenda tu primera recolección para comenzar'}
            </Text>
          </View>
        ) : (
          pickups.map((pickup) => (
            <View key={pickup.id} style={styles.pickupCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.pickupId}>#{pickup.id.slice(-6)}</Text>
                  <View style={[
                    styles.statusBadge,
                    pickup.status === 'collected' && styles.statusCollected,
                    pickup.status === 'scheduled' && styles.statusScheduled,
                    pickup.status === 'cancelled' && styles.statusCancelled,
                  ]}>
                    <Text style={styles.statusText}>{PICKUP_STATUS_LABELS[pickup.status]}</Text>
                  </View>
                </View>
                <Text style={styles.zoneBadge}>{ZONE_LABELS[pickup.zone]}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.senderSection}>
                  <View style={styles.senderHeader}>
                    <View style={styles.senderInfo}>
                      <View style={styles.iconRow}>
                        <User color={Colors.light.primary} size={16} />
                        <Text style={styles.senderName}>{pickup.sender.name}</Text>
                      </View>
                      <View style={styles.iconRow}>
                        <Phone color={Colors.light.muted} size={14} />
                        <Text style={styles.senderDetail}>{pickup.sender.phone}</Text>
                      </View>
                      <View style={styles.iconRow}>
                        <MapPin color={Colors.light.muted} size={14} />
                        <Text style={styles.senderDetail}>{pickup.sender.address}</Text>
                      </View>
                    </View>
                    <View style={styles.contactButtons}>
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => handleWhatsApp(pickup.sender.phone)}
                      >
                        <MessageCircle color="#FFFFFF" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCall(pickup.sender.phone)}
                      >
                        <Phone color="#FFFFFF" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.scheduleSection}>
                <View style={styles.scheduleItem}>
                  <Calendar color={Colors.light.primary} size={18} />
                  <Text style={styles.scheduleText}>
                    {new Date(pickup.scheduledDate).toLocaleDateString('es-GT', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Clock color={Colors.light.primary} size={18} />
                  <Text style={styles.scheduleText}>{pickup.scheduledTime}</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Package color={Colors.light.primary} size={18} />
                  <Text style={styles.scheduleText}>
                    {pickup.packageCount} {pickup.packageCount === 1 ? 'paquete' : 'paquetes'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.messengerInfo}>
                  <Text style={styles.messengerLabel}>Mensajero:</Text>
                  <Text style={styles.messengerName}>{pickup.messenger}</Text>
                </View>
              </View>

              {pickup.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notas:</Text>
                  <Text style={styles.notesText}>{pickup.notes}</Text>
                </View>
              )}

              {isMessenger && pickup.status === 'scheduled' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.collectedButton}
                    onPress={() => handleMarkAsCollected(pickup)}
                  >
                    <CheckCircle color="#FFFFFF" size={20} />
                    <Text style={styles.collectedButtonText}>Marcar como Recolectado</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isMessenger && pickup.status === 'collected' && (
                <View style={styles.collectedStatusContainer}>
                  <CheckCircle color="#10B981" size={24} />
                  <Text style={styles.collectedStatusText}>Recolección Completada</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  newButtonContainer: {
    padding: 16,
    paddingBottom: 0,
    backgroundColor: Colors.light.card,
    gap: 12,
  },
  newButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  messengersListButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  messengersListButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  messengersListContainer: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  messengersListTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  messengersList: {
    maxHeight: 300,
  },
  messengerCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  messengerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  messengerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  messengerDetails: {
    flex: 1,
  },
  messengerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  messengerPhone: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  messengerActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  messengerWhatsappButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  messengerCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyMessengers: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 40,
  },
  emptyMessengersText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  emptyMessengersSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  filtersContainer: {
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row' as const,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  pickupCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  pickupId: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusScheduled: {
    backgroundColor: '#DBEAFE',
  },
  statusCollected: {
    backgroundColor: '#D1FAE5',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  zoneBadge: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  cardBody: {
    marginBottom: 16,
  },
  senderSection: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
  },
  senderHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  senderInfo: {
    flex: 1,
    gap: 6,
  },
  iconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  senderDetail: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  contactButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  whatsappButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  scheduleSection: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  scheduleText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
    flex: 1,
  },
  cardFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  messengerLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 2,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF9E7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400E',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  actionButtons: {
    marginTop: 16,
  },
  collectedButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  collectedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  collectedStatusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#D1FAE5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
  },
  collectedStatusText: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

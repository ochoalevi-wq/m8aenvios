import { useDeliveries } from '@/contexts/DeliveryContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { ZONE_LABELS } from '@/types/delivery';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { UserCheck, Package, Search, AlertCircle } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

export default function AssignDeliveryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const deliveryId = params.deliveryId as string | undefined;
  const { deliveries, updateDelivery, isLoading } = useDeliveries();
  const { credentials, user } = useAuth();
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(deliveryId || null);
  const [selectedMessenger, setSelectedMessenger] = useState<string | null>(null);
  const [searchDelivery, setSearchDelivery] = useState<string>('');
  const [searchMessenger, setSearchMessenger] = useState<string>('');

  const isAdmin = user?.role === 'admin';
  const isScheduler = user?.role === 'scheduler';
  const isReassigning = !!deliveryId;

  const messengers = useMemo(() => {
    return credentials
      .filter(c => c.role === 'messenger')
      .map(c => ({ id: c.id, username: c.username, firstName: c.firstName, lastName: c.lastName }));
  }, [credentials]);

  const unassignedOrPendingDeliveries = useMemo(() => {
    if (isReassigning) {
      return deliveries.filter(d => 
        d.status !== 'delivered' && d.id === deliveryId
      );
    }
    return deliveries.filter(d => 
      d.status === 'pending' && 
      (d.messenger === '' || d.messenger === 'Sin asignar')
    );
  }, [deliveries, isReassigning, deliveryId]);

  const filteredDeliveries = useMemo(() => {
    if (!searchDelivery) return unassignedOrPendingDeliveries;
    const searchLower = searchDelivery.toLowerCase();
    return unassignedOrPendingDeliveries.filter(d =>
      d.receiver.name.toLowerCase().includes(searchLower) ||
      d.sender.name.toLowerCase().includes(searchLower) ||
      d.id.toLowerCase().includes(searchLower)
    );
  }, [unassignedOrPendingDeliveries, searchDelivery]);

  const filteredMessengers = useMemo(() => {
    if (!searchMessenger) return messengers;
    const searchLower = searchMessenger.toLowerCase();
    return messengers.filter(m => 
      m.username.toLowerCase().includes(searchLower) ||
      m.firstName.toLowerCase().includes(searchLower) ||
      m.lastName.toLowerCase().includes(searchLower)
    );
  }, [messengers, searchMessenger]);

  const handleAssign = async () => {
    if (!selectedDelivery || !selectedMessenger) {
      Alert.alert('Error', 'Por favor selecciona un paquete y un mensajero');
      return;
    }

    const currentDelivery = deliveries.find(d => d.id === selectedDelivery);
    const selectedMessengerData = messengers.find(m => m.id === selectedMessenger);
    const messengerDisplayName = selectedMessengerData 
      ? `${selectedMessengerData.firstName} ${selectedMessengerData.lastName}` 
      : '';
    const actionText = isReassigning ? 'Reasignar' : 'Asignar';
    const confirmText = isReassigning 
      ? `¿Reasignar el paquete #${selectedDelivery.slice(-6)} de ${currentDelivery?.messenger} a ${messengerDisplayName}?`
      : `¿Asignar el paquete #${selectedDelivery.slice(-6)} a ${messengerDisplayName}?`;

    Alert.alert(
      `Confirmar ${actionText}`,
      confirmText,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const messengerData = messengers.find(m => m.id === selectedMessenger);
              console.log('Asignando paquete:', {
                deliveryId: selectedDelivery,
                messengerId: selectedMessenger,
                messengerName: messengerData ? `${messengerData.firstName} ${messengerData.lastName}` : '',
              });
              await updateDelivery(selectedDelivery, {
                messenger: messengerData ? `${messengerData.firstName} ${messengerData.lastName}` : '',
                messengerId: selectedMessenger,
              });
              console.log('Paquete asignado exitosamente');
              const successMessage = isReassigning 
                ? 'Paquete reasignado correctamente' 
                : 'Paquete asignado correctamente';
              Alert.alert('Éxito', successMessage, [
                {
                  text: 'OK',
                  onPress: () => {
                    setSelectedDelivery(null);
                    setSelectedMessenger(null);
                  },
                },
              ]);
            } catch (error) {
              console.error('Error assigning delivery:', error);
              Alert.alert('Error', 'No se pudo asignar el paquete');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!isAdmin && !isScheduler) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle color={Colors.light.danger} size={64} />
        <Text style={styles.errorText}>Acceso Denegado</Text>
        <Text style={styles.errorSubtext}>
          No tienes permisos para asignar paquetes
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (messengers.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <UserCheck color={Colors.light.muted} size={64} />
        <Text style={styles.errorText}>No hay mensajeros disponibles</Text>
        <Text style={styles.errorSubtext}>
          Primero debes crear usuarios con rol de mensajero
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (unassignedOrPendingDeliveries.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Package color={Colors.light.muted} size={64} />
        <Text style={styles.errorText}>No hay paquetes sin asignar</Text>
        <Text style={styles.errorSubtext}>
          Todos los paquetes pendientes ya tienen un mensajero asignado
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={Colors.light.primary} size={24} />
            <Text style={styles.sectionTitle}>
              {isReassigning ? 'Paquete a Reasignar' : 'Seleccionar Paquete'}
            </Text>
          </View>

          {!isReassigning && (
            <View style={styles.searchContainer}>
              <Search color={Colors.light.muted} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar paquete..."
                value={searchDelivery}
                onChangeText={setSearchDelivery}
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          )}

          {filteredDeliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No se encontraron paquetes</Text>
            </View>
          ) : (
            filteredDeliveries.map((delivery) => (
              <TouchableOpacity
                key={delivery.id}
                style={[
                  styles.deliveryCard,
                  selectedDelivery === delivery.id && styles.deliveryCardSelected,
                  isReassigning && styles.deliveryCardLocked,
                ]}
                onPress={() => !isReassigning && setSelectedDelivery(delivery.id)}
                activeOpacity={isReassigning ? 1 : 0.7}
                disabled={isReassigning}
              >
                <View style={styles.deliveryCardHeader}>
                  <Text style={styles.deliveryId}>#{delivery.id.slice(-6)}</Text>
                  <View style={styles.zoneBadge}>
                    <Text style={styles.zoneBadgeText}>{ZONE_LABELS[delivery.zone]}</Text>
                  </View>
                </View>

                <View style={styles.deliveryCardBody}>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryLabel}>De:</Text>
                    <Text style={styles.deliveryName}>{delivery.sender.name}</Text>
                  </View>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryLabel}>Para:</Text>
                    <Text style={styles.deliveryName}>{delivery.receiver.name}</Text>
                  </View>
                </View>

                <View style={styles.deliveryCardFooter}>
                  <Text style={styles.deliveryAddress}>{delivery.receiver.address}</Text>
                  <Text style={styles.deliveryTotal}>
                    Q {(delivery.packageCost + delivery.shippingCost).toFixed(2)}
                  </Text>
                </View>

                {isReassigning && delivery.messenger && (
                  <View style={styles.currentMessengerBadge}>
                    <Text style={styles.currentMessengerLabel}>Mensajero actual:</Text>
                    <Text style={styles.currentMessengerName}>{delivery.messenger}</Text>
                  </View>
                )}

                {selectedDelivery === delivery.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓ Seleccionado</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserCheck color={Colors.light.secondary} size={24} />
            <Text style={styles.sectionTitle}>Seleccionar Mensajero</Text>
          </View>

          <View style={styles.searchContainer}>
            <Search color={Colors.light.muted} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar mensajero..."
              value={searchMessenger}
              onChangeText={setSearchMessenger}
              placeholderTextColor={Colors.light.muted}
            />
          </View>

          {filteredMessengers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No se encontraron mensajeros</Text>
            </View>
          ) : (
            filteredMessengers.map((messenger) => {
              const messengerDeliveries = deliveries.filter(d => d.messengerId === messenger.id);
              const activeDeliveries = messengerDeliveries.filter(
                d => d.status === 'pending' || d.status === 'in_transit'
              );
              const displayName = `${messenger.firstName} ${messenger.lastName}`;

              return (
                <TouchableOpacity
                  key={messenger.id}
                  style={[
                    styles.messengerCard,
                    selectedMessenger === messenger.id && styles.messengerCardSelected,
                  ]}
                  onPress={() => setSelectedMessenger(messenger.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.messengerCardHeader}>
                    <View style={styles.messengerAvatar}>
                      <Text style={styles.messengerAvatarText}>
                        {messenger.firstName.charAt(0).toUpperCase()}{messenger.lastName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.messengerInfo}>
                      <Text style={styles.messengerName}>{displayName}</Text>
                      <Text style={styles.messengerStats}>
                        {activeDeliveries.length} paquetes activos
                      </Text>
                    </View>
                  </View>

                  {selectedMessenger === messenger.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓ Seleccionado</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.assignButton,
            (!selectedDelivery || !selectedMessenger) && styles.assignButtonDisabled,
          ]}
          onPress={handleAssign}
          disabled={!selectedDelivery || !selectedMessenger}
        >
          <UserCheck color="#FFFFFF" size={20} />
          <Text style={styles.assignButtonText}>Asignar Paquete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.light.text,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  deliveryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deliveryCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#F0F9FF',
  },
  deliveryCardLocked: {
    opacity: 0.9,
  },
  deliveryCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  deliveryId: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  zoneBadge: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  zoneBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  deliveryCardBody: {
    marginBottom: 12,
    gap: 8,
  },
  deliveryInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  deliveryLabel: {
    fontSize: 13,
    color: Colors.light.muted,
    width: 40,
  },
  deliveryName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  deliveryCardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  deliveryAddress: {
    fontSize: 12,
    color: Colors.light.muted,
    flex: 1,
    marginRight: 12,
  },
  deliveryTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  messengerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  messengerCardSelected: {
    borderColor: Colors.light.secondary,
    backgroundColor: '#EFF6FF',
  },
  messengerCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  messengerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  messengerAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  messengerInfo: {
    flex: 1,
  },
  messengerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  messengerStats: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  selectedIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    alignItems: 'center' as const,
  },
  selectedIndicatorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  currentMessengerBadge: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  currentMessengerLabel: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  currentMessengerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  assignButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  assignButtonDisabled: {
    backgroundColor: Colors.light.muted,
    opacity: 0.5,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});

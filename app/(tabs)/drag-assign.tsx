import { useDeliveries } from '@/contexts/DeliveryContext';
import { usePickups } from '@/contexts/PickupContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { STATUS_LABELS, PICKUP_STATUS_LABELS, ZONE_LABELS } from '@/types/delivery';
import type { Delivery, Pickup } from '@/types/delivery';
import { useState, useMemo, useRef } from 'react';
import { 
  Package, 
  PackageCheck,
  User as UserIcon,
  MapPin,
  Calendar,
  GripVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  Animated,
  Alert
} from 'react-native';

type DragItem = {
  type: 'delivery' | 'pickup';
  id: string;
  data: Delivery | Pickup;
};

export default function DragAssignScreen() {
  const { deliveries, updateDelivery, isLoading: deliveriesLoading } = useDeliveries();
  const { pickups, updatePickup, isLoading: pickupsLoading } = usePickups();
  const { credentials } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'deliveries' | 'pickups'>('deliveries');
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const messengerCredentials = useMemo(() => {
    return credentials.filter(c => c.role === 'messenger');
  }, [credentials]);

  const unassignedDeliveries = useMemo(() => {
    return deliveries.filter(d => !d.messengerId && d.status === 'pending');
  }, [deliveries]);

  const unassignedPickups = useMemo(() => {
    return pickups.filter(p => !p.messengerId && p.status === 'scheduled');
  }, [pickups]);

  const createPanResponder = (item: DragItem) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggedItem(item);
        pan.setOffset({
          x: 0,
          y: 0,
        });
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(opacity, {
          toValue: 0.7,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        const dropY = gestureState.moveY;
        let targetMessengerId: string | null = null;

        messengerCredentials.forEach((messenger, index) => {
          const messengerY = 300 + (index * 120);
          if (dropY >= messengerY && dropY <= messengerY + 100) {
            targetMessengerId = messenger.id;
          }
        });

        if (targetMessengerId && draggedItem) {
          handleDrop(targetMessengerId, draggedItem);
        }

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDraggedItem(null);
          setDropTarget(null);
        });
      },
    });
  };

  const handleDrop = async (messengerId: string, item: DragItem) => {
    const messenger = messengerCredentials.find(m => m.id === messengerId);
    if (!messenger) return;

    const messengerName = `${messenger.firstName} ${messenger.lastName}`;

    try {
      if (item.type === 'delivery') {
        await updateDelivery(item.id, {
          messengerId: messengerId,
          messenger: messengerName,
        });
        Alert.alert(
          'Asignación Exitosa',
          `Paquete #${item.id.slice(-6)} asignado a ${messengerName}`,
          [{ text: 'OK' }]
        );
      } else {
        await updatePickup(item.id, {
          messengerId: messengerId,
          messenger: messengerName,
        });
        Alert.alert(
          'Asignación Exitosa',
          `Recolección #${item.id.slice(-6)} asignada a ${messengerName}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error al asignar:', error);
      Alert.alert('Error', 'No se pudo completar la asignación');
    }
  };

  if (deliveriesLoading || pickupsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const currentItems = selectedTab === 'deliveries' ? unassignedDeliveries : unassignedPickups;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arrastrar y Asignar</Text>
        <Text style={styles.headerSubtitle}>
          Arrastra los paquetes hacia los mensajeros para asignarlos
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'deliveries' && styles.tabActive]}
          onPress={() => setSelectedTab('deliveries')}
        >
          <Package 
            color={selectedTab === 'deliveries' ? '#FFFFFF' : Colors.light.text} 
            size={20} 
          />
          <Text style={[
            styles.tabText, 
            selectedTab === 'deliveries' && styles.tabTextActive
          ]}>
            Paquetes ({unassignedDeliveries.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pickups' && styles.tabActive]}
          onPress={() => setSelectedTab('pickups')}
        >
          <PackageCheck 
            color={selectedTab === 'pickups' ? '#FFFFFF' : Colors.light.text} 
            size={20} 
          />
          <Text style={[
            styles.tabText, 
            selectedTab === 'pickups' && styles.tabTextActive
          ]}>
            Recolecciones ({unassignedPickups.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedTab === 'deliveries' ? 'Paquetes Sin Asignar' : 'Recolecciones Sin Asignar'}
          </Text>
          {currentItems.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle color={Colors.light.success} size={48} />
              <Text style={styles.emptyText}>
                {selectedTab === 'deliveries' 
                  ? 'Todos los paquetes están asignados' 
                  : 'Todas las recolecciones están asignadas'}
              </Text>
            </View>
          ) : (
            <View style={styles.itemsContainer}>
              {currentItems.map((item) => {
                const itemType = selectedTab === 'deliveries' ? 'delivery' : 'pickup';
                const panResponder = createPanResponder({
                  type: itemType,
                  id: item.id,
                  data: item,
                });

                const isDelivery = selectedTab === 'deliveries';
                const delivery = isDelivery ? (item as Delivery) : null;
                const pickup = !isDelivery ? (item as Pickup) : null;

                return (
                  <Animated.View
                    key={item.id}
                    {...panResponder.panHandlers}
                    style={[
                      styles.draggableItem,
                      {
                        transform: [
                          { translateX: pan.x },
                          { translateY: pan.y },
                        ],
                        opacity: opacity,
                      },
                    ]}
                  >
                    <View style={styles.dragHandle}>
                      <GripVertical color={Colors.light.muted} size={20} />
                    </View>
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemId}>#{item.id.slice(-6)}</Text>
                        {isDelivery && delivery && (
                          <View style={styles.itemBadge}>
                            <Text style={styles.itemBadgeText}>
                              {STATUS_LABELS[delivery.status]}
                            </Text>
                          </View>
                        )}
                        {!isDelivery && pickup && (
                          <View style={styles.itemBadge}>
                            <Text style={styles.itemBadgeText}>
                              {PICKUP_STATUS_LABELS[pickup.status]}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.itemDetails}>
                        <View style={styles.itemDetailRow}>
                          <UserIcon color={Colors.light.muted} size={16} />
                          <Text style={styles.itemDetailText}>
                            {isDelivery && delivery ? delivery.receiver.name : pickup?.sender.name}
                          </Text>
                        </View>
                        <View style={styles.itemDetailRow}>
                          <MapPin color={Colors.light.muted} size={16} />
                          <Text style={styles.itemDetailText}>
                            {ZONE_LABELS[item.zone]}
                          </Text>
                        </View>
                        {!isDelivery && pickup && (
                          <View style={styles.itemDetailRow}>
                            <Calendar color={Colors.light.muted} size={16} />
                            <Text style={styles.itemDetailText}>
                              {new Date(pickup.scheduledDate).toLocaleDateString('es-GT')} - {pickup.scheduledTime}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensajeros Disponibles</Text>
          {messengerCredentials.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertCircle color={Colors.light.warning} size={48} />
              <Text style={styles.emptyText}>No hay mensajeros registrados</Text>
            </View>
          ) : (
            <View style={styles.messengersContainer}>
              {messengerCredentials.map((messenger) => {
                const messengerName = `${messenger.firstName} ${messenger.lastName}`;
                const messengerDeliveries = deliveries.filter(d => d.messengerId === messenger.id);
                const messengerPickups = pickups.filter(p => p.messengerId === messenger.id);

                return (
                  <View
                    key={messenger.id}
                    style={[
                      styles.messengerCard,
                      dropTarget === messenger.id && styles.messengerCardHighlight,
                    ]}
                  >
                    <View style={styles.messengerHeader}>
                      <View style={styles.messengerAvatar}>
                        <UserIcon color={Colors.light.primary} size={24} />
                      </View>
                      <View style={styles.messengerInfo}>
                        <Text style={styles.messengerName}>{messengerName}</Text>
                        <Text style={styles.messengerPhone}>+502 {messenger.phoneNumber}</Text>
                      </View>
                    </View>
                    <View style={styles.messengerStats}>
                      <View style={styles.messengerStat}>
                        <Package color={Colors.light.primary} size={16} />
                        <Text style={styles.messengerStatText}>
                          {messengerDeliveries.length} paquetes
                        </Text>
                      </View>
                      <View style={styles.messengerStat}>
                        <PackageCheck color={Colors.light.secondary} size={16} />
                        <Text style={styles.messengerStatText}>
                          {messengerPickups.length} recolecciones
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dropZone}>
                      <Text style={styles.dropZoneText}>Suelta aquí para asignar</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.card,
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.light.card,
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    padding: 40,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.muted,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  itemsContainer: {
    gap: 12,
  },
  draggableItem: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dragHandle: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  itemId: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  itemBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  itemDetails: {
    gap: 8,
  },
  itemDetailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  itemDetailText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  messengersContainer: {
    gap: 12,
  },
  messengerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  messengerCardHighlight: {
    borderColor: Colors.light.primary,
    backgroundColor: '#F0F9FF',
  },
  messengerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 12,
  },
  messengerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  messengerInfo: {
    flex: 1,
  },
  messengerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  messengerPhone: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  messengerStats: {
    flexDirection: 'row' as const,
    gap: 16,
    marginBottom: 12,
  },
  messengerStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  messengerStatText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  dropZone: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
  },
  dropZoneText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
});

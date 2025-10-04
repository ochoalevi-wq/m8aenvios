import { useDeliveries } from '@/contexts/DeliveryContext';
import { useAuth, type Credential } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { STATUS_LABELS, ZONE_LABELS } from '@/types/delivery';
import type { Delivery } from '@/types/delivery';
import { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Truck,
  ChevronDown,
  ChevronUp,
  Award,
  MapPin,
  Phone,
  User as UserIcon,
  UserPlus,
  Calendar,
  CreditCard,
  Car,
  MessageCircle,
  Camera
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

interface MessengerStats {
  name: string;
  totalDeliveries: number;
  delivered: number;
  inTransit: number;
  pending: number;
  totalRevenue: number;
  averageDeliveryValue: number;
  completionRate: number;
}

const VEHICLE_LABELS: Record<string, string> = {
  moto: 'Motocicleta',
  carro: 'Automóvil',
  camion: 'Camión',
};

const LICENSE_LABELS: Record<string, string> = {
  A: 'Licencia A',
  B: 'Licencia B',
  C: 'Licencia C',
  M: 'Licencia M',
};

export default function MessengersScreen() {
  const { deliveries, isLoading, updateStatus } = useDeliveries();
  const { user, credentials } = useAuth();
  const router = useRouter();
  const [expandedMessenger, setExpandedMessenger] = useState<string | null>(null);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [previousDeliveriesCount, setPreviousDeliveriesCount] = useState<number>(0);

  const isMessenger = user?.role === 'messenger';
  const messengerName = user?.name || '';

  useEffect(() => {
    if (Platform.OS !== 'web' && isMessenger) {
      requestNotificationPermissions();
    }
  }, [isMessenger]);

  useEffect(() => {
    if (isMessenger && user?.id) {
      const myDeliveries = deliveries.filter(d => d.messengerId === user.id);
      if (myDeliveries.length > previousDeliveriesCount && previousDeliveriesCount > 0) {
        sendNotification('Nuevo paquete asignado', 'Se te ha asignado un nuevo paquete para entregar');
      }
      setPreviousDeliveriesCount(myDeliveries.length);
    }
  }, [deliveries, isMessenger, user?.id, previousDeliveriesCount]);

  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permiso de notificaciones denegado');
      }
    } catch (error) {
      console.error('Error solicitando permisos de notificaciones:', error);
    }
  };

  const sendNotification = async (title: string, body: string) => {
    if (Platform.OS === 'web') {
      console.log('Notificación:', title, body);
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  };

  const messengerCredentials = useMemo(() => {
    return credentials.filter(c => c.role === 'messenger');
  }, [credentials]);

  const messengerStats = useMemo(() => {
    const statsMap = new Map<string, MessengerStats & { credential?: Credential }>();

    messengerCredentials.forEach((credential) => {
      const messengerName = `${credential.firstName} ${credential.lastName}`;
      statsMap.set(credential.id, {
        name: messengerName,
        totalDeliveries: 0,
        delivered: 0,
        inTransit: 0,
        pending: 0,
        totalRevenue: 0,
        averageDeliveryValue: 0,
        completionRate: 0,
        credential,
      });
    });

    deliveries.forEach((delivery) => {
      if (delivery.messengerId && statsMap.has(delivery.messengerId)) {
        const stats = statsMap.get(delivery.messengerId)!;
        const deliveryValue = delivery.packageCost + delivery.shippingCost;

        stats.totalDeliveries++;
        stats.totalRevenue += deliveryValue;

        if (delivery.status === 'delivered') stats.delivered++;
        if (delivery.status === 'in_transit') stats.inTransit++;
        if (delivery.status === 'pending') stats.pending++;
      }
    });

    statsMap.forEach((stats) => {
      if (stats.totalDeliveries > 0) {
        stats.averageDeliveryValue = stats.totalRevenue / stats.totalDeliveries;
        stats.completionRate = (stats.delivered / stats.totalDeliveries) * 100;
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  }, [deliveries, messengerCredentials]);

  const topPerformer = useMemo(() => {
    if (messengerStats.length === 0) return null;
    return messengerStats.reduce((prev, current) => 
      current.completionRate > prev.completionRate ? current : prev
    );
  }, [messengerStats]);

  const getMessengerDeliveries = (messengerId: string) => {
    return deliveries
      .filter((d) => d.messengerId === messengerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (isMessenger) {
    console.log('Usuario mensajero:', { userId: user?.id, userName: user?.name });
    console.log('Total de entregas:', deliveries.length);
    deliveries.forEach(d => {
      console.log('Entrega:', { id: d.id, messengerId: d.messengerId, messenger: d.messenger });
    });
    const myDeliveries = deliveries.filter(d => d.messengerId === user?.id);
    console.log('Mis entregas filtradas:', myDeliveries.length);

    if (myDeliveries.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Truck color={Colors.light.muted} size={64} />
          <Text style={styles.emptyText}>No tienes paquetes asignados</Text>
          <Text style={styles.emptySubtext}>
            Tus entregas aparecerán aquí cuando te sean asignadas
          </Text>
        </View>
      );
    }

    const myStats = {
      total: myDeliveries.length,
      pending: myDeliveries.filter(d => d.status === 'pending').length,
      inTransit: myDeliveries.filter(d => d.status === 'in_transit').length,
      delivered: myDeliveries.filter(d => d.status === 'delivered').length,
      totalRevenue: myDeliveries.reduce((sum, d) => sum + d.packageCost + d.shippingCost, 0),
    };

    const handleCall = (phone: string) => {
      Linking.openURL(`tel:${phone}`);
    };

    const handleWhatsApp = (phone: string, name: string) => {
      const message = encodeURIComponent(`Hola ${name}, soy tu mensajero. Estoy en camino con tu paquete.`);
      Linking.openURL(`https://wa.me/502${phone}?text=${message}`);
    };

    const handleTakePhoto = async (deliveryId: string) => {
      Alert.alert(
        'Foto del Paquete',
        'La funcionalidad de cámara estará disponible en la versión móvil de la aplicación.',
        [{ text: 'OK' }]
      );
    };

    const handleStatusChange = async (deliveryId: string, newStatus: 'in_transit' | 'delivered') => {
      await updateStatus(deliveryId, newStatus);
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.messengerWelcomeCard}>
          <View style={styles.messengerWelcomeHeader}>
            <View style={styles.messengerWelcomeAvatar}>
              <UserIcon color="#FFFFFF" size={32} />
            </View>
            <View style={styles.messengerWelcomeInfo}>
              <Text style={styles.messengerWelcomeLabel}>Bienvenido</Text>
              <Text style={styles.messengerWelcomeName}>{messengerName}</Text>
            </View>
          </View>

          <View style={styles.messengerStatsRow}>
            <View style={styles.messengerStatCard}>
              <Text style={styles.messengerStatValue}>{myStats.total}</Text>
              <Text style={styles.messengerStatLabel}>Total</Text>
            </View>
            <View style={styles.messengerStatCard}>
              <Text style={[styles.messengerStatValue, { color: Colors.light.warning }]}>{myStats.pending}</Text>
              <Text style={styles.messengerStatLabel}>Pendientes</Text>
            </View>
            <View style={styles.messengerStatCard}>
              <Text style={[styles.messengerStatValue, { color: Colors.light.secondary }]}>{myStats.inTransit}</Text>
              <Text style={styles.messengerStatLabel}>En Tránsito</Text>
            </View>
            <View style={styles.messengerStatCard}>
              <Text style={[styles.messengerStatValue, { color: '#10B981' }]}>{myStats.delivered}</Text>
              <Text style={styles.messengerStatLabel}>Entregados</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Entregas</Text>
          <Text style={styles.sectionSubtitle}>{myDeliveries.length} paquetes asignados</Text>
        </View>

        {myDeliveries.map((delivery) => {
          const isExpanded = expandedDelivery === delivery.id;
          const canStartTransit = delivery.status === 'pending';
          const canComplete = delivery.status === 'in_transit';

          return (
            <View key={delivery.id} style={styles.deliveryCard}>
              <TouchableOpacity
                style={styles.deliveryCardHeader}
                onPress={() => setExpandedDelivery(isExpanded ? null : delivery.id)}
                activeOpacity={0.7}
              >
                <View style={styles.deliveryCardHeaderLeft}>
                  <View style={[
                    styles.deliveryStatusIndicator,
                    delivery.status === 'pending' && styles.statusIndicatorPending,
                    delivery.status === 'in_transit' && styles.statusIndicatorInTransit,
                    delivery.status === 'delivered' && styles.statusIndicatorDelivered,
                  ]} />
                  <View style={styles.deliveryCardInfo}>
                    <Text style={styles.deliveryCardId}>#{delivery.id.slice(-6)}</Text>
                    <Text style={styles.deliveryCardReceiver}>{delivery.receiver.name}</Text>
                  </View>
                </View>
                <View style={styles.deliveryCardHeaderRight}>
                  <View style={[
                    styles.deliveryCardStatusBadge,
                    delivery.status === 'delivered' && styles.statusDelivered,
                    delivery.status === 'in_transit' && styles.statusInTransit,
                    delivery.status === 'pending' && styles.statusPending,
                  ]}>
                    <Text style={styles.deliveryCardStatusText}>
                      {STATUS_LABELS[delivery.status]}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp color={Colors.light.muted} size={20} />
                  ) : (
                    <ChevronDown color={Colors.light.muted} size={20} />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.deliveryCardQuickInfo}>
                <View style={styles.deliveryCardQuickInfoItem}>
                  <MapPin color={Colors.light.muted} size={16} />
                  <Text style={styles.deliveryCardQuickInfoText}>{ZONE_LABELS[delivery.zone]}</Text>
                </View>
                <View style={styles.deliveryCardQuickInfoItem}>
                  <Text style={styles.deliveryCardTotal}>
                    Q {(delivery.packageCost + delivery.shippingCost).toFixed(2)}
                  </Text>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.deliveryCardDetails}>
                  <View style={styles.deliveryDetailSection}>
                    <Text style={styles.deliveryDetailSectionTitle}>Remitente</Text>
                    <View style={styles.deliveryDetailRow}>
                      <UserIcon color={Colors.light.muted} size={16} />
                      <Text style={styles.deliveryDetailText}>{delivery.sender.name}</Text>
                    </View>
                    <View style={styles.deliveryDetailRow}>
                      <Phone color={Colors.light.muted} size={16} />
                      <Text style={styles.deliveryDetailText}>+502 {delivery.sender.phone}</Text>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCall(`+502${delivery.sender.phone}`)}
                      >
                        <Text style={styles.callButtonText}>Llamar</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.deliveryDetailRow}>
                      <MapPin color={Colors.light.muted} size={16} />
                      <Text style={[styles.deliveryDetailText, { flex: 1 }]}>{delivery.sender.address}</Text>
                    </View>
                  </View>

                  <View style={styles.deliveryDetailSection}>
                    <Text style={styles.deliveryDetailSectionTitle}>Destinatario</Text>
                    <View style={styles.deliveryDetailRow}>
                      <UserIcon color={Colors.light.muted} size={16} />
                      <Text style={styles.deliveryDetailText}>{delivery.receiver.name}</Text>
                    </View>
                    <View style={styles.deliveryDetailRow}>
                      <Phone color={Colors.light.muted} size={16} />
                      <Text style={styles.deliveryDetailText}>+502 {delivery.receiver.phone}</Text>
                    </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={[styles.contactButton, styles.callButtonStyle]}
                        onPress={() => handleCall(`+502${delivery.receiver.phone}`)}
                      >
                        <Phone color="#FFFFFF" size={18} />
                        <Text style={styles.contactButtonText}>Llamar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.contactButton, styles.whatsappButton]}
                        onPress={() => handleWhatsApp(delivery.receiver.phone, delivery.receiver.name)}
                      >
                        <MessageCircle color="#FFFFFF" size={18} />
                        <Text style={styles.contactButtonText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.deliveryDetailRow}>
                      <MapPin color={Colors.light.muted} size={16} />
                      <Text style={[styles.deliveryDetailText, { flex: 1 }]}>{delivery.receiver.address}</Text>
                    </View>
                  </View>

                  {delivery.description && (
                    <View style={styles.deliveryDetailSection}>
                      <Text style={styles.deliveryDetailSectionTitle}>Descripción</Text>
                      <Text style={styles.deliveryDetailText}>{delivery.description}</Text>
                    </View>
                  )}

                  <View style={styles.deliveryDetailSection}>
                    <Text style={styles.deliveryDetailSectionTitle}>Costos</Text>
                    <View style={styles.deliveryDetailRow}>
                      <Text style={styles.deliveryDetailLabel}>Costo del paquete:</Text>
                      <Text style={styles.deliveryDetailValue}>Q {delivery.packageCost.toFixed(2)}</Text>
                    </View>
                    <View style={styles.deliveryDetailRow}>
                      <Text style={styles.deliveryDetailLabel}>Costo de envío:</Text>
                      <Text style={styles.deliveryDetailValue}>Q {delivery.shippingCost.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.deliveryDetailRow, styles.deliveryDetailRowTotal]}>
                      <Text style={styles.deliveryDetailLabelTotal}>Total:</Text>
                      <Text style={styles.deliveryDetailValueTotal}>
                        Q {(delivery.packageCost + delivery.shippingCost).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.deliveryActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonCamera]}
                      onPress={() => handleTakePhoto(delivery.id)}
                    >
                      <Camera color="#FFFFFF" size={20} />
                      <Text style={styles.actionButtonText}>Tomar Foto</Text>
                    </TouchableOpacity>
                    {canStartTransit && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={() => handleStatusChange(delivery.id, 'in_transit')}
                      >
                        <Truck color="#FFFFFF" size={20} />
                        <Text style={styles.actionButtonText}>Iniciar Entrega</Text>
                      </TouchableOpacity>
                    )}
                    {canComplete && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonSuccess]}
                        onPress={() => handleStatusChange(delivery.id, 'delivered')}
                      >
                        <CheckCircle color="#FFFFFF" size={20} />
                        <Text style={styles.actionButtonText}>Marcar como Entregado</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  if (messengerStats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Truck color={Colors.light.muted} size={64} />
        <Text style={styles.emptyText}>No hay mensajeros registrados</Text>
        <Text style={styles.emptySubtext}>
          Los mensajeros aparecerán aquí cuando crees envíos
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {topPerformer && (
        <View style={styles.topPerformerCard}>
          <View style={styles.topPerformerHeader}>
            <Award color="#FFD700" size={32} />
            <View style={styles.topPerformerInfo}>
              <Text style={styles.topPerformerLabel}>Mejor Mensajero</Text>
              <Text style={styles.topPerformerName}>{topPerformer.name}</Text>
            </View>
          </View>
          <View style={styles.topPerformerStats}>
            <View style={styles.topPerformerStat}>
              <Text style={styles.topPerformerStatValue}>{topPerformer.completionRate.toFixed(0)}%</Text>
              <Text style={styles.topPerformerStatLabel}>Tasa de Entrega</Text>
            </View>
            <View style={styles.topPerformerStat}>
              <Text style={styles.topPerformerStatValue}>{topPerformer.delivered}</Text>
              <Text style={styles.topPerformerStatLabel}>Entregados</Text>
            </View>
            <View style={styles.topPerformerStat}>
              <Text style={styles.topPerformerStatValue}>Q {topPerformer.totalRevenue.toFixed(0)}</Text>
              <Text style={styles.topPerformerStatLabel}>Ingresos</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Todos los Mensajeros</Text>
          <Text style={styles.sectionSubtitle}>{messengerStats.length} mensajeros activos</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/register?role=messenger')}
          activeOpacity={0.7}
        >
          <UserPlus color="#FFFFFF" size={20} />
          <Text style={styles.addButtonText}>Añadir</Text>
        </TouchableOpacity>
      </View>

      {messengerStats.map((messenger) => {
        const messengerId = messenger.credential?.id || '';
        const isExpanded = expandedMessenger === messengerId;
        const messengerDeliveries = isExpanded ? getMessengerDeliveries(messengerId) : [];

        return (
          <View key={messengerId} style={styles.messengerCard}>
            <TouchableOpacity
              style={styles.messengerHeader}
              onPress={() => setExpandedMessenger(isExpanded ? null : messengerId)}
              activeOpacity={0.7}
            >
              <View style={styles.messengerHeaderLeft}>
                <View style={styles.messengerAvatar}>
                  <Truck color={Colors.light.primary} size={24} />
                </View>
                <View style={styles.messengerInfo}>
                  <Text style={styles.messengerName}>{messenger.name}</Text>
                  <Text style={styles.messengerSubtext}>
                    {messenger.totalDeliveries} envíos totales
                  </Text>
                </View>
              </View>
              {isExpanded ? (
                <ChevronUp color={Colors.light.muted} size={24} />
              ) : (
                <ChevronDown color={Colors.light.muted} size={24} />
              )}
            </TouchableOpacity>

            {messenger.credential && (
              <View style={styles.messengerDetailsCard}>
                <View style={styles.messengerDetailRow}>
                  <View style={styles.messengerDetailItem}>
                    <Phone color={Colors.light.primary} size={18} />
                    <View style={styles.messengerDetailContent}>
                      <Text style={styles.messengerDetailLabel}>Teléfono</Text>
                      <Text style={styles.messengerDetailValue}>+502 {messenger.credential.phoneNumber}</Text>
                    </View>
                  </View>
                  {messenger.credential.age && (
                    <View style={styles.messengerDetailItem}>
                      <Calendar color={Colors.light.primary} size={18} />
                      <View style={styles.messengerDetailContent}>
                        <Text style={styles.messengerDetailLabel}>Edad</Text>
                        <Text style={styles.messengerDetailValue}>{messenger.credential.age} años</Text>
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.messengerDetailRow}>
                  {messenger.credential.licenseType && (
                    <View style={styles.messengerDetailItem}>
                      <CreditCard color={Colors.light.primary} size={18} />
                      <View style={styles.messengerDetailContent}>
                        <Text style={styles.messengerDetailLabel}>Licencia</Text>
                        <Text style={styles.messengerDetailValue}>{LICENSE_LABELS[messenger.credential.licenseType]}</Text>
                      </View>
                    </View>
                  )}
                  {messenger.credential.vehicleType && (
                    <View style={styles.messengerDetailItem}>
                      <Car color={Colors.light.primary} size={18} />
                      <View style={styles.messengerDetailContent}>
                        <Text style={styles.messengerDetailLabel}>Vehículo</Text>
                        <Text style={styles.messengerDetailValue}>{VEHICLE_LABELS[messenger.credential.vehicleType]}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.messengerStatsGrid}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBox, { backgroundColor: '#D1FAE5' }]}>
                  <CheckCircle color="#10B981" size={20} />
                </View>
                <Text style={styles.statBoxValue}>{messenger.delivered}</Text>
                <Text style={styles.statBoxLabel}>Entregados</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Truck color={Colors.light.secondary} size={20} />
                </View>
                <Text style={styles.statBoxValue}>{messenger.inTransit}</Text>
                <Text style={styles.statBoxLabel}>En Tránsito</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Clock color={Colors.light.warning} size={20} />
                </View>
                <Text style={styles.statBoxValue}>{messenger.pending}</Text>
                <Text style={styles.statBoxLabel}>Pendientes</Text>
              </View>
            </View>

            <View style={styles.messengerMetrics}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Tasa de Entrega:</Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${messenger.completionRate}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.metricValue}>{messenger.completionRate.toFixed(0)}%</Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Ingresos Totales:</Text>
                <Text style={styles.metricValueHighlight}>
                  Q {messenger.totalRevenue.toFixed(2)}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Promedio por Envío:</Text>
                <Text style={styles.metricValue}>
                  Q {messenger.averageDeliveryValue.toFixed(2)}
                </Text>
              </View>
            </View>

            {isExpanded && messengerDeliveries.length > 0 && (
              <View style={styles.recentDeliveries}>
                <Text style={styles.recentDeliveriesTitle}>Envíos Recientes</Text>
                {messengerDeliveries.map((delivery) => (
                  <View key={delivery.id} style={styles.deliveryItem}>
                    <View style={styles.deliveryItemHeader}>
                      <Text style={styles.deliveryItemId}>#{delivery.id.slice(-6)}</Text>
                      <View style={[
                        styles.deliveryStatusBadge,
                        delivery.status === 'delivered' && styles.statusDelivered,
                        delivery.status === 'in_transit' && styles.statusInTransit,
                        delivery.status === 'pending' && styles.statusPending,
                      ]}>
                        <Text style={styles.deliveryStatusText}>
                          {STATUS_LABELS[delivery.status]}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.deliveryItemReceiver}>{delivery.receiver.name}</Text>
                    <View style={styles.deliveryItemFooter}>
                      <Text style={styles.deliveryItemZone}>{delivery.zone.replace('_', ' ').toUpperCase()}</Text>
                      <Text style={styles.deliveryItemTotal}>
                        Q {(delivery.packageCost + delivery.shippingCost).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  topPerformerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  topPerformerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 20,
  },
  topPerformerInfo: {
    flex: 1,
  },
  topPerformerLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  topPerformerName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  topPerformerStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  topPerformerStat: {
    alignItems: 'center' as const,
  },
  topPerformerStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  topPerformerStatLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  section: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  messengerCard: {
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
  messengerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  messengerHeaderLeft: {
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
  messengerInfo: {
    flex: 1,
  },
  messengerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  messengerSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  messengerStatsGrid: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center' as const,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  statBoxLabel: {
    fontSize: 11,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  messengerMetrics: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  metricValueHighlight: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  progressBarContainer: {
    flex: 2,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden' as const,
    marginHorizontal: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  recentDeliveries: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  recentDeliveriesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  deliveryItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  deliveryItemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  deliveryItemId: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  deliveryStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusInTransit: {
    backgroundColor: '#DBEAFE',
  },
  statusDelivered: {
    backgroundColor: '#D1FAE5',
  },
  deliveryStatusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  deliveryItemReceiver: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  deliveryItemFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  deliveryItemZone: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  deliveryItemTotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  messengerDetailsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  messengerDetailRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  messengerDetailItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 10,
  },
  messengerDetailContent: {
    flex: 1,
  },
  messengerDetailLabel: {
    fontSize: 11,
    color: Colors.light.muted,
    marginBottom: 2,
  },
  messengerDetailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  messengerWelcomeCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  messengerWelcomeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 20,
  },
  messengerWelcomeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  messengerWelcomeInfo: {
    flex: 1,
  },
  messengerWelcomeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  messengerWelcomeName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  messengerStatsRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  messengerStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center' as const,
  },
  messengerStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messengerStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center' as const,
  },
  deliveryCard: {
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
  deliveryCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  deliveryCardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  deliveryStatusIndicator: {
    width: 8,
    height: 48,
    borderRadius: 4,
  },
  statusIndicatorPending: {
    backgroundColor: Colors.light.warning,
  },
  statusIndicatorInTransit: {
    backgroundColor: Colors.light.secondary,
  },
  statusIndicatorDelivered: {
    backgroundColor: '#10B981',
  },
  deliveryCardInfo: {
    flex: 1,
  },
  deliveryCardId: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  deliveryCardReceiver: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  deliveryCardHeaderRight: {
    alignItems: 'flex-end' as const,
    gap: 8,
  },
  deliveryCardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deliveryCardStatusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  deliveryCardQuickInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  deliveryCardQuickInfoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  deliveryCardQuickInfoText: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  deliveryCardTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  deliveryCardDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 16,
  },
  deliveryDetailSection: {
    gap: 8,
  },
  deliveryDetailSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  deliveryDetailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  deliveryDetailText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  deliveryDetailLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    flex: 1,
  },
  deliveryDetailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  deliveryDetailRowTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  deliveryDetailLabelTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  deliveryDetailValueTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  callButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 'auto' as const,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  deliveryActions: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.light.secondary,
  },
  actionButtonSuccess: {
    backgroundColor: '#10B981',
  },
  actionButtonCamera: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  contactActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginVertical: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  callButtonStyle: {
    backgroundColor: Colors.light.primary,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});

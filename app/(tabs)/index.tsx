import { useDeliveries, useDeliveryStats } from '@/contexts/DeliveryContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { STATUS_LABELS } from '@/types/delivery';
import { useRouter } from 'expo-router';
import { Package, TrendingUp, Clock, CheckCircle, Truck, MapPin, Phone, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useMemo, useState } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, companyName } = useAuth();
  const isMessenger = user?.role === 'messenger';
  const { deliveries, isLoading, updateStatus } = useDeliveries();
  const stats = useDeliveryStats();
  
  const myDeliveries = useMemo(() => {
    if (isMessenger && user) {
      return deliveries.filter(d => d.messengerId === user.id);
    }
    return deliveries;
  }, [deliveries, isMessenger, user]);
  
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  
  const myStats = useMemo(() => {
    if (!isMessenger) return stats;
    
    const messengerStats = {
      total: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      totalRevenue: 0,
    };
    
    myDeliveries.forEach((delivery) => {
      messengerStats.total++;
      if (delivery.status === 'pending') messengerStats.pending++;
      if (delivery.status === 'in_transit') messengerStats.inTransit++;
      if (delivery.status === 'delivered') messengerStats.delivered++;
      messengerStats.totalRevenue += delivery.packageCost + delivery.shippingCost;
    });
    
    return messengerStats;
  }, [myDeliveries, isMessenger, stats]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const recentDeliveries = myDeliveries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleStatusChange = async (deliveryId: string, newStatus: 'in_transit' | 'delivered') => {
    await updateStatus(deliveryId, newStatus);
  };

  if (isMessenger) {
    if (myDeliveries.length === 0) {
      return (
        <View style={styles.emptyMessengerContainer}>
          <Truck color={Colors.light.muted} size={64} />
          <Text style={styles.emptyMessengerText}>No tienes paquetes asignados</Text>
          <Text style={styles.emptyMessengerSubtext}>
            Tus entregas aparecerán aquí cuando te sean asignadas
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.messengerWelcomeCard}>
          <View style={styles.messengerWelcomeHeader}>
            <View style={styles.messengerWelcomeAvatar}>
              <UserIcon color="#FFFFFF" size={32} />
            </View>
            <View style={styles.messengerWelcomeInfo}>
              <Text style={styles.messengerWelcomeLabel}>Bienvenido</Text>
              <Text style={styles.messengerWelcomeName}>{user?.name}</Text>
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
                  <Text style={styles.deliveryCardQuickInfoText}>{delivery.zone.replace('_', ' ').toUpperCase()}</Text>
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
                      <Text style={styles.deliveryDetailText}>{delivery.sender.phone}</Text>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCall(delivery.sender.phone)}
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
                      <Text style={styles.deliveryDetailText}>{delivery.receiver.phone}</Text>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCall(delivery.receiver.phone)}
                      >
                        <Text style={styles.callButtonText}>Llamar</Text>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{isMessenger ? `Hola, ${user?.name}` : (companyName || 'Dashboard')}</Text>
        <Text style={styles.subtitle}>{isMessenger ? 'Tus envíos asignados' : 'Gestión de Paquetes'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <View style={styles.statIconContainer}>
            <Package color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{myStats.total}</Text>
          <Text style={styles.statLabel}>Total Envíos</Text>
        </View>

        <View style={[styles.statCard, styles.warningCard]}>
          <View style={styles.statIconContainer}>
            <Clock color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{myStats.pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>

        <View style={[styles.statCard, styles.infoCard]}>
          <View style={styles.statIconContainer}>
            <Truck color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{myStats.inTransit}</Text>
          <Text style={styles.statLabel}>En Tránsito</Text>
        </View>

        <View style={[styles.statCard, styles.successCard]}>
          <View style={styles.statIconContainer}>
            <CheckCircle color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.statValue}>{myStats.delivered}</Text>
          <Text style={styles.statLabel}>Entregados</Text>
        </View>
      </View>

      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <TrendingUp color={Colors.light.success} size={28} />
          <View style={styles.revenueTextContainer}>
            <Text style={styles.revenueLabel}>Ingresos Totales</Text>
            <Text style={styles.revenueValue}>Q {myStats.totalRevenue.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Envíos Recientes</Text>
          <TouchableOpacity onPress={() => router.push('/deliveries')}>
            <Text style={styles.seeAllText}>Ver Todos</Text>
          </TouchableOpacity>
        </View>

        {recentDeliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <Package color={Colors.light.muted} size={48} />
            <Text style={styles.emptyText}>No hay envíos registrados</Text>
            {!isMessenger && (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/new-delivery')}
              >
                <Text style={styles.addButtonText}>Crear Primer Envío</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          recentDeliveries.map((delivery) => (
            <View
              key={delivery.id}
              style={styles.deliveryCard}
            >
              <View style={styles.deliveryHeader}>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryName}>{delivery.receiver.name}</Text>
                  <Text style={styles.deliveryZone}>{delivery.zone.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  delivery.status === 'delivered' && styles.statusDelivered,
                  delivery.status === 'in_transit' && styles.statusInTransit,
                  delivery.status === 'pending' && styles.statusPending,
                ]}>
                  <Text style={styles.statusText}>{STATUS_LABELS[delivery.status]}</Text>
                </View>
              </View>
              <View style={styles.deliveryFooter}>
                <Text style={styles.deliveryMessenger}>Mensajero: {delivery.messenger}</Text>
                <Text style={styles.deliveryTotal}>Q {(delivery.packageCost + delivery.shippingCost).toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: Colors.light.primary,
  },
  warningCard: {
    backgroundColor: Colors.light.warning,
  },
  infoCard: {
    backgroundColor: Colors.light.secondary,
  },
  successCard: {
    backgroundColor: Colors.light.success,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center' as const,
  },
  revenueCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  revenueHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  revenueTextContainer: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.success,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
  emptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.muted,
    marginTop: 16,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  deliveryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  deliveryZone: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  deliveryFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  deliveryMessenger: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  deliveryTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  emptyMessengerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    padding: 40,
  },
  emptyMessengerText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  emptyMessengerSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: 'center' as const,
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
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

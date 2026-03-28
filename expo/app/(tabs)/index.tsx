import { useDeliveries, useDeliveryStats } from '@/contexts/DeliveryContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { STATUS_LABELS } from '@/types/delivery';
import { useRouter } from 'expo-router';
import { Package, TrendingUp, Clock, CheckCircle, Truck, MapPin, Phone, User as UserIcon, ChevronDown, ChevronUp, MessageCircle, ArrowRight, Activity } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

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

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
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
      <ScrollView style={styles.container} contentContainerStyle={styles.messengerContentContainer}>
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
                      <View style={styles.contactButtons}>
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => handleCall(delivery.receiver.phone)}
                        >
                          <Text style={styles.callButtonText}>Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.whatsappButton}
                          onPress={() => handleWhatsApp(delivery.receiver.phone)}
                        >
                          <MessageCircle color="#FFFFFF" size={14} />
                        </TouchableOpacity>
                      </View>
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hola 👋</Text>
            <Text style={styles.headerTitle}>{companyName || ''}</Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton}>
            <Activity color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Resumen General</Text>
            <TouchableOpacity>
              <Text style={styles.statsLink}>Ver más</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.primaryCard]}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <View style={styles.statIconCircle}>
                  <Package color="#FFFFFF" size={20} />
                </View>
                <Text style={styles.statValue}>{myStats.total}</Text>
                <Text style={styles.statLabel}>Total Envíos</Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, styles.warningCard]}>
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <View style={styles.statIconCircle}>
                  <Clock color="#FFFFFF" size={20} />
                </View>
                <Text style={styles.statValue}>{myStats.pending}</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, styles.infoCard]}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <View style={styles.statIconCircle}>
                  <Truck color="#FFFFFF" size={20} />
                </View>
                <Text style={styles.statValue}>{myStats.inTransit}</Text>
                <Text style={styles.statLabel}>En Tránsito</Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, styles.successCard]}>
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <View style={styles.statIconCircle}>
                  <CheckCircle color="#FFFFFF" size={20} />
                </View>
                <Text style={styles.statValue}>{myStats.delivered}</Text>
                <Text style={styles.statLabel}>Entregados</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.revenueCard} activeOpacity={0.9}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.revenueGradient}
          >
            <View style={styles.revenueContent}>
              <View style={styles.revenueLeft}>
                <View style={styles.revenueIconContainer}>
                  <TrendingUp color="#43e97b" size={24} />
                </View>
                <View>
                  <Text style={styles.revenueLabel}>Ingresos Totales</Text>
                  <Text style={styles.revenueValue}>Q {myStats.totalRevenue.toFixed(2)}</Text>
                  <Text style={styles.revenueSubtext}>+12% vs mes anterior</Text>
                </View>
              </View>
              <View style={styles.revenueArrow}>
                <ArrowRight color="rgba(255, 255, 255, 0.4)" size={24} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Envíos Recientes</Text>
              <Text style={styles.sectionSubtitle}>{recentDeliveries.length} entregas activas</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/deliveries')}
            >
              <Text style={styles.viewAllText}>Ver todos</Text>
              <ArrowRight color={Colors.light.primary} size={16} />
            </TouchableOpacity>
          </View>

          {recentDeliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Package color={Colors.light.primary} size={32} />
              </View>
              <Text style={styles.emptyText}>No hay envíos registrados</Text>
              <Text style={styles.emptySubtext}>Comienza creando tu primer envío</Text>
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
            recentDeliveries.map((delivery, index) => (
              <TouchableOpacity
                key={delivery.id}
                style={[styles.deliveryCard, { marginTop: index === 0 ? 0 : 12 }]}
                activeOpacity={0.7}
              >
                <View style={styles.deliveryCardTop}>
                  <View style={styles.deliveryCardLeft}>
                    <View style={[
                      styles.deliveryStatusDot,
                      delivery.status === 'delivered' && styles.statusDotDelivered,
                      delivery.status === 'in_transit' && styles.statusDotInTransit,
                      delivery.status === 'pending' && styles.statusDotPending,
                    ]} />
                    <View style={styles.deliveryInfo}>
                      <Text style={styles.deliveryName}>{delivery.receiver.name}</Text>
                      <View style={styles.deliveryMeta}>
                        <MapPin color={Colors.light.muted} size={12} />
                        <Text style={styles.deliveryZone}>{delivery.zone.replace('_', ' ').toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    delivery.status === 'delivered' && styles.statusDelivered,
                    delivery.status === 'in_transit' && styles.statusInTransit,
                    delivery.status === 'pending' && styles.statusPending,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      delivery.status === 'delivered' && styles.statusTextDelivered,
                      delivery.status === 'in_transit' && styles.statusTextInTransit,
                      delivery.status === 'pending' && styles.statusTextPending,
                    ]}>{STATUS_LABELS[delivery.status]}</Text>
                  </View>
                </View>
                <View style={styles.deliveryDivider} />
                <View style={styles.deliveryFooter}>
                  <View style={styles.deliveryMessengerInfo}>
                    <Truck color={Colors.light.muted} size={14} />
                    <Text style={styles.deliveryMessenger}>{delivery.messenger}</Text>
                  </View>
                  <Text style={styles.deliveryTotal}>Q {(delivery.packageCost + delivery.shippingCost).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statsContainer: {
    marginTop: -20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  statsLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f8f9fa',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center' as const,
    minHeight: 140,
    justifyContent: 'center' as const,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  primaryCard: {},
  warningCard: {},
  infoCard: {},
  successCard: {},
  statValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
  revenueCard: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  revenueGradient: {
    padding: 24,
  },
  revenueContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  revenueLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    flex: 1,
  },
  revenueIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(67, 233, 123, 0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  revenueLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#43e97b',
    fontWeight: '600' as const,
  },
  revenueArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  viewAllButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  deliveryCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  deliveryCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  deliveryStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDotPending: {
    backgroundColor: '#f59e0b',
  },
  statusDotInTransit: {
    backgroundColor: '#3b82f6',
  },
  statusDotDelivered: {
    backgroundColor: '#10b981',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  deliveryMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  deliveryZone: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusInTransit: {
    backgroundColor: '#dbeafe',
  },
  statusDelivered: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  statusTextPending: {
    color: '#b45309',
  },
  statusTextInTransit: {
    color: '#1e40af',
  },
  statusTextDelivered: {
    color: '#065f46',
  },
  deliveryDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  deliveryFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  deliveryMessengerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  deliveryMessenger: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  deliveryTotal: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#667eea',
  },
  messengerContentContainer: {
    padding: 16,
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
  contactButtons: {
    flexDirection: 'row' as const,
    gap: 8,
    marginLeft: 'auto' as const,
  },
  callButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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

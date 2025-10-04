import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Users, Package, CheckCircle, Clock, Search, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDeliveries } from '@/contexts/DeliveryContext';
import { usePickups } from '@/contexts/PickupContext';
import Colors from '@/constants/colors';

type TabType = 'messengers' | 'schedulers' | 'packages';

interface MessengerStats {
  id: string;
  name: string;
  phone: string;
  age?: number;
  licenseType?: string;
  vehicleType?: string;
  totalDeliveries: number;
  deliveredPackages: number;
  inTransitPackages: number;
  pendingPackages: number;
  totalPickups: number;
  collectedPickups: number;
  scheduledPickups: number;
}

interface SchedulerStats {
  id: string;
  name: string;
  phone: string;
  totalScheduled: number;
  deliveredPackages: number;
  pendingPackages: number;
  totalPickups: number;
}

export default function ControlScreen() {
  const { credentials, user } = useAuth();
  const { deliveries } = useDeliveries();
  const { pickups } = usePickups();
  const [activeTab, setActiveTab] = useState<TabType>('messengers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  const messengerStats = useMemo<MessengerStats[]>(() => {
    const messengers = credentials.filter(c => c.role === 'messenger');
    
    return messengers.map(messenger => {
      const messengerDeliveries = deliveries.filter(d => d.messengerId === messenger.id);
      const messengerPickups = pickups.filter(p => p.messengerId === messenger.id);

      return {
        id: messenger.id,
        name: `${messenger.firstName} ${messenger.lastName}`,
        phone: messenger.phoneNumber,
        age: messenger.age,
        licenseType: messenger.licenseType,
        vehicleType: messenger.vehicleType,
        totalDeliveries: messengerDeliveries.length,
        deliveredPackages: messengerDeliveries.filter(d => d.status === 'delivered').length,
        inTransitPackages: messengerDeliveries.filter(d => d.status === 'in_transit').length,
        pendingPackages: messengerDeliveries.filter(d => d.status === 'pending').length,
        totalPickups: messengerPickups.length,
        collectedPickups: messengerPickups.filter(p => p.status === 'collected').length,
        scheduledPickups: messengerPickups.filter(p => p.status === 'scheduled').length,
      };
    });
  }, [credentials, deliveries, pickups]);

  const schedulerStats = useMemo<SchedulerStats[]>(() => {
    const schedulers = credentials.filter(c => c.role === 'scheduler');
    
    return schedulers.map(scheduler => {
      const schedulerDeliveries = deliveries.filter(d => {
        return true;
      });
      const schedulerPickups = pickups.filter(p => {
        return true;
      });

      return {
        id: scheduler.id,
        name: `${scheduler.firstName} ${scheduler.lastName}`,
        phone: scheduler.phoneNumber,
        totalScheduled: schedulerDeliveries.length + schedulerPickups.length,
        deliveredPackages: schedulerDeliveries.filter(d => d.status === 'delivered').length,
        pendingPackages: schedulerDeliveries.filter(d => d.status === 'pending' || d.status === 'in_transit').length,
        totalPickups: schedulerPickups.length,
      };
    });
  }, [credentials, deliveries, pickups]);

  const packageStats = useMemo(() => {
    const totalDeliveries = deliveries.length;
    const deliveredPackages = deliveries.filter(d => d.status === 'delivered').length;
    const inTransitPackages = deliveries.filter(d => d.status === 'in_transit').length;
    const pendingPackages = deliveries.filter(d => d.status === 'pending').length;
    
    const totalPickups = pickups.length;
    const collectedPickups = pickups.filter(p => p.status === 'collected').length;
    const scheduledPickups = pickups.filter(p => p.status === 'scheduled').length;

    return {
      totalDeliveries,
      deliveredPackages,
      inTransitPackages,
      pendingPackages,
      totalPickups,
      collectedPickups,
      scheduledPickups,
      totalPackages: totalDeliveries + totalPickups,
      completedPackages: deliveredPackages + collectedPickups,
    };
  }, [deliveries, pickups]);

  const filteredMessengers = useMemo(() => {
    if (!searchQuery) return messengerStats;
    const query = searchQuery.toLowerCase();
    return messengerStats.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.phone.includes(query)
    );
  }, [messengerStats, searchQuery]);

  const filteredSchedulers = useMemo(() => {
    if (!searchQuery) return schedulerStats;
    const query = searchQuery.toLowerCase();
    return schedulerStats.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.phone.includes(query)
    );
  }, [schedulerStats, searchQuery]);

  const renderMessengerCard = (messenger: MessengerStats) => (
    <View key={messenger.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Users color={Colors.light.primary} size={24} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>{messenger.name}</Text>
          <Text style={styles.cardSubtitle}>{messenger.phone}</Text>
          {messenger.age && (
            <Text style={styles.cardDetail}>Edad: {messenger.age} años</Text>
          )}
          {messenger.licenseType && (
            <Text style={styles.cardDetail}>Licencia: Tipo {messenger.licenseType}</Text>
          )}
          {messenger.vehicleType && (
            <Text style={styles.cardDetail}>
              Vehículo: {messenger.vehicleType === 'moto' ? 'Moto' : messenger.vehicleType === 'carro' ? 'Carro' : 'Camión'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Package color={Colors.light.primary} size={20} />
          <Text style={styles.statValue}>{messenger.totalDeliveries}</Text>
          <Text style={styles.statLabel}>Total Envíos</Text>
        </View>
        <View style={styles.statItem}>
          <CheckCircle color={Colors.light.success} size={20} />
          <Text style={styles.statValue}>{messenger.deliveredPackages}</Text>
          <Text style={styles.statLabel}>Entregados</Text>
        </View>
        <View style={styles.statItem}>
          <TrendingUp color={Colors.light.warning} size={20} />
          <Text style={styles.statValue}>{messenger.inTransitPackages}</Text>
          <Text style={styles.statLabel}>En Tránsito</Text>
        </View>
        <View style={styles.statItem}>
          <Clock color={Colors.light.textSecondary} size={20} />
          <Text style={styles.statValue}>{messenger.pendingPackages}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.pickupStats}>
        <Text style={styles.pickupTitle}>Recolecciones</Text>
        <View style={styles.pickupRow}>
          <Text style={styles.pickupText}>Total: {messenger.totalPickups}</Text>
          <Text style={styles.pickupText}>Recolectadas: {messenger.collectedPickups}</Text>
          <Text style={styles.pickupText}>Agendadas: {messenger.scheduledPickups}</Text>
        </View>
      </View>
    </View>
  );

  const renderSchedulerCard = (scheduler: SchedulerStats) => (
    <View key={scheduler.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: Colors.light.secondary + '20' }]}>
          <Users color={Colors.light.secondary} size={24} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>{scheduler.name}</Text>
          <Text style={styles.cardSubtitle}>{scheduler.phone}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Package color={Colors.light.primary} size={20} />
          <Text style={styles.statValue}>{scheduler.totalScheduled}</Text>
          <Text style={styles.statLabel}>Total Agendados</Text>
        </View>
        <View style={styles.statItem}>
          <CheckCircle color={Colors.light.success} size={20} />
          <Text style={styles.statValue}>{scheduler.deliveredPackages}</Text>
          <Text style={styles.statLabel}>Entregados</Text>
        </View>
        <View style={styles.statItem}>
          <Clock color={Colors.light.warning} size={20} />
          <Text style={styles.statValue}>{scheduler.pendingPackages}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statItem}>
          <Package color={Colors.light.secondary} size={20} />
          <Text style={styles.statValue}>{scheduler.totalPickups}</Text>
          <Text style={styles.statLabel}>Recolecciones</Text>
        </View>
      </View>
    </View>
  );

  const renderPackageStats = () => (
    <View style={styles.packageStatsContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen General</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{packageStats.totalPackages}</Text>
            <Text style={styles.summaryLabel}>Total Paquetes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.light.success }]}>
              {packageStats.completedPackages}
            </Text>
            <Text style={styles.summaryLabel}>Completados</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Envíos</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>{packageStats.totalDeliveries}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Entregados:</Text>
          <Text style={[styles.detailValue, { color: Colors.light.success }]}>
            {packageStats.deliveredPackages}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>En Tránsito:</Text>
          <Text style={[styles.detailValue, { color: Colors.light.warning }]}>
            {packageStats.inTransitPackages}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pendientes:</Text>
          <Text style={[styles.detailValue, { color: Colors.light.textSecondary }]}>
            {packageStats.pendingPackages}
          </Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Recolecciones</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>{packageStats.totalPickups}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Recolectadas:</Text>
          <Text style={[styles.detailValue, { color: Colors.light.success }]}>
            {packageStats.collectedPickups}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Agendadas:</Text>
          <Text style={[styles.detailValue, { color: Colors.light.warning }]}>
            {packageStats.scheduledPickups}
          </Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Tasa de Completación</Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${packageStats.totalPackages > 0 
                  ? (packageStats.completedPackages / packageStats.totalPackages) * 100 
                  : 0}%` 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {packageStats.totalPackages > 0 
            ? `${Math.round((packageStats.completedPackages / packageStats.totalPackages) * 100)}%` 
            : '0%'} completado
        </Text>
      </View>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>
            Solo los administradores pueden acceder a esta sección
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messengers' && styles.activeTab]}
          onPress={() => setActiveTab('messengers')}
        >
          <Users color={activeTab === 'messengers' ? Colors.light.primary : Colors.light.textSecondary} size={20} />
          <Text style={[styles.tabText, activeTab === 'messengers' && styles.activeTabText]}>
            Mensajeros
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedulers' && styles.activeTab]}
          onPress={() => setActiveTab('schedulers')}
        >
          <Users color={activeTab === 'schedulers' ? Colors.light.primary : Colors.light.textSecondary} size={20} />
          <Text style={[styles.tabText, activeTab === 'schedulers' && styles.activeTabText]}>
            Agendadores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'packages' && styles.activeTab]}
          onPress={() => setActiveTab('packages')}
        >
          <Package color={activeTab === 'packages' ? Colors.light.primary : Colors.light.textSecondary} size={20} />
          <Text style={[styles.tabText, activeTab === 'packages' && styles.activeTabText]}>
            Paquetes
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab !== 'packages' && (
        <View style={styles.searchContainer}>
          <Search color={Colors.light.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'messengers' && (
          <>
            {filteredMessengers.length === 0 ? (
              <View style={styles.emptyState}>
                <Users color={Colors.light.textSecondary} size={48} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No se encontraron mensajeros' : 'No hay mensajeros registrados'}
                </Text>
              </View>
            ) : (
              filteredMessengers.map(renderMessengerCard)
            )}
          </>
        )}

        {activeTab === 'schedulers' && (
          <>
            {filteredSchedulers.length === 0 ? (
              <View style={styles.emptyState}>
                <Users color={Colors.light.textSecondary} size={48} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No se encontraron agendadores' : 'No hay agendadores registrados'}
                </Text>
              </View>
            ) : (
              filteredSchedulers.map(renderSchedulerCard)
            )}
          </>
        )}

        {activeTab === 'packages' && renderPackageStats()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  accessDeniedText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: Colors.light.primary,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  pickupStats: {
    gap: 8,
  },
  pickupTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  pickupRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  pickupText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  packageStatsContainer: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center' as const,
  },
  detailCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  progressCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.success,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 48,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
  },
});

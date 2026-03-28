import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Bell, User, Users, AlertCircle, FileText, Camera } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDeliveries } from '@/contexts/DeliveryContext';
import { router } from 'expo-router';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function ControlScreen() {
  const { credentials, user } = useAuth();
  const { deliveries } = useDeliveries();

  const isAdmin = user?.role === 'admin';

  const todayDeliveries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deliveries.filter(d => {
      const createdAt = new Date(d.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      return createdAt.getTime() === today.getTime() && d.status !== 'delivered';
    });
  }, [deliveries]);

  const last7DaysClients = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const uniqueClients = new Set<string>();
    deliveries.forEach(d => {
      if (new Date(d.createdAt) >= sevenDaysAgo) {
        uniqueClients.add(d.sender.phone);
        uniqueClients.add(d.receiver.phone);
      }
    });
    return uniqueClients.size;
  }, [deliveries]);

  const pendingApprovals = useMemo(() => {
    return credentials.filter(c => c.role === 'messenger').length;
  }, [credentials]);

  const zonePerformance = useMemo(() => {
    const zones = ['Norte', 'Sur', 'Este', 'Oeste'];
    return zones.map(zone => {
      const zoneDeliveries = deliveries.filter(d => d.zone === zone.toLowerCase());
      const completed = zoneDeliveries.filter(d => d.status === 'delivered').length;
      const percentage = zoneDeliveries.length > 0 ? (completed / zoneDeliveries.length) * 100 : 0;
      return { zone, percentage, total: zoneDeliveries.length };
    });
  }, [deliveries]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.headerTitle}>Mensajería PRO Admin</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell color="#FFFFFF" size={22} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>12</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileButton}>
          <User color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsGrid = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statCardTitle}>Estado General</Text>
        <Text style={styles.statMainValue}>{todayDeliveries.length.toLocaleString()}</Text>
        <Text style={styles.statMainLabel}>Envíos Activos Hoy</Text>
        <View style={styles.statMetrics}>
          <View>
            <Text style={styles.metricValue}>5/23%</Text>
            <Text style={styles.metricLabel}>Quincenal</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>90%</Text>
            <Text style={styles.metricLabel}>Delta</Text>
          </View>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statCardTitle}>Rendimiento por Zona</Text>
        <View style={styles.barChartContainer}>
          {zonePerformance.slice(0, 3).map((zone, index) => (
            <View key={zone.zone} style={styles.barItem}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { height: `${zone.percentage}%` }]} />
              </View>
              <Text style={styles.barLabel}>{zone.zone}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.statCard, styles.statCardWide]}>
        <Text style={styles.statCardTitle}>Rendimiento por Zona</Text>
        <View style={styles.lineChartContainer}>
          <View style={styles.lineChart}>
            <View style={styles.lineChartLine} />
          </View>
          <View style={styles.lineChartLabels}>
            <Text style={styles.lineChartLabel}>9900</Text>
            <Text style={styles.lineChartLabel}>Sur</Text>
            <Text style={styles.lineChartLabel}>7500</Text>
          </View>
        </View>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statCardTitle}>Nuevos Clientes</Text>
        <Text style={styles.statMainValue}>{last7DaysClients}</Text>
        <Text style={styles.statMainLabel}>Últimos 7 Días</Text>
        <Text style={styles.statBadge}>(1)</Text>
      </View>
    </View>
  );

  const renderTasksSection = () => (
    <View style={styles.tasksSection}>
      <Text style={styles.tasksTitle}>Tareas Pendientes</Text>
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/new-delivery')}
      >
        <Text style={styles.createButtonText}>Crear Nuevo Envío</Text>
      </TouchableOpacity>

      <View style={styles.tasksList}>
        <TouchableOpacity style={styles.taskItem}>
          <View style={styles.taskIconContainer}>
            <Users color={Colors.light.primary} size={20} />
          </View>
          <Text style={styles.taskText}>Aprobar nuevos conductors ({pendingApprovals})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.taskItem}>
          <View style={styles.taskIconContainer}>
            <AlertCircle color={Colors.light.primary} size={20} />
          </View>
          <Text style={styles.taskText}>Revisar incidencias (1)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.taskItem}>
          <View style={styles.taskIconContainer}>
            <FileText color={Colors.light.primary} size={20} />
          </View>
          <Text style={styles.taskText}>Generar reporte semanal (1)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.fab}>
        <Camera color="#FFFFFF" size={24} />
      </TouchableOpacity>
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
      {renderHeader()}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.pageTitle}>Panel de Control (Admin)</Text>
        {renderStatsGrid()}
        {renderTasksSection()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EDF2',
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
  header: {
    backgroundColor: '#2C4A7C',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F97316',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  notificationButton: {
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statCardWide: {
    width: width - 32,
  },
  statCardTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 12,
  },
  statMainValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  statMainLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statMetrics: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statBadge: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  barChartContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-around' as const,
    height: 80,
  },
  barItem: {
    alignItems: 'center' as const,
    gap: 4,
  },
  barWrapper: {
    height: 60,
    width: 28,
    justifyContent: 'flex-end' as const,
  },
  bar: {
    width: 28,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  lineChartContainer: {
    height: 80,
  },
  lineChart: {
    height: 60,
    justifyContent: 'center' as const,
    paddingHorizontal: 8,
  },
  lineChartLine: {
    height: 2,
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  lineChartLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  lineChartLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  tasksSection: {
    position: 'relative' as const,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  tasksList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  taskIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  taskText: {
    fontSize: 14,
    color: '#4B5563',
  },
  fab: {
    position: 'absolute' as const,
    right: 16,
    bottom: -60,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2C4A7C',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

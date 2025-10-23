import { useFilteredDeliveries, useDeliveries } from '@/contexts/DeliveryContext';
import { useAuth, type Credential } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { STATUS_LABELS, ZONE_LABELS, type DeliveryStatus, type Zone, type Delivery } from '@/types/delivery';
import { useState, useMemo } from 'react';
import { Modal } from 'react-native';
import { Search, Filter, Package, Printer, CheckCircle, UserPlus, UserCog, Phone, MessageCircle, XCircle, Calendar } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Linking } from 'react-native';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';

export default function DeliveriesScreen() {
  const router = useRouter();
  const { user, credentials } = useAuth();
  const isMessenger = user?.role === 'messenger';
  const canAssign = user?.role === 'admin' || user?.role === 'scheduler';
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | undefined>(undefined);
  const [zoneFilter, setZoneFilter] = useState<Zone | undefined>(undefined);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showNotDeliveredModal, setShowNotDeliveredModal] = useState<boolean>(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [notDeliveredReason, setNotDeliveredReason] = useState<string>('');

  const { updateStatus, updateDelivery } = useDeliveries();
  const allDeliveries = useFilteredDeliveries(statusFilter, zoneFilter, search);
  
  const deliveries = useMemo(() => {
    if (isMessenger && user) {
      return allDeliveries.filter(d => d.messengerId === user.id);
    }
    return allDeliveries;
  }, [allDeliveries, isMessenger, user]);

  const handleMarkAsDelivered = async (delivery: Delivery) => {
    if (delivery.status === 'delivered') {
      Alert.alert('Información', 'Este envío ya está marcado como entregado.');
      return;
    }

    Alert.alert(
      'Confirmar Entrega',
      `¿Marcar el envío #${delivery.id.slice(-6)} como entregado?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await updateStatus(delivery.id, 'delivered');
              Alert.alert('Éxito', 'El envío ha sido marcado como entregado.');
            } catch (error) {
              console.error('Error updating delivery status:', error);
              Alert.alert('Error', 'No se pudo actualizar el estado del envío.');
            }
          },
        },
      ]
    );
  };

  const handleNotDelivered = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setNotDeliveredReason('');
    setShowNotDeliveredModal(true);
  };

  const handleConfirmNotDelivered = async () => {
    if (!selectedDelivery) return;

    if (!notDeliveredReason.trim()) {
      Alert.alert('Campo Requerido', 'Por favor ingresa el motivo por el cual no se entregó el paquete.');
      return;
    }

    try {
      await updateDelivery(selectedDelivery.id, {
        status: 'not_delivered',
        notDeliveredReason: notDeliveredReason.trim(),
      });
      setShowNotDeliveredModal(false);
      setSelectedDelivery(null);
      setNotDeliveredReason('');
      Alert.alert('Actualizado', 'El envío ha sido marcado como no entregado.');
    } catch (error) {
      console.error('Error updating delivery:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del envío.');
    }
  };

  const handleReschedule = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedDelivery) return;

    try {
      await updateStatus(selectedDelivery.id, 'rescheduled');
      setShowRescheduleModal(false);
      setSelectedDelivery(null);
      Alert.alert('Actualizado', 'El envío ha sido reprogramado.');
    } catch (error) {
      console.error('Error rescheduling delivery:', error);
      Alert.alert('Error', 'No se pudo reprogramar el envío.');
    }
  };

  const generateReceiptHTML = (delivery: Delivery): string => {
    const total = delivery.packageCost + delivery.shippingCost;
    const date = new Date(delivery.createdAt).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: 5.5in 8.5in;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              background: white;
              color: #1a1a1a;
              width: 5.5in;
              min-height: 8.5in;
              margin: 0 auto;
            }
            .receipt {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 16px;
              text-align: center;
            }
            .header h1 {
              font-size: 20px;
              margin-bottom: 4px;
              font-weight: 700;
            }
            .header p {
              font-size: 11px;
              opacity: 0.95;
            }
            .content {
              padding: 16px;
              flex: 1;
            }
            .receipt-id {
              text-align: center;
              padding: 12px;
              background: #f8fafc;
              border-radius: 6px;
              margin-bottom: 16px;
              border: 2px dashed #2563eb;
            }
            .receipt-id strong {
              font-size: 18px;
              color: #2563eb;
              font-weight: 700;
            }
            .section {
              margin-bottom: 16px;
            }
            .section-title {
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
              font-weight: 600;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              gap: 8px;
            }
            .info-box {
              flex: 1;
              background: #f8fafc;
              padding: 10px;
              border-radius: 6px;
              border-left: 3px solid #2563eb;
            }
            .info-label {
              font-size: 9px;
              color: #64748b;
              margin-bottom: 4px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .info-value {
              font-size: 12px;
              color: #1a1a1a;
              font-weight: 600;
              line-height: 1.3;
            }
            .info-detail {
              font-size: 10px;
              color: #64748b;
              margin-top: 3px;
              line-height: 1.3;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
            }
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
            .status-in_transit {
              background: #dbeafe;
              color: #1e40af;
            }
            .status-delivered {
              background: #d1fae5;
              color: #065f46;
            }
            .cost-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            .cost-table tr {
              border-bottom: 1px solid #e2e8f0;
            }
            .cost-table td {
              padding: 8px 4px;
              font-size: 11px;
            }
            .cost-table td:first-child {
              color: #64748b;
            }
            .cost-table td:last-child {
              text-align: right;
              font-weight: 600;
              color: #1a1a1a;
            }
            .cost-table .total-row {
              background: #f8fafc;
              font-weight: 700;
              font-size: 14px;
              color: #2563eb;
            }
            .cost-table .total-row td {
              padding: 10px 4px;
            }
            .footer {
              margin-top: 16px;
              padding-top: 12px;
              border-top: 2px dashed #cbd5e1;
              text-align: center;
              color: #64748b;
              font-size: 9px;
            }
            .description-box {
              background: #fef9e7;
              padding: 10px;
              border-radius: 6px;
              border-left: 3px solid #f59e0b;
            }
            .description-box .info-label {
              color: #92400e;
            }
            .description-box .info-value {
              color: #78350f;
              font-weight: 500;
              font-size: 11px;
            }
            .delivery-info {
              display: flex;
              gap: 8px;
              margin-bottom: 12px;
            }
            @media print {
              body {
                width: 5.5in;
                height: 8.5in;
              }
              .receipt {
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>📦 BOLETA DE ENVÍO</h1>
              <p>Sistema de Gestión de Paquetes</p>
            </div>
            
            <div class="content">
              <div class="receipt-id">
                <strong>#${delivery.id}</strong>
              </div>

              <div class="section">
                <div class="section-title">Estado y Fecha</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="status-badge status-${delivery.status}">
                    ${STATUS_LABELS[delivery.status]}
                  </span>
                  <span style="font-size: 10px; color: #64748b;">${date}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Remitente</div>
                <div class="info-box">
                  <div class="info-value">${delivery.sender.name}</div>
                  <div class="info-detail">📞 ${delivery.sender.phone}</div>
                  <div class="info-detail">📍 ${delivery.sender.address}</div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Destinatario</div>
                <div class="info-box">
                  <div class="info-value">${delivery.receiver.name}</div>
                  <div class="info-detail">📞 ${delivery.receiver.phone}</div>
                  <div class="info-detail">📍 ${delivery.receiver.address}</div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Información de Entrega</div>
                <div class="delivery-info">
                  <div class="info-box">
                    <div class="info-label">Mensajero</div>
                    <div class="info-value">${delivery.messenger}</div>
                  </div>
                  <div class="info-box">
                    <div class="info-label">Zona</div>
                    <div class="info-value">${ZONE_LABELS[delivery.zone]}</div>
                  </div>
                </div>
              </div>

              ${delivery.description ? `
                <div class="section">
                  <div class="section-title">Descripción del Paquete</div>
                  <div class="description-box">
                    <div class="info-value">${delivery.description}</div>
                  </div>
                </div>
              ` : ''}

              <div class="section">
                <div class="section-title">Desglose de Costos</div>
                <table class="cost-table">
                  <tr>
                    <td>Costo del Paquete</td>
                    <td>Q ${delivery.packageCost.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Costo de Envío (${ZONE_LABELS[delivery.zone]})</td>
                    <td>Q ${delivery.shippingCost.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td>TOTAL A PAGAR</td>
                    <td>Q ${total.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <div class="footer">
                <p style="font-weight: 600; margin-bottom: 4px;">Gracias por confiar en nuestro servicio</p>
                <p>Este documento es una boleta oficial de envío</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleReassign = (delivery: Delivery) => {
    router.push({
      pathname: '/assign-delivery',
      params: { deliveryId: delivery.id }
    });
  };

  const handleCallReceiver = (phoneNumber: string) => {
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

  const handleWhatsAppReceiver = (phoneNumber: string) => {
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

  const getMessengerPhone = (messengerId?: string): string | null => {
    if (!messengerId) return null;
    const messenger = credentials.find(c => c.id === messengerId);
    return messenger?.phoneNumber || null;
  };

  const handlePrintReceipt = async (delivery: Delivery) => {
    try {
      const html = generateReceiptHTML(delivery);
      
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        await Print.printAsync({
          html,
        });
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      Alert.alert('Error', 'No se pudo imprimir la boleta. Por favor, intenta de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      {canAssign && (
        <View style={styles.assignButtonContainer}>
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => router.push('/assign-delivery')}
          >
            <UserPlus color="#FFFFFF" size={20} />
            <Text style={styles.assignButtonText}>Asignar Paquete</Text>
          </TouchableOpacity>
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
              {(['pending', 'in_transit', 'delivered'] as DeliveryStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.chip, statusFilter === status && styles.chipActive]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[styles.chipText, statusFilter === status && styles.chipTextActive]}>
                    {STATUS_LABELS[status]}
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
        {deliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <Package color={Colors.light.muted} size={64} />
            <Text style={styles.emptyText}>No se encontraron envíos</Text>
            <Text style={styles.emptySubtext}>
              {search || statusFilter || zoneFilter
                ? 'Intenta ajustar los filtros'
                : 'Crea tu primer envío para comenzar'}
            </Text>
          </View>
        ) : (
          deliveries.map((delivery) => (
            <View key={delivery.id} style={styles.deliveryCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.deliveryId}>#{delivery.id.slice(-6)}</Text>
                  <View style={[
                    styles.statusBadge,
                    delivery.status === 'delivered' && styles.statusDelivered,
                    delivery.status === 'in_transit' && styles.statusInTransit,
                    delivery.status === 'pending' && styles.statusPending,
                  ]}>
                    <Text style={styles.statusText}>{STATUS_LABELS[delivery.status]}</Text>
                  </View>
                </View>
                <Text style={styles.zoneBadge}>{ZONE_LABELS[delivery.zone]}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.personSection}>
                  <View style={styles.personHeader}>
                    <View style={styles.personInfo}>
                      <Text style={styles.personLabel}>De:</Text>
                      <Text style={styles.personName}>{delivery.sender.name}</Text>
                      <Text style={styles.personDetail}>{delivery.sender.phone}</Text>
                    </View>
                    <View style={styles.contactButtons}>
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => handleWhatsAppReceiver(delivery.sender.phone)}
                      >
                        <MessageCircle color="#FFFFFF" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCallReceiver(delivery.sender.phone)}
                      >
                        <Phone color="#FFFFFF" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.arrowContainer}>
                  <View style={styles.arrow} />
                </View>

                <View style={styles.personSection}>
                  <View style={styles.personHeader}>
                    <View style={styles.personInfo}>
                      <Text style={styles.personLabel}>Para:</Text>
                      <Text style={styles.personName}>{delivery.receiver.name}</Text>
                      <Text style={styles.personDetail}>{delivery.receiver.phone}</Text>
                    </View>
                    <View style={styles.contactButtons}>
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => handleWhatsAppReceiver(delivery.receiver.phone)}
                      >
                        <MessageCircle color="#FFFFFF" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCallReceiver(delivery.receiver.phone)}
                      >
                        <Phone color="#FFFFFF" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.messengerInfo}>
                  <Text style={styles.messengerLabel}>Mensajero:</Text>
                  <View style={styles.messengerNameRow}>
                    <Text style={styles.messengerName}>{delivery.messenger}</Text>
                    {!isMessenger && getMessengerPhone(delivery.messengerId) && (
                      <TouchableOpacity
                        style={styles.messengerWhatsappButton}
                        onPress={() => handleWhatsAppReceiver(getMessengerPhone(delivery.messengerId)!)}
                      >
                        <MessageCircle color="#FFFFFF" size={16} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.costInfo}>
                  <Text style={styles.costLabel}>Total:</Text>
                  <Text style={styles.costValue}>
                    Q {(delivery.packageCost + delivery.shippingCost).toFixed(2)}
                  </Text>
                </View>
              </View>

              {delivery.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>{delivery.description}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                {isMessenger ? (
                  delivery.status === 'delivered' ? (
                    <View style={styles.deliveredStatusContainer}>
                      <CheckCircle color="#10B981" size={24} />
                      <Text style={styles.deliveredStatusText}>Paquete Entregado</Text>
                    </View>
                  ) : delivery.status === 'not_delivered' ? (
                    <View style={styles.notDeliveredStatusContainer}>
                      <XCircle color="#EF4444" size={24} />
                      <View style={styles.notDeliveredInfo}>
                        <Text style={styles.notDeliveredStatusText}>No Entregado</Text>
                        {delivery.notDeliveredReason && (
                          <Text style={styles.notDeliveredReason}>Motivo: {delivery.notDeliveredReason}</Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.messengerActionsRow}>
                      <TouchableOpacity
                        style={styles.deliveredButton}
                        onPress={() => handleMarkAsDelivered(delivery)}
                      >
                        <CheckCircle color="#FFFFFF" size={18} />
                        <Text style={styles.messengerActionText}>Entregado</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rescheduleButton}
                        onPress={() => handleReschedule(delivery)}
                      >
                        <Calendar color="#FFFFFF" size={18} />
                        <Text style={styles.messengerActionText}>Reprogramar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.notDeliveredButton}
                        onPress={() => handleNotDelivered(delivery)}
                      >
                        <XCircle color="#FFFFFF" size={18} />
                        <Text style={styles.messengerActionText}>No Entregado</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <>
                    {canAssign && delivery.status !== 'delivered' && (
                      <TouchableOpacity
                        style={styles.reassignButton}
                        onPress={() => handleReassign(delivery)}
                      >
                        <UserCog color="#FFFFFF" size={18} />
                        <Text style={styles.reassignButtonText}>Reasignar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.printButton,
                        delivery.status !== 'delivered' && styles.printButtonSecondary
                      ]}
                      onPress={() => handlePrintReceipt(delivery)}
                    >
                      <Printer color="#FFFFFF" size={18} />
                      <Text style={styles.printButtonText}>Imprimir</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showNotDeliveredModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotDeliveredModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <XCircle color="#EF4444" size={32} />
              <Text style={styles.modalTitle}>No Entregado</Text>
              <Text style={styles.modalSubtitle}>¿Por qué no se pudo entregar el paquete?</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Motivo</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ej: Destinatario no se encontraba en casa, dirección incorrecta, etc."
                value={notDeliveredReason}
                onChangeText={setNotDeliveredReason}
                placeholderTextColor={Colors.light.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNotDeliveredModal(false);
                  setNotDeliveredReason('');
                  setSelectedDelivery(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmNotDelivered}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Calendar color="#F59E0B" size={32} />
              <Text style={styles.modalTitle}>Reprogramar Envío</Text>
              <Text style={styles.modalSubtitle}>¿Deseas reprogramar este envío para otra fecha?</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRescheduleModal(false);
                  setSelectedDelivery(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmReschedule}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  deliveryId: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  zoneBadge: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  cardBody: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  personSection: {
    flex: 1,
  },
  personHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  personInfo: {
    flex: 1,
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
  personLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  personDetail: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  arrowContainer: {
    paddingHorizontal: 12,
  },
  arrow: {
    width: 24,
    height: 2,
    backgroundColor: Colors.light.border,
  },
  cardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  messengerInfo: {
    flex: 1,
  },
  messengerLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 2,
  },
  messengerNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  messengerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  messengerWhatsappButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#25D366',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  costInfo: {
    alignItems: 'flex-end' as const,
  },
  costLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 2,
  },
  costValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 16,
  },
  deliveredButtonFull: {
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
  deliveredButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  deliveredStatusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#D1FAE5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
  },
  deliveredStatusText: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  printButtonSecondary: {
    backgroundColor: '#6B7280',
  },
  printButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  reassignButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  reassignButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  assignButtonContainer: {
    padding: 16,
    paddingBottom: 0,
    backgroundColor: Colors.light.card,
  },
  assignButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.light.secondary,
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
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  messengerActionsRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  deliveredButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  rescheduleButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notDeliveredButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  messengerActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  notDeliveredStatusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  notDeliveredInfo: {
    flex: 1,
  },
  notDeliveredStatusText: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  notDeliveredReason: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center' as const,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row' as const,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center' as const,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

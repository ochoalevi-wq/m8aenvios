import { useDeliveries } from '@/contexts/DeliveryContext';
import { usePickups } from '@/contexts/PickupContext';
import { useAvailableMessengers } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { ZONE_LABELS, type Zone } from '@/types/delivery';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Package, User, MapPin, DollarSign, Truck, ChevronDown, Calendar, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';

export default function NewDeliveryScreen() {
  const router = useRouter();
  const { addDelivery } = useDeliveries();
  const { addPickup } = usePickups();
  const availableMessengers = useAvailableMessengers();
  const { colors } = useTheme();

  const [needsPickup, setNeedsPickup] = useState<boolean>(false);
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [packageCount, setPackageCount] = useState<string>('1');
  const [pickupNotes, setPickupNotes] = useState<string>('');

  const [senderName, setSenderName] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [senderAddress, setSenderAddress] = useState<string>('');

  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [receiverAddress, setReceiverAddress] = useState<string>('');

  const [messenger, setMessenger] = useState<string>('Sin asignar');
  const [showMessengerPicker, setShowMessengerPicker] = useState<boolean>(false);
  const [zone, setZone] = useState<Zone>('zona_1');
  const [packageCost, setPackageCost] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = async () => {
    if (!senderName || !senderPhone || !senderAddress) {
      Alert.alert('Error', 'Por favor completa los datos del remitente');
      return;
    }

    if (needsPickup) {
      if (!pickupDate || !pickupTime) {
        Alert.alert('Error', 'Por favor completa la fecha y hora de recolección');
        return;
      }
      if (!packageCount || parseInt(packageCount) <= 0) {
        Alert.alert('Error', 'Por favor ingresa una cantidad válida de paquetes');
        return;
      }
    }

    if (!receiverName || !receiverPhone || !receiverAddress) {
      Alert.alert('Error', 'Por favor completa los datos del destinatario');
      return;
    }

    if (!packageCost || parseFloat(packageCost) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un costo de paquete válido');
      return;
    }

    if (!shippingCost || parseFloat(shippingCost) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un costo de envío válido');
      return;
    }

    try {
      if (needsPickup) {
        await addPickup({
          sender: {
            name: senderName,
            phone: senderPhone,
            address: senderAddress,
          },
          messenger,
          zone,
          scheduledDate: pickupDate,
          scheduledTime: pickupTime,
          status: 'scheduled',
          notes: pickupNotes || undefined,
          packageCount: parseInt(packageCount),
        });
      }

      await addDelivery({
        sender: {
          name: senderName,
          phone: senderPhone,
          address: senderAddress,
        },
        receiver: {
          name: receiverName,
          phone: receiverPhone,
          address: receiverAddress,
        },
        messenger,
        zone,
        packageCost: parseFloat(packageCost),
        shippingCost: parseFloat(shippingCost),
        status: 'pending',
        description: description || undefined,
      });

      setNeedsPickup(false);
      setPickupDate('');
      setPickupTime('');
      setPackageCount('1');
      setPickupNotes('');
      setSenderName('');
      setSenderPhone('');
      setSenderAddress('');
      setReceiverName('');
      setReceiverPhone('');
      setReceiverAddress('');
      setMessenger('Sin asignar');
      setZone('zona_1');
      setPackageCost('');
      setShippingCost('');
      setDescription('');

      Alert.alert(
        'Éxito',
        needsPickup ? 'Envío y recolección creados correctamente' : 'Envío creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating delivery:', error);
      Alert.alert('Error', 'No se pudo crear el envío');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.pickupToggleContainer}>
            <View style={styles.pickupToggleInfo}>
              <Text style={[styles.pickupToggleTitle, { color: colors.text }]}>¿Requiere Recolección?</Text>
              <Text style={[styles.pickupToggleSubtitle, { color: colors.muted }]}>
                Programa la recolección del paquete
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, needsPickup && { backgroundColor: colors.primary }]}
              onPress={() => setNeedsPickup(!needsPickup)}
            >
              <View style={[styles.toggleCircle, needsPickup && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {needsPickup && (
          <View style={[styles.section, styles.pickupSection]}>
            <View style={styles.sectionHeader}>
              <Calendar color={colors.warning} size={24} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Detalles de Recolección</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Fecha de Recolección</Text>
              <View style={[styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Calendar color={colors.muted} size={20} />
                <TextInput
                  style={[styles.inputWithIconText, { color: colors.text }]}
                  value={pickupDate}
                  onChangeText={setPickupDate}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Hora de Recolección</Text>
              <View style={[styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Clock color={colors.muted} size={20} />
                <TextInput
                  style={[styles.inputWithIconText, { color: colors.text }]}
                  value={pickupTime}
                  onChangeText={setPickupTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Cantidad de Paquetes</Text>
              <View style={[styles.inputWithIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Package color={colors.muted} size={20} />
                <TextInput
                  style={[styles.inputWithIconText, { color: colors.text }]}
                  value={packageCount}
                  onChangeText={setPackageCount}
                  placeholder="1"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notas (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={pickupNotes}
                onChangeText={setPickupNotes}
                placeholder="Instrucciones especiales para la recolección..."
                multiline
                numberOfLines={2}
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User color={Colors.light.primary} size={24} />
            <Text style={styles.sectionTitle}>Remitente</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={senderName}
              onChangeText={setSenderName}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={Colors.light.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phonePrefix}>+502</Text>
              <TextInput
                style={styles.phoneInput}
                value={senderPhone}
                onChangeText={setSenderPhone}
                placeholder="Ej: 5555-5555"
                keyboardType="phone-pad"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={senderAddress}
              onChangeText={setSenderAddress}
              placeholder="Dirección completa"
              multiline
              numberOfLines={2}
              placeholderTextColor={Colors.light.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color={Colors.light.secondary} size={24} />
            <Text style={styles.sectionTitle}>Destinatario</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Ej: María López"
              placeholderTextColor={Colors.light.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phonePrefix}>+502</Text>
              <TextInput
                style={styles.phoneInput}
                value={receiverPhone}
                onChangeText={setReceiverPhone}
                placeholder="Ej: 5555-5555"
                keyboardType="phone-pad"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={receiverAddress}
              onChangeText={setReceiverAddress}
              placeholder="Dirección completa"
              multiline
              numberOfLines={2}
              placeholderTextColor={Colors.light.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={Colors.light.success} size={24} />
            <Text style={styles.sectionTitle}>Detalles del Envío</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mensajero (Opcional)</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowMessengerPicker(true)}
            >
              <Truck color={Colors.light.muted} size={20} />
              <Text style={[styles.pickerButtonText, messenger === 'Sin asignar' && styles.pickerButtonTextPlaceholder]}>
                {messenger}
              </Text>
              <ChevronDown color={Colors.light.muted} size={20} />
            </TouchableOpacity>
            <Text style={styles.helperText}>
              {availableMessengers.length > 0 
                ? 'Selecciona un mensajero disponible o déjalo sin asignar'
                : 'No hay mensajeros disponibles en este momento'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zona de Entrega</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneChips}>
              {(['zona_1', 'zona_2', 'zona_3', 'zona_4', 'zona_5'] as Zone[]).map((z) => (
                <TouchableOpacity
                  key={z}
                  style={[styles.zoneChip, zone === z && styles.zoneChipActive]}
                  onPress={() => setZone(z)}
                >
                  <Text style={[styles.zoneChipText, zone === z && styles.zoneChipTextActive]}>
                    {ZONE_LABELS[z]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Costo de Envío</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign color={Colors.light.muted} size={20} />
              <TextInput
                style={styles.inputWithIconText}
                value={shippingCost}
                onChangeText={setShippingCost}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Costo del Paquete</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign color={Colors.light.muted} size={20} />
              <TextInput
                style={styles.inputWithIconText}
                value={packageCost}
                onChangeText={setPackageCost}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detalles adicionales del paquete..."
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.light.muted}
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de Costos</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Costo del Paquete:</Text>
            <Text style={styles.summaryValue}>Q {packageCost || '0.00'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Costo de Envío ({ZONE_LABELS[zone]}):</Text>
            <Text style={styles.summaryValue}>Q {shippingCost || '0.00'}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total:</Text>
            <Text style={styles.summaryTotalValue}>
              Q {(parseFloat(packageCost || '0') + parseFloat(shippingCost || '0')).toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Crear Envío</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showMessengerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessengerPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessengerPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Mensajero</Text>
              <TouchableOpacity onPress={() => setShowMessengerPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messengerList}>
              <TouchableOpacity
                style={[styles.messengerItem, messenger === 'Sin asignar' && styles.messengerItemSelected]}
                onPress={() => {
                  setMessenger('Sin asignar');
                  setShowMessengerPicker(false);
                }}
              >
                <View style={styles.messengerInfo}>
                  <Text style={[styles.messengerName, messenger === 'Sin asignar' && styles.messengerNameSelected]}>
                    Sin asignar
                  </Text>
                  <Text style={styles.messengerPhone}>Asignar después</Text>
                </View>
                {messenger === 'Sin asignar' && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {availableMessengers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.messengerItem, messenger === m.name && styles.messengerItemSelected]}
                  onPress={() => {
                    setMessenger(m.name);
                    setShowMessengerPicker(false);
                  }}
                >
                  <View style={styles.messengerInfo}>
                    <Text style={[styles.messengerName, messenger === m.name && styles.messengerNameSelected]}>
                      {m.name}
                    </Text>
                    <Text style={styles.messengerPhone}>{m.phone}</Text>
                  </View>
                  {messenger === m.name && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {availableMessengers.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No hay mensajeros disponibles</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  pickupToggleContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pickupToggleInfo: {
    flex: 1,
  },
  pickupToggleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  pickupToggleSubtitle: {
    fontSize: 13,
  },
  toggleButton: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.border,
    padding: 2,
    justifyContent: 'center' as const,
  },
  toggleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end' as const,
  },
  pickupSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.warning,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  inputWithIcon: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  inputWithIconText: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.light.text,
  },
  zoneChips: {
    flexDirection: 'row' as const,
  },
  zoneChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center' as const,
  },
  zoneChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  zoneChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  zoneChipTextActive: {
    color: '#FFFFFF',
  },

  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  summaryTotalValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center' as const,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  phoneInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingLeft: 14,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerButtonTextPlaceholder: {
    color: Colors.light.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.light.muted,
    fontWeight: '600' as const,
  },
  messengerList: {
    padding: 16,
  },
  messengerItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  messengerItemSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.card,
  },
  messengerInfo: {
    flex: 1,
  },
  messengerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  messengerNameSelected: {
    color: Colors.light.primary,
  },
  messengerPhone: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center' as const,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
});

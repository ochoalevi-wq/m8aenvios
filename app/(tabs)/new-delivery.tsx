import { useDeliveries } from '@/contexts/DeliveryContext';
import Colors from '@/constants/colors';
import { ZONE_LABELS, type Zone } from '@/types/delivery';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Package, User, MapPin, DollarSign, Truck } from 'lucide-react-native';
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
} from 'react-native';

export default function NewDeliveryScreen() {
  const router = useRouter();
  const { addDelivery } = useDeliveries();

  const [senderName, setSenderName] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [senderAddress, setSenderAddress] = useState<string>('');

  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [receiverAddress, setReceiverAddress] = useState<string>('');

  const [messenger, setMessenger] = useState<string>('Sin asignar');
  const [zone, setZone] = useState<Zone>('zona_1');
  const [packageCost, setPackageCost] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = async () => {
    if (!senderName || !senderPhone || !senderAddress) {
      Alert.alert('Error', 'Por favor completa los datos del remitente');
      return;
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

      Alert.alert('Éxito', 'Envío creado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
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
            <View style={styles.inputWithIcon}>
              <Truck color={Colors.light.muted} size={20} />
              <TextInput
                style={styles.inputWithIconText}
                value={messenger}
                onChangeText={setMessenger}
                placeholder="Sin asignar (se puede asignar después)"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
            <Text style={styles.helperText}>
              Puedes dejar este campo vacío y asignar el mensajero después
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
    </KeyboardAvoidingView>
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
    marginBottom: 4,
  },
  zoneChipTextActive: {
    color: '#FFFFFF',
  },
  zoneChipCost: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  zoneChipCostActive: {
    color: '#FFFFFF',
    opacity: 0.9,
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
});

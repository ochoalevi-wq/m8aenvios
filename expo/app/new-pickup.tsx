import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { usePickups } from '@/contexts/PickupContext';
import { useMessengers } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { MapPin, User, Phone, Building2, DollarSign, Package } from 'lucide-react-native';

export default function NewPickupScreen() {
  const router = useRouter();
  const { addPickup } = usePickups();
  const messengers = useMessengers();

  const [storeName, setStoreName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [pickupOnly, setPickupOnly] = useState<boolean>(false);
  const [cost, setCost] = useState<string>('');
  const [selectedMessenger, setSelectedMessenger] = useState<string>('');

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la tienda u empresa.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Por favor ingresa la dirección.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Por favor ingresa el número de teléfono.');
      return;
    }
    if (!cost.trim()) {
      Alert.alert('Error', 'Por favor ingresa el costo.');
      return;
    }

    if (!selectedMessenger) {
      Alert.alert('Error', 'Por favor selecciona un mensajero.');
      return;
    }

    try {
      const messenger = messengers.find(m => m.id === selectedMessenger);
      
      await addPickup({
        sender: {
          name: storeName.trim(),
          phone: phoneNumber.trim(),
          address: address.trim(),
        },
        messenger: messenger?.name || 'Sin asignar',
        messengerId: selectedMessenger,
        zone: 'zona_1',
        scheduledDate: new Date().toISOString(),
        scheduledTime: new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
        status: 'scheduled',
        packageCount: 1,
        pickupOnly,
        cost: parseFloat(cost),
      });

      setStoreName('');
      setAddress('');
      setPhoneNumber('');
      setPickupOnly(false);
      setCost('');
      setSelectedMessenger('');

      Alert.alert('Éxito', 'Recolección agendada correctamente.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error creating pickup:', error);
      Alert.alert('Error', 'No se pudo agendar la recolección. Por favor, intenta de nuevo.');
    }
  };



  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nueva Recolección',
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Recolección</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Building2 color={Colors.light.primary} size={18} />
              <Text style={styles.labelText}>Nombre de la Tienda u Empresa</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ej: Tienda El Sol"
              value={storeName}
              onChangeText={setStoreName}
              placeholderTextColor={Colors.light.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MapPin color={Colors.light.primary} size={18} />
              <Text style={styles.labelText}>Dirección</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: 5ta Avenida 10-20, Zona 1"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.light.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Phone color={Colors.light.primary} size={18} />
              <Text style={styles.labelText}>Número de Teléfono</Text>
            </View>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phonePrefix}>+502</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Ej: 5555-5555"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <DollarSign color={Colors.light.primary} size={18} />
              <Text style={styles.labelText}>Costo</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>Q</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={cost}
                onChangeText={setCost}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Package color={Colors.light.primary} size={18} />
                <Text style={styles.labelText}>Solo Recoger</Text>
              </View>
              <Switch
                value={pickupOnly}
                onValueChange={setPickupOnly}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            {pickupOnly && (
              <Text style={styles.helperText}>
                Esta recolección es solo para recoger paquetes, sin entrega inmediata.
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User color={Colors.light.primary} size={18} />
              <Text style={styles.labelText}>Asignar Mensajero</Text>
            </View>
            <ScrollView 
              style={styles.messengerScrollView}
              contentContainerStyle={styles.messengerList}
              showsVerticalScrollIndicator={true}
            >
              {messengers.length === 0 ? (
                <Text style={styles.noMessengersText}>No hay mensajeros disponibles</Text>
              ) : (
                messengers.map((messenger) => (
                  <TouchableOpacity
                    key={messenger.id}
                    style={[
                      styles.messengerButton,
                      selectedMessenger === messenger.id && styles.messengerButtonActive,
                    ]}
                    onPress={() => setSelectedMessenger(messenger.id)}
                  >
                    <View style={styles.messengerInfo}>
                      <Text
                        style={[
                          styles.messengerButtonText,
                          selectedMessenger === messenger.id && styles.messengerButtonTextActive,
                        ]}
                      >
                        {messenger.name}
                      </Text>
                      {messenger.phone && (
                        <Text
                          style={[
                            styles.messengerPhone,
                            selectedMessenger === messenger.id && styles.messengerPhoneActive,
                          ]}
                        >
                          +502 {messenger.phone}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Agendar Recolección</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  priceInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  switchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  switchLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  helperText: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  messengerScrollView: {
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  messengerList: {
    padding: 8,
    gap: 8,
  },
  messengerButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  messengerButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  messengerInfo: {
    flexDirection: 'column' as const,
    gap: 4,
  },
  messengerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  messengerButtonTextActive: {
    color: '#FFFFFF',
  },
  messengerPhone: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  messengerPhoneActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noMessengersText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  phoneInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingLeft: 12,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
});

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { usePickups } from '@/contexts/PickupContext';
import { useMessengers } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { MapPin, User, Phone, Package, FileText } from 'lucide-react-native';

export default function NewPickupScreen() {
  const router = useRouter();
  const { addPickup } = usePickups();
  const messengers = useMessengers();

  const [establishmentName, setEstablishmentName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [selectedMessenger, setSelectedMessenger] = useState<string>('');

  const handleSubmit = async () => {
    if (!establishmentName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del establecimiento.');
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
    if (!price.trim()) {
      Alert.alert('Error', 'Por favor ingresa el precio.');
      return;
    }
    if (!selectedMessenger) {
      Alert.alert('Error', 'Por favor selecciona un mensajero.');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      Alert.alert('Error', 'Por favor ingresa un precio válido.');
      return;
    }

    try {
      const messenger = messengers.find(m => m.id === selectedMessenger);
      
      await addPickup({
        sender: {
          name: establishmentName.trim(),
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
        notes: `Precio: Q${priceValue.toFixed(2)}`,
      });

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
              <Package color={Colors.light.primary} size={18} />
              <Text style={styles.labelText}>Nombre del Establecimiento</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ej: Restaurante El Buen Sabor"
              value={establishmentName}
              onChangeText={setEstablishmentName}
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
            <TextInput
              style={styles.input}
              placeholder="Ej: 5555-5555"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.light.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <FileText color={Colors.light.primary} size={18} />
              <Text style={styles.labelText}>Precio</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>Q</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
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
                          {messenger.phone}
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
});

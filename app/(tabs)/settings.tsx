import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { useAuth, UserRole, Credential, useMessengers } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { ImagePlus, Trash2, User as UserIcon, Plus, Edit2, Shield, X, Calendar, Phone } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export default function SettingsScreen() {
  const { user, logo, updateLogo, credentials, addCredential, updateCredential, deleteCredential, toggleAvailability } = useAuth();
  const messengers = useMessengers();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('scheduler');
  const [formFirstName, setFormFirstName] = useState<string>('');
  const [formLastName, setFormLastName] = useState<string>('');
  const [formPhoneNumber, setFormPhoneNumber] = useState<string>('');

  const isAdmin = user?.role === 'admin';
  const isMessenger = user?.role === 'messenger';
  const currentMessenger = isMessenger ? messengers.find(m => m.id === user?.id) : null;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitas dar permiso para acceder a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateLogo(result.assets[0].uri);
    }
  };

  const removeLogo = () => {
    Alert.alert(
      'Eliminar logo',
      '¿Estás seguro de que quieres eliminar el logo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => updateLogo(null)
        }
      ]
    );
  };

  const openAddModal = () => {
    setEditingCredential(null);
    setFormUsername('');
    setFormPassword('');
    setFormRole('scheduler');
    setFormFirstName('');
    setFormLastName('');
    setFormPhoneNumber('');
    setModalVisible(true);
  };

  const openEditModal = (credential: Credential) => {
    setEditingCredential(credential);
    setFormUsername(credential.username);
    setFormPassword(credential.password);
    setFormRole(credential.role);
    setFormFirstName(credential.firstName);
    setFormLastName(credential.lastName);
    setFormPhoneNumber(credential.phoneNumber);
    setModalVisible(true);
  };

  const handleSaveCredential = async () => {
    if (!formUsername.trim() || !formPassword.trim() || !formFirstName.trim() || !formLastName.trim() || !formPhoneNumber.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (formUsername.trim().length < 3) {
      Alert.alert('Error', 'El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (formPassword.trim().length < 4) {
      Alert.alert('Error', 'La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (formFirstName.trim().length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (formLastName.trim().length < 2) {
      Alert.alert('Error', 'El apellido debe tener al menos 2 caracteres');
      return;
    }

    if (formPhoneNumber.trim().length < 8) {
      Alert.alert('Error', 'El número de teléfono debe tener al menos 8 dígitos');
      return;
    }

    const usernameExists = credentials.some(
      c => c.username.toLowerCase() === formUsername.trim().toLowerCase() && 
      (!editingCredential || c.id !== editingCredential.id)
    );

    if (usernameExists) {
      Alert.alert('Error', 'Este nombre de usuario ya está en uso');
      return;
    }

    try {
      if (editingCredential) {
        await updateCredential(editingCredential.id, formUsername.trim(), formPassword.trim(), formRole, formFirstName.trim(), formLastName.trim(), formPhoneNumber.trim());
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        await addCredential(formUsername.trim(), formPassword.trim(), formRole, formFirstName.trim(), formLastName.trim(), formPhoneNumber.trim());
        Alert.alert('Éxito', 'Usuario agregado correctamente');
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el usuario');
    }
  };

  const handleDeleteCredential = (credential: Credential) => {
    if (credential.id === user?.id) {
      Alert.alert('Error', 'No puedes eliminar tu propio usuario');
      return;
    }

    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de que quieres eliminar a ${credential.username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCredential(credential.id);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <UserIcon color="#FFFFFF" size={32} />
          </View>
          <View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'admin' ? 'Administrador' : user?.role === 'messenger' ? 'Mensajero' : 'Agendador'}
            </Text>
          </View>
        </View>
      </View>

      {isMessenger && currentMessenger && (
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityHeader}>
            <View style={styles.availabilityIconContainer}>
              <UserIcon color={Colors.light.primary} size={24} />
            </View>
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityTitle}>Estado de Disponibilidad</Text>
              <Text style={styles.availabilitySubtitle}>
                {currentMessenger.isAvailable 
                  ? 'Estás disponible para recibir asignaciones' 
                  : 'No estás disponible para recibir asignaciones'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              currentMessenger.isAvailable && styles.availabilityToggleActive,
            ]}
            onPress={() => toggleAvailability(user!.id)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.availabilityToggleThumb,
              currentMessenger.isAvailable && styles.availabilityToggleThumbActive,
            ]} />
          </TouchableOpacity>
          <View style={[
            styles.availabilityStatus,
            currentMessenger.isAvailable && styles.availabilityStatusActive,
          ]}>
            <View style={[
              styles.availabilityStatusDot,
              currentMessenger.isAvailable && styles.availabilityStatusDotActive,
            ]} />
            <Text style={[
              styles.availabilityStatusText,
              currentMessenger.isAvailable && styles.availabilityStatusTextActive,
            ]}>
              {currentMessenger.isAvailable ? 'Disponible' : 'No Disponible'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logo de la Empresa</Text>
        <Text style={styles.sectionDescription}>
          Personaliza tu aplicación con el logo de tu empresa
        </Text>

        <View style={styles.logoContainer}>
          {logo ? (
            <View style={styles.logoPreviewContainer}>
              <Image 
                source={{ uri: logo }} 
                style={styles.logoPreview}
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={removeLogo}
              >
                <Trash2 color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <ImagePlus color={Colors.light.muted} size={48} />
              <Text style={styles.logoPlaceholderText}>Sin logo</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={pickImage}
        >
          <ImagePlus color="#FFFFFF" size={20} />
          <Text style={styles.uploadButtonText}>
            {logo ? 'Cambiar Logo' : 'Cargar Logo'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          El logo se mostrará en el encabezado de la aplicación. Se recomienda usar una imagen cuadrada con fondo transparente.
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={openAddModal}
            >
              <Plus color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Agrega usuarios con contraseña para mensajeros y personal que agenda envíos
          </Text>

          {credentials.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield color={Colors.light.muted} size={48} />
              <Text style={styles.emptyStateText}>No hay usuarios registrados</Text>
              <Text style={styles.emptyStateSubtext}>Agrega el primer usuario para comenzar</Text>
            </View>
          ) : (
            <View style={styles.credentialsList}>
              {credentials.map((credential) => (
                <View key={credential.id} style={styles.credentialCard}>
                  <View style={styles.credentialIcon}>
                    {credential.role === 'admin' ? (
                      <Shield color={Colors.light.primary} size={24} />
                    ) : credential.role === 'messenger' ? (
                      <UserIcon color={Colors.light.primary} size={24} />
                    ) : (
                      <Calendar color={Colors.light.primary} size={24} />
                    )}
                  </View>
                  <View style={styles.credentialInfo}>
                    <Text style={styles.credentialUsername}>{credential.firstName} {credential.lastName}</Text>
                    <Text style={styles.credentialRole}>
                      {credential.role === 'admin' ? 'Administrador' : credential.role === 'messenger' ? 'Mensajero' : 'Agendador'}
                    </Text>
                    <Text style={styles.credentialPhone}>{credential.phoneNumber}</Text>
                  </View>
                  <View style={styles.credentialActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(credential)}
                    >
                      <Edit2 color={Colors.light.primary} size={18} />
                    </TouchableOpacity>
                    {credential.id !== user?.id && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteCredential(credential)}
                      >
                        <Trash2 color="#EF4444" size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCredential ? 'Editar Usuario' : 'Agregar Usuario'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Colors.light.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ingresa el nombre"
                  value={formFirstName}
                  onChangeText={setFormFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Apellido</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ingresa el apellido"
                  value={formLastName}
                  onChangeText={setFormLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Número de Teléfono</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+502</Text>
                  <TextInput
                    style={styles.phoneInputField}
                    placeholder="Ingresa el número de teléfono"
                    value={formPhoneNumber}
                    onChangeText={setFormPhoneNumber}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre de Usuario</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Mínimo 3 caracteres"
                  value={formUsername}
                  onChangeText={setFormUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.formHint}>Este será el nombre para iniciar sesión</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contraseña</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Mínimo 4 caracteres"
                  value={formPassword}
                  onChangeText={setFormPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.formHint}>Asegúrate de compartir esta contraseña de forma segura</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rol del Usuario</Text>
                <Text style={styles.formHint}>Selecciona el tipo de acceso que tendrá este usuario</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formRole === 'admin' && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormRole('admin')}
                  >
                    <View style={styles.roleOptionContent}>
                      <Shield 
                        color={formRole === 'admin' ? '#FFFFFF' : Colors.light.muted} 
                        size={20} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        formRole === 'admin' && styles.roleOptionTextActive,
                      ]}>
                        Administrador
                      </Text>
                      <Text style={[
                        styles.roleOptionDescription,
                        formRole === 'admin' && styles.roleOptionDescriptionActive,
                      ]}>
                        Acceso completo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formRole === 'messenger' && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormRole('messenger')}
                  >
                    <View style={styles.roleOptionContent}>
                      <UserIcon 
                        color={formRole === 'messenger' ? '#FFFFFF' : Colors.light.muted} 
                        size={20} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        formRole === 'messenger' && styles.roleOptionTextActive,
                      ]}>
                        Mensajero
                      </Text>
                      <Text style={[
                        styles.roleOptionDescription,
                        formRole === 'messenger' && styles.roleOptionDescriptionActive,
                      ]}>
                        Gestiona entregas
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formRole === 'scheduler' && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormRole('scheduler')}
                  >
                    <View style={styles.roleOptionContent}>
                      <Calendar 
                        color={formRole === 'scheduler' ? '#FFFFFF' : Colors.light.muted} 
                        size={20} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        formRole === 'scheduler' && styles.roleOptionTextActive,
                      ]}>
                        Agendador
                      </Text>
                      <Text style={[
                        styles.roleOptionDescription,
                        formRole === 'scheduler' && styles.roleOptionDescriptionActive,
                      ]}>
                        Crea envíos
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCredential}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  userInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  logoPreviewContainer: {
    position: 'relative' as const,
    width: 200,
    height: 200,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  logoPreview: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute' as const,
    top: -12,
    right: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  logoPlaceholderText: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  uploadButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  credentialsList: {
    gap: 12,
  },
  credentialCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  credentialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialUsername: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  credentialRole: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 2,
  },
  credentialPhone: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  credentialActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
    maxHeight: '90%',
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
  modalScrollView: {
    maxHeight: 500,
  },
  modalBody: {
    padding: 20,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  formInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  formHint: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  roleOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  roleOptionContent: {
    alignItems: 'center' as const,
    gap: 8,
  },
  roleOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center' as const,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
  },
  roleOptionDescription: {
    fontSize: 11,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  roleOptionDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalFooter: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  availabilityCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  availabilityHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 20,
  },
  availabilityIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  availabilitySubtitle: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  availabilityToggle: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.light.border,
    borderRadius: 28,
    padding: 4,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  availabilityToggleActive: {
    backgroundColor: '#10B981',
  },
  availabilityToggleThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  availabilityToggleThumbActive: {
    alignSelf: 'flex-end' as const,
  },
  availabilityStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  availabilityStatusActive: {
    backgroundColor: '#D1FAE5',
  },
  availabilityStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.muted,
  },
  availabilityStatusDotActive: {
    backgroundColor: '#10B981',
  },
  availabilityStatusText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.muted,
  },
  availabilityStatusTextActive: {
    color: '#10B981',
  },
  phoneInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingLeft: 16,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginRight: 8,
  },
  phoneInputField: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
});

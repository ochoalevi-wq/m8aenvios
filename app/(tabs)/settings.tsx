import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { useAuth, UserRole, Credential, useMessengers, LicenseType, VehicleType } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { ImagePlus, Trash2, User as UserIcon, Plus, Edit2, Shield, X, Calendar, Phone, CreditCard, Car, Moon, Sun } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const { user, logo, updateLogo, companyName, updateCompanyName, credentials, addCredential, updateCredential, deleteCredential, toggleAvailability } = useAuth();
  const messengers = useMessengers();
  const { themeMode, toggleTheme, colors } = useTheme();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('scheduler');
  const [formFirstName, setFormFirstName] = useState<string>('');
  const [formLastName, setFormLastName] = useState<string>('');
  const [formPhoneNumber, setFormPhoneNumber] = useState<string>('');
  const [formAge, setFormAge] = useState<string>('');
  const [formLicenseType, setFormLicenseType] = useState<LicenseType>('B');
  const [formVehicleType, setFormVehicleType] = useState<VehicleType>('moto');
  const [editingCompanyName, setEditingCompanyName] = useState<string>(companyName);

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
    setFormAge('');
    setFormLicenseType('B');
    setFormVehicleType('moto');
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
    setFormAge(credential.age?.toString() || '');
    setFormLicenseType(credential.licenseType || 'B');
    setFormVehicleType(credential.vehicleType || 'moto');
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

    const age = formAge.trim() ? parseInt(formAge.trim(), 10) : undefined;
    const licenseType = formRole === 'messenger' ? formLicenseType : undefined;
    const vehicleType = formRole === 'messenger' ? formVehicleType : undefined;

    try {
      if (editingCredential) {
        await updateCredential(
          editingCredential.id, 
          formUsername.trim(), 
          formPassword.trim(), 
          formRole, 
          formFirstName.trim(), 
          formLastName.trim(), 
          formPhoneNumber.trim(),
          age,
          licenseType,
          vehicleType
        );
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        await addCredential(
          formUsername.trim(), 
          formPassword.trim(), 
          formRole, 
          formFirstName.trim(), 
          formLastName.trim(), 
          formPhoneNumber.trim(),
          age,
          licenseType,
          vehicleType
        );
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.userInfo}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <UserIcon color="#FFFFFF" size={32} />
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.userRole, { color: colors.muted }]}>
              {user?.role === 'admin' ? 'Administrador' : user?.role === 'messenger' ? 'Mensajero' : 'Agendador'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>
        <Text style={[styles.sectionDescription, { color: colors.muted }]}>
          Cambia entre modo claro y oscuro
        </Text>

        <View style={[styles.themeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeHeader}>
            <View style={[styles.themeIconContainer, { backgroundColor: themeMode === 'dark' ? '#1E293B' : '#DBEAFE' }]}>
              {themeMode === 'dark' ? (
                <Moon color={colors.primary} size={24} />
              ) : (
                <Sun color={colors.primary} size={24} />
              )}
            </View>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeTitle, { color: colors.text }]}>Tema de la Aplicación</Text>
              <Text style={[styles.themeSubtitle, { color: colors.muted }]}>
                {themeMode === 'dark' ? 'Modo Oscuro Activado' : 'Modo Claro Activado'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.themeToggle,
              { backgroundColor: themeMode === 'dark' ? colors.primary : colors.border },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={[
              styles.themeToggleThumb,
              themeMode === 'dark' && styles.themeToggleThumbActive,
            ]} />
          </TouchableOpacity>
        </View>
      </View>

      {isMessenger && currentMessenger && (
        <View style={[styles.availabilityCard, { backgroundColor: colors.card }]}>
          <View style={styles.availabilityHeader}>
            <View style={[styles.availabilityIconContainer, { backgroundColor: themeMode === 'dark' ? '#1E3A8A' : '#DBEAFE' }]}>
              <UserIcon color={colors.primary} size={24} />
            </View>
            <View style={styles.availabilityInfo}>
              <Text style={[styles.availabilityTitle, { color: colors.text }]}>Estado de Disponibilidad</Text>
              <Text style={[styles.availabilitySubtitle, { color: colors.muted }]}>
                {currentMessenger.isAvailable 
                  ? 'Estás disponible para recibir asignaciones' 
                  : 'No estás disponible para recibir asignaciones'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              { backgroundColor: currentMessenger.isAvailable ? '#10B981' : colors.border },
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
            { backgroundColor: currentMessenger.isAvailable ? '#D1FAE5' : colors.background },
          ]}>
            <View style={[
              styles.availabilityStatusDot,
              { backgroundColor: currentMessenger.isAvailable ? '#10B981' : colors.muted },
            ]} />
            <Text style={[
              styles.availabilityStatusText,
              { color: currentMessenger.isAvailable ? '#10B981' : colors.muted },
            ]}>
              {currentMessenger.isAvailable ? 'Disponible' : 'No Disponible'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Información de la Empresa</Text>
        <Text style={[styles.sectionDescription, { color: colors.muted }]}>
          Personaliza tu aplicación con el logo y nombre de tu empresa
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Nombre de la Empresa</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholderTextColor={colors.muted}
            placeholder="Ingresa el nombre de tu empresa"
            value={editingCompanyName}
            onChangeText={setEditingCompanyName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={[styles.saveNameButton, { backgroundColor: colors.primary }]}
            onPress={() => updateCompanyName(editingCompanyName)}
          >
            <Text style={styles.saveNameButtonText}>Guardar Nombre</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Logo de la Empresa</Text>

        <View style={styles.logoContainer}>
          {logo ? (
            <View style={[styles.logoPreviewContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ImagePlus color={colors.muted} size={48} />
              <Text style={[styles.logoPlaceholderText, { color: colors.muted }]}>Sin logo</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          onPress={pickImage}
        >
          <ImagePlus color="#FFFFFF" size={20} />
          <Text style={styles.uploadButtonText}>
            {logo ? 'Cambiar Logo' : 'Cargar Logo'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.helpText, { color: colors.muted }]}>
          El logo se mostrará en el encabezado de la aplicación. Se recomienda usar una imagen cuadrada con fondo transparente.
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gestión de Usuarios</Text>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={openAddModal}
            >
              <Plus color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.muted }]}>
            Agrega usuarios con contraseña para mensajeros y personal que agenda envíos
          </Text>

          {credentials.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield color={colors.muted} size={48} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No hay usuarios registrados</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.muted }]}>Agrega el primer usuario para comenzar</Text>
            </View>
          ) : (
            <View style={styles.credentialsList}>
              {credentials.map((credential) => (
                <View key={credential.id} style={[styles.credentialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.credentialIcon, { backgroundColor: colors.background }]}>
                    {credential.role === 'admin' ? (
                      <Shield color={colors.primary} size={24} />
                    ) : credential.role === 'messenger' ? (
                      <UserIcon color={colors.primary} size={24} />
                    ) : (
                      <Calendar color={colors.primary} size={24} />
                    )}
                  </View>
                  <View style={styles.credentialInfo}>
                    <Text style={[styles.credentialUsername, { color: colors.text }]}>{credential.firstName} {credential.lastName}</Text>
                    <Text style={[styles.credentialRole, { color: colors.muted }]}>
                      {credential.role === 'admin' ? 'Administrador' : credential.role === 'messenger' ? 'Mensajero' : 'Agendador'}
                    </Text>
                    <Text style={[styles.credentialPhone, { color: colors.muted }]}>{credential.phoneNumber}</Text>
                  </View>
                  <View style={styles.credentialActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.background }]}
                      onPress={() => openEditModal(credential)}
                    >
                      <Edit2 color={colors.primary} size={18} />
                    </TouchableOpacity>
                    {credential.id !== user?.id && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.background }]}
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCredential ? 'Editar Usuario' : 'Agregar Usuario'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Nombre</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholderTextColor={colors.muted}
                  placeholder="Ingresa el nombre"
                  value={formFirstName}
                  onChangeText={setFormFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Apellido</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholderTextColor={colors.muted}
                  placeholder="Ingresa el apellido"
                  value={formLastName}
                  onChangeText={setFormLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Número de Teléfono</Text>
                <View style={[styles.phoneInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.phonePrefix, { color: colors.primary }]}>+502</Text>
                  <TextInput
                    style={[styles.phoneInputField, { color: colors.text }]}
                    placeholderTextColor={colors.muted}
                    placeholder="Ingresa el número de teléfono"
                    value={formPhoneNumber}
                    onChangeText={setFormPhoneNumber}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Nombre de Usuario</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholderTextColor={colors.muted}
                  placeholder="Mínimo 3 caracteres"
                  value={formUsername}
                  onChangeText={setFormUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[styles.formHint, { color: colors.muted }]}>Este será el nombre para iniciar sesión</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Contraseña</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholderTextColor={colors.muted}
                  placeholder="Mínimo 4 caracteres"
                  value={formPassword}
                  onChangeText={setFormPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[styles.formHint, { color: colors.muted }]}>Asegúrate de compartir esta contraseña de forma segura</Text>
              </View>

              {formRole === 'messenger' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Edad</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholderTextColor={colors.muted}
                      placeholder="Ingresa la edad"
                      value={formAge}
                      onChangeText={setFormAge}
                      keyboardType="number-pad"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Tipo de Licencia</Text>
                    <View style={styles.licenseSelector}>
                      {(['A', 'B', 'C', 'M'] as LicenseType[]).map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.licenseOption,
                            { backgroundColor: formLicenseType === type ? colors.primary : colors.background, borderColor: formLicenseType === type ? colors.primary : colors.border },
                          ]}
                          onPress={() => setFormLicenseType(type)}
                        >
                          <CreditCard 
                            color={formLicenseType === type ? '#FFFFFF' : colors.muted} 
                            size={20} 
                          />
                          <Text style={[
                            styles.licenseOptionText,
                            { color: formLicenseType === type ? '#FFFFFF' : colors.text },
                          ]}>
                            Tipo {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>Tipo de Vehículo</Text>
                    <View style={styles.vehicleSelector}>
                      <TouchableOpacity
                        style={[
                          styles.vehicleOption,
                          { backgroundColor: formVehicleType === 'moto' ? colors.primary : colors.background, borderColor: formVehicleType === 'moto' ? colors.primary : colors.border },
                        ]}
                        onPress={() => setFormVehicleType('moto')}
                      >
                        <Car 
                          color={formVehicleType === 'moto' ? '#FFFFFF' : colors.muted} 
                          size={20} 
                        />
                        <Text style={[
                          styles.vehicleOptionText,
                          { color: formVehicleType === 'moto' ? '#FFFFFF' : colors.text },
                        ]}>
                          Motocicleta
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.vehicleOption,
                          { backgroundColor: formVehicleType === 'carro' ? colors.primary : colors.background, borderColor: formVehicleType === 'carro' ? colors.primary : colors.border },
                        ]}
                        onPress={() => setFormVehicleType('carro')}
                      >
                        <Car 
                          color={formVehicleType === 'carro' ? '#FFFFFF' : colors.muted} 
                          size={20} 
                        />
                        <Text style={[
                          styles.vehicleOptionText,
                          { color: formVehicleType === 'carro' ? '#FFFFFF' : colors.text },
                        ]}>
                          Automóvil
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.vehicleOption,
                          { backgroundColor: formVehicleType === 'camion' ? colors.primary : colors.background, borderColor: formVehicleType === 'camion' ? colors.primary : colors.border },
                        ]}
                        onPress={() => setFormVehicleType('camion')}
                      >
                        <Car 
                          color={formVehicleType === 'camion' ? '#FFFFFF' : colors.muted} 
                          size={20} 
                        />
                        <Text style={[
                          styles.vehicleOptionText,
                          { color: formVehicleType === 'camion' ? '#FFFFFF' : colors.text },
                        ]}>
                          Camión
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Rol del Usuario</Text>
                <Text style={[styles.formHint, { color: colors.muted }]}>Selecciona el tipo de acceso que tendrá este usuario</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      { backgroundColor: formRole === 'admin' ? colors.primary : colors.background, borderColor: formRole === 'admin' ? colors.primary : colors.border },
                    ]}
                    onPress={() => setFormRole('admin')}
                  >
                    <View style={styles.roleOptionContent}>
                      <Shield 
                        color={formRole === 'admin' ? '#FFFFFF' : colors.muted} 
                        size={20} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        { color: formRole === 'admin' ? '#FFFFFF' : colors.text },
                      ]}>
                        Administrador
                      </Text>
                      <Text style={[
                        styles.roleOptionDescription,
                        { color: formRole === 'admin' ? 'rgba(255, 255, 255, 0.8)' : colors.muted },
                      ]}>
                        Acceso completo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      { backgroundColor: formRole === 'messenger' ? colors.primary : colors.background, borderColor: formRole === 'messenger' ? colors.primary : colors.border },
                    ]}
                    onPress={() => setFormRole('messenger')}
                  >
                    <View style={styles.roleOptionContent}>
                      <UserIcon 
                        color={formRole === 'messenger' ? '#FFFFFF' : colors.muted} 
                        size={20} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        { color: formRole === 'messenger' ? '#FFFFFF' : colors.text },
                      ]}>
                        Mensajero
                      </Text>
                      <Text style={[
                        styles.roleOptionDescription,
                        { color: formRole === 'messenger' ? 'rgba(255, 255, 255, 0.8)' : colors.muted },
                      ]}>
                        Gestiona entregas
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      { backgroundColor: formRole === 'scheduler' ? colors.primary : colors.background, borderColor: formRole === 'scheduler' ? colors.primary : colors.border },
                    ]}
                    onPress={() => setFormRole('scheduler')}
                  >
                    <View style={styles.roleOptionContent}>
                      <Calendar 
                        color={formRole === 'scheduler' ? '#FFFFFF' : colors.muted} 
                        size={20} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        { color: formRole === 'scheduler' ? '#FFFFFF' : colors.text },
                      ]}>
                        Agendador
                      </Text>
                      <Text style={[
                        styles.roleOptionDescription,
                        { color: formRole === 'scheduler' ? 'rgba(255, 255, 255, 0.8)' : colors.muted },
                      ]}>
                        Crea envíos
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
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
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
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
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
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
    borderRadius: 16,
    borderWidth: 2,
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
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  logoPlaceholderText: {
    fontSize: 14,
  },
  uploadButton: {
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
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 24,
    marginBottom: 16,
  },
  saveNameButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  saveNameButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  credentialsList: {
    gap: 12,
  },
  credentialCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  credentialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialUsername: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  credentialRole: {
    fontSize: 14,
    marginBottom: 2,
  },
  credentialPhone: {
    fontSize: 13,
  },
  credentialActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
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
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  formHint: {
    fontSize: 12,
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
  },
  roleOptionContent: {
    alignItems: 'center' as const,
    gap: 8,
  },

  roleOptionText: {
    fontSize: 13,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },

  roleOptionDescription: {
    fontSize: 11,
    textAlign: 'center' as const,
  },

  modalFooter: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  availabilityCard: {
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
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  availabilitySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  availabilityToggle: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    padding: 4,
    justifyContent: 'center' as const,
    marginBottom: 16,
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
    borderRadius: 12,
  },

  availabilityStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  availabilityStatusText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },

  themeCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  themeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 20,
  },
  themeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  themeSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  themeToggle: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    padding: 4,
    justifyContent: 'center' as const,
  },
  themeToggleThumb: {
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
  themeToggleThumbActive: {
    alignSelf: 'flex-end' as const,
  },
  licenseSelector: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  licenseOption: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
  },

  licenseOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },

  vehicleSelector: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  vehicleOption: {
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
  },

  vehicleOptionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },

  phoneInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 16,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  phoneInputField: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
});

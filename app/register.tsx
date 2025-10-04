import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { UserPlus, Package, Lock, User, ArrowLeft } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const { register, hasAdminRegistered } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (hasAdminRegistered) {
      router.replace('/login');
    }
  }, [hasAdminRegistered]);

  if (hasAdminRegistered) {
    return null;
  }

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await register(username.trim(), password.trim());
      Alert.alert(
        'Registro exitoso',
        'Tu cuenta de administrador ha sido creada correctamente',
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <UserPlus size={48} color={Colors.light.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Registra la primera cuenta de administrador
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Package size={20} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              Como administrador podrás gestionar usuarios, asignar roles y controlar todo el sistema de envíos.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={Colors.light.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu nombre de usuario"
                  placeholderTextColor={Colors.light.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.light.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.light.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.light.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={Colors.light.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                (isLoading || !username.trim() || !password.trim() || !confirmPassword.trim()) &&
                  styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={
                isLoading || !username.trim() || !password.trim() || !confirmPassword.trim()
              }
              activeOpacity={0.8}
            >
              <UserPlus size={20} color="#FFFFFF" style={styles.registerIcon} />
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta de Administrador'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  infoBox: {
    flexDirection: 'row' as const,
    backgroundColor: `${Colors.light.primary}10`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}30`,
    marginBottom: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Colors.light.text,
  },
  registerButton: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerIcon: {
    marginRight: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

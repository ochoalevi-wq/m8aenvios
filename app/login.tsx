import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { LogIn, Package, Lock, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
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

export default function LoginScreen() {
  const { login, hasAdminRegistered } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password.trim());
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Credenciales inválidas');
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
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Package size={48} color={Colors.light.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>Sistema de Envíos</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario</Text>
              <View style={styles.inputContainer}>
                <Package size={20} color={Colors.light.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu usuario"
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
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={Colors.light.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                (isLoading || !username.trim() || !password.trim()) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading || !username.trim() || !password.trim()}
              activeOpacity={0.8}
            >
              <LogIn size={20} color="#FFFFFF" style={styles.loginIcon} />
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            {!hasAdminRegistered && (
              <View style={styles.registerSection}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push('/register')}
                  activeOpacity={0.8}
                >
                  <UserPlus size={20} color={Colors.light.primary} style={styles.registerIcon} />
                  <Text style={styles.registerButtonText}>Crear Cuenta de Administrador</Text>
                </TouchableOpacity>
              </View>
            )}
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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

  loginButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  registerSection: {
    marginTop: 24,
  },
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.light.muted,
  },
  registerButton: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.light.card,
    height: 56,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  registerIcon: {
    marginRight: 8,
  },
  registerButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

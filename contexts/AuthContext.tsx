import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = '@auth_user';
const LOGO_STORAGE_KEY = '@app_logo';
const CREDENTIALS_STORAGE_KEY = '@app_credentials';
const AVAILABILITY_STORAGE_KEY = '@messenger_availability';

export type UserRole = 'admin' | 'messenger' | 'scheduler';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Credential {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdAt: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [logo, setLogo] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadUser();
    loadLogo();
    loadCredentials();
    loadAvailability();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogo = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOGO_STORAGE_KEY);
      if (stored) {
        setLogo(stored);
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  };

  const loadCredentials = async () => {
    try {
      const stored = await AsyncStorage.getItem(CREDENTIALS_STORAGE_KEY);
      if (stored) {
        setCredentials(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const stored = await AsyncStorage.getItem(AVAILABILITY_STORAGE_KEY);
      if (stored) {
        setAvailability(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const updateLogo = useCallback(async (logoUri: string | null) => {
    try {
      if (logoUri) {
        await AsyncStorage.setItem(LOGO_STORAGE_KEY, logoUri);
        setLogo(logoUri);
      } else {
        await AsyncStorage.removeItem(LOGO_STORAGE_KEY);
        setLogo(null);
      }
    } catch (error) {
      console.error('Error updating logo:', error);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const credential = credentials.find(
      c => c.username === username && c.password === password
    );
    
    if (!credential) {
      throw new Error('Credenciales inválidas');
    }

    const newUser: User = {
      id: credential.id,
      name: username,
      role: credential.role,
    };
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }, [credentials]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }, []);

  const addCredential = useCallback(async (username: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => {
    const newCredential: Credential = {
      id: Date.now().toString(),
      username,
      password,
      role,
      firstName,
      lastName,
      phoneNumber,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...credentials, newCredential];
    try {
      await AsyncStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
      setCredentials(updated);
    } catch (error) {
      console.error('Error adding credential:', error);
      throw error;
    }
  }, [credentials]);

  const updateCredential = useCallback(async (id: string, username: string, password: string, role: UserRole, firstName: string, lastName: string, phoneNumber: string) => {
    const updated = credentials.map(c => 
      c.id === id ? { ...c, username, password, role, firstName, lastName, phoneNumber } : c
    );
    try {
      await AsyncStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
      setCredentials(updated);
    } catch (error) {
      console.error('Error updating credential:', error);
      throw error;
    }
  }, [credentials]);

  const deleteCredential = useCallback(async (id: string) => {
    const updated = credentials.filter(c => c.id !== id);
    try {
      await AsyncStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
      setCredentials(updated);
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  }, [credentials]);

  const register = useCallback(async (username: string, password: string) => {
    if (credentials.length > 0) {
      throw new Error('Ya existe un administrador registrado');
    }

    const adminCredential: Credential = {
      id: Date.now().toString(),
      username,
      password,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Principal',
      phoneNumber: '',
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: adminCredential.id,
      name: username,
      role: 'admin',
    };

    try {
      await AsyncStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify([adminCredential]));
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setCredentials([adminCredential]);
      setUser(newUser);
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }, [credentials]);

  const toggleAvailability = useCallback(async (messengerId: string) => {
    const newAvailability = {
      ...availability,
      [messengerId]: !availability[messengerId],
    };
    try {
      await AsyncStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(newAvailability));
      setAvailability(newAvailability);
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }, [availability]);

  const setMessengerAvailability = useCallback(async (messengerId: string, isAvailable: boolean) => {
    const newAvailability = {
      ...availability,
      [messengerId]: isAvailable,
    };
    try {
      await AsyncStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(newAvailability));
      setAvailability(newAvailability);
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  }, [availability]);

  const hasAdminRegistered = useMemo(() => credentials.length > 0, [credentials]);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    hasAdminRegistered,
    logo,
    updateLogo,
    credentials,
    addCredential,
    updateCredential,
    deleteCredential,
    availability,
    toggleAvailability,
    setMessengerAvailability,
  }), [user, isLoading, login, logout, register, hasAdminRegistered, logo, updateLogo, credentials, addCredential, updateCredential, deleteCredential, availability, toggleAvailability, setMessengerAvailability]);
});

export const useMessengers = () => {
  const { credentials, availability } = useAuth();
  return useMemo(() => 
    credentials
      .filter(c => c.role === 'messenger')
      .map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phoneNumber,
        isAvailable: availability[c.id] || false,
      })),
    [credentials, availability]
  );
};

export const useAvailableMessengers = () => {
  const { credentials, availability } = useAuth();
  return useMemo(() => 
    credentials
      .filter(c => c.role === 'messenger' && availability[c.id])
      .map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phoneNumber,
        isAvailable: true,
      })),
    [credentials, availability]
  );
};

import { Tabs, router } from "expo-router";
import { Home, Package, PlusCircle, Users, LogOut, Settings, PackageCheck } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View, Image } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

import Colors from "@/constants/colors";

export default function TabLayout() {
  const { user, logout, logo } = useAuth();
  const isMessenger = user?.role === 'messenger';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.muted,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
        },
        headerLeft: logo ? () => (
          <View style={{ marginLeft: 16 }}>
            <Image 
              source={{ uri: logo }} 
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </View>
        ) : undefined,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 16 }}
          >
            <LogOut color={Colors.light.text} size={22} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isMessenger ? "Mis Entregas" : "Inicio",
          tabBarIcon: ({ color, size }) => isMessenger ? <Package color={color} size={size} /> : <Home color={color} size={size} />,
          headerTitle: isMessenger ? "Mis Paquetes" : "Dashboard",
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: "Envíos",
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
          headerTitle: "Todos los Envíos",
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
          href: isMessenger ? null : '/deliveries',
        }}
      />
      <Tabs.Screen
        name="new-delivery"
        options={{
          title: "Nuevo",
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
          headerTitle: "Crear Envío",
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
          href: isMessenger ? null : '/new-delivery',
        }}
      />
      <Tabs.Screen
        name="pickups"
        options={{
          title: "Recolección",
          tabBarIcon: ({ color, size }) => <PackageCheck color={color} size={size} />,
          headerTitle: "Recolecciones",
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
        }}
      />
      <Tabs.Screen
        name="messengers"
        options={{
          title: "Mensajeros",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          headerTitle: "Gestión de Mensajeros",
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
          href: isMessenger ? null : '/messengers',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          headerTitle: "Configuración",
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
        }}
      />
    </Tabs>
  );
}

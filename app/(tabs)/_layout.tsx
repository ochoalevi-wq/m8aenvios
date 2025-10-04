import { Stack, router } from "expo-router";
import { Menu, LogOut } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View, Image, Modal, StyleSheet, Text, ScrollView, Animated, Dimensions } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useMenu } from "@/contexts/MenuContext";
import Colors from "@/constants/colors";
import { Home, Package, PlusCircle, Users, Settings, PackageCheck, MapPin, BookOpen, BarChart3 } from "lucide-react-native";

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

function DrawerMenu() {
  const { user, logout, logo } = useAuth();
  const { isOpen, closeMenu } = useMenu();
  const isMessenger = user?.role === 'messenger';
  const slideAnim = React.useRef(new Animated.Value(-MENU_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -MENU_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    router.replace('/login');
  };

  const navigate = (path: string) => {
    closeMenu();
    router.push(path as any);
  };

  const menuItems = [
    { 
      label: isMessenger ? "Mis Entregas" : "Inicio", 
      icon: isMessenger ? Package : Home, 
      path: "/(tabs)/",
      show: true 
    },
    { 
      label: "Envíos", 
      icon: Package, 
      path: "/(tabs)/deliveries",
      show: !isMessenger 
    },
    { 
      label: "Nuevo Envío", 
      icon: PlusCircle, 
      path: "/(tabs)/new-delivery",
      show: !isMessenger 
    },
    { 
      label: "Recolección", 
      icon: PackageCheck, 
      path: "/(tabs)/pickups",
      show: true 
    },
    { 
      label: "Mensajeros", 
      icon: Users, 
      path: "/(tabs)/messengers",
      show: !isMessenger 
    },
    { 
      label: "Ubicaciones", 
      icon: MapPin, 
      path: "/(tabs)/messenger-locations",
      show: !isMessenger 
    },
    { 
      label: "Control", 
      icon: BarChart3, 
      path: "/(tabs)/control",
      show: !isMessenger 
    },
    { 
      label: "Guía de Usuario", 
      icon: BookOpen, 
      path: "/(tabs)/guide",
      show: true 
    },
    { 
      label: "Ajustes", 
      icon: Settings, 
      path: "/(tabs)/settings",
      show: true 
    },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={closeMenu}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={closeMenu}
        />
        <Animated.View 
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <ScrollView style={styles.drawer} contentContainerStyle={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              {logo && (
                <Image 
                  source={{ uri: logo }} 
                  style={styles.drawerLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.drawerTitle}>Menú</Text>
              <Text style={styles.drawerSubtitle}>{user?.name}</Text>
              <Text style={styles.drawerRole}>
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'scheduler' ? 'Agendador' : 'Mensajero'}
              </Text>
            </View>

            <View style={styles.menuItems}>
              {menuItems.filter(item => item.show).map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => navigate(item.path)}
                  >
                    <Icon color={Colors.light.text} size={22} />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <LogOut color={Colors.light.danger} size={22} />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function TabLayout() {
  const { logo } = useAuth();
  const { toggleMenu } = useMenu();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.light.card,
          },
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={toggleMenu}
              style={{ marginLeft: 16 }}
            >
              <Menu color={Colors.light.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: logo ? () => (
            <View style={{ marginRight: 16 }}>
              <Image 
                source={{ uri: logo }} 
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>
          ) : undefined,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "Dashboard",
          }}
        />
        <Stack.Screen
          name="deliveries"
          options={{
            headerTitle: "Todos los Envíos",
          }}
        />
        <Stack.Screen
          name="new-delivery"
          options={{
            headerTitle: "Crear Envío",
          }}
        />
        <Stack.Screen
          name="pickups"
          options={{
            headerTitle: "Recolecciones",
          }}
        />
        <Stack.Screen
          name="messengers"
          options={{
            headerTitle: "Gestión de Mensajeros",
          }}
        />
        <Stack.Screen
          name="messenger-locations"
          options={{
            headerTitle: "Ubicación de Mensajeros",
          }}
        />
        <Stack.Screen
          name="guide"
          options={{
            headerTitle: "Guía de Usuario",
          }}
        />
        <Stack.Screen
          name="control"
          options={{
            headerTitle: "Control y Estadísticas",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerTitle: "Configuración",
          }}
        />
      </Stack>
      <DrawerMenu />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
  },
  drawer: {
    flex: 1,
    backgroundColor: Colors.light.card,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  drawerContent: {
    flexGrow: 1,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: Colors.light.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  drawerLogo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  drawerRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menuItems: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  logoutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.danger,
  },
});

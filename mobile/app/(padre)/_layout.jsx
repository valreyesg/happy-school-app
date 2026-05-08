import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_COLOR = '#E53E3E';
const INACTIVE_COLOR = '#A0AEC0';

const TabIcon = ({ icon, label, focused }) => (
  <View style={{ alignItems: 'center', gap: 1 }}>
    <Ionicons
      name={focused ? icon : `${icon}-outline`}
      size={22}
      color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
    />
    <Text
      numberOfLines={1}
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
        letterSpacing: -0.2,
      }}
    >
      {label}
    </Text>
  </View>
);

export default function PadreTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: '#FED7D7',
          height: Platform.OS === 'android' ? 62 : 72,
          paddingBottom: Platform.OS === 'android' ? 8 : 16,
          paddingTop: 6,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
      }}
    >
      <Tabs.Screen name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="home" label="Inicio" focused={focused} /> }} />
      <Tabs.Screen name="bitacora"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="book" label="Bitácora" focused={focused} /> }} />
      <Tabs.Screen name="comida"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="restaurant" label="Comida" focused={focused} /> }} />
      <Tabs.Screen name="pagos"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="card" label="Pagos" focused={focused} /> }} />
      <Tabs.Screen name="calendario"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="calendar" label="Calendario" focused={focused} /> }} />

      {/* Screens ocultas del tab bar — accesibles por navegación directa */}
      <Tabs.Screen name="galeria"  options={{ href: null }} />
      <Tabs.Screen name="qr"       options={{ href: null }} />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_COLOR = '#805AD5';
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

export default function MaestraTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: '#E9D5FF',
          height: Platform.OS === 'android' ? 62 : 72,
          paddingBottom: Platform.OS === 'android' ? 8 : 16,
          paddingTop: 6,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon icon="home" label="Inicio" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="asistencia"
        options={{
          title: 'Asistencia',
          tabBarIcon: ({ focused }) => <TabIcon icon="checkmark-circle" label="Asistencia" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bitacora"
        options={{
          title: 'Bitácora',
          tabBarIcon: ({ focused }) => <TabIcon icon="book" label="Bitácora" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tareas"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ focused }) => <TabIcon icon="clipboard" label="Tareas" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="galeria"
        options={{
          title: 'Galería',
          tabBarIcon: ({ focused }) => <TabIcon icon="images" label="Galería" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="qr-scanner"
        options={{
          title: 'QR',
          tabBarIcon: ({ focused }) => <TabIcon icon="qr-code" label="QR" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

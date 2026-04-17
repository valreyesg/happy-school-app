import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

const TabIcon = ({ emoji, label, focused }) => (
  <View style={{ alignItems: 'center', gap: 2 }}>
    <Text style={{ fontSize: focused ? 26 : 22 }}>{emoji}</Text>
    <Text style={{
      fontSize: 10, fontWeight: '800',
      color: focused ? '#805AD5' : '#A0AEC0',
    }}>
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
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E9D5FF',
          height: 70,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#805AD5',
        tabBarInactiveTintColor: '#A0AEC0',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Inicio" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="asistencia"
        options={{
          title: 'Asistencia',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Asistencia" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bitacora"
        options={{
          title: 'Bitácora',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Bitácora" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="galeria"
        options={{
          title: 'Galería',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📸" label="Galería" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="qr-scanner"
        options={{
          title: 'QR',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📷" label="QR" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

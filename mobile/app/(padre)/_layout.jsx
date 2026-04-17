import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

const TabIcon = ({ emoji, label, focused }) => (
  <View style={{ alignItems: 'center', gap: 2 }}>
    <Text style={{ fontSize: focused ? 26 : 22 }}>{emoji}</Text>
    <Text style={{ fontSize: 10, fontWeight: '800', color: focused ? '#E53E3E' : '#A0AEC0' }}>
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
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#FED7D7',
          height: 70,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#E53E3E',
      }}
    >
      <Tabs.Screen name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Inicio" focused={focused} /> }} />
      <Tabs.Screen name="bitacora"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Bitácora" focused={focused} /> }} />
      <Tabs.Screen name="pagos"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Pagos" focused={focused} /> }} />
      <Tabs.Screen name="calendario"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Eventos" focused={focused} /> }} />
      <Tabs.Screen name="chat"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💬" label="Chat" focused={focused} /> }} />
    </Tabs>
  );
}

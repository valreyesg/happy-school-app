import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Screen() {
  return (
    <SafeAreaView style={styles.c}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.t}>Qr — En desarrollo</Text>
      <Text style={styles.s}>Próximamente disponible</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  c: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  emoji: { fontSize: 64 },
  t: { fontSize: 22, fontWeight: '900', color: '#2D3748', marginTop: 16 },
  s: { fontSize: 14, fontWeight: '600', color: '#718096', marginTop: 8 },
});

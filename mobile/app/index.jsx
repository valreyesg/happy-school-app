import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';

export default function SplashPage() {
  const { token, usuario } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token && usuario) {
        const routes = {
          directora: '/(directora)/',
          administrativo: '/(admin)/',
          maestra_titular: '/(maestra)/',
          maestra_especial: '/(maestra)/',
          maestra_puerta: '/(maestra)/',
          padre: '/(padre)/',
        };
        router.replace(routes[usuario.rolPrincipal] || '/login');
      } else {
        router.replace('/login');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#FED7D7', '#FEF08A', '#BBF7D0', '#E9D5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.emoji}>🏫</Text>
      <Text style={styles.title}>Happy School</Text>
      <Text style={styles.slogan}>Comunidad Infantil</Text>

      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.2 }]} />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emoji: { fontSize: 80, marginBottom: 8 },
  title: {
    fontSize: 36, fontWeight: '900', color: '#805AD5',
    textShadowColor: 'rgba(128,90,213,0.2)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4,
  },
  slogan: { fontSize: 18, fontWeight: '700', color: '#B794F4', letterSpacing: 1 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 32 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#805AD5' },
});

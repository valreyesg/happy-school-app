import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

const EMOJIS_ANIMO = { feliz: '😊', triste: '😢', cansado: '😴', inquieto: '😤', energico: '⚡' };
const EMOJIS_COMIDA = { nada: '🍽️', poco: '🥢', mitad: '🍱', todo: '✅' };

export default function PadreDashboard() {
  const { usuario } = useAuthStore();
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: hijos, isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos?rol=padre').then(r => r.data.alumnos),
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              ¡Hola, {usuario?.nombre?.split(' ')[0]}! 👋
            </Text>
            <Text style={styles.fecha}>{hoy}</Text>
          </View>
          <Text style={{ fontSize: 36 }}>👨‍👩‍👧</Text>
        </View>

        {/* Mis hijos */}
        {(hijos || []).map(hijo => (
          <HijoCard key={hijo.id} hijo={hijo} />
        ))}

        {isLoading && (
          <View style={styles.loadingCard}>
            <Text style={{ fontSize: 32 }}>🔄</Text>
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        )}

        {/* Accesos rápidos */}
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.accionesGrid}>
          {[
            { emoji: '📅', label: 'Calendario', route: '/(padre)/calendario', color: '#805AD5' },
            { emoji: '💰', label: 'Pagos', route: '/(padre)/pagos', color: '#38A169' },
            { emoji: '💬', label: 'Chat', route: '/(padre)/chat', color: '#E53E3E' },
            { emoji: '📸', label: 'Fotos', route: '/(padre)/galeria', color: '#D69E2E' },
          ].map(({ emoji, label, route, color }) => (
            <TouchableOpacity
              key={route}
              style={[styles.accionBtn, { borderColor: color + '30', backgroundColor: color + '10' }]}
              onPress={() => router.push(route)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 32 }}>{emoji}</Text>
              <Text style={[styles.accionLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HijoCard({ hijo }) {
  return (
    <TouchableOpacity
      style={styles.hijoCard}
      onPress={() => router.push(`/(padre)/bitacora?alumnoId=${hijo.id}`)}
      activeOpacity={0.9}
    >
      {/* Foto */}
      <View style={styles.hijoHeader}>
        {hijo.foto_url ? (
          <Image source={{ uri: hijo.foto_url }} style={styles.hijoFoto} />
        ) : (
          <View style={[styles.hijoFoto, styles.hijoFotoPlaceholder]}>
            <Text style={{ fontSize: 40 }}>👧</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.hijoNombre}>{hijo.nombre_completo}</Text>
          <Text style={styles.hijoGrupo}>{hijo.grupo_nombre}</Text>
        </View>
        {/* QR del hijo */}
        <TouchableOpacity
          style={styles.qrBtn}
          onPress={() => router.push(`/(padre)/qr?alumnoId=${hijo.id}`)}
        >
          <Text style={{ fontSize: 24 }}>📱</Text>
        </TouchableOpacity>
      </View>

      {/* Bitácora de hoy */}
      {hijo.bitacora_hoy && (
        <View style={styles.bitacoraResumen}>
          <View style={styles.bitacoraItem}>
            <Text style={styles.bitacoraEmoji}>
              {EMOJIS_ANIMO[hijo.bitacora_hoy.estado_animo] || '🤔'}
            </Text>
            <Text style={styles.bitacoraLabel}>Ánimo</Text>
          </View>
          <View style={styles.bitacoraItem}>
            <Text style={styles.bitacoraEmoji}>
              {EMOJIS_COMIDA[hijo.bitacora_hoy.cuanto_comio] || '🍽️'}
            </Text>
            <Text style={styles.bitacoraLabel}>Comida</Text>
          </View>
          <View style={styles.bitacoraItem}>
            <Text style={styles.bitacoraEmoji}>
              {hijo.bitacora_hoy.tarea_realizada ? '📚' : '📖'}
            </Text>
            <Text style={styles.bitacoraLabel}>Tarea</Text>
          </View>
          <View style={styles.bitacoraItem}>
            <Text style={styles.bitacoraEmoji}>
              {hijo.bitacora_hoy.comportamiento === 'muy_bien' ? '⭐' :
               hijo.bitacora_hoy.comportamiento === 'bien' ? '👍' : '⚠️'}
            </Text>
            <Text style={styles.bitacoraLabel}>Conducta</Text>
          </View>
        </View>
      )}

      {!hijo.bitacora_hoy && (
        <Text style={styles.sinBitacora}>La bitácora de hoy aún no está lista 📝</Text>
      )}

      <View style={styles.verMasBtn}>
        <Text style={styles.verMasText}>Ver bitácora completa →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff8f8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  greeting: { fontSize: 24, fontWeight: '900', color: '#2D3748' },
  fecha: { fontSize: 13, fontWeight: '600', color: '#718096', textTransform: 'capitalize' },
  loadingCard: {
    margin: 16, padding: 32, backgroundColor: '#fff', borderRadius: 24,
    alignItems: 'center', gap: 12,
  },
  loadingText: { fontWeight: '700', color: '#718096', fontSize: 16 },
  hijoCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 24,
    shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
    overflow: 'hidden',
  },
  hijoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#FED7D7',
  },
  hijoFoto: { width: 72, height: 72, borderRadius: 20 },
  hijoFotoPlaceholder: {
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  hijoNombre: { fontSize: 18, fontWeight: '900', color: '#2D3748' },
  hijoGrupo: { fontSize: 13, fontWeight: '700', color: '#E53E3E', marginTop: 2 },
  qrBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  bitacoraResumen: {
    flexDirection: 'row', padding: 16, gap: 8,
  },
  bitacoraItem: { flex: 1, alignItems: 'center', gap: 4 },
  bitacoraEmoji: { fontSize: 32 },
  bitacoraLabel: { fontSize: 11, fontWeight: '700', color: '#718096' },
  sinBitacora: {
    padding: 16, textAlign: 'center', color: '#A0AEC0', fontWeight: '600', fontSize: 14,
  },
  verMasBtn: {
    paddingHorizontal: 16, paddingBottom: 16,
  },
  verMasText: { color: '#E53E3E', fontWeight: '800', fontSize: 14 },
  sectionTitle: {
    fontSize: 18, fontWeight: '900', color: '#2D3748',
    marginHorizontal: 16, marginTop: 8, marginBottom: 12,
  },
  accionesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, paddingBottom: 24,
  },
  accionBtn: {
    width: '46%', borderRadius: 20, borderWidth: 2,
    padding: 20, alignItems: 'center', gap: 8,
  },
  accionLabel: { fontWeight: '800', fontSize: 14 },
});

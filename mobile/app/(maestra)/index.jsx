import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, FlatList, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { COLORS, RADIUS } from '@/constants/theme';
import { useCatalogo } from '@/hooks/useCatalogo';
import { Ionicons } from '@expo/vector-icons';

function saludoHora() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function MaestraDashboard() {
  const { usuario, logout } = useAuthStore();
  const { items: itemsAnimo } = useCatalogo('animo');
  const EMOJIS_ANIMO = Object.fromEntries(
    (itemsAnimo || []).map(i => [i.valor, i.etiqueta])
  );
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const horaActual = new Date().getHours();
  const esModoEntrada = horaActual >= 7 && horaActual < 9;

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['mi-grupo'],
    queryFn: () => api.get('/grupos/mi-grupo').then(r => r.data),
  });

  const { data: tareasHoy } = useQuery({
    queryKey: ['tareas-hoy', grupo?.id],
    queryFn: () => api.get(`/tareas/hoy-pendientes?grupo_id=${grupo.id}`).then(r => r.data),
    enabled: !!grupo?.id,
  });

  const { data: alumnosEnAlerta } = useQuery({
    queryKey: ['alumnos-alerta-tareas', grupo?.id],
    queryFn: () => api.get(`/tareas/alumnos-alerta?grupo_id=${grupo.id}`).then(r => r.data),
    enabled: !!grupo?.id,
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting} numberOfLines={1}>
              ¡{saludoHora()}, {usuario?.genero === 'm' ? 'Teacher' : 'Miss'} {usuario?.nombre?.split(' ')[0]}! 👋
            </Text>
            <Text style={styles.fecha}>{hoy}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Cerrar sesión', '¿Segura que quieres salir?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
              ])}
              style={{ backgroundColor: '#FED7D7', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modo Entrada QR — activo 7:00-8:30am */}
        {esModoEntrada && (
          <TouchableOpacity
            style={styles.qrBanner}
            onPress={() => router.push('/(maestra)/qr-scanner')}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code" size={30} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.qrBannerTitle}>Modo Entrada Activo</Text>
              <Text style={styles.qrBannerSub}>Toca para escanear QR</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#E9D5FF" />
          </TouchableOpacity>
        )}

        {/* Banner Tareas por recibir hoy */}
        {tareasHoy && tareasHoy.length > 0 && (
          <TouchableOpacity
            style={styles.tareasHoyBanner}
            onPress={() => router.push('/(maestra)/tareas')}
            activeOpacity={0.8}
          >
            <Ionicons name="clipboard" size={26} color="#1E40AF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                {tareasHoy.length} tarea{tareasHoy.length > 1 ? 's' : ''} por recibir hoy
              </Text>
              <Text style={styles.bannerSub} numberOfLines={1}>
                {tareasHoy.map(t => t.titulo).join(', ')}
              </Text>
            </View>
            <Text style={styles.bannerCount}>{tareasHoy.length}</Text>
          </TouchableOpacity>
        )}

        {/* Banner Alumnos en alerta */}
        {alumnosEnAlerta && alumnosEnAlerta.length > 0 && (
          <View style={styles.alertaBanner}>
            <Ionicons name="alert-circle" size={26} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertaTitle}>
                {alumnosEnAlerta.length} alumno{alumnosEnAlerta.length > 1 ? 's' : ''} en seguimiento
              </Text>
              <Text style={styles.alertaSub}>3+ tareas sin entregar</Text>
            </View>
          </View>
        )}
        {alumnosEnAlerta && alumnosEnAlerta.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            {alumnosEnAlerta.map(a => (
              <Text key={a.id} style={styles.alertaItem}>
                · {a.nombre_completo} ({a.tareas_sin_entregar} tareas)
              </Text>
            ))}
          </View>
        )}

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.accionesGrid}>
          {[
            { icon: 'checkmark-circle', label: 'Asistencia', route: '/(maestra)/asistencia', color: '#38A169' },
            { icon: 'book', label: 'Bitácora', route: '/(maestra)/bitacora', color: '#805AD5' },
            { icon: 'clipboard', label: 'Tareas', route: '/(maestra)/tareas', color: '#3B82F6' },
            { icon: 'qr-code', label: 'Escanear QR', route: '/(maestra)/qr-scanner', color: '#E53E3E' },
            { icon: 'images', label: 'Galería', route: '/(maestra)/galeria', color: '#D69E2E' },
          ].map(({ icon, label, route, color }) => (
            <TouchableOpacity
              key={route}
              style={[styles.accionBtn, { borderColor: color + '30', backgroundColor: color + '10' }]}
              onPress={() => router.push(route)}
              activeOpacity={0.8}
            >
              <Ionicons name={icon} size={32} color={color} />
              <Text style={[styles.accionLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de alumnos del grupo */}
        <Text style={styles.sectionTitle}>
          Mi grupo — {grupo?.nombre || '...'}
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#805AD5" size="large" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.alumnosList}>
            {(grupo?.alumnos || []).map(alumno => (
              <TouchableOpacity
                key={alumno.id}
                style={styles.alumnoCard}
                onPress={() => router.push(`/(maestra)/bitacora?alumnoId=${alumno.id}`)}
                activeOpacity={0.8}
              >
                {/* Foto del alumno */}
                {alumno.foto_url ? (
                  <Image source={{ uri: alumno.foto_url }} style={styles.alumnoFoto} />
                ) : (
                  <View style={[styles.alumnoFoto, styles.alumnoFotoPlaceholder]}>
                    <Text style={{ fontSize: 24 }}>👧🏻</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.alumnoNombre}>{alumno.nombre_completo}</Text>
                  {alumno.estado_animo && (
                    <Text style={styles.alumnoAnimo}>
                      {EMOJIS_ANIMO[alumno.estado_animo]} {alumno.estado_animo}
                    </Text>
                  )}
                </View>

                {/* Estado asistencia */}
                <View style={[
                  styles.estadoBadge,
                  { backgroundColor:
                      ['presente','retardo'].includes(alumno.estado_asistencia) ? '#C6F6D5'
                    : alumno.estado_asistencia === 'no_entrada' ? '#FED7D7'
                    : '#E2E8F0' }
                ]}>
                  <Text style={{ fontSize: 12, fontWeight: '800',
                    color:
                      ['presente','retardo'].includes(alumno.estado_asistencia) ? '#276749'
                    : alumno.estado_asistencia === 'no_entrada' ? '#C53030'
                    : '#718096' }}>
                    {alumno.estado_asistencia === 'presente'   ? '✅'
                   : alumno.estado_asistencia === 'retardo'    ? '⏰'
                   : alumno.estado_asistencia === 'no_entrada' ? '🚫'
                   : '⬜'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  greeting: { fontSize: 24, fontWeight: '900', color: '#2D3748' },
  fecha: { fontSize: 14, fontWeight: '600', color: '#718096', marginTop: 2, textTransform: 'capitalize' },
  avatarMaestra: {
    width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: '#E9D5FF',
    alignItems: 'center', justifyContent: 'center',
  },
  qrBanner: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#805AD5', borderRadius: RADIUS.xl, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#805AD5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  qrBannerEmoji: { fontSize: 32 },
  qrBannerTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  qrBannerSub: { color: '#E9D5FF', fontWeight: '600', fontSize: 12, marginTop: 2 },
  tareasHoyBanner: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#DBEAFE', borderRadius: RADIUS.xl, padding: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  alertaBanner: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#FEE2E2', borderRadius: RADIUS.xl, padding: 16, borderLeftWidth: 4, borderLeftColor: '#EF4444',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  bannerEmoji: { fontSize: 28 },
  bannerTitle: { color: '#1E40AF', fontWeight: '900', fontSize: 14 },
  bannerSub: { color: '#1E3A8A', fontWeight: '600', fontSize: 12, marginTop: 2 },
  bannerCount: { fontSize: 24, fontWeight: '900', color: '#3B82F6' },
  alertaTitle: { color: '#DC2626', fontWeight: '900', fontSize: 14 },
  alertaSub: { color: '#991B1B', fontWeight: '600', fontSize: 12, marginTop: 2 },
  alertaItem: { fontSize: 12, color: '#7F1D1D', fontWeight: '600', marginBottom: 4 },
  sectionTitle: {
    fontSize: 18, fontWeight: '900', color: '#2D3748',
    marginHorizontal: 16, marginTop: 20, marginBottom: 12,
  },
  accionesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16,
  },
  accionBtn: {
    width: '46%', borderRadius: RADIUS.xl, borderWidth: 2,
    padding: 20, alignItems: 'center', gap: 8,
  },
  accionLabel: { fontWeight: '800', fontSize: 14 },
  alumnosList: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },
  alumnoCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  alumnoFoto: { width: 56, height: 56, borderRadius: RADIUS.lg },
  alumnoFotoPlaceholder: {
    backgroundColor: '#E9D5FF', alignItems: 'center', justifyContent: 'center',
  },
  alumnoNombre: { fontWeight: '800', fontSize: 15, color: '#2D3748' },
  alumnoAnimo: { fontSize: 13, fontWeight: '600', color: '#718096', marginTop: 2 },
  estadoBadge: {
    width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center',
  },
});

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

function proximos3Dias() {
  const hoy = new Date();
  const hasta = new Date(hoy);
  hasta.setDate(hoy.getDate() + 3);
  return {
    desde: hoy.toISOString().substring(0, 10),
    hasta: hasta.toISOString().substring(0, 10),
  };
}

const EMOJIS_ANIMO = { feliz: '😊', triste: '😢', cansado: '😴', inquieto: '😤', energico: '⚡' };
const EMOJIS_COMIDA = { todo: '😋', casi_todo: '😊', poco: '😐', no_comio: '❌' };

const CONDUCTA_STYLE = {
  muy_bien:         { emoji: '⭐', label: 'Excelente', badge: { backgroundColor: '#F0FFF4' }, text: { color: '#276749' } },
  bien:             { emoji: '👍', label: 'Bien',      badge: { backgroundColor: '#EBF8FF' }, text: { color: '#2B6CB0' } },
  necesita_mejorar: { emoji: '⚠️', label: 'Mejorar',  badge: { backgroundColor: '#FFFAF0' }, text: { color: '#C05621' } },
};

const SALUDO_PARENTESCO = { madre: 'Mamá', papa: 'Papá', padre: 'Papá' };
function saludoPadre(parentesco, nombre) {
  const titulo = SALUDO_PARENTESCO[parentesco?.toLowerCase()];
  return titulo ? `¡Hola, ${titulo} ${nombre?.split(' ')[0]}!` : `¡Hola, ${nombre?.split(' ')[0]}!`;
}

function ModalEvento({ ev, onClose }) {
  if (!ev) return null;
  const fechaInicio = new Date(ev.fecha_inicio.substring(0, 10) + 'T12:00:00');
  const fechaFin = ev.fecha_fin ? new Date(ev.fecha_fin.substring(0, 10) + 'T12:00:00') : null;
  const fmtFecha = d => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Ícono + categoría */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 40 }}>{ev.categoria_icono || '📅'}</Text>
            {ev.categoria_nombre && (
              <View style={[styles.categoriaBadge, { backgroundColor: (ev.categoria_color || '#805AD5') + '20' }]}>
                <Text style={[styles.categoriaTxt, { color: ev.categoria_color || '#805AD5' }]}>
                  {ev.categoria_nombre}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.modalTitulo}>{ev.titulo}</Text>

          <Text style={styles.modalFecha}>
            📆 {fmtFecha(fechaInicio)}
            {fechaFin && fechaFin.getTime() !== fechaInicio.getTime() ? `\n   → ${fmtFecha(fechaFin)}` : ''}
          </Text>

          {ev.grupo_nombre && (
            <Text style={styles.modalGrupo}>👥 {ev.grupo_nombre}</Text>
          )}

          {ev.descripcion && (
            <View style={styles.modalDescBox}>
              <Text style={styles.modalDesc}>{ev.descripcion}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.modalCerrarBtn} onPress={onClose}>
            <Text style={styles.modalCerrarTxt}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function PadreDashboard() {
  const { usuario } = useAuthStore();
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: hijos, isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });

  const { desde, hasta } = proximos3Dias();
  const { data: eventosProximos = [] } = useQuery({
    queryKey: ['eventos-proximos', desde],
    queryFn: () => api.get(`/calendario?desde=${desde}&hasta=${hasta}`).then(r => r.data),
  });

  return (
    <SafeAreaView style={styles.container}>
      <ModalEvento ev={eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {saludoPadre(usuario?.parentesco, usuario?.nombre)} 👋
            </Text>
            <Text style={styles.fecha}>{hoy}</Text>
          </View>
          <Text style={{ fontSize: 36 }}>👨🏻‍👩🏻‍👧🏻</Text>
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

        {/* Próximos eventos */}
        {eventosProximos.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>📅 Próximos eventos</Text>
            {eventosProximos.map(ev => {
              const fecha = new Date(ev.fecha_inicio.substring(0, 10) + 'T12:00:00');
              const etiqueta = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <TouchableOpacity key={ev.id} style={styles.eventoCard} onPress={() => setEventoSeleccionado(ev)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 20 }}>{ev.categoria_icono || '📅'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventoTitulo} numberOfLines={1}>{ev.titulo}</Text>
                    <Text style={styles.eventoFecha}>{etiqueta}</Text>
                  </View>
                  <Text style={{ color: '#A0AEC0', fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              );
            })}
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
            <Text style={{ fontSize: 40 }}>👧🏻</Text>
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
        <View style={styles.bitacoraBody}>
          {/* Grid 2x2: Ánimo, Conducta, Fiebre, Incidente */}
          <View style={styles.gridContainer}>
            {/* Ánimo */}
            <View style={styles.gridCell}>
              <Text style={styles.animoEmoji}>{EMOJIS_ANIMO[hijo.bitacora_hoy.estado_animo] || '🤔'}</Text>
              <View style={styles.animoLabelBox}>
                <Text style={styles.animoTitleLabel}>Ánimo</Text>
                <Text style={styles.animoNombre}>{(hijo.bitacora_hoy.estado_animo || '').replace('_', ' ')}</Text>
              </View>
            </View>

            {/* Conducta */}
            {hijo.bitacora_hoy.comportamiento && (
              <View style={styles.gridCell}>
                <Text style={styles.animoEmoji}>{CONDUCTA_STYLE[hijo.bitacora_hoy.comportamiento]?.emoji}</Text>
                <View style={styles.animoLabelBox}>
                  <Text style={styles.animoTitleLabel}>Conducta</Text>
                  <Text style={styles.animoNombre}>{CONDUCTA_STYLE[hijo.bitacora_hoy.comportamiento]?.label}</Text>
                </View>
              </View>
            )}

            {/* Fiebre */}
            {hijo.bitacora_hoy.tuvo_fiebre && (
              <View style={[styles.gridCell, styles.alertaRoja]}>
                <Text style={styles.alertaEmoji}>🌡️</Text>
                <Text style={styles.alertaTxt}>Tuvo fiebre</Text>
              </View>
            )}

            {/* Incidente */}
            {hijo.bitacora_hoy.incidentes_sin_firmar > 0 && (
              <View style={[styles.gridCell, styles.alertaNaranja]}>
                <Text style={styles.alertaEmoji}>⚠️</Text>
                <Text style={styles.alertaNaranjaTxt}>
                  {hijo.bitacora_hoy.incidentes_sin_firmar === 1 ? '1 incidente' : `${hijo.bitacora_hoy.incidentes_sin_firmar} incidentes`}
                </Text>
              </View>
            )}
          </View>

          {/* Notas maestra */}
          {hijo.bitacora_hoy.notas && (
            <View style={styles.notasBox}>
              <Text style={styles.notasTxt}>💬 {hijo.bitacora_hoy.notas}</Text>
            </View>
          )}
        </View>
      )}

      {!hijo.bitacora_hoy && (
        <Text style={styles.sinBitacora}>La bitácora de hoy aún no está lista 📝</Text>
      )}

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
  sinBitacora: {
    padding: 16, textAlign: 'center', color: '#A0AEC0', fontWeight: '600', fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: '900', color: '#2D3748',
    marginHorizontal: 16, marginTop: 8, marginBottom: 12,
  },
  eventoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#BEE3F8',
    shadowColor: '#3182CE', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
  },
  eventoTitulo: { fontSize: 14, fontWeight: '800', color: '#2D3748' },
  eventoFecha: { fontSize: 12, fontWeight: '600', color: '#3182CE', textTransform: 'capitalize', marginTop: 2 },
  accionesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, paddingBottom: 24,
  },
  accionBtn: {
    width: '46%', borderRadius: 20, borderWidth: 2,
    padding: 20, alignItems: 'center', gap: 8,
  },
  accionLabel: { fontWeight: '800', fontSize: 14 },
  bitacoraBody: { padding: 16, gap: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCell: { flex: 1, minWidth: '48%', alignItems: 'center', gap: 8 },
  animoEmoji: { fontSize: 44 },
  animoLabelBox: { alignItems: 'center' },
  animoTitleLabel: { fontSize: 10, fontWeight: '700', color: '#A0AEC0', textTransform: 'uppercase' },
  animoNombre: { fontSize: 13, fontWeight: '700', color: '#4A5568', textTransform: 'capitalize' },
  alertaRoja: { flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFF5F5', borderRadius: 12, borderWidth: 1, borderColor: '#FED7D7', padding: 10, gap: 6 },
  alertaEmoji: { fontSize: 28 },
  alertaTxt: { fontSize: 11, fontWeight: '800', color: '#C53030' },
  alertaNaranja: { flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFFAF0', borderRadius: 12, borderWidth: 1, borderColor: '#FEEBC8', padding: 10, gap: 6 },
  alertaNaranjaTxt: { fontSize: 11, fontWeight: '800', color: '#C05621' },
  notasBox: { backgroundColor: '#FFFFF0', borderRadius: 12, padding: 10 },
  notasTxt: { fontSize: 13, color: '#744210', fontStyle: 'italic' },

  // Modal evento
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitulo: { fontSize: 20, fontWeight: '900', color: '#2D3748', marginBottom: 8 },
  modalFecha: { fontSize: 14, fontWeight: '700', color: '#3182CE', marginBottom: 4, textTransform: 'capitalize' },
  modalGrupo: { fontSize: 13, fontWeight: '600', color: '#718096', marginBottom: 8 },
  modalDescBox: { backgroundColor: '#F7FAFC', borderRadius: 14, padding: 14, marginTop: 8 },
  modalDesc: { fontSize: 14, color: '#4A5568', lineHeight: 22 },
  categoriaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoriaTxt: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalCerrarBtn: {
    marginTop: 20, backgroundColor: '#EDF2F7', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center',
  },
  modalCerrarTxt: { fontWeight: '800', color: '#4A5568', fontSize: 15 },
});

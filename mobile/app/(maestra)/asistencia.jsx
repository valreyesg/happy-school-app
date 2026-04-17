import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ahora() {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  return h * 60 + m;
}

function modoEntrada() {
  const min = ahora();
  return min >= 7 * 60 && min <= 8 * 60 + 30; // 7:00 – 8:30
}

const ESTADO_CONFIG = {
  presente:     { label: 'Presente',    color: '#38A169', bg: '#C6F6D5', icon: '✓' },
  retardo:      { label: 'Retardo',     color: '#D69E2E', bg: '#FEFCBF', icon: '⏰' },
  ausente:      { label: 'Ausente',     color: '#E53E3E', bg: '#FED7D7', icon: '✗' },
  no_entrada:   { label: 'No entró',   color: '#718096', bg: '#EDF2F7', icon: '—' },
  pendiente:    { label: 'Pendiente',   color: '#805AD5', bg: '#FAF5FF', icon: '?' },
};

function estadoAlumno(a) {
  if (!a.asistencia_hoy) return 'pendiente';
  return a.asistencia_hoy.estado || 'pendiente';
}

// ─── Modal registro manual ────────────────────────────────────────────────────
function ModalManual({ alumno, visible, onClose, onGuardar }) {
  const [estado, setEstado] = useState('presente');
  const [temperatura, setTemperatura] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    setSaving(true);
    try {
      await onGuardar({ alumno_id: alumno.id, estado, temperatura: temperatura ? parseFloat(temperatura) : null, notas });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo registrar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <Text style={m.titulo}>Registro manual</Text>
          <Text style={m.nombre}>{alumno?.nombre_completo}</Text>

          <Text style={m.label}>Estado de asistencia</Text>
          <View style={m.estadoRow}>
            {['presente', 'retardo', 'ausente'].map(e => {
              const cfg = ESTADO_CONFIG[e];
              return (
                <TouchableOpacity
                  key={e}
                  style={[m.estadoBtn, { borderColor: cfg.color }, estado === e && { backgroundColor: cfg.color }]}
                  onPress={() => setEstado(e)}
                >
                  <Text style={[m.estadoBtnTxt, estado === e && { color: '#fff' }]}>{cfg.icon} {cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={m.label}>Temperatura (opcional)</Text>
          <TextInput
            style={m.input}
            placeholder="Ej. 36.5"
            value={temperatura}
            onChangeText={setTemperatura}
            keyboardType="decimal-pad"
          />

          <Text style={m.label}>Notas (opcional)</Text>
          <TextInput
            style={[m.input, { minHeight: 60 }]}
            placeholder="Observaciones de entrada…"
            value={notas}
            onChangeText={setNotas}
            multiline
            textAlignVertical="top"
          />

          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
              <Text style={m.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[m.guardarBtn, saving && { opacity: 0.6 }]} onPress={guardar} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={m.guardarTxt}>Registrar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Tarjeta de alumno ────────────────────────────────────────────────────────
function TarjetaAlumno({ alumno, onRegistrar }) {
  const estado = estadoAlumno(alumno);
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
  const asistencia = alumno.asistencia_hoy;

  return (
    <TouchableOpacity
      style={[s.card, estado === 'pendiente' && s.cardPendiente]}
      onPress={() => onRegistrar(alumno)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[s.avatar, { backgroundColor: cfg.color }]}>
        <Text style={s.avatarTxt}>{alumno.nombre_completo.charAt(0)}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={s.nombre}>{alumno.nombre_completo}</Text>
        {asistencia?.hora_entrada && (
          <Text style={s.hora}>
            Entrada: {new Date(asistencia.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            {asistencia.retardo ? ' · Retardo' : ''}
          </Text>
        )}
        {asistencia?.temperatura && (
          <Text style={s.hora}>🌡 {asistencia.temperatura}°C</Text>
        )}
      </View>

      {/* Badge estado */}
      <View style={[s.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function AsistenciaScreen() {
  const queryClient = useQueryClient();
  const [alumnoModal, setAlumnoModal] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos | pendientes | presentes
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mi-grupo-asistencia'],
    queryFn: () => api.get('/grupos/mi-grupo').then(r => r.data),
    refetchInterval: 30_000, // actualiza cada 30s automáticamente
  });

  const registrarMutation = useMutation({
    mutationFn: (body) => api.post('/asistencia/entrada', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['mi-grupo-asistencia']);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useFocusEffect(useCallback(() => {
    refetch();
  }, [refetch]));

  const grupo = data;
  const alumnos = data?.alumnos || [];

  // Filtros
  const alumnosFiltrados = alumnos.filter(a => {
    const coincide = a.nombre_completo.toLowerCase().includes(busqueda.toLowerCase());
    if (!coincide) return false;
    if (filtro === 'pendientes') return estadoAlumno(a) === 'pendiente';
    if (filtro === 'presentes')  return ['presente', 'retardo'].includes(estadoAlumno(a));
    return true;
  });

  // Conteos
  const presentes = alumnos.filter(a => ['presente', 'retardo'].includes(estadoAlumno(a))).length;
  const pendientes = alumnos.filter(a => estadoAlumno(a) === 'pendiente').length;
  const ausentes   = alumnos.filter(a => estadoAlumno(a) === 'ausente').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitulo}>Asistencia</Text>
          {grupo && <Text style={s.headerSub}>{grupo.nombre} · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>}
        </View>
        {modoEntrada() && (
          <View style={s.modoBadge}>
            <Text style={s.modoBadgeTxt}>🚪 Entrada</Text>
          </View>
        )}
      </View>

      {/* Semáforo resumen */}
      {!isLoading && alumnos.length > 0 && (
        <View style={s.resumen}>
          <TouchableOpacity style={s.resumenItem} onPress={() => setFiltro(filtro === 'presentes' ? 'todos' : 'presentes')}>
            <Text style={[s.resumenNum, { color: '#38A169' }]}>{presentes}</Text>
            <Text style={s.resumenLabel}>Presentes</Text>
          </TouchableOpacity>
          <View style={s.resumenDiv} />
          <TouchableOpacity style={s.resumenItem} onPress={() => setFiltro(filtro === 'pendientes' ? 'todos' : 'pendientes')}>
            <Text style={[s.resumenNum, { color: '#805AD5' }]}>{pendientes}</Text>
            <Text style={s.resumenLabel}>Pendientes</Text>
          </TouchableOpacity>
          <View style={s.resumenDiv} />
          <View style={s.resumenItem}>
            <Text style={[s.resumenNum, { color: '#E53E3E' }]}>{ausentes}</Text>
            <Text style={s.resumenLabel}>Ausentes</Text>
          </View>
        </View>
      )}

      {/* Buscador y filtros */}
      <View style={s.buscadorRow}>
        <TextInput
          style={s.buscador}
          placeholder="Buscar alumno…"
          value={busqueda}
          onChangeText={setBusqueda}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={s.filtroRow}>
        {[
          { key: 'todos',      label: 'Todos' },
          { key: 'pendientes', label: 'Pendientes' },
          { key: 'presentes',  label: 'Presentes' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filtroBtn, filtro === f.key && s.filtroBtnOn]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[s.filtroTxt, filtro === f.key && s.filtroTxtOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#805AD5" />
          <Text style={s.loadingTxt}>Cargando grupo…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#805AD5" />}
        >
          {alumnosFiltrados.length === 0 ? (
            <Text style={s.emptyTxt}>
              {busqueda ? 'No hay resultados para tu búsqueda.' : 'No hay alumnos en este filtro.'}
            </Text>
          ) : (
            alumnosFiltrados.map(a => (
              <TarjetaAlumno key={a.id} alumno={a} onRegistrar={setAlumnoModal} />
            ))
          )}
        </ScrollView>
      )}

      {/* Modal manual */}
      {alumnoModal && (
        <ModalManual
          alumno={alumnoModal}
          visible={!!alumnoModal}
          onClose={() => setAlumnoModal(null)}
          onGuardar={(body) => registrarMutation.mutateAsync(body)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos principales ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  loadingTxt: { marginTop: 12, color: '#718096', fontSize: 14, fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitulo: { fontSize: 22, fontWeight: '900', color: '#2D3748' },
  headerSub: { fontSize: 13, color: '#718096', marginTop: 2, fontWeight: '600' },
  modoBadge: { backgroundColor: '#38A169', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 2 },
  modoBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

  resumen: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FAFAFA' },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenNum: { fontSize: 26, fontWeight: '900' },
  resumenLabel: { fontSize: 11, fontWeight: '700', color: '#718096', marginTop: 2 },
  resumenDiv: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },

  buscadorRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  buscador: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#2D3748' },

  filtroRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filtroBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#EDF2F7' },
  filtroBtnOn: { backgroundColor: '#805AD5' },
  filtroTxt: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  filtroTxtOn: { color: '#fff' },

  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, padding: 14, backgroundColor: '#F7FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardPendiente: { borderColor: '#B794F4', borderWidth: 1.5 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  nombre: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
  hora: { fontSize: 12, color: '#718096', marginTop: 2, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: '800' },

  emptyTxt: { textAlign: 'center', color: '#A0AEC0', marginTop: 48, fontSize: 14, fontWeight: '600' },
});

// ─── Estilos del modal ────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  titulo: { fontSize: 18, fontWeight: '900', color: '#2D3748', marginBottom: 4 },
  nombre: { fontSize: 15, color: '#805AD5', fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  estadoRow: { flexDirection: 'row', gap: 8 },
  estadoBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
  estadoBtnTxt: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  input: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#2D3748' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EDF2F7', alignItems: 'center' },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: '#4A5568' },
  guardarBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#805AD5', alignItems: 'center' },
  guardarTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
});

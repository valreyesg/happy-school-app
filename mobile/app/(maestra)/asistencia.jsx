import { useState, useCallback } from 'react';
import { COLORS, RADIUS } from '@/constants/theme';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import Button from '@/components/Button';
import { ESTADO_CONFIG } from '@/constants/asistencia';
import SelectorFecha from '@/components/SelectorFecha';
import { ultimoDiaHabil } from '@/utils/fecha';

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

function estadoAlumno(a) {
  // El backend devuelve campos planos: a.estado_asistencia (no subobjeto asistencia_hoy)
  if (!a.estado_asistencia || a.estado_asistencia === 'ausente') return 'pendiente';
  return a.estado_asistencia;
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
            <Button
              variant="ghost"
              label="Cancelar"
              onPress={onClose}
            />
            <Button
              variant="primary"
              label="Registrar"
              onPress={guardar}
              disabled={saving}
              loading={saving}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function esCumpleanos(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date().toLocaleDateString('en-CA');
  const [, mesHoy, diaHoy] = hoy.split('-');
  const fn = new Date(fecha_nacimiento.substring(0, 10) + 'T12:00:00');
  return fn.getMonth() + 1 === parseInt(mesHoy) && fn.getDate() === parseInt(diaHoy);
}

function CheckBadge({ val, label }) {
  if (val === null || val === undefined) return null;
  return (
    <View style={[cb.badge, { backgroundColor: val ? '#F0FFF4' : '#FFF5F5', borderColor: val ? '#C6F6D5' : '#FED7D7' }]}>
      <Text style={[cb.txt, { color: val ? '#276749' : '#C53030' }]}>{val ? '✓' : '✗'} {label}</Text>
    </View>
  );
}
const cb = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, marginRight: 4, marginBottom: 4 },
  txt: { fontSize: 11, fontWeight: '800' },
});

// ─── Tarjeta de alumno ────────────────────────────────────────────────────────
function TarjetaAlumno({ alumno, onRegistrar }) {
  const estado = estadoAlumno(alumno);
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
  const yaRegistrado = estado !== 'pendiente';
  const [abierto, setAbierto] = useState(false);
  const cumple = esCumpleanos(alumno.fecha_nacimiento);

  const handlePress = () => {
    if (!yaRegistrado) {
      onRegistrar(alumno);
    } else {
      setAbierto(v => !v);
    }
  };

  return (
    <View style={[s.card, estado === 'pendiente' && s.cardPendiente]}>
      {/* Banner cumpleaños */}
      {cumple && (
        <View style={s.cumpleBanner}>
          <Text style={s.cumpleTxt}>🎂 ¡Hoy es el cumple de {alumno.nombre_completo.split(' ')[0]}! 🎈</Text>
        </View>
      )}

      {/* Fila principal */}
      <TouchableOpacity style={s.cardRow} onPress={handlePress} activeOpacity={0.7}>
        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: cfg.color }]}>
          <Text style={s.avatarTxt}>{alumno.nombre_completo.charAt(0)}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={s.nombre}>{alumno.nombre_completo}</Text>
          {alumno.hora_entrada && (
            <Text style={s.hora}>
              Entrada: {new Date(alumno.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              {alumno.es_retardo ? ' · Retardo' : ''}
            </Text>
          )}
          {alumno.temperatura && (
            <Text style={s.hora}>🌡 {alumno.temperatura}°C</Text>
          )}
        </View>

        {/* Badge estado */}
        <View style={[s.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
        </View>

        {/* Flecha expandir */}
        {yaRegistrado && (
          <Text style={{ color: '#A0AEC0', fontSize: 16, marginLeft: 4 }}>{abierto ? '▲' : '▼'}</Text>
        )}
      </TouchableOpacity>

      {/* Detalle expandible — solo alumnos ya registrados */}
      {abierto && yaRegistrado && (
        <View style={s.detalle}>
          {alumno.motivo_no_entrada && (
            <View style={s.motivoBox}>
              <Text style={s.motivoTxt}>🚫 {alumno.motivo_no_entrada}</Text>
            </View>
          )}
          <Text style={s.detalleSub}>Salud</Text>
          <View style={s.detalleRow}>
            <CheckBadge val={alumno.sin_fiebre}   label="Sin fiebre" />
            <CheckBadge val={alumno.sin_sintomas} label="Sin síntomas" />
          </View>
          <Text style={s.detalleSub}>Higiene</Text>
          <View style={s.detalleRow}>
            <CheckBadge val={alumno.uñas_cortadas} label="Uñas" />
            <CheckBadge val={alumno.sin_lagañas}   label="Sin lagañas" />
            {alumno.panial_limpio !== null && <CheckBadge val={alumno.panial_limpio} label="Pañal" />}
          </View>
          <Text style={s.detalleSub}>Materiales</Text>
          <View style={s.detalleRow}>
            <CheckBadge val={alumno.trae_uniforme}   label="Uniforme" />
            <CheckBadge val={alumno.trae_bata}       label="Bata" />
            <CheckBadge val={alumno.trae_termo}      label="Termo" />
            <CheckBadge val={alumno.agua_suficiente} label="Agua" />
          </View>
          {alumno.qr_escaneado && (
            <Text style={{ fontSize: 11, color: '#805AD5', fontWeight: '700', marginTop: 4 }}>📱 Entrada por QR</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Selector de fecha ────────────────────────────────────────────────────────

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function AsistenciaScreen() {
  const queryClient = useQueryClient();
  const [alumnoModal, setAlumnoModal] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos | pendientes | presentes
  const [refreshing, setRefreshing] = useState(false);

  const [fecha, setFecha] = useState(ultimoDiaHabil);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mi-grupo-asistencia', fecha],
    queryFn: () => api.get(`/grupos/mi-grupo?fecha=${fecha}`).then(r => r.data),
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitulo}>Asistencia</Text>
          {grupo && <Text style={s.headerSub}>{grupo.nombre}</Text>}
        </View>
        {modoEntrada() && (
          <View style={s.modoBadge}>
            <Text style={s.modoBadgeTxt}>🚪 Entrada</Text>
          </View>
        )}
      </View>

      {/* Selector de fecha */}
      <SelectorFecha fecha={fecha} onChange={(f) => { setFecha(f); setFiltro('todos'); setBusqueda(''); }} />

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
          <Button
            key={f.key}
            variant={filtro === f.key ? 'primary' : 'ghost'}
            size="sm"
            label={f.label}
            onPress={() => setFiltro(f.key)}
          />
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
  modoBadge: { backgroundColor: '#38A169', paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.xl, marginTop: 2 },
  modoBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

  // Selector de fecha
  fechaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: COLORS.white },
  fechaBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fechaBtnTxt: { fontSize: 28, color: '#805AD5', fontWeight: '900', lineHeight: 32 },
  fechaTxt: { fontSize: 13, fontWeight: '700', color: '#4A5568', textAlign: 'center', textTransform: 'capitalize' },
  hoyBadge: { fontSize: 10, fontWeight: '900', color: '#805AD5', marginTop: 2 },

  resumen: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FAFAFA' },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenNum: { fontSize: 26, fontWeight: '900' },
  resumenLabel: { fontSize: 11, fontWeight: '700', color: '#718096', marginTop: 2 },
  resumenDiv: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },

  buscadorRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  buscador: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#2D3748' },

  filtroRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filtroBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.xl, backgroundColor: '#EDF2F7' },
  filtroBtnOn: { backgroundColor: '#805AD5' },
  filtroTxt: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  filtroTxtOn: { color: '#fff' },

  card: { marginHorizontal: 16, marginTop: 10, backgroundColor: '#F7FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  cardPendiente: { borderColor: '#B794F4', borderWidth: 1.5 },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  cumpleBanner: { backgroundColor: '#FEFCBF', borderBottomWidth: 1, borderBottomColor: '#F6E05E', paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  cumpleTxt: { fontSize: 13, fontWeight: '900', color: '#744210' },
  detalle: { backgroundColor: '#F7FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  detalleSub: { fontSize: 10, fontWeight: '900', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  detalleRow: { flexDirection: 'row', flexWrap: 'wrap' },
  motivoBox: { backgroundColor: '#FFF5F5', borderRadius: 8, padding: 8, marginBottom: 8 },
  motivoTxt: { fontSize: 12, fontWeight: '700', color: '#C53030' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  nombre: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
  hora: { fontSize: 12, color: '#718096', marginTop: 2, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.xl },
  badgeTxt: { fontSize: 11, fontWeight: '800' },

  emptyTxt: { textAlign: 'center', color: '#A0AEC0', marginTop: 48, fontSize: 14, fontWeight: '600' },
});

// ─── Estilos del modal ────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  titulo: { fontSize: 18, fontWeight: '900', color: '#2D3748', marginBottom: 4 },
  nombre: { fontSize: 15, color: '#805AD5', fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  estadoRow: { flexDirection: 'row', gap: 8 },
  estadoBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 2, alignItems: 'center' },
  estadoBtnTxt: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  input: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: '#2D3748' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: '#EDF2F7', alignItems: 'center' },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: '#4A5568' },
  guardarBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: '#805AD5', alignItems: 'center' },
  guardarTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
});

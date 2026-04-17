import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';

// ─── Catálogos de display ─────────────────────────────────────────────────────

const ANIMO = {
  feliz:     { emoji: '😊', label: 'Feliz' },
  activo:    { emoji: '⚡', label: 'Activo' },
  cansado:   { emoji: '😴', label: 'Cansado' },
  triste:    { emoji: '😢', label: 'Triste' },
  irritable: { emoji: '😤', label: 'Irritable' },
};

const CUANTO = {
  todo:       { emoji: '🍽️', label: 'Todo' },
  casi_todo:  { emoji: '🥢', label: 'Casi todo' },
  poco:       { emoji: '🍱', label: 'Poco' },
  no_comio:   { emoji: '❌', label: 'No comió' },
};

const COMPORTAMIENTO = {
  excelente:        { emoji: '⭐', label: 'Excelente', color: '#D69E2E' },
  bueno:            { emoji: '👍', label: 'Bueno',     color: '#38A169' },
  necesita_mejorar: { emoji: '⚠️', label: 'A mejorar', color: '#E53E3E' },
};

// ─── Helpers visuales ─────────────────────────────────────────────────────────

function Seccion({ titulo, emoji, children }) {
  return (
    <View style={s.seccion}>
      <Text style={s.seccionTitulo}>{emoji} {titulo}</Text>
      {children}
    </View>
  );
}

function FilaInfo({ label, valor, negrita }) {
  if (valor === undefined || valor === null || valor === '') return null;
  return (
    <View style={s.fila}>
      <Text style={s.filaLabel}>{label}</Text>
      <Text style={[s.filaValor, negrita && { fontWeight: '800', color: '#2D3748' }]}>{valor}</Text>
    </View>
  );
}

function PildoraBool({ label, valor }) {
  if (valor === null || valor === undefined) return null;
  return (
    <View style={[s.pildora, { backgroundColor: valor ? '#C6F6D5' : '#EDF2F7' }]}>
      <Text style={[s.pildoraTxt, { color: valor ? '#276749' : '#718096' }]}>
        {valor ? '✓' : '✗'} {label}
      </Text>
    </View>
  );
}

// ─── Selector de fecha ────────────────────────────────────────────────────────

function SelectorFecha({ fecha, onChange }) {
  const date = new Date(fecha + 'T12:00:00');
  const anterior = new Date(date);
  anterior.setDate(anterior.getDate() - 1);
  const siguiente = new Date(date);
  siguiente.setDate(siguiente.getDate() + 1);
  const hoy = new Date().toISOString().split('T')[0];
  const esHoy = fecha === hoy;

  const fmt = (d) => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={s.fechaRow}>
      <TouchableOpacity
        style={s.fechaBtn}
        onPress={() => onChange(anterior.toISOString().split('T')[0])}
      >
        <Text style={s.fechaBtnTxt}>‹</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={s.fechaTxt}>{fmt(date)}</Text>
        {esHoy && <Text style={s.hoyBadge}>Hoy</Text>}
      </View>
      <TouchableOpacity
        style={[s.fechaBtn, esHoy && s.fechaBtnDis]}
        onPress={() => !esHoy && onChange(siguiente.toISOString().split('T')[0])}
        disabled={esHoy}
      >
        <Text style={[s.fechaBtnTxt, esHoy && { color: '#CBD5E0' }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function BitacoraPadreScreen() {
  const { alumnoId, nombre } = useLocalSearchParams();
  const router = useRouter();
  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(hoy);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bitacora-padre', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
    enabled: !!alumnoId,
    retry: 1,
  });

  const bit = data?.bitacora;
  const banio = data?.banio;
  const comida = data?.comida;
  const panial = data?.panial || [];
  const esfinteres = data?.esfinteres;
  const medicamentos = data?.medicamentos || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F8' }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>← Inicio</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>{decodeURIComponent(nombre || 'Mi hijo')}</Text>
        <Text style={s.headerSub}>Bitácora del día</Text>
      </View>

      {/* Selector de fecha */}
      <SelectorFecha fecha={fecha} onChange={setFecha} />

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#E53E3E" />
          <Text style={s.loadingTxt}>Cargando bitácora…</Text>
        </View>
      ) : isError ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text style={s.emptyTxt}>No se pudo cargar la bitácora.</Text>
        </View>
      ) : !bit ? (
        /* Sin bitácora ese día */
        <View style={s.center}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>📝</Text>
          <Text style={s.emptyTitulo}>Bitácora no disponible</Text>
          <Text style={s.emptyTxt}>
            {fecha === hoy
              ? 'La maestra aún no ha guardado la bitácora de hoy. Vuelve a revisar más tarde.'
              : 'No hay registro para esta fecha.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

          {/* ─ Estado de ánimo (héroe) ─ */}
          <View style={s.animoHero}>
            <Text style={s.animoEmoji}>{ANIMO[bit.estado_animo]?.emoji || '🤔'}</Text>
            <Text style={s.animoLabel}>{ANIMO[bit.estado_animo]?.label || 'Sin registrar'}</Text>
            <Text style={s.animoSub}>Estado de ánimo del día</Text>
          </View>

          {/* ─ Resumen rápido ─ */}
          <View style={s.resumenRow}>
            <View style={s.resumenItem}>
              <Text style={s.resumenEmoji}>{comida ? (CUANTO[comida.cuanto_comio]?.emoji || '🍽️') : '—'}</Text>
              <Text style={s.resumenLabel}>Comida</Text>
            </View>
            <View style={s.resumenDiv} />
            <View style={s.resumenItem}>
              <Text style={s.resumenEmoji}>{bit.tarea_realizada === true ? '📚' : bit.tarea_realizada === false ? '📖' : '—'}</Text>
              <Text style={s.resumenLabel}>Tarea</Text>
            </View>
            <View style={s.resumenDiv} />
            <View style={s.resumenItem}>
              <Text style={s.resumenEmoji}>{COMPORTAMIENTO[bit.comportamiento]?.emoji || '—'}</Text>
              <Text style={s.resumenLabel}>Conducta</Text>
            </View>
            <View style={s.resumenDiv} />
            <View style={s.resumenItem}>
              <Text style={s.resumenEmoji}>{bit.tuvo_fiebre ? '🤒' : '😊'}</Text>
              <Text style={s.resumenLabel}>Salud</Text>
            </View>
          </View>

          {/* ─ Alimentación ─ */}
          {comida && (
            <Seccion titulo="Alimentación" emoji="🍽️">
              {comida.que_comio && <Text style={s.textoNormal}>{comida.que_comio}</Text>}
              <FilaInfo label="¿Cuánto comió?" valor={CUANTO[comida.cuanto_comio]?.label} negrita />
              <FilaInfo label="Observaciones" valor={comida.observaciones} />
            </Seccion>
          )}

          {/* ─ Tarea y comportamiento ─ */}
          <Seccion titulo="Tarea y conducta" emoji="📚">
            <FilaInfo
              label="Tarea"
              valor={bit.tarea_realizada === true ? 'Sí realizó la tarea ✓' : bit.tarea_realizada === false ? 'No realizó la tarea ✗' : null}
              negrita
            />
            {bit.comportamiento && (
              <View style={[s.compBadge, { backgroundColor: COMPORTAMIENTO[bit.comportamiento]?.color + '20' }]}>
                <Text style={{ fontSize: 20 }}>{COMPORTAMIENTO[bit.comportamiento]?.emoji}</Text>
                <Text style={[s.compLabel, { color: COMPORTAMIENTO[bit.comportamiento]?.color }]}>
                  {COMPORTAMIENTO[bit.comportamiento]?.label}
                </Text>
              </View>
            )}
            <FilaInfo label="Notas de conducta" valor={bit.comportamiento_notas} />
          </Seccion>

          {/* ─ Baño ─ */}
          {banio && (
            <Seccion titulo="Baño" emoji="🚿">
              <View style={s.banioRow}>
                <View style={s.banioItem}>
                  <Text style={s.banioNum}>{banio.pipi_count || 0}</Text>
                  <Text style={s.banioLabel}>Pipí 🚿</Text>
                </View>
                <View style={s.banioItem}>
                  <Text style={s.banioNum}>{banio.popo_count || 0}</Text>
                  <Text style={s.banioLabel}>Popó 💩</Text>
                </View>
              </View>
            </Seccion>
          )}

          {/* ─ Pañal (Maternal) ─ */}
          {panial.length > 0 && (
            <Seccion titulo="Cambios de pañal" emoji="👶">
              {panial.map((p, i) => (
                <View key={i} style={s.panialLog}>
                  <Text style={s.panialHora}>
                    {new Date(p.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={s.panialCondicion}>
                    {p.condicion.charAt(0).toUpperCase() + p.condicion.slice(1)}
                    {p.tiene_irritacion ? ' · ⚠️ irritación' : ''}
                  </Text>
                </View>
              ))}
            </Seccion>
          )}

          {/* ─ Control de esfínteres ─ */}
          {esfinteres && (
            <Seccion titulo="Control de esfínteres" emoji="🚽">
              <View style={s.pildoraRow}>
                <PildoraBool label="Fue solo/a" valor={esfinteres.fue_solo} />
                <PildoraBool label="Pidió ir" valor={esfinteres.pidio_ir} />
                <PildoraBool label="Accidente" valor={esfinteres.tuvo_accidente} />
                <PildoraBool label="Necesitó ayuda" valor={esfinteres.necesito_ayuda} />
              </View>
              <FilaInfo label="Notas de progreso" valor={esfinteres.notas_progreso} />
            </Seccion>
          )}

          {/* ─ Salud ─ */}
          {(bit.tuvo_fiebre || bit.se_enfermo) && (
            <Seccion titulo="Salud" emoji="🌡️">
              {bit.tuvo_fiebre && (
                <View style={s.alertaRoja}>
                  <Text style={s.alertaTxt}>
                    🌡 Tuvo fiebre{bit.temperatura_dia ? ` — ${bit.temperatura_dia}°C` : ''}
                  </Text>
                </View>
              )}
              {bit.se_enfermo && (
                <View style={s.alertaRoja}>
                  <Text style={s.alertaTxt}>⚕️ {bit.descripcion_enfermedad || 'Presentó malestar'}</Text>
                </View>
              )}
            </Seccion>
          )}

          {/* ─ Medicamentos ─ */}
          {medicamentos.length > 0 && (
            <Seccion titulo="Medicamentos" emoji="💊">
              {medicamentos.map((m, i) => (
                <View key={i} style={s.medCard}>
                  <Text style={s.medNombre}>{m.nombre}</Text>
                  <Text style={s.medDetalle}>
                    Dosis: {m.dosis} · {new Date(m.hora_administracion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {m.notas && <Text style={s.medNotas}>{m.notas}</Text>}
                </View>
              ))}
            </Seccion>
          )}

          {/* ─ Notas generales ─ */}
          {bit.notas && (
            <Seccion titulo="Mensaje de la maestra" emoji="💬">
              <View style={s.notasBox}>
                <Text style={s.notasTxt}>{bit.notas}</Text>
              </View>
            </Seccion>
          )}

          {/* ─ Maestra ─ */}
          {bit.maestra_nombre && (
            <Text style={s.maestraTxt}>Bitácora registrada por {bit.maestra_nombre}</Text>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTxt: { marginTop: 12, color: '#718096', fontSize: 14, fontWeight: '600' },
  emptyTitulo: { fontSize: 18, fontWeight: '900', color: '#2D3748', textAlign: 'center', marginBottom: 8 },
  emptyTxt: { fontSize: 14, color: '#A0AEC0', fontWeight: '600', textAlign: 'center', lineHeight: 22 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#FED7D7', backgroundColor: '#FFF8F8' },
  backBtn: { marginBottom: 4 },
  backTxt: { color: '#E53E3E', fontSize: 14, fontWeight: '700' },
  headerTitulo: { fontSize: 22, fontWeight: '900', color: '#2D3748' },
  headerSub: { fontSize: 13, color: '#718096', marginTop: 1, fontWeight: '600' },

  // Fecha
  fechaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FED7D7', backgroundColor: '#FFF8F8' },
  fechaBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fechaBtnDis: { opacity: 0.3 },
  fechaBtnTxt: { fontSize: 28, color: '#E53E3E', fontWeight: '900', lineHeight: 32 },
  fechaTxt: { fontSize: 13, fontWeight: '700', color: '#4A5568', textAlign: 'center', textTransform: 'capitalize' },
  hoyBadge: { fontSize: 10, fontWeight: '900', color: '#E53E3E', marginTop: 2 },

  // Ánimo héroe
  animoHero: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFF8F8', borderBottomWidth: 1, borderBottomColor: '#FED7D7' },
  animoEmoji: { fontSize: 64 },
  animoLabel: { fontSize: 22, fontWeight: '900', color: '#2D3748', marginTop: 8 },
  animoSub: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', marginTop: 4 },

  // Resumen rápido
  resumenRow: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#FED7D7' },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenEmoji: { fontSize: 28 },
  resumenLabel: { fontSize: 10, fontWeight: '700', color: '#A0AEC0', marginTop: 4 },
  resumenDiv: { width: 1, backgroundColor: '#FED7D7', marginVertical: 4 },

  // Sección
  seccion: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  seccionTitulo: { fontSize: 13, fontWeight: '900', color: '#E53E3E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Fila info
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#FFF5F5' },
  filaLabel: { fontSize: 13, color: '#718096', fontWeight: '600', flex: 1 },
  filaValor: { fontSize: 13, color: '#4A5568', fontWeight: '600', flex: 1, textAlign: 'right' },
  textoNormal: { fontSize: 14, color: '#4A5568', marginBottom: 8, lineHeight: 20 },

  // Comportamiento
  compBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 8 },
  compLabel: { fontSize: 16, fontWeight: '900' },

  // Baño
  banioRow: { flexDirection: 'row', justifyContent: 'space-around' },
  banioItem: { alignItems: 'center' },
  banioNum: { fontSize: 36, fontWeight: '900', color: '#2D3748' },
  banioLabel: { fontSize: 13, fontWeight: '700', color: '#718096' },

  // Pañal
  panialLog: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FFF5F5' },
  panialHora: { fontSize: 13, fontWeight: '900', color: '#805AD5', width: 52 },
  panialCondicion: { fontSize: 13, color: '#4A5568', fontWeight: '600' },

  // Esfínteres
  pildoraRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pildora: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pildoraTxt: { fontSize: 12, fontWeight: '700' },

  // Salud
  alertaRoja: { backgroundColor: '#FFF5F5', borderLeftWidth: 3, borderLeftColor: '#E53E3E', borderRadius: 8, padding: 12, marginBottom: 8 },
  alertaTxt: { fontSize: 14, fontWeight: '700', color: '#C53030' },

  // Medicamentos
  medCard: { backgroundColor: '#FAF5FF', borderRadius: 10, padding: 12, marginBottom: 8 },
  medNombre: { fontSize: 15, fontWeight: '900', color: '#44337A' },
  medDetalle: { fontSize: 12, color: '#805AD5', fontWeight: '600', marginTop: 2 },
  medNotas: { fontSize: 12, color: '#718096', marginTop: 4 },

  // Notas
  notasBox: { backgroundColor: '#FFFBEB', borderRadius: 10, padding: 14 },
  notasTxt: { fontSize: 14, color: '#4A5568', lineHeight: 22, fontStyle: 'italic' },

  maestraTxt: { textAlign: 'center', color: '#A0AEC0', fontSize: 12, fontWeight: '600', marginTop: 24, marginBottom: 8 },
});

import { useState, useEffect } from 'react';
import { COLORS, RADIUS } from '@/constants/theme';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, RADIUS } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { COLORS, RADIUS } from '@/constants/theme';
import api from '../../src/services/api';
import { COLORS, RADIUS } from '@/constants/theme';
import { useCatalogo } from '../../src/hooks/useCatalogo';
import { COLORS, RADIUS } from '@/constants/theme';

// ─── Catálogos de display ─────────────────────────────────────────────────────

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

// ─── Selector de ciclo ────────────────────────────────────────────────────────

function SelectorCiclo({ alumnoId, cicloId, onChangeCiclo }) {
  const { data: ciclos = [] } = useQuery({
    queryKey: ['ciclos-alumno', alumnoId],
    queryFn: () => api.get(`/alumnos/${alumnoId}/ciclos`).then(r => r.data),
    enabled: !!alumnoId,
  });

  if (ciclos.length === 0) return null;

  return (
    <View style={s.cicloRow}>
      <Text style={s.cicloLabel}>Ciclo:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
          {ciclos.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[
                s.cicloChip,
                cicloId === c.id && s.cicloChipActivo
              ]}
              onPress={() => onChangeCiclo(c.id)}
            >
              <Text style={[
                s.cicloChipTxt,
                cicloId === c.id && s.cicloChipTxtActivo
              ]}>
                {c.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  const [cicloId, setCicloId] = useState(null);
  const [tabActivo, setTabActivo] = useState('comida');

  // ── Catálogos dinámicos ──
  const { map: ANIMO } = useCatalogo('animo');
  const { map: CUANTO } = useCatalogo('cuanto');
  const { map: COMPORTAMIENTO } = useCatalogo('comportamiento');

  // Obtener ciclos para establecer el activo por defecto
  const { data: ciclos = [] } = useQuery({
    queryKey: ['ciclos-alumno', alumnoId],
    queryFn: () => api.get(`/alumnos/${alumnoId}/ciclos`).then(r => r.data),
    enabled: !!alumnoId,
  });

  useEffect(() => {
    if (ciclos.length > 0 && !cicloId) {
      const cicloActivo = ciclos.find(c => c.activo) || ciclos[0];
      setCicloId(cicloActivo.id);
    }
  }, [ciclos, cicloId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bitacora-padre', alumnoId, fecha, cicloId],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}${cicloId ? `&ciclo_id=${cicloId}` : ''}`).then(r => r.data),
    enabled: !!alumnoId,
    retry: 1,
  });

  const { data: historialExt = [] } = useQuery({
    queryKey: ['historial-servicios', alumnoId],
    queryFn: () => api.get(`/alumnos/${alumnoId}/historial-servicios`).then(r => r.data),
    enabled: !!alumnoId,
    staleTime: 60000,
  });

  const tuvExtensionEnFecha = (() => {
    if (!fecha) return false;
    const [anioF, mesF] = fecha.split('-').map(Number);
    return historialExt.some(h => {
      if (h.tipo_servicio !== 'extension' || h.accion !== 'alta') return false;
      const mIni = parseInt(h.mes_inicio), aIni = parseInt(h.anio_inicio);
      const mFin = h.mes_fin ? parseInt(h.mes_fin) : mIni;
      const aFin = h.anio_fin ? parseInt(h.anio_fin) : aIni;
      return (aIni < anioF || (aIni === anioF && mIni <= mesF)) &&
             (aFin > anioF || (aFin === anioF && mFin >= mesF));
    });
  })();

  const bit = data?.bitacora;
  const banio = data?.banio;
  const comidas = Array.isArray(data?.comida) ? data.comida : (data?.comida ? [data.comida] : []);
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

      {/* Selector de ciclo */}
      <SelectorCiclo alumnoId={alumnoId} cicloId={cicloId} onChangeCiclo={setCicloId} />

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
              ? 'La Miss aún no ha guardado la bitácora de hoy. Vuelve a revisar más tarde.'
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

          {/* ─ Tabs de navegación ─ */}
          <View style={s.tabsContainer}>
            {/* Barra de tabs */}
            <View style={s.tabsBar}>
              {[
                { key: 'comida',      emoji: '🍽️', label: 'Comida'      },
                { key: 'actividades', emoji: '🎨', label: 'Actividades' },
                { key: 'higiene',     emoji: '🚿', label: 'Higiene'     },
                { key: 'salud',       emoji: '🌡️', label: 'Salud'       },
                { key: 'incidentes',  emoji: '⚠️', label: 'Incidentes'  },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[s.tabBtn, tabActivo === tab.key && s.tabBtnActivo]}
                  onPress={() => setTabActivo(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18 }}>{tab.emoji}</Text>
                  <Text style={[s.tabLabel, tabActivo === tab.key && s.tabLabelActivo]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contenido */}
            <View style={{ padding: 16 }}>

              {/* Tab: Comida */}
              {tabActivo === 'comida' && (
                comidas.length > 0 ? (
                  <>
                    {TIEMPOS_COMIDA.map(({ key, emoji, label }) => {
                      const c = comidas.find(x => x.tiempo === key);
                      if (!c) return null;
                      return (
                        <View key={key} style={s.tiempoComida}>
                          <Text style={s.tiempoTitulo}>{emoji} {label}</Text>
                          {c.que_comio ? <Text style={s.textoNormal}>{c.que_comio}</Text> : null}
                          <FilaInfo label="¿Cuánto comió?" valor={CUANTO[c.cuanto_comio]?.emoji + ' ' + CUANTO[c.cuanto_comio]?.label} negrita />
                          <FilaInfo label="Observaciones" valor={c.observaciones} />
                        </View>
                      );
                    })}
                    {tuvExtensionEnFecha && (
                      <View style={s.tiempoComida}>
                        <Text style={s.tiempoTituloExtra}>🍜 Comida Extra</Text>
                        {(() => {
                          const cExtra = comidas.find(x => x.tiempo === 'comida_extra');
                          if (!cExtra) return <Text style={s.textoNormal}>Sin registro</Text>;
                          return (
                            <>
                              {cExtra.que_comio ? <Text style={s.textoNormal}>{cExtra.que_comio}</Text> : null}
                              <FilaInfo label="¿Cuánto comió?" valor={CUANTO[cExtra.cuanto_comio]?.emoji + ' ' + CUANTO[cExtra.cuanto_comio]?.label} negrita />
                              <FilaInfo label="Observaciones" valor={cExtra.observaciones} />
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={s.tabVacio}>Sin registro de alimentación</Text>
                )
              )}

              {/* Tab: Actividades */}
              {tabActivo === 'actividades' && (
                <View>
                  {bit.actividad_realizada !== null && bit.actividad_realizada !== undefined && (
                    <View style={[s.compBadge, { backgroundColor: bit.actividad_realizada ? '#C6F6D5' : '#EDF2F7', marginBottom: 12 }]}>
                      <Text style={{ fontSize: 18 }}>{bit.actividad_realizada ? '✓' : '✗'}</Text>
                      <Text style={[s.compLabel, { color: bit.actividad_realizada ? '#276749' : '#718096' }]}>
                        {bit.actividad_realizada ? 'Participó en actividades' : 'No participó en actividades'}
                      </Text>
                    </View>
                  )}
                  {(data?.actividades || []).map((act, i) => (
                    <View key={i} style={{ marginBottom: 12, borderRadius: RADIUS.md, borderWidth: 2, borderColor: '#E9D8FD', overflow: 'hidden' }}>
                      {act.descripcion ? <Text style={{ padding: 10, fontSize: 13, fontWeight: '700', color: '#4A5568' }}>{act.descripcion}</Text> : null}
                      {act.participo !== null && act.participo !== undefined && (
                        <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
                          <View style={[s.pildora, { backgroundColor: act.participo ? '#C6F6D5' : '#FED7D7' }]}>
                            <Text style={[s.pildoraTxt, { color: act.participo ? '#276749' : '#C53030' }]}>
                              {act.participo ? '✓ Participó' : '✗ No participó'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                  {bit.actividad_realizada === null && bit.actividad_realizada === undefined && (data?.actividades || []).length === 0 && (
                    <Text style={s.tabVacio}>Sin registro de actividades</Text>
                  )}
                </View>
              )}

              {/* Tab: Higiene */}
              {tabActivo === 'higiene' && (
                <View>
                  {banio && (
                    <View style={[s.banioRow, { marginBottom: 12 }]}>
                      <View style={s.banioItem}>
                        <Text style={s.banioNum}>{banio.pipi_count || 0}</Text>
                        <Text style={s.banioLabel}>Pipí 🚿</Text>
                      </View>
                      <View style={s.banioItem}>
                        <Text style={s.banioNum}>{banio.popo_count || 0}</Text>
                        <Text style={s.banioLabel}>Popó 💩</Text>
                      </View>
                    </View>
                  )}
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
                  {esfinteres && (
                    <View style={{ marginTop: 8 }}>
                      <View style={s.pildoraRow}>
                        <PildoraBool label="Fue solo/a"     valor={esfinteres.fue_solo}       />
                        <PildoraBool label="Pidió ir"       valor={esfinteres.pidio_ir}        />
                        <PildoraBool label="Accidente"      valor={esfinteres.tuvo_accidente}  />
                        <PildoraBool label="Necesitó ayuda" valor={esfinteres.necesito_ayuda}  />
                      </View>
                      <FilaInfo label="Notas" valor={esfinteres.notas_progreso} />
                    </View>
                  )}
                  {!banio && panial.length === 0 && !esfinteres && (
                    <Text style={s.tabVacio}>Sin registros de higiene</Text>
                  )}
                </View>
              )}

              {/* Tab: Salud */}
              {tabActivo === 'salud' && (
                <View>
                  {bit.tuvo_fiebre && (
                    <View style={s.alertaRoja}>
                      <Text style={s.alertaTxt}>🌡 Tuvo fiebre{bit.temperatura_dia ? ` — ${bit.temperatura_dia}°C` : ''}</Text>
                    </View>
                  )}
                  {bit.se_enfermo && (
                    <View style={[s.alertaRoja, { marginTop: 8 }]}>
                      <Text style={s.alertaTxt}>⚕️ {bit.descripcion_enfermedad || 'Presentó malestar'}</Text>
                    </View>
                  )}
                  {medicamentos.map((m, i) => (
                    <View key={i} style={s.medCard}>
                      <Text style={s.medNombre}>{m.nombre}</Text>
                      <Text style={s.medDetalle}>
                        Dosis: {m.dosis} · {new Date(m.hora_administracion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {m.notas && <Text style={s.medNotas}>{m.notas}</Text>}
                    </View>
                  ))}
                  {!bit.tuvo_fiebre && !bit.se_enfermo && medicamentos.length === 0 && (
                    <Text style={s.tabVacio}>Sin registros de salud</Text>
                  )}
                </View>
              )}

              {/* Tab: Incidentes */}
              {tabActivo === 'incidentes' && (
                (data?.incidentes || []).length > 0 ? (
                  (data?.incidentes || []).map((inc, i) => (
                    <View key={i} style={[s.alertaRoja, { marginBottom: 8 }]}>
                      <Text style={[s.alertaTxt, { marginBottom: 4 }]}>{inc.descripcion}</Text>
                      {inc.acciones_tomadas ? <Text style={{ fontSize: 12, color: '#C53030' }}>Acciones: {inc.acciones_tomadas}</Text> : null}
                      <Text style={{ fontSize: 11, color: '#FC8181', marginTop: 4 }}>
                        {new Date(inc.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {inc.firma_padre_url ? (
                        <View style={{ backgroundColor: '#C6F6D5', borderRadius: 8, padding: 8, marginTop: 6 }}>
                          <Text style={{ fontSize: 12, color: '#276749', fontWeight: '700' }}>✅ Firmado</Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 12, color: '#3182CE', fontWeight: '700', marginTop: 6 }}>
                          ✍️ Pendiente de firma — revisa en el portal web
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={s.tabVacio}>Sin incidentes hoy ✅</Text>
                )
              )}
            </View>
          </View>

          {/* ─ Conducta — siempre visible ─ */}
          {bit.comportamiento && (
            <Seccion titulo="Conducta" emoji="🌟">
              <View style={[s.compBadge, { backgroundColor: COMPORTAMIENTO[bit.comportamiento]?.color + '20' }]}>
                <Text style={{ fontSize: 20 }}>{COMPORTAMIENTO[bit.comportamiento]?.emoji}</Text>
                <Text style={[s.compLabel, { color: COMPORTAMIENTO[bit.comportamiento]?.color }]}>
                  {COMPORTAMIENTO[bit.comportamiento]?.label}
                </Text>
              </View>
              <FilaInfo label="Notas de conducta" valor={bit.comportamiento_notas} />
            </Seccion>
          )}

          {/* ─ Notas generales ─ */}
          {bit.notas && (
            <Seccion titulo="Mensaje de la Miss" emoji="💬">
              <View style={s.notasBox}>
                <Text style={s.notasTxt}>{bit.notas}</Text>
              </View>
            </Seccion>
          )}

          {/* ─ Maestra ─ */}
          {bit.maestra_nombre && (
            <Text style={s.maestraTxt}>Bitácora registrada por Miss {bit.maestra_nombre}</Text>
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

  // Ciclo
  cicloRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FED7D7', backgroundColor: '#FFF8F8' },
  cicloLabel: { fontSize: 12, fontWeight: '800', color: '#4A5568', paddingHorizontal: 16 },
  cicloChip: { backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#FED7D7' },
  cicloChipActivo: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  cicloChipTxt: { fontSize: 11, fontWeight: '800', color: '#E53E3E' },
  cicloChipTxtActivo: { color: '#fff' },

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
  resumenRow: { flexDirection: 'row', backgroundColor: COLORS.white, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#FED7D7' },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenEmoji: { fontSize: 28 },
  resumenLabel: { fontSize: 10, fontWeight: '700', color: '#A0AEC0', marginTop: 4 },
  resumenDiv: { width: 1, backgroundColor: '#FED7D7', marginVertical: 4 },

  // Sección
  seccion: { marginHorizontal: 16, marginTop: 16, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  seccionTitulo: { fontSize: 13, fontWeight: '900', color: '#E53E3E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Tabs
  tabsContainer: { marginHorizontal: 16, marginTop: 16, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, shadowColor: '#E53E3E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  tabsBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#FFF5F5' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActivo: { borderBottomColor: '#E53E3E', backgroundColor: '#FFF5F5' },
  tabLabel: { fontSize: 9, fontWeight: '700', color: '#A0AEC0' },
  tabLabelActivo: { color: '#E53E3E' },
  tabVacio: { textAlign: 'center', color: '#A0AEC0', fontWeight: '600', fontSize: 13, paddingVertical: 24 },

  // Tiempos de comida
  tiempoComida: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#FFF5F5' },
  tiempoTitulo: { fontSize: 13, fontWeight: '900', color: '#4A5568', marginBottom: 6 },
  tiempoTituloExtra: { fontSize: 13, fontWeight: '900', color: '#7C3AED', marginBottom: 6, paddingTop: 4 },

  // Fila info
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#FFF5F5' },
  filaLabel: { fontSize: 13, color: '#718096', fontWeight: '600', flex: 1 },
  filaValor: { fontSize: 13, color: '#4A5568', fontWeight: '600', flex: 1, textAlign: 'right' },
  textoNormal: { fontSize: 14, color: '#4A5568', marginBottom: 8, lineHeight: 20 },

  // Comportamiento
  compBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: RADIUS.md, marginBottom: 8 },
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
  pildora: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.xl },
  pildoraTxt: { fontSize: 12, fontWeight: '700' },

  // Salud
  alertaRoja: { backgroundColor: '#FFF5F5', borderLeftWidth: 3, borderLeftColor: '#E53E3E', borderRadius: 8, padding: 12, marginBottom: 8 },
  alertaTxt: { fontSize: 14, fontWeight: '700', color: '#C53030' },

  // Medicamentos
  medCard: { backgroundColor: '#FAF5FF', borderRadius: RADIUS.md, padding: 12, marginBottom: 8 },
  medNombre: { fontSize: 15, fontWeight: '900', color: '#44337A' },
  medDetalle: { fontSize: 12, color: '#805AD5', fontWeight: '600', marginTop: 2 },
  medNotas: { fontSize: 12, color: '#718096', marginTop: 4 },

  // Notas
  notasBox: { backgroundColor: '#FFFBEB', borderRadius: RADIUS.md, padding: 14 },
  notasTxt: { fontSize: 14, color: '#4A5568', lineHeight: 22, fontStyle: 'italic' },

  maestraTxt: { textAlign: 'center', color: '#A0AEC0', fontSize: 12, fontWeight: '600', marginTop: 24, marginBottom: 8 },
});

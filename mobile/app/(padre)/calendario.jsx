import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS_CORTO = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function mesStr(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function diasDelMes(year, month) {
  return {
    primerDia: new Date(year, month, 1).getDay(),
    totalDias: new Date(year, month + 1, 0).getDate(),
  };
}

function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

function horaCorta(iso) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// ─── Modal detalle ────────────────────────────────────────────────────────────

function ModalDetalle({ evento, onClose }) {
  if (!evento) return null;
  const color = evento.categoria_color || '#805AD5';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={[m.colorBar, { backgroundColor: color }]} />
          <View style={m.contenido}>
            <View style={m.headerRow}>
              <View style={{ flex: 1 }}>
                {evento.categoria_nombre && (
                  <View style={[m.catBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[m.catTxt, { color }]}>
                      {evento.categoria_icono} {evento.categoria_nombre}
                    </Text>
                  </View>
                )}
                <Text style={m.titulo}>{evento.titulo}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={m.closeBtn}>
                <Text style={m.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {evento.descripcion && (
              <Text style={m.descripcion}>{evento.descripcion}</Text>
            )}

            <View style={m.infoRow}>
              <Text style={m.infoIcon}>📅</Text>
              <Text style={m.infoTxt} numberOfLines={2}>{fechaCorta(evento.fecha_inicio)}</Text>
            </View>
            {!evento.es_todo_el_dia && (
              <View style={m.infoRow}>
                <Text style={m.infoIcon}>🕐</Text>
                <Text style={m.infoTxt}>
                  {horaCorta(evento.fecha_inicio)}
                  {evento.fecha_fin ? ` → ${horaCorta(evento.fecha_fin)}` : ''}
                </Text>
              </View>
            )}
            <View style={m.infoRow}>
              <Text style={m.infoIcon}>🏫</Text>
              <Text style={m.infoTxt}>{evento.grupo_nombre || 'Toda la escuela'}</Text>
            </View>

            <TouchableOpacity style={m.cerrarBtn} onPress={onClose}>
              <Text style={m.cerrarTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function CalendarioPadreScreen() {
  const hoy = new Date();
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [eventoSel, setEventoSel] = useState(null);

  const mes = mesStr(year, month);

  const { data: eventos = [], isLoading, refetch } = useQuery({
    queryKey: ['calendario-padre', mes],
    queryFn: () => api.get('/calendario', { params: { mes } }).then(r => r.data),
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const navMes = (dir) => {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const { primerDia, totalDias } = diasDelMes(year, month);
  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);

  const eventosPorDia = (dia) => {
    if (!dia) return [];
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return eventos.filter(e => e.fecha_inicio.slice(0, 10) === fecha);
  };

  const esHoy = (dia) => dia && year === hoy.getFullYear() && month === hoy.getMonth() && dia === hoy.getDate();
  const tieneEventos = (dia) => eventosPorDia(dia).length > 0;

  // Próximos eventos desde hoy
  const proximosEventos = eventos.filter(e => {
    const f = new Date(e.fecha_inicio);
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return f >= inicio;
  }).slice(0, 10);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitulo}>Calendario 📅</Text>
          <Text style={s.headerSub}>Eventos de Happy School</Text>
        </View>

        {/* Navegación mes */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navMes(-1)}>
            <Text style={s.navBtnTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.mesLabel}>{MESES[month]} {year}</Text>
          <TouchableOpacity style={s.navBtn} onPress={() => navMes(1)}>
            <Text style={s.navBtnTxt}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Grilla */}
        <View style={s.grilla}>
          {/* Cabecera días */}
          <View style={s.diasRow}>
            {DIAS_CORTO.map((d, i) => (
              <View key={i} style={s.diaHeader}>
                <Text style={s.diaHeaderTxt}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Celdas */}
          {isLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color="#805AD5" />
            </View>
          ) : (
            <View style={s.celdasGrid}>
              {celdas.map((dia, i) => {
                const evs = eventosPorDia(dia);
                const color = evs[0]?.categoria_color || '#805AD5';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.celda, !dia && s.celdaVacia]}
                    onPress={() => evs.length > 0 && setEventoSel(evs[0])}
                    activeOpacity={evs.length > 0 ? 0.7 : 1}
                  >
                    {dia && (
                      <>
                        <View style={[s.diaNum, esHoy(dia) && s.diaNumHoy]}>
                          <Text style={[s.diaTxt, esHoy(dia) && s.diaTxtHoy]}>{dia}</Text>
                        </View>
                        {tieneEventos(dia) && (
                          <View style={[s.eventoDot, { backgroundColor: color }]} />
                        )}
                        {evs.length > 1 && (
                          <Text style={s.masEventos}>+{evs.length - 1}</Text>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Próximos eventos */}
        <View style={s.proximosSection}>
          <Text style={s.proximosTitulo}>
            {proximosEventos.length > 0 ? 'Próximos eventos' : 'Sin eventos próximos este mes'}
          </Text>
          {proximosEventos.map(e => {
            const color = e.categoria_color || '#805AD5';
            return (
              <TouchableOpacity
                key={e.id}
                style={s.eventoCard}
                onPress={() => setEventoSel(e)}
                activeOpacity={0.8}
              >
                <View style={[s.eventoStripe, { backgroundColor: color }]} />
                <View style={s.eventoIconBox}>
                  <Text style={s.eventoIcon}>{e.categoria_icono || '📅'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventoTitulo} numberOfLines={1}>{e.titulo}</Text>
                  <Text style={s.eventoFecha} numberOfLines={1}>
                    {new Date(e.fecha_inicio).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {!e.es_todo_el_dia && ` · ${horaCorta(e.fecha_inicio)}`}
                  </Text>
                  {e.grupo_nombre && (
                    <Text style={s.eventoGrupo}>{e.grupo_nombre}</Text>
                  )}
                </View>
                <Text style={[s.eventoFlecha, { color }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal detalle */}
      <ModalDetalle evento={eventoSel} onClose={() => setEventoSel(null)} />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitulo: { fontSize: 24, fontWeight: '900', color: '#2D3748' },
  headerSub: { fontSize: 13, color: '#718096', fontWeight: '600', marginTop: 2 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#F7FAFC' },
  navBtnTxt: { fontSize: 24, color: '#805AD5', fontWeight: '900' },
  mesLabel: { fontSize: 17, fontWeight: '900', color: '#2D3748' },

  grilla: { marginHorizontal: 12, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  diasRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F7FAFC' },
  diaHeader: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  diaHeaderTxt: { fontSize: 11, fontWeight: '900', color: '#A0AEC0' },
  celdasGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, aspectRatio: 0.8, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#F0F4F8' },
  celdaVacia: { backgroundColor: '#FAFAFA' },
  diaNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  diaNumHoy: { backgroundColor: '#805AD5' },
  diaTxt: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  diaTxtHoy: { color: '#fff', fontWeight: '900' },
  eventoDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  masEventos: { fontSize: 8, fontWeight: '900', color: '#A0AEC0', marginTop: 1 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },

  proximosSection: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  proximosTitulo: { fontSize: 14, fontWeight: '900', color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  eventoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  eventoStripe: { width: 4, alignSelf: 'stretch' },
  eventoIconBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  eventoIcon: { fontSize: 22 },
  eventoTitulo: { fontSize: 14, fontWeight: '800', color: '#2D3748' },
  eventoFecha: { fontSize: 12, color: '#718096', fontWeight: '600', marginTop: 1, textTransform: 'capitalize' },
  eventoGrupo: { fontSize: 11, color: '#A0AEC0', fontWeight: '600', marginTop: 1 },
  eventoFlecha: { fontSize: 20, fontWeight: '900', paddingHorizontal: 12 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  colorBar: { height: 4 },
  contenido: { padding: 24, paddingBottom: 36 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 6 },
  catTxt: { fontSize: 12, fontWeight: '800' },
  titulo: { fontSize: 20, fontWeight: '900', color: '#2D3748' },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF2F7', borderRadius: 16, marginLeft: 8 },
  closeTxt: { fontSize: 14, color: '#718096', fontWeight: '700' },
  descripcion: { fontSize: 14, color: '#4A5568', lineHeight: 22, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F7FAFC' },
  infoIcon: { fontSize: 18, width: 28 },
  infoTxt: { fontSize: 14, fontWeight: '600', color: '#4A5568', flex: 1, textTransform: 'capitalize' },
  cerrarBtn: { marginTop: 20, backgroundColor: '#805AD5', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cerrarTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
});

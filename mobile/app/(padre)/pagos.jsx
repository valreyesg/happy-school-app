import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmt(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
}

function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const SEMAFORO_CFG = {
  verde:      { color: '#38A169', bg: '#F0FFF4', label: 'Al corriente',  icon: '✅' },
  amarillo:   { color: '#D69E2E', bg: '#FFFFF0', label: 'Atención',      icon: '⚠️' },
  rojo:       { color: '#E53E3E', bg: '#FFF5F5', label: 'Vencido',       icon: '🔴' },
  suspendido: { color: '#718096', bg: '#F7FAFC', label: 'Suspendido',    icon: '⛔' },
};

const ESTADO_CFG = {
  pagado:    { color: '#38A169', bg: '#F0FFF4', label: 'Pagado'    },
  pendiente: { color: '#D69E2E', bg: '#FFFFF0', label: 'Pendiente' },
  vencido:   { color: '#E53E3E', bg: '#FFF5F5', label: 'Vencido'   },
  cancelado: { color: '#A0AEC0', bg: '#F7FAFC', label: 'Cancelado' },
};

// ─── Tarjeta de pago ──────────────────────────────────────────────────────────

function TarjetaPago({ pago }) {
  const cfg = ESTADO_CFG[pago.estado] || ESTADO_CFG.pendiente;
  return (
    <View style={[t.card, { borderLeftColor: cfg.color }]}>
      <View style={t.cardTop}>
        <Text style={t.concepto} numberOfLines={1}>{pago.concepto_nombre}</Text>
        <View style={[t.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[t.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <Text style={t.monto}>{fmt(pago.monto_total)}</Text>
      {pago.monto_recargo > 0 && (
        <Text style={t.recargo}>+{fmt(pago.monto_recargo)} recargo ({pago.dias_atraso} días)</Text>
      )}
      <View style={t.cardBottom}>
        <Text style={t.meta}>
          {MESES_LARGO[(pago.mes_correspondiente || 1) - 1]} {pago.anio_correspondiente}
        </Text>
        {pago.fecha_pago && (
          <Text style={t.meta}>Pagado: {fmtFecha(pago.fecha_pago)}</Text>
        )}
        {pago.metodo_pago && pago.estado === 'pagado' && (
          <Text style={[t.meta, { textTransform: 'capitalize' }]}>{pago.metodo_pago}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Panel de un hijo ─────────────────────────────────────────────────────────

function PanelHijo({ alumnoId }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  const { data: estado, isLoading, refetch } = useQuery({
    queryKey: ['estado-alumno', alumnoId],
    queryFn: () => api.get(`/pagos/estado/${alumnoId}`).then(r => r.data),
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  if (isLoading) return <ActivityIndicator color="#805AD5" style={{ marginVertical: 24 }} />;
  if (!estado) return null;

  const sf = SEMAFORO_CFG[estado.semaforo] || SEMAFORO_CFG.verde;
  const pagosMes = estado.pagos?.filter(
    p => p.mes_correspondiente === mes && p.anio_correspondiente === anio
  ) || [];

  const navMes = (dir) => {
    const d = new Date(anio, mes - 1 + dir, 1);
    setMes(d.getMonth() + 1);
    setAnio(d.getFullYear());
  };

  return (
    <View style={p.contenedor}>
      {/* Alumno header */}
      <View style={p.alumnoHeader}>
        <View style={p.avatarBox}>
          <Text style={p.avatarTxt}>{estado.alumno?.nombre_completo?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={p.alumnoNombre}>{estado.alumno?.nombre_completo}</Text>
          <View style={[p.grupoBadge, { backgroundColor: '#805AD520' }]}>
            <Text style={[p.grupoTxt, { color: '#805AD5' }]}>{estado.alumno?.grupo}</Text>
          </View>
        </View>
        {/* Semáforo */}
        <View style={[p.sfBox, { backgroundColor: sf.bg }]}>
          <Text style={p.sfIcon}>{sf.icon}</Text>
          <Text style={[p.sfLabel, { color: sf.color }]}>{sf.label}</Text>
        </View>
      </View>

      {/* Saldo pendiente */}
      {estado.saldo_pendiente > 0 && (
        <View style={[p.saldoCard, { backgroundColor: sf.bg, borderColor: sf.color }]}>
          <Text style={[p.saldoLabel, { color: sf.color }]}>Saldo pendiente</Text>
          <Text style={[p.saldoMonto, { color: sf.color }]}>{fmt(estado.saldo_pendiente)}</Text>
          <Text style={[p.saldoSub, { color: sf.color }]}>Comunícate con la escuela para regularizar</Text>
        </View>
      )}

      {/* Comida semanal */}
      {estado.comida_semanal?.length > 0 && (
        <View style={p.seccion}>
          <Text style={p.seccionTitulo}>🍱 Servicio de comida</Text>
          {estado.comida_semanal.slice(0, 4).map(cs => (
            <View key={cs.id} style={p.comidaFila}>
              <Text style={p.comidaSemana}>
                Semana del {fmtFecha(cs.semana_inicio)}
              </Text>
              <View style={[p.comidaBadge,
                { backgroundColor: cs.servicio_activo ? '#F0FFF4' : '#FFF5F5' }]}>
                <Text style={{ fontSize: 12, fontWeight: '800',
                  color: cs.servicio_activo ? '#38A169' : '#E53E3E' }}>
                  {cs.servicio_activo ? 'Activo' : 'Sin servicio'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Navegación mes */}
      <View style={p.navRow}>
        <TouchableOpacity style={p.navBtn} onPress={() => navMes(-1)}>
          <Text style={p.navBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={p.mesLabel}>{MESES_LARGO[mes - 1]} {anio}</Text>
        <TouchableOpacity style={p.navBtn} onPress={() => navMes(1)}
          disabled={mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()}>
          <Text style={[p.navBtnTxt,
            mes === hoy.getMonth() + 1 && anio === hoy.getFullYear() && { opacity: 0.3 }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Pagos del mes */}
      {pagosMes.length === 0 ? (
        <View style={p.empty}>
          <Text style={p.emptyTxt}>Sin registros en {MESES_LARGO[mes - 1]}</Text>
        </View>
      ) : (
        pagosMes.map(pago => <TarjetaPago key={pago.id} pago={pago} />)
      )}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function PagosPadreScreen() {
  const user = useAuthStore(s => s.user);

  // Obtener hijos del padre
  const { data: hijos = [], isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.titulo}>Mis Pagos 💰</Text>
          <Text style={s.sub}>Estado de cuenta</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#805AD5" style={{ marginTop: 48 }} />
        ) : hijos.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💰</Text>
            <Text style={s.emptyTxt}>Sin información de pagos</Text>
            <Text style={s.emptySub}>Contacta a la escuela si crees que esto es un error</Text>
          </View>
        ) : (
          hijos.map(hijo => (
            <PanelHijo key={hijo.id} alumnoId={hijo.id} />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  titulo: { fontSize: 24, fontWeight: '900', color: '#2D3748' },
  sub:    { fontSize: 13, color: '#718096', fontWeight: '600', marginTop: 2 },
  empty:  { alignItems: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 56 },
  emptyTxt:  { fontSize: 16, fontWeight: '900', color: '#4A5568', marginTop: 12 },
  emptySub:  { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});

const p = StyleSheet.create({
  contenedor:    { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  alumnoHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarBox:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E9D8FD', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 20, fontWeight: '900', color: '#805AD5' },
  alumnoNombre:  { fontSize: 15, fontWeight: '900', color: '#2D3748' },
  grupoBadge:    { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  grupoTxt:      { fontSize: 11, fontWeight: '800' },
  sfBox:         { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  sfIcon:        { fontSize: 20 },
  sfLabel:       { fontSize: 10, fontWeight: '900', marginTop: 2 },

  saldoCard:     { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },
  saldoLabel:    { fontSize: 12, fontWeight: '800', opacity: 0.8 },
  saldoMonto:    { fontSize: 28, fontWeight: '900', marginVertical: 4 },
  saldoSub:      { fontSize: 11, fontWeight: '600', textAlign: 'center', opacity: 0.7 },

  seccion:       { marginBottom: 14 },
  seccionTitulo: { fontSize: 13, fontWeight: '900', color: '#4A5568', marginBottom: 8 },
  comidaFila:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  comidaSemana:  { fontSize: 12, fontWeight: '600', color: '#4A5568' },
  comidaBadge:   { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },

  navRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F7FAFC', alignItems: 'center', justifyContent: 'center' },
  navBtnTxt: { fontSize: 22, color: '#805AD5', fontWeight: '900' },
  mesLabel:  { fontSize: 15, fontWeight: '900', color: '#2D3748' },

  empty:    { alignItems: 'center', paddingVertical: 24 },
  emptyTxt: { fontSize: 13, color: '#A0AEC0', fontWeight: '600' },
});

const t = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  concepto:   { fontSize: 13, fontWeight: '900', color: '#2D3748', flex: 1, marginRight: 8 },
  badge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeTxt:   { fontSize: 11, fontWeight: '800' },
  monto:      { fontSize: 22, fontWeight: '900', color: '#2D3748', marginVertical: 2 },
  recargo:    { fontSize: 11, color: '#E53E3E', fontWeight: '700' },
  cardBottom: { flexDirection: 'row', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  meta:       { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
});

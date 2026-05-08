import { useState, useCallback } from 'react';
import { COLORS, RADIUS } from '@/constants/theme';
import {
  View, Text, ScrollView, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, Modal as RNModal, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/Button';

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
  pagado:        { color: '#38A169', bg: '#F0FFF4', label: 'Pagado'      },
  pendiente:     { color: '#D69E2E', bg: '#FFFFF0', label: 'Pendiente'   },
  por_confirmar: { color: '#3182CE', bg: '#EBF8FF', label: 'En revisión' },
  vencido:       { color: '#E53E3E', bg: '#FFF5F5', label: 'Vencido'     },
  cancelado:     { color: '#A0AEC0', bg: '#F7FAFC', label: 'Cancelado'   },
};

// ─── Modal Comprobante ──────────────────────────────────────────────────────

function ModalComprobante({ pago, visible, onClose }) {
  const qc = useQueryClient();
  const [image, setImage] = useState(null);
  const [referencia, setReferencia] = useState('');

  const mutation = useMutation({
    mutationFn: async (formData) => {
      return api.post(`/pagos/${pago.id}/comprobante`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estado-alumno'] });
      setImage(null);
      setReferencia('');
      onClose();
    },
    onError: (err) => {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo subir el comprobante');
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir el comprobante');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    if (!image) return;
    const fd = new FormData();
    const uri = image.uri;
    const filename = uri.split('/').pop() || 'comprobante.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    fd.append('foto', { uri, name: filename, type: mimeType });
    if (referencia.trim()) fd.append('referencia', referencia.trim());
    mutation.mutate(fd);
  };

  if (!pago) return null;

  return (
    <RNModal visible={visible} animationType="slide" transparent>
      <View style={m.overlay}>
        <View style={m.container}>
          <Text style={m.title}>Subir comprobante</Text>

          {/* Info pago */}
          <View style={m.infoBox}>
            <Text style={m.infoConcepto}>{pago.concepto_nombre}</Text>
            <Text style={m.infoPeriodo}>
              {MESES_LARGO[(pago.mes_correspondiente || 1) - 1]} {pago.anio_correspondiente}
            </Text>
            <Text style={m.infoMonto}>{fmt(pago.monto_total)}</Text>
          </View>

          {/* Imagen */}
          {image ? (
            <View style={m.previewBox}>
              <Image source={{ uri: image.uri }} style={m.previewImg} resizeMode="contain" />
              <TouchableOpacity style={m.removeBtn} onPress={() => setImage(null)}>
                <Text style={m.removeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={m.pickBtn} onPress={pickImage}>
              <Text style={m.pickIcon}>📷</Text>
              <Text style={m.pickTxt}>Seleccionar imagen del comprobante</Text>
            </TouchableOpacity>
          )}

          {/* Referencia */}
          <TextInput
            style={m.input}
            value={referencia}
            onChangeText={setReferencia}
            placeholder="Referencia de transferencia (opcional)"
            placeholderTextColor="#A0AEC0"
          />

          {/* Botones */}
          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={() => { setImage(null); setReferencia(''); onClose(); }}>
              <Text style={m.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.submitBtn, (!image || mutation.isPending) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!image || mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={m.submitTxt}>Enviar comprobante</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

// ─── Tarjeta de pago ──────────────────────────────────────────────────────────

function TarjetaPago({ pago, onSubirComprobante }) {
  const cfg = ESTADO_CFG[pago.estado] || ESTADO_CFG.pendiente;
  const puedeSubir = ['pendiente', 'vencido'].includes(pago.estado);
  const enRevision = pago.estado === 'por_confirmar';

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

      {/* Botón subir comprobante */}
      {puedeSubir && (
        <TouchableOpacity style={t.subirBtn} onPress={() => onSubirComprobante(pago)}>
          <Text style={t.subirTxt}>📤 Subir comprobante de transferencia</Text>
        </TouchableOpacity>
      )}

      {/* En revisión */}
      {enRevision && (
        <View style={t.revisionBox}>
          <Text style={t.revisionTxt}>⏳ Comprobante enviado, pendiente de aprobación</Text>
        </View>
      )}

      {/* Nota de rechazo */}
      {pago.rechazo_nota && pago.estado === 'pendiente' && (
        <View style={t.rechazoBox}>
          <Text style={t.rechazoTxt}>❌ Rechazado: {pago.rechazo_nota}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Panel de un hijo ─────────────────────────────────────────────────────────

function PanelHijo({ alumnoId }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [pagoComprobante, setPagoComprobante] = useState(null);

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
        <Button
          variant="ghost"
          size="sm"
          label="‹"
          onPress={() => navMes(-1)}
        />
        <Text style={p.mesLabel}>{MESES_LARGO[mes - 1]} {anio}</Text>
        <Button
          variant="ghost"
          size="sm"
          label="›"
          onPress={() => navMes(1)}
          disabled={mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()}
        />
      </View>

      {/* Pagos del mes */}
      {pagosMes.length === 0 ? (
        <View style={p.empty}>
          <Text style={p.emptyTxt}>Sin registros en {MESES_LARGO[mes - 1]}</Text>
        </View>
      ) : (
        pagosMes.map(pago => (
          <TarjetaPago key={pago.id} pago={pago} onSubirComprobante={setPagoComprobante} />
        ))
      )}

      {/* Modal comprobante */}
      <ModalComprobante
        pago={pagoComprobante}
        visible={!!pagoComprobante}
        onClose={() => setPagoComprobante(null)}
      />
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function PagosPadreScreen() {
  const user = useAuthStore(s => s.user);

  // Obtener hijos del padre
  const { data: hijosData = {}, isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });
  const hijos = hijosData.hijos || [];

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
  contenedor:    { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, borderRadius: RADIUS.xl, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  alumnoHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarBox:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E9D8FD', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 20, fontWeight: '900', color: '#805AD5' },
  alumnoNombre:  { fontSize: 15, fontWeight: '900', color: '#2D3748' },
  grupoBadge:    { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.md, marginTop: 4 },
  grupoTxt:      { fontSize: 11, fontWeight: '800' },
  sfBox:         { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md },
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
  comidaBadge:   { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.xl },

  navRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F7FAFC', alignItems: 'center', justifyContent: 'center' },
  navBtnTxt: { fontSize: 22, color: '#805AD5', fontWeight: '900' },
  mesLabel:  { fontSize: 15, fontWeight: '900', color: '#2D3748' },

  empty:    { alignItems: 'center', paddingVertical: 24 },
  emptyTxt: { fontSize: 13, color: '#A0AEC0', fontWeight: '600' },
});

const t = StyleSheet.create({
  card:       { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  concepto:   { fontSize: 13, fontWeight: '900', color: '#2D3748', flex: 1, marginRight: 8 },
  badge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.xl },
  badgeTxt:   { fontSize: 11, fontWeight: '800' },
  monto:      { fontSize: 22, fontWeight: '900', color: '#2D3748', marginVertical: 2 },
  recargo:    { fontSize: 11, color: '#E53E3E', fontWeight: '700' },
  cardBottom: { flexDirection: 'row', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  meta:       { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
  subirBtn:   { marginTop: 10, backgroundColor: '#FAF5FF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E9D8FD' },
  subirTxt:   { fontSize: 12, fontWeight: '800', color: '#805AD5', textAlign: 'center' },
  revisionBox:{ marginTop: 10, backgroundColor: '#EBF8FF', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  revisionTxt:{ fontSize: 11, fontWeight: '700', color: '#3182CE', textAlign: 'center' },
  rechazoBox: { marginTop: 10, backgroundColor: '#FFF5F5', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  rechazoTxt: { fontSize: 11, fontWeight: '700', color: '#E53E3E' },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  title:      { fontSize: 18, fontWeight: '900', color: '#2D3748', marginBottom: 16 },
  infoBox:    { backgroundColor: '#F7FAFC', borderRadius: 12, padding: 12, marginBottom: 16 },
  infoConcepto: { fontSize: 14, fontWeight: '800', color: '#2D3748' },
  infoPeriodo:  { fontSize: 12, fontWeight: '600', color: '#718096', marginTop: 2 },
  infoMonto:    { fontSize: 22, fontWeight: '900', color: '#2D3748', marginTop: 4 },
  pickBtn:    { borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E0', borderRadius: 14, paddingVertical: 32, alignItems: 'center', marginBottom: 16 },
  pickIcon:   { fontSize: 32 },
  pickTxt:    { fontSize: 13, fontWeight: '700', color: '#A0AEC0', marginTop: 8 },
  previewBox: { marginBottom: 16, position: 'relative' },
  previewImg: { width: '100%', height: 180, borderRadius: 14, backgroundColor: '#F7FAFC' },
  removeBtn:  { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  removeTxt:  { fontSize: 14, fontWeight: '900', color: '#E53E3E' },
  input:      { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#2D3748', marginBottom: 16 },
  btnRow:     { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  cancelTxt:  { fontSize: 14, fontWeight: '800', color: '#718096' },
  submitBtn:  { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#805AD5', alignItems: 'center', justifyContent: 'center' },
  submitTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },
});

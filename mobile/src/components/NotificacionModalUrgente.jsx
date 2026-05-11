import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const CONFIG_TIPO = {
  entrada_rechazada: { color: '#C53030', bgLight: '#FFF5F5', icono: '🚫', label: 'Entrada rechazada' },
  salida_anticipada: { color: '#7C2D12', bgLight: '#FEF3C7', icono: '🚪', label: 'Salida anticipada' },
  alerta_vomito:     { color: '#D69E2E', bgLight: '#FEF3C7', icono: '🤢', label: 'Alerta de vómito' },
  alerta_diarrea:    { color: '#F56565', bgLight: '#FFF5F5', icono: '⚠️', label: 'Alerta de salud' },
  solicitud_toallitas: { color: '#0987A0', bgLight: '#E0F2FE', icono: '🧻', label: 'Solicitud de toallitas' },
  solicitud_paniales:  { color: '#0891B2', bgLight: '#ECFDF5', icono: '🍼', label: 'Solicitud de pañales' },
  incidente:           { color: '#E53E3E', bgLight: '#FFF5F5', icono: '🚨', label: 'Incidente' },
  aviso_extraordinario: { color: '#DD6B20', bgLight: '#FFFAF0', icono: '📢', label: 'Aviso' },
  bitacora_lista:      { color: '#38A169', bgLight: '#F0FDF4', icono: '📝', label: 'Bitácora lista' },
  medicamento:         { color: '#9F7AEA', bgLight: '#FAF5FF', icono: '💊', label: 'Medicamento' },
  tarea_nueva:         { color: '#3182CE', bgLight: '#EBF8FF', icono: '📚', label: 'Tarea nueva' },
  tarea_cancelada:     { color: '#718096', bgLight: '#F7FAFC', icono: '📋', label: 'Tarea cancelada' },
  alerta_pago:         { color: '#B7791F', bgLight: '#FFFBEB', icono: '💳', label: 'Recordatorio de pago' },
  pago_comida_lunes:   { color: '#276749', bgLight: '#F0FDF4', icono: '🍽️', label: 'Pago de comida' },
  sin_comida:          { color: '#C53030', bgLight: '#FFF5F5', icono: '🚫', label: 'Servicio cancelado' },
};

const fallback = { color: '#3182CE', bgLight: '#EBF8FF', icono: '🔔', label: 'Notificación' };

export default function NotificacionModalUrgente({ notificacion, onEntendido }) {
  if (!notificacion) return null;

  const cfg = CONFIG_TIPO[notificacion.tipo] || fallback;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onEntendido}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { borderTopColor: cfg.color }]}>
          {/* Contenido con padding */}
          <View style={styles.content}>
            {/* Icono */}
            <View style={[styles.iconCircle, { backgroundColor: cfg.bgLight }]}>
              <Text style={styles.iconText}>{cfg.icono}</Text>
            </View>

            {/* Badge tipo */}
            <View style={[styles.badge, { backgroundColor: cfg.color }]}>
              <Text style={styles.badgeText}>{cfg.label}</Text>
            </View>

            {/* Título y cuerpo */}
            <Text style={styles.title}>{notificacion.titulo}</Text>
            <Text style={styles.body}>{notificacion.cuerpo}</Text>
          </View>

          {/* Botón — fuera del padding, ocupa todo el ancho */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: cfg.color }]}
            onPress={onEntendido}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderTopWidth: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconText: {
    fontSize: 36,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

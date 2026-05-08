import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, Linking } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { RADIUS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useState } from 'react';

export default function PadreQRScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['padre-mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data.hijos),
  });

  const hijos = data || [];
  const hijoActual = hijos[selectedIndex];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && hijos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2D3748" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hijoActual) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.errorText}>No tienes hijos registrados en el sistema</Text>
          <Text style={styles.subText}>Contacta a la directora para agregarlos</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Título */}
        <Text style={styles.title}>QR de Acceso</Text>

        {/* Selector de hijos (tabs horizontal) */}
        {hijos.length > 1 && (
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {hijos.map((hijo, idx) => (
                <Text
                  key={hijo.id}
                  style={[
                    styles.tab,
                    idx === selectedIndex ? styles.tabActive : styles.tabInactive
                  ]}
                  onPress={() => setSelectedIndex(idx)}
                >
                  {hijo.nombre_completo.split(' ')[0]}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Contenido principal del hijo */}
        <View style={styles.cardContainer}>
          {/* Foto del alumno */}
          {hijoActual.foto_url && (
            <Image
              source={{ uri: hijoActual.foto_url }}
              style={styles.foto}
            />
          )}

          {/* Nombre */}
          <Text style={styles.nombreAlumno}>{hijoActual.nombre_completo}</Text>

          {/* Grupo */}
          <Text style={styles.grupoText}>{hijoActual.grupo_nombre || 'Sin grupo'}</Text>

          {/* QR Code */}
          {hijoActual.qr_code_url ? (
            <>
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: hijoActual.qr_code_url }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.helperText}>
                Muestra este código QR en la puerta de entrada/salida
              </Text>
            </>
          ) : (
            <View style={styles.noQRContainer}>
              <Text style={styles.noQREmoji}>📱</Text>
              <Text style={styles.noQRText}>
                El QR de tu hijo aún no está disponible
              </Text>
              <Text style={styles.noQRSubtext}>
                Contacta a la directora para generarlo
              </Text>
            </View>
          )}

          {/* Sección QR Temporal */}
          <QRTemporalSection hijoId={hijoActual.id} hijoNombre={hijoActual.nombre_completo} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QRTemporalSection({ hijoId, hijoNombre }) {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [nombreAutorizado, setNombreAutorizado] = useState('');

  const { data: qrActivo, isLoading } = useQuery({
    queryKey: ['qr-temporal-mobile', hijoId],
    queryFn: () => api.get(`/alumnos/${hijoId}/qr-temporal`).then(r => r.data.qr_temporal),
    staleTime: 30000,
  });

  const generarMutation = useMutation({
    mutationFn: () => api.post(`/alumnos/${hijoId}/qr-temporal`, { nombre_autorizado: nombreAutorizado }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-temporal-mobile', hijoId] });
      setModalVisible(false);
      setNombreAutorizado('');
      setQrModalVisible(true);
    },
    onError: (e) => Alert.alert('Error', e.response?.data?.error || 'No se pudo generar el QR temporal'),
  });

  const cancelarMutation = useMutation({
    mutationFn: () => api.delete(`/alumnos/${hijoId}/qr-temporal`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-temporal-mobile', hijoId] });
      Alert.alert('Cancelado', 'El pase temporal fue cancelado');
    },
    onError: () => Alert.alert('Error', 'No se pudo cancelar el QR'),
  });

  const handleCancelar = () => {
    Alert.alert('Cancelar pase temporal', '¿Estás seguro? El QR dejará de funcionar inmediatamente.', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelarMutation.mutate() },
    ]);
  };

  const handleDescargar = async () => {
    if (!qrActivo) return;
    try {
      // Pedir permiso de galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para guardar el QR.');
        return;
      }

      // Escribir archivo en cache
      const nombre = qrActivo.nombre_autorizado.replace(/\s+/g, '-');
      const file = new File(Paths.cache, `QR-Temporal-${nombre}.png`);

      if (qrActivo.qr_url.startsWith('data:image/png;base64,')) {
        // Desarrollo: data URL → extraer base64 y escribir
        const base64 = qrActivo.qr_url.replace('data:image/png;base64,', '');
        file.write(base64, { encoding: 'base64' });
      } else {
        // Producción: URL HTTP (Cloudinary)
        await File.downloadFileAsync(qrActivo.qr_url, file, { idempotent: true });
      }

      // Guardar en galería
      await MediaLibrary.saveToLibraryAsync(file.uri);
      Alert.alert('¡Guardado!', 'El QR temporal fue guardado en tu galería.');
    } catch (e) {
      console.error('handleDescargar error:', e);
      Alert.alert('Error', e?.message || 'No se pudo guardar el QR');
    }
  };

  const handleCompartirWhatsApp = async () => {
    if (!qrActivo) return;
    const texto = encodeURIComponent(`Pase temporal para recoger/dejar a ${hijoNombre} en Happy School hoy.\nAutorizado: ${qrActivo.nombre_autorizado}\n\nPor favor muestra el QR al llegar al kínder.`);
    Linking.openURL(`https://wa.me/?text=${texto}`);
  };

  return (
    <View style={styles.temporalSection}>
      <Text style={styles.temporalSectionTitle}>🔐 Pase temporal</Text>
      <Text style={styles.temporalSectionSubtitle}>Solo para casos extraordinarios</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color="#D97706" style={{ marginTop: 8 }} />
      ) : qrActivo ? (
        <View style={styles.temporalActivo}>
          <Text style={styles.temporalActivoLabel}>Activo para:</Text>
          <Text style={styles.temporalActivoNombre}>{qrActivo.nombre_autorizado}</Text>
          <Text style={styles.temporalActivoVigencia}>Válido solo hoy</Text>
          <View style={styles.temporalBtns}>
            <TouchableOpacity style={styles.temporalVerBtn} onPress={() => setQrModalVisible(true)}>
              <Text style={styles.temporalVerBtnText}>Ver QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.temporalCancelarBtn}
              onPress={handleCancelar}
              disabled={cancelarMutation.isPending}
            >
              <Text style={styles.temporalCancelarBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.temporalGenerarBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.temporalGenerarBtnText}>+ Generar pase temporal para hoy</Text>
        </TouchableOpacity>
      )}

      {/* Modal ingresar nombre */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Pase temporal de acceso</Text>
            <View style={styles.modalAviso}>
              <Text style={styles.modalAvisoText}>
                ⚠️ Solo para casos extraordinarios. Las personas del círculo de confianza usan el QR permanente.
              </Text>
            </View>
            <Text style={styles.modalLabel}>
              Nombre de quien recogerá/dejará a {hijoNombre.split(' ')[0]}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={nombreAutorizado}
              onChangeText={setNombreAutorizado}
              placeholder="Ej: Abuela Rosa García"
              autoFocus
            />
            <Text style={styles.modalNote}>Válido solo hoy. Puedes cancelarlo en cualquier momento.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelarBtn} onPress={() => { setModalVisible(false); setNombreAutorizado(''); }}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalGenerarBtn, (!nombreAutorizado.trim() || generarMutation.isPending) && { opacity: 0.5 }]}
                onPress={() => generarMutation.mutate()}
                disabled={!nombreAutorizado.trim() || generarMutation.isPending}
              >
                <Text style={styles.modalGenerarText}>
                  {generarMutation.isPending ? 'Generando...' : 'Generar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal mostrar QR temporal */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Pase temporal</Text>
            {qrActivo && (
              <>
                <View style={styles.temporalQrInfo}>
                  <Text style={styles.temporalQrAutorizado}>Autorizado: {qrActivo.nombre_autorizado}</Text>
                  <Text style={styles.temporalQrVigencia}>Válido solo hoy — entrada y salida</Text>
                </View>
                <Image source={{ uri: qrActivo.qr_url }} style={styles.temporalQrImage} resizeMode="contain" />
                <Text style={styles.temporalQrNote}>La maestra verá el nombre al escanear</Text>
                <TouchableOpacity style={styles.descargarBtn} onPress={handleDescargar}>
                  <Text style={styles.descargarBtnText}>⬇️ Descargar / Compartir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.whatsappBtn} onPress={handleCompartirWhatsApp}>
                  <Text style={styles.whatsappBtnText}>📱 Compartir por WhatsApp</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.modalCerrarBtn} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.modalCerrarText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tabs: {
    paddingHorizontal: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
    fontSize: 14,
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  tabActive: {
    backgroundColor: '#805AD5',
    color: '#FFFFFF',
  },
  tabInactive: {
    backgroundColor: '#E2E8F0',
    color: '#718096',
  },
  cardContainer: {
    alignItems: 'center',
    gap: 16,
  },
  foto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  nombreAlumno: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D3748',
    textAlign: 'center',
  },
  grupoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
  },
  qrContainer: {
    width: 280,
    height: 280,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 8,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
    marginTop: 16,
  },
  noQRContainer: {
    width: 280,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E0',
    marginVertical: 12,
  },
  noQREmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noQRText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  noQRSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginTop: 12,
  },
  subText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  // QR Temporal
  temporalSection: {
    width: '100%',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  temporalSectionTitle: { fontSize: 14, fontWeight: '900', color: '#374151', marginBottom: 2 },
  temporalSectionSubtitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 12 },
  temporalGenerarBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#D97706',
    borderRadius: RADIUS.lg, padding: 14, alignItems: 'center',
  },
  temporalGenerarBtnText: { color: '#D97706', fontWeight: '800', fontSize: 13 },
  temporalActivo: {
    backgroundColor: '#FFFBEB', borderWidth: 2, borderColor: '#F59E0B',
    borderRadius: RADIUS.lg, padding: 14,
  },
  temporalActivoLabel: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  temporalActivoNombre: { fontSize: 16, fontWeight: '900', color: '#78350F', marginVertical: 2 },
  temporalActivoVigencia: { fontSize: 11, fontWeight: '600', color: '#D97706', marginBottom: 10 },
  temporalBtns: { flexDirection: 'row', gap: 8 },
  temporalVerBtn: {
    flex: 1, backgroundColor: '#FDE68A', borderRadius: RADIUS.md,
    padding: 10, alignItems: 'center',
  },
  temporalVerBtnText: { color: '#92400E', fontWeight: '800', fontSize: 13 },
  temporalCancelarBtn: {
    flex: 1, backgroundColor: '#FEE2E2', borderRadius: RADIUS.md,
    padding: 10, alignItems: 'center',
  },
  temporalCancelarBtnText: { color: '#991B1B', fontWeight: '800', fontSize: 13 },
  // Modales
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1F2937', textAlign: 'center' },
  modalAviso: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B',
    borderRadius: RADIUS.md, padding: 10,
  },
  modalAvisoText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  modalLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  modalInput: {
    borderWidth: 2, borderColor: '#E5E7EB', borderRadius: RADIUS.md,
    padding: 12, fontSize: 15, fontWeight: '600', color: '#1F2937',
  },
  modalNote: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelarBtn: {
    flex: 1, padding: 14, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center',
  },
  modalCancelarText: { fontWeight: '800', color: '#6B7280', fontSize: 14 },
  modalGenerarBtn: {
    flex: 2, padding: 14, borderRadius: RADIUS.lg,
    backgroundColor: '#D97706', alignItems: 'center',
  },
  modalGenerarText: { fontWeight: '900', color: '#fff', fontSize: 14 },
  temporalQrInfo: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B',
    borderRadius: RADIUS.md, padding: 10, width: '100%',
  },
  temporalQrAutorizado: { fontSize: 14, fontWeight: '900', color: '#78350F' },
  temporalQrVigencia: { fontSize: 12, fontWeight: '600', color: '#D97706', marginTop: 2 },
  temporalQrImage: { width: 220, height: 220, alignSelf: 'center', marginVertical: 8 },
  temporalQrNote: { fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  descargarBtn: {
    backgroundColor: '#2D3748', borderRadius: RADIUS.lg, padding: 14,
    alignItems: 'center', width: '100%', marginBottom: 8,
  },
  descargarBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  whatsappBtn: {
    backgroundColor: '#22C55E', borderRadius: RADIUS.lg, padding: 14,
    alignItems: 'center', width: '100%',
  },
  whatsappBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  modalCerrarBtn: {
    borderWidth: 2, borderColor: '#E5E7EB', borderRadius: RADIUS.lg,
    padding: 14, alignItems: 'center',
  },
  modalCerrarText: { fontWeight: '800', color: '#6B7280', fontSize: 14 },
});

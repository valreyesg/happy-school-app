import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';

// Modo: 'entrada' o 'salida'
export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [alumnoDetectado, setAlumnoDetectado] = useState(null);
  const [modo, setModo] = useState('entrada');
  const cooldownRef = useRef(false);

  const horaActual = new Date().getHours();
  useEffect(() => {
    setModo(horaActual >= 14 ? 'salida' : 'entrada');
  }, []);

  const registrarEntradaMutation = useMutation({
    mutationFn: (data) => api.post('/asistencia/entrada', data).then(r => r.data),
    onSuccess: (data) => {
      Vibration.vibrate(data.puede_entrar ? 200 : [200, 100, 200]);
      setAlumnoDetectado(prev => ({
        ...prev,
        resultado: data,
      }));
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.error || 'Error al registrar');
      resetScanner();
    },
  });

  const buscarAlumnoMutation = useMutation({
    mutationFn: (qrData) => api.get(`/alumnos/por-qr/${encodeURIComponent(qrData)}`).then(r => r.data),
    onSuccess: (alumno) => {
      Vibration.vibrate(100);
      setAlumnoDetectado(alumno);

      if (modo === 'entrada') {
        setScanned(true);
      }
    },
    onError: () => {
      Alert.alert('QR no reconocido', 'Este código no corresponde a ningún alumno', [
        { text: 'OK', onPress: resetScanner },
      ]);
    },
  });

  const buscarExtensionMutation = useMutation({
    mutationFn: (qrData) => api.get(`/ninos-extension/por-qr/${encodeURIComponent(qrData)}`).then(r => r.data),
    onSuccess: (nino) => {
      Vibration.vibrate(100);
      setAlumnoDetectado({ ...nino, es_extension: true });
      setScanned(true);
    },
    onError: () => {
      Alert.alert('QR no reconocido', 'Este código no corresponde a ningún niño de extensión', [
        { text: 'OK', onPress: resetScanner },
      ]);
    },
  });

  const handleBarCodeScanned = ({ data }) => {
    if (cooldownRef.current || scanned) return;
    if (!data.startsWith('HAPPYSCHOOL:ALUMNO:') && !data.startsWith('HAPPYSCHOOL:EXT:')) return;

    if (data.startsWith('HAPPYSCHOOL:EXT:')) {
      const horaMinutos = new Date().getHours() * 60 + new Date().getMinutes();
      const limiteMinutos = 14 * 60 + 45; // 14:45
      if (horaMinutos < limiteMinutos) {
        Alert.alert(
          '⏰ Entrada temprana',
          'Este niño de extensión llega antes de las 14:45. Se registrará igualmente.',
          [{ text: 'Continuar', onPress: () => { cooldownRef.current = true; setScanned(true); buscarExtensionMutation.mutate(data); setTimeout(() => { cooldownRef.current = false; }, 3000); } },
           { text: 'Cancelar' }],
        );
        return;
      }
      cooldownRef.current = true;
      setScanned(true);
      buscarExtensionMutation.mutate(data);
      setTimeout(() => { cooldownRef.current = false; }, 3000);
      return;
    }

    cooldownRef.current = true;
    setScanned(true);
    buscarAlumnoMutation.mutate(data);

    setTimeout(() => { cooldownRef.current = false; }, 3000);
  };

  const resetScanner = () => {
    setScanned(false);
    setAlumnoDetectado(null);
  };

  const confirmarEntrada = (checklistData) => {
    if (!alumnoDetectado) return;
    registrarEntradaMutation.mutate({
      alumno_id: alumnoDetectado.id,
      qr_escaneado: true,
      ...checklistData,
    });
  };

  if (!permission) return <View style={styles.center}><Text>Solicitando permiso...</Text></View>;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionText}>🎥</Text>
        <Text style={styles.permissionTitle}>Necesitamos acceso a la cámara</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Dar permiso</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ fontSize: 20, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {modo === 'entrada' ? '📷 Filtro de Entrada' : '📷 Registro de Salida'}
        </Text>
        <View style={styles.modoBadge}>
          <Text style={styles.modoText}>{modo === 'entrada' ? '7-8:30am' : '3-6pm'}</Text>
        </View>
      </View>

      {/* Cámara QR */}
      {!alumnoDetectado && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          {/* Marco de escaneo */}
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanHint}>Apunta al código QR del alumno</Text>
          </View>
        </View>
      )}

      {/* Panel del alumno detectado */}
      {alumnoDetectado && !alumnoDetectado.resultado && modo === 'entrada' && (
        <ChecklistEntrada
          alumno={alumnoDetectado}
          onConfirmar={confirmarEntrada}
          onCancelar={resetScanner}
          loading={registrarEntradaMutation.isPending}
        />
      )}

      {/* Resultado */}
      {alumnoDetectado?.resultado && (
        <ResultadoEntrada
          alumno={alumnoDetectado}
          resultado={alumnoDetectado.resultado}
          modo={modo}
          onSiguiente={resetScanner}
        />
      )}
    </SafeAreaView>
  );
}

function esCumpleanos(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date().toLocaleDateString('en-CA');
  const [, mesHoy, diaHoy] = hoy.split('-');
  const fn = new Date(fecha_nacimiento.substring(0, 10) + 'T12:00:00');
  return fn.getMonth() + 1 === parseInt(mesHoy) && fn.getDate() === parseInt(diaHoy);
}

// Checklist rápido de filtro de entrada
function ChecklistEntrada({ alumno, onConfirmar, onCancelar, loading }) {
  const [checks, setChecks] = useState({
    uñas_cortadas: true,
    sin_lagañas: true,
    sin_fiebre: true,
    sin_sintomas: true,
    trae_uniforme: true,
    trae_bata: true,
    trae_termo: true,
    agua_suficiente: true,
  });
  const [temperatura, setTemperatura] = useState('');

  const toggle = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const checkItems = [
    { key: 'uñas_cortadas', label: 'Uñas cortadas', emoji: '✂️' },
    { key: 'sin_lagañas', label: 'Sin lagañas', emoji: '👁️' },
    { key: 'sin_fiebre', label: 'Sin fiebre', emoji: '🌡️' },
    { key: 'sin_sintomas', label: 'Sin síntomas', emoji: '😷' },
    { key: 'trae_uniforme', label: 'Trae uniforme', emoji: '👕' },
    { key: 'trae_bata', label: 'Trae bata', emoji: '🥼' },
    { key: 'trae_termo', label: 'Trae termo', emoji: '💧' },
    { key: 'agua_suficiente', label: 'Agua suficiente', emoji: '🚰' },
  ];

  return (
    <View style={styles.checklistContainer}>
      {/* Foto del alumno */}
      <View style={styles.alumnoDetectadoHeader}>
        {alumno.foto_url ? (
          <Image source={{ uri: alumno.foto_url }} style={styles.alumnoFotoGrande} />
        ) : (
          <View style={[styles.alumnoFotoGrande, { backgroundColor: '#E9D5FF', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 48 }}>👧🏻</Text>
          </View>
        )}
        <View>
          <Text style={styles.alumnoNombreGrande}>{alumno.nombre_completo}</Text>
          <Text style={styles.alumnoGrupo}>{alumno.grupo_nombre}</Text>
        </View>
      </View>

      {/* Banner cumpleaños */}
      {esCumpleanos(alumno.fecha_nacimiento) && (
        <View style={styles.cumpleBanner}>
          <Text style={styles.cumpleText}>🎂 ¡Hoy es el cumple de {alumno.nombre_completo.split(' ')[0]}! 🎈</Text>
        </View>
      )}

      {/* Checklist */}
      <View style={styles.checklist}>
        {checkItems.map(({ key, label, emoji }) => (
          <TouchableOpacity
            key={key}
            style={[styles.checkItem, { backgroundColor: checks[key] ? '#C6F6D5' : '#FED7D7' }]}
            onPress={() => toggle(key)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
            <Text style={styles.checkLabel}>{label}</Text>
            <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{checks[key] ? '✅' : '❌'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botones */}
      <View style={styles.checklistActions}>
        <TouchableOpacity style={styles.cancelarBtn} onPress={onCancelar}>
          <Text style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmarBtn}
          onPress={() => onConfirmar({ ...checks, temperatura: temperatura ? parseFloat(temperatura) : null })}
          disabled={loading}
        >
          <Text style={styles.confirmarText}>
            {loading ? 'Registrando...' : '✅ Registrar entrada'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Resultado visual de la entrada/salida
function ResultadoEntrada({ alumno, resultado, modo, onSiguiente }) {
  const puede = resultado.puede_entrar;
  const tieneExtension = alumno.tiene_extension;
  const hermanosSinSalir = alumno.hermanos_sin_salir || 0;

  return (
    <View style={[styles.resultadoContainer, {
      backgroundColor: alumno.es_extension
        ? '#FFF7ED'
        : modo === 'entrada'
          ? (puede ? '#F0FFF4' : '#FFF5F5')
          : '#F3E8FF'
    }]}>
      {/* Banner niño de extensión */}
      {alumno.es_extension && (
        <View style={[styles.extensionBanner, { backgroundColor: '#FED7AA' }]}>
          <Text style={{ fontSize: 28 }}>🏫</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.extensionTitle}>Niño de extensión</Text>
            <Text style={styles.extensionSubtitle}>Registro de {modo}</Text>
          </View>
        </View>
      )}

      {/* Banner de extensión en modo salida */}
      {modo === 'salida' && tieneExtension && !alumno.es_extension && (
        <View style={styles.extensionBanner}>
          <Text style={{ fontSize: 28 }}>⏱️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.extensionTitle}>Extensión de horario activa</Text>
            <Text style={styles.extensionSubtitle}>
              Salida hasta las {alumno.hora_salida_extension || '18:00'}
            </Text>
          </View>
        </View>
      )}

      {/* Banner hermanos sin registrar salida */}
      {modo === 'salida' && hermanosSinSalir > 0 && (
        <View style={styles.hermanosBanner}>
          <Text style={{ fontSize: 28 }}>👨‍👩‍👧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.hermanosTitle}>
              {hermanosSinSalir === 1 ? '1 hermano' : `${hermanosSinSalir} hermanos`} sin salida registrada
            </Text>
            <Text style={styles.hermanosSubtitle}>Verificar antes de que salgan</Text>
          </View>
        </View>
      )}

      <Text style={{ fontSize: 80 }}>
        {modo === 'entrada' ? (puede ? '✅' : '❌') : '👋'}
      </Text>
      <Text style={[styles.resultadoTitle, {
        color: modo === 'entrada'
          ? (puede ? '#276749' : '#C53030')
          : '#7C3AED'
      }]}>
        {modo === 'entrada'
          ? (puede ? '¡Puede entrar!' : 'No puede entrar')
          : 'Salida registrada'}
      </Text>
      <Text style={styles.resultadoNombre}>{alumno.nombre_completo}</Text>

      {modo === 'entrada' && !puede && resultado.motivo && (
        <Text style={styles.resultadoMotivo}>⚠️ {resultado.motivo}</Text>
      )}

      {modo === 'entrada' && resultado.es_retardo && (
        <View style={styles.retardoBadge}>
          <Text style={styles.retardoText}>
            ⏰ Retardo #{resultado.numero_retardo} del mes
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.siguienteBtn} onPress={onSiguiente}>
        <Text style={styles.siguienteText}>→ Siguiente alumno</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: '#805AD5',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '900', fontSize: 16 },
  modoBadge: { backgroundColor: '#ffffff30', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  modoText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  cameraContainer: { flex: 1, position: 'relative' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250, height: 250, position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#B794F4', borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 24, textAlign: 'center' },
  // Checklist
  checklistContainer: { flex: 1, backgroundColor: '#fff', padding: 16 },
  alumnoDetectadoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, backgroundColor: '#F7FAFC', borderRadius: 20, marginBottom: 16,
  },
  alumnoFotoGrande: { width: 80, height: 80, borderRadius: 20 },
  alumnoNombreGrande: { fontSize: 18, fontWeight: '900', color: '#2D3748' },
  alumnoGrupo: { fontSize: 14, fontWeight: '600', color: '#805AD5', marginTop: 2 },
  cumpleBanner: {
    backgroundColor: '#FEFCBF', borderWidth: 2, borderColor: '#F6E05E',
    borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center',
  },
  cumpleText: { fontWeight: '900', color: '#744210', fontSize: 15, textAlign: 'center' },
  checklist: { gap: 8, marginBottom: 16 },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16,
  },
  checkLabel: { fontWeight: '700', fontSize: 14, color: '#2D3748', flex: 1 },
  checklistActions: { flexDirection: 'row', gap: 12 },
  cancelarBtn: {
    flex: 1, padding: 16, borderRadius: 16, borderWidth: 2,
    borderColor: '#E2E8F0', alignItems: 'center',
  },
  cancelarText: { fontWeight: '800', color: '#718096', fontSize: 15 },
  confirmarBtn: {
    flex: 2, padding: 16, borderRadius: 16, backgroundColor: '#38A169', alignItems: 'center',
  },
  confirmarText: { fontWeight: '900', color: '#fff', fontSize: 15 },
  // Resultado
  resultadoContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  extensionBanner: {
    width: '100%', backgroundColor: '#FBD38D', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  extensionTitle: { fontSize: 14, fontWeight: '900', color: '#744210' },
  extensionSubtitle: { fontSize: 12, fontWeight: '600', color: '#975A16', marginTop: 2 },
  hermanosBanner: {
    width: '100%', backgroundColor: '#FECACA', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
    borderWidth: 2, borderColor: '#FCA5A5',
  },
  hermanosTitle: { fontSize: 14, fontWeight: '900', color: '#991B1B' },
  hermanosSubtitle: { fontSize: 12, fontWeight: '600', color: '#B91C1C', marginTop: 2 },
  resultadoTitle: { fontSize: 32, fontWeight: '900' },
  resultadoNombre: { fontSize: 20, fontWeight: '800', color: '#2D3748' },
  resultadoMotivo: { fontSize: 15, fontWeight: '600', color: '#C53030', textAlign: 'center' },
  retardoBadge: {
    backgroundColor: '#FEFCBF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8,
  },
  retardoText: { color: '#744210', fontWeight: '800', fontSize: 14 },
  siguienteBtn: {
    backgroundColor: '#805AD5', borderRadius: 20, paddingHorizontal: 32, paddingVertical: 16,
    marginTop: 8,
  },
  siguienteText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  permissionText: { fontSize: 64 },
  permissionTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', textAlign: 'center' },
  permissionBtn: {
    backgroundColor: '#805AD5', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14,
  },
  permissionBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});

import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, RADIUS } from '@/constants/theme';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, Image, ScrollView, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useCatalogo } from '@/hooks/useCatalogo';

// Modo: 'entrada' o 'salida'
export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [alumnoDetectado, setAlumnoDetectado] = useState(null);
  const [modo, setModo] = useState('entrada');
  const cooldownRef = useRef(false);
  const [horaSalidaNormal, setHoraSalidaNormal] = useState(14);
  const [horaSalidaExtension, setHoraSalidaExtension] = useState('14:45');

  // Estado para cadena de hermanos
  const [hermanosPendientes, setHermanosPendientes] = useState(null);
  const [colaHermanos, setColaHermanos] = useState([]);

  const horaActual = new Date().getHours();

  // Cargar horarios de configuración
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const res = await api.get('/config/horarios');
        if (res.data?.horarios) {
          const hora = res.data.horarios.hora_salida_normal;
          if (hora) {
            const [h, m] = hora.split(':').map(Number);
            setHoraSalidaNormal(h);
          }
          const horaExt = res.data.horarios.hora_salida_extension;
          if (horaExt) {
            setHoraSalidaExtension(horaExt);
          }
        }
      } catch (e) {
        console.error('Error cargando config horarios:', e);
      }
    };
    cargarConfig();
  }, []);

  useEffect(() => {
    setModo(horaActual >= horaSalidaNormal ? 'salida' : 'entrada');
  }, [horaSalidaNormal]);

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

  const registrarSalidaMutation = useMutation({
    mutationFn: (data) => api.post('/asistencia/salida', data).then(r => r.data),
    onSuccess: (data) => {
      Vibration.vibrate(200);
      setAlumnoDetectado(prev => ({ ...prev, resultado: data }));
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.error || 'Error al registrar salida');
      resetScanner();
    },
  });

  const confirmarSalida = (filtroData) => {
    if (!alumnoDetectado) return;
    registrarSalidaMutation.mutate({
      alumno_id: alumnoDetectado.id,
      ...filtroData,
    });
  };

  const buscarAlumnoMutation = useMutation({
    mutationFn: (qrData) => api.get(`/alumnos/por-qr/${encodeURIComponent(qrData)}`).then(r => r.data),
    onSuccess: (alumno) => {
      Vibration.vibrate(100);
      setAlumnoDetectado(alumno);

      if (modo === 'entrada') {
        setScanned(true);
      }
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Este código no corresponde a ningún alumno';
      const esTemporal = err?.response?.data?.es_temporal;
      const titulo = esTemporal ? 'Pase temporal inválido' : 'QR no reconocido';
      Alert.alert(titulo, msg, [{ text: 'OK', onPress: resetScanner }]);
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
    if (!data.startsWith('HAPPYSCHOOL:ALUMNO:') && !data.startsWith('HAPPYSCHOOL:EXT:') && !data.startsWith('HAPPYSCHOOL:TEMP:')) return;

    if (data.startsWith('HAPPYSCHOOL:EXT:')) {
      const horaMinutos = new Date().getHours() * 60 + new Date().getMinutes();
      const [hExt, mExt] = horaSalidaExtension.split(':').map(Number);
      const limiteMinutos = hExt * 60 + mExt;
      if (horaMinutos < limiteMinutos) {
        Alert.alert(
          '⏰ Entrada temprana',
          `Este niño de extensión llega antes de las ${horaSalidaExtension}. Se registrará igualmente.`,
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
    setHermanosPendientes(null);
    setColaHermanos([]);
  };

  const handleSiguiente = async () => {
    const alumnoId = alumnoDetectado?.id;

    // Si hay más hermanos en cola, procesar el siguiente
    if (colaHermanos.length > 0) {
      const [siguiente, ...resto] = colaHermanos;
      setColaHermanos(resto);
      setAlumnoDetectado(siguiente);
      setScanned(true);
      return;
    }

    // Buscar hermanos pendientes
    if (alumnoId) {
      try {
        const res = await api.get(`/alumnos/${alumnoId}/hermanos`);
        const hermanos = res.data.hermanos || [];
        const pendientes = modo === 'entrada'
          ? hermanos.filter(h => !h.entrada_hoy)
          : hermanos.filter(h => h.entrada_hoy && h.entrada_hoy.puede_entrar && !h.salida_hoy);

        if (pendientes.length > 0) {
          setHermanosPendientes(pendientes);
          return;
        }
      } catch {
        // Si falla, flujo normal
      }
    }

    resetScanner();
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

      {/* Panel del alumno detectado — ENTRADA */}
      {alumnoDetectado && !alumnoDetectado.resultado && modo === 'entrada' && (
        <ChecklistEntrada
          alumno={alumnoDetectado}
          onConfirmar={confirmarEntrada}
          onCancelar={resetScanner}
          loading={registrarEntradaMutation.isPending}
        />
      )}

      {/* Panel del alumno detectado — SALIDA */}
      {alumnoDetectado && !alumnoDetectado.resultado && modo === 'salida' && (
        <ConfirmacionSalida
          alumno={alumnoDetectado}
          onConfirmar={confirmarSalida}
          onCancelar={resetScanner}
          loading={registrarSalidaMutation.isPending}
        />
      )}

      {/* Resultado */}
      {alumnoDetectado?.resultado && !hermanosPendientes && (
        <ResultadoEntrada
          alumno={alumnoDetectado}
          resultado={alumnoDetectado.resultado}
          modo={modo}
          onSiguiente={handleSiguiente}
        />
      )}

      {/* Pantalla de hermanos detectados */}
      {hermanosPendientes && hermanosPendientes.length > 0 && (
        <PantallaHermanos
          hermanos={hermanosPendientes}
          modo={modo}
          onRegistrar={(seleccion) => {
            setHermanosPendientes(null);
            if (seleccion.length > 0) {
              const [primero, ...resto] = seleccion;
              setColaHermanos(resto);
              setAlumnoDetectado(primero);
              setScanned(true);
            } else {
              resetScanner();
            }
          }}
          onOmitir={resetScanner}
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
    panial_limpio: true,
    trajo_paniales: true,
    trae_uniforme: true,
    trae_bata: true,
    trae_termo: true,
    agua_suficiente: true,
  });
  const [temperatura, setTemperatura] = useState('');
  const [confirmacionComida, setConfirmacionComida] = useState(null);
  const [pagoVerificado, setPagoVerificado] = useState(false);
  const { items: checklistCatalogo } = useCatalogo('checklist-entrada');

  // Cargar confirmación de comida de la semana actual
  useEffect(() => {
    const cargarComida = async () => {
      try {
        const hoy = new Date().toLocaleDateString('en-CA');
        const [año, mes, dia] = hoy.split('-');
        const lunes = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
        const semanaInicio = lunes.toLocaleDateString('en-CA');
        const res = await api.get(`/comida/confirmacion/${alumno.id}?semana=${semanaInicio}`);
        if (res.data) {
          setConfirmacionComida(res.data);
          setPagoVerificado(res.data.pago_verificado || false);
        }
      } catch {
        // Sin datos de comida, no mostrar sección
      }
    };
    if (alumno?.id) cargarComida();
  }, [alumno?.id]);

  const toggle = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const checkItems = checklistCatalogo.length > 0 ? checklistCatalogo : [
    { key: 'uñas_cortadas', label: 'Uñas cortadas', emoji: '✂️' },
    { key: 'sin_lagañas', label: 'Sin lagañas', emoji: '👁️' },
    { key: 'sin_fiebre', label: 'Sin fiebre', emoji: '🌡️' },
    { key: 'sin_sintomas', label: 'Sin síntomas', emoji: '😷' },
    { key: 'trae_uniforme', label: 'Trae uniforme', emoji: '👕' },
    { key: 'trae_bata', label: 'Trae bata', emoji: '🥼' },
    { key: 'trae_termo', label: 'Trae termo', emoji: '💧' },
    { key: 'agua_suficiente', label: 'Agua suficiente', emoji: '🚰' },
  ];

  const handleConfirmar = async () => {
    // Si hay comida activa (no cancelada por directora), actualizar estado de pago
    if (confirmacionComida && confirmacionComida.estado !== 'cancelado') {
      try {
        if (pagoVerificado) {
          await api.put(`/comida/confirmacion/${confirmacionComida.id}/verificar-pago`);
        } else if (confirmacionComida.pago_verificado) {
          await api.put(`/comida/confirmacion/${confirmacionComida.id}/cancelar`);
        }
      } catch {
        // No bloquear la entrada si falla la actualización de comida
      }
    }
    onConfirmar({ ...checks, temperatura: temperatura ? parseFloat(temperatura) : null });
  };

  return (
    <ScrollView style={styles.checklistContainer} contentContainerStyle={{ paddingBottom: 24 }}>
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

      {/* Banner QR temporal */}
      {alumno.es_temporal && (
        <View style={styles.temporalBanner}>
          <Text style={styles.temporalTitle}>🔐 PASE TEMPORAL — Verificar identidad</Text>
          <Text style={styles.temporalAutorizado}>Autorizado por: {alumno.padre_nombre}</Text>
          <Text style={styles.temporalNombre}>Persona autorizada: {alumno.nombre_autorizado}</Text>
        </View>
      )}

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

        {/* Pañal — solo si usa_panial */}
        {alumno.usa_panial && (
          <>
            <TouchableOpacity
              style={[styles.checkItem, { backgroundColor: checks.panial_limpio ? '#C6F6D5' : '#FED7D7' }]}
              onPress={() => toggle('panial_limpio')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20 }}>👶🏻</Text>
              <Text style={styles.checkLabel}>Pañal limpio</Text>
              <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{checks.panial_limpio ? '✅' : '❌'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkItem, { backgroundColor: checks.trajo_paniales ? '#C6F6D5' : '#FED7D7' }]}
              onPress={() => toggle('trajo_paniales')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20 }}>🧷</Text>
              <Text style={styles.checkLabel}>Trajo pañales (5)</Text>
              <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{checks.trajo_paniales ? '✅' : '❌'}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Comida — solo si tiene confirmación activa (no cancelada por directora) */}
        {confirmacionComida && confirmacionComida.estado !== 'cancelado' && (
          <TouchableOpacity
            style={[styles.checkItem, { backgroundColor: pagoVerificado ? '#C6F6D5' : '#FED7D7' }]}
            onPress={() => setPagoVerificado(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>🍱</Text>
            <Text style={styles.checkLabel}>{pagoVerificado ? 'Pago verificado' : 'No pagó - Cancelar comida'}</Text>
            <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{pagoVerificado ? '✅' : '❌'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Botones */}
      <View style={styles.checklistActions}>
        <TouchableOpacity style={styles.cancelarBtn} onPress={onCancelar}>
          <Text style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmarBtn}
          onPress={handleConfirmar}
          disabled={loading}
        >
          <Text style={styles.confirmarText}>
            {loading ? 'Registrando...' : '✅ Registrar entrada'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Filtro de salida completo — paridad con web
function ConfirmacionSalida({ alumno, onConfirmar, onCancelar, loading }) {
  const padres = alumno.padres || [];
  const autorizados = alumno.autorizados || [];

  // Opciones de quién recoge
  const opciones = [
    ...padres.map(p => ({ tipo: 'padre', id: p.id, label: `${p.nombre} (${p.tipo})` })),
    ...autorizados.map(a => ({ tipo: 'autorizado', id: a.id, label: `${a.nombre} (${a.parentesco})` })),
    { tipo: 'otro', id: 'otro', label: '👤 Otro (escribir nombre)' },
  ];

  const [seleccion, setSeleccion] = useState(opciones[0]?.id || 'otro');
  const [nombreOtro, setNombreOtro] = useState('');
  const [panialLimpio, setPanialLimpio] = useState(true);
  const [pertenenciasOk, setPertenenciasOk] = useState(true);
  const [estadoFisicoOk, setEstadoFisicoOk] = useState(true);
  const [notasSanitarias, setNotasSanitarias] = useState('');
  const [entregaConforme, setEntregaConforme] = useState(true);

  const handleConfirmar = () => {
    const opcion = opciones.find(o => o.id === seleccion);
    if (opcion?.tipo === 'otro' && !nombreOtro.trim()) {
      Alert.alert('Campo requerido', 'Escribe el nombre de quien recoge');
      return;
    }
    const payload = {};
    if (opcion?.tipo === 'padre') {
      payload.padre_id = opcion.id;
    } else if (opcion?.tipo === 'autorizado') {
      payload.persona_autorizada_id = opcion.id;
    } else {
      payload.nombre_quien_recoge = nombreOtro.trim();
    }
    payload.panial_limpio = panialLimpio;
    payload.pertenencias_ok = pertenenciasOk;
    payload.estado_fisico_ok = estadoFisicoOk;
    if (notasSanitarias.trim()) payload.notas_sanitarias = notasSanitarias.trim();
    payload.entrega_conforme = entregaConforme;
    onConfirmar(payload);
  };

  return (
    <ScrollView style={styles.checklistContainer} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header alumno */}
      <View style={styles.alumnoDetectadoHeader}>
        {alumno.foto_url ? (
          <Image source={{ uri: alumno.foto_url }} style={styles.alumnoFotoGrande} />
        ) : (
          <View style={[styles.alumnoFotoGrande, { backgroundColor: '#E9D5FF', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 48 }}>👧🏻</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.alumnoNombreGrande}>{alumno.nombre_completo}</Text>
          <Text style={styles.alumnoGrupo}>{alumno.grupo_nombre}</Text>
        </View>
      </View>

      {/* Banner QR temporal */}
      {alumno.es_temporal && (
        <View style={styles.temporalBanner}>
          <Text style={styles.temporalTitle}>🔐 PASE TEMPORAL — Verificar identidad</Text>
          <Text style={styles.temporalAutorizado}>Autorizado por: {alumno.padre_nombre}</Text>
          <Text style={styles.temporalNombre}>Persona autorizada: {alumno.nombre_autorizado}</Text>
        </View>
      )}

      {/* Extensión */}
      {alumno.tiene_extension && (
        <View style={[styles.temporalBanner, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
          <Text style={[styles.temporalTitle, { color: '#1E3A5F' }]}>
            ⏳ Extensión activa — salida hasta {alumno.hora_salida_extension || '18:00'}
          </Text>
        </View>
      )}

      {/* ── Quién recoge ── */}
      <Text style={styles.seccionLabel}>¿Quién recoge?</Text>
      {opciones.map(op => (
        <TouchableOpacity
          key={op.id}
          style={[styles.opcionBtn, seleccion === op.id && styles.opcionBtnSelected]}
          onPress={() => setSeleccion(op.id)}
          activeOpacity={0.8}
        >
          <View style={[styles.radioCircle, seleccion === op.id && styles.radioCircleSelected]}>
            {seleccion === op.id && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.opcionLabel, seleccion === op.id && styles.opcionLabelSelected]}>
            {op.label}
          </Text>
        </TouchableOpacity>
      ))}

      {seleccion === 'otro' && (
        <TextInput
          style={[styles.textInput, { marginTop: 8 }]}
          placeholder="Nombre completo de quien recoge"
          value={nombreOtro}
          onChangeText={setNombreOtro}
          placeholderTextColor="#A0AEC0"
        />
      )}

      {/* ── Checklist salida ── */}
      <Text style={[styles.seccionLabel, { marginTop: 16 }]}>Checklist de salida</Text>

      {alumno.usa_panial && (
        <TouchableOpacity
          style={[styles.checkItem, { backgroundColor: panialLimpio ? '#C6F6D5' : '#FED7D7' }]}
          onPress={() => setPanialLimpio(v => !v)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20 }}>🧷</Text>
          <Text style={styles.checkLabel}>Pañal limpio al salir</Text>
          <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{panialLimpio ? '✅' : '❌'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.checkItem, { backgroundColor: pertenenciasOk ? '#C6F6D5' : '#FED7D7' }]}
        onPress={() => setPertenenciasOk(v => !v)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 20 }}>🎒</Text>
        <Text style={styles.checkLabel}>Pertenencias completas</Text>
        <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{pertenenciasOk ? '✅' : '❌'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkItem, { backgroundColor: estadoFisicoOk ? '#C6F6D5' : '#FED7D7' }]}
        onPress={() => setEstadoFisicoOk(v => !v)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 20 }}>💚</Text>
        <Text style={styles.checkLabel}>Estado físico normal</Text>
        <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{estadoFisicoOk ? '✅' : '❌'}</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.textInput, { marginTop: 8, minHeight: 60, textAlignVertical: 'top' }]}
        placeholder="Observaciones (opcional)..."
        value={notasSanitarias}
        onChangeText={setNotasSanitarias}
        multiline
        placeholderTextColor="#A0AEC0"
      />

      <TouchableOpacity
        style={[styles.checkItem, { backgroundColor: entregaConforme ? '#C6F6D5' : '#FED7D7', marginTop: 8 }]}
        onPress={() => setEntregaConforme(v => !v)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 20 }}>✅</Text>
        <Text style={[styles.checkLabel, { fontWeight: '900' }]}>Entrega conforme</Text>
        <Text style={{ fontSize: 22, marginLeft: 'auto' }}>{entregaConforme ? '✅' : '❌'}</Text>
      </TouchableOpacity>

      {/* Botones */}
      <View style={[styles.checklistActions, { marginTop: 20 }]}>
        <TouchableOpacity style={styles.cancelarBtn} onPress={onCancelar}>
          <Text style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.confirmarBtn, { backgroundColor: '#805AD5' }]} onPress={handleConfirmar} disabled={loading}>
          <Text style={styles.confirmarText}>
            {loading ? 'Registrando...' : '🚪 Confirmar salida'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
      {/* Banner QR temporal */}
      {alumno.es_temporal && (
        <View style={[styles.temporalBanner, { width: '100%' }]}>
          <Text style={styles.temporalTitle}>🔐 PASE TEMPORAL</Text>
          <Text style={styles.temporalAutorizado}>Autorizado por: {alumno.padre_nombre}</Text>
          <Text style={styles.temporalNombre}>Persona: {alumno.nombre_autorizado}</Text>
        </View>
      )}

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

// Pantalla de selección de hermanos para registro en cadena
function PantallaHermanos({ hermanos, modo, onRegistrar, onOmitir }) {
  const [seleccionados, setSeleccionados] = useState(
    () => new Set(hermanos.map(h => h.id))
  );

  const toggle = (id) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const label = modo === 'entrada' ? 'entrada' : 'salida';

  return (
    <View style={styles.hermanosContainer}>
      <Text style={{ fontSize: 48, textAlign: 'center' }}>👨‍👩‍👧‍👦</Text>
      <Text style={styles.hermanosTitulo}>Hermanos detectados</Text>
      <Text style={styles.hermanosDesc}>
        {hermanos.length === 1 ? '1 hermano' : `${hermanos.length} hermanos`} sin {label} registrada
      </Text>

      <ScrollView style={{ width: '100%', maxHeight: 300 }} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {hermanos.map(h => (
          <TouchableOpacity
            key={h.id}
            style={[
              styles.hermanoItem,
              seleccionados.has(h.id) && styles.hermanoItemSelected,
            ]}
            onPress={() => toggle(h.id)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.hermanoCheck,
              seleccionados.has(h.id) && styles.hermanoCheckSelected,
            ]}>
              {seleccionados.has(h.id) && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
            </View>
            {h.foto_url ? (
              <Image source={{ uri: h.foto_url }} style={styles.hermanoFoto} />
            ) : (
              <View style={[styles.hermanoFoto, { backgroundColor: '#E9D5FF', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 20 }}>👧🏻</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.hermanoNombre}>{h.nombre_completo}</Text>
              <Text style={styles.hermanoGrupo}>{h.grupo_nombre}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.hermanosBtns}>
        <TouchableOpacity style={styles.hermanosOmitirBtn} onPress={onOmitir}>
          <Text style={styles.hermanosOmitirText}>Omitir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.hermanosRegistrarBtn, seleccionados.size === 0 && { opacity: 0.5 }]}
          onPress={() => {
            const seleccion = hermanos.filter(h => seleccionados.has(h.id));
            onRegistrar(seleccion);
          }}
          disabled={seleccionados.size === 0}
        >
          <Text style={styles.hermanosRegistrarText}>Registrar {label} →</Text>
        </TouchableOpacity>
      </View>
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
  modoBadge: { backgroundColor: '#ffffff30', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 4 },
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
  checklistContainer: { flex: 1, backgroundColor: COLORS.white, padding: 16 },
  alumnoDetectadoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, backgroundColor: '#F7FAFC', borderRadius: RADIUS.xl, marginBottom: 16,
  },
  alumnoFotoGrande: { width: 80, height: 80, borderRadius: RADIUS.xl },
  alumnoNombreGrande: { fontSize: 18, fontWeight: '900', color: '#2D3748' },
  alumnoGrupo: { fontSize: 14, fontWeight: '600', color: '#805AD5', marginTop: 2 },
  temporalBanner: {
    backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: '#F59E0B',
    borderRadius: RADIUS.lg, padding: 14, marginBottom: 12,
  },
  temporalTitle: { fontWeight: '900', color: '#92400E', fontSize: 14, marginBottom: 4 },
  temporalAutorizado: { fontWeight: '700', color: '#78350F', fontSize: 13 },
  temporalNombre: { fontWeight: '900', color: '#92400E', fontSize: 15, marginTop: 4 },
  cumpleBanner: {
    backgroundColor: '#FEFCBF', borderWidth: 2, borderColor: '#F6E05E',
    borderRadius: RADIUS.lg, padding: 12, marginBottom: 12, alignItems: 'center',
  },
  cumpleText: { fontWeight: '900', color: '#744210', fontSize: 15, textAlign: 'center' },
  checklist: { gap: 8, marginBottom: 16 },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: RADIUS.lg,
  },
  checkLabel: { fontWeight: '700', fontSize: 14, color: '#2D3748', flex: 1 },
  checklistActions: { flexDirection: 'row', gap: 12 },
  cancelarBtn: {
    flex: 1, padding: 16, borderRadius: RADIUS.lg, borderWidth: 2,
    borderColor: '#E2E8F0', alignItems: 'center',
  },
  cancelarText: { fontWeight: '800', color: '#718096', fontSize: 15 },
  confirmarBtn: {
    flex: 2, padding: 16, borderRadius: RADIUS.lg, backgroundColor: '#38A169', alignItems: 'center',
  },
  confirmarText: { fontWeight: '900', color: '#fff', fontSize: 15 },
  // FiltroSalida
  seccionLabel: { fontSize: 11, fontWeight: '900', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  opcionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: RADIUS.lg, borderWidth: 2,
    borderColor: '#E2E8F0', backgroundColor: '#fff', marginBottom: 6,
  },
  opcionBtnSelected: { borderColor: '#805AD5', backgroundColor: '#FAF5FF' },
  opcionLabel: { fontWeight: '700', fontSize: 13, color: '#4A5568', flex: 1 },
  opcionLabelSelected: { color: '#553C9A' },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E0', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#805AD5' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#805AD5' },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#4A5568', marginBottom: 6 },
  textInput: {
    borderWidth: 2, borderColor: '#E2E8F0', borderRadius: RADIUS.lg,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600',
    color: '#2D3748', backgroundColor: '#fff',
  },
  // Resultado
  resultadoContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  extensionBanner: {
    width: '100%', backgroundColor: '#FBD38D', borderRadius: RADIUS.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  extensionTitle: { fontSize: 14, fontWeight: '900', color: '#744210' },
  extensionSubtitle: { fontSize: 12, fontWeight: '600', color: '#975A16', marginTop: 2 },
  hermanosBanner: {
    width: '100%', backgroundColor: '#FECACA', borderRadius: RADIUS.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
    borderWidth: 2, borderColor: '#FCA5A5',
  },
  hermanosTitle: { fontSize: 14, fontWeight: '900', color: '#991B1B' },
  hermanosSubtitle: { fontSize: 12, fontWeight: '600', color: '#B91C1C', marginTop: 2 },
  resultadoTitle: { fontSize: 32, fontWeight: '900' },
  resultadoNombre: { fontSize: 20, fontWeight: '800', color: '#2D3748' },
  resultadoMotivo: { fontSize: 15, fontWeight: '600', color: '#C53030', textAlign: 'center' },
  retardoBadge: {
    backgroundColor: '#FEFCBF', borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 8,
  },
  retardoText: { color: '#744210', fontWeight: '800', fontSize: 14 },
  siguienteBtn: {
    backgroundColor: '#805AD5', borderRadius: RADIUS.xl, paddingHorizontal: 32, paddingVertical: 16,
    marginTop: 8,
  },
  siguienteText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  permissionText: { fontSize: 64 },
  permissionTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', textAlign: 'center' },
  permissionBtn: {
    backgroundColor: '#805AD5', borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 14,
  },
  permissionBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  // Pantalla hermanos
  hermanosContainer: {
    flex: 1, backgroundColor: '#F3E8FF', alignItems: 'center',
    justifyContent: 'center', padding: 24, gap: 8,
  },
  hermanosTitulo: { fontSize: 24, fontWeight: '900', color: '#553C9A', textAlign: 'center' },
  hermanosDesc: { fontSize: 14, fontWeight: '600', color: '#6B46C1', textAlign: 'center', marginBottom: 8 },
  hermanoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: RADIUS.lg, borderWidth: 2,
    borderColor: '#E2E8F0', backgroundColor: '#fff',
  },
  hermanoItemSelected: { borderColor: '#805AD5', backgroundColor: '#FAF5FF' },
  hermanoCheck: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2,
    borderColor: '#CBD5E0', alignItems: 'center', justifyContent: 'center',
  },
  hermanoCheckSelected: { borderColor: '#805AD5', backgroundColor: '#805AD5' },
  hermanoFoto: { width: 40, height: 40, borderRadius: RADIUS.lg },
  hermanoNombre: { fontSize: 14, fontWeight: '800', color: '#2D3748' },
  hermanoGrupo: { fontSize: 12, fontWeight: '600', color: '#805AD5' },
  hermanosBtns: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  hermanosOmitirBtn: {
    flex: 1, padding: 14, borderRadius: RADIUS.lg, borderWidth: 2,
    borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#fff',
  },
  hermanosOmitirText: { fontWeight: '800', color: '#718096', fontSize: 14 },
  hermanosRegistrarBtn: {
    flex: 2, padding: 14, borderRadius: RADIUS.lg,
    backgroundColor: '#805AD5', alignItems: 'center',
  },
  hermanosRegistrarText: { fontWeight: '900', color: '#fff', fontSize: 14 },
});

import { useState, useCallback, useEffect } from 'react';
import { COLORS, RADIUS } from '@/constants/theme';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';
import { useCatalogo } from '../../src/hooks/useCatalogo';
import { Ionicons } from '@expo/vector-icons';

// ─── Helpers ────────────────────────────────────────────────────────────────

function Seccion({ titulo, children }) {
  return (
    <View style={s.seccion}>
      <Text style={s.seccionTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

function Contador({ label, value, onChange }) {
  return (
    <View style={s.contadorRow}>
      <Text style={s.contadorLabel}>{label}</Text>
      <View style={s.contadorBtns}>
        <TouchableOpacity style={s.contadorBtn} onPress={() => onChange(Math.max(0, value - 1))}>
          <Text style={s.contadorBtnTxt}>−</Text>
        </TouchableOpacity>
        <Text style={s.contadorVal}>{value}</Text>
        <TouchableOpacity style={s.contadorBtn} onPress={() => onChange(value + 1)}>
          <Text style={s.contadorBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BoolBtn({ label, value, onChange }) {
  return (
    <View style={s.boolRow}>
      <Text style={s.boolLabel}>{label}</Text>
      <View style={s.boolBtns}>
        <TouchableOpacity
          style={[s.boolBtn, value === true && s.boolBtnSiOn]}
          onPress={() => onChange(value === true ? null : true)}
        >
          <Text style={[s.boolBtnTxt, value === true && s.boolBtnTxtOn]}>Sí</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.boolBtn, value === false && s.boolBtnNoOn]}
          onPress={() => onChange(value === false ? null : false)}
        >
          <Text style={[s.boolBtnTxt, value === false && s.boolBtnTxtOn]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Selector de alumno ──────────────────────────────────────────────────────

function SelectorAlumno() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['mi-grupo'],
    queryFn: () => api.get('/grupos/mi-grupo').then(r => r.data),
  });

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#805AD5" />
        <Text style={s.loadingTxt}>Cargando grupo…</Text>
      </View>
    );
  }

  const alumnos = data?.alumnos || [];

  return (
    <View style={{ flex: 1 }}>
      <View style={s.header}>
        <Text style={s.headerTitulo}>Bitácora del día</Text>
        <Text style={s.headerSub}>Selecciona un alumno</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {alumnos.map(alumno => (
          <TouchableOpacity
            key={alumno.id}
            style={s.alumnoCard}
            onPress={() => router.push(`/(maestra)/bitacora?alumnoId=${alumno.id}&nombre=${encodeURIComponent(alumno.nombre_completo)}&usaPanial=${alumno.usa_panial}&nivelCodigo=${encodeURIComponent(alumno.nivel_codigo || '')}`)}
          >
            <View style={[s.avatarCircle, { backgroundColor: '#805AD5' }]}>
              <Text style={s.avatarTxt}>{alumno.nombre_completo.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alumnoNombre}>{alumno.nombre_completo}</Text>
              <Text style={s.alumnoSub}>{alumno.grupo_nombre}</Text>
            </View>
            {alumno.bitacora_hoy ? (
              <View style={s.badgeVerde}><Text style={s.badgeTxt}>✓ Guardada</Text></View>
            ) : (
              <View style={s.badgeGris}><Text style={s.badgeTxt}>Pendiente</Text></View>
            )}
          </TouchableOpacity>
        ))}
        {alumnos.length === 0 && (
          <Text style={s.emptyTxt}>No tienes alumnos asignados hoy.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Formulario de bitácora ──────────────────────────────────────────────────

function FormularioBitacora({ alumnoId, nombre, usaPanial, nivelCodigo }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fecha = new Date().toLocaleDateString('en-CA');

  const mostrarEsfinteres = !usaPanial && ['maternal', 'prekinder', 'kinder1'].includes(nivelCodigo);

  // ── Estado del formulario ──
  const [animo, setAnimo] = useState(null);
  const [pipiCount, setPipiCount] = useState(0);
  const [popoCount, setPopoCount] = useState(0);
  const [queComio, setQueComio] = useState('');
  const [cuantoComio, setCuantoComio] = useState(null);
  const [observacionesComida, setObservacionesComida] = useState('');
  const [tareaRealizada, setTareaRealizada] = useState(null);
  const [comportamiento, setComportamiento] = useState(null);
  const [comportamientoNotas, setComportamientoNotas] = useState('');
  const [tuvoFiebre, setTuvoFiebre] = useState(false);
  const [temperatura, setTemperatura] = useState('');
  const [seEnfermo, setSeEnfermo] = useState(false);
  const [descripcionEnfermedad, setDescripcionEnfermedad] = useState('');
  const [notas, setNotas] = useState('');
  // Esfínteres
  const [fueSolo, setFueSolo] = useState(null);
  const [pidioIr, setPidioIr] = useState(null);
  const [tuvoAccidente, setTuvoAccidente] = useState(null);
  const [descripcionAccidente, setDescripcionAccidente] = useState('');
  const [necesitaAyuda, setNecesitaAyuda] = useState(null);
  const [notasProgreso, setNotasProgreso] = useState('');

  // ── Cargar datos existentes ──
  const { isLoading, data: bitacoraExistente } = useQuery({
    queryKey: ['bitacora', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
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

  useEffect(() => {
    if (!bitacoraExistente) return;
    const data = bitacoraExistente;
    if (data.bitacora) {
      setAnimo(data.bitacora.estado_animo || null);
      setTareaRealizada(data.bitacora.actividad_realizada ?? null);
      setComportamiento(data.bitacora.comportamiento || null);
      setComportamientoNotas(data.bitacora.comportamiento_notas || '');
      setTuvoFiebre(data.bitacora.tuvo_fiebre || false);
      setTemperatura(data.bitacora.temperatura_dia?.toString() || '');
      setSeEnfermo(data.bitacora.se_enfermo || false);
      setDescripcionEnfermedad(data.bitacora.descripcion_enfermedad || '');
      setNotas(data.bitacora.notas || '');
    }
    if (data.banio) {
      setPipiCount(data.banio.pipi_count || 0);
      setPopoCount(data.banio.popo_count || 0);
    }
    if (data.comida) {
      setQueComio(data.comida.que_comio || '');
      setCuantoComio(data.comida.cuanto_comio || null);
      setObservacionesComida(data.comida.observaciones || '');
    }
    if (data.esfinteres) {
      setFueSolo(data.esfinteres.fue_solo ?? null);
      setPidioIr(data.esfinteres.pidio_ir ?? null);
      setTuvoAccidente(data.esfinteres.tuvo_accidente ?? null);
      setDescripcionAccidente(data.esfinteres.descripcion_accidente || '');
      setNecesitaAyuda(data.esfinteres.necesito_ayuda ?? null);
      setNotasProgreso(data.esfinteres.notas_progreso || '');
    }
  }, [bitacoraExistente]);

  // ── Pañal: registros del día ──
  const { data: bitacoraData } = useQuery({
    queryKey: ['bitacora-data', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
    enabled: !!usaPanial,
  });

  // ── Insumos ──
  const { data: insumosData = {} } = useQuery({
    queryKey: ['insumos', alumnoId],
    queryFn: () => api.get(`/insumos/${alumnoId}`).then(r => r.data).catch(() => ({})),
    enabled: !!usaPanial,
  });
  const stockDiario = insumosData?.stock ?? null;
  const solicitudesToallitas = insumosData?.solicitudes_toallitas ?? [];

  const panialMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/panial', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora-data', alumnoId, fecha]);
      queryClient.invalidateQueries(['insumos', alumnoId]);
    },
  });

  const toallitasMutation = useMutation({
    mutationFn: () => api.post(`/insumos/${alumnoId}/solicitar-toallitas`),
    onSuccess: () => {
      queryClient.invalidateQueries(['insumos', alumnoId]);
      Alert.alert('✅', 'Solicitud enviada al papá.');
    },
    onError: () => Alert.alert('Error', 'No se pudo enviar la solicitud.'),
  });

  // ── Guardar bitácora ──
  const guardarMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/guardar', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      queryClient.invalidateQueries(['mi-grupo']);
      Alert.alert('¡Listo!', 'Bitácora guardada correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.'),
  });

  const guardar = () => {
    if (!animo) {
      Alert.alert('Falta información', 'Por favor selecciona el estado de ánimo.');
      return;
    }
    guardarMutation.mutate({
      alumno_id: alumnoId,
      fecha,
      estado_animo: animo,
      actividad_realizada: tareaRealizada,
      comportamiento,
      comportamiento_notas: comportamientoNotas,
      tuvo_fiebre: tuvoFiebre,
      temperatura_dia: temperatura ? parseFloat(temperatura) : null,
      se_enfermo: seEnfermo,
      descripcion_enfermedad: descripcionEnfermedad,
      notas,
      pipi_count: pipiCount,
      popo_count: popoCount,
      comidas: (queComio || cuantoComio || observacionesComida) ? [{
        tiempo: 'comida',
        que_comio: queComio,
        cuanto_comio: cuantoComio,
        observaciones: observacionesComida,
      }] : [],
      fue_solo: mostrarEsfinteres ? fueSolo : undefined,
      pidio_ir: mostrarEsfinteres ? pidioIr : undefined,
      tuvo_accidente: mostrarEsfinteres ? tuvoAccidente : undefined,
      descripcion_accidente: mostrarEsfinteres ? descripcionAccidente : undefined,
      necesito_ayuda: mostrarEsfinteres ? necesitaAyuda : undefined,
      notas_progreso: mostrarEsfinteres ? notasProgreso : undefined,
    });
  };

  const registrarPanial = (condicion) => {
    panialMutation.mutate({
      alumno_id: alumnoId,
      condicion,
      tiene_irritacion: false,
      es_diarrea: condicion === 'diarrea',
      notas: '',
    });
  };

  // ── Recepción de medicamento ──
  const [mostrarRecepcion, setMostrarRecepcion] = useState(false);
  const [recNombre, setRecNombre] = useState('');
  const [recDosis, setRecDosis] = useState('');
  const [recHora, setRecHora] = useState('');

  const [mostrarFormVomito, setMostrarFormVomito] = useState(false);
  const [vomitoIntensidad, setVomitoIntensidad] = useState('');
  const [vomitoNotas, setVomitoNotas] = useState('');

  const { items: INTENSIDADES_VOMITO } = useCatalogo('vomito_intensidad');

  const [salidaSanitaria, setSalidaSanitaria] = useState({ panial_limpio: false, pertenencias_ok: false, estado_fisico_ok: false, notas: '', entrega_conforme: false });
  const [salidaGuardada, setSalidaGuardada] = useState(false);

  const salidaMutation = useMutation({
    mutationFn: (data) => api.post('/asistencia/salida-sanitario', data),
    onSuccess: () => { setSalidaGuardada(true); Alert.alert('✅', 'Checklist guardado.'); },
    onError: () => Alert.alert('Error', 'No se pudo guardar el checklist'),
  });

  const vomitoMutation = useMutation({
    mutationFn: (data) => api.post('/bitacora/vomito', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      setMostrarFormVomito(false);
      setVomitoIntensidad('');
      setVomitoNotas('');
      Alert.alert('¡Listo!', 'Vómito registrado.');
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar el vómito'),
  });

  const registrarVomito = () => {
    if (!vomitoIntensidad) {
      Alert.alert('', 'Selecciona la intensidad');
      return;
    }
    vomitoMutation.mutate({
      alumno_id: alumnoId,
      bitacora_id: bitacoraExistente?.bitacora?.id ?? null,
      intensidad: vomitoIntensidad,
      notas: vomitoNotas,
    });
  };

  const recepcionMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/medicamento/recepcion', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      setMostrarRecepcion(false);
      setRecNombre('');
      setRecDosis('');
      setRecHora('');
      Alert.alert('¡Listo!', 'Recepción de medicamento registrada.');
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar la recepción.'),
  });

  const administrarRecepcionMutation = useMutation({
    mutationFn: (recepcionId) => api.patch(`/bitacora/medicamento/recepcion/${recepcionId}/administrar`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      Alert.alert('✅', 'Medicamento administrado.');
    },
    onError: () => Alert.alert('Error', 'No se pudo administrar el medicamento.'),
  });

  const guardarRecepcion = () => {
    if (!recNombre || !recDosis) {
      Alert.alert('Falta información', 'Escribe nombre y dosis.');
      return;
    }
    const body = {
      alumno_id: alumnoId,
      nombre: recNombre,
      dosis: recDosis,
    };
    if (recHora) body.hora_programada = recHora;
    recepcionMutation.mutate(body);
  };

  const abrirFormRecepcion = () => {
    const pendiente = bitacoraExistente?.recepciones_medicamento?.find(r => !r.administrado);
    if (pendiente) {
      setRecNombre(pendiente.nombre || '');
      setRecDosis(pendiente.dosis || '');
    }
    setMostrarRecepcion(true);
  };

  // ── Catálogos dinámicos ──
  const { items: animoCatalogo } = useCatalogo('animo');
  const { items: cuantoCatalogo } = useCatalogo('cuanto');
  const { items: comportamientoCatalogo } = useCatalogo('comportamiento');
  const { items: condicionesPanialCatalogo } = useCatalogo('condiciones_panial');

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#805AD5" />
      </View>
    );
  }

  const ANIMOS = animoCatalogo;
  const CUANTO = cuantoCatalogo;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>← Regresar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>{nombre}</Text>
        <Text style={s.headerSub}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Estado de ánimo */}
        <Seccion titulo="¿Cómo llegó hoy?">
          <View style={s.animoRow}>
            {ANIMOS.map(a => (
              <TouchableOpacity
                key={a.key}
                style={[s.animoBtn, animo === a.key && s.animoBtnOn]}
                onPress={() => setAnimo(a.key)}
              >
                <Text style={s.animoEmoji}>{a.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Seccion>

        {/* Baño */}
        <Seccion titulo="Baño">
          <Contador label="Pipí 🚿" value={pipiCount} onChange={setPipiCount} />
          <Contador label="Popó 💩" value={popoCount} onChange={setPopoCount} />
        </Seccion>

        {/* Pañal (solo Maternal) */}
        {usaPanial && (
          <Seccion titulo="Cambios de pañal">
            {stockDiario && (
              <View style={{ backgroundColor: '#F3F0FF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 2, borderColor: '#D8B4FE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#7C3AED', textTransform: 'uppercase' }}>Pañales hoy</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: stockDiario.cantidad >= 3 ? '#059669' : stockDiario.cantidad >= 1 ? '#D97706' : '#DC2626' }}>
                  {stockDiario.cantidad} {stockDiario.cantidad === 1 ? 'pañal' : 'pañales'}
                </Text>
              </View>
            )}
            {stockDiario?.no_registrado && (
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 8 }}>Sin registro de entrada aún</Text>
            )}
            {solicitudesToallitas.length > 0 && (
              <View style={{ backgroundColor: '#FEFCE8', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FDE047' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#A16207' }}>🧻 Solicitud de toallitas enviada al papá</Text>
              </View>
            )}
            <Text style={s.panialSub}>Registros de hoy:</Text>
            {(bitacoraData?.panial || []).map((p, i) => (
              <View key={i} style={s.panialLog}>
                <Text style={s.panialLogTxt}>
                  {new Date(p.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} — {p.condicion}
                  {p.tiene_irritacion ? ' ⚠️ irritación' : ''}
                </Text>
              </View>
            ))}
            <Text style={s.panialSub2}>Registrar nuevo cambio:</Text>
            <View style={s.panialBtns}>
              {condicionesPanialCatalogo.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={s.panialBtn}
                  onPress={() => registrarPanial(c.key)}
                  disabled={panialMutation.isPending}
                >
                  <Text style={s.panialBtnTxt}>{c.key.charAt(0).toUpperCase() + c.key.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {solicitudesToallitas.length === 0 && (
              <TouchableOpacity
                onPress={() => toallitasMutation.mutate()}
                disabled={toallitasMutation.isPending}
                style={{ marginTop: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FBBF24', borderRadius: RADIUS.md, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>🧻 Solicitar toallitas húmedas</Text>
              </TouchableOpacity>
            )}
          </Seccion>
        )}

        {/* Control de esfínteres */}
        {mostrarEsfinteres && (
          <Seccion titulo="Control de esfínteres">
            <BoolBtn label="¿Fue solo/a al baño?" value={fueSolo} onChange={setFueSolo} />
            <BoolBtn label="¿Pidió ir?" value={pidioIr} onChange={setPidioIr} />
            <BoolBtn label="¿Tuvo accidente?" value={tuvoAccidente} onChange={setTuvoAccidente} />
            {tuvoAccidente && (
              <TextInput
                style={s.input}
                placeholder="Describe el accidente…"
                value={descripcionAccidente}
                onChangeText={setDescripcionAccidente}
                multiline
              />
            )}
            <BoolBtn label="¿Necesitó ayuda?" value={necesitaAyuda} onChange={setNecesitaAyuda} />
            <TextInput
              style={s.input}
              placeholder="Notas de progreso (opcional)…"
              value={notasProgreso}
              onChangeText={setNotasProgreso}
              multiline
            />
          </Seccion>
        )}

        {/* Alimentación */}
        <Seccion titulo="Alimentación">
          <TextInput
            style={s.input}
            placeholder="¿Qué comió?"
            value={queComio}
            onChangeText={setQueComio}
            multiline
          />
          <Text style={s.subLabel}>¿Cuánto comió?</Text>
          <View style={s.cuantoRow}>
            {CUANTO.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.cuantoBtn, cuantoComio === c.key && s.cuantoBtnOn]}
                onPress={() => setCuantoComio(c.key)}
              >
                <Text style={s.cuantoEmoji}>{c.emoji}</Text>
                <Text style={[s.cuantoLabel, cuantoComio === c.key && s.cuantoLabelOn]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={s.input}
            placeholder="Observaciones de comida (opcional)…"
            value={observacionesComida}
            onChangeText={setObservacionesComida}
            multiline
          />
        </Seccion>

        {/* Comida Extra (si hay extensión) */}
        {tuvExtensionEnFecha && (
          <Seccion titulo="🍜 Comida Extra">
            <Text style={s.extensionSubText}>El alumno tiene extensión de horario activa</Text>
            <TextInput
              style={s.input}
              placeholder="¿Qué comió en comida extra?"
              value={queComio}
              onChangeText={setQueComio}
              multiline
            />
            <Text style={s.subLabel}>¿Cuánto comió?</Text>
            <View style={s.cuantoRow}>
              {CUANTO.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[s.cuantoBtn, cuantoComio === c.key && s.cuantoBtnOn]}
                  onPress={() => setCuantoComio(c.key)}
                >
                  <Text style={s.cuantoEmoji}>{c.emoji}</Text>
                  <Text style={[s.cuantoLabel, cuantoComio === c.key && s.cuantoLabelOn]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.input}
              placeholder="Observaciones de comida extra (opcional)…"
              value={observacionesComida}
              onChangeText={setObservacionesComida}
              multiline
            />
          </Seccion>
        )}

        {/* Tarea */}
        <Seccion titulo="Tarea">
          <View style={s.siNoRow}>
            <TouchableOpacity
              style={[s.siNoBtn, tareaRealizada === true && s.siNoBtnSiOn]}
              onPress={() => setTareaRealizada(tareaRealizada === true ? null : true)}
            >
              <Text style={[s.siNoTxt, tareaRealizada === true && s.siNoTxtOn]}>✓ Sí realizó</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.siNoBtn, tareaRealizada === false && s.siNoBtnNoOn]}
              onPress={() => setTareaRealizada(tareaRealizada === false ? null : false)}
            >
              <Text style={[s.siNoTxt, tareaRealizada === false && s.siNoTxtOn]}>✗ No realizó</Text>
            </TouchableOpacity>
          </View>
        </Seccion>

        {/* Comportamiento */}
        <Seccion titulo="Comportamiento">
          <View style={s.compRow}>
            {comportamientoCatalogo.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.compBtn, comportamiento === c.key && s.compBtnOn]}
                onPress={() => setComportamiento(c.key)}
              >
                <Text style={s.compEmoji}>{c.emoji}</Text>
                <Text style={[s.compLabel, comportamiento === c.key && s.compLabelOn]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {comportamiento === 'necesita_mejorar' && (
            <TextInput
              style={s.input}
              placeholder="¿Qué pasó? Describe brevemente…"
              value={comportamientoNotas}
              onChangeText={setComportamientoNotas}
              multiline
            />
          )}
        </Seccion>

        {/* Salud */}
        <Seccion titulo="Salud">
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>¿Tuvo fiebre?</Text>
            <Switch
              value={tuvoFiebre}
              onValueChange={setTuvoFiebre}
              trackColor={{ true: '#FC8181' }}
              thumbColor={tuvoFiebre ? '#E53E3E' : '#CBD5E0'}
            />
          </View>
          {tuvoFiebre && (
            <TextInput
              style={s.input}
              placeholder="Temperatura (ej. 38.5)"
              value={temperatura}
              onChangeText={setTemperatura}
              keyboardType="decimal-pad"
            />
          )}
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>¿Se enfermó / malestar?</Text>
            <Switch
              value={seEnfermo}
              onValueChange={setSeEnfermo}
              trackColor={{ true: '#FC8181' }}
              thumbColor={seEnfermo ? '#E53E3E' : '#CBD5E0'}
            />
          </View>
          {seEnfermo && (
            <TextInput
              style={s.input}
              placeholder="Describe el malestar…"
              value={descripcionEnfermedad}
              onChangeText={setDescripcionEnfermedad}
              multiline
            />
          )}

          {bitacoraExistente?.panial?.some(p => p.es_diarrea) && (
            <View style={{ backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginTop: 12, borderLeftWidth: 4, borderLeftColor: '#dc2626' }}>
              <Text style={{ color: '#991b1b', fontWeight: '600', fontSize: 13 }}>⚠️ Deposición anormal registrada hoy</Text>
            </View>
          )}

          {/* Vómitos */}
          {bitacoraExistente?.vomitos?.length > 0 && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#FED7AA' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#C2410C', marginBottom: 8, textTransform: 'uppercase' }}>🤢 Episodios de vómito</Text>
              {bitacoraExistente.vomitos.map((v, i) => (
                <View key={i} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF7ED', borderRadius: RADIUS.md, marginBottom: 6, borderWidth: 1, borderColor: '#FED7AA' }}>
                  <Text style={{ fontWeight: '900', color: '#9A3412', fontSize: 13 }}>Intensidad: {v.intensidad}</Text>
                  <Text style={{ fontSize: 12, color: '#C2410C', marginTop: 2 }}>{v.hora?.substring(0, 5)}</Text>
                  {v.notas ? <Text style={{ fontSize: 12, color: '#EA580C', marginTop: 4 }}>{v.notas}</Text> : null}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => setMostrarFormVomito(!mostrarFormVomito)}
            style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: mostrarFormVomito ? '#FEE2E2' : '#FEF3C7', borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA' }}
          >
            <Text style={{ color: '#B45309', fontSize: 14, fontWeight: '700' }}>
              🤢 {mostrarFormVomito ? 'Cancelar' : '+ Registrar vómito'}
            </Text>
          </TouchableOpacity>

          {mostrarFormVomito && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FED7AA' }}>
              <Text style={s.subLabel}>Intensidad</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {INTENSIDADES_VOMITO.map((int) => (
                  <TouchableOpacity
                    key={int.key}
                    onPress={() => setVomitoIntensidad(int.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      backgroundColor: vomitoIntensidad === int.key ? '#EA580C' : '#FFF7ED',
                      borderWidth: 1,
                      borderColor: vomitoIntensidad === int.key ? '#EA580C' : '#FED7AA',
                    }}
                  >
                    <Text style={{ color: vomitoIntensidad === int.key ? '#fff' : '#C2410C', fontWeight: '700', fontSize: 13 }}>
                      {int.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={s.input}
                placeholder="Notas (opcional)"
                value={vomitoNotas}
                onChangeText={setVomitoNotas}
                multiline
              />
              <TouchableOpacity
                onPress={registrarVomito}
                disabled={vomitoMutation.isPending}
                style={{ marginTop: 8, paddingVertical: 12, backgroundColor: '#F59E0B', borderRadius: RADIUS.md, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>💾 Guardar</Text>
              </TouchableOpacity>
            </View>
          )}
        </Seccion>

        {/* Medicamentos */}
        <Seccion titulo={`Medicamentos${bitacoraExistente?.recepciones_medicamento?.some(r => !r.administrado) ? ' ●' : ''}`}>
          {bitacoraExistente?.recepciones_medicamento?.length > 0 && bitacoraExistente.recepciones_medicamento.some(r => !r.administrado) && (
            <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#FED7AA' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#B45309', marginBottom: 8, textTransform: 'uppercase' }}>⏳ Pendientes</Text>
              {bitacoraExistente.recepciones_medicamento.filter(r => !r.administrado).map((rec, i) => (
                <View key={i} style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
                  <Text style={{ fontWeight: '900', color: '#92400E', marginBottom: 2 }}>{rec.nombre} — {rec.dosis}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#B45309' }}>
                      {rec.tomas?.length > 0 ? rec.tomas.map(t => t.hora_programada.substring(0, 5)).join(', ') : 'Sin hora'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => administrarRecepcionMutation.mutate(rec.id)}
                      disabled={administrarRecepcionMutation.isPending}
                      style={{ backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Administrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {bitacoraExistente?.medicamentos?.length > 0 && (
            <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#BFDBFE' }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#1E40AF', marginBottom: 8, textTransform: 'uppercase' }}>✅ Administrados</Text>
              {bitacoraExistente.medicamentos.map((m, i) => (
                <View key={i} style={{ backgroundColor: '#DBEAFE', padding: 10, borderRadius: 8, marginBottom: 6, borderLeftWidth: 4, borderLeftColor: '#3B82F6' }}>
                  <Text style={{ fontWeight: '700', color: '#1E40AF' }}>{m.nombre} — {m.dosis}</Text>
                  <Text style={{ fontSize: 11, color: '#1E3A8A', marginTop: 2 }}>
                    {new Date(m.hora_administracion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={abrirFormRecepcion}
              disabled={recepcionMutation.isPending}
              style={{ flex: 1, backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>+ Nueva recepción</Text>
            </TouchableOpacity>
          </View>

          {mostrarRecepcion && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FED7AA' }}>
              <TextInput
                style={s.input}
                placeholder="Nombre del medicamento *"
                value={recNombre}
                onChangeText={setRecNombre}
              />
              <TextInput
                style={s.input}
                placeholder="Dosis (ej. 5ml, 1 tableta) *"
                value={recDosis}
                onChangeText={setRecDosis}
              />
              <TextInput
                style={s.input}
                placeholder="Hora (opcional)"
                value={recHora}
                onChangeText={setRecHora}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={guardarRecepcion}
                  disabled={recepcionMutation.isPending}
                  style={{ flex: 1, backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>💾 Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMostrarRecepcion(false)}
                  disabled={recepcionMutation.isPending}
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: '#E5E7EB', alignItems: 'center' }}
                >
                  <Text style={{ color: '#374151', fontSize: 14, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Seccion>

        {/* Salida Sanitaria */}
        <Seccion titulo="Salida Sanitaria">
          {salidaGuardada && (
            <Text style={{ color: '#166534', backgroundColor: '#dcfce7', padding: 8, borderRadius: 8, marginBottom: 8, fontWeight: '600', fontSize: 12 }}>✅ Checklist guardado</Text>
          )}
          {[
            { key: 'panial_limpio', label: '🧷 Pañal limpio al salir', mostrar: usaPanial },
            { key: 'pertenencias_ok', label: '🎒 Pertenencias completas', mostrar: true },
            { key: 'estado_fisico_ok', label: '💚 Estado físico normal', mostrar: true },
            { key: 'entrega_conforme', label: '✅ Entrega conforme', mostrar: true },
          ].filter(item => item.mostrar).map(({ key, label }) => (
            <View key={key} style={s.switchRow}>
              <Text style={s.switchLabel}>{label}</Text>
              <Switch
                value={salidaSanitaria[key]}
                onValueChange={(v) => setSalidaSanitaria(prev => ({ ...prev, [key]: v }))}
                trackColor={{ true: '#38A169' }}
                thumbColor={salidaSanitaria[key] ? '#22C55E' : '#CBD5E0'}
              />
            </View>
          ))}
          <TextInput
            style={s.input}
            placeholder="Observaciones…"
            value={salidaSanitaria.notas}
            onChangeText={(v) => setSalidaSanitaria(prev => ({ ...prev, notas: v }))}
            multiline
          />
          <TouchableOpacity
            onPress={() => salidaMutation.mutate({ alumno_id: alumnoId, ...salidaSanitaria })}
            disabled={salidaMutation.isPending}
            style={{ marginTop: 8, paddingVertical: 12, backgroundColor: '#22C55E', borderRadius: RADIUS.md, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>💾 Guardar checklist</Text>
          </TouchableOpacity>
        </Seccion>

        {/* Notas generales */}
        <Seccion titulo="Notas generales">
          <TextInput
            style={[s.input, { minHeight: 80 }]}
            placeholder="Notas adicionales para los papás…"
            value={notas}
            onChangeText={setNotas}
            multiline
            textAlignVertical="top"
          />
        </Seccion>

      </ScrollView>

      {/* Botón guardar fijo */}
      <View style={s.footerBtn}>
        <TouchableOpacity
          style={[s.guardarBtn, guardarMutation.isPending && { opacity: 0.6 }]}
          onPress={guardar}
          disabled={guardarMutation.isPending}
        >
          {guardarMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.guardarTxt}>💾 Guardar bitácora</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Pantalla raíz ───────────────────────────────────────────────────────────

export default function BitacoraScreen() {
  const params = useLocalSearchParams();
  const { alumnoId, nombre, usaPanial, nivelCodigo } = params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {alumnoId ? (
        <FormularioBitacora
          alumnoId={alumnoId}
          nombre={decodeURIComponent(nombre || '')}
          usaPanial={usaPanial === 'true'}
          nivelCodigo={decodeURIComponent(nivelCodigo || '')}
        />
      ) : (
        <SelectorAlumno />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { marginTop: 12, color: '#718096', fontSize: 14, fontWeight: '600' },

  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: COLORS.white },
  headerTitulo: { fontSize: 20, fontWeight: '900', color: '#2D3748' },
  headerSub: { fontSize: 13, color: '#718096', marginTop: 2 },
  backBtn: { marginBottom: 4 },
  backTxt: { color: '#805AD5', fontSize: 14, fontWeight: '700' },

  // Selector alumno
  alumnoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, marginTop: 12, backgroundColor: '#F7FAFC', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  alumnoNombre: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
  alumnoSub: { fontSize: 12, color: '#718096', marginTop: 2 },
  badgeVerde: { backgroundColor: '#C6F6D5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.xl },
  badgeGris: { backgroundColor: '#EDF2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.xl },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: '#2D3748' },
  emptyTxt: { textAlign: 'center', color: '#A0AEC0', marginTop: 48, fontSize: 14 },

  // Sección
  seccion: { marginTop: 20, marginHorizontal: 16, backgroundColor: '#F7FAFC', borderRadius: RADIUS.md, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  seccionTitulo: { fontSize: 14, fontWeight: '900', color: '#805AD5', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  extensionSubText: { fontSize: 12, fontWeight: '600', color: '#7C3AED', marginBottom: 12, fontStyle: 'italic' },

  // Ánimo
  animoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  animoBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF2F7' },
  animoBtnOn: { backgroundColor: '#B794F4', transform: [{ scale: 1.15 }] },
  animoEmoji: { fontSize: 26 },

  // Contador
  contadorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4 },
  contadorLabel: { fontSize: 15, color: '#4A5568', fontWeight: '600' },
  contadorBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contadorBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#805AD5', alignItems: 'center', justifyContent: 'center' },
  contadorBtnTxt: { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 24 },
  contadorVal: { fontSize: 20, fontWeight: '900', color: '#2D3748', minWidth: 28, textAlign: 'center' },

  // Bool btn
  boolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  boolLabel: { fontSize: 14, color: '#4A5568', fontWeight: '600', flex: 1, marginRight: 8 },
  boolBtns: { flexDirection: 'row', gap: 8 },
  boolBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.xl, backgroundColor: '#EDF2F7' },
  boolBtnSiOn: { backgroundColor: '#38A169' },
  boolBtnNoOn: { backgroundColor: '#E53E3E' },
  boolBtnTxt: { fontSize: 13, fontWeight: '700', color: '#4A5568' },
  boolBtnTxtOn: { color: '#fff' },

  // Pañal
  panialSub: { fontSize: 12, color: '#718096', fontWeight: '600', marginBottom: 6 },
  panialSub2: { fontSize: 12, color: '#718096', fontWeight: '600', marginTop: 12, marginBottom: 8 },
  panialLog: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#EDF2F7', borderRadius: 6, marginBottom: 4 },
  panialLogTxt: { fontSize: 13, color: '#4A5568' },
  panialBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panialBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#805AD5', borderRadius: RADIUS.xl },
  panialBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Alimentación
  subLabel: { fontSize: 13, color: '#718096', fontWeight: '600', marginBottom: 8, marginTop: 4 },
  cuantoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cuantoBtn: { flex: 1, alignItems: 'center', marginHorizontal: 3, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: '#EDF2F7' },
  cuantoBtnOn: { backgroundColor: '#B794F4' },
  cuantoEmoji: { fontSize: 22 },
  cuantoLabel: { fontSize: 10, fontWeight: '700', color: '#718096', marginTop: 4 },
  cuantoLabelOn: { color: '#44337A' },

  // Tarea
  siNoRow: { flexDirection: 'row', gap: 12 },
  siNoBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: '#EDF2F7', alignItems: 'center' },
  siNoBtnSiOn: { backgroundColor: '#38A169' },
  siNoBtnNoOn: { backgroundColor: '#E53E3E' },
  siNoTxt: { fontSize: 14, fontWeight: '700', color: '#4A5568' },
  siNoTxtOn: { color: '#fff' },

  // Comportamiento
  compRow: { flexDirection: 'row', justifyContent: 'space-around' },
  compBtn: { flex: 1, alignItems: 'center', marginHorizontal: 4, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: '#EDF2F7' },
  compBtnOn: { backgroundColor: '#B794F4' },
  compEmoji: { fontSize: 24 },
  compLabel: { fontSize: 11, fontWeight: '700', color: '#718096', marginTop: 4 },
  compLabelOn: { color: '#44337A' },

  // Salud
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontSize: 14, color: '#4A5568', fontWeight: '600' },

  // Input
  input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: '#2D3748', marginTop: 8 },

  // Footer
  footerBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  guardarBtn: { backgroundColor: '#805AD5', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  guardarTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});

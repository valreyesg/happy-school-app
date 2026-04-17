import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';

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
            onPress={() => router.push(`/(maestra)/bitacora?alumnoId=${alumno.id}&nombre=${encodeURIComponent(alumno.nombre_completo)}&usaPanial=${alumno.usa_panial}&grupo=${encodeURIComponent(alumno.grupo_nombre || '')}`)}
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

function FormularioBitacora({ alumnoId, nombre, usaPanial, grupoNombre }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fecha = new Date().toISOString().split('T')[0];

  const grupoLower = (grupoNombre || '').toLowerCase();
  const mostrarEsfinteres = !usaPanial && (
    grupoLower.includes('maternal') ||
    grupoLower.includes('prekinder') ||
    grupoLower.includes('kinder 1') ||
    grupoLower.includes('kinder1')
  );

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
  const { isLoading } = useQuery({
    queryKey: ['bitacora', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
    onSuccess: data => {
      if (data.bitacora) {
        setAnimo(data.bitacora.estado_animo || null);
        setTareaRealizada(data.bitacora.tarea_realizada ?? null);
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
    },
  });

  // ── Pañal: registros del día ──
  const { data: bitacoraData } = useQuery({
    queryKey: ['bitacora-data', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
    enabled: !!usaPanial,
  });

  const panialMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/panial', body),
    onSuccess: () => queryClient.invalidateQueries(['bitacora-data', alumnoId, fecha]),
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
      tarea_realizada: tareaRealizada,
      comportamiento,
      comportamiento_notas: comportamientoNotas,
      tuvo_fiebre: tuvoFiebre,
      temperatura_dia: temperatura ? parseFloat(temperatura) : null,
      se_enfermo: seEnfermo,
      descripcion_enfermedad: descripcionEnfermedad,
      notas,
      pipi_count: pipiCount,
      popo_count: popoCount,
      que_comio: queComio,
      cuanto_comio: cuantoComio,
      observaciones_comida: observacionesComida,
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
      notas: '',
    });
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#805AD5" />
      </View>
    );
  }

  const ANIMOS = [
    { key: 'feliz', emoji: '😊' },
    { key: 'activo', emoji: '⚡' },
    { key: 'cansado', emoji: '😴' },
    { key: 'triste', emoji: '😢' },
    { key: 'irritable', emoji: '😤' },
  ];

  const CUANTO = [
    { key: 'todo', emoji: '🍽️', label: 'Todo' },
    { key: 'casi_todo', emoji: '🥢', label: 'Casi todo' },
    { key: 'poco', emoji: '🍱', label: 'Poco' },
    { key: 'no_comio', emoji: '✅', label: 'No comió' },
  ];

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
              {['limpio', 'orina', 'heces', 'mixto'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={s.panialBtn}
                  onPress={() => registrarPanial(c)}
                  disabled={panialMutation.isPending}
                >
                  <Text style={s.panialBtnTxt}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
            {[
              { key: 'excelente', icon: '⭐', label: 'Excelente' },
              { key: 'bueno', icon: '👍', label: 'Bueno' },
              { key: 'necesita_mejorar', icon: '⚠️', label: 'A mejorar' },
            ].map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.compBtn, comportamiento === c.key && s.compBtnOn]}
                onPress={() => setComportamiento(c.key)}
              >
                <Text style={s.compEmoji}>{c.icon}</Text>
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
  const { alumnoId, nombre, usaPanial, grupo } = params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {alumnoId ? (
        <FormularioBitacora
          alumnoId={alumnoId}
          nombre={decodeURIComponent(nombre || '')}
          usaPanial={usaPanial === 'true'}
          grupoNombre={decodeURIComponent(grupo || '')}
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

  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#fff' },
  headerTitulo: { fontSize: 20, fontWeight: '900', color: '#2D3748' },
  headerSub: { fontSize: 13, color: '#718096', marginTop: 2 },
  backBtn: { marginBottom: 4 },
  backTxt: { color: '#805AD5', fontSize: 14, fontWeight: '700' },

  // Selector alumno
  alumnoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, marginTop: 12, backgroundColor: '#F7FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  alumnoNombre: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
  alumnoSub: { fontSize: 12, color: '#718096', marginTop: 2 },
  badgeVerde: { backgroundColor: '#C6F6D5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGris: { backgroundColor: '#EDF2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: '#2D3748' },
  emptyTxt: { textAlign: 'center', color: '#A0AEC0', marginTop: 48, fontSize: 14 },

  // Sección
  seccion: { marginTop: 20, marginHorizontal: 16, backgroundColor: '#F7FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  seccionTitulo: { fontSize: 14, fontWeight: '900', color: '#805AD5', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

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
  boolBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EDF2F7' },
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
  panialBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#805AD5', borderRadius: 20 },
  panialBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Alimentación
  subLabel: { fontSize: 13, color: '#718096', fontWeight: '600', marginBottom: 8, marginTop: 4 },
  cuantoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cuantoBtn: { flex: 1, alignItems: 'center', marginHorizontal: 3, paddingVertical: 8, borderRadius: 10, backgroundColor: '#EDF2F7' },
  cuantoBtnOn: { backgroundColor: '#B794F4' },
  cuantoEmoji: { fontSize: 22 },
  cuantoLabel: { fontSize: 10, fontWeight: '700', color: '#718096', marginTop: 4 },
  cuantoLabelOn: { color: '#44337A' },

  // Tarea
  siNoRow: { flexDirection: 'row', gap: 12 },
  siNoBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EDF2F7', alignItems: 'center' },
  siNoBtnSiOn: { backgroundColor: '#38A169' },
  siNoBtnNoOn: { backgroundColor: '#E53E3E' },
  siNoTxt: { fontSize: 14, fontWeight: '700', color: '#4A5568' },
  siNoTxtOn: { color: '#fff' },

  // Comportamiento
  compRow: { flexDirection: 'row', justifyContent: 'space-around' },
  compBtn: { flex: 1, alignItems: 'center', marginHorizontal: 4, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EDF2F7' },
  compBtnOn: { backgroundColor: '#B794F4' },
  compEmoji: { fontSize: 24 },
  compLabel: { fontSize: 11, fontWeight: '700', color: '#718096', marginTop: 4 },
  compLabelOn: { color: '#44337A' },

  // Salud
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontSize: 14, color: '#4A5568', fontWeight: '600' },

  // Input
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#2D3748', marginTop: 8 },

  // Footer
  footerBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  guardarBtn: { backgroundColor: '#805AD5', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  guardarTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});

import { useState, useCallback, useEffect } from 'react';
import { COLORS, RADIUS } from '@/constants/theme';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  StyleSheet, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useCatalogo } from '@/hooks/useCatalogo';
import { Ionicons } from '@expo/vector-icons';
import SelectorFecha from '@/components/SelectorFecha';
import { ultimoDiaHabil } from '@/utils/fecha';

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
  const [fecha, setFecha] = useState(ultimoDiaHabil);

  const { data, isLoading } = useQuery({
    queryKey: ['mi-grupo-bitacora', fecha],
    queryFn: () => api.get(`/grupos/mi-grupo?fecha=${fecha}`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#805AD5" />
        <Text style={s.loadingTxt}>Cargando grupo…</Text>
      </View>
    );
  }

  const todosAlumnos = data?.alumnos || [];
  // Solo mostrar alumnos que llegaron hoy (presente o retardo)
  const alumnos = todosAlumnos.filter(a =>
    ['presente', 'retardo'].includes(a.estado_asistencia)
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={s.header}>
        <Text style={s.headerTitulo}>Bitácora</Text>
        <Text style={s.headerSub}>Selecciona fecha y alumno</Text>
      </View>
      <SelectorFecha fecha={fecha} onChange={setFecha} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {alumnos.map(alumno => (
          <TouchableOpacity
            key={alumno.id}
            style={s.alumnoCard}
            onPress={() => router.push(`/(maestra)/bitacora?alumnoId=${alumno.id}&nombre=${encodeURIComponent(alumno.nombre_completo)}&usaPanial=${alumno.usa_panial}&nivelCodigo=${encodeURIComponent(alumno.nivel_codigo || '')}&fecha=${fecha}&grupoId=${data?.id || ''}`)}
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
        {todosAlumnos.length === 0 && (
          <Text style={s.emptyTxt}>No tienes alumnos asignados.</Text>
        )}
        {todosAlumnos.length > 0 && alumnos.length === 0 && (
          <Text style={s.emptyTxt}>Ningún alumno tiene asistencia registrada para esta fecha.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Formulario de bitácora ──────────────────────────────────────────────────

function FormularioBitacora({ alumnoId, nombre, usaPanial, nivelCodigo, fecha, grupoId }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mostrarEsfinteres = !usaPanial && ['maternal', 'prekinder', 'kinder1'].includes(nivelCodigo);

  // ── Estado del formulario ──
  const [animo, setAnimo] = useState(null);
  const [pipiCount, setPipiCount] = useState(0);
  const [popoCount, setPopoCount] = useState(0);
  // Comidas por 4 tiempos
  const [comidas, setComidas] = useState({
    desayuno:    { que_comio: '', cuanto_comio: null, observaciones: '' },
    colacion:    { que_comio: '', cuanto_comio: null, observaciones: '' },
    comida:      { que_comio: '', cuanto_comio: null, observaciones: '' },
    comida_extra: { que_comio: '', cuanto_comio: null, observaciones: '' },
  });
  const [tiempoActivo, setTiempoActivo] = useState('desayuno');
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
  const [fotoDia, setFotoDia] = useState(null); // { uri, fileName }
  const [fotoDiaUrl, setFotoDiaUrl] = useState(null); // existing URL
  // Incidentes
  const [mostrarFormIncidente, setMostrarFormIncidente] = useState(false);
  const [incDesc, setIncDesc] = useState('');
  const [incAcciones, setIncAcciones] = useState('');

  // ── Lunes de la semana actual (para menú y confirmación) ──
  const semanaLunes = (() => {
    const d = new Date(fecha + 'T12:00:00');
    const dia = d.getDay(); // 0=dom,1=lun,...,6=sab
    const diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-CA');
  })();

  // ── Cargar datos existentes ──
  const { isLoading, data: bitacoraExistente } = useQuery({
    queryKey: ['bitacora', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
  });

  // ── Menú de la semana ──
  const { data: menuSemana } = useQuery({
    queryKey: ['menu-semana', semanaLunes],
    queryFn: () => api.get(`/comida/menu?semana=${semanaLunes}`).then(r => r.data).catch(() => null),
    enabled: !!semanaLunes,
    staleTime: 300000,
  });

  // ── Confirmación de comida del alumno esta semana ──
  const { data: confirmacionComida } = useQuery({
    queryKey: ['confirmacion-comida', alumnoId, semanaLunes],
    queryFn: () => api.get(`/comida/confirmacion/${alumnoId}?semana=${semanaLunes}`).then(r => r.data).catch(() => null),
    enabled: !!alumnoId && !!semanaLunes,
    staleTime: 300000,
  });

  const [menuPrecargado, setMenuPrecargado] = useState(false);

  const { data: historialExt = [] } = useQuery({
    queryKey: ['historial-servicios', alumnoId],
    queryFn: () => api.get(`/alumnos/${alumnoId}/historial-servicios`).then(r => r.data),
    enabled: !!alumnoId,
    staleTime: 60000,
  });

  // Actividades del grupo: vienen incluidas en bitacoraExistente.actividades (igual que web)
  // grupoId queda disponible para futuras necesidades pero no se usa para esta query
  const actividadesGrupo = bitacoraExistente?.actividades || [];

  // Participación del alumno en actividades (cargada desde bitacora existente)
  const [actividadesParticipacion, setActividadesParticipacion] = useState({});

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
      setFotoDiaUrl(data.bitacora.foto_url || null);
    }
    if (data.banio) {
      setPipiCount(data.banio.pipi_count || 0);
      setPopoCount(data.banio.popo_count || 0);
    }
    if (data.comida && Array.isArray(data.comida)) {
      const nuevasComidas = {
        desayuno:    { que_comio: '', cuanto_comio: null, observaciones: '' },
        colacion:    { que_comio: '', cuanto_comio: null, observaciones: '' },
        comida:      { que_comio: '', cuanto_comio: null, observaciones: '' },
        comida_extra: { que_comio: '', cuanto_comio: null, observaciones: '' },
      };
      data.comida.forEach(c => {
        if (c.tiempo && nuevasComidas[c.tiempo] !== undefined) {
          nuevasComidas[c.tiempo] = {
            que_comio: c.que_comio || '',
            cuanto_comio: c.cuanto_comio || null,
            observaciones: c.observaciones || '',
          };
        }
      });

      // Precargar menú si: alumno tiene comida confirmada, hay menú publicado y el campo está vacío
      const tieneComidaConfirmada = confirmacionComida?.confirmado === true;
      const menuDiasPorTiempo = menuSemana?.dias_menu;
      if (tieneComidaConfirmada && menuDiasPorTiempo) {
        const DIAS_KEY = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
        const diaSemana = DIAS_KEY[new Date(fecha + 'T12:00:00').getDay()];
        const menuDia = menuDiasPorTiempo[diaSemana];
        if (menuDia) {
          ['desayuno','colacion','comida'].forEach(tiempo => {
            const niveles = menuDia?.[tiempo]?.niveles || [];
            const aplica = niveles.includes('todos') || niveles.includes((nivelCodigo || '').toLowerCase());
            if (!nuevasComidas[tiempo].que_comio && aplica && menuDia[tiempo]?.platillo) {
              nuevasComidas[tiempo].que_comio = menuDia[tiempo].platillo;
            }
          });
          setMenuPrecargado(true);
        } else {
          setMenuPrecargado(false);
        }
      } else {
        setMenuPrecargado(false);
      }

      setComidas(nuevasComidas);
    }
    if (data.esfinteres) {
      setFueSolo(data.esfinteres.fue_solo ?? null);
      setPidioIr(data.esfinteres.pidio_ir ?? null);
      setTuvoAccidente(data.esfinteres.tuvo_accidente ?? null);
      setDescripcionAccidente(data.esfinteres.descripcion_accidente || '');
      setNecesitaAyuda(data.esfinteres.necesito_ayuda ?? null);
      setNotasProgreso(data.esfinteres.notas_progreso || '');
    }
    if (data.actividades && Array.isArray(data.actividades)) {
      const participacion = {};
      data.actividades.forEach(act => {
        if (act.participo !== null && act.participo !== undefined) {
          participacion[act.id] = act.participo;
        }
      });
      setActividadesParticipacion(participacion);
    }
  }, [bitacoraExistente, menuSemana, confirmacionComida]);

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
    mutationFn: async (body) => {
      const res = await api.post('/bitacora/guardar', body).then(r => r.data);
      // Si hay foto nueva, subirla
      if (fotoDia && res.bitacora_id) {
        const fd = new FormData();
        fd.append('foto', {
          uri: fotoDia.uri,
          name: fotoDia.fileName || 'foto.jpg',
          type: 'image/jpeg',
        });
        await api.post(`/bitacora/${res.bitacora_id}/foto`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      queryClient.invalidateQueries(['mi-grupo']);
      setFotoDia(null);
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
      comidas: Object.entries(comidas).map(([tiempo, d]) => ({ tiempo, ...d })),
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
  // ── Incidente mutation ──
  const incidenteMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/incidente', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      setMostrarFormIncidente(false);
      setIncDesc('');
      setIncAcciones('');
      Alert.alert('¡Listo!', 'Incidente registrado.');
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar el incidente.'),
  });

  const registrarIncidente = () => {
    if (!incDesc.trim()) {
      Alert.alert('', 'Describe el incidente.');
      return;
    }
    incidenteMutation.mutate({ alumno_id: alumnoId, descripcion: incDesc, acciones_tomadas: incAcciones });
  };

  // ── Fotos por actividad ──
  const [uploadingActId, setUploadingActId] = useState(null);

  const subirFotoActividad = (actividadGrupoId) => {
    Alert.alert('Agregar foto', 'Selecciona origen', [
      {
        text: 'Cámara', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!result.canceled && result.assets[0]) {
            await _uploadFotoActividad(actividadGrupoId, result.assets[0]);
          }
        }
      },
      {
        text: 'Galería', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsMultipleSelection: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            for (const asset of result.assets) {
              await _uploadFotoActividad(actividadGrupoId, asset);
            }
          }
        }
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const _uploadFotoActividad = async (actividadGrupoId, asset) => {
    setUploadingActId(actividadGrupoId);
    try {
      const fd = new FormData();
      fd.append('alumno_id', alumnoId);
      fd.append('grupo_id', grupoId);
      fd.append('fecha', fecha);
      fd.append('fotos', {
        uri: asset.uri,
        name: asset.fileName || `foto_act_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      await api.post(`/bitacora/actividades/${actividadGrupoId}/fotos-alumno`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto.');
    } finally {
      setUploadingActId(null);
    }
  };

  const eliminarFotoActividad = (fotoId) => {
    Alert.alert('Eliminar foto', '¿Segura que quieres eliminar esta foto?', [
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/bitacora/actividades/fotos/${fotoId}`);
            queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la foto.');
          }
        }
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // ── Participación actividades mutation ──
  const participacionMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/actividades-alumno', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      Alert.alert('✅', 'Participación guardada.');
    },
    onError: () => Alert.alert('Error', 'No se pudo guardar la participación.'),
  });

  const guardarParticipacion = () => {
    const actividadesConParticipacion = Object.entries(actividadesParticipacion)
      .map(([id, participo]) => ({ actividad_grupo_id: parseInt(id), participo }));
    if (actividadesConParticipacion.length === 0) {
      Alert.alert('', 'Selecciona al menos una actividad.');
      return;
    }
    participacionMutation.mutate({
      alumno_id: alumnoId,
      bitacora_id: bitacoraExistente?.bitacora?.id ?? null,
      actividades: actividadesConParticipacion,
    });
  };

  const [mostrarRecepcion, setMostrarRecepcion] = useState(false);
  const [recNombre, setRecNombre] = useState('');
  const [recDosis, setRecDosis] = useState('');
  const [recHora, setRecHora] = useState('');
  const [recFotoReceta, setRecFotoReceta] = useState(null); // { uri, base64 }
  const [recFotoEnvase, setRecFotoEnvase] = useState(null); // { uri, base64 } — guardado local, backend futuro

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
      setRecFotoReceta(null);
      setRecFotoEnvase(null);
      Alert.alert('¡Listo!', 'Recepción de medicamento registrada.');
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar la recepción.'),
  });

  const administrarRecepcionMutation = useMutation({
    mutationFn: ({ recepcionId, tomaId }) => api.patch(`/bitacora/medicamento/recepcion/${recepcionId}/administrar`, { toma_id: tomaId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      Alert.alert('✅', 'Medicamento administrado.');
    },
    onError: () => Alert.alert('Error', 'No se pudo administrar el medicamento.'),
  });

  // Administración directa (sin recepción previa, igual que web)
  const [medNombre, setMedNombre] = useState('');
  const [medDosis, setMedDosis] = useState('');
  const medMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/medicamento', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['bitacora', alumnoId, fecha]);
      setMedNombre('');
      setMedDosis('');
      Alert.alert('💊', 'Medicamento registrado.');
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar el medicamento.'),
  });
  const registrarMed = () => {
    if (!medNombre || !medDosis) {
      Alert.alert('Falta información', 'Escribe nombre y dosis.');
      return;
    }
    medMutation.mutate({ alumno_id: alumnoId, nombre: medNombre, dosis: medDosis });
  };

  const pickFotoRecepcion = async (setter) => {
    Alert.alert('Agregar foto', 'Selecciona origen', [
      {
        text: 'Cámara', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
          if (!result.canceled && result.assets[0]) {
            setter({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
          }
        }
      },
      {
        text: 'Galería', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            setter({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
          }
        }
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

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
    if (recFotoReceta?.base64) body.foto_receta_base64 = `data:image/jpeg;base64,${recFotoReceta.base64}`;
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
        <TouchableOpacity onPress={() => router.replace('/(maestra)/bitacora')} style={s.backBtn}>
          <Text style={s.backTxt}>← Inicio</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>{nombre}</Text>
        <Text style={s.headerSub}>{new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
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
                <Text style={[s.animoLabel, animo === a.key && s.animoLabelOn]} numberOfLines={1}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Seccion>

        {/* Baño — solo si NO usa pañal */}
        {!usaPanial && (
          <Seccion titulo="Baño">
            <Contador label="Pipí 🚿" value={pipiCount} onChange={setPipiCount} />
            <Contador label="Popó 💩" value={popoCount} onChange={setPopoCount} />
          </Seccion>
        )}

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

        {/* Alimentación — 4 tiempos */}
        <Seccion titulo="Alimentación">
          {/* Tabs de tiempo */}
          <View style={s.tiempoTabs}>
            {[
              { key: 'desayuno', label: 'Desayuno' },
              { key: 'colacion', label: 'Colación' },
              { key: 'comida', label: 'Comida' },
              ...(tuvExtensionEnFecha ? [{ key: 'comida_extra', label: 'Extra' }] : []),
            ].map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.tiempoTab, tiempoActivo === t.key && s.tiempoTabOn]}
                onPress={() => setTiempoActivo(t.key)}
              >
                <Text style={[s.tiempoTabTxt, tiempoActivo === t.key && s.tiempoTabTxtOn]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tiempoActivo === 'comida_extra' && (
            <Text style={s.extensionSubText}>Alumno con extensión de horario activa</Text>
          )}
          {menuPrecargado && comidas[tiempoActivo]?.que_comio ? (
            <View style={{ backgroundColor: '#EDE9FE', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#6D28D9' }}>📋 Precargado del menú semanal</Text>
            </View>
          ) : null}
          <TextInput
            style={s.input}
            placeholder="¿Qué comió?"
            value={comidas[tiempoActivo]?.que_comio || ''}
            onChangeText={v => setComidas(prev => ({ ...prev, [tiempoActivo]: { ...prev[tiempoActivo], que_comio: v } }))}
            multiline
          />
          <Text style={s.subLabel}>¿Cuánto comió?</Text>
          <View style={s.cuantoRow}>
            {CUANTO.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.cuantoBtn, comidas[tiempoActivo]?.cuanto_comio === c.key && s.cuantoBtnOn]}
                onPress={() => setComidas(prev => ({ ...prev, [tiempoActivo]: { ...prev[tiempoActivo], cuanto_comio: prev[tiempoActivo]?.cuanto_comio === c.key ? null : c.key } }))}
              >
                <Text style={s.cuantoEmoji}>{c.emoji}</Text>
                <Text style={[s.cuantoLabel, comidas[tiempoActivo]?.cuanto_comio === c.key && s.cuantoLabelOn]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={s.input}
            placeholder="Observaciones (opcional)…"
            value={comidas[tiempoActivo]?.observaciones || ''}
            onChangeText={v => setComidas(prev => ({ ...prev, [tiempoActivo]: { ...prev[tiempoActivo], observaciones: v } }))}
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

        {/* Actividades del día */}
        {actividadesGrupo.length > 0 && (
          <Seccion titulo="Actividades del día">
            <Text style={{ fontSize: 11, color: '#718096', fontWeight: '600', marginBottom: 10 }}>
              ¿Participó en cada actividad?
            </Text>
            {actividadesGrupo.map(act => (
              <View key={act.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  {act.foto_url ? (
                    <Image source={{ uri: act.foto_url }} style={{ width: 40, height: 40, borderRadius: 6 }} resizeMode="cover" />
                  ) : null}
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#4A5568' }}>{act.descripcion}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[s.boolBtn, actividadesParticipacion[act.id] === true && s.boolBtnSiOn, { flex: 1, alignItems: 'center' }]}
                    onPress={() => setActividadesParticipacion(prev => ({ ...prev, [act.id]: true }))}
                  >
                    <Text style={[s.boolBtnTxt, actividadesParticipacion[act.id] === true && s.boolBtnTxtOn]}>✓ Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.boolBtn, actividadesParticipacion[act.id] === false && s.boolBtnNoOn, { flex: 1, alignItems: 'center' }]}
                    onPress={() => setActividadesParticipacion(prev => ({ ...prev, [act.id]: false }))}
                  >
                    <Text style={[s.boolBtnTxt, actividadesParticipacion[act.id] === false && s.boolBtnTxtOn]}>✗ No</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.boolBtn, { paddingHorizontal: 12, alignItems: 'center' }]}
                    onPress={() => setActividadesParticipacion(prev => { const c = { ...prev }; delete c[act.id]; return c; })}
                  >
                    <Text style={s.boolBtnTxt}>—</Text>
                  </TouchableOpacity>
                </View>

                {/* Fotos del alumno en esta actividad */}
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E9D8FD' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#805AD5', textTransform: 'uppercase', marginBottom: 6 }}>📷 Fotos del alumno</Text>
                  {act.fotos_alumno?.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {act.fotos_alumno.map(foto => (
                          <View key={foto.id} style={{ position: 'relative' }}>
                            <Image
                              source={{ uri: foto.foto_url }}
                              style={{ width: 72, height: 72, borderRadius: 8, borderWidth: 2, borderColor: '#D6BCFA' }}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              onPress={() => eliminarFotoActividad(foto.id)}
                              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#E53E3E', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', lineHeight: 14 }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                  <TouchableOpacity
                    onPress={() => subirFotoActividad(act.id)}
                    disabled={uploadingActId === act.id}
                    style={{ paddingVertical: 7, paddingHorizontal: 12, backgroundColor: '#FAF5FF', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#D6BCFA', alignSelf: 'flex-start', opacity: uploadingActId === act.id ? 0.5 : 1 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#805AD5' }}>
                      {uploadingActId === act.id ? 'Subiendo…' : '📷 Agregar foto'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {Object.keys(actividadesParticipacion).length > 0 && (
              <TouchableOpacity
                onPress={guardarParticipacion}
                disabled={participacionMutation.isPending}
                style={{ paddingVertical: 10, backgroundColor: '#805AD5', borderRadius: RADIUS.md, alignItems: 'center', marginTop: 4 }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>
                  {participacionMutation.isPending ? 'Guardando...' : '💾 Guardar participación'}
                </Text>
              </TouchableOpacity>
            )}
          </Seccion>
        )}

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
                      onPress={() => administrarRecepcionMutation.mutate({ recepcionId: rec.id, tomaId: rec.tomas?.find(t => !t.administrado)?.id ?? null })}
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

          {/* Administración directa (sin recepción previa) */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#BFDBFE', paddingTop: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#1E40AF', textTransform: 'uppercase', marginBottom: 8 }}>Administrar ahora</Text>
            <TextInput
              style={s.input}
              placeholder="Nombre del medicamento *"
              value={medNombre}
              onChangeText={setMedNombre}
            />
            <TextInput
              style={[s.input, { marginTop: 6 }]}
              placeholder="Dosis (ej. 5ml, 1 tableta) *"
              value={medDosis}
              onChangeText={setMedDosis}
            />
            <TouchableOpacity
              onPress={registrarMed}
              disabled={medMutation.isPending}
              style={{ marginTop: 8, paddingVertical: 12, backgroundColor: '#3B82F6', borderRadius: RADIUS.md, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>
                {medMutation.isPending ? 'Registrando...' : '💊 Administrar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={abrirFormRecepcion}
              disabled={recepcionMutation.isPending}
              style={{ flex: 1, backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>📋 Registrar recepción</Text>
            </TouchableOpacity>
          </View>

          {mostrarRecepcion && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FED7AA' }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#B45309', textTransform: 'uppercase', marginBottom: 8 }}>Nueva recepción (traída por papá)</Text>
              <TextInput
                style={s.input}
                placeholder="Nombre del medicamento *"
                value={recNombre}
                onChangeText={setRecNombre}
              />
              <TextInput
                style={[s.input, { marginTop: 6 }]}
                placeholder="Dosis (ej. 5ml, 1 tableta) *"
                value={recDosis}
                onChangeText={setRecDosis}
              />
              <TextInput
                style={[s.input, { marginTop: 6 }]}
                placeholder="Hora programada (opcional)"
                value={recHora}
                onChangeText={setRecHora}
              />
              {/* Fotos de receta y envase */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => pickFotoRecepcion(setRecFotoReceta)}
                  style={{ flex: 1, paddingVertical: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#FCD34D', borderRadius: RADIUS.md, alignItems: 'center' }}
                >
                  {recFotoReceta ? (
                    <View style={{ alignItems: 'center', gap: 2 }}>
                      <Image source={{ uri: recFotoReceta.uri }} style={{ width: 40, height: 40, borderRadius: 6 }} resizeMode="cover" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>✅ Receta</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>📷 Foto receta{'\n'}(opcional)</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickFotoRecepcion(setRecFotoEnvase)}
                  style={{ flex: 1, paddingVertical: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#FCD34D', borderRadius: RADIUS.md, alignItems: 'center' }}
                >
                  {recFotoEnvase ? (
                    <View style={{ alignItems: 'center', gap: 2 }}>
                      <Image source={{ uri: recFotoEnvase.uri }} style={{ width: 40, height: 40, borderRadius: 6 }} resizeMode="cover" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>✅ Envase</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>📷 Foto envase{'\n'}(opcional)</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={guardarRecepcion}
                  disabled={recepcionMutation.isPending}
                  style={{ flex: 1, backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>
                    {recepcionMutation.isPending ? 'Guardando...' : '💾 Guardar recepción'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setMostrarRecepcion(false); setRecFotoReceta(null); setRecFotoEnvase(null); }}
                  disabled={recepcionMutation.isPending}
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: '#E5E7EB', alignItems: 'center' }}
                >
                  <Text style={{ color: '#374151', fontSize: 14, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Seccion>

        {/* Incidentes / Accidentes */}
        <Seccion titulo="Incidentes / Accidentes">
          {/* Lista de incidentes del día */}
          {bitacoraExistente?.incidentes?.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              {bitacoraExistente.incidentes.map((inc, i) => (
                <View key={i} style={{ backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#7F1D1D' }}>{inc.descripcion}</Text>
                  {inc.acciones_tomadas ? (
                    <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>Acciones: {inc.acciones_tomadas}</Text>
                  ) : null}
                  <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                    {new Date(inc.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    {inc.reportado_por_nombre ? ` · ${inc.reportado_por_nombre}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón para abrir/cerrar form */}
          <TouchableOpacity
            onPress={() => setMostrarFormIncidente(!mostrarFormIncidente)}
            style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: mostrarFormIncidente ? '#FEE2E2' : '#FFF1F2', borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' }}
          >
            <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '700' }}>
              ⚠️ {mostrarFormIncidente ? 'Cancelar' : '+ Registrar incidente'}
            </Text>
          </TouchableOpacity>

          {mostrarFormIncidente && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FECACA' }}>
              <TextInput
                style={s.input}
                placeholder="Describe el incidente / accidente *"
                value={incDesc}
                onChangeText={setIncDesc}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TextInput
                style={[s.input, { marginTop: 8 }]}
                placeholder="Acciones tomadas (opcional)"
                value={incAcciones}
                onChangeText={setIncAcciones}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
              <TouchableOpacity
                onPress={registrarIncidente}
                disabled={incidenteMutation.isPending}
                style={{ marginTop: 8, paddingVertical: 12, backgroundColor: '#EF4444', borderRadius: RADIUS.md, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>💾 Guardar incidente</Text>
              </TouchableOpacity>
            </View>
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

          {/* Foto del día */}
          <Text style={s.fotoLabel}>📷 Foto del día (opcional)</Text>
          {(fotoDia || fotoDiaUrl) && (
            <View style={s.fotoPreviewWrap}>
              <Image
                source={{ uri: fotoDia ? fotoDia.uri : fotoDiaUrl }}
                style={s.fotoPreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={s.fotoRemoveBtn}
                onPress={() => { setFotoDia(null); setFotoDiaUrl(null); }}
              >
                <Ionicons name="close-circle" size={28} color="#E53E3E" />
              </TouchableOpacity>
            </View>
          )}
          {!fotoDia && !fotoDiaUrl && (
            <View style={s.fotoBtnRow}>
              <TouchableOpacity
                style={s.fotoPickBtn}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setFotoDia({ uri: result.assets[0].uri, fileName: result.assets[0].fileName || 'foto.jpg' });
                  }
                }}
              >
                <Ionicons name="image-outline" size={20} color={COLORS.purple} />
                <Text style={s.fotoPickTxt}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.fotoPickBtn}
                onPress={async () => {
                  const result = await ImagePicker.launchCameraAsync({
                    quality: 0.7,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setFotoDia({ uri: result.assets[0].uri, fileName: result.assets[0].fileName || 'foto.jpg' });
                  }
                }}
              >
                <Ionicons name="camera-outline" size={20} color={COLORS.purple} />
                <Text style={s.fotoPickTxt}>Cámara</Text>
              </TouchableOpacity>
            </View>
          )}
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
  const { alumnoId, nombre, usaPanial, nivelCodigo, fecha, grupoId } = params;

  const fechaDefault = (() => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {alumnoId ? (
        <FormularioBitacora
          alumnoId={alumnoId}
          nombre={decodeURIComponent(nombre || '')}
          usaPanial={usaPanial === 'true'}
          nivelCodigo={decodeURIComponent(nivelCodigo || '')}
          fecha={fecha || fechaDefault}
          grupoId={grupoId || ''}
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

  // Selector de fecha
  fechaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: COLORS.white },
  fechaBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fechaBtnTxt: { fontSize: 28, color: '#805AD5', fontWeight: '900', lineHeight: 32 },
  fechaTxt: { fontSize: 13, fontWeight: '700', color: '#4A5568', textAlign: 'center', textTransform: 'capitalize' },
  hoyBadge: { fontSize: 10, fontWeight: '900', color: '#805AD5', marginTop: 2 },

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
  animoBtn: { width: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: '#EDF2F7' },
  animoBtnOn: { backgroundColor: '#B794F4' },
  animoEmoji: { fontSize: 24 },
  animoLabel: { fontSize: 9, fontWeight: '700', color: '#718096', marginTop: 4, textAlign: 'center' },
  animoLabelOn: { color: '#44337A' },

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

  // Tabs de tiempo (alimentación)
  tiempoTabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tiempoTab: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: '#EDF2F7', alignItems: 'center' },
  tiempoTabOn: { backgroundColor: '#805AD5' },
  tiempoTabTxt: { fontSize: 11, fontWeight: '700', color: '#718096' },
  tiempoTabTxtOn: { color: '#fff' },

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

  // Foto del día
  fotoLabel: { fontSize: 12, fontWeight: '900', color: '#718096', textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  fotoPreviewWrap: { position: 'relative', alignSelf: 'flex-start', marginBottom: 8 },
  fotoPreview: { width: 120, height: 120, borderRadius: RADIUS.md, borderWidth: 2, borderColor: '#E2E8F0' },
  fotoRemoveBtn: { position: 'absolute', top: -8, right: -8 },
  fotoBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  fotoPickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F7FAFC', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E2E8F0' },
  fotoPickTxt: { fontSize: 14, fontWeight: '700', color: '#805AD5' },
});

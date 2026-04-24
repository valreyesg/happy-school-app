import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import toast from 'react-hot-toast';
import { useCatalogo } from '@/hooks/useCatalogo';
import { toMap } from '@/utils/catalogos';

// ── Constantes ────────────────────────────────────────────────────────────────

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function Seccion({ titulo, children }) {
  return (
    <div className="card-hs space-y-4">
      <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider">{titulo}</h3>
      {children}
    </div>
  );
}

function Contador({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-bold text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-full bg-hs-purple text-white font-black text-xl flex items-center justify-center hover:bg-purple-700">
          −
        </button>
        <span className="text-2xl font-black text-gray-800 w-8 text-center">{value}</span>
        <button onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full bg-hs-purple text-white font-black text-xl flex items-center justify-center hover:bg-purple-700">
          +
        </button>
      </div>
    </div>
  );
}

function SiNo({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-bold text-gray-700 flex-1">{label}</span>
      <div className="flex gap-2">
        <button onClick={() => onChange(value === true ? null : true)}
          className={`px-4 py-2 rounded-xl font-black text-sm transition-all
            ${value === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Sí
        </button>
        <button onClick={() => onChange(value === false ? null : false)}
          className={`px-4 py-2 rounded-xl font-black text-sm transition-all
            ${value === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          No
        </button>
      </div>
    </div>
  );
}

// ── Guardar participación en actividades ─────────────────────────────────

function ActividadesParticipacionGuardar({ alumnoId, fecha, bitacoraId, actividades, actividadesParticipacion, onGuardado }) {
  const guardarMutation = useMutation({
    mutationFn: async () => {
      const actividadesConParticipacion = actividades
        .filter(a => actividadesParticipacion[a.id] !== undefined)
        .map(a => ({ actividad_grupo_id: a.id, participo: actividadesParticipacion[a.id] }));

      if (actividadesConParticipacion.length === 0) {
        throw new Error('Selecciona al menos una actividad');
      }

      let finalBitacoraId = bitacoraId;
      if (!finalBitacoraId) {
        // Si no existe bitácora aún, necesitamos crearla vacía primero
        // Para esto, el backend debería hacer un upsert cuando se guarda participación
        console.warn('Bitácora no existe aún, se creará con guardado de participación');
      }

      return api.post('/bitacora/actividades-alumno', {
        alumno_id: alumnoId,
        bitacora_id: finalBitacoraId,
        actividades: actividadesConParticipacion,
      });
    },
    onSuccess: () => {
      toast.success('✅ Participación guardada');
      onGuardado();
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });

  return (
    <button
      onClick={() => guardarMutation.mutate()}
      disabled={guardarMutation.isPending || Object.keys(actividadesParticipacion).length === 0}
      className="w-full py-3 rounded-xl font-black text-sm bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 transition-all"
    >
      {guardarMutation.isPending ? 'Guardando...' : '💾 Guardar participación'}
    </button>
  );
}

// ── Captura de actividades del grupo ──────────────────────────────────────

function CaptuaActividadesGrupo({ grupoId, fecha, mostrar, setMostrar }) {
  const queryClient = useQueryClient();
  const [actividadesCaptua, setActividadesCaptua] = useState([{ descripcion: '', orden: 1, fotoFile: null, fotoPreview: null }]);

  // Cargar actividades existentes
  const { data: actividadesGrupo } = useQuery({
    queryKey: ['actividades-grupo', grupoId, fecha],
    queryFn: () => api.get(`/bitacora/actividades-grupo?grupo_id=${grupoId}&fecha=${fecha}`).then(r => r.data).catch(() => []),
    enabled: !!(grupoId && fecha),
  });

  useEffect(() => {
    if (actividadesGrupo && actividadesGrupo.length > 0) {
      setActividadesCaptua(actividadesGrupo.map(a => ({
        descripcion: a.descripcion,
        orden: a.orden,
        fotoFile: null,
        fotoPreview: a.foto_url || null,
      })));
    }
  }, [actividadesGrupo]);

  const guardarMutation = useMutation({
    mutationFn: (fd) => api.post('/bitacora/actividades-grupo', fd).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades-grupo'] });
      toast.success('✅ Actividades del día guardadas');
      setMostrar(false);
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });

  const guardarActividades = () => {
    const conDescripcion = actividadesCaptua.filter(a => a.descripcion.trim());
    if (conDescripcion.length === 0) {
      toast.error('Agrega al menos una actividad');
      return;
    }

    const fd = new FormData();
    fd.append('grupo_id', grupoId);
    fd.append('fecha', fecha);
    fd.append('actividades', JSON.stringify(conDescripcion.map(({ descripcion, orden }, i) => ({
      descripcion: descripcion.trim(),
      orden: i + 1,
    }))));

    actividadesCaptua.forEach((act, i) => {
      if (act.fotoFile) fd.append(`fotos`, act.fotoFile, `actividad_${i}.jpg`);
    });

    guardarMutation.mutate(fd);
  };

  return (
    <div className="mb-4 card-hs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider">🎨 Actividades del día</h3>
        <button
          onClick={() => setMostrar(!mostrar)}
          className="px-3 py-1 rounded-lg text-xs font-bold bg-hs-purple/10 text-hs-purple hover:bg-hs-purple/20 transition-all"
        >
          {mostrar ? '✕ Cerrar' : '✏️ Editar'}
        </button>
      </div>

      {!mostrar && actividadesGrupo?.length > 0 && (
        <div className="space-y-1 text-xs">
          {actividadesGrupo.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-purple-50 rounded-lg">
              {a.foto_url && <img src={a.foto_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />}
              <p className="text-gray-700 font-semibold flex-1 min-w-0 line-clamp-1">{a.descripcion}</p>
            </div>
          ))}
        </div>
      )}

      {mostrar && (
        <div className="space-y-2">
          {actividadesCaptua.map((act, idx) => (
            <div key={idx} className="space-y-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <textarea
                rows={2}
                placeholder={`Actividad ${idx + 1}...`}
                value={act.descripcion}
                onChange={e => setActividadesCaptua(prev => prev.map((a, i) => i === idx ? { ...a, descripcion: e.target.value } : a))}
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-hs-purple resize-none"
              />
              {act.fotoPreview && (
                <img src={act.fotoPreview} alt="" className="w-10 h-10 rounded object-cover" />
              )}
              <div className="flex gap-1.5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setActividadesCaptua(prev => prev.map((a, i) => i === idx
                        ? { ...a, fotoFile: file, fotoPreview: URL.createObjectURL(file) }
                        : a
                      ));
                    }
                  }}
                  className="hidden"
                  id={`foto-${idx}`}
                />
                <label htmlFor={`foto-${idx}`} className="flex-1 px-2 py-1 text-xs font-bold border border-dashed border-purple-300 text-purple-600 rounded cursor-pointer hover:bg-purple-50">
                  📷 Foto
                </label>
                {actividadesCaptua.length > 1 && (
                  <button
                    onClick={() => setActividadesCaptua(prev => prev.filter((_, i) => i !== idx))}
                    className="px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={() => setActividadesCaptua(prev => [...prev, { descripcion: '', orden: prev.length + 1, fotoFile: null, fotoPreview: null }])}
            className="w-full py-1.5 text-xs font-bold border-2 border-dashed border-purple-300 text-purple-600 rounded hover:bg-purple-50"
          >
            + Agregar
          </button>
          <button
            onClick={guardarActividades}
            disabled={guardarMutation.isPending}
            className="w-full py-2 rounded-lg font-black text-xs bg-hs-purple text-white hover:bg-purple-700 disabled:opacity-50 transition-all"
          >
            {guardarMutation.isPending ? 'Guardando...' : '💾 Guardar actividades'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Lista de alumnos ──────────────────────────────────────────────────────────

function ListaAlumnos({ alumnos, seleccionado, onSeleccionar }) {
  return (
    <div className="space-y-2">
      {alumnos.map(a => {
        const guardada = !!a.estado_animo;
        const activo = seleccionado?.id === a.id;
        return (
          <button
            key={a.id}
            onClick={() => onSeleccionar(a)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all
              ${activo
                ? 'border-hs-green bg-hs-green/10'
                : 'border-gray-100 bg-white hover:border-hs-green/40'}`}
          >
            <AvatarAlumno alumno={a} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-800 truncate">{a.nombre_completo}</p>
              <p className={`text-xs font-bold mt-0.5 ${guardada ? 'text-green-600' : 'text-gray-400'}`}>
                {guardada ? '✅ Guardada' : '⏳ Pendiente'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────

function FormBitacora({ alumno, fecha, soloLectura, actividades, setActividades, onGuardado, catalogos }) {
  const { ANIMOS, CUANTO, COMPORTAMIENTO, PANIAL_CONDICIONES, TIEMPOS_COMIDA, PANIAL_LABEL } = catalogos;
  const queryClient = useQueryClient();

  const grupoNivel = (alumno.nivel_codigo || '').toLowerCase();
  const mostrarEsfinteres = !alumno.usa_panial && (
    ['maternal', 'prekinder', 'kinder1'].includes(grupoNivel)
  );

  // Participación en actividades del grupo (por actividad_grupo_id)
  const [actividadesParticipacion, setActividadesParticipacion] = useState({});

  // Estado del formulario
  const [animo,               setAnimo]               = useState(null);
  const [pipiCount,           setPipiCount]           = useState(0);
  const [popoCount,           setPopoCount]           = useState(0);
  // Comidas por 4 tiempos
  const [comidas, setComidas] = useState({
    desayuno:    { que_comio: '', cuanto_comio: null, observaciones: '' },
    colacion:    { que_comio: '', cuanto_comio: null, observaciones: '' },
    comida:      { que_comio: '', cuanto_comio: null, observaciones: '' },
    comida_extra: { que_comio: '', cuanto_comio: null, observaciones: '' },
  });
  const [actividadRealizada,  setActividadRealizada]  = useState(null);
  const [actividadFotos,      setActividadFotos]      = useState([]);
  const actFileRef = useRef();
  const [comportamiento,      setComportamiento]      = useState(null);
  const [comportamientoNotas, setComportamientoNotas] = useState('');
  const [tuvoFiebre,          setTuvoFiebre]          = useState(false);
  const [temperatura,         setTemperatura]         = useState('');
  const [seEnfermo,           setSeEnfermo]           = useState(false);
  const [descEnfermedad,      setDescEnfermedad]      = useState('');
  const [notas,               setNotas]               = useState('');
  const [fueSolo,             setFueSolo]             = useState(null);
  const [pidioIr,             setPidioIr]             = useState(null);
  const [tuvoAccidente,       setTuvoAccidente]       = useState(null);
  const [descAccidente,       setDescAccidente]       = useState('');
  const [necesitaAyuda,       setNecesitaAyuda]       = useState(null);
  const [notasProgreso,       setNotasProgreso]       = useState('');

  // Lunes de la semana para consultar menú y confirmación
  const semanaLunes = (() => {
    const d = new Date(fecha + 'T12:00:00');
    const day = d.getDay(); // 0=dom, 1=lun...
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-CA');
  })();

  const [menuPrecargado, setMenuPrecargado] = useState(false);

  // Cargar datos existentes
  const { data, isLoading } = useQuery({
    queryKey: ['bitacora', alumno.id, fecha],
    queryFn: () => api.get(`/bitacora/${alumno.id}?fecha=${fecha}`).then(r => r.data),
  });

  // Menú de la semana
  const { data: menuSemana } = useQuery({
    queryKey: ['menu-semana', semanaLunes],
    queryFn: () => api.get(`/comida/menu?semana=${semanaLunes}`).then(r => r.data),
    staleTime: 1000 * 60 * 10,
  });

  // Confirmación de comida del alumno esta semana
  const { data: confirmacionComida } = useQuery({
    queryKey: ['confirmacion-comida', alumno.id, semanaLunes],
    queryFn: () => api.get(`/comida/confirmacion/${alumno.id}?semana=${semanaLunes}`).then(r => r.data).catch(() => null),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!data) return;
    if (data.bitacora) {
      setAnimo(data.bitacora.estado_animo || null);
      setActividadRealizada(data.bitacora.actividad_realizada ?? null);
      const texto = data.bitacora.actividad_descripcion || '';
      const items = texto.split('\n').filter(s => s.trim().length > 0);
      setActividades(items.length > 0 ? items : ['']);
      setComportamiento(data.bitacora.comportamiento || null);
      setComportamientoNotas(data.bitacora.comportamiento_notas || '');
      setTuvoFiebre(data.bitacora.tuvo_fiebre || false);
      setTemperatura(data.bitacora.temperatura_dia?.toString() || '');
      setSeEnfermo(data.bitacora.se_enfermo || false);
      setDescEnfermedad(data.bitacora.descripcion_enfermedad || '');
      setNotas(data.bitacora.notas || '');
    }
    // Cargar participación en actividades
    if (data.actividades && Array.isArray(data.actividades)) {
      const participacion = {};
      data.actividades.forEach(act => {
        if (act.participo !== null && act.participo !== undefined) {
          participacion[act.id] = act.participo;
        }
      });
      setActividadesParticipacion(participacion);
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
        if (c.tiempo && nuevasComidas[c.tiempo]) {
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
        // Determinar día de la semana
        const DIAS_KEY = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
        const diaSemana = DIAS_KEY[new Date(fecha + 'T12:00:00').getDay()];
        const menuDia = menuDiasPorTiempo[diaSemana];

        // Nivel del alumno
        const nivelAlumno = (alumno.nivel_codigo || '').toLowerCase();

        // Función para saber si un tiempo aplica al nivel del alumno
        const tiempoAplica = (tiempo) => {
          const niveles = menuDia?.[tiempo]?.niveles || [];
          return niveles.includes('todos') || niveles.includes(nivelAlumno);
        };

        // Precargar cada tiempo del día si aplica al nivel
        if (menuDia) {
          ['desayuno','colacion','comida'].forEach(tiempo => {
            if (!nuevasComidas[tiempo].que_comio && tiempoAplica(tiempo) && menuDia[tiempo]?.platillo) {
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
      setDescAccidente(data.esfinteres.descripcion_accidente || '');
      setNecesitaAyuda(data.esfinteres.necesito_ayuda ?? null);
      setNotasProgreso(data.esfinteres.notas_progreso || '');
    }
  }, [data, alumno.id, menuSemana, confirmacionComida]);

  // Medicamento
  const [medNombre, setMedNombre] = useState('');
  const [medDosis,  setMedDosis]  = useState('');
  const [medNotas,  setMedNotas]  = useState('');
  const medMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/medicamento', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora', alumno.id, fecha] });
      setMedNombre(''); setMedDosis(''); setMedNotas('');
      toast.success('💊 Medicamento registrado');
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });
  const registrarMed = () => {
    if (!medNombre || !medDosis) { toast.error('Escribe nombre y dosis'); return; }
    medMutation.mutate({ alumno_id: alumno.id, nombre: medNombre, dosis: medDosis, notas: medNotas });
  };

  // Incidente
  const [incDesc,     setIncDesc]     = useState('');
  const [incAcciones, setIncAcciones] = useState('');
  const [incFotos,    setIncFotos]    = useState([]);
  const incFileRef = useRef();
  const incMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/incidente', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora', alumno.id, fecha] });
      setIncDesc(''); setIncAcciones(''); setIncFotos([]);
      toast.success('⚠️ Incidente registrado');
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });
  const registrarInc = () => {
    if (!incDesc) { toast.error('Describe el incidente'); return; }
    if (!alumno?.id) { toast.error('Error: alumno no cargado'); return; }
    incMutation.mutate({
      alumno_id: alumno.id,
      descripcion: incDesc,
      acciones_tomadas: incAcciones,
    });
  };

  // Actividades fotos
  const actFotosMutation = useMutation({
    mutationFn: (formData) => api.post('/bitacora/actividades/fotos', formData).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora', alumno.id, fecha] });
      setActividadFotos([]);
      toast.success('📷 Fotos de actividades subidas');
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });
  const subirFotosActividad = () => {
    if (actividadFotos.length === 0) return;
    const fd = new FormData();
    fd.append('grupo_id', alumno.grupo_id);
    fd.append('alumno_id', alumno.id);
    fd.append('fecha', fecha);
    fd.append('descripcion', actividades.map(s => s.trim()).filter(s => s.length > 0).join('; ') || null);
    fd.append('es_grupal', 'false');
    actividadFotos.forEach(f => fd.append('fotos', f));
    actFotosMutation.mutate(fd);
  };

  // Pañal
  const panialMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/panial', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora', alumno.id, fecha] });
      toast.success('Cambio de pañal registrado');
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });

  // Guardar
  const guardarMutation = useMutation({
    mutationFn: (body) => api.post('/bitacora/guardar', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora', alumno.id, fecha] });
      queryClient.invalidateQueries({ queryKey: ['mi-grupo'] });
      toast.success(`✅ Bitácora de ${alumno.nombre_completo.split(' ')[0]} guardada`);
      onGuardado();
    },
    onError: () => toast.error('Error al guardar la bitácora'),
  });

  const guardar = () => {
    if (soloLectura) return;
    if (!animo) { toast.error('Selecciona el estado de ánimo'); return; }

    // Validar que el alumno tenga entrada registrada
    const tieneEntrada = alumno.hora_entrada && ['presente', 'retardo'].includes(alumno.estado_asistencia);
    if (!tieneEntrada) {
      toast.error('❌ Solo puedes registrar bitácora para alumnos con entrada. Este alumno no tiene entrada registrada hoy.');
      return;
    }

    guardarMutation.mutate({
      alumno_id: alumno.id,
      fecha,
      estado_animo: animo,
      actividad_realizada: actividadRealizada,
      actividad_descripcion: actividades.map(s => s.trim()).filter(s => s.length > 0).join('\n'),
      comportamiento,
      comportamiento_notas: comportamientoNotas,
      tuvo_fiebre: tuvoFiebre,
      temperatura_dia: temperatura ? parseFloat(temperatura) : null,
      se_enfermo: seEnfermo,
      descripcion_enfermedad: descEnfermedad,
      notas,
      pipi_count: pipiCount,
      popo_count: popoCount,
      comidas: Object.entries(comidas).map(([tiempo, data]) => ({ tiempo, ...data })),
      fue_solo:              mostrarEsfinteres ? fueSolo        : undefined,
      pidio_ir:              mostrarEsfinteres ? pidioIr        : undefined,
      tuvo_accidente:        mostrarEsfinteres ? tuvoAccidente  : undefined,
      descripcion_accidente: mostrarEsfinteres ? descAccidente  : undefined,
      necesito_ayuda:        mostrarEsfinteres ? necesitaAyuda  : undefined,
      notas_progreso:        mostrarEsfinteres ? notasProgreso  : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">📋</div>
          <p className="font-bold text-gray-500">Cargando bitácora…</p>
        </div>
      </div>
    );
  }

  const tieneEntrada = alumno.hora_entrada && ['presente', 'retardo'].includes(alumno.estado_asistencia);

  return (
    <div className={`space-y-4 pb-24 ${soloLectura ? 'pointer-events-none select-none opacity-90' : ''}`}>
      {/* Advertencia si no hay entrada */}
      {!tieneEntrada && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">🚫</span>
          <div className="flex-1">
            <p className="font-black text-red-800 text-sm">Sin entrada registrada</p>
            <p className="text-xs text-red-700 font-semibold mt-0.5">
              No se puede registrar bitácora ni salida sin una entrada. Registra la entrada primero en el filtro de entrada.
            </p>
          </div>
        </div>
      )}

      {/* Header alumno */}
      <div className="card-hs flex items-center gap-4">
        <AvatarAlumno alumno={alumno} size="md" />
        <div>
          <p className="font-black text-gray-800">{alumno.nombre_completo}</p>
          <p className="text-xs text-gray-400 font-semibold capitalize">
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          {soloLectura && (
            <span className="text-xs font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-xl">
              📖 Solo lectura
            </span>
          )}
          {data?.bitacora && (
            <span className="text-xs font-black bg-green-100 text-green-700 px-3 py-1 rounded-xl">
              ✅ Guardada
            </span>
          )}
        </div>
      </div>

      {/* Estado de ánimo */}
      <Seccion titulo="¿Cómo llegó hoy? *">
        <div className="flex justify-around">
          {ANIMOS.map(a => (
            <button
              key={a.key}
              onClick={() => setAnimo(a.key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all
                ${animo === a.key
                  ? 'bg-hs-purple/20 scale-110 ring-2 ring-hs-purple'
                  : 'hover:bg-gray-100'}`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className="text-xs font-bold text-gray-600">{a.label}</span>
            </button>
          ))}
        </div>
      </Seccion>

      {/* Baño — solo para niños que van solos al baño */}
      {!alumno.usa_panial && (
        <Seccion titulo="🚿 Baño">
          <Contador label="Pipí 🚿" value={pipiCount} onChange={v => !soloLectura && setPipiCount(v)} />
          <Contador label="Popó 💩" value={popoCount} onChange={v => !soloLectura && setPopoCount(v)} />
        </Seccion>
      )}

      {/* Pañal (solo si usa_panial) */}
      {alumno.usa_panial && (
        <Seccion titulo="👶🏻 Cambios de pañal">
          {data?.panial?.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-black text-gray-400">Registros de hoy</p>
              {data.panial.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl text-sm">
                  <span className="font-bold text-purple-700">
                    {new Date(p.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-gray-700 font-semibold">{PANIAL_LABEL[p.condicion]?.label ?? p.condicion}</span>
                  {p.tiene_irritacion && <span className="text-orange-500 font-bold">⚠️ irritación</span>}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs font-black text-gray-400 mb-2">Registrar nuevo cambio</p>
          <div className="flex flex-wrap gap-2">
            {PANIAL_CONDICIONES.map(c => (
              <button
                key={c.key}
                onClick={() => panialMutation.mutate({ alumno_id: alumno.id, condicion: c.key, tiene_irritacion: false, notas: '' })}
                disabled={panialMutation.isPending || soloLectura}
                className="px-4 py-2 bg-hs-purple text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {c.label}
              </button>
            ))}
          </div>
        </Seccion>
      )}

      {/* Control de esfínteres */}
      {mostrarEsfinteres && (
        <Seccion titulo="🚽 Control de esfínteres">
          <SiNo label="¿Fue solo/a al baño?"  value={fueSolo}       onChange={setFueSolo} />
          <SiNo label="¿Pidió ir?"            value={pidioIr}       onChange={setPidioIr} />
          <SiNo label="¿Tuvo accidente?"      value={tuvoAccidente} onChange={setTuvoAccidente} />
          {tuvoAccidente && (
            <textarea rows={2} placeholder="Describe el accidente…"
              value={descAccidente} onChange={e => setDescAccidente(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />
          )}
          <SiNo label="¿Necesitó ayuda?"     value={necesitaAyuda} onChange={setNecesitaAyuda} />
          <textarea rows={2} placeholder="Notas de progreso (opcional)…"
            value={notasProgreso} onChange={e => setNotasProgreso(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />
        </Seccion>
      )}

      {/* Alimentación — 4 Tiempos */}
      {comidas && (
        <Seccion titulo="🍽️ Alimentación (4 Tiempos)">
          <div className="space-y-4">
            {TIEMPOS_COMIDA.map(tiempoInfo => (
              <div key={tiempoInfo.key} className="border-2 border-hs-purple rounded-xl p-4 space-y-3 bg-purple-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-hs-purple">{tiempoInfo.emoji} {tiempoInfo.label}</p>
                  <p className="text-xs text-hs-purple font-bold">
                    {comidas[tiempoInfo.key]?.cuanto_comio ? CUANTO.find(c => c.key === comidas[tiempoInfo.key].cuanto_comio)?.label : '—'}
                  </p>
                </div>
                {menuPrecargado && comidas[tiempoInfo.key]?.que_comio && (
                  <p className="text-xs text-purple-500 font-bold -mb-1">📋 Precargado del menú semanal — edita si es necesario</p>
                )}
                <textarea rows={2} placeholder={`¿Qué comió en ${tiempoInfo.label.toLowerCase()}?`}
                  value={comidas[tiempoInfo.key]?.que_comio || ''}
                  onChange={e => setComidas({ ...comidas, [tiempoInfo.key]: { ...comidas[tiempoInfo.key], que_comio: e.target.value } })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-gray-600">¿Cuánto comió?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {CUANTO.map(c => (
                      <button key={c.key} onClick={() => setComidas({ ...comidas, [tiempoInfo.key]: { ...comidas[tiempoInfo.key], cuanto_comio: c.key } })}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all
                          ${comidas[tiempoInfo.key]?.cuanto_comio === c.key
                            ? 'border-hs-purple bg-white shadow-md'
                            : 'border-gray-200 hover:border-hs-purple/40'}`}>
                        <span className="text-2xl">{c.emoji}</span>
                        <span className={`text-xs font-bold text-center ${comidas[tiempoInfo.key]?.cuanto_comio === c.key ? 'text-hs-purple' : 'text-gray-500'}`}>
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <textarea rows={1} placeholder="Notas (ej: rechazó verduras, pidió más, etc.)"
                  value={comidas[tiempoInfo.key]?.observaciones || ''}
                  onChange={e => setComidas({ ...comidas, [tiempoInfo.key]: { ...comidas[tiempoInfo.key], observaciones: e.target.value } })}
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-hs-purple resize-none" />
              </div>
            ))}
          </div>
        </Seccion>
      )}

      {/* Actividades del grupo */}
      <Seccion titulo="🎨 Actividades">
        {!data?.actividades || data.actividades.length === 0 ? (
          <p className="text-sm text-gray-500 font-semibold text-center py-4">
            Sin actividades capturadas para hoy. Edita desde el panel izquierdo.
          </p>
        ) : (
          <div className="space-y-3">
            {data.actividades.map((act) => (
              <div key={act.id} className="rounded-xl border-2 border-purple-100 overflow-hidden bg-purple-50">
                {act.foto_url && (
                  <img src={act.foto_url} alt={act.descripcion} className="w-full h-32 object-cover" />
                )}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">{act.descripcion}</p>
                  {!soloLectura && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActividadesParticipacion(prev => ({ ...prev, [act.id]: true }))}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all
                          ${actividadesParticipacion[act.id] === true ? 'bg-green-500 text-white' : 'bg-white border-2 border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        ✓ Sí
                      </button>
                      <button
                        onClick={() => setActividadesParticipacion(prev => ({ ...prev, [act.id]: false }))}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all
                          ${actividadesParticipacion[act.id] === false ? 'bg-red-500 text-white' : 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50'}`}
                      >
                        ✗ No
                      </button>
                      <button
                        onClick={() => setActividadesParticipacion(prev => {
                          const copy = { ...prev };
                          delete copy[act.id];
                          return copy;
                        })}
                        className="px-3 py-2 rounded-lg font-bold text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                      >
                        —
                      </button>
                    </div>
                  )}
                  {soloLectura && act.participo !== null && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      act.participo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {act.participo ? '✓ Participó' : '✗ No participó'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!soloLectura && (
              <ActividadesParticipacionGuardar
                alumnoId={alumno.id}
                fecha={fecha}
                bitacoraId={data.bitacora?.id}
                actividades={data.actividades}
                actividadesParticipacion={actividadesParticipacion}
                onGuardado={() => {
                  queryClient.invalidateQueries({ queryKey: ['bitacora', alumno.id, fecha] });
                }}
              />
            )}
          </div>
        )}
      </Seccion>

      {/* Comportamiento */}
      <Seccion titulo="🌟 Comportamiento">
        <div className="grid grid-cols-3 gap-3">
          {COMPORTAMIENTO.map(c => (
            <button key={c.key} onClick={() => setComportamiento(c.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
                ${comportamiento === c.key
                  ? 'border-hs-purple bg-hs-purple/10'
                  : 'border-gray-200 hover:border-hs-purple/40'}`}>
              <span className="text-2xl">{c.emoji}</span>
              <span className={`text-xs font-bold ${comportamiento === c.key ? 'text-hs-purple' : 'text-gray-500'}`}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
        {comportamiento === 'necesita_mejorar' && (
          <textarea rows={2} placeholder="¿Qué pasó? Describe brevemente…"
            value={comportamientoNotas} onChange={e => setComportamientoNotas(e.target.value)}
            className="w-full border-2 border-yellow-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-500 resize-none" />
        )}
      </Seccion>

      {/* Salud */}
      <Seccion titulo="🌡️ Salud">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-700">¿Tuvo fiebre?</span>
          <button onClick={() => setTuvoFiebre(v => !v)}
            className={`relative w-14 h-7 rounded-full transition-colors ${tuvoFiebre ? 'bg-red-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${tuvoFiebre ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>
        {tuvoFiebre && (
          <input type="number" step="0.1" min="35" max="42" placeholder="Temperatura °C"
            value={temperatura} onChange={e => setTemperatura(e.target.value)}
            className="w-full border-2 border-red-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-500" />
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-700">¿Se enfermó / malestar?</span>
          <button onClick={() => setSeEnfermo(v => !v)}
            className={`relative w-14 h-7 rounded-full transition-colors ${seEnfermo ? 'bg-red-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${seEnfermo ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>
        {seEnfermo && (
          <textarea rows={2} placeholder="Describe el malestar…"
            value={descEnfermedad} onChange={e => setDescEnfermedad(e.target.value)}
            className="w-full border-2 border-red-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-500 resize-none" />
        )}
      </Seccion>

      {/* Notas generales */}
      <Seccion titulo="📝 Notas generales">
        <textarea rows={3} placeholder="Notas adicionales para los papás…"
          value={notas} onChange={e => setNotas(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />
      </Seccion>

      {/* Medicamentos */}
      <Seccion titulo="💊 Medicamentos del día">
        {data?.medicamentos?.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.medicamentos.map((m, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-xl text-sm">
                <span className="text-blue-500 text-lg">💊</span>
                <div>
                  <p className="font-black text-blue-800">{m.nombre} — {m.dosis}</p>
                  <p className="text-xs text-blue-600">
                    {new Date(m.hora_administracion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    {m.notas && ` · ${m.notas}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {!soloLectura && (
          <div className="space-y-2">
            <input type="text" placeholder="Nombre del medicamento *"
              value={medNombre} onChange={e => setMedNombre(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400" />
            <input type="text" placeholder="Dosis (ej. 5ml, 1 tableta) *"
              value={medDosis} onChange={e => setMedDosis(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400" />
            <textarea rows={2} placeholder="Notas (opcional)"
              value={medNotas} onChange={e => setMedNotas(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400 resize-none" />
            <button onClick={registrarMed} disabled={medMutation.isPending}
              className="w-full py-3 rounded-xl font-black text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-all">
              {medMutation.isPending ? 'Registrando…' : '💊 Registrar medicamento'}
            </button>
          </div>
        )}
      </Seccion>

      {/* Incidentes */}
      <Seccion titulo="⚠️ Incidentes / Accidentes">
        {data?.incidentes?.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.incidentes.map((inc, i) => (
              <div key={i} className="px-3 py-2 bg-red-50 rounded-xl text-sm border border-red-200">
                <p className="font-black text-red-800">{inc.descripcion}</p>
                {inc.acciones_tomadas && (
                  <p className="text-xs text-red-600 mt-1">Acciones: {inc.acciones_tomadas}</p>
                )}
                {inc.fotos_urls?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {inc.fotos_urls.map((url, j) => (
                      <img key={j} src={url} alt="Foto incidente"
                        className="w-16 h-16 object-cover rounded-lg border border-red-200" />
                    ))}
                  </div>
                )}
                <p className="text-xs text-red-400 mt-1">
                  {new Date(inc.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  {inc.reportado_por_nombre && ` · ${inc.reportado_por_nombre}`}
                </p>
              </div>
            ))}
          </div>
        )}
        {!soloLectura && (
          <div className="space-y-2">
            <textarea rows={3} placeholder="Describe qué pasó *"
              value={incDesc} onChange={e => setIncDesc(e.target.value)}
              className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-400 resize-none" />
            <textarea rows={2} placeholder="Acciones tomadas (opcional)"
              value={incAcciones} onChange={e => setIncAcciones(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-400 resize-none" />
            <button onClick={registrarInc} disabled={incMutation.isPending}
              className="w-full py-3 rounded-xl font-black text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all">
              {incMutation.isPending ? 'Registrando…' : '⚠️ Registrar incidente'}
            </button>
          </div>
        )}
      </Seccion>

      {/* Botón guardar fijo (oculto en solo lectura) */}
      {!soloLectura && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 bg-white border-t border-gray-100 z-10">
          <button
            onClick={guardar}
            disabled={guardarMutation.isPending || !tieneEntrada}
            title={!tieneEntrada ? 'No se puede guardar sin entrada registrada' : ''}
            className="w-full max-w-2xl mx-auto block py-4 rounded-2xl font-black text-white text-lg
              bg-hs-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {guardarMutation.isPending ? 'Guardando…' : '💾 Guardar bitácora'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────────

export default function MaestraBitacora() {
  const hoy = new Date().toLocaleDateString('en-CA');
  const [searchParams] = useSearchParams();
  const ultimoDiaHabil = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  };
  const [fecha, setFecha] = useState(ultimoDiaHabil);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [alumnoIdAutoselect, setAlumnoIdAutoselect] = useState(searchParams.get('alumnoId'));
  const [actividades, setActividades] = useState(['']);

  const soloLectura = fecha < hoy;

  const irDia = (delta) => {
    const d = new Date(fecha + 'T12:00:00');
    do { d.setDate(d.getDate() + delta); } while (d.getDay() === 0 || d.getDay() === 6);
    const nueva = d.toLocaleDateString('en-CA');
    if (nueva <= hoy) {
      setFecha(nueva);
      setAlumnoSeleccionado(null);
    }
  };

  // Limpiar cache al iniciar componente
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['mi-grupo', fecha],
    queryFn: () => api.get(`/grupos/mi-grupo?fecha=${fecha}`).then(r => r.data),
  });

  const { items: ANIMOS }            = useCatalogo('animo');
  const { items: CUANTO }            = useCatalogo('cuanto-comio');
  const { items: COMPORTAMIENTO }    = useCatalogo('comportamiento');
  const { items: PANIAL_CONDICIONES } = useCatalogo('condiciones-panial');
  const { items: TIEMPOS_COMIDA }    = useCatalogo('tiempos-comida');
  const PANIAL_LABEL = toMap(PANIAL_CONDICIONES);

  const alumnos = (grupo?.alumnos || []).filter(a =>
    ['presente', 'retardo'].includes(a.estado_asistencia)
  );
  const pendientes = alumnos.filter(a => !a.estado_animo);
  const guardadas  = alumnos.filter(a =>  a.estado_animo);

  useEffect(() => {
    if (alumnoIdAutoselect && !alumnoSeleccionado && grupo?.alumnos) {
      const alumno = grupo.alumnos.find(a => a.id === alumnoIdAutoselect);
      if (alumno) {
        setAlumnoSeleccionado({ ...alumno, nivel_codigo: grupo.nivel_codigo });
        setAlumnoIdAutoselect(null);
      }
    }
  }, [alumnoIdAutoselect, alumnoSeleccionado, grupo]);

  const labelFecha = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const [mostrarCaptuaActividades, setMostrarCaptuaActividades] = useState(false);

  return (
    <div className="animate-fade-in">
      {/* Layout dos columnas en desktop */}
      <div className="flex gap-6 max-w-5xl mx-auto">

        {/* Panel izquierdo — lista */}
        <div className={`${alumnoSeleccionado ? 'hidden lg:block' : 'block'} lg:w-72 shrink-0`}>
          <div className="mb-4">
            <h1 className="text-2xl font-black text-gray-800">Bitácora 📋</h1>
            {/* Selector de fecha */}
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => irDia(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-hs-purple/10 hover:bg-hs-purple/20 text-hs-purple transition-all">
                <ChevronLeft size={16} />
              </button>
              <p className="flex-1 text-sm text-gray-600 font-bold capitalize text-center">{labelFecha}</p>
              <button onClick={() => irDia(1)} disabled={fecha >= hoy}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-hs-purple/10 hover:bg-hs-purple/20 text-hs-purple transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
            {soloLectura && (
              <p className="text-xs text-amber-600 font-bold mt-1 text-center">📖 Consultando día anterior</p>
            )}
          </div>

          {/* Panel: Actividades del día */}
          {!soloLectura && grupo && (
            <CaptuaActividadesGrupo
              grupoId={grupo.id}
              fecha={fecha}
              mostrar={mostrarCaptuaActividades}
              setMostrar={setMostrarCaptuaActividades}
            />
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {pendientes.length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                    Pendientes ({pendientes.length})
                  </p>
                  <ListaAlumnos alumnos={pendientes} seleccionado={alumnoSeleccionado}
                  onSeleccionar={a => setAlumnoSeleccionado({ ...a, nivel_codigo: grupo.nivel_codigo })} />
                </div>
              )}
              {guardadas.length > 0 && (
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                    {soloLectura ? `Registradas (${guardadas.length})` : `Guardadas (${guardadas.length})`}
                  </p>
                  <ListaAlumnos alumnos={guardadas} seleccionado={alumnoSeleccionado}
                  onSeleccionar={a => setAlumnoSeleccionado({ ...a, nivel_codigo: grupo.nivel_codigo })} />
                </div>
              )}
              {alumnos.length === 0 && (
                <div className="card-hs text-center py-10 text-gray-400 font-bold">
                  Sin alumnos asignados
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel derecho — formulario */}
        <div className={`${alumnoSeleccionado ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'} flex-1`}>
          {alumnoSeleccionado ? (
            <div>
              {/* Botón volver (solo mobile) */}
              <button
                onClick={() => setAlumnoSeleccionado(null)}
                className="lg:hidden flex items-center gap-2 text-hs-purple font-bold text-sm mb-4"
              >
                <ChevronLeft size={18} /> Volver a la lista
              </button>
              <FormBitacora
                key={alumnoSeleccionado.id}
                alumno={alumnoSeleccionado}
                fecha={fecha}
                soloLectura={soloLectura}
                actividades={actividades}
                setActividades={setActividades}
                onGuardado={() => setAlumnoSeleccionado(null)}
                catalogos={{ ANIMOS, CUANTO, COMPORTAMIENTO, PANIAL_CONDICIONES, TIEMPOS_COMIDA, PANIAL_LABEL }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📋</div>
              <p className="font-black text-xl text-gray-600">Selecciona un alumno</p>
              <p className="text-sm font-semibold mt-2">para llenar su bitácora del día</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

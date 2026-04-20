import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import toast from 'react-hot-toast';

// ── Constantes ────────────────────────────────────────────────────────────────

const ANIMOS = [
  { key: 'feliz',     emoji: '😊', label: 'Feliz'      },
  { key: 'activo',    emoji: '⚡', label: 'Activo'     },
  { key: 'cansado',   emoji: '😴', label: 'Cansado'    },
  { key: 'triste',    emoji: '😢', label: 'Triste'     },
  { key: 'irritable', emoji: '😤', label: 'Irritable'  },
];

const CUANTO = [
  { key: 'todo',      emoji: '🍽️', label: 'Todo'       },
  { key: 'casi_todo', emoji: '🥢', label: 'Casi todo'  },
  { key: 'poco',      emoji: '🍱', label: 'Poco'       },
  { key: 'no_comio',  emoji: '🚫', label: 'No comió'   },
];

// ENUM correcto según schema: muy_bien | bien | necesita_mejorar
const COMPORTAMIENTO = [
  { key: 'muy_bien',         emoji: '⭐', label: 'Muy bien'   },
  { key: 'bien',             emoji: '👍', label: 'Bien'       },
  { key: 'necesita_mejorar', emoji: '⚠️', label: 'A mejorar' },
];

const PANIAL_CONDICIONES = [
  { key: 'limpio', label: '✅ Limpio'  },
  { key: 'orina',  label: '💧 Pipí'   },
  { key: 'heces',  label: '💩 Popó'   },
  { key: 'mixto',  label: '🔄 Mixto'  },
];
const PANIAL_LABEL = Object.fromEntries(PANIAL_CONDICIONES.map(c => [c.key, c.label]));

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

function FormBitacora({ alumno, fecha, soloLectura, onGuardado }) {
  const queryClient = useQueryClient();

  const grupoNivel = (alumno.nivel_codigo || '').toLowerCase();
  const mostrarEsfinteres = !alumno.usa_panial && (
    ['maternal', 'prekinder', 'kinder1'].includes(grupoNivel)
  );

  // Estado del formulario
  const [animo,               setAnimo]               = useState(null);
  const [pipiCount,           setPipiCount]           = useState(0);
  const [popoCount,           setPopoCount]           = useState(0);
  const [queComio,            setQueComio]            = useState('');
  const [cuantoComio,         setCuantoComio]         = useState(null);
  const [observacionesComida, setObservacionesComida] = useState('');
  const [tareaRealizada,      setTareaRealizada]      = useState(null);
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

  // Cargar datos existentes
  const { data, isLoading } = useQuery({
    queryKey: ['bitacora', alumno.id, fecha],
    queryFn: () => api.get(`/bitacora/${alumno.id}?fecha=${fecha}`).then(r => r.data),
  });

  useEffect(() => {
    if (!data) return;
    if (data.bitacora) {
      setAnimo(data.bitacora.estado_animo || null);
      setTareaRealizada(data.bitacora.tarea_realizada ?? null);
      setComportamiento(data.bitacora.comportamiento || null);
      setComportamientoNotas(data.bitacora.comportamiento_notas || '');
      setTuvoFiebre(data.bitacora.tuvo_fiebre || false);
      setTemperatura(data.bitacora.temperatura_dia?.toString() || '');
      setSeEnfermo(data.bitacora.se_enfermo || false);
      setDescEnfermedad(data.bitacora.descripcion_enfermedad || '');
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
      setDescAccidente(data.esfinteres.descripcion_accidente || '');
      setNecesitaAyuda(data.esfinteres.necesito_ayuda ?? null);
      setNotasProgreso(data.esfinteres.notas_progreso || '');
    }
  }, [data]);

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
    mutationFn: (formData) => api.post('/bitacora/incidente', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora', alumno.id, fecha] });
      setIncDesc(''); setIncAcciones(''); setIncFotos([]);
      toast.success('⚠️ Incidente registrado');
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });
  const registrarInc = () => {
    if (!incDesc) { toast.error('Describe el incidente'); return; }
    const fd = new FormData();
    fd.append('alumno_id', alumno.id);
    fd.append('descripcion', incDesc);
    fd.append('acciones_tomadas', incAcciones);
    incFotos.forEach(f => fd.append('fotos', f));
    incMutation.mutate(fd);
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
    guardarMutation.mutate({
      alumno_id: alumno.id,
      fecha,
      estado_animo: animo,
      tarea_realizada: tareaRealizada,
      comportamiento,
      comportamiento_notas: comportamientoNotas,
      tuvo_fiebre: tuvoFiebre,
      temperatura_dia: temperatura ? parseFloat(temperatura) : null,
      se_enfermo: seEnfermo,
      descripcion_enfermedad: descEnfermedad,
      notas,
      pipi_count: pipiCount,
      popo_count: popoCount,
      que_comio: queComio,
      cuanto_comio: cuantoComio,
      observaciones_comida: observacionesComida,
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

  return (
    <div className={`space-y-4 pb-24 ${soloLectura ? 'pointer-events-none select-none opacity-90' : ''}`}>
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
                  <span className="text-gray-700 font-semibold">{PANIAL_LABEL[p.condicion] ?? p.condicion}</span>
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

      {/* Alimentación */}
      <Seccion titulo="🍽️ Alimentación">
        <textarea rows={2} placeholder="¿Qué comió hoy?"
          value={queComio} onChange={e => setQueComio(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />
        <p className="text-xs font-black text-gray-400">¿Cuánto comió?</p>
        <div className="grid grid-cols-4 gap-2">
          {CUANTO.map(c => (
            <button key={c.key} onClick={() => setCuantoComio(c.key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all
                ${cuantoComio === c.key
                  ? 'border-hs-purple bg-hs-purple/10'
                  : 'border-gray-200 hover:border-hs-purple/40'}`}>
              <span className="text-2xl">{c.emoji}</span>
              <span className={`text-xs font-bold ${cuantoComio === c.key ? 'text-hs-purple' : 'text-gray-500'}`}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
        <textarea rows={2} placeholder="Observaciones de comida (opcional)…"
          value={observacionesComida} onChange={e => setObservacionesComida(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />
      </Seccion>

      {/* Tarea */}
      <Seccion titulo="📚 Tarea">
        <div className="flex gap-3">
          <button onClick={() => setTareaRealizada(tareaRealizada === true ? null : true)}
            className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all
              ${tareaRealizada === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            ✓ Sí realizó
          </button>
          <button onClick={() => setTareaRealizada(tareaRealizada === false ? null : false)}
            className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all
              ${tareaRealizada === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            ✗ No realizó
          </button>
        </div>
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
            <div>
              <input type="file" accept="image/*" multiple ref={incFileRef} className="hidden"
                onChange={e => setIncFotos(Array.from(e.target.files))} />
              <button onClick={() => incFileRef.current?.click()}
                className="w-full py-2 rounded-xl font-bold text-sm border-2 border-dashed border-red-300 text-red-500 hover:bg-red-50 transition-all">
                {incFotos.length > 0 ? `📷 ${incFotos.length} foto(s) seleccionada(s)` : '📷 Agregar fotos (opcional)'}
              </button>
            </div>
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
            disabled={guardarMutation.isPending}
            className="w-full max-w-2xl mx-auto block py-4 rounded-2xl font-black text-white text-lg
              bg-hs-green hover:bg-green-600 disabled:opacity-50 transition-all"
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
  const ultimoDiaHabil = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  };
  const [fecha, setFecha] = useState(ultimoDiaHabil);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

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

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['mi-grupo', fecha],
    queryFn: () => api.get(`/grupos/mi-grupo?fecha=${fecha}`).then(r => r.data),
  });

  const alumnos = grupo?.alumnos || [];
  const pendientes = alumnos.filter(a => !a.estado_animo);
  const guardadas  = alumnos.filter(a =>  a.estado_animo);

  const labelFecha = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

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
                alumno={alumnoSeleccionado}
                fecha={fecha}
                soloLectura={soloLectura}
                onGuardado={() => setAlumnoSeleccionado(null)}
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

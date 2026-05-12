import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import SignaturePad from '@/components/ui/SignaturePad';
import { Seccion, FilaInfo, PildoraBool } from '@/components/ui/BitacoraHelpers';

const ANIMO = {
  feliz:     { emoji: '😊', label: 'Feliz'     },
  activo:    { emoji: '⚡', label: 'Activo'    },
  cansado:   { emoji: '😴', label: 'Cansado'   },
  triste:    { emoji: '😢', label: 'Triste'    },
  irritable: { emoji: '😤', label: 'Irritable' },
};

const CUANTO = {
  todo:      { emoji: '😋', label: 'Todo'      },
  casi_todo: { emoji: '😊', label: 'Casi todo' },
  poco:      { emoji: '😐', label: 'Poco'      },
  no_comio:  { emoji: '❌', label: 'No comió'  },
};

const COMPORTAMIENTO = {
  muy_bien:        { emoji: '⭐', label: 'Muy bien',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  bien:            { emoji: '👍', label: 'Bien',      color: 'bg-green-50  text-green-700  border-green-200'  },
  necesita_mejorar:{ emoji: '⚠️', label: 'A mejorar', color: 'bg-red-50    text-red-700    border-red-200'    },
};

const PANIAL_CONDICION = {
  limpio:  '✅ Limpio',
  orina:   '💧 Pipí',
  heces:   '💩 Popó',
  mixto:   '🔄 Mixto',
  diarrea: '⚠️ Diarrea',
};


// Sección de declaración de medicamentos (usada en 2 contextos: sin bitácora aún y tab Salud).
function SeccionMedicamentos({
  recepciones, mostrarFormMed, setMostrarFormMed,
  formMed, setFormMed, horasMed, setHorasMed,
  fotoReceta, setFotoReceta, fotoRecetaRef,
  handleRegistrarMed, recepcionMutation, borrarMedMutation,
}) {
  return (
    <div className="bg-hs-purple/10 border border-hs-purple/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-hs-purple-dark">💊 Medicamentos para hoy</p>
        <button
          onClick={() => setMostrarFormMed(v => !v)}
          className="text-xs font-bold text-hs-purple bg-white border border-hs-purple/20 px-3 py-1.5 rounded-xl hover:bg-hs-purple/10 transition-colors"
        >
          {mostrarFormMed ? 'Cancelar' : '+ Declarar'}
        </button>
      </div>

      {recepciones.length > 0 && (
        <div className="space-y-2">
          {recepciones.map((r, i) => (
            <div key={i} className="bg-white rounded-xl px-3 py-2 border border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-purple-800">{r.nombre}</p>
                  <p className="text-xs text-purple-500 font-semibold">{r.dosis}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    r.tomas?.every(t => t.administrado) ? 'bg-green-100 text-green-700' :
                    r.recibido ? 'bg-blue-100 text-hs-blue-dark' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {r.tomas?.every(t => t.administrado) ? '✅ Dado' : r.recibido ? '📬 Recibido' : '⏳ Pendiente'}
                  </span>
                  {!r.recibido && !r.administrado && (
                    <button
                      onClick={() => borrarMedMutation.mutate(r.id)}
                      disabled={borrarMedMutation.isPending}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
              {r.tomas?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.tomas.map((t, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded bg-hs-purple/10 text-hs-purple font-semibold">
                      {t.hora_programada.substring(0, 5)} {t.administrado ? '✅' : '⏳'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {recepciones.length === 0 && !mostrarFormMed && (
        <p className="text-xs text-purple-400 font-semibold">
          Ninguno declarado. Usa "+ Declarar" si llevas medicamento hoy.
        </p>
      )}

      {mostrarFormMed && (
        <div className="space-y-3 pt-1 border-t border-purple-100">
          <input
            placeholder="Medicamento *  (ej. Ibuprofeno)"
            value={formMed.nombre}
            onChange={e => setFormMed(p => ({ ...p, nombre: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400"
          />
          <input
            placeholder="Dosis *  (ej. 5ml cada 8h)"
            value={formMed.dosis}
            onChange={e => setFormMed(p => ({ ...p, dosis: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400"
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-gray-400 uppercase">Horas programadas</p>
              <button
                onClick={() => setHorasMed(h => [...h, ''])}
                className="text-xs font-bold text-hs-purple bg-white border border-hs-purple/20 px-2 py-1 rounded-lg hover:bg-hs-purple/10"
              >
                ＋ Agregar hora
              </button>
            </div>
            <div className="space-y-2">
              {horasMed.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h}
                    onChange={e => setHorasMed(prev => prev.map((x, i) => i === idx ? e.target.value : x))}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-purple-400"
                  />
                  {horasMed.length > 1 && (
                    <button
                      onClick={() => setHorasMed(prev => prev.filter((_, i) => i !== idx))}
                      className="text-sm text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase mb-1">Foto receta (obligatoria)</p>
            <button
              onClick={() => fotoRecetaRef.current?.click()}
              className={`w-full px-3 py-2 border-2 border-dashed rounded-xl text-xs font-bold transition-colors ${fotoReceta ? 'border-purple-400 bg-hs-purple/10 text-hs-purple-dark' : 'border-gray-300 text-gray-500 hover:border-hs-purple/30'}`}
            >
              {fotoReceta ? `✅ ${fotoReceta.name}` : '📷 Toca para adjuntar foto o PDF'}
            </button>
            <input ref={fotoRecetaRef} type="file" accept="image/*,.pdf" hidden onChange={e => setFotoReceta(e.target.files?.[0] || null)} />
          </div>
          <button
            onClick={handleRegistrarMed}
            disabled={recepcionMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-hs-purple text-white text-sm font-black hover:bg-hs-purple-dark disabled:opacity-50 transition-colors"
          >
            {recepcionMutation.isPending ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

function SelectorCiclo({ ciclos, ciclIdSeleccionado, onChange }) {
  const ciclActual = ciclos.find(c => c.activo);
  const ciclDefault = ciclActual || (ciclos.length > 0 ? ciclos[0] : null);
  const ciclElegido = ciclos.find(c => c.id === ciclIdSeleccionado) || ciclDefault;

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={16} className="text-red-500" />
        <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Ciclo escolar</p>
      </div>
      <select
        value={ciclElegido?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        {ciclos.map(c => (
          <option key={c.id} value={c.id}>
            {c.nombre}{c.activo ? ' (Actual)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

function SelectorFecha({ fecha, onChange }) {
  const date = new Date(fecha + 'T12:00:00');
  const hoy = new Date().toLocaleDateString('en-CA');
  const esHoy = fecha === hoy;

  const moverDias = (delta) => {
    let d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + (delta > 0 ? 1 : -1));
    }
    const nueva = d.toLocaleDateString('en-CA');
    if (nueva <= hoy) onChange(nueva);
  };

  // Saltar 5 días hábiles (≈ 1 semana)
  const irSemanaAnterior = () => {
    let d = new Date(fecha + 'T12:00:00');
    let diasHabiles = 0;
    while (diasHabiles < 5) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) diasHabiles++;
    }
    onChange(d.toLocaleDateString('en-CA'));
  };

  const irSemanaSiguiente = () => {
    let d = new Date(fecha + 'T12:00:00');
    let diasHabiles = 0;
    while (diasHabiles < 5) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) diasHabiles++;
    }
    const nueva = d.toLocaleDateString('en-CA');
    if (nueva <= hoy) onChange(nueva);
  };

  const fmt = d => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-2 mb-4 space-y-1">
      {/* Fila principal: día a día */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => moverDias(-1)}
          className="p-2 rounded-xl hover:bg-red-50 transition-colors"
          title="Día anterior"
        >
          <ChevronLeft size={20} className="text-red-500" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-bold text-gray-700 capitalize">{fmt(date)}</p>
          {esHoy && <p className="text-xs font-black text-red-500">Hoy</p>}
        </div>
        <button
          onClick={() => moverDias(1)}
          disabled={esHoy}
          className={`p-2 rounded-xl transition-colors ${esHoy ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50'}`}
          title="Día siguiente"
        >
          <ChevronRight size={20} className="text-red-500" />
        </button>
      </div>
      {/* Fila secundaria: salto semanal */}
      <div className="flex gap-2 px-1">
        <button
          onClick={irSemanaAnterior}
          className="flex-1 py-1 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
        >
          ← Semana anterior
        </button>
        <button
          onClick={irSemanaSiguiente}
          disabled={esHoy}
          className={`flex-1 py-1 rounded-xl text-xs font-bold transition-colors
            ${esHoy ? 'opacity-30 cursor-not-allowed text-gray-400 bg-gray-50' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
        >
          Semana siguiente →
        </button>
      </div>
    </div>
  );
}

function SelectorHijo({ hijos, alumnoId, nombre, onSelect }) {
  return (
    <div className="space-y-3 mb-6">
      <h2 className="text-base font-black text-gray-700">Selecciona a tu hijo/a</h2>
      {hijos.map(h => (
        <Link
          key={h.id}
          to={`/padre/bitacora?alumnoId=${h.id}&nombre=${encodeURIComponent(h.nombre_completo)}`}
          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
            alumnoId === h.id
              ? 'border-red-400 bg-red-50'
              : 'border-gray-100 bg-white hover:border-red-200'
          }`}
        >
          {h.foto_url
            ? <img src={h.foto_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
            : <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl">👧🏻</div>
          }
          <div>
            <p className="font-black text-gray-800">{h.nombre_completo}</p>
            <p className="text-sm font-semibold text-red-500">{h.grupo_nombre || h.grupo}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function PadreBitacora() {
  const [params] = useSearchParams();
  const alumnoId = params.get('alumnoId');
  const nombreParam = params.get('nombre');
  const hoy = new Date().toLocaleDateString('en-CA');

  // Inicializar en primer día hábil (no fin de semana)
  const getPrimerDiaHabil = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() - 1);
    }
    return d.toLocaleDateString('en-CA');
  };

  const [fecha, setFecha] = useState(getPrimerDiaHabil());
  const [cicloId, setCicloId] = useState(null);
  const [tabActivo, setTabActivo] = useState('comida');
  const [incidenteFirmando, setIncidenteFirmando] = useState(null);
  const tabsRef = useRef(null);
  const queryClient = useQueryClient();
  const fotoRecetaRef = useRef();

  // Medicamentos
  const [formMed, setFormMed] = useState({ nombre: '', dosis: '' });
  const [horasMed, setHorasMed] = useState(['']);
  const [fotoReceta, setFotoReceta] = useState(null);
  const [mostrarFormMed, setMostrarFormMed] = useState(false);

  // Forzar refetch limpiando cache
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const { data: hijosData = {} } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
    staleTime: 0,
    gcTime: 0,
  });
  const hijos = hijosData.hijos || [];

  // Query para entrada histórica (cualquier fecha, no solo hoy)
  const { data: entradaHistorica = null } = useQuery({
    queryKey: ['entrada-historica', alumnoId, fecha],
    queryFn: () => {
      if (!alumnoId || !fecha) return null;
      return api.get(`/asistencia/filtro-entrada/${alumnoId}?fecha=${fecha}`)
        .then(r => r.data)
        .catch(() => null);
    },
    enabled: !!alumnoId && !!fecha,
  });

  const { data: ciclos = [] } = useQuery({
    queryKey: ['ciclos-alumno', alumnoId],
    queryFn: () => alumnoId ? api.get(`/alumnos/${alumnoId}/ciclos`).then(r => r.data) : Promise.resolve([]),
    enabled: !!alumnoId,
  });

  // Establecer ciclo por defecto al cargar ciclos
  useEffect(() => {
    if (ciclos.length > 0 && !cicloId) {
      const ciclActual = ciclos.find(c => c.activo);
      setCicloId(ciclActual?.id || ciclos[0].id);
    }
  }, [ciclos, cicloId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bitacora-padre', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
    enabled: !!alumnoId,
    retry: 1,
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

  const recepcionMutation = useMutation({
    mutationFn: (payload) => api.post('/bitacora/medicamento/recepcion', payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora-padre', alumnoId, fecha] });
      toast.success('💊 Medicamento registrado');
      setFormMed({ nombre: '', dosis: '' });
      setHorasMed(['']);
      setFotoReceta(null);
      setMostrarFormMed(false);
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Error al guardar'),
  });

  const borrarMedMutation = useMutation({
    mutationFn: (id) => api.delete(`/bitacora/medicamento/recepcion/${id}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora-padre', alumnoId, fecha] });
      toast.success('🗑 Medicamento eliminado');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'No se puede eliminar'),
  });

  const handleRegistrarMed = async () => {
    if (!formMed.nombre.trim() || !formMed.dosis.trim()) {
      toast.error('Nombre y dosis son obligatorios'); return;
    }
    if (!fotoReceta) {
      toast.error('Foto de receta es obligatoria'); return;
    }

    // Convertir archivo a Base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const horasValidas = horasMed.filter(h => h.trim());

      const payload = {
        alumno_id: alumnoId,
        nombre: formMed.nombre.trim(),
        dosis: formMed.dosis.trim(),
        horas: horasValidas,
        foto_receta_base64: base64, // Foto en Base64
        foto_receta_name: fotoReceta.name,
      };

      recepcionMutation.mutate(payload);
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo');
    };
    reader.readAsDataURL(fotoReceta);
  };

  const firmaMutation = useMutation({
    mutationFn: (formData) => api.patch(`/bitacora/incidente/${incidenteFirmando.id}/firma`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora-padre', alumnoId, fecha] });
      toast.success('✅ Incidente firmado');
      setIncidenteFirmando(null);
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });

  const handleSign = (signatureDataUrl) => {
    const formData = new FormData();
    const blob = dataURLtoBlob(signatureDataUrl);
    formData.append('firma', blob, 'firma.png');
    firmaMutation.mutate(formData);
  };

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const bit     = data?.bitacora;
  const banio   = data?.banio;
  const comidas = data?.comida || [];
  const panial  = data?.panial || [];
  const esf     = data?.esfinteres;
  const meds         = data?.medicamentos || [];
  const recepciones  = data?.recepciones_medicamento || [];
  const incidentes   = data?.incidentes || [];
  const actividades = data?.actividades || [];
  const salidaMostrada = data?.salida || null;
  const hijoActual = hijos.find(h => h.id === alumnoId);
  const entradaHoy = hijoActual?.filtro_entrada || null;
  const esHoyFecha = fecha === hoy;
  // Priorizar datos históricos si existen (siempre), sino usar datos de hoy
  const entradaMostrada = entradaHistorica || entradaHoy;
  const usaPanial = hijoActual?.usa_panial || false;

  // Calcular avance bitácora (porcentaje de campos completados)
  const calcularAvance = () => {
    if (!bit && comidas.length === 0) return 0;
    let completados = 0;
    let total = 8;
    if (bit?.estado_animo) completados++;
    if (bit?.actividad_realizada !== null && bit?.actividad_realizada !== undefined) completados++;
    if (bit?.comportamiento) completados++;
    if (bit?.tuvo_fiebre) completados++;
    if (comidas.length > 0) completados++;
    if (banio) completados++;
    if (panial.length > 0 || esf) completados++;
    if (meds.length > 0 || incidentes.length > 0) completados++;
    return Math.round((completados / total) * 100);
  };
  const avanceBitacora = calcularAvance();
  const bitacoraFinalizada = avanceBitacora === 100;

  const TIEMPOS = {
    desayuno: { label: 'Desayuno', emoji: '🥐', color: 'bg-hs-orange/10 border-hs-orange/30 text-hs-orange-dark' },
    colacion: { label: 'Colación', emoji: '🍎', color: 'bg-green-50 border-green-200 text-green-700' },
    comida:   { label: 'Comida', emoji: '🍽️', color: 'bg-red-50 border-red-200 text-red-700' },
    comida_extra: { label: 'Comida Extra', emoji: '🍜', color: 'bg-hs-purple/10 border-hs-purple/20 text-hs-purple-dark' },
  };


  const nombreHijo = nombreParam ? decodeURIComponent(nombreParam) : hijoActual?.nombre_completo || 'Mi hijo/a';

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Bitácora</h1>
          {alumnoId && (
            <p className="text-sm font-bold text-red-500 mt-0.5">{nombreHijo}</p>
          )}
        </div>
        {alumnoId && !isLoading && !isError && (bit || comidas.length > 0) && (
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
            bitacoraFinalizada
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-hs-blue-dark'
          }`}>
            {bitacoraFinalizada ? '✅ Finalizada' : `⏳ En curso (${avanceBitacora}%)`}
          </div>
        )}
      </div>

      {/* Selector de hijo */}
      {hijos.length > 1 && (
        <SelectorHijo hijos={hijos} alumnoId={alumnoId} nombreParam={nombreParam} />
      )}

      {!alumnoId && hijos.length === 1 && (
        <Navigate replace to={`/padre/bitacora?alumnoId=${hijos[0].id}&nombre=${encodeURIComponent(hijos[0].nombre_completo)}`} />
      )}

      {alumnoId && ciclos.length > 0 && (
        <>
          <SelectorCiclo ciclos={ciclos} ciclIdSeleccionado={cicloId} onChange={setCicloId} />
          <SelectorFecha fecha={fecha} onChange={setFecha} />
        </>
      )}

      {alumnoId && ciclos.length === 0 && (
        <>
          <SelectorFecha fecha={fecha} onChange={setFecha} />
        </>
      )}

      {alumnoId && (
        <>
          {isLoading && (
            <div className="card-hs p-12 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full" />
            </div>
          )}

          {isError && (
            <div className="card-hs p-8 text-center">
              <div className="text-4xl mb-2">😕</div>
              <p className="text-gray-500 font-semibold">No se pudo cargar la bitácora</p>
            </div>
          )}

          {!isLoading && !isError && !bit && comidas.length === 0 && (
            <div className="space-y-4">
              {/* Declarar medicamento aunque no haya bitácora aún (solo hoy) */}
              {esHoyFecha && (
                <SeccionMedicamentos
                  recepciones={recepciones}
                  mostrarFormMed={mostrarFormMed} setMostrarFormMed={setMostrarFormMed}
                  formMed={formMed} setFormMed={setFormMed}
                  horasMed={horasMed} setHorasMed={setHorasMed}
                  fotoReceta={fotoReceta} setFotoReceta={setFotoReceta}
                  fotoRecetaRef={fotoRecetaRef}
                  handleRegistrarMed={handleRegistrarMed}
                  recepcionMutation={recepcionMutation}
                  borrarMedMutation={borrarMedMutation}
                />
              )}

              <div className="card-hs p-10 text-center">
                <div className="text-5xl mb-3">📝</div>
                <h3 className="font-black text-gray-700 text-lg mb-1">Bitácora no disponible</h3>
                <p className="text-sm text-gray-400 font-semibold">
                  {fecha === hoy
                    ? 'La maestra aún no ha guardado la bitácora de hoy. Vuelve más tarde.'
                    : 'No hay registro para esta fecha.'}
                </p>
              </div>
            </div>
          )}

          {!isLoading && (bit || comidas.length > 0) && (
            <div className="space-y-4">
              {/* Héroe ánimo */}
              {bit && (
                <div className="card-hs p-6 text-center border border-red-100">
                  <div className="text-6xl mb-2">{ANIMO[bit.estado_animo]?.emoji || '🤔'}</div>
                  <p className="text-xl font-black text-gray-800">{ANIMO[bit.estado_animo]?.label || 'Sin registrar'}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-1">Estado de ánimo del día</p>
                </div>
              )}

              {/* ── Tabs ── */}
              <div ref={tabsRef} className="card-hs overflow-hidden">
                <div className="grid grid-cols-4 lg:grid-cols-8 border-b border-gray-100">
                  {[
                    { key: 'entrada',     emoji: '🚪', label: 'Entrada'     },
                    { key: 'salida',      emoji: '👋', label: 'Salida'      },
                    { key: 'comida',      emoji: '🍽️', label: 'Comida'      },
                    { key: 'actividades', emoji: '🎨', label: 'Actividades' },
                    { key: 'tareas',      emoji: '📚', label: 'Tareas'      },
                    { key: 'higiene',     emoji: '🚿', label: 'Higiene'     },
                    { key: 'salud',       emoji: '🌡️', label: 'Salud'       },
                    { key: 'incidentes',  emoji: '⚠️', label: 'Incidentes'  },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setTabActivo(tab.key)}
                      className={`flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors border-b-2 ${
                        tabActivo === tab.key
                          ? 'border-red-500 text-red-600 bg-red-50'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <span className="text-lg">{tab.emoji}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">

                  {/* Entrada */}
                  {tabActivo === 'entrada' && (
                    !entradaMostrada
                      ? <p className="text-center text-sm text-gray-400 font-semibold py-8">Sin registro de entrada para esta fecha</p>
                      : (
                          <div className="space-y-3">
                            {/* Hora de entrada */}
                            <FilaInfo
                              label="Hora de entrada"
                              valor={new Date(entradaMostrada.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            />

                            {/* Retardo */}
                            {entradaMostrada.es_retardo && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-hs-orange/10 border border-hs-orange/30">
                                <span>⏰</span>
                                <span className="text-sm font-bold text-hs-orange-dark">
                                  Retardo #{entradaMostrada.numero_retardo_mes} del mes
                                </span>
                              </div>
                            )}

                            {/* Estado de entrada */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold ${
                              entradaMostrada.puede_entrar
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              <span>{entradaMostrada.puede_entrar ? '✓' : '✗'}</span>
                              {entradaMostrada.puede_entrar ? 'Entrada autorizada' : 'Entrada rechazada'}
                            </div>

                            {/* Motivo rechazo */}
                            {!entradaMostrada.puede_entrar && entradaMostrada.motivo_no_entrada && (
                              <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3">
                                <p className="text-sm font-semibold text-red-700">{entradaMostrada.motivo_no_entrada}</p>
                              </div>
                            )}

                            {/* Checklist */}
                            <div>
                              <p className="text-xs font-black text-gray-500 uppercase mb-2">Checklist de entrada</p>
                              <div className="flex flex-wrap gap-2">
                                <PildoraBool label="Uñas cortadas" valor={entradaMostrada.uñas_cortadas} />
                                <PildoraBool label="Uniforme" valor={entradaMostrada.trae_uniforme} />
                                <PildoraBool label="Bata" valor={entradaMostrada.trae_bata} />
                                <PildoraBool label="Agua suficiente" valor={entradaMostrada.agua_suficiente} />
                                <PildoraBool label="Termo" valor={entradaMostrada.trae_termo} />
                                <PildoraBool label="Sin lagañas" valor={entradaMostrada.sin_lagañas} />
                                <PildoraBool label="Sin fiebre" valor={entradaMostrada.sin_fiebre} />
                                <PildoraBool label="Sin síntomas" valor={entradaMostrada.sin_sintomas} />
                                {hijoActual?.usa_panial && <PildoraBool label="Trajo pañales" valor={entradaMostrada.trajo_paniales} />}
                                {entradaMostrada.trajo_toallitas && <PildoraBool label="Trajo toallitas" valor={true} />}
                              </div>
                            </div>
                          </div>
                        )
                  )}

                  {/* Salida */}
                  {tabActivo === 'salida' && (
                    !salidaMostrada
                      ? <p className="text-center text-sm text-gray-400 font-semibold py-8">Sin registro de salida para esta fecha</p>
                      : (
                          <div className="space-y-3">
                            {/* Hora de salida */}
                            <FilaInfo
                              label="Hora de salida"
                              valor={new Date(salidaMostrada.hora_salida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            />

                            {/* Quién recogió */}
                            {salidaMostrada.nombre_quien_recoge && (
                              <FilaInfo label="Recogido por" valor={salidaMostrada.nombre_quien_recoge} />
                            )}

                            {/* Salida anticipada */}
                            {salidaMostrada.es_anticipada && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                                <span>⚠️</span>
                                <span className="text-sm font-bold text-yellow-700">
                                  Salida anticipada{salidaMostrada.motivo_salida ? `: ${salidaMostrada.motivo_salida}` : ''}
                                </span>
                              </div>
                            )}

                            {/* Checklist sanitario */}
                            {(salidaMostrada.panial_limpio !== null || salidaMostrada.pertenencias_ok !== null || salidaMostrada.estado_fisico_ok !== null || salidaMostrada.entrega_conforme !== null) && (
                              <div>
                                <p className="text-xs font-black text-gray-500 uppercase mb-2">Checklist de salida</p>
                                <div className="flex flex-wrap gap-2">
                                  {salidaMostrada.estado_fisico_ok !== null && <PildoraBool label="Estado físico OK" valor={salidaMostrada.estado_fisico_ok} />}
                                  {salidaMostrada.pertenencias_ok !== null && <PildoraBool label="Pertenencias completas" valor={salidaMostrada.pertenencias_ok} />}
                                  {salidaMostrada.panial_limpio !== null && <PildoraBool label="Pañal limpio" valor={salidaMostrada.panial_limpio} />}
                                  {salidaMostrada.entrega_conforme !== null && <PildoraBool label="Entrega conforme" valor={salidaMostrada.entrega_conforme} />}
                                </div>
                              </div>
                            )}

                            {/* Notas sanitarias */}
                            {salidaMostrada.notas && (
                              <div className="bg-blue-50 border-l-4 border-blue-300 rounded-xl p-3">
                                <p className="text-xs font-black text-blue-500 uppercase mb-1">Notas</p>
                                <p className="text-sm font-semibold text-blue-800">{salidaMostrada.notas}</p>
                              </div>
                            )}
                          </div>
                        )
                  )}

                  {/* Comida */}
                  {tabActivo === 'comida' && (
                    comidas.length > 0 ? (
                      <div className="space-y-3">
                        {[...comidas]
                          .sort((a, b) => ['desayuno','colacion','comida','comida_extra'].indexOf(a.tiempo) - ['desayuno','colacion','comida','comida_extra'].indexOf(b.tiempo))
                          .filter(c => c.tiempo !== 'comida_extra' || tuvExtensionEnFecha)
                          .map((c, i) => (
                            <div key={i} className={`border rounded-lg p-3 ${TIEMPOS[c.tiempo]?.color || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                              <p className="text-xs font-black uppercase mb-2">{TIEMPOS[c.tiempo]?.emoji} {TIEMPOS[c.tiempo]?.label}</p>
                              {c.que_comio && <p className="text-sm font-semibold mb-1">{c.que_comio}</p>}
                              {c.cuanto_comio && <FilaInfo label="¿Cuánto?" valor={CUANTO[c.cuanto_comio]?.emoji + ' ' + CUANTO[c.cuanto_comio]?.label || c.cuanto_comio} />}
                              {c.observaciones && <p className="text-xs text-gray-600 mt-2 italic">{c.observaciones}</p>}
                            </div>
                          ))}
                      </div>
                    ) : <p className="text-center text-sm text-gray-400 font-semibold py-6">Sin registro de alimentación</p>
                  )}

                  {/* Actividades */}
                  {tabActivo === 'actividades' && (
                    <div className="space-y-3">
                      {bit?.actividad_realizada !== null && bit?.actividad_realizada !== undefined && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold ${
                          bit.actividad_realizada ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          <span className="text-xl">{bit.actividad_realizada ? '✓' : '✗'}</span>
                          {bit.actividad_realizada ? 'Participó en actividades' : 'No participó en actividades'}
                        </div>
                      )}
                      {actividades.map((act, i) => (
                        <div key={i} className="rounded-xl border-2 border-purple-100 overflow-hidden">
                          {/* Foto de referencia de la actividad */}
                          {act.foto_url && (
                            <a href={act.foto_url} target="_blank" rel="noreferrer">
                              <img src={act.foto_url} alt={act.descripcion} className="w-full h-40 object-cover hover:opacity-90 transition-opacity" />
                            </a>
                          )}
                          <div className="p-3 space-y-2">
                            {act.descripcion && <p className="text-sm font-semibold text-gray-700">{act.descripcion}</p>}
                            {act.participo !== null && act.participo !== undefined && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                act.participo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {act.participo ? '✓ Participó' : '✗ No participó'}
                              </span>
                            )}
                            {/* Fotos del alumno haciendo la actividad */}
                            {act.fotos_alumno?.length > 0 && (
                              <div className="pt-2 border-t border-purple-100">
                                <p className="text-xs font-black text-hs-purple uppercase mb-2">📷 Fotos del alumno</p>
                                <div className="flex flex-wrap gap-2">
                                  {act.fotos_alumno.map(foto => (
                                    <a key={foto.id} href={foto.foto_url} target="_blank" rel="noreferrer">
                                      <img src={foto.foto_url} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-purple-200 hover:opacity-90 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {bit?.actividad_realizada === null && bit?.actividad_realizada === undefined && actividades.length === 0 && (
                        <p className="text-center text-sm text-gray-400 font-semibold py-6">Sin actividades registradas</p>
                      )}
                    </div>
                  )}

                  {/* Higiene */}
                  {tabActivo === 'higiene' && (
                    <div className="space-y-3">
                      {!usaPanial && banio && (
                        <div className="flex gap-6 justify-center py-2">
                          <div className="text-center">
                            <p className="text-4xl font-black text-gray-800">{banio.pipi_count || 0}</p>
                            <p className="text-sm font-bold text-gray-500 mt-1">Pipí 🚿</p>
                          </div>
                          <div className="text-center">
                            <p className="text-4xl font-black text-gray-800">{banio.popo_count || 0}</p>
                            <p className="text-sm font-bold text-gray-500 mt-1">Popó 💩</p>
                          </div>
                        </div>
                      )}
                      {panial.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-black text-gray-500 uppercase">👶🏻 Cambios de pañal</p>
                          {panial.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                              <span className="text-xs font-black text-hs-purple w-12">
                                {new Date(p.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                {PANIAL_CONDICION[p.condicion] ?? p.condicion}
                                {p.tiene_irritacion ? ' · ⚠️ irritación' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {esf && (
                        <div className="space-y-2">
                          <p className="text-xs font-black text-gray-500 uppercase">🚽 Control de esfínteres</p>
                          <div className="flex flex-wrap gap-2">
                            <PildoraBool label="Fue solo/a"     valor={esf.fue_solo}      />
                            <PildoraBool label="Pidió ir"       valor={esf.pidio_ir}       />
                            <PildoraBool label="Accidente"      valor={esf.tuvo_accidente} />
                            <PildoraBool label="Necesitó ayuda" valor={esf.necesito_ayuda} />
                          </div>
                          <FilaInfo label="Notas de progreso" valor={esf.notas_progreso} />
                        </div>
                      )}
                      {!banio && panial.length === 0 && !esf && (
                        <p className="text-center text-sm text-gray-400 font-semibold py-6">Sin registros de higiene</p>
                      )}
                    </div>
                  )}

                  {/* Salud */}
                  {tabActivo === 'salud' && (
                    <div className="space-y-3">

                      {/* ── Declarar medicamento (solo hoy) ── */}
                      {esHoyFecha && (
                        <SeccionMedicamentos
                          recepciones={recepciones}
                          mostrarFormMed={mostrarFormMed} setMostrarFormMed={setMostrarFormMed}
                          formMed={formMed} setFormMed={setFormMed}
                          horasMed={horasMed} setHorasMed={setHorasMed}
                          fotoReceta={fotoReceta} setFotoReceta={setFotoReceta}
                          fotoRecetaRef={fotoRecetaRef}
                          handleRegistrarMed={handleRegistrarMed}
                          recepcionMutation={recepcionMutation}
                          borrarMedMutation={borrarMedMutation}
                        />
                      )}

                      {bit?.tuvo_fiebre && (
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3">
                          <p className="text-sm font-bold text-red-700">
                            🌡 Tuvo fiebre{bit.temperatura_dia ? ` — ${bit.temperatura_dia}°C` : ''}
                          </p>
                        </div>
                      )}
                      {bit?.se_enfermo && (
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3">
                          <p className="text-sm font-bold text-red-700">
                            ⚕️ {bit.descripcion_enfermedad || 'Presentó malestar'}
                          </p>
                        </div>
                      )}
                      {meds.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-black text-gray-500 uppercase">💊 Medicamentos</p>
                          {meds.map((m, i) => (
                            <div key={i} className="bg-hs-purple/10 rounded-xl p-3">
                              <p className="font-black text-purple-800">{m.nombre}</p>
                              <p className="text-xs text-hs-purple font-semibold mt-0.5">
                                Dosis: {m.dosis} · {new Date(m.hora_administracion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {m.notas && <p className="text-xs text-gray-500 mt-1">{m.notas}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {data?.vomitos?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-hs-orange-dark">🤢 Vómitos</h4>
                          {data.vomitos.map((v, i) => (
                            <div key={i} className="bg-hs-orange/10 rounded-lg p-3 text-sm">
                              <span className="font-medium">{v.hora?.substring(0, 5)}</span>
                              {' — '}<span className="capitalize">{v.intensidad}</span>
                              {v.notas && <span className="text-gray-600"> · {v.notas}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {data?.panial?.some(p => p.es_diarrea) && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 flex items-center gap-2">
                          <span>⚠️</span>
                          <span className="text-red-800 font-semibold">Deposición anormal registrada hoy</span>
                        </div>
                      )}
                      {!bit?.tuvo_fiebre && !bit?.se_enfermo && meds.length === 0 && data?.vomitos?.length === 0 && !data?.panial?.some(p => p.es_diarrea) && (
                        <p className="text-center text-sm text-gray-400 font-semibold py-6">Sin registros de salud</p>
                      )}
                    </div>
                  )}

                  {/* Tareas */}
                  {tabActivo === 'tareas' && (() => {
                    const tareasHoy = (data?.tareas || []).filter(t => {
                      const fechaLimiteStr = t.fecha_limite.substring(0, 10);
                      return fechaLimiteStr === fecha;
                    });
                    return tareasHoy.length > 0 ? (
                      <div className="space-y-3">
                        {tareasHoy.map((t, i) => (
                          <div key={i} className="bg-hs-blue/10 border-l-4 border-hs-blue/50 rounded-xl p-3 space-y-2">
                            <p className="text-sm font-black text-hs-blue-dark">{t.titulo}</p>
                            {t.descripcion && <p className="text-xs text-hs-blue-dark">{t.descripcion}</p>}
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                t.completada
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {t.completada ? '✅ Entregada' : '⏳ Pendiente'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-center text-sm text-gray-400 font-semibold py-6">Sin tareas para hoy 📚</p>;
                  })()}

                  {/* Incidentes */}
                  {tabActivo === 'incidentes' && (
                    incidentes.length > 0 ? (
                      <div className="space-y-3">
                        {incidentes.map((inc, i) => (
                          <div key={i} className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3 space-y-2">
                            <p className="text-sm font-black text-red-800">{inc.descripcion}</p>
                            {inc.acciones_tomadas && <p className="text-xs text-red-600">Acciones: {inc.acciones_tomadas}</p>}
                            {inc.fotos_urls?.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {inc.fotos_urls.map((url, j) => (
                                  <a key={j} href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt="Foto" className="w-16 h-16 object-cover rounded-lg border border-red-200" />
                                  </a>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-red-400">
                              {new Date(inc.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {inc.firma_padre_url ? (
                              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg text-xs">
                                <span className="text-sm">✅ Firmado</span>
                                <span className="text-gray-500">{new Date(inc.firma_fecha).toLocaleDateString('es-MX')}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setIncidenteFirmando(inc)}
                                disabled={firmaMutation.isPending}
                                className="w-full px-3 py-2 rounded-lg font-bold text-xs bg-hs-blue text-white hover:bg-hs-blue-dark disabled:opacity-50 transition-colors"
                              >
                                {firmaMutation.isPending ? '⏳ Firmando...' : '✍️ Firmar para confirmar enterado'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-center text-sm text-gray-400 font-semibold py-6">Sin incidentes hoy ✅</p>
                  )}
                </div>
              </div>

              {/* Conducta — siempre visible debajo de tabs */}
              {bit?.comportamiento && (
                <Seccion titulo="Conducta" emoji="🌟" colorTitulo="text-red-500" padding="p-5">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold ${COMPORTAMIENTO[bit.comportamiento]?.color}`}>
                    <span className="text-xl">{COMPORTAMIENTO[bit.comportamiento]?.emoji}</span>
                    {COMPORTAMIENTO[bit.comportamiento]?.label}
                  </div>
                  <FilaInfo label="Notas" valor={bit.comportamiento_notas} />
                </Seccion>
              )}

              {/* Notas de la maestra — siempre visibles */}
              {bit?.notas && (
                <Seccion titulo="Mensaje de la maestra" emoji="💬" colorTitulo="text-red-500" padding="p-5">
                  <p className="text-sm text-gray-600 italic bg-yellow-50 rounded-xl p-3 leading-relaxed">
                    {bit.notas}
                  </p>
                </Seccion>
              )}

              {/* Foto del día */}
              {bit?.foto_url && (
                <Seccion titulo="Foto del día" emoji="📷" colorTitulo="text-red-500" padding="p-5">
                  <a href={bit.foto_url} target="_blank" rel="noreferrer">
                    <img src={bit.foto_url} alt="Foto del día"
                      className="w-full max-w-sm rounded-xl border-2 border-gray-200 hover:opacity-90 transition-opacity" />
                  </a>
                </Seccion>
              )}

              {bit.maestra_nombre && (
                <p className="text-center text-xs text-gray-400 font-semibold pb-2">
                  Registrado por {bit.maestra_nombre}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal firma */}
      {incidenteFirmando && (
        <SignaturePad
          onSign={handleSign}
          onCancel={() => setIncidenteFirmando(null)}
        />
      )}
    </div>
  );
}

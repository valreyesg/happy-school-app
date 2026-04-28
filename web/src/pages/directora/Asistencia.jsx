import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Orden de niveles — se construye dinámicamente del backend, no hardcodeado
function buildNivelOrden(grupos) {
  const orden = {};
  grupos.forEach(g => {
    if (g.nivel && !(g.nivel in orden)) orden[g.nivel] = Object.keys(orden).length;
  });
  return orden;
}

const ESTADO_STYLE = {
  presente:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Presente',     emoji: '✅' },
  retardo:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Retardo',       emoji: '⏰' },
  no_entrada: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'No entró',      emoji: '🚫' },
  justificado: { bg: 'bg-blue-100',  text: 'text-blue-700',   label: 'Justificado',   emoji: '📋' },
  ausente:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Sin registrar', emoji: '⬜' },
};

const ESTADO_CELDA = {
  presente:   { bg: 'bg-green-400',  title: 'Presente' },
  retardo:    { bg: 'bg-yellow-400', title: 'Retardo' },
  no_entrada: { bg: 'bg-red-500',    title: 'No entró' },
  justificado: { bg: 'bg-blue-400',  title: 'Justificado' },
};

function Check({ val, label }) {
  if (val === null || val === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-xl
      ${val ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {val ? '✅' : '❌'} {label}
    </span>
  );
}

function FilaAlumno({ alumno }) {
  const [abierto, setAbierto] = useState(false);
  const cfg = ESTADO_STYLE[alumno.estado_asistencia] || ESTADO_STYLE.ausente;
  const tieneRegistro = alumno.hora_entrada != null;

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => tieneRegistro && setAbierto(v => !v)}
        className={`w-full flex items-center gap-3 p-4 text-left bg-white transition-colors
          ${tieneRegistro ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
      >
        <AvatarAlumno alumno={alumno} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 text-sm truncate">{alumno.nombre_completo}</p>
          {alumno.hora_entrada && (
            <p className="text-xs text-gray-400 font-semibold">
              🕐 {new Date(alumno.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              {alumno.numero_retardo_mes > 0 && (
                <span className="ml-2 text-yellow-600">· Retardo #{alumno.numero_retardo_mes}</span>
              )}
            </p>
          )}
        </div>
        <span className={`text-xs font-black px-2 py-1 rounded-xl ${cfg.bg} ${cfg.text}`}>
          {cfg.emoji} {cfg.label}
        </span>
        {tieneRegistro && (
          abierto
            ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {abierto && tieneRegistro && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-3">
          {alumno.motivo_no_entrada && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm font-bold text-red-700">
              🚫 {alumno.motivo_no_entrada}
            </div>
          )}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Salud</p>
            <div className="flex flex-wrap gap-2">
              <Check val={alumno.sin_fiebre}   label="Sin fiebre" />
              <Check val={alumno.sin_sintomas} label="Sin síntomas" />
              {alumno.temperatura && (
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-xl">
                  🌡️ {alumno.temperatura}°C
                </span>
              )}
              {!alumno.sin_sintomas && alumno.sintomas_notas && (
                <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-xl">
                  {alumno.sintomas_notas}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Higiene</p>
            <div className="flex flex-wrap gap-2">
              <Check val={alumno.uñas_cortadas} label="Uñas" />
              <Check val={alumno.sin_lagañas}   label="Sin lagañas" />
              {alumno.panial_limpio !== null && (
                <Check val={alumno.panial_limpio} label="Pañal" />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Materiales</p>
            <div className="flex flex-wrap gap-2">
              <Check val={alumno.trae_uniforme}   label="Uniforme" />
              <Check val={alumno.trae_bata}       label="Bata" />
              <Check val={alumno.trae_termo}      label="Termo" />
              <Check val={alumno.agua_suficiente} label="Agua" />
            </div>
          </div>
          {alumno.qr_escaneado && (
            <p className="text-xs font-semibold text-purple-600">📱 Entrada por QR</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Vista mensual ─────────────────────────────────────────────────────────────

function VistaMensual({ grupoId }) {
  const queryClient = useQueryClient();
  const hoy = new Date();
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [justificandoModal, setJustificandoModal] = useState(null);
  const [motivoJustificacion, setMotivoJustificacion] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);

  const { data: alumnos = [], isLoading } = useQuery({
    queryKey: ['asistencia-mensual', grupoId, mes, anio],
    queryFn: () => api.get(`/asistencia/grupo/${grupoId}/mensual?mes=${mes}&anio=${anio}`).then(r => r.data),
    enabled: !!grupoId,
  });

  const justificarMutation = useMutation({
    mutationFn: ({ alumnoId, fecha, motivo, comprobante }) => {
      const formData = new FormData();
      formData.append('fecha', fecha);
      formData.append('motivo', motivo);
      if (comprobante) formData.append('comprobante', comprobante);
      return api.patch(`/asistencia/${alumnoId}/justificar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencia-mensual', grupoId, mes, anio] });
      setJustificandoModal(null);
      setMotivoJustificacion('');
      setComprobanteFile(null);
      toast.success('✅ Ausencia justificada');
    },
    onError: (err) => toast.error(`Error: ${err?.response?.data?.error || err.message}`),
  });

  const justificarAusencia = () => {
    if (!motivoJustificacion.trim()) {
      toast.error('Escribe el motivo de la justificación');
      return;
    }
    justificarMutation.mutate({
      alumnoId: justificandoModal.alumnoId,
      fecha: justificandoModal.fecha,
      motivo: motivoJustificacion,
      comprobante: comprobanteFile,
    });
  };

  const diasEnMes = new Date(anio, mes, 0).getDate();
  const dias = Array.from({ length: diasEnMes }, (_, i) => {
    const d = new Date(anio, mes - 1, i + 1);
    return { num: i + 1, esFinde: d.getDay() === 0 || d.getDay() === 6 };
  });

  const nombreMes = new Date(anio, mes - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  const prev = () => { if (mes === 1) { setMes(12); setAnio(a => a - 1); } else setMes(m => m - 1); };
  const next = () => { if (mes === 12) { setMes(1); setAnio(a => a + 1); } else setMes(m => m + 1); };

  const pad = n => String(n).padStart(2, '0');

  return (
    <div className="space-y-4">
      {/* Navegador de mes */}
      <div className="flex items-center gap-3">
        <button onClick={prev} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <p className="font-black text-gray-800 capitalize flex-1 text-center">{nombreMes}</p>
        <button onClick={next} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex gap-3 text-xs font-bold flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Presente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Retardo</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> No entró</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Justificado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Sin dato</span>
      </div>

      {isLoading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 scrollbar-hidden">
          <table className="text-xs border-collapse min-w-full">
            <thead>
              <tr>
                <th className="bg-gray-50 text-left px-3 py-2 font-black text-gray-700 sticky left-0 z-10 min-w-[140px]">
                  Alumno
                </th>
                {dias.map(d => (
                  <th key={d.num}
                    className={`px-1 py-2 font-bold text-center min-w-[28px]
                      ${d.esFinde ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                    {d.num}
                  </th>
                ))}
                <th className="bg-gray-50 px-2 py-2 font-black text-gray-700 text-center min-w-[60px]">✅</th>
                <th className="bg-gray-50 px-2 py-2 font-black text-gray-700 text-center min-w-[60px]">⏰</th>
                <th className="bg-gray-50 px-2 py-2 font-black text-gray-700 text-center min-w-[60px]">🚫</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno, idx) => {
                let presentes = 0, retardos = 0, noEntradas = 0;
                return (
                  <tr key={alumno.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-3 py-1.5 font-bold text-gray-700 sticky left-0 bg-inherit border-r border-gray-100 truncate max-w-[140px]">
                      {alumno.nombre_completo.split(' ').slice(0, 2).join(' ')}
                    </td>
                    {dias.map(d => {
                      const key = `${anio}-${pad(mes)}-${pad(d.num)}`;
                      const estado = alumno.dias[key];
                      if (estado === 'presente') presentes++;
                      else if (estado === 'retardo') { presentes++; retardos++; }
                      else if (estado === 'no_entrada') noEntradas++;
                      else if (estado === 'justificado') presentes++;
                      const cfg = ESTADO_CELDA[estado];
                      const isAusente = !estado || (!d.esFinde && !cfg);
                      const fecha = `${anio}-${pad(mes)}-${pad(d.num)}`;
                      return (
                        <td
                          key={d.num}
                          className={`text-center py-1 relative group ${d.esFinde ? 'opacity-30' : ''} ${isAusente && !d.esFinde ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (isAusente && !d.esFinde) {
                              setJustificandoModal({ alumnoId: alumno.id, fecha });
                              setMotivoJustificacion('');
                            }
                          }}
                          title={isAusente && !d.esFinde ? 'Click para justificar ausencia' : undefined}
                        >
                          {cfg
                            ? <span className={`inline-block w-5 h-5 rounded ${cfg.bg}`} title={cfg.title} />
                            : <span className={`inline-block w-5 h-5 rounded ${isAusente && !d.esFinde ? 'bg-gray-200 hover:bg-yellow-200 transition-colors' : 'bg-gray-200 opacity-40'}`} />
                          }
                        </td>
                      );
                    })}
                    <td className="text-center font-black text-green-700">{presentes}</td>
                    <td className="text-center font-black text-yellow-600">{retardos}</td>
                    <td className="text-center font-black text-red-600">{noEntradas}</td>
                  </tr>
                );
              })}
              {alumnos.length === 0 && (
                <tr>
                  <td colSpan={diasEnMes + 4} className="text-center py-8 text-gray-400 font-bold">
                    Sin datos de asistencia para este mes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal justificación */}
      {justificandoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-black text-gray-800">📋 Justificar ausencia</h3>
            <p className="text-sm text-gray-600">
              <strong>{alumnos.find(a => a.id === justificandoModal.alumnoId)?.nombre_completo}</strong>
              {' · '}
              <strong>{new Date(justificandoModal.fecha + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
            </p>
            <textarea
              placeholder="Motivo de la justificación…"
              value={motivoJustificacion}
              onChange={e => setMotivoJustificacion(e.target.value)}
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400 resize-none"
            />
            <div className="space-y-2">
              <label className="block">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setComprobanteFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>
              {comprobanteFile && (
                <p className="text-xs text-green-600 font-semibold">✅ {comprobanteFile.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={justificarAusencia}
                disabled={justificarMutation.isPending}
                className="flex-1 py-3 rounded-xl font-black text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                {justificarMutation.isPending ? 'Guardando…' : '💾 Justificar'}
              </button>
              <button
                onClick={() => {
                  setJustificandoModal(null);
                  setMotivoJustificacion('');
                  setComprobanteFile(null);
                }}
                disabled={justificarMutation.isPending}
                className="px-4 py-3 rounded-xl font-black text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────────

export default function DirectoraAsistencia() {
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [modo, setModo] = useState('hoy'); // 'hoy' | 'mensual'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().slice(0, 10));

  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaActualLabel = new Date(fechaSeleccionada + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: grupos } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const nivelOrden = grupos?.length ? buildNivelOrden(grupos) : {};

  useEffect(() => {
    if (grupos?.length && !grupoSeleccionado) {
      const gruposOrdenados = [...grupos].sort((a, b) => (nivelOrden[a.nivel] ?? 99) - (nivelOrden[b.nivel] ?? 99));
      setGrupoSeleccionado(gruposOrdenados[0].id);
    }
  }, [grupos]);

  const { data: alumnos = [], isLoading } = useQuery({
    queryKey: ['asistencia-grupo', grupoSeleccionado, fechaSeleccionada],
    queryFn: () => api.get(`/asistencia/grupo/${grupoSeleccionado}`, {
      params: { fecha: fechaSeleccionada }
    }).then(r => r.data),
    enabled: !!grupoSeleccionado && modo === 'hoy',
    refetchInterval: 30000,
  });

  const grupoActual = grupos?.find(g => g.id === grupoSeleccionado);

  const stats = {
    presentes:  alumnos.filter(a => ['presente','retardo'].includes(a.estado_asistencia)).length,
    retardos:   alumnos.filter(a => a.estado_asistencia === 'retardo').length,
    ausentes:   alumnos.filter(a => a.estado_asistencia === 'ausente').length,
    no_entrada: alumnos.filter(a => a.estado_asistencia === 'no_entrada').length,
  };

  const irAlDia = (direccion) => {
    // Parsear con T12:00 para evitar desfase UTC → día anterior en timezone local
    const f = new Date(fechaSeleccionada + 'T12:00');
    f.setDate(f.getDate() + direccion);
    while (f.getDay() === 0 || f.getDay() === 6) {
      f.setDate(f.getDate() + (direccion > 0 ? 1 : -1));
    }
    const yyyy = f.getFullYear();
    const mm = String(f.getMonth() + 1).padStart(2, '0');
    const dd = String(f.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Asistencia 📋</h1>
          {modo === 'hoy' ? (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => irAlDia(-1)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
              >
                <ChevronLeft size={20} />
              </button>
              <p className="text-gray-500 font-semibold capitalize text-center min-w-32">{fechaActualLabel}</p>
              <button
                onClick={() => irAlDia(1)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <p className="text-gray-500 font-semibold capitalize mt-1">{hoy}</p>
          )}
        </div>
        {/* Toggle hoy / mensual */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {[{ id: 'hoy', label: 'Hoy' }, { id: 'mensual', label: 'Mensual' }].map(m => (
            <button
              key={m.id}
              onClick={() => setModo(m.id)}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all
                ${modo === m.id ? 'bg-white shadow text-hs-purple' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs de grupos ordenados por nivel */}
      {grupos && (
        <div className="flex gap-2 flex-wrap">
          {[...grupos].sort((a, b) => (nivelOrden[a.nivel] ?? 99) - (nivelOrden[b.nivel] ?? 99)).map(g => (
            <button
              key={g.id}
              onClick={() => setGrupoSeleccionado(g.id)}
              className="px-4 py-2 rounded-2xl text-sm font-black transition-all border-2"
              style={grupoSeleccionado === g.id
                ? { background: g.color_hex, color: '#fff', borderColor: g.color_hex }
                : { background: '#fff', color: g.color_hex, borderColor: g.color_hex + '60' }}
            >
              {g.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Vista HOY */}
      {modo === 'hoy' && (
        <>
          {grupoActual && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'En escuela', val: stats.presentes,  bg: 'bg-green-50',  text: 'text-green-700',  emoji: '✅' },
                { label: 'Retardos',   val: stats.retardos,   bg: 'bg-yellow-50', text: 'text-yellow-700', emoji: '⏰' },
                { label: 'Ausentes',   val: stats.ausentes,   bg: 'bg-gray-50',   text: 'text-gray-600',   emoji: '⬜' },
                { label: 'No entró',   val: stats.no_entrada, bg: 'bg-red-50',    text: 'text-red-700',    emoji: '🚫' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
                  <p className={`text-2xl font-black ${s.text}`}>{s.emoji} {s.val}</p>
                  <p className={`text-xs font-bold ${s.text} mt-1`}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {alumnos.map(a => <FilaAlumno key={a.id} alumno={a} />)}
              {alumnos.length === 0 && (
                <div className="card-hs text-center py-12 text-gray-400 font-bold">
                  Sin alumnos en este grupo
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Vista MENSUAL */}
      {modo === 'mensual' && grupoSeleccionado && (
        <VistaMensual grupoId={grupoSeleccionado} />
      )}
    </div>
  );
}

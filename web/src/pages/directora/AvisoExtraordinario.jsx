import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Megaphone, Send, Users, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

function formatearFecha(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  const horas = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
  const h12 = (horas % 12 || 12).toString().padStart(2, '0');
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${h12}:${mins} ${ampm}`;
}

function GrupoCard({ grupoNombre, padres, expandido, onToggle }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold text-gray-700">{grupoNombre} ({padres.length})</span>
        {expandido ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
      </button>
      {expandido && (
        <div className="divide-y divide-gray-100 bg-gray-50">
          {padres.map((p) => (
            <div key={p.id} className="px-3 py-1.5 text-xs">
              <p className="font-bold text-gray-700">{p.padre_nombre}</p>
              <p className="text-gray-500">{p.alumno_nombre}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EstadoAviso({ avisoId, titulo, fechaEnvio, expandido, onToggle }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['aviso-estado', avisoId],
    queryFn: () => api.get(`/notificaciones/aviso-extraordinario/estado/${avisoId}`).then(r => r.data),
    refetchInterval: expandido ? 30000 : false,
  });

  const [tab, setTab] = useState('sin-leer');
  const [expandidosGrupos, setExpandidosGrupos] = useState(new Set());

  const pct = data && data.total > 0 ? Math.round((data.leidas / data.total) * 100) : 0;
  const sinLeer = data?.detalle?.filter(d => !d.leida) || [];
  const leidos = data?.detalle?.filter(d => d.leida) || [];

  const agruparPorGrupo = (lista) => {
    const grupos = {};
    lista.forEach(item => {
      if (!grupos[item.grupo_nombre]) grupos[item.grupo_nombre] = [];
      grupos[item.grupo_nombre].push(item);
    });
    return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const sinLeerPorGrupo = agruparPorGrupo(sinLeer);
  const leidosPorGrupo = agruparPorGrupo(leidos);

  const toggleGrupo = (grupoNombre) => {
    setExpandidosGrupos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(grupoNombre)) {
        newSet.delete(grupoNombre);
      } else {
        newSet.add(grupoNombre);
      }
      return newSet;
    });
  };

  return (
    <div className="card-hs overflow-hidden">
      {/* Cabecera colapsable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-black text-gray-800">{titulo}</p>
          <p className="text-xs font-semibold text-hs-orange mt-0.5">📅 Enviado: {fechaEnvio}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {data && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              data.pendientes === 0 ? 'bg-green-100 text-green-700' : 'bg-hs-orange/20 text-hs-orange-dark'
            }`}>
              {data.pendientes === 0 ? '✓ Todos leyeron' : `${data.pendientes} sin leer`}
            </span>
          )}
          {expandido ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Detalle expandible */}
      {expandido && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-2">Cargando...</p>
          ) : !data ? (
            <p className="text-sm text-gray-400 text-center py-2">Error cargando datos</p>
          ) : (
            <>
              {/* Barra de progreso */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>{data.leidas} de {data.total} vieron el aviso</span>
                  <div className="flex items-center gap-2">
                    <span>{pct}%</span>
                    <button
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {data.total > 0 ? (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setTab('sin-leer')}
                      className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                        tab === 'sin-leer'
                          ? 'text-hs-orange-dark border-orange-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Sin leer ({sinLeer.length})
                    </button>
                    <button
                      onClick={() => setTab('leidos')}
                      className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                        tab === 'leidos'
                          ? 'text-green-600 border-green-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Vieron ({leidos.length})
                    </button>
                  </div>

                  {/* Contenido tabs */}
                  {tab === 'sin-leer' && sinLeer.length > 0 && (
                    <div className="space-y-2">
                      {sinLeerPorGrupo.map(([grupoNombre, padres]) => (
                        <GrupoCard
                          key={grupoNombre}
                          grupoNombre={grupoNombre}
                          padres={padres}
                          expandido={expandidosGrupos.has(grupoNombre)}
                          onToggle={() => toggleGrupo(grupoNombre)}
                        />
                      ))}
                    </div>
                  )}

                  {tab === 'leidos' && leidos.length > 0 && (
                    <div className="space-y-2">
                      {leidosPorGrupo.map(([grupoNombre, padres]) => (
                        <GrupoCard
                          key={grupoNombre}
                          grupoNombre={grupoNombre}
                          padres={padres}
                          expandido={expandidosGrupos.has(grupoNombre)}
                          onToggle={() => toggleGrupo(grupoNombre)}
                        />
                      ))}
                    </div>
                  )}

                  {tab === 'sin-leer' && sinLeer.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">Todos leyeron el aviso</p>
                  )}

                  {tab === 'leidos' && leidos.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">Nadie ha leído el aviso</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">Sin notificaciones para este aviso</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AvisoExtraordinario() {
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [gruposSeleccionados, setGruposSeleccionados] = useState([]);
  const [historialLocal, setHistorialLocal] = useState([]);
  const [expandidosSet, setExpandidosSet] = useState(new Set());

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const { data: historialBD = [] } = useQuery({
    queryKey: ['avisos-extraordinarios'],
    queryFn: () => api.get('/notificaciones/avisos-extraordinarios').then(r => r.data),
  });

  const historial = [
    ...historialLocal,
    ...historialBD
      .filter(a => !historialLocal.some(h => h.aviso_id === a.id))
      .map(a => ({
        aviso_id: a.id,
        titulo: a.titulo,
        fechaEnvio: formatearFecha(a.created_at),
        expandido: expandidosSet.has(a.id),
      })),
  ];

  const mutation = useMutation({
    mutationFn: () => api.post('/notificaciones/aviso-extraordinario', {
      titulo,
      cuerpo,
      grupo_ids: gruposSeleccionados,
    }),
    onSuccess: (res) => {
      toast.success(`Aviso enviado a ${res.data.enviadas} familia(s)`);
      const d = new Date();
      const horas = d.getHours();
      const mins = d.getMinutes().toString().padStart(2,'0');
      const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
      const h12 = (horas % 12 || 12).toString().padStart(2,'0');
      const fechaHora = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${h12}:${mins} ${ampm}`;

      setHistorialLocal(prev => [
        { aviso_id: res.data.aviso_id, titulo, fechaEnvio: fechaHora, expandido: true },
        ...prev.map(a => ({ ...a, expandido: false })),
      ]);
      setTitulo('');
      setCuerpo('');
      setGruposSeleccionados([]);
    },
    onError: () => toast.error('Error al enviar el aviso'),
  });

  const toggleGrupo = (id) => {
    setGruposSeleccionados(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleHistorial = (avisoId) => {
    setExpandidosSet(prev => {
      const newSet = new Set(prev);
      if (newSet.has(avisoId)) {
        newSet.delete(avisoId);
      } else {
        newSet.add(avisoId);
      }
      return newSet;
    });
  };

  const todosSeleccionados = gruposSeleccionados.length === 0;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-hs-orange/20 rounded-xl">
          <Megaphone className="w-6 h-6 text-hs-orange-dark" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-800">Aviso Extraordinario</h1>
          <p className="text-sm text-gray-500">Envía una notificación urgente a los padres de familia</p>
        </div>
      </div>

      {/* Historial de avisos */}
      {historial.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide">Avisos extraordinarios</p>
          {historial.map(a => (
            <EstadoAviso
              key={a.aviso_id}
              avisoId={a.aviso_id}
              titulo={a.titulo}
              fechaEnvio={a.fechaEnvio}
              expandido={a.expandido}
              onToggle={() => toggleHistorial(a.aviso_id)}
            />
          ))}
        </div>
      )}

      {/* Destinatarios */}
      <div className="card-hs p-5 space-y-3">
        <h2 className="text-xs font-black text-hs-orange uppercase tracking-wide flex items-center gap-1">
          <Users className="w-4 h-4" /> Destinatarios
        </h2>

        <button
          onClick={() => setGruposSeleccionados([])}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
            todosSeleccionados
              ? 'border-orange-400 bg-hs-orange/10 text-hs-orange-dark'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          Todos los grupos ({grupos.length} grupos)
        </button>

        <div className="grid grid-cols-2 gap-2">
          {grupos.map(g => {
            const sel = gruposSeleccionados.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleGrupo(g.id)}
                className={`text-left px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  sel
                    ? 'border-orange-400 bg-hs-orange/10 text-hs-orange-dark'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div>{g.nombre}</div>
                <div className="text-xs font-normal text-gray-400">{g.total_alumnos} alumnos</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mensaje */}
      <div className="card-hs p-5 space-y-4">
        <h2 className="text-xs font-black text-hs-orange uppercase tracking-wide">Mensaje</h2>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej: Salida anticipada hoy"
            maxLength={100}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-orange-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-600">Mensaje</label>
          <textarea
            value={cuerpo}
            onChange={e => setCuerpo(e.target.value)}
            placeholder="Ej: Por falta de luz, pedimos recoger a los niños antes de las 2:00 PM. Disculpen los inconvenientes."
            rows={4}
            maxLength={500}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:border-orange-400"
          />
          <p className="text-xs text-gray-400 text-right">{cuerpo.length}/500</p>
        </div>
      </div>

      {/* Botón enviar */}
      <button
        onClick={() => mutation.mutate()}
        disabled={!titulo.trim() || !cuerpo.trim() || mutation.isPending}
        className="w-full flex items-center justify-center gap-2 bg-hs-orange hover:bg-hs-orange-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all shadow-sm"
      >
        <Send className="w-5 h-5" />
        {mutation.isPending
          ? 'Enviando...'
          : `Enviar aviso${todosSeleccionados ? ' a todos' : ` a ${gruposSeleccionados.length} grupo(s)`}`}
      </button>
    </div>
  );
}

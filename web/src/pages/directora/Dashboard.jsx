import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, CreditCard, AlertTriangle, CheckCircle, Clock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { SkeletonStat } from '@/components/ui/SkeletonCard';
import BannerComidaHoy from '@/components/directora/BannerComidaHoy';
import AvatarAlumno from '@/components/ui/AvatarAlumno';

function esCumpleanos(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date().toLocaleDateString('en-CA');
  const [, mesHoy, diaHoy] = hoy.split('-');
  const fn = new Date(fecha_nacimiento.substring(0, 10) + 'T12:00:00');
  return fn.getMonth() + 1 === parseInt(mesHoy) && fn.getDate() === parseInt(diaHoy);
}

const ESTADO_STYLE = {
  presente:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Presente',      emoji: '✅' },
  retardo:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Retardo',        emoji: '⏰' },
  no_entrada: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'No entró',       emoji: '🚫' },
  ausente:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Sin registrar',  emoji: '⬜' },
};

function agruparPorGrupo(lista, asistenciaPorGrupo) {
  const colorMap = Object.fromEntries(
    (asistenciaPorGrupo || []).map(g => [g.grupo_nombre, { grupo_id: g.grupo_id, color_hex: g.color_hex }])
  );
  const acc = {};
  for (const a of lista) {
    if (!acc[a.grupo_nombre]) {
      const meta = colorMap[a.grupo_nombre] || { grupo_id: a.grupo_nombre, color_hex: '#FEE2E2' };
      acc[a.grupo_nombre] = { ...meta, grupo_nombre: a.grupo_nombre, alumnos: [] };
    }
    acc[a.grupo_nombre].alumnos.push(a);
  }
  return Object.values(acc).sort((a, b) => a.grupo_nombre.localeCompare(b.grupo_nombre));
}

const StatCard = ({ icon: Icon, label, value, sublabel, color, emoji }) => (
  <div className="card-hs hover:shadow-hs-lg transition-shadow duration-200">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
      <Icon size={24} className="text-white" />
    </div>
    <div className="text-3xl font-black text-gray-800">{emoji} {value}</div>
    <div className="text-sm font-bold text-gray-600 mt-1">{label}</div>
    {sublabel && <div className="text-xs text-gray-400 font-semibold mt-1">{sublabel}</div>}
  </div>
);

function FilaModal({ alumno }) {
  const cfg = ESTADO_STYLE[alumno.estado_asistencia] || ESTADO_STYLE.ausente;
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
      <AvatarAlumno alumno={alumno} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800 truncate">{alumno.nombre_completo}</p>
        {alumno.hora_entrada && (
          <p className="text-xs text-gray-400 font-semibold">
            🕐 {new Date(alumno.hora_entrada).toLocaleTimeString('es-MX',
              { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}
          </p>
        )}
      </div>
      <span className={`text-xs font-black px-2 py-1 rounded-xl ${cfg.bg} ${cfg.text}`}>
        {cfg.emoji} {cfg.label}
      </span>
    </div>
  );
}

function ModalAsistenciaGrupo({ grupo, onClose }) {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    const fechaHoy = new Date().toLocaleDateString('en-CA');
    api.get(`/asistencia/grupo/${grupo.grupo_id}`, { params: { fecha: fechaHoy } })
      .then(r => { setAlumnos(r.data); setCargando(false); })
      .catch(() => setCargando(false));
  }, [grupo.grupo_id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 rounded-full" style={{ background: grupo.color_hex }} />
            <h2 className="text-lg font-black text-gray-800">Asistencia — {grupo.grupo_nombre}</h2>
            <span className="ml-auto text-xs font-black px-2 py-1 rounded-xl bg-gray-100 text-gray-700">
              {grupo.presentes}/{grupo.total} presentes
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {cargando ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-2xl" />
              ))}
            </>
          ) : (
            alumnos.map(a => <FilaModal key={a.id} alumno={a} />)
          )}
        </div>
      </div>
    </div>
  );
}

function ModalSalidasGrupo({ grupo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 rounded-full" style={{ background: grupo.color_hex }} />
            <h2 className="text-lg font-black text-gray-800">Salidas — {grupo.grupo_nombre}</h2>
            <span className="ml-auto text-xs font-black px-2 py-1 rounded-xl bg-gray-100 text-gray-700">
              {grupo.salidas.length} salidas
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {grupo.salidas.length === 0 ? (
            <p className="text-sm text-gray-400 font-semibold text-center py-6">Sin salidas registradas</p>
          ) : (
            grupo.salidas.map(s => (
              <div key={s.id + s.hora_salida} className={`flex items-center gap-3 p-3 rounded-2xl ${s.es_anticipada ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <span className="text-lg">{!s.autorizado ? '🚨' : s.es_anticipada ? '⚠️' : '✅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800">{s.nombre_completo}</p>
                  {s.nombre_quien_recoge && <p className="text-xs text-gray-400 font-semibold truncate">Recogido por: {s.nombre_quien_recoge}</p>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-black text-sm ${!s.autorizado ? 'text-red-600' : s.es_anticipada ? 'text-orange-600' : 'text-green-600'}`}>
                    {new Date(s.hora_salida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}
                  </span>
                  {s.es_anticipada && <p className="text-xs text-orange-400 font-semibold">anticipada</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ModalDocumentacionGrupo({ grupo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 rounded-full" style={{ background: grupo.color_hex }} />
            <h2 className="text-lg font-black text-gray-800">Documentación — {grupo.grupo_nombre}</h2>
            <span className="ml-auto text-xs font-black px-2 py-1 rounded-xl bg-gray-100 text-gray-700">
              {grupo.alumnos.length} alumnos
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {grupo.alumnos.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl">
              <span className="text-lg">🔴</span>
              <p className="font-bold text-sm text-gray-800">{a.nombre_completo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalRetardosGrupo({ grupo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 rounded-full" style={{ background: grupo.tieneAlumnosSeveros ? '#DC2626' : grupo.color_hex }} />
            <h2 className="text-lg font-black text-gray-800">Retardos — {grupo.grupo_nombre}</h2>
            <span className={`ml-auto text-xs font-black px-2 py-1 rounded-xl ${grupo.tieneAlumnosSeveros ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {grupo.totalRetardos} retardos
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {grupo.alumnos
            .filter(a => a.estado_asistencia !== 'no_entrada')
            .map(a => {
            const retardos = parseInt(a.retardos || 0);
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <span className="text-lg">{retardos >= 3 ? '🔴' : '🟡'}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{a.nombre_completo}</p>
                </div>
                <span className={`font-black text-lg ${retardos >= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {retardos}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PanelExtensionVespertina({ alumnos = [], forzarModoNormal, onToggle }) {
  const conExtension = alumnos.filter(a => a.tiene_extension && !a.hora_salida);
  const sinExtensionPendientes = alumnos.filter(a => !a.tiene_extension && !a.hora_salida);
  const yaSalieron = alumnos.filter(a => a.hora_salida);

  return (
    <div className="space-y-4">
      {/* Banner modo extensión */}
      <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">⏰</span>
        <div className="flex-1">
          <p className="font-black text-purple-800">Vista de Extensión Activa</p>
          <p className="text-xs text-purple-600 font-semibold">
            Son las {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} — mostrando niños en la escuela después de las 3:06 PM
          </p>
        </div>
        <button onClick={onToggle} className="text-xs text-purple-600 underline font-bold flex-shrink-0">
          {forzarModoNormal ? 'Modo extensión' : 'Ver todos'}
        </button>
      </div>

      {!forzarModoNormal && (
        <>
          {/* Con extensión contratada */}
          {conExtension.length > 0 && (
            <div className="card-hs">
              <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-lg">✅</span> Con extensión contratada
                <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">{conExtension.length}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {conExtension.map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-xl">
                    {a.foto_url
                      ? <img src={a.foto_url} alt={a.nombre_completo} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-black text-sm flex-shrink-0">{a.nombre_completo.charAt(0)}</div>
                    }
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-800 truncate">{a.nombre_completo.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{a.grupo_nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin extensión — salida pendiente */}
          {sinExtensionPendientes.length > 0 && (
            <div className="card-hs border-2 border-orange-300 bg-orange-50">
              <h3 className="font-black text-orange-800 mb-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span> Sin extensión — salida pendiente
                <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">{sinExtensionPendientes.length}</span>
              </h3>
              <p className="text-xs text-orange-700 font-semibold mb-3">Al registrar su salida se generará cobro de estancia por día.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sinExtensionPendientes.map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 bg-white border border-orange-200 rounded-xl">
                    {a.foto_url
                      ? <img src={a.foto_url} alt={a.nombre_completo} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-black text-sm flex-shrink-0">{a.nombre_completo.charAt(0)}</div>
                    }
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-800 truncate">{a.nombre_completo.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{a.grupo_nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ya salieron */}
          {yaSalieron.length > 0 && (
            <details className="card-hs">
              <summary className="cursor-pointer font-bold text-sm text-gray-500 flex items-center gap-2">
                <span>✔️</span> Ya salieron ({yaSalieron.length})
              </summary>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {yaSalieron.map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl opacity-60">
                    {a.foto_url
                      ? <img src={a.foto_url} alt={a.nombre_completo} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-black text-sm flex-shrink-0">{a.nombre_completo.charAt(0)}</div>
                    }
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-800 truncate">{a.nombre_completo.split(' ')[0]}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {new Date(a.hora_salida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {conExtension.length === 0 && sinExtensionPendientes.length === 0 && (
            <p className="text-center text-gray-400 font-semibold text-sm py-4">🎉 Todos los niños han salido</p>
          )}
        </>
      )}
    </div>
  );
}

function SalidasPorGrupo({ salidasHoy, asistenciaPorGrupo, isLoading, onCardClick }) {
  const porGrupo = asistenciaPorGrupo.map(g => {
    const salidas = salidasHoy.filter(s => s.grupo_nombre === g.grupo_nombre);
    const anticipadas = salidas.filter(s => s.es_anticipada).length;
    const noAutorizadas = salidas.filter(s => !s.autorizado).length;
    return { ...g, salidas, anticipadas, noAutorizadas };
  });

  const getEmojiSalidas = (salidas, anticipadas, noAutorizadas) => {
    if (noAutorizadas > 0) return '🚨';
    if (anticipadas > 0) return '⚠️';
    return '✅';
  };

  return (
    <div className="card-hs">
      <h2 className="text-lg font-black text-gray-800 mb-4">🚪 Salidas registradas hoy — por grupo</h2>
      {isLoading ? (
        <div className="skeleton h-24 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {porGrupo.map(g => (
            <button key={g.grupo_id} onClick={() => onCardClick(g)}
              className="text-center p-4 rounded-2xl border-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderColor: g.color_hex + '60', background: g.color_hex + '10' }}>
              <div className="text-2xl font-black" style={{ color: g.color_hex }}>
                {g.salidas.length}
              </div>
              <div className="text-xs font-bold text-gray-600 mt-1">{g.grupo_nombre}</div>
              {(g.anticipadas > 0 || g.noAutorizadas > 0) && (
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  {g.noAutorizadas > 0 && <span className="text-xs font-black px-1.5 py-0.5 bg-red-100 text-red-700 rounded">🚨 {g.noAutorizadas}</span>}
                  {g.anticipadas > 0 && <span className="text-xs font-black px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">⚠️ {g.anticipadas}</span>}
                </div>
              )}
              <div className="mt-2 text-lg">
                {getEmojiSalidas(g.salidas, g.anticipadas, g.noAutorizadas)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentacionPorGrupo({ documentacionPendiente, asistenciaPorGrupo, isLoading, onCardClick }) {
  const porGrupo = agruparPorGrupo(documentacionPendiente, asistenciaPorGrupo);

  return (
    <div className="card-hs">
      <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
        📄 Documentación incompleta
      </h2>
      {isLoading ? (
        <div className="skeleton h-24 rounded-2xl" />
      ) : porGrupo.length === 0 ? (
        <div className="text-center py-6 text-green-700 font-black">🎉 Todos los documentos completos!</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {porGrupo.map(g => (
            <button key={g.grupo_id} onClick={() => onCardClick(g)}
              className="text-center p-4 rounded-2xl border-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderColor: g.color_hex + '60', background: g.color_hex + '10' }}>
              <div className="text-2xl font-black" style={{ color: g.color_hex }}>
                {g.alumnos.length}
              </div>
              <div className="text-xs font-bold text-gray-600 mt-1">{g.grupo_nombre}</div>
              <div className="mt-2 text-lg">🔴</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RetardosPorGrupo({ retardosMes, asistenciaPorGrupo, isLoading, onCardClick }) {
  const porGrupo = agruparPorGrupo(retardosMes, asistenciaPorGrupo);

  return (
    <div className="card-hs">
      <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
        ⏰ Retardos del mes
      </h2>
      {isLoading ? (
        <div className="skeleton h-24 rounded-2xl" />
      ) : porGrupo.length === 0 ? (
        <div className="text-center py-6 text-green-700 font-black">🎉 Sin retardos este mes</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {porGrupo.map(g => {
            const alumnosConRetardo = g.alumnos.filter(a => a.estado_asistencia !== 'no_entrada');
            const totalRetardos = alumnosConRetardo.reduce((sum, a) => sum + parseInt(a.retardos || 0), 0);
            const tieneAlumnosSeveros = alumnosConRetardo.some(a => parseInt(a.retardos || 0) >= 3);
            return (
              <button key={g.grupo_id} onClick={() => onCardClick(g)}
                className="text-center p-4 rounded-2xl border-2 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: tieneAlumnosSeveros ? '#DC2626' : g.color_hex + '60', background: tieneAlumnosSeveros ? '#FEE2E2' : g.color_hex + '10' }}>
                <div className="text-2xl font-black" style={{ color: tieneAlumnosSeveros ? '#DC2626' : g.color_hex }}>
                  {totalRetardos}
                </div>
                <div className="text-xs font-bold text-gray-600 mt-1">{g.grupo_nombre}</div>
                <div className="mt-2 text-lg">
                  {tieneAlumnosSeveros ? '🔴' : '🟡'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DirectoraDashboard() {
  const { usuario } = useAuthStore();
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['dashboard-directora'],
    queryFn: () => api.get('/reportes/dashboard').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: incidentesHoy = [] } = useQuery({
    queryKey: ['incidentes-hoy'],
    queryFn: () => api.get('/bitacora/incidentes/hoy').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: cumpleanosHoy = [] } = useQuery({
    queryKey: ['cumpleanos-hoy'],
    queryFn: () => api.get('/alumnos').then(r =>
      (r.data.alumnos || []).filter(a => esCumpleanos(a.fecha_nacimiento))
    ),
  });

  const { data: alumnosEnAlertaTareas = [] } = useQuery({
    queryKey: ['alumnos-alerta-tareas'],
    queryFn: () => api.get('/tareas/alumnos-alerta').then(r => r.data).catch(() => []),
    refetchInterval: 60000,
  });

  const { data: visitantesHoy = [] } = useQuery({
    queryKey: ['visitantes-hoy'],
    queryFn: () => api.get('/visitantes').then(r => r.data),
    refetchInterval: 60000,
  });

  const [modalGrupo, setModalGrupo] = useState(null);
  const [modalSalidas, setModalSalidas] = useState(null);
  const [modalDocumentacion, setModalDocumentacion] = useState(null);
  const [modalRetardos, setModalRetardos] = useState(null);

  const [minutosActuales, setMinutosActuales] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [forzarModoNormal, setForzarModoNormal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setMinutosActuales(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const CORTE_EXTENSION = 15 * 60 + 6; // 15:06
  const modoExtension = minutosActuales >= CORTE_EXTENSION;

  return (
    <div className="space-y-8 animate-fade-in">
      {modalGrupo && <ModalAsistenciaGrupo grupo={modalGrupo} onClose={() => setModalGrupo(null)} />}
      {modalSalidas && <ModalSalidasGrupo grupo={modalSalidas} onClose={() => setModalSalidas(null)} />}
      {modalDocumentacion && <ModalDocumentacionGrupo grupo={modalDocumentacion} onClose={() => setModalDocumentacion(null)} />}
      {modalRetardos && <ModalRetardosGrupo grupo={modalRetardos} onClose={() => setModalRetardos(null)} />}

      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-black text-gray-800">
          ¡Buenos días, {usuario?.nombre?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 font-semibold capitalize mt-1">{hoy}</p>
      </div>

      {/* Banner cumpleaños */}
      {cumpleanosHoy.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
          <span className="text-2xl">🎂</span>
          <div>
            <p className="font-black text-yellow-800 text-sm">
              ¡Hoy cumplen años: {cumpleanosHoy.map(a => `${a.nombre_completo.split(' ')[0]} (${a.grupo_nombre})`).join(', ')}!
            </p>
            <p className="text-xs text-yellow-600 font-semibold">No olvides festejarlos 🎈</p>
          </div>
        </div>
      )}

      {/* Banner comida */}
      <BannerComidaHoy />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard
              icon={Users}
              emoji="👧🏻"
              label="Alumnos inscritos"
              value={resumen?.totalAlumnos || 0}
              sublabel="Ciclo actual"
              color="bg-hs-purple"
            />
            <StatCard
              icon={CheckCircle}
              emoji="✅"
              label="En escuela hoy"
              value={resumen?.presentesHoy || 0}
              sublabel={`${resumen?.retardosHoy || 0} con retardo`}
              color="bg-hs-green"
            />
            <StatCard
              icon={CreditCard}
              emoji="🟢"
              label="Al corriente"
              value={resumen?.alumnosAlCorriente || 0}
              sublabel="Colegiatura"
              color="bg-hs-green"
            />
            <StatCard
              icon={AlertTriangle}
              emoji="🔴"
              label="Con adeudo"
              value={resumen?.alumnosConAdeudo || 0}
              sublabel="Requieren atención"
              color="bg-hs-red"
            />
          </>
        )}
      </div>

      {/* Asistencia por grupo hoy */}
      <div className="card-hs">
        <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
          📊 Asistencia por grupo — hoy
        </h2>
        {isLoading ? (
          <div className="skeleton h-24 rounded-2xl" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {(resumen?.asistenciaPorGrupo || []).map(g => (
              <button key={g.grupo_id} onClick={() => setModalGrupo(g)}
                className="text-center p-4 rounded-2xl border-2 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: g.color_hex + '60', background: g.color_hex + '10' }}>
                <div className="text-2xl font-black" style={{ color: g.color_hex }}>
                  {g.presentes}/{g.total}
                </div>
                <div className="text-xs font-bold text-gray-600 mt-1">{g.grupo_nombre}</div>
                <div className="mt-2 text-lg">
                  {(() => {
                    const total = parseInt(g.total || 0);
                    const presentes = parseInt(g.presentes || 0);
                    const emoji = total === 0 ? '⬜' : presentes === total ? '🎉' : presentes >= total * 0.8 ? '✅' : '⚠️';
                    return emoji === '⚠️' ? <span title="Menos del 80% de alumnos presentes">{emoji}</span> : emoji;
                  })()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Salidas por grupo hoy */}
      <SalidasPorGrupo
        salidasHoy={resumen?.salidasHoy || []}
        asistenciaPorGrupo={resumen?.asistenciaPorGrupo || []}
        isLoading={isLoading}
        onCardClick={setModalSalidas}
      />

      {/* Panel extensión vespertina — visible a partir de las 3:06 PM */}
      {modoExtension && (
        <PanelExtensionVespertina
          alumnos={resumen?.extensionVespertina || []}
          forzarModoNormal={forzarModoNormal}
          onToggle={() => setForzarModoNormal(v => !v)}
        />
      )}

      {/* Incidentes del día */}
      {incidentesHoy.length > 0 && (
        <div className="card-hs border-2 border-red-300 bg-red-50">
          <h2 className="text-lg font-black text-red-700 mb-4 flex items-center gap-2">
            ⚠️ Incidentes hoy ({incidentesHoy.length})
          </h2>
          <div className="space-y-3">
            {incidentesHoy.map(inc => (
              <div key={inc.id} className="bg-white rounded-2xl p-4 border border-red-200 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-black text-gray-800 text-sm">
                    👧🏻 {inc.alumno_nombre}
                    <span className="ml-2 text-xs font-bold text-gray-400">{inc.grupo_nombre}</span>
                  </p>
                  <span className="text-xs font-bold text-red-500">
                    {new Date(inc.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{inc.descripcion}</p>
                {inc.acciones_tomadas && (
                  <p className="text-xs text-gray-500">Acciones: {inc.acciones_tomadas}</p>
                )}
                {inc.fotos_urls?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-1">
                    {inc.fotos_urls.map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Foto" className="w-14 h-14 object-cover rounded-lg border border-red-200" />
                      </a>
                    ))}
                  </div>
                )}
                {inc.reportado_por_nombre && (
                  <p className="text-xs text-gray-400">Reportado por: {inc.reportado_por_nombre}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rechazados por síntomas/fiebre hoy */}
      {resumen?.rechazadosSintomas?.length > 0 && (
        <div className="card-hs border-2 border-red-400 bg-red-50">
          <h2 className="text-lg font-black text-red-700 mb-4 flex items-center gap-2">
            🚨 Rechazados por síntomas hoy ({resumen.rechazadosSintomas.length})
          </h2>
          <div className="space-y-3">
            {resumen.rechazadosSintomas.map((alumno, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-red-300 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-black text-gray-800 text-sm">
                    👧🏻 {alumno.nombre_completo}
                    <span className="ml-2 text-xs font-bold text-gray-400">{alumno.grupo_nombre}</span>
                  </p>
                  {alumno.temperatura && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded">
                      {alumno.temperatura}°C
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-red-700">{alumno.motivo_no_entrada}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentacionPorGrupo
          documentacionPendiente={resumen?.documentacionPendiente || []}
          asistenciaPorGrupo={resumen?.asistenciaPorGrupo || []}
          isLoading={isLoading}
          onCardClick={setModalDocumentacion}
        />
        <RetardosPorGrupo
          retardosMes={resumen?.retardosMes || []}
          asistenciaPorGrupo={resumen?.asistenciaPorGrupo || []}
          isLoading={isLoading}
          onCardClick={setModalRetardos}
        />
      </div>

      {/* Sección colapsable: Alumnos en alerta de tareas — al fondo */}
      {alumnosEnAlertaTareas.length > 0 && (
        <div className="card-hs border border-red-200 overflow-hidden">
          <details className="w-full">
            <summary className="px-4 py-3 bg-red-50 cursor-pointer hover:bg-red-100 transition flex items-center gap-2 font-black text-red-800 text-sm">
              <span>📚</span>
              <span>{alumnosEnAlertaTareas.length} alumno{alumnosEnAlertaTareas.length > 1 ? 's' : ''} en seguimiento de tareas</span>
              <span className="ml-auto text-red-600">▼</span>
            </summary>
            <div className="px-4 py-3 space-y-2 bg-white">
              {alumnosEnAlertaTareas.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-semibold text-gray-700 py-2 border-b border-red-100 last:border-b-0">
                  <span className="text-sm">📌</span>
                  <span className="flex-1">{a.nombre_completo}</span>
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">{a.tareas_sin_entregar} tareas</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Visitantes de hoy */}
      <div className="card-hs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            👁️ Visitantes de hoy
          </h2>
          <Link
            to="/directora/visitantes"
            className="px-3 py-1 text-sm text-blue-600 hover:underline font-semibold"
          >
            Ver todos →
          </Link>
        </div>
        {visitantesHoy.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay visitantes registrados hoy</p>
        ) : (
          <div className="space-y-2">
            {visitantesHoy.map(v => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                {v.foto_url && (
                  <img src={v.foto_url} alt={v.nombre} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{v.nombre}</p>
                  <p className="text-xs text-gray-500">{v.grupo_nombre} • {v.tutor_nombre}</p>
                </div>
                <div className="flex items-center gap-1">
                  {v.hora_salida ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✅ Salida</span>
                  ) : (
                    <>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">✓ Entrada</span>
                      {v.tiene_extension_dia && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">🌙 Ext</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

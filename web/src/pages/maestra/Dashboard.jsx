import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, BookOpen, Users, Clock, XCircle, HelpCircle, Image } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const EMOJIS_ANIMO = { feliz: '😊', triste: '😢', cansado: '😴', inquieto: '😤', energico: '⚡' };

function esCumpleanos(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date().toLocaleDateString('en-CA');
  const [, mesHoy, diaHoy] = hoy.split('-');
  const fn = new Date(fecha_nacimiento.substring(0, 10) + 'T12:00:00');
  return fn.getMonth() + 1 === parseInt(mesHoy) && fn.getDate() === parseInt(diaHoy);
}

const BADGE_CONFIG = {
  presente:   { bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅', label: 'Presente' },
  retardo:    { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏰', label: 'Retardo' },
  no_entrada: { bg: 'bg-red-100',    text: 'text-red-700',    icon: '🚫', label: 'No entró' },
  ausente:    { bg: 'bg-gray-100',   text: 'text-gray-500',   icon: '⬜', label: 'Ausente' },
  justificado:{ bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '📝', label: 'Justificado' },
};

function EstadoBadge({ estado }) {
  const cfg = BADGE_CONFIG[estado] || BADGE_CONFIG.ausente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function BitacoraBadge({ alumno }) {
  const guardada = alumno.estado_animo !== null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
      guardada ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
    }`}>
      {guardada ? '📋 Guardada' : '⏳ Pendiente'}
    </span>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="card-hs flex items-center gap-4 p-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value ?? '—'}</p>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function MaestraDashboard() {
  const { usuario } = useAuthStore();
  const navigate = useNavigate();

  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['mi-grupo'],
    queryFn: () => api.get('/grupos/mi-grupo').then(r => r.data),
    refetchInterval: 30000,
  });

  const alumnos = grupo?.alumnos || [];
  const totalAlumnos = alumnos.length;
  const cumpleanosHoy = alumnos.filter(a => esCumpleanos(a.fecha_nacimiento));
  const enEscuela = alumnos.filter(a => ['presente', 'retardo'].includes(a.estado_asistencia)).length;
  const retardos = alumnos.filter(a => a.estado_asistencia === 'retardo').length;
  const bitacorasGuardadas = alumnos.filter(a => a.estado_animo !== null).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            ¡Bienvenid{usuario?.genero === 'm' ? 'o' : 'a'}, {usuario?.genero === 'm' ? 'Teacher' : 'Miss'} {usuario?.nombre?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm font-semibold text-gray-500 capitalize mt-0.5">{hoy}</p>
        </div>
        {grupo && (
          <span
            className="px-3 py-1.5 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: grupo.color_hex || '#805AD5' }}
          >
            {grupo.nombre}
          </span>
        )}
      </div>

      {/* Banner cumpleaños */}
      {cumpleanosHoy.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
          <span className="text-2xl">🎂</span>
          <div>
            <p className="font-black text-yellow-800 text-sm">
              ¡Hoy es el cumpleaños de {cumpleanosHoy.map(a => a.nombre_completo.split(' ')[0]).join(' y ')}!
            </p>
            <p className="text-xs text-yellow-600 font-semibold">No olvides felicitarl{cumpleanosHoy.length > 1 ? 'os' : 'o/a'} 🎈</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={Users}      value={`${enEscuela}/${totalAlumnos}`} label="En escuela hoy" color="bg-green-500" />
        <StatCard icon={Clock}      value={retardos}                       label="Retardos"        color="bg-yellow-500" />
        <StatCard icon={BookOpen}   value={`${bitacorasGuardadas}/${totalAlumnos}`} label="Bitácoras guardadas" color="bg-purple-500" />
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link to="/maestra/asistencia" className="card-hs p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <CheckSquare size={28} className="text-green-600" />
            </div>
            <span className="font-bold text-sm text-gray-700">Asistencia</span>
          </Link>

          <Link to="/maestra/bitacora" className="card-hs p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <BookOpen size={28} className="text-purple-600" />
            </div>
            <span className="font-bold text-sm text-gray-700">Bitácora</span>
          </Link>

          <Link to="/maestra/galeria" className="card-hs p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group col-span-2 md:col-span-1">
            <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
              <Image size={28} className="text-yellow-600" />
            </div>
            <span className="font-bold text-sm text-gray-700">Galería</span>
          </Link>
        </div>
      </div>

      {/* Lista de alumnos */}
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">
          Mi grupo — {isLoading ? '...' : (grupo?.nombre || 'Sin grupo asignado')}
        </h2>

        {isLoading ? (
          <div className="card-hs p-8 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="card-hs p-8 text-center text-gray-400 font-semibold">
            No hay alumnos en tu grupo
          </div>
        ) : (
          <div className="card-hs overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-black text-gray-400 uppercase tracking-wide px-4 py-3">Alumno</th>
                  <th className="text-left text-xs font-black text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Ánimo</th>
                  <th className="text-left text-xs font-black text-gray-400 uppercase tracking-wide px-4 py-3">Asistencia</th>
                  <th className="text-left text-xs font-black text-gray-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Bitácora</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alumnos.map(alumno => (
                  <tr
                    key={alumno.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/maestra/bitacora?alumnoId=${alumno.id}`)}
                  >
                    {/* Nombre + foto */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {alumno.foto_url ? (
                          <img src={alumno.foto_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg">
                            👧🏻
                          </div>
                        )}
                        <span className="font-bold text-sm text-gray-800">{alumno.nombre_completo}</span>
                      </div>
                    </td>

                    {/* Ánimo */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {alumno.estado_animo ? (
                        <span className="text-base" title={alumno.estado_animo}>
                          {EMOJIS_ANIMO[alumno.estado_animo] || '—'}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Asistencia */}
                    <td className="px-4 py-3">
                      <EstadoBadge estado={alumno.estado_asistencia} />
                    </td>

                    {/* Bitácora */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <BitacoraBadge alumno={alumno} />
                    </td>

                    {/* Flecha */}
                    <td className="px-4 py-3 text-gray-300 text-sm">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

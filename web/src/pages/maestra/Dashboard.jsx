import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Clock, UserX, BookOpen, Image, LogOut, AlertTriangle } from 'lucide-react';
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
  const queryClient = useQueryClient();

  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  // Invalidar caché de grupo cuando cambia el usuario
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['mi-grupo'] });
  }, [usuario?.id, queryClient]);

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['mi-grupo'],
    queryFn: () => api.get('/grupos/mi-grupo').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: turnoHoy } = useQuery({
    queryKey: ['turno-hoy'],
    queryFn: () => api.get('/turnos-puerta/hoy').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: configHorario } = useQuery({
    queryKey: ['config-horarios'],
    queryFn: () => api.get('/config/horarios').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: estadisticasHoy } = useQuery({
    queryKey: ['estadisticas-grupo-hoy'],
    queryFn: () => api.get('/grupos/mi-grupo/estadisticas/hoy').then(r => r.data),
    refetchInterval: 30000,
  });

  // Obtener lunes de la semana actual (semana_inicio para comida)
  // El banner se muestra toda la semana (lunes a domingo)
  const getLunesActual = () => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diff));
    // Formato YYYY-MM-DD sin zona horaria
    const year = lunes.getFullYear();
    const month = String(lunes.getMonth() + 1).padStart(2, '0');
    const date = String(lunes.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const { data: confirmacionesComida } = useQuery({
    queryKey: ['confirmaciones-comida', grupo?.id],
    queryFn: () => grupo?.id ? api.get('/comida/confirmaciones', {
      params: { semana: getLunesActual(), grupo_id: grupo.id }
    }).then(r => r.data) : null,
    enabled: !!grupo?.id,
    refetchInterval: 60000, // Cada minuto para detectar cambios en tiempo real
    staleTime: 30000,
  });

  const [horaActual, setHoraActual] = useState(new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }));
  useEffect(() => {
    const t = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const alumnos = grupo?.alumnos || [];
  const totalAlumnos = alumnos.length;
  const cumpleanosHoy = alumnos.filter(a => esCumpleanos(a.fecha_nacimiento));
  const enEscuela = alumnos.filter(a => ['presente', 'retardo'].includes(a.estado_asistencia)).length;
  const retardos = alumnos.filter(a => a.estado_asistencia === 'retardo').length;
  const ausentes = alumnos.filter(a => !a.estado_asistencia || a.estado_asistencia === 'ausente').length;
  const noEntradaRetardos = estadisticasHoy?.no_entrada_retardos ?? 0;
  const bitacorasGuardadas = alumnos.filter(a => a.estado_animo !== null).length;

  const horaSalidaNormal = configHorario?.horarios?.hora_salida_normal || '15:00';
  const salidasAnticipadas = alumnos.filter(a => {
    if (!a.salida_id || !a.hora_salida) return false;
    const horaSalida = new Date(a.hora_salida).toLocaleTimeString('en-CA', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City',
    });
    return horaSalida < horaSalidaNormal;
  });

  const horaFinFiltro = configHorario?.horarios?.hora_fin_filtro || '08:30';
  const horaInicioFiltro = configHorario?.horarios?.hora_inicio_filtro || '07:00';
  const filtroAbierto = horaActual >= horaInicioFiltro && horaActual <= horaFinFiltro;
  const filtroCerrado = horaActual > horaFinFiltro;

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

      {/* Banner turno de puerta */}
      {turnoHoy?.tiene_turno && (
        <Link
          to="/maestra/filtro-entrada"
          className="block bg-purple-50 border-2 border-purple-300 rounded-2xl p-4 flex items-center gap-3 hover:bg-purple-100 transition-colors"
        >
          <span className="text-2xl">🚪</span>
          <div className="flex-1">
            <p className="font-black text-purple-800 text-sm">¡Hoy tienes turno de puerta!</p>
            <p className="text-xs text-purple-600 font-semibold">Toca para abrir el Filtro de Entrada de todos los grupos →</p>
          </div>
        </Link>
      )}

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

      {/* Monitor puntualidad */}
      {(filtroAbierto || filtroCerrado) && (
        <div className={`rounded-2xl border-2 p-4 flex items-center gap-3 ${
          filtroAbierto
            ? 'bg-green-50 border-green-300'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <span className="text-2xl">{filtroAbierto ? '🚦' : '🔒'}</span>
          <div className="flex-1">
            {filtroAbierto ? (
              <>
                <p className="font-black text-green-800 text-sm">Filtro abierto — cierra a las {horaFinFiltro}</p>
                <p className="text-xs text-green-600 font-semibold">
                  {retardos > 0 ? `${retardos} retardo${retardos > 1 ? 's' : ''} registrado${retardos > 1 ? 's' : ''}` : 'Sin retardos hasta ahora ✅'}
                </p>
              </>
            ) : (
              <>
                <p className="font-black text-gray-700 text-sm">Filtro de entrada cerrado desde las {horaFinFiltro}</p>
                <p className="text-xs text-gray-500 font-semibold">
                  {retardos > 0 ? `${retardos} retardo${retardos > 1 ? 's' : ''} al cierre` : 'Sin retardos hoy ✅'}
                </p>
              </>
            )}
          </div>
          {retardos > 0 && (
            <span className="text-2xl font-black text-yellow-600">⏰ {retardos}</span>
          )}
        </div>
      )}

      {/* Banner salidas anticipadas */}
      {salidasAnticipadas.length > 0 && (
        <Link to="/maestra/filtro-salida"
          className="block bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 flex items-center gap-3 hover:bg-orange-100 transition-colors">
          <AlertTriangle size={22} className="text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-orange-800 text-sm">
              {salidasAnticipadas.length} salida{salidasAnticipadas.length > 1 ? 's' : ''} anticipada{salidasAnticipadas.length > 1 ? 's' : ''} hoy
            </p>
            <p className="text-xs text-orange-600 font-semibold">
              {salidasAnticipadas.map(a => a.nombre_completo.split(' ')[0]).join(', ')} — antes de las {horaSalidaNormal}
            </p>
          </div>
          <span className="text-2xl font-black text-orange-500">{salidasAnticipadas.length}</span>
        </Link>
      )}

      {/* Banner rechazados por síntomas — alumnos del grupo */}
      {(() => {
        const alumnos = grupo?.alumnos || [];
        const rechazados = alumnos.filter(a =>
          a.puede_entrar === false &&
          (a.sin_fiebre === false || a.temperatura > 37.5 || a.sin_sintomas === false)
        );
        return rechazados.length > 0 ? (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4">
            <p className="font-black text-red-800 text-sm flex items-center gap-2">
              🚨 {rechazados.length} alumno{rechazados.length > 1 ? 's' : ''} rechazado{rechazados.length > 1 ? 's' : ''} por síntomas hoy
            </p>
            <div className="mt-2 space-y-1">
              {rechazados.map(a => (
                <p key={a.id} className="text-xs font-semibold text-red-700">
                  · {a.nombre_completo.split(' ').slice(0, 2).join(' ')} — {a.motivo_no_entrada}
                </p>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Users}      value={`${enEscuela}/${totalAlumnos}`} label="En escuela hoy"      color="bg-green-500" />
        <StatCard icon={Clock}      value={retardos}                       label="Retardos"             color="bg-yellow-500" />
        <StatCard icon={UserX}      value={ausentes}                       label="Ausentes"             color="bg-red-400" />
        <StatCard icon={UserX}      value={noEntradaRetardos}              label="Sin entrada (retardos)" color="bg-orange-500" />
        <StatCard icon={BookOpen}   value={`${bitacorasGuardadas}/${totalAlumnos}`} label="Bitácoras guardadas" color="bg-purple-500" />
      </div>

      {/* Comida — Lista detallada */}
      {confirmacionesComida && (
        <div className="card-hs overflow-hidden">
          <div className={`px-4 py-3 border-b ${
            confirmacionesComida.confirmaciones.filter(c => c.pago_verificado).length > 0
              ? 'bg-green-50 border-green-100'
              : 'bg-gray-50 border-gray-100'
          }`}>
            <h2 className="font-black text-sm flex items-center gap-2 mb-3">
              🍱 Confirmaciones de servicio de comida
            </h2>
            {(() => {
              const diaHoy = new Date().getDay();
              const confirmacionesVerificadas = confirmacionesComida.confirmaciones.filter(c => c.pago_verificado);
              const ninosComenHoy = confirmacionesVerificadas.filter(c =>
                c.modalidad === 'semana_completa' ||
                (c.dias_seleccionados && c.dias_seleccionados.includes(diaHoy))
              ).length;
              const esFinDeSemana = diaHoy === 0 || diaHoy === 6;

              return (
                <>
                  {!esFinDeSemana && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-green-200 text-green-900 text-sm font-bold text-center">
                      🍽️ {ninosComenHoy} {ninosComenHoy === 1 ? 'niño come' : 'niños comen'} hoy
                    </div>
                  )}
                  {confirmacionesVerificadas.length > 0 ? (
                    <div className="space-y-2">
                      {confirmacionesVerificadas.map(confirmacion => {
                        const alumno = alumnos.find(a => a.id === confirmacion.alumno_id);
                        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const diasSeleccionados = confirmacion.dias_seleccionados ?? [];
                        const modalidadLabel = confirmacion.modalidad === 'semana_completa'
                          ? 'Semana completa'
                          : diasSeleccionados.length > 0
                          ? diasSeleccionados.map(d => diasNombres[d]).join(', ')
                          : 'Días específicos';
                        return (
                          <div
                            key={confirmacion.id}
                            className="px-3 py-2 rounded-lg bg-green-100 text-green-800 text-xs font-bold"
                          >
                            ✓ {alumno?.nombre_completo} - {modalidadLabel}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-gray-500">
                      Sin confirmaciones de servicio aún
                    </p>
                  )}
                </>
              );
            })()}
          </div>

        </div>
      )}

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link to="/maestra/galeria" className="card-hs p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group">
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
                  <th className="text-left text-xs font-black text-gray-400 uppercase tracking-wide px-4 py-3">Entrada</th>
                  <th className="text-left text-xs font-black text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Salida</th>
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

                    {/* Entrada */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <EstadoBadge estado={alumno.estado_asistencia} />
                        {alumno.hora_entrada && (
                          <p className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(alumno.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Salida */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {alumno.salida_id ? (
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            (() => {
                              const h = new Date(alumno.hora_salida).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });
                              return h < horaSalidaNormal ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
                            })()
                          }`}>
                            <LogOut size={10} />
                            {new Date(alumno.hora_salida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}
                          </span>
                          {alumno.nombre_quien_recoge && (
                            <p className="text-xs text-gray-400 font-semibold truncate max-w-[100px]">
                              {alumno.nombre_quien_recoge}
                            </p>
                          )}
                        </div>
                      ) : (
                        alumno.estado_asistencia !== 'ausente' && alumno.estado_asistencia !== 'no_entrada' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">
                            🏫 En escuela
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )
                      )}
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

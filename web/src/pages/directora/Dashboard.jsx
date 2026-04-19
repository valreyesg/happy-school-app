import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, CreditCard, AlertTriangle, CheckCircle, Clock, UserCheck, Settings } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { SkeletonStat } from '@/components/ui/SkeletonCard';

function esCumpleanos(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date().toLocaleDateString('en-CA');
  const [, mesHoy, diaHoy] = hoy.split('-');
  const fn = new Date(fecha_nacimiento.substring(0, 10) + 'T12:00:00');
  return fn.getMonth() + 1 === parseInt(mesHoy) && fn.getDate() === parseInt(diaHoy);
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

function SalidasPorGrupo({ salidasHoy, asistenciaPorGrupo, isLoading }) {
  const [grupoAbierto, setGrupoAbierto] = useState(null);

  // Agrupar salidas por grupo
  const porGrupo = asistenciaPorGrupo.map(g => {
    const salidas = salidasHoy.filter(s => s.grupo_nombre === g.grupo_nombre);
    const anticipadas = salidas.filter(s => s.es_anticipada).length;
    const noAutorizadas = salidas.filter(s => !s.autorizado).length;
    return { ...g, salidas, anticipadas, noAutorizadas };
  });

  return (
    <div className="card-hs">
      <h2 className="text-lg font-black text-gray-800 mb-4">🚪 Salidas registradas hoy — por grupo</h2>
      {isLoading ? (
        <div className="skeleton h-24 rounded-2xl" />
      ) : (
        <div className="space-y-3">
          {porGrupo.map(g => {
            const abierto = grupoAbierto === g.grupo_id;
            const enEscuela = parseInt(g.presentes) - g.salidas.length;
            return (
              <div key={g.grupo_id} className="rounded-2xl border-2 overflow-hidden"
                style={{ borderColor: g.color_hex + '50' }}>
                {/* Cabecera del grupo — siempre visible */}
                <button
                  onClick={() => setGrupoAbierto(abierto ? null : g.grupo_id)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:opacity-90"
                  style={{ background: g.color_hex + '15' }}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color_hex }} />
                  <span className="font-black text-gray-700 flex-1">{g.grupo_nombre}</span>

                  {/* Chips resumen */}
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="bg-white/80 text-gray-600 px-2 py-0.5 rounded-full">
                      {g.salidas.length}/{g.presentes} salieron
                    </span>
                    {enEscuela > 0 && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {enEscuela} en escuela
                      </span>
                    )}
                    {g.anticipadas > 0 && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        ⚠️ {g.anticipadas}
                      </span>
                    )}
                    {g.noAutorizadas > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        🚨 {g.noAutorizadas}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm ml-1">{abierto ? '▲' : '▼'}</span>
                </button>

                {/* Detalle expandible */}
                {abierto && (
                  <div className="divide-y divide-gray-50">
                    {g.salidas.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400 font-semibold">Sin salidas registradas</p>
                    ) : (
                      g.salidas.map(a => (
                        <div key={a.id + a.hora_salida} className={`flex items-center gap-3 px-4 py-3 ${a.es_anticipada ? 'bg-orange-50' : 'bg-white'}`}>
                          <span className="text-base">{!a.autorizado ? '🚨' : a.es_anticipada ? '⚠️' : '✅'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800">{a.nombre_completo}</p>
                            {a.nombre_quien_recoge && (
                              <p className="text-xs text-gray-400 font-semibold truncate">
                                Recogido por: {a.nombre_quien_recoge}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`font-black text-sm ${
                              !a.autorizado ? 'text-red-600' : a.es_anticipada ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {new Date(a.hora_salida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}
                            </span>
                            {a.es_anticipada && (
                              <p className="text-xs text-orange-400 font-semibold">anticipada</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
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

  const { data: configHorario } = useQuery({
    queryKey: ['config-horarios'],
    queryFn: () => api.get('/config/horarios').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const cfg = configHorario?.horarios || {};

  const { data: cumpleanosHoy = [] } = useQuery({
    queryKey: ['cumpleanos-hoy'],
    queryFn: () => api.get('/alumnos').then(r =>
      (r.data.alumnos || []).filter(a => esCumpleanos(a.fecha_nacimiento))
    ),
  });

  return (
    <div className="space-y-8 animate-fade-in">
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
              <div key={g.grupo_id} className="text-center p-4 rounded-2xl border-2"
                style={{ borderColor: g.color_hex + '60', background: g.color_hex + '10' }}>
                <div className="text-2xl font-black" style={{ color: g.color_hex }}>
                  {g.presentes}/{g.total}
                </div>
                <div className="text-xs font-bold text-gray-600 mt-1">{g.grupo_nombre}</div>
                <div className="mt-2 text-lg">
                  {g.presentes === g.total ? '🎉' : g.presentes >= g.total * 0.8 ? '✅' : '⚠️'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salidas por grupo hoy */}
      <SalidasPorGrupo
        salidasHoy={resumen?.salidasHoy || []}
        asistenciaPorGrupo={resumen?.asistenciaPorGrupo || []}
        isLoading={isLoading}
      />

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alumnos sin documentación */}
        <div className="card-hs">
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            📄 Documentación incompleta
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : resumen?.documentacionPendiente?.length > 0 ? (
            <div className="space-y-2">
              {resumen.documentacionPendiente.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{a.nombre_completo}</p>
                    <p className="text-xs text-gray-500">{a.grupo_nombre}</p>
                  </div>
                </div>
              ))}
              {resumen.documentacionPendiente.length > 5 && (
                <p className="text-sm text-gray-500 font-semibold text-center pt-2">
                  +{resumen.documentacionPendiente.length - 5} más
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-green-600 font-bold">
              🎉 Todos los documentos completos!
            </div>
          )}
        </div>

        {/* Retardos del mes */}
        <div className="card-hs">
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            ⏰ Retardos este mes
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : resumen?.retardosMes?.length > 0 ? (
            <div className="space-y-2">
              {resumen.retardosMes.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: a.retardos >= 3 ? '#FEE2E2' : '#FFFBEB' }}>
                  <span className="text-xl">{a.retardos >= 3 ? '🔴' : '🟡'}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">{a.nombre_completo}</p>
                    <p className="text-xs text-gray-500">{a.grupo_nombre}</p>
                  </div>
                  <span className={`font-black text-lg ${a.retardos >= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {a.retardos}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-green-600 font-bold">
              ✅ Sin retardos este mes
            </div>
          )}
        </div>
      </div>

      {/* Horarios configurados */}
      <div className="card-hs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            ⚙️ Horarios configurados
          </h2>
          <Link to="/directora/configuracion"
            className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors">
            <Settings size={13} /> Editar
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: '🚪', label: 'Apertura puerta',    valor: cfg.hora_inicio_filtro || '—' },
            { emoji: '⏰', label: 'Límite sin retardo',  valor: cfg.hora_fin_filtro    || '—' },
            { emoji: '🏫', label: 'Salida normal',       valor: cfg.hora_salida_normal || '—' },
            { emoji: '🌙', label: 'Salida extensión',    valor: cfg.hora_salida_extension || '—' },
          ].map(({ emoji, label, valor }) => (
            <div key={label} className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-xl font-black text-purple-700">{valor}</div>
              <div className="text-xs font-semibold text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-base font-black text-gray-700">${cfg.costo_extension_hora || '—'}/hr</div>
            <div className="text-xs text-gray-400 font-semibold">Costo extensión</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-base font-black text-gray-700">{cfg.max_retardos_mes || '—'} máx.</div>
            <div className="text-xs text-gray-400 font-semibold">Retardos/mes</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-base font-black text-gray-700">Días {cfg.dia_inicio_pago}–{cfg.dia_fin_pago}</div>
            <div className="text-xs text-gray-400 font-semibold">Período de pago</div>
          </div>
        </div>
      </div>
    </div>
  );
}

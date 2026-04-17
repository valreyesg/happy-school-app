import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, AlertTriangle, CheckCircle, Clock, UserCheck } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { SkeletonStat } from '@/components/ui/SkeletonCard';

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

export default function DirectoraDashboard() {
  const { usuario } = useAuthStore();
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['dashboard-directora'],
    queryFn: () => api.get('/reportes/dashboard').then(r => r.data),
    refetchInterval: 60000, // actualiza cada minuto
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard
              icon={Users}
              emoji="👧"
              label="Alumnos inscritos"
              value={resumen?.totalAlumnos || 0}
              sublabel="Ciclo actual"
              color="bg-hs-purple"
            />
            <StatCard
              icon={CheckCircle}
              emoji="✅"
              label="Presentes hoy"
              value={resumen?.presentesHoy || 0}
              sublabel="Hasta ahora"
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
    </div>
  );
}

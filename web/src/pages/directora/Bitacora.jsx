import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';

function BitacoraDiaria({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Vómitos */}
      {data.vomitos && data.vomitos.length > 0 && (
        <div className="card-hs p-4 space-y-3">
          <h3 className="text-xs font-black text-hs-orange-dark uppercase tracking-wide">🤢 Vómitos ({data.vomitos.length})</h3>
          <div className="space-y-2">
            {data.vomitos.map((v, i) => (
              <div key={i} className="bg-hs-orange/10 rounded-lg p-3 text-sm border border-hs-orange/30">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-black text-hs-orange-dark">
                      {v.hora ? new Date(v.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'Sin hora'}
                    </p>
                    <p className="text-xs capitalize text-hs-orange-dark font-semibold">
                      {v.intensidad === 'fuerte' ? '🚨 Fuerte' : v.intensidad === 'moderado' ? '🤮 Moderado' : '🤢 Leve'}
                    </p>
                  </div>
                  {v.notas && <p className="text-xs text-gray-700">{v.notas}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salud General */}
      {(data.bitacora?.se_enfermo || data.bitacora?.tuvo_fiebre || data.bitacora?.temperatura) && (
        <div className="card-hs p-4 space-y-3">
          <h3 className="text-xs font-black text-hs-blue-dark uppercase tracking-wide">🏥 Salud</h3>
          <div className="space-y-2 text-sm">
            {data.bitacora?.tuvo_fiebre && (
              <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <p className="font-bold text-red-700">🌡️ Tuvo fiebre</p>
              </div>
            )}
            {data.bitacora?.temperatura && (
              <div className="bg-hs-blue/10 px-3 py-2 rounded-lg border border-hs-blue/30">
                <p className="text-sm"><span className="font-bold">Temperatura:</span> {data.bitacora.temperatura}°C</p>
              </div>
            )}
            {data.bitacora?.se_enfermo && (
              <div className="bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                <p className="text-sm"><span className="font-bold">Malestar:</span> {data.bitacora.descripcion_enfermedad || 'Sí'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medicamentos */}
      {data.recepciones_medicamento && data.recepciones_medicamento.length > 0 && (
        <div className="card-hs p-4 space-y-3">
          <h3 className="text-xs font-black text-hs-purple uppercase tracking-wide">💊 Medicamentos</h3>
          <div className="space-y-2">
            {data.recepciones_medicamento.map((m, i) => (
              <div key={i} className="bg-hs-purple/10 rounded-lg p-3 text-sm border border-hs-purple/20">
                <p className="font-bold text-hs-purple-dark">{m.nombre}</p>
                <p className="text-xs text-hs-purple">📋 {m.dosis || 'Sin dosis'}</p>
                {m.horas && (
                  <p className="text-xs text-gray-600 mt-1">🕐 {Array.isArray(m.horas) ? m.horas.join(', ') : m.horas}</p>
                )}
                {m.recibido && (
                  <p className="text-xs text-green-600 font-bold mt-1">✅ Recibido</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BitacoraDirectora() {
  const hoy = new Date().toISOString().substring(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const { data: alumnosGrupo = [] } = useQuery({
    queryKey: ['asistencia-grupo', grupoSeleccionado, fecha],
    queryFn: () => grupoSeleccionado
      ? api.get(`/asistencia/grupo/${grupoSeleccionado}`, { params: { fecha } }).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!grupoSeleccionado,
  });

  const { data: bitacora, isLoading } = useQuery({
    queryKey: ['bitacora-directora', alumnoSeleccionado, fecha],
    queryFn: () => alumnoSeleccionado
      ? api.get(`/bitacora/${alumnoSeleccionado}?fecha=${fecha}`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!alumnoSeleccionado,
  });

  const alumnoActual = alumnosGrupo.find(a => a.id === alumnoSeleccionado);
  const grupoActual = grupos.find(g => g.id === grupoSeleccionado);

  const irAlDia = (direccion) => {
    const f = new Date(fecha + 'T12:00');
    f.setDate(f.getDate() + direccion);
    while (f.getDay() === 0 || f.getDay() === 6) {
      f.setDate(f.getDate() + (direccion > 0 ? 1 : -1));
    }
    setFecha(f.toISOString().substring(0, 10));
  };

  return (
    <div className="flex-1 space-y-6 p-4">
      <div className="space-y-3">
        <h1 className="text-2xl font-black text-gray-800">📖 Bitácora</h1>
        <p className="text-sm text-gray-500">Visualizar registros de salud por alumno</p>
      </div>

      {/* Selector de Grupo */}
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase mb-2">Grupo</label>
        <div className="flex gap-2 flex-wrap">
          {grupos.map(g => (
            <button
              key={g.id}
              onClick={() => {
                setGrupoSeleccionado(g.id);
                setAlumnoSeleccionado(null);
              }}
              className="px-4 py-2 rounded-2xl text-sm font-black transition-all border-2"
              style={grupoSeleccionado === g.id
                ? { background: g.color_hex, color: '#fff', borderColor: g.color_hex }
                : { background: '#fff', color: g.color_hex, borderColor: g.color_hex + '60' }}
            >
              {g.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Alumno */}
      {grupoSeleccionado && (
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-2">Alumno</label>
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
            {alumnosGrupo.map(a => (
              <button
                key={a.id}
                onClick={() => setAlumnoSeleccionado(a.id)}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border-2 ${
                  alumnoSeleccionado === a.id
                    ? 'bg-hs-blue/10 border-hs-blue/50'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <AvatarAlumno alumno={a} size="sm" />
                <span className="font-semibold text-sm text-gray-800">{a.nombre_completo}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selector de Fecha */}
      {alumnoSeleccionado && (
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-2">Fecha</label>
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200">
            <button
              onClick={() => irAlDia(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="font-black text-center">
              {new Date(fecha + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => irAlDia(1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Bitácora */}
      {alumnoSeleccionado && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-hs-blue/5 to-purple-50 rounded-2xl p-4 border border-hs-blue/30">
            <p className="text-sm text-gray-600">
              <span className="font-black">{alumnoActual?.nombre_completo}</span> {' · '}
              <span className="font-black">{grupoActual?.nombre}</span>
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : bitacora ? (
            <BitacoraDiaria data={bitacora} />
          ) : (
            <div className="card-hs text-center py-12 text-gray-400 font-bold">
              Sin registros para este día
            </div>
          )}
        </div>
      )}
    </div>
  );
}

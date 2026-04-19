import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DoorOpen, X, Plus } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

const ROL_LABEL = {
  maestra_titular:  'Miss titular',
  maestra_especial: 'Miss especial',
  maestra_puerta:   'Miss puerta',
  administrativo:   'Administrativo',
};

export default function TurnoPuerta() {
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA'));
  const queryClient = useQueryClient();

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ['turnos-puerta', fecha],
    queryFn: () => api.get(`/turnos-puerta?fecha=${fecha}`).then(r => r.data),
  });

  const { data: personal = [] } = useQuery({
    queryKey: ['personal-turno'],
    queryFn: () => api.get('/turnos-puerta/personal').then(r => r.data),
  });

  const asignar = useMutation({
    mutationFn: ({ personal_id }) => api.post('/turnos-puerta', { personal_id, fecha }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-puerta', fecha] });
      toast.success('Turno asignado ✅');
    },
    onError: () => toast.error('Error al asignar turno'),
  });

  const eliminar = useMutation({
    mutationFn: (id) => api.delete(`/turnos-puerta/${id}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-puerta', fecha] });
      toast.success('Turno eliminado');
    },
    onError: () => toast.error('Error al eliminar turno'),
  });

  const asignadosIds = new Set(turnos.map(t => t.personal_id));
  const disponibles = personal.filter(p => !asignadosIds.has(p.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <DoorOpen size={26} className="text-hs-purple" /> Turno de Puerta
        </h1>
        <p className="text-sm text-gray-500 font-semibold mt-1">
          Asigna qué Miss recibe a todos los niños en la entrada ese día.
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="card-hs p-4 flex items-center gap-4">
        <label className="text-sm font-black text-gray-600">Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple transition-colors"
        />
      </div>

      {/* Turnos asignados */}
      <div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
          Asignadas ese día ({turnos.length})
        </h2>
        {isLoading ? (
          <div className="card-hs p-8 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-hs-purple border-t-transparent rounded-full" />
          </div>
        ) : turnos.length === 0 ? (
          <div className="card-hs p-6 text-center text-gray-400 font-semibold">
            <DoorOpen size={32} className="mx-auto mb-2 opacity-30" />
            Nadie asignado para esta fecha
          </div>
        ) : (
          <div className="space-y-2">
            {turnos.map(t => (
              <div key={t.id} className="card-hs p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-hs-purple flex items-center justify-center text-white font-black text-sm">
                  {t.nombre?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-800">{t.nombre}</p>
                  <p className="text-xs text-gray-400 font-semibold">{ROL_LABEL[t.rol_principal] || t.rol_principal}</p>
                </div>
                <button
                  onClick={() => eliminar.mutate(t.id)}
                  disabled={eliminar.isPending}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal disponible */}
      {disponibles.length > 0 && (
        <div>
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
            Agregar Miss al turno
          </h2>
          <div className="space-y-2">
            {disponibles.map(p => (
              <div key={p.id} className="card-hs p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-sm">
                  {p.nombre?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-800">{p.nombre}</p>
                  <p className="text-xs text-gray-400 font-semibold">{ROL_LABEL[p.rol_principal] || p.rol_principal}</p>
                </div>
                <button
                  onClick={() => asignar.mutate({ personal_id: p.id })}
                  disabled={asignar.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-hs-purple text-white text-xs font-black hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  <Plus size={14} /> Asignar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Clock, DollarSign, Calendar, Save } from 'lucide-react';
import api from '../../services/api';

const CAMPOS = [
  {
    seccion: '⏰ Horario de entrada',
    color: 'blue',
    campos: [
      { clave: 'hora_inicio_filtro', label: 'Inicio filtro de entrada', tipo: 'time', desc: 'Hora en que abre la puerta' },
      { clave: 'hora_fin_filtro',    label: 'Límite sin retardo',       tipo: 'time', desc: 'Entrada después de esta hora = retardo' },
    ],
  },
  {
    seccion: '🏫 Horario académico y salida',
    color: 'green',
    campos: [
      { clave: 'hora_salida_normal',    label: 'Salida normal',           tipo: 'time', desc: 'Hora de salida regular' },
      { clave: 'hora_salida_extension', label: 'Salida con extensión',    tipo: 'time', desc: 'Máximo con extensión de horario' },
      { clave: 'alerta_minutos_sin_recoger', label: 'Minutos de tolerancia (sin recoger)', tipo: 'number', desc: 'Minutos después de salida para alertar al padre' },
    ],
  },
  {
    seccion: '💰 Reglas de negocio',
    color: 'yellow',
    campos: [
      { clave: 'costo_extension_hora', label: 'Costo extensión/hora ($)',  tipo: 'number', desc: 'Cargo por cada hora de extensión' },
      { clave: 'max_retardos_mes',     label: 'Máx. retardos por mes',     tipo: 'number', desc: 'Al rebasar este límite no entra ese día' },
    ],
  },
  {
    seccion: '📅 Período de pagos',
    color: 'purple',
    campos: [
      { clave: 'dia_inicio_pago', label: 'Día inicio pago sin recargo', tipo: 'number', desc: 'Primer día hábil del período' },
      { clave: 'dia_fin_pago',    label: 'Último día sin recargo',      tipo: 'number', desc: 'Después de este día aplica recargo diario' },
    ],
  },
];

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   title: 'text-blue-800'   },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  title: 'text-green-800'  },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-800' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-800' },
};

export default function Configuracion() {
  const qc = useQueryClient();
  const [valores, setValores] = useState({});
  const [guardado, setGuardado] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['config-horarios'],
    queryFn: () => api.get('/config/horarios').then(r => r.data),
    onSuccess: (data) => setValores(data.horarios || {}),
  });

  const mutation = useMutation({
    mutationFn: (data) => api.put('/config/horarios', data),
    onSuccess: () => {
      qc.invalidateQueries(['config-horarios']);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    },
  });

  const handleChange = (clave, val) => {
    setValores(prev => ({ ...prev, [clave]: val }));
  };

  const handleGuardar = () => mutation.mutate(valores);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
          <Settings size={24} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Configuración ⚙️</h1>
          <p className="text-sm font-semibold text-gray-500">Horarios y reglas de la escuela</p>
        </div>
      </div>

      {/* Secciones */}
      {CAMPOS.map(({ seccion, color, campos }) => {
        const c = COLOR_MAP[color];
        return (
          <div key={seccion} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-5 space-y-4`}>
            <h2 className={`font-black text-base ${c.title}`}>{seccion}</h2>
            {campos.map(({ clave, label, tipo, desc }) => (
              <div key={clave}>
                <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
                <input
                  type={tipo}
                  value={valores[clave] ?? ''}
                  onChange={e => handleChange(clave, e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-400 bg-white"
                  min={tipo === 'number' ? 0 : undefined}
                />
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        );
      })}

      {/* Botón guardar */}
      <button
        onClick={handleGuardar}
        disabled={mutation.isLoading}
        className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-black py-3 rounded-2xl transition-colors disabled:opacity-60"
      >
        <Save size={18} />
        {mutation.isLoading ? 'Guardando…' : guardado ? '¡Guardado! ✅' : 'Guardar cambios'}
      </button>

      {mutation.isError && (
        <p className="text-center text-red-500 text-sm font-semibold">
          Error al guardar. Intenta de nuevo.
        </p>
      )}
    </div>
  );
}

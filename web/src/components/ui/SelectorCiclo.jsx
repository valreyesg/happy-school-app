import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export default function SelectorCiclo({ value, onChange }) {
  const { data: ciclos = [] } = useQuery({
    queryKey: ['ciclos'],
    queryFn: () => api.get('/ciclos').then(r => r.data),
  });

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="">📅 Ciclo actual</option>
      {ciclos.filter(c => !c.activo).map(c => (
        <option key={c.id} value={c.id}>
          {c.nombre}
        </option>
      ))}
    </select>
  );
}

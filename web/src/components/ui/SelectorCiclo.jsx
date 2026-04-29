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
      className="input-hs text-sm py-2 px-3 w-auto min-w-[160px]"
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

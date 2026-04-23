import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { toMap } from '@/utils/catalogos';

export function useCatalogo(tipo) {
  const { data, isLoading } = useQuery({
    queryKey: ['catalogo', tipo],
    queryFn: () => api.get(`/catalogos/${tipo}`).then(r => r.data.items),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: Boolean(tipo),
  });
  return { items: data ?? [], map: data ? toMap(data) : {}, isLoading };
}

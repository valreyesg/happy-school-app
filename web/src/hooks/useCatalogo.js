import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { toMap } from '@/utils/catalogos';

export function useCatalogo(tipo) {
  const { data, isLoading } = useQuery({
    queryKey: ['catalogo', tipo],
    queryFn: () => api.get(`/catalogos/${tipo}`).then(r => r.data.items),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: Boolean(tipo),
  });
  return { items: data ?? [], map: data ? toMap(data) : {}, isLoading };
}

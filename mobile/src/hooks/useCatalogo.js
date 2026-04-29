import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import * as catalogosConstants from '@/constants/catalogos';

const FALLBACK_CATALOGS = {
  animo: catalogosConstants.ANIMO_LIST,
  cuanto: catalogosConstants.CUANTO_LIST,
  comportamiento: catalogosConstants.COMPORTAMIENTO_LIST,
  tiempos_comida: catalogosConstants.TIEMPOS_COMIDA,
  condiciones_panial: catalogosConstants.CONDICIONES_PANIAL,
  tipos_insumo: catalogosConstants.TIPOS_INSUMO,
  vomito_intensidad: catalogosConstants.VOMITO_INTENSIDAD,
};

function toMap(items) {
  return items.reduce((acc, item) => {
    acc[item.key] = item;
    return acc;
  }, {});
}

export function useCatalogo(tipo) {
  const fallback = FALLBACK_CATALOGS[tipo] ?? [];
  const map = toMap(fallback);

  const { data, isLoading } = useQuery({
    queryKey: ['catalogo', tipo],
    queryFn: () => api.get(`/catalogos/${tipo}`).then(r => r.data.items),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: Boolean(tipo),
  });

  const items = data ?? fallback;
  return {
    items,
    map: data ? toMap(data) : map,
    isLoading,
  };
}

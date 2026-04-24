import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Count de no leídas — polling cada 30 s
  const { data: badgeData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/notificaciones/no-leidas').then(r => r.data),
    refetchInterval: 30_000,
  });
  const count = badgeData?.count || 0;

  // Lista de notificaciones — solo cuando el panel está abierto
  const { data: notifs = [] } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => api.get('/notificaciones').then(r => r.data),
    enabled: open,
  });

  const marcarTodas = useMutation({
    mutationFn: () => api.put('/notificaciones/leer-todas'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  const marcarUna = useMutation({
    mutationFn: (id) => api.put(`/notificaciones/${id}/leer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const fmtFecha = (iso) =>
    new Date(iso).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón campanita */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl hover:bg-red-50 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={22} className="text-gray-600" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-black text-gray-800 text-sm">Notificaciones</p>
            {count > 0 && (
              <button
                onClick={() => marcarTodas.mutate()}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <p className="text-center text-sm text-gray-400 font-semibold py-8">
                Sin notificaciones
              </p>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.leida && marcarUna.mutate(n.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    n.leida ? 'opacity-60' : 'bg-red-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 leading-tight">{n.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.cuerpo}</p>
                      <p className="text-xs text-gray-400 mt-1">{fmtFecha(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

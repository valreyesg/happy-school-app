// Componente BadgeEstado — centralizado para Asistencia, FiltroEntrada, FiltroSalida
import { ESTADO_ASISTENCIA } from '@/utils/asistencia';

export default function BadgeEstado({ estado }) {
  const cfg = ESTADO_ASISTENCIA[estado] || ESTADO_ASISTENCIA.ausente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black ${cfg.bg} ${cfg.text}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

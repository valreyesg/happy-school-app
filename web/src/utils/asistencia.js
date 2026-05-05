// Estados de asistencia — centralizado para evitar duplicación
export const ESTADO_ASISTENCIA = {
  presente:   { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅', label: 'Presente' },
  retardo:    { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⏰', label: 'Retardo'  },
  no_entrada: { bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚫', label: 'No entró' },
  ausente:    { bg: 'bg-gray-100',   text: 'text-gray-400',   emoji: '⬜', label: 'Pendiente'},
};

// Alias para compatibilidad con código antiguo
export const ESTADO_BADGE = ESTADO_ASISTENCIA;
export const ESTADO_CONFIG = ESTADO_ASISTENCIA;
export const ESTADO_STYLE = {
  presente:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Presente',     emoji: '✅' },
  retardo:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Retardo',       emoji: '⏰' },
  no_entrada: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'No entró',      emoji: '🚫' },
  justificado: { bg: 'bg-blue-100',  text: 'text-hs-blue-dark',   label: 'Justificado',   emoji: '📋' },
  ausente:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Sin registrar', emoji: '⬜' },
};

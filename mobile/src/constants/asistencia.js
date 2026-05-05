// Estados de asistencia — centralizado para evitar duplicación (React Native)
export const ESTADO_CONFIG = {
  presente:     { label: 'Presente',    color: '#38A169', bg: '#C6F6D5', icon: '✓' },
  retardo:      { label: 'Retardo',     color: '#D69E2E', bg: '#FEFCBF', icon: '⏰' },
  ausente:      { label: 'Ausente',     color: '#E53E3E', bg: '#FED7D7', icon: '✗' },
  no_entrada:   { label: 'No entró',   color: '#718096', bg: '#EDF2F7', icon: '—' },
  pendiente:    { label: 'Pendiente',   color: '#805AD5', bg: '#FAF5FF', icon: '?' },
};

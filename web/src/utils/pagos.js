// Constantes compartidas para módulos de pagos (padre y directora)

export const SEMAFORO = {
  verde:      { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  label: 'Al corriente', emoji: '✅' },
  amarillo:   { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Con adeudo',   emoji: '⚠️' },
  rojo:       { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    label: 'Adeudo alto',  emoji: '🔴' },
  suspendido: { bg: 'bg-gray-200',   text: 'text-gray-700',   border: 'border-gray-400',   label: 'Suspendido',   emoji: '🚫' },
};

export const ESTADO_PAGO = {
  pagado:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Pagado'    },
  pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
  vencido:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Vencido'   },
  cancelado: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Cancelado' },
};

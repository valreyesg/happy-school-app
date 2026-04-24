import React from 'react';

const CONFIG_TIPO = {
  incidente: {
    color: '#E53E3E',
    bgLight: '#FFF5F5',
    icono: '🚨',
    label: 'Incidente',
  },
  aviso_extraordinario: {
    color: '#DD6B20',
    bgLight: '#FFFAF0',
    icono: '📢',
    label: 'Aviso',
  },
};

const fallback = {
  color: '#3182CE',
  bgLight: '#EBF8FF',
  icono: '🔔',
  label: 'Notificación',
};

export default function NotificacionModal({ notificacion, onEntendido }) {
  if (!notificacion) return null;

  const config = CONFIG_TIPO[notificacion.tipo] || fallback;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white animate-fade-in"
        style={{
          borderTop: `6px solid ${config.color}`,
        }}
      >
        {/* Contenido */}
        <div className="p-8 space-y-6">
          {/* Icono y badge */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ backgroundColor: config.bgLight }}
            >
              {config.icono}
            </div>
            <div
              className="px-4 py-1 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: config.color }}
            >
              {config.label}
            </div>
          </div>

          {/* Título y cuerpo */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-black text-gray-800 leading-tight">
              {notificacion.titulo}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {notificacion.cuerpo}
            </p>
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={onEntendido}
          className="w-full py-4 font-black text-white transition-colors"
          style={{
            backgroundColor: config.color,
          }}
          onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.target.style.opacity = '1')}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

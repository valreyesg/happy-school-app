// Helpers UI reutilizables para pantallas de Bitácora (maestra y padre).
// Centralizado desde: web/src/pages/maestra/Bitacora.jsx
//                     web/src/pages/padre/Bitacora.jsx

/**
 * Seccion — contenedor con título uppercase.
 * @param {string}  titulo
 * @param {string}  [emoji]       — opcional, se antepone al título
 * @param {string}  [colorTitulo] — clase Tailwind, ej 'text-hs-purple' (default) o 'text-red-500'
 * @param {string}  [padding]     — clase Tailwind para padding extra, ej 'p-5'
 */
export function Seccion({ titulo, emoji, colorTitulo = 'text-hs-purple', padding = '', children }) {
  return (
    <div className={`card-hs space-y-4 ${padding}`}>
      <h3 className={`text-xs font-black uppercase tracking-wider ${colorTitulo}`}>
        {emoji ? `${emoji} ` : ''}{titulo}
      </h3>
      {children}
    </div>
  );
}

/**
 * FilaInfo — fila label / valor con borde inferior.
 * Retorna null si valor está vacío.
 */
export function FilaInfo({ label, valor }) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 font-semibold">{label}</span>
      <span className="text-sm text-gray-800 font-bold text-right max-w-[60%]">{valor}</span>
    </div>
  );
}

/**
 * PildoraBool — badge verde/gris según valor booleano.
 * Retorna null si valor es null/undefined.
 */
export function PildoraBool({ label, valor }) {
  if (valor === null || valor === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
      valor ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'
    }`}>
      {valor ? '✓' : '✗'} {label}
    </span>
  );
}

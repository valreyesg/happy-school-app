import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CreditCard, CalendarDays, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

function proximos3Dias() {
  const hoy = new Date();
  const hasta = new Date(hoy);
  hasta.setDate(hoy.getDate() + 3);
  return {
    desde: hoy.toISOString().substring(0, 10),
    hasta: hasta.toISOString().substring(0, 10),
  };
}

const EMOJIS_ANIMO = { feliz: '😊', triste: '😢', cansado: '😴', inquieto: '😤', energico: '⚡' };
const EMOJIS_COMIDA = { todo: '😋', casi_todo: '😊', poco: '😐', no_comio: '❌' };
const COMPORTAMIENTO = {
  muy_bien:         { emoji: '⭐', label: 'Excelente', bg: 'bg-green-100',  text: 'text-green-700'  },
  bien:             { emoji: '👍', label: 'Bien',      bg: 'bg-blue-100',   text: 'text-blue-700'   },
  necesita_mejorar: { emoji: '⚠️', label: 'Mejorar',  bg: 'bg-orange-100', text: 'text-orange-700' },
};

function FiltroEntradaBadge({ item, label }) {
  if (item === null || item === undefined) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-bold text-gray-600">{label}:</span>
      <span className={`text-lg ${item ? '✅ text-green-600' : '⚠️ text-orange-600'}`}>
        {item ? '✅' : '⚠️'}
      </span>
    </div>
  );
}

function HijoCard({ hijo }) {
  const bit = hijo.bitacora_hoy;
  const entrada = hijo.filtro_entrada;

  return (
    <Link
      to={`/padre/bitacora?alumnoId=${hijo.id}&nombre=${encodeURIComponent(hijo.nombre_completo)}`}
      className="card-hs overflow-hidden border border-red-100 block hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-red-50">
        {hijo.foto_url ? (
          <img src={hijo.foto_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-3xl">👧🏻</div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-gray-800">{hijo.nombre_completo}</h2>
          <p className="text-sm font-bold text-red-500 mt-0.5">{hijo.grupo_nombre || hijo.grupo}</p>
        </div>
        <span className="text-red-400 text-lg">›</span>
      </div>

      {/* Filtro de entrada */}
      {entrada && entrada.puede_entrar !== null && (
        <div className={`px-5 py-3 border-b ${
          entrada.puede_entrar
            ? 'bg-green-50 border-green-100'
            : 'bg-red-50 border-red-100'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{entrada.puede_entrar ? '🚪 ✅' : '🚪 🚫'}</span>
            <span className={`text-xs font-black uppercase ${entrada.puede_entrar ? 'text-green-700' : 'text-red-700'}`}>
              {entrada.puede_entrar ? 'Entrada autorizada' : 'Entrada rechazada'}
            </span>
          </div>
          {entrada.motivo_no_entrada && !entrada.puede_entrar && (
            <p className="text-xs text-red-600 font-semibold mb-3">{entrada.motivo_no_entrada}</p>
          )}
          {/* Checklist siempre visible */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <FiltroEntradaBadge item={entrada.uñas_cortadas} label="Uñas" />
            <FiltroEntradaBadge item={entrada.trae_uniforme} label="Uniforme" />
            <FiltroEntradaBadge item={entrada.trae_bata} label="Bata" />
            <FiltroEntradaBadge item={entrada.agua_suficiente} label="Agua" />
            <FiltroEntradaBadge item={entrada.trae_termo} label="Termo" />
            <FiltroEntradaBadge item={entrada.sin_lagañas} label="Ojos" />
          </div>
        </div>
      )}

      {/* Bitácora del día */}
      {bit ? (
        <div className="p-5 space-y-3">
          {/* Ánimo + Conducta + Fiebre + Incidente - mismo nivel */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ánimo */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">{EMOJIS_ANIMO[bit.estado_animo] || '🤔'}</span>
              <div className="text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide">Ánimo</p>
                <p className="text-sm font-bold text-gray-700 capitalize">{bit.estado_animo?.replace('_', ' ') || '—'}</p>
              </div>
            </div>

            {/* Conducta */}
            {bit.comportamiento && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl">{COMPORTAMIENTO[bit.comportamiento]?.emoji}</span>
                <div className="text-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wide">Conducta</p>
                  <p className="text-sm font-bold text-gray-700">{COMPORTAMIENTO[bit.comportamiento]?.label}</p>
                </div>
              </div>
            )}

            {/* Fiebre */}
            {bit.tuvo_fiebre && (
              <div className="flex flex-col items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <span className="text-3xl">🌡️</span>
                <p className="text-xs font-black text-red-600">Tuvo fiebre</p>
              </div>
            )}

            {/* Incidente */}
            {bit.incidentes_sin_firmar > 0 && (
              <div className="flex flex-col items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                <span className="text-3xl">⚠️</span>
                <p className="text-xs font-black text-orange-600">
                  {bit.incidentes_sin_firmar === 1 ? '1 incidente' : `${bit.incidentes_sin_firmar} incidentes`}
                </p>
              </div>
            )}
          </div>

          {/* Notas maestra */}
          {bit.notas && (
            <p className="text-sm text-gray-500 italic bg-yellow-50 rounded-xl px-3 py-2">
              💬 {bit.notas}
            </p>
          )}
        </div>
      ) : (
        <div className="p-5 text-center text-gray-400">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm font-semibold">La bitácora de hoy aún no está lista</p>
        </div>
      )}
    </Link>
  );
}

const SALUDO_PARENTESCO = {
  madre:    '¡Hola, Mamá',
  papa:     '¡Hola, Papá',
  padre:    '¡Hola, Papá',
  abuelo:   '¡Hola',
  abuela:   '¡Hola',
  tutor:    '¡Hola',
  tutora:   '¡Hola',
};

function saludoPadre(parentesco, nombre) {
  const base = SALUDO_PARENTESCO[parentesco?.toLowerCase()] ?? '¡Hola';
  return `${base}, ${nombre?.split(' ')[0]}!`;
}

function ModalEvento({ ev, onClose }) {
  if (!ev) return null;
  const fechaInicio = new Date(ev.fecha_inicio.substring(0, 10) + 'T12:00:00');
  const fechaFin = ev.fecha_fin ? new Date(ev.fecha_fin.substring(0, 10) + 'T12:00:00') : null;
  const fmtFecha = d => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        {/* Ícono + categoría */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{ev.categoria_icono || '📅'}</span>
          <div>
            {ev.categoria_nombre && (
              <span className="text-xs font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ backgroundColor: (ev.categoria_color || '#805AD5') + '20', color: ev.categoria_color || '#805AD5' }}>
                {ev.categoria_nombre}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-xl font-black text-gray-800 mb-2">{ev.titulo}</h3>

        {/* Fecha */}
        <p className="text-sm font-semibold text-blue-500 capitalize mb-1">
          📆 {fmtFecha(fechaInicio)}
          {fechaFin && fechaFin.getTime() !== fechaInicio.getTime() && ` → ${fmtFecha(fechaFin)}`}
        </p>

        {/* Grupo */}
        {ev.grupo_nombre && (
          <p className="text-sm font-semibold text-gray-500 mb-3">👥 {ev.grupo_nombre}</p>
        )}

        {/* Descripción */}
        {ev.descripcion && (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-2xl px-4 py-3 mt-3">
            {ev.descripcion}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PadreDashboard() {
  const { usuario } = useAuthStore();
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: hijos = [], isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });

  const { desde, hasta } = proximos3Dias();
  const { data: eventosProximos = [] } = useQuery({
    queryKey: ['eventos-proximos', desde],
    queryFn: () => api.get(`/calendario?desde=${desde}&hasta=${hasta}`).then(r => r.data),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <ModalEvento ev={eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} />
      <div>
        <h1 className="text-2xl font-black text-gray-800">
          {saludoPadre(usuario?.parentesco, usuario?.nombre)} 👨🏻‍👩🏻‍👧🏻
        </h1>
        <p className="text-sm font-semibold text-gray-500 capitalize mt-0.5">{hoy}</p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/padre/bitacora',   Icon: BookOpen,    label: 'Bitácora',   bg: 'bg-purple-100', text: 'text-purple-600', hover: 'group-hover:bg-purple-200' },
          { to: '/padre/pagos',      Icon: CreditCard,  label: 'Pagos',      bg: 'bg-green-100',  text: 'text-green-600',  hover: 'group-hover:bg-green-200'  },
          { to: '/padre/calendario', Icon: CalendarDays,label: 'Calendario', bg: 'bg-blue-100',   text: 'text-blue-600',   hover: 'group-hover:bg-blue-200'   },
        ].map(({ to, Icon, label, bg, text, hover }) => (
          <Link key={to} to={to} className="card-hs p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group">
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center ${hover} transition-colors`}>
              <Icon size={22} className={text} />
            </div>
            <span className="font-bold text-xs text-gray-600">{label}</span>
          </Link>
        ))}
      </div>

      {/* Próximos 3 días */}
      {eventosProximos.length > 0 && (
        <div>
          <h2 className="text-base font-black text-gray-700 mb-3">📅 Próximos eventos</h2>
          <div className="space-y-2">
            {eventosProximos.map(ev => {
              const fecha = new Date(ev.fecha_inicio.substring(0, 10) + 'T12:00:00');
              const etiqueta = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <button
                  key={ev.id}
                  onClick={() => setEventoSeleccionado(ev)}
                  className="card-hs px-4 py-3 flex items-center gap-3 border border-blue-100 w-full text-left hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <span className="text-xl">{ev.categoria_icono || '📅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{ev.titulo}</p>
                    <p className="text-xs font-semibold text-blue-500 capitalize">{etiqueta}</p>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mis hijos */}
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">Mis hijos</h2>
        {isLoading ? (
          <div className="card-hs p-8 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full" />
          </div>
        ) : hijos.length === 0 ? (
          <div className="card-hs p-8 text-center text-gray-400 font-semibold">
            No hay hijos vinculados a esta cuenta
          </div>
        ) : (
          <div className="space-y-4">
            {hijos.map(hijo => <HijoCard key={hijo.id} hijo={hijo} />)}
          </div>
        )}
      </div>
    </div>
  );
}

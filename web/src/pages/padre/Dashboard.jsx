import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CreditCard, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const EMOJIS_ANIMO = { feliz: '😊', triste: '😢', cansado: '😴', inquieto: '😤', energico: '⚡' };
const EMOJIS_COMIDA = { todo: '🍽️', casi_todo: '🥢', poco: '🍱', no_comio: '❌' };
const COMPORTAMIENTO = {
  muy_bien:        { emoji: '⭐' },
  bien:            { emoji: '👍' },
  necesita_mejorar:{ emoji: '⚠️' },
};

function HijoCard({ hijo }) {
  const bit = hijo.bitacora_hoy;

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

      {/* Bitácora del día */}
      {bit ? (
        <div className="p-5">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Bitácora de hoy</p>
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div>
              <div className="text-3xl">{EMOJIS_ANIMO[bit.estado_animo] || '🤔'}</div>
              <p className="text-xs font-semibold text-gray-400 mt-1">Ánimo</p>
            </div>
            <div>
              <div className="text-3xl">{EMOJIS_COMIDA[bit.cuanto_comio] || '🍽️'}</div>
              <p className="text-xs font-semibold text-gray-400 mt-1">Comida</p>
            </div>
            <div>
              <div className="text-3xl">{bit.actividad_realizada ? '🎨' : '❌'}</div>
              <p className="text-xs font-semibold text-gray-400 mt-1">Actividades</p>
            </div>
            <div>
              <div className="text-3xl">{COMPORTAMIENTO[bit.comportamiento]?.emoji || '—'}</div>
              <p className="text-xs font-semibold text-gray-400 mt-1">Conducta</p>
            </div>
          </div>
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

export default function PadreDashboard() {
  const { usuario } = useAuthStore();
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: hijos = [], isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });

  return (
    <div className="space-y-6 animate-fade-in">
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

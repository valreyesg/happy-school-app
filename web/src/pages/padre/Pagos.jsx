import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const SEMAFORO = {
  verde:      { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  label: 'Al corriente',  emoji: '✅' },
  amarillo:   { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Con adeudo',    emoji: '⚠️' },
  rojo:       { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    label: 'Adeudo alto',   emoji: '🔴' },
  suspendido: { bg: 'bg-gray-200',   text: 'text-gray-700',   border: 'border-gray-400',   label: 'Suspendido',    emoji: '🚫' },
};

const ESTADO_PAGO = {
  pagado:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Pagado'   },
  pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'},
  vencido:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Vencido'  },
  cancelado: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Cancelado'},
};

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmt$(n) {
  return Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function FilaPagos({ pagos }) {
  return (
    <div className="space-y-2">
      {pagos.map(p => {
        const est = ESTADO_PAGO[p.estado] || ESTADO_PAGO.pendiente;
        return (
          <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{p.concepto_nombre}</p>
              <p className="text-xs text-gray-400 font-semibold">
                {p.mes_correspondiente ? `${MESES[p.mes_correspondiente - 1]} ${p.anio_correspondiente}` : '—'}
                {p.fecha_pago ? ` · Pagado ${new Date(p.fecha_pago.substring(0, 10)).toLocaleDateString('es-MX')}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${est.bg} ${est.text}`}>{est.label}</span>
              <span className="text-sm font-black text-gray-800 whitespace-nowrap">{fmt$(p.monto_total)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PanelHijo({ alumnoId }) {
  const [verTodos, setVerTodos] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['estado-alumno', alumnoId],
    queryFn: () => api.get(`/pagos/estado/${alumnoId}`).then(r => r.data),
  });

  if (isLoading) return (
    <div className="card-hs p-8 flex items-center justify-center">
      <div className="animate-spin w-7 h-7 border-4 border-green-400 border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return null;

  const { alumno, semaforo, saldo_pendiente, pagos = [], comida_semanal = [] } = data;
  const semaforoEfectivo = semaforo === 'verde' && saldo_pendiente > 0 ? 'amarillo' : semaforo;
  const cfg = SEMAFORO[semaforoEfectivo] || SEMAFORO.verde;

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  const pagosActuales = pagos.filter(p => p.mes_correspondiente === mesActual && p.anio_correspondiente === anioActual);
  const pagosAnteriores = pagos.filter(p => !(p.mes_correspondiente === mesActual && p.anio_correspondiente === anioActual));

  return (
    <div className="card-hs overflow-hidden">
      {/* Header alumno */}
      <div className={`flex items-center gap-4 p-5 border-b ${cfg.border} ${cfg.bg}`}>
        {alumno.foto_url
          ? <img src={alumno.foto_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
          : <div className="w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center text-3xl">👧🏻</div>
        }
        <div className="flex-1">
          <h2 className={`text-lg font-black ${cfg.text}`}>{alumno.nombre_completo}</h2>
          <p className="text-sm font-semibold text-gray-600">{alumno.grupo}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-black ${cfg.text}`}>{cfg.emoji} {cfg.label}</p>
          {saldo_pendiente > 0 && (
            <p className={`text-sm font-bold ${cfg.text}`}>Adeudo: {fmt$(saldo_pendiente)}</p>
          )}
        </div>
      </div>

      {/* Comida semanal */}
      {comida_semanal.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">🍱 Comida semanal</p>
          <div className="flex gap-2 flex-wrap">
            {comida_semanal.map((c, i) => (
              <div key={i} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${c.pagado ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {new Date(c.semana_inicio + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                {' '}— {c.pagado ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de pagos */}
      <div className="p-5">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">
          💳 {MESES[mesActual - 1]} {anioActual}
        </p>

        {pagosActuales.length === 0 ? (
          <p className="text-center text-sm text-gray-400 font-semibold py-2">Sin movimientos este mes</p>
        ) : (
          <FilaPagos pagos={pagosActuales} />
        )}

        {verTodos && pagosAnteriores.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Meses anteriores</p>
            <FilaPagos pagos={pagosAnteriores} />
          </div>
        )}

        {pagosAnteriores.length > 0 && (
          <button
            onClick={() => setVerTodos(v => !v)}
            className="mt-4 w-full text-center text-xs font-bold text-gray-500 hover:text-gray-700 py-2 border border-dashed border-gray-200 rounded-xl transition-colors"
          >
            {verTodos ? '▲ Ocultar anteriores' : `Ver todos los pagos (${pagos.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PadrePagos() {
  const { data: hijos = [], isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Pagos 💰</h1>
        <p className="text-sm font-semibold text-gray-500 mt-0.5">Estado de cuenta y adeudos</p>
      </div>

      {isLoading ? (
        <div className="card-hs p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full" />
        </div>
      ) : hijos.length === 0 ? (
        <div className="card-hs p-8 text-center text-gray-400 font-semibold">
          No hay hijos vinculados a esta cuenta
        </div>
      ) : (
        <div className="space-y-4">
          {hijos.map(hijo => <PanelHijo key={hijo.id} alumnoId={hijo.id} />)}
        </div>
      )}
    </div>
  );
}

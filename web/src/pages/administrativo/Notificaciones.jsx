// Solo web — portal Admin. Mobile no afectado.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmt(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
}

// ─── Semáforo local (sin importar utils para no acoplar) ──────────────────────

function semaforo(dias, tieneVencidos) {
  if (dias >= 60 || (tieneVencidos && dias >= 30)) return { label: 'Suspendido', bg: 'bg-gray-200', text: 'text-gray-700' };
  if (dias >= 30 || tieneVencidos) return { label: 'Vencido', bg: 'bg-red-100', text: 'text-red-700' };
  if (dias >= 1)  return { label: 'Atrasado', bg: 'bg-yellow-100', text: 'text-yellow-700' };
  return { label: 'Pendiente', bg: 'bg-blue-100', text: 'text-blue-700' };
}

// ─── Texto por defecto del mensaje de alerta ─────────────────────────────────

// saldoMes = deuda del mes seleccionado; saldoTotal = adeudo acumulado histórico
function textoAlerta(alumno, saldoMes, dias, saldoTotal) {
  const fmtMes   = fmt(saldoMes);
  const fmtTotal = fmt(saldoTotal ?? saldoMes);
  const tieneHistorico = (saldoTotal ?? saldoMes) > saldoMes;

  const linea1 = dias > 0
    ? `Estimado padre/tutor de ${alumno.alumno_nombre},\n\nTe informamos que tienes un saldo pendiente de ${fmtMes} del mes en curso con ${dias} día${dias !== 1 ? 's' : ''} de retraso.`
    : `Estimado padre/tutor de ${alumno.alumno_nombre},\n\nTe recordamos que tienes un saldo pendiente de ${fmtMes} del mes en curso.`;
  const linea2 = tieneHistorico
    ? ` Tu adeudo total acumulado es de ${fmtTotal}.`
    : '';
  return linea1 + linea2 + ' Te pedimos regularizar tu cuenta a la brevedad.';
}

// ─── Modal enviar alerta ──────────────────────────────────────────────────────

function ModalAlerta({ alumno, mes, anio, onClose }) {
  const saldoMes   = parseFloat(alumno.saldo_pendiente || 0);
  const saldoTotal = parseFloat(alumno.saldo_total     || alumno.saldo_pendiente || 0);
  const dias       = parseInt(alumno.max_dias_atraso || 0);
  const padres     = alumno.padres?.filter(Boolean) || [];

  const [mensaje, setMensaje] = useState(() => textoAlerta(alumno, saldoMes, dias, saldoTotal));
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => api.post('/notificaciones/alerta-pago', {
      alumno_id: alumno.alumno_id,
      mensaje: mensaje.trim(),
      mes,
      anio,
    }).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Alerta enviada a ${data.enviadas} padre${data.enviadas !== 1 ? 's' : ''} de ${data.alumno}`);
      qc.invalidateQueries({ queryKey: ['admin-adeudos'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al enviar alerta'),
  });

  return (
    <Modal open={true} onClose={onClose} title="Enviar alerta de pago 🔔" size="md" closeOnBackdrop={false}>
      <div className="space-y-4">

        {/* Info alumno */}
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
          {alumno.foto_url
            ? <img src={alumno.foto_url} className="w-10 h-10 rounded-full object-cover" alt="" />
            : <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-black">
                {alumno.alumno_nombre?.[0]}
              </div>
          }
          <div>
            <p className="font-black text-gray-800 text-sm">{alumno.alumno_nombre}</p>
            <p className="text-xs text-gray-500">
              {alumno.grupo_nombre} · Este mes: <span className="font-bold text-red-600">{fmt(saldoMes)}</span>
              {saldoTotal > saldoMes && (
                <> · Total: <span className="font-bold text-red-800">{fmt(saldoTotal)}</span></>
              )}
            </p>
            {dias > 0 && <p className="text-xs text-red-500 font-semibold">{dias} día{dias !== 1 ? 's' : ''} de retraso</p>}
          </div>
        </div>

        {/* Destinatarios */}
        {padres.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Se enviará a:</p>
            <div className="flex flex-wrap gap-2">
              {padres.map((p, i) => (
                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                  {p.padre_nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje editable — texto precargado, editable libremente */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-gray-600">Mensaje al padre</label>
            <button
              type="button"
              onClick={() => setMensaje(textoAlerta(alumno, saldoMes, dias, saldoTotal))}
              className="text-xs text-hs-blue-dark font-semibold hover:underline"
            >
              Restaurar texto
            </button>
          </div>
          <textarea
            className="input-hs resize-none leading-relaxed"
            rows={6}
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Puedes editar el texto antes de enviarlo.</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !mensaje.trim()}
            className="btn-hs flex-1 disabled:opacity-50"
          >
            {mut.isPending ? 'Enviando…' : `Enviar alerta${padres.length > 1 ? ` (${padres.length})` : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Fila alumno ──────────────────────────────────────────────────────────────

function FilaAdeudo({ alumno, onEnviar }) {
  const dias     = parseInt(alumno.max_dias_atraso || 0);
  const sf       = semaforo(dias, alumno.tiene_vencidos);
  const saldo    = parseFloat(alumno.saldo_pendiente || 0);
  const alertaHoy = !!alumno.ultima_alerta_hoy;
  const leida    = !!alumno.alerta_leida;

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      {/* Alumno */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {alumno.foto_url
            ? <img src={alumno.foto_url} className="w-8 h-8 rounded-full object-cover" alt="" />
            : <div className="w-8 h-8 rounded-full bg-hs-blue/20 flex items-center justify-center text-hs-blue-dark font-black text-sm">
                {alumno.alumno_nombre?.[0]}
              </div>
          }
          <div>
            <p className="font-bold text-gray-800 text-sm">{alumno.alumno_nombre}</p>
            <p className="text-xs text-gray-500">{alumno.grupo_nombre}</p>
          </div>
        </div>
      </td>

      {/* Adeudo */}
      <td className="px-4 py-3">
        <p className="text-sm font-black text-red-600">{fmt(saldo)}</p>
        <p className="text-xs text-gray-400">{alumno.cargos_adeudados} cargo{alumno.cargos_adeudados !== 1 ? 's' : ''}</p>
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${sf.bg} ${sf.text}`}>
          {sf.label}
        </span>
        {dias > 0 && <p className="text-xs text-gray-400 mt-0.5">{dias} días</p>}
      </td>

      {/* Estado notificación */}
      <td className="px-4 py-3">
        {alertaHoy ? (
          <div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              leida ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {leida ? '✅ Leída' : '⏳ Sin leer'}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">Enviada hoy</p>
          </div>
        ) : (
          <span className="text-xs text-gray-400 font-semibold">Sin alerta hoy</span>
        )}
      </td>

      {/* Padres */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {(alumno.padres || []).filter(Boolean).slice(0, 2).map((p, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-semibold truncate max-w-[100px]">
              {p.padre_nombre?.split(' ')[0]}
            </span>
          ))}
          {(alumno.padres || []).filter(Boolean).length > 2 && (
            <span className="text-xs text-gray-400">+{(alumno.padres || []).filter(Boolean).length - 2}</span>
          )}
        </div>
      </td>

      {/* Acción */}
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onEnviar(alumno)}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
            alertaHoy
              ? 'border-2 border-orange-300 text-orange-600 hover:bg-orange-50'
              : 'btn-hs'
          }`}
        >
          {alertaHoy ? 'Re-enviar' : '🔔 Alertar'}
        </button>
      </td>
    </tr>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AdminNotificaciones() {
  const hoy = new Date();
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos | sin_alertar | alertados
  const [modalAlumno, setModalAlumno] = useState(null);
  const qc = useQueryClient();

  const { data: adeudos = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-adeudos', mes, anio],
    queryFn: () => api.get('/notificaciones/adeudos', { params: { mes, anio } }).then(r => r.data),
  });

  const handleNavMes = (delta) => {
    const d = new Date(anio, mes - 1 + delta, 1);
    setMes(d.getMonth() + 1);
    setAnio(d.getFullYear());
  };

  // Filtros locales
  const lista = adeudos
    .filter(a => {
      if (busqueda) return a.alumno_nombre.toLowerCase().includes(busqueda.toLowerCase());
      return true;
    })
    .filter(a => {
      if (filtroEstado === 'sin_alertar') return !a.ultima_alerta_hoy;
      if (filtroEstado === 'alertados')   return !!a.ultima_alerta_hoy;
      return true;
    });

  const sinAlertar = adeudos.filter(a => !a.ultima_alerta_hoy).length;
  const alertadosHoy = adeudos.filter(a => !!a.ultima_alerta_hoy).length;
  const leidos = adeudos.filter(a => a.alerta_leida).length;

  // Enviar alertas masivas a todos los sin alertar
  const mutMasivo = useMutation({
    mutationFn: async () => {
      const sinAlertar = adeudos.filter(a => !a.ultima_alerta_hoy);
      await Promise.all(sinAlertar.map(a => {
        const saldoMes   = parseFloat(a.saldo_pendiente || 0);
        const saldoTotal = parseFloat(a.saldo_total     || a.saldo_pendiente || 0);
        const dias       = parseInt(a.max_dias_atraso || 0);
        return api.post('/notificaciones/alerta-pago', {
          alumno_id: a.alumno_id,
          mensaje: textoAlerta(a, saldoMes, dias, saldoTotal),
          mes,
          anio,
        }).then(r => r.data);
      }));
      return sinAlertar.length;
    },
    onSuccess: (n) => {
      toast.success(`Alertas enviadas a ${n} alumno${n !== 1 ? 's' : ''}`);
      qc.invalidateQueries({ queryKey: ['admin-adeudos'] });
    },
    onError: () => toast.error('Error al enviar alertas masivas'),
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Alertas de Pago 🔔</h1>
          <p className="text-gray-500 font-semibold mt-1">Notificaciones a padres con adeudos pendientes</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Navegación de mes */}
          <div className="flex items-center gap-2">
            <button onClick={() => handleNavMes(-1)}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center transition-colors">‹</button>
            <span className="text-sm font-black text-gray-800 min-w-[130px] text-center">
              {MESES[mes - 1]} {anio}
            </span>
            <button onClick={() => handleNavMes(1)}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center transition-colors">›</button>
          </div>

          {sinAlertar > 0 && (
            <button
              onClick={() => mutMasivo.mutate()}
              disabled={mutMasivo.isPending}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
            >
              {mutMasivo.isPending ? 'Enviando…' : `🔔 Alertar a todos (${sinAlertar})`}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-hs p-4 border-l-4 border-red-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Con adeudo</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{adeudos.length}</p>
          <p className="text-xs text-gray-400">alumno{adeudos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card-hs p-4 border-l-4 border-orange-400">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sin alertar hoy</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{sinAlertar}</p>
          <p className="text-xs text-gray-400">pendientes de alerta</p>
        </div>
        <div className="card-hs p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alertas leídas</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{leidos}</p>
          <p className="text-xs text-gray-400">de {alertadosHoy} enviadas hoy</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-hs p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar alumno…"
            className="input-hs flex-1"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="flex gap-2">
            {[
              { key: 'todos',       label: 'Todos' },
              { key: 'sin_alertar', label: 'Sin alertar' },
              { key: 'alertados',   label: 'Alertados hoy' },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltroEstado(f.key)}
                className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  filtroEstado === f.key
                    ? 'bg-hs-blue-dark text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 rounded-full border-4 border-hs-blue border-t-transparent animate-spin" />
          </div>
        ) : lista.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">{adeudos.length === 0 ? '🎉' : '🔍'}</p>
            <p className="text-gray-500 font-semibold">
              {adeudos.length === 0
                ? `Sin adeudos registrados para ${MESES[mes - 1]} ${anio}`
                : 'Sin resultados con estos filtros'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b bg-gray-50">
                  <th className="text-left px-4 py-2 font-bold">Alumno</th>
                  <th className="text-left px-4 py-2 font-bold">Adeudo</th>
                  <th className="text-left px-4 py-2 font-bold">Estado</th>
                  <th className="text-left px-4 py-2 font-bold">Alerta</th>
                  <th className="text-left px-4 py-2 font-bold">Padres</th>
                  <th className="text-right px-4 py-2 font-bold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(a => (
                  <FilaAdeudo
                    key={a.alumno_id}
                    alumno={a}
                    onEnviar={setModalAlumno}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal alerta */}
      {modalAlumno && (
        <ModalAlerta alumno={modalAlumno} mes={mes} anio={anio} onClose={() => setModalAlumno(null)} />
      )}
    </div>
  );
}

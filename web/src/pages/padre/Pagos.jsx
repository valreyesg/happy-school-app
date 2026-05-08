import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { SEMAFORO, ESTADO_PAGO } from '@/utils/pagos';
import Modal from '@/components/ui/Modal';
import { Upload, Clock, CheckCircle, XCircle } from 'lucide-react';
import { MESES_CORTOS as MESES } from '@/utils/fecha';

function fmt$(n) {
  return Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function FilaPagos({ pagos, onSubirComprobante }) {
  return (
    <div className="space-y-2">
      {pagos.map(p => {
        const est = ESTADO_PAGO[p.estado] || ESTADO_PAGO.pendiente;
        const puedeSubir = ['pendiente', 'vencido'].includes(p.estado);
        const enRevision = p.estado === 'por_confirmar';

        return (
          <div key={p.id} className="py-2.5 border-b border-gray-50 last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{p.concepto_nombre}</p>
                <p className="text-xs text-gray-400 font-semibold">
                  {p.mes_correspondiente ? `${MESES[p.mes_correspondiente - 1]} ${p.anio_correspondiente}` : '—'}
                  {p.fecha_pago ? ` · Pagado ${new Date(p.fecha_pago.substring(0, 10) + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${est.bg} ${est.text}`}>{est.label}</span>
                <span className="text-sm font-black text-gray-800 whitespace-nowrap">{fmt$(p.monto_total)}</span>
              </div>
            </div>

            {/* Botón subir comprobante para pagos pendientes/vencidos */}
            {puedeSubir && (
              <button
                onClick={() => onSubirComprobante(p)}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
              >
                <Upload size={14} />
                Subir comprobante de transferencia
              </button>
            )}

            {/* Indicador en revisión */}
            {enRevision && (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                <Clock size={14} />
                Comprobante enviado, pendiente de aprobación
              </div>
            )}

            {/* Nota de rechazo si la hay */}
            {p.rechazo_nota && p.estado === 'pendiente' && (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                <XCircle size={14} />
                Comprobante rechazado: {p.rechazo_nota}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ModalComprobante({ pago, onClose }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [referencia, setReferencia] = useState('');
  const [preview, setPreview] = useState(null);

  const mutation = useMutation({
    mutationFn: (formData) => api.post(`/pagos/${pago.id}/comprobante`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estado-alumno'] });
      onClose();
    },
  });

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('foto', file);
    if (referencia.trim()) fd.append('referencia', referencia.trim());
    mutation.mutate(fd);
  };

  return (
    <Modal open title="Subir comprobante de pago" onClose={onClose} size="sm">
      <div className="space-y-4">
        {/* Info del pago */}
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-sm font-bold text-gray-800">{pago.concepto_nombre}</p>
          <p className="text-xs text-gray-500 font-semibold">
            {pago.mes_correspondiente ? `${MESES[pago.mes_correspondiente - 1]} ${pago.anio_correspondiente}` : ''}
          </p>
          <p className="text-lg font-black text-gray-800 mt-1">{fmt$(pago.monto_total)}</p>
        </div>

        {/* Selector de imagen */}
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Imagen del comprobante *</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          {preview ? (
            <div className="mt-2 relative">
              <img src={preview} alt="Comprobante" className="w-full rounded-xl border border-gray-200 max-h-48 object-contain bg-gray-50" />
              <button
                onClick={() => { setFile(null); setPreview(null); fileRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow hover:bg-red-50"
              >
                <XCircle size={18} className="text-red-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
            >
              <Upload size={28} />
              <span className="text-sm font-bold">Toca para seleccionar imagen</span>
            </button>
          )}
        </div>

        {/* Referencia opcional */}
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Referencia de transferencia (opcional)</label>
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej: Ref. 12345678"
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
          />
        </div>

        {/* Error */}
        {mutation.isError && (
          <p className="text-sm text-red-600 font-bold">
            {mutation.error?.response?.data?.error || 'Error al subir comprobante'}
          </p>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle size={16} />
                Enviar comprobante
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PanelHijo({ alumnoId }) {
  const [verTodos, setVerTodos] = useState(false);
  const [pagoComprobante, setPagoComprobante] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['estado-alumno', alumnoId],
    queryFn: () => api.get(`/pagos/estado/${alumnoId}`).then(r => r.data),
  });

  if (isLoading) return (
    <div className="card-hs p-8 flex items-center justify-center">
      <div className="animate-spin w-7 h-7 border-4 border-hs-purple border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return null;

  const { alumno, semaforo, saldo_pendiente, pagos = [], comida_semanal = [] } = data;
  const cfg = SEMAFORO[semaforo] || SEMAFORO.verde;

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
          <FilaPagos pagos={pagosActuales} onSubirComprobante={setPagoComprobante} />
        )}

        {verTodos && pagosAnteriores.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Meses anteriores</p>
            <FilaPagos pagos={pagosAnteriores} onSubirComprobante={setPagoComprobante} />
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

      {/* Modal subir comprobante */}
      {pagoComprobante && (
        <ModalComprobante pago={pagoComprobante} onClose={() => setPagoComprobante(null)} />
      )}
    </div>
  );
}

export default function PadrePagos() {
  const { data = {}, isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });
  const hijos = data.hijos || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Pagos 💰</h1>
        <p className="text-sm font-semibold text-gray-500 mt-0.5">Estado de cuenta y adeudos</p>
      </div>

      {isLoading ? (
        <div className="card-hs p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-hs-purple border-t-transparent rounded-full" />
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

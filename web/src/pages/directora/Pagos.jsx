import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const SEMAFORO = {
  verde:      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Al corriente' },
  amarillo:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Atención'     },
  rojo:       { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Vencido'      },
  suspendido: { bg: 'bg-gray-200',   text: 'text-gray-600',   label: 'Suspendido'   },
};

const ESTADO_PAGO = {
  pagado:    { bg: 'bg-green-100 text-green-700',   label: 'Pagado'    },
  pendiente: { bg: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
  vencido:   { bg: 'bg-red-100 text-red-700',       label: 'Vencido'   },
  cancelado: { bg: 'bg-gray-100 text-gray-500',     label: 'Cancelado' },
};

const METODOS = ['efectivo', 'transferencia', 'tarjeta'];
const TIPOS_CONCEPTO = ['colegiatura', 'material', 'comida', 'extension', 'evento', 'otro'];

function fmt(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
}

function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, valor, sub, color }) {
  return (
    <div className={`card-hs p-4 border-l-4 ${color}`}>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-gray-800 mt-1">{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Modal Registrar Pago ─────────────────────────────────────────────────────

function ModalPago({ alumno, conceptos, mes, anio, onClose, onSaved }) {
  const { data: todosAlumnos = [] } = useQuery({
    queryKey: ['alumnos-select'],
    queryFn: () => api.get('/alumnos', { params: { limit: 200 } }).then(r => r.data?.alumnos || r.data),
    enabled: !alumno,
  });

  const [form, setForm] = useState({
    alumno_id: alumno?.id || '',
    concepto_id: '',
    monto_base: '',
    mes_correspondiente: mes,
    anio_correspondiente: anio,
    metodo_pago: 'efectivo',
    referencia: '',
    notas: '',
    fecha_pago: new Date().toISOString().slice(0, 10),
    aplicar_recargo: true,
  });
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const conceptoSel = conceptos.find(c => c.id === form.concepto_id);

  const mut = useMutation({
    mutationFn: d => api.post('/pagos', d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagos-dashboard'] });
      qc.invalidateQueries({ queryKey: ['pagos-lista'] });
      onSaved?.();
      onClose();
    },
    onError: e => setError(e.response?.data?.error || 'Error al registrar pago'),
  });

  const handleConcepto = (id) => {
    const cp = conceptos.find(c => c.id === id);
    setForm(f => ({ ...f, concepto_id: id, monto_base: cp ? cp.monto_base : '' }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.alumno_id || !form.concepto_id || !form.monto_base)
      return setError('Alumno, concepto y monto son obligatorios');
    mut.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h3 className="text-lg font-black text-gray-800">Registrar Pago 💰</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {alumno ? (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              {alumno.foto_url
                ? <img src={alumno.foto_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                : <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-black">{alumno.nombre_completo?.[0]}</div>
              }
              <div>
                <p className="font-black text-gray-800 text-sm">{alumno.nombre_completo}</p>
                <p className="text-xs text-gray-500">{alumno.grupo_nombre}</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Alumno *</label>
              <select className="input-hs" value={form.alumno_id}
                onChange={e => setForm(f => ({ ...f, alumno_id: e.target.value }))} required>
                <option value="">Selecciona un alumno…</option>
                {todosAlumnos.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre_completo}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Concepto *</label>
            <select className="input-hs" value={form.concepto_id} onChange={e => handleConcepto(e.target.value)} required>
              <option value="">Selecciona un concepto...</option>
              {conceptos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} — {fmt(c.monto_base)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Mes</label>
              <select className="input-hs" value={form.mes_correspondiente}
                onChange={e => setForm(f => ({ ...f, mes_correspondiente: parseInt(e.target.value) }))}>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Año</label>
              <input type="number" className="input-hs" value={form.anio_correspondiente}
                onChange={e => setForm(f => ({ ...f, anio_correspondiente: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Monto base *</label>
            <input type="number" step="0.01" className="input-hs" value={form.monto_base}
              onChange={e => setForm(f => ({ ...f, monto_base: e.target.value }))} required />
          </div>

          {conceptoSel?.dia_recargo && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.aplicar_recargo}
                onChange={e => setForm(f => ({ ...f, aplicar_recargo: e.target.checked }))} />
              <span className="text-sm font-semibold text-gray-700">Calcular recargo automático</span>
            </label>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Método de pago</label>
            <div className="flex gap-2">
              {METODOS.map(m => (
                <button key={m} type="button"
                  onClick={() => setForm(f => ({ ...f, metodo_pago: m }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                    form.metodo_pago === m
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Fecha de pago</label>
              <input type="date" className="input-hs" value={form.fecha_pago}
                onChange={e => setForm(f => ({ ...f, fecha_pago: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Referencia</label>
              <input type="text" className="input-hs" placeholder="Folio, transferencia…" value={form.referencia}
                onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Notas</label>
            <textarea className="input-hs resize-none" rows={2} value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
          </div>

          {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mut.isPending}
              className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black disabled:opacity-50">
              {mut.isPending ? 'Guardando…' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Conceptos ──────────────────────────────────────────────────────────

function ModalConceptos({ conceptos, onClose }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'colegiatura', monto_base: '', es_mensual: true, dia_pago: 1, dia_recargo: 6, monto_recargo_dia: 0 });
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const crear = useMutation({
    mutationFn: d => api.post('/pagos/conceptos', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pagos-conceptos'] }); setForm({ nombre: '', tipo: 'colegiatura', monto_base: '', es_mensual: true, dia_pago: 1, dia_recargo: 6, monto_recargo_dia: 0 }); },
    onError: e => setError(e.response?.data?.error || 'Error'),
  });

  const eliminar = useMutation({
    mutationFn: id => api.delete(`/pagos/conceptos/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagos-conceptos'] }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h3 className="text-lg font-black text-gray-800">Conceptos de Pago</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Lista */}
          <div className="space-y-2">
            {conceptos.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.tipo} · {fmt(c.monto_base)}
                    {c.dia_recargo ? ` · Recargo día ${c.dia_recargo}` : ''}
                  </p>
                </div>
                <button onClick={() => eliminar.mutate(c.id)}
                  className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">
                  Quitar
                </button>
              </div>
            ))}
            {!conceptos.length && <p className="text-gray-400 text-sm text-center py-4">Sin conceptos</p>}
          </div>

          {/* Formulario nuevo */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-black text-gray-700">Nuevo concepto</p>
            <input className="input-hs" placeholder="Nombre *" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Tipo</label>
                <select className="input-hs" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {TIPOS_CONCEPTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Monto base</label>
                <input type="number" step="0.01" className="input-hs" value={form.monto_base}
                  onChange={e => setForm(f => ({ ...f, monto_base: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Día de pago</label>
                <input type="number" min="1" max="28" className="input-hs" value={form.dia_pago}
                  onChange={e => setForm(f => ({ ...f, dia_pago: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Día inicio recargo</label>
                <input type="number" min="1" max="31" className="input-hs" value={form.dia_recargo}
                  onChange={e => setForm(f => ({ ...f, dia_recargo: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Recargo por día ($)</label>
              <input type="number" step="0.01" className="input-hs" value={form.monto_recargo_dia}
                onChange={e => setForm(f => ({ ...f, monto_recargo_dia: parseFloat(e.target.value) }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" checked={form.es_mensual}
                onChange={e => setForm(f => ({ ...f, es_mensual: e.target.checked }))} />
              <span className="text-sm font-semibold text-gray-700">Cargo mensual recurrente</span>
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={() => crear.mutate(form)} disabled={crear.isPending}
              className="w-full py-2 rounded-xl bg-purple-600 text-white font-black text-sm disabled:opacity-50">
              {crear.isPending ? 'Guardando…' : '+ Agregar concepto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fila alumno en la tabla ──────────────────────────────────────────────────

function FilaAlumno({ alumno, conceptos, mes, anio }) {
  const [expandido, setExpandido] = useState(false);
  const [modalPago, setModalPago] = useState(false);

  const { data: estado } = useQuery({
    queryKey: ['estado-alumno', alumno.id, mes, anio],
    queryFn: () => api.get(`/pagos/estado/${alumno.id}`).then(r => r.data),
    enabled: expandido,
  });

  const sf = SEMAFORO[alumno.semaforo] || SEMAFORO.verde;
  const pagosMes = estado?.pagos?.filter(
    p => p.mes_correspondiente === mes && p.anio_correspondiente === anio
  ) || [];

  return (
    <>
      <tr
        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpandido(e => !e)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {alumno.foto_url
              ? <img src={alumno.foto_url} className="w-8 h-8 rounded-full object-cover" alt="" />
              : <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black text-sm">{alumno.nombre_completo?.[0]}</div>
            }
            <span className="font-bold text-gray-800 text-sm">{alumno.nombre_completo}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ backgroundColor: alumno.grupo_color + '20', color: alumno.grupo_color }}>
            {alumno.grupo_nombre}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${sf.bg} ${sf.text}`}>
            {sf.label}
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-bold text-red-600">
          {alumno.saldo_pendiente > 0 ? fmt(alumno.saldo_pendiente) : <span className="text-green-600">—</span>}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={e => { e.stopPropagation(); setModalPago(true); }}
            className="btn-hs text-xs px-3 py-1.5"
          >
            + Pago
          </button>
        </td>
      </tr>

      {expandido && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-6 py-4 border-b">
            {!estado
              ? <p className="text-gray-400 text-sm">Cargando…</p>
              : pagosMes.length === 0
                ? <p className="text-gray-400 text-sm">Sin registros este mes</p>
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pagosMes.map(p => {
                      const ep = ESTADO_PAGO[p.estado] || ESTADO_PAGO.pendiente;
                      return (
                        <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-black text-gray-700">{p.concepto_nombre}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ep.bg}`}>{ep.label}</span>
                          </div>
                          <p className="text-lg font-black text-gray-900">{fmt(p.monto_total)}</p>
                          {p.monto_recargo > 0 && (
                            <p className="text-xs text-red-500">+{fmt(p.monto_recargo)} recargo</p>
                          )}
                          {p.fecha_pago && <p className="text-xs text-gray-400 mt-1">{fmtFecha(p.fecha_pago)} · {p.metodo_pago}</p>}
                        </div>
                      );
                    })}
                  </div>
                )
            }
          </td>
        </tr>
      )}

      {modalPago && (
        <ModalPago
          alumno={{ id: alumno.id, nombre_completo: alumno.nombre_completo, foto_url: alumno.foto_url, grupo_nombre: alumno.grupo_nombre }}
          conceptos={conceptos}
          mes={mes}
          anio={anio}
          onClose={() => setModalPago(false)}
          onSaved={() => setExpandido(true)}
        />
      )}
    </>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function PagosDirectora() {
  const hoy = new Date();
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroSemaforo, setFiltroSemaforo] = useState('');
  const [showModalConceptos, setShowModalConceptos] = useState(false);
  const [showModalPagoGlobal, setShowModalPagoGlobal] = useState(false);
  const qc = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ['pagos-dashboard', mes, anio],
    queryFn: () => api.get('/pagos/dashboard', { params: { mes, anio } }).then(r => r.data),
  });

  const { data: conceptos = [] } = useQuery({
    queryKey: ['pagos-conceptos'],
    queryFn: () => api.get('/pagos/conceptos').then(r => r.data),
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  // Lista de alumnos con su estado financiero del mes
  const { data: pagosLista = [], isLoading } = useQuery({
    queryKey: ['pagos-lista', mes, anio],
    queryFn: () => api.get('/pagos', { params: { mes, anio } }).then(r => r.data),
  });

  // Consolidar por alumno
  const alumnosMapa = useMemo(() => {
    const map = new Map();
    pagosLista.forEach(p => {
      if (!map.has(p.alumno_id)) {
        map.set(p.alumno_id, {
          id: p.alumno_id,
          nombre_completo: p.alumno_nombre,
          foto_url: p.foto_url,
          grupo_id: p.grupo_id,
          grupo_nombre: p.grupo_nombre,
          grupo_color: p.color_hex,
          pagos: [],
          saldo_pendiente: 0,
          semaforo: 'verde',
        });
      }
      const al = map.get(p.alumno_id);
      al.pagos.push(p);
      if (['pendiente', 'vencido'].includes(p.estado))
        al.saldo_pendiente += parseFloat(p.monto_total);
    });
    // Calcular semáforo
    map.forEach(al => {
      const pendVenc = al.pagos.filter(p => ['pendiente', 'vencido'].includes(p.estado));
      const maxAtraso = pendVenc.length ? Math.max(...pendVenc.map(p => p.dias_atraso || 0)) : 0;
      const tieneVencido = pendVenc.some(p => p.estado === 'vencido');
      if (maxAtraso >= 60 || (tieneVencido && maxAtraso >= 30)) al.semaforo = 'suspendido';
      else if (maxAtraso >= 30 || tieneVencido) al.semaforo = 'rojo';
      else if (maxAtraso >= 1) al.semaforo = 'amarillo';
      else al.semaforo = 'verde';
    });
    return map;
  }, [pagosLista]);

  const alumnos = useMemo(() => {
    let lista = Array.from(alumnosMapa.values());
    if (busqueda) lista = lista.filter(a => a.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()));
    if (filtroGrupo) lista = lista.filter(a => a.grupo_nombre === filtroGrupo);
    if (filtroSemaforo) lista = lista.filter(a => a.semaforo === filtroSemaforo);
    return lista.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
  }, [alumnosMapa, busqueda, filtroGrupo, filtroSemaforo]);

  const generar = useMutation({
    mutationFn: () => api.post('/pagos/generar-mes', { mes, anio }).then(r => r.data),
    onSuccess: d => {
      qc.invalidateQueries({ queryKey: ['pagos-lista'] });
      alert(`✅ ${d.creados} cargos generados para ${MESES[mes - 1]} ${anio}`);
    },
  });

  const totales = dashboard?.totales || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Control de Pagos 💰</h1>
          <p className="text-gray-500 font-semibold mt-1">Gestión financiera de alumnos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowModalConceptos(true)}
            className="px-4 py-2 rounded-xl border-2 border-purple-300 text-purple-700 font-bold text-sm hover:bg-purple-50">
            ⚙️ Conceptos
          </button>
          <button onClick={() => generar.mutate()} disabled={generar.isPending}
            className="px-4 py-2 rounded-xl border-2 border-blue-300 text-blue-700 font-bold text-sm hover:bg-blue-50">
            📋 Generar mes
          </button>
          <button onClick={() => setShowModalPagoGlobal(true)} className="btn-hs">
            + Registrar pago
          </button>
        </div>
      </div>

      {/* Navegación mes */}
      <div className="flex items-center gap-3">
        <button onClick={() => { const d = new Date(anio, mes - 2, 1); setMes(d.getMonth() + 1); setAnio(d.getFullYear()); }}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center">‹</button>
        <span className="text-lg font-black text-gray-800 min-w-[160px] text-center">
          {MESES[mes - 1]} {anio}
        </span>
        <button onClick={() => { const d = new Date(anio, mes, 1); setMes(d.getMonth() + 1); setAnio(d.getFullYear()); }}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center">›</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recaudado" valor={fmt(totales.recaudado)} sub={`${totales.pagados || 0} pagos`} color="border-green-500" />
        <StatCard label="Por cobrar" valor={fmt(totales.por_cobrar)} sub={`${totales.pendientes || 0} pendientes`} color="border-yellow-500" />
        <StatCard label="Vencido" valor={fmt(totales.vencido_total)} sub={`${totales.vencidos || 0} vencidos`} color="border-red-500" />
        <StatCard label="Recargos cobrados" valor={fmt(totales.recargos_cobrados)} sub="del mes" color="border-purple-500" />
      </div>

      {/* Por concepto */}
      {dashboard?.por_concepto?.length > 0 && (
        <div className="card-hs p-4">
          <h3 className="text-sm font-black text-gray-700 mb-3">Por concepto</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="text-left pb-2 font-bold">Concepto</th>
                  <th className="text-right pb-2 font-bold">Pagados</th>
                  <th className="text-right pb-2 font-bold">Pendientes</th>
                  <th className="text-right pb-2 font-bold">Vencidos</th>
                  <th className="text-right pb-2 font-bold">Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.por_concepto.map(c => (
                  <tr key={c.concepto_id} className="border-b last:border-0">
                    <td className="py-2 font-semibold text-gray-800">{c.concepto}</td>
                    <td className="py-2 text-right text-green-600 font-bold">{c.pagados}</td>
                    <td className="py-2 text-right text-yellow-600 font-bold">{c.pendientes}</td>
                    <td className="py-2 text-right text-red-600 font-bold">{c.vencidos}</td>
                    <td className="py-2 text-right font-black text-gray-800">{fmt(c.recaudado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top morosos */}
      {dashboard?.top_morosos?.length > 0 && (
        <div className="card-hs p-4">
          <h3 className="text-sm font-black text-red-600 mb-3">⚠️ Alumnos con mayor atraso</h3>
          <div className="space-y-2">
            {dashboard.top_morosos.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2">
                  {a.foto_url
                    ? <img src={a.foto_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                    : <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-black text-xs">{a.nombre_completo?.[0]}</div>
                  }
                  <div>
                    <p className="text-sm font-bold text-gray-800">{a.nombre_completo}</p>
                    <p className="text-xs text-gray-500">{a.grupo} · {a.max_dias_atraso} días de atraso</p>
                  </div>
                </div>
                <span className="text-sm font-black text-red-600">{fmt(a.deuda_total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros y tabla de alumnos */}
      <div className="card-hs p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar alumno…"
            className="input-hs flex-1"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select className="input-hs sm:w-44" value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}>
            <option value="">Todos los grupos</option>
            {grupos.map(g => <option key={g.id} value={g.nombre}>{g.nombre}</option>)}
          </select>
          <select className="input-hs sm:w-44" value={filtroSemaforo} onChange={e => setFiltroSemaforo(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(SEMAFORO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-10 h-10 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" /></div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">💰</p>
            <p className="text-gray-500 font-semibold">
              {pagosLista.length === 0
                ? 'Sin registros de pagos este mes. Usa "Generar mes" para crear los cargos.'
                : 'Sin resultados con estos filtros'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b bg-gray-50">
                  <th className="text-left px-4 py-2 font-bold">Alumno</th>
                  <th className="text-left px-4 py-2 font-bold">Grupo</th>
                  <th className="text-left px-4 py-2 font-bold">Estado</th>
                  <th className="text-left px-4 py-2 font-bold">Saldo pendiente</th>
                  <th className="text-right px-4 py-2 font-bold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map(alumno => (
                  <FilaAlumno key={alumno.id} alumno={alumno} conceptos={conceptos} mes={mes} anio={anio} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModalConceptos && (
        <ModalConceptos conceptos={conceptos} onClose={() => setShowModalConceptos(false)} />
      )}

      {showModalPagoGlobal && (
        <ModalPago
          alumno={null}
          conceptos={conceptos}
          mes={mes}
          anio={anio}
          onClose={() => setShowModalPagoGlobal(false)}
        />
      )}
    </div>
  );
}

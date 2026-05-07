import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useCatalogo } from '@/hooks/useCatalogo';
import Modal from '@/components/ui/Modal';
import { SEMAFORO, ESTADO_PAGO } from '@/utils/pagos';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Paleta de colores para niveles — se asigna por posición de aparición
const PALETA_NIVELES = [
  { bg: 'bg-pink-100',   text: 'text-pink-700',   ring: 'ring-pink-300' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-300' },
  { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-300' },
  { bg: 'bg-blue-100',   text: 'text-hs-blue-dark',   ring: 'ring-hs-blue/30' },
  { bg: 'bg-hs-purple/20', text: 'text-hs-purple-dark', ring: 'ring-purple-300' },
];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];


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

function ModalPago({ alumno, conceptos, metodos, tiposConcepto, mes, anio, onClose, onSaved }) {
  const [grupoId, setGrupoId] = useState('');

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
    enabled: !alumno,
  });

  const { data: alumnosGrupo = [], isFetching: cargandoAlumnos } = useQuery({
    queryKey: ['grupo-alumnos', grupoId],
    queryFn: () => api.get(`/grupos/${grupoId}/alumnos`).then(r => r.data),
    enabled: !alumno && !!grupoId,
  });

  const [form, setForm] = useState({
    alumno_id: alumno?.id || '',
    concepto_id: '',
    monto: '',
    mes_correspondiente: mes,
    anio_correspondiente: anio,
    metodo_pago: 'efectivo',
    referencia: '',
    notas: '',
    fecha_pago: new Date().toLocaleDateString('en-CA'),
    aplicar_recargo: true,
  });
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const conceptoSel = conceptos.find(c => c.id === form.concepto_id);

  // Obtener monto correcto por nivel del alumno
  const { data: montoNivel } = useQuery({
    queryKey: ['monto-alumno', form.concepto_id, form.alumno_id],
    queryFn: () => api.get(`/pagos/conceptos/${form.concepto_id}/monto-alumno/${form.alumno_id}`).then(r => r.data),
    enabled: !!form.concepto_id && !!form.alumno_id,
  });

  // Calcular recargo preview (soporta porcentaje y diario)
  const recargoPreview = useMemo(() => {
    if (!conceptoSel?.dia_recargo || !form.aplicar_recargo || !form.monto) return 0;
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();
    const m = form.mes_correspondiente;
    const a = form.anio_correspondiente;

    const recargoPct = parseFloat(conceptoSel.recargo_porcentaje);
    const usaPorcentaje = !isNaN(recargoPct) && recargoPct > 0;
    const montoPorDia = parseFloat(conceptoSel.monto_recargo_dia) || 0;

    let hayRecargo = false;
    let diasAtraso = 0;

    if (a < anioActual || (a === anioActual && m < mesActual)) {
      const fechaVenc = new Date(a, m - 1, conceptoSel.dia_recargo);
      diasAtraso = Math.max(0, Math.floor((hoy - fechaVenc) / 86400000));
      hayRecargo = diasAtraso > 0;
    } else if (m === mesActual && a === anioActual && diaActual >= conceptoSel.dia_recargo) {
      diasAtraso = diaActual - conceptoSel.dia_recargo + 1;
      hayRecargo = true;
    }

    if (!hayRecargo) return 0;

    if (usaPorcentaje) {
      return +(parseFloat(form.monto) * recargoPct / 100).toFixed(2);
    }
    return +(diasAtraso * montoPorDia).toFixed(2);
  }, [conceptoSel, form.aplicar_recargo, form.monto, form.mes_correspondiente, form.anio_correspondiente]);

  const totalPreview = form.monto ? +(parseFloat(form.monto) + recargoPreview).toFixed(2) : 0;

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

  const handleConcepto = async (id) => {
    const cp = conceptos.find(c => c.id === id);
    let monto = cp ? cp.monto : '';
    // Si hay alumno seleccionado, intentar obtener precio por nivel
    if (cp && form.alumno_id) {
      try {
        const res = await api.get(`/pagos/conceptos/${id}/monto-alumno/${form.alumno_id}`);
        monto = res.data.monto;
      } catch { /* fallback al monto default */ }
    }
    setForm(f => ({ ...f, concepto_id: id, monto }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.alumno_id || !form.concepto_id || !form.monto)
      return setError('Alumno, concepto y monto son obligatorios');
    mut.mutate(form);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Registrar Pago 💰"
      size="md"
      closeOnBackdrop={false}
    >
      <form onSubmit={submit} className="space-y-4">
          {alumno ? (
            <div className="flex items-center gap-3 p-3 bg-hs-purple/10 rounded-xl">
              {alumno.foto_url
                ? <img src={alumno.foto_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                : <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-hs-purple-dark font-black">{alumno.nombre_completo?.[0]}</div>
              }
              <div>
                <p className="font-black text-gray-800 text-sm">{alumno.nombre_completo}</p>
                <p className="text-xs text-gray-500">{alumno.grupo_nombre}</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Grupo *</label>
                <select
                  className="input-hs"
                  value={grupoId}
                  onChange={e => {
                    setGrupoId(e.target.value);
                    setForm(f => ({ ...f, alumno_id: '' }));
                  }}
                  required
                >
                  <option value="">Selecciona un grupo…</option>
                  {grupos.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre} — {g.nivel}</option>
                  ))}
                </select>
              </div>

              {grupoId && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Alumno *</label>
                  <select
                    className="input-hs"
                    value={form.alumno_id}
                    onChange={e => setForm(f => ({ ...f, alumno_id: e.target.value }))}
                    required
                    disabled={cargandoAlumnos}
                  >
                    <option value="">
                      {cargandoAlumnos ? 'Cargando alumnos…' : 'Selecciona un alumno…'}
                    </option>
                    {alumnosGrupo.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre_completo}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Concepto *</label>
            <select className="input-hs" value={form.concepto_id} onChange={e => handleConcepto(e.target.value)} required>
              <option value="">Selecciona un concepto...</option>
              {conceptos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} — {fmt(c.monto)}</option>
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
            <input type="number" step="0.01" className="input-hs" value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} required />
          </div>

          {conceptoSel?.dia_recargo && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={form.aplicar_recargo}
                  onChange={e => setForm(f => ({ ...f, aplicar_recargo: e.target.checked }))} />
                <span className="text-sm font-semibold text-gray-700">Calcular recargo automático</span>
              </label>
              {form.monto && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Monto base</span>
                    <span className="font-bold">{fmt(form.monto)}</span>
                  </div>
                  {form.aplicar_recargo && recargoPreview > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Recargo estimado</span>
                      <span className="font-bold">+ {fmt(recargoPreview)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-900 border-t pt-1 mt-1">
                    <span className="font-black">Total a registrar</span>
                    <span className="font-black text-hs-purple-dark">{fmt(totalPreview)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Método de pago</label>
            <div className="flex gap-2">
              {metodos.map(m => (
                <button key={m.key} type="button"
                  onClick={() => setForm(f => ({ ...f, metodo_pago: m.key }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                    form.metodo_pago === m.key
                      ? 'bg-hs-purple-dark text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {m.label}
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
            className="btn-primary flex-1 disabled:opacity-50">
            {mut.isPending ? 'Guardando…' : 'Registrar pago'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Conceptos ──────────────────────────────────────────────────────────

function ModalConceptos({ conceptos, tiposConcepto, onClose }) {
  const FORM_INICIAL = { nombre: '', tipo: 'colegiatura', monto: '', es_mensual: true, dia_pago: 1, dia_recargo: 6, monto_recargo_dia: 0, recargo_porcentaje: '' };
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [preciosNivel, setPreciosNivel] = useState({});
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { items: niveles } = useCatalogo('niveles');

  const { data: preciosData } = useQuery({
    queryKey: ['precios-nivel', editandoId],
    queryFn: () => api.get(`/pagos/conceptos/${editandoId}/precios`).then(r => r.data),
    enabled: !!editandoId,
  });

  // Cargar precios por nivel al seleccionar concepto para editar
  const handleEditar = (c) => {
    setEditandoId(c.id);
    setForm({
      nombre: c.nombre,
      tipo: c.tipo,
      monto: c.monto,
      es_mensual: c.es_mensual,
      dia_pago: c.dia_pago || 1,
      dia_recargo: c.dia_recargo || 6,
      monto_recargo_dia: c.monto_recargo_dia || 0,
      recargo_porcentaje: c.recargo_porcentaje ?? '',
    });
    setPreciosNivel({});
  };

  // Cuando cargan los precios del concepto seleccionado
  const preciosActuales = useMemo(() => {
    if (!preciosData) return preciosNivel;
    const mapa = {};
    preciosData.forEach(p => { mapa[p.nivel_key] = p.monto; });
    return { ...mapa, ...preciosNivel };
  }, [preciosData, preciosNivel]);

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setPreciosNivel({});
    setError('');
  };

  const crear = useMutation({
    mutationFn: d => api.post('/pagos/conceptos', d).then(r => r.data),
    onSuccess: async (data) => {
      // Guardar precios por nivel si hay
      const preciosArr = niveles.map(n => ({
        nivel_key: n.key,
        monto: preciosNivel[n.key] !== undefined && preciosNivel[n.key] !== '' ? preciosNivel[n.key] : null,
      })).filter(p => p.monto !== null);
      if (preciosArr.length > 0) {
        await api.put(`/pagos/conceptos/${data.id}/precios`, { precios: preciosArr });
      }
      qc.invalidateQueries({ queryKey: ['pagos-conceptos'] });
      handleCancelarEdicion();
    },
    onError: e => setError(e.response?.data?.error || 'Error'),
  });

  const actualizar = useMutation({
    mutationFn: d => api.put(`/pagos/conceptos/${editandoId}`, d).then(r => r.data),
    onSuccess: async () => {
      // Guardar precios por nivel
      const preciosArr = niveles.map(n => ({
        nivel_key: n.key,
        monto: preciosActuales[n.key] !== undefined && preciosActuales[n.key] !== '' ? preciosActuales[n.key] : null,
      }));
      await api.put(`/pagos/conceptos/${editandoId}/precios`, { precios: preciosArr });
      qc.invalidateQueries({ queryKey: ['pagos-conceptos'] });
      qc.invalidateQueries({ queryKey: ['precios-nivel'] });
      handleCancelarEdicion();
    },
    onError: e => setError(e.response?.data?.error || 'Error'),
  });

  const eliminar = useMutation({
    mutationFn: id => api.delete(`/pagos/conceptos/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagos-conceptos'] }),
  });

  const handleSubmit = () => {
    if (editandoId) {
      actualizar.mutate(form);
    } else {
      crear.mutate(form);
    }
  };

  const isPending = crear.isPending || actualizar.isPending;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Conceptos de Pago"
      size="lg"
      closeOnBackdrop={false}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Lista */}
          <div className="space-y-2">
            {conceptos.map(c => (
              <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${editandoId === c.id ? 'bg-hs-purple/10 ring-2 ring-hs-purple/30' : 'bg-gray-50'}`}>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{c.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {c.tipo} · {fmt(c.monto)}
                    {c.recargo_porcentaje ? ` · ${c.recargo_porcentaje}% recargo` : c.dia_recargo ? ` · Recargo día ${c.dia_recargo}` : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditar(c)}
                    className="text-hs-purple hover:text-hs-purple-dark text-sm font-bold px-2 py-1 rounded-lg hover:bg-hs-purple/10">
                    Editar
                  </button>
                  <button onClick={() => eliminar.mutate(c.id)}
                    className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded-lg hover:bg-red-50">
                    Quitar
                  </button>
                </div>
              </div>
            ))}
            {!conceptos.length && <p className="text-gray-400 text-sm text-center py-4">Sin conceptos</p>}
          </div>

          {/* Formulario crear/editar */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-gray-700">{editandoId ? 'Editar concepto' : 'Nuevo concepto'}</p>
              {editandoId && (
                <button onClick={handleCancelarEdicion} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
              )}
            </div>
            <input className="input-hs" placeholder="Nombre *" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Tipo</label>
                <select className="input-hs" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {tiposConcepto.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Monto base (default)</label>
                <input type="number" step="0.01" className="input-hs" value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Dia de pago</label>
                <input type="number" min="1" max="28" className="input-hs" value={form.dia_pago}
                  onChange={e => setForm(f => ({ ...f, dia_pago: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Dia inicio recargo</label>
                <input type="number" min="1" max="31" className="input-hs" value={form.dia_recargo}
                  onChange={e => setForm(f => ({ ...f, dia_recargo: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Recargo por dia ($)</label>
                <input type="number" step="0.01" className="input-hs" value={form.monto_recargo_dia}
                  onChange={e => setForm(f => ({ ...f, monto_recargo_dia: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Recargo (%)</label>
                <input type="number" step="0.1" min="0" max="100" className="input-hs" value={form.recargo_porcentaje}
                  placeholder="Ej: 10"
                  onChange={e => setForm(f => ({ ...f, recargo_porcentaje: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
                <p className="text-xs text-gray-400 mt-0.5">Si se llena, se usa en vez del recargo diario</p>
              </div>
            </div>

            {/* Precios por nivel */}
            {niveles.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-black text-blue-700">Precios por nivel (opcional)</p>
                <p className="text-xs text-blue-500 mb-2">Si se deja vacio, usa el monto base de arriba</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {niveles.map(n => (
                    <div key={n.key}>
                      <label className="text-xs font-bold text-gray-600 block mb-0.5">{n.label}</label>
                      <input
                        type="number" step="0.01" className="input-hs text-sm"
                        placeholder={form.monto ? `$${form.monto}` : '—'}
                        value={preciosActuales[n.key] ?? ''}
                        onChange={e => setPreciosNivel(p => ({ ...p, [n.key]: e.target.value === '' ? '' : e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" checked={form.es_mensual}
                onChange={e => setForm(f => ({ ...f, es_mensual: e.target.checked }))} />
              <span className="text-sm font-semibold text-gray-700">Cargo mensual recurrente</span>
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={handleSubmit} disabled={isPending}
              className="w-full py-2 rounded-xl bg-hs-purple-dark text-white font-black text-sm disabled:opacity-50">
              {isPending ? 'Guardando...' : editandoId ? 'Guardar cambios' : '+ Agregar concepto'}
            </button>
          </div>
      </div>
    </Modal>
  );
}

// ─── Fila alumno en la tabla ──────────────────────────────────────────────────

// ─── Modal Enviar Recibo WhatsApp ─────────────────────────────────────────────

function ModalEnviarRecibo({ pago, onClose }) {
  const [enviando, setEnviando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleDescargar = async () => {
    setDescargando(true);
    try {
      const resp = await api.get(`/pagos/${pago.id}/recibo`, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${String(pago.id).replace(/-/g, '').slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setResultado({ ok: false, msg: 'Error al descargar el recibo' });
    } finally {
      setDescargando(false);
    }
  };

  const handleWhatsApp = async () => {
    setEnviando(true);
    try {
      await api.post(`/pagos/${pago.id}/enviar`, { canal: 'whatsapp' });
      setResultado({ ok: true, msg: 'Recibo enviado por WhatsApp al tutor' });
    } catch (e) {
      setResultado({ ok: false, msg: e.response?.data?.error || 'Error al enviar' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Recibo de Pago 🧾" size="sm">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-1">
          <p className="font-black text-gray-800 text-sm">{pago.concepto_nombre}</p>
          <p className="text-xs text-gray-500">{MESES[pago.mes_correspondiente - 1]} {pago.anio_correspondiente}</p>
          <p className="text-2xl font-black text-gray-900 mt-2">{fmt(pago.monto_total)}</p>
          {pago.monto_recargo > 0 && <p className="text-xs text-red-500">Incluye recargo: {fmt(pago.monto_recargo)}</p>}
          <p className="text-xs text-gray-400 mt-1">Folio #{String(pago.id).replace(/-/g, '').slice(-8).toUpperCase()} · {(pago.metodo_pago || 'efectivo').toUpperCase()}</p>
        </div>

        {resultado && (
          <div className={`rounded-xl p-3 text-sm font-semibold ${resultado.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {resultado.ok ? '✅' : '❌'} {resultado.msg}
          </div>
        )}

        <button
          onClick={handleDescargar}
          disabled={descargando}
          className="w-full py-3 rounded-xl bg-hs-purple-dark text-white font-bold text-sm hover:bg-hs-purple transition-colors disabled:opacity-50"
        >
          {descargando ? '⏳ Generando PDF…' : '⬇️ Descargar PDF'}
        </button>

        <button
          onClick={handleWhatsApp}
          disabled={enviando}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {enviando ? '⏳ Enviando…' : '💬 Enviar por WhatsApp al tutor'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Fila Alumno ──────────────────────────────────────────────────────────────

function FilaAlumno({ alumno, conceptos, metodos, tiposConcepto, mes, anio }) {
  const [expandido, setExpandido] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [modalRecibo, setModalRecibo] = useState(null); // pago seleccionado

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
              : <div className="w-8 h-8 rounded-full bg-hs-purple/20 flex items-center justify-center text-hs-purple-dark font-black text-sm">{alumno.nombre_completo?.[0]}</div>
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
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ep.bg} ${ep.text}`}>{ep.label}</span>
                          </div>
                          <p className="text-lg font-black text-gray-900">{fmt(p.monto_total)}</p>
                          {p.monto_recargo > 0 && (
                            <p className="text-xs text-red-500">+{fmt(p.monto_recargo)} recargo</p>
                          )}
                          {p.fecha_pago && <p className="text-xs text-gray-400 mt-1">{fmtFecha(p.fecha_pago)} · {p.metodo_pago}</p>}
                          {p.estado === 'pagado' && (
                            <button
                              onClick={() => setModalRecibo(p)}
                              className="mt-2 w-full py-1 rounded-lg bg-hs-purple/10 text-hs-purple-dark text-xs font-bold hover:bg-hs-purple/20 transition-colors"
                            >
                              🧾 Recibo
                            </button>
                          )}
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
          metodos={metodos}
          tiposConcepto={tiposConcepto}
          mes={mes}
          anio={anio}
          onClose={() => setModalPago(false)}
          onSaved={() => setExpandido(true)}
        />
      )}

      {modalRecibo && (
        <ModalEnviarRecibo pago={modalRecibo} onClose={() => setModalRecibo(null)} />
      )}
    </>
  );
}

// ─── Tab Historial Extensión ──────────────────────────────────────────────────

function TabExtension({ mes, anio, conceptos, metodos, tiposConcepto }) {
  const [busqueda, setBusqueda] = useState('');

  const { data: pagos = [], isLoading } = useQuery({
    queryKey: ['pagos-extension', mes, anio],
    queryFn: () => api.get('/pagos', { params: { mes, anio } }).then(r =>
      r.data.filter(p => p.concepto_tipo === 'extension')
    ),
  });

  const filtrados = busqueda
    ? pagos.filter(p => p.alumno_nombre?.toLowerCase().includes(busqueda.toLowerCase()))
    : pagos;

  // Totales
  const recaudado   = filtrados.filter(p => p.estado === 'pagado').reduce((s, p) => s + parseFloat(p.monto_total), 0);
  const porCobrar   = filtrados.filter(p => p.estado === 'pendiente').reduce((s, p) => s + parseFloat(p.monto_total), 0);
  const vencido     = filtrados.filter(p => p.estado === 'vencido').reduce((s, p) => s + parseFloat(p.monto_total), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Recaudado extensión" valor={fmt(recaudado)} sub={`${filtrados.filter(p=>p.estado==='pagado').length} pagos`} color="border-hs-green" />
        <StatCard label="Por cobrar" valor={fmt(porCobrar)} sub={`${filtrados.filter(p=>p.estado==='pendiente').length} pendientes`} color="border-yellow-500" />
        <StatCard label="Vencido" valor={fmt(vencido)} sub={`${filtrados.filter(p=>p.estado==='vencido').length} vencidos`} color="border-red-500" />
      </div>

      <input type="text" placeholder="Buscar alumno…" className="input-hs"
        value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-gray-500 font-semibold">Sin cobros de extensión este mes</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-bold">Alumno</th>
                <th className="text-left px-4 py-2 font-bold">Concepto</th>
                <th className="text-left px-4 py-2 font-bold">Estado</th>
                <th className="text-right px-4 py-2 font-bold">Monto</th>
                <th className="text-right px-4 py-2 font-bold">Recargo</th>
                <th className="text-left px-4 py-2 font-bold">Método</th>
                <th className="text-left px-4 py-2 font-bold">Fecha pago</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => {
                const ep = ESTADO_PAGO[p.estado] || ESTADO_PAGO.pendiente;
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.foto_url
                          ? <img src={p.foto_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                          : <div className="w-7 h-7 rounded-full bg-hs-purple/20 flex items-center justify-center text-hs-purple-dark font-black text-xs">{p.alumno_nombre?.[0]}</div>
                        }
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{p.alumno_nombre}</p>
                          <p className="text-xs text-gray-400"
                            style={{ color: p.color_hex }}>{p.grupo_nombre}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.concepto_nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ep.bg} ${ep.text}`}>{ep.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-800">{fmt(p.monto_total)}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-semibold text-xs">
                      {p.monto_recargo > 0 ? `+${fmt(p.monto_recargo)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-600">{p.metodo_pago || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtFecha(p.fecha_pago)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Modal Comprobante Comida ─────────────────────────────────────────────────

function ModalComprobanteComida({ registro, onClose, onSaved }) {
  const [metodo, setMetodo] = useState(registro.metodo_pago_comida || 'efectivo');
  const [notas, setNotas]   = useState(registro.notas_comida || '');
  const [foto, setFoto]     = useState(null);
  const [preview, setPreview] = useState(registro.comprobante_url || null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]   = useState('');

  const METODOS = [
    { key: 'efectivo',       label: 'Efectivo',        emoji: '💵' },
    { key: 'efectivo_lunes', label: 'Efectivo Lunes',  emoji: '📅' },
    { key: 'transferencia',  label: 'Transferencia',   emoji: '💳' },
  ];

  const handleFoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('metodo_pago_comida', metodo);
      if (notas) formData.append('notas_comida', notas);
      if (foto)  formData.append('foto', foto);

      await api.patch(`/pagos/comida/${registro.id}/comprobante`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Comprobante de Comida 🍽️" size="sm" closeOnBackdrop={false}>
      <div className="space-y-4">
        {/* Info alumno */}
        <div className="bg-green-50 rounded-xl p-3">
          <p className="font-black text-gray-800 text-sm">{registro.alumno_nombre}</p>
          <p className="text-xs text-gray-500">{registro.grupo_nombre} · Semana {registro.semana_inicio}</p>
          <p className="text-lg font-black text-green-700 mt-1">{fmt(registro.monto)}</p>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">Método de pago</label>
          <div className="flex gap-2">
            {METODOS.map(m => (
              <button key={m.key} type="button"
                onClick={() => setMetodo(m.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  metodo === m.key
                    ? 'bg-hs-purple-dark text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comprobante foto (solo transferencia) */}
        {metodo === 'transferencia' && (
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Foto comprobante</label>
            {preview && (
              <img src={preview} alt="Comprobante" className="w-full h-40 object-cover rounded-xl mb-2 border" />
            )}
            <label className="block w-full py-3 text-center rounded-xl border-2 border-dashed border-hs-purple/30 text-hs-purple-dark font-bold text-sm cursor-pointer hover:bg-hs-purple/5 transition-colors">
              {preview ? '📷 Cambiar foto' : '📷 Adjuntar foto'}
              <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
            </label>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Notas (opcional)</label>
          <input type="text" className="input-hs" placeholder="Observaciones…" value={notas}
            onChange={e => setNotas(e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-sm font-semibold">❌ {error}</p>}

        <button onClick={handleGuardar} disabled={guardando}
          className="w-full btn-hs disabled:opacity-50">
          {guardando ? '⏳ Guardando…' : '✅ Guardar comprobante'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Tab Historial Comida ─────────────────────────────────────────────────────

function TabComida({ mes, anio }) {
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [modalComprobante, setModalComprobante] = useState(null);
  const qc = useQueryClient();

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['comida-historial', mes, anio, grupoFiltro],
    queryFn: () => api.get('/pagos/comida/historial', {
      params: { mes, anio, ...(grupoFiltro ? { grupo_id: grupoFiltro } : {}) }
    }).then(r => r.data),
  });

  const registros = data?.registros || [];
  const totales   = data?.totales   || {};

  // Agrupar por semana
  const porSemana = useMemo(() => {
    const mapa = new Map();
    registros.forEach(r => {
      if (!mapa.has(r.semana_inicio)) mapa.set(r.semana_inicio, []);
      mapa.get(r.semana_inicio).push(r);
    });
    return Array.from(mapa.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [registros]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Recaudado comida" valor={fmt(totales.recaudado)} sub={`${totales.total_registros || 0} registros`} color="border-hs-green" />
        <StatCard label="Alumnos únicos" valor={totales.alumnos_unicos || 0} sub="este mes" color="border-hs-blue" />
        <StatCard label="Semanas" valor={porSemana.length} sub="con registros" color="border-hs-purple" />
      </div>

      {/* Filtro grupo */}
      <select className="input-hs" value={grupoFiltro} onChange={e => setGrupoFiltro(e.target.value)}>
        <option value="">Todos los grupos</option>
        {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
      </select>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" /></div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">⚠️</p>
          <p className="text-red-500 font-semibold">Error al cargar: {error?.response?.data?.error || error?.message}</p>
        </div>
      ) : porSemana.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-gray-500 font-semibold">Sin registros de comida este mes</p>
          <p className="text-gray-400 text-xs mt-1">Los pagos de comida se registran desde el módulo de Servicio de Comida</p>
        </div>
      ) : (
        <div className="space-y-4">
          {porSemana.map(([semana, regs]) => {
            const totalSemana = regs.reduce((s, r) => s + parseFloat(r.monto || 0), 0);
            const viernes = new Date(semana);
            viernes.setDate(viernes.getDate() + 4);
            return (
              <div key={semana} className="card-hs p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-black text-gray-800 text-sm">
                      Semana del {fmtFecha(semana)} al {fmtFecha(viernes.toISOString())}
                    </p>
                    <p className="text-xs text-gray-400">{regs.length} alumnos pagaron</p>
                  </div>
                  <p className="font-black text-hs-green text-lg">{fmt(totalSemana)}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {regs.map(r => {
                    const tieneComprobante = !!r.comprobante_url;
                    const metodoLabel = {
                      efectivo:       '💵 Efectivo',
                      efectivo_lunes: '📅 Efectivo Lunes',
                      transferencia:  '💳 Transferencia',
                    }[r.metodo_pago_comida] || '';
                    return (
                      <div key={r.id} className="flex flex-col gap-1 p-2 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          {r.foto_url
                            ? <img src={r.foto_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                            : <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-black text-xs">{r.alumno_nombre?.[0]}</div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{r.alumno_nombre}</p>
                            <p className="text-xs text-gray-400" style={{ color: r.color_hex }}>{r.grupo_nombre}</p>
                          </div>
                          <p className="text-xs font-black text-green-700 whitespace-nowrap">{fmt(r.monto)}</p>
                        </div>
                        {/* Fila método + botón */}
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          {metodoLabel
                            ? <span className="text-xs text-gray-400">{metodoLabel}</span>
                            : <span className="text-xs text-gray-300">Sin método</span>
                          }
                          <button
                            onClick={() => setModalComprobante(r)}
                            className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-colors ${
                              tieneComprobante
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}
                          >
                            {tieneComprobante ? '📎 Ver' : '📎 Agregar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalComprobante && (
        <ModalComprobanteComida
          registro={modalComprobante}
          onClose={() => setModalComprobante(null)}
          onSaved={() => {
            setModalComprobante(null);
            qc.invalidateQueries({ queryKey: ['comida-historial'] });
          }}
        />
      )}
    </div>
  );
}

// ─── Tab Segmentación ─────────────────────────────────────────────────────────

const SEG_TABS = [
  { key: 'regulares',     label: 'Regulares',          color: 'bg-blue-100 text-blue-700',   emoji: '🎓' },
  { key: 'con_extension', label: 'Con Extensión',       color: 'bg-purple-100 text-purple-700', emoji: '🕐' },
  { key: 'con_comida',    label: 'Con Comida',          color: 'bg-green-100 text-green-700', emoji: '🍽️' },
  { key: 'con_ambos',     label: 'Extensión + Comida',  color: 'bg-orange-100 text-orange-700', emoji: '⭐' },
];

function TabSegmentacion() {
  const [segTab, setSegTab] = useState('regulares');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['segmentacion-servicios'],
    queryFn: () => api.get('/pagos/segmentacion').then(r => r.data),
  });

  const segActual = data?.[segTab] || { count: 0, alumnos: [] };

  return (
    <div className="space-y-4">
      {/* Resumen chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SEG_TABS.map(st => {
          const info = data?.[st.key] || { count: 0 };
          return (
            <button key={st.key}
              onClick={() => setSegTab(st.key)}
              className={`p-4 rounded-2xl text-left transition-all border-2 ${
                segTab === st.key ? 'border-hs-purple shadow-md' : 'border-transparent'
              } ${st.color.split(' ')[0]} hover:opacity-90`}
            >
              <p className="text-2xl mb-1">{st.emoji}</p>
              <p className={`text-2xl font-black ${st.color.split(' ')[1]}`}>{info.count}</p>
              <p className={`text-xs font-bold ${st.color.split(' ')[1]} opacity-80`}>{st.label}</p>
            </button>
          );
        })}
      </div>

      {/* Total */}
      {data && (
        <p className="text-xs text-gray-400 font-semibold">
          Total alumnos activos: <span className="text-gray-700 font-black">{data.total}</span>
        </p>
      )}

      {/* Lista del segmento seleccionado */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" /></div>
      ) : isError ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-red-500 font-semibold text-sm">Error al cargar: {error?.response?.data?.error || error?.message}</p>
        </div>
      ) : segActual.alumnos.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">{SEG_TABS.find(s=>s.key===segTab)?.emoji}</p>
          <p className="text-gray-400 font-semibold text-sm">Sin alumnos en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {segActual.alumnos.map(al => (
            <div key={al.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border">
              {al.foto_url
                ? <img src={al.foto_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                : <div className="w-9 h-9 rounded-full bg-hs-purple/20 flex items-center justify-center text-hs-purple-dark font-black text-sm">{al.nombre_completo?.[0]}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{al.nombre_completo}</p>
                <p className="text-xs font-semibold" style={{ color: al.color_hex }}>{al.grupo_nombre}</p>
                {al.tiene_extension && al.hora_salida_extension && (
                  <p className="text-xs text-purple-500">Salida: {al.hora_salida_extension}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end">
                {al.tiene_extension && <span className="text-xs bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">Ext</span>}
                {al.tiene_comida_activa && <span className="text-xs bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">Comida</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab Comprobantes por validar ────────────────────────────────────────────

function TabComprobantes() {
  const qc = useQueryClient();
  const [imgModal, setImgModal] = useState(null);
  const [rechazarPago, setRechazarPago] = useState(null);
  const [notaRechazo, setNotaRechazo] = useState('');

  const { data: comprobantes = [], isLoading } = useQuery({
    queryKey: ['pagos-por-confirmar'],
    queryFn: () => api.get('/pagos/por-confirmar').then(r => r.data),
  });

  const confirmar = useMutation({
    mutationFn: ({ id, accion, nota }) => api.patch(`/pagos/${id}/confirmar`, { accion, nota }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagos-por-confirmar'] });
      qc.invalidateQueries({ queryKey: ['pagos-dashboard'] });
      qc.invalidateQueries({ queryKey: ['pagos-lista'] });
      setRechazarPago(null);
      setNotaRechazo('');
    },
  });

  if (isLoading) return (
    <div className="card-hs p-8 flex items-center justify-center">
      <div className="animate-spin w-7 h-7 border-4 border-hs-purple border-t-transparent rounded-full" />
    </div>
  );

  if (comprobantes.length === 0) return (
    <div className="card-hs p-8 text-center">
      <p className="text-4xl mb-3">✅</p>
      <p className="text-lg font-black text-gray-700">Sin comprobantes pendientes</p>
      <p className="text-sm text-gray-400 font-semibold mt-1">Todos los comprobantes han sido revisados</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-gray-500">{comprobantes.length} comprobante{comprobantes.length !== 1 ? 's' : ''} por validar</p>

      {comprobantes.map(c => (
        <div key={c.id} className="card-hs p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            {c.foto_url
              ? <img src={c.foto_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
              : <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg font-black text-purple-700">{c.alumno_nombre?.[0]}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-800 truncate">{c.alumno_nombre}</p>
              <p className="text-xs font-semibold text-gray-400">{c.grupo_nombre}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-gray-800">{fmt(c.monto_total)}</p>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">En revisión</span>
            </div>
          </div>

          {/* Detalle */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <p><span className="font-bold text-gray-600">Concepto:</span> {c.concepto_nombre}</p>
            <p><span className="font-bold text-gray-600">Periodo:</span> {MESES[(c.mes_correspondiente || 1) - 1]} {c.anio_correspondiente}</p>
            {c.referencia && <p><span className="font-bold text-gray-600">Referencia:</span> {c.referencia}</p>}
            {c.subido_por_nombre && <p><span className="font-bold text-gray-600">Enviado por:</span> {c.subido_por_nombre}</p>}
            {c.comprobante_fecha && (
              <p><span className="font-bold text-gray-600">Fecha envío:</span> {fmtFecha(c.comprobante_fecha)}</p>
            )}
          </div>

          {/* Imagen comprobante */}
          {c.comprobante_url && (
            <button onClick={() => setImgModal(c.comprobante_url)} className="w-full">
              <img
                src={c.comprobante_url}
                alt="Comprobante"
                className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:opacity-80 transition-opacity"
              />
              <p className="text-xs text-gray-400 font-semibold mt-1 text-center">Click para ampliar</p>
            </button>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => confirmar.mutate({ id: c.id, accion: 'aprobar' })}
              disabled={confirmar.isPending}
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              ✓ Aprobar pago
            </button>
            <button
              onClick={() => setRechazarPago(c)}
              disabled={confirmar.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              ✗ Rechazar
            </button>
          </div>
        </div>
      ))}

      {/* Modal imagen ampliada */}
      <Modal open={!!imgModal} onClose={() => setImgModal(null)} title="Comprobante" size="lg">
        {imgModal && <img src={imgModal} alt="Comprobante" className="w-full rounded-xl" />}
      </Modal>

      {/* Modal rechazo */}
      <Modal open={!!rechazarPago} onClose={() => { setRechazarPago(null); setNotaRechazo(''); }} title="Rechazar comprobante" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Indica al padre por qué se rechaza este comprobante de <span className="font-bold">{rechazarPago?.alumno_nombre}</span>.
          </p>
          <textarea
            value={notaRechazo}
            onChange={(e) => setNotaRechazo(e.target.value)}
            placeholder="Ej: Imagen borrosa, monto no corresponde..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none resize-none"
            rows={3}
          />
          <div className="flex gap-3">
            <button
              onClick={() => { setRechazarPago(null); setNotaRechazo(''); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => confirmar.mutate({ id: rechazarPago.id, accion: 'rechazar', nota: notaRechazo || 'Comprobante rechazado' })}
              disabled={confirmar.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

const MAIN_TABS = [
  { key: 'pagos',        label: 'Pagos',        emoji: '💰' },
  { key: 'comprobantes', label: 'Comprobantes', emoji: '📎' },
  { key: 'extension',    label: 'Extensión',    emoji: '🕐' },
  { key: 'comida',       label: 'Comida',       emoji: '🍽️' },
  { key: 'segmentacion', label: 'Servicios',    emoji: '📊' },
];

export default function PagosDirectora() {
  const hoy = new Date();
  const [tab, setTab]       = useState('pagos');
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [nivelFiltro, setNivelFiltro] = useState('');
  const [filtroSemaforo, setFiltroSemaforo] = useState('');
  const [showModalConceptos, setShowModalConceptos] = useState(false);
  const [showModalPagoGlobal, setShowModalPagoGlobal] = useState(false);
  const qc = useQueryClient();
  const [exportando, setExportando] = useState(false);

  const { items: metodos }       = useCatalogo('metodos-pago');
  const { items: tiposConcepto } = useCatalogo('conceptos-pago');

  const handleExportarExcel = async () => {
    setExportando(true);
    try {
      const resp = await api.get('/pagos/exportar', {
        params: { mes, anio },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagos-${MESES[mes - 1].toLowerCase()}-${anio}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al exportar: ' + (e.response?.data?.error || e.message));
    } finally {
      setExportando(false);
    }
  };

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

  // Comprobantes pendientes (para badge en tab)
  const { data: comprobantesCount = [] } = useQuery({
    queryKey: ['pagos-por-confirmar'],
    queryFn: () => api.get('/pagos/por-confirmar').then(r => r.data),
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

  // Mapa grupoNombre → nivel (pagosLista solo tiene grupo_nombre, no grupo_id)
  const grupoNombreANivel = useMemo(() => {
    const mapa = {};
    grupos.forEach(g => { mapa[g.nombre] = g.nivel; });
    return mapa;
  }, [grupos]);

  // Niveles únicos en orden de aparición, derivados del backend
  const nivelesUnicos = useMemo(() => {
    const vistos = new Set();
    return grupos
      .map(g => g.nivel)
      .filter(n => n && !vistos.has(n) && vistos.add(n));
  }, [grupos]);

  const alumnos = useMemo(() => {
    let lista = Array.from(alumnosMapa.values());
    if (busqueda) lista = lista.filter(a => a.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()));
    if (nivelFiltro && grupos.length > 0) {
      lista = lista.filter(a => grupoNombreANivel[a.grupo_nombre] === nivelFiltro);
    }
    if (filtroSemaforo) lista = lista.filter(a => a.semaforo === filtroSemaforo);
    return lista.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
  }, [alumnosMapa, busqueda, nivelFiltro, filtroSemaforo, grupoNombreANivel, grupos.length]);

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
            className="px-4 py-2 rounded-xl border-2 border-hs-purple/30 text-hs-purple-dark font-bold text-sm hover:bg-hs-purple/10">
            ⚙️ Conceptos
          </button>
          <button onClick={() => generar.mutate()} disabled={generar.isPending}
            className="px-4 py-2 rounded-xl border-2 border-hs-blue/40 text-hs-blue-dark font-bold text-sm hover:bg-hs-blue/10">
            📋 Generar mes
          </button>
          <button onClick={handleExportarExcel} disabled={exportando}
            className="px-4 py-2 rounded-xl border-2 border-green-400/60 text-green-700 font-bold text-sm hover:bg-green-50 disabled:opacity-50">
            {exportando ? '⏳ Exportando…' : '📊 Excel'}
          </button>
          <button onClick={() => setShowModalPagoGlobal(true)} className="btn-hs">
            + Registrar pago
          </button>
        </div>
      </div>

      {/* Tabs principales */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {MAIN_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-white shadow text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.emoji} {t.label}
            {t.key === 'comprobantes' && comprobantesCount.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-black min-w-[20px] inline-block text-center">
                {comprobantesCount.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Navegación mes — solo para tabs que lo usan */}
      {tab !== 'segmentacion' && tab !== 'comprobantes' && (
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(anio, mes - 2, 1); setMes(d.getMonth() + 1); setAnio(d.getFullYear()); }}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center">‹</button>
          <span className="text-lg font-black text-gray-800 min-w-[160px] text-center">
            {MESES[mes - 1]} {anio}
          </span>
          <button onClick={() => { const d = new Date(anio, mes, 1); setMes(d.getMonth() + 1); setAnio(d.getFullYear()); }}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-black text-gray-600 flex items-center justify-center">›</button>
        </div>
      )}

      {/* Tab Comprobantes */}
      {tab === 'comprobantes' && (
        <TabComprobantes />
      )}

      {/* Tab Extensión */}
      {tab === 'extension' && (
        <TabExtension mes={mes} anio={anio} conceptos={conceptos} metodos={metodos} tiposConcepto={tiposConcepto} />
      )}

      {/* Tab Comida */}
      {tab === 'comida' && (
        <TabComida mes={mes} anio={anio} />
      )}

      {/* Tab Segmentación */}
      {tab === 'segmentacion' && (
        <TabSegmentacion />
      )}

      {/* Contenido tab Pagos (principal) */}
      {tab === 'pagos' && (
      <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recaudado" valor={fmt(totales.recaudado)} sub={`${totales.pagados || 0} pagos`} color="border-hs-green" />
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
        <div className="flex flex-col gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar alumno…"
            className="input-hs"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setNivelFiltro('')}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                nivelFiltro === ''
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-150'
              }`}
            >
              Todos
            </button>
            {nivelesUnicos.map((nivel, idx) => {
              const color = PALETA_NIVELES[idx % PALETA_NIVELES.length];
              return (
                <button
                  key={nivel}
                  onClick={() => setNivelFiltro(nivel)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                    nivelFiltro === nivel
                      ? `${color.bg} ${color.text} ring-2 ${color.ring}`
                      : `${color.bg} ${color.text} opacity-60 hover:opacity-100`
                  }`}
                >
                  {nivel}
                </button>
              );
            })}
          </div>
          <select className="input-hs" value={filtroSemaforo} onChange={e => setFiltroSemaforo(e.target.value)}>
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
                  <FilaAlumno key={alumno.id} alumno={alumno} conceptos={conceptos} metodos={metodos} tiposConcepto={tiposConcepto} mes={mes} anio={anio} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModalConceptos && (
        <ModalConceptos conceptos={conceptos} tiposConcepto={tiposConcepto} onClose={() => setShowModalConceptos(false)} />
      )}

      {showModalPagoGlobal && (
        <ModalPago
          alumno={null}
          conceptos={conceptos}
          metodos={metodos}
          tiposConcepto={tiposConcepto}
          mes={mes}
          anio={anio}
          onClose={() => setShowModalPagoGlobal(false)}
        />
      )}

      </div>
      )} {/* fin tab pagos */}
    </div>
  );
}

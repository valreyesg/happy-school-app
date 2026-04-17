import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function mesStr(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function diasDelMes(year, month) {
  const primerDia = new Date(year, month, 1).getDay();
  const totalDias = new Date(year, month + 1, 0).getDate();
  return { primerDia, totalDias };
}

function fechaLocal(fecha) {
  return new Date(fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function horaLocal(fecha) {
  return new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// ─── Modal crear / editar evento ─────────────────────────────────────────────

function ModalEvento({ evento, categorias, grupos, fechaInicial, onClose, onSave }) {
  const esNuevo = !evento;
  const toInputDate = (iso) => iso ? iso.slice(0, 16) : '';

  const [form, setForm] = useState({
    titulo:        evento?.titulo || '',
    descripcion:   evento?.descripcion || '',
    categoria_id:  evento?.categoria_id || '',
    fecha_inicio:  toInputDate(evento?.fecha_inicio) || (fechaInicial ? `${fechaInicial}T08:00` : ''),
    fecha_fin:     toInputDate(evento?.fecha_fin) || '',
    es_todo_el_dia: evento?.es_todo_el_dia ?? false,
    grupo_id:      evento?.grupo_id || '',
    publicado:     evento?.publicado ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.titulo.trim() || !form.fecha_inicio) { setError('Título y fecha de inicio son obligatorios.'); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        categoria_id: form.categoria_id || null,
        grupo_id: form.grupo_id || null,
        fecha_fin: form.fecha_fin || null,
      });
      onClose();
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800">{esNuevo ? '+ Nuevo evento' : 'Editar evento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-red-600 text-sm font-semibold bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título *</label>
            <input className="input-hs w-full" value={form.titulo} onChange={e => set('titulo', e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
            <textarea className="input-hs w-full" rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
              <select className="input-hs w-full" value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}>
                <option value="">— General —</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grupo</label>
              <select className="input-hs w-full" value={form.grupo_id} onChange={e => set('grupo_id', e.target.value)}>
                <option value="">Toda la escuela</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.es_todo_el_dia} onChange={e => set('es_todo_el_dia', e.target.checked)} />
            <span className="text-sm font-semibold text-gray-600">Todo el día</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio *</label>
              <input
                type={form.es_todo_el_dia ? 'date' : 'datetime-local'}
                className="input-hs w-full"
                value={form.es_todo_el_dia ? form.fecha_inicio.slice(0, 10) : form.fecha_inicio}
                onChange={e => set('fecha_inicio', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin</label>
              <input
                type={form.es_todo_el_dia ? 'date' : 'datetime-local'}
                className="input-hs w-full"
                value={form.es_todo_el_dia ? form.fecha_fin.slice(0, 10) : form.fecha_fin}
                onChange={e => set('fecha_fin', e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.publicado} onChange={e => set('publicado', e.target.checked)} />
            <span className="text-sm font-semibold text-gray-600">Publicado (visible para padres)</span>
          </label>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-hs btn-hs-ghost">Cancelar</button>
          <button onClick={submit} disabled={saving} className="btn-hs btn-hs-primary">
            {saving ? 'Guardando…' : esNuevo ? 'Crear evento' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detalle de evento ────────────────────────────────────────────────────────

function DetalleEvento({ evento, onEdit, onDelete, onClose }) {
  const [confirmando, setConfirmando] = useState(false);
  const color = evento.categoria_color || '#805AD5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="h-2 rounded-t-2xl" style={{ backgroundColor: color }} />
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {evento.categoria_icono && <span className="text-xl">{evento.categoria_icono}</span>}
                {evento.categoria_nombre && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: color + '20', color }}>
                    {evento.categoria_nombre}
                  </span>
                )}
                {!evento.publicado && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Borrador</span>
                )}
              </div>
              <h3 className="text-xl font-black text-gray-800">{evento.titulo}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0">&times;</button>
          </div>

          {evento.descripcion && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{evento.descripcion}</p>}

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span>📅</span>
              <span className="font-semibold capitalize">{fechaLocal(evento.fecha_inicio)}</span>
            </div>
            {!evento.es_todo_el_dia && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>🕐</span>
                <span className="font-semibold">
                  {horaLocal(evento.fecha_inicio)}
                  {evento.fecha_fin ? ` → ${horaLocal(evento.fecha_fin)}` : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <span>🏫</span>
              <span className="font-semibold">{evento.grupo_nombre || 'Toda la escuela'}</span>
            </div>
          </div>

          {confirmando ? (
            <div className="mt-4 bg-red-50 rounded-xl p-4">
              <p className="text-sm font-bold text-red-700 mb-3">¿Eliminar este evento?</p>
              <div className="flex gap-2">
                <button className="flex-1 btn-hs btn-hs-ghost text-sm" onClick={() => setConfirmando(false)}>Cancelar</button>
                <button className="flex-1 btn-hs bg-red-500 hover:bg-red-600 text-white text-sm" onClick={onDelete}>Eliminar</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-5">
              <button onClick={onEdit} className="flex-1 btn-hs btn-hs-ghost text-sm">✏️ Editar</button>
              <button onClick={() => setConfirmando(true)} className="btn-hs text-red-500 hover:bg-red-50 text-sm px-4">🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DirectoraCalendario() {
  const qc = useQueryClient();
  const hoy = new Date();
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [modal, setModal] = useState(null);     // null | 'nuevo' | evento
  const [detalle, setDetalle] = useState(null);
  const [fechaClick, setFechaClick] = useState('');

  const mes = mesStr(year, month);

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['calendario', mes],
    queryFn: () => api.get('/calendario', { params: { mes } }).then(r => r.data),
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['cal-categorias'],
    queryFn: () => api.get('/calendario/categorias').then(r => r.data),
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos-lista'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const crearMutation = useMutation({
    mutationFn: (body) => api.post('/calendario', body),
    onSuccess: () => qc.invalidateQueries(['calendario']),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/calendario/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['calendario']); setDetalle(null); },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id) => api.delete(`/calendario/${id}`),
    onSuccess: () => { qc.invalidateQueries(['calendario']); setDetalle(null); },
  });

  const handleSave = (form) => {
    if (modal === 'nuevo') return crearMutation.mutateAsync(form);
    return editarMutation.mutateAsync({ id: modal.id, ...form });
  };

  const navMes = (dir) => {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  // Construir grilla del mes
  const { primerDia, totalDias } = diasDelMes(year, month);
  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);

  const eventosPorDia = (dia) => {
    if (!dia) return [];
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return eventos.filter(e => e.fecha_inicio.slice(0, 10) === fecha);
  };

  const esHoy = (dia) => dia && year === hoy.getFullYear() && month === hoy.getMonth() && dia === hoy.getDate();

  return (
    <div className="animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Calendario 📅</h1>
          <p className="text-gray-500 text-sm font-semibold mt-1">{eventos.length} evento{eventos.length !== 1 ? 's' : ''} este mes</p>
        </div>
        <button className="btn-hs btn-hs-primary" onClick={() => { setFechaClick(''); setModal('nuevo'); }}>
          + Nuevo evento
        </button>
      </div>

      {/* Navegación de mes */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navMes(-1)} className="btn-hs btn-hs-ghost px-4">‹ Anterior</button>
        <h2 className="text-xl font-black text-gray-700 capitalize">
          {MESES[month]} {year}
        </h2>
        <button onClick={() => navMes(1)} className="btn-hs btn-hs-ghost px-4">Siguiente ›</button>
      </div>

      {/* Grilla del calendario */}
      <div className="card-hs p-0 overflow-hidden">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DIAS.map(d => (
            <div key={d} className="text-center text-xs font-black text-gray-400 py-3 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        {isLoading ? (
          <div className="py-20 text-center text-gray-400 font-semibold">Cargando…</div>
        ) : (
          <div className="grid grid-cols-7">
            {celdas.map((dia, i) => {
              const evs = eventosPorDia(dia);
              return (
                <div
                  key={i}
                  className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 cursor-pointer hover:bg-purple-50 transition-colors ${!dia ? 'bg-gray-50/50' : ''}`}
                  onClick={() => {
                    if (!dia) return;
                    const f = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                    setFechaClick(f);
                    setModal('nuevo');
                  }}
                >
                  {dia && (
                    <>
                      <div className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full mb-1 ${esHoy(dia) ? 'bg-purple-600 text-white' : 'text-gray-600'}`}>
                        {dia}
                      </div>
                      <div className="space-y-0.5">
                        {evs.slice(0, 3).map(e => (
                          <div
                            key={e.id}
                            className="text-[10px] font-bold truncate rounded px-1 py-0.5 cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: (e.categoria_color || '#805AD5') + '25', color: e.categoria_color || '#805AD5' }}
                            onClick={ev => { ev.stopPropagation(); setDetalle(e); }}
                          >
                            {e.categoria_icono && `${e.categoria_icono} `}{e.titulo}
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <div className="text-[10px] font-bold text-gray-400 px-1">+{evs.length - 3} más</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de eventos del mes */}
      {eventos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Todos los eventos del mes</h3>
          <div className="space-y-2">
            {eventos.map(e => (
              <div
                key={e.id}
                className="card-hs flex items-center gap-4 py-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetalle(e)}
              >
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: e.categoria_color || '#805AD5' }} />
                <div className="text-xl">{e.categoria_icono || '📅'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{e.titulo}</p>
                  <p className="text-xs text-gray-500 font-semibold capitalize">
                    {fechaLocal(e.fecha_inicio)}
                    {!e.es_todo_el_dia && ` · ${horaLocal(e.fecha_inicio)}`}
                    {e.grupo_nombre && ` · ${e.grupo_nombre}`}
                  </p>
                </div>
                {!e.publicado && <span className="text-xs font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Borrador</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <ModalEvento
          evento={modal === 'nuevo' ? null : modal}
          categorias={categorias}
          grupos={grupos}
          fechaInicial={fechaClick}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Detalle */}
      {detalle && (
        <DetalleEvento
          evento={detalle}
          onClose={() => setDetalle(null)}
          onEdit={() => { setModal(detalle); setDetalle(null); }}
          onDelete={() => eliminarMutation.mutate(detalle.id)}
        />
      )}
    </div>
  );
}

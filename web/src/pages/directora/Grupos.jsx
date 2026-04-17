import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// ─── Colores por nivel ────────────────────────────────────────────────────────
const NIVEL_COLORES = {
  maternal:  { bg: 'bg-pink-100',   text: 'text-pink-700',   ring: 'ring-pink-300' },
  prekinder: { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-300' },
  kinder_1:  { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-300' },
  kinder_2:  { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-300' },
  kinder_3:  { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-300' },
};

function colorNivel(nivel) {
  return NIVEL_COLORES[nivel] || { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-300' };
}

// ─── Modal de grupo ───────────────────────────────────────────────────────────
function ModalGrupo({ grupo, maestras, onClose, onSave }) {
  const esNuevo = !grupo;
  const [form, setForm] = useState({
    nombre: grupo?.nombre || '',
    nivel: grupo?.nivel || 'maternal',
    turno: grupo?.turno || 'matutino',
    horario_entrada: grupo?.horario_entrada || '07:00',
    horario_salida: grupo?.horario_salida || '14:00',
    capacidad_maxima: grupo?.capacidad_maxima || 15,
    color_hex: grupo?.color_hex || '#805AD5',
    activo: grupo?.activo ?? true,
    maestra_titular_id: grupo?.maestra_titular_id || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800">
            {esNuevo ? '+ Nuevo grupo' : `Editar — ${grupo.nombre}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del grupo *</label>
              <input
                className="input-hs w-full"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Ej. Kinder 2 A"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nivel</label>
              <select className="input-hs w-full" value={form.nivel} onChange={e => set('nivel', e.target.value)}>
                <option value="maternal">Maternal</option>
                <option value="prekinder">Prekinder</option>
                <option value="kinder_1">Kinder 1</option>
                <option value="kinder_2">Kinder 2</option>
                <option value="kinder_3">Kinder 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Turno</label>
              <select className="input-hs w-full" value={form.turno} onChange={e => set('turno', e.target.value)}>
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entrada</label>
              <input
                type="time" className="input-hs w-full"
                value={form.horario_entrada}
                onChange={e => set('horario_entrada', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Salida</label>
              <input
                type="time" className="input-hs w-full"
                value={form.horario_salida}
                onChange={e => set('horario_salida', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacidad máx.</label>
              <input
                type="number" min={1} max={40} className="input-hs w-full"
                value={form.capacidad_maxima}
                onChange={e => set('capacidad_maxima', parseInt(e.target.value) || 15)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color" className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer p-1"
                  value={form.color_hex}
                  onChange={e => set('color_hex', e.target.value)}
                />
                <span className="text-sm text-gray-500 font-mono">{form.color_hex}</span>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Maestra titular</label>
              <select className="input-hs w-full" value={form.maestra_titular_id} onChange={e => set('maestra_titular_id', e.target.value)}>
                <option value="">— Sin asignar —</option>
                {(maestras || []).map(m => (
                  <option key={m.id} value={m.id}>{m.nombre_completo}</option>
                ))}
              </select>
            </div>

            {!esNuevo && (
              <div className="col-span-2 flex items-center gap-3">
                <label className="text-sm font-bold text-gray-600">Grupo activo</label>
                <button
                  type="button"
                  onClick={() => set('activo', !form.activo)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.activo ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-hs btn-hs-ghost">Cancelar</button>
          <button onClick={submit} disabled={saving || !form.nombre.trim()} className="btn-hs btn-hs-primary">
            {saving ? 'Guardando…' : esNuevo ? 'Crear grupo' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de grupo ─────────────────────────────────────────────────────────
function TarjetaGrupo({ grupo, maestras, onEdit }) {
  const col = colorNivel(grupo.nivel);
  const ocupacion = grupo.total_alumnos || 0;
  const capacidad = grupo.capacidad_maxima || 1;
  const pct = Math.min(100, Math.round((ocupacion / capacidad) * 100));
  const barColor = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-400';

  return (
    <div className="card-hs group relative overflow-hidden animate-fade-in">
      {/* Color stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: grupo.color_hex || '#805AD5' }} />

      <div className="flex items-start justify-between mt-2">
        <div>
          <span className={`inline-block text-xs font-black uppercase px-2 py-0.5 rounded-full ${col.bg} ${col.text} mb-2`}>
            {grupo.nivel?.replace('_', ' ')}
          </span>
          <h3 className="text-lg font-black text-gray-800">{grupo.nombre}</h3>
          <p className="text-xs text-gray-500 font-semibold capitalize">{grupo.turno} · {grupo.horario_entrada} – {grupo.horario_salida}</p>
        </div>
        <button
          onClick={() => onEdit(grupo)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-purple-600 p-1 rounded-lg hover:bg-purple-50"
          title="Editar"
        >
          ✏️
        </button>
      </div>

      {/* Maestra */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-lg">👩‍🏫</span>
        <span className="text-sm font-semibold text-gray-600">
          {grupo.maestra_nombre || <em className="text-gray-400">Sin maestra asignada</em>}
        </span>
      </div>

      {/* Barra de ocupación */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
          <span>Alumnos</span>
          <span>{ocupacion} / {capacidad}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Estado */}
      {!grupo.activo && (
        <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-100 rounded-lg px-3 py-1 text-center">
          Grupo inactivo
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function DirectoraGrupos() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'nuevo' | { ...grupo }
  const [soloActivos, setSoloActivos] = useState(true);

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['grupos', soloActivos],
    queryFn: () => api.get('/grupos', { params: { activo: soloActivos } }).then(r => r.data),
  });

  const { data: maestras = [] } = useQuery({
    queryKey: ['maestras-lista'],
    queryFn: () => api.get('/personal', { params: { rol: 'maestra_titular', activo: true } }).then(r => r.data.personal || []),
  });

  const crearMutation = useMutation({
    mutationFn: (body) => api.post('/grupos', body),
    onSuccess: () => queryClient.invalidateQueries(['grupos']),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/grupos/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries(['grupos']),
  });

  const handleSave = (form) => {
    if (modal === 'nuevo') {
      return crearMutation.mutateAsync(form);
    } else {
      return editarMutation.mutateAsync({ id: modal.id, ...form });
    }
  };

  const gruposFiltrados = soloActivos ? grupos.filter(g => g.activo !== false) : grupos;

  return (
    <div className="animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Grupos 🏫</h1>
          <p className="text-gray-500 text-sm font-semibold mt-1">
            {gruposFiltrados.length} grupo{gruposFiltrados.length !== 1 ? 's' : ''} · gestiona niveles, maestras y horarios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded"
              checked={soloActivos}
              onChange={e => setSoloActivos(e.target.checked)}
            />
            Solo activos
          </label>
          <button
            className="btn-hs btn-hs-primary"
            onClick={() => setModal('nuevo')}
          >
            + Nuevo grupo
          </button>
        </div>
      </div>

      {/* Grid de grupos */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-hs h-40 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="card-hs flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🏫</div>
          <h3 className="text-xl font-black text-gray-700">No hay grupos</h3>
          <p className="text-gray-400 font-semibold mt-2 mb-6">Crea el primer grupo para comenzar.</p>
          <button className="btn-hs btn-hs-primary" onClick={() => setModal('nuevo')}>+ Crear grupo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gruposFiltrados.map(g => (
            <TarjetaGrupo key={g.id} grupo={g} maestras={maestras} onEdit={setModal} />
          ))}
        </div>
      )}

      {/* Leyenda de niveles */}
      <div className="mt-8 flex flex-wrap gap-2">
        {Object.entries(NIVEL_COLORES).map(([nivel, col]) => (
          <span key={nivel} className={`text-xs font-black px-3 py-1 rounded-full ${col.bg} ${col.text}`}>
            {nivel.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <ModalGrupo
          grupo={modal === 'nuevo' ? null : modal}
          maestras={maestras}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

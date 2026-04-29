import { useState } from 'react';

export default function ModalCategoria({ categoria, onClose, onSave }) {
  const esNuevo = !categoria;
  const [form, setForm] = useState({
    nombre:    categoria?.nombre    || '',
    color_hex: categoria?.color_hex || '#805AD5',
    icono:     categoria?.icono     || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color_hex)) {
      setError('Color inválido. Usa formato #RRGGBB'); return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="h-2 rounded-t-2xl" style={{ backgroundColor: form.color_hex }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-800">
            {esNuevo ? '+ Nueva categoría' : 'Editar categoría'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={submit} className="px-6 py-4 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre *</label>
            <input
              className="input-hs w-full"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Ej: Festivo, Académico…"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer"
                value={form.color_hex}
                onChange={e => set('color_hex', e.target.value)}
              />
              <input
                className="input-hs flex-1 font-mono"
                value={form.color_hex}
                onChange={e => set('color_hex', e.target.value)}
                placeholder="#805AD5"
                maxLength={7}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icono (emoji)</label>
            <input
              className="input-hs w-20 text-center text-2xl"
              value={form.icono}
              onChange={e => set('icono', e.target.value)}
              placeholder="📅"
              maxLength={2}
            />
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-hs btn-hs-ghost">Cancelar</button>
          <button onClick={submit} disabled={saving} className="btn-hs btn-hs-primary">
            {saving ? 'Guardando…' : esNuevo ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

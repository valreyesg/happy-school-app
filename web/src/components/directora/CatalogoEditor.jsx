import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Lock, ChevronUp, ChevronDown, Pencil, Check, X, Plus, EyeOff } from 'lucide-react';

export default function CatalogoEditor({ tipo, titulo, items = [], onRefresh }) {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(null); // key del item en edición
  const [formEdit, setFormEdit] = useState({});
  const [formNuevo, setFormNuevo] = useState({ key: '', label: '', emoji: '' });
  const [mostrandoNuevo, setMostrandoNuevo] = useState(false);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['catalogo', tipo] });
    queryClient.invalidateQueries({ queryKey: ['catalogo-admin', tipo] });
    onRefresh?.();
  };

  const mutEdit = useMutation({
    mutationFn: ({ key, data }) => api.put(`/catalogos/${tipo}/${key}`, data).then(r => r.data),
    onSuccess: () => { toast.success('Guardado'); setEditando(null); invalidar(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al guardar'),
  });

  const mutDelete = useMutation({
    mutationFn: (key) => api.delete(`/catalogos/${tipo}/${key}`).then(r => r.data),
    onSuccess: () => { toast.success('Opción desactivada'); invalidar(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al desactivar'),
  });

  const mutReactivar = useMutation({
    mutationFn: (key) => api.put(`/catalogos/${tipo}/${key}`, { activo: true }).then(r => r.data),
    onSuccess: () => { toast.success('Opción reactivada'); invalidar(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al reactivar'),
  });

  const mutNuevo = useMutation({
    mutationFn: (data) => api.post(`/catalogos/${tipo}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Opción agregada');
      setFormNuevo({ key: '', label: '', emoji: '' });
      setMostrandoNuevo(false);
      invalidar();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al agregar'),
  });

  const mutReorder = useMutation({
    mutationFn: (items) => api.put(`/catalogos/${tipo}/reorder`, { items }).then(r => r.data),
    onSuccess: () => invalidar(),
  });

  const iniciarEdicion = (item) => {
    setEditando(item.key);
    setFormEdit({ label: item.label, emoji: item.emoji || '' });
  };

  const mover = (idx, direccion) => {
    const activos = items.filter(i => i.activo);
    const nuevo = [...activos];
    const destino = idx + direccion;
    if (destino < 0 || destino >= nuevo.length) return;
    [nuevo[idx], nuevo[destino]] = [nuevo[destino], nuevo[idx]];
    const reordenados = nuevo.map((item, i) => ({ key: item.key, orden: i + 1 }));
    mutReorder.mutate(reordenados);
  };

  const confirmarDesactivar = (item) => {
    if (!window.confirm(`¿Segura que deseas desactivar "${item.label}"?\n\nLa opción se ocultará en la app pero el historial se conserva.`)) return;
    mutDelete.mutate(item.key);
  };

  const activos = items.filter(i => i.activo);
  const inactivos = items.filter(i => !i.activo);
  const todosDeSistema = activos.length > 0 && activos.every(i => i.es_sistema);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-black text-gray-800 text-sm">{titulo}</h3>
        {!todosDeSistema && (
          <button
            onClick={() => setMostrandoNuevo(v => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-hs-purple hover:bg-hs-purple/10 px-3 py-1.5 rounded-xl transition-all"
          >
            <Plus size={14} />
            Agregar
          </button>
        )}
      </div>

      {/* Formulario nuevo */}
      {mostrandoNuevo && (
        <div className="px-5 py-3 bg-purple-50 border-b border-purple-100">
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Emoji</label>
              <input
                value={formNuevo.emoji}
                onChange={e => setFormNuevo(f => ({ ...f, emoji: e.target.value }))}
                className="w-14 border border-gray-200 rounded-xl px-2 py-1.5 text-center text-lg focus:outline-none focus:ring-2 focus:ring-hs-purple/30"
                placeholder="😊"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 block mb-1">Nombre visible</label>
              <input
                value={formNuevo.label}
                onChange={e => setFormNuevo(f => ({ ...f, label: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hs-purple/30"
                placeholder="Ej: Muy ansioso"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Clave interna</label>
              <input
                value={formNuevo.key}
                onChange={e => setFormNuevo(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                className="w-28 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-hs-purple/30"
                placeholder="muy_ansioso"
              />
            </div>
            <button
              onClick={() => mutNuevo.mutate(formNuevo)}
              disabled={!formNuevo.key || !formNuevo.label || mutNuevo.isPending}
              className="px-4 py-1.5 bg-hs-purple text-white rounded-xl text-sm font-bold disabled:opacity-40"
            >
              Guardar
            </button>
            <button onClick={() => setMostrandoNuevo(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Lista de items activos */}
      <div className="divide-y divide-gray-50">
        {activos.map((item, idx) => (
          <div key={item.key} className={`flex items-center gap-3 px-5 py-3 ${editando === item.key ? 'bg-purple-50' : 'hover:bg-gray-50'} transition-colors`}>
            {/* Reordenar */}
            {!item.es_sistema && (
              <div className="flex flex-col gap-0.5">
                <button onClick={() => mover(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20"><ChevronUp size={14} /></button>
                <button onClick={() => mover(idx, 1)} disabled={idx === activos.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20"><ChevronDown size={14} /></button>
              </div>
            )}
            {item.es_sistema && <div className="w-6" />}

            {/* Emoji */}
            {editando === item.key ? (
              <input
                value={formEdit.emoji}
                onChange={e => setFormEdit(f => ({ ...f, emoji: e.target.value }))}
                className="w-10 border border-purple-200 rounded-lg px-1 py-0.5 text-center text-lg focus:outline-none"
                maxLength={2}
              />
            ) : (
              <span className="text-xl w-8 text-center">{item.emoji || '—'}</span>
            )}

            {/* Label */}
            {editando === item.key ? (
              <input
                value={formEdit.label}
                onChange={e => setFormEdit(f => ({ ...f, label: e.target.value }))}
                className="flex-1 border border-purple-200 rounded-lg px-2 py-1 text-sm focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm font-semibold text-gray-700">{item.label}</span>
            )}

            {/* Clave técnica */}
            <span className="text-xs font-mono text-gray-300 hidden sm:block">{item.key}</span>

            {/* Indicador de sistema */}
            {item.es_sistema && (
              <span title="Valor de sistema — no se puede eliminar" className="text-gray-300">
                <Lock size={13} />
              </span>
            )}

            {/* Acciones */}
            {editando === item.key ? (
              <div className="flex gap-1">
                <button
                  onClick={() => mutEdit.mutate({ key: item.key, data: formEdit })}
                  disabled={mutEdit.isPending}
                  className="p-1.5 bg-hs-purple text-white rounded-lg hover:bg-purple-700"
                >
                  <Check size={14} />
                </button>
                <button onClick={() => setEditando(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => iniciarEdicion(item)}
                  className="p-1.5 text-gray-400 hover:text-hs-purple rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                {!item.es_sistema && (
                  <button
                    onClick={() => confirmarDesactivar(item)}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                    title="Desactivar"
                  >
                    <EyeOff size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Inactivos (colapsados) */}
      {inactivos.length > 0 && (
        <details className="border-t border-gray-100">
          <summary className="px-5 py-2 text-xs text-gray-400 font-semibold cursor-pointer hover:bg-gray-50 select-none">
            {inactivos.length} opción{inactivos.length !== 1 ? 'es' : ''} inactiva{inactivos.length !== 1 ? 's' : ''} (historial conservado)
          </summary>
          <div className="divide-y divide-gray-50 bg-gray-50/50">
            {inactivos.map(item => (
              <div key={item.key} className="flex items-center gap-3 px-5 py-2.5 opacity-60">
                <span className="text-lg w-8 text-center">{item.emoji || '—'}</span>
                <span className="flex-1 text-sm text-gray-500 line-through">{item.label}</span>
                <span className="text-xs font-mono text-gray-300">{item.key}</span>
                <button
                  onClick={() => mutReactivar.mutate(item.key)}
                  className="text-xs font-bold text-hs-purple hover:underline"
                >
                  Reactivar
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

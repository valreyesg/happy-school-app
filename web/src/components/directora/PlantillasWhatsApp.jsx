import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Save, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

// Extrae variables {{nombre}} de una plantilla
function extraerVariables(texto) {
  const matches = texto.match(/\{\{[^}]+\}\}/g);
  return matches ? [...new Set(matches)] : [];
}

function ModalEditarPlantilla({ plantilla, onClose, onSave }) {
  const [nombre, setNombre] = useState(plantilla.nombre);
  const [texto, setTexto] = useState(plantilla.plantilla);
  const [guardando, setGuardando] = useState(false);

  const variables = extraerVariables(texto);

  const handleSave = async () => {
    if (!nombre.trim()) return toast.error('El nombre es requerido');
    if (!texto.trim()) return toast.error('El texto es requerido');
    setGuardando(true);
    try {
      await onSave({ nombre: nombre.trim(), plantilla: texto.trim() });
      onClose();
    } catch {
      // error ya manejado en mutación
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-800">Editar plantilla</h3>
            <code className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{plantilla.clave}</code>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la plantilla</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Texto del mensaje
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={6}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Usa <code className="bg-gray-100 px-1 rounded">{'{{variable}}'}</code> para insertar datos dinámicos.
            </p>
          </div>

          {/* Variables detectadas */}
          {variables.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-green-700 mb-2">Variables detectadas:</p>
              <div className="flex flex-wrap gap-1.5">
                {variables.map(v => (
                  <span key={v} className="bg-green-100 text-green-800 text-xs font-mono px-2 py-0.5 rounded-lg">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlantillaCard({ plantilla, onEditar, onToggle }) {
  const [expandida, setExpandida] = useState(false);
  const variables = extraerVariables(plantilla.plantilla);

  return (
    <div className={`bg-white rounded-xl border transition-all ${
      plantilla.activa ? 'border-gray-200' : 'border-gray-100 opacity-60'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icono WhatsApp */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          plantilla.activa ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <span className="text-lg">📱</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold truncate ${plantilla.activa ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
              {plantilla.nombre}
            </span>
            {variables.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-mono flex-shrink-0">
                {variables.length} var{variables.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <code className="text-xs text-gray-400">{plantilla.clave}</code>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpandida(v => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            title={expandida ? 'Colapsar' : 'Ver texto'}
          >
            {expandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => onEditar(plantilla)}
            className="p-1.5 text-gray-400 hover:text-hs-purple rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onToggle(plantilla)}
            className={`p-1.5 rounded-lg transition-colors ${
              plantilla.activa
                ? 'text-green-500 hover:text-red-400'
                : 'text-gray-300 hover:text-green-500'
            }`}
            title={plantilla.activa ? 'Desactivar' : 'Activar'}
          >
            {plantilla.activa ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      </div>

      {/* Texto expandido */}
      {expandida && (
        <div className="px-4 pb-3 pt-0 border-t border-gray-50 mt-1">
          <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed">
            {plantilla.plantilla}
          </pre>
          {variables.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {variables.map(v => (
                <span key={v} className="text-xs bg-blue-50 text-blue-600 font-mono px-1.5 py-0.5 rounded-md">
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlantillasWhatsApp() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(null); // plantilla objeto | null
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas'); // 'todas' | 'activas' | 'inactivas'

  const { data: plantillas = [], isLoading } = useQuery({
    queryKey: ['plantillas-whatsapp'],
    queryFn: () => api.get('/plantillas').then(r => r.data),
  });

  const mutEdit = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/plantillas/${id}`, body).then(r => r.data),
    onSuccess: () => {
      toast.success('Plantilla guardada ✅');
      qc.invalidateQueries({ queryKey: ['plantillas-whatsapp'] });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al guardar'),
  });

  const mutToggle = useMutation({
    mutationFn: (id) => api.patch(`/plantillas/${id}/toggle`).then(r => r.data),
    onSuccess: (data) => {
      toast.success(data.activa ? 'Plantilla activada' : 'Plantilla desactivada');
      qc.invalidateQueries({ queryKey: ['plantillas-whatsapp'] });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  });

  const plantillasFiltradas = plantillas
    .filter(p => {
      if (filtro === 'activas') return p.activa;
      if (filtro === 'inactivas') return !p.activa;
      return true;
    })
    .filter(p => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.clave.toLowerCase().includes(q);
    });

  const activas = plantillas.filter(p => p.activa).length;
  const inactivas = plantillas.length - activas;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-green-700">{plantillas.length}</div>
          <div className="text-xs font-semibold text-green-600">Total</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-emerald-700">{activas}</div>
          <div className="text-xs font-semibold text-emerald-600">Activas</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-gray-500">{inactivas}</div>
          <div className="text-xs font-semibold text-gray-400">Inactivas</div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre o clave…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-400"
        />
        <div className="flex gap-1">
          {[
            { id: 'todas',    label: 'Todas'    },
            { id: 'activas',  label: 'Activas'  },
            { id: 'inactivas',label: 'Inactivas'},
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                filtro === id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de plantillas */}
      <div className="space-y-2">
        {plantillasFiltradas.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No hay plantillas que coincidan.</p>
        ) : (
          plantillasFiltradas.map(p => (
            <PlantillaCard
              key={p.id}
              plantilla={p}
              onEditar={setEditando}
              onToggle={(pl) => mutToggle.mutate(pl.id)}
            />
          ))
        )}
      </div>

      {/* Modal editar */}
      {editando && (
        <ModalEditarPlantilla
          plantilla={editando}
          onClose={() => setEditando(null)}
          onSave={(body) => mutEdit.mutateAsync({ id: editando.id, ...body })}
        />
      )}
    </div>
  );
}

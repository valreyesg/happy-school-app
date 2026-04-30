import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import Modal from '@/components/ui/Modal';

export default function DirectoraVisitantes() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const queryClient = useQueryClient();

  const { data: visitantes = [], isLoading } = useQuery({
    queryKey: ['visitantes', fecha],
    queryFn: () => api.get('/visitantes', { params: { fecha } }).then(r => r.data),
  });

  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const crearMutation = useMutation({
    mutationFn: (formData) => api.post('/visitantes', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitantes', fecha] });
      toast.success('Visitante registrado');
      cerrarModal();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al registrar'),
  });

  const registrarSalidaMutation = useMutation({
    mutationFn: (id) => api.patch(`/visitantes/${id}/salida`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitantes', fecha] });
      toast.success('Salida registrada');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al registrar salida'),
  });

  const activarExtensionMutation = useMutation({
    mutationFn: (id) => api.patch(`/visitantes/${id}/extension`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitantes', fecha] });
      toast.success('Extensión del día activada');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al activar extensión'),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id) => api.delete(`/visitantes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitantes', fecha] });
      toast.success('Visitante eliminado');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al eliminar'),
  });

  const formatHora = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
  };

  if (isLoading) return <SkeletonList count={3} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Visitantes 👁️</h1>
          <p className="text-gray-500 font-semibold mt-1">{visitantes.length} registrado{visitantes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-hs-blue-dark text-white rounded-lg hover:bg-hs-blue-dark transition"
        >
          <Plus size={20} /> Registrar
        </button>
      </div>

      {/* Selector de fecha */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-gray-700">Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hs-blue/30"
        />
      </div>

      {/* Lista de visitantes */}
      <div className="grid gap-4">
        {visitantes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay visitantes registrados para esta fecha
          </div>
        ) : (
          visitantes.map((v) => (
            <div
              key={v.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex gap-4">
                {/* Foto */}
                {v.foto_url && (
                  <img
                    src={v.foto_url}
                    alt={v.nombre}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                {/* Datos */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{v.nombre}</h3>
                  <p className="text-sm text-gray-600">
                    {v.grupo_nombre || '—'} • {v.tutor_nombre || '—'}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-hs-blue-dark rounded">
                      🕐 {formatHora(v.hora_entrada)}
                    </span>
                    {v.hora_salida && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        ✅ Salida {formatHora(v.hora_salida)}
                      </span>
                    )}
                    {v.tiene_extension_dia && (
                      <span className="px-2 py-1 text-xs bg-hs-purple/20 text-hs-purple-dark rounded">
                        🌙 Extensión día
                      </span>
                    )}
                  </div>
                </div>
                {/* Botones */}
                <div className="flex gap-2 items-start flex-col">
                  {!v.hora_salida && (
                    <>
                      {!v.tiene_extension_dia && (
                        <button
                          onClick={() => activarExtensionMutation.mutate(v.id)}
                          disabled={activarExtensionMutation.isPending}
                          className="px-3 py-1 text-xs bg-hs-purple/20 text-hs-purple-dark rounded hover:bg-hs-purple/30 transition disabled:opacity-50"
                        >
                          <Clock size={14} className="inline mr-1" /> Extensión
                        </button>
                      )}
                      <button
                        onClick={() => registrarSalidaMutation.mutate(v.id)}
                        disabled={registrarSalidaMutation.isPending}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50"
                      >
                        <LogOut size={14} className="inline mr-1" /> Salida
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => eliminarMutation.mutate(v.id)}
                    disabled={eliminarMutation.isPending}
                    className="p-2 hover:bg-red-100 rounded transition disabled:opacity-50"
                  >
                    <X size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Registrar */}
      <ModalRegistrarVisitante
        open={modalAbierto}
        onClose={cerrarModal}
        onSubmit={(data) => crearMutation.mutate(data)}
        isLoading={crearMutation.isPending}
      />
    </div>
  );
}

function ModalRegistrarVisitante({ open, onClose, onSubmit, isLoading }) {
  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const [form, setForm] = useState({
    nombre: '',
    grupo_visitado_id: '',
    tutor_nombre: '',
    tutor_telefono: '',
    notas: '',
    foto: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre) {
      return toast.error('El nombre es obligatorio');
    }

    const data = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'foto' && form[key]) {
        data.append('foto', form[key]);
      } else if (key !== 'foto' && form[key]) {
        data.append(key, form[key]);
      }
    });

    onSubmit(data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Visitante"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre del niño *"
          value={form.nombre}
          onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
          className="input-hs w-full"
          required
        />
        <select
          value={form.grupo_visitado_id}
          onChange={(e) => setForm(prev => ({ ...prev, grupo_visitado_id: e.target.value }))}
          className="input-hs w-full"
        >
          <option value="">Grupo visitado (opcional)</option>
          {grupos.map(g => (
            <option key={g.id} value={g.id}>{g.nombre}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Nombre tutor (opcional)"
          value={form.tutor_nombre}
          onChange={(e) => setForm(prev => ({ ...prev, tutor_nombre: e.target.value }))}
          className="input-hs w-full"
        />
        <input
          type="tel"
          placeholder="Teléfono tutor (opcional)"
          value={form.tutor_telefono}
          onChange={(e) => setForm(prev => ({ ...prev, tutor_telefono: e.target.value }))}
          className="input-hs w-full"
        />
        <input
          type="text"
          placeholder="Notas (opcional)"
          value={form.notas}
          onChange={(e) => setForm(prev => ({ ...prev, notas: e.target.value }))}
          className="input-hs w-full"
        />
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Foto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm(prev => ({ ...prev, foto: e.target.files?.[0] || null }))}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-hs-purple/10 file:text-hs-purple-dark hover:file:bg-purple-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-hs-blue text-white font-bold transition-colors hover:bg-hs-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

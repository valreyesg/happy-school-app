import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, QrCode, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { SkeletonList } from '@/components/ui/SkeletonCard';

export default function DirectoraNinosExtension() {
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ninoEditar, setNinoEditar] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(null);
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ['ninos-extension'],
    queryFn: () => api.get('/ninos-extension').then(r => r.data),
  });

  const ninos = buscar
    ? data.filter(n => n.nombre_completo.toLowerCase().includes(buscar.toLowerCase()))
    : data;

  const abrirCrear = () => { setNinoEditar(null); setModalAbierto(true); };
  const abrirEditar = (nino) => { setNinoEditar(nino); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setNinoEditar(null); };

  const crearMutation = useMutation({
    mutationFn: (formData) => api.post('/ninos-extension', formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['ninos-extension']);
      toast.success('Niño de extensión creado');
      cerrarModal();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al crear'),
  });

  const editarMutation = useMutation({
    mutationFn: (data) => {
      const { id, ...rest } = data;
      return api.put(`/ninos-extension/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ninos-extension']);
      toast.success('Niño de extensión actualizado');
      cerrarModal();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al actualizar'),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id) => api.delete(`/ninos-extension/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['ninos-extension']);
      toast.success('Niño de extensión eliminado');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al eliminar'),
  });

  if (isLoading) return <SkeletonList count={3} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Niños de Extensión 🌙</h1>
          <p className="text-gray-500 font-semibold mt-1">{ninos.length} registrado{ninos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Agregar
        </button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Lista de niños */}
      <div className="grid gap-4">
        {ninos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay niños de extensión registrados
          </div>
        ) : (
          ninos.map((nino) => (
            <div
              key={nino.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex gap-4">
                {/* Foto */}
                {nino.foto_url && (
                  <img
                    src={nino.foto_url}
                    alt={nino.nombre_completo}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                {/* Datos */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{nino.nombre_completo}</h3>
                  <p className="text-sm text-gray-600">
                    {nino.tutor_nombre} • {nino.tutor_telefono}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      nino.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {nino.activo ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {nino.modalidad_pago === 'por_dia' ? '💳 Por día' : '📅 Mensual'}
                    </span>
                  </div>
                </div>
                {/* Botones */}
                <div className="flex gap-2 items-start">
                  <button
                    onClick={() => setMostrarQR(nino)}
                    className="p-2 hover:bg-gray-100 rounded transition"
                    title="Ver QR"
                  >
                    <QrCode size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => abrirEditar(nino)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarMutation.mutate(nino.id)}
                    className="p-2 hover:bg-red-100 rounded transition"
                  >
                    <X size={20} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <ModalNino
          nino={ninoEditar}
          onClose={cerrarModal}
          onSubmit={(data) => {
            if (ninoEditar) {
              editarMutation.mutate({ ...data, id: ninoEditar.id });
            } else {
              crearMutation.mutate(data);
            }
          }}
          isLoading={crearMutation.isPending || editarMutation.isPending}
        />
      )}

      {/* Modal QR */}
      {mostrarQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">QR: {mostrarQR.nombre_completo}</h2>
              <button
                onClick={() => setMostrarQR(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mostrarQR.qr_codigo || `HAPPYSCHOOL:EXT:${mostrarQR.id}`)}`}
                alt="QR Code"
                className="border-2 border-gray-200 rounded"
              />
              <code className="text-xs bg-gray-100 p-2 rounded text-center w-full break-all">
                {mostrarQR.qr_codigo || `HAPPYSCHOOL:EXT:${mostrarQR.id}`}
              </code>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mostrarQR.qr_codigo || `HAPPYSCHOOL:EXT:${mostrarQR.id}`)}`}
                download={`qr-${mostrarQR.nombre_completo}.png`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <Download size={18} /> Descargar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalNino({ nino, onClose, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    nombre_completo: nino?.nombre_completo || '',
    fecha_nacimiento: nino?.fecha_nacimiento || '',
    tutor_nombre: nino?.tutor_nombre || '',
    tutor_telefono: nino?.tutor_telefono || '',
    tutor_email: nino?.tutor_email || '',
    modalidad_pago: nino?.modalidad_pago || 'mensual',
    foto: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    setForm(prev => ({ ...prev, foto: e.target.files?.[0] || null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Si hay foto, usar FormData; si no, enviar JSON
    if (form.foto) {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'foto' && form[key]) {
          formData.append('foto', form[key]);
        } else if (key !== 'foto') {
          formData.append(key, form[key]);
        }
      });
      onSubmit(formData);
    } else {
      // Enviar sin foto como JSON
      const data = { ...form };
      delete data.foto;
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">{nino ? 'Editar' : 'Crear'} Niño de Extensión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="nombre_completo"
            placeholder="Nombre completo *"
            value={form.nombre_completo}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="tutor_nombre"
            placeholder="Nombre tutor *"
            value={form.tutor_nombre}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            name="tutor_telefono"
            placeholder="Teléfono tutor *"
            value={form.tutor_telefono}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="tutor_email"
            placeholder="Email tutor (opcional)"
            value={form.tutor_email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="modalidad_pago"
            value={form.modalidad_pago}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mensual">Mensual</option>
            <option value="por_dia">Por día</option>
          </select>
          <div>
            <label className="block text-sm font-medium mb-1">Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? '...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, Clock, Trash2, X, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

function getISOWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + (4 - (d.getDay() || 7)));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  return Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
}

function getSemanaKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + (4 - (d.getDay() || 7)));
  const anioISO = thursday.getFullYear();
  const semana = getISOWeek(dateStr);
  return `${anioISO}-W${String(semana).padStart(2, '0')}`;
}

function getLunesToDomingo(dateStr) {
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const d = new Date(dateStr + 'T12:00:00');
  const diaSemana = (d.getDay() + 6) % 7;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - diaSemana);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (f) => `${f.getDate()} ${MESES[f.getMonth()]}`;
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

function agruparPorSemana(tareas, orden = 'asc') {
  const mapa = {};
  for (const t of tareas) {
    const dateStr = t.fecha_limite.substring(0, 10);
    const semanaKey = getSemanaKey(dateStr);
    if (!mapa[semanaKey]) {
      mapa[semanaKey] = { semanaKey, label: getLunesToDomingo(dateStr), tareas: [] };
    }
    mapa[semanaKey].tareas.push(t);
  }
  const grupos = Object.values(mapa);
  grupos.sort((a, b) =>
    orden === 'asc' ? a.semanaKey.localeCompare(b.semanaKey) : b.semanaKey.localeCompare(a.semanaKey)
  );
  return grupos;
}

function proximoDiaHabil(fecha = new Date()) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().substring(0, 10);
}

function ModalEditarTarea({ tarea, onClose, onSuccess }) {
  const [form, setForm] = useState({
    titulo: tarea.titulo,
    descripcion: tarea.descripcion || '',
    fecha_limite: tarea.fecha_limite.substring(0, 10),
    foto: null
  });
  const [preview, setPreview] = useState(tarea.foto_url || null);
  const fileRef = useRef(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('titulo', form.titulo);
      fd.append('descripcion', form.descripcion);
      fd.append('fecha_limite', form.fecha_limite);
      if (form.foto) fd.append('foto', form.foto);
      return api.put(`/tareas/${tarea.id}`, fd);
    },
    onSuccess: () => {
      toast.success('Tarea actualizada');
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al actualizar')
  });

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(p => ({ ...p, foto: file }));
      const reader = new FileReader();
      reader.onload = (evt) => setPreview(evt.target?.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="✏️ Editar Tarea"
      size="md"
      closeOnBackdrop={false}
    >
      <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hs-blue/30"
              placeholder="Ej: Tarea de matemática"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hs-blue/30 resize-none"
              placeholder="Detalles de la tarea"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha entrega</label>
            <input
              type="date"
              value={form.fecha_limite}
              onChange={(e) => setForm(p => ({ ...p, fecha_limite: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hs-blue/30"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Foto (opcional)</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-hs-blue/50 transition"
            >
              <Upload size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Seleccionar foto</p>
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={handleFoto} />
            {preview && (
              <div className="mt-2 relative">
                <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                <button
                  onClick={() => { setPreview(null); setForm(p => ({ ...p, foto: null })); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
            )}
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!form.titulo || mutation.isPending}
          className="flex-1 px-4 py-2 bg-hs-blue text-white rounded-lg font-bold hover:bg-hs-blue-dark disabled:opacity-50"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </Modal>
  );
}

function ModalNuevaTarea({ grupoId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fecha_limite: proximoDiaHabil(),
    foto: null
  });
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('titulo', form.titulo);
      fd.append('descripcion', form.descripcion);
      fd.append('fecha_limite', form.fecha_limite);
      fd.append('grupo_id', grupoId);
      if (form.foto) fd.append('foto', form.foto);
      return api.post('/tareas', fd);
    },
    onSuccess: () => {
      toast.success('Tarea creada');
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al crear tarea')
  });

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(p => ({ ...p, foto: file }));
      const reader = new FileReader();
      reader.onload = (evt) => setPreview(evt.target?.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="📋 Nueva Tarea"
      size="md"
      closeOnBackdrop={false}
    >
      <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hs-blue/30"
              placeholder="Ej: Tarea de matemática"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hs-blue/30 resize-none"
              placeholder="Detalles de la tarea"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha entrega</label>
            <input
              type="date"
              value={form.fecha_limite}
              onChange={(e) => setForm(p => ({ ...p, fecha_limite: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hs-blue/30"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Foto (opcional)</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-hs-blue/50 transition"
            >
              <Upload size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Seleccionar foto</p>
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={handleFoto} />
            {preview && (
              <div className="mt-2 relative">
                <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                <button
                  onClick={() => { setPreview(null); setForm(p => ({ ...p, foto: null })); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.titulo || !grupoId || mutation.isPending}
            className="flex-1 px-4 py-2 bg-hs-blue text-white rounded-lg font-bold hover:bg-hs-blue-dark disabled:opacity-50"
          >
            {mutation.isPending ? 'Creando...' : 'Crear'}
          </button>
      </div>
    </Modal>
  );
}

function ModalEntregas({ tareaId, titulo, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['alumnos-tarea', tareaId],
    queryFn: () => api.get(`/tareas/${tareaId}/alumnos`).then(r => r.data),
  });

  const entregaron = data?.alumnos.filter(a => a.completada) || [];
  const faltan = data?.alumnos.filter(a => !a.completada) || [];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="📊 Entregas"
      size="sm"
      closeOnBackdrop={true}
    >
      <p className="text-xs text-gray-500 mb-4 truncate">{titulo}</p>

      {isLoading ? (
        <div className="text-center py-6 text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-4">
            {/* Entregaron */}
            <div>
              <p className="text-xs font-black text-green-700 uppercase tracking-wide mb-2">
                ✅ Entregaron ({entregaron.length})
              </p>
              {entregaron.length === 0 ? (
                <p className="text-xs text-gray-400 ml-2">Ninguno aún</p>
              ) : (
                <ul className="space-y-1">
                  {entregaron.map(a => (
                    <li key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      {a.nombre_completo}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Faltan */}
            <div>
              <p className="text-xs font-black text-red-600 uppercase tracking-wide mb-2">
                ❌ Faltan ({faltan.length})
              </p>
              {faltan.length === 0 ? (
                <p className="text-xs text-gray-400 ml-2">¡Todos entregaron!</p>
              ) : (
                <ul className="space-y-1">
                  {faltan.map(a => (
                    <li key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      {a.nombre_completo}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      )}

      <button
        onClick={onClose}
        className="w-full mt-5 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
      >
        Cerrar
      </button>
    </Modal>
  );
}

function TareaCard({ tarea, onPublicar, onDelete, onEdit }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEntregas, setShowEntregas] = useState(false);
  const { data: entregas } = useQuery({
    queryKey: ['entregas', tarea.id],
    queryFn: () => api.get(`/tareas/${tarea.id}/entregas`).then(r => r.data),
    enabled: tarea.publicada
  });

  const publicarMutation = useMutation({
    mutationFn: () => api.put(`/tareas/${tarea.id}/publicar`),
    onSuccess: () => {
      toast.success('Tarea publicada');
      onPublicar();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error')
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tareas/${tarea.id}`),
    onSuccess: () => {
      toast.success('Tarea eliminada');
      onDelete();
    },
    onError: () => toast.error('Error al eliminar')
  });

  return (
    <div className="card-hs p-4 border-l-4" style={{ borderColor: tarea.publicada ? '#10b981' : '#f59e0b' }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">{tarea.titulo}</h3>
          {tarea.descripcion && (
            <p className="text-sm text-gray-600 mt-1">{tarea.descripcion.substring(0, 100)}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            📅 Entrega: {new Date(tarea.fecha_limite.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-MX')}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          {!tarea.publicada && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1 bg-hs-blue text-white text-sm font-bold rounded hover:bg-hs-blue-dark"
              >
                <Edit size={16} className="inline mr-1" />
                Editar
              </button>
              <button
                onClick={() => publicarMutation.mutate()}
                disabled={publicarMutation.isPending}
                className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded hover:bg-green-600 disabled:opacity-50"
              >
                Publicar
              </button>
            </>
          )}
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {showEditModal && (
          <ModalEditarTarea
            tarea={tarea}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => onEdit?.()}
          />
        )}

        {showEntregas && (
          <ModalEntregas
            tareaId={tarea.id}
            titulo={tarea.titulo}
            onClose={() => setShowEntregas(false)}
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
          tarea.publicada ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {tarea.publicada ? '✅ Publicada' : '⏳ Borrador'}
        </span>

        {tarea.publicada && entregas && (
          <button
            onClick={() => setShowEntregas(true)}
            className="inline-flex items-center gap-1 text-sm font-bold text-hs-blue-dark hover:underline"
          >
            📊 {entregas.entregadas}/{entregas.total} entregaron
          </button>
        )}
      </div>
    </div>
  );
}

function NavegadorSemana({ grupos, indice, setIndice, colorClass, emptyMsg, onSuccess }) {
  if (grupos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">{emptyMsg}</div>
    );
  }

  const grupo = grupos[indice];
  const hasPrev = indice > 0;
  const hasNext = indice < grupos.length - 1;

  return (
    <div>
      {/* Navegador */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIndice(i => i - 1)}
          disabled={!hasPrev}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="text-center">
          <p className={`text-sm font-black ${colorClass}`}>
            Semana del {grupo.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {indice + 1} de {grupos.length} semanas · {grupo.tareas.length} tarea{grupo.tareas.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={() => setIndice(i => i + 1)}
          disabled={!hasNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Tareas de la semana */}
      <div className="space-y-3">
        {grupo.tareas.map(t => (
          <TareaCard key={t.id} tarea={t} onPublicar={onSuccess} onDelete={onSuccess} onEdit={onSuccess} />
        ))}
      </div>
    </div>
  );
}

export default function MaestraTareas() {
  const { usuario } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('proximas');
  const [indicePorRecibir, setIndicePorRecibir] = useState(0);
  const [indiceVencidas, setIndiceVencidas] = useState(0);
  const queryClient = useQueryClient();

  const { data: grupo } = useQuery({
    queryKey: ['mi-grupo'],
    queryFn: () => api.get('/grupos/mi-grupo').then(r => r.data),
  });

  const { data: tareas, isLoading } = useQuery({
    queryKey: ['tareas', grupo?.id],
    queryFn: () => api.get(`/tareas?grupo_id=${grupo.id}`).then(r => r.data),
    enabled: !!grupo?.id
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tareas', grupo?.id] });
  };

  if (isLoading || !grupo) return <div className="p-6 text-center">Cargando...</div>;

  const borradores = tareas?.filter(t => !t.publicada) || [];
  const publicadas = tareas?.filter(t => t.publicada) || [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const porRecibir = publicadas.filter(t => {
    const fechaTarea = new Date(t.fecha_limite.substring(0, 10) + 'T12:00:00');
    return fechaTarea >= hoy;
  });
  const vencidas = publicadas.filter(t => {
    const fechaTarea = new Date(t.fecha_limite.substring(0, 10) + 'T12:00:00');
    return fechaTarea < hoy;
  });

  // Semana actual para centrar el índice inicial de porRecibir
  const gruposPorRecibir = agruparPorSemana(porRecibir, 'asc');
  const gruposVencidas = agruparPorSemana(vencidas, 'desc');

  const totalTareas = (tareas?.length) || 0;

  const TABS = [
    { key: 'proximas', label: '📬 Próximas', count: porRecibir.length, color: 'text-hs-blue-dark' },
    { key: 'vencidas', label: '🗂️ Vencidas', count: vencidas.length, color: 'text-red-600' },
    { key: 'borradores', label: '📤 Borradores', count: borradores.length, color: 'text-yellow-700' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800">📋 Tareas Grupales</h1>
          <p className="text-sm text-gray-600 mt-1">Grupo: {grupo?.nombre}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-hs-blue text-white rounded-lg font-bold hover:bg-hs-blue-dark"
        >
          <Plus size={20} />
          Nueva Tarea
        </button>
      </div>

      {totalTareas === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay tareas aún</p>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-5">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
                  tab === t.key
                    ? `border-current ${t.color}`
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black ${
                    tab === t.key ? 'bg-current/10' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Próximas */}
          {tab === 'proximas' && (
            <NavegadorSemana
              grupos={gruposPorRecibir}
              indice={indicePorRecibir}
              setIndice={setIndicePorRecibir}
              colorClass="text-hs-blue-dark"
              emptyMsg="No hay tareas próximas"
              onSuccess={handleSuccess}
            />
          )}

          {/* Tab: Vencidas */}
          {tab === 'vencidas' && (
            <NavegadorSemana
              grupos={gruposVencidas}
              indice={indiceVencidas}
              setIndice={setIndiceVencidas}
              colorClass="text-red-600"
              emptyMsg="No hay tareas vencidas"
              onSuccess={handleSuccess}
            />
          )}

          {/* Tab: Borradores */}
          {tab === 'borradores' && (
            <div>
              {borradores.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No hay borradores</div>
              ) : (
                <div className="space-y-3">
                  {borradores.map(t => (
                    <TareaCard
                      key={t.id}
                      tarea={t}
                      onPublicar={handleSuccess}
                      onDelete={handleSuccess}
                      onEdit={handleSuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ModalNuevaTarea
          grupoId={grupo?.id}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

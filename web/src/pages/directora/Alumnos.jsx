import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, QrCode, FileText, ChevronDown, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import { SemaforoDocumentacion } from '@/components/ui/Semaforo';
import { SkeletonList } from '@/components/ui/SkeletonCard';

// ─── Página principal ────────────────────────────────────────────────────────

export default function DirectoraAlumnos() {
  const [buscar, setBuscar] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('inscrito');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['alumnos', buscar, grupoFiltro, estadoFiltro],
    queryFn: () => api.get('/alumnos', {
      params: { buscar, grupo_id: grupoFiltro || undefined, estado: estadoFiltro || undefined },
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const abrirCrear = () => { setAlumnoEditar(null); setModalAbierto(true); };
  const abrirEditar = (alumno) => { setAlumnoEditar(alumno); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setAlumnoEditar(null); };

  const alumnos = data?.alumnos || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Alumnos 👧</h1>
          <p className="text-gray-500 font-semibold mt-1">
            {total} alumno{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Nuevo alumno
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-52">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            className="input-hs pl-11 w-full"
          />
          {buscar && (
            <button onClick={() => setBuscar('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtro grupo */}
        <div className="relative">
          <select
            value={grupoFiltro}
            onChange={e => setGrupoFiltro(e.target.value)}
            className="input-hs pr-10 appearance-none cursor-pointer"
          >
            <option value="">Todos los grupos</option>
            {grupos.map(g => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtro estado */}
        <div className="relative">
          <select
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value)}
            className="input-hs pr-10 appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="inscrito">Inscritos</option>
            <option value="reinscrito">Reinscritos</option>
            <option value="baja">Bajas</option>
            <option value="egresado">Egresados</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Lista de alumnos */}
      {isLoading ? (
        <SkeletonList count={6} />
      ) : alumnos.length === 0 ? (
        <div className="card-hs text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-black text-gray-600">No se encontraron alumnos</p>
          <p className="text-gray-400 font-semibold mt-2">Intenta con otro filtro o agrega un alumno nuevo</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {alumnos.map(alumno => (
            <TarjetaAlumno
              key={alumno.id}
              alumno={alumno}
              onEditar={() => abrirEditar(alumno)}
            />
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      {modalAbierto && (
        <ModalAlumno
          alumno={alumnoEditar}
          grupos={grupos}
          onCerrar={cerrarModal}
        />
      )}
    </div>
  );
}

// ─── Tarjeta de alumno ────────────────────────────────────────────────────────

function TarjetaAlumno({ alumno, onEditar }) {
  const queryClient = useQueryClient();

  const descargarQR = async () => {
    if (!alumno.qr_code_url) {
      toast.error('Este alumno no tiene QR generado aún');
      return;
    }
    window.open(alumno.qr_code_url, '_blank');
  };

  const regenerarQR = useMutation({
    mutationFn: () => api.post(`/alumnos/${alumno.id}/regenerar-qr`),
    onSuccess: () => {
      toast.success('QR regenerado correctamente');
      queryClient.invalidateQueries(['alumnos']);
    },
    onError: () => toast.error('Error al regenerar el QR'),
  });

  const estadoBadge = {
    inscrito:   { cls: 'bg-green-100 text-green-700',  label: 'Inscrito' },
    reinscrito: { cls: 'bg-blue-100 text-blue-700',    label: 'Reinscrito' },
    baja:       { cls: 'bg-red-100 text-red-700',      label: 'Baja' },
    egresado:   { cls: 'bg-gray-100 text-gray-600',    label: 'Egresado' },
  }[alumno.estado] || { cls: 'bg-gray-100 text-gray-600', label: alumno.estado };

  // Calcular edad
  const edad = alumno.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(alumno.fecha_nacimiento)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="card-hs flex items-center gap-4 hover:shadow-hs-lg transition-shadow duration-200 group">
      {/* Foto */}
      <AvatarAlumno alumno={alumno} size="md" />

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-gray-800 text-lg leading-tight">
            {alumno.nombre_completo}
          </h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${estadoBadge.cls}`}>
            {estadoBadge.label}
          </span>
          {alumno.usa_panial && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              🍼 Pañal
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {alumno.grupo_nombre && (
            <span className="text-sm font-bold" style={{ color: alumno.color_hex || '#805AD5' }}>
              {alumno.grupo_nombre}
            </span>
          )}
          {edad !== null && (
            <span className="text-sm text-gray-400 font-semibold">{edad} años</span>
          )}
          {alumno.alergias && (
            <span className="text-xs font-bold text-red-500">⚠️ {alumno.alergias}</span>
          )}
        </div>
      </div>

      {/* Documentación */}
      <div className="hidden sm:block">
        <SemaforoDocumentacion completa={alumno.documentacion === 'completa'} />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={descargarQR}
          title="Ver QR"
          className="p-2 rounded-xl hover:bg-hs-purple/10 text-hs-purple transition-colors"
        >
          <QrCode size={18} />
        </button>
        <button
          onClick={onEditar}
          title="Editar alumno"
          className="p-2 rounded-xl hover:bg-hs-yellow/20 text-hs-yellow-dark transition-colors"
        >
          <FileText size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Modal crear / editar alumno ─────────────────────────────────────────────

function ModalAlumno({ alumno, grupos, onCerrar }) {
  const queryClient = useQueryClient();
  const esEdicion = !!alumno;

  const [form, setForm] = useState({
    nombre_completo:       alumno?.nombre_completo       || '',
    fecha_nacimiento:      alumno?.fecha_nacimiento?.split('T')[0] || '',
    curp:                  alumno?.curp                  || '',
    grupo_id:              alumno?.grupo_id              || '',
    usa_panial:            alumno?.usa_panial            || false,
    alergias:              alumno?.alergias              || '',
    condiciones_especiales: alumno?.condiciones_especiales || '',
    tipo_sangre:           alumno?.tipo_sangre           || '',
    medico_nombre:         alumno?.medico_nombre         || '',
    medico_telefono:       alumno?.medico_telefono       || '',
    notas:                 alumno?.notas                 || '',
  });

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(alumno?.foto_url || null);

  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const guardar = useMutation({
    mutationFn: async () => {
      let resultado;
      if (esEdicion) {
        resultado = await api.put(`/alumnos/${alumno.id}`, form);
      } else {
        resultado = await api.post('/alumnos', form);
      }
      // Si hay foto nueva, subirla
      if (fotoFile) {
        const fd = new FormData();
        fd.append('foto', fotoFile);
        await api.post(`/alumnos/${resultado.data.id}/foto`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return resultado.data;
    },
    onSuccess: () => {
      toast.success(esEdicion ? 'Alumno actualizado ✅' : 'Alumno creado ✅');
      queryClient.invalidateQueries(['alumnos']);
      onCerrar();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Error al guardar');
    },
  });

  const onFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-xl font-black text-gray-800">
            {esEdicion ? '✏️ Editar alumno' : '➕ Nuevo alumno'}
          </h2>
          <button onClick={onCerrar} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto" className="w-24 h-24 rounded-2xl object-cover border-4 border-hs-purple/20" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-hs-purple/10 flex items-center justify-center border-4 border-dashed border-hs-purple/30">
                  <span className="text-3xl">👧</span>
                </div>
              )}
            </div>
            <div>
              <label className="btn-outline flex items-center gap-2 cursor-pointer text-sm">
                <Upload size={16} /> Subir foto
                <input type="file" accept="image/*" className="hidden" onChange={onFotoChange} />
              </label>
              <p className="text-xs text-gray-400 font-semibold mt-2">JPG o PNG, máx. 5MB</p>
            </div>
          </div>

          {/* Datos principales */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-black text-gray-500 uppercase tracking-wide">Datos del alumno</legend>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre completo *</label>
              <input
                className="input-hs"
                placeholder="Nombre completo del alumno"
                value={form.nombre_completo}
                onChange={e => set('nombre_completo', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de nacimiento *</label>
                <input
                  type="date"
                  className="input-hs"
                  value={form.fecha_nacimiento}
                  onChange={e => set('fecha_nacimiento', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Grupo *</label>
                <div className="relative">
                  <select
                    className="input-hs appearance-none pr-10 w-full cursor-pointer"
                    value={form.grupo_id}
                    onChange={e => set('grupo_id', e.target.value)}
                  >
                    <option value="">Seleccionar grupo</option>
                    {grupos.map(g => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">CURP</label>
                <input
                  className="input-hs uppercase"
                  placeholder="CURP del alumno"
                  maxLength={18}
                  value={form.curp}
                  onChange={e => set('curp', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de sangre</label>
                <div className="relative">
                  <select
                    className="input-hs appearance-none pr-10 w-full cursor-pointer"
                    value={form.tipo_sangre}
                    onChange={e => set('tipo_sangre', e.target.value)}
                  >
                    <option value="">No sé / No especifica</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ¿Usa pañal? */}
            <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-hs-yellow/50 cursor-pointer transition-colors">
              <div className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${form.usa_panial ? 'bg-hs-yellow' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.usa_panial ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <div>
                <p className="font-bold text-gray-800">🍼 Usa pañal</p>
                <p className="text-xs text-gray-400 font-semibold">Activa el registro de pañal en la bitácora (Maternal)</p>
              </div>
              <input type="checkbox" className="hidden" checked={form.usa_panial} onChange={e => set('usa_panial', e.target.checked)} />
            </label>
          </fieldset>

          {/* Salud */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-black text-gray-500 uppercase tracking-wide">Salud</legend>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">⚠️ Alergias</label>
              <input
                className="input-hs"
                placeholder="Ej: mariscos, cacahuates, lácteos..."
                value={form.alergias}
                onChange={e => set('alergias', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Condiciones especiales</label>
              <textarea
                className="input-hs resize-none"
                rows={2}
                placeholder="Ej: asma, diabetes, necesidades especiales..."
                value={form.condiciones_especiales}
                onChange={e => set('condiciones_especiales', e.target.value)}
              />
            </div>
          </fieldset>

          {/* Médico de emergencia */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-black text-gray-500 uppercase tracking-wide">Médico de emergencia</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del médico</label>
                <input
                  className="input-hs"
                  placeholder="Dr. / Dra."
                  value={form.medico_nombre}
                  onChange={e => set('medico_nombre', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  className="input-hs"
                  placeholder="55 0000 0000"
                  value={form.medico_telefono}
                  onChange={e => set('medico_telefono', e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Notas */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Notas adicionales</label>
            <textarea
              className="input-hs resize-none"
              rows={3}
              placeholder="Cualquier información relevante..."
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
            />
          </div>
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-3xl">
          <button onClick={onCerrar} className="btn-outline flex-1">
            Cancelar
          </button>
          <button
            onClick={() => guardar.mutate()}
            disabled={guardar.isPending || !form.nombre_completo || !form.fecha_nacimiento || !form.grupo_id}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardar.isPending ? 'Guardando...' : esEdicion ? '💾 Guardar cambios' : '✅ Crear alumno'}
          </button>
        </div>
      </div>
    </div>
  );
}

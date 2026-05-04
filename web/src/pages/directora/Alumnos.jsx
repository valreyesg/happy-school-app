import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, QrCode, FileText, ChevronDown, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import { SemaforoDocumentacion } from '@/components/ui/Semaforo';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import SelectorCiclo from '@/components/ui/SelectorCiclo';
import { useCatalogo } from '@/hooks/useCatalogo';

// Paleta de colores para los niveles — se asigna por posición de aparición
const PALETA_NIVELES = [
  { bg: 'bg-pink-100',   text: 'text-pink-700',   ring: 'ring-pink-300' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-300' },
  { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-300' },
  { bg: 'bg-blue-100',   text: 'text-hs-blue-dark',   ring: 'ring-hs-blue/30' },
  { bg: 'bg-hs-purple/20', text: 'text-hs-purple-dark', ring: 'ring-purple-300' },
];

// ─── Página principal ────────────────────────────────────────────────────────

export default function DirectoraAlumnos() {
  const [buscar, setBuscar] = useState('');
  const [nivelFiltro, setNivelFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('inscrito');
  const [cicloId, setCicloId] = useState(null); // null = ciclo activo

  const { items: ESTADOS_ALUMNO } = useCatalogo('estados-alumno');

  const handleCicloChange = (id) => {
    setCicloId(id);
    setNivelFiltro('');
    if (id !== null) setEstadoFiltro(''); // ciclo histórico: mostrar todos los estados
    else setEstadoFiltro('inscrito');
  };
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState(null);

  const esHistorico = cicloId !== null;

  const { data, isLoading } = useQuery({
    queryKey: ['alumnos', buscar, estadoFiltro, cicloId],
    queryFn: () => api.get('/alumnos', {
      params: { buscar, estado: estadoFiltro || undefined, ...(cicloId && { ciclo_id: cicloId }) },
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: ciclos = [] } = useQuery({
    queryKey: ['ciclos'],
    queryFn: () => api.get('/ciclos').then(r => r.data),
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos', cicloId],
    queryFn: () => api.get('/grupos', { params: { ...(cicloId && { ciclo_id: cicloId }) } }).then(r => r.data),
  });

  const abrirCrear = () => { setAlumnoEditar(null); setModalAbierto(true); };
  const abrirEditar = async (alumno) => {
    // Cargar datos completos del alumno
    try {
      const res = await api.get(`/alumnos/${alumno.id}`);
      setAlumnoEditar(res.data);
      setModalAbierto(true);
    } catch (err) {
      toast.error('Error al cargar datos del alumno');
    }
  };
  const cerrarModal = () => { setModalAbierto(false); setAlumnoEditar(null); };

  const alumnos = data?.alumnos || [];
  const total = data?.total || 0;

  // Niveles únicos en orden de aparición (vienen del backend, sin hardcodear)
  const nivelesUnicos = useMemo(() => {
    const vistos = new Set();
    return grupos
      .map(g => g.nivel)
      .filter(n => n && !vistos.has(n) && vistos.add(n));
  }, [grupos]);

  // Filtrar por nivel — campo `nivel` viene de la query SQL (g.nivel)
  const alumnosFiltrados = useMemo(() => {
    if (!nivelFiltro) return alumnos;
    return alumnos.filter(a => a.nivel === nivelFiltro);
  }, [alumnos, nivelFiltro]);

  return (
    <div className="space-y-6 animate-fade-in">

      {esHistorico && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <span className="text-lg">📚</span>
          <div>
            <p className="font-semibold text-amber-900">Modo solo lectura</p>
            <p className="text-sm text-amber-800">Estás viendo datos históricos. Los botones de crear y editar están deshabilitados.</p>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Alumnos 👧🏻</h1>
          <p className="text-gray-500 font-semibold mt-1">
            {total} alumno{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <SelectorCiclo value={cicloId} onChange={handleCicloChange} />
          <button onClick={abrirCrear} className="btn-primary flex items-center gap-2" disabled={esHistorico} title={esHistorico ? 'No puedes crear alumnos en ciclos históricos' : ''}>
            <Plus size={20} /> Nuevo alumno
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative flex-1 min-w-52 max-w-md">
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

      {/* Tabs de nivel */}
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

      {/* Filtro estado */}
      <div className="relative max-w-xs">
        <select
          value={estadoFiltro}
          onChange={e => setEstadoFiltro(e.target.value)}
          className="input-hs pr-10 appearance-none cursor-pointer"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_ALUMNO.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Lista de alumnos */}
      {isLoading ? (
        <SkeletonList count={6} />
      ) : alumnosFiltrados.length === 0 ? (
        <div className="card-hs text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-black text-gray-600">No se encontraron alumnos</p>
          <p className="text-gray-400 font-semibold mt-2">Intenta con otro filtro o agrega un alumno nuevo</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {alumnosFiltrados.map(alumno => (
            <TarjetaAlumno
              key={alumno.id}
              alumno={alumno}
              onEditar={() => abrirEditar(alumno)}
              soloLectura={esHistorico}
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

// ─── Modal QR ─────────────────────────────────────────────────────────────────

function ModalQR({ alumno, onCerrar, regenerarMutation }) {
  const [qrUrl, setQrUrl] = useState(alumno.qr_code_url);
  const [descargando, setDescargando] = useState(false);

  const handleRegenerar = () => {
    regenerarMutation.mutate(undefined, {
      onSuccess: (res) => {
        setQrUrl(res.qr_code_url || alumno.qr_code_url);
      },
    });
  };

  const handleDescargar = async () => {
    if (!qrUrl) return;
    try {
      setDescargando(true);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${alumno.nombre_completo.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR descargado ✅');
    } catch (err) {
      toast.error('Error al descargar el QR');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Modal open={true} onClose={onCerrar} title="QR de acceso" size="sm">
      <p className="font-bold text-gray-700 mb-4 text-center">{alumno.nombre_completo}</p>

      {qrUrl ? (
        <>
          <img
            src={qrUrl}
            alt="QR del alumno"
            className="w-56 h-56 mx-auto rounded-2xl border-4 border-hs-purple/20 object-contain"
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleDescargar}
              disabled={descargando}
              className="flex-1 px-4 py-2 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {descargando ? 'Descargando...' : '⬇️ Descargar'}
            </button>
            <button
              onClick={handleRegenerar}
              disabled={regenerarMutation.isPending}
              className="flex-1 px-4 py-2 rounded-2xl border-2 border-amber-200 text-amber-600 font-bold text-sm hover:bg-amber-50 disabled:opacity-50 transition-colors"
            >
              {regenerarMutation.isPending ? 'Generando...' : '🔄 Regenerar'}
            </button>
          </div>
        </>
      ) : (
        <div className="py-8 text-center">
          <div className="text-5xl mb-4">📱</div>
          <p className="text-sm text-gray-500 font-semibold mb-4">
            Este alumno no tiene QR generado todavía.
          </p>
          <button
            onClick={handleRegenerar}
            disabled={regenerarMutation.isPending}
            className="w-full px-4 py-3 rounded-2xl bg-hs-purple text-white font-bold text-sm hover:bg-hs-purple-dark disabled:opacity-50 transition-colors"
          >
            {regenerarMutation.isPending ? 'Generando...' : '✨ Generar QR'}
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── Tarjeta de alumno ────────────────────────────────────────────────────────

function TarjetaAlumno({ alumno, onEditar, soloLectura }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mostrarQR, setMostrarQR] = useState(false);

  const regenerarQR = useMutation({
    mutationFn: () => api.post(`/alumnos/${alumno.id}/regenerar-qr`),
    onSuccess: (res) => {
      toast.success('QR regenerado correctamente');
      queryClient.invalidateQueries(['alumnos']);
    },
    onError: () => toast.error('Error al regenerar el QR'),
  });

  const estadoBadge = {
    inscrito:   { cls: 'bg-green-100 text-green-700',  label: 'Inscrito' },
    reinscrito: { cls: 'bg-blue-100 text-hs-blue-dark',    label: 'Reinscrito' },
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
          {alumno.total_hermanos > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-hs-blue-dark">
              👨‍👩‍👧 {alumno.total_hermanos} {alumno.total_hermanos === 1 ? 'hermano' : 'hermanos'}
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`/directora/alumnos/${alumno.id}`)}
          title="Ver perfil completo"
          className="p-2 rounded-xl hover:bg-green-50 text-green-600 transition-colors"
        >
          <FileText size={18} />
        </button>
        {!soloLectura && (
          <>
            <button
              onClick={() => setMostrarQR(true)}
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
              ✏️
            </button>
          </>
        )}

      {mostrarQR && (
        <ModalQR
          alumno={alumno}
          onCerrar={() => setMostrarQR(false)}
          regenerarMutation={regenerarQR}
        />
      )}
      </div>
    </div>
  );
}

// ─── Modal crear / editar alumno ─────────────────────────────────────────────

function ModalAlumno({ alumno, grupos, onCerrar }) {
  const queryClient = useQueryClient();
  const esEdicion = !!alumno;
  const { items: alergiasItems } = useCatalogo('alergias');

  const [form, setForm] = useState({
    nombre_completo: '',
    fecha_nacimiento: '',
    curp: '',
    grupo_id: '',
    usa_panial: false,
    alergias: '',
    condiciones_especiales: '',
    tipo_sangre: '',
    medico_nombre: '',
    medico_telefono: '',
    notas: '',
  });
  const [alergiasSeleccionadas, setAlergiasSeleccionadas] = useState([]);
  const [alergiasOtras, setAlergiasOtras] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  // Sincronizar form cuando cambia el alumno editado
  useEffect(() => {
    if (!alumno) {
      setForm({
        nombre_completo: '',
        fecha_nacimiento: '',
        curp: '',
        grupo_id: '',
        usa_panial: false,
        alergias: '',
        condiciones_especiales: '',
        tipo_sangre: '',
        medico_nombre: '',
        medico_telefono: '',
        notas: '',
      });
      setFotoPreview(null);
      setFotoFile(null);
      setAlergiasSeleccionadas([]);
      setAlergiasOtras('');
    } else {
      setForm({
        nombre_completo: alumno.nombre_completo || '',
        fecha_nacimiento: alumno.fecha_nacimiento ? alumno.fecha_nacimiento.split('T')[0] : '',
        curp: alumno.curp || '',
        grupo_id: alumno.grupo_id || '',
        usa_panial: alumno.usa_panial || false,
        alergias: alumno.alergias || '',
        condiciones_especiales: alumno.condiciones_especiales || '',
        tipo_sangre: alumno.tipo_sangre || '',
        medico_nombre: alumno.medico_nombre || '',
        medico_telefono: alumno.medico_telefono || '',
        notas: alumno.notas || '',
      });
      setFotoPreview(alumno.foto_url || null);
      setFotoFile(null);

      // Inicializar alergias separando catálogo vs otras
      if (alumno.alergias && alergiasItems.length > 0) {
        const alergiasArray = alumno.alergias.split(',').map(a => a.trim()).filter(Boolean);
        const catalogoKeys = alergiasItems.map(a => a.key);
        const enCatalogo = alergiasArray.filter(a => catalogoKeys.includes(a));
        const noEnCatalogo = alergiasArray.filter(a => !catalogoKeys.includes(a));
        setAlergiasSeleccionadas(enCatalogo);
        setAlergiasOtras(noEnCatalogo.join(', '));
      } else if (alumno.alergias && alergiasItems.length === 0) {
        // Si aún no cargó el catálogo, guardar todo como "otras"
        setAlergiasSeleccionadas([]);
        setAlergiasOtras(alumno.alergias);
      } else {
        setAlergiasSeleccionadas([]);
        setAlergiasOtras('');
      }
    }
  }, [alumno?.id, alergiasItems]);

  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const toggleAlergia = (alergia) => {
    setAlergiasSeleccionadas(prev =>
      prev.includes(alergia)
        ? prev.filter(a => a !== alergia)
        : [...prev, alergia]
    );
  };

  const guardar = useMutation({
    mutationFn: async () => {
      if (!form.curp || form.curp.trim() === '') {
        throw new Error('La CURP es obligatoria');
      }
      // Calcular alergias correctamente SIN depender de state updates
      const todas = [...alergiasSeleccionadas, ...(alergiasOtras ? alergiasOtras.split(',').map(a => a.trim()) : [])].filter(Boolean);
      const formConAlergias = {
        ...form,
        alergias: todas.join(', ')
      };
      let resultado;
      if (esEdicion) {
        resultado = await api.put(`/alumnos/${alumno.id}`, formConAlergias);
      } else {
        resultado = await api.post('/alumnos', formConAlergias);
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
      toast.error(err.response?.data?.error || err.message || 'Error al guardar');
    },
  });

  const onFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  return (
    <Modal open={true} onClose={onCerrar} title={esEdicion ? '✏️ Editar alumno' : '➕ Nuevo alumno'} size="xl">
      <div className="space-y-6">

          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto" className="w-24 h-24 rounded-2xl object-cover border-4 border-hs-purple/20" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-hs-purple/10 flex items-center justify-center border-4 border-dashed border-hs-purple/30">
                  <span className="text-3xl">👧🏻</span>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">CURP <span className="text-red-500">*</span></label>
                <input
                  className="input-hs uppercase"
                  placeholder="CURP del alumno"
                  maxLength={18}
                  required
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
              <label className="block text-sm font-bold text-gray-700 mb-3">⚠️ Alergias</label>
              <div className="space-y-2 mb-3">
                {alergiasItems.length === 0 ? (
                  <p className="text-sm text-gray-500">Cargando alergias...</p>
                ) : (
                  alergiasItems.map(allergia => (
                    <label key={allergia.key} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={alergiasSeleccionadas.includes(allergia.key)}
                        onChange={() => toggleAlergia(allergia.key)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{allergia.emoji} {allergia.label}</span>
                    </label>
                  ))
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Otras alergias</label>
                <input
                  className="input-hs text-sm"
                  placeholder="Separadas por comas (Ej: mariscos, cacahuates…)"
                  value={alergiasOtras}
                  onChange={e => setAlergiasOtras(e.target.value)}
                />
              </div>
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
      <div className="flex gap-3 mt-6">
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
    </Modal>
  );
}

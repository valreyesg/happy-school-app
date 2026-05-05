import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Bell, Clock, BookOpen, Pencil, EyeOff, Plus } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import CatalogoEditor from '@/components/directora/CatalogoEditor';
import ModalCategoria from '@/components/directora/ModalCategoria';

const CAMPOS = [
  {
    seccion: '⏰ Horario de entrada',
    color: 'blue',
    campos: [
      { clave: 'hora_inicio_filtro', label: 'Inicio filtro de entrada', tipo: 'time', desc: 'Hora en que abre la puerta' },
      { clave: 'hora_fin_filtro',    label: 'Límite sin retardo',       tipo: 'time', desc: 'Entrada después de esta hora = retardo' },
    ],
  },
  {
    seccion: '🏫 Horario académico y salida',
    color: 'green',
    campos: [
      { clave: 'hora_salida_normal',    label: 'Salida normal',           tipo: 'time', desc: 'Hora de salida regular' },
      { clave: 'hora_salida_extension', label: 'Salida con extensión',    tipo: 'time', desc: 'Máximo con extensión de horario' },
      { clave: 'alerta_minutos_sin_recoger', label: 'Minutos de tolerancia (sin recoger)', tipo: 'number', desc: 'Minutos después de salida para alertar al padre' },
    ],
  },
  {
    seccion: '💰 Reglas de negocio',
    color: 'yellow',
    campos: [
      { clave: 'costo_extension_hora', label: 'Costo extensión/hora ($)',  tipo: 'number', desc: 'Cargo por cada hora de extensión' },
      { clave: 'max_retardos_mes',     label: 'Máx. retardos por mes',     tipo: 'number', desc: 'Al rebasar este límite no entra ese día' },
    ],
  },
  {
    seccion: '📅 Período de pagos',
    color: 'purple',
    campos: [
      { clave: 'dia_inicio_pago', label: 'Día inicio pago sin recargo', tipo: 'number', desc: 'Primer día hábil del período' },
      { clave: 'dia_fin_pago',    label: 'Último día sin recargo',      tipo: 'number', desc: 'Después de este día aplica recargo diario' },
    ],
  },
];

const TIPOS_NOTIFICACION = [
  { tipo: 'entrada_rechazada',    label: 'Entrada rechazada',         icono: '🚫' },
  { tipo: 'salida_anticipada',    label: 'Salida anticipada',         icono: '🚪' },
  { tipo: 'alerta_vomito',        label: 'Alerta de vómito',          icono: '🤢' },
  { tipo: 'alerta_diarrea',       label: 'Alerta de diarrea',         icono: '⚠️' },
  { tipo: 'solicitud_toallitas',  label: 'Solicitud de toallitas',    icono: '🧻' },
  { tipo: 'solicitud_paniales',   label: 'Solicitud de pañales',      icono: '🍼' },
  { tipo: 'incidente',            label: 'Incidente escolar',         icono: '🚨' },
  { tipo: 'aviso_extraordinario', label: 'Aviso extraordinario',      icono: '📢' },
  { tipo: 'bitacora_lista',       label: 'Bitácora del día lista',    icono: '📝' },
  { tipo: 'medicamento',          label: 'Medicamento administrado',   icono: '💊' },
  { tipo: 'tarea_nueva',          label: 'Tarea nueva publicada',     icono: '📚' },
  { tipo: 'tarea_cancelada',      label: 'Tarea cancelada',           icono: '📋' },
];

const COLOR_MAP = {
  blue:   { bg: 'bg-hs-blue/10',   border: 'border-hs-blue/30',   title: 'text-hs-blue-dark'   },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  title: 'text-green-800'  },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-800' },
  purple: { bg: 'bg-hs-purple/10', border: 'border-hs-purple/20', title: 'text-purple-800' },
};

const TABS = [
  { id: 'horarios',       label: 'Horarios y reglas', icon: Clock     },
  { id: 'notificaciones', label: 'Notificaciones',    icon: Bell      },
  { id: 'catalogos',      label: 'Catálogos',         icon: BookOpen  },
];

const CATALOGOS_CONFIG = [
  { tipo: 'animo',              titulo: '😊 Ánimo'                },
  { tipo: 'comportamiento',     titulo: '⭐ Comportamiento'        },
  { tipo: 'cuanto-comio',       titulo: '🍽️ Cuánto comió'         },
  { tipo: 'tiempos-comida',     titulo: '⏱️ Tiempos de comida'    },
  { tipo: 'condiciones-panial', titulo: '🩻 Condiciones de pañal' },
  { tipo: 'vomito-intensidad',  titulo: '🤢 Intensidad de vómito' },
  { tipo: 'tipos-insumo',       titulo: '📦 Tipos de insumo'      },
  { tipo: 'niveles',            titulo: '📚 Niveles'              },
  { tipo: 'alergias',           titulo: '🚫 Alergias'             },
  { tipo: 'parentesco',         titulo: '👨‍👩‍👧 Parentesco'         },
  { tipo: 'tipos-documento',    titulo: '📄 Tipos de documento'   },
  { tipo: 'metodos-pago',       titulo: '💳 Métodos de pago'      },
  { tipo: 'conceptos-pago',     titulo: '💰 Conceptos de pago'    },
];

export default function Configuracion() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('horarios');
  const [valores, setValores] = useState(null);
  const [guardado, setGuardado] = useState(false);
  const [notifActivos, setNotifActivos] = useState(null);
  const [notifGuardado, setNotifGuardado] = useState(false);
  const [configValues, setConfigValues] = useState(null);
  const [configGuardado, setConfigGuardado] = useState(false);

  const { isLoading, data: configData } = useQuery({
    queryKey: ['config-horarios'],
    queryFn: () => api.get('/config/horarios').then(r => r.data),
  });

  const { data: configNotif } = useQuery({
    queryKey: ['config-notificaciones'],
    queryFn: () => api.get('/config/notificaciones').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: configNegocio } = useQuery({
    queryKey: ['config-negocio'],
    queryFn: () => api.get('/config/negocio').then(r => r.data),
    enabled: tab === 'horarios',
  });

  const valoresActivos = valores ?? configData?.horarios ?? {};
  const tiposActivos = notifActivos ?? (configNotif?.notificaciones_modal_tipos || []);

  const mutation = useMutation({
    mutationFn: (data) => api.put('/config/horarios', data),
    onSuccess: () => {
      setValores(null);
      qc.invalidateQueries(['config-horarios']);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    },
  });

  const mutationNotif = useMutation({
    mutationFn: (tipos) => api.put('/config/notificaciones', { notificaciones_modal_tipos: tipos }),
    onSuccess: () => {
      setNotifActivos(null);
      qc.invalidateQueries(['config-notificaciones']);
      setNotifGuardado(true);
      setTimeout(() => setNotifGuardado(false), 3000);
    },
  });

  const mutationConfig = useMutation({
    mutationFn: async (data) => {
      await api.put('/config/negocio', data);
      // Hacer un GET inmediato para refrescar los datos
      return api.get('/config/negocio').then(r => r.data);
    },
    onSuccess: (data) => {
      setConfigValues(null);
      qc.setQueryData(['config-negocio'], data);
      setConfigGuardado(true);
      toast.success('Precios y límites guardados ✅');
      setTimeout(() => setConfigGuardado(false), 3000);
    },
    onError: (err) => {
      toast.error(`Error: ${err.response?.data?.error || 'Intenta de nuevo'}`);
    },
  });

  const valoresConfig = configValues ?? configNegocio ?? {};

  const handleChange = (clave, val) => {
    setValores(prev => ({ ...(prev ?? configData?.horarios ?? {}), [clave]: val }));
  };

  const handleConfigChange = (clave, val) => {
    setConfigValues(prev => ({
      ...(prev ?? configNegocio ?? {}),
      [clave]: val === '' ? null : (isNaN(val) ? val : Number(val)),
    }));
  };

  const handleToggleNotif = (tipo) => {
    const nuevos = tiposActivos.includes(tipo)
      ? tiposActivos.filter(t => t !== tipo)
      : [...tiposActivos, tipo];
    setNotifActivos(nuevos);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-hs-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-in ${tab !== 'catalogos' ? 'max-w-2xl mx-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-hs-purple/20 flex items-center justify-center">
          <Settings size={24} className="text-hs-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Configuración ⚙️</h1>
          <p className="text-sm font-semibold text-gray-500">Ajustes generales de la escuela</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-100">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors ${
              tab === id
                ? 'bg-white border-2 border-b-white border-gray-200 text-hs-purple-dark -mb-[2px]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Horarios */}
      {tab === 'horarios' && (
        <div className="space-y-6">
          {CAMPOS.map(({ seccion, color, campos }) => {
            const c = COLOR_MAP[color];
            return (
              <div key={seccion} className={`rounded-2xl border-2 ${c.bg} ${c.border} p-5 space-y-4`}>
                <h2 className={`font-black text-base ${c.title}`}>{seccion}</h2>
                {campos.map(({ clave, label, tipo, desc }) => (
                  <div key={clave}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
                    <input
                      type={tipo}
                      value={valoresActivos[clave] ?? ''}
                      onChange={e => handleChange(clave, e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-400 bg-white"
                      min={tipo === 'number' ? 0 : undefined}
                    />
                    <p className="text-xs text-gray-400 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Secciones de config negocio */}
          <div className="border-t-2 border-gray-200 pt-6 space-y-4">
            {/* Precios comida */}
            <div className="rounded-2xl border-2 bg-yellow-50 border-yellow-200 p-5 space-y-4">
              <h2 className="font-black text-base text-yellow-800">💰 Precios de comida</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Precio semanal ($)
                  </label>
                  <input
                    type="number"
                    value={valoresConfig.precio_comida_semana ?? ''}
                    onChange={e => handleConfigChange('precio_comida_semana', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-400 bg-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Precio por día ($)
                  </label>
                  <input
                    type="number"
                    value={valoresConfig.precio_comida_dia ?? ''}
                    onChange={e => handleConfigChange('precio_comida_dia', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-400 bg-white"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Semáforo de morosidad */}
            <div className="rounded-2xl border-2 bg-red-50 border-red-200 p-5 space-y-4">
              <h2 className="font-black text-base text-red-800">🚨 Semáforo de morosidad</h2>
              <p className="text-xs text-gray-600">Define en qué días de atraso cambia el nivel de riesgo</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-yellow-700 mb-1">
                    Días amarillo (alerta)
                  </label>
                  <input
                    type="number"
                    value={valoresConfig.semaforo_dias_amarillo ?? ''}
                    onChange={e => handleConfigChange('semaforo_dias_amarillo', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-400 bg-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-red-700 mb-1">
                    Días suspendido (crítico)
                  </label>
                  <input
                    type="number"
                    value={valoresConfig.semaforo_dias_suspendido ?? ''}
                    onChange={e => handleConfigChange('semaforo_dias_suspendido', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-400 bg-white"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Dashboard */}
            <div className="rounded-2xl border-2 bg-hs-blue/10 border-hs-blue/30 p-5 space-y-4">
              <h2 className="font-black text-base text-hs-blue-dark">📊 Dashboard</h2>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Máx. padres morosos a mostrar
                </label>
                <input
                  type="number"
                  value={valoresConfig.max_morosos_dashboard ?? ''}
                  onChange={e => handleConfigChange('max_morosos_dashboard', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-blue/50 bg-white"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">Limitará la lista de padres morosos en la vista principal</p>
              </div>
            </div>

          </div>

          <button
            onClick={() => {
              mutation.mutate(valoresActivos);
              mutationConfig.mutate(valoresConfig);
            }}
            disabled={mutation.isLoading || mutationConfig.isPending}
            className="w-full flex items-center justify-center gap-2 bg-hs-purple hover:bg-hs-purple-dark text-white font-black py-3 rounded-2xl transition-colors disabled:opacity-60"
          >
            <Save size={18} />
            {mutation.isLoading || mutationConfig.isPending ? 'Guardando…' : guardado || configGuardado ? '¡Guardado! ✅' : 'Guardar horarios y reglas'}
          </button>

          {mutation.isError && (
            <p className="text-center text-red-500 text-sm font-semibold">Error al guardar. Intenta de nuevo.</p>
          )}
        </div>
      )}

      {/* Tab: Notificaciones */}
      {tab === 'notificaciones' && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 bg-red-50 border-red-200 p-5 space-y-4">
            <h2 className="font-black text-base text-red-800 flex items-center gap-2">
              <Bell size={18} /> Notificaciones a padres
            </h2>
            <p className="text-xs text-gray-600">
              Los tipos marcados aparecerán como ventana emergente en el portal del papá.
            </p>
            <div className="space-y-3">
              {TIPOS_NOTIFICACION.map(({ tipo, label, icono }) => (
                <div key={tipo} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`notif-${tipo}`}
                    checked={tiposActivos.includes(tipo)}
                    onChange={() => handleToggleNotif(tipo)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <label htmlFor={`notif-${tipo}`} className="flex items-center gap-2 cursor-pointer flex-1">
                    <span className="text-xl">{icono}</span>
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => mutationNotif.mutate(tiposActivos)}
            disabled={mutationNotif.isLoading}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-2xl transition-colors disabled:opacity-60"
          >
            <Save size={18} />
            {mutationNotif.isLoading ? 'Guardando…' : notifGuardado ? '¡Guardado! ✅' : 'Guardar notificaciones'}
          </button>

          {mutationNotif.isError && (
            <p className="text-center text-red-500 text-sm font-semibold">Error al guardar. Intenta de nuevo.</p>
          )}
        </div>
      )}

      {/* Tab: Catálogos */}
      {tab === 'catalogos' && (
        <div className="space-y-4">
          {CATALOGOS_CONFIG.map(({ tipo, titulo }) => (
            <CatalogoTabInline key={tipo} tipo={tipo} titulo={titulo} />
          ))}
          <CategoriasEventoCard />
        </div>
      )}
    </div>
  );
}

function CatalogoTabInline({ tipo, titulo }) {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['catalogo-admin', tipo],
    queryFn: () => api.get(`/catalogos/${tipo}/admin`).then(r => r.data.items),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-3 border-hs-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <CatalogoEditor
      tipo={tipo}
      titulo={titulo}
      items={items}
      onRefresh={() => qc.invalidateQueries({ queryKey: ['catalogo-admin', tipo] })}
    />
  );
}

function CategoriasEventoCard() {
  const qc = useQueryClient();
  const [modalCat, setModalCat] = useState(null); // null | 'nuevo' | categoria

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ['cal-categorias-admin'],
    queryFn: () => api.get('/calendario/categorias/admin').then(r => r.data),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['cal-categorias-admin'] });

  const crearMut = useMutation({
    mutationFn: (body) => api.post('/calendario/categorias', body).then(r => r.data),
    onSuccess: () => { toast.success('Categoría creada'); invalidar(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al crear'),
  });

  const editarMut = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/calendario/categorias/${id}`, body).then(r => r.data),
    onSuccess: () => { toast.success('Categoría actualizada'); invalidar(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al guardar'),
  });

  const inactivarMut = useMutation({
    mutationFn: (id) => api.delete(`/calendario/categorias/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('Categoría desactivada'); invalidar(); },
  });

  const reactivarMut = useMutation({
    mutationFn: (id) => api.put(`/calendario/categorias/${id}`, { activo: true }).then(r => r.data),
    onSuccess: () => { toast.success('Categoría reactivada'); invalidar(); },
  });

  const handleSave = (form) => {
    if (modalCat === 'nuevo') return crearMut.mutateAsync(form);
    return editarMut.mutateAsync({ id: modalCat.id, ...form });
  };

  const activas = cats.filter(c => c.activo);
  const inactivas = cats.filter(c => !c.activo);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-black text-gray-800 text-sm">📅 Categorías de eventos</h3>
          <button
            onClick={() => setModalCat('nuevo')}
            className="flex items-center gap-1.5 text-xs font-bold text-hs-purple hover:bg-hs-purple/20 px-3 py-1.5 rounded-xl transition-all"
          >
            <Plus size={14} />
            Nueva
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-3 border-hs-purple border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activas.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color_hex }} />
                <span className="text-lg w-7 text-center">{cat.icono || '📅'}</span>
                <span className="flex-1 text-sm font-semibold text-gray-700">{cat.nombre}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setModalCat(cat)}
                    className="p-1.5 text-gray-400 hover:text-hs-purple rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => inactivarMut.mutate(cat.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                    title="Desactivar"
                  >
                    <EyeOff size={14} />
                  </button>
                </div>
              </div>
            ))}
            {activas.length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400">No hay categorías activas.</p>
            )}
          </div>
        )}

        {inactivas.length > 0 && (
          <details className="border-t border-gray-100">
            <summary className="px-5 py-2 text-xs text-gray-400 font-semibold cursor-pointer hover:bg-gray-50 select-none">
              {inactivas.length} inactiva(s)
            </summary>
            <div className="divide-y divide-gray-50 bg-gray-50/50">
              {inactivas.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 px-5 py-2.5 opacity-60">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color_hex }} />
                  <span className="text-lg w-7 text-center">{cat.icono || '📅'}</span>
                  <span className="flex-1 text-sm text-gray-500 line-through">{cat.nombre}</span>
                  <button
                    onClick={() => reactivarMut.mutate(cat.id)}
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

      {modalCat && (
        <ModalCategoria
          categoria={modalCat === 'nuevo' ? null : modalCat}
          onClose={() => setModalCat(null)}
          onSave={async (form) => { await handleSave(form); setModalCat(null); }}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// ─── Catálogos ────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'directora',        label: 'Directora' },
  { value: 'administrativo',   label: 'Administrativo' },
  { value: 'maestra_titular',  label: 'Maestra titular' },
  { value: 'maestra_especial', label: 'Maestra especial' },
  { value: 'maestra_puerta',   label: 'Maestra de puerta' },
];

const ROL_COLOR = {
  directora:        'bg-purple-100 text-purple-700',
  administrativo:   'bg-blue-100 text-blue-700',
  maestra_titular:  'bg-green-100 text-green-700',
  maestra_especial: 'bg-yellow-100 text-yellow-700',
  maestra_puerta:   'bg-orange-100 text-orange-700',
};

const ROL_LABEL = {
  directora:        'Directora',
  administrativo:   'Administrativo',
  maestra_titular:  'Titular',
  maestra_especial: 'Especial',
  maestra_puerta:   'Puerta',
};

// ─── Modal crear / editar ─────────────────────────────────────────────────────
function ModalPersonal({ persona, grupos, onClose, onSave }) {
  const esNuevo = !persona;
  const [form, setForm] = useState({
    nombre_completo: persona?.nombre_completo || '',
    email:           persona?.usuario_email   || persona?.email || '',
    telefono:        persona?.telefono        || '',
    rol_principal:   persona?.rol_principal   || 'maestra_titular',
    curp:            persona?.curp            || '',
    rfc:             persona?.rfc             || '',
    fecha_ingreso:   persona?.fecha_ingreso   || '',
    activo:          persona?.activo          ?? true,
    password_inicial: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Asignación de grupo
  const [grupoId, setGrupoId] = useState(persona?.grupos_asignados?.[0]?.grupo_id || '');
  const [esTitular, setEsTitular] = useState(persona?.grupos_asignados?.[0]?.es_titular ?? false);
  const [materia, setMateria] = useState(persona?.grupos_asignados?.[0]?.materia || '');
  const [asignandoGrupo, setAsignandoGrupo] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre_completo.trim() || !form.email.trim()) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const id = await onSave(form);
      // Asignar grupo si se seleccionó y es nuevo
      if (esNuevo && grupoId && id) {
        await api.post(`/personal/${id}/asignar-grupo`, { grupo_id: grupoId, es_titular: esTitular, materia });
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const asignarGrupo = async () => {
    if (!grupoId || !persona?.id) return;
    setAsignandoGrupo(true);
    try {
      await api.post(`/personal/${persona.id}/asignar-grupo`, { grupo_id: grupoId, es_titular: esTitular, materia });
    } finally {
      setAsignandoGrupo(false);
    }
  };

  const quitarGrupo = async (gId) => {
    if (!persona?.id) return;
    await api.delete(`/personal/${persona.id}/asignar-grupo/${gId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800">
            {esNuevo ? '+ Nuevo personal' : `Editar — ${persona.nombre_completo}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Datos personales */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-black text-purple-600 uppercase tracking-wider mb-2">Datos personales</legend>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre completo *</label>
              <input className="input-hs w-full" value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                <input className="input-hs w-full" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="999 000 0000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de ingreso</label>
                <input type="date" className="input-hs w-full" value={form.fecha_ingreso} onChange={e => set('fecha_ingreso', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CURP</label>
                <input className="input-hs w-full uppercase" value={form.curp} onChange={e => set('curp', e.target.value.toUpperCase())} maxLength={18} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RFC</label>
                <input className="input-hs w-full uppercase" value={form.rfc} onChange={e => set('rfc', e.target.value.toUpperCase())} maxLength={13} />
              </div>
            </div>
          </fieldset>

          {/* Cuenta de acceso */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-black text-purple-600 uppercase tracking-wider mb-2">Cuenta de acceso</legend>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
              <input type="email" className="input-hs w-full" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol del sistema *</label>
                <select className="input-hs w-full" value={form.rol_principal} onChange={e => set('rol_principal', e.target.value)}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {esNuevo && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña inicial</label>
                  <input
                    type="text" className="input-hs w-full font-mono text-sm"
                    value={form.password_inicial}
                    onChange={e => set('password_inicial', e.target.value)}
                    placeholder="HappySchool2026!"
                  />
                </div>
              )}
            </div>
          </fieldset>

          {/* Asignación de grupo */}
          {(form.rol_principal === 'maestra_titular' || form.rol_principal === 'maestra_especial') && (
            <fieldset className="space-y-3">
              <legend className="text-xs font-black text-purple-600 uppercase tracking-wider mb-2">Asignación de grupo</legend>

              {/* Grupos actuales (edición) */}
              {!esNuevo && persona?.grupos_asignados?.length > 0 && (
                <div className="space-y-1 mb-2">
                  {persona.grupos_asignados.map(g => (
                    <div key={g.grupo_id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                      <span className="text-sm font-semibold text-green-800">
                        {g.grupo_nombre} {g.es_titular ? '· Titular' : `· ${g.materia || 'Especial'}`}
                      </span>
                      <button type="button" onClick={() => quitarGrupo(g.grupo_id)} className="text-red-400 hover:text-red-600 text-xs font-bold">
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grupo</label>
                  <select className="input-hs w-full" value={grupoId} onChange={e => setGrupoId(e.target.value)}>
                    <option value="">— Sin asignar —</option>
                    {(grupos || []).map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
                {form.rol_principal === 'maestra_especial' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materia</label>
                    <input className="input-hs w-full" value={materia} onChange={e => setMateria(e.target.value)} placeholder="Inglés, Música…" />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="rounded" checked={esTitular} onChange={e => setEsTitular(e.target.checked)} />
                <span className="text-sm font-semibold text-gray-600">Asignar como maestra titular del grupo</span>
              </label>

              {!esNuevo && grupoId && (
                <button
                  type="button"
                  onClick={asignarGrupo}
                  disabled={asignandoGrupo}
                  className="btn-hs btn-hs-ghost text-sm"
                >
                  {asignandoGrupo ? 'Asignando…' : '+ Asignar grupo'}
                </button>
              )}
            </fieldset>
          )}

          {/* Estado (solo edición) */}
          {!esNuevo && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600">Cuenta activa</label>
              <button
                type="button"
                onClick={() => set('activo', !form.activo)}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.activo ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-hs btn-hs-ghost">Cancelar</button>
          <button onClick={submit} disabled={saving} className="btn-hs btn-hs-primary">
            {saving ? 'Guardando…' : esNuevo ? 'Crear cuenta' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de personal ──────────────────────────────────────────────────────
function TarjetaPersonal({ persona, onEdit, onReset }) {
  const rol = persona.rol_principal;
  const grupos = persona.grupos_asignados || [];

  return (
    <div className="card-hs group relative animate-fade-in">
      {/* Estado inactivo */}
      {!persona.activo && (
        <div className="absolute top-3 right-3 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Inactivo
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0 text-xl font-black text-purple-700">
          {persona.nombre_completo.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-gray-800 truncate">{persona.nombre_completo}</h3>
          <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-full mt-1 ${ROL_COLOR[rol] || 'bg-gray-100 text-gray-600'}`}>
            {ROL_LABEL[rol] || rol}
          </span>
        </div>
      </div>

      {/* Contacto */}
      <div className="mt-3 space-y-1 text-sm text-gray-500">
        {persona.usuario_email && (
          <div className="flex items-center gap-2 truncate">
            <span>✉️</span>
            <span className="truncate font-medium">{persona.usuario_email}</span>
          </div>
        )}
        {persona.telefono && (
          <div className="flex items-center gap-2">
            <span>📱</span>
            <span className="font-medium">{persona.telefono}</span>
          </div>
        )}
      </div>

      {/* Grupos */}
      {grupos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {grupos.map((g, i) => (
            <span key={i} className="text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {g.grupo_nombre} {g.es_titular ? '⭐' : ''}
            </span>
          ))}
        </div>
      )}

      {persona.primer_login && (
        <div className="mt-2 text-xs text-amber-600 font-semibold bg-amber-50 rounded-lg px-2 py-1">
          ⚠️ Aún no ha iniciado sesión
        </div>
      )}

      {/* Acciones */}
      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(persona)}
          className="flex-1 btn-hs btn-hs-ghost text-sm py-1.5"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => onReset(persona)}
          className="flex-1 btn-hs btn-hs-ghost text-sm py-1.5 text-amber-600 hover:bg-amber-50"
          title="Restablecer contraseña"
        >
          🔑 Reset pass
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function DirectoraPersonal() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'nuevo' | { ...persona }
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [soloActivos, setSoloActivos] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(null);

  const { data: personal = [], isLoading } = useQuery({
    queryKey: ['personal', soloActivos],
    queryFn: () => api.get('/personal', { params: { activo: soloActivos } }).then(r => r.data),
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos-lista'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const crearMutation = useMutation({
    mutationFn: (body) => api.post('/personal', body).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries(['personal']),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/personal/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries(['personal']),
  });

  const resetMutation = useMutation({
    mutationFn: (id) => api.post(`/personal/${id}/reset-password`),
    onSuccess: () => {
      queryClient.invalidateQueries(['personal']);
      setResetConfirm(null);
    },
  });

  const handleSave = async (form) => {
    if (modal === 'nuevo') {
      const data = await crearMutation.mutateAsync(form);
      return data.personal_id;
    } else {
      await editarMutation.mutateAsync({ id: modal.id, ...form });
      return modal.id;
    }
  };

  // Filtros
  const filtrado = personal.filter(p => {
    const coincide = p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.usuario_email || '').toLowerCase().includes(busqueda.toLowerCase());
    const rolOk = filtroRol === 'todos' || p.rol_principal === filtroRol;
    return coincide && rolOk;
  });

  // Stats
  const totalActivos   = personal.filter(p => p.activo).length;
  const sinGrupo       = personal.filter(p => p.activo && !p.grupos_asignados?.length &&
    ['maestra_titular', 'maestra_especial'].includes(p.rol_principal)).length;
  const primerLogin    = personal.filter(p => p.primer_login).length;

  return (
    <div className="animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Personal 👩‍🏫</h1>
          <p className="text-gray-500 text-sm font-semibold mt-1">
            {filtrado.length} persona{filtrado.length !== 1 ? 's' : ''} · gestiona cuentas, roles y asignaciones
          </p>
        </div>
        <button className="btn-hs btn-hs-primary self-start sm:self-auto" onClick={() => setModal('nuevo')}>
          + Nuevo personal
        </button>
      </div>

      {/* Stats rápidas */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-hs text-center py-4">
            <p className="text-2xl font-black text-green-600">{totalActivos}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Activos</p>
          </div>
          <div className="card-hs text-center py-4">
            <p className={`text-2xl font-black ${sinGrupo > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{sinGrupo}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Sin grupo</p>
          </div>
          <div className="card-hs text-center py-4">
            <p className={`text-2xl font-black ${primerLogin > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{primerLogin}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Sin acceder</p>
          </div>
        </div>
      )}

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="input-hs flex-1"
          placeholder="Buscar por nombre o email…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select className="input-hs sm:w-52" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="todos">Todos los roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer whitespace-nowrap">
          <input type="checkbox" className="rounded" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} />
          Solo activos
        </label>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-hs h-44 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : filtrado.length === 0 ? (
        <div className="card-hs flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">👩‍🏫</div>
          <h3 className="text-xl font-black text-gray-700">No hay personal</h3>
          <p className="text-gray-400 font-semibold mt-2 mb-6">
            {busqueda ? 'Sin resultados para tu búsqueda.' : 'Crea el primer registro de personal.'}
          </p>
          {!busqueda && (
            <button className="btn-hs btn-hs-primary" onClick={() => setModal('nuevo')}>+ Crear personal</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrado.map(p => (
            <TarjetaPersonal
              key={p.id}
              persona={p}
              onEdit={setModal}
              onReset={setResetConfirm}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <ModalPersonal
          persona={modal === 'nuevo' ? null : modal}
          grupos={grupos}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Confirmación reset contraseña */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">🔑</div>
            <h3 className="text-lg font-black text-gray-800 mb-2">¿Restablecer contraseña?</h3>
            <p className="text-sm text-gray-500 font-semibold mb-6">
              Se restablecerá la contraseña de <strong>{resetConfirm.nombre_completo}</strong> a{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">HappySchool2026!</code>.
              La persona deberá cambiarla en su próximo acceso.
            </p>
            <div className="flex gap-3">
              <button className="flex-1 btn-hs btn-hs-ghost" onClick={() => setResetConfirm(null)}>Cancelar</button>
              <button
                className="flex-1 btn-hs btn-hs-primary"
                onClick={() => resetMutation.mutate(resetConfirm.id)}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Restableciendo…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

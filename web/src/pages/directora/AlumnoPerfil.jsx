import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// ─── Catálogos ────────────────────────────────────────────────────────────────
const TIPOS_DOC = [
  { value: 'acta_nacimiento',  label: 'Acta de nacimiento' },
  { value: 'curp',             label: 'CURP' },
  { value: 'cartilla_vacuna',  label: 'Cartilla de vacunación' },
  { value: 'comprobante_dom',  label: 'Comprobante de domicilio' },
  { value: 'foto_3x4',         label: 'Fotografía 3×4' },
  { value: 'ine_tutor',        label: 'INE del tutor' },
  { value: 'contrato',         label: 'Contrato firmado' },
  { value: 'otro',             label: 'Otro' },
];

const DOC_REQUERIDOS = ['acta_nacimiento', 'curp', 'cartilla_vacuna', 'comprobante_dom', 'foto_3x4'];

function edad(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  const nac = new Date(fecha);
  let a = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) a--;
  return a;
}

// ─── Sección colapsable ───────────────────────────────────────────────────────
function Seccion({ titulo, badge, badgeColor = 'bg-gray-100 text-gray-600', children, accion }) {
  const [abierta, setAbierta] = useState(true);
  return (
    <div className="card-hs mb-4">
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setAbierta(a => !a)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-gray-800">{titulo}</h2>
          {badge !== undefined && (
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {accion && <div onClick={e => e.stopPropagation()}>{accion}</div>}
          <span className="text-gray-400 text-sm">{abierta ? '▲' : '▼'}</span>
        </div>
      </button>
      {abierta && <div className="mt-4">{children}</div>}
    </div>
  );
}

// ─── Documentos ───────────────────────────────────────────────────────────────
function SeccionDocumentos({ alumnoId, documentos = [], onSubir, onEliminar, subiendo }) {
  const fileRef = useRef();
  const [tipoSel, setTipoSel] = useState('acta_nacimiento');

  const tiposPresentes = documentos.map(d => d.tipo);
  const faltantes = DOC_REQUERIDOS.filter(t => !tiposPresentes.includes(t)).length;

  const handleFile = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    onSubir(archivo, tipoSel);
    e.target.value = '';
  };

  return (
    <Seccion
      titulo="Documentos"
      badge={faltantes > 0 ? `${faltantes} faltante${faltantes > 1 ? 's' : ''}` : 'Completo ✓'}
      badgeColor={faltantes > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
    >
      {/* Subir nuevo */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          className="input-hs flex-1 min-w-40"
          value={tipoSel}
          onChange={e => setTipoSel(e.target.value)}
        >
          {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button
          className="btn-hs btn-hs-primary"
          onClick={() => fileRef.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? 'Subiendo…' : '+ Subir archivo'}
        </button>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
      </div>

      {/* Lista de documentos */}
      {documentos.length === 0 ? (
        <p className="text-gray-400 text-sm font-semibold text-center py-4">No hay documentos cargados.</p>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc, i) => {
            const tipoLabel = TIPOS_DOC.find(t => t.value === doc.tipo)?.label || doc.tipo;
            const esPDF = doc.url?.includes('.pdf') || doc.nombre_archivo?.endsWith('.pdf');
            return (
              <div key={i} className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{esPDF ? '📄' : '🖼️'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{tipoLabel}</p>
                    <p className="text-xs text-gray-400 truncate">{doc.nombre_archivo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-800 text-xs font-bold">
                    Ver
                  </a>
                  <button
                    onClick={() => onEliminar(doc.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Documentos requeridos faltantes */}
      {faltantes > 0 && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl">
          <p className="text-xs font-bold text-red-600 mb-1">Documentos requeridos faltantes:</p>
          <div className="flex flex-wrap gap-1">
            {DOC_REQUERIDOS.filter(t => !tiposPresentes.includes(t)).map(t => (
              <span key={t} className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {TIPOS_DOC.find(d => d.value === t)?.label || t}
              </span>
            ))}
          </div>
        </div>
      )}
    </Seccion>
  );
}

// ─── Personas autorizadas ─────────────────────────────────────────────────────
function SeccionPersonasAutorizadas({ alumnoId, personas = [], onEliminar }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre_completo: '', parentesco: '', telefono: '' });
  const [foto, setFoto] = useState(null);
  const [ineFrente, setIneFrente] = useState(null);
  const [ineReverso, setIneReverso] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const guardar = async () => {
    setError('');
    if (!form.nombre_completo || !form.parentesco || !form.telefono) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (!foto || !ineFrente || !ineReverso) {
      setError('Foto, INE frente e INE reverso son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nombre_completo', form.nombre_completo);
      fd.append('parentesco', form.parentesco);
      fd.append('telefono', form.telefono);
      fd.append('foto', foto);
      fd.append('ine_frente', ineFrente);
      fd.append('ine_reverso', ineReverso);
      await api.post(`/alumnos/${alumnoId}/personas-autorizadas`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      queryClient.invalidateQueries(['alumno-perfil', alumnoId]);
      setMostrarForm(false);
      setForm({ nombre_completo: '', parentesco: '', telefono: '' });
      setFoto(null); setIneFrente(null); setIneReverso(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const limite = personas.length >= 2;

  return (
    <Seccion
      titulo="Personas autorizadas para recoger"
      badge={`${personas.length}/2`}
      badgeColor={personas.length === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
      accion={!limite && !mostrarForm && (
        <button className="btn-hs btn-hs-primary text-sm py-1" onClick={() => setMostrarForm(true)}>
          + Agregar
        </button>
      )}
    >
      {/* Lista */}
      {personas.length === 0 && !mostrarForm && (
        <p className="text-gray-400 text-sm font-semibold text-center py-4">
          ⚠️ No hay personas autorizadas registradas.
        </p>
      )}
      <div className="space-y-3 mb-3">
        {personas.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            {p.foto_url && (
              <img src={p.foto_url} alt={p.nombre_completo} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 truncate">{p.nombre_completo}</p>
              <p className="text-xs text-gray-500 font-semibold">{p.parentesco} · {p.telefono}</p>
            </div>
            <div className="flex gap-2">
              {p.ine_frente_url && (
                <a href={p.ine_frente_url} target="_blank" rel="noreferrer" className="text-xs text-purple-600 font-bold">INE</a>
              )}
              <button onClick={() => onEliminar(p.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario agregar */}
      {mostrarForm && (
        <div className="border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
          {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre completo *</label>
              <input className="input-hs w-full" value={form.nombre_completo} onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parentesco *</label>
              <input className="input-hs w-full" placeholder="Mamá, Abuelo…" value={form.parentesco} onChange={e => setForm(f => ({ ...f, parentesco: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono *</label>
              <input className="input-hs w-full" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Foto *', key: 'foto', setter: setFoto, val: foto },
              { label: 'INE frente *', key: 'ine_frente', setter: setIneFrente, val: ineFrente },
              { label: 'INE reverso *', key: 'ine_reverso', setter: setIneReverso, val: ineReverso },
            ].map(({ label, key, setter, val }) => (
              <label key={key} className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl p-3 cursor-pointer hover:bg-purple-100 transition-colors">
                <span className="text-xs font-bold text-purple-600 text-center">{val ? '✓ ' + val.name.slice(0, 12) : label}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setter(e.target.files[0])} />
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-hs btn-hs-ghost flex-1" onClick={() => { setMostrarForm(false); setError(''); }}>Cancelar</button>
            <button className="btn-hs btn-hs-primary flex-1" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar persona'}
            </button>
          </div>
        </div>
      )}
    </Seccion>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function DirectoraAlumnoPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: alumno, isLoading } = useQuery({
    queryKey: ['alumno-perfil', id],
    queryFn: () => api.get(`/alumnos/${id}`).then(r => r.data),
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['alumno-docs', id],
    queryFn: () => api.get(`/alumnos/${id}/documentos`).then(r => r.data),
    enabled: !!id,
  });

  const [subiendoDoc, setSubiendoDoc] = useState(false);

  const subirDoc = async (archivo, tipo) => {
    setSubiendoDoc(true);
    try {
      const fd = new FormData();
      fd.append('archivo', archivo);
      fd.append('tipo', tipo);
      await api.post(`/alumnos/${id}/documentos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      queryClient.invalidateQueries(['alumno-docs', id]);
      queryClient.invalidateQueries(['alumno-perfil', id]);
    } finally {
      setSubiendoDoc(false);
    }
  };

  const eliminarDoc = useMutation({
    mutationFn: (docId) => api.delete(`/alumnos/${id}/documentos/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['alumno-docs', id]);
      queryClient.invalidateQueries(['alumno-perfil', id]);
    },
  });

  const eliminarPersona = useMutation({
    mutationFn: (paId) => api.delete(`/alumnos/${id}/personas-autorizadas/${paId}`),
    onSuccess: () => queryClient.invalidateQueries(['alumno-perfil', id]),
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="card-hs h-40 animate-pulse mb-4" />
        <div className="card-hs h-32 animate-pulse mb-4" />
        <div className="card-hs h-32 animate-pulse" />
      </div>
    );
  }

  if (!alumno) return (
    <div className="card-hs text-center py-16">
      <p className="text-2xl font-black text-gray-700">Alumno no encontrado</p>
      <button className="btn-hs btn-hs-primary mt-4" onClick={() => navigate('/directora/alumnos')}>← Regresar</button>
    </div>
  );

  const anios = edad(alumno.fecha_nacimiento);
  const tiposPresentes = documentos.map(d => d.tipo);
  const docsCompletos = DOC_REQUERIDOS.every(t => tiposPresentes.includes(t));

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/directora/alumnos')}
        className="text-purple-600 hover:text-purple-800 text-sm font-bold mb-4 flex items-center gap-1"
      >
        ← Regresar a Alumnos
      </button>

      {/* ── Encabezado del alumno ── */}
      <div className="card-hs mb-4 relative overflow-hidden">
        {alumno.color_hex && (
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: alumno.color_hex }} />
        )}
        <div className="flex items-start gap-5 mt-1">
          {/* Foto */}
          <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-3xl font-black text-purple-700 overflow-hidden">
            {alumno.foto_url
              ? <img src={alumno.foto_url} alt={alumno.nombre_completo} className="w-full h-full object-cover" />
              : alumno.nombre_completo.charAt(0)
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-gray-800">{alumno.nombre_completo}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {alumno.grupo_nombre && (
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {alumno.grupo_nombre}
                    </span>
                  )}
                  {anios !== null && (
                    <span className="text-xs font-bold text-gray-500">{anios} años</span>
                  )}
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${docsCompletos ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {docsCompletos ? '✓ Documentación completa' : '⚠ Documentación incompleta'}
                  </span>
                </div>
              </div>
              {alumno.qr_url && (
                <img src={alumno.qr_url} alt="QR" className="w-16 h-16 rounded-xl border border-gray-100" />
              )}
            </div>

            {/* Datos médicos */}
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {alumno.tipo_sangre && (
                <span className="font-bold text-red-600">🩸 {alumno.tipo_sangre}</span>
              )}
              {alumno.alergias && (
                <span className="font-bold text-amber-600">⚠️ Alergias: {alumno.alergias}</span>
              )}
              {alumno.condiciones_especiales && (
                <span className="font-semibold text-blue-600">ℹ️ {alumno.condiciones_especiales}</span>
              )}
              {alumno.usa_panial && (
                <span className="font-bold text-pink-500">👶 Usa pañal</span>
              )}
            </div>

            {/* Médico */}
            {alumno.medico_nombre && (
              <p className="mt-2 text-xs text-gray-500 font-semibold">
                👨‍⚕️ {alumno.medico_nombre}{alumno.medico_telefono ? ` · ${alumno.medico_telefono}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Padres / Tutores ── */}
      <Seccion titulo="Padres / Tutores" badge={alumno.padres?.length || 0}>
        {(!alumno.padres || alumno.padres.length === 0) ? (
          <p className="text-gray-400 text-sm font-semibold text-center py-2">Sin tutores registrados.</p>
        ) : (
          <div className="space-y-3">
            {alumno.padres.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black flex-shrink-0">
                  {p.nombre_completo.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">
                    {p.nombre_completo}
                    {p.es_tutor_principal && <span className="ml-2 text-xs bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full">Tutor principal</span>}
                  </p>
                  <p className="text-xs text-gray-500 font-semibold">
                    {p.email}{p.telefono ? ` · ${p.telefono}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      {/* ── Personas autorizadas ── */}
      <SeccionPersonasAutorizadas
        alumnoId={id}
        personas={alumno.personasAutorizadas || []}
        onEliminar={(paId) => eliminarPersona.mutate(paId)}
      />

      {/* ── Documentos ── */}
      <SeccionDocumentos
        alumnoId={id}
        documentos={documentos}
        onSubir={subirDoc}
        onEliminar={(docId) => eliminarDoc.mutate(docId)}
        subiendo={subiendoDoc}
      />

      {/* ── Notas ── */}
      {alumno.notas && (
        <Seccion titulo="Notas internas">
          <p className="text-sm text-gray-600 leading-relaxed">{alumno.notas}</p>
        </Seccion>
      )}

      {/* ── Info del ciclo ── */}
      <div className="text-center text-xs text-gray-400 font-semibold mt-2 pb-4">
        Ciclo: {alumno.ciclo_nombre || 'Sin ciclo asignado'}
        {alumno.fecha_nacimiento && ` · Nacimiento: ${new Date(alumno.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-MX')}`}
        {alumno.curp && ` · CURP: ${alumno.curp}`}
      </div>
    </div>
  );
}

import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { useCatalogo } from '@/hooks/useCatalogo';
import { toMap } from '@/utils/catalogos';

// ─── Catálogos ────────────────────────────────────────────────────────────────
const TIPOS_DOC = [
  { value: 'acta_nacimiento',    label: 'Acta de nacimiento' },
  { value: 'curp',               label: 'CURP' },
  { value: 'cartilla_vacunacion', label: 'Cartilla de vacunación' },
  { value: 'comprobante_dom',    label: 'Comprobante de domicilio' },
  { value: 'foto_escolar',       label: 'Fotografía 3×4' },
  { value: 'ine_tutor',          label: 'INE del tutor' },
  { value: 'contrato',           label: 'Contrato firmado' },
  { value: 'otro',               label: 'Otro' },
];

const DOC_REQUERIDOS = ['acta_nacimiento', 'curp', 'cartilla_vacunacion', 'comprobante_dom', 'foto_escolar'];

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

function FilaBit({ label, valor }) {
  if (!valor && valor !== 0 && valor !== false) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider min-w-24">{label}</span>
      <span className="text-sm font-semibold text-gray-700 text-right">{String(valor)}</span>
    </div>
  );
}

function BitacoraDirectora({ alumnoId, usaPanial }) {
  const hoy = new Date().toLocaleDateString('en-CA');
  const ultimoDiaHabil = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  };
  const [fecha, setFecha] = useState(ultimoDiaHabil);

  const irDia = (delta) => {
    const d = new Date(fecha + 'T12:00:00');
    do { d.setDate(d.getDate() + delta); } while (d.getDay() === 0 || d.getDay() === 6);
    const nueva = d.toLocaleDateString('en-CA');
    if (nueva <= hoy) setFecha(nueva);
  };

  // Catálogos para la bitácora
  const { items: animoItems }     = useCatalogo('animo');
  const { items: compItems }      = useCatalogo('comportamiento');
  const { items: cuantoItems }    = useCatalogo('cuanto-comio');
  const { items: panialItems }    = useCatalogo('condiciones-panial');

  const ANIMO_MAP  = useMemo(() => toMap(animoItems), [animoItems]);
  const COMP_MAP   = useMemo(() => toMap(compItems), [compItems]);
  const CUANTO_MAP = useMemo(() => toMap(cuantoItems), [cuantoItems]);
  const PANIAL_MAP = useMemo(() => toMap(panialItems), [panialItems]);

  const { data: historialExt = [] } = useQuery({
    queryKey: ['historial-servicios', alumnoId],
    queryFn: () => api.get(`/alumnos/${alumnoId}/historial-servicios`).then(r => r.data),
    staleTime: 60000,
  });
  const tuvExtensionEnFecha = (() => {
    const [anioF, mesF] = fecha.split('-').map(Number);
    return historialExt.some(h => {
      if (h.tipo_servicio !== 'extension' || h.accion !== 'alta') return false;
      const mIni = parseInt(h.mes_inicio), aIni = parseInt(h.anio_inicio);
      const mFin = h.mes_fin ? parseInt(h.mes_fin) : mIni;
      const aFin = h.anio_fin ? parseInt(h.anio_fin) : aIni;
      return (aIni < anioF || (aIni === anioF && mIni <= mesF)) &&
             (aFin > anioF || (aFin === anioF && mFin >= mesF));
    });
  })();

  const { data, isLoading } = useQuery({
    queryKey: ['bitacora-dir', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
    enabled: !!alumnoId,
  });

  const labelFecha = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const b     = data?.bitacora;
  const comidas = data?.comida || [];
  const ban   = data?.banio;
  const esf   = data?.esfinteres;

  return (
    <div className="space-y-4">
      {/* Selector de fecha */}
      <div className="card-hs flex items-center gap-3">
        <button onClick={() => irDia(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-hs-purple/10 hover:bg-hs-purple/20 text-hs-purple transition-all flex-shrink-0">
          <ChevronLeft size={18} />
        </button>
        <p className="flex-1 text-sm font-bold text-gray-700 capitalize text-center">{labelFecha}</p>
        <button onClick={() => irDia(1)} disabled={fecha >= hoy}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-hs-purple/10 hover:bg-hs-purple/20 text-hs-purple transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="card-hs text-center py-10 text-gray-400 font-bold animate-pulse">Cargando…</div>
      ) : !b ? (
        <div className="card-hs text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-black text-gray-500">Sin bitácora registrada este día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Estado general */}
          <div className="card-hs space-y-1">
            <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">Estado general</h3>
            <FilaBit label="Ánimo"         valor={ANIMO_MAP[b.estado_animo]?.label ?? b.estado_animo} />
            <FilaBit label="Comportamiento" valor={COMP_MAP[b.comportamiento]?.label ?? b.comportamiento} />
            {b.comportamiento_notas && <FilaBit label="Nota conducta" valor={b.comportamiento_notas} />}
          </div>

          {/* Actividades */}
          {data?.actividades && data.actividades.length > 0 && (
            <div className="card-hs">
              <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">🎨 Actividades</h3>
              <div className="space-y-2">
                {data.actividades.map((act, i) => (
                  <div key={i} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                    {act.foto_url && (
                      <a href={act.foto_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                        <img src={act.foto_url} alt="" className="w-14 h-14 object-cover rounded-lg border border-purple-100 hover:border-purple-400 transition-all" />
                      </a>
                    )}
                    <div className="flex-1 min-w-0">
                      {act.descripcion && (
                        <p className="text-sm font-semibold text-gray-700">{act.descripcion}</p>
                      )}
                      {act.participo !== null && act.participo !== undefined && (
                        <span className={`text-xs font-bold mt-1 inline-block ${
                          act.participo ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {act.participo ? '✅ Participó' : '❌ No participó'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alimentación — 4 Tiempos */}
          {comidas.length > 0 && (
            <div className="card-hs space-y-2">
              <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">🍽️ Alimentación</h3>
              {[...comidas].filter(c => c.tiempo !== 'comida_extra' || tuvExtensionEnFecha).sort((a, b) =>
                ['desayuno','colacion','comida','comida_extra'].indexOf(a.tiempo) -
                ['desayuno','colacion','comida','comida_extra'].indexOf(b.tiempo)
              ).map((c, i) => (
                <div key={i} className="border-l-4 border-hs-purple pl-3 py-1">
                  <p className="text-xs font-black text-hs-purple mb-1">
                    {{desayuno:'🥐 Desayuno', colacion:'🍎 Colación', comida:'🍽️ Comida', comida_extra:'🍜 Comida Extra'}[c.tiempo]}
                  </p>
                  <FilaBit label="¿Cuánto?" valor={CUANTO_MAP[c.cuanto_comio]?.label ?? c.cuanto_comio} />
                  {c.que_comio && <FilaBit label="¿Qué?" valor={c.que_comio} />}
                  {c.observaciones && <FilaBit label="Nota" valor={c.observaciones} />}
                </div>
              ))}
            </div>
          )}

          {/* Baño / Pañal */}
          {usaPanial ? (
            data?.panial?.length > 0 && (
              <div className="card-hs">
                <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">👶🏻 Cambios de pañal</h3>
                <div className="space-y-1">
                  {data.panial.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-xs font-bold text-purple-600 min-w-14">
                        {new Date(p.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">{PANIAL_MAP[p.condicion]?.label ?? p.condicion}</span>
                      {p.tiene_irritacion && <span className="text-xs text-orange-500 font-bold">⚠️ irritación</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : ban && (
            <div className="card-hs space-y-1">
              <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">🚿 Baño</h3>
              <FilaBit label="Pipí" valor={ban.pipi_count ?? 0} />
              <FilaBit label="Popó" valor={ban.popo_count ?? 0} />
            </div>
          )}

          {/* Esfínteres */}
          {esf && (
            <div className="card-hs space-y-1">
              <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">🚽 Control de esfínteres</h3>
              <FilaBit label="Fue solo/a"    valor={esf.fue_solo === true ? 'Sí' : esf.fue_solo === false ? 'No' : null} />
              <FilaBit label="Pidió ir"      valor={esf.pidio_ir === true ? 'Sí' : esf.pidio_ir === false ? 'No' : null} />
              <FilaBit label="Tuvo accidente" valor={esf.tuvo_accidente === true ? 'Sí' : esf.tuvo_accidente === false ? 'No' : null} />
              {esf.descripcion_accidente && <FilaBit label="Descripción" valor={esf.descripcion_accidente} />}
              <FilaBit label="Necesitó ayuda" valor={esf.necesito_ayuda === true ? 'Sí' : esf.necesito_ayuda === false ? 'No' : null} />
              {esf.notas_progreso && <FilaBit label="Notas progreso" valor={esf.notas_progreso} />}
            </div>
          )}

          {/* Salud */}
          {(b.tuvo_fiebre || b.se_enfermo || b.notas) && (
            <div className="card-hs space-y-1">
              <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">🌡️ Salud y notas</h3>
              <FilaBit label="Tuvo fiebre"    valor={b.tuvo_fiebre ? `🌡️ Sí${b.temperatura_dia ? ` (${b.temperatura_dia}°C)` : ''}` : null} />
              <FilaBit label="Se enfermó"     valor={b.se_enfermo ? '⚠️ Sí' : null} />
              {b.descripcion_enfermedad && <FilaBit label="Descripción" valor={b.descripcion_enfermedad} />}
              <FilaBit label="Notas"          valor={b.notas} />
            </div>
          )}

          {/* Medicamentos */}
          {data?.medicamentos?.length > 0 && (
            <div className="card-hs">
              <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">💊 Medicamentos</h3>
              {data.medicamentos.map((m, i) => (
                <div key={i} className="py-1.5 border-b border-gray-100 last:border-0 text-sm font-semibold text-gray-700">
                  {m.nombre} — {m.dosis}
                  {m.hora_administracion && (
                    <span className="text-gray-400 ml-2">
                      {new Date(m.hora_administracion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Incidentes */}
          {data?.incidentes?.length > 0 && (
            <div className="card-hs">
              <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-3">⚠️ Incidentes</h3>
              <div className="space-y-3">
                {data.incidentes.map((inc, i) => (
                  <div key={i} className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3 space-y-1">
                    <p className="text-sm font-black text-red-800">{inc.descripcion}</p>
                    {inc.acciones_tomadas && <p className="text-xs text-red-600">Acciones: {inc.acciones_tomadas}</p>}
                    {inc.fotos_urls?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-1">
                        {inc.fotos_urls.map((url, j) => (
                          <a key={j} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="Foto incidente" className="w-16 h-16 object-cover rounded-lg border border-red-200" />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-red-400">
                      {new Date(inc.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {inc.firma_padre_url && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg text-xs font-semibold text-green-700">
                        ✅ Firmado por padre/tutor el {new Date(inc.firma_fecha).toLocaleDateString('es-MX')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab Extensión ────────────────────────────────────────────────────────────
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function TabExtension({ alumnoId }) {
  const qc = useQueryClient();
  const hoy = new Date();
  const mesHoy = hoy.getMonth() + 1;
  const anioHoy = hoy.getFullYear();

  const [accion, setAccion] = useState('alta');
  const [modalidad, setModalidad] = useState('rango');
  const [mesInicio, setMesInicio] = useState(mesHoy);
  const [mesFin, setMesFin] = useState(mesHoy + 3);
  const [anioInicio, setAnioInicio] = useState(anioHoy);
  const [generaCargos, setGeneraCargos] = useState(true);
  const [notas, setNotas] = useState('');

  // Al cambiar a baja, posicionar en el primer mes futuro cancelable
  const handleSetAccion = (nuevaAccion) => {
    setAccion(nuevaAccion);
    if (nuevaAccion === 'baja') {
      const ultimo = historial.find(h => h.tipo_servicio === 'extension');
      if (ultimo?.accion === 'alta') {
        // Buscar primer mes futuro del rango
        let m = parseInt(ultimo.mes_inicio), a = parseInt(ultimo.anio_inicio);
        const mFin = ultimo.mes_fin ? parseInt(ultimo.mes_fin) : m;
        const aFin = ultimo.anio_fin ? parseInt(ultimo.anio_fin) : a;
        while (a < aFin || (a === aFin && m <= mFin)) {
          if (a > anioHoy || (a === anioHoy && m > mesHoy)) {
            setMesInicio(m);
            setAnioInicio(a);
            break;
          }
          m++; if (m > 12) { m = 1; a++; }
        }
      }
    }
  };

  const { data: alumnoActual, refetch: refetchAlumno } = useQuery({
    queryKey: ['alumno-perfil', alumnoId],
    queryFn: () => api.get(`/alumnos/${alumnoId}`).then(r => r.data),
    staleTime: 0,
  });

  const { data: historial = [], refetch: refetchHistorial } = useQuery({
    queryKey: ['historial-servicios', alumnoId],
    queryFn: () => api.get(`/alumnos/${alumnoId}/historial-servicios`, {
      params: { anio: anioHoy }
    }).then(r => r.data),
  });

  const registrar = useMutation({
    mutationFn: () => {
      let mesF = mesFin, anioF = anioInicio;
      if (mesFin > 12) { anioF++; mesF = mesFin - 12; }

      return api.post(`/alumnos/${alumnoId}/historial-servicios`, {
        tipo_servicio: 'extension',
        accion,
        mes_inicio: accion === 'alta' ? mesInicio : mesInicio,
        anio_inicio: anioInicio,
        mes_fin: accion === 'alta' ? mesF : null,
        anio_fin: accion === 'alta' ? anioF : null,
        genera_cargos: accion === 'alta' ? generaCargos : false,
        notas: notas || null,
      }).then(r => r.data);
    },
    onSuccess: () => {
      toast.success(`✅ ${accion === 'alta' ? 'Alta' : 'Baja'} de extensión registrada`);
      setNotas('');
      refetchHistorial();
      refetchAlumno();
    },
    onError: e => {
      toast.error(e.response?.data?.error || e.message);
    },
  });

  const tieneExtension = alumnoActual?.tiene_extension;
  const mesesGenerados = accion === 'alta' && generaCargos
    ? Math.max(1, mesFin > 12 ? (12 - mesInicio + 1) + (mesFin - 12) : mesFin - mesInicio + 1)
    : 0;

  // El historial viene DESC por fecha. El primer registro es el más reciente.
  // Alta vigente: la alta más reciente, solo si no hay una baja posterior a ella.
  const ultimoRegistro = historial.find(h => h.tipo_servicio === 'extension');
  const altaVigente = ultimoRegistro?.accion === 'alta' ? ultimoRegistro : null;
  // Baja que canceló el rango anterior (el registro más reciente si es baja)
  const bajaRegistrada = ultimoRegistro?.accion === 'baja' ? ultimoRegistro : null;

  // Meses futuros cancelables: dentro del rango del alta vigente, estrictamente futuros (> mes actual)
  const mesesBaja = (() => {
    if (!altaVigente) return [];
    const lista = [];
    let m = parseInt(altaVigente.mes_inicio), a = parseInt(altaVigente.anio_inicio);
    const mFin = altaVigente.mes_fin ? parseInt(altaVigente.mes_fin) : m;
    const aFin = altaVigente.anio_fin ? parseInt(altaVigente.anio_fin) : a;
    while (a < aFin || (a === aFin && m <= mFin)) {
      const esFuturo = a > anioHoy || (a === anioHoy && m > mesHoy);
      if (esFuturo) lista.push({ mes: m, anio: a, label: `${MESES[m - 1]} ${a}` });
      m++;
      if (m > 12) { m = 1; a++; }
    }
    return lista;
  })();

  // Texto informativo para la baja: "cancelará de MesX a MesFin"
  const infoBaja = (() => {
    if (mesesBaja.length === 0) return null;
    const primero = mesesBaja[0];
    const ultimo = mesesBaja[mesesBaja.length - 1];
    const selIdx = mesesBaja.findIndex(mb => mb.mes === mesInicio && mb.anio === anioInicio);
    const desde = selIdx >= 0 ? mesesBaja[selIdx] : primero;
    if (desde.mes === ultimo.mes && desde.anio === ultimo.anio) return `${desde.label}`;
    return `${desde.label} a ${ultimo.label}`;
  })();

  // Alta futura: hay un alta cuyo mes_inicio es posterior al mes actual
  const altaFutura = !tieneExtension && historial.find(h => {
    if (h.tipo_servicio !== 'extension' || h.accion !== 'alta') return false;
    const a = parseInt(h.anio_inicio), m = parseInt(h.mes_inicio);
    return a > anioHoy || (a === anioHoy && m > mesHoy);
  });

  // Fin efectivo del alta futura: mes anterior a la baja registrada (si existe)
  const finEfectivo = (() => {
    if (!altaFutura) return null;
    // Buscar la baja más reciente posterior al alta futura
    const bajaAsociada = historial.find(h =>
      h.tipo_servicio === 'extension' && h.accion === 'baja' &&
      new Date(h.created_at) > new Date(altaFutura.created_at)
    );
    if (!bajaAsociada) {
      return altaFutura.mes_fin
        ? { mes: parseInt(altaFutura.mes_fin), anio: parseInt(altaFutura.anio_fin) }
        : null;
    }
    // Mes anterior a la baja
    let m = parseInt(bajaAsociada.mes_inicio) - 1;
    let a = parseInt(bajaAsociada.anio_inicio);
    if (m === 0) { m = 12; a--; }
    return { mes: m, anio: a };
  })();

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className={`card-hs p-4 border-l-4 ${tieneExtension ? 'border-green-500' : altaFutura ? 'border-blue-400' : 'border-gray-300'}`}>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado actual</p>
          {tieneExtension ? (
            <>
              <p className="text-xl font-black text-green-600">⏳ Con Servicio de Extensión</p>
              {altaVigente && (
                <p className="text-xs text-gray-500 font-semibold mt-1">
                  Vigente: {MESES[parseInt(altaVigente.mes_inicio) - 1]} {altaVigente.anio_inicio}
                  {altaVigente.mes_fin ? ` — ${MESES[parseInt(altaVigente.mes_fin) - 1]} ${altaVigente.anio_fin}` : ' (indefinido)'}
                </p>
              )}
              {alumnoActual?.hora_salida_extension && (
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Salida hasta: {alumnoActual.hora_salida_extension}
                </p>
              )}
            </>
          ) : altaFutura ? (
            <>
              <p className="text-xl font-black text-blue-500">📅 Sin servicio actualmente</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">
                Inicia en {MESES[parseInt(altaFutura.mes_inicio) - 1]} {altaFutura.anio_inicio}
                {finEfectivo ? ` hasta ${MESES[finEfectivo.mes - 1]} ${finEfectivo.anio}` : ''}
              </p>
            </>
          ) : (
            <p className="text-xl font-black text-gray-400">— Sin Servicio de Extensión</p>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="card-hs p-4 space-y-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
          {accion === 'alta' ? 'Dar de Alta' : 'Dar de Baja'}
        </p>

        {/* Acción */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">Acción</label>
          <div className="flex gap-2">
            {[{ key: 'alta', label: '➕ Alta' }, { key: 'baja', label: '➖ Baja' }].map(opt => (
              <button key={opt.key} onClick={() => handleSetAccion(opt.key)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  accion === opt.key ? 'bg-hs-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {accion === 'alta' && (
          <>
            {/* Modalidad */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Modalidad</label>
              <div className="space-y-1">
                {[
                  { key: 'rango', label: '📅 Por rango de meses' },
                  { key: 'indefinido', label: '♾️ Indefinido (hasta baja manual)' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="modalidad" value={opt.key} checked={modalidad === opt.key}
                      onChange={e => setModalidad(e.target.value)} className="w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mes Inicio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Mes inicio</label>
                <select value={mesInicio} onChange={e => setMesInicio(parseInt(e.target.value))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-hs-purple">
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Año</label>
                <input type="number" min="2020" max="2099" value={anioInicio}
                  onChange={e => setAnioInicio(parseInt(e.target.value))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-hs-purple" />
              </div>
            </div>

            {/* Mes Fin (solo para rango) */}
            {modalidad === 'rango' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mes fin</label>
                  <select value={mesFin} onChange={e => setMesFin(parseInt(e.target.value))}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-hs-purple">
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    <option value={13}>Ene (próx.)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <p className="text-sm font-bold text-hs-purple bg-purple-50 rounded px-3 py-2 w-full text-center">
                    {mesesGenerados} mes{mesesGenerados !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Generar cargos */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={generaCargos} onChange={e => setGeneraCargos(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-semibold text-gray-600">Generar cargos de pago automáticos</span>
            </label>
            {generaCargos && mesesGenerados > 0 && (
              <p className="text-xs text-gray-500 bg-yellow-50 border-l-2 border-yellow-300 p-2 rounded">
                ℹ️ Se crearán {mesesGenerados} cargo{mesesGenerados !== 1 ? 's' : ''} pendiente{mesesGenerados !== 1 ? 's' : ''} en el sistema de pagos
              </p>
            )}
          </>
        )}

        {accion === 'baja' && (
          <>
            {!altaVigente ? (
              <p className="text-sm text-gray-400 text-center py-2">No hay un alta vigente de extensión</p>
            ) : mesesBaja.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border-l-2 border-amber-300 p-2 rounded text-xs">
                No hay meses futuros cancelables — el servicio solo cubre el mes en curso
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cancelar a partir de</label>
                  <select
                    value={`${mesInicio}-${anioInicio}`}
                    onChange={e => {
                      const [m, a] = e.target.value.split('-').map(Number);
                      setMesInicio(m);
                      setAnioInicio(a);
                    }}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-hs-purple"
                  >
                    {mesesBaja.map(({ mes, anio, label }) => (
                      <option key={`${mes}-${anio}`} value={`${mes}-${anio}`}>{label}</option>
                    ))}
                  </select>
                </div>
                {infoBaja && (
                  <p className="text-xs bg-red-50 border-l-2 border-red-300 p-2 rounded text-red-700">
                    ⚠️ Se cancelará el servicio de extensión de <strong>{infoBaja}</strong> y los cargos pendientes de esos meses
                  </p>
                )}
              </>
            )}
          </>
        )}

        {/* Notas */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Notas (opcional)</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
            placeholder="Ej: solicitud de la familia, etc."
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />
        </div>

        <button onClick={() => registrar.mutate()} disabled={registrar.isPending}
          className="w-full py-2 bg-hs-purple text-white rounded-lg font-black hover:bg-purple-700 transition-all disabled:opacity-50">
          {registrar.isPending ? '…' : accion === 'alta' ? '✅ Dar de Alta' : '❌ Dar de Baja'}
        </button>
      </div>

      {/* Historial */}
      <div className="card-hs p-4 space-y-3">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Historial</p>
        {historial.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin movimientos</p>
        ) : (
          <div className="space-y-2">
            {historial.map(h => (
              <div key={h.id} className={`border-l-4 rounded-lg p-3 ${h.accion === 'alta' ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                <p className="font-bold text-gray-800">
                  {h.accion === 'alta' ? '➕ Alta' : '➖ Baja'}
                  {h.mes_inicio && ` — ${MESES[h.mes_inicio - 1]} ${h.anio_inicio}`}
                  {h.mes_fin && ` a ${MESES[h.mes_fin - 1]} ${h.anio_fin}`}
                </p>
                {h.notas && <p className="text-xs text-gray-600 mt-1">{h.notas}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function DirectoraAlumnoPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pestaña, setPestaña] = useState('perfil');

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
              {alumno.qr_code_url && (
                <img src={alumno.qr_code_url} alt="QR" className="w-16 h-16 rounded-xl border border-gray-100" />
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
                <span className="font-bold text-pink-500">👶🏻 Usa pañal</span>
              )}
            </div>

            {/* Médico */}
            {alumno.medico_nombre && (
              <p className="mt-2 text-xs text-gray-500 font-semibold">
                👨🏻‍⚕️ {alumno.medico_nombre}{alumno.medico_telefono ? ` · ${alumno.medico_telefono}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'perfil',    label: '👤 Perfil' },
          { key: 'bitacora',  label: '📋 Bitácora' },
          { key: 'extension', label: '⏳ Extensión' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setPestaña(key)}
            className={`px-5 py-2 rounded-xl font-black text-sm transition-all
              ${pestaña === key ? 'bg-hs-purple text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {pestaña === 'bitacora' && (
        <BitacoraDirectora alumnoId={id} usaPanial={alumno.usa_panial} />
      )}

      {pestaña === 'extension' && (
        <TabExtension alumnoId={id} />
      )}

      {pestaña === 'perfil' && (<>
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
        {alumno.fecha_nacimiento && ` · Nacimiento: ${new Date(alumno.fecha_nacimiento.substring(0,10) + 'T12:00:00').toLocaleDateString('es-MX')}`}
        {alumno.curp && ` · CURP: ${alumno.curp}`}
      </div>
      </>)}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import { useCatalogo } from '@/hooks/useCatalogo';
import { Clock } from 'lucide-react';

// ─── Modal Nuevo Ciclo ────────────────────────────────────────────────────────
function ModalNuevoCiclo({ onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: '',
    fecha_inicio: '2026-09-01',
    fecha_fin: '2027-07-31',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.fecha_inicio || !form.fecha_fin) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="+ Nuevo Ciclo Escolar" size="md">
      <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del ciclo *</label>
            <input
              className="input-hs w-full"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Ej. 2026-2027"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de inicio *</label>
            <input
              type="date"
              className="input-hs w-full"
              value={form.fecha_inicio}
              onChange={e => set('fecha_inicio', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de fin *</label>
            <input
              type="date"
              className="input-hs w-full"
              value={form.fecha_fin}
              onChange={e => set('fecha_fin', e.target.value)}
              required
            />
          </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition"
          >
            {saving ? 'Guardando...' : 'Crear ciclo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Vista previa de promoción ──────────────────────────────────────────
function ModalPromocion({ cicloActual, ciclos, alumnos: alumnosOriginal, onClose, onConfirm, onExport }) {
  const [cicloDestino, setCicloDestino] = useState(null);
  const [ajustes, setAjustes] = useState([]);
  const [step, setStep] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [copyingGroups, setCopyingGroups] = useState(false);
  const [mensajeValidacion, setMensajeValidacion] = useState('');
  const [mostrarPanelGrupos, setMostrarPanelGrupos] = useState(false);
  const [gruposAnterior, setGruposAnterior] = useState([]);
  const [gruposSeleccionados, setGruposSeleccionados] = useState({});
  const [gruposDestino, setGruposDestino] = useState([]);
  const [gruposParaEditar, setGruposParaEditar] = useState({});
  const [gruposNuevos, setGruposNuevos] = useState([]);

  const { items: NIVELES_CATALOGO } = useCatalogo('niveles');
  const NIVELES = NIVELES_CATALOGO.map(n => ({ nivel: n.label, nivel_codigo: n.key }));

  const { items: ESTADOS_CIERRE } = useCatalogo('estados-alumno');
  // En cierre de ciclo solo aplican reinscrito y baja (egresado se detecta por kinder3)
  const estadosCierre = ESTADOS_CIERRE.filter(e => ['reinscrito', 'baja'].includes(e.key));

  const cambiarEstado = (idx, nuevoEstado) => {
    setAjustes(a => {
      const copia = [...a];
      copia[idx].nuevo_estado = nuevoEstado;
      if (nuevoEstado === 'baja') {
        copia[idx].grupo_destino_id = null;
        copia[idx].grupo_destino_nombre = null;
      }
      return copia;
    });
  };

  const cambiarGrupoDestino = (idx, nuevoGrupoId) => {
    const grupoElegido = gruposDestino.find(g => g.id === nuevoGrupoId);
    setAjustes(a => {
      const copia = [...a];
      copia[idx].grupo_destino_id = nuevoGrupoId;
      copia[idx].grupo_destino_nombre = grupoElegido?.nombre || '';
      return copia;
    });
  };

  const abrirPanelSeleccionGrupos = async () => {
    setMostrarPanelGrupos(true);
    setCopyingGroups(true);
    try {
      const res = await api.get(`/grupos?ciclo_id=${cicloActual.id}`);
      const grupos = res.data;
      setGruposAnterior(grupos);
      const selectAll = {};
      const editAll = {};
      grupos.forEach(g => {
        selectAll[g.id] = true;
        editAll[g.id] = g.nombre;
      });
      setGruposSeleccionados(selectAll);
      setGruposParaEditar(editAll);
    } catch (err) {
      setMensajeValidacion('❌ Error al cargar grupos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCopyingGroups(false);
    }
  };

  const confirmarSeleccionGrupos = async () => {
    if (!cicloDestino) return;
    setCopyingGroups(true);
    try {
      const gruposACopiar = [
        ...gruposAnterior
          .filter(g => gruposSeleccionados[g.id])
          .map(g => ({
            grupo_id_origen: g.id,
            nombre_destino: gruposParaEditar[g.id] ?? g.nombre,
            nivel: g.nivel,
            nivel_codigo: g.nivel_codigo
          })),
        ...gruposNuevos.filter(g => g.nombre_destino.trim())
      ];

      const res = await api.post(`/ciclos/${cicloDestino.id}/copiar-grupos-del-anterior`, {
        grupos: gruposACopiar
      });

      setMensajeValidacion(`✓ ${res.data.grupos_copiados} grupos copiados correctamente`);
      setCicloDestino(prev => ({
        ...prev,
        grupos_creados: res.data.grupos_copiados
      }));

      setMostrarPanelGrupos(false);
      setGruposSeleccionados({});
      setGruposParaEditar({});
      setGruposNuevos([]);

      const destinoActualizado = { ...cicloDestino, grupos_creados: res.data.grupos_copiados };
      setTimeout(() => {
        handleSeleccionarDestino(destinoActualizado);
      }, 500);
    } catch (err) {
      setMensajeValidacion('❌ Error al copiar grupos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCopyingGroups(false);
    }
  };

  const handleSeleccionarDestino = async (destino) => {
    setCicloDestino(destino);
    setMensajeValidacion('');

    if (!destino.grupos_creados || destino.grupos_creados === 0) {
      setMensajeValidacion('⚠️ Este ciclo no tiene grupos creados. Selecciona uno para copiar grupos.');
      return;
    }

    // Cargar grupos del ciclo destino y hacer preview
    setLoadingPreview(true);
    try {
      const gruposRes = await api.get(`/grupos?ciclo_id=${destino.id}`);
      setGruposDestino(gruposRes.data);

      const res = await api.get(`/ciclos/${cicloActual.id}/preview-promocion?ciclo_destino_id=${destino.id}`);
      setAjustes(res.data);
      setStep(2);
    } catch (err) {
      setMensajeValidacion('❌ Error al cargar preview: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPreview(false);
    }
  };

  const submit = async () => {
    setConfirming(true);
    try {
      await onConfirm(cicloDestino.id, ajustes);
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(cicloActual.id);
    } finally {
      setExporting(false);
    }
  };


  const conteoAlumnos = ajustes.length;
  const conteoEgresados = ajustes.filter(a => a.nuevo_estado === 'egresado').length;
  const conteoBajas = ajustes.filter(a => a.nuevo_estado === 'baja').length;
  const conteoPromovidos = conteoAlumnos - conteoEgresados - conteoBajas;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ciclosDisponibles = ciclos.filter(c => {
    if (c.activo || c.id === cicloActual.id) return false;
    const fechaFin = new Date(c.fecha_fin);
    fechaFin.setHours(0, 0, 0, 0);
    return fechaFin > hoy;
  });

  const title = step === 1 ? 'Paso 1: Seleccionar ciclo destino' : step === 2 ? 'Paso 2: Revisar promoción' : 'Paso 3: Confirmar cierre';

  return (
    <Modal open={true} onClose={onClose} title={title} size="xl" closeOnBackdrop={false}>
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">
          Cerrando ciclo: <strong>{cicloActual.nombre}</strong> ({new Date(cicloActual.fecha_inicio).toLocaleDateString('es-MX')} — {new Date(cicloActual.fecha_fin).toLocaleDateString('es-MX')})
        </p>
        {step === 2 && (
          <p className="text-xs text-gray-600 mt-1">
            Total: {conteoAlumnos} alumnos | ✓ {conteoPromovidos} promovidos | 🎓 {conteoEgresados} egresados{conteoBajas > 0 ? ` | ❌ ${conteoBajas} bajas` : ''}
          </p>
        )}
      </div>

      <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold text-amber-900">📋 Instrucción:</p>
                <p className="text-sm text-amber-800 mt-1">
                  Selecciona el ciclo DESTINO. Desde aquí podrás configurar los grupos que tendrá el nuevo ciclo: elige cuáles copiar del ciclo actual, renómbralos si es necesario, o agrega grupos nuevos.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Ciclos disponibles:</label>
                {ciclosDisponibles.length === 0 ? (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">❌ No hay ciclos creados. Crea un nuevo ciclo antes de cerrar.</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {ciclosDisponibles.map(ciclo => (
                      <button
                        key={ciclo.id}
                        onClick={() => handleSeleccionarDestino(ciclo)}
                        disabled={loadingPreview}
                        className={`p-4 rounded-lg border-2 text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          cicloDestino?.id === ciclo.id
                            ? 'border-hs-green bg-green-50'
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <div className="font-bold text-gray-800">{ciclo.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(ciclo.fecha_inicio).toLocaleDateString('es-MX')} — {new Date(ciclo.fecha_fin).toLocaleDateString('es-MX')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          📚 {ciclo.grupos_creados || 0} grupos creados
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {mensajeValidacion && (
                <div className={`p-3 rounded-lg border ${
                  mensajeValidacion.includes('✓')
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm ${
                    mensajeValidacion.includes('✓')
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>{mensajeValidacion}</p>
                </div>
              )}

              {cicloDestino && (
                <button
                  onClick={abrirPanelSeleccionGrupos}
                  disabled={copyingGroups}
                  className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition"
                >
                  {copyingGroups ? '⏳ Cargando grupos...' : cicloDestino.grupos_creados > 0 ? '⚙️ Reconfigurar grupos del ciclo nuevo' : '📋 Seleccionar grupos a copiar'}
                </button>
              )}

              {mostrarPanelGrupos && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                      <h3 className="text-lg font-black text-gray-800">Seleccionar grupos a copiar</h3>
                      <button onClick={() => { setMostrarPanelGrupos(false); setGruposSeleccionados({}); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Grupos del ciclo anterior</p>
                      {gruposAnterior.map(grupo => (
                        <div key={grupo.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={!!gruposSeleccionados[grupo.id]}
                            onChange={e => setGruposSeleccionados(s => ({ ...s, [grupo.id]: e.target.checked }))}
                            className="w-5 h-5 rounded border-gray-300 text-hs-purple focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500">{grupo.nivel}</label>
                            <input
                              type="text"
                              value={gruposParaEditar[grupo.id] || grupo.nombre}
                              onChange={e => setGruposParaEditar(s => ({ ...s, [grupo.id]: e.target.value }))}
                              disabled={!gruposSeleccionados[grupo.id]}
                              className="input-hs text-sm w-full mt-1 disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          </div>
                          <div className="text-xs text-gray-400">{grupo.total_alumnos || 0} alumnos</div>
                        </div>
                      ))}

                      {gruposNuevos.length > 0 && (
                        <p className="text-xs text-gray-500 font-semibold uppercase pt-2 border-t border-gray-100">Grupos nuevos</p>
                      )}
                      {gruposNuevos.map((gn, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 border border-dashed border-hs-purple/30 bg-hs-purple/10 rounded-lg">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Nivel</label>
                              <select
                                value={gn.nivel_codigo}
                                onChange={e => {
                                  const nivel = NIVELES.find(n => n.nivel_codigo === e.target.value);
                                  setGruposNuevos(prev => prev.map((g, i) => i === idx ? { ...g, nivel_codigo: nivel.nivel_codigo, nivel: nivel.nivel } : g));
                                }}
                                className="input-hs text-sm w-full"
                              >
                                {NIVELES.map(n => <option key={n.nivel_codigo} value={n.nivel_codigo}>{n.nivel}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Nombre del grupo</label>
                              <input
                                type="text"
                                value={gn.nombre_destino}
                                onChange={e => setGruposNuevos(prev => prev.map((g, i) => i === idx ? { ...g, nombre_destino: e.target.value } : g))}
                                placeholder="Ej. Kinder 2A"
                                className="input-hs text-sm w-full"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setGruposNuevos(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                          >×</button>
                        </div>
                      ))}

                      <button
                        onClick={() => setGruposNuevos(prev => [...prev, { nombre_destino: '', nivel: 'Kinder 2', nivel_codigo: 'kinder2' }])}
                        className="w-full py-2 px-4 rounded-lg border-2 border-dashed border-hs-purple/30 text-hs-purple font-semibold hover:bg-hs-purple/10 text-sm"
                      >
                        + Agregar grupo nuevo
                      </button>
                    </div>
                    <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                      <button
                        onClick={() => { setMostrarPanelGrupos(false); setGruposSeleccionados({}); setGruposNuevos([]); }}
                        className="flex-1 py-2 px-4 rounded-lg text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmarSeleccionGrupos}
                        disabled={copyingGroups || Object.values(gruposSeleccionados).every(v => !v)}
                        className="flex-1 py-2 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                      >
                        {copyingGroups ? 'Copiando...' : 'Confirmar selección'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-2 px-4 mt-4 rounded-lg border-2 border-hs-blue text-hs-blue-dark font-semibold hover:bg-hs-blue/10 disabled:opacity-50 transition"
              >
                {exporting ? '⬇️ Exportando...' : '⬇️ Descargar respaldo del ciclo actual (grupos, maestras y alumnos)'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-hs-blue/10 p-4 rounded-lg border border-hs-blue/30">
                <p className="text-sm font-semibold text-hs-blue-dark">✓ Ciclo destino seleccionado:</p>
                <p className="text-sm text-hs-blue-dark mt-1">
                  <strong>{cicloDestino?.nombre}</strong> ({new Date(cicloDestino?.fecha_inicio).toLocaleDateString('es-MX')} — {new Date(cicloDestino?.fecha_fin).toLocaleDateString('es-MX')})
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-50">
                      <th className="text-left py-2 px-3 font-bold">Alumno</th>
                      <th className="text-left py-2 px-3 font-bold">Grupo actual</th>
                      <th className="text-center py-2 px-3 font-bold">→</th>
                      <th className="text-left py-2 px-3 font-bold">Grupo destino</th>
                      <th className="text-left py-2 px-3 font-bold">Nuevo estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ajustes.map((a, idx) => {
                      const gruposDelNivel = gruposDestino.filter(g => g.nivel_codigo === (
                        a.nivel_codigo === 'maternal' ? 'prekinder' :
                        a.nivel_codigo === 'prekinder' ? 'kinder1' :
                        a.nivel_codigo === 'kinder1' ? 'kinder2' :
                        a.nivel_codigo === 'kinder2' ? 'kinder3' : null
                      ));
                      return (
                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-700">{a.nombre_completo}</td>
                          <td className="py-2 px-3 text-gray-600">{a.grupo_actual}</td>
                          <td className="text-center text-hs-purple">↑</td>
                          <td className="py-2 px-3">
                            {(a.nuevo_estado === 'egresado' || a.nuevo_estado === 'baja') ? (
                              <span className="text-gray-400 italic">—</span>
                            ) : gruposDelNivel.length > 1 ? (
                              <select
                                value={a.grupo_destino_id || ''}
                                onChange={e => cambiarGrupoDestino(idx, e.target.value)}
                                className="input-hs text-xs py-1 px-2"
                              >
                                <option value="">Seleccionar grupo...</option>
                                {gruposDelNivel.map(g => (
                                  <option key={g.id} value={g.id}>{g.nombre}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-green-700 font-semibold">{a.grupo_destino_nombre}</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {a.nivel_codigo === 'kinder3' ? (
                              <span className="text-sm font-semibold text-hs-purple-dark">🎓 Egresado</span>
                            ) : (
                              <select
                                value={a.nuevo_estado}
                                onChange={e => cambiarEstado(idx, e.target.value)}
                                className="input-hs text-xs py-1 px-2"
                              >
                                {estadosCierre.map(e => (
                                  <option key={e.key} value={e.key}>{e.label}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-900">✓ Listo para cerrar ciclo</p>
                <p className="text-sm text-green-800 mt-2">
                  <strong>{cicloActual.nombre}</strong> se cerrará y <strong>{cicloDestino?.nombre}</strong> se activará.
                </p>
                <ul className="text-sm text-green-800 mt-3 space-y-1 ml-4">
                  <li>✓ {conteoPromovidos} alumnos promocionados a nuevos grupos</li>
                  <li>🎓 {conteoEgresados} alumnos egresados</li>
                  {conteoBajas > 0 && <li>❌ {conteoBajas} alumnos registrados como baja</li>}
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900">⚠️ Acción irreversible</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Asegúrate de haber exportado el reporte del ciclo actual antes de confirmar.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2 px-4 rounded-lg text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 transition"
            >
              ← Atrás
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          {step < 3 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !cicloDestino}
              className="flex-1 py-2 px-4 rounded-lg text-white font-semibold bg-hs-blue-dark hover:bg-hs-blue-dark disabled:opacity-50 transition"
            >
              Siguiente →
            </button>
          )}
          {step === 3 && (
            <button
              onClick={submit}
              disabled={confirming}
              className="flex-1 py-2 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition"
            >
              {confirming ? '⏳ Ejecutando...' : '✓ Confirmar cierre'}
            </button>
          )}
      </div>
    </Modal>
  );
}

// ─── Tab Egresados ────────────────────────────────────────────────────────────
function TabEgresados({ ciclos }) {
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);

  const { data: egresados = [], isLoading: loadingEgresados } = useQuery({
    queryKey: ['egresados', cicloSeleccionado?.id],
    queryFn: async () => {
      const res = await api.get(`/ciclos/${cicloSeleccionado.id}/egresados`);
      return res.data;
    },
    enabled: !!cicloSeleccionado,
  });

  const ciclosCerrados = ciclos.filter(c => !c.activo);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar ciclo:</label>
        <select
          value={cicloSeleccionado?.id || ''}
          onChange={(e) => {
            const ciclo = ciclos.find(c => c.id === e.target.value);
            setCicloSeleccionado(ciclo || null);
          }}
          className="input-hs w-full"
        >
          <option value="">-- Elige un ciclo --</option>
          {ciclosCerrados.map(ciclo => (
            <option key={ciclo.id} value={ciclo.id}>
              {ciclo.nombre} ({new Date(ciclo.fecha_inicio).toLocaleDateString('es-MX')} — {new Date(ciclo.fecha_fin).toLocaleDateString('es-MX')})
            </option>
          ))}
        </select>
      </div>

      {cicloSeleccionado && (
        <>
          {loadingEgresados ? (
            <div className="text-center py-12 text-gray-400">Cargando egresados...</div>
          ) : egresados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No hay egresados registrados en este ciclo.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                <strong>{egresados.length}</strong> egresado{egresados.length !== 1 ? 's' : ''} en <strong>{cicloSeleccionado.nombre}</strong>
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-black text-gray-700">Alumno</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700">Grupo</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700">Nivel</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700">Maestra</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700">Fecha nacimiento</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700">Tutor principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {egresados.map((alumno) => {
                        const tutorPrincipal = alumno.padres?.find(p => p.es_tutor_principal);
                        return (
                          <tr key={alumno.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {alumno.foto_url && (
                                  <img
                                    src={alumno.foto_url}
                                    alt={alumno.nombre_completo}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                )}
                                <span className="font-semibold text-gray-800">{alumno.nombre_completo}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-600">{alumno.grupo_nombre || '—'}</td>
                            <td className="py-4 px-6 text-gray-600">{alumno.nivel || '—'}</td>
                            <td className="py-4 px-6 text-gray-600">{alumno.maestra_nombre || '—'}</td>
                            <td className="py-4 px-6 text-gray-600 text-sm">{new Date(alumno.fecha_nacimiento).toLocaleDateString('es-MX')}</td>
                            <td className="py-4 px-6">
                              {tutorPrincipal ? (
                                <div className="text-sm">
                                  <div className="font-semibold text-gray-800">{tutorPrincipal.nombre}</div>
                                  {tutorPrincipal.telefono && (
                                    <div className="text-gray-500 text-xs">{tutorPrincipal.telefono}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function CiclosEscolares() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('ciclos'); // 'ciclos' | 'egresados'
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarModalPromocion, setMostrarModalPromocion] = useState(false);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  // ─── Queries ──────────────────────────────────────────────────────────────────
  const { data: ciclos = [], isLoading: loadingCiclos } = useQuery({
    queryKey: ['ciclos'],
    queryFn: async () => {
      const res = await api.get('/ciclos');
      return res.data;
    },
  });

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const crearMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/ciclos', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ciclos']);
      setMostrarModalNuevo(false);
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (cicloId) => {
      const res = await api.get(`/ciclos/${cicloId}/preview-promocion`);
      return res.data;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setMostrarModalPromocion(true);
    },
  });

  const confirmarMutation = useMutation({
    mutationFn: async ({ cicloDestinoId, ajustes }) => {
      const res = await api.post(`/ciclos/${cicloSeleccionado.id}/ejecutar-promocion`, {
        ciclo_destino_id: cicloDestinoId,
        ajustes,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ciclos']);
      setMostrarModalPromocion(false);
      setCicloSeleccionado(null);
      setPreviewData([]);
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (cicloId) => {
      const res = await api.get(`/ciclos/${cicloId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ciclo-${cicloSeleccionado.nombre}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      return res.data;
    },
  });

  const handleAbrirPromocion = async (ciclo) => {
    setCicloSeleccionado(ciclo);
    previewMutation.mutate(ciclo.id);
  };

  const cicloActivo = ciclos.find(c => c.activo);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800">Ciclos Escolares</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los ciclos y promociona alumnos</p>
        </div>
        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="py-3 px-6 rounded-lg text-white font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition"
        >
          + Nuevo Ciclo
        </button>
      </div>

      {/* Tabs */}
      <div className="card-hs p-1 flex gap-1 mb-6">
        {[
          { key: 'ciclos',    label: 'Ciclos Escolares', icon: Clock },
          { key: 'egresados', label: 'Egresados',        icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
              tab === key ? 'bg-hs-purple text-white' : 'text-gray-500 hover:bg-hs-purple/10'
            }`}
          >
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {/* Tabla de ciclos */}
      {tab === 'ciclos' && (
        loadingCiclos ? (
          <div className="text-center py-12 text-gray-400">Cargando ciclos...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-black text-gray-700">Ciclo</th>
                    <th className="text-left py-4 px-6 font-black text-gray-700">Período</th>
                    <th className="text-left py-4 px-6 font-black text-gray-700">Estado</th>
                    <th className="text-center py-4 px-6 font-black text-gray-700">Alumnos</th>
                    <th className="text-center py-4 px-6 font-black text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ciclos.map((ciclo) => {
                    const esActivo = ciclo.activo;
                    return (
                      <tr key={ciclo.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-4 px-6 font-bold text-gray-800">{ciclo.nombre}</td>
                        <td className="py-4 px-6 text-gray-600 text-sm">
                          {new Date(ciclo.fecha_inicio).toLocaleDateString('es-MX')} → {new Date(ciclo.fecha_fin).toLocaleDateString('es-MX')}
                        </td>
                        <td className="py-4 px-6">
                          {esActivo ? (
                            <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              ✓ ACTIVO
                            </span>
                          ) : (
                            <span className="inline-block py-1 px-3 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                              Cerrado
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center font-semibold text-gray-700">{ciclo.total_alumnos}</td>
                        <td className="py-4 px-6 text-center space-x-2">
                          {esActivo && (
                            <button
                              onClick={() => handleAbrirPromocion(ciclo)}
                              disabled={previewMutation.isPending}
                              className="inline-block py-2 px-4 rounded-lg text-sm font-bold text-white bg-hs-blue-dark hover:bg-hs-blue-dark disabled:opacity-50 transition"
                            >
                              Iniciar cierre →
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab Egresados */}
      {tab === 'egresados' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <TabEgresados ciclos={ciclos} />
        </div>
      )}

      {/* Modales */}
      {mostrarModalNuevo && (
        <ModalNuevoCiclo
          onClose={() => setMostrarModalNuevo(false)}
          onSave={(data) => crearMutation.mutate(data)}
        />
      )}

      {mostrarModalPromocion && cicloSeleccionado && (
        <ModalPromocion
          cicloActual={cicloSeleccionado}
          ciclos={ciclos}
          alumnos={previewData}
          onClose={() => {
            setMostrarModalPromocion(false);
            setCicloSeleccionado(null);
            setPreviewData([]);
          }}
          onConfirm={(cicloDestinoId, ajustes) =>
            confirmarMutation.mutate({ cicloDestinoId, ajustes })
          }
          onExport={(cicloId) => exportMutation.mutate(cicloId)}
        />
      )}
    </div>
  );
}

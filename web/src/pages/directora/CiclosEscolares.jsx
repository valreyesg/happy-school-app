import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800">+ Nuevo Ciclo Escolar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={submit} className="px-6 py-4 space-y-4">
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
      </div>
    </div>
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

  const cambiarEstado = (idx, nuevoEstado) => {
    setAjustes(a => {
      const copia = [...a];
      copia[idx].nuevo_estado = nuevoEstado;
      return copia;
    });
  };

  const handleSeleccionarDestino = async (destino) => {
    setCicloDestino(destino);
    setMensajeValidacion('');

    if (!destino.grupos_creados || destino.grupos_creados === 0) {
      setMensajeValidacion('⚠️ Este ciclo no tiene grupos creados. Crea los grupos antes de promocionar.');
      return;
    }

    // Hacer nuevo preview con ciclo_destino_id
    setLoadingPreview(true);
    try {
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

  const handleCopiarGrupos = async () => {
    if (!cicloDestino) return;
    setCopyingGroups(true);
    try {
      const res = await api.post(`/ciclos/${cicloDestino.id}/copiar-grupos-del-anterior`);
      setMensajeValidacion(`✓ ${res.data.grupos_copiados} grupos + ${res.data.asignaciones_copiadas} maestras copiados correctamente`);

      // Actualizar cicloDestino con nuevo count de grupos
      setCicloDestino(prev => ({
        ...prev,
        grupos_creados: res.data.grupos_copiados
      }));

      // Intentar avanzar al siguiente paso
      setTimeout(() => {
        handleSeleccionarDestino(cicloDestino);
      }, 1000);
    } catch (err) {
      setMensajeValidacion('❌ Error al copiar grupos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCopyingGroups(false);
    }
  };

  const conteoAlumnos = ajustes.length;
  const conteoEgresados = ajustes.filter(a => a.nuevo_estado === 'egresado').length;
  const conteoPromovidos = conteoAlumnos - conteoEgresados;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ciclosDisponibles = ciclos.filter(c => {
    if (c.activo || c.id === cicloActual.id) return false;
    const fechaFin = new Date(c.fecha_fin);
    fechaFin.setHours(0, 0, 0, 0);
    return fechaFin > hoy;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-800">
              {step === 1 && 'Paso 1: Seleccionar ciclo destino'}
              {step === 2 && 'Paso 2: Revisar promoción'}
              {step === 3 && 'Paso 3: Confirmar cierre'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cerrando ciclo: <strong>{cicloActual.nombre}</strong> ({new Date(cicloActual.fecha_inicio).toLocaleDateString('es-MX')} — {new Date(cicloActual.fecha_fin).toLocaleDateString('es-MX')})
            </p>
            {step === 2 && (
              <p className="text-xs text-gray-600 mt-1">
                Total: {conteoAlumnos} alumnos | ✓ {conteoPromovidos} promovidos | 🎓 {conteoEgresados} egresados
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold text-amber-900">📋 Instrucción:</p>
                <p className="text-sm text-amber-800 mt-1">
                  Selecciona el ciclo DESTINO donde se promocionarán los alumnos. El ciclo debe tener todos los grupos ya creados.
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
                            ? 'border-green-500 bg-green-50'
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

              {cicloDestino && !cicloDestino.grupos_creados && (
                <button
                  onClick={handleCopiarGrupos}
                  disabled={copyingGroups}
                  className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition"
                >
                  {copyingGroups ? '⏳ Copiando grupos...' : '📋 Copiar grupos del ciclo anterior'}
                </button>
              )}

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-2 px-4 mt-4 rounded-lg border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 disabled:opacity-50 transition"
              >
                {exporting ? '⬇️ Exportando...' : '⬇️ Exportar reporte ciclo actual (Excel)'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">✓ Ciclo destino seleccionado:</p>
                <p className="text-sm text-blue-800 mt-1">
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
                    {ajustes.map((a, idx) => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-semibold text-gray-700">{a.nombre_completo}</td>
                        <td className="py-2 px-3 text-gray-600">{a.grupo_actual}</td>
                        <td className="text-center text-purple-600">↑</td>
                        <td className="py-2 px-3">
                          {a.nuevo_estado === 'egresado' ? (
                            <span className="text-gray-400 italic">—</span>
                          ) : (
                            <span className="text-green-700 font-semibold">{a.grupo_destino_nombre}</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={a.nuevo_estado}
                            onChange={e => cambiarEstado(idx, e.target.value)}
                            className="input-hs text-xs py-1 px-2"
                          >
                            <option value="reinscrito">Reinscrito</option>
                            <option value="egresado">Egresado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
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
              className="flex-1 py-2 px-4 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
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
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function CiclosEscolares() {
  const queryClient = useQueryClient();
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

      {/* Tabla de ciclos */}
      {loadingCiclos ? (
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
                            className="inline-block py-2 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
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

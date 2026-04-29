import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '@/services/api';

const ComidaSemanal = () => {
  const [menu, setMenu] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deseoServicio, setDeseoServicio] = useState(false);
  const [modalidad, setModalidad] = useState('semana_completa');
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [comprobante, setComprobante] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: hijosData = {} } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => API.get('/alumnos/mis-hijos').then(r => r.data),
  });

  const { data: configNegocio } = useQuery({
    queryKey: ['config-negocio'],
    queryFn: () => API.get('/config/negocio').then(r => r.data),
    staleTime: 30 * 60 * 1000,
  });
  const PRECIO_SEMANA = configNegocio?.precio_comida_semana ?? 250;
  const PRECIO_DIA    = configNegocio?.precio_comida_dia    ?? 50;
  const hijos = hijosData.hijos || [];

  const alumnoId = hijos[0]?.id;
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const getSemanLabelsActual = () => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    return lunes.toISOString().split('T')[0];
  };

  const semanaActual = getSemanLabelsActual();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        const menuRes = await API.get(`/comida/menu?semana=${semanaActual}`);
        setMenu(menuRes.data);

        if (alumnoId) {
          const confRes = await API.get(`/comida/confirmacion/${alumnoId}?semana=${semanaActual}`);
          if (confRes.data) {
            setConfirmacion(confRes.data);
            setDeseoServicio(confRes.data.confirmado);
            setModalidad(confRes.data.modalidad);
            setDiasSeleccionados(confRes.data.dias_seleccionados || []);
            setMetodoPago(confRes.data.metodo_pago);
          }
        }
      } catch (e) {
        console.error('Error cargando datos:', e);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [alumnoId, semanaActual]);

  const calcularMonto = () => {
    if (!deseoServicio) return 0;
    if (modalidad === 'semana_completa') return PRECIO_SEMANA;
    return PRECIO_DIA * diasSeleccionados.length;
  };

  const toggleDia = (index) => {
    setDiasSeleccionados(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!alumnoId) throw new Error('No se encontró ID del alumno');

      if (deseoServicio) {
        if (modalidad === 'dias_especificos' && diasSeleccionados.length === 0) {
          setError('Debes seleccionar al menos un día');
          return;
        }

        if (metodoPago === 'transferencia' && !comprobante && !confirmacion?.comprobante_pago_url) {
          setError('Debes adjuntar comprobante de transferencia');
          return;
        }
      }

      const formData = new FormData();
      formData.append('alumno_id', alumnoId);
      formData.append('semana_inicio', semanaActual);
      formData.append('modalidad', deseoServicio ? modalidad : null);
      formData.append('dias_seleccionados', JSON.stringify(deseoServicio ? diasSeleccionados : []));
      formData.append('metodo_pago', deseoServicio ? metodoPago : null);

      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      await API.post('/comida/confirmacion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('✅ Confirmación guardada');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const monto = calcularMonto();
  const hoy = new Date();
  const esDomingo = hoy.getDay() === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-black text-gray-800">🍽️ Servicio de Comida</h1>
        <p className="text-gray-500 font-semibold mt-1">Confirma el servicio para próxima semana</p>
      </div>

      {/* Menú semanal */}
      {menu && (
        <div className="card-hs">
          <h2 className="text-sm font-black text-red-500 uppercase tracking-wide mb-4">📋 Menú de la Semana</h2>
          <div className="space-y-3">
            {menu.contenido_texto && (
              <p className="text-gray-700 text-sm leading-6 whitespace-pre-wrap font-semibold">{menu.contenido_texto}</p>
            )}
            {menu.archivo_menu_url && (
              <a
                href={menu.archivo_menu_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 transition"
              >
                📥 Descargar menú completo
              </a>
            )}
          </div>
        </div>
      )}

      {!esDomingo ? (
        <div className="card-hs bg-hs-blue/10 border-2 border-hs-blue/30">
          <p className="text-sm font-bold text-hs-blue-dark">
            📅 El formulario está disponible solo los domingos para confirmar servicio la próxima semana
          </p>
        </div>
      ) : (
        <form onSubmit={handleConfirmar} className="card-hs space-y-5">
          <h2 className="text-sm font-black text-red-500 uppercase tracking-wide">🍽️ Confirmar Servicio</h2>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-hs-green text-green-700 p-4 rounded-xl text-sm font-semibold">
              {success}
            </div>
          )}

          {/* Checkbox deseo servicio */}
          <button
            type="button"
            onClick={() => setDeseoServicio(!deseoServicio)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm text-left
              ${deseoServicio ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'}`}
          >
            <span className="text-xl">{deseoServicio ? '✅' : '⬜'}</span>
            <span>Deseo servicio de comida para próxima semana</span>
          </button>

          {deseoServicio && (
            <div className="space-y-5">
              {/* Modalidad */}
              <div>
                <p className="text-sm font-black text-gray-600 mb-3 uppercase tracking-wide">Tipo de servicio</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalidad('semana_completa');
                      setDiasSeleccionados([]);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
                      ${modalidad === 'semana_completa' ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    <span className="text-lg">{modalidad === 'semana_completa' ? '✅' : '⬜'}</span>
                    <span>Semana completa (L-V)</span>
                    <span className="ml-auto font-black text-green-600">${PRECIO_SEMANA}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidad('dias_especificos')}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
                      ${modalidad === 'dias_especificos' ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    <span className="text-lg">{modalidad === 'dias_especificos' ? '✅' : '⬜'}</span>
                    <span>Días específicos</span>
                    <span className="ml-auto font-black text-green-600">${PRECIO_DIA}/día</span>
                  </button>
                </div>
              </div>

              {/* Seleccionar días */}
              {modalidad === 'dias_especificos' && (
                <div>
                  <p className="text-sm font-black text-gray-600 mb-3 uppercase tracking-wide">Elige los días</p>
                  <div className="grid grid-cols-2 gap-2">
                    {diasSemana.map((dia, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDia(idx)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
                          ${diasSeleccionados.includes(idx)
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-600'}`}
                      >
                        <span className="text-lg">{diasSeleccionados.includes(idx) ? '✅' : '⬜'}</span>
                        <span>{dia}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Método pago */}
              <div>
                <p className="text-sm font-black text-gray-600 mb-3 uppercase tracking-wide">Forma de pago</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('transferencia')}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
                      ${metodoPago === 'transferencia' ? 'border-hs-blue/40 bg-hs-blue/10 text-hs-blue-dark' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    <span className="text-lg">{metodoPago === 'transferencia' ? '✅' : '⬜'}</span>
                    <span>💳 Transferencia bancaria</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('efectivo')}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
                      ${metodoPago === 'efectivo' ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    <span className="text-lg">{metodoPago === 'efectivo' ? '✅' : '⬜'}</span>
                    <span>💵 Efectivo el lunes</span>
                  </button>
                </div>
              </div>

              {/* Comprobante transferencia */}
              {metodoPago === 'transferencia' && (
                <div>
                  <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wide">Comprobante de pago</label>
                  <input
                    type="file"
                    onChange={(e) => setComprobante(e.target.files[0])}
                    accept="image/*,.pdf"
                    className="input-hs"
                  />
                  {confirmacion?.comprobante_pago_url && !comprobante && (
                    <p className="text-xs text-green-600 font-bold mt-2">✅ Comprobante ya adjuntado</p>
                  )}
                </div>
              )}

              {/* Resumen monto */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-2xl border-2 border-red-200">
                <p className="text-sm text-gray-600 font-semibold">Total a pagar</p>
                <p className="text-3xl font-black text-red-600 mt-1">${monto}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-red w-full"
          >
            {loading ? '⏳ Guardando...' : '✅ Confirmar Servicio'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ComidaSemanal;

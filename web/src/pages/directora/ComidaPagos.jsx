import { useState, useEffect } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

const ComidaPagos = () => {
  const [semanaInicio, setSemanaInicio] = useState('');
  const [confirmaciones, setConfirmaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const hoy = new Date().toLocaleDateString('en-CA');
    const [año, mes, dia] = hoy.split('-');
    const lunes = new Date(año, parseInt(mes) - 1, parseInt(dia));
    lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
    setSemanaInicio(lunes.toLocaleDateString('en-CA'));
  }, []);

  useEffect(() => {
    if (!semanaInicio) return;

    const cargar = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/comida/confirmaciones?semana=${semanaInicio}`);
        setStats(res.data);
        setConfirmaciones(res.data.confirmaciones || []);
      } catch (e) {
        console.error('Error cargando confirmaciones:', e);
        toast.error('Error al cargar confirmaciones');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [semanaInicio]);

  const handleVerificarPago = async (confirmacionId, nuevoEstado) => {
    try {
      setActualizando(confirmacionId);
      if (nuevoEstado) {
        await api.put(`/comida/confirmacion/${confirmacionId}/verificar-pago`);
        toast.success('✅ Pago verificado');
      } else {
        await api.put(`/comida/confirmacion/${confirmacionId}/cancelar`);
        toast.success('❌ Comida cancelada');
      }
      const res = await api.get(`/comida/confirmaciones?semana=${semanaInicio}`);
      setStats(res.data);
      setConfirmaciones(res.data.confirmaciones || []);
    } catch (e) {
      console.error('Error actualizando pago:', e);
      toast.error('Error al actualizar pago');
    } finally {
      setActualizando(null);
    }
  };

  const handleCambiarSemana = (delta) => {
    const [año, mes, dia] = semanaInicio.split('-');
    const fecha = new Date(año, parseInt(mes) - 1, parseInt(dia));
    fecha.setDate(fecha.getDate() + delta * 7);
    setSemanaInicio(fecha.toLocaleDateString('en-CA'));
  };

  const obtenerRangoSemana = (lunesStr) => {
    const [año, mes, dia] = lunesStr.split('-');
    const lunes = new Date(año, parseInt(mes) - 1, parseInt(dia));
    const viernes = new Date(lunes);
    viernes.setDate(viernes.getDate() + 4);

    const lunesFormatted = lunes.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const viernesFormatted = viernes.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

    return `${lunesFormatted} al ${viernesFormatted}`;
  };

  if (!semanaInicio) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-800">💰 Control de Pagos - Comida</h1>
        <p className="text-gray-500 font-semibold mt-1">Verifica quién pagó la comida de la semana</p>
      </div>

      <div className="card-hs bg-gradient-to-r from-hs-blue/5 to-purple-50 border-2 border-hs-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCambiarSemana(-1)}
              className="px-4 py-2 bg-hs-blue text-white rounded-lg font-bold hover:bg-hs-blue-dark transition"
            >
              ← Anterior
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-600">Semana del</p>
              <p className="text-lg font-black text-hs-blue-dark">{obtenerRangoSemana(semanaInicio)}</p>
            </div>
            <button
              onClick={() => handleCambiarSemana(1)}
              className="px-4 py-2 bg-hs-blue text-white rounded-lg font-bold hover:bg-hs-blue-dark transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-hs bg-hs-purple/10 border-2 border-hs-purple/20 text-center">
            <div className="text-3xl font-black text-hs-purple">{stats.total_confirmados}</div>
            <div className="text-xs font-bold text-gray-600 mt-2">Total Confirmados</div>
          </div>
          <div className="card-hs bg-green-50 border-2 border-green-200 text-center">
            <div className="text-3xl font-black text-green-600">✅ {stats.pagados?.total}</div>
            <div className="text-xs font-bold text-gray-600 mt-2">Pagado</div>
          </div>
          <div className="card-hs bg-red-50 border-2 border-red-200 text-center">
            <div className="text-3xl font-black text-red-600">⚠️ {stats.sin_verificar?.total}</div>
            <div className="text-xs font-bold text-gray-600 mt-2">Sin Verificar</div>
          </div>
          <div className="card-hs bg-hs-blue/10 border-2 border-hs-blue/30 text-center">
            <div className="text-3xl font-black text-hs-blue-dark">💳 {stats.pagados?.transferencia}</div>
            <div className="text-xs font-bold text-gray-600 mt-2">Transferencia</div>
          </div>
          <div className="card-hs bg-yellow-50 border-2 border-yellow-200 text-center">
            <div className="text-3xl font-black text-yellow-600">💵 {stats.pagados?.efectivo}</div>
            <div className="text-xs font-bold text-gray-600 mt-2">Efectivo</div>
          </div>
        </div>
      )}

      <div className="card-hs border-2 border-gray-200">
        <h2 className="text-2xl font-black text-gray-800 mb-4">📋 Alumnos Confirmados</h2>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : confirmaciones.length === 0 ? (
          <p className="text-center text-gray-500 font-semibold py-8">
            No hay confirmaciones para esta semana
          </p>
        ) : (
          <div className="space-y-3">
            {confirmaciones.map(conf => (
              <div
                key={conf.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  conf.pago_verificado
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-800">{conf.nombre_alumno}</h3>
                    {conf.nivel_nombre && (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 text-hs-blue-dark">
                        {conf.nivel_nombre}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 font-bold">
                    📋 {conf.modalidad === 'semana_completa' ? 'Semana completa' : `${conf.monto / 50} días`} (${conf.monto})
                    {' | '}
                    {conf.metodo_pago === 'transferencia' ? '💳 Transferencia' : '💵 Efectivo'}
                  </div>
                </div>

                <button
                  onClick={() => handleVerificarPago(conf.id, !conf.pago_verificado)}
                  disabled={actualizando === conf.id}
                  className={`px-5 py-3 rounded-lg font-black text-sm transition-all whitespace-nowrap ml-4 ${
                    conf.pago_verificado
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {actualizando === conf.id ? '⏳' : conf.pago_verificado ? '✅ Pagado' : '❌ No Pagó'}
                </button>
              </div>
            ))}

            {/* Resumen de totales por método de pago */}
            {stats && confirmaciones.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <p className="text-sm font-black text-gray-600 uppercase tracking-wider mb-3">📊 Resumen de Pagos</p>
                <div className="grid grid-cols-3 gap-3">
                  {/* Total recibido por transferencia */}
                  <div className="bg-hs-blue/10 border-2 border-hs-blue/30 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-hs-blue-dark">
                      ${confirmaciones
                        .filter(c => c.pago_verificado && c.metodo_pago === 'transferencia')
                        .reduce((sum, c) => sum + c.monto, 0)}
                    </p>
                    <p className="text-xs font-bold text-gray-600 mt-1">💳 Transferencias pagadas</p>
                  </div>

                  {/* Total recibido en efectivo */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-yellow-600">
                      ${confirmaciones
                        .filter(c => c.pago_verificado && c.metodo_pago === 'efectivo')
                        .reduce((sum, c) => sum + c.monto, 0)}
                    </p>
                    <p className="text-xs font-bold text-gray-600 mt-1">💵 Efectivo pagado</p>
                  </div>

                  {/* Gran total */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-green-600">
                      ${confirmaciones
                        .filter(c => c.pago_verificado)
                        .reduce((sum, c) => sum + c.monto, 0)}
                    </p>
                    <p className="text-xs font-bold text-gray-600 mt-1">💰 Gran total recibido</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComidaPagos;

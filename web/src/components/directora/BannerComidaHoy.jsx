import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';

const BannerComidaHoy = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        // Obtener lunes de la semana actual (o anterior si es el domingo)
        const hoy = new Date();
        let lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - hoy.getDay() + 1);

        // Si hoy es domingo, usar el lunes de la semana actual (no la próxima)
        if (hoy.getDay() === 0) {
          lunes.setDate(lunes.getDate() - 7);
        }

        const semanaInicio = lunes.toISOString().split('T')[0];

        const res = await api.get(`/comida/confirmaciones?semana=${semanaInicio}`);
        setStats(res.data);
      } catch (e) {
        console.error('Error cargando estadísticas de comida:', e);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  if (loading || !stats || stats.total_confirmados === 0) return null;

  return (
    <div className="card-hs bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-orange-700 mb-3">🍽️ Comida de Hoy</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-orange-600">{stats.total_confirmados}</div>
              <div className="text-xs font-bold text-gray-600 mt-1">Confirmados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">📲 {stats.transferencia_count}</div>
              <div className="text-xs font-bold text-gray-600 mt-1">Transferencia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-600">💵 {stats.efectivo_count}</div>
              <div className="text-xs font-bold text-gray-600 mt-1">Efectivo</div>
            </div>
          </div>
        </div>
        <Link
          to="/directora/comida-menu"
          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition text-sm whitespace-nowrap ml-4"
        >
          Gestionar Menú
        </Link>
      </div>
    </div>
  );
};

export default BannerComidaHoy;

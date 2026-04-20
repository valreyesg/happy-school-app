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
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  if (loading || !stats || !stats.pagados || !stats.sin_verificar || stats.total_confirmados === 0) return null;

  return (
    <div className="card-hs bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h3 className="text-lg font-black text-orange-700">🍽️ Comida de Hoy</h3>
            <div className="text-2xl font-black text-orange-600 mt-1">{stats.total_confirmados} confirmados</div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-black text-green-600">✅ {stats.pagados.total}</div>
              <div className="text-xs text-gray-600">Pagados</div>
              <div className="text-xs text-gray-500">📲 {stats.pagados.transferencia} | 💵 {stats.pagados.efectivo}</div>
            </div>
            <div className="text-center border-l-2 border-gray-300 pl-4">
              <div className="font-black text-yellow-600">⏳ {stats.sin_verificar.total}</div>
              <div className="text-xs text-gray-600">Sin Verificar</div>
              <div className="text-xs text-gray-500">📲 {stats.sin_verificar.transferencia} | 💵 {stats.sin_verificar.efectivo}</div>
            </div>
          </div>
        </div>

        <Link
          to="/directora/comida-menu"
          className="px-3 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition text-xs"
        >
          Gestionar Menú
        </Link>
      </div>
    </div>
  );
};

export default BannerComidaHoy;

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../../services/api';

const ComidaMenu = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [semanaInicio, setSemanaInicio] = useState('');
  const [contenidoTexto, setContenidoTexto] = useState('');
  const [archivo, setArchivo] = useState(null);

  // Cargar niveles del ciclo activo
  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => API.get('/grupos').then(r => r.data),
  });

  const nivelesUnicos = useMemo(() => {
    const vistos = new Set();
    return grupos
      .map(g => ({ id: g.nivel, label: g.nivel }))
      .filter(n => n.id && !vistos.has(n.id) && vistos.add(n.id))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [grupos]);

  const DIAS_NOMBRE = ['lunes','martes','miercoles','jueves','viernes'];
  const TIEMPOS_COMIDA = ['desayuno','colacion','comida'];
  const TIEMPOS_LABEL = { desayuno: '🌅 Desayuno', colacion: '🥤 Colación', comida: '🍽️ Comida' };

  // Estado para días menú: estructura { lunes: { desayuno: {platillo, niveles}, ... }, ... }
  const [dias, setDias] = useState({
    lunes:     { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
    martes:    { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
    miercoles: { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
    jueves:    { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
    viernes:   { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!semanaInicio) {
        setError('Debes seleccionar una semana');
        return;
      }

      // Validar que al menos un platillo esté completo
      const hayPlatillos = Object.values(dias).some(dia =>
        Object.values(dia).some(tiempo => tiempo.platillo && tiempo.platillo.trim())
      );

      if (!hayPlatillos && !contenidoTexto && !archivo) {
        setError('Debes ingresar al menos un platillo, contenido de texto o subir un archivo');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('semana_inicio', semanaInicio);
      formData.append('dias_menu', JSON.stringify(dias));
      formData.append('contenido_texto', contenidoTexto || '');
      if (archivo) {
        formData.append('archivo', archivo);
      }

      await API.post('/comida/menu', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('✅ Menú guardado');
      setContenidoTexto('');
      setArchivo(null);
      setSemanaInicio('');
      setDias({
        lunes:     { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
        martes:    { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
        miercoles: { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
        jueves:    { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
        viernes:   { desayuno: { platillo: '', niveles: ['todos'] }, colacion: { platillo: '', niveles: ['maternal'] }, comida: { platillo: '', niveles: ['todos'] } },
      });
      setShowForm(false);

      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-800">🍽️ Menú Semanal</h1>
        <p className="text-gray-500 font-semibold mt-1">Publica el menú para que los papás vean qué comerán sus hijos</p>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className={`btn-red ${showForm ? 'bg-gray-400 hover:bg-gray-500' : ''}`}
      >
        {showForm ? '❌ Cancelar' : '➕ Agregar Menú'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-hs space-y-5">
          <h2 className="text-sm font-black text-red-500 uppercase tracking-wide">Nuevo Menú</h2>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-xl text-sm font-semibold">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wide">Semana (Lunes)</label>
            <input
              type="date"
              value={semanaInicio}
              onChange={(e) => setSemanaInicio(e.target.value)}
              className="input-hs"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-600 mb-3 uppercase tracking-wide">Menú Semanal por Día y Tiempo</label>
            <div className="space-y-4">
              {DIAS_NOMBRE.map(dia => (
                <div key={dia} className="border-2 border-purple-200 rounded-xl p-4 space-y-3 bg-purple-50">
                  <h4 className="text-sm font-bold text-purple-700 capitalize">{dia.replace('miercoles','miércoles').replace('viernes','viernes')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TIEMPOS_COMIDA.map(tiempo => (
                      <div key={tiempo} className="space-y-2">
                        <label className="text-xs font-bold text-gray-600">{TIEMPOS_LABEL[tiempo]}</label>
                        <input
                          type="text"
                          placeholder={`Ej: Pan con leche`}
                          value={dias[dia][tiempo]?.platillo || ''}
                          onChange={(e) => setDias({
                            ...dias,
                            [dia]: { ...dias[dia], [tiempo]: { ...dias[dia][tiempo], platillo: e.target.value } }
                          })}
                          className="input-hs text-sm"
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-500">¿Aplica a?</p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDias({
                                ...dias,
                                [dia]: { ...dias[dia], [tiempo]: { ...dias[dia][tiempo], niveles: ['todos'] } }
                              })}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                dias[dia][tiempo]?.niveles?.includes('todos')
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Todos
                            </button>
                            {nivelesUnicos.length > 0 && !dias[dia][tiempo]?.niveles?.includes('todos') && (
                              <div className="flex flex-wrap gap-1 w-full">
                                {nivelesUnicos.map(nivel => (
                                  <button
                                    key={nivel.id}
                                    type="button"
                                    onClick={() => setDias({
                                      ...dias,
                                      [dia]: {
                                        ...dias[dia],
                                        [tiempo]: {
                                          ...dias[dia][tiempo],
                                          niveles: dias[dia][tiempo]?.niveles?.includes(nivel.id)
                                            ? dias[dia][tiempo].niveles.filter(n => n !== nivel.id)
                                            : [...(dias[dia][tiempo]?.niveles || []), nivel.id]
                                        }
                                      }
                                    })}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                                      dias[dia][tiempo]?.niveles?.includes(nivel.id)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {nivel.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wide">Texto adicional (opcional)</label>
            <textarea
              value={contenidoTexto}
              onChange={(e) => setContenidoTexto(e.target.value)}
              placeholder="Notas, variaciones, etc."
              rows="3"
              className="input-hs font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wide">Archivo (Imagen/PDF)</label>
            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files[0])}
              accept="image/*,.pdf"
              className="input-hs"
            />
            {archivo && <p className="text-xs text-green-600 font-bold mt-2">✅ {archivo.name}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-red w-full"
          >
            {loading ? '⏳ Guardando...' : '✅ Guardar Menú'}
          </button>
        </form>
      )}

      <div className="card-hs bg-blue-50 border-2 border-blue-200">
        <p className="text-sm font-bold text-blue-700">
          💡 El menú publicado será visible en el portal de papás cuando confirmen el servicio de comida
        </p>
      </div>
    </div>
  );
};

export default ComidaMenu;

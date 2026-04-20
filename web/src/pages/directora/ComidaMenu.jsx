import { useState } from 'react';
import API from '../../services/api';

const ComidaMenu = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [semanaInicio, setSemanaInicio] = useState('');
  const [contenidoTexto, setContenidoTexto] = useState('');
  const [archivo, setArchivo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!semanaInicio) {
        setError('Debes seleccionar una semana');
        return;
      }
      if (!contenidoTexto && !archivo) {
        setError('Debes ingresar contenido o subir un archivo');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('semana_inicio', semanaInicio);
      formData.append('contenido_texto', contenidoTexto);
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
            <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wide">Menú (Texto)</label>
            <textarea
              value={contenidoTexto}
              onChange={(e) => setContenidoTexto(e.target.value)}
              placeholder="Lunes: Desayuno... Comida...&#10;Martes: ..."
              rows="6"
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

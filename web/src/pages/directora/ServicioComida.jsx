import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UtensilsCrossed, ChevronLeft, ChevronRight, ImageOff, CreditCard } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLunes() {
  const hoy = new Date().toLocaleDateString('en-CA');
  const [y, m, d] = hoy.split('-');
  const fecha = new Date(y, parseInt(m) - 1, parseInt(d));
  fecha.setDate(fecha.getDate() - fecha.getDay() + 1);
  return fecha.toLocaleDateString('en-CA');
}

function getRangoSemana(lunesStr) {
  const [y, m, d] = lunesStr.split('-');
  const lunes = new Date(y, parseInt(m) - 1, parseInt(d));
  const viernes = new Date(lunes);
  viernes.setDate(viernes.getDate() + 4);
  return `${lunes.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} al ${viernes.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
}

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

// ─── Modal Subir Menú ─────────────────────────────────────────────────────

function ModalSubirMenu({ semana, onClose, onSaved }) {
  const [contenidoTexto, setContenidoTexto] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const subirMenu = useMutation({
    mutationFn: (formData) => api.post('/comida/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comida-menu', semana] });
      toast.success('✅ Menú guardado');
      setContenidoTexto('');
      setArchivo(null);
      onClose();
      onSaved?.();
    },
    onError: e => {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contenidoTexto && !archivo) {
      setError('Debes ingresar contenido o subir un archivo');
      return;
    }
    const formData = new FormData();
    formData.append('semana_inicio', semana);
    formData.append('contenido_texto', contenidoTexto);
    if (archivo) formData.append('archivo', archivo);
    subirMenu.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h3 className="text-lg font-black text-gray-800">Subir Menú</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && <p className="text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Contenido (Texto) *</label>
            <textarea
              className="input-hs resize-none font-mono text-sm"
              rows={4}
              placeholder="Lunes: Desayuno... Comida...&#10;Martes: ..."
              value={contenidoTexto}
              onChange={e => setContenidoTexto(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Archivo (Imagen/PDF)</label>
            <input
              type="file"
              className="input-hs"
              accept="image/*,.pdf"
              onChange={e => setArchivo(e.target.files?.[0] || null)}
            />
            {archivo && <p className="text-xs text-green-600 font-bold mt-2">✅ {archivo.name}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={subirMenu.isPending} className="flex-1 py-3 rounded-xl bg-hs-purple hover:bg-purple-700 text-white font-black disabled:opacity-50">
              {subirMenu.isPending ? '⏳ Guardando…' : '✅ Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tarjeta Confirmación ─────────────────────────────────────────────────

function TarjetaConfirmacion({ conf, actualizando, onToggle }) {
  const diasLabel = conf.modalidad === 'semana_completa'
    ? 'Semana completa'
    : (conf.dias_seleccionados || [])
        .sort((a, b) => a - b)
        .map(d => DIAS[d] || '')
        .filter(Boolean)
        .join(', ');

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
      conf.pago_verificado ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
    }`}>
      <div className="flex-1">
        <p className="font-black text-gray-800">{conf.nombre_completo}</p>
        <p className="text-sm text-gray-500 font-semibold mt-0.5">
          {diasLabel} · ${conf.monto}
          {' · '}
          {conf.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}
        </p>
      </div>
      <button
        onClick={() => onToggle(conf.id, !conf.pago_verificado)}
        disabled={actualizando === conf.id}
        className={`px-4 py-2 rounded-xl font-black text-sm ml-4 whitespace-nowrap transition-all disabled:opacity-50 ${
          conf.pago_verificado
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        {actualizando === conf.id ? '…' : conf.pago_verificado ? 'Pagado' : 'No pagó'}
      </button>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────

export default function ServicioComida() {
  const [semana, setSemana] = useState(getLunes);
  const [tab, setTab] = useState('pagos'); // 'menu' | 'pagos'
  const [showFormMenu, setShowFormMenu] = useState(false);
  const [actualizando, setActualizando] = useState(null);
  const qc = useQueryClient();

  const { data: menu } = useQuery({
    queryKey: ['comida-menu', semana],
    queryFn: () => api.get('/comida/menu', { params: { semana } }).then(r => r.data),
  });

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['comida-confirmaciones', semana],
    queryFn: () => api.get(`/comida/confirmaciones?semana=${semana}`).then(r => r.data),
    enabled: !!semana,
  });

  const confirmaciones = stats?.confirmaciones || [];

  const cambiarSemana = (delta) => {
    const [y, m, d] = semana.split('-');
    const fecha = new Date(y, parseInt(m) - 1, parseInt(d));
    fecha.setDate(fecha.getDate() + delta * 7);
    setSemana(fecha.toLocaleDateString('en-CA'));
  };

  const handleVerificarPago = async (id, nuevoEstado) => {
    try {
      setActualizando(id);
      if (nuevoEstado) {
        await api.put(`/comida/confirmacion/${id}/verificar-pago`);
        toast.success('✅ Pago verificado');
      } else {
        await api.put(`/comida/confirmacion/${id}/cancelar`);
        toast.success('❌ Comida cancelada');
      }
      refetchStats();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al actualizar');
    } finally {
      setActualizando(null);
    }
  };

  const semanaCompleta = confirmaciones.filter(c => c.modalidad === 'semana_completa');
  const diasEspecificos = confirmaciones.filter(c => c.modalidad === 'dias_especificos');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
            <UtensilsCrossed className="text-hs-purple" size={28} />
            Servicio de Comida
          </h1>
          <p className="text-gray-500 font-semibold mt-1">Menú semanal y control de pagos</p>
        </div>
        {tab === 'menu' && (
          <button onClick={() => setShowFormMenu(true)} className="btn-hs">
            + Subir menú
          </button>
        )}
      </div>

      {/* Week navigator */}
      <div className="card-hs p-4 flex items-center justify-between">
        <button onClick={() => cambiarSemana(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-500 uppercase">Semana del</p>
          <p className="text-lg font-black text-hs-purple">{getRangoSemana(semana)}</p>
        </div>
        <button onClick={() => cambiarSemana(1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="card-hs p-1 flex gap-1">
        {[
          { key: 'pagos', label: 'Pagos del Servicio', icon: CreditCard },
          { key: 'menu',  label: 'Menú',               icon: UtensilsCrossed },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
              tab === key
                ? 'bg-hs-purple text-white'
                : 'text-gray-500 hover:bg-hs-purple/10'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Pagos ─────────────────────────────────────────── */}
      {tab === 'pagos' && (
        <>
          {/* Stats grid — 3 cards */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card-hs p-4 text-center border-l-4 border-hs-purple">
                <p className="text-3xl font-black text-hs-purple">{stats.total_confirmados || 0}</p>
                <p className="text-xs font-bold text-gray-500 mt-2">Confirmados</p>
              </div>
              <div className="card-hs p-4 text-center border-l-4 border-green-500">
                <p className="text-3xl font-black text-green-600">{stats.pagados?.total ?? 0}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">Pagados</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">
                  {stats.pagados?.transferencia ?? 0} transferencia
                </p>
                <p className="text-xs text-gray-400 leading-tight">
                  {stats.pagados?.efectivo ?? 0} efectivo
                </p>
              </div>
              <div className="card-hs p-4 text-center border-l-4 border-red-500">
                <p className="text-3xl font-black text-red-600">{stats.sin_verificar?.total ?? 0}</p>
                <p className="text-xs font-bold text-gray-500 mt-2">Sin pagar</p>
              </div>
            </div>
          )}

          {/* Lista alumnos */}
          <div className="card-hs p-4 space-y-6">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider">Alumnos confirmados</h2>

            {loadingStats ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl" />
                ))}
              </div>
            ) : confirmaciones.length === 0 ? (
              <p className="text-center text-gray-400 font-semibold py-8">Sin confirmaciones esta semana</p>
            ) : (
              <>
                {semanaCompleta.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-2">
                      Semana completa ({semanaCompleta.length})
                    </h3>
                    <div className="space-y-2">
                      {semanaCompleta.map(c => (
                        <TarjetaConfirmacion key={c.id} conf={c} actualizando={actualizando} onToggle={handleVerificarPago} />
                      ))}
                    </div>
                  </div>
                )}
                {diasEspecificos.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-hs-purple uppercase tracking-wider mb-2">
                      Días específicos ({diasEspecificos.length})
                    </h3>
                    <div className="space-y-2">
                      {diasEspecificos.map(c => (
                        <TarjetaConfirmacion key={c.id} conf={c} actualizando={actualizando} onToggle={handleVerificarPago} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ── Tab: Menú ──────────────────────────────────────────── */}
      {tab === 'menu' && (
        <div className="card-hs p-4">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Menú de la semana</h2>
          {menu && (menu.archivo_menu_url || menu.contenido_texto) ? (
            <div className="space-y-3">
              {menu.archivo_menu_url && (
                <img src={menu.archivo_menu_url} alt="Menú" className="rounded-xl w-full object-cover max-h-72" />
              )}
              {menu.contenido_texto && (
                <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap bg-gray-50 rounded-xl p-4">
                  {menu.contenido_texto}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-gray-300">
              <ImageOff size={40} />
              <p className="mt-2 text-sm font-semibold text-gray-400">Sin menú publicado para esta semana</p>
              <button onClick={() => setShowFormMenu(true)} className="btn-hs mt-4">
                + Subir menú
              </button>
            </div>
          )}
        </div>
      )}

      {showFormMenu && (
        <ModalSubirMenu semana={semana} onClose={() => setShowFormMenu(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['comida-menu', semana] })} />
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UtensilsCrossed, ChevronLeft, ChevronRight, ImageOff, CreditCard } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

const DIAS_NOMBRE = ['lunes','martes','miercoles','jueves','viernes'];
const DIAS_LABEL  = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes' };
const TIEMPOS     = ['desayuno','colacion','comida'];
const TIEMPOS_LABEL = { desayuno:'🌅 Desayuno', colacion:'🥤 Colación', comida:'🍽️ Comida' };

function diasVacios() {
  return {
    lunes:     { desayuno:{platillo:'',niveles:['todos']}, colacion:{platillo:'',niveles:['maternal']}, comida:{platillo:'',niveles:['todos']} },
    martes:    { desayuno:{platillo:'',niveles:['todos']}, colacion:{platillo:'',niveles:['maternal']}, comida:{platillo:'',niveles:['todos']} },
    miercoles: { desayuno:{platillo:'',niveles:['todos']}, colacion:{platillo:'',niveles:['maternal']}, comida:{platillo:'',niveles:['todos']} },
    jueves:    { desayuno:{platillo:'',niveles:['todos']}, colacion:{platillo:'',niveles:['maternal']}, comida:{platillo:'',niveles:['todos']} },
    viernes:   { desayuno:{platillo:'',niveles:['todos']}, colacion:{platillo:'',niveles:['maternal']}, comida:{platillo:'',niveles:['todos']} },
  };
}

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

// BUG CORREGIDO: índices 0-4 para Lun-Vie, sin vacío en posición 0
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

// ─── Modal Subir Menú ─────────────────────────────────────────────────────

function ModalSubirMenu({ semana, menuExistente, onClose, onSaved }) {
  const [dias, setDias] = useState(() => {
    if (menuExistente?.dias_menu) {
      // Mezclar con vacíos por si faltan días/tiempos en el menú existente
      const base = diasVacios();
      for (const dia of DIAS_NOMBRE) {
        for (const tiempo of TIEMPOS) {
          if (menuExistente.dias_menu[dia]?.[tiempo]) {
            base[dia][tiempo] = menuExistente.dias_menu[dia][tiempo];
          }
        }
      }
      return base;
    }
    return diasVacios();
  });
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => api.get('/grupos').then(r => r.data),
  });

  const nivelesUnicos = useMemo(() => {
    const vistos = new Set();
    return grupos
      .map(g => g.nivel)
      .filter(n => n && !vistos.has(n) && vistos.add(n))
      .sort();
  }, [grupos]);

  const subirMenu = useMutation({
    mutationFn: (formData) => api.post('/comida/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comida-menu', semana] });
      toast.success('✅ Menú guardado');
      setDias(diasVacios());
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

  // expandido: Set de claves "dia-tiempo" que tienen el selector abierto
  const [expandido, setExpandido] = useState(new Set());

  const toggleExpandido = (dia, tiempo) => {
    const key = `${dia}-${tiempo}`;
    setExpandido(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const setPlatillo = (dia, tiempo, platillo) =>
    setDias(prev => ({ ...prev, [dia]: { ...prev[dia], [tiempo]: { ...prev[dia][tiempo], platillo } } }));

  const elegirNivel = (dia, tiempo, nivel) => {
    const actuales = dias[dia][tiempo].niveles;
    let nuevo;
    if (nivel === 'todos') {
      nuevo = ['todos'];
    } else {
      const sinTodos = actuales.filter(n => n !== 'todos');
      nuevo = sinTodos.includes(nivel)
        ? sinTodos.filter(n => n !== nivel)
        : [...sinTodos, nivel];
      if (!nuevo.length) nuevo = ['todos'];
    }
    setDias(prev => ({ ...prev, [dia]: { ...prev[dia], [tiempo]: { ...prev[dia][tiempo], niveles: nuevo } } }));
    // Colapsar al elegir
    setExpandido(prev => { const next = new Set(prev); next.delete(`${dia}-${tiempo}`); return next; });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hayPlatillo = DIAS_NOMBRE.some(d => TIEMPOS.some(t => dias[d][t].platillo.trim()));
    if (!hayPlatillo && !archivo) {
      setError('Ingresa al menos un platillo o sube un archivo');
      return;
    }
    const formData = new FormData();
    formData.append('semana_inicio', semana);
    formData.append('dias_menu', JSON.stringify(dias));
    if (archivo) formData.append('archivo', archivo);
    subirMenu.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h3 className="text-lg font-black text-gray-800">📋 Capturar Menú Semanal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && <p className="text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-lg">{error}</p>}

          {DIAS_NOMBRE.map(dia => (
            <div key={dia} className="border-2 border-purple-100 rounded-xl p-4 space-y-3 bg-hs-purple/10/40">
              <h4 className="text-sm font-black text-hs-purple-dark">{DIAS_LABEL[dia]}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIEMPOS.map(tiempo => (
                  <div key={tiempo} className="space-y-1.5">
                    <p className="text-xs font-bold text-gray-600">{TIEMPOS_LABEL[tiempo]}</p>
                    <input
                      type="text"
                      placeholder="Platillo…"
                      value={dias[dia][tiempo].platillo}
                      onChange={e => setPlatillo(dia, tiempo, e.target.value)}
                      className="input-hs text-sm py-1.5"
                    />
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const key = `${dia}-${tiempo}`;
                        const abierto = expandido.has(key);
                        const nivActuales = dias[dia][tiempo].niveles;
                        const etiqueta = nivActuales.includes('todos')
                          ? 'Todos'
                          : nivActuales.map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(', ');
                        if (!abierto) return (
                          <button type="button"
                            onClick={() => toggleExpandido(dia, tiempo)}
                            className="px-2 py-0.5 rounded-lg text-xs font-bold bg-hs-purple-dark text-white hover:bg-hs-purple-dark transition-all">
                            {etiqueta} ▾
                          </button>
                        );
                        return (
                          <>
                            <button type="button"
                              onClick={() => elegirNivel(dia, tiempo, 'todos')}
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${nivActuales.includes('todos') ? 'bg-hs-purple-dark text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                              Todos
                            </button>
                            {nivelesUnicos.map(nivel => (
                              <button key={nivel} type="button"
                                onClick={() => elegirNivel(dia, tiempo, nivel.toLowerCase())}
                                className={`px-2 py-0.5 rounded-lg text-xs font-bold capitalize transition-all ${nivActuales.includes(nivel.toLowerCase()) ? 'bg-hs-blue-dark text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                {nivel}
                              </button>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Archivo adicional (Imagen/PDF)</label>
            <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-hs-purple/10 file:text-hs-purple-dark hover:file:bg-purple-100" accept="image/*,.pdf"
              onChange={e => setArchivo(e.target.files?.[0] || null)} />
            {archivo && <p className="text-xs text-green-600 font-bold mt-1">✅ {archivo.name}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={subirMenu.isPending} className="flex-1 py-3 rounded-xl bg-hs-purple hover:bg-hs-purple-dark text-white font-black disabled:opacity-50">
              {subirMenu.isPending ? '⏳ Guardando…' : '✅ Guardar menú'}
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
        <div className="flex items-center gap-2">
          <p className="font-black text-gray-800">{conf.nombre_completo}</p>
          {conf.nivel_nombre && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-hs-blue-dark">
              {conf.nivel_nombre}
            </span>
          )}
        </div>
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
  const [filtroNivel, setFiltroNivel] = useState('todos');
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

  // Niveles únicos presentes en los datos, ordenados
  const nivelesDisponibles = useMemo(() => {
    const vistos = new Set();
    return confirmaciones
      .map(c => c.nivel_nombre)
      .filter(n => n && !vistos.has(n) && vistos.add(n));
  }, [confirmaciones]);

  const confirmacionesFiltradas = filtroNivel === 'todos'
    ? confirmaciones
    : confirmaciones.filter(c => c.nivel_nombre === filtroNivel);

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

  const semanaCompleta = confirmacionesFiltradas.filter(c => c.modalidad === 'semana_completa');
  const diasEspecificos = confirmacionesFiltradas.filter(c => c.modalidad === 'dias_especificos');

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
              <div className="card-hs p-4 text-center border-l-4 border-hs-green">
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

          {/* Totalizados en pesos */}
          {confirmacionesFiltradas.length > 0 && (
            <div className="card-hs p-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                📊 Resumen de pagos {filtroNivel !== 'todos' ? `— ${filtroNivel}` : ''}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-hs-blue/10 border-2 border-hs-blue/30 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-hs-blue-dark">
                    ${confirmacionesFiltradas.filter(c => c.pago_verificado && c.metodo_pago === 'transferencia').reduce((s, c) => s + parseFloat(c.monto), 0)}
                  </p>
                  <p className="text-xs font-bold text-gray-500 mt-1">💳 Transferencia</p>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-yellow-600">
                    ${confirmacionesFiltradas.filter(c => c.pago_verificado && c.metodo_pago === 'efectivo').reduce((s, c) => s + parseFloat(c.monto), 0)}
                  </p>
                  <p className="text-xs font-bold text-gray-500 mt-1">💵 Efectivo</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-green-600">
                    ${confirmacionesFiltradas.filter(c => c.pago_verificado).reduce((s, c) => s + parseFloat(c.monto), 0)}
                  </p>
                  <p className="text-xs font-bold text-gray-500 mt-1">💰 Gran total</p>
                </div>
              </div>
            </div>
          )}

          {/* Filtro por nivel */}
          {nivelesDisponibles.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroNivel('todos')}
                className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                  filtroNivel === 'todos' ? 'bg-hs-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({confirmaciones.length})
              </button>
              {nivelesDisponibles.map(nivel => (
                <button
                  key={nivel}
                  onClick={() => setFiltroNivel(nivel)}
                  className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                    filtroNivel === nivel ? 'bg-hs-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {nivel} ({confirmaciones.filter(c => c.nivel_nombre === nivel).length})
                </button>
              ))}
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
          {menu && (menu.archivo_menu_url || menu.contenido_texto || menu.dias_menu) ? (
            <div className="space-y-3">
              {menu.archivo_menu_url && (
                <img
                  src={menu.archivo_menu_url.match(/\.pdf$/i) ? menu.archivo_menu_url.replace(/\.pdf$/i, '.jpg') : menu.archivo_menu_url}
                  alt="Menú semanal"
                  className="rounded-xl w-full object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(
                    menu.archivo_menu_url.match(/\.pdf$/i) ? menu.archivo_menu_url.replace(/\.pdf$/i, '.jpg') : menu.archivo_menu_url,
                    '_blank'
                  )}
                />
              )}
              {menu.dias_menu ? (
                <div className="space-y-2">
                  {DIAS_NOMBRE.map(dia => (
                    <div key={dia} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-black text-hs-purple-dark uppercase mb-2">{DIAS_LABEL[dia]}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {TIEMPOS.map(t => menu.dias_menu[dia]?.[t]?.platillo ? (
                          <div key={t}>
                            <p className="text-xs font-bold text-gray-400">{TIEMPOS_LABEL[t]}</p>
                            <p className="text-sm font-semibold text-gray-800">{menu.dias_menu[dia][t].platillo}</p>
                            {!menu.dias_menu[dia][t].niveles?.includes('todos') && (
                              <p className="text-xs text-purple-500 font-semibold capitalize">{menu.dias_menu[dia][t].niveles?.join(', ')}</p>
                            )}
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : menu.contenido_texto && (
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
        <ModalSubirMenu semana={semana} menuExistente={menu} onClose={() => setShowFormMenu(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['comida-menu', semana] })} />
      )}
    </div>
  );
}

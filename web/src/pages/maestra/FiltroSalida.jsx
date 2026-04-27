import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────────────────

function horaTexto(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City',
  });
}

function esSalidaAnticipada(horaSalidaNormal) {
  if (!horaSalidaNormal) return false;
  const ahora = new Date();
  const [h, m] = horaSalidaNormal.split(':').map(Number);
  const limite = new Date();
  limite.setHours(h, m, 0, 0);
  return ahora < limite;
}

function esSalidaTardia(alumno, horaInicioCobro) {
  if (!horaInicioCobro || alumno.tiene_extension) return false;
  const ahora = new Date();
  const [h, m] = horaInicioCobro.split(':').map(Number);
  const limite = new Date();
  limite.setHours(h, m, 0, 0);
  return ahora >= limite;
}

// ── Modal salida ───────────────────────────────────────────────────────────────

function ModalSalida({ alumno, horaSalidaNormal, horaInicioCobro, onClose, onSuccess }) {
  const queryClient = useQueryClient();

  // Construir opciones para el selector
  const opciones = [
    ...alumno.padres.map(p => ({ tipo: 'padre', id: p.id, label: `${p.nombre} (${p.tipo})` })),
    ...alumno.autorizados.map(a => ({ tipo: 'autorizado', id: a.id, label: `${a.nombre} (${a.parentesco})` })),
    { tipo: 'otro', id: 'otro', label: '👤 Otro (escribir nombre)' },
  ];

  // Estado Paso 1 — Quién recoge
  const [paso, setPaso] = useState(1);
  const [seleccion, setSeleccion] = useState(opciones[0]?.id || 'otro');
  const [nombreOtro, setNombreOtro] = useState('');
  const [motivoAnticipada, setMotivoAnticipada] = useState('');

  // Estado Paso 2 — Checklist sanitario
  const [panialLimpio, setPanialLimpio] = useState(false);
  const [pertenenciasOk, setPertenenciasOk] = useState(false);
  const [estadoFisicoOk, setEstadoFisicoOk] = useState(false);
  const [notasSanitarias, setNotasSanitarias] = useState('');
  const [entregaConforme, setEntregaConforme] = useState(false);

  // Alumnos con extensión tienen horario hasta hora_salida_extension (ej 18:00), no la normal
  const horaLimite = alumno.tiene_extension && alumno.hora_salida_extension
    ? alumno.hora_salida_extension
    : horaSalidaNormal;
  const anticipada = esSalidaAnticipada(horaLimite);
  const tardia = esSalidaTardia(alumno, horaInicioCobro);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/asistencia/salida', data).then(r => r.data),
    onSuccess: (data) => {
      if (!data.autorizado) {
        toast.error(`🚨 ALERTA — ${alumno.nombre_completo.split(' ')[0]} retirado por persona NO autorizada`);
      } else if (data.es_salida_tardia && data.pago_salida_tardia) {
        toast.success(`⏰ Salida registrada — Recargo $${data.pago_salida_tardia.monto_total} generado`, {
          duration: 5000
        });
      } else {
        toast.success(`🚪 Salida registrada — ${alumno.nombre_completo.split(' ')[0]}`);
      }
      queryClient.invalidateQueries({ queryKey: ['filtro-salida'] });
      onSuccess();
    },
    onError: (error) => {
      const msg = error?.response?.data?.error || 'Error al registrar salida';
      toast.error(msg);
    },
  });

  const handleIrPaso2 = () => {
    const opcion = opciones.find(o => o.id === seleccion);

    // Validación Paso 1
    if (opcion?.tipo === 'otro' && !nombreOtro.trim()) {
      toast.error('Escribe el nombre de quien recoge');
      return;
    }

    if (anticipada && !motivoAnticipada.trim()) {
      toast.error('Escribe el motivo de la salida anticipada');
      return;
    }

    setPaso(2);
  };

  const handleSubmit = () => {
    const opcion = opciones.find(o => o.id === seleccion);
    const payload = { alumno_id: alumno.id };

    if (opcion?.tipo === 'padre') {
      payload.padre_id = opcion.id;
    } else if (opcion?.tipo === 'autorizado') {
      payload.persona_autorizada_id = opcion.id;
    } else {
      payload.nombre_quien_recoge = nombreOtro.trim();
    }

    // Campos de salida anticipada
    if (anticipada) {
      payload.es_anticipada = true;
      payload.motivo_salida = motivoAnticipada.trim();
    }

    // Campos sanitarios
    payload.panial_limpio = panialLimpio;
    payload.pertenencias_ok = pertenenciasOk;
    payload.estado_fisico_ok = estadoFisicoOk;
    if (notasSanitarias.trim()) {
      payload.notas_sanitarias = notasSanitarias.trim();
    }
    payload.entrega_conforme = entregaConforme;

    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <AvatarAlumno alumno={alumno} size="md" />
          <div className="flex-1">
            <p className="font-black text-gray-800">{alumno.nombre_completo}</p>
            <p className="text-xs text-gray-400 font-semibold">
              {alumno.grupo_nombre}
              {alumno.hora_entrada && (
                <> · Entró a las {horaTexto(alumno.hora_entrada)}</>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Indicador de progreso */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
            ${paso === 1 ? 'bg-hs-purple text-white' : 'bg-green-500 text-white'}`}>
            1
          </div>
          <div className="flex-1 h-1 bg-gray-200 rounded overflow-hidden">
            <div className={`h-1 bg-hs-purple transition-all ${paso === 2 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
            ${paso === 2 ? 'bg-hs-purple text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
        </div>

        {paso === 1 ? (
          // ─── PASO 1: Quién recoge ─────────────────────────────────────────
          <div className="p-5 space-y-4">
            {/* Badge extensión */}
            {alumno.tiene_extension && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-sm">⏳</span>
                <p className="text-xs font-bold text-blue-700">
                  Extensión de horario · Salida hasta {alumno.hora_salida_extension || '18:00'}
                </p>
              </div>
            )}

            {/* Badge salida tardía */}
            {tardia && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-400 rounded-2xl">
                <AlertTriangle size={22} className="text-red-600 shrink-0" />
                <div>
                  <p className="font-black text-red-700 text-sm">SALIDA TARDÍA</p>
                  <p className="text-xs text-red-600 font-semibold">
                    Se generará un recargo por salida fuera de horario.
                  </p>
                </div>
              </div>
            )}

            {/* Alerta salida anticipada */}
            {anticipada && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl">
                <AlertTriangle size={22} className="text-amber-600 shrink-0" />
                <div>
                  <p className="font-black text-amber-700 text-sm">⚠️ SALIDA ANTICIPADA</p>
                  <p className="text-xs text-amber-600 font-semibold">
                    El horario de salida es a las {horaLimite}. ¿Confirmar salida anticipada?
                  </p>
                </div>
              </div>
            )}

            {/* Motivo salida anticipada */}
            {anticipada && (
              <div>
                <p className="text-xs font-black text-amber-700 uppercase mb-2">Motivo de salida anticipada *</p>
                <textarea
                  rows={2}
                  placeholder="Describe el motivo de la salida anticipada..."
                  value={motivoAnticipada}
                  onChange={e => setMotivoAnticipada(e.target.value)}
                  className="w-full border-2 border-amber-300 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            )}

            {/* Hora actual */}
            <div className="flex items-center gap-2 text-sm text-gray-500 font-semibold">
              <Clock size={15} />
              <span>
                Hora de salida: {new Date().toLocaleTimeString('es-MX', {
                  hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City',
                })}
              </span>
            </div>

            {/* Selector quien recoge */}
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">¿Quién recoge?</p>
              <div className="space-y-2">
                {opciones.map(op => (
                  <button key={op.id} type="button"
                    onClick={() => setSeleccion(op.id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 text-sm font-bold text-left transition-all
                      ${seleccion === op.id
                        ? 'border-hs-purple bg-purple-50 text-hs-purple'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      ${seleccion === op.id ? 'border-hs-purple bg-hs-purple' : 'border-gray-300'}`}>
                      {seleccion === op.id && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input nombre si "otro" */}
            {seleccion === 'otro' && (
              <input
                type="text"
                placeholder="Nombre completo de quien recoge"
                value={nombreOtro}
                onChange={e => setNombreOtro(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-hs-purple transition-colors"
              />
            )}
          </div>
        ) : (
          // ─── PASO 2: Checklist sanitario ─────────────────────────────────────
          <div className="p-5 space-y-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Checklist de salida</p>

            {/* Pañal — solo si alumno.usa_panial */}
            {alumno.usa_panial && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={panialLimpio}
                  onChange={e => setPanialLimpio(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 accent-hs-purple" />
                <span className="font-semibold text-gray-700">🧷 Pañal limpio al salir</span>
              </label>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={pertenenciasOk}
                onChange={e => setPertenenciasOk(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 accent-hs-purple" />
              <span className="font-semibold text-gray-700">🎒 Pertenencias completas</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={estadoFisicoOk}
                onChange={e => setEstadoFisicoOk(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 accent-hs-purple" />
              <span className="font-semibold text-gray-700">💚 Estado físico normal</span>
            </label>

            <textarea rows={2} placeholder="Observaciones (opcional)..."
              value={notasSanitarias}
              onChange={e => setNotasSanitarias(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-hs-purple resize-none" />

            <label className="flex items-center gap-3 cursor-pointer font-bold">
              <input type="checkbox" checked={entregaConforme}
                onChange={e => setEntregaConforme(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 accent-hs-purple" />
              <span>✅ Entrega conforme</span>
            </label>
          </div>
        )}

        {/* Botones */}
        <div className="px-5 pb-5 flex gap-3">
          {paso === 2 && (
            <button onClick={() => setPaso(1)}
              className="px-4 py-4 rounded-2xl font-black text-gray-600 border-2 border-gray-200 hover:bg-gray-50">
              ← Atrás
            </button>
          )}
          <button onClick={paso === 1 ? handleIrPaso2 : handleSubmit} disabled={mutation.isPending}
            className={`${paso === 2 ? 'flex-1' : 'w-full'} py-4 rounded-2xl font-black text-white text-lg transition-all disabled:opacity-50
              ${anticipada && paso === 1 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-hs-purple hover:bg-purple-700'}`}>
            {mutation.isPending ? 'Registrando...' : paso === 1 ? '→ Siguiente' : '🚪 Confirmar Salida'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta alumno ─────────────────────────────────────────────────────────────

function TarjetaAlumno({ alumno, onTap }) {
  const yaSalio = !!alumno.salida_id;
  return (
    <div
      onClick={() => !yaSalio && onTap(alumno)}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
        ${yaSalio
          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-default'
          : 'border-orange-200 bg-white hover:border-orange-400 hover:shadow-md cursor-pointer active:scale-95'}`}
    >
      <AvatarAlumno alumno={alumno} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-800 truncate">{alumno.nombre_completo}</p>
        <p className="text-xs text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
          {alumno.hora_entrada && (
            <><Clock size={11} /> Entró {horaTexto(alumno.hora_entrada)}</>
          )}
          {alumno.tiene_extension && (
            <span className="ml-1 text-blue-500 font-bold">⏳ Ext.</span>
          )}
        </p>
      </div>
      {yaSalio ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black bg-gray-100 text-gray-500">
          ✅ {horaTexto(alumno.hora_salida)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black bg-orange-100 text-orange-700">
          🏫 En escuela
        </span>
      )}
    </div>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────────

export default function FiltroSalida() {
  const hoy = new Date().toLocaleDateString('en-CA');

  const ultimoDiaHabil = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  };

  const [fecha, setFecha] = useState(ultimoDiaHabil);
  const soloLectura = fecha < hoy;
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const irDia = (delta) => {
    const d = new Date(fecha + 'T12:00:00');
    do { d.setDate(d.getDate() + delta); } while (d.getDay() === 0 || d.getDay() === 6);
    const nueva = d.toLocaleDateString('en-CA');
    if (nueva <= hoy) setFecha(nueva);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['filtro-salida', fecha],
    queryFn: () => api.get(`/asistencia/filtro-salida?fecha=${fecha}`).then(r => r.data),
    refetchInterval: soloLectura ? false : 20000,
  });

  const grupos = data?.grupos ?? [];
  const horaSalidaNormal = data?.hora_salida_normal || '15:00';
  const horaInicioCobro = data?.hora_inicio_cobro_extension || '15:06';
  const anticipada = esSalidaAnticipada(horaSalidaNormal);

  const todosAlumnos = grupos.flatMap(g => g.alumnos);
  const enEscuela = todosAlumnos.filter(a => !a.salida_id).length;
  const yaSalieron = todosAlumnos.filter(a => !!a.salida_id).length;

  const q = busqueda.toLowerCase().trim();
  const gruposFiltrados = q
    ? grupos.map(g => ({ ...g, alumnos: g.alumnos.filter(a => a.nombre_completo.toLowerCase().includes(q)) }))
            .filter(g => g.alumnos.length > 0)
    : grupos;

  const fechaFormatted = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Banner solo lectura */}
      {soloLectura && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-xl">📋</span>
          <p className="text-sm font-bold text-blue-800">Consultando día anterior — solo lectura</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => irDia(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
          disabled={fecha <= '2024-01-01'}
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Registro de Salida 🚪</h1>
          <p className="text-gray-500 font-semibold capitalize mt-0.5">{fechaFormatted}</p>
        </div>
        <button
          onClick={() => irDia(1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
          disabled={fecha >= hoy}
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Banner salida anticipada (global) */}
      {!isLoading && anticipada && enEscuela > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl">
          <AlertTriangle size={22} className="text-amber-600 shrink-0" />
          <p className="font-black text-amber-700 text-sm">
            ⚠️ Horario normal de salida: <span className="font-mono">{horaSalidaNormal}</span> — cualquier salida ahora es anticipada
          </p>
        </div>
      )}

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card-hs p-4 text-center">
            <p className="text-3xl font-black text-orange-500">{enEscuela}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">En escuela</p>
          </div>
          <div className="card-hs p-4 text-center">
            <p className="text-3xl font-black text-green-600">{yaSalieron}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Ya salieron</p>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <input
        type="search"
        placeholder="🔍 Buscar alumno..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-hs-purple transition-colors"
      />

      {/* Lista por grupo */}
      {isLoading ? (
        <div className="card-hs p-12 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-hs-purple border-t-transparent rounded-full" />
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="card-hs p-10 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-black text-gray-600">Todos los alumnos ya salieron</p>
        </div>
      ) : (
        gruposFiltrados.map(grupo => {
          const pendientes = grupo.alumnos.filter(a => !a.salida_id);
          const salidos    = grupo.alumnos.filter(a => !!a.salida_id);
          return (
            <section key={grupo.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: grupo.color_hex || '#F97316' }} />
                <h2 className="font-black text-gray-700 text-sm uppercase tracking-wider">{grupo.nombre}</h2>
                <span className="text-xs font-bold text-gray-400">
                  {salidos.length}/{grupo.alumnos.length} salieron
                </span>
              </div>
              <div className="space-y-2">
                {pendientes.map(a => <TarjetaAlumno key={a.id} alumno={a} onTap={soloLectura ? () => {} : setAlumnoSeleccionado} />)}
                {salidos.map(a => <TarjetaAlumno key={a.id} alumno={a} onTap={() => {}} />)}
              </div>
            </section>
          );
        })
      )}

      {alumnoSeleccionado && (
        <ModalSalida
          alumno={alumnoSeleccionado}
          horaSalidaNormal={horaSalidaNormal}
          horaInicioCobro={horaInicioCobro}
          onClose={() => setAlumnoSeleccionado(null)}
          onSuccess={() => setAlumnoSeleccionado(null)}
        />
      )}
    </div>
  );
}

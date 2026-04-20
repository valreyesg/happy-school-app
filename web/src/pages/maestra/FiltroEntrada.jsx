import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Thermometer, Clock, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function esCumpleanos(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date().toLocaleDateString('en-CA');
  const [, mesHoy, diaHoy] = hoy.split('-');
  const fn = new Date(fecha_nacimiento.substring(0, 10) + 'T12:00:00');
  return fn.getMonth() + 1 === parseInt(mesHoy) && fn.getDate() === parseInt(diaHoy);
}

const ESTADO_BADGE = {
  presente:   { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅', label: 'Presente' },
  retardo:    { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⏰', label: 'Retardo'  },
  no_entrada: { bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚫', label: 'No entró' },
  ausente:    { bg: 'bg-gray-100',   text: 'text-gray-400',   emoji: '⬜', label: 'Pendiente'},
};

function BadgeEstado({ estado }) {
  const cfg = ESTADO_BADGE[estado] || ESTADO_BADGE.ausente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black ${cfg.bg} ${cfg.text}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── Modal checklist ───────────────────────────────────────────────────────────

const CHECKS_DEFAULT = {
  uñas_cortadas: false, sin_lagañas: false,
  sin_fiebre: true, temperatura: '',
  sin_sintomas: true, sintomas_notas: '',
  panial_limpio: false, trae_uniforme: false,
  trae_bata: false, trae_termo: false, agua_suficiente: false,
};

function ModalEntrada({ alumno, onClose, onSuccess }) {
  const [form, setForm] = useState(CHECKS_DEFAULT);
  const [confirmacionComida, setConfirmacionComida] = useState(null);
  const [cargandoComida, setCargandoComida] = useState(false);
  const [pagoVerificado, setPagoVerificado] = useState(false);
  const queryClient = useQueryClient();

  // Cargar confirmación de comida al abrir modal
  useEffect(() => {
    const cargarConfirmacionComida = async () => {
      try {
        setCargandoComida(true);
        const hoy = new Date().toLocaleDateString('en-CA');
        const [año, mes, dia] = hoy.split('-');
        const lunes = new Date(año, parseInt(mes) - 1, parseInt(dia));
        lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
        const semanaInicio = lunes.toISOString().split('T')[0];

        const res = await api.get(`/comida/confirmacion/${alumno.id}?semana=${semanaInicio}`);
        if (res.data) {
          setConfirmacionComida(res.data);
          setPagoVerificado(res.data.pago_verificado || false);
        }
      } catch (e) {
        // Sin confirmación, no mostrar nada
      } finally {
        setCargandoComida(false);
      }
    };

    if (alumno?.id) {
      cargarConfirmacionComida();
    }
  }, [alumno?.id]);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/asistencia/entrada', data).then(r => r.data),
    onSuccess: (data) => {
      toast.success(
        data.puede_entrar
          ? data.estado === 'retardo'
            ? `⏰ Retardo — ${alumno.nombre_completo.split(' ')[0]}`
            : `✅ Entrada — ${alumno.nombre_completo.split(' ')[0]}`
          : `🚫 No puede entrar — ${data.motivo}`
      );
      queryClient.invalidateQueries({ queryKey: ['filtro-entrada'] });
      onSuccess();
    },
    onError: () => toast.error('Error al registrar entrada'),
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    // Si hay confirmación de comida, actualizar estado de pago
    if (confirmacionComida && !cargandoComida) {
      try {
        if (pagoVerificado) {
          await api.put(`/comida/confirmacion/${confirmacionComida.id}/verificar-pago`);
          toast.success('✅ Pago de comida verificado');
        } else if (confirmacionComida.pago_verificado) {
          // Si estaba verificado y ahora lo desmarcamos, marcar como cancelado
          await api.put(`/comida/confirmacion/${confirmacionComida.id}/cancelar`);
          toast.success('❌ Comida cancelada');
        }
      } catch (e) {
        toast.error('Error actualizando comida');
      }
    }

    mutation.mutate({
      alumno_id: alumno.id,
      ...form,
      temperatura: parseFloat(form.temperatura) || 36.5,
      qr_escaneado: alumno.qr_escaneado ?? false,
    });
  };

  const CheckRow = ({ field, label, emoji }) => (
    <button type="button" onClick={() => set(field, !form[field])}
      className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
        ${form[field] ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500'}`}>
      <span className="text-xl">{form[field] ? '✅' : '⬜'}</span>
      <span>{emoji} {label}</span>
    </button>
  );

  const CheckRowInv = ({ field, label, emoji }) => (
    <button type="button" onClick={() => set(field, !form[field])}
      className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
        ${!form[field] ? 'border-red-400 bg-red-50 text-red-700' : 'border-green-400 bg-green-50 text-green-700'}`}>
      <span className="text-xl">{form[field] ? '✅' : '🚨'}</span>
      <span>{emoji} {label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <AvatarAlumno alumno={alumno} size="md" />
          <div className="flex-1">
            <p className="font-black text-gray-800">{alumno.nombre_completo}</p>
            <p className="text-xs text-gray-400 font-semibold">{alumno.grupo_nombre} · Filtro de entrada</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {esCumpleanos(alumno.fecha_nacimiento) && (
          <div className="mx-5 mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl text-center">
            <p className="font-black text-yellow-700 text-sm">🎂 ¡Hoy es el cumpleaños de {alumno.nombre_completo.split(' ')[0]}! 🎈</p>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Salud</p>
          <CheckRowInv field="sin_fiebre" label="Sin fiebre" emoji="🌡️" />
          {!form.sin_fiebre && (
            <div className="flex items-center gap-2 px-3">
              <Thermometer size={16} className="text-red-500" />
              <input type="number" step="0.1" min="35" max="42" placeholder="Temperatura °C"
                value={form.temperatura} onChange={e => set('temperatura', e.target.value)}
                className="flex-1 border-2 border-red-300 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-red-500" />
            </div>
          )}
          <CheckRowInv field="sin_sintomas" label="Sin síntomas" emoji="🤧" />
          {!form.sin_sintomas && (
            <textarea placeholder="Describe los síntomas..." value={form.sintomas_notas}
              onChange={e => set('sintomas_notas', e.target.value)} rows={2}
              className="w-full border-2 border-yellow-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none resize-none" />
          )}

          <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Higiene</p>
          <CheckRow field="uñas_cortadas" label="Uñas cortadas" emoji="✂️" />
          <CheckRow field="sin_lagañas"   label="Sin lagañas"   emoji="👁️" />
          {alumno.usa_panial && <CheckRow field="panial_limpio" label="Pañal limpio" emoji="👶🏻" />}

          <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Materiales</p>
          <CheckRow field="trae_uniforme"   label="Uniforme"        emoji="👕" />
          <CheckRow field="trae_bata"       label="Bata"            emoji="🥼" />
          <CheckRow field="trae_termo"      label="Termo"           emoji="🧴" />
          <CheckRow field="agua_suficiente" label="Agua suficiente" emoji="💧" />

          {/* Sección Comida (solo si confirmó) */}
          {confirmacionComida && (
            <>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Comida</p>
              <button
                type="button"
                onClick={() => setPagoVerificado(!pagoVerificado)}
                className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
                  ${pagoVerificado ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'}`}
              >
                <span className="text-xl">{pagoVerificado ? '✅' : '❌'}</span>
                <span>{pagoVerificado ? 'Pago verificado' : 'No pagó - Cancelar comida'}</span>
              </button>
              <p className="text-xs text-gray-500 px-2">
                {confirmacionComida.modalidad === 'semana_completa'
                  ? '📋 Semana completa ($250)'
                  : `📋 ${confirmacionComida.dias_seleccionados?.length} días ($${confirmacionComida.monto})`
                }
                {confirmacionComida.metodo_pago === 'transferencia' && ' | 💳 Transferencia'}
                {confirmacionComida.metodo_pago === 'efectivo' && ' | 💵 Efectivo'}
              </p>
            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={mutation.isPending}
            className="w-full py-4 rounded-2xl font-black text-white text-lg bg-hs-purple hover:bg-purple-700 disabled:opacity-50 transition-all">
            {mutation.isPending ? 'Registrando...' : '✅ Registrar Entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta alumno ─────────────────────────────────────────────────────────────

function TarjetaAlumno({ alumno, onTap }) {
  const registrado = alumno.estado_asistencia !== 'ausente';
  const cumple = esCumpleanos(alumno.fecha_nacimiento);

  return (
    <div
      onClick={() => !registrado && onTap(alumno)}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
        ${registrado
          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-default'
          : 'border-hs-purple/30 bg-white hover:border-hs-purple hover:shadow-md cursor-pointer active:scale-95'}`}
    >
      <AvatarAlumno alumno={alumno} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-black text-gray-800 truncate">{alumno.nombre_completo}</p>
          {cumple && <span className="text-base" title="¡Cumpleaños hoy!">🎂</span>}
        </div>
        {alumno.hora_entrada && (
          <p className="text-xs text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
            <Clock size={11} />
            {new Date(alumno.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            {alumno.numero_retardo_mes > 0 && (
              <span className="text-yellow-600 ml-1">Retardo #{alumno.numero_retardo_mes}</span>
            )}
          </p>
        )}
      </div>
      <BadgeEstado estado={alumno.estado_asistencia} />
    </div>
  );
}

// ── QR Scanner ────────────────────────────────────────────────────────────────

function QRScannerModal({ onScan, onClose }) {
  const qrRef = useRef(null);
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    const scannerId = 'qr-filtro-entrada';
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        scanner.stop().catch(() => {});
        onScan(decodedText.trim());
      },
      () => {}
    ).catch(() => {
      toast.error('No se pudo acceder a la cámara');
      onClose();
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-black text-gray-800">📱 Escanear QR del alumno</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div id="qr-filtro-entrada" ref={qrRef} className="w-full" />
        <p className="text-center text-xs text-gray-400 font-semibold py-3 px-5">
          Apunta la cámara al código QR de la credencial del alumno
        </p>
      </div>
    </div>
  );
}

// ── Reloj en tiempo real ──────────────────────────────────────────────────────

function RelojHora() {
  const [hora, setHora] = useState(() =>
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  useEffect(() => {
    const t = setInterval(() =>
      setHora(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    , 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-2xl font-black text-hs-purple tabular-nums">{hora}</span>;
}

// ── Vista principal ────────────────────────────────────────────────────────────

export default function FiltroEntrada() {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [showQR, setShowQR] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['filtro-entrada'],
    queryFn: () => api.get('/asistencia/filtro-entrada').then(r => r.data),
    refetchInterval: 20000,
  });

  const grupos = data?.grupos ?? [];

  const handleQRScan = useCallback((alumnoId) => {
    setShowQR(false);
    const todos = grupos.flatMap(g => g.alumnos);
    const alumno = todos.find(a => a.id === alumnoId);
    if (!alumno) { toast.error('Alumno no encontrado'); return; }
    if (alumno.estado_asistencia !== 'ausente') {
      toast(`${alumno.nombre_completo.split(' ')[0]} ya fue registrado ✅`);
      return;
    }
    setAlumnoSeleccionado({ ...alumno, qr_escaneado: true });
  }, [grupos]);

  // Stats globales
  const todosAlumnos = grupos.flatMap(g => g.alumnos);
  const totalPendientes = todosAlumnos.filter(a => a.estado_asistencia === 'ausente').length;
  const totalPresentes  = todosAlumnos.filter(a => ['presente', 'retardo'].includes(a.estado_asistencia)).length;
  const cumpleHoy       = todosAlumnos.filter(a => esCumpleanos(a.fecha_nacimiento));

  // Filtro búsqueda
  const q = busqueda.toLowerCase().trim();
  const gruposFiltrados = q
    ? grupos.map(g => ({ ...g, alumnos: g.alumnos.filter(a => a.nombre_completo.toLowerCase().includes(q)) }))
            .filter(g => g.alumnos.length > 0)
    : grupos;

  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Filtro de Entrada 🚪</h1>
          <p className="text-gray-500 font-semibold capitalize mt-0.5">{hoy}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RelojHora />
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-hs-purple text-white font-bold text-sm hover:bg-purple-700 transition-all shadow-sm"
          >
            <QrCode size={16} />
            Escanear QR
          </button>
        </div>
      </div>

      {/* Banner cumpleaños */}
      {cumpleHoy.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">🎂</span>
          <div>
            <p className="font-black text-yellow-800 text-sm">
              ¡Hoy cumple{cumpleHoy.length > 1 ? 'n' : ''} {cumpleHoy.map(a => a.nombre_completo.split(' ')[0]).join(' y ')}!
            </p>
            <p className="text-xs text-yellow-600 font-semibold">Recuerda felicitarl{cumpleHoy.length > 1 ? 'os' : 'o/a'} al entrar 🎈</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card-hs p-4 text-center">
            <p className="text-3xl font-black text-green-600">{totalPresentes}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Registrados</p>
          </div>
          <div className="card-hs p-4 text-center">
            <p className="text-3xl font-black text-hs-purple">{totalPendientes}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Pendientes</p>
          </div>
          <div className="card-hs p-4 text-center">
            <p className="text-3xl font-black text-gray-700">{todosAlumnos.length}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Total</p>
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
          <p className="text-4xl mb-2">🏫</p>
          <p className="font-black text-gray-600">Sin alumnos activos</p>
        </div>
      ) : (
        gruposFiltrados.map(grupo => {
          const pendientes  = grupo.alumnos.filter(a => a.estado_asistencia === 'ausente');
          const registrados = grupo.alumnos.filter(a => a.estado_asistencia !== 'ausente');
          return (
            <section key={grupo.id}>
              {/* Cabecera grupo */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: grupo.color_hex || '#805AD5' }} />
                <h2 className="font-black text-gray-700 text-sm uppercase tracking-wider">{grupo.nombre}</h2>
                <span className="text-xs font-bold text-gray-400">
                  {registrados.length}/{grupo.alumnos.length} registrados
                </span>
              </div>

              <div className="space-y-2">
                {/* Pendientes primero */}
                {pendientes.map(a => (
                  <TarjetaAlumno key={a.id} alumno={a} onTap={setAlumnoSeleccionado} />
                ))}
                {/* Registrados al final, más tenues */}
                {registrados.map(a => (
                  <TarjetaAlumno key={a.id} alumno={a} onTap={() => {}} />
                ))}
              </div>
            </section>
          );
        })
      )}

      {showQR && (
        <QRScannerModal
          onScan={handleQRScan}
          onClose={() => setShowQR(false)}
        />
      )}

      {alumnoSeleccionado && (
        <ModalEntrada
          alumno={alumnoSeleccionado}
          onClose={() => setAlumnoSeleccionado(null)}
          onSuccess={() => setAlumnoSeleccionado(null)}
        />
      )}
    </div>
  );
}

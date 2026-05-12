import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Thermometer, Clock, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/services/api';
import { useCatalogo } from '@/hooks/useCatalogo';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { ESTADO_ASISTENCIA, esCumpleanos } from '@/utils/asistencia';
import { ultimoDiaHabil } from '@/utils/fecha';
import BadgeEstado from '@/components/ui/BadgeEstado';

function usePrecioDia() {
  const { data } = useQuery({
    queryKey: ['config-negocio'],
    queryFn: () => api.get('/config/negocio').then(r => r.data),
    staleTime: 30 * 60 * 1000,
  });
  return data?.precio_comida_dia ?? 50;
}

// ── Modal checklist ───────────────────────────────────────────────────────────

const CHECKS_DEFAULT = {
  uñas_cortadas: true, sin_lagañas: true,
  sin_fiebre: true, temperatura: '',
  sin_sintomas: true, sintomas_notas: '',
  panial_limpio: true, trajo_paniales: true, trae_uniforme: true,
  trae_bata: true, trae_termo: true, agua_suficiente: true,
};

function ModalEntrada({ alumno, onClose, onSuccess }) {
  const precioDia = usePrecioDia();
  const [form, setForm] = useState(CHECKS_DEFAULT);
  const [confirmacionComida, setConfirmacionComida] = useState(null);
  const [cargandoComida, setCargandoComida] = useState(false);
  const [pagoVerificado, setPagoVerificado] = useState(false);
  const [medicamentosPendientes, setMedicamentosPendientes] = useState([]);
  const queryClient = useQueryClient();
  const { map: checklistMap } = useCatalogo('checklist-entrada');

  // Query: solicitudes de toallitas pendientes
  const { data: solicitudesToallitas = [] } = useQuery({
    queryKey: ['solicitudes-toallitas', alumno?.id],
    queryFn: () => api.get(`/insumos/${alumno.id}`).then(r => r.data.solicitudes_toallitas || []),
    enabled: !!alumno?.id && alumno?.usa_panial,
  });

  // Cargar confirmación de comida y medicamentos pendientes al abrir modal
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargandoComida(true);
        const hoy = new Date().toLocaleDateString('en-CA');
        const [año, mes, dia] = hoy.split('-');
        const lunes = new Date(año, parseInt(mes) - 1, parseInt(dia));
        lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
        const semanaInicio = lunes.toLocaleDateString('en-CA');

        // Cargar comida
        const resComida = await api.get(`/comida/confirmacion/${alumno.id}?semana=${semanaInicio}`);
        if (resComida.data) {
          setConfirmacionComida(resComida.data);
          setPagoVerificado(resComida.data.pago_verificado || false);
        }

        // Cargar medicamentos pendientes
        const resMeds = await api.get(`/bitacora/${alumno.id}?fecha=${hoy}`);
        if (resMeds.data?.recepciones_medicamento) {
          const pendientes = resMeds.data.recepciones_medicamento.filter(r => !r.administrado);
          setMedicamentosPendientes(pendientes);
        }
      } catch (e) {
        // Sin datos, no mostrar nada
      } finally {
        setCargandoComida(false);
      }
    };

    if (alumno?.id) {
      cargarDatos();
    }
  }, [alumno?.id]);

  const recibirMedMutation = useMutation({
    mutationFn: (recepcionId) => api.patch(`/bitacora/medicamento/recepcion/${recepcionId}/recibir`).then(r => r.data),
    onSuccess: (_, recepcionId) => {
      setMedicamentosPendientes(prev => prev.map(m => m.id === recepcionId ? { ...m, recibido: true } : m));
      toast.success('✅ Medicamento marcado como recibido');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Error al marcar recibido'),
  });

  const marcarToallitasRecibidosMutation = useMutation({
    mutationFn: (solicitudId) => api.put(`/insumos/solicitudes/${solicitudId}/recibida`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-toallitas', alumno?.id] });
      toast.success('✅ Toallitas marcadas como recibidas');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Error al marcar toallitas'),
  });

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
    // Si hay confirmación de comida activa (no cancelada por directora), actualizar estado de pago
    if (confirmacionComida && !cargandoComida && confirmacionComida.estado !== 'cancelado') {
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
    <Modal open={true} onClose={onClose} title={null} size="md" closeOnBackdrop={true}>
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <AvatarAlumno alumno={alumno} size="md" />
        <div className="flex-1">
          <p className="font-black text-gray-800">{alumno.nombre_completo}</p>
          <p className="text-xs text-gray-400 font-semibold">{alumno.grupo_nombre} · Filtro de entrada</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <span className="text-xl">✕</span>
        </button>
      </div>

      {esCumpleanos(alumno.fecha_nacimiento) && (
        <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl text-center">
          <p className="font-black text-yellow-700 text-sm">🎂 ¡Hoy es el cumpleaños de {alumno.nombre_completo.split(' ')[0]}! 🎈</p>
        </div>
      )}

      {solicitudesToallitas.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
          <p className="text-xs font-black text-yellow-700 mb-2">🧻 Pendiente: llevar toallitas</p>
          <button
            type="button"
            onClick={() => marcarToallitasRecibidosMutation.mutate(solicitudesToallitas[0].id)}
            disabled={marcarToallitasRecibidosMutation.isPending}
            className="w-full px-3 py-2 bg-yellow-400 text-white rounded-lg font-bold text-xs hover:bg-yellow-500 disabled:opacity-50">
            ✅ Las trajo hoy
          </button>
        </div>
      )}

      <div className="space-y-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Salud</p>
          <CheckRowInv field="sin_fiebre" label={checklistMap['sin_fiebre']?.label ?? 'Sin fiebre'} emoji={checklistMap['sin_fiebre']?.emoji ?? '🌡️'} />
          {!form.sin_fiebre && (
            <div className="flex items-center gap-2 px-3">
              <Thermometer size={16} className="text-red-500" />
              <input type="number" step="0.1" min="35" max="42" placeholder="Temperatura °C"
                value={form.temperatura} onChange={e => set('temperatura', e.target.value)}
                className="flex-1 border-2 border-red-300 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-red-500" />
            </div>
          )}
          <CheckRowInv field="sin_sintomas" label={checklistMap['sin_sintomas']?.label ?? 'Sin síntomas'} emoji={checklistMap['sin_sintomas']?.emoji ?? '🤧'} />
          {!form.sin_sintomas && (
            <textarea placeholder="Describe los síntomas..." value={form.sintomas_notas}
              onChange={e => set('sintomas_notas', e.target.value)} rows={2}
              className="w-full border-2 border-yellow-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none resize-none" />
          )}

          <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Higiene</p>
          <CheckRow field="uñas_cortadas" label={checklistMap['uñas_cortadas']?.label ?? 'Uñas cortadas'} emoji={checklistMap['uñas_cortadas']?.emoji ?? '✂️'} />
          <CheckRow field="sin_lagañas"   label={checklistMap['sin_lagañas']?.label ?? 'Sin lagañas'}   emoji={checklistMap['sin_lagañas']?.emoji ?? '👁️'} />
          {alumno.usa_panial && (
            <>
              <CheckRow field="panial_limpio" label={checklistMap['panial_limpio']?.label ?? 'Pañal limpio'} emoji={checklistMap['panial_limpio']?.emoji ?? '👶🏻'} />
              <CheckRow field="trajo_paniales" label={checklistMap['trajo_paniales']?.label ?? 'Trajo pañales hoy (5)'} emoji={checklistMap['trajo_paniales']?.emoji ?? '🧷'} />
            </>
          )}

          <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Materiales</p>
          <CheckRow field="trae_uniforme"   label={checklistMap['trae_uniforme']?.label ?? 'Uniforme'}        emoji={checklistMap['trae_uniforme']?.emoji ?? '👕'} />
          <CheckRow field="trae_bata"       label={checklistMap['trae_bata']?.label ?? 'Bata'}            emoji={checklistMap['trae_bata']?.emoji ?? '🥼'} />
          <CheckRow field="trae_termo"      label={checklistMap['trae_termo']?.label ?? 'Termo'}           emoji={checklistMap['trae_termo']?.emoji ?? '🧴'} />
          <CheckRow field="agua_suficiente" label={checklistMap['agua_suficiente']?.label ?? 'Agua suficiente'} emoji={checklistMap['agua_suficiente']?.emoji ?? '💧'} />

          {/* Sección Comida (solo si confirmó y no está ya cancelado por directora) */}
          {confirmacionComida && confirmacionComida.estado !== 'cancelado' && (
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
                  : `📋 ${Math.round(confirmacionComida.monto / precioDia)} días ($${confirmacionComida.monto})`
                }
                {confirmacionComida.metodo_pago === 'transferencia' && ' | 💳 Transferencia'}
                {confirmacionComida.metodo_pago === 'efectivo' && ' | 💵 Efectivo'}
              </p>
            </>
          )}

          {/* Sección Medicamentos */}
          {medicamentosPendientes.length > 0 && (
            <>
              <p className="text-xs font-black text-hs-orange-dark uppercase tracking-wider pt-2">💊 Medicamentos — recibir del papá</p>
              <div className="space-y-2">
                {medicamentosPendientes.map((med) => (
                  <div key={med.id} className={`flex items-start gap-2 px-3 py-2 rounded-2xl text-sm border-2 transition-all ${med.recibido ? 'bg-green-50 border-green-200' : 'bg-hs-orange/10 border-hs-orange/30'}`}>
                    <span className="text-lg">{med.recibido ? '✅' : '💊'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800">{med.nombre} — {med.dosis}</p>
                      <p className="text-xs text-gray-500">
                        {med.tomas?.length > 0
                          ? med.tomas.map(t => t.hora_programada.substring(0, 5)).join(', ')
                          : 'Sin hora programada'}
                      </p>
                    </div>
                    {!med.recibido && (
                      <button
                        onClick={() => recibirMedMutation.mutate(med.id)}
                        disabled={recibirMedMutation.isPending}
                        className="px-3 py-1.5 rounded-xl bg-hs-orange text-white font-bold text-xs hover:bg-hs-orange-dark disabled:opacity-50 whitespace-nowrap"
                      >
                        Recibir
                      </button>
                    )}
                    {med.recibido && (
                      <span className="text-xs font-bold text-green-600 whitespace-nowrap">Recibido</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
      </div>

      <button onClick={handleSubmit} disabled={mutation.isPending}
        className="btn-primary w-full text-lg py-4 disabled:opacity-50 mt-5">
        {mutation.isPending ? 'Registrando...' : '✅ Registrar Entrada'}
      </button>
    </Modal>
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
            {alumno.numero_retardo_mes > 0 && alumno.estado_asistencia !== 'no_entrada' && (
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
    <Modal open={true} onClose={onClose} title="📱 Escanear QR del alumno" size="sm">
      <div id="qr-filtro-entrada" className="w-full" />
      <p className="text-center text-xs text-gray-400 font-semibold py-3">
        Apunta la cámara al código QR de la credencial del alumno
      </p>
    </Modal>
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

// ── Modal hermanos en cadena ──────────────────────────────────────────────────

function ModalHermanosCadena({ hermanos, tipo, onRegistrar, onOmitir }) {
  const [seleccionados, setSeleccionados] = useState(
    () => new Set(hermanos.map(h => h.id))
  );

  const toggle = (id) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const label = tipo === 'entrada' ? 'entrada' : 'salida';

  return (
    <Modal open={true} onClose={onOmitir} title={null} size="sm" closeOnBackdrop={true}>
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <span className="text-3xl">👨‍👩‍👧‍👦</span>
        <div>
          <p className="font-black text-gray-800">Hermanos detectados</p>
          <p className="text-xs text-gray-500 font-semibold">
            {hermanos.length === 1 ? '1 hermano' : `${hermanos.length} hermanos`} sin {label} registrada
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {hermanos.map(h => (
          <button key={h.id} type="button" onClick={() => toggle(h.id)}
            className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all text-left
              ${seleccionados.has(h.id)
                ? 'border-hs-purple bg-hs-purple/10'
                : 'border-gray-200 bg-white'}`}>
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs
              ${seleccionados.has(h.id) ? 'border-hs-purple bg-hs-purple text-white' : 'border-gray-300'}`}>
              {seleccionados.has(h.id) && '✓'}
            </span>
            <AvatarAlumno alumno={h} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{h.nombre_completo}</p>
              <p className="text-xs text-gray-500 font-semibold">{h.grupo_nombre}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-5">
        <button onClick={onOmitir}
          className="px-4 py-3 rounded-2xl font-black text-gray-600 border-2 border-gray-200 hover:bg-gray-50 text-sm">
          Omitir
        </button>
        <button
          onClick={() => {
            const seleccion = hermanos.filter(h => seleccionados.has(h.id));
            if (seleccion.length > 0) onRegistrar(seleccion);
            else onOmitir();
          }}
          disabled={seleccionados.size === 0}
          className="flex-1 py-3 rounded-2xl font-black text-white bg-hs-purple hover:bg-hs-purple-dark transition-all disabled:opacity-50 text-sm">
          Registrar {label} →
        </button>
      </div>
    </Modal>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────────

export default function FiltroEntrada() {
  const hoy = new Date().toLocaleDateString('en-CA');
  const [fecha, setFecha] = useState(ultimoDiaHabil);
  const soloLectura = fecha < hoy;
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [showQR, setShowQR] = useState(false);

  // Estado para cadena de hermanos
  const [hermanosPendientes, setHermanosPendientes] = useState(null); // lista de hermanos sin entrada
  const [colaHermanos, setColaHermanos] = useState([]); // cola de hermanos a registrar en secuencia
  const irDia = (delta) => {
    const d = new Date(fecha + 'T12:00:00');
    do { d.setDate(d.getDate() + delta); } while (d.getDay() === 0 || d.getDay() === 6);
    const nueva = d.toLocaleDateString('en-CA');
    if (nueva <= hoy) setFecha(nueva);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['filtro-entrada', fecha],
    queryFn: () => api.get(`/asistencia/filtro-entrada?fecha=${fecha}`).then(r => r.data),
    refetchInterval: soloLectura ? false : 20000,
  });

  const grupos = data?.grupos ?? [];

  const handleQRScan = useCallback(async (rawQrData) => {
    setShowQR(false);
    const partes = rawQrData.split(':');
    if (partes[0] !== 'HAPPYSCHOOL' || partes[1] !== 'ALUMNO' || !partes[2]) {
      toast.error('QR no reconocido');
      return;
    }
    const alumnoId = partes[2]; // UUID correcto
    const todos = grupos.flatMap(g => g.alumnos);
    const alumnoLocal = todos.find(a => a.id === alumnoId);
    if (alumnoLocal) {
      if (alumnoLocal.estado_asistencia !== 'ausente') {
        toast(`${alumnoLocal.nombre_completo.split(' ')[0]} ya fue registrado ✅`);
        return;
      }
      setAlumnoSeleccionado({ ...alumnoLocal, qr_escaneado: true });
      return;
    }
    // Si no está en lista local, llamar al backend
    try {
      const { data } = await api.get(`/alumnos/por-qr/${encodeURIComponent(rawQrData)}`);
      setAlumnoSeleccionado({ ...data, qr_escaneado: true });
    } catch {
      toast.error('Alumno no encontrado en el sistema');
    }
  }, [grupos]);

  // Stats globales
  const todosAlumnos = grupos.flatMap(g => g.alumnos);
  const totalPendientes  = todosAlumnos.filter(a => a.estado_asistencia === 'ausente').length;
  const totalPresentes   = todosAlumnos.filter(a => ['presente', 'retardo'].includes(a.estado_asistencia)).length;
  const totalNoEntrada   = todosAlumnos.filter(a => a.estado_asistencia === 'no_entrada').length;
  const cumpleHoy       = todosAlumnos.filter(a => esCumpleanos(a.fecha_nacimiento));

  // Filtro búsqueda
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
        <div className="bg-hs-blue/10 border-2 border-hs-blue/40 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-xl">📋</span>
          <p className="text-sm font-bold text-hs-blue-dark">Consultando día anterior — solo lectura</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => irDia(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
            disabled={fecha <= '2024-01-01'}
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Filtro de Entrada 🚪</h1>
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
        <div className="flex flex-col items-end gap-2">
          <RelojHora />
          {!soloLectura && (
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-hs-purple text-white font-bold text-sm hover:bg-hs-purple-dark transition-all shadow-sm"
            >
              <QrCode size={16} />
              Escanear QR
            </button>
          )}
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
        <div className="grid grid-cols-4 gap-2">
          <div className="card-hs p-3 text-center">
            <p className="text-2xl font-black text-green-600">{totalPresentes}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Registrados</p>
          </div>
          <div className="card-hs p-3 text-center">
            <p className="text-2xl font-black text-red-500">{totalNoEntrada}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">No entraron</p>
          </div>
          <div className="card-hs p-3 text-center">
            <p className="text-2xl font-black text-hs-purple">{totalPendientes}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Pendientes</p>
          </div>
          <div className="card-hs p-3 text-center">
            <p className="text-2xl font-black text-gray-700">{todosAlumnos.length}</p>
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
                  <TarjetaAlumno key={a.id} alumno={a} onTap={soloLectura ? () => {} : setAlumnoSeleccionado} />
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
          onClose={() => {
            setAlumnoSeleccionado(null);
            // Si hay más hermanos en cola, abrir el siguiente
            if (colaHermanos.length > 0) {
              const [siguiente, ...resto] = colaHermanos;
              setColaHermanos(resto);
              setTimeout(() => setAlumnoSeleccionado(siguiente), 200);
            }
          }}
          onSuccess={async () => {
            const alumnoId = alumnoSeleccionado.id;
            setAlumnoSeleccionado(null);

            // Si hay más hermanos en cola, abrir el siguiente
            if (colaHermanos.length > 0) {
              const [siguiente, ...resto] = colaHermanos;
              setColaHermanos(resto);
              setTimeout(() => setAlumnoSeleccionado(siguiente), 200);
              return;
            }

            // Si no venimos de una cadena, buscar hermanos
            try {
              const res = await api.get(`/alumnos/${alumnoId}/hermanos`);
              const sinEntrada = (res.data.hermanos || []).filter(h => !h.entrada_hoy);
              if (sinEntrada.length > 0) {
                setHermanosPendientes(sinEntrada);
              }
            } catch {
              // Si falla, no pasa nada — flujo normal
            }
          }}
        />
      )}

      {/* Modal cadena de hermanos */}
      {hermanosPendientes && hermanosPendientes.length > 0 && (
        <ModalHermanosCadena
          hermanos={hermanosPendientes}
          tipo="entrada"
          onRegistrar={(seleccion) => {
            setHermanosPendientes(null);
            if (seleccion.length > 0) {
              const [primero, ...resto] = seleccion;
              setColaHermanos(resto);
              setTimeout(() => setAlumnoSeleccionado(primero), 200);
            }
          }}
          onOmitir={() => setHermanosPendientes(null)}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { X, CalendarPlus, QrCode } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppConfigStore } from '@/store/appConfigStore';
import api from '@/services/api';
import { buildGoogleCalendarUrl } from '@/utils/googleCalendar';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

function proximos3Dias() {
  const hoy = new Date();
  const hasta = new Date(hoy);
  hasta.setDate(hoy.getDate() + 3);
  return {
    desde: hoy.toLocaleDateString('en-CA'),
    hasta: hasta.toLocaleDateString('en-CA'),
  };
}

const EMOJIS_ANIMO = { feliz: '😊', triste: '😢', cansado: '😴', irritable: '😤', activo: '⚡' };
const EMOJIS_COMIDA = { todo: '😋', casi_todo: '😊', poco: '😐', no_comio: '❌' };
const COMPORTAMIENTO = {
  muy_bien:         { emoji: '⭐', label: 'Excelente', bg: 'bg-green-100',  text: 'text-green-700'  },
  bien:             { emoji: '👍', label: 'Bien',      bg: 'bg-blue-100',   text: 'text-hs-blue-dark'   },
  necesita_mejorar: { emoji: '⚠️', label: 'Mejorar',  bg: 'bg-hs-orange/20', text: 'text-hs-orange-dark' },
};

function FiltroEntradaBadge({ item, label }) {
  if (item === null || item === undefined) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-bold text-gray-600">{label}:</span>
      <span className={`text-lg ${item ? '✅ text-green-600' : '❌ text-red-600'}`}>
        {item ? '✅' : '❌'}
      </span>
    </div>
  );
}

function HijoCard({ hijo }) {
  const bit = hijo.bitacora_hoy;
  const entrada = hijo.filtro_entrada;
  // Usar retardos_mes_total (siempre disponible) para clasificar el estado
  const numRetardosMes = hijo.retardos_mes_total || 0;

  // Estados de retardo
  const tieneRetardo = entrada?.es_retardo && entrada?.puede_entrar;
  const limitAlcanzado = numRetardosMes >= 3;
  const cercaDelLimite = numRetardosMes === 2;
  const unRetardo = numRetardosMes === 1;

  return (
    <Link
      to={`/padre/bitacora?alumnoId=${hijo.id}&nombre=${encodeURIComponent(hijo.nombre_completo)}`}
      className="card-hs overflow-hidden border border-red-100 block hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-red-50">
        {hijo.foto_url ? (
          <img src={hijo.foto_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-3xl">👧🏻</div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-gray-800">{hijo.nombre_completo}</h2>
          <p className="text-sm font-bold text-red-500 mt-0.5">{hijo.grupo_nombre || hijo.grupo}</p>
        </div>
        <span className="text-red-400 text-lg">›</span>
      </div>

      {/* Filtro de entrada o Estado de Retardos */}
      {(entrada && entrada.puede_entrar !== null) || numRetardosMes > 0 ? (
        <div className={`px-5 py-3 border-b ${
          limitAlcanzado ? 'bg-red-50 border-red-100' :
          cercaDelLimite ? 'bg-yellow-50 border-yellow-100' :
          unRetardo ? 'bg-yellow-50 border-yellow-100' :
          tieneRetardo ? 'bg-hs-orange/10 border-orange-100' :
          entrada?.puede_entrar ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          {/* Alerta unificada de retardos */}
          {numRetardosMes > 0 && entrada?.es_retardo && (
            <div className={`mb-3 p-3 rounded-lg border-l-4 ${
              limitAlcanzado
                ? 'bg-red-100 border-l-red-500 text-red-700'
                : cercaDelLimite
                  ? 'bg-yellow-100 border-l-yellow-500 text-yellow-700'
                  : 'bg-yellow-100 border-l-yellow-400 text-yellow-700'
            }`}>
              <p className="text-xs font-black uppercase mb-1">
                {limitAlcanzado ? '🚫 Límite de retardos alcanzado' :
                 cercaDelLimite ? '⚠️ Atención: próximo retardo bloquea entrada' :
                 '⏰ Retardo registrado'}
              </p>
              <p className="text-xs font-semibold">
                Retardos acumulados: {numRetardosMes}/3 del mes
                {limitAlcanzado && ' — Mañana será rechazado/a si llega tarde'}
              </p>
            </div>
          )}

          {/* Encabezado principal de entrada */}
          {entrada && entrada.puede_entrar !== null && (
            <>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xl">{entrada.puede_entrar ? '🚪 ✅' : '🚪 🚫'}</span>
                <span className={`text-xs font-black uppercase ${
                  limitAlcanzado ? 'text-red-700' :
                  cercaDelLimite && !tieneRetardo ? 'text-yellow-700' :
                  tieneRetardo ? 'text-yellow-700' :
                  entrada.puede_entrar ? 'text-green-700' : 'text-red-700'
                }`}>
                  {entrada.puede_entrar ? 'Entrada autorizada' : 'Entrada rechazada'}
                </span>

                {/* Hora de entrada */}
                {entrada.puede_entrar && entrada.hora_entrada && (
                  <span className="text-xs text-gray-500 font-semibold">
                    {new Date(entrada.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}

                {/* Badge retardo */}
                {entrada.es_retardo && entrada.puede_entrar && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-black bg-yellow-100 text-yellow-700">
                    ⚠️ Retardo
                  </span>
                )}
              </div>

              {/* Motivo de rechazo */}
              {entrada.motivo_no_entrada && !entrada.puede_entrar && (
                <div className="mb-3 px-3 py-2 rounded-xl text-xs font-semibold border-l-4 bg-red-100 border-l-red-400 text-red-700">
                  {!entrada.sin_fiebre || entrada.temperatura > 37.5 ? (
                    <p>🌡️ {entrada.motivo_no_entrada}</p>
                  ) : !entrada.sin_sintomas ? (
                    <p>🤒 {entrada.motivo_no_entrada}</p>
                  ) : (
                    <p>{entrada.motivo_no_entrada}</p>
                  )}
                </div>
              )}

              {/* Checklist */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <FiltroEntradaBadge item={entrada.uñas_cortadas} label="Uñas" />
                <FiltroEntradaBadge item={entrada.trae_uniforme} label="Uniforme" />
                <FiltroEntradaBadge item={entrada.trae_bata} label="Bata" />
                <FiltroEntradaBadge item={entrada.agua_suficiente} label="Agua" />
                <FiltroEntradaBadge item={entrada.trae_termo} label="Termo" />
                <FiltroEntradaBadge item={entrada.sin_lagañas} label="Ojos" />
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Filtro de salida */}
      {hijo.filtro_salida && (
        <div className={`mx-4 mt-3 mb-1 rounded-2xl border p-4 flex items-start gap-3 ${
          hijo.filtro_salida.salida_anticipada
            ? 'bg-amber-50 border-amber-200'
            : 'bg-hs-blue/10 border-hs-blue/20'
        }`}>
          <span className="text-2xl mt-0.5">{hijo.filtro_salida.salida_anticipada ? '⚠️' : '🚪'}</span>
          <div className="flex-1">
            <p className={`text-sm font-black ${hijo.filtro_salida.salida_anticipada ? 'text-amber-700' : 'text-hs-blue-dark'}`}>
              {hijo.filtro_salida.salida_anticipada ? 'Salida anticipada' : 'Ya salió'}
            </p>
            <p className="text-xs text-gray-500 font-semibold">
              {new Date(hijo.filtro_salida.hora_salida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {hijo.filtro_salida.salida_anticipada && hijo.filtro_salida.motivo_salida && (
              <p className="text-xs text-amber-700 mt-1">
                {hijo.filtro_salida.motivo_salida}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bitácora del día */}
      {bit ? (
        <div className="p-5 space-y-3">
          {/* Ánimo + Conducta + Fiebre + Incidente - mismo nivel */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ánimo */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">{EMOJIS_ANIMO[bit.estado_animo] || '🤔'}</span>
              <div className="text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide">Ánimo</p>
                <p className="text-sm font-bold text-gray-700 capitalize">{bit.estado_animo?.replace('_', ' ') || '—'}</p>
              </div>
            </div>

            {/* Conducta */}
            {bit.comportamiento && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl">{COMPORTAMIENTO[bit.comportamiento]?.emoji}</span>
                <div className="text-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wide">Conducta</p>
                  <p className="text-sm font-bold text-gray-700">{COMPORTAMIENTO[bit.comportamiento]?.label}</p>
                </div>
              </div>
            )}

            {/* Fiebre */}
            {bit.tuvo_fiebre && (
              <div className="flex flex-col items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <span className="text-3xl">🌡️</span>
                <p className="text-xs font-black text-red-600">Tuvo fiebre</p>
              </div>
            )}

            {/* Incidente */}
            {bit.incidentes_sin_firmar > 0 && (
              <div className="flex flex-col items-center gap-2 bg-hs-orange/10 border border-hs-orange/30 rounded-xl px-3 py-2">
                <span className="text-3xl">⚠️</span>
                <p className="text-xs font-black text-hs-orange-dark">
                  {bit.incidentes_sin_firmar === 1 ? '1 incidente' : `${bit.incidentes_sin_firmar} incidentes`}
                </p>
              </div>
            )}
          </div>

          {/* Notas maestra */}
          {bit.notas && (
            <p className="text-sm text-gray-500 italic bg-yellow-50 rounded-xl px-3 py-2">
              💬 {bit.notas}
            </p>
          )}
        </div>
      ) : (
        <div className="p-5 text-center text-gray-400">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm font-semibold">La bitácora de hoy aún no está lista</p>
        </div>
      )}
    </Link>
  );
}

const saludoHora = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const TRATAMIENTO_PARENTESCO = {
  madre:    'Mamá',
  papa:     'Papá',
  padre:    'Papá',
  abuelo:   '',
  abuela:   '',
  tutor:    '',
  tutora:   '',
};

function saludoPadre(parentesco, nombre) {
  const tratamiento = TRATAMIENTO_PARENTESCO[parentesco?.toLowerCase()];
  const destinatario = tratamiento ? `${tratamiento} ${nombre?.split(' ')[0]}` : nombre?.split(' ')[0];
  return `¡${saludoHora()}, ${destinatario}!`;
}

function PagoResumenCard({ hijoId, hijoNombre }) {
  const { data } = useQuery({
    queryKey: ['pago-estado', hijoId],
    queryFn: () => api.get(`/pagos/estado/${hijoId}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const saldo = data?.saldo_pendiente || 0;
  const semaforo = data?.semaforo || 'verde';

  const estadoLabel = semaforo === 'verde'
    ? '✅ Al día'
    : semaforo === 'suspendido'
      ? `🚫 Suspendido: $${saldo.toLocaleString('es-MX')} MXN`
      : `⚠️ Adeudo: $${saldo.toLocaleString('es-MX')} MXN`;

  return (
    <Link to="/padre/pagos" className="card-hs px-4 py-3 flex items-center justify-between border border-green-100 hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-bold text-gray-500">{hijoNombre.split(' ')[0]}</p>
        <p className={`text-sm font-black ${semaforo === 'verde' ? 'text-green-600' : 'text-hs-orange-dark'}`}>
          {estadoLabel}
        </p>
      </div>
      <span className="text-gray-300">›</span>
    </Link>
  );
}

function ModalEvento({ ev, onClose }) {
  if (!ev) return null;
  const fechaInicio = new Date(ev.fecha_inicio.substring(0, 10) + 'T12:00:00');
  const fechaFin = ev.fecha_fin ? new Date(ev.fecha_fin.substring(0, 10) + 'T12:00:00') : null;
  const fmtFecha = d => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Modal
      open={!!ev}
      onClose={onClose}
      size="md"
      closeOnBackdrop={true}
      title={null}
    >
      {ev && (
        <>
          {/* Ícono + categoría */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{ev.categoria_icono || '📅'}</span>
            <div>
              {ev.categoria_nombre && (
                <span className="text-xs font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: (ev.categoria_color || '#805AD5') + '20', color: ev.categoria_color || '#805AD5' }}>
                  {ev.categoria_nombre}
                </span>
              )}
            </div>
          </div>

          <h3 className="text-xl font-black text-gray-800 mb-2">{ev.titulo}</h3>

          {/* Fecha */}
          <p className="text-sm font-semibold text-hs-blue capitalize mb-1">
            📅 {fmtFecha(fechaInicio)}
            {fechaFin && fechaFin.getTime() !== fechaInicio.getTime() && ` → ${fmtFecha(fechaFin)}`}
          </p>

          {/* Grupo */}
          {ev.grupo_nombre && (
            <p className="text-sm font-semibold text-gray-500 mb-1">👥 {ev.grupo_nombre}</p>
          )}

          {ev.ubicacion && (
            <p className="text-sm font-semibold text-gray-600 mb-1">📍 {ev.ubicacion}</p>
          )}

          {ev.recordatorio_horas && (
            <p className="text-sm font-semibold text-gray-500 mb-3">
              🔔 {ev.recordatorio_horas < 24
                ? `${ev.recordatorio_horas}h antes`
                : `${ev.recordatorio_horas / 24}d antes`}
            </p>
          )}

          {/* Descripción */}
          {ev.descripcion && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-2xl px-4 py-3 mt-3 mb-4">
              {ev.descripcion}
            </p>
          )}

          <div className="space-y-2">
            <a
              href={buildGoogleCalendarUrl(ev)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white bg-hs-blue hover:bg-hs-blue-dark transition-colors"
            >
              <CalendarPlus size={15} />
              Añadir a Google Calendar
            </a>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function TareaRecienteCard({ hijo }) {
  const [fotoModal, setFotoModal] = useState(null);
  const [expandidas, setExpandidas] = useState({});

  const { data: tareasPendientes = [] } = useQuery({
    queryKey: ['tareas-pendientes-lista', hijo.id],
    queryFn: () => api.get(`/tareas/lista-pendientes?alumno_id=${hijo.id}`).then(r => r.data).catch(() => []),
  });

  if (tareasPendientes.length === 0) return null;

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return 'Sin fecha';
    const parts = fechaIso.substring(0, 10).split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const fecha = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    return fecha.charAt(0).toUpperCase() + fecha.slice(1);
  };

  const calcularDiasRestantes = (fechaIso) => {
    if (!fechaIso) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaIso.substring(0, 10) + 'T12:00:00');
    const dias = Math.floor((fecha - hoy) / (1000 * 60 * 60 * 24));
    return dias;
  };

  const getColorEmoji = (diasRestantes) => {
    if (diasRestantes !== null && diasRestantes < 0) return '🔴';
    if (diasRestantes === 0) return '🔥';
    if (diasRestantes === 1) return '⚠️';
    return '📘';
  };

  return (
    <>
      <details className="card-hs overflow-hidden">
        <summary className="bg-gradient-to-r from-hs-blue/5 to-blue-100 px-4 py-3 border-b border-hs-blue/30 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition flex items-center gap-2 font-black text-sm text-hs-blue-dark list-none">
          <span>▶</span>
          <span>📚 Tareas pendientes — {hijo.nombre_completo}</span>
          <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-hs-blue/20 text-xs font-bold text-hs-blue-dark">
            {tareasPendientes.length}
          </span>
        </summary>

        <div className="divide-y divide-blue-100">
          {tareasPendientes.map((tarea) => {
            const diasRestantes = calcularDiasRestantes(tarea.fecha_limite);
            const isExpanded = expandidas[tarea.id];

            return (
              <div key={tarea.id} className="overflow-hidden">
                {/* Fila compacta */}
                <button
                  onClick={() => setExpandidas(p => ({ ...p, [tarea.id]: !p[tarea.id] }))}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition flex items-center gap-2 text-left"
                >
                  <span className="text-base shrink-0">{getColorEmoji(diasRestantes)}</span>
                  <span className="text-sm font-bold text-gray-800 flex-1 truncate">{tarea.titulo}</span>
                  <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{formatearFecha(tarea.fecha_limite)}</span>
                  <span className="text-lg text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                </button>

                {/* Contenido expandido */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-hs-blue/20 space-y-2">
                    {tarea.descripcion && (
                      <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{tarea.descripcion}</p>
                    )}

                    {tarea.foto_url && (
                      <button
                        onClick={() => setFotoModal(tarea.foto_url)}
                        className="flex items-center gap-1 text-hs-blue-dark hover:text-hs-blue-dark font-semibold text-xs"
                      >
                        <span>📎</span> Ver referencia
                      </button>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        tarea.completada ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700'
                      }`}>
                        {tarea.completada ? '✅ Entregada' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>

      <Modal
        open={!!fotoModal}
        onClose={() => setFotoModal(null)}
        size="lg"
        closeOnBackdrop={true}
        title={null}
        dark={true}
      >
        {fotoModal && (
          <div className="flex items-center justify-center">
            <img src={fotoModal} alt="Imagen de tarea" className="max-w-full max-h-[70vh] object-contain rounded-2xl" />
          </div>
        )}
      </Modal>
    </>
  );
}

function QRTemporalCard({ hijo }) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombreAutorizado, setNombreAutorizado] = useState('');
  const [qrTempModal, setQrTempModal] = useState(null);
  const { whatsappEnabled } = useAppConfigStore();

  const { data: tempData, isLoading: loadingTemp } = useQuery({
    queryKey: ['qr-temporal', hijo.id],
    queryFn: () => api.get(`/alumnos/${hijo.id}/qr-temporal`).then(r => r.data.qr_temporal),
    staleTime: 30000,
  });

  const generarMutation = useMutation({
    mutationFn: () => api.post(`/alumnos/${hijo.id}/qr-temporal`, { nombre_autorizado: nombreAutorizado }).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qr-temporal', hijo.id] });
      setModalAbierto(false);
      setNombreAutorizado('');
      setQrTempModal(data.qr_temporal);
      toast.success('QR temporal generado');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error al generar QR temporal'),
  });

  const cancelarMutation = useMutation({
    mutationFn: () => api.delete(`/alumnos/${hijo.id}/qr-temporal`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-temporal', hijo.id] });
      toast.success('QR temporal cancelado');
    },
    onError: () => toast.error('Error al cancelar el QR'),
  });

  const handleDescargar = async (qr_url, nombre) => {
    try {
      const res = await fetch(qr_url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-Temporal-${nombre.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR descargado');
    } catch {
      toast.error('Error al descargar el QR');
    }
  };

  const handleCompartirWhatsApp = (qr_url, nombre, alumnoNombre) => {
    const texto = encodeURIComponent(`Pase temporal para recoger/dejar a ${alumnoNombre} en Happy School hoy.\nAutorizado: ${nombre}\n\nPor favor muestra el QR al llegar.`);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
    toast('Descarga el QR y adjúntalo al mensaje de WhatsApp', { icon: 'ℹ️' });
    handleDescargar(qr_url, nombre);
  };

  const handleCompartirEmail = (nombre, alumnoNombre) => {
    const asunto = encodeURIComponent(`Pase temporal kínder — ${alumnoNombre}`);
    const cuerpo = encodeURIComponent(`Hola,\n\nTe autorizo para recoger/dejar a ${alumnoNombre} en Happy School el día de hoy.\n\nNombre autorizado: ${nombre}\n\nPor favor descarga y presenta el QR adjunto en la entrada/salida.\n\nEste pase es válido solo hoy.`);
    window.open(`mailto:?subject=${asunto}&body=${cuerpo}`, '_blank');
  };

  const qrActivo = tempData;

  return (
    <>
      <div className="mt-3 border-t border-hs-purple/10 pt-3">
        <p className="text-xs font-black text-gray-500 mb-2">🔐 Pase temporal (casos extraordinarios)</p>
        {loadingTemp ? (
          <p className="text-xs text-gray-400">Cargando...</p>
        ) : qrActivo ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-800">Activo para: {qrActivo.nombre_autorizado}</p>
              <p className="text-xs text-amber-600">Válido solo hoy</p>
            </div>
            <button
              onClick={() => setQrTempModal(qrActivo)}
              className="px-2 py-1 rounded-lg bg-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-300 transition-colors"
            >
              Ver
            </button>
            <button
              onClick={() => cancelarMutation.mutate()}
              disabled={cancelarMutation.isPending}
              className="px-2 py-1 rounded-lg bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setModalAbierto(true)}
            className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-hs-purple/30 text-hs-purple font-bold text-xs hover:bg-hs-purple/5 transition-colors"
          >
            + Generar pase temporal para hoy
          </button>
        )}
      </div>

      {/* Modal generar QR temporal */}
      <Modal open={modalAbierto} onClose={() => { setModalAbierto(false); setNombreAutorizado(''); }} title="Pase temporal de acceso" size="sm">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="text-xs font-bold text-amber-800">
              ⚠️ Solo para casos extraordinarios. Las personas ya registradas en el círculo de confianza usan el QR permanente.
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre completo de quien recogerá/dejará a {hijo.nombre_completo.split(' ')[0]}</label>
            <input
              type="text"
              value={nombreAutorizado}
              onChange={e => setNombreAutorizado(e.target.value)}
              placeholder="Ej: Abuela Rosa García"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-hs-purple/40"
            />
          </div>
          <p className="text-xs text-gray-500">Este pase es válido únicamente hoy. Puedes cancelarlo en cualquier momento.</p>
          <button
            onClick={() => generarMutation.mutate()}
            disabled={!nombreAutorizado.trim() || generarMutation.isPending}
            className="w-full px-4 py-3 rounded-2xl bg-hs-purple text-white font-bold text-sm disabled:opacity-50 hover:bg-hs-purple-dark transition-colors"
          >
            {generarMutation.isPending ? 'Generando...' : 'Generar pase temporal'}
          </button>
        </div>
      </Modal>

      {/* Modal mostrar QR temporal generado */}
      <Modal open={!!qrTempModal} onClose={() => setQrTempModal(null)} title="Pase temporal" size="sm">
        {qrTempModal && (
          <div className="text-center space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <p className="text-xs font-black text-amber-800">Autorizado: {qrTempModal.nombre_autorizado}</p>
              <p className="text-xs text-amber-600">Válido solo hoy — entrada y salida</p>
            </div>
            <img
              src={qrTempModal.qr_url}
              alt="QR temporal"
              className="w-56 h-56 mx-auto rounded-2xl border-4 border-amber-300 object-contain"
            />
            <p className="text-xs text-gray-500">La maestra verá el nombre de quien autorizaste al escanear</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDescargar(qrTempModal.qr_url, qrTempModal.nombre_autorizado)}
                className="px-3 py-2 rounded-xl bg-hs-purple/10 text-hs-purple font-bold text-xs hover:bg-hs-purple/20 transition-colors"
              >
                ⬇️ Descargar
              </button>
              {whatsappEnabled && (
                <button
                  onClick={() => handleCompartirWhatsApp(qrTempModal.qr_url, qrTempModal.nombre_autorizado, hijo.nombre_completo)}
                  className="px-3 py-2 rounded-xl bg-green-100 text-green-700 font-bold text-xs hover:bg-green-200 transition-colors"
                >
                  📱 WhatsApp
                </button>
              )}
              <button
                onClick={() => handleCompartirEmail(qrTempModal.nombre_autorizado, hijo.nombre_completo)}
                className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs hover:bg-blue-200 transition-colors"
              >
                ✉️ Email
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function QRAccesoSection({ hijos }) {
  const [qrModal, setQrModal] = useState(null);

  const handleDescargar = async (hijo) => {
    if (!hijo.qr_code_url) return;
    try {
      let blob;
      const res = await fetch(hijo.qr_code_url);
      blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${hijo.nombre_completo.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR descargado');
    } catch {
      toast.error('Error al descargar el QR');
    }
  };

  if (hijos.length === 0) return null;

  return (
    <>
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">📱 QR de acceso</h2>
        <div className="space-y-2">
          {hijos.map(hijo => (
            <div key={hijo.id} className="card-hs px-4 py-3 border border-hs-purple/20">
              {/* QR permanente — solo si está generado */}
              {hijo.qr_code_url ? (
                <div className="flex items-center gap-3">
                  <QrCode size={24} className="text-hs-purple shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{hijo.nombre_completo}</p>
                    <p className="text-xs font-semibold text-gray-500">Código para entrada y salida</p>
                  </div>
                  <button
                    onClick={() => setQrModal(hijo)}
                    className="px-3 py-1.5 rounded-xl bg-hs-purple/10 text-hs-purple font-bold text-xs hover:bg-hs-purple/20 transition-colors"
                  >
                    Ver QR
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <QrCode size={24} className="text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{hijo.nombre_completo}</p>
                    <p className="text-xs font-semibold text-gray-400">QR permanente no generado aún</p>
                  </div>
                </div>
              )}
              {/* Pase temporal — siempre visible */}
              <QRTemporalCard hijo={hijo} />
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!qrModal} onClose={() => setQrModal(null)} title="QR de acceso" size="sm">
        {qrModal && (
          <div className="text-center">
            <p className="font-bold text-gray-700 mb-4">{qrModal.nombre_completo}</p>
            <img
              src={qrModal.qr_code_url}
              alt="QR de acceso"
              className="w-56 h-56 mx-auto rounded-2xl border-4 border-hs-purple/20 object-contain"
            />
            <p className="text-xs text-gray-500 mt-3 mb-4">Presenta este código en la entrada y salida del kínder</p>
            <button
              onClick={() => handleDescargar(qrModal)}
              className="w-full px-4 py-3 rounded-2xl bg-hs-purple text-white font-bold text-sm hover:bg-hs-purple-dark transition-colors"
            >
              ⬇️ Descargar QR
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function PadreDashboard() {
  const { usuario } = useAuthStore();
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const queryClient = useQueryClient();
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: respuesta = { hijos: [], horaLimiteEntrada: '08:30' }, isLoading } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });

  const hijos = respuesta.hijos || [];
  const horaLimiteEntrada = respuesta.horaLimiteEntrada || '08:30';

  // Invalidar caché cuando cambia usuario
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['mis-hijos'] });
  }, [usuario?.id, queryClient]);

  const { desde, hasta } = proximos3Dias();
  const { data: eventosProximos = [] } = useQuery({
    queryKey: ['eventos-proximos', desde],
    queryFn: () => api.get(`/calendario?desde=${desde}&hasta=${hasta}`).then(r => r.data),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <ModalEvento ev={eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} />
      <div>
        <h1 className="text-2xl font-black text-gray-800">
          {saludoPadre(usuario?.parentesco, usuario?.nombre)} 👨🏻‍👩🏻‍👧🏻
        </h1>
        <p className="text-sm font-semibold text-gray-500 capitalize mt-0.5">{hoy}</p>
      </div>

      {/* Recordatorio hora límite de entrada */}
      <div className="bg-hs-blue/10 border border-hs-blue/30 rounded-2xl px-4 py-3">
        <p className="text-sm font-bold text-hs-blue-dark">
          🚪 Se recuerda que la entrada es a más tardar a las <span className="font-black text-lg">{horaLimiteEntrada}</span> a.m.
        </p>
      </div>

      {/* Estado de pagos */}
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">💳 Pagos</h2>
        <div className="space-y-2">
          {hijos.map(hijo => (
            <PagoResumenCard key={hijo.id} hijoId={hijo.id} hijoNombre={hijo.nombre_completo} />
          ))}
        </div>
      </div>

      {/* QR de acceso */}
      <QRAccesoSection hijos={hijos} />

      {/* Tareas pendientes */}
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">📚 Tareas pendientes</h2>
        <div className="space-y-2">
          {hijos.map(hijo => (
            <TareaRecienteCard key={hijo.id} hijo={hijo} />
          ))}
        </div>
      </div>

      {/* Próximos 3 días */}
      {eventosProximos.length > 0 && (
        <div>
          <h2 className="text-base font-black text-gray-700 mb-3">📅 Próximos eventos</h2>
          <div className="space-y-2">
            {eventosProximos.map(ev => {
              const fecha = new Date(ev.fecha_inicio.substring(0, 10) + 'T12:00:00');
              const etiqueta = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <button
                  key={ev.id}
                  onClick={() => setEventoSeleccionado(ev)}
                  className="card-hs px-4 py-3 flex items-center gap-3 border border-hs-blue/20 w-full text-left hover:shadow-md hover:border-hs-blue/40 transition-all"
                >
                  <span className="text-xl">{ev.categoria_icono || '📅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{ev.titulo}</p>
                    <p className="text-xs font-semibold text-hs-blue capitalize">{etiqueta}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={buildGoogleCalendarUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-hs-blue hover:text-hs-blue-dark hover:bg-hs-blue/10 transition-colors"
                      title="Añadir a Google Calendar"
                    >
                      <CalendarPlus size={16} />
                    </a>
                    <span className="text-gray-300 text-lg">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mis hijos */}
      <div>
        <h2 className="text-base font-black text-gray-700 mb-3">Mis hijos</h2>
        {isLoading ? (
          <div className="card-hs p-8 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-hs-purple border-t-transparent rounded-full" />
          </div>
        ) : hijos.length === 0 ? (
          <div className="card-hs p-8 text-center text-gray-400 font-semibold">
            No hay hijos vinculados a esta cuenta
          </div>
        ) : (
          <div className="space-y-4">
            {hijos.map(hijo => <HijoCard key={hijo.id} hijo={hijo} />)}
          </div>
        )}
      </div>
    </div>
  );
}

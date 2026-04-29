import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, XCircle, Thermometer, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/services/api';
import AvatarAlumno from '@/components/ui/AvatarAlumno';
import { SkeletonStat } from '@/components/ui/SkeletonCard';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
  presente:   { label: 'Presente',    bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle, emoji: '✅' },
  retardo:    { label: 'Retardo',     bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock,        emoji: '⏰' },
  no_entrada: { label: 'No entró',    bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle,      emoji: '🚫' },
  ausente:    { label: 'Sin registrar', bg: 'bg-gray-100', text: 'text-gray-500',   icon: ChevronRight, emoji: '⬜' },
};

function BadgeEstado({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.ausente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black ${cfg.bg} ${cfg.text}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── Modal checklist de entrada ────────────────────────────────────────────────

const CHECKS_DEFAULT = {
  uñas_cortadas: false,
  sin_lagañas: false,
  sin_fiebre: true,
  temperatura: '',
  sin_sintomas: true,
  sintomas_notas: '',
  panial_limpio: false,
  trae_uniforme: false,
  trae_bata: false,
  trae_termo: false,
  agua_suficiente: false,
};

function esCumpleanos(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date().toLocaleDateString('en-CA');
  const [, mesHoy, diaHoy] = hoy.split('-');
  const fn = new Date(fecha_nacimiento.substring(0, 10) + 'T12:00:00');
  return fn.getMonth() + 1 === parseInt(mesHoy) && fn.getDate() === parseInt(diaHoy);
}

function ModalEntrada({ alumno, onClose, onSuccess }) {
  const [form, setForm] = useState(CHECKS_DEFAULT);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/asistencia/entrada', data).then(r => r.data),
    onSuccess: (data) => {
      toast.success(
        data.puede_entrar
          ? data.estado === 'retardo'
            ? `⏰ Retardo registrado — ${alumno.nombre_completo.split(' ')[0]}`
            : `✅ Entrada registrada — ${alumno.nombre_completo.split(' ')[0]}`
          : `🚫 No puede entrar — ${data.motivo}`
      );
      queryClient.invalidateQueries({ queryKey: ['mi-grupo'] });
      onSuccess();
    },
    onError: () => toast.error('Error al registrar entrada'),
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = () => {
    const temp = parseFloat(form.temperatura) || 36.5;
    mutation.mutate({
      alumno_id: alumno.id,
      uñas_cortadas: form.uñas_cortadas,
      sin_lagañas: form.sin_lagañas,
      sin_fiebre: form.sin_fiebre,
      temperatura: temp,
      sin_sintomas: form.sin_sintomas,
      sintomas_notas: form.sintomas_notas,
      panial_limpio: form.panial_limpio,
      trae_uniforme: form.trae_uniforme,
      trae_bata: form.trae_bata,
      trae_termo: form.trae_termo,
      agua_suficiente: form.agua_suficiente,
      qr_escaneado: false,
    });
  };

  const CheckRow = ({ field, label, emoji }) => (
    <button
      type="button"
      onClick={() => set(field, !form[field])}
      className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
        ${form[field]
          ? 'border-green-400 bg-green-50 text-green-700'
          : 'border-gray-200 bg-white text-gray-500'}`}
    >
      <span className="text-xl">{form[field] ? '✅' : '⬜'}</span>
      <span>{emoji} {label}</span>
    </button>
  );

  const CheckRowInverted = ({ field, label, emoji }) => (
    <button
      type="button"
      onClick={() => set(field, !form[field])}
      className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all font-bold text-sm text-left
        ${!form[field]
          ? 'border-red-400 bg-red-50 text-red-700'
          : 'border-green-400 bg-green-50 text-green-700'}`}
    >
      <span className="text-xl">{form[field] ? '✅' : '🚨'}</span>
      <span>{emoji} {label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <AvatarAlumno alumno={alumno} size="md" />
          <div className="flex-1">
            <p className="font-black text-gray-800">{alumno.nombre_completo}</p>
            <p className="text-xs text-gray-400 font-semibold">Filtro de entrada</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Banner cumpleaños */}
        {esCumpleanos(alumno.fecha_nacimiento) && (
          <div className="mx-5 mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl text-center animate-bounce-once">
            <p className="font-black text-yellow-700 text-sm">🎂 ¡Hoy es el cumpleaños de {alumno.nombre_completo.split(' ')[0]}! 🎈</p>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {/* Salud — condición negativa (marcar si hay problema) */}
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Salud</p>

          <CheckRowInverted field="sin_fiebre" label="Sin fiebre" emoji="🌡️" />

          {!form.sin_fiebre && (
            <div className="flex items-center gap-2 px-3">
              <Thermometer size={16} className="text-red-500" />
              <input
                type="number"
                step="0.1"
                min="35"
                max="42"
                placeholder="Temperatura °C"
                value={form.temperatura}
                onChange={e => set('temperatura', e.target.value)}
                className="flex-1 border-2 border-red-300 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          <CheckRowInverted field="sin_sintomas" label="Sin síntomas" emoji="🤧" />

          {!form.sin_sintomas && (
            <textarea
              placeholder="Describe los síntomas..."
              value={form.sintomas_notas}
              onChange={e => set('sintomas_notas', e.target.value)}
              rows={2}
              className="w-full border-2 border-yellow-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-yellow-500 resize-none"
            />
          )}

          {/* Higiene */}
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Higiene</p>
          <CheckRow field="uñas_cortadas" label="Uñas cortadas" emoji="✂️" />
          <CheckRow field="sin_lagañas"  label="Sin lagañas"   emoji="👁️" />
          {alumno.usa_panial && <CheckRow field="panial_limpio" label="Pañal limpio" emoji="👶🏻" />}

          {/* Materiales */}
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Materiales</p>
          <CheckRow field="trae_uniforme"   label="Uniforme"         emoji="👕" />
          <CheckRow field="trae_bata"       label="Bata"             emoji="🥼" />
          <CheckRow field="trae_termo"      label="Termo"            emoji="🧴" />
          <CheckRow field="agua_suficiente" label="Agua suficiente"  emoji="💧" />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all
              bg-hs-purple hover:bg-hs-purple-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Registrando...' : '✅ Registrar Entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper checklist ──────────────────────────────────────────────────────────

function Check({ val, label }) {
  if (val === null || val === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-xl
      ${val ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {val ? '✅' : '❌'} {label}
    </span>
  );
}

// ── Tarjeta alumno ─────────────────────────────────────────────────────────────

function TarjetaAlumno({ alumno, onRegistrar }) {
  const [abierto, setAbierto] = useState(false);
  const yaRegistrado = alumno.estado_asistencia !== 'ausente';

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Fila principal */}
      <div
        className="flex items-center gap-4 p-4 transition-colors cursor-pointer hover:bg-gray-50"
        onClick={() => !yaRegistrado ? onRegistrar(alumno) : yaRegistrado && setAbierto(v => !v)}
      >
        <AvatarAlumno alumno={alumno} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 truncate">{alumno.nombre_completo}</p>
          {alumno.hora_entrada && (
            <p className="text-xs text-gray-400 font-semibold">
              🕐 {new Date(alumno.hora_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              {alumno.numero_retardo_mes > 0 && alumno.estado_asistencia !== 'no_entrada' && (
                <span className="ml-2 text-yellow-600">· Retardo #{alumno.numero_retardo_mes}</span>
              )}
            </p>
          )}
        </div>
        <BadgeEstado estado={alumno.estado_asistencia} />
        {yaRegistrado && (
          abierto
            ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </div>

      {/* Detalle checklist — solo alumnos ya registrados */}
      {abierto && yaRegistrado && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-3">
          {alumno.motivo_no_entrada && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm font-bold text-red-700">
              🚫 {alumno.motivo_no_entrada}
            </div>
          )}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Salud</p>
            <div className="flex flex-wrap gap-2">
              <Check val={alumno.sin_fiebre}   label="Sin fiebre" />
              <Check val={alumno.sin_sintomas} label="Sin síntomas" />
              {alumno.temperatura && (
                <span className="text-xs font-bold bg-hs-blue/10 text-hs-blue-dark px-2 py-1 rounded-xl">
                  🌡️ {alumno.temperatura}°C
                </span>
              )}
              {!alumno.sin_sintomas && alumno.sintomas_notas && (
                <span className="text-xs font-semibold text-hs-orange-dark bg-hs-orange/10 px-2 py-1 rounded-xl">
                  {alumno.sintomas_notas}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Higiene</p>
            <div className="flex flex-wrap gap-2">
              <Check val={alumno.uñas_cortadas} label="Uñas" />
              <Check val={alumno.sin_lagañas}   label="Sin lagañas" />
              {alumno.panial_limpio !== null && <Check val={alumno.panial_limpio} label="Pañal" />}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Materiales</p>
            <div className="flex flex-wrap gap-2">
              <Check val={alumno.trae_uniforme}   label="Uniforme" />
              <Check val={alumno.trae_bata}       label="Bata" />
              <Check val={alumno.trae_termo}      label="Termo" />
              <Check val={alumno.agua_suficiente} label="Agua" />
            </div>
          </div>
          {alumno.qr_escaneado && (
            <p className="text-xs font-semibold text-hs-purple">📱 Entrada por QR</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────────

export default function MaestraAsistencia() {
  const hoy = new Date().toLocaleDateString('en-CA');

  const ultimoDiaHabil = () => {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  };

  const [fecha, setFecha] = useState(ultimoDiaHabil);
  const soloLectura = fecha < hoy;
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const irDia = (delta) => {
    const d = new Date(fecha + 'T12:00:00');
    do { d.setDate(d.getDate() + delta); } while (d.getDay() === 0 || d.getDay() === 6);
    const nueva = d.toLocaleDateString('en-CA');
    if (nueva <= hoy) setFecha(nueva);
  };

  const { data: grupo, isLoading } = useQuery({
    queryKey: ['mi-grupo', fecha],
    queryFn: () => api.get(`/grupos/mi-grupo?fecha=${fecha}`).then(r => r.data),
    refetchInterval: soloLectura ? false : 30000,
  });

  const fechaFormatted = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const pendientes = grupo?.alumnos?.filter(a => a.estado_asistencia === 'ausente') ?? [];
  const registrados = grupo?.alumnos?.filter(a => a.estado_asistencia !== 'ausente') ?? [];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Banner solo lectura */}
      {soloLectura && (
        <div className="bg-hs-blue/10 border-2 border-hs-blue/40 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-xl">📋</span>
          <p className="text-sm font-bold text-hs-blue-dark">Consultando día anterior — solo lectura</p>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => irDia(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
          disabled={fecha <= '2024-01-01'}
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Asistencia ✅</h1>
          <p className="text-gray-500 font-semibold capitalize mt-1">{fechaFormatted}</p>
        </div>
        <button
          onClick={() => irDia(1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
          disabled={fecha >= hoy}
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Stats grupo */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <SkeletonStat key={i} />)}
        </div>
      ) : grupo && (
        <div
          className="rounded-3xl p-5 text-white"
          style={{ background: grupo.color_hex || '#805AD5' }}
        >
          <p className="font-black text-xl">{grupo.nombre}</p>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-3xl font-black">{grupo.presentes_hoy}</p>
              <p className="text-sm font-bold opacity-80">Presentes</p>
            </div>
            <div>
              <p className="text-3xl font-black">{pendientes.length}</p>
              <p className="text-sm font-bold opacity-80">Sin registrar</p>
            </div>
            <div>
              <p className="text-3xl font-black">{grupo.total_alumnos}</p>
              <p className="text-sm font-bold opacity-80">Total</p>
            </div>
          </div>
        </div>
      )}

      {/* Sin registrar */}
      {pendientes.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
            Sin registrar ({pendientes.length})
          </h2>
          <div className="space-y-2">
            {pendientes.map(a => (
              <TarjetaAlumno key={a.id} alumno={a} onRegistrar={soloLectura ? () => {} : setAlumnoSeleccionado} />
            ))}
          </div>
        </section>
      )}

      {/* Ya registrados */}
      {registrados.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
            Registrados ({registrados.length})
          </h2>
          <div className="space-y-2">
            {registrados.map(a => (
              <TarjetaAlumno key={a.id} alumno={a} onRegistrar={() => {}} />
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {!isLoading && !grupo && (
        <div className="card-hs text-center py-12">
          <div className="text-5xl mb-3">🏫</div>
          <p className="font-black text-gray-600">Sin grupo asignado</p>
          <p className="text-sm text-gray-400 mt-1">Contacta a la directora</p>
        </div>
      )}

      {/* Modal */}
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

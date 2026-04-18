import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_LABEL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function EventoChip({ evento }) {
  const color = evento.categoria_color || '#805AD5';
  return (
    <div
      className="text-xs font-bold px-1.5 py-0.5 rounded-lg truncate cursor-pointer"
      style={{ backgroundColor: color + '20', color }}
      title={evento.titulo}
    >
      {evento.titulo}
    </div>
  );
}

function ModalEvento({ evento, onClose }) {
  const color = evento.categoria_color || '#805AD5';
  const fechaInicio = new Date(evento.fecha_inicio);
  const fechaFin = evento.fecha_fin ? new Date(evento.fecha_fin) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {/* Categoría */}
        {evento.categoria_nombre && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{evento.categoria_icono || '📅'}</span>
            <span className="text-xs font-black uppercase tracking-wide" style={{ color }}>
              {evento.categoria_nombre}
            </span>
          </div>
        )}

        <h2 className="text-xl font-black text-gray-800 mb-2">{evento.titulo}</h2>

        <p className="text-sm font-semibold text-gray-500 mb-4">
          {evento.es_todo_el_dia
            ? fechaInicio.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : fechaInicio.toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
          }
          {fechaFin && !evento.es_todo_el_dia && (
            <> — {fechaFin.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</>
          )}
        </p>

        {evento.descripcion && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed mb-4">
            {evento.descripcion}
          </p>
        )}

        {evento.grupo_nombre && (
          <p className="text-xs text-gray-400 font-semibold mb-4">Grupo: {evento.grupo_nombre}</p>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function PadreCalendario() {
  const hoy = new Date();
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  const mes = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['calendario', mes],
    queryFn: () => api.get('/calendario', { params: { mes } }).then(r => r.data),
  });

  const prevMes = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMes = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const days = buildCalendarDays(year, month);

  const eventosPorDia = {};
  eventos.forEach(ev => {
    const d = new Date(ev.fecha_inicio).getDate();
    if (!eventosPorDia[d]) eventosPorDia[d] = [];
    eventosPorDia[d].push(ev);
  });

  const hoyStr = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`;
  const esHoy = (d) => d && `${year}-${month}-${d}` === hoyStr;

  // Lista de eventos del mes ordenada
  const eventosOrdenados = [...eventos].sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-800">Calendario 📅</h1>

      {/* Navegación de mes */}
      <div className="flex items-center justify-between card-hs p-4">
        <button onClick={prevMes} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} className="text-gray-600" />
        </button>
        <h2 className="text-lg font-black text-gray-800">
          {MESES_LABEL[month]} {year}
        </h2>
        <button onClick={nextMes} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRight size={22} className="text-gray-600" />
        </button>
      </div>

      {/* Grilla calendario */}
      <div className="card-hs p-4">
        {/* Encabezado días */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-xs font-black text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-7 h-7 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => (
              <div
                key={i}
                className={`min-h-[64px] p-1 rounded-xl ${
                  day ? 'hover:bg-gray-50 cursor-default' : ''
                } ${esHoy(day) ? 'bg-purple-50 ring-2 ring-purple-400 ring-inset' : ''}`}
              >
                {day && (
                  <>
                    <p className={`text-xs font-black mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      esHoy(day) ? 'bg-purple-500 text-white' : 'text-gray-600'
                    }`}>
                      {day}
                    </p>
                    <div className="space-y-0.5">
                      {(eventosPorDia[day] || []).slice(0, 2).map(ev => (
                        <div key={ev.id} onClick={() => setEventoSeleccionado(ev)}>
                          <EventoChip evento={ev} />
                        </div>
                      ))}
                      {(eventosPorDia[day] || []).length > 2 && (
                        <p className="text-xs font-bold text-gray-400 px-1">
                          +{(eventosPorDia[day] || []).length - 2} más
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de eventos del mes */}
      {eventosOrdenados.length > 0 && (
        <div>
          <h2 className="text-base font-black text-gray-700 mb-3">Eventos de {MESES_LABEL[month]}</h2>
          <div className="space-y-2">
            {eventosOrdenados.map(ev => {
              const color = ev.categoria_color || '#805AD5';
              const fecha = new Date(ev.fecha_inicio);
              return (
                <button
                  key={ev.id}
                  onClick={() => setEventoSeleccionado(ev)}
                  className="w-full card-hs p-4 flex items-center gap-4 text-left hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: color + '20' }}
                  >
                    {ev.categoria_icono || '📅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 truncate">{ev.titulo}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">
                      {fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {!ev.es_todo_el_dia && ' · ' + fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {ev.categoria_nombre && (
                    <span className="text-xs font-bold px-2 py-1 rounded-xl flex-shrink-0" style={{ backgroundColor: color + '15', color }}>
                      {ev.categoria_nombre}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && eventosOrdenados.length === 0 && (
        <div className="card-hs p-8 text-center text-gray-400">
          <div className="text-4xl mb-2">🗓️</div>
          <p className="font-semibold">No hay eventos para este mes</p>
        </div>
      )}

      {eventoSeleccionado && (
        <ModalEvento evento={eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} />
      )}
    </div>
  );
}

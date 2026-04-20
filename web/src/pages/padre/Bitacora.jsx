import { useState, useEffect } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const ANIMO = {
  feliz:     { emoji: '😊', label: 'Feliz'     },
  activo:    { emoji: '⚡', label: 'Activo'    },
  cansado:   { emoji: '😴', label: 'Cansado'   },
  triste:    { emoji: '😢', label: 'Triste'    },
  irritable: { emoji: '😤', label: 'Irritable' },
  energico:  { emoji: '⚡', label: 'Enérgico'  },
  inquieto:  { emoji: '😤', label: 'Inquieto'  },
};

const CUANTO = {
  todo:      { emoji: '🍽️', label: 'Todo'      },
  casi_todo: { emoji: '🥢', label: 'Casi todo' },
  poco:      { emoji: '🍱', label: 'Poco'      },
  no_comio:  { emoji: '❌', label: 'No comió'  },
};

const COMPORTAMIENTO = {
  muy_bien:        { emoji: '⭐', label: 'Muy bien',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  bien:            { emoji: '👍', label: 'Bien',      color: 'bg-green-50  text-green-700  border-green-200'  },
  necesita_mejorar:{ emoji: '⚠️', label: 'A mejorar', color: 'bg-red-50    text-red-700    border-red-200'    },
};

function Seccion({ titulo, emoji, children }) {
  return (
    <div className="card-hs p-5 space-y-3">
      <h3 className="text-xs font-black text-red-500 uppercase tracking-wide">{emoji} {titulo}</h3>
      {children}
    </div>
  );
}

function FilaInfo({ label, valor }) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 font-semibold">{label}</span>
      <span className="text-sm text-gray-800 font-bold text-right max-w-[60%]">{valor}</span>
    </div>
  );
}

function PildoraBool({ label, valor }) {
  if (valor === null || valor === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
      valor ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'
    }`}>
      {valor ? '✓' : '✗'} {label}
    </span>
  );
}

function SelectorFecha({ fecha, onChange }) {
  const date = new Date(fecha + 'T12:00:00');
  const anterior = new Date(date); anterior.setDate(anterior.getDate() - 1);
  const siguiente = new Date(date); siguiente.setDate(siguiente.getDate() + 1);
  const hoy = new Date().toLocaleDateString('en-CA');
  const esHoy = fecha === hoy;

  const fmt = d => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex items-center gap-2 bg-white rounded-2xl border border-red-100 p-2 mb-4">
      <button
        onClick={() => onChange(anterior.toISOString().split('T')[0])}
        className="p-2 rounded-xl hover:bg-red-50 transition-colors"
      >
        <ChevronLeft size={20} className="text-red-500" />
      </button>
      <div className="flex-1 text-center">
        <p className="text-sm font-bold text-gray-700 capitalize">{fmt(date)}</p>
        {esHoy && <p className="text-xs font-black text-red-500">Hoy</p>}
      </div>
      <button
        onClick={() => !esHoy && onChange(siguiente.toISOString().split('T')[0])}
        disabled={esHoy}
        className={`p-2 rounded-xl transition-colors ${esHoy ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50'}`}
      >
        <ChevronRight size={20} className="text-red-500" />
      </button>
    </div>
  );
}

function SelectorHijo({ hijos, alumnoId, nombre, onSelect }) {
  return (
    <div className="space-y-3 mb-6">
      <h2 className="text-base font-black text-gray-700">Selecciona a tu hijo/a</h2>
      {hijos.map(h => (
        <Link
          key={h.id}
          to={`/padre/bitacora?alumnoId=${h.id}&nombre=${encodeURIComponent(h.nombre_completo)}`}
          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
            alumnoId === h.id
              ? 'border-red-400 bg-red-50'
              : 'border-gray-100 bg-white hover:border-red-200'
          }`}
        >
          {h.foto_url
            ? <img src={h.foto_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
            : <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl">👧🏻</div>
          }
          <div>
            <p className="font-black text-gray-800">{h.nombre_completo}</p>
            <p className="text-sm font-semibold text-red-500">{h.grupo_nombre || h.grupo}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function PadreBitacora() {
  const [params] = useSearchParams();
  const alumnoId = params.get('alumnoId');
  const nombreParam = params.get('nombre');
  const hoy = new Date().toLocaleDateString('en-CA');
  const [fecha, setFecha] = useState(hoy);

  const { data: hijos = [] } = useQuery({
    queryKey: ['mis-hijos'],
    queryFn: () => api.get('/alumnos/mis-hijos').then(r => r.data),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bitacora-padre', alumnoId, fecha],
    queryFn: () => api.get(`/bitacora/${alumnoId}?fecha=${fecha}`).then(r => r.data),
    enabled: !!alumnoId,
    retry: 1,
  });

  const bit     = data?.bitacora;
  const banio   = data?.banio;
  const comida  = data?.comida;
  const panial  = data?.panial || [];
  const esf     = data?.esfinteres;
  const meds    = data?.medicamentos || [];
  const incidentes = data?.incidentes || [];
  const actividades = data?.actividades || [];

  const nombreHijo = nombreParam ? decodeURIComponent(nombreParam) : hijos.find(h => h.id === alumnoId)?.nombre_completo || 'Mi hijo/a';

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800">Bitácora</h1>
        {alumnoId && (
          <p className="text-sm font-bold text-red-500 mt-0.5">{nombreHijo}</p>
        )}
      </div>

      {/* Selector de hijo */}
      {hijos.length > 1 && (
        <SelectorHijo hijos={hijos} alumnoId={alumnoId} nombreParam={nombreParam} />
      )}

      {!alumnoId && hijos.length === 1 && (
        <Navigate replace to={`/padre/bitacora?alumnoId=${hijos[0].id}&nombre=${encodeURIComponent(hijos[0].nombre_completo)}`} />
      )}

      {alumnoId && (
        <>
          <SelectorFecha fecha={fecha} onChange={setFecha} />

          {isLoading && (
            <div className="card-hs p-12 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full" />
            </div>
          )}

          {isError && (
            <div className="card-hs p-8 text-center">
              <div className="text-4xl mb-2">😕</div>
              <p className="text-gray-500 font-semibold">No se pudo cargar la bitácora</p>
            </div>
          )}

          {!isLoading && !isError && !bit && (
            <div className="card-hs p-10 text-center">
              <div className="text-5xl mb-3">📝</div>
              <h3 className="font-black text-gray-700 text-lg mb-1">Bitácora no disponible</h3>
              <p className="text-sm text-gray-400 font-semibold">
                {fecha === hoy
                  ? 'La maestra aún no ha guardado la bitácora de hoy. Vuelve más tarde.'
                  : 'No hay registro para esta fecha.'}
              </p>
            </div>
          )}

          {!isLoading && bit && (
            <div className="space-y-4">
              {/* Héroe ánimo */}
              <div className="card-hs p-6 text-center border border-red-100">
                <div className="text-6xl mb-2">{ANIMO[bit.estado_animo]?.emoji || '🤔'}</div>
                <p className="text-xl font-black text-gray-800">{ANIMO[bit.estado_animo]?.label || 'Sin registrar'}</p>
                <p className="text-xs font-semibold text-gray-400 mt-1">Estado de ánimo del día</p>
              </div>

              {/* Resumen rápido */}
              <div className="card-hs p-4 grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-2xl">{comida ? (CUANTO[comida.cuanto_comio]?.emoji || '🍽️') : '—'}</div>
                  <p className="text-xs font-semibold text-gray-400 mt-1">Comida</p>
                </div>
                <div>
                  <div className="text-2xl">{bit.actividad_realizada === true ? '🎨' : bit.actividad_realizada === false ? '❌' : '—'}</div>
                  <p className="text-xs font-semibold text-gray-400 mt-1">Actividades</p>
                </div>
                <div>
                  <div className="text-2xl">{COMPORTAMIENTO[bit.comportamiento]?.emoji || '—'}</div>
                  <p className="text-xs font-semibold text-gray-400 mt-1">Conducta</p>
                </div>
                <div>
                  <div className="text-2xl">{bit.tuvo_fiebre ? '🤒' : '😊'}</div>
                  <p className="text-xs font-semibold text-gray-400 mt-1">Salud</p>
                </div>
              </div>

              {/* Alimentación */}
              {comida && (
                <Seccion titulo="Alimentación" emoji="🍽️">
                  {comida.que_comio && <p className="text-sm text-gray-600">{comida.que_comio}</p>}
                  <FilaInfo label="¿Cuánto comió?" valor={CUANTO[comida.cuanto_comio]?.label} />
                  <FilaInfo label="Observaciones" valor={comida.observaciones} />
                </Seccion>
              )}

              {/* Actividades y conducta */}
              <Seccion titulo="Actividades y conducta" emoji="🎨">
                {bit.actividad_descripcion && (
                  <div className="bg-purple-50 rounded-xl p-3 mb-3">
                    <p className="text-sm font-semibold text-purple-700">📝 {bit.actividad_descripcion}</p>
                  </div>
                )}
                <FilaInfo
                  label="Participación"
                  valor={bit.actividad_realizada === true ? 'Sí participó ✓' : bit.actividad_realizada === false ? 'No participó ✗' : null}
                />
                {bit.comportamiento && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold ${COMPORTAMIENTO[bit.comportamiento]?.color}`}>
                    <span className="text-xl">{COMPORTAMIENTO[bit.comportamiento]?.emoji}</span>
                    {COMPORTAMIENTO[bit.comportamiento]?.label}
                  </div>
                )}
                <FilaInfo label="Notas de conducta" valor={bit.comportamiento_notas} />
              </Seccion>

              {/* Baño */}
              {banio && (
                <Seccion titulo="Baño" emoji="🚿">
                  <div className="flex gap-6 justify-center py-2">
                    <div className="text-center">
                      <p className="text-4xl font-black text-gray-800">{banio.pipi_count || 0}</p>
                      <p className="text-sm font-bold text-gray-500 mt-1">Pipí 🚿</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-black text-gray-800">{banio.popo_count || 0}</p>
                      <p className="text-sm font-bold text-gray-500 mt-1">Popó 💩</p>
                    </div>
                  </div>
                </Seccion>
              )}

              {/* Pañal */}
              {panial.length > 0 && (
                <Seccion titulo="Cambios de pañal" emoji="👶🏻">
                  <div className="space-y-2">
                    {panial.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-black text-purple-600 w-12">
                          {new Date(p.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {p.condicion.charAt(0).toUpperCase() + p.condicion.slice(1)}
                          {p.tiene_irritacion ? ' · ⚠️ irritación' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </Seccion>
              )}

              {/* Esfínteres */}
              {esf && (
                <Seccion titulo="Control de esfínteres" emoji="🚽">
                  <div className="flex flex-wrap gap-2">
                    <PildoraBool label="Fue solo/a"     valor={esf.fue_solo}          />
                    <PildoraBool label="Pidió ir"       valor={esf.pidio_ir}           />
                    <PildoraBool label="Accidente"      valor={esf.tuvo_accidente}     />
                    <PildoraBool label="Necesitó ayuda" valor={esf.necesito_ayuda}     />
                  </div>
                  <FilaInfo label="Notas de progreso" valor={esf.notas_progreso} />
                </Seccion>
              )}

              {/* Salud */}
              {(bit.tuvo_fiebre || bit.se_enfermo) && (
                <Seccion titulo="Salud" emoji="🌡️">
                  {bit.tuvo_fiebre && (
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3">
                      <p className="text-sm font-bold text-red-700">
                        🌡 Tuvo fiebre{bit.temperatura_dia ? ` — ${bit.temperatura_dia}°C` : ''}
                      </p>
                    </div>
                  )}
                  {bit.se_enfermo && (
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3">
                      <p className="text-sm font-bold text-red-700">
                        ⚕️ {bit.descripcion_enfermedad || 'Presentó malestar'}
                      </p>
                    </div>
                  )}
                </Seccion>
              )}

              {/* Medicamentos */}
              {meds.length > 0 && (
                <Seccion titulo="Medicamentos" emoji="💊">
                  {meds.map((m, i) => (
                    <div key={i} className="bg-purple-50 rounded-xl p-3">
                      <p className="font-black text-purple-800">{m.nombre}</p>
                      <p className="text-xs text-purple-600 font-semibold mt-0.5">
                        Dosis: {m.dosis} · {new Date(m.hora_administracion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {m.notas && <p className="text-xs text-gray-500 mt-1">{m.notas}</p>}
                    </div>
                  ))}
                </Seccion>
              )}

              {/* Galería de actividades */}
              {actividades.length > 0 && (
                <Seccion titulo="Galería de actividades" emoji="📷">
                  <div className="grid grid-cols-3 gap-3">
                    {actividades.map((a, i) => (
                      <a key={i} href={a.foto_url} target="_blank" rel="noreferrer" className="group">
                        <img
                          src={a.foto_url}
                          alt="Actividad"
                          className="w-full aspect-square object-cover rounded-xl border-2 border-purple-100 group-hover:border-purple-400 transition-all"
                        />
                      </a>
                    ))}
                  </div>
                  {actividades[0]?.descripcion && (
                    <p className="text-xs text-gray-500 mt-3 italic">{actividades[0].descripcion}</p>
                  )}
                </Seccion>
              )}

              {/* Incidentes */}
              {incidentes.length > 0 && (
                <Seccion titulo="Incidentes del día" emoji="⚠️">
                  {incidentes.map((inc, i) => (
                    <div key={i} className="bg-red-50 border-l-4 border-red-400 rounded-xl p-3 space-y-1">
                      <p className="text-sm font-black text-red-800">{inc.descripcion}</p>
                      {inc.acciones_tomadas && (
                        <p className="text-xs text-red-600">Acciones: {inc.acciones_tomadas}</p>
                      )}
                      {inc.fotos_urls?.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {inc.fotos_urls.map((url, j) => (
                            <a key={j} href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt="Foto" className="w-16 h-16 object-cover rounded-lg border border-red-200" />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-red-400">
                        {new Date(inc.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </Seccion>
              )}

              {/* Notas */}
              {bit.notas && (
                <Seccion titulo="Mensaje de la maestra" emoji="💬">
                  <p className="text-sm text-gray-600 italic bg-yellow-50 rounded-xl p-3 leading-relaxed">
                    {bit.notas}
                  </p>
                </Seccion>
              )}

              {bit.maestra_nombre && (
                <p className="text-center text-xs text-gray-400 font-semibold pb-2">
                  Registrado por {bit.maestra_nombre}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

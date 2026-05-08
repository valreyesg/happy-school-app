// ─── utils/fecha.js — Happy School ───────────────────────────────────────────
// Centraliza constantes y helpers de fecha/tiempo usados en toda la app web.

// ── Meses ─────────────────────────────────────────────────────────────────────

/** Nombres completos: índice 0 = Enero */
export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

/** Abreviaciones: índice 0 = Ene */
export const MESES_CORTOS = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic',
];

/** Con índice 1 (para cuando el mes viene de la BD como 1-12): índice 0 vacío */
export const MESES_LABEL = ['', ...MESES];

// ── Día hábil ─────────────────────────────────────────────────────────────────

/**
 * Devuelve la fecha del último día hábil (lunes–viernes) como string 'YYYY-MM-DD'.
 * Si hoy es día hábil, devuelve hoy.
 */
export function ultimoDiaHabil() {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
}

/**
 * Devuelve la fecha del siguiente día hábil (lunes–viernes) a partir de `fecha`.
 * @param {Date} [fecha=new Date()] fecha base
 */
export function proximoDiaHabil(fecha = new Date()) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
}

// ── Salida anticipada / tardía ────────────────────────────────────────────────

/**
 * Devuelve true si la hora actual es antes de horaSalidaNormal (string 'HH:MM').
 */
export function esSalidaAnticipada(horaSalidaNormal) {
  if (!horaSalidaNormal) return false;
  const ahora = new Date();
  const [h, m] = horaSalidaNormal.split(':').map(Number);
  const limite = new Date();
  limite.setHours(h, m, 0, 0);
  return ahora < limite;
}

/**
 * Devuelve true si el alumno no tiene extensión y ya pasó la hora de inicio de cobro por extensión.
 */
export function esSalidaTardia(alumno, horaInicioCobro) {
  if (!horaInicioCobro || alumno?.tiene_extension) return false;
  const ahora = new Date();
  const [h, m] = horaInicioCobro.split(':').map(Number);
  const limite = new Date();
  limite.setHours(h, m, 0, 0);
  return ahora >= limite;
}

// ── Saludo por hora ───────────────────────────────────────────────────────────

/** Devuelve 'Buenos días', 'Buenas tardes' o 'Buenas noches' según la hora actual. */
export function saludoHora() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ── Tratamiento por parentesco (portal padre) ─────────────────────────────────

export const TRATAMIENTO_PARENTESCO = {
  mama:   'Mamá',
  papá:   'Papá',
  papa:   'Papá',
  abuelo: 'Abuelo',
  abuela: 'Abuela',
  tio:    'Tío',
  tia:    'Tía',
  tutor:  'Tutor',
};

/**
 * Genera el saludo personalizado para el padre.
 * @param {string} parentesco  parentesco del usuario
 * @param {string} nombre      nombre completo del usuario
 */
export function saludoPadre(parentesco, nombre) {
  const tratamiento = TRATAMIENTO_PARENTESCO[parentesco?.toLowerCase()];
  const destinatario = tratamiento
    ? `${tratamiento} ${nombre?.split(' ')[0] ?? ''}`
    : nombre?.split(' ')[0] ?? '';
  return `¡${saludoHora()}, ${destinatario}!`;
}

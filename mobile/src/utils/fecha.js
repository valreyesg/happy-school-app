// ─── utils/fecha.js — Happy School Mobile ────────────────────────────────────
// Centraliza helpers de fecha/tiempo usados en toda la app mobile.

/** Devuelve 'Buenos días', 'Buenas tardes' o 'Buenas noches' según la hora actual. */
export function saludoHora() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Devuelve la fecha del último día hábil (lunes–viernes) como string 'YYYY-MM-DD'. */
export function ultimoDiaHabil() {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
}

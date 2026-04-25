export function buildGoogleCalendarUrl(evento) {
  const {
    titulo, descripcion, fecha_inicio, fecha_fin,
    es_todo_el_dia, categoria_nombre, categoria_icono,
  } = evento;

  let datesStr;
  if (es_todo_el_dia) {
    const inicio = fecha_inicio.substring(0, 10).replace(/-/g, '');
    let finDate;
    if (fecha_fin) {
      finDate = fecha_fin.substring(0, 10).replace(/-/g, '');
    } else {
      // Google Calendar excluye el último día, sumar 1 día
      const d = new Date(fecha_inicio.substring(0, 10) + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      finDate = d.toISOString().substring(0, 10).replace(/-/g, '');
    }
    datesStr = `${inicio}/${finDate}`;
  } else {
    const fmt = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace('.000', '');
    const fin = fecha_fin ? fmt(fecha_fin) : fmt(fecha_inicio);
    datesStr = `${fmt(fecha_inicio)}/${fin}`;
  }

  let details = '';
  if (categoria_icono && categoria_nombre) details += `${categoria_icono} ${categoria_nombre}\n`;
  if (descripcion) details += descripcion + '\n';
  details += '\nAgregado desde Happy School 🏫';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: datesStr,
    details: details.trim(),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

router.use(authenticate);

// ── GET /calendario/categorias ────────────────────────────────────────────────
router.get('/categorias', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categorias_evento WHERE activo = true ORDER BY nombre');
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /calendario/categorias ───────────────────────────────────────────────
router.post('/categorias', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, color_hex, icono } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
    const result = await query(
      'INSERT INTO categorias_evento (nombre, color_hex, icono) VALUES ($1,$2,$3) RETURNING *',
      [nombre, color_hex || '#805AD5', icono || '📅']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /calendario/export-pdf ────────────────────────────────────────────────
// ?mes=YYYY-MM  genera un PDF del calendario mensual con diseño infantil
router.get('/export-pdf', async (req, res, next) => {
  try {
    const { mes } = req.query;
    const [y, m] = mes ? mes.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
    const fechaDesde = new Date(y, m - 1, 1).toISOString();
    const fechaHasta = new Date(y, m, 0, 23, 59, 59).toISOString();

    const params = [fechaDesde, fechaHasta];
    let sql = `
      SELECT e.*, c.nombre AS categoria_nombre, c.color_hex AS categoria_color, c.icono AS categoria_icono,
             g.nombre AS grupo_nombre
      FROM eventos e
      LEFT JOIN categorias_evento c ON e.categoria_id = c.id
      LEFT JOIN grupos g ON e.grupo_id = g.id
      WHERE e.fecha_inicio >= $1 AND e.fecha_inicio <= $2 AND e.publicado = true
      ORDER BY e.fecha_inicio ASC
    `;
    const result = await query(sql, params);
    const eventos = result.rows;

    // ── Construir PDF ──────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                   'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const DIAS  = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];

    // Paleta
    const C = {
      purple: rgb(0.502, 0.353, 0.816),
      purpleLight: rgb(0.941, 0.906, 0.980),
      gray: rgb(0.451, 0.451, 0.451),
      grayLight: rgb(0.949, 0.949, 0.949),
      white: rgb(1, 1, 1),
      black: rgb(0.176, 0.176, 0.176),
      today: rgb(0.502, 0.353, 0.816),
    };

    // ── Encabezado ─────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: C.purple });
    page.drawText('Happy School', { x: 30, y: height - 38, size: 18, font: fontBold, color: C.white });
    const tituloMes = `${MESES[m - 1]} ${y}`;
    const tituloW = fontBold.widthOfTextAtSize(tituloMes, 22);
    page.drawText(tituloMes, { x: (width - tituloW) / 2, y: height - 40, size: 22, font: fontBold, color: C.white });
    page.drawText(`${eventos.length} evento${eventos.length !== 1 ? 's' : ''}`, {
      x: width - 120, y: height - 38, size: 12, font: fontNormal, color: C.purpleLight,
    });

    // ── Grilla ─────────────────────────────────────────────────────────────────
    const gridTop    = height - 70;
    const gridLeft   = 20;
    const gridWidth  = width - 40;
    const colW       = gridWidth / 7;
    const headerH    = 22;
    const rowH       = 68;
    const rows       = 6;

    // Cabecera de días
    DIAS.forEach((d, i) => {
      const x = gridLeft + i * colW;
      page.drawRectangle({ x, y: gridTop - headerH, width: colW, height: headerH, color: C.purpleLight });
      const tw = fontBold.widthOfTextAtSize(d, 9);
      page.drawText(d, { x: x + (colW - tw) / 2, y: gridTop - headerH + 7, size: 9, font: fontBold, color: C.purple });
    });

    // Celdas
    const primerDia = new Date(y, m - 1, 1).getDay();
    const totalDias = new Date(y, m, 0).getDate();
    const hoyDate   = new Date();
    const esHoy     = (d) => hoyDate.getFullYear() === y && hoyDate.getMonth() === m - 1 && hoyDate.getDate() === d;

    // Mapa día → eventos
    const evsPorDia = {};
    eventos.forEach(ev => {
      const d = new Date(ev.fecha_inicio).getDate();
      if (!evsPorDia[d]) evsPorDia[d] = [];
      evsPorDia[d].push(ev);
    });

    let col = primerDia;
    let row = 0;
    for (let d = 1; d <= totalDias; d++) {
      const x = gridLeft + col * colW;
      const y0 = gridTop - headerH - (row + 1) * rowH;

      // Fondo celda
      page.drawRectangle({ x, y: y0, width: colW, height: rowH,
        color: esHoy(d) ? C.purpleLight : C.white,
        borderColor: rgb(0.878, 0.878, 0.878), borderWidth: 0.5 });

      // Número de día
      if (esHoy(d)) {
        page.drawCircle({ x: x + 11, y: y0 + rowH - 11, size: 9, color: C.today });
        page.drawText(String(d), { x: x + (d < 10 ? 8 : 5), y: y0 + rowH - 15, size: 8, font: fontBold, color: C.white });
      } else {
        page.drawText(String(d), { x: x + (d < 10 ? 8 : 5), y: y0 + rowH - 14, size: 8, font: fontBold, color: C.black });
      }

      // Chips de eventos (máx 3)
      const evs = evsPorDia[d] || [];
      evs.slice(0, 3).forEach((ev, idx) => {
        const chipY = y0 + rowH - 26 - idx * 14;
        const hexColor = ev.categoria_color || '#805AD5';
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;
        const chipColor = rgb(r, g, b);
        const chipBg = rgb(r * 0.15 + 0.85, g * 0.15 + 0.85, b * 0.15 + 0.85);

        page.drawRectangle({ x: x + 2, y: chipY, width: colW - 4, height: 12, color: chipBg, borderRadius: 2 });

        // Título truncado a ~18 chars — solo ASCII para WinAnsi
        const tituloRaw = ev.titulo.replace(/[^\x00-\xFF]/g, '');
        const titulo = tituloRaw.length > 17 ? tituloRaw.substring(0, 16) + '...' : tituloRaw;
        page.drawText(titulo, { x: x + 4, y: chipY + 3, size: 6.5, font: fontNormal, color: chipColor });
      });
      if (evs.length > 3) {
        page.drawText(`+${evs.length - 3}`, { x: x + 4, y: y0 + 3, size: 6, font: fontBold, color: C.gray });
      }

      col++;
      if (col === 7) { col = 0; row++; }
    }

    // ── Leyenda de categorías (pie de página) ──────────────────────────────────
    const categoriasUsadas = [...new Map(eventos.filter(e => e.categoria_nombre)
      .map(e => [e.categoria_nombre, e])).values()];

    if (categoriasUsadas.length > 0) {
      let lx = gridLeft;
      const ly = 10;
      page.drawText('Categorias: ', { x: lx, y: ly + 4, size: 7, font: fontBold, color: C.gray });
      lx += 58;
      categoriasUsadas.slice(0, 9).forEach(ev => {
        const hexColor = ev.categoria_color || '#805AD5';
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;
        page.drawRectangle({ x: lx, y: ly + 2, width: 8, height: 8, color: rgb(r, g, b), borderRadius: 2 });
        const label = ev.categoria_nombre || '';
        page.drawText(label, { x: lx + 11, y: ly + 4, size: 7, font: fontNormal, color: C.gray });
        lx += fontNormal.widthOfTextAtSize(label, 7) + 22;
      });
    }

    const pdfBytes = await pdfDoc.save();
    const nombreMes = MESES[m - 1].toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="calendario-${nombreMes}-${y}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) { next(err); }
});

// ── GET /calendario ───────────────────────────────────────────────────────────
// ?mes=YYYY-MM  |  ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  |  ?grupo_id=uuid
router.get('/', async (req, res, next) => {
  try {
    const { mes, desde, hasta, grupo_id } = req.query;

    let fechaDesde, fechaHasta;
    if (mes) {
      const [y, m] = mes.split('-').map(Number);
      fechaDesde = new Date(y, m - 1, 1).toISOString();
      fechaHasta = new Date(y, m, 0, 23, 59, 59).toISOString();
    } else {
      const now = new Date();
      fechaDesde = desde || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      fechaHasta = hasta || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    }

    const params = [fechaDesde, fechaHasta];
    let sql = `
      SELECT
        e.*,
        c.nombre AS categoria_nombre, c.color_hex AS categoria_color, c.icono AS categoria_icono,
        g.nombre AS grupo_nombre,
        u.nombre AS creado_por_nombre
      FROM eventos e
      LEFT JOIN categorias_evento c ON e.categoria_id = c.id
      LEFT JOIN grupos g ON e.grupo_id = g.id
      LEFT JOIN usuarios u ON e.creado_por = u.id
      WHERE e.fecha_inicio >= $1 AND e.fecha_inicio <= $2
    `;

    if (req.user.rol_principal === 'padre') {
      sql += ` AND e.publicado = true`;
      params.push(req.user.id);
      sql += ` AND (
        e.grupo_id IS NULL
        OR e.grupo_id IN (
          SELECT a.grupo_id FROM alumnos a
          JOIN alumno_padre ap ON ap.alumno_id = a.id
          WHERE ap.padre_id = $${params.length}
            AND a.deleted_at IS NULL
        )
      )`;
    }

    if (grupo_id) {
      params.push(grupo_id);
      sql += ` AND (e.grupo_id = $${params.length} OR e.grupo_id IS NULL)`;
    }

    sql += ' ORDER BY e.fecha_inicio ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /calendario/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT e.*, c.nombre AS categoria_nombre, c.color_hex AS categoria_color, c.icono AS categoria_icono,
             g.nombre AS grupo_nombre, u.nombre AS creado_por_nombre
      FROM eventos e
      LEFT JOIN categorias_evento c ON e.categoria_id = c.id
      LEFT JOIN grupos g ON e.grupo_id = g.id
      LEFT JOIN usuarios u ON e.creado_por = u.id
      WHERE e.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /calendario ──────────────────────────────────────────────────────────
router.post('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id, publicado, ubicacion, recordatorio_horas } = req.body;
    if (!titulo || !fecha_inicio) return res.status(400).json({ error: 'titulo y fecha_inicio son obligatorios' });

    const result = await query(`
      INSERT INTO eventos (titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id, publicado, ubicacion, recordatorio_horas, creado_por)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [titulo, descripcion || null, categoria_id || null, fecha_inicio,
        fecha_fin || null, es_todo_el_dia || false, grupo_id || null, publicado ?? true,
        ubicacion || null, recordatorio_horas || null, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PUT /calendario/:id ───────────────────────────────────────────────────────
router.put('/:id', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id, publicado, ubicacion, recordatorio_horas } = req.body;

    await query(`
      UPDATE eventos SET
        titulo             = COALESCE($1, titulo),
        descripcion        = COALESCE($2, descripcion),
        categoria_id       = COALESCE($3, categoria_id),
        fecha_inicio       = COALESCE($4, fecha_inicio),
        fecha_fin          = COALESCE($5, fecha_fin),
        es_todo_el_dia     = COALESCE($6, es_todo_el_dia),
        grupo_id           = $7,
        publicado          = COALESCE($8, publicado),
        ubicacion          = $9,
        recordatorio_horas = COALESCE($10, recordatorio_horas),
        updated_at         = NOW()
      WHERE id = $11
    `, [titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id ?? null, publicado, ubicacion || null, recordatorio_horas, req.params.id]);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── DELETE /calendario/:id ────────────────────────────────────────────────────
router.delete('/:id', authorize('directora'), async (req, res, next) => {
  try {
    await query('DELETE FROM eventos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;

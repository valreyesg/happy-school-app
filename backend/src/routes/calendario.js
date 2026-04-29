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

// ── GET /calendario/categorias/admin ──────────────────────────────────────────
// Lista activos e inactivos (solo directora)
router.get('/categorias/admin', authorize('directora'), async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categorias_evento ORDER BY activo DESC, nombre ASC');
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── PUT /calendario/categorias/:id ───────────────────────────────────────────
// Editar categoría o cambiar activo
router.put('/categorias/:id', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, color_hex, icono, activo } = req.body;
    // Si solo se envía activo (reactivar/inactivar)
    if (activo !== undefined && !nombre && !color_hex && !icono) {
      await query('UPDATE categorias_evento SET activo = $1 WHERE id = $2', [activo, req.params.id]);
      return res.json({ ok: true });
    }
    const result = await query(
      `UPDATE categorias_evento
       SET nombre = COALESCE($1, nombre),
           color_hex = COALESCE($2, color_hex),
           icono = COALESCE($3, icono)
       WHERE id = $4
       RETURNING *`,
      [nombre || null, color_hex || null, icono || null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    next(err);
  }
});

// ── DELETE /calendario/categorias/:id ─────────────────────────────────────────
// Soft-delete: inactivar categoría
router.delete('/categorias/:id', authorize('directora'), async (req, res, next) => {
  try {
    await query('UPDATE categorias_evento SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
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

    // Paleta — colores vibrantes infantiles
    const C = {
      purple: rgb(0.408, 0.216, 0.780),        // púrpura más saturado
      purpleDark: rgb(0.271, 0.133, 0.545),    // púrpura oscuro para encabezado
      purpleLight: rgb(0.918, 0.878, 0.980),   // púrpura muy claro
      coral: rgb(1.000, 0.431, 0.420),         // coral infantil
      mint: rgb(0.278, 0.839, 0.698),          // menta
      yellow: rgb(1.000, 0.839, 0.200),        // amarillo
      sky: rgb(0.302, 0.686, 0.965),           // azul cielo
      gray: rgb(0.451, 0.451, 0.451),
      grayLight: rgb(0.961, 0.961, 0.961),
      grayBorder: rgb(0.859, 0.839, 0.902),    // gris con tinte púrpura
      white: rgb(1, 1, 1),
      black: rgb(0.133, 0.133, 0.133),
      today: rgb(0.408, 0.216, 0.780),
    };

    // ── Encabezado ─────────────────────────────────────────────────────────────
    // Fondo púrpura oscuro
    page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: C.purpleDark });

    // Banda coral decorativa (4 pt al fondo)
    page.drawRectangle({ x: 0, y: height - 60, width, height: 4, color: C.coral });

    // Círculos decorativos en esquinas (simular opacidad con gris claro)
    page.drawCircle({ x: 820, y: height - 15, size: 14, color: rgb(0.85, 0.80, 0.95) });
    page.drawCircle({ x: 800, y: height - 20, size: 8, color: rgb(0.85, 0.80, 0.95) });
    page.drawCircle({ x: 22, y: height - 15, size: 10, color: rgb(0.85, 0.80, 0.95) });

    page.drawText('Happy School', { x: 30, y: height - 38, size: 20, font: fontBold, color: C.white });
    const tituloMes = `${MESES[m - 1]} ${y}`;
    const tituloW = fontBold.widthOfTextAtSize(tituloMes, 24);
    page.drawText(tituloMes, { x: (width - tituloW) / 2, y: height - 40, size: 24, font: fontBold, color: C.white });
    page.drawText(`${eventos.length} evento${eventos.length !== 1 ? 's' : ''}`, {
      x: width - 120, y: height - 38, size: 12, font: fontNormal, color: C.yellow,
    });

    // ── Grilla ─────────────────────────────────────────────────────────────────
    const gridTop    = height - 70;
    const gridLeft   = 20;
    const gridWidth  = width - 40;
    const colW       = gridWidth / 7;
    const headerH    = 26;  // aumentado de 22 a 26 pt
    const rowH       = 76;  // aumentado de 68 a 76 pt
    const rows       = 6;

    // Cabecera de días — columnas alternadas (fin de semana más intenso)
    DIAS.forEach((d, i) => {
      const x = gridLeft + i * colW;
      const esFinDeSemana = i === 0 || i === 6;
      const headerBg = esFinDeSemana ? rgb(0.961, 0.918, 0.980) : C.purpleLight;
      page.drawRectangle({ x, y: gridTop - headerH, width: colW, height: headerH, color: headerBg });
      const tw = fontBold.widthOfTextAtSize(d, 10);
      page.drawText(d, { x: x + (colW - tw) / 2, y: gridTop - headerH + 8, size: 10, font: fontBold, color: C.purpleDark });
    });

    // Línea separadora al fondo de la cabecera (1.5 pt púrpura)
    page.drawLine({
      start: { x: gridLeft, y: gridTop - headerH },
      end: { x: gridLeft + gridWidth, y: gridTop - headerH },
      thickness: 1.5,
      color: C.purple
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
      const esFinDeSemana = col === 0 || col === 6;

      // Fondo celda — fin de semana con tinte púrpura, hoy destaca
      const cellBg = esHoy(d) ? C.purpleLight : (esFinDeSemana ? rgb(0.980, 0.976, 0.988) : C.white);
      page.drawRectangle({ x, y: y0, width: colW, height: rowH,
        color: cellBg,
        borderColor: esHoy(d) ? C.purple : C.grayBorder,
        borderWidth: esHoy(d) ? 1.5 : 0.5 });

      // Número de día
      if (esHoy(d)) {
        page.drawCircle({ x: x + 11, y: y0 + rowH - 11, size: 11, color: C.today });
        page.drawText(String(d), { x: x + (d < 10 ? 8 : 5), y: y0 + rowH - 15, size: 9, font: fontBold, color: C.white });
      } else {
        page.drawText(String(d), { x: x + (d < 10 ? 8 : 5), y: y0 + rowH - 14, size: 9, font: fontBold, color: C.black });
      }

      // Chips de eventos (máx 3) — con barra lateral de color
      const evs = evsPorDia[d] || [];
      evs.slice(0, 3).forEach((ev, idx) => {
        const chipY = y0 + rowH - 28 - idx * 16;
        const hexColor = ev.categoria_color || '#805AD5';
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;
        const chipColor = rgb(r, g, b);
        const chipBg = rgb(r * 0.15 + 0.85, g * 0.15 + 0.85, b * 0.15 + 0.85);

        // Barra lateral de color (3 pt de ancho, left)
        page.drawRectangle({ x: x + 2, y: chipY, width: 3, height: 13, color: chipColor, borderRadius: 1 });

        // Fondo del chip (desplazado 5 pt para dejar espacio al punto)
        page.drawRectangle({ x: x + 5, y: chipY, width: colW - 7, height: 13, color: chipBg, borderRadius: 3 });

        // Título truncado — solo ASCII para WinAnsi
        const tituloRaw = ev.titulo.replace(/[^\x00-\xFF]/g, '');
        const titulo = tituloRaw.length > 17 ? tituloRaw.substring(0, 16) + '...' : tituloRaw;
        page.drawText(titulo, { x: x + 8, y: chipY + 3, size: 7.5, font: fontNormal, color: chipColor });
      });

      // Indicador +N eventos adicionales
      if (evs.length > 3) {
        page.drawRectangle({ x: x + 2, y: y0 + 2, width: 22, height: 10, color: C.purpleLight, borderRadius: 3 });
        page.drawText(`+${evs.length - 3}`, { x: x + 4, y: y0 + 3, size: 7, font: fontBold, color: C.purple });
      }

      col++;
      if (col === 7) { col = 0; row++; }
    }

    // ── Línea separadora decorativa antes de leyenda ───────────────────────────
    const dottedLineY = 32;
    for (let px = gridLeft; px < gridLeft + gridWidth; px += 7) {
      page.drawCircle({ x: px + 1.5, y: dottedLineY, size: 1, color: C.purple });
    }

    // ── Leyenda de categorías (pie de página) ──────────────────────────────────
    const categoriasUsadas = [...new Map(eventos.filter(e => e.categoria_nombre)
      .map(e => [e.categoria_nombre, e])).values()];

    if (categoriasUsadas.length > 0) {
      let lx = gridLeft;
      const ly = 14;
      page.drawText('Categorias: ', { x: lx, y: ly + 4, size: 7, font: fontBold, color: C.gray });
      lx += 58;
      categoriasUsadas.slice(0, 9).forEach(ev => {
        const hexColor = ev.categoria_color || '#805AD5';
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;
        page.drawRectangle({ x: lx, y: ly + 2, width: 10, height: 10, color: rgb(r, g, b), borderRadius: 2 });
        const label = ev.categoria_nombre || '';
        page.drawText(label, { x: lx + 13, y: ly + 4, size: 7, font: fontNormal, color: C.gray });
        lx += fontNormal.widthOfTextAtSize(label, 7) + 24;
      });
    }

    // ── Segunda página: Lista detallada de eventos ─────────────────────────────
    if (eventos.length > 0) {
      // Helper: formatear fecha a "Lun 7 Abr"
      const formatFecha = (iso) => {
        const DIAS_ES = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
        const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const d = new Date(iso);
        return `${DIAS_ES[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
      };

      // Helper: calcular altura de la tarjeta
      const calcCardHeight = (ev) => {
        const desc = ev.descripcion ? ev.descripcion.replace(/[^\x00-\xFF]/g, '').trim() : '';
        const ubic = ev.ubicacion ? ev.ubicacion.replace(/[^\x00-\xFF]/g, '').trim() : '';
        let h = 26;
        if (desc) h += 13;
        if (desc && desc.length > 55) h += 10;
        if (ubic) h += 11;
        return h;
      };

      // Crear página 2 (A4 vertical)
      const page2 = pdfDoc.addPage([595, 842]);
      const { width: w2, height: h2 } = page2.getSize();

      // Encabezado página 2
      page2.drawRectangle({ x: 0, y: h2 - 40, width: w2, height: 40, color: C.purpleDark });
      page2.drawRectangle({ x: 0, y: h2 - 40, width: w2, height: 3, color: C.coral });
      const tituloP2 = `Detalle de Eventos — ${MESES[m - 1]} ${y}`;
      const tituloP2W = fontBold.widthOfTextAtSize(tituloP2, 14);
      page2.drawText(tituloP2, { x: (w2 - tituloP2W) / 2, y: h2 - 30, size: 14, font: fontBold, color: C.white });
      page2.drawText('Happy School', { x: 20, y: h2 - 38, size: 9, font: fontNormal, color: C.purpleLight });

      const contentLeft = 30;
      const contentRight = 565;
      const contentWidth = contentRight - contentLeft;
      const contentTop = h2 - 50;
      const PAGE_BOTTOM = 30;
      const GAP = 4;

      // Renderizar eventos con paginación automática
      let currentY = contentTop;
      let currentPage = page2;
      let pageIndex = 2;

      for (const ev of eventos) {
        const cardH = calcCardHeight(ev);

        // Si no cabe, agregar nueva página
        if (currentY - cardH < PAGE_BOTTOM) {
          pageIndex++;
          const extraPage = pdfDoc.addPage([595, 842]);
          currentPage = extraPage;
          currentY = h2 - 50;
        }

        // Dibujar tarjeta de evento
        const indice = eventos.indexOf(ev);
        const cellBg = (indice % 2 === 0) ? C.white : C.grayLight;

        currentPage.drawRectangle({
          x: contentLeft, y: currentY - cardH,
          width: contentWidth, height: cardH,
          color: cellBg, borderRadius: 4
        });

        // Barra lateral de color de categoría (4 pt)
        if (ev.categoria_color) {
          const hexColor = ev.categoria_color || '#805AD5';
          const r = parseInt(hexColor.slice(1, 3), 16) / 255;
          const g = parseInt(hexColor.slice(3, 5), 16) / 255;
          const b = parseInt(hexColor.slice(5, 7), 16) / 255;
          currentPage.drawRectangle({
            x: contentLeft, y: currentY - cardH,
            width: 4, height: cardH,
            color: rgb(r, g, b), borderRadius: 2
          });
        }

        // FECHA (10 pt de ancho, 20 pt de alto)
        const fechaStr = formatFecha(ev.fecha_inicio);
        currentPage.drawText(fechaStr, {
          x: contentLeft + 10, y: currentY - 16,
          size: 8.5, font: fontBold, color: C.purpleDark
        });

        // Hora o "Todo el día"
        if (ev.es_todo_el_dia) {
          currentPage.drawRectangle({
            x: contentLeft + 10, y: currentY - 23,
            width: 36, height: 9,
            color: C.mint, borderRadius: 2
          });
          currentPage.drawText('Todo el dia', {
            x: contentLeft + 12, y: currentY - 21,
            size: 6, font: fontNormal, color: C.white
          });
        } else {
          const fecha = new Date(ev.fecha_inicio);
          const hora = fecha.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City'});
          currentPage.drawText(hora, {
            x: contentLeft + 10, y: currentY - 23,
            size: 7, font: fontNormal, color: C.gray
          });
        }

        // TÍTULO
        const tituloRaw = ev.titulo.replace(/[^\x00-\xFF]/g, '');
        const titulo = tituloRaw.length > 38 ? tituloRaw.substring(0, 37) + '...' : tituloRaw;
        currentPage.drawText(titulo, {
          x: contentLeft + 95, y: currentY - 16,
          size: 10, font: fontBold, color: C.black
        });

        // Grupo si existe
        if (ev.grupo_nombre) {
          const gnRaw = ev.grupo_nombre.replace(/[^\x00-\xFF]/g, '');
          const tituloW = fontBold.widthOfTextAtSize(titulo, 10);
          currentPage.drawText('  ' + gnRaw, {
            x: contentLeft + 95 + tituloW, y: currentY - 16,
            size: 8, font: fontNormal, color: C.gray
          });
        }

        // DESCRIPCIÓN (si existe)
        if (ev.descripcion) {
          const descRaw = ev.descripcion.replace(/[^\x00-\xFF]/g, '').trim();
          const desc1 = descRaw.substring(0, 55);
          const desc2 = descRaw.length > 55 ? descRaw.substring(55, 100) + (descRaw.length > 100 ? '...' : '') : null;
          currentPage.drawText(desc1, {
            x: contentLeft + 95, y: currentY - 28,
            size: 7.5, font: fontNormal, color: C.gray
          });
          if (desc2) {
            currentPage.drawText(desc2, {
              x: contentLeft + 95, y: currentY - 37,
              size: 7.5, font: fontNormal, color: C.gray
            });
          }
        }

        // UBICACIÓN (si existe)
        if (ev.ubicacion) {
          const ubicRaw = ('Ubicacion: ' + ev.ubicacion).replace(/[^\x00-\xFF]/g, '');
          const ubicTrunc = ubicRaw.length > 50 ? ubicRaw.substring(0, 49) + '...' : ubicRaw;
          currentPage.drawText(ubicTrunc, {
            x: contentLeft + 95, y: currentY - cardH + 5,
            size: 7, font: fontNormal, color: C.sky
          });
        }

        // CHIP DE CATEGORÍA (esquina derecha)
        if (ev.categoria_nombre) {
          const catName = ev.categoria_nombre.replace(/[^\x00-\xFF]/g, '');
          const catW = fontNormal.widthOfTextAtSize(catName, 7) + 10;
          const hexColor = ev.categoria_color || '#805AD5';
          const r = parseInt(hexColor.slice(1, 3), 16) / 255;
          const g = parseInt(hexColor.slice(3, 5), 16) / 255;
          const b = parseInt(hexColor.slice(5, 7), 16) / 255;
          const catColor = rgb(r, g, b);
          const catBg = rgb(r * 0.15 + 0.85, g * 0.15 + 0.85, b * 0.15 + 0.85);

          currentPage.drawRectangle({
            x: contentRight - catW - 5, y: currentY - 20,
            width: catW, height: 13,
            color: catBg, borderRadius: 6
          });
          currentPage.drawText(catName, {
            x: contentRight - catW, y: currentY - 17,
            size: 7, font: fontNormal, color: catColor
          });
        }

        currentY -= (cardH + GAP);
      }

      // Pie de página 2 (en última página renderizada)
      currentPage.drawLine({
        start: { x: contentLeft, y: 24 },
        end: { x: contentRight, y: 24 },
        thickness: 0.5, color: C.grayBorder
      });
      currentPage.drawText('Happy School  |  Generado el ' + new Date().toLocaleDateString('es-MX'), {
        x: contentLeft, y: 12, size: 7, font: fontNormal, color: C.gray
      });
      currentPage.drawText(`Pagina ${pageIndex}`, {
        x: contentRight - 30, y: 12, size: 7, font: fontNormal, color: C.gray
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

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

router.use(authenticate);

// Dashboard principal de la directora
// Devuelve todas las stats que muestra la pantalla de inicio
router.get('/dashboard', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { ciclo_id } = req.query;

    // Usar CURRENT_DATE de PostgreSQL para respetar zona horaria local del servidor
    const { rows: [{ hoy, mes_actual: mesActual, anio_actual: anioActual }] } = await query(
      `SELECT CURRENT_DATE::text AS hoy,
              EXTRACT(MONTH FROM CURRENT_DATE)::int AS mes_actual,
              EXTRACT(YEAR  FROM CURRENT_DATE)::int AS anio_actual`
    );

    // Ejecutar todas las queries en paralelo para máxima velocidad
    const [
      totalAlumnosResult,
      asistenciaHoyResult,
      pagosSemResult,
      retardosMesResult,
      docsPendientesResult,
      asistenciaPorGrupoResult,
      salidasAnticipadasResult,
      rechazadosSintomasResult,
      extensionVespertinaResult,
    ] = await Promise.all([

      // Total de alumnos inscritos en ciclo (activo o especificado)
      query(`
        SELECT COUNT(*) AS total
        FROM alumnos a
        JOIN ciclos_escolares c ON a.ciclo_id = c.id
        WHERE a.deleted_at IS NULL
          AND a.estado IN ('inscrito', 'reinscrito')
          AND c.id = COALESCE($1::uuid, (SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1))
      `, [ciclo_id]),

      // Asistencia de hoy: presentes+retardos = en escuela, ausentes, no_entrada
      query(`
        SELECT
          COUNT(*) FILTER (WHERE estado IN ('presente','retardo')) AS presentes,
          COUNT(*) FILTER (WHERE estado = 'ausente')               AS ausentes,
          COUNT(*) FILTER (WHERE estado = 'retardo')               AS retardos,
          COUNT(*) FILTER (WHERE estado = 'no_entrada')            AS no_entrada
        FROM asistencia
        WHERE fecha = $1
      `, [hoy]),

      // Estado de pagos del mes actual
      query(`
        SELECT
          COUNT(*) FILTER (WHERE dias_atraso = 0 AND estado = 'pagado') AS al_corriente,
          COUNT(*) FILTER (WHERE dias_atraso BETWEEN 1 AND 30)          AS con_atraso,
          COUNT(*) FILTER (WHERE dias_atraso > 30)                      AS suspendidos,
          COUNT(*) FILTER (WHERE estado = 'pendiente' AND dias_atraso = 0) AS en_periodo
        FROM pagos
        WHERE mes_correspondiente = $1 AND anio_correspondiente = $2
      `, [mesActual, anioActual]),

      // Alumnos con más retardos este mes (top 10)
      query(`
        SELECT
          a.id, a.nombre_completo,
          g.nombre AS grupo_nombre,
          COUNT(*) AS retardos
        FROM registro_entrada re
        JOIN alumnos a ON re.alumno_id = a.id
        LEFT JOIN grupos g ON a.grupo_id = g.id
        WHERE re.es_retardo = true
          AND EXTRACT(MONTH FROM re.created_at) = $1
          AND EXTRACT(YEAR FROM re.created_at) = $2
        GROUP BY a.id, a.nombre_completo, g.nombre
        HAVING COUNT(*) >= 1
        ORDER BY retardos DESC
        LIMIT 10
      `, [mesActual, anioActual]),

      // Alumnos con documentación incompleta
      query(`
        SELECT id, nombre_completo, grupo_nombre, docs_count
        FROM (
          SELECT
            a.id, a.nombre_completo,
            g.nombre AS grupo_nombre,
            (
              SELECT COUNT(DISTINCT d.tipo)
              FROM documentos d
              WHERE d.entidad_tipo = 'alumno'
                AND d.entidad_id = a.id
                AND d.tipo IN ('acta_nacimiento','curp','cartilla_vacunacion','foto_escolar')
            ) AS docs_count
          FROM alumnos a
          LEFT JOIN grupos g ON a.grupo_id = g.id
          JOIN ciclos_escolares c ON a.ciclo_id = c.id
          WHERE a.deleted_at IS NULL
            AND a.estado IN ('inscrito','reinscrito')
            AND c.activo = true
        ) sub
        WHERE docs_count < 4
        ORDER BY docs_count ASC, grupo_nombre, nombre_completo
      `),

      // Asistencia de hoy por grupo
      query(`
        SELECT
          g.id AS grupo_id,
          g.nombre AS grupo_nombre,
          g.color_hex,
          COUNT(a.id) AS total,
          COUNT(ast.id) FILTER (WHERE ast.estado IN ('presente','retardo')) AS presentes,
          COUNT(ast.id) FILTER (WHERE ast.estado = 'retardo')              AS retardos
        FROM grupos g
        LEFT JOIN alumnos a ON a.grupo_id = g.id
          AND a.deleted_at IS NULL
          AND a.estado IN ('inscrito','reinscrito')
        LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = $1
        WHERE g.activo = true
          AND g.deleted_at IS NULL
          AND g.ciclo_id = COALESCE($2::uuid, (SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1))
        GROUP BY g.id, g.nombre, g.color_hex
        ORDER BY g.nivel
      `, [hoy, ciclo_id]),

      // Todas las salidas de hoy con flag de anticipada
      query(`
        SELECT
          a.id, a.nombre_completo,
          g.nombre AS grupo_nombre, g.color_hex,
          rs.hora_salida,
          rs.nombre_quien_recoge,
          rs.recogido_por_tipo,
          rs.autorizado,
          (rs.hora_salida AT TIME ZONE 'America/Mexico_City')::time <
            (SELECT valor::time FROM configuracion_general WHERE clave = 'hora_salida_normal') AS es_anticipada
        FROM registro_salida rs
        JOIN alumnos a ON rs.alumno_id = a.id
        LEFT JOIN grupos g ON a.grupo_id = g.id
        WHERE rs.fecha = $1
        ORDER BY g.nivel, g.nombre, rs.hora_salida
      `, [hoy]),

      // Alumnos rechazados por síntomas/fiebre hoy
      query(`
        SELECT
          a.nombre_completo,
          g.nombre AS grupo_nombre,
          re.temperatura,
          re.motivo_no_entrada,
          re.sin_fiebre,
          re.sin_sintomas
        FROM registro_entrada re
        JOIN alumnos a ON re.alumno_id = a.id
        LEFT JOIN grupos g ON a.grupo_id = g.id
        WHERE re.fecha = $1
          AND re.puede_entrar = false
          AND (re.sin_fiebre = false OR re.temperatura > 37.5 OR re.sin_sintomas = false)
        ORDER BY g.nombre, a.nombre_completo
      `, [hoy]),

      // Alumnos para modo extensión vespertina (a partir de 15:06)
      // Incluye: alumnos con entrada hoy + su estado de extensión + si ya registraron salida
      query(`
        SELECT
          a.id, a.nombre_completo, a.foto_url,
          g.nombre AS grupo_nombre, g.color_hex,
          COALESCE(cha.tiene_extension, false) AS tiene_extension,
          rs.hora_salida
        FROM asistencia ast
        JOIN alumnos a ON ast.alumno_id = a.id
        LEFT JOIN grupos g ON a.grupo_id = g.id
        LEFT JOIN config_horario_alumno cha ON cha.alumno_id = a.id
        LEFT JOIN registro_salida rs ON rs.alumno_id = a.id AND rs.fecha = $1
        WHERE ast.fecha = $1
          AND ast.estado IN ('presente', 'retardo')
          AND a.deleted_at IS NULL
        ORDER BY cha.tiene_extension DESC, g.nombre, a.nombre_completo
      `, [hoy]),
    ]);

    const pagos = pagosSemResult.rows[0];

    res.json({
      fecha: hoy,
      totalAlumnos:        parseInt(totalAlumnosResult.rows[0].total),
      presentesHoy:        parseInt(asistenciaHoyResult.rows[0].presentes || 0),
      ausentesHoy:         parseInt(asistenciaHoyResult.rows[0].ausentes  || 0),
      retardosHoy:         parseInt(asistenciaHoyResult.rows[0].retardos  || 0),
      noEntradaHoy:        parseInt(asistenciaHoyResult.rows[0].no_entrada || 0),
      alumnosAlCorriente:  parseInt(pagos.al_corriente  || 0),
      alumnosConAdeudo:    parseInt(pagos.con_atraso    || 0),
      alumnosSuspendidos:  parseInt(pagos.suspendidos   || 0),
      alumnosEnPeriodo:    parseInt(pagos.en_periodo    || 0),
      retardosMes:         retardosMesResult.rows,
      documentacionPendiente: docsPendientesResult.rows,
      asistenciaPorGrupo:  asistenciaPorGrupoResult.rows,
      salidasHoy:          salidasAnticipadasResult.rows,
      salidasAnticipadas:  salidasAnticipadasResult.rows.filter(r => r.es_anticipada),
      rechazadosSintomas:  rechazadosSintomasResult.rows,
      extensionVespertina: extensionVespertinaResult.rows,
    });
  } catch (err) { next(err); }
});

// ============================================================
// REPORTE ASISTENCIA — Excel o PDF
// GET /reportes/asistencia?grupo_id=&mes=&anio=&alumno_id=&formato=excel|pdf
// ============================================================
router.get('/asistencia', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { grupo_id, mes, anio, alumno_id, formato = 'excel' } = req.query;

    if (!mes || !anio) return res.status(400).json({ error: 'mes y anio son requeridos' });

    const mesInt = parseInt(mes);
    const anioInt = parseInt(anio);

    // Obtener días hábiles del mes (lunes a viernes, excluyendo suspensiones del calendario)
    const diasHabilesResult = await query(`
      SELECT d::date AS fecha
      FROM generate_series(
        make_date($1, $2, 1),
        (make_date($1, $2, 1) + interval '1 month - 1 day')::date,
        '1 day'
      ) d
      WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
        AND d::date NOT IN (
          SELECT e.fecha_inicio::date
          FROM eventos e
          JOIN categorias_evento c ON e.categoria_id = c.id
          WHERE c.nombre ILIKE '%suspens%'
            AND e.es_todo_el_dia = true
            AND e.fecha_inicio::date BETWEEN make_date($1, $2, 1)
              AND (make_date($1, $2, 1) + interval '1 month - 1 day')::date
        )
      ORDER BY d
    `, [anioInt, mesInt]);

    const diasHabiles = diasHabilesResult.rows.map(r => r.fecha);
    const totalDias = diasHabiles.length;

    if (totalDias === 0) return res.status(400).json({ error: 'No hay días hábiles en el mes seleccionado' });

    // Filtros dinámicos
    const conditions = [`a.deleted_at IS NULL`, `a.estado IN ('inscrito','reinscrito')`];
    const params = [mesInt, anioInt];
    let paramIdx = 3;

    if (grupo_id) {
      conditions.push(`a.grupo_id = $${paramIdx}::uuid`);
      params.push(grupo_id);
      paramIdx++;
    }
    if (alumno_id) {
      conditions.push(`a.id = $${paramIdx}::uuid`);
      params.push(alumno_id);
      paramIdx++;
    }

    // Query: asistencia por alumno por día del mes
    const dataResult = await query(`
      SELECT
        a.id AS alumno_id,
        a.nombre_completo,
        g.nombre AS grupo_nombre,
        ast.fecha,
        ast.estado
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id
        AND EXTRACT(MONTH FROM ast.fecha) = $1
        AND EXTRACT(YEAR FROM ast.fecha) = $2
      WHERE ${conditions.join(' AND ')}
      ORDER BY g.nombre, a.nombre_completo, ast.fecha
    `, params);

    // Agrupar por alumno
    const alumnosMap = new Map();
    for (const row of dataResult.rows) {
      if (!alumnosMap.has(row.alumno_id)) {
        alumnosMap.set(row.alumno_id, {
          nombre: row.nombre_completo,
          grupo: row.grupo_nombre,
          dias: {},
        });
      }
      if (row.fecha) {
        const fechaStr = new Date(row.fecha).toISOString().slice(0, 10);
        alumnosMap.get(row.alumno_id).dias[fechaStr] = row.estado;
      }
    }

    const alumnos = Array.from(alumnosMap.values());
    const nombreMes = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mesInt];

    // ---- FORMATO EXCEL ----
    if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet(`Asistencia ${nombreMes} ${anioInt}`);

      // Encabezados
      const headers = ['Alumno', 'Grupo'];
      const diasFmt = diasHabiles.map(d => {
        const dt = new Date(d);
        return `${dt.getDate()}`;
      });
      headers.push(...diasFmt, 'Presentes', 'Ausentes', 'Retardos', 'Justificados', '% Asistencia');

      ws.addRow(headers);
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      headerRow.alignment = { horizontal: 'center' };

      // Anchos
      ws.getColumn(1).width = 28;
      ws.getColumn(2).width = 16;
      for (let i = 3; i <= 2 + totalDias; i++) ws.getColumn(i).width = 4;
      for (let i = 3 + totalDias; i <= 7 + totalDias; i++) ws.getColumn(i).width = 12;

      const estadoLabel = { presente: 'P', retardo: 'R', ausente: 'A', justificado: 'J', no_entrada: 'NE' };
      const estadoColor = {
        presente: 'FF22C55E', retardo: 'FFFBBF24', ausente: 'FFEF4444',
        justificado: 'FF3B82F6', no_entrada: 'FF9CA3AF',
      };

      for (const al of alumnos) {
        const rowData = [al.nombre, al.grupo];
        let presentes = 0, ausentes = 0, retardos = 0, justificados = 0;

        for (const dh of diasHabiles) {
          const key = new Date(dh).toISOString().slice(0, 10);
          const est = al.dias[key] || '';
          rowData.push(estadoLabel[est] || '');
          if (est === 'presente') presentes++;
          else if (est === 'retardo') { retardos++; presentes++; }
          else if (est === 'justificado') justificados++;
          else ausentes++;
        }

        const pctAsist = totalDias > 0 ? Math.round(((presentes) / totalDias) * 100) : 0;
        rowData.push(presentes, ausentes, retardos, justificados, `${pctAsist}%`);

        const dataRow = ws.addRow(rowData);

        // Colorear celdas de días
        for (let i = 0; i < totalDias; i++) {
          const cell = dataRow.getCell(3 + i);
          const key = new Date(diasHabiles[i]).toISOString().slice(0, 10);
          const est = al.dias[key];
          if (est && estadoColor[est]) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estadoColor[est] } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
          }
          cell.alignment = { horizontal: 'center' };
        }

        // Color % asistencia
        const pctCell = dataRow.getCell(3 + totalDias + 4);
        if (pctAsist < 80) pctCell.font = { color: { argb: 'FFEF4444' }, bold: true };
        else pctCell.font = { color: { argb: 'FF22C55E' }, bold: true };
      }

      // Leyenda
      ws.addRow([]);
      ws.addRow(['Leyenda:', '', 'P = Presente', '', 'R = Retardo', '', 'A = Ausente', '', 'J = Justificado', '', 'NE = No Entrada']);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="asistencia-${nombreMes}-${anioInt}.xlsx"`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    // ---- FORMATO PDF ----
    if (formato === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 842; // A4 landscape
      const pageHeight = 595;
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - 40;

      // Título
      page.drawText(`Reporte de Asistencia — ${nombreMes} ${anioInt}`, {
        x: 40, y, font: fontBold, size: 16, color: rgb(0.486, 0.228, 0.929),
      });
      y -= 30;

      // Tabla simple
      const colWidths = [180, 100, 70, 70, 70, 70, 70];
      const colHeaders = ['Alumno', 'Grupo', 'Presentes', 'Ausentes', 'Retardos', 'Justif.', '% Asist.'];

      let x = 40;
      for (let i = 0; i < colHeaders.length; i++) {
        page.drawText(colHeaders[i], { x, y, font: fontBold, size: 9, color: rgb(1, 1, 1) });
        page.drawRectangle({ x: x - 2, y: y - 4, width: colWidths[i], height: 16,
          color: rgb(0.486, 0.228, 0.929), opacity: 0.9 });
        page.drawText(colHeaders[i], { x, y, font: fontBold, size: 9, color: rgb(1, 1, 1) });
        x += colWidths[i];
      }
      y -= 20;

      for (const al of alumnos) {
        if (y < 40) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - 40;
        }

        let presentes = 0, ausentes = 0, retardos = 0, justificados = 0;
        for (const dh of diasHabiles) {
          const key = new Date(dh).toISOString().slice(0, 10);
          const est = al.dias[key] || '';
          if (est === 'presente') presentes++;
          else if (est === 'retardo') { retardos++; presentes++; }
          else if (est === 'justificado') justificados++;
          else ausentes++;
        }
        const pct = totalDias > 0 ? Math.round((presentes / totalDias) * 100) : 0;

        const nombre = al.nombre.length > 28 ? al.nombre.substring(0, 28) + '…' : al.nombre;
        const grupo = (al.grupo || '').length > 14 ? al.grupo.substring(0, 14) + '…' : (al.grupo || 'Sin grupo');

        const vals = [nombre, grupo, `${presentes}`, `${ausentes}`, `${retardos}`, `${justificados}`, `${pct}%`];
        x = 40;
        for (let i = 0; i < vals.length; i++) {
          const color = (i === 6 && pct < 80) ? rgb(0.937, 0.267, 0.267) : rgb(0.1, 0.1, 0.1);
          page.drawText(vals[i], { x, y, font, size: 8, color });
          x += colWidths[i];
        }
        y -= 14;
      }

      // Footer
      if (y < 40) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - 40; }
      y -= 10;
      page.drawText(`Total alumnos: ${alumnos.length} | Días hábiles: ${totalDias} | Generado: ${new Date().toLocaleDateString('es-MX')}`, {
        x: 40, y, font, size: 8, color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="asistencia-${nombreMes}-${anioInt}.pdf"`);
      return res.send(Buffer.from(pdfBytes));
    }

    return res.status(400).json({ error: 'Formato no soportado. Usar excel o pdf' });
  } catch (err) { next(err); }
});

// ============================================================
// REPORTE TAREAS — Excel o PDF
// GET /reportes/tareas?grupo_id=&mes=&anio=&alumno_id=&formato=excel|pdf
// ============================================================
router.get('/tareas', authorize('directora', 'administrativo', 'maestra_titular', 'maestra_especial'), async (req, res, next) => {
  try {
    const { grupo_id, mes, anio, alumno_id, formato = 'excel' } = req.query;

    if (!mes || !anio) return res.status(400).json({ error: 'mes y anio son requeridos' });

    const mesInt = parseInt(mes);
    const anioInt = parseInt(anio);

    // Filtros
    const conditions = [`a.deleted_at IS NULL`, `a.estado IN ('inscrito','reinscrito')`];
    const tareaConditions = [`EXTRACT(MONTH FROM t.fecha_limite) = $1`, `EXTRACT(YEAR FROM t.fecha_limite) = $2`];
    const params = [mesInt, anioInt];
    let paramIdx = 3;

    if (grupo_id) {
      conditions.push(`a.grupo_id = $${paramIdx}::uuid`);
      tareaConditions.push(`t.grupo_id = $${paramIdx}::uuid`);
      params.push(grupo_id);
      paramIdx++;
    }
    if (alumno_id) {
      conditions.push(`a.id = $${paramIdx}::uuid`);
      params.push(alumno_id);
      paramIdx++;
    }

    // Obtener tareas del mes
    const tareasResult = await query(`
      SELECT
        t.id AS tarea_id,
        t.titulo,
        t.fecha_limite,
        g.nombre AS grupo_nombre
      FROM tareas t
      LEFT JOIN grupos g ON t.grupo_id = g.id
      WHERE ${tareaConditions.join(' AND ')}
        AND t.publicada = true
      ORDER BY t.fecha_limite, t.titulo
    `, params.slice(0, grupo_id ? 3 : 2));

    // Obtener entregas por alumno
    const entregasResult = await query(`
      SELECT
        a.id AS alumno_id,
        a.nombre_completo,
        g.nombre AS grupo_nombre,
        t.id AS tarea_id,
        t.titulo,
        t.fecha_limite,
        ta.completada,
        ta.fecha_completada
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN tareas t ON t.grupo_id = a.grupo_id
        AND EXTRACT(MONTH FROM t.fecha_limite) = $1
        AND EXTRACT(YEAR FROM t.fecha_limite) = $2
        AND t.publicada = true
      LEFT JOIN tarea_alumno ta ON ta.tarea_id = t.id AND ta.alumno_id = a.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY g.nombre, a.nombre_completo, t.fecha_limite
    `, params);

    // Agrupar por alumno
    const alumnosMap = new Map();
    for (const row of entregasResult.rows) {
      if (!alumnosMap.has(row.alumno_id)) {
        alumnosMap.set(row.alumno_id, {
          nombre: row.nombre_completo,
          grupo: row.grupo_nombre,
          tareas: [],
          completadas: 0,
          total: 0,
        });
      }
      if (row.tarea_id) {
        const al = alumnosMap.get(row.alumno_id);
        al.total++;
        if (row.completada) al.completadas++;
        al.tareas.push({
          titulo: row.titulo,
          fecha_limite: row.fecha_limite,
          completada: row.completada || false,
          fecha_completada: row.fecha_completada,
        });
      }
    }

    const alumnos = Array.from(alumnosMap.values());
    const tareas = tareasResult.rows;
    const nombreMes = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mesInt];

    // ---- FORMATO EXCEL ----
    if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Resumen por alumno
      const wsResumen = workbook.addWorksheet(`Resumen ${nombreMes}`);
      wsResumen.columns = [
        { header: 'Alumno', key: 'nombre', width: 28 },
        { header: 'Grupo', key: 'grupo', width: 16 },
        { header: 'Tareas Asignadas', key: 'total', width: 16 },
        { header: 'Completadas', key: 'completadas', width: 14 },
        { header: 'Pendientes', key: 'pendientes', width: 14 },
        { header: '% Entrega', key: 'porcentaje', width: 12 },
      ];

      const hdr1 = wsResumen.getRow(1);
      hdr1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      hdr1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      hdr1.alignment = { horizontal: 'center' };

      for (const al of alumnos) {
        const pct = al.total > 0 ? Math.round((al.completadas / al.total) * 100) : 0;
        const dataRow = wsResumen.addRow({
          nombre: al.nombre,
          grupo: al.grupo || 'Sin grupo',
          total: al.total,
          completadas: al.completadas,
          pendientes: al.total - al.completadas,
          porcentaje: `${pct}%`,
        });

        const pctCell = dataRow.getCell(6);
        if (pct < 70) pctCell.font = { color: { argb: 'FFEF4444' }, bold: true };
        else if (pct < 90) pctCell.font = { color: { argb: 'FFFBBF24' }, bold: true };
        else pctCell.font = { color: { argb: 'FF22C55E' }, bold: true };
      }

      // Sheet 2: Detalle por tarea
      const wsDetalle = workbook.addWorksheet('Detalle por Tarea');
      wsDetalle.columns = [
        { header: 'Tarea', key: 'titulo', width: 30 },
        { header: 'Fecha Límite', key: 'fecha', width: 14 },
        { header: 'Grupo', key: 'grupo', width: 16 },
        { header: 'Alumno', key: 'alumno', width: 28 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Fecha Entrega', key: 'fecha_entrega', width: 16 },
      ];

      const hdr2 = wsDetalle.getRow(1);
      hdr2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      hdr2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };

      for (const al of alumnos) {
        for (const t of al.tareas) {
          const dataRow = wsDetalle.addRow({
            titulo: t.titulo,
            fecha: t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString('es-MX') : '',
            grupo: al.grupo || 'Sin grupo',
            alumno: al.nombre,
            estado: t.completada ? 'Entregada' : 'Pendiente',
            fecha_entrega: t.fecha_completada ? new Date(t.fecha_completada).toLocaleDateString('es-MX') : '',
          });
          const estadoCell = dataRow.getCell(5);
          if (t.completada) {
            estadoCell.font = { color: { argb: 'FF22C55E' }, bold: true };
          } else {
            estadoCell.font = { color: { argb: 'FFEF4444' }, bold: true };
          }
        }
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="tareas-${nombreMes}-${anioInt}.xlsx"`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    // ---- FORMATO PDF ----
    if (formato === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595; // A4 portrait
      const pageHeight = 842;
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - 40;

      page.drawText(`Reporte de Tareas — ${nombreMes} ${anioInt}`, {
        x: 40, y, font: fontBold, size: 16, color: rgb(0.486, 0.228, 0.929),
      });
      y -= 30;

      // Headers
      const colWidths = [160, 80, 60, 60, 60, 70];
      const colHeaders = ['Alumno', 'Grupo', 'Asignadas', 'Entregadas', 'Pendientes', '% Entrega'];

      let x = 40;
      for (let i = 0; i < colHeaders.length; i++) {
        page.drawRectangle({ x: x - 2, y: y - 4, width: colWidths[i], height: 16,
          color: rgb(0.486, 0.228, 0.929), opacity: 0.9 });
        page.drawText(colHeaders[i], { x, y, font: fontBold, size: 9, color: rgb(1, 1, 1) });
        x += colWidths[i];
      }
      y -= 20;

      for (const al of alumnos) {
        if (y < 40) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - 40;
        }

        const pct = al.total > 0 ? Math.round((al.completadas / al.total) * 100) : 0;
        const nombre = al.nombre.length > 26 ? al.nombre.substring(0, 26) + '…' : al.nombre;
        const grupo = (al.grupo || 'Sin grupo').substring(0, 12);

        const vals = [nombre, grupo, `${al.total}`, `${al.completadas}`, `${al.total - al.completadas}`, `${pct}%`];
        x = 40;
        for (let i = 0; i < vals.length; i++) {
          const color = (i === 5 && pct < 70) ? rgb(0.937, 0.267, 0.267) : rgb(0.1, 0.1, 0.1);
          page.drawText(vals[i], { x, y, font, size: 8, color });
          x += colWidths[i];
        }
        y -= 14;
      }

      if (y < 40) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - 40; }
      y -= 10;
      page.drawText(`Total alumnos: ${alumnos.length} | Tareas del mes: ${tareas.length} | Generado: ${new Date().toLocaleDateString('es-MX')}`, {
        x: 40, y, font, size: 8, color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="tareas-${nombreMes}-${anioInt}.pdf"`);
      return res.send(Buffer.from(pdfBytes));
    }

    return res.status(400).json({ error: 'Formato no soportado. Usar excel o pdf' });
  } catch (err) { next(err); }
});

module.exports = router;

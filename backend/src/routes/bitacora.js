const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarMensaje } = require('../services/whatsappService');

router.use(authenticate);

// ── GET /bitacora/:alumnoId?fecha=YYYY-MM-DD ──────────────────────────────
// Obtener bitácora completa de un alumno en una fecha (default: hoy)
router.get('/:alumnoId', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const [bitacora, banio, comida, panial, esfinteres, medicamentos] = await Promise.all([

      query(`
        SELECT bd.*, p.nombre_completo AS maestra_nombre
        FROM bitacora_diaria bd
        LEFT JOIN personal p ON bd.maestra_id = p.id
        WHERE bd.alumno_id = $1 AND bd.fecha = $2
      `, [alumnoId, fecha]),

      query(
        'SELECT * FROM registro_banio WHERE alumno_id = $1 AND fecha = $2',
        [alumnoId, fecha]
      ),

      query(
        'SELECT * FROM registro_comida WHERE alumno_id = $1 AND fecha = $2',
        [alumnoId, fecha]
      ),

      query(
        'SELECT * FROM registro_panial WHERE alumno_id = $1 AND DATE(hora) = $2 ORDER BY hora',
        [alumnoId, fecha]
      ),

      query(
        'SELECT * FROM control_esfinteres WHERE alumno_id = $1 AND fecha = $2',
        [alumnoId, fecha]
      ),

      query(
        'SELECT * FROM medicamentos WHERE alumno_id = $1 AND fecha = $2 ORDER BY hora_administracion',
        [alumnoId, fecha]
      ),
    ]);

    res.json({
      fecha,
      alumno_id: alumnoId,
      bitacora:    bitacora.rows[0]    || null,
      banio:       banio.rows[0]       || null,
      comida:      comida.rows[0]      || null,
      panial:      panial.rows        || [],
      esfinteres:  esfinteres.rows[0]  || null,
      medicamentos: medicamentos.rows  || [],
    });
  } catch (err) { next(err); }
});

// ── POST /bitacora/guardar ────────────────────────────────────────────────
// Guarda o actualiza la bitácora completa del día (upsert por alumno+fecha)
router.post('/guardar', async (req, res, next) => {
  try {
    const {
      alumno_id, fecha,
      // Bitácora general
      estado_animo, tarea_realizada, comportamiento, comportamiento_notas,
      tuvo_fiebre, temperatura_dia, se_enfermo, descripcion_enfermedad, notas,
      // Baño
      pipi_count, popo_count,
      // Comida
      que_comio, cuanto_comio, observaciones_comida,
      // Esfínteres
      fue_solo, pidio_ir, tuvo_accidente, descripcion_accidente, necesito_ayuda, notas_progreso,
    } = req.body;

    const fechaFinal = fecha || new Date().toISOString().split('T')[0];

    // Obtener personal_id de la maestra autenticada
    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1',
      [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    // Upsert bitácora principal
    const bitacoraResult = await query(`
      INSERT INTO bitacora_diaria (
        alumno_id, fecha, maestra_id,
        estado_animo, tarea_realizada, comportamiento, comportamiento_notas,
        tuvo_fiebre, temperatura_dia, se_enfermo, descripcion_enfermedad, notas
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (alumno_id, fecha) DO UPDATE SET
        maestra_id = $3,
        estado_animo = $4, tarea_realizada = $5,
        comportamiento = $6, comportamiento_notas = $7,
        tuvo_fiebre = $8, temperatura_dia = $9,
        se_enfermo = $10, descripcion_enfermedad = $11,
        notas = $12, updated_at = NOW()
      RETURNING id
    `, [
      alumno_id, fechaFinal, maestraId,
      estado_animo, tarea_realizada, comportamiento, comportamiento_notas,
      tuvo_fiebre || false, temperatura_dia, se_enfermo || false, descripcion_enfermedad, notas,
    ]);

    const bitacoraId = bitacoraResult.rows[0].id;

    // Upsert baño
    if (pipi_count !== undefined || popo_count !== undefined) {
      await query(`
        INSERT INTO registro_banio (alumno_id, bitacora_id, fecha, pipi_count, popo_count)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET
          pipi_count = $4, popo_count = $5, updated_at = NOW()
      `, [alumno_id, bitacoraId, fechaFinal, pipi_count || 0, popo_count || 0]);
    }

    // Upsert comida
    if (que_comio !== undefined || cuanto_comio !== undefined) {
      await query(`
        INSERT INTO registro_comida (alumno_id, bitacora_id, fecha, que_comio, cuanto_comio, observaciones)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET
          que_comio = $4, cuanto_comio = $5, observaciones = $6
      `, [alumno_id, bitacoraId, fechaFinal, que_comio, cuanto_comio, observaciones_comida]);
    }

    // Upsert esfínteres
    if (fue_solo !== undefined) {
      await query(`
        INSERT INTO control_esfinteres (alumno_id, bitacora_id, fecha, fue_solo, pidio_ir, tuvo_accidente, descripcion_accidente, necesito_ayuda, notas_progreso)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET
          fue_solo=$4, pidio_ir=$5, tuvo_accidente=$6,
          descripcion_accidente=$7, necesito_ayuda=$8, notas_progreso=$9
      `, [alumno_id, bitacoraId, fechaFinal, fue_solo, pidio_ir, tuvo_accidente, descripcion_accidente, necesito_ayuda, notas_progreso]);
    }

    // Notificar a padres que la bitácora está lista (solo si es la primera vez del día)
    const yaNotificado = await query(
      "SELECT id FROM log_whatsapp WHERE alumno_id = $1 AND tipo = 'bitacora_lista' AND DATE(created_at) = $2",
      [alumno_id, fechaFinal]
    );

    if (yaNotificado.rows.length === 0) {
      const padreResult = await query(`
        SELECT a.nombre_completo AS alumno_nombre,
               COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
               p.nombre_completo AS padre_nombre
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
        JOIN padres p ON ap.padre_id = p.id
        WHERE a.id = $1 LIMIT 1
      `, [alumno_id]);

      if (padreResult.rows.length > 0) {
        const { alumno_nombre, telefono, padre_nombre } = padreResult.rows[0];
        await enviarMensaje({
          telefono,
          clave: 'bitacora_lista',
          variables: {
            nombre_padre: padre_nombre.split(' ')[0],
            nombre_alumno: alumno_nombre,
          },
          alumnoId: alumno_id,
        });
      }
    }

    res.json({ ok: true, bitacora_id: bitacoraId });
  } catch (err) { next(err); }
});

// ── POST /bitacora/panial ─────────────────────────────────────────────────
// Registrar cambio de pañal (Maternal — múltiples por día)
router.post('/panial', async (req, res, next) => {
  try {
    const { alumno_id, condicion, tiene_irritacion, notas } = req.body;

    const result = await query(`
      INSERT INTO registro_panial (alumno_id, hora, condicion, tiene_irritacion, notas, registrado_por)
      VALUES ($1, NOW(), $2, $3, $4, $5) RETURNING *
    `, [alumno_id, condicion, tiene_irritacion || false, notas, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /bitacora/medicamento ────────────────────────────────────────────
// Registrar administración de medicamento
router.post('/medicamento', async (req, res, next) => {
  try {
    const { alumno_id, nombre, dosis, notas } = req.body;

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    const result = await query(`
      INSERT INTO medicamentos (alumno_id, fecha, nombre, dosis, hora_administracion, administrado_por, notas)
      VALUES ($1, CURRENT_DATE, $2, $3, NOW(), $4, $5) RETURNING *
    `, [alumno_id, nombre, dosis, maestraId, notas]);

    // Notificar a padres
    const padreResult = await query(`
      SELECT a.nombre_completo AS alumno_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
             p.nombre_completo AS padre_nombre
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
      JOIN padres p ON ap.padre_id = p.id
      WHERE a.id = $1 LIMIT 1
    `, [alumno_id]);

    if (padreResult.rows.length > 0) {
      const { alumno_nombre, telefono, padre_nombre } = padreResult.rows[0];
      await enviarMensaje({
        telefono,
        clave: 'medicamento',
        variables: {
          nombre_padre: padre_nombre.split(' ')[0],
          nombre_alumno: alumno_nombre,
          medicamento: nombre,
          dosis,
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        },
        alumnoId: alumno_id,
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;

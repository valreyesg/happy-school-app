const { query } = require('../config/database');
const { generarQR } = require('../services/qrService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

const listar = async (req, res, next) => {
  try {
    const { grupo_id, estado, buscar, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['a.deleted_at IS NULL'];
    const params = [];
    let paramIdx = 1;

    // Si es padre, solo ve sus hijos
    if (req.user.rol_principal === 'padre') {
      whereConditions.push(`a.id IN (
        SELECT alumno_id FROM alumno_padre ap
        JOIN padres p ON ap.padre_id = p.id
        WHERE p.usuario_id = $${paramIdx}
      )`);
      params.push(req.user.id);
      paramIdx++;
    }

    // Si es maestra titular, solo su grupo
    if (req.user.rol_principal === 'maestra_titular' && !grupo_id) {
      whereConditions.push(`a.grupo_id IN (
        SELECT ag.grupo_id FROM asignaciones_grupo ag
        JOIN personal p ON ag.personal_id = p.id
        WHERE p.usuario_id = $${paramIdx} AND ag.activo = true AND ag.es_titular = true
      )`);
      params.push(req.user.id);
      paramIdx++;
    }

    if (grupo_id) {
      whereConditions.push(`a.grupo_id = $${paramIdx}`);
      params.push(grupo_id);
      paramIdx++;
    }

    if (estado) {
      whereConditions.push(`a.estado = $${paramIdx}`);
      params.push(estado);
      paramIdx++;
    }

    if (buscar) {
      whereConditions.push(`a.nombre_completo ILIKE $${paramIdx}`);
      params.push(`%${buscar}%`);
      paramIdx++;
    }

    const where = whereConditions.join(' AND ');

    const result = await query(`
      SELECT
        a.id, a.nombre_completo, a.fecha_nacimiento, a.foto_url,
        a.grupo_id, g.nombre AS grupo_nombre, g.nivel, g.color_hex,
        a.estado, a.usa_panial, a.alergias, a.qr_code_url,
        a.created_at,
        -- Indicador documentación completa
        CASE
          WHEN EXISTS (
            SELECT 1 FROM documentos d
            WHERE d.entidad_tipo = 'alumno' AND d.entidad_id = a.id
            AND d.tipo IN ('acta_nacimiento', 'curp', 'cartilla_vacunacion', 'foto_escolar')
            GROUP BY d.entidad_id HAVING COUNT(DISTINCT d.tipo) >= 4
          ) THEN 'completa'
          ELSE 'incompleta'
        END AS documentacion
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      WHERE ${where}
      ORDER BY g.nivel, a.nombre_completo
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `, [...params, limit, offset]);

    const countResult = await query(
      `SELECT COUNT(*) FROM alumnos a WHERE ${where}`,
      params
    );

    res.json({
      alumnos: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const obtener = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        a.*,
        g.nombre AS grupo_nombre, g.nivel, g.nivel_codigo, g.color_hex,
        c.nombre AS ciclo_nombre
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN ciclos_escolares c ON a.ciclo_id = c.id
      WHERE a.id = $1 AND a.deleted_at IS NULL
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const alumno = result.rows[0];

    // Padres
    const padresResult = await query(`
      SELECT p.*, ap.es_tutor_principal
      FROM padres p
      JOIN alumno_padre ap ON p.id = ap.padre_id
      WHERE ap.alumno_id = $1
    `, [id]);

    // Personas autorizadas
    const autorizadasResult = await query(
      'SELECT * FROM personas_autorizadas WHERE alumno_id = $1 ORDER BY created_at',
      [id]
    );

    // Blacklist
    const blacklistResult = await query(
      'SELECT id, nombre_completo, descripcion, foto_url, activo FROM blacklist WHERE alumno_id = $1',
      [id]
    );

    // Documentos
    const docsResult = await query(
      'SELECT tipo, url, nombre_archivo, created_at FROM documentos WHERE entidad_tipo = \'alumno\' AND entidad_id = $1',
      [id]
    );

    res.json({
      ...alumno,
      padres: padresResult.rows,
      personasAutorizadas: autorizadasResult.rows,
      blacklist: blacklistResult.rows,
      documentos: docsResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

const crear = async (req, res, next) => {
  try {
    const {
      nombre_completo, fecha_nacimiento, curp, grupo_id, ciclo_id,
      usa_panial, alergias, condiciones_especiales, tipo_sangre,
      medico_nombre, medico_telefono, notas,
    } = req.body;

    const result = await query(`
      INSERT INTO alumnos (
        nombre_completo, fecha_nacimiento, curp, grupo_id, ciclo_id,
        usa_panial, alergias, condiciones_especiales, tipo_sangre,
        medico_nombre, medico_telefono, notas
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, nombre_completo, foto_url, grupo_id, estado
    `, [
      nombre_completo, fecha_nacimiento, curp, grupo_id, ciclo_id,
      usa_panial || false, alergias, condiciones_especiales, tipo_sangre,
      medico_nombre, medico_telefono, notas,
    ]);

    const alumno = result.rows[0];

    // Generar QR automáticamente
    const qrData = `HAPPYSCHOOL:ALUMNO:${alumno.id}`;
    const { qr_url } = await generarQR(alumno.id, qrData);

    await query(
      'UPDATE alumnos SET qr_code_url = $1, qr_code_data = $2 WHERE id = $3',
      [qr_url, qrData, alumno.id]
    );

    res.status(201).json({ ...alumno, qr_code_url: qr_url });
  } catch (err) {
    next(err);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campos = req.body;

    const permitidos = [
      'nombre_completo', 'fecha_nacimiento', 'curp', 'grupo_id', 'ciclo_id',
      'usa_panial', 'alergias', 'condiciones_especiales', 'tipo_sangre',
      'medico_nombre', 'medico_telefono', 'notas', 'estado',
    ];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const campo of permitidos) {
      if (campo in campos) {
        updates.push(`${campo} = $${idx}`);
        values.push(campos[campo]);
        idx++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE alumnos SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(
      'UPDATE alumnos SET deleted_at = NOW(), estado = \'baja\' WHERE id = $1',
      [id]
    );
    res.json({ mensaje: 'Alumno dado de baja correctamente' });
  } catch (err) {
    next(err);
  }
};

const subirFoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Foto requerida' });
    }

    const result = await query('SELECT foto_public_id FROM alumnos WHERE id = $1', [id]);
    if (result.rows[0]?.foto_public_id) {
      await deleteFromCloudinary(result.rows[0].foto_public_id);
    }

    const { url, public_id } = await uploadToCloudinary(req.file.buffer, {
      folder: `happy-school/alumnos/${id}`,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });

    await query(
      'UPDATE alumnos SET foto_url = $1, foto_public_id = $2, updated_at = NOW() WHERE id = $3',
      [url, public_id, id]
    );

    res.json({ foto_url: url });
  } catch (err) {
    next(err);
  }
};

const regenerarQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qrData = `HAPPYSCHOOL:ALUMNO:${id}:${Date.now()}`;
    const { qr_url } = await generarQR(id, qrData);

    await query(
      'UPDATE alumnos SET qr_code_url = $1, qr_code_data = $2 WHERE id = $3',
      [qr_url, qrData, id]
    );

    res.json({ qr_code_url: qr_url });
  } catch (err) {
    next(err);
  }
};

// Buscar alumno por dato del QR — para el scanner mobile de la maestra
const buscarPorQR = async (req, res, next) => {
  try {
    const qrData = decodeURIComponent(req.params.qrData);

    // El QR tiene el formato: HAPPYSCHOOL:ALUMNO:<uuid> o HAPPYSCHOOL:ALUMNO:<uuid>:<timestamp>
    const partes = qrData.split(':');
    if (partes[0] !== 'HAPPYSCHOOL' || partes[1] !== 'ALUMNO' || !partes[2]) {
      return res.status(400).json({ error: 'QR inválido' });
    }
    const alumnoId = partes[2];

    const result = await query(`
      SELECT
        a.id, a.nombre_completo, a.foto_url, a.fecha_nacimiento,
        a.alergias, a.condiciones_especiales, a.usa_panial, a.estado,
        g.id AS grupo_id, g.nombre AS grupo_nombre, g.nivel, g.color_hex,
        -- Estado de entrada hoy
        re.id AS entrada_id,
        re.hora_entrada,
        re.es_retardo,
        re.puede_entrar,
        re.numero_retardo_mes,
        -- Retardos del mes actual
        (
          SELECT COUNT(*) FROM registro_entrada
          WHERE alumno_id = a.id AND es_retardo = true
            AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
        ) AS retardos_mes
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = CURRENT_DATE
      WHERE a.id = $1 AND a.deleted_at IS NULL
    `, [alumnoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const alumno = result.rows[0];

    // Verificar si ya entró hoy
    if (alumno.entrada_id) {
      alumno.ya_registro_entrada = true;
    }

    res.json(alumno);
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, obtener, buscarPorQR, crear, actualizar, eliminar, subirFoto, regenerarQR };

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/alumnosController');
const { query } = require('../config/database');
const { uploadToCloudinary, uploadPDF, deleteFromCloudinary } = require('../services/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', ctrl.listar);

// GET /alumnos/mis-hijos — alumnos vinculados al padre autenticado
router.get('/mis-hijos', async (req, res, next) => {
  try {
    // Obtener configuración de hora límite de entrada
    const cfgResult = await query(
      "SELECT valor FROM configuracion_general WHERE clave = 'hora_fin_filtro'"
    );
    const horaLimiteEntrada = cfgResult.rows[0]?.valor || '08:30';

    const result = await query(`
      SELECT DISTINCT ON (a.id)
        a.id, a.nombre_completo, a.foto_url, a.fecha_nacimiento, a.usa_panial,
        g.nombre AS grupo_nombre, g.color_hex,
        b.estado_animo, b.actividad_realizada, b.comportamiento, b.notas,
        b.tuvo_fiebre,
        COALESCE(cha.tiene_extension, false) AS tiene_extension,
        (SELECT COUNT(*) FROM incidentes i
         WHERE i.alumno_id = a.id
           AND i.fecha::date = CURRENT_DATE
           AND i.firma_padre_url IS NULL) AS incidentes_sin_firmar,
        -- Filtro de entrada
        re.hora_entrada, re.es_retardo, re.puede_entrar, re.motivo_no_entrada,
        re.uñas_cortadas, re.sin_lagañas, re.sin_fiebre, re.temperatura,
        re.sin_sintomas, re.sintomas_notas, re.panial_limpio, re.trae_uniforme,
        re.trae_bata, re.trae_termo, re.agua_suficiente, re.numero_retardo_mes,
        -- Retardos del mes (siempre, aunque no haya entrada hoy)
        (SELECT COUNT(*) FROM registro_entrada rx
         WHERE rx.alumno_id = a.id AND rx.es_retardo = true
           AND EXTRACT(MONTH FROM rx.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR  FROM rx.created_at) = EXTRACT(YEAR  FROM CURRENT_DATE)
        ) AS retardos_mes_total
      FROM padres p
      JOIN alumno_padre ap ON ap.padre_id = p.id
      JOIN alumnos a ON ap.alumno_id = a.id
      JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN bitacora_diaria b  ON b.alumno_id  = a.id AND b.fecha  = CURRENT_DATE
      LEFT JOIN config_horario_alumno cha ON cha.alumno_id = a.id
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = CURRENT_DATE
      WHERE p.usuario_id = $1 AND a.deleted_at IS NULL
      ORDER BY a.id, a.nombre_completo
    `, [req.user.id]);

    const rows = result.rows.map(r => {
      const { estado_animo, actividad_realizada, comportamiento, notas, tuvo_fiebre, incidentes_sin_firmar } = r;
      const bitacora_hoy = estado_animo !== null ? { estado_animo, actividad_realizada, comportamiento, notas, tuvo_fiebre, incidentes_sin_firmar: parseInt(incidentes_sin_firmar || 0) } : null;

      // Construir objeto filtro_entrada si existe
      const filtro_entrada = r.hora_entrada ? {
        hora_entrada: r.hora_entrada,
        es_retardo: r.es_retardo,
        puede_entrar: r.puede_entrar,
        motivo_no_entrada: r.motivo_no_entrada,
        uñas_cortadas: r.uñas_cortadas,
        sin_lagañas: r.sin_lagañas,
        sin_fiebre: r.sin_fiebre,
        temperatura: r.temperatura,
        sin_sintomas: r.sin_sintomas,
        sintomas_notas: r.sintomas_notas,
        panial_limpio: r.panial_limpio,
        trae_uniforme: r.trae_uniforme,
        trae_bata: r.trae_bata,
        trae_termo: r.trae_termo,
        agua_suficiente: r.agua_suficiente,
        numero_retardo_mes: r.numero_retardo_mes,
      } : null;

      return {
        ...r,
        bitacora_hoy,
        filtro_entrada,
        retardos_mes_total: parseInt(r.retardos_mes_total || 0),
        // Clean up individual fields
        estado_animo: undefined,
        actividad_realizada: undefined,
        comportamiento: undefined,
        notas: undefined,
        tuvo_fiebre: undefined,
        incidentes_sin_firmar: undefined,
        hora_entrada: undefined,
        es_retardo: undefined,
        puede_entrar: undefined,
        motivo_no_entrada: undefined,
        uñas_cortadas: undefined,
        sin_lagañas: undefined,
        sin_fiebre: undefined,
        temperatura: undefined,
        sin_sintomas: undefined,
        sintomas_notas: undefined,
        panial_limpio: undefined,
        trae_uniforme: undefined,
        trae_bata: undefined,
        trae_termo: undefined,
        agua_suficiente: undefined,
        numero_retardo_mes: undefined,
      };
    });

    res.json({ hijos: rows, horaLimiteEntrada });
  } catch (err) { next(err); }
});

router.get('/por-qr/:qrData', ctrl.buscarPorQR);
router.get('/:id', ctrl.obtener);

router.post('/', authorize('directora', 'administrativo'), ctrl.crear);
router.put('/:id', authorize('directora', 'administrativo'), ctrl.actualizar);
router.delete('/:id', authorize('directora'), ctrl.eliminar);
router.post('/:id/foto', authorize('directora', 'administrativo'), upload.single('foto'), ctrl.subirFoto);
router.post('/:id/regenerar-qr', authorize('directora', 'administrativo'), ctrl.regenerarQR);

// ── GET /alumnos/:id/documentos ───────────────────────────────────────────────
router.get('/:id/documentos', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM documentos WHERE entidad_tipo = 'alumno' AND entidad_id = $1 ORDER BY tipo, created_at DESC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /alumnos/:id/documentos ──────────────────────────────────────────────
router.post('/:id/documentos',
  authorize('directora', 'administrativo'),
  upload.single('archivo'),
  async (req, res, next) => {
    try {
      const { tipo } = req.body;
      if (!req.file || !tipo) return res.status(400).json({ error: 'archivo y tipo son obligatorios' });

      const esPDF = req.file.mimetype === 'application/pdf';
      const uploadFn = esPDF ? uploadPDF : uploadToCloudinary;
      const { url, public_id } = await uploadFn(req.file.buffer, {
        folder: `happyschool/alumnos/${req.params.id}/documentos`,
      });

      const result = await query(`
        INSERT INTO documentos (entidad_tipo, entidad_id, tipo, nombre_archivo, url, public_id, subido_por)
        VALUES ('alumno', $1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [req.params.id, tipo, req.file.originalname, url, public_id, req.user.id]);

      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// ── DELETE /alumnos/:id/documentos/:docId ────────────────────────────────────
router.delete('/:id/documentos/:docId', authorize('directora'), async (req, res, next) => {
  try {
    const doc = await query('SELECT * FROM documentos WHERE id = $1 AND entidad_id = $2', [req.params.docId, req.params.id]);
    if (!doc.rows[0]) return res.status(404).json({ error: 'Documento no encontrado' });

    await deleteFromCloudinary(doc.rows[0].public_id);
    await query('DELETE FROM documentos WHERE id = $1', [req.params.docId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /alumnos/:id/personas-autorizadas ────────────────────────────────────
router.get('/:id/personas-autorizadas', authorize('directora', 'administrativo', 'maestra_titular', 'maestra_puerta'), async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM personas_autorizadas WHERE alumno_id = $1 AND activo = true ORDER BY created_at',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /alumnos/:id/personas-autorizadas ───────────────────────────────────
router.post('/:id/personas-autorizadas',
  authorize('directora', 'administrativo'),
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'ine_frente', maxCount: 1 },
    { name: 'ine_reverso', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      // Máximo 2 personas autorizadas por alumno
      const existentes = await query(
        'SELECT COUNT(*) FROM personas_autorizadas WHERE alumno_id = $1 AND activo = true',
        [req.params.id]
      );
      if (parseInt(existentes.rows[0].count) >= 2)
        return res.status(400).json({ error: 'Máximo 2 personas autorizadas por alumno' });

      const { nombre_completo, parentesco, telefono } = req.body;
      if (!nombre_completo || !parentesco || !telefono)
        return res.status(400).json({ error: 'nombre_completo, parentesco y telefono son obligatorios' });

      if (!req.files?.foto || !req.files?.ine_frente || !req.files?.ine_reverso)
        return res.status(400).json({ error: 'foto, ine_frente e ine_reverso son obligatorios' });

      const folder = `happyschool/alumnos/${req.params.id}/autorizadas`;
      const [fotoUp, ineFrente, ineReverso] = await Promise.all([
        uploadToCloudinary(req.files.foto[0].buffer, { folder }),
        uploadToCloudinary(req.files.ine_frente[0].buffer, { folder }),
        uploadToCloudinary(req.files.ine_reverso[0].buffer, { folder }),
      ]);

      const result = await query(`
        INSERT INTO personas_autorizadas
          (alumno_id, nombre_completo, parentesco, telefono, foto_url, foto_public_id, ine_frente_url, ine_reverso_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
      `, [req.params.id, nombre_completo, parentesco, telefono, fotoUp.url, fotoUp.public_id, ineFrente.url, ineReverso.url]);

      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// ── DELETE /alumnos/:id/personas-autorizadas/:paId ───────────────────────────
router.delete('/:id/personas-autorizadas/:paId', authorize('directora'), async (req, res, next) => {
  try {
    await query(
      'UPDATE personas_autorizadas SET activo = false WHERE id = $1 AND alumno_id = $2',
      [req.params.paId, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /alumnos/:id/blacklist ────────────────────────────────────────────────
router.get('/:id/blacklist', authorize('directora', 'administrativo', 'maestra_puerta'), async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM blacklist WHERE alumno_id = $1 AND activo = true ORDER BY created_at',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /alumnos/:id/blacklist ───────────────────────────────────────────────
router.post('/:id/blacklist',
  authorize('directora'),
  upload.single('foto'),
  async (req, res, next) => {
    try {
      const { nombre_completo, descripcion, motivo } = req.body;
      if (!nombre_completo) return res.status(400).json({ error: 'nombre_completo es obligatorio' });

      let foto_url = null;
      if (req.file) {
        const up = await uploadToCloudinary(req.file.buffer, { folder: `happyschool/blacklist` });
        foto_url = up.url;
      }

      const result = await query(`
        INSERT INTO blacklist (alumno_id, nombre_completo, descripcion, foto_url, motivo, created_by)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
      `, [req.params.id, nombre_completo, descripcion || null, foto_url, motivo || null, req.user.id]);

      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// ── DELETE /alumnos/:id/blacklist/:blId ───────────────────────────────────────
router.delete('/:id/blacklist/:blId', authorize('directora'), async (req, res, next) => {
  try {
    await query('UPDATE blacklist SET activo = false WHERE id = $1 AND alumno_id = $2', [req.params.blId, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /alumnos/:id/historial-servicios ─────────────────────────────────────
router.get('/:id/historial-servicios', authorize('directora', 'administrativo', 'maestra_titular', 'maestra_auxiliar', 'maestra_especial', 'padre'), ctrl.obtenerHistorialServicios);

// ── POST /alumnos/:id/historial-servicios ────────────────────────────────────
router.post('/:id/historial-servicios', authorize('directora', 'administrativo'), ctrl.registrarHistorialServicio);

// ── GET /alumnos/:id/ciclos — ciclos en que estuvo inscrito + ciclo actual ──
router.get('/:id/ciclos', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT DISTINCT ce.id, ce.nombre, ce.fecha_inicio, ce.fecha_fin, ce.activo
      FROM (
        -- Ciclos de inscripciones históricas
        SELECT DISTINCT ce.id, ce.nombre, ce.fecha_inicio, ce.fecha_fin, ce.activo
        FROM inscripciones i
        JOIN ciclos_escolares ce ON ce.id = i.ciclo_id
        WHERE i.alumno_id = $1

        UNION

        -- Ciclo actual del grupo del alumno (en caso de no tener inscripción formal)
        SELECT DISTINCT ce.id, ce.nombre, ce.fecha_inicio, ce.fecha_fin, ce.activo
        FROM alumnos a
        JOIN grupos g ON a.grupo_id = g.id
        JOIN ciclos_escolares ce ON g.ciclo_id = ce.id
        WHERE a.id = $1 AND a.deleted_at IS NULL
      ) ce
      ORDER BY ce.fecha_inicio DESC
    `, [req.params.id]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;

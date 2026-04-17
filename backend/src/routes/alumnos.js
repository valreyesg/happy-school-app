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
router.get('/por-qr/:qrData', ctrl.buscarPorQR);

// GET /alumnos/mis-hijos — alumnos vinculados al padre autenticado
router.get('/mis-hijos', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT a.id, a.nombre_completo, a.foto_url, a.fecha_nacimiento,
             g.nombre AS grupo_nombre, g.color_hex
      FROM padres p
      JOIN alumno_padre ap ON ap.padre_id = p.id
      JOIN alumnos a ON ap.alumno_id = a.id
      JOIN grupos g ON a.grupo_id = g.id
      WHERE p.usuario_id = $1 AND a.deleted_at IS NULL
      ORDER BY a.nombre_completo
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

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

module.exports = router;

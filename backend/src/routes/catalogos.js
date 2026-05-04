const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

// Fallback estático para si hay error de BD (mantiene compatibilidad)
const CATALOGOS_FALLBACK = {
  'animo': [
    { key: 'feliz',     emoji: '😊', label: 'Feliz'     },
    { key: 'activo',    emoji: '⚡', label: 'Activo'    },
    { key: 'cansado',   emoji: '😴', label: 'Cansado'   },
    { key: 'triste',    emoji: '😢', label: 'Triste'    },
    { key: 'irritable', emoji: '😤', label: 'Irritable' },
  ],
  'cuanto-comio': [
    { key: 'todo',      emoji: '😋', label: 'Todo'      },
    { key: 'casi_todo', emoji: '😊', label: 'Casi todo' },
    { key: 'poco',      emoji: '😐', label: 'Poco'      },
    { key: 'no_comio',  emoji: '❌', label: 'No comió'  },
  ],
  'comportamiento': [
    { key: 'muy_bien',         emoji: '⭐', label: 'Muy bien'   },
    { key: 'bien',             emoji: '👍', label: 'Bien'       },
    { key: 'necesita_mejorar', emoji: '⚠️', label: 'A mejorar' },
  ],
  'condiciones-panial': [
    { key: 'limpio',  label: '✅ Limpio'  },
    { key: 'orina',   label: '💧 Pipí'   },
    { key: 'heces',   label: '💩 Popó'   },
    { key: 'mixto',   label: '🔄 Mixto'  },
    { key: 'diarrea', label: '⚠️ Diarrea' },
  ],
  'tipos-insumo': [
    { key: 'panial',    label: '👶 Pañal'     },
    { key: 'toallitas', label: '🧻 Toallitas' },
    { key: 'crema',     label: '🧴 Crema'     },
  ],
  'vomito-intensidad': [
    { key: 'leve',     label: '🤢 Leve'     },
    { key: 'moderado', label: '🤮 Moderado' },
    { key: 'fuerte',   label: '🚨 Fuerte'   },
  ],
  'tiempos-comida': [
    { key: 'desayuno',     emoji: '🥐', label: 'Desayuno'     },
    { key: 'colacion',     emoji: '🍎', label: 'Colación'     },
    { key: 'comida',       emoji: '🍽️', label: 'Comida'       },
    { key: 'comida_extra', emoji: '🍜', label: 'Comida Extra' },
  ],
  'niveles': [
    { key: 'maternal',  label: 'Maternal'  },
    { key: 'prekinder', label: 'Prekinder' },
    { key: 'kinder1',   label: 'Kinder 1'  },
    { key: 'kinder2',   label: 'Kinder 2'  },
    { key: 'kinder3',   label: 'Kinder 3'  },
  ],
  'roles-personal': [
    { key: 'directora',        label: 'Directora'      },
    { key: 'administrativo',   label: 'Administrativo' },
    { key: 'maestra_titular',  label: 'Miss titular'   },
    { key: 'maestra_auxiliar', label: 'Miss auxiliar'  },
    { key: 'maestra_especial', label: 'Miss especial'  },
    { key: 'maestra_puerta',   label: 'Miss de puerta' },
  ],
  'estados-alumno': [
    { key: 'inscrito',   label: 'Inscrito'   },
    { key: 'reinscrito', label: 'Reinscrito' },
    { key: 'baja',       label: 'Baja'       },
    { key: 'egresado',   label: 'Egresado'   },
  ],
  'tipos-documento': [
    { key: 'acta_nacimiento',     label: 'Acta de nacimiento'       },
    { key: 'curp',                label: 'CURP'                     },
    { key: 'cartilla_vacunacion', label: 'Cartilla de vacunación'   },
    { key: 'comprobante_dom',     label: 'Comprobante de domicilio' },
    { key: 'foto_escolar',        label: 'Fotografía 3×4'          },
    { key: 'ine_tutor',           label: 'INE del tutor'            },
    { key: 'contrato',            label: 'Contrato firmado'         },
    { key: 'otro',                label: 'Otro'                     },
  ],
  'metodos-pago': [
    { key: 'efectivo',      label: 'Efectivo'      },
    { key: 'transferencia', label: 'Transferencia' },
    { key: 'tarjeta',       label: 'Tarjeta'       },
  ],
  'conceptos-pago': [
    { key: 'colegiatura', label: 'Colegiatura' },
    { key: 'material',    label: 'Material'    },
    { key: 'comida',      label: 'Comida'      },
    { key: 'extension',   label: 'Extensión'   },
    { key: 'evento',      label: 'Evento'      },
    { key: 'otro',        label: 'Otro'        },
  ],
  'alergias': [
    { key: 'lactosa',      emoji: '🥛', label: 'Lactosa'      },
    { key: 'cacahuate',    emoji: '🥜', label: 'Cacahuate'    },
    { key: 'mariscos',     emoji: '🦐', label: 'Mariscos'     },
    { key: 'huevo',        emoji: '🥚', label: 'Huevo'        },
    { key: 'trigo',        emoji: '🌾', label: 'Trigo'        },
    { key: 'fresa',        emoji: '🍓', label: 'Fresa'        },
    { key: 'chocolate',    emoji: '🍫', label: 'Chocolate'    },
    { key: 'colorantes',   emoji: '🎨', label: 'Colorantes'   },
    { key: 'conservantes', emoji: '⚗️', label: 'Conservantes' },
  ],
};

router.use(authenticate);

// ── GET /catalogos/:tipo ──────────────────────────────────────────────────────
// Público para todos los roles autenticados — mismo contrato de respuesta que antes
router.get('/:tipo', async (req, res, next) => {
  const { tipo } = req.params;
  try {
    const result = await query(
      `SELECT key, label, emoji, color
       FROM catalogos
       WHERE tipo = $1 AND activo = true
       ORDER BY orden ASC`,
      [tipo]
    );

    if (result.rows.length > 0) {
      return res.json({ tipo, items: result.rows });
    }

    // Fallback: si no hay datos en BD, usar objeto estático
    const fallback = CATALOGOS_FALLBACK[tipo];
    if (!fallback) return res.status(404).json({ error: `Catálogo '${tipo}' no existe` });
    return res.json({ tipo, items: fallback });

  } catch (err) {
    // Ante cualquier error de BD, servir el fallback para no romper la app
    console.error(`[catalogos] Error leyendo tipo '${tipo}' de BD, usando fallback:`, err.message);
    const fallback = CATALOGOS_FALLBACK[tipo];
    if (!fallback) return next(err);
    return res.json({ tipo, items: fallback });
  }
});

// ── GET /catalogos (admin) ────────────────────────────────────────────────────
// Lista todos los tipos con conteo — solo directora
router.get('/', authorize('directora'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT tipo,
             COUNT(*) FILTER (WHERE activo = true)  AS activos,
             COUNT(*) FILTER (WHERE activo = false) AS inactivos,
             COUNT(*)                                AS total
      FROM catalogos
      GROUP BY tipo
      ORDER BY tipo
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /catalogos/:tipo/admin ────────────────────────────────────────────────
// Items incluyendo inactivos (para panel de gestión) — solo directora
router.get('/:tipo/admin', authorize('directora'), async (req, res, next) => {
  try {
    const { tipo } = req.params;
    const result = await query(
      `SELECT id, key, label, emoji, color, orden, activo, es_sistema, editable_key, inactivado_at, created_at
       FROM catalogos
       WHERE tipo = $1
       ORDER BY activo DESC, orden ASC`,
      [tipo]
    );
    res.json({ tipo, items: result.rows });
  } catch (err) { next(err); }
});

// Tipos completamente cerrados — no se pueden agregar nuevas opciones
// (sus valores están atados a ENUMs de la BD o a lógica de autenticación)
const TIPOS_CERRADOS = new Set(['roles-personal', 'estados-alumno', 'checklist-entrada', 'checklist-salida']);

// ── POST /catalogos/:tipo ─────────────────────────────────────────────────────
// Crear item nuevo — solo directora, solo en tipos no cerrados
router.post('/:tipo', authorize('directora'), async (req, res, next) => {
  try {
    const { tipo } = req.params;
    const { key, label, emoji, color } = req.body;

    if (!key || !label) return res.status(400).json({ error: 'key y label son requeridos' });

    if (TIPOS_CERRADOS.has(tipo)) {
      return res.status(403).json({ error: 'Este catálogo es de sistema y no permite agregar opciones' });
    }

    // Calcular orden siguiente
    const ordenResult = await query(
      `SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM catalogos WHERE tipo = $1`,
      [tipo]
    );
    const orden = ordenResult.rows[0].siguiente;

    const result = await query(
      `INSERT INTO catalogos (tipo, key, label, emoji, color, orden, activo, es_sistema, editable_key)
       VALUES ($1, $2, $3, $4, $5, $6, true, false, true)
       RETURNING *`,
      [tipo, key, label, emoji || null, color || null, orden]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ya existe un item con esa clave en este catálogo' });
    next(err);
  }
});

// ── PUT /catalogos/:tipo/:key ─────────────────────────────────────────────────
// Editar item — solo directora
// Campos editables: label, emoji, color, orden, activo
// La key solo es editable si editable_key=true
router.put('/:tipo/:key', authorize('directora'), async (req, res, next) => {
  try {
    const { tipo, key } = req.params;
    const { label, emoji, color, orden, activo, key: newKey } = req.body;

    // Obtener item actual
    const current = await query(
      `SELECT * FROM catalogos WHERE tipo = $1 AND key = $2`,
      [tipo, key]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Item no encontrado' });
    const item = current.rows[0];

    // Protección: si editable_key=false, ignorar cambio de key
    const keyFinal = (newKey && item.editable_key) ? newKey : key;

    // Protección: no se puede desactivar si solo quedaría 1 activo (mínimo 1 siempre)
    if (activo === false || activo === 'false') {
      const activosResult = await query(
        `SELECT COUNT(*) AS n FROM catalogos WHERE tipo = $1 AND activo = true`,
        [tipo]
      );
      if (parseInt(activosResult.rows[0].n) <= 1) {
        return res.status(400).json({ error: 'Debe quedar al menos una opción activa en el catálogo' });
      }
    }

    const inactivadoAt = (activo === false || activo === 'false') ? 'NOW()' : 'NULL';
    const activoBool = activo !== undefined ? activo : item.activo;

    const result = await query(
      `UPDATE catalogos
       SET key          = $1,
           label        = $2,
           emoji        = $3,
           color        = $4,
           orden        = $5,
           activo       = $6,
           inactivado_at = (CASE WHEN $6 = false THEN NOW() ELSE NULL END),
           updated_at   = NOW()
       WHERE tipo = $7 AND key = $8
       RETURNING *`,
      [keyFinal, label ?? item.label, emoji ?? item.emoji, color ?? item.color,
       orden ?? item.orden, activoBool, tipo, key]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ya existe un item con esa clave' });
    next(err);
  }
});

// ── DELETE /catalogos/:tipo/:key ──────────────────────────────────────────────
// Soft delete (activo=false) — NUNCA elimina físicamente
// Rechaza si es_sistema=true
router.delete('/:tipo/:key', authorize('directora'), async (req, res, next) => {
  try {
    const { tipo, key } = req.params;

    const current = await query(
      `SELECT * FROM catalogos WHERE tipo = $1 AND key = $2`,
      [tipo, key]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Item no encontrado' });
    const item = current.rows[0];

    if (item.es_sistema) {
      return res.status(403).json({
        error: 'Este item es de sistema y no puede desactivarse. Solo puedes editar su label o emoji.'
      });
    }

    // Verificar mínimo 1 activo
    const activosResult = await query(
      `SELECT COUNT(*) AS n FROM catalogos WHERE tipo = $1 AND activo = true`,
      [tipo]
    );
    if (parseInt(activosResult.rows[0].n) <= 1) {
      return res.status(400).json({ error: 'Debe quedar al menos una opción activa en el catálogo' });
    }

    const result = await query(
      `UPDATE catalogos
       SET activo = false, inactivado_at = NOW(), updated_at = NOW()
       WHERE tipo = $1 AND key = $2
       RETURNING *`,
      [tipo, key]
    );
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) { next(err); }
});

// ── PUT /catalogos/:tipo/reorder ──────────────────────────────────────────────
// Reordenar items — body: [{key, orden}, ...]
router.put('/:tipo/reorder', authorize('directora'), async (req, res, next) => {
  try {
    const { tipo } = req.params;
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items debe ser un array [{key, orden}]' });

    await Promise.all(items.map(({ key, orden }) =>
      query(
        `UPDATE catalogos SET orden = $1, updated_at = NOW() WHERE tipo = $2 AND key = $3`,
        [orden, tipo, key]
      )
    ));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;

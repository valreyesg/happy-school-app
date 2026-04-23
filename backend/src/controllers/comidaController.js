const { query } = require('../config/database');
const cloudinaryService = require('../services/cloudinaryService');
const whatsappService = require('../services/whatsappService');

// Obtener menú de la semana
exports.getMenu = async (req, res) => {
  try {
    const { semana } = req.query; // YYYY-MM-DD (lunes)
    if (!semana) return res.status(400).json({ error: 'semana requerida' });

    const result = await query(
      'SELECT * FROM menu_comida_semanal WHERE semana_inicio = $1 AND publicado = true',
      [semana]
    );

    res.json(result.rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Crear/actualizar menú (directora/admin)
exports.crearOActualizarMenu = async (req, res) => {
  try {
    const { semana_inicio, contenido_texto, dias_menu: dias_menu_str } = req.body;
    const usuario_id = req.user.id;

    if (!semana_inicio) return res.status(400).json({ error: 'semana_inicio requerida' });

    let archivo_url = null;
    let archivo_public_id = null;
    let dias_menu = null;

    // Parsear dias_menu si viene como string
    if (dias_menu_str) {
      try {
        dias_menu = typeof dias_menu_str === 'string' ? JSON.parse(dias_menu_str) : dias_menu_str;
      } catch (e) {
        return res.status(400).json({ error: 'dias_menu inválido — debe ser JSON válido' });
      }
    }

    if (req.file) {
      const upload = await cloudinaryService.uploadToCloudinary(req.file.buffer, {
        folder: 'happyschool/comida/menus',
        resource_type: 'auto'
      });
      archivo_url = upload.url;
      archivo_public_id = upload.public_id;
    }

    const sql = `
      INSERT INTO menu_comida_semanal
        (semana_inicio, contenido_texto, dias_menu, archivo_menu_url, archivo_menu_public_id, publicado, creado_por)
      VALUES ($1, $2, $3, $4, $5, true, $6)
      ON CONFLICT (semana_inicio)
      DO UPDATE SET
        contenido_texto = COALESCE($2, menu_comida_semanal.contenido_texto),
        dias_menu = COALESCE($3, menu_comida_semanal.dias_menu),
        archivo_menu_url = COALESCE($4, menu_comida_semanal.archivo_menu_url),
        archivo_menu_public_id = COALESCE($5, menu_comida_semanal.archivo_menu_public_id),
        publicado = true,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(sql, [
      semana_inicio,
      contenido_texto,
      dias_menu ? JSON.stringify(dias_menu) : null,
      archivo_url,
      archivo_public_id,
      usuario_id
    ]);

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Eliminar menú (directora/admin)
exports.eliminarMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await query('SELECT * FROM menu_comida_semanal WHERE id = $1', [id]);
    if (!menu.rows[0]) return res.status(404).json({ error: 'Menú no encontrado' });

    if (menu.rows[0].archivo_menu_public_id) {
      await cloudinaryService.deleteFromCloudinary(menu.rows[0].archivo_menu_public_id);
    }

    await query('DELETE FROM menu_comida_semanal WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Obtener estadísticas de confirmaciones (directora/admin/maestras)
exports.obtenerConfirmaciones = async (req, res) => {
  try {
    const { semana, grupo_id } = req.query;
    if (!semana) return res.status(400).json({ error: 'semana requerida' });

    // Si es maestra, filtrar por su grupo
    let whereGrupo = '';
    let params = [semana];
    if (grupo_id) {
      whereGrupo = ` AND a.grupo_id = $2`;
      params.push(grupo_id);
    }

    // Estadísticas con breakdown por pago y método
    const statsResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE ccs.confirmado = true) as total_confirmados,
        COUNT(*) FILTER (WHERE ccs.confirmado = true AND ccs.pago_verificado = true) as pagado_total,
        COUNT(*) FILTER (WHERE ccs.confirmado = true AND ccs.pago_verificado = true AND ccs.metodo_pago = 'transferencia') as pagado_transferencia,
        COUNT(*) FILTER (WHERE ccs.confirmado = true AND ccs.pago_verificado = true AND ccs.metodo_pago = 'efectivo') as pagado_efectivo,
        COUNT(*) FILTER (WHERE ccs.confirmado = true AND ccs.pago_verificado = false) as sin_verificar_total,
        COUNT(*) FILTER (WHERE ccs.confirmado = true AND ccs.pago_verificado = false AND ccs.metodo_pago = 'transferencia') as sin_verificar_transferencia,
        COUNT(*) FILTER (WHERE ccs.confirmado = true AND ccs.pago_verificado = false AND ccs.metodo_pago = 'efectivo') as sin_verificar_efectivo
       FROM control_comida_semanal ccs
       JOIN alumnos a ON a.id = ccs.alumno_id
       WHERE ccs.semana_inicio = $1${whereGrupo}`,
      params
    );

    // Confirmaciones con todos los campos explícitos
    const confirmacionesResult = await query(
      `SELECT
        ccs.id,
        ccs.alumno_id,
        a.nombre_completo,
        ccs.modalidad,
        ccs.dias_seleccionados,
        ccs.monto,
        ccs.metodo_pago,
        ccs.comprobante_pago_url,
        ccs.comprobante_pago_public_id,
        ccs.pago_verificado,
        ccs.estado
       FROM control_comida_semanal ccs
       JOIN alumnos a ON a.id = ccs.alumno_id
       WHERE ccs.semana_inicio = $1 AND ccs.confirmado = true${whereGrupo}
       ORDER BY a.nombre_completo`,
      params
    );

    const stats = statsResult.rows[0];
    res.json({
      semana,
      total_confirmados: parseInt(stats.total_confirmados) || 0,
      pagados: {
        total: parseInt(stats.pagado_total) || 0,
        transferencia: parseInt(stats.pagado_transferencia) || 0,
        efectivo: parseInt(stats.pagado_efectivo) || 0
      },
      sin_verificar: {
        total: parseInt(stats.sin_verificar_total) || 0,
        transferencia: parseInt(stats.sin_verificar_transferencia) || 0,
        efectivo: parseInt(stats.sin_verificar_efectivo) || 0
      },
      confirmaciones: confirmacionesResult.rows || []
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Papá confirma comida (domingo)
exports.confirmarComida = async (req, res) => {
  try {
    const { alumno_id, semana_inicio, modalidad, dias_seleccionados, metodo_pago } = req.body;
    const usuario_id = req.user.id;

    if (!alumno_id || !semana_inicio || !modalidad || !metodo_pago) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    let monto = 0;
    if (modalidad === 'semana_completa') {
      monto = 250;
    } else if (modalidad === 'dias_especificos') {
      if (!dias_seleccionados || dias_seleccionados.length === 0) {
        return res.status(400).json({ error: 'Debe seleccionar al menos un día' });
      }
      monto = 50 * dias_seleccionados.length;
    }

    // Si es transferencia, debe haber comprobante
    let comprobante_url = null;
    let comprobante_public_id = null;

    if (metodo_pago === 'transferencia' && req.file) {
      const upload = await cloudinaryService.uploadToCloudinary(req.file.buffer, {
        folder: 'happyschool/comida/comprobantes',
        resource_type: 'auto'
      });
      comprobante_url = upload.url;
      comprobante_public_id = upload.public_id;
    }

    const query = `
      INSERT INTO control_comida_semanal
        (alumno_id, semana_inicio, confirmado, modalidad, dias_seleccionados, monto,
         metodo_pago, comprobante_pago_url, comprobante_pago_public_id)
      VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (alumno_id, semana_inicio)
      DO UPDATE SET
        confirmado = true,
        modalidad = $3,
        dias_seleccionados = $4,
        monto = $5,
        metodo_pago = $6,
        comprobante_pago_url = COALESCE($7, control_comida_semanal.comprobante_pago_url),
        comprobante_pago_public_id = COALESCE($8, control_comida_semanal.comprobante_pago_public_id),
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(query, [
      alumno_id,
      semana_inicio,
      modalidad,
      dias_seleccionados || null,
      monto,
      metodo_pago,
      comprobante_url,
      comprobante_public_id
    ]);

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Papá consulta su confirmación
exports.verConfirmacion = async (req, res) => {
  try {
    const { alumno_id } = req.params;
    const { semana } = req.query;

    if (!semana) return res.status(400).json({ error: 'semana requerida' });

    const result = await query(
      'SELECT * FROM control_comida_semanal WHERE alumno_id = $1 AND semana_inicio = $2',
      [alumno_id, semana]
    );

    res.json(result.rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Directora verifica pago (entrada, lunes)
exports.verificarPago = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE control_comida_semanal
       SET pago_verificado = true, estado = 'pagado', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Registro no encontrado' });

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Directora marca como no pagado (entrada, lunes)
exports.cancelarComida = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE control_comida_semanal
       SET estado = 'cancelado', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Registro no encontrado' });

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Job cron: Procesar comida no pagada (lunes 8:31 AM)
exports.procesarComidaNoPagada = async () => {
  try {
    const lunes = new Date();
    lunes.setDate(lunes.getDate() - lunes.getDay() + 1); // Lunes actual
    const semana_inicio = lunes.toISOString().split('T')[0];

    const noPageados = await query(
      `SELECT cc.*, a.id as alumno_id, p.telefono_whatsapp
       FROM control_comida_semanal cc
       JOIN alumnos a ON cc.alumno_id = a.id
       JOIN alumno_padre ap ON a.id = ap.alumno_id
       JOIN padres p ON ap.padre_id = p.id
       WHERE cc.semana_inicio = $1
         AND cc.confirmado = true
         AND cc.pago_verificado = false
         AND cc.estado = 'pendiente'`,
      [semana_inicio]
    );

    for (const registro of noPageados.rows) {
      // Actualizar estado a cancelado
      await query(
        `UPDATE control_comida_semanal
         SET estado = 'cancelado', notificacion_cancelacion_enviada = true, updated_at = NOW()
         WHERE id = $1`,
        [registro.id]
      );

      // Enviar WhatsApp
      if (registro.telefono_whatsapp) {
        await whatsappService.enviarMensaje(
          registro.telefono_whatsapp,
          `⚠️ Servicio de comida cancelado\n\nNo se recibió pago para la semana del ${semana_inicio}.\nPor favor contacta con la escuela.`
        );
      }
    }

    console.log(`✅ Procesadas ${noPageados.rows.length} confirmaciones sin pago`);
  } catch (e) {
    console.error('❌ Error en procesarComidaNoPagada:', e.message);
  }
};

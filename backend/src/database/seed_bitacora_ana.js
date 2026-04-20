const { query } = require('../config/database');

async function seedBitacoraAna() {
  try {
    console.log('📝 Sembrando bitácora de Ana García López para 2026-04-17...');

    // Obtener ID de Ana
    const anaRes = await query(
      `SELECT id, grupo_id FROM alumnos WHERE nombre_completo = 'Ana García López' AND deleted_at IS NULL LIMIT 1`
    );
    if (anaRes.rows.length === 0) {
      console.error('❌ Ana García López no encontrada');
      return;
    }
    const alumnoId = anaRes.rows[0].id;
    const grupoId = anaRes.rows[0].grupo_id;

    // Obtener ID de la Maestra Maternal
    const maestraRes = await query(
      `SELECT p.id FROM personal p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE u.email = 'maternal@happyschool.edu.mx' LIMIT 1`
    );
    const maestraId = maestraRes.rows[0]?.id || null;

    // Insertar bitácora diaria
    const bitRes = await query(`
      INSERT INTO bitacora_diaria (
        alumno_id, fecha, maestra_id,
        estado_animo, actividad_realizada, actividad_descripcion,
        comportamiento, comportamiento_notas,
        tuvo_fiebre, se_enfermo, notas
      ) VALUES ($1, '2026-04-17', $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (alumno_id, fecha) DO UPDATE SET
        estado_animo = $3, actividad_realizada = $4, actividad_descripcion = $5,
        comportamiento = $6, comportamiento_notas = $7,
        tuvo_fiebre = $8, se_enfermo = $9, notas = $10, updated_at = NOW()
      RETURNING id
    `, [
      alumnoId, maestraId,
      'feliz', true, 'Pintura con acuarelas y juego libre en la sala',
      'muy_bien', 'Ana fue muy participativa hoy',
      false, false, 'Ana estuvo feliz toda la jornada'
    ]);

    const bitacoraId = bitRes.rows[0].id;
    console.log(`✅ Bitácora creada: ${bitacoraId}`);

    // Insertar registro de comida
    await query(`
      INSERT INTO registro_comida (
        alumno_id, bitacora_id, fecha,
        que_comio, cuanto_comio, observaciones
      ) VALUES ($1, $2, '2026-04-17', $3, $4, $5)
      ON CONFLICT (alumno_id, fecha) DO UPDATE SET
        que_comio = $3, cuanto_comio = $4, observaciones = $5, updated_at = NOW()
    `, [
      alumnoId, bitacoraId,
      'Arroz con pollo y verduras', 'casi_todo', 'Comió bien, le gustó mucho'
    ]);

    // Insertar registros de pañal
    await query(`
      INSERT INTO registro_panial (
        alumno_id, bitacora_id, hora, condicion, tiene_irritacion, notas, registrado_por
      ) VALUES
        ($1, $2, '2026-04-17 08:30:00+00', 'orina', false, 'Normal', $3),
        ($1, $2, '2026-04-17 10:45:00+00', 'heces', false, 'Normal', $3),
        ($1, $2, '2026-04-17 12:00:00+00', 'orina', false, 'Normal', $3)
      ON CONFLICT DO NOTHING
    `, [
      alumnoId, bitacoraId, maestraId
    ]);

    // Insertar fotos de actividades (simular con URLs públicas)
    const fotoUrls = [
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1503454537688-e47a4e773545?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=300&h=300&fit=crop'
    ];

    for (let i = 0; i < fotoUrls.length; i++) {
      await query(`
        INSERT INTO actividades_fotos (
          alumno_id, grupo_id, bitacora_id, fecha,
          foto_url, descripcion, es_grupal, subido_por
        ) VALUES ($1, $2, $3, '2026-04-17', $4, $5, false, $6)
      `, [
        alumnoId, grupoId, bitacoraId,
        fotoUrls[i],
        i === 0 ? 'Pintura con acuarelas' : i === 1 ? 'Juego libre con bloques' : 'Momento de descanso',
        maestraId
      ]);
    }

    console.log('✅ Fotos de actividades insertadas');
    console.log('✅ Seed completado para Ana García López (2026-04-17)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedBitacoraAna();

// Seed para probar la bitácora de 4 tiempos
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../../src/config/database');

async function seedComida4Tiempos() {
  try {
    // Obtener un alumno de prueba (Ana García López si existe)
    const alumnoResult = await query(
      'SELECT id FROM alumnos WHERE nombre_completo = $1 LIMIT 1',
      ['Ana García López']
    );

    if (alumnoResult.rows.length === 0) {
      console.log('No se encontró alumno de prueba');
      return;
    }

    const alumnoId = alumnoResult.rows[0].id;
    const hoy = new Date().toLocaleDateString('en-CA');

    // Limpiar registros previos
    await query(
      'DELETE FROM registro_comida WHERE alumno_id = $1 AND fecha = $2',
      [alumnoId, hoy]
    );

    // Insertar 4 registros de comida
    const tiempos = [
      {
        tiempo: 'desayuno',
        que_comio: 'Cereal con leche',
        cuanto_comio: 'todo',
        observaciones: 'Comió rápidamente',
      },
      {
        tiempo: 'colacion',
        que_comio: 'Plátano y yogur',
        cuanto_comio: 'casi_todo',
        observaciones: 'Dejó un poco de plátano',
      },
      {
        tiempo: 'comida',
        que_comio: 'Arroz con pollo y verduras',
        cuanto_comio: 'mitad',
        observaciones: 'No le gustó mucho el brócoli',
      },
      {
        tiempo: 'comida_extra',
        que_comio: 'Sándwich y jugo',
        cuanto_comio: 'poco',
        observaciones: null,
      },
    ];

    for (const t of tiempos) {
      await query(`
        INSERT INTO registro_comida (alumno_id, fecha, tiempo, que_comio, cuanto_comio, observaciones)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (alumno_id, fecha, tiempo) DO UPDATE SET
          que_comio = $4, cuanto_comio = $5, observaciones = $6, updated_at = NOW()
      `, [alumnoId, hoy, t.tiempo, t.que_comio, t.cuanto_comio, t.observaciones]);
    }

    console.log('✅ Datos de comida 4 tiempos insertados para hoy');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

seedComida4Tiempos();

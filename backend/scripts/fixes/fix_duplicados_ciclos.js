/**
 * fix_duplicados_ciclos.js
 * Elimina duplicados en ciclos_escolares, reasigna FKs al registro canónico
 * y aplica UNIQUE constraint para que no vuelva a pasar.
 * Idempotente: si el constraint ya existe, lo reporta y termina.
 */
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tablas que referencian ciclos_escolares(id) con FK
    // Tablas con ciclo_id confirmadas en 001_schema_inicial.sql (líneas 62,159,192,581,659,722,945)
    const FK_TABLES = [
      { table: 'grupos',                col: 'ciclo_id' },
      { table: 'asignaciones_grupo',    col: 'ciclo_id' },
      { table: 'alumnos',               col: 'ciclo_id' },
      { table: 'config_horario_alumno', col: 'ciclo_id' },
      { table: 'lista_utiles',          col: 'ciclo_id' },
      { table: 'periodos_evaluacion',   col: 'ciclo_id' },
      { table: 'inscripciones',         col: 'ciclo_id' },
    ];

    // 2. Encontrar grupos duplicados
    const { rows: dupes } = await client.query(`
      SELECT nombre, array_agg(id ORDER BY activo DESC, created_at ASC) AS ids
      FROM ciclos_escolares
      GROUP BY nombre
      HAVING COUNT(*) > 1
    `);

    if (dupes.length === 0) {
      console.log('Sin duplicados en ciclos_escolares.');
    } else {
      for (const { nombre, ids } of dupes) {
        const [keep, ...remove] = ids;
        console.log(`"${nombre}": conservando ${keep}, eliminando [${remove.join(', ')}]`);

        for (const { table, col } of FK_TABLES) {
          // Verificar si la tabla existe antes de actualizar
          const { rows: exists } = await client.query(
            `SELECT 1 FROM information_schema.tables WHERE table_name = $1`, [table]
          );
          if (exists.length === 0) continue;

          const res = await client.query(
            `UPDATE ${table} SET ${col} = $1 WHERE ${col} = ANY($2)`,
            [keep, remove]
          );
          if (res.rowCount > 0)
            console.log(`  → ${table}: ${res.rowCount} filas reasignadas`);
        }

        // Eliminar los duplicados
        await client.query(`DELETE FROM ciclos_escolares WHERE id = ANY($1)`, [remove]);
        console.log(`  → ${remove.length} duplicado(s) eliminado(s)`);
      }
    }

    // 3. Aplicar UNIQUE constraint (si no existe ya)
    const { rows: existing } = await client.query(`
      SELECT 1 FROM pg_constraint
      WHERE conname = 'ciclos_escolares_nombre_unique'
    `);

    if (existing.length > 0) {
      console.log('UNIQUE constraint ya existe — nada que hacer.');
    } else {
      await client.query(`
        ALTER TABLE ciclos_escolares
          ADD CONSTRAINT ciclos_escolares_nombre_unique UNIQUE (nombre)
      `);
      console.log('UNIQUE constraint aplicado correctamente.');
    }

    await client.query('COMMIT');
    console.log('Listo.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();

#!/usr/bin/env node
/**
 * migrate-runner.js — Runner genérico de migraciones SQL
 *
 * Uso individual:
 *   node scripts/migrate-runner.js migrations/016_nueva.sql
 *
 * Para ejecutar varias en lote:
 *   node scripts/migrate-runner.js migrations/014_... migrations/015_...
 *
 * Historial: consolidado desde backend/migrate.js (hardcoded 014+015)
 *            y backend/run-migration.js (genérico).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/database');

async function runMigration(file) {
  const sql = fs.readFileSync(file, 'utf8');
  console.log(`Ejecutando: ${path.basename(file)}`);
  await query(sql);
  console.log(`Completada: ${path.basename(file)}`);
}

(async () => {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Uso: node scripts/migrate-runner.js <migration.sql> [más archivos...]');
    process.exit(1);
  }
  for (const f of files) await runMigration(f);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });

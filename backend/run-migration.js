#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/database');

async function runMigration(migrationFile) {
  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log(`Ejecutando: ${path.basename(migrationFile)}`);
    await query(sql);
    console.log(`✅ Migración completada: ${path.basename(migrationFile)}`);
  } catch (err) {
    console.error(`❌ Error en migración:`, err.message);
    process.exit(1);
  }
}

async function main() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('Uso: node run-migration.js <path-a-migration.sql>');
    process.exit(1);
  }
  await runMigration(migrationFile);
  process.exit(0);
}

main();

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../../src/config/database');

// Hoy: 2026-04-18
// Maternal  6-18 meses  → nacidos 2024-10-18 a 2025-10-18
// Prekinder 18-24 meses → nacidos 2024-04-18 a 2024-10-18
// Kinder 1  3-4 años    → nacidos 2022-04-18 a 2023-04-18
// Kinder 2  4-5 años    → nacidos 2021-04-18 a 2022-04-18
// Kinder 3  5-6 años    → nacidos 2020-04-18 a 2021-04-18

const UPDATES = [
  // ── Maternal (pañal: todos) ──────────────────────────────────────────────
  { curp: 'GALA220315MDFRLNA1', fn: '2025-02-15', panial: true  }, // 14 meses
  { curp: 'RATS220720MDFMRFA1', fn: '2025-07-20', panial: true  }, //  9 meses
  { curp: 'LOHM221105HDFLPAA1', fn: '2024-11-05', panial: true  }, // 17 meses
  { curp: 'MODI211210MDFRRBA1', fn: '2025-04-10', panial: true  }, // 12 meses
  { curp: 'VESE220822HDFGNAA1', fn: '2025-08-22', panial: true  }, //  8 meses

  // ── Prekinder (pañal: 4 de 5) ────────────────────────────────────────────
  { curp: 'FORV210418MDFLRLA1', fn: '2024-06-18', panial: true  }, // 22 meses
  { curp: 'GUMS210930HDFTNAA1', fn: '2024-09-30', panial: true  }, // 18 meses
  { curp: 'TOGC210614MDFRRMA1', fn: '2024-05-14', panial: true  }, // 23 meses
  { curp: 'MECS210208HDFDSBA1', fn: '2024-08-08', panial: true  }, // 20 meses
  { curp: 'JIVL211125MDFFMCA1', fn: '2024-07-25', panial: false }, // 21 meses — ya sin pañal

  // ── Kinder 1 (pañal: 1 de 5 — María Fernanda) ────────────────────────────
  { curp: 'HEMD200322HDFRNAA1', fn: '2022-08-22', panial: false }, // 3a 8m
  { curp: 'MASG200817MDFRRLA1', fn: '2023-02-17', panial: false }, // 3a 2m
  { curp: 'REOA200511HDFRYNA1', fn: '2022-11-11', panial: false }, // 3a 5m
  { curp: 'CALM201003MDFRRNA1', fn: '2023-03-03', panial: true  }, // 3a 1m — usa pañal
  { curp: 'NUPR200128HDFRZNA1', fn: '2022-06-28', panial: false }, // 3a 10m

  // ── Kinder 2 (sin pañal) ─────────────────────────────────────────────────
  { curp: 'SOVA190615HDFTNLA1', fn: '2021-07-15', panial: false }, // 4a 9m
  { curp: 'CUMD190920MDFRRNA1', fn: '2021-11-20', panial: false }, // 4a 5m
  { curp: 'AIRN190405HDFGLCA1', fn: '2021-05-05', panial: false }, // 4a 11m
  { curp: 'ESIF191112MDFPNRA1', fn: '2022-01-12', panial: false }, // 4a 3m
  { curp: 'DEFR190730HDFLLFA1', fn: '2021-09-30', panial: false }, // 4a 6m

  // ── Kinder 3 (sin pañal) ─────────────────────────────────────────────────
  { curp: 'HECM180308MDFRRNA1', fn: '2020-08-08', panial: false }, // 5a 8m
  { curp: 'ROEP180825HDFBJLA1', fn: '2020-11-25', panial: false }, // 5a 5m
  { curp: 'MEGV180619MDFNLTA1', fn: '2021-02-19', panial: false }, // 5a 2m
  { curp: 'VAMC180214HDFRGLA1', fn: '2020-07-14', panial: false }, // 5a 9m
  { curp: 'PACR181007MDFLLGA1', fn: '2021-03-07', panial: false }, // 5a 1m
];

async function fix() {
  console.log('🗓️  Corrigiendo fechas de nacimiento y pañal...\n');
  let ok = 0;
  for (const u of UPDATES) {
    const r = await query(
      'UPDATE alumnos SET fecha_nacimiento = $1, usa_panial = $2, updated_at = NOW() WHERE curp = $3 RETURNING nombre_completo',
      [u.fn, u.panial, u.curp]
    );
    if (r.rows.length > 0) {
      console.log(`  ✅ ${r.rows[0].nombre_completo.padEnd(35)} fn: ${u.fn}  pañal: ${u.panial}`);
      ok++;
    } else {
      console.warn(`  ⚠️  No encontrado: curp ${u.curp}`);
    }
  }
  console.log(`\n✅ ${ok}/${UPDATES.length} alumnos actualizados.\n`);
  process.exit(0);
}

fix().catch(e => { console.error('❌', e.message); process.exit(1); });

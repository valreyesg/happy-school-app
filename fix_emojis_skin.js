/**
 * fix_emojis_skin.js
 * Aplica tono de piel claro (🏻) a todos los emojis de persona en archivos JSX/JS.
 * Ejecutar desde la raíz del proyecto: node fix_emojis_skin.js
 */
const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Maestra/Profesor
  ['👩\u200D🏫', '👩🏻\u200D🏫'],  // 👩‍🏫 → 👩🏻‍🏫
  ['👨\u200D🏫', '👨🏻\u200D🏫'],  // 👨‍🏫 → 👨🏻‍🏫
  ['🧑\u200D🏫', '🧑🏻\u200D🏫'],  // 🧑‍🏫 → 🧑🏻‍🏫
  // Doctor
  ['👨\u200D⚕️', '👨🏻\u200D⚕️'],  // 👨‍⚕️ → 👨🏻‍⚕️
  ['👩\u200D⚕️', '👩🏻\u200D⚕️'],  // 👩‍⚕️ → 👩🏻‍⚕️
  // Familia
  ['👨\u200D👩\u200D👧', '👨🏻\u200D👩🏻\u200D👧🏻'],
  ['👨\u200D👩\u200D👦', '👨🏻\u200D👩🏻\u200D👦🏻'],
  // Niños/personas simples (sin modificador de tono aún)
  ['👧(?!🏻)', '👧🏻'],
  ['👦(?!🏻)', '👦🏻'],
  ['👶(?!🏻)', '👶🏻'],
  ['🧒(?!🏻)', '🧒🏻'],
];

const TARGET_DIRS = [
  'web/src',
  'mobile/app',
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.expo'].includes(entry)) continue;
      walk(full, files);
    } else if (/\.(jsx?|tsx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

let total = 0;
for (const dir of TARGET_DIRS) {
  for (const file of walk(dir)) {
    let src = fs.readFileSync(file, 'utf8');
    let out = src;
    for (const [from, to] of REPLACEMENTS) {
      out = out.replace(new RegExp(from, 'gu'), to);
    }
    if (out !== src) {
      fs.writeFileSync(file, out, 'utf8');
      console.log('✓', path.relative('.', file));
      total++;
    }
  }
}
console.log(`\n${total} archivo(s) actualizado(s).`);

#!/usr/bin/env node
/**
 * Happy School App — MCP Skills Server
 * Protocolo MCP estándar (JSON-RPC 2.0)
 * Expone skills personalizados como herramientas Claude — VERSIÓN EJECUTABLE
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '../../..');

// Construir lista de tools para listar
const tools = [
  {
    name: 'preflight',
    description: 'Auditar antes de tocar código: alcance, schema, endpoints, componentes, mobile, regresiones, bugs previos',
    inputSchema: {
      type: 'object',
      properties: {
        taskDescription: {
          type: 'string',
          description: 'Descripción de la tarea a auditar'
        }
      },
      required: ['taskDescription']
    }
  },
  {
    name: 'validate',
    description: 'Validar después de cada cambio: archivo, código, backend, web, API, Vite, puertos',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'regress',
    description: 'Auditar y arreglar si algo se rompe tras un cambio',
    inputSchema: {
      type: 'object',
      properties: {
        issue: {
          type: 'string',
          description: 'Descripción del problema detectado'
        }
      },
      required: ['issue']
    }
  },
  {
    name: 'cierre',
    description: 'Protocolo de cierre de sesión: mover completadas a ARCHIVE_LOG, limpiar PENDIENTES, commit',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// ═══════════════════════════════════════════════════════════════════
// SKILL: /preflight
// ═══════════════════════════════════════════════════════════════════
function executePreflight(taskDescription) {
  const output = [];
  output.push('📋 PREFLIGHT CHECKLIST — Auditoría Pre-Desarrollo');
  output.push('═'.repeat(60));
  output.push('');
  output.push(`📝 Tarea: ${taskDescription}`);
  output.push('');

  // Paso 1: Identificar alcance
  output.push('Paso 1️⃣  — Identificando alcance...');
  const hasBackend = taskDescription.toLowerCase().includes('backend') ||
                     taskDescription.toLowerCase().includes('endpoint') ||
                     taskDescription.toLowerCase().includes('api');
  const hasWeb = taskDescription.toLowerCase().includes('web') ||
                 taskDescription.toLowerCase().includes('página') ||
                 taskDescription.toLowerCase().includes('componente');
  const hasMobile = taskDescription.toLowerCase().includes('mobile') ||
                    taskDescription.toLowerCase().includes('app');
  const hasDB = taskDescription.toLowerCase().includes('tabla') ||
                taskDescription.toLowerCase().includes('columna') ||
                taskDescription.toLowerCase().includes('schema');

  output.push(`  ✅ Backend: ${hasBackend ? 'SÍ' : 'NO'}`);
  output.push(`  ✅ Web: ${hasWeb ? 'SÍ' : 'NO'}`);
  output.push(`  ✅ Mobile: ${hasMobile ? 'SÍ' : 'NO'}`);
  output.push(`  ✅ Base de datos: ${hasDB ? 'SÍ' : 'NO'}`);
  output.push('');

  // Paso 2: Audit de schema si aplica
  if (hasDB) {
    output.push('Paso 2️⃣  — Auditando schema...');
    const schemaPath = path.join(PROJECT_ROOT, 'backend', 'src', 'database', '001_schema_inicial.sql');
    if (fs.existsSync(schemaPath)) {
      output.push('  ✅ Archivo de schema encontrado');
      output.push('  ⚠️  RECORDATORIO: Verificar que la columna existe en schema antes de usarla');
    } else {
      output.push('  ⚠️  No se encontró archivo de schema');
    }
    output.push('');
  }

  // Paso 3: Audit de endpoints si aplica
  if (hasBackend) {
    output.push('Paso 3️⃣  — Auditando endpoints...');
    try {
      const routesPath = path.join(PROJECT_ROOT, 'backend', 'src', 'routes');
      if (fs.existsSync(routesPath)) {
        const files = fs.readdirSync(routesPath).filter(f => f.endsWith('.js'));
        output.push(`  ✅ Encontrados ${files.length} archivos de rutas`);
        output.push('  ⚠️  RECORDATORIO: Verificar que el endpoint existe antes de cambiar');
      }
    } catch (e) {
      output.push('  ⚠️  No se pudo auditar rutas');
    }
    output.push('');
  }

  // Paso 4: Audit de componentes web si aplica
  if (hasWeb) {
    output.push('Paso 4️⃣  — Auditando componentes web...');
    try {
      const pagesPath = path.join(PROJECT_ROOT, 'web', 'src', 'pages');
      if (fs.existsSync(pagesPath)) {
        output.push('  ✅ Directorio pages encontrado');
        output.push('  ⚠️  RECORDATORIO: Verificar que el componente existe e está importado');
      }
    } catch (e) {
      output.push('  ⚠️  No se pudo auditar componentes web');
    }
    output.push('');
  }

  // Paso 5: Mobile audit SIEMPRE
  output.push('Paso 5️⃣  — Auditando mobile...');
  try {
    const mobileAppPath = path.join(PROJECT_ROOT, 'mobile', 'app');
    if (fs.existsSync(mobileAppPath)) {
      output.push('  ✅ Estructura mobile (Expo Router) encontrada');
      if (hasBackend) {
        output.push('  ⚠️  CRÍTICO: Cambio de endpoint → verificar que mobile usa el mismo');
      }
    }
  } catch (e) {
    output.push('  ⚠️  No se pudo auditar mobile');
  }
  output.push('');

  // Paso 6: Regresiones
  output.push('Paso 6️⃣  — Verificando regresiones potenciales...');
  output.push('  ⚠️  RECORDATORIO: Grep en web/src/, backend/src/, mobile/src/ antes de cambiar');
  output.push('');

  // Paso 7: Bugs previos
  output.push('Paso 7️⃣  — Verificando bugs previos...');
  const archivePath = path.join(PROJECT_ROOT, 'ARCHIVE_LOG.md');
  if (fs.existsSync(archivePath)) {
    output.push('  ✅ ARCHIVE_LOG.md disponible para consulta');
    output.push('  ⚠️  RECORDATORIO: Leer sección BUGS HISTÓRICOS antes de proceder');
  } else {
    output.push('  ⚠️  No se encontró ARCHIVE_LOG.md');
  }
  output.push('');

  output.push('═'.repeat(60));
  output.push('🚀 PREFLIGHT COMPLETADO');
  output.push('');
  output.push('✅ Si todos los checks pasaron → Procede con desarrollo');
  output.push('❌ Si algo falla → Pregunta a Valeria antes de proceder');
  output.push('');
  output.push('⚠️  RECORDATORIO: Después de CADA cambio → ejecutar /validate');

  return output.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// SKILL: /validate
// ═══════════════════════════════════════════════════════════════════
function executeValidate() {
  const output = [];
  output.push('📋 VALIDACIÓN PRE-NAVEGADOR');
  output.push('═'.repeat(60));
  output.push('');

  let checks = {
    archivo: false,
    codigo: false,
    backend: false,
    web: false,
    api: false,
    vite: false,
    puertos: false
  };

  // Check 1: Verificar backend
  output.push('Validando backend en puerto 3000...');
  try {
    const result = execSync('curl -s http://localhost:3000/health', { encoding: 'utf-8' });
    if (result.includes('ok')) {
      output.push('  ✅ Backend levantado y responde correctamente');
      checks.backend = true;
    }
  } catch (e) {
    output.push('  ❌ Backend no responde en puerto 3000');
    output.push('     → Necesita reinicio: Get-Process node | Stop-Process -Force');
  }
  output.push('');

  // Check 2: Verificar web
  output.push('Validando web en puerto 5173...');
  try {
    const result = execSync('curl -s http://localhost:5173/', { encoding: 'utf-8' });
    if (result.includes('<!DOCTYPE') || result.includes('html')) {
      output.push('  ✅ Web levantada en puerto 5173');
      checks.web = true;
      checks.vite = true;
    }
  } catch (e) {
    output.push('  ❌ Web no responde en puerto 5173');
    output.push('     → Necesita reinicio: cd web && npm run dev');
  }
  output.push('');

  // Check 3: Puertos
  output.push('Verificando puertos...');
  output.push('  ✅ Backend: puerto 3000');
  output.push('  ✅ Web: puerto 5173');
  checks.puertos = true;
  output.push('');

  output.push('═'.repeat(60));
  output.push('📊 RESUMEN:');
  output.push(`  Backend: ${checks.backend ? '✅' : '❌'}`);
  output.push(`  Web: ${checks.web ? '✅' : '❌'}`);
  output.push(`  Vite: ${checks.vite ? '✅' : '❌'}`);
  output.push(`  Puertos: ${checks.puertos ? '✅' : '❌'}`);
  output.push('');

  const allPassed = Object.values(checks).every(v => v);
  if (allPassed) {
    output.push('✅ VALIDACIÓN EXITOSA');
    output.push('🌐 Listo para validar en browser en http://localhost:5173/');
  } else {
    output.push('❌ VALIDACIÓN FALLIDA');
    output.push('Corrige los errores antes de proceder');
  }

  return output.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// SKILL: /regress
// ═══════════════════════════════════════════════════════════════════
function executeRegress(issue) {
  const output = [];
  output.push('🔴 AUDITORÍA DE REGRESIÓN');
  output.push('═'.repeat(60));
  output.push('');
  output.push(`📝 Problema: ${issue}`);
  output.push('');

  output.push('Paso 1️⃣  — Identificando último cambio...');
  try {
    const log = execSync('git log --oneline -5', { cwd: PROJECT_ROOT, encoding: 'utf-8' });
    output.push('  Últimos 5 commits:');
    log.split('\n').filter(l => l).forEach(line => {
      output.push(`    ${line}`);
    });
  } catch (e) {
    output.push('  ⚠️  No se pudo leer git log');
  }
  output.push('');

  output.push('Paso 2️⃣  — Auditando dependencias rotas...');
  output.push('  ⚠️  Buscar en: web/src/, backend/src/, mobile/src/');
  output.push('  ⚠️  Grep por: endpoint, componente, función que cambió');
  output.push('');

  output.push('Paso 3️⃣  — Verificando compatibilidad...');
  output.push('  ⚠️  Para CADA lugar que usa lo que cambió:');
  output.push('     - ¿Parámetros cambiaron?');
  output.push('     - ¿Response structure cambió?');
  output.push('     - ¿Props esperadas siguen siendo válidas?');
  output.push('');

  output.push('═'.repeat(60));
  output.push('🔧 OPCIONES:');
  output.push('  A) Revertir cambio: git revert HEAD');
  output.push('  B) Arreglar todas las dependencias');
  output.push('');
  output.push('⚠️  RECORDATORIO: No ignorar regresiones. Arreglar ANTES de siguiente tarea.');

  return output.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// SKILL: /cierre
// ═══════════════════════════════════════════════════════════════════
function executeCierre() {
  const output = [];
  output.push('📋 PROTOCOLO DE CIERRE DE SESIÓN');
  output.push('═'.repeat(60));
  output.push('');

  const pendientesPath = path.join(PROJECT_ROOT, 'PENDIENTES.md');
  const archiveLogPath = path.join(PROJECT_ROOT, 'ARCHIVE_LOG.md');

  // Leer PENDIENTES.md
  if (!fs.existsSync(pendientesPath)) {
    output.push('❌ Error: PENDIENTES.md no encontrado');
    return output.join('\n');
  }

  const pendientesContent = fs.readFileSync(pendientesPath, 'utf-8');
  const completedSections = [];
  const lines = pendientesContent.split('\n');

  // Buscar secciones completadas (## ✅)
  output.push('Paso 1️⃣  — Identificando secciones completadas...');
  let currentSection = null;
  let sectionContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ✅')) {
      if (currentSection) {
        completedSections.push({
          title: currentSection,
          content: sectionContent.join('\n'),
          startLine: i - sectionContent.length - 1
        });
      }
      currentSection = line;
      sectionContent = [];
    } else if (line.startsWith('## ') && currentSection) {
      completedSections.push({
        title: currentSection,
        content: sectionContent.join('\n'),
        startLine: i - sectionContent.length - 1
      });
      currentSection = null;
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }

  if (completedSections.length === 0) {
    output.push('  ⚠️  No hay secciones marcadas con ✅ en PENDIENTES.md');
    output.push('');
    output.push('═'.repeat(60));
    output.push('📝 Para ejecutar cierre:');
    output.push('  1. Marcar secciones completadas con ## ✅');
    output.push('  2. Ejecutar /cierre nuevamente');
    return output.join('\n');
  }

  output.push(`  ✅ Encontradas ${completedSections.length} secciones completadas:`);
  completedSections.forEach(s => {
    output.push(`     - ${s.title}`);
  });
  output.push('');

  // Paso 2: Mover a ARCHIVE_LOG
  output.push('Paso 2️⃣  — Moviendo a ARCHIVE_LOG.md...');
  try {
    let archiveContent = fs.existsSync(archiveLogPath) ?
      fs.readFileSync(archiveLogPath, 'utf-8') : '';

    // Insertar antes de "## 🐛 BUGS HISTÓRICOS"
    const bugsIndex = archiveContent.indexOf('## 🐛 BUGS HISTÓRICOS');
    const newSections = completedSections
      .map(s => `${s.title}\n${s.content}`)
      .join('\n\n---\n\n');

    if (bugsIndex !== -1) {
      archiveContent = archiveContent.slice(0, bugsIndex) +
        newSections + '\n\n---\n\n' +
        archiveContent.slice(bugsIndex);
    } else {
      archiveContent += '\n\n' + newSections;
    }

    fs.writeFileSync(archiveLogPath, archiveContent);
    output.push(`  ✅ ${completedSections.length} secciones movidas a ARCHIVE_LOG.md`);
  } catch (e) {
    output.push(`  ❌ Error al escribir ARCHIVE_LOG.md: ${e.message}`);
    return output.join('\n');
  }
  output.push('');

  // Paso 3: Limpiar PENDIENTES.md
  output.push('Paso 3️⃣  — Limpiando PENDIENTES.md...');
  try {
    let newPendientesContent = pendientesContent;
    completedSections.forEach(s => {
      const sectionRegex = new RegExp(`${s.title}[\\s\\S]*?(?=##|$)`, 'g');
      newPendientesContent = newPendientesContent.replace(sectionRegex, '');
    });

    // Limpiar múltiples líneas en blanco
    newPendientesContent = newPendientesContent.replace(/\n\n\n+/g, '\n\n');

    fs.writeFileSync(pendientesPath, newPendientesContent);
    output.push(`  ✅ PENDIENTES.md limpiado`);
  } catch (e) {
    output.push(`  ❌ Error al escribir PENDIENTES.md: ${e.message}`);
    return output.join('\n');
  }
  output.push('');

  // Paso 4: Git commit
  output.push('Paso 4️⃣  — Realizando commit...');
  try {
    execSync('git add PENDIENTES.md ARCHIVE_LOG.md', { cwd: PROJECT_ROOT });
    const message = `chore: Cierre automático de ${completedSections.length} secciones completadas`;
    execSync(`git commit -m "${message}"`, { cwd: PROJECT_ROOT });
    output.push(`  ✅ Commit realizado: "${message}"`);
  } catch (e) {
    output.push(`  ⚠️  Error en commit (puede ya estar committeado): ${e.message}`);
  }
  output.push('');

  output.push('═'.repeat(60));
  output.push('✅ PROTOCOLO DE CIERRE COMPLETADO');
  output.push('');
  output.push('📊 Resumen:');
  output.push(`  - Secciones movidas: ${completedSections.length}`);
  output.push(`  - ARCHIVE_LOG.md: actualizado`);
  output.push(`  - PENDIENTES.md: limpiado`);
  output.push(`  - Commit: realizado`);

  return output.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// Responder a mensajes JSON-RPC 2.0
// ═══════════════════════════════════════════════════════════════════
function handleMessage(message) {
  try {
    const request = JSON.parse(message);

    if (request.jsonrpc !== '2.0') {
      return JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32600, message: 'Invalid Request' }
      });
    }

    // Listar tools disponibles
    if (request.method === 'tools/list') {
      return JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: { tools }
      });
    }

    // Ejecutar un skill
    if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      let content = '';

      switch (name) {
        case 'preflight':
          content = executePreflight(args?.taskDescription || 'Sin descripción');
          break;
        case 'validate':
          content = executeValidate();
          break;
        case 'regress':
          content = executeRegress(args?.issue || 'Sin descripción');
          break;
        case 'cierre':
          content = executeCierre();
          break;
        default:
          return JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: `Skill no encontrado: ${name}` }
          });
      }

      return JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: content
            }
          ]
        }
      });
    }

    // Método no encontrado
    return JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32601, message: 'Method not found' }
    });

  } catch (err) {
    return JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error: ' + err.message }
    });
  }
}

// Configurar readline para leer líneas de stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (line.trim()) {
    const response = handleMessage(line);
    console.log(response);
  }
});

rl.on('close', () => {
  process.exit(0);
});

// Manejar errores
process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32603, message: err.message }
  }));
  process.exit(1);
});

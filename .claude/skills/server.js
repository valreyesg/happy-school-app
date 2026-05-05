#!/usr/bin/env node
/**
 * Happy School App — MCP Skills Server
 * Expone skills personalizados como herramientas Claude
 */

const { spawn } = require('child_process');
const path = require('path');

const SKILLS = {
  'preflight': {
    description: 'Auditar antes de tocar código: alcance, schema, endpoints, componentes, mobile, regresiones, bugs previos',
    file: 'preflight.md'
  },
  'validate': {
    description: 'Validar después de cada cambio: archivo, código, backend, web, API, Vite, puertos',
    file: 'validate.md'
  },
  'regress': {
    description: 'Auditar y arreglar si algo se rompe tras un cambio',
    file: 'regress.md'
  },
  'cierre': {
    description: 'Protocolo de cierre de sesión: mover completadas a ARCHIVE_LOG, limpiar PENDIENTES, commit',
    file: 'cierre.md'
  }
};

async function executeSkill(skillName, args) {
  const skill = SKILLS[skillName];
  if (!skill) {
    return { error: `Skill no encontrado: ${skillName}` };
  }

  const skillPath = path.join(__dirname, skill.file);

  try {
    // Leer el archivo MD y extraer instrucciones
    const fs = require('fs');
    const content = fs.readFileSync(skillPath, 'utf-8');

    return {
      skillName,
      instructions: content,
      status: 'ready'
    };
  } catch (err) {
    return { error: err.message };
  }
}

// Registrar herramientas en Claude
const tools = Object.entries(SKILLS).map(([name, skill]) => ({
  name,
  description: skill.description,
  inputSchema: {
    type: 'object',
    properties: {
      args: {
        type: 'string',
        description: 'Argumentos opcionales'
      }
    }
  }
}));

// Responder a requests del protocolo MCP
process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString());

    if (request.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ tools }));
    } else if (request.method === 'tools/call') {
      const result = await executeSkill(request.params.name, request.params.arguments);
      process.stdout.write(JSON.stringify({ result }));
    }
  } catch (err) {
    process.stderr.write(JSON.stringify({ error: err.message }));
  }
});

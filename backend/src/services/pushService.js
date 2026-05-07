const { query } = require('../config/database');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Cache de tipos urgentes — se refresca cada 5 min para no consultar BD en cada push
let tiposUrgentesCached = null;
let tiposUrgentesExpira = 0;

async function getTiposUrgentes() {
  if (tiposUrgentesCached && Date.now() < tiposUrgentesExpira) return tiposUrgentesCached;
  try {
    const r = await query(
      `SELECT valor FROM configuracion_general WHERE clave = 'notificaciones_modal_tipos'`
    );
    tiposUrgentesCached = r.rows.length ? JSON.parse(r.rows[0].valor) : [];
  } catch {
    tiposUrgentesCached = tiposUrgentesCached || [];
  }
  tiposUrgentesExpira = Date.now() + 5 * 60 * 1000;
  return tiposUrgentesCached;
}

/**
 * Envía notificación push via Expo Push Service.
 * Solo envía si el tipo está en notificaciones_modal_tipos (configurado por Directora).
 * No requiere Firebase ni credenciales externas.
 *
 * @param {string|string[]} usuarioIds  — uno o array de UUIDs de usuario
 * @param {string} titulo
 * @param {string} cuerpo
 * @param {object} [datos]              — debe incluir { tipo: 'incidente' | 'aviso_extraordinario' | ... }
 */
async function enviarPush(usuarioIds, titulo, cuerpo, datos = {}) {
  // Verificar si este tipo está habilitado para push
  const tiposUrgentes = await getTiposUrgentes();
  if (datos.tipo && tiposUrgentes.length > 0 && !tiposUrgentes.includes(datos.tipo)) return;

  const ids = Array.isArray(usuarioIds) ? usuarioIds : [usuarioIds];
  if (ids.length === 0) return;

  try {
    // Obtener tokens Expo de los usuarios
    const result = await query(
      `SELECT fcm_token FROM usuarios WHERE id = ANY($1::uuid[]) AND fcm_token IS NOT NULL`,
      [ids]
    );

    const tokens = result.rows
      .map(r => r.fcm_token)
      .filter(t => t && t.startsWith('ExponentPushToken['));

    if (tokens.length === 0) return;

    // Construir mensajes para Expo Push API
    const mensajes = tokens.map(token => ({
      to: token,
      title: titulo,
      body: cuerpo,
      data: datos,
      sound: 'default',
      priority: 'high',
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(mensajes),
    });

    if (!response.ok) {
      console.error('[Push] Expo API error:', response.status, await response.text());
    }
  } catch (err) {
    // No lanzar — push es best-effort, no debe romper el flujo principal
    console.error('[Push] Error enviando notificación:', err.message);
  }
}

module.exports = { enviarPush };

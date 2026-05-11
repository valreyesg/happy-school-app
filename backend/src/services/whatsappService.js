const { query } = require('../config/database');

// Lazy init — solo falla si se intenta enviar sin credenciales reales
let _client = null;
const getClient = () => {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    if (!sid || !sid.startsWith('AC')) return null;
    const twilio = require('twilio');
    _client = twilio(sid, process.env.TWILIO_AUTH_TOKEN);
  }
  return _client;
};

const FROM = process.env.TWILIO_WHATSAPP_FROM;

const obtenerPlantilla = async (clave) => {
  const result = await query(
    'SELECT plantilla FROM plantillas_whatsapp WHERE clave = $1 AND activa = true',
    [clave]
  );
  return result.rows[0]?.plantilla || null;
};

const rellenarPlantilla = (plantilla, variables) => {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
};

const enviarMensaje = async ({ telefono, clave, variables, alumnoId, mensajeDirecto }) => {
  // Guarda: sin teléfono no hay envío
  if (!telefono || !String(telefono).trim()) return { omitido: true };

  // Flag de entorno: si WHATSAPP_ENABLED=false → no-op sin tocar BD
  if (process.env.WHATSAPP_ENABLED === 'false') return { omitido: true };

  const whatsappActivo = await query(
    "SELECT valor FROM configuracion_general WHERE clave = 'whatsapp_activo'"
  );
  if (whatsappActivo.rows[0]?.valor !== 'true') return { omitido: true };

  let mensaje = mensajeDirecto;
  if (!mensaje && clave) {
    const plantilla = await obtenerPlantilla(clave);
    if (!plantilla) {
      console.warn(`Plantilla WhatsApp no encontrada: ${clave}`);
      return { error: 'Plantilla no encontrada' };
    }
    mensaje = rellenarPlantilla(plantilla, variables || {});
  }

  // Normalizar número mexicano para WhatsApp
  // WhatsApp registra móviles MX como +521XXXXXXXXXX (con el 1 intermedio)
  const soloDigitos = telefono.replace(/\D/g, '');
  let telefonoWA;
  if (soloDigitos.startsWith('521') && soloDigitos.length === 13) {
    // Ya tiene +521 + 10 dígitos → correcto
    telefonoWA = `whatsapp:+${soloDigitos}`;
  } else if (soloDigitos.startsWith('52') && soloDigitos.length === 12) {
    // Tiene +52 + 10 dígitos → agregar el 1 intermedio
    telefonoWA = `whatsapp:+521${soloDigitos.slice(2)}`;
  } else if (soloDigitos.length === 10) {
    // Solo 10 dígitos locales → agregar +521
    telefonoWA = `whatsapp:+521${soloDigitos}`;
  } else {
    // Formato desconocido → usar tal cual
    telefonoWA = `whatsapp:+${soloDigitos}`;
  }

  const client = getClient();
  if (!client) {
    console.warn('WhatsApp: Twilio no configurado, mensaje omitido.');
    return { omitido: true };
  }

  try {
    const response = await client.messages.create({
      body: mensaje,
      from: FROM,
      to: telefonoWA,
    });

    await query(
      `INSERT INTO log_whatsapp (telefono, mensaje, tipo, estado, twilio_sid, alumno_id)
       VALUES ($1, $2, $3, 'enviado', $4, $5)`,
      [telefono, mensaje, clave || 'directo', response.sid, alumnoId || null]
    );

    return { sid: response.sid };
  } catch (error) {
    await query(
      `INSERT INTO log_whatsapp (telefono, mensaje, tipo, estado, alumno_id)
       VALUES ($1, $2, $3, 'fallido', $4)`,
      [telefono, mensaje, clave || 'directo', alumnoId || null]
    );
    console.error('Error WhatsApp:', error.message);
    return { error: error.message };
  }
};

// Notificaciones específicas
const notificarRetardo = async (alumno, padre, numeroRetardo) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'retardo',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      nombre_alumno: alumno.nombre_completo,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      numero_retardo: numeroRetardo,
    },
    alumnoId: alumno.id,
  });
};

const notificarFiebre = async (padre, alumno, temperatura) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'fiebre',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      nombre_alumno: alumno.nombre_completo,
      temperatura: temperatura || '—',
    },
    alumnoId: alumno.id,
  });
};

const notificarSinComida = async (padre, alumno) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'sin_comida',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      nombre_alumno: alumno.nombre_completo,
    },
    alumnoId: alumno.id,
  });
};

const notificarIncidente = async (padre, alumno) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'incidente',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      nombre_alumno: alumno.nombre_completo,
    },
    alumnoId: alumno.id,
  });
};

// ── Notificaciones con disparador manual ──────────────────────────────────────

const notificarRecordatorioPago = async (padre, alumno, dia, monto) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'recordatorio_pago',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      nombre_alumno: alumno.nombre_completo,
      dia,
      monto: parseFloat(monto).toFixed(2),
    },
    alumnoId: alumno.id,
  });
};

const notificarRecargo = async (padre, alumno, montoRecargo, diasAtraso, total) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'recargo',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      nombre_alumno: alumno.nombre_completo,
      monto_recargo: parseFloat(montoRecargo).toFixed(2),
      dias_atraso: diasAtraso,
      total: parseFloat(total).toFixed(2),
    },
    alumnoId: alumno.id,
  });
};

const notificarSinRecoger = async (padre, alumno, horaSalida) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'sin_recoger',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      nombre_alumno: alumno.nombre_completo,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      hora_salida: horaSalida,
    },
    alumnoId: alumno.id,
  });
};

const notificarPagoComidaLunes = async (padre, alumno, monto) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'pago_comida_lunes',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      monto: parseFloat(monto).toFixed(2),
    },
    alumnoId: alumno.id,
  });
};

module.exports = {
  enviarMensaje,
  notificarRetardo,
  notificarFiebre,
  notificarSinComida,
  notificarIncidente,
  notificarRecordatorioPago,
  notificarRecargo,
  notificarSinRecoger,
  notificarPagoComidaLunes,
};

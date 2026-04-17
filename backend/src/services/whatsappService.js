const twilio = require('twilio');
const { query } = require('../config/database');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

  const telefonoWA = `whatsapp:+52${telefono.replace(/\D/g, '')}`;

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

const notificarReciboPago = async (padre, alumno, concepto, monto) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'recibo_pago',
    variables: {
      nombre_padre: padre.nombre_completo.split(' ')[0],
      concepto,
      monto: monto.toFixed(2),
      nombre_alumno: alumno.nombre_completo,
    },
    alumnoId: alumno.id,
  });
};

const notificarBitacoraLista = async (padre, alumno) => {
  return enviarMensaje({
    telefono: padre.telefono_whatsapp || padre.telefono,
    clave: 'bitacora_lista',
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

module.exports = {
  enviarMensaje,
  notificarRetardo,
  notificarReciboPago,
  notificarBitacoraLista,
  notificarIncidente,
};

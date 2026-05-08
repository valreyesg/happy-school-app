-- Migracion 049: Agregar plantillas WhatsApp usadas en codigo pero ausentes en seed
-- salida_anticipada  -> asistencia.js
-- alerta_salud       -> bitacora.js (vomito/alerta)
-- solicitud_toallitas -> insumos.js
-- solicitud_paniales  -> insumos.js

INSERT INTO plantillas_whatsapp (clave, nombre, plantilla) VALUES
  ('salida_anticipada', 'Salida anticipada', 'Hola {{nombre_padre}}, {{nombre_alumno}} salio a las {{hora}} con {{quien_recoge}}. Motivo: {{motivo}}. Happy School'),
  ('alerta_salud', 'Alerta de salud', 'Hola {{nombre_padre}}, {{nombre_alumno}} presento {{tipo_alerta}} en la escuela. Por favor revisa la bitacora en la app. Happy School'),
  ('solicitud_toallitas', 'Solicitud de toallitas', 'Hola {{nombre_padre}}, necesitamos que lleves toallitas para {{nombre_alumno}} manana. El stock esta bajo. Gracias! Happy School'),
  ('solicitud_paniales', 'Solicitud de paniales', 'Hola {{nombre_padre}}, necesitamos que lleves paniales para {{nombre_alumno}} manana. El stock es 0. Gracias! Happy School')
ON CONFLICT (clave) DO NOTHING;

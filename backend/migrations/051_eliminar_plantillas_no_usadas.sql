-- Migración 051: Eliminar plantillas que NO son uno a uno o no tienen disparador activo
-- Se conservan SOLO las 14 plantillas uno a uno con disparador real o en roadmap cercano:
--   sin_recoger, recordatorio_pago, suspension, recargo
--   retardo, no_entrada, fiebre
--   incidente, medicamento, alerta_salud
--   persona_no_autorizada, salida_anticipada
--   sin_comida, pago_comida_lunes

-- Eliminadas (broadcast o sin disparador planificado):
--   aviso_nuevo      -> broadcast: va a todos los padres de grupos seleccionados
--   evento_nuevo     -> broadcast: va a todos al crear evento calendario
--   bitacora_lista   -> sin disparador conectado ni planificado
--   boleta_lista     -> módulo boletas no implementado
--   documentos_pendientes -> sin disparador planificado
--   encuesta_nueva   -> módulo encuestas sin disparador
--   recibo_pago      -> inactiva, sin disparador conectado actualmente
--   solicitud_paniales -> sin disparador conectado
--   solicitud_toallitas -> sin disparador conectado

DELETE FROM plantillas_whatsapp
WHERE clave IN (
  'aviso_nuevo',
  'evento_nuevo',
  'bitacora_lista',
  'boleta_lista',
  'documentos_pendientes',
  'encuesta_nueva',
  'recibo_pago',
  'solicitud_paniales',
  'solicitud_toallitas'
);

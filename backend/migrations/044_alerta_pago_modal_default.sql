-- Migración 044: Agregar alerta_pago como tipo modal por defecto
-- Si la clave no existe, la crea con alerta_pago activo.
-- Si ya existe con valor configurado por la directora, no la toca.

INSERT INTO configuracion_general (clave, valor, descripcion, tipo)
VALUES (
  'notificaciones_modal_tipos',
  '["entrada_rechazada","salida_anticipada","alerta_vomito","alerta_diarrea","solicitud_toallitas","solicitud_paniales","incidente","aviso_extraordinario","alerta_pago"]',
  'Tipos de notificación que aparecen como modal urgente para el padre',
  'json'
)
ON CONFLICT (clave) DO NOTHING;

-- Sesión 63: Configuración de tipos de notificación que disparan modal en portal papá

INSERT INTO configuracion_general (clave, valor, descripcion, tipo)
VALUES (
  'notificaciones_modal_tipos',
  '["incidente","aviso_extraordinario"]',
  'Tipos de notificación que aparecen como modal urgente en el portal del papá',
  'json'
) ON CONFLICT (clave) DO NOTHING;

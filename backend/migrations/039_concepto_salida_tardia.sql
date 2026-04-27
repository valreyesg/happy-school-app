-- 039_concepto_salida_tardia.sql
-- Crear concepto de pago para salidas tardías (alumnos sin extensión)

INSERT INTO conceptos_pago (nombre, descripcion, monto, tipo, es_mensual, es_recurrente, activo)
VALUES (
  'Salida tardía',
  'Cargo por recoger al alumno fuera del horario establecido sin extensión contratada',
  125.00,
  'extension',
  false,
  false,
  true
)
ON CONFLICT DO NOTHING;

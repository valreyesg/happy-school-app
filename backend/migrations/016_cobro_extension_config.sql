-- 016: Agregar configuración de hora de inicio de cobro de extensión
INSERT INTO configuracion_general (clave, valor, descripcion, tipo)
VALUES ('hora_inicio_cobro_extension', '15:06', 'Hora a partir de la cual se cobra extensión de horario', 'texto')
ON CONFLICT (clave) DO NOTHING;

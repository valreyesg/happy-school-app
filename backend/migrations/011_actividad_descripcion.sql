-- Migración 011: Renombrar tarea_realizada → actividad_descripcion
-- Cambio semántico: "Tarea" → "Actividades" con descripción y fotos asociadas

ALTER TABLE bitacora_diaria
RENAME COLUMN tarea_realizada TO actividad_realizada;

ALTER TABLE bitacora_diaria
ADD COLUMN actividad_descripcion TEXT DEFAULT NULL;

COMMENT ON COLUMN bitacora_diaria.actividad_realizada IS 'Indica si el alumno realizó la actividad del día';
COMMENT ON COLUMN bitacora_diaria.actividad_descripcion IS 'Descripción de la actividad realizada por la Miss (ej: pintura, juego libre, etc.)';

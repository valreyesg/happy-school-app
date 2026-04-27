-- Migración 011: Renombrar tarea_realizada → actividad_descripcion
-- Cambio semántico: "Tarea" → "Actividades" con descripción y fotos asociadas

DO $$
BEGIN
  IF EXISTS (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'bitacora_diaria' AND column_name = 'tarea_realizada'
  ) THEN
    ALTER TABLE bitacora_diaria
    RENAME COLUMN tarea_realizada TO actividad_realizada;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'bitacora_diaria' AND column_name = 'actividad_descripcion'
  ) THEN
    ALTER TABLE bitacora_diaria
    ADD COLUMN actividad_descripcion TEXT DEFAULT NULL;
  END IF;
END $$;

COMMENT ON COLUMN bitacora_diaria.actividad_realizada IS 'Indica si el alumno realizó la actividad del día';
COMMENT ON COLUMN bitacora_diaria.actividad_descripcion IS 'Descripción de la actividad realizada por la Miss (ej: pintura, juego libre, etc.)';

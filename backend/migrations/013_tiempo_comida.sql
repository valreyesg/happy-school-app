-- Migración 013: agregar campo tiempo a registro_comida
-- Permite separar Desayuno, Colación, Comida, Comida Extra

ALTER TABLE registro_comida
  ADD COLUMN IF NOT EXISTS tiempo VARCHAR(20) DEFAULT 'comida';

DO $$
BEGIN
  IF EXISTS (
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_alumno_fecha' AND table_name = 'registro_comida'
  ) THEN
    ALTER TABLE registro_comida DROP CONSTRAINT unique_alumno_fecha;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_alumno_fecha_tiempo' AND table_name = 'registro_comida'
  ) THEN
    ALTER TABLE registro_comida
    ADD CONSTRAINT unique_alumno_fecha_tiempo UNIQUE(alumno_id, fecha, tiempo);
  END IF;
END $$;

-- Migrar datos existentes (si los hay sin tiempo, asumen 'comida')
UPDATE registro_comida
SET tiempo = COALESCE(tiempo, 'comida')
WHERE tiempo IS NULL;

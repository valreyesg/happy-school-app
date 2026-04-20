-- Migración 013: agregar campo tiempo a registro_comida
-- Permite separar Desayuno, Colación, Comida, Comida Extra

ALTER TABLE registro_comida
  ADD COLUMN IF NOT EXISTS tiempo VARCHAR(20) DEFAULT 'comida',
  DROP CONSTRAINT IF EXISTS unique_alumno_fecha,
  ADD CONSTRAINT unique_alumno_fecha_tiempo UNIQUE(alumno_id, fecha, tiempo);

-- Migrar datos existentes (si los hay sin tiempo, asumen 'comida')
UPDATE registro_comida
SET tiempo = COALESCE(tiempo, 'comida')
WHERE tiempo IS NULL;

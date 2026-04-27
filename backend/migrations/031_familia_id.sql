-- Migración 031: familia_id para vínculo entre hermanos
-- Dos alumnos con el mismo familia_id son hermanos.
-- No se crea tabla familias separada: familia_id es un UUID compartido.
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS familia_id UUID;
CREATE INDEX IF NOT EXISTS idx_alumnos_familia_id ON alumnos(familia_id)
  WHERE familia_id IS NOT NULL;

-- ── 031: familia_id + comprobante justificante ───────────────────────────────

-- familia_id para vínculo entre hermanos
-- Dos alumnos con el mismo familia_id son hermanos.
-- No se crea tabla familias separada: familia_id es un UUID compartido.
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS familia_id UUID;
CREATE INDEX IF NOT EXISTS idx_alumnos_familia_id ON alumnos(familia_id)
  WHERE familia_id IS NOT NULL;

-- Agregar campos de comprobante a justificantes
ALTER TABLE asistencia
  ADD COLUMN IF NOT EXISTS justificacion_comprobante_url TEXT,
  ADD COLUMN IF NOT EXISTS justificacion_comprobante_public_id TEXT;

COMMENT ON COLUMN asistencia.justificacion_comprobante_url IS 'URL del comprobante (imagen/PDF) subida a Cloudinary';
COMMENT ON COLUMN asistencia.justificacion_comprobante_public_id IS 'Public ID de Cloudinary para referencia de eliminación';

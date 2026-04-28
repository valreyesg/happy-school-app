-- ── Migración 031: Agregar campos de comprobante a justificantes ──

ALTER TABLE asistencia
  ADD COLUMN IF NOT EXISTS justificacion_comprobante_url TEXT,
  ADD COLUMN IF NOT EXISTS justificacion_comprobante_public_id TEXT;

COMMENT ON COLUMN asistencia.justificacion_comprobante_url IS 'URL del comprobante (imagen/PDF) subida a Cloudinary';
COMMENT ON COLUMN asistencia.justificacion_comprobante_public_id IS 'Public ID de Cloudinary para referencia de eliminación';

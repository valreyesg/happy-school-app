-- Migración 045: Comprobante de comida semanal
-- Agrega columnas para registrar método de pago y comprobante (foto transferencia)

ALTER TABLE pago_comida_semanal
  ADD COLUMN IF NOT EXISTS metodo_pago_comida VARCHAR(30) DEFAULT 'efectivo',
  ADD COLUMN IF NOT EXISTS comprobante_url     TEXT,
  ADD COLUMN IF NOT EXISTS notas_comida        TEXT;

COMMENT ON COLUMN pago_comida_semanal.metodo_pago_comida IS 'efectivo | transferencia | efectivo_lunes';
COMMENT ON COLUMN pago_comida_semanal.comprobante_url     IS 'URL foto comprobante de transferencia';
COMMENT ON COLUMN pago_comida_semanal.notas_comida        IS 'Notas adicionales del pago';

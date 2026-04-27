-- 038_salida_anticipada_motivo.sql
-- Agrega soporte de salida anticipada con motivo obligatorio en registro_salida

ALTER TABLE registro_salida
  ADD COLUMN IF NOT EXISTS es_anticipada BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_salida TEXT;

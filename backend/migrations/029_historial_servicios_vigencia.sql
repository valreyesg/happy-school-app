-- Migration 029: Add vigencia (date range) to historial_servicios
-- Allow specifying start/end months for extension service validity
-- Enables auto-generation of monthly charges within the range

ALTER TABLE historial_servicios
  ADD COLUMN IF NOT EXISTS mes_inicio INTEGER CHECK (mes_inicio >= 1 AND mes_inicio <= 12),
  ADD COLUMN IF NOT EXISTS anio_inicio INTEGER,
  ADD COLUMN IF NOT EXISTS mes_fin INTEGER CHECK (mes_fin IS NULL OR (mes_fin >= 1 AND mes_fin <= 12)),
  ADD COLUMN IF NOT EXISTS anio_fin INTEGER,
  ADD COLUMN IF NOT EXISTS ciclo_id UUID REFERENCES ciclos_escolares(id),
  ADD COLUMN IF NOT EXISTS genera_cargos BOOLEAN DEFAULT true;

-- Drop the old mes/anio columns from migration 028 (they are replaced by mes_inicio/anio_inicio/mes_fin/anio_fin)
-- This ALTER will only work if the columns exist; safe with IF EXISTS
ALTER TABLE historial_servicios
  DROP COLUMN IF EXISTS mes,
  DROP COLUMN IF EXISTS anio,
  DROP COLUMN IF EXISTS fecha_efectiva;

-- Migración 036: campo origen en pagos para distinguir cargos automáticos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'manual';
-- Valores posibles: 'manual', 'extension_dia', 'visitante_extension', 'retardo'
-- Índice para facilitar condonaciones masivas por origen
CREATE INDEX IF NOT EXISTS idx_pagos_origen ON pagos(origen) WHERE origen != 'manual';

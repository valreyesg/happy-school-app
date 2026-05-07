-- 046: Flujo comprobante de pago — padre sube, directora valida
-- Agrega estado 'por_confirmar' y columnas de comprobante a tabla pagos

-- Agregar estado 'por_confirmar' al enum
ALTER TYPE estado_pago_tipo ADD VALUE IF NOT EXISTS 'por_confirmar' AFTER 'pendiente';

-- Columnas de comprobante en tabla pagos
ALTER TABLE pagos
  ADD COLUMN IF NOT EXISTS comprobante_url TEXT,
  ADD COLUMN IF NOT EXISTS comprobante_fecha TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comprobante_subido_por UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS confirmado_por UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS confirmado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rechazo_nota TEXT;

COMMENT ON COLUMN pagos.comprobante_url IS 'URL de imagen del comprobante de transferencia (Cloudinary)';
COMMENT ON COLUMN pagos.comprobante_fecha IS 'Fecha en que el padre subió el comprobante';
COMMENT ON COLUMN pagos.comprobante_subido_por IS 'Usuario (padre) que subió el comprobante';
COMMENT ON COLUMN pagos.confirmado_por IS 'Usuario (directora) que aprobó/rechazó el comprobante';
COMMENT ON COLUMN pagos.confirmado_at IS 'Fecha de aprobación/rechazo del comprobante';
COMMENT ON COLUMN pagos.rechazo_nota IS 'Nota de la directora al rechazar el comprobante';

-- Índice parcial para consultas rápidas de comprobantes pendientes
CREATE INDEX IF NOT EXISTS idx_pagos_por_confirmar ON pagos(estado) WHERE estado = 'por_confirmar';

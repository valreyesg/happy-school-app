-- Migration 043: Precios diferenciados por nivel + recargo porcentaje
-- Permite configurar montos distintos por nivel (Maternal, Prekinder, Kinder1-3) para cada concepto de pago

-- Tabla de precios por nivel
CREATE TABLE IF NOT EXISTS precios_nivel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto_id UUID NOT NULL REFERENCES conceptos_pago(id) ON DELETE CASCADE,
  nivel_key VARCHAR(50) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(concepto_id, nivel_key)
);

-- Agregar campo de recargo porcentaje a conceptos_pago
ALTER TABLE conceptos_pago
  ADD COLUMN IF NOT EXISTS recargo_porcentaje DECIMAL(5,2) DEFAULT NULL;

-- Configuración global default para recargo porcentaje
INSERT INTO configuracion_general (clave, valor, descripcion)
VALUES ('recargo_porcentaje_default', '10', 'Porcentaje de recargo por mes vencido (default para nuevos conceptos)')
ON CONFLICT (clave) DO NOTHING;

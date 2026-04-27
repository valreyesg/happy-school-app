-- Migration 028: Create historial_servicios table
-- Track high/low of extension and daycare services by month

CREATE TABLE IF NOT EXISTS historial_servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  tipo_servicio VARCHAR(50) NOT NULL DEFAULT 'extension',  -- 'extension' | 'estancia'
  accion VARCHAR(10) NOT NULL,                              -- 'alta' | 'baja'
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),     -- 1-12
  anio INTEGER NOT NULL,
  fecha_efectiva DATE NOT NULL,
  notas TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure columns exist (for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'historial_servicios' AND column_name = 'mes'
  ) THEN
    ALTER TABLE historial_servicios ADD COLUMN mes INTEGER NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'historial_servicios' AND column_name = 'anio'
  ) THEN
    ALTER TABLE historial_servicios ADD COLUMN anio INTEGER NOT NULL DEFAULT 2024;
  END IF;
END $$;

-- Index for fast queries by alumno and year
CREATE INDEX IF NOT EXISTS idx_historial_servicios_alumno_anio
  ON historial_servicios(alumno_id, anio DESC, mes DESC);

-- Index for directora dashboard queries
CREATE INDEX IF NOT EXISTS idx_historial_servicios_tipo_accion
  ON historial_servicios(tipo_servicio, accion, anio, mes);

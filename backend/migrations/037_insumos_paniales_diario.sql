-- ── 037_insumos_paniales_diario.sql ──────────────────────────────────────────────
-- Rediseño: stock diario de pañales (5 fijos, se resetea cada día según filtro entrada)
-- + solicitudes de toallitas con notificación al papá

-- 1a. Agregar columna trajo_paniales a registro_entrada
ALTER TABLE registro_entrada
  ADD COLUMN IF NOT EXISTS trajo_paniales BOOLEAN DEFAULT false;

-- 1b. Nueva tabla: stock diario de pañales (un registro por alumno por fecha)
CREATE TABLE IF NOT EXISTS insumos_stock_diario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id   UUID NOT NULL REFERENCES alumnos(id),
  fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
  cantidad    INTEGER NOT NULL DEFAULT 5,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alumno_id, fecha)
);

-- 1c. Nueva tabla: solicitudes de toallitas
CREATE TABLE IF NOT EXISTS insumos_solicitudes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id        UUID NOT NULL REFERENCES alumnos(id),
  fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo             VARCHAR(50) NOT NULL DEFAULT 'toallita',
  resuelta         BOOLEAN NOT NULL DEFAULT false,
  resuelta_en_entrada BOOLEAN NOT NULL DEFAULT false,
  registrado_por   UUID REFERENCES usuarios(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1d. Eliminar filas de toallita y papel de insumos_alumno (solo dejar panial)
DELETE FROM insumos_alumno WHERE tipo IN ('toallita', 'papel');

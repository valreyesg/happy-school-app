-- ============================================================
-- MIGRACIÓN 002 — Restricciones UNIQUE adicionales
-- ============================================================

-- CURP único por alumno (solo donde no sea null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_alumnos_curp_unique
  ON alumnos (curp) WHERE curp IS NOT NULL;

-- CURP único en personal (solo donde no sea null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_curp_unique
  ON personal (curp) WHERE curp IS NOT NULL;

-- CURP único en padres (solo donde no sea null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_padres_curp_unique
  ON padres (curp) WHERE curp IS NOT NULL;

-- Grupos únicos por nombre + ciclo
CREATE UNIQUE INDEX IF NOT EXISTS idx_grupos_nombre_ciclo
  ON grupos (nombre, ciclo_id);

-- Conceptos de pago únicos por nombre
CREATE UNIQUE INDEX IF NOT EXISTS idx_conceptos_pago_nombre
  ON conceptos_pago (nombre);

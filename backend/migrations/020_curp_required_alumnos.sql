-- ============================================================
-- MIGRACIÓN 020 — CURP obligatoria para alumnos
-- ============================================================

-- Validación: Asegurar que todo alumno activo tenga CURP
-- (Antes de hacer NOT NULL, verificamos que no queden registros sin CURP)
DO $$
DECLARE
  cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM alumnos
  WHERE curp IS NULL AND deleted_at IS NULL;

  IF cnt > 0 THEN
    RAISE EXCEPTION 'Hay % alumnos activos sin CURP. Resolver antes de aplicar constraint.', cnt;
  END IF;

  RAISE NOTICE 'Validación CURP: OK — Todos los alumnos activos tienen CURP.';
END $$;

-- El índice UNIQUE parcial ya existe en 002_unique_constraints.sql:
-- CREATE UNIQUE INDEX idx_alumnos_curp_unique ON alumnos (curp) WHERE curp IS NOT NULL;

-- Nota: NO agregamos NOT NULL a nivel de columna en esta migración
-- porque podría romper scripts de seed en desarrollo.
-- En su lugar, la validación se hace en el backend (alumnosController.js).

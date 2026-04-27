-- Migration 021: Add turno column to turno_puerta
-- Adds ENTRADA / SALIDA / COMPLETO distinction to door shift assignments
-- This allows the same staff member to be assigned to both entrada and salida on the same day

ALTER TABLE turno_puerta
  ADD COLUMN IF NOT EXISTS turno VARCHAR(10) NOT NULL DEFAULT 'entrada'
  CHECK (turno IN ('entrada', 'salida', 'completo'));

-- Drop the old unique constraint that prevented multiple shifts per person per day
ALTER TABLE turno_puerta
  DROP CONSTRAINT IF EXISTS turno_puerta_fecha_personal_id_key;

-- New unique constraint: one person per turno per day
-- This allows the same person in both entrada AND salida on the same day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE constraint_name = 'turno_puerta_fecha_personal_turno_key' AND table_name = 'turno_puerta'
  ) THEN
    ALTER TABLE turno_puerta
      ADD CONSTRAINT turno_puerta_fecha_personal_turno_key
      UNIQUE (fecha, personal_id, turno);
  END IF;
END $$;

COMMENT ON COLUMN turno_puerta.turno IS 'entrada | salida | completo';

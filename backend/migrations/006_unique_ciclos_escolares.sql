-- Migración 006: UNIQUE constraint en ciclos_escolares(nombre)
-- Previene duplicados como "2025-2026" registrado dos veces

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE constraint_name = 'ciclos_escolares_nombre_unique'
  ) THEN
    ALTER TABLE ciclos_escolares
      ADD CONSTRAINT ciclos_escolares_nombre_unique UNIQUE (nombre);
  END IF;
END $$;

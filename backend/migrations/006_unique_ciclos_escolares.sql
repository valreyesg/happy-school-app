-- Migración 006: UNIQUE constraint en ciclos_escolares(nombre)
-- Previene duplicados como "2025-2026" registrado dos veces

ALTER TABLE ciclos_escolares
  ADD CONSTRAINT ciclos_escolares_nombre_unique UNIQUE (nombre);

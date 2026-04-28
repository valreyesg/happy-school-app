-- Migración 036: campos activo y desactivado_at para soft-delete de tutores
ALTER TABLE alumno_padre ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE alumno_padre ADD COLUMN IF NOT EXISTS desactivado_at TIMESTAMPTZ DEFAULT NULL;

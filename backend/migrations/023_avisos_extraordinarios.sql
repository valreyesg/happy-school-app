-- Migración 023: Soporte para avisos extraordinarios + auditoría de lectura

-- 1. Agregar fecha de lectura a notificaciones (evidencia de cuándo fue leída)
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS leida_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Agregar tipo y grupo_ids a avisos para avisos extraordinarios
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'ordinario';
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS grupo_ids JSONB DEFAULT '[]';
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Comentarios
COMMENT ON COLUMN notificaciones.leida_at IS 'Timestamp exacto cuando el usuario marcó la notificación como leída (evidencia)';
COMMENT ON COLUMN avisos.tipo IS 'ordinario | extraordinario — distingue avisos ordinarios de los enviados por emergencia';
COMMENT ON COLUMN avisos.grupo_ids IS 'Array JSON de grupo IDs destino. Vacio [] = todas las familias.';

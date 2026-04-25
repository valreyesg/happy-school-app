-- Eventos enriquecidos: ubicación y recordatorio configurable
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS ubicacion TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS recordatorio_horas INT;

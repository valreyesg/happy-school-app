-- Sesión 81 — Agregar columna recibido a recepcion_medicamento
-- Distingue "recibido físicamente por la maestra en la puerta" de "administrado al alumno"

ALTER TABLE recepcion_medicamento
  ADD COLUMN IF NOT EXISTS recibido       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recibido_at    TIMESTAMPTZ;

-- Sesión 81 — Tabla toma_medicamento para administración múltiple de dosis
-- El padre entrega UN frasco pero puede administrarse múltiples veces al día (ej 8am y 2pm)

CREATE TABLE IF NOT EXISTS toma_medicamento (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id         UUID NOT NULL REFERENCES recepcion_medicamento(id) ON DELETE CASCADE,
  hora_programada      TIME NOT NULL,
  recordatorio_enviado BOOLEAN NOT NULL DEFAULT false,
  administrado         BOOLEAN NOT NULL DEFAULT false,
  administrado_at      TIMESTAMPTZ,
  administrado_por     UUID REFERENCES personal(id),
  medicamento_id       UUID REFERENCES medicamentos(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_toma_recepcion ON toma_medicamento(recepcion_id);
CREATE INDEX IF NOT EXISTS idx_toma_fecha ON toma_medicamento(hora_programada, administrado);

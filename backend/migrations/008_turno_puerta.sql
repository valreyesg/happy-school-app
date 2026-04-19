CREATE TABLE IF NOT EXISTS turno_puerta (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha         DATE NOT NULL,
  personal_id   UUID NOT NULL REFERENCES personal(id) ON DELETE CASCADE,
  asignado_por  UUID REFERENCES personal(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fecha, personal_id)
);

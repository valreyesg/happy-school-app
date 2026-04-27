-- Migración 035: visitantes (niños externos que vienen un día)
CREATE TABLE IF NOT EXISTS visitantes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               VARCHAR(200) NOT NULL,
  fecha                DATE NOT NULL DEFAULT CURRENT_DATE,
  foto_url             TEXT,
  foto_public_id       TEXT,
  grupo_visitado_id    UUID REFERENCES grupos(id),
  tutor_nombre         VARCHAR(200),
  tutor_telefono       VARCHAR(20),
  hora_entrada         TIMESTAMPTZ,
  hora_salida          TIMESTAMPTZ,
  tiene_extension_dia  BOOLEAN NOT NULL DEFAULT false,
  cobro_extension_id   UUID,
  registrado_por       UUID NOT NULL REFERENCES personal(id),
  notas                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitantes_fecha ON visitantes(fecha);

-- Migración 034: niños de extensión (no son alumnos de la escuela)
CREATE TABLE IF NOT EXISTS ninos_extension (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo VARCHAR(200) NOT NULL,
  fecha_nacimiento DATE,
  foto_url        TEXT,
  foto_public_id  TEXT,
  tutor_nombre    VARCHAR(200) NOT NULL,
  tutor_telefono  VARCHAR(20)  NOT NULL,
  tutor_email     VARCHAR(200),
  modalidad_pago  VARCHAR(20)  NOT NULL DEFAULT 'mensual'
                  CHECK (modalidad_pago IN ('mensual', 'por_dia')),
  -- Código QR propio: formato HAPPYSCHOOL:EXT:<id>
  qr_codigo       TEXT UNIQUE,
  activo          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registro_extension (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nino_id         UUID NOT NULL REFERENCES ninos_extension(id),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada    TIMESTAMPTZ,
  hora_salida     TIMESTAMPTZ,
  registrado_por  UUID REFERENCES personal(id),
  notas           TEXT,
  -- Para modalidad por_dia: genera pago automático
  cobro_generado  BOOLEAN NOT NULL DEFAULT false,
  pago_id         UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_registro_extension_fecha
  ON registro_extension(nino_id, fecha);

CREATE INDEX IF NOT EXISTS idx_registro_extension_fecha_idx
  ON registro_extension(fecha);

-- Concepto de pago por defecto para extensión por día
INSERT INTO conceptos_pago (nombre, descripcion, monto, tipo, es_mensual, es_recurrente, activo)
VALUES ('Extensión por día', 'Cargo automático niño extensión modalidad por_dia', 150.00, 'servicio', false, false, true)
ON CONFLICT DO NOTHING;

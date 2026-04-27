-- ── Sesión 78 — SALUD Y MEDICACIÓN (Bloque completo)
-- ── MIGRACIÓN 030 — Tablas para recepción medicamento, vómito, stock insumos, etc.

-- ── 1. Recepción de medicamento (autorización previa) ─────────────────────
CREATE TABLE IF NOT EXISTS recepcion_medicamento (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id             UUID NOT NULL REFERENCES alumnos(id),
  fecha                 DATE NOT NULL DEFAULT CURRENT_DATE,
  nombre                VARCHAR(150) NOT NULL,
  dosis                 VARCHAR(100) NOT NULL,
  hora_programada       TIME,
  foto_receta_url       TEXT,
  foto_receta_public_id TEXT,
  foto_envase_url       TEXT,
  foto_envase_public_id TEXT,
  recibido_por          UUID REFERENCES personal(id),
  administrado          BOOLEAN NOT NULL DEFAULT false,
  recordatorio_enviado  BOOLEAN NOT NULL DEFAULT false,
  medicamento_id        UUID REFERENCES medicamentos(id),
  notas                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recepcion_med_alumno_fecha ON recepcion_medicamento(alumno_id, fecha);

-- ── 2. Vómito (múltiples episodios por día) ──────────────────────────────
CREATE TABLE IF NOT EXISTS registro_vomito (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id      UUID NOT NULL REFERENCES alumnos(id),
  bitacora_id    UUID REFERENCES bitacora_diaria(id),
  hora           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  intensidad     VARCHAR(20) NOT NULL DEFAULT 'moderado',
  notas          TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_registro_vomito_alumno ON registro_vomito(alumno_id, hora);

-- ── 3. Diarrea en registro_panial ─────────────────────────────────────────
ALTER TABLE registro_panial
  ADD COLUMN IF NOT EXISTS es_diarrea BOOLEAN NOT NULL DEFAULT false;

-- ── 4. Justificantes de inasistencia (ENUM ya tiene 'justificado') ────────
ALTER TABLE asistencia
  ADD COLUMN IF NOT EXISTS justificacion_motivo TEXT,
  ADD COLUMN IF NOT EXISTS justificada_por      UUID REFERENCES personal(id),
  ADD COLUMN IF NOT EXISTS justificada_at       TIMESTAMPTZ;

-- ── 5. Filtro sanitario de SALIDA ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registro_salida_sanitario (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id        UUID NOT NULL REFERENCES alumnos(id),
  fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
  panial_limpio    BOOLEAN,
  pertenencias_ok  BOOLEAN,
  estado_fisico_ok BOOLEAN,
  notas            TEXT,
  entrega_conforme BOOLEAN NOT NULL DEFAULT false,
  registrado_por   UUID REFERENCES usuarios(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alumno_id, fecha)
);

-- ── 6. Stock de insumos (pañales, toallitas, crema) ───────────────────────
CREATE TABLE IF NOT EXISTS insumos_alumno (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id            UUID NOT NULL REFERENCES alumnos(id),
  tipo                 VARCHAR(50) NOT NULL DEFAULT 'panial',
  cantidad_actual      INTEGER NOT NULL DEFAULT 0,
  umbral_alerta        INTEGER NOT NULL DEFAULT 5,
  ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alumno_id, tipo)
);

-- ── 7. Historial de movimientos de insumos ───────────────────────────────
CREATE TABLE IF NOT EXISTS insumos_movimientos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id           UUID NOT NULL REFERENCES alumnos(id),
  tipo                VARCHAR(50) NOT NULL DEFAULT 'panial',
  movimiento          VARCHAR(20) NOT NULL,
  cantidad            INTEGER NOT NULL,
  cantidad_resultante INTEGER NOT NULL,
  motivo              TEXT,
  registrado_por      UUID REFERENCES usuarios(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

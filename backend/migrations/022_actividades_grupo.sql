-- Migración 022: Actividades del grupo y participación por alumno
-- Permite que la maestra capture actividades una vez por grupo+fecha
-- y luego en cada bitácora de alumno marque participación individual

CREATE TABLE actividades_grupo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  orden SMALLINT NOT NULL DEFAULT 1,
  descripcion TEXT NOT NULL,
  foto_url TEXT,
  public_id TEXT,
  creado_por UUID REFERENCES personal(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_act_grupo_fecha ON actividades_grupo(grupo_id, fecha);
CREATE INDEX idx_act_grupo_creador ON actividades_grupo(creado_por);

COMMENT ON TABLE actividades_grupo IS
  'Catálogo de actividades definidas por la maestra para su grupo en un día específico. Se define una sola vez.';
COMMENT ON COLUMN actividades_grupo.orden IS
  'Posición de la actividad en el día, para mostrar en orden correcto';

CREATE TABLE actividades_alumno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actividad_grupo_id UUID NOT NULL REFERENCES actividades_grupo(id) ON DELETE CASCADE,
  bitacora_id UUID NOT NULL REFERENCES bitacora_diaria(id) ON DELETE CASCADE,
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  participo BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(actividad_grupo_id, alumno_id)
);

CREATE INDEX idx_act_alumno_bitacora ON actividades_alumno(bitacora_id);
CREATE INDEX idx_act_alumno_grupo_alumno ON actividades_alumno(actividad_grupo_id, alumno_id);

COMMENT ON TABLE actividades_alumno IS
  'Participación de cada alumno en las actividades del grupo. Un registro por alumno+actividad.';
COMMENT ON COLUMN actividades_alumno.participo IS
  'null = sin registrar, true = participó, false = no participó';

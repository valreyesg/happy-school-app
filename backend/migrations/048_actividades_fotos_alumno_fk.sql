-- 048: Ligar fotos de alumno en actividades a la actividad_grupo específica
ALTER TABLE actividades_fotos ADD COLUMN IF NOT EXISTS actividad_grupo_id UUID REFERENCES actividades_grupo(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_act_fotos_actividad_alumno ON actividades_fotos(actividad_grupo_id, alumno_id);

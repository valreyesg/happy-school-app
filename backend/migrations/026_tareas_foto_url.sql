-- 026_tareas_foto_url.sql
-- Agregar campos faltantes a tareas y tarea_alumno

ALTER TABLE tareas ADD COLUMN IF NOT EXISTS foto_url TEXT;

ALTER TABLE tarea_alumno ADD COLUMN IF NOT EXISTS registrado_en_bitacora BOOLEAN DEFAULT false;

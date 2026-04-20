-- Actualizar Ana García López para que use pañal
UPDATE alumnos
SET usa_panial = true
WHERE nombre_completo = 'Ana García López'
AND deleted_at IS NULL;

-- Un solo titular activo por grupo por ciclo
-- Corregir duplicados si existen: dejar solo el registro más antiguo con es_titular=true
UPDATE asignaciones_grupo ag
SET es_titular = false
WHERE es_titular = true
  AND id NOT IN (
    SELECT DISTINCT ON (grupo_id, ciclo_id) id
    FROM asignaciones_grupo
    WHERE es_titular = true
    ORDER BY grupo_id, ciclo_id, created_at ASC
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_titular_por_grupo
  ON asignaciones_grupo (grupo_id, ciclo_id)
  WHERE es_titular = true;

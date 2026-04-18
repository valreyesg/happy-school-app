-- Eliminar duplicados antes de agregar el constraint
-- Conserva el registro más reciente por (personal_id, grupo_id, ciclo_id)
DELETE FROM asignaciones_grupo
WHERE id NOT IN (
  SELECT DISTINCT ON (personal_id, grupo_id, ciclo_id) id
  FROM asignaciones_grupo
  ORDER BY personal_id, grupo_id, ciclo_id, created_at DESC
);

ALTER TABLE asignaciones_grupo
  ADD CONSTRAINT uq_asignaciones_grupo
  UNIQUE (personal_id, grupo_id, ciclo_id);

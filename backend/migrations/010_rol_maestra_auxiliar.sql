-- Agregar valor al ENUM rol_principal_tipo
ALTER TYPE rol_principal_tipo ADD VALUE IF NOT EXISTS 'maestra_auxiliar';

-- Corregir maestras que tienen es_titular=false pero rol_principal=maestra_titular
-- Son las que están asignadas a un grupo pero NO como titular
UPDATE usuarios u
SET rol_principal = 'maestra_auxiliar'
FROM personal p
JOIN asignaciones_grupo ag ON ag.personal_id = p.id
  AND ag.activo = true
  AND ag.es_titular = false
WHERE p.usuario_id = u.id
  AND u.rol_principal = 'maestra_titular';

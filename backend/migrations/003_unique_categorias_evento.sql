-- Migración 003: UNIQUE constraint en categorias_evento.nombre
-- Bug fix sesión 6: el seed podía insertar categorías duplicadas
-- porque no había restricción única en el nombre.

-- Eliminar duplicados conservando el registro más antiguo de cada nombre
DELETE FROM categorias_evento
WHERE id NOT IN (
  SELECT DISTINCT ON (nombre) id
  FROM categorias_evento
  ORDER BY nombre, created_at ASC
);

-- Agregar restricción UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE constraint_name = 'categorias_evento_nombre_unique'
  ) THEN
    ALTER TABLE categorias_evento
      ADD CONSTRAINT categorias_evento_nombre_unique UNIQUE (nombre);
  END IF;
END $$;

-- Agregar campo trajo_toallitas en registro_entrada
-- Se marca true cuando el padre entrega las toallitas en el filtro de entrada

ALTER TABLE registro_entrada
  ADD COLUMN IF NOT EXISTS trajo_toallitas BOOLEAN NOT NULL DEFAULT false;

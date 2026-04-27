-- Fix: registrado_por en visitantes debe referenciar usuarios(id), no personal(id)
-- ninos_extension no tiene columna registrado_por, se omite
ALTER TABLE visitantes
  DROP CONSTRAINT IF EXISTS visitantes_registrado_por_fkey,
  ADD CONSTRAINT visitantes_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES usuarios(id);

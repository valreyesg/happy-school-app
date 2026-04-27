-- Fix: registrado_por en ninos_extension y visitantes debe referenciar usuarios(id), no personal(id)
ALTER TABLE ninos_extension
  DROP CONSTRAINT IF EXISTS ninos_extension_registrado_por_fkey,
  ALTER COLUMN registrado_por DROP NOT NULL;

ALTER TABLE visitantes
  DROP CONSTRAINT IF EXISTS visitantes_registrado_por_fkey,
  ADD CONSTRAINT visitantes_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES usuarios(id);

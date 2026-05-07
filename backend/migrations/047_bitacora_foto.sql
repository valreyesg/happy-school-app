-- 047: Agregar foto del día a bitácora (upload Cloudinary)
ALTER TABLE bitacora_diaria ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE bitacora_diaria ADD COLUMN IF NOT EXISTS foto_public_id TEXT;

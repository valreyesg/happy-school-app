-- Migración 007: campo genero en personal para saludos dinámicos
ALTER TABLE personal ADD COLUMN IF NOT EXISTS genero VARCHAR(10) DEFAULT 'f';
-- valores esperados: 'f' (femenino) | 'm' (masculino) | 'o' (otro)

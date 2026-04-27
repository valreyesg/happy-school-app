-- Migración 015: Tabla menu_comida_semanal
-- Menú de comida semanal creado por Directora/Admin

CREATE TABLE IF NOT EXISTS menu_comida_semanal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semana_inicio DATE NOT NULL,
  contenido_texto TEXT,
  archivo_menu_url TEXT,
  archivo_menu_public_id TEXT,
  publicado BOOLEAN DEFAULT false,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(semana_inicio)
);

CREATE INDEX IF NOT EXISTS idx_menu_comida_semana ON menu_comida_semanal(semana_inicio);
CREATE INDEX IF NOT EXISTS idx_menu_comida_publicado ON menu_comida_semanal(publicado);

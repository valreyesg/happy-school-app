-- ── 041_catalogos_administrables.sql ─────────────────────────────────────────
-- Catálogos dinámicos administrables desde el panel de la directora.
-- REGLA DE ORO: Nada se elimina físicamente. Los registros se inactivan
-- (activo=false + inactivado_at) para preservar el historial completo.

-- ── 1. Tabla principal de catálogos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogos (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          VARCHAR(60)  NOT NULL,
  key           VARCHAR(100) NOT NULL,
  label         VARCHAR(200) NOT NULL,
  emoji         VARCHAR(10),
  color         VARCHAR(20),
  orden         INTEGER      NOT NULL DEFAULT 0,
  activo        BOOLEAN      NOT NULL DEFAULT true,
  es_sistema    BOOLEAN      NOT NULL DEFAULT false,  -- no eliminable
  editable_key  BOOLEAN      NOT NULL DEFAULT true,   -- false = clave técnica inmutable
  inactivado_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tipo, key)
);

CREATE INDEX IF NOT EXISTS idx_catalogos_tipo_activo
  ON catalogos (tipo, activo, orden);

-- ── 2. Historial de cambios de configuración_general ────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_historial (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clave        TEXT        NOT NULL,
  valor_antes  TEXT,
  valor_nuevo  TEXT        NOT NULL,
  cambiado_por UUID        REFERENCES usuarios(id),
  cambiado_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cfg_historial_clave
  ON configuracion_historial (clave, cambiado_at DESC);

-- ── 3. Datos iniciales: catálogos completamente administrables ───────────────

-- Estado de ánimo
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('animo', 'feliz',     'Feliz',     '😊', 1, false, true),
  ('animo', 'activo',    'Activo',    '⚡', 2, false, true),
  ('animo', 'cansado',   'Cansado',   '😴', 3, false, true),
  ('animo', 'triste',    'Triste',    '😢', 4, false, true),
  ('animo', 'irritable', 'Irritable', '😤', 5, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Cuánto comió
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('cuanto-comio', 'todo',      'Todo',      '😋', 1, false, true),
  ('cuanto-comio', 'casi_todo', 'Casi todo', '😊', 2, false, true),
  ('cuanto-comio', 'poco',      'Poco',      '😐', 3, false, true),
  ('cuanto-comio', 'no_comio',  'No comió',  '❌', 4, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Condiciones de pañal
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('condiciones-panial', 'limpio',  'Limpio',  '✅', 1, false, true),
  ('condiciones-panial', 'orina',   'Pipí',    '💧', 2, false, true),
  ('condiciones-panial', 'heces',   'Popó',    '💩', 3, false, true),
  ('condiciones-panial', 'mixto',   'Mixto',   '🔄', 4, false, true),
  ('condiciones-panial', 'diarrea', 'Diarrea', '⚠️', 5, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Tipos de insumo
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('tipos-insumo', 'panial',    'Pañal',     '👶', 1, false, true),
  ('tipos-insumo', 'toallitas', 'Toallitas', '🧻', 2, false, true),
  ('tipos-insumo', 'crema',     'Crema',     '🧴', 3, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Vómito intensidad
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('vomito-intensidad', 'leve',     'Leve',     '🤢', 1, false, true),
  ('vomito-intensidad', 'moderado', 'Moderado', '🤮', 2, false, true),
  ('vomito-intensidad', 'fuerte',   'Fuerte',   '🚨', 3, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Tiempos de comida
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('tiempos-comida', 'desayuno',     'Desayuno',     '🥐', 1, false, true),
  ('tiempos-comida', 'colacion',     'Colación',     '🍎', 2, false, true),
  ('tiempos-comida', 'comida',       'Comida',       '🍽️', 3, false, true),
  ('tiempos-comida', 'comida_extra', 'Comida Extra', '🍜', 4, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Niveles educativos
INSERT INTO catalogos (tipo, key, label, orden, es_sistema, editable_key) VALUES
  ('niveles', 'maternal',  'Maternal',  1, false, true),
  ('niveles', 'prekinder', 'Prekinder', 2, false, true),
  ('niveles', 'kinder1',   'Kinder 1',  3, false, true),
  ('niveles', 'kinder2',   'Kinder 2',  4, false, true),
  ('niveles', 'kinder3',   'Kinder 3',  5, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Tipos de documento
INSERT INTO catalogos (tipo, key, label, orden, es_sistema, editable_key) VALUES
  ('tipos-documento', 'acta_nacimiento',     'Acta de nacimiento',       1, false, true),
  ('tipos-documento', 'curp',                'CURP',                     2, false, true),
  ('tipos-documento', 'cartilla_vacunacion', 'Cartilla de vacunación',   3, false, true),
  ('tipos-documento', 'comprobante_dom',     'Comprobante de domicilio', 4, false, true),
  ('tipos-documento', 'foto_escolar',        'Fotografía 3×4',           5, false, true),
  ('tipos-documento', 'ine_tutor',           'INE del tutor',            6, false, true),
  ('tipos-documento', 'contrato',            'Contrato firmado',         7, false, true),
  ('tipos-documento', 'otro',                'Otro',                     8, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Métodos de pago
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('metodos-pago', 'efectivo',      'Efectivo',      '💵', 1, false, true),
  ('metodos-pago', 'transferencia', 'Transferencia', '📱', 2, false, true),
  ('metodos-pago', 'tarjeta',       'Tarjeta',       '💳', 3, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- Conceptos de pago
INSERT INTO catalogos (tipo, key, label, orden, es_sistema, editable_key) VALUES
  ('conceptos-pago', 'colegiatura', 'Colegiatura', 1, false, true),
  ('conceptos-pago', 'material',    'Material',    2, false, true),
  ('conceptos-pago', 'comida',      'Comida',      3, false, true),
  ('conceptos-pago', 'extension',   'Extensión',   4, false, true),
  ('conceptos-pago', 'evento',      'Evento',      5, false, true),
  ('conceptos-pago', 'otro',        'Otro',        6, false, true)
ON CONFLICT (tipo, key) DO NOTHING;

-- ── 4. Datos iniciales: catálogos DE SISTEMA (es_sistema=true, editable_key=false) ──
-- La clave técnica está ligada a ENUMs de BD o lógica de authorize().
-- La directora solo puede cambiar label y emoji, NO la clave ni eliminarlos.

-- Comportamiento / conducta (ENUM nivel_comportamiento_tipo en BD)
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('comportamiento', 'muy_bien',         'Muy bien',  '⭐', 1, true, false),
  ('comportamiento', 'bien',             'Bien',      '👍', 2, true, false),
  ('comportamiento', 'necesita_mejorar', 'A mejorar', '⚠️', 3, true, false)
ON CONFLICT (tipo, key) DO NOTHING;

-- Roles del personal (ENUM rol_principal_tipo en BD + lógica authorize())
INSERT INTO catalogos (tipo, key, label, orden, es_sistema, editable_key) VALUES
  ('roles-personal', 'directora',        'Directora',       1, true, false),
  ('roles-personal', 'administrativo',   'Administrativo',  2, true, false),
  ('roles-personal', 'maestra_titular',  'Miss titular',    3, true, false),
  ('roles-personal', 'maestra_auxiliar', 'Miss auxiliar',   4, true, false),
  ('roles-personal', 'maestra_especial', 'Miss especial',   5, true, false),
  ('roles-personal', 'maestra_puerta',   'Miss de puerta',  6, true, false)
ON CONFLICT (tipo, key) DO NOTHING;

-- Estados del alumno (ENUM estado_alumno_tipo en BD)
INSERT INTO catalogos (tipo, key, label, orden, es_sistema, editable_key) VALUES
  ('estados-alumno', 'inscrito',   'Inscrito',   1, true, false),
  ('estados-alumno', 'reinscrito', 'Reinscrito', 2, true, false),
  ('estados-alumno', 'baja',       'Baja',       3, true, false),
  ('estados-alumno', 'egresado',   'Egresado',   4, true, false)
ON CONFLICT (tipo, key) DO NOTHING;

-- Checklist de entrada (columnas fijas en registro_entrada — no se pueden agregar/quitar)
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('checklist-entrada', 'unas_cortadas',  'Uñas cortadas',       '✂️', 1, true, false),
  ('checklist-entrada', 'sin_laganas',    'Sin lagañas',         '👁️', 2, true, false),
  ('checklist-entrada', 'sin_fiebre',     'Sin fiebre',          '🌡️', 3, true, false),
  ('checklist-entrada', 'sin_sintomas',   'Sin síntomas',        '😷', 4, true, false),
  ('checklist-entrada', 'panial_limpio',  'Pañal limpio',        '👶', 5, true, false),
  ('checklist-entrada', 'trae_uniforme',  'Trae uniforme',       '👕', 6, true, false),
  ('checklist-entrada', 'trae_bata',      'Trae bata',           '🥼', 7, true, false),
  ('checklist-entrada', 'trae_termo',     'Trae termo',          '🫙', 8, true, false),
  ('checklist-entrada', 'agua_suficiente','Agua suficiente',     '💧', 9, true, false)
ON CONFLICT (tipo, key) DO NOTHING;

-- Checklist de salida sanitaria (columnas fijas en registro_salida_sanitario)
INSERT INTO catalogos (tipo, key, label, emoji, orden, es_sistema, editable_key) VALUES
  ('checklist-salida', 'panial_limpio',   'Pañal limpio',          '👶', 1, true, false),
  ('checklist-salida', 'pertenencias_ok', 'Pertenencias completas','🎒', 2, true, false),
  ('checklist-salida', 'estado_fisico_ok','Estado físico normal',  '💚', 3, true, false),
  ('checklist-salida', 'entrega_conforme','Entrega conforme',      '✅', 4, true, false)
ON CONFLICT (tipo, key) DO NOTHING;

-- ── 5. Nuevas claves en configuracion_general ────────────────────────────────
-- ON CONFLICT DO NOTHING: si ya existen (por migraciones anteriores), se respetan.

INSERT INTO configuracion_general (clave, valor, descripcion) VALUES
  ('precio_comida_semana',    '250',
   'Precio del servicio de comida — semana completa (L-V) en pesos'),
  ('precio_comida_dia',       '50',
   'Precio del servicio de comida — por día en pesos'),
  ('semaforo_dias_amarillo',  '1',
   'Días de atraso en pagos para semáforo amarillo (Atención)'),
  ('semaforo_dias_rojo',      '30',
   'Días de atraso en pagos para semáforo rojo (Vencido)'),
  ('semaforo_dias_suspendido','60',
   'Días de atraso en pagos para semáforo gris (Suspendido)'),
  ('docs_requeridos_alumno',
   '["acta_nacimiento","curp","cartilla_vacunacion","foto_escolar"]',
   'Claves de documentos obligatorios para considerar expediente completo (JSON array)'),
  ('max_tutores_por_alumno',  '2',
   'Máximo de tutores activos permitidos por alumno'),
  ('max_morosos_dashboard',   '10',
   'Máximo de alumnos morosos que se muestran en el dashboard'),
  ('dia_registro_comida',     '0',
   'Día de la semana habilitado para confirmar comida (0=Domingo, 1=Lunes…)')
ON CONFLICT (clave) DO NOTHING;

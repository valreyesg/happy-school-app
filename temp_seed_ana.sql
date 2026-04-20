-- Bitácora para Ana García López - 2026-04-17
SELECT a.id as alumno_id, g.id as grupo_id, p.id as maestra_id
FROM alumnos a
LEFT JOIN grupos g ON a.grupo_id = g.id
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
LIMIT 1;

-- Si Ana existe, insertar datos
INSERT INTO bitacora_diaria (
  alumno_id, fecha, maestra_id,
  estado_animo, actividad_realizada, actividad_descripcion,
  comportamiento, comportamiento_notas,
  tuvo_fiebre, se_enfermo, notas
)
SELECT
  a.id, '2026-04-17'::date, p.id,
  'feliz'::text, true, 'Pintura con acuarelas y juego libre en la sala',
  'muy_bien'::nivel_comportamiento_tipo, 'Ana fue muy participativa hoy',
  false, false, 'Ana estuvo feliz toda la jornada'
FROM alumnos a
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT (alumno_id, fecha) DO UPDATE SET
  estado_animo = 'feliz', actividad_realizada = true,
  actividad_descripcion = 'Pintura con acuarelas y juego libre en la sala',
  comportamiento = 'muy_bien'::nivel_comportamiento_tipo,
  comportamiento_notas = 'Ana fue muy participativa hoy',
  notas = 'Ana estuvo feliz toda la jornada',
  updated_at = NOW();

-- Insertar comida
INSERT INTO registro_comida (
  alumno_id, fecha,
  que_comio, cuanto_comio, observaciones
)
SELECT a.id, '2026-04-17'::date,
  'Arroz con pollo y verduras', 'casi_todo'::text, 'Comió bien, le gustó mucho'
FROM alumnos a
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT (alumno_id, fecha) DO UPDATE SET
  que_comio = 'Arroz con pollo y verduras',
  cuanto_comio = 'casi_todo'::text,
  observaciones = 'Comió bien, le gustó mucho',
  updated_at = NOW();

-- Insertar registros de pañal
INSERT INTO registro_panial (
  alumno_id, hora, condicion, tiene_irritacion, notas, registrado_por
)
SELECT a.id, '2026-04-17 08:30:00+00'::timestamptz, 'orina'::text, false, 'Normal', p.id
FROM alumnos a
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO registro_panial (
  alumno_id, hora, condicion, tiene_irritacion, notas, registrado_por
)
SELECT a.id, '2026-04-17 10:45:00+00'::timestamptz, 'heces'::text, false, 'Normal', p.id
FROM alumnos a
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO registro_panial (
  alumno_id, hora, condicion, tiene_irritacion, notas, registrado_por
)
SELECT a.id, '2026-04-17 12:00:00+00'::timestamptz, 'orina'::text, false, 'Normal', p.id
FROM alumnos a
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Insertar fotos de actividades
INSERT INTO actividades_fotos (
  alumno_id, grupo_id, fecha,
  foto_url, descripcion, es_grupal, subido_por
)
SELECT a.id, a.grupo_id, '2026-04-17'::date,
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=300&h=300&fit=crop',
  'Pintura con acuarelas', false, p.id
FROM alumnos a
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO actividades_fotos (
  alumno_id, grupo_id, fecha,
  foto_url, descripcion, es_grupal, subido_por
)
SELECT a.id, a.grupo_id, '2026-04-17'::date,
  'https://images.unsplash.com/photo-1503454537688-e47a4e773545?w=300&h=300&fit=crop',
  'Juego libre con bloques', false, p.id
FROM alumnos a
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO actividades_fotos (
  alumno_id, grupo_id, fecha,
  foto_url, descripcion, es_grupal, subido_por
)
SELECT a.id, a.grupo_id, '2026-04-17'::date,
  'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=300&h=300&fit=crop',
  'Momento de descanso', false, p.id
FROM alumnos a
LEFT JOIN personal p ON p.nombre_completo LIKE '%Maternal%'
WHERE a.nombre_completo = 'Ana García López' AND a.deleted_at IS NULL
ON CONFLICT DO NOTHING;

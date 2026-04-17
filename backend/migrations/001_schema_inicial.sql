-- ============================================================
-- Happy School App — Esquema inicial de base de datos
-- Migración 001
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- búsqueda por similitud de texto

-- ============================================================
-- TIPOS ENUM
-- ============================================================

CREATE TYPE rol_principal_tipo AS ENUM (
  'directora', 'administrativo', 'maestra_titular',
  'maestra_especial', 'maestra_puerta', 'padre'
);

CREATE TYPE estado_alumno_tipo AS ENUM (
  'inscrito', 'reinscrito', 'baja', 'egresado', 'prospecto'
);

CREATE TYPE estado_pago_tipo AS ENUM (
  'pendiente', 'pagado', 'vencido', 'cancelado'
);

CREATE TYPE estado_asistencia_tipo AS ENUM (
  'presente', 'ausente', 'retardo', 'justificado', 'no_entrada'
);

CREATE TYPE nivel_comportamiento_tipo AS ENUM (
  'muy_bien', 'bien', 'necesita_mejorar'
);

CREATE TYPE nivel_logro_tipo AS ENUM (
  'logrado', 'en_proceso', 'por_lograr'
);

-- ============================================================
-- TABLA BASE: CICLOS ESCOLARES
-- ============================================================

CREATE TABLE ciclos_escolares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(50) NOT NULL, -- ej: "2025-2026"
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GRUPOS
-- ============================================================

CREATE TABLE grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL, -- ej: "Kinder 1A"
  nivel VARCHAR(50) NOT NULL, -- Maternal, Prekinder, Kinder 1, Kinder 2, Kinder 3
  nivel_codigo VARCHAR(20) NOT NULL, -- maternal, prekinder, kinder1, kinder2, kinder3
  ciclo_id UUID REFERENCES ciclos_escolares(id),
  cupo_maximo INTEGER DEFAULT 20,
  activo BOOLEAN DEFAULT true,
  color_hex VARCHAR(7) DEFAULT '#805AD5', -- color visual en la app
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- USUARIOS (Personal + Padres)
-- ============================================================

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  rol_principal rol_principal_tipo NOT NULL,
  foto_url TEXT,
  foto_public_id TEXT, -- Cloudinary public_id
  activo BOOLEAN DEFAULT true,
  primer_login BOOLEAN DEFAULT true, -- obliga cambio de contraseña
  ultimo_acceso TIMESTAMPTZ,
  fcm_token TEXT, -- Firebase Cloud Messaging token para push notifications
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_principal);

-- ============================================================
-- ROLES ADICIONALES (una persona puede tener múltiples roles)
-- ============================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  permisos JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles_usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id UUID NOT NULL REFERENCES roles(id),
  contexto_grupo_id UUID REFERENCES grupos(id), -- null = todos los grupos
  activo BOOLEAN DEFAULT true,
  fecha_inicio DATE,
  fecha_fin DATE, -- para asignaciones temporales (ej: maestra de puerta del día)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, rol_id, contexto_grupo_id)
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  usado BOOLEAN DEFAULT false,
  expira_en TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);

-- ============================================================
-- PERSONAL (maestra, directora, admin)
-- ============================================================

CREATE TABLE personal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE REFERENCES usuarios(id),
  nombre_completo VARCHAR(200) NOT NULL,
  curp VARCHAR(18),
  rfc VARCHAR(13),
  foto_url TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  fecha_ingreso DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asignación de maestras a grupos
CREATE TABLE asignaciones_grupo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL REFERENCES personal(id),
  grupo_id UUID NOT NULL REFERENCES grupos(id),
  ciclo_id UUID NOT NULL REFERENCES ciclos_escolares(id),
  es_titular BOOLEAN DEFAULT false,
  materia VARCHAR(100), -- null = titular, "Inglés", "Música", etc.
  dias_semana INTEGER[], -- [1,2,3,4,5] lunes=1, viernes=5
  horario_inicio TIME,
  horario_fin TIME,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asignación de maestra de puerta (diaria)
CREATE TABLE asignacion_puerta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL REFERENCES personal(id),
  fecha DATE NOT NULL,
  turno VARCHAR(20) DEFAULT 'completo', -- entrada, salida, completo
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fecha, turno)
);

-- ============================================================
-- ALUMNOS
-- ============================================================

CREATE TABLE alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo VARCHAR(200) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  curp VARCHAR(18),
  foto_url TEXT,
  foto_public_id TEXT,
  grupo_id UUID REFERENCES grupos(id),
  ciclo_id UUID REFERENCES ciclos_escolares(id),
  estado estado_alumno_tipo DEFAULT 'inscrito',
  usa_panial BOOLEAN DEFAULT false, -- true para Maternal
  alergias TEXT,
  condiciones_especiales TEXT,
  tipo_sangre VARCHAR(5),
  medico_nombre VARCHAR(200),
  medico_telefono VARCHAR(20),
  qr_code_url TEXT, -- URL del QR generado en Cloudinary
  qr_code_data TEXT, -- dato codificado en el QR
  fecha_inscripcion DATE DEFAULT CURRENT_DATE,
  fecha_baja DATE,
  motivo_baja TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_alumnos_grupo ON alumnos(grupo_id);
CREATE INDEX idx_alumnos_estado ON alumnos(estado);
CREATE INDEX idx_alumnos_nombre ON alumnos USING gin(nombre_completo gin_trgm_ops);

-- ============================================================
-- PADRES / TUTORES
-- ============================================================

CREATE TABLE padres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE REFERENCES usuarios(id),
  nombre_completo VARCHAR(200) NOT NULL,
  parentesco VARCHAR(50) DEFAULT 'padre/madre', -- padre, madre, tutor, abuelo, etc.
  telefono VARCHAR(20) NOT NULL,
  telefono_whatsapp VARCHAR(20), -- puede ser diferente
  email VARCHAR(255),
  foto_url TEXT,
  curp VARCHAR(18),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación padres-alumnos (un alumno puede tener múltiples tutores)
CREATE TABLE alumno_padre (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  padre_id UUID NOT NULL REFERENCES padres(id) ON DELETE CASCADE,
  es_tutor_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, padre_id)
);

-- ============================================================
-- DOCUMENTOS
-- ============================================================

CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidad_tipo VARCHAR(50) NOT NULL, -- 'alumno', 'padre', 'personal'
  entidad_id UUID NOT NULL,
  tipo VARCHAR(100) NOT NULL, -- 'acta_nacimiento', 'curp', 'ine_frente', etc.
  nombre_archivo VARCHAR(255),
  url TEXT NOT NULL,
  public_id TEXT, -- Cloudinary
  subido_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documentos_entidad ON documentos(entidad_tipo, entidad_id);

-- ============================================================
-- PERSONAS AUTORIZADAS PARA RECOGER
-- ============================================================

CREATE TABLE personas_autorizadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(200) NOT NULL,
  parentesco VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  foto_url TEXT NOT NULL, -- obligatoria
  foto_public_id TEXT,
  ine_frente_url TEXT NOT NULL, -- obligatoria
  ine_reverso_url TEXT NOT NULL, -- obligatoria
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blacklist: personas que NO pueden recoger
CREATE TABLE blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  foto_url TEXT,
  motivo TEXT, -- campo privado, solo directora
  activo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTROL DE ENTRADA / SALIDA
-- ============================================================

CREATE TABLE registro_entrada (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada TIMESTAMPTZ,
  es_retardo BOOLEAN DEFAULT false,
  numero_retardo_mes INTEGER DEFAULT 0,
  -- Filtro de entrada (checklist)
  uñas_cortadas BOOLEAN,
  sin_lagañas BOOLEAN,
  sin_fiebre BOOLEAN,
  temperatura DECIMAL(4,1),
  sin_sintomas BOOLEAN,
  sintomas_notas TEXT,
  panial_limpio BOOLEAN, -- solo Maternal
  trae_uniforme BOOLEAN,
  trae_bata BOOLEAN,
  trae_termo BOOLEAN,
  agua_suficiente BOOLEAN,
  puede_entrar BOOLEAN DEFAULT true,
  motivo_no_entrada TEXT,
  -- Registro QR
  qr_escaneado BOOLEAN DEFAULT false,
  registrado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, fecha)
);

CREATE INDEX idx_entrada_alumno_fecha ON registro_entrada(alumno_id, fecha);
CREATE INDEX idx_entrada_fecha ON registro_entrada(fecha);

CREATE TABLE registro_salida (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_salida TIMESTAMPTZ NOT NULL,
  recogido_por_tipo VARCHAR(50), -- 'padre', 'persona_autorizada'
  padre_id UUID REFERENCES padres(id),
  persona_autorizada_id UUID REFERENCES personas_autorizadas(id),
  nombre_quien_recoge VARCHAR(200),
  foto_quien_recoge_url TEXT, -- captura del momento
  autorizado BOOLEAN DEFAULT true,
  alerta_generada BOOLEAN DEFAULT false, -- si intentó recoger alguien no autorizado
  es_extension BOOLEAN DEFAULT false, -- si es en horario de extensión
  minutos_tarde INTEGER DEFAULT 0, -- minutos después del horario programado
  cobro_extension DECIMAL(10,2) DEFAULT 0,
  qr_escaneado BOOLEAN DEFAULT false,
  registrado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salida_alumno_fecha ON registro_salida(alumno_id, fecha);

-- ============================================================
-- ASISTENCIA (vista consolidada)
-- ============================================================

CREATE TABLE asistencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  grupo_id UUID REFERENCES grupos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado estado_asistencia_tipo DEFAULT 'ausente',
  justificacion TEXT,
  entrada_id UUID REFERENCES registro_entrada(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, fecha)
);

CREATE INDEX idx_asistencia_alumno ON asistencia(alumno_id, fecha);
CREATE INDEX idx_asistencia_grupo_fecha ON asistencia(grupo_id, fecha);

-- ============================================================
-- BITÁCORA DIARIA
-- ============================================================

CREATE TABLE bitacora_diaria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  maestra_id UUID REFERENCES personal(id),
  -- Tarea y comportamiento
  tarea_realizada BOOLEAN,
  comportamiento nivel_comportamiento_tipo,
  comportamiento_notas TEXT,
  -- Estado de ánimo
  estado_animo VARCHAR(20), -- 'feliz', 'triste', 'cansado', 'inquieto', 'energico'
  -- Salud
  tuvo_fiebre BOOLEAN DEFAULT false,
  temperatura_dia DECIMAL(4,1),
  se_enfermo BOOLEAN DEFAULT false,
  descripcion_enfermedad TEXT,
  -- Notas generales
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, fecha)
);

CREATE INDEX idx_bitacora_alumno_fecha ON bitacora_diaria(alumno_id, fecha);

-- Registro de baño
CREATE TABLE registro_banio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  bitacora_id UUID REFERENCES bitacora_diaria(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  pipi_count INTEGER DEFAULT 0,
  popo_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, fecha)
);

-- Registro de pañal (solo Maternal)
CREATE TABLE registro_panial (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  bitacora_id UUID REFERENCES bitacora_diaria(id),
  hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  condicion VARCHAR(50), -- 'limpio', 'orina', 'heces', 'mixto'
  tiene_irritacion BOOLEAN DEFAULT false,
  notas TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_panial_alumno_fecha ON registro_panial(alumno_id, hora);

-- Control de esfínteres (Prekinder y Kinder 1)
CREATE TABLE control_esfinteres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  bitacora_id UUID REFERENCES bitacora_diaria(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  fue_solo BOOLEAN,
  pidio_ir BOOLEAN,
  tuvo_accidente BOOLEAN,
  descripcion_accidente TEXT,
  necesito_ayuda BOOLEAN,
  notas_progreso TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, fecha)
);

-- Registro de alimentación
CREATE TABLE registro_comida (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  bitacora_id UUID REFERENCES bitacora_diaria(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  que_comio TEXT,
  cuanto_comio VARCHAR(20), -- 'nada', 'poco', 'mitad', 'todo'
  foto_antes_url TEXT,
  foto_despues_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, fecha)
);

-- Fotos de actividades del día
CREATE TABLE actividades_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID REFERENCES alumnos(id), -- null = grupal
  grupo_id UUID REFERENCES grupos(id),
  bitacora_id UUID REFERENCES bitacora_diaria(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  foto_url TEXT NOT NULL,
  public_id TEXT,
  descripcion TEXT,
  es_grupal BOOLEAN DEFAULT false,
  subido_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEDICAMENTOS
-- ============================================================

CREATE TABLE medicamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  nombre VARCHAR(200) NOT NULL,
  dosis VARCHAR(100) NOT NULL,
  hora_administracion TIMESTAMPTZ NOT NULL,
  administrado_por UUID REFERENCES personal(id),
  foto_medicamento_url TEXT,
  notas TEXT,
  notificacion_enviada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medicamentos_alumno ON medicamentos(alumno_id, fecha);

-- ============================================================
-- INCIDENTES Y ACCIDENTES
-- ============================================================

CREATE TABLE incidentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descripcion TEXT NOT NULL,
  acciones_tomadas TEXT,
  fotos_urls TEXT[], -- array de URLs
  notificacion_enviada BOOLEAN DEFAULT false,
  firma_padre_url TEXT, -- firma digital del padre de enterado
  firma_fecha TIMESTAMPTZ,
  reportado_por UUID REFERENCES personal(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidentes_alumno ON incidentes(alumno_id);

-- ============================================================
-- PAGOS
-- ============================================================

CREATE TABLE conceptos_pago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'colegiatura', 'material', 'comida', 'extension', 'evento', 'otro'
  es_mensual BOOLEAN DEFAULT false,
  es_recurrente BOOLEAN DEFAULT false,
  dia_pago INTEGER, -- día del mes para pago (ej: 1 para colegiatura)
  dia_recargo INTEGER, -- día del mes a partir del cual hay recargo
  monto_recargo_dia DECIMAL(10,2) DEFAULT 0, -- recargo por día
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  concepto_id UUID NOT NULL REFERENCES conceptos_pago(id),
  monto_base DECIMAL(10,2) NOT NULL,
  monto_recargo DECIMAL(10,2) DEFAULT 0,
  monto_total DECIMAL(10,2) NOT NULL,
  estado estado_pago_tipo DEFAULT 'pendiente',
  mes_correspondiente INTEGER, -- 1-12
  anio_correspondiente INTEGER,
  fecha_limite DATE,
  fecha_pago TIMESTAMPTZ,
  metodo_pago VARCHAR(50), -- 'efectivo', 'transferencia', 'tarjeta'
  referencia VARCHAR(200),
  notas TEXT,
  recibo_url TEXT, -- PDF del recibo en Cloudinary
  recibo_enviado_whatsapp BOOLEAN DEFAULT false,
  dias_atraso INTEGER DEFAULT 0,
  registrado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_mes ON pagos(mes_correspondiente, anio_correspondiente);

-- Control de pago de comida semanal
CREATE TABLE pago_comida_semanal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  semana_inicio DATE NOT NULL, -- lunes de la semana
  estado estado_pago_tipo DEFAULT 'pendiente',
  monto DECIMAL(10,2),
  fecha_pago TIMESTAMPTZ,
  servicio_activo BOOLEAN DEFAULT true, -- false si no pagó
  recordatorio_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, semana_inicio)
);

-- ============================================================
-- CONFIGURACIÓN DE HORARIOS Y EXTENSIÓN
-- ============================================================

CREATE TABLE config_horario_alumno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  ciclo_id UUID REFERENCES ciclos_escolares(id),
  hora_entrada TIME DEFAULT '07:00',
  hora_salida TIME DEFAULT '15:00', -- horario normal
  tiene_extension BOOLEAN DEFAULT false,
  hora_salida_extension TIME DEFAULT '18:00', -- si tiene extensión
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, ciclo_id)
);

-- ============================================================
-- CALENDARIO Y EVENTOS
-- ============================================================

CREATE TABLE categorias_evento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#805AD5',
  icono VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria_id UUID REFERENCES categorias_evento(id),
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  es_todo_el_dia BOOLEAN DEFAULT false,
  grupo_id UUID REFERENCES grupos(id), -- null = toda la escuela
  google_calendar_event_id TEXT,
  publicado BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eventos_fecha ON eventos(fecha_inicio);

-- Temario mensual
CREATE TABLE temario_mensual (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID NOT NULL REFERENCES grupos(id),
  mes INTEGER NOT NULL, -- 1-12
  anio INTEGER NOT NULL,
  tema_mes TEXT,
  cuentos_semanas TEXT[],
  materia_arte TEXT,
  estado_region TEXT,
  actividad_huerto TEXT,
  notas TEXT,
  pdf_url TEXT,
  publicado BOOLEAN DEFAULT false,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grupo_id, mes, anio)
);

-- Menú semanal
CREATE TABLE menu_semanal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semana_inicio DATE NOT NULL, -- lunes de la semana
  menu_data JSONB NOT NULL, -- {lunes: {desayuno: "", comida: ""}, martes: {...}, ...}
  publicado BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(semana_inicio)
);

-- Lista de útiles
CREATE TABLE lista_utiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID NOT NULL REFERENCES grupos(id),
  ciclo_id UUID REFERENCES ciclos_escolares(id),
  titulo VARCHAR(200) NOT NULL,
  items JSONB NOT NULL, -- [{nombre: "", cantidad: "", opcional: false}]
  publicado BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seguimiento de útiles por padre
CREATE TABLE lista_utiles_progreso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lista_id UUID REFERENCES lista_utiles(id),
  padre_id UUID REFERENCES padres(id),
  alumno_id UUID REFERENCES alumnos(id),
  items_comprados JSONB DEFAULT '[]', -- array de índices comprados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lista_id, alumno_id)
);

-- ============================================================
-- TAREAS Y ACTIVIDADES
-- ============================================================

CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID NOT NULL REFERENCES grupos(id),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_limite DATE,
  publicada BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  creada_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tarea_alumno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID REFERENCES tareas(id),
  alumno_id UUID REFERENCES alumnos(id),
  completada BOOLEAN DEFAULT false,
  fecha_completada TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tarea_id, alumno_id)
);

-- ============================================================
-- EVALUACIONES Y BOLETAS
-- ============================================================

CREATE TABLE indicadores_evaluacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nivel_codigo VARCHAR(20) NOT NULL, -- maternal, prekinder, kinder1, etc.
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  materia VARCHAR(100),
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE periodos_evaluacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ciclo_id UUID REFERENCES ciclos_escolares(id),
  nombre VARCHAR(100) NOT NULL, -- "Primer Bimestre", "Mensual - Septiembre", etc.
  fecha_inicio DATE,
  fecha_fin DATE,
  tipo VARCHAR(30) DEFAULT 'bimestral', -- mensual, bimestral, trimestral, semestral
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evaluaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  periodo_id UUID NOT NULL REFERENCES periodos_evaluacion(id),
  indicador_id UUID NOT NULL REFERENCES indicadores_evaluacion(id),
  nivel_logro nivel_logro_tipo,
  calificacion DECIMAL(4,1), -- para Kinder 1-3
  observaciones TEXT,
  capturado_por UUID REFERENCES personal(id),
  autorizado_por UUID REFERENCES personal(id),
  autorizado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, periodo_id, indicador_id)
);

CREATE TABLE boletas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  periodo_id UUID NOT NULL REFERENCES periodos_evaluacion(id),
  pdf_url TEXT,
  publicada BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  generada_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, periodo_id)
);

-- ============================================================
-- GALERÍA
-- ============================================================

CREATE TABLE albumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  grupo_id UUID REFERENCES grupos(id), -- null = toda la escuela
  fecha_evento DATE,
  es_privado BOOLEAN DEFAULT false, -- true = solo esa familia
  alumno_id UUID REFERENCES alumnos(id), -- si es privado
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE galeria_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES albumes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT,
  thumbnail_url TEXT,
  es_video BOOLEAN DEFAULT false,
  subido_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT Y MENSAJES
-- ============================================================

CREATE TABLE conversaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(30) NOT NULL, -- 'grupo', 'individual'
  grupo_id UUID REFERENCES grupos(id), -- para chat de grupo
  nombre VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversacion_participantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  ultimo_leido TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversacion_id, usuario_id)
);

CREATE TABLE mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  remitente_id UUID NOT NULL REFERENCES usuarios(id),
  contenido TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto', -- texto, imagen, archivo
  archivo_url TEXT,
  leido_por JSONB DEFAULT '[]', -- array de usuario_ids que lo leyeron
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id, created_at);

-- ============================================================
-- ENCUESTAS Y VOTACIONES
-- ============================================================

CREATE TABLE encuestas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  opciones JSONB NOT NULL, -- [{id: 1, texto: "Sí"}, {id: 2, texto: "No"}]
  grupo_id UUID REFERENCES grupos(id), -- null = toda la escuela
  fecha_cierre TIMESTAMPTZ,
  publicada BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  creada_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE respuestas_encuesta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  encuesta_id UUID REFERENCES encuestas(id),
  padre_id UUID REFERENCES padres(id),
  opcion_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(encuesta_id, padre_id)
);

-- ============================================================
-- AVISOS Y COMUNICADOS
-- ============================================================

CREATE TABLE avisos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  grupo_id UUID REFERENCES grupos(id), -- null = toda la escuela
  publicado BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE aviso_confirmaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aviso_id UUID REFERENCES avisos(id),
  padre_id UUID REFERENCES padres(id),
  confirmado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aviso_id, padre_id)
);

-- ============================================================
-- NOTIFICACIONES PUSH Y WHATSAPP
-- ============================================================

CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  titulo VARCHAR(200) NOT NULL,
  cuerpo TEXT NOT NULL,
  tipo VARCHAR(50), -- 'pago', 'bitacora', 'incidente', 'aviso', etc.
  datos_extra JSONB DEFAULT '{}',
  leida BOOLEAN DEFAULT false,
  enviada_push BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida);

CREATE TABLE log_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefono VARCHAR(20) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50),
  estado VARCHAR(30) DEFAULT 'enviado', -- enviado, fallido, pendiente
  twilio_sid TEXT,
  alumno_id UUID REFERENCES alumnos(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plantillas de mensajes WhatsApp (editables desde el panel)
CREATE TABLE plantillas_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(100) UNIQUE NOT NULL, -- 'recordatorio_pago', 'bitacora_lista', etc.
  nombre VARCHAR(200) NOT NULL,
  plantilla TEXT NOT NULL, -- con variables {{nombre}}, {{monto}}, etc.
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONFIGURACIÓN GENERAL (administrable desde panel)
-- ============================================================

CREATE TABLE configuracion_general (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) DEFAULT 'texto', -- texto, numero, booleano, json
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTES MENSUALES
-- ============================================================

CREATE TABLE reportes_mensuales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  resumen JSONB NOT NULL, -- {asistencia: {...}, comportamiento: {...}, ...}
  pdf_url TEXT,
  publicado BOOLEAN DEFAULT false,
  notificacion_enviada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, mes, anio)
);

-- ============================================================
-- INSCRIPCIONES Y REINSCRIPCIONES
-- ============================================================

CREATE TABLE inscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id),
  ciclo_id UUID NOT NULL REFERENCES ciclos_escolares(id),
  tipo VARCHAR(20) NOT NULL, -- 'inscripcion', 'reinscripcion'
  grupo_id UUID REFERENCES grupos(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  pago_inscripcion_id UUID REFERENCES pagos(id),
  documentacion_completa BOOLEAN DEFAULT false,
  notas TEXT,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Roles base del sistema
INSERT INTO roles (nombre, descripcion) VALUES
  ('directora', 'Acceso total al sistema'),
  ('administrativo', 'Acceso a módulo financiero completo'),
  ('maestra_titular', 'Acceso a su grupo asignado'),
  ('maestra_especial', 'Acceso a grupos y días asignados'),
  ('maestra_puerta', 'Acceso a entrada/salida del día asignado'),
  ('padre', 'Acceso a información de sus hijos');

-- Configuraciones iniciales
INSERT INTO configuracion_general (clave, valor, descripcion, tipo) VALUES
  ('hora_inicio_filtro', '07:00', 'Hora de inicio del filtro de entrada', 'texto'),
  ('hora_fin_filtro', '08:30', 'Hora límite sin retardo', 'texto'),
  ('max_retardos_mes', '3', 'Máximo de retardos permitidos por mes', 'numero'),
  ('hora_salida_normal', '15:00', 'Hora de salida normal', 'texto'),
  ('hora_salida_extension', '18:00', 'Hora máxima con extensión', 'texto'),
  ('costo_extension_hora', '125', 'Costo por hora o fracción de extensión', 'numero'),
  ('alerta_minutos_sin_recoger', '5', 'Minutos de retraso para alerta a padres', 'numero'),
  ('dia_inicio_pago', '1', 'Día del mes inicio período de pago', 'numero'),
  ('dia_fin_pago', '5', 'Día del mes fin período de pago sin recargo', 'numero'),
  ('nombre_escuela', 'Happy School', 'Nombre de la escuela', 'texto'),
  ('slogan_escuela', 'Comunidad Infantil', 'Slogan de la escuela', 'texto'),
  ('whatsapp_activo', 'true', 'Activar envío de WhatsApp', 'booleano'),
  ('push_activo', 'true', 'Activar notificaciones push', 'booleano');

-- Categorías de eventos base
INSERT INTO categorias_evento (nombre, color_hex, icono) VALUES
  ('Homenaje', '#E53E3E', '🇲🇽'),
  ('Suspensión', '#718096', '📅'),
  ('Visita de papás', '#805AD5', '👨‍👩‍👧'),
  ('Festival', '#D69E2E', '🎉'),
  ('Educación física', '#38A169', '⚽'),
  ('Arte', '#ED8936', '🎨'),
  ('Huerto', '#68D391', '🌱'),
  ('Excursión', '#4299E1', '🚌'),
  ('Reunión', '#9F7AEA', '📋');

-- Plantillas de mensajes WhatsApp
INSERT INTO plantillas_whatsapp (clave, nombre, plantilla) VALUES
  ('retardo', 'Notificación de retardo', 'Hola {{nombre_padre}} 👋, te informamos que {{nombre_alumno}} llegó con retardo hoy a las {{hora}}. Este es su retardo número {{numero_retardo}} del mes. El límite es 3 retardos. — Happy School 🏫'),
  ('no_entrada', 'Alumno no puede entrar', 'Hola {{nombre_padre}}, lamentablemente {{nombre_alumno}} no puede ingresar hoy por: {{motivo}}. Por favor comunícate con nosotros. — Happy School 🏫'),
  ('fiebre', 'Alerta de fiebre en filtro', '🌡️ Hola {{nombre_padre}}, {{nombre_alumno}} presentó temperatura de {{temperatura}}°C en el filtro de entrada. No podrá ingresar hoy. Por favor comunícate a la brevedad. — Happy School'),
  ('recordatorio_pago', 'Recordatorio de pago', 'Hola {{nombre_padre}} 👋, te recordamos que el {{dia}} vence el período de pago sin recargo de la colegiatura de {{nombre_alumno}} por ${{monto}}. — Happy School'),
  ('recargo', 'Aviso de recargo', '⚠️ Hola {{nombre_padre}}, la colegiatura de {{nombre_alumno}} tiene un recargo de ${{monto_recargo}} por {{dias_atraso}} días de atraso. Total a pagar: ${{total}}. — Happy School'),
  ('recibo_pago', 'Recibo de pago', '✅ Hola {{nombre_padre}}, confirmamos el pago de {{concepto}} por ${{monto}} para {{nombre_alumno}}. Tu recibo está disponible en la app. — Happy School 🏫'),
  ('pago_comida_lunes', 'Recordatorio comida semanal', '🍱 Hola {{nombre_padre}}, recuerda que hoy es lunes y el pago del servicio de comida para esta semana es de ${{monto}}. Sin pago hoy, no habrá servicio mañana. — Happy School'),
  ('sin_comida', 'Alumno sin servicio de comida', '🍽️ Hola {{nombre_padre}}, te informamos que {{nombre_alumno}} no tendrá servicio de comida hoy ya que el pago semanal está pendiente. — Happy School'),
  ('bitacora_lista', 'Bitácora disponible', '📋 ¡Hola {{nombre_padre}}! La bitácora del día de {{nombre_alumno}} ya está disponible en la app Happy School. ¡Revísala! 🌟'),
  ('evento_nuevo', 'Nuevo evento en calendario', '📅 ¡Nuevo evento en Happy School! {{titulo}} — {{fecha}}. {{descripcion}} Revisa el calendario en la app. 🏫'),
  ('boleta_lista', 'Boleta disponible', '📊 ¡Hola {{nombre_padre}}! La boleta de {{nombre_alumno}} del {{periodo}} ya está disponible en la app Happy School. 🌟'),
  ('incidente', 'Incidente o accidente', '⚠️ Hola {{nombre_padre}}, necesitamos informarte sobre un incidente con {{nombre_alumno}} hoy. Por favor revisa la app o comunícate con nosotros de inmediato. — Happy School'),
  ('medicamento', 'Medicamento administrado', '💊 Hola {{nombre_padre}}, te informamos que se administró {{medicamento}} ({{dosis}}) a {{nombre_alumno}} a las {{hora}}. — Happy School'),
  ('sin_recoger', 'Alumno sin recoger', '⏰ Hola {{nombre_padre}}, son las {{hora}} y {{nombre_alumno}} aún no ha sido recogido. Su horario de salida es {{hora_salida}}. Por favor comunícate. — Happy School'),
  ('persona_no_autorizada', 'Persona no autorizada', '🚨 ALERTA: Una persona no autorizada intentó recoger a {{nombre_alumno}}. El alumno está seguro en la escuela. Comunícate INMEDIATAMENTE. — Happy School'),
  ('documentos_pendientes', 'Documentos pendientes', '📄 Hola {{nombre_padre}}, recuerda que faltan documentos de {{nombre_alumno}}: {{documentos_faltantes}}. Por favor entrégalos a la brevedad. — Happy School'),
  ('encuesta_nueva', 'Nueva encuesta', '📊 ¡Hola {{nombre_padre}}! Tenemos una encuesta para ti: "{{titulo}}". Respóndela desde la app Happy School. ¡Tu opinión importa! 🌟'),
  ('aviso_nuevo', 'Nuevo aviso', '📢 Nuevo comunicado de Happy School: {{titulo}}. Revísalo en la app y confirma tu lectura. — Happy School 🏫'),
  ('suspension', 'Notificación de suspensión de servicio', '⛔ Hola {{nombre_padre}}, lamentablemente el servicio de {{nombre_alumno}} está suspendido por falta de pago. Por favor regulariza tu situación. — Happy School');

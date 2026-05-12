# ARCHITECTURE.md — Happy School App
## Referencia Técnica Completa para Mantenimiento y Desarrollo

> **Última actualización:** 2026-05-12 — Sesión XX+80
>
> **Propósito:** Documento único para que cualquier programador o IA pueda entender, mantener y extender esta aplicación sin romper lo que funciona. Lee este archivo COMPLETO antes de tocar cualquier código.

---

## ÍNDICE

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Directorios](#3-estructura-de-directorios)
4. [Backend — Arquitectura](#4-backend--arquitectura)
5. [Base de Datos — Schema Completo](#5-base-de-datos--schema-completo)
6. [Backend — Rutas y Endpoints](#6-backend--rutas-y-endpoints)
7. [Backend — Jobs Automáticos (Cron)](#7-backend--jobs-automáticos-cron)
8. [Backend — Servicios Externos](#8-backend--servicios-externos)
9. [Web Frontend — Arquitectura](#9-web-frontend--arquitectura)
10. [Web Frontend — Páginas por Rol](#10-web-frontend--páginas-por-rol)
11. [Mobile App — Arquitectura](#11-mobile-app--arquitectura)
12. [Mobile App — Pantallas por Rol](#12-mobile-app--pantallas-por-rol)
13. [Mapa de Paridad Web ↔ Mobile](#13-mapa-de-paridad-web--mobile)
14. [Autenticación y Autorización](#14-autenticación-y-autorización)
15. [Reglas de Negocio Críticas](#15-reglas-de-negocio-críticas)
16. [Manejo de Fechas y Zona Horaria](#16-manejo-de-fechas-y-zona-horaria)
17. [Sistema de Notificaciones](#17-sistema-de-notificaciones)
18. [Bugs Históricos — NUNCA REPETIR](#18-bugs-históricos--nunca-repetir)
19. [Variables de Entorno](#19-variables-de-entorno)
20. [Cómo Levantar el Proyecto (Dev)](#20-cómo-levantar-el-proyecto-dev)
21. [Patrones de Código Usados](#21-patrones-de-código-usados)

---

## 1. Visión General del Sistema

Happy School App es un sistema de gestión para kinder (jardín de niños) con 4 portales distintos:

| Portal | Plataforma | Rol | Función principal |
|--------|-----------|-----|-------------------|
| Directora | Web | `directora` | Administración completa: alumnos, pagos, personal, config |
| Maestra | Web + Mobile | `maestra_titular`, `maestra_especial`, `maestra_puerta` | Filtro entrada/salida, bitácora diaria, asistencia |
| Padre | Web + Mobile | `padre` | Ver bitácora hijo, pagos, QR de entrada, calendario |
| Administrativo | Web | `administrativo` | Finanzas y reportes |

**Flujo diario típico:**
1. Padre llega con hijo → muestra QR en app mobile
2. Maestra en puerta escanea QR (mobile) o busca alumno (web)
3. Se registra entrada con checklist de salud/higiene
4. Durante el día: maestra llena bitácora (alimentación, conducta, salud, pañal)
5. A la salida: maestra registra salida y quién recoge
6. Padre ve todo en tiempo real desde su app

---

## 2. Stack Tecnológico

### Backend
| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | ≥18 |
| Framework | Express | 4.x |
| Base de datos | PostgreSQL | 14+ |
| Driver BD | pg (node-postgres) | — |
| Auth | JWT (jsonwebtoken) | — |
| Cron jobs | node-cron | — |
| Archivos | Cloudinary | v2 |
| WhatsApp | Twilio API | — |
| Push | Expo Push API | — |
| Validación | express-validator | — |
| Seguridad | helmet, cors, express-rate-limit | — |
| Compresión | compression | — |
| Logging | morgan | — |

### Web Frontend
| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React | 18.2.0 |
| Build tool | Vite | 5.0.12 |
| Router | React Router DOM | 6.22.0 |
| Estado global | Zustand (+ persist) | 4.5.0 |
| Data fetching | TanStack Query (React Query) | v5.17.0 |
| HTTP client | Axios | 1.6.5 |
| Forms | React Hook Form | 7.50.0 |
| CSS | TailwindCSS | 3.4.1 |
| Notificaciones UI | react-hot-toast | 2.4.1 |
| Iconos | lucide-react | 0.323.0 |
| Animaciones | framer-motion | 11.0.0 |
| QR scanner | html5-qrcode | 2.3.8 |
| Excel export | xlsx | 0.18.5 |
| Fechas | date-fns + date-fns-tz | 3.x |
| Gráficas | recharts | 2.10.4 |
| Firma digital | (canvas custom) | — |

### Mobile App
| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React Native | 0.81.5 |
| Plataforma | Expo SDK | 54.0.34 |
| Router | Expo Router (file-based) | — |
| Estado global | Zustand (+ SecureStore) | 4.5.0 |
| Data fetching | TanStack Query | v5.17.0 |
| HTTP client | Axios | 1.6.5 |
| Auth storage | expo-secure-store | 15.0.8 |
| Push | expo-notifications | 0.32.17 |
| Cámara/QR | expo-barcode-scanner + expo-camera | — |
| Imágenes | expo-image-picker | — |
| QR generación | react-native-qrcode-svg | 6.2.0 |
| Animaciones | react-native-reanimated | 4.1.1 |
| Gradientes | expo-linear-gradient | — |
| Toast | react-native-toast-message | 2.3.3 |

---

## 3. Estructura de Directorios

```
APP-KINDER/
├── backend/
│   └── src/
│       ├── index.js              ← Entry point, inicia server + cron jobs
│       ├── app.js                ← Express app, middleware stack, routes
│       ├── config/
│       │   └── database.js       ← Pool PostgreSQL, timezone México, helpers query/getClient
│       ├── middleware/
│       │   ├── auth.js           ← authenticate() + authorize()
│       │   ├── validateRequest.js← express-validator helper
│       │   └── errorHandler.js   ← Error catcher global
│       ├── routes/
│       │   ├── index.js          ← Monta todos los routers en /api/
│       │   ├── auth.js           ← Login, refresh, logout, cambiar-password
│       │   ├── alumnos.js        ← CRUD alumnos, padres, hermanos, QR, docs
│       │   ├── asistencia.js     ← Entrada, salida, filtros, justificar
│       │   ├── pagos.js          ← Conceptos, pagos, comida, recibos, Excel
│       │   ├── bitacora.js       ← Logs diarios, medicamentos, pañal, incidentes
│       │   ├── comida.js         ← Menú semanal, confirmaciones, pagos comida
│       │   ├── grupos.js         ← CRUD grupos, asignación maestras, estadísticas
│       │   ├── personal.js       ← CRUD personal, asignaciones, turno puerta
│       │   ├── ciclos.js         ← Ciclos escolares, promoción, egresados
│       │   ├── calendario.js     ← Eventos, categorías, export PDF
│       │   ├── tareas.js         ← Tareas por grupo, entregas, alertas
│       │   ├── evaluaciones.js   ← Evaluaciones por periodo, boletas
│       │   ├── reportes.js       ← Reportes asistencia/comportamiento
│       │   ├── config.js         ← Configuración general (directora only)
│       │   ├── catalogos.js      ← Catálogos dinámicos (estados_animo, etc.)
│       │   ├── notificaciones.js ← CRUD notificaciones, push token, urgentes
│       │   ├── plantillas.js     ← Plantillas WhatsApp editables
│       │   ├── insumos.js        ← Pañales, inventario diario
│       │   ├── ninos_extension.js← Alumnos con horario extendido
│       │   ├── visitantes.js     ← Log de visitantes
│       │   ├── galeria.js        ← Álbumes y fotos
│       │   ├── turnos-puerta.js  ← Turnos de puerta por día
│       │   └── padres.js         ← CRUD tutores independiente
│       ├── jobs/
│       │   ├── comidaJobs.js     ← recordatorioComida (L 7am) + procesarComidaNoPagada (L 8:31am)
│       │   ├── cargosMensualesJob.js ← Día 1, 00:05am — genera cargos mensuales
│       │   ├── medicamentosJobs.js   ← Cada 5 min, 7-16h — alerta medicamentos
│       │   └── sinRecogerJob.js  ← Cada minuto, 14-19h — alerta sin recoger
│       └── services/
│           ├── cloudinaryService.js  ← Upload/delete archivos Cloudinary
│           ├── whatsappService.js    ← Envío WA via Twilio + plantillas
│           ├── qrService.js          ← Genera QR PNG → sube a Cloudinary
│           └── pushService.js        ← Expo Push API (sin Firebase directo)
│
├── web/
│   └── src/
│       ├── main.jsx              ← Entry point React
│       ├── App.jsx               ← Router, rutas protegidas, guards
│       ├── store/
│       │   ├── authStore.js      ← Zustand: token, usuario, login/logout, persist localStorage
│       │   └── appConfigStore.js ← WhatsApp activo flag
│       ├── services/
│       │   ├── api.js            ← Axios instance, interceptores JWT refresh
│       │   └── queryClient.js    ← TanStack Query config global
│       ├── layouts/
│       │   ├── AppShell.jsx      ← Sidebar + header compartido (todos los roles)
│       │   ├── DirectoraLayout.jsx
│       │   ├── MaestraLayout.jsx
│       │   ├── PadreLayout.jsx
│       │   └── AdministrativoLayout.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── SplashPage.jsx
│       │   ├── Perfil.jsx
│       │   ├── directora/        ← 21 páginas (Dashboard, Alumnos, Pagos, etc.)
│       │   ├── maestra/          ← 7 páginas (Dashboard, FiltroEntrada, FiltroSalida, etc.)
│       │   ├── padre/            ← 5 páginas (Dashboard, Bitácora, Pagos, etc.)
│       │   └── admin/            ← 5 páginas (Dashboard, Pagos, etc.)
│       ├── components/
│       │   ├── ui/               ← AvatarAlumno, Modal, Semaforo, SignaturePad, etc.
│       │   ├── NotificationBell.jsx
│       │   ├── NotificacionModal.jsx
│       │   └── directora/        ← BannerComidaHoy, CatalogoEditor, PlantillasWhatsApp
│       ├── hooks/
│       │   └── useCatalogo.js    ← Fetch y cache de catálogos dinámicos
│       └── utils/
│           ├── asistencia.js     ← esCumpleanos(), ESTADO_ASISTENCIA constants
│           ├── catalogos.js      ← toMap(), ROL_COLOR
│           ├── fecha.js          ← saludoHora(), MESES, ultimoDiaHabil()
│           ├── googleCalendar.js ← buildGoogleCalendarUrl()
│           └── pagos.js          ← Cálculo recargos, semáforo
│
└── mobile/
    ├── app/
    │   ├── _layout.jsx           ← Root: QueryClient + push handler + Stack routes
    │   ├── index.jsx             ← Splash/auth guard → redirige por rol
    │   ├── login.jsx             ← Formulario login
    │   ├── (maestra)/
    │   │   ├── _layout.jsx       ← Tabs: Inicio, Asistencia, Bitácora, Tareas, QR
    │   │   ├── index.jsx         ← Dashboard maestra
    │   │   ├── asistencia.jsx    ← Lista asistencia + modal registro manual
    │   │   ├── bitacora.jsx      ← Log diario con fotos (81KB, complejo)
    │   │   ├── tareas.jsx        ← Gestión tareas grupo
    │   │   ├── qr-scanner.jsx    ← Scanner QR + ChecklistEntrada + ConfirmacionSalida
    │   │   └── galeria.jsx       ← Galería fotos (tab oculto)
    │   └── (padre)/
    │       ├── _layout.jsx       ← Tabs: Inicio, Bitácora, Comida, Pagos, Calendario
    │       ├── index.jsx         ← Dashboard padre (48KB, complejo)
    │       ├── bitacora.jsx      ← Bitácora hijo (solo lectura)
    │       ├── comida.jsx        ← Confirmación servicio comida
    │       ├── pagos.jsx         ← Estado pagos + subir comprobante
    │       ├── calendario.jsx    ← Eventos escolares
    │       ├── qr.jsx            ← QR permanente + QR temporal (tab oculto)
    │       └── galeria.jsx       ← Galería fotos (tab oculto)
    └── src/
        ├── store/
        │   └── authStore.js      ← Zustand: token, usuario, login/logout, persist SecureStore
        ├── services/
        │   └── api.js            ← Axios instance, interceptores JWT refresh
        ├── components/
        │   ├── Button.jsx
        │   ├── NotificationBell.jsx
        │   ├── NotificacionModalUrgente.jsx
        │   ├── SelectorFecha.jsx
        │   └── BitacoraHelpers.jsx
        ├── hooks/
        │   └── useCatalogo.js    ← Igual que web, misma API
        ├── constants/
        │   ├── theme.js          ← COLORS, RADIUS, SCREEN_BG
        │   ├── catalogos.js      ← Fallbacks hardcoded (animo, comportamiento, etc.)
        │   └── asistencia.js     ← ESTADO_CONFIG (colores, iconos, labels)
        └── utils/
            ├── fecha.js          ← saludoHora(), ultimoDiaHabil()
            └── googleCalendar.js ← buildGoogleCalendarUrl()
```

---

## 4. Backend — Arquitectura

### Entry Point (`src/index.js`)
1. Carga `.env`
2. Inicializa los 4 jobs cron
3. Inicia Express en puerto `process.env.PORT || 3000`

### Middleware Stack (`src/app.js`) — en orden
```
helmet()                  → Headers de seguridad
compression()             → GZIP
morgan()                  → Logging HTTP
cors()                    → Orígenes permitidos (ver env WEB_URL, MOBILE_URL)
express-rate-limit()      → 300 req / 15 min
express.json(limit:10mb)
express.urlencoded()
Cache-Control headers     → no-store en /api/ (evita HTTP 304)
/uploads → static files   → archivos locales (dev)
/api/*   → routes/index.js
GET /health               → {"status":"ok","app":"Happy School API","version":"1.0.0"}
errorHandler              → Último middleware
```

### Pool de Base de Datos (`src/config/database.js`)
- Max 20 conexiones, idle timeout 30s, connection timeout 2s
- **Timezone de cliente:** `SET TIME ZONE 'America/Mexico_City'` al conectar
- Logs de queries lentas (>100ms) en development
- Exports: `query(text, params)`, `getClient()`, `pool`

### Middleware de Auth (`src/middleware/auth.js`)

**`authenticate(req, res, next)`**
- Lee `Authorization: Bearer <token>`
- Verifica con `JWT_SECRET`
- Query: `SELECT id, nombre, email, rol_principal, activo FROM usuarios WHERE id=$1 AND activo=true`
- Pone `req.user` con datos del usuario
- Error codes: `TOKEN_EXPIRED` (para refresh automático), genérico 401 para otros

**`authorize(...rolesPermitidos)(req, res, next)`**
- Directora siempre tiene acceso completo
- Query adicional: `SELECT rol FROM roles_usuario WHERE usuario_id=$1`
- Verifica `rol_principal` + roles adicionales
- Pone `req.user.roles` array
- Retorna 403 si no autorizado

---

## 5. Base de Datos — Schema Completo

### Identidad y Auth
```sql
usuarios          (id, nombre, email UNIQUE, password_hash, rol_principal, fcm_token, foto_url, foto_public_id, activo, primer_login, deleted_at, created_at)
roles             (id, nombre)  -- directora, administrativo, maestra_titular, maestra_especial, maestra_puerta, padre
roles_usuario     (id, usuario_id FK, rol, grupo_id)  -- roles adicionales
refresh_tokens    (id, usuario_id FK, token_hash, expires_at, revocado)
```

**⚠️ IMPORTANTE:** `usuarios` usa UNIQUE index PARCIAL en email:
```sql
CREATE UNIQUE INDEX usuarios_email_active ON usuarios(email) WHERE deleted_at IS NULL
```
Esto permite soft-delete y re-registro con el mismo email.

### Personal y Organización
```sql
personal          (id, usuario_id FK UNIQUE, nombre, curp UNIQUE, rfc, puesto, activo BOOLEAN)
                  -- ⚠️ usa activo, NO deleted_at
asignaciones_grupo (id, personal_id FK, grupo_id FK, ciclo_id FK, es_titular BOOLEAN)
asignacion_puerta  (id, personal_id FK, fecha DATE, turno ENUM(entrada/salida/completo), activo)
                   -- UNIQUE (fecha, turno)
```

### Alumnos y Familia
```sql
alumnos           (id, nombre_completo, fecha_nacimiento, nivel, nivel_codigo, grupo_id FK, ciclo_id FK,
                   usa_panial BOOLEAN, tiene_extension BOOLEAN, foto_url, foto_public_id,
                   qr_code_url, qr_code_data, familia_id UUID,  -- familia_id vincula hermanos
                   activo BOOLEAN, deleted_at, created_at)

alumno_padre      (id, alumno_id FK, padre_id FK, es_tutor_principal BOOLEAN, parentesco, activo)
                  -- max 2 por alumno

padres            (id, usuario_id FK UNIQUE, nombre, parentesco, telefono_whatsapp, email,
                   foto_url, foto_public_id, activo)

personas_autorizadas (id, alumno_id FK, nombre, parentesco, telefono,
                      foto_url, ine_frente_url, ine_reverso_url, activo)
                     -- max 2 por alumno, requiere 3 fotos

blacklist         (id, alumno_id FK, nombre, motivo_privado, activo)
```

**Hermanos:** Alumnos con el mismo `familia_id` UUID son hermanos. También se detectan por tutor principal compartido.

### Asistencia y Registro de Entrada/Salida
```sql
registro_entrada  (id, alumno_id FK, fecha DATE,
                   hora TIME, es_retardo BOOLEAN, numero_retardo_mes INT,
                   temperatura DECIMAL, puede_entrar BOOLEAN, motivo_no_entrada TEXT,
                   -- checklist salud
                   sin_fiebre BOOLEAN, sin_sintomas BOOLEAN, descripcion_sintomas TEXT,
                   -- checklist higiene
                   unas_cortadas BOOLEAN, sin_laganas BOOLEAN, panial_limpio BOOLEAN,
                   -- checklist materiales
                   trae_uniforme BOOLEAN, trae_bata BOOLEAN, trae_termo BOOLEAN, agua_suficiente BOOLEAN,
                   -- insumos
                   trajo_paniales BOOLEAN, cantidad_paniales INT,
                   qr_escaneado BOOLEAN, registrado_por FK)
                  -- UNIQUE (alumno_id, fecha)

registro_salida   (id, alumno_id FK, fecha DATE, hora TIME,
                   padre_id FK, persona_autorizada_id FK, otro_nombre TEXT,
                   autorizado BOOLEAN, alerta_generada BOOLEAN,
                   es_extension BOOLEAN, minutos_tarde INT, cobro_extension DECIMAL,
                   registrado_por FK)
                  -- UNIQUE (alumno_id, fecha)

asistencia        (id, alumno_id FK, fecha DATE, estado ENUM(presente/ausente/retardo/justificado/no_entrada),
                   entrada_id FK, justificacion TEXT, comprobante_url)
                  -- UNIQUE (alumno_id, fecha)

registro_salida_sanitario (id, alumno_id FK, fecha DATE,
                           panial_limpio BOOLEAN, pertenencias_ok BOOLEAN,
                           estado_fisico_ok BOOLEAN, entrega_conforme BOOLEAN, notas TEXT)
                          -- UNIQUE (alumno_id, fecha)
```

### Bitácora Diaria
```sql
bitacora_diaria   (id, alumno_id FK, fecha DATE, comportamiento, estado_animo,
                   tuvo_fiebre BOOLEAN, temperatura_dia DECIMAL,
                   notas TEXT, foto_dia_url, foto_dia_public_id,
                   registrado_por FK)
                  -- UNIQUE (alumno_id, fecha)

registro_panial   (id, alumno_id FK, bitacora_id FK, hora TIME,
                   condicion ENUM(limpio/orina/heces/mixto/diarrea),
                   irritacion BOOLEAN, notas TEXT)
                  -- ⚠️ condicion usa keys, UI muestra: limpio→✅Limpio, orina→💧Pipí, heces→💩Popó

registro_banio    (id, alumno_id FK, bitacora_id FK, hora TIME, tipo ENUM(pipi/popo), notas TEXT)

control_esfinteres (id, alumno_id FK, bitacora_id FK, hora TIME,
                    fue_solo BOOLEAN, pidio_ir BOOLEAN, tuvo_accidente BOOLEAN)

registro_comida   (id, alumno_id FK, bitacora_id FK, tiempo ENUM(desayuno/colacion/comida/extra),
                   que_comio TEXT, cuanto_comio ENUM(todo/casi_todo/poco/nada),
                   foto_antes_url, foto_despues_url)
                  -- ⚠️ cuanto_comio está aquí, NO en bitacora_diaria

actividades_fotos (id, alumno_id FK, bitacora_id FK, descripcion TEXT,
                   url, public_id, es_grupal BOOLEAN, subido_por FK)
```

### Salud y Medicamentos
```sql
medicamentos      (id, alumno_id FK, bitacora_id FK, nombre, dosis, hora_administracion TIME,
                   administrado_por FK, foto_url, notificacion_enviada BOOLEAN)

recepcion_medicamento (id, alumno_id FK, nombre, dosis, instrucciones,
                       recibido BOOLEAN, recibido_por FK, fecha DATE)

toma_medicamento  (id, alumno_id FK, recepcion_id FK, hora_programada TIME,
                   administrado BOOLEAN, hora_administrado TIME,
                   recordatorio_enviado BOOLEAN)
                  -- Job medicamentosJobs lee esta tabla cada 5 min

incidentes        (id, alumno_id FK, bitacora_id FK, descripcion TEXT,
                   acciones_tomadas TEXT, fotos JSONB, firma_padre_url TEXT,
                   reportado_por FK, created_at)
```

### Académico
```sql
grupos            (id, nombre, nivel, nivel_codigo ENUM(maternal/prekinder/kinder1/kinder2/kinder3),
                   ciclo_id FK, cupo_maximo INT, color_hex, deleted_at)

ciclos_escolares  (id, nombre TEXT, fecha_inicio DATE, fecha_fin DATE, activo BOOLEAN)

inscripciones     (id, alumno_id FK, ciclo_id FK, grupo_id FK,
                   tipo ENUM(inscripcion/reinscripcion), fecha DATE,
                   pago_inscripcion_id FK, documentacion_completa BOOLEAN)

indicadores_evaluacion (id, nivel_codigo, materia, descripcion, orden)

periodos_evaluacion    (id, ciclo_id FK, nombre, fecha_inicio DATE, fecha_fin DATE,
                        tipo ENUM(mensual/bimestral/trimestral))

evaluaciones      (id, alumno_id FK, periodo_id FK, indicador_id FK,
                   nivel_logro, calificacion DECIMAL, observaciones TEXT)
                  -- UNIQUE (alumno_id, periodo_id, indicador_id)

boletas           (id, alumno_id FK, periodo_id FK, pdf_url, publicada BOOLEAN, notificacion_enviada BOOLEAN)
                  -- UNIQUE (alumno_id, periodo_id)
```

### Pagos
```sql
conceptos_pago    (id, nombre, monto DECIMAL, tipo ENUM(colegiatura/material/comida/extension/evento),
                   es_mensual BOOLEAN, es_recurrente BOOLEAN,
                   dia_pago INT, dia_recargo INT,
                   monto_recargo_dia DECIMAL, recargo_porcentaje DECIMAL,
                   es_extension BOOLEAN, activo BOOLEAN)

precios_nivel     (id, concepto_id FK, nivel_key, monto DECIMAL)
                  -- UNIQUE (concepto_id, nivel_key)
                  -- Permite precio diferente por nivel de grupo

pagos             (id, alumno_id FK, concepto_id FK, mes INT, anio INT,
                   monto_base DECIMAL, monto_recargo DECIMAL, monto_total DECIMAL,
                   estado ENUM(pendiente/pagado/vencido/cancelado/por_confirmar),
                   fecha_limite DATE, metodo_pago, comprobante_url, comprobante_public_id,
                   dias_atraso INT, registrado_por FK, created_at)

pago_comida_semanal (id, alumno_id FK, semana_inicio DATE,
                     estado ENUM(pendiente/pagado/cancelado), monto DECIMAL,
                     fecha_pago DATE, servicio_activo BOOLEAN,
                     metodo_pago, comprobante_url)
                    -- UNIQUE (alumno_id, semana_inicio)
```

**Semáforo de pagos:**
| Estado | Condición | Color UI |
|--------|-----------|----------|
| Verde | Sin adeudos | `bg-green` |
| Amarillo | 1+ día de atraso | `bg-yellow` |
| Rojo | 30+ días OR vencido | `bg-red` |
| Suspendido | 60+ días AND vencido | `bg-gray` |

### Notificaciones y Comunicaciones
```sql
notificaciones    (id, usuario_id FK, titulo, cuerpo, tipo, datos_extra JSONB,
                   leida BOOLEAN, enviada_push BOOLEAN, created_at)

log_whatsapp      (id, telefono, mensaje, tipo, estado ENUM(enviado/fallido/pendiente),
                   twilio_sid, alumno_id FK, created_at)

plantillas_whatsapp (id, clave UNIQUE, nombre, plantilla TEXT,  -- con {{variables}}
                     activa BOOLEAN, created_at)
                    -- Directora edita texto pero clave es inmutable
```

### Configuración
```sql
configuracion_general  (clave PK, valor TEXT)
-- Claves importantes:
--   hora_fin_filtro           → hora límite para no-retardo (ej: "08:00")
--   hora_salida_normal        → hora salida estándar (ej: "15:00")
--   hora_inicio_cobro_extension → hora desde la que se cobra extensión
--   alerta_minutos_sin_recoger → minutos de gracia antes de alerta
--   max_retardos_mes          → retardos antes de bloquear entrada (ej: 3)
--   costo_extension_hora      → costo por hora de extensión
--   semaforo_dias_amarillo    → días para pasar a amarillo
--   semaforo_dias_rojo        → días para pasar a rojo
--   semaforo_dias_suspendido  → días para suspender
--   whatsapp_activo           → "true"/"false"
--   push_activo               → "true"/"false"
--   notificaciones_modal_tipos → JSON array de tipos urgentes

config_horario_alumno  (id, alumno_id FK, ciclo_id FK,
                        hora_entrada TIME, hora_salida TIME,
                        tiene_extension BOOLEAN,
                        hora_salida_extension TIME,
                        genera_cargos BOOLEAN, activo BOOLEAN)
                       -- UNIQUE (alumno_id, ciclo_id)
```

### QR Temporal
```sql
qr_temporales     (id, alumno_id FK, token UUID UNIQUE,
                   nombre_autorizado TEXT, fecha_vigencia DATE,
                   cancelado BOOLEAN, created_by FK, created_at)
-- Formato QR permanente: HAPPYSCHOOL:ALUMNO:<uuid>
-- Formato QR temporal:   HAPPYSCHOOL:TEMP:<token>
```

### Contenido y Calendario
```sql
eventos           (id, titulo, descripcion, categoria_id FK,
                   fecha_inicio TIMESTAMPTZ, fecha_fin TIMESTAMPTZ,
                   es_todo_el_dia BOOLEAN, grupo_id FK,
                   google_calendar_event_id TEXT, publicado BOOLEAN)

categorias_evento (id, nombre, color_hex, icono, activo)

menu_semanal      (id, semana_inicio DATE UNIQUE,
                   menu_data JSONB)  -- {lunes:{desayuno,comida}, martes:..., ...}

tareas            (id, grupo_id FK, titulo, descripcion, fecha_limite DATE, publicada BOOLEAN, created_by FK)

tarea_alumno      (id, tarea_id FK, alumno_id FK, completada BOOLEAN, fecha_completada DATE)
                  -- UNIQUE (tarea_id, alumno_id)

temario_mensual   (id, grupo_id FK, mes INT, anio INT,
                   tema_mes TEXT, cuentos_semanas JSONB, materia_arte TEXT, pdf_url)
                  -- UNIQUE (grupo_id, mes, anio)
```

### Media y Documentos
```sql
documentos        (id, entidad_tipo ENUM(alumno/padre/personal),
                   entidad_id INT, tipo, nombre_archivo, url, public_id)

albumes           (id, titulo, descripcion, grupo_id FK, fecha_evento DATE,
                   es_privado BOOLEAN, alumno_id FK, creado_por FK)

galeria_fotos     (id, album_id FK, url, public_id, thumbnail_url,
                   es_video BOOLEAN, subido_por FK, created_at)

visitantes        (id, nombre, motivo, alumno_id FK, foto_url, hora_entrada TIME,
                   hora_salida TIME, fecha DATE, registrado_por FK)
```

---

## 6. Backend — Rutas y Endpoints

### Auth (`/api/auth`)
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/login` | ❌ | Login: email+password → {accessToken, refreshToken, usuario} |
| POST | `/refresh` | ❌ | Intercambia refreshToken → nuevo accessToken |
| POST | `/logout` | ❌ | Invalida refreshToken |
| PUT | `/cambiar-password` | ✅ | Cambia contraseña (requiere actual + nueva, mín 8 chars) |
| GET | `/perfil` | ✅ | Perfil del usuario autenticado |

### Alumnos (`/api/alumnos`)
| Método | Path | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/` | todos | Lista alumnos (filtros: ciclo, grupo, activo) |
| GET | `/mis-hijos` | padre | Hijos del padre autenticado + estado del día |
| GET | `/por-qr/:qrData` | maestra | Busca alumno por código QR |
| GET | `/:id` | todos | Detalle alumno |
| POST | `/` | directora/admin | Crear alumno |
| PUT | `/:id` | directora/admin | Actualizar alumno |
| DELETE | `/:id` | directora | Soft-delete alumno |
| POST | `/:id/foto` | directora/admin | Upload foto alumno |
| POST | `/:id/regenerar-qr` | directora/admin | Nuevo QR para alumno |
| GET | `/:id/documentos` | directora/admin | Lista documentos |
| POST | `/:id/documentos` | directora/admin | Upload documento |
| DELETE | `/:id/documentos/:docId` | directora | Eliminar documento |
| GET | `/:id/personas-autorizadas` | directora/admin/maestra | Lista autorizados |
| POST | `/:id/personas-autorizadas` | directora/admin | Agregar autorizado (max 2, 3 fotos requeridas) |
| DELETE | `/:id/personas-autorizadas/:paId` | directora | Eliminar autorizado |
| GET | `/:id/blacklist` | directora/admin/maestra_puerta | Lista bloqueados |
| POST | `/:id/blacklist` | directora | Agregar a blacklist |
| DELETE | `/:id/blacklist/:blId` | directora | Quitar de blacklist |
| POST | `/:id/padres` | directora/admin | Agregar tutor (max 2, email único global entre no-hermanos) |
| PUT | `/:id/padres/:padreId` | directora/admin | Editar tutor |
| PATCH | `/:id/padres/:padreId/desactivar` | directora/admin | Soft-delete tutor |
| GET | `/:id/hermanos` | todos | Hermanos con estado del día (entrada, salida, autorizados) |
| POST | `/:id/familia` | directora/admin | Vincular hermanos (familia_id compartido) |
| DELETE | `/:id/familia` | directora/admin | Desvincular de familia |
| GET | `/:id/qr-temporal` | padre | QR temporal activo de hoy |
| POST | `/:id/qr-temporal` | padre | Generar QR temporal (nombre_autorizado) |
| DELETE | `/:id/qr-temporal` | padre | Cancelar QR temporal |
| GET | `/:id/ciclos` | todos | Ciclos en los que estuvo inscrito |

### Asistencia (`/api/asistencia`)
| Método | Path | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/entrada` | maestra | Registra entrada + checklist + retardo logic |
| POST | `/salida` | maestra | Registra salida + autorización + blacklist + extensión |
| GET | `/filtro-entrada` | maestra | Lista alumnos agrupados por grupo para registro |
| GET | `/grupo/:grupoId` | maestra/directora | Asistencia del grupo (hoy o ?fecha=) |
| GET | `/grupo/:grupoId/mensual` | maestra/directora | Vista mensual por alumno |
| POST | `/alerta-sin-recoger` | maestra | Envía alerta manual "sin recoger" |
| GET | `/filtro-salida` | maestra | Lista alumnos listos para salir |
| GET | `/filtro-entrada/:alumnoId` | padre | Estado entrada del hijo (por ?fecha=) |
| PATCH | `/:alumnoId/justificar` | directora/admin | Justifica falta con opcional comprobante |
| POST | `/salida-sanitario` | maestra | Registra checklist sanitario de salida |
| GET | `/salida-sanitario/:alumnoId` | todos | Obtiene checklist sanitario |

### Pagos (`/api/pagos`)
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/conceptos` | Lista conceptos activos |
| POST | `/conceptos` | Crear concepto (directora) |
| PUT | `/conceptos/:id` | Actualizar concepto |
| DELETE | `/conceptos/:id` | Desactivar concepto |
| GET | `/conceptos/:id/precios` | Precios por nivel del concepto |
| PUT | `/conceptos/:id/precios` | Establecer precios por nivel |
| GET | `/conceptos/:id/monto-alumno/:alumnoId` | Precio específico para alumno según nivel |
| GET | `/` | Lista pagos (filtros: alumno, grupo, mes, anio, estado, concepto) |
| POST | `/` | Registrar pago manual |
| GET | `/estado/:alumnoId` | Estado de cuenta del alumno (semáforo, saldo, historial) |
| PUT | `/:id` | Actualizar pago |
| DELETE | `/:id` | Cancelar pago (directora) |
| GET | `/por-confirmar` | Pagos con comprobante subido por padre esperando aprobación |
| PATCH | `/:id/confirmar` | Aprobar o rechazar comprobante (acción: aprobar/rechazar) |
| POST | `/generar-mes` | Auto-generar cargos mensuales (manual o día 1 cron) |
| GET | `/dashboard` | Dashboard financiero mensual |
| GET | `/segmentacion` | Alumnos agrupados por servicios activos |
| GET | `/exportar` | Excel con detalle pagos + resumen + comida semanal |
| GET | `/:id/recibo` | Ver recibo PDF |
| GET | `/:id/recibo-publico` | Recibo sin auth (link compartible por UUID secreto) |
| POST | `/:id/enviar` | Enviar recibo PDF por WhatsApp |
| POST | `/:id/comprobante` | Padre sube imagen de comprobante → estado "por_confirmar" |
| POST | `/alumno/:alumnoId/recordatorio` | Envía WA + push de saldo pendiente |
| POST | `/alumno/:alumnoId/aviso-recargo` | Envía aviso de recargo (solo desde día 6+) |

### Comida (`/api/comida`)
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/menu` | Menú semanal (público, no requiere auth) |
| POST | `/menu` | Crear/actualizar menú (directora/admin) |
| DELETE | `/menu/:id` | Eliminar menú |
| GET | `/confirmaciones` | Confirmaciones de la semana (maestras) |
| POST | `/confirmacion` | Padre confirma/cancela comida (deadline: domingo) |
| GET | `/confirmacion/:alumnoId` | Padre ve su confirmación del alumno |
| PUT | `/confirmacion/:id/verificar-pago` | Maestra marca pago verificado en filtro entrada |
| PUT | `/confirmacion/:id/cancelar` | Maestra cancela servicio si no pagó |

### Otros grupos (resumen)
| Ruta | Función principal |
|------|-------------------|
| `/api/bitacora` | CRUD logs diarios, medicamentos, pañal, banio, comida, incidentes, fotos |
| `/api/grupos` | CRUD grupos, asignación maestras, estadísticas del día |
| `/api/personal` | CRUD personal, asignaciones, turno puerta |
| `/api/ciclos` | Ciclos escolares, promoción alumnos, egresados |
| `/api/calendario` | Eventos, categorías, export PDF |
| `/api/tareas` | Tareas por grupo, entregas, alertas alumnos |
| `/api/evaluaciones` | Evaluaciones por periodo, boletas |
| `/api/reportes` | Reportes asistencia y comportamiento |
| `/api/config` | Lectura/escritura de `configuracion_general` (directora only) |
| `/api/catalogos/:tipo` | Catálogos dinámicos: estados_animo, comportamientos, actividades, etc. |
| `/api/notificaciones` | CRUD notificaciones, registrar token push, marcar leídas |
| `/api/plantillas` | CRUD plantillas WhatsApp editables |
| `/api/insumos` | Inventario pañales diario por alumno |
| `/api/ninos_extension` | Alumnos con extensión de horario |
| `/api/visitantes` | Log de visitantes del día |
| `/api/galeria` | Álbumes y fotos |
| `/api/turnos-puerta` | Turnos de puerta por fecha/turno |
| `/api/padres` | CRUD tutores independiente de alumnos |

---

## 7. Backend — Jobs Automáticos (Cron)

Todos definidos en `backend/src/jobs/`, registrados en `src/index.js`, con timezone `America/Mexico_City`.

### 1. Comida — Recordatorio pago (`comidaJobs.js`)
- **Cron:** Lunes 7:00 AM
- **Qué hace:** Busca alumnos con pago de comida semanal pendiente → envía WA plantilla `pago_comida_lunes` + push al padre

### 2. Comida — Cancelación automática (`comidaJobs.js`)
- **Cron:** Lunes 8:31 AM
- **Qué hace:** Cancela servicios de comida no pagados → WA plantilla `sin_comida` + campanita + modal web+mobile al padre

### 3. Cargos mensuales (`cargosMensualesJob.js`)
- **Cron:** Día 1 de cada mes, 00:05 AM
- **Qué hace:**
  1. Busca conceptos con `es_mensual=true`
  2. Para cada concepto × alumno activo: verifica si ya existe pago para ese mes
  3. Obtiene precio del alumno según `precios_nivel` (fallback a monto_default)
  4. Inserta registro pendiente en `pagos`
  5. Para alumnos con extensión activa (`config_horario_alumno.tiene_extension`): genera cargo extensión mensual

### 4. Medicamentos (`medicamentosJobs.js`)
- **Cron:** Cada 5 minutos, 7:00-16:00, lunes-viernes
- **Qué hace:** Busca doses programadas (`toma_medicamento`) pendientes ±10 min → notifica a maestra titular + push + marca `recordatorio_enviado=true`

### 5. Sin recoger (`sinRecogerJob.js`)
- **Cron:** Cada minuto, 14:00-19:00, lunes-viernes
- **Qué hace:**
  1. Lee config: `hora_salida_normal`, `alerta_minutos_sin_recoger`
  2. Busca alumnos con entrada hoy, sin salida, no alertados aún
  3. Por alumno: determina hora efectiva de salida (normal o extensión vía `config_horario_alumno`)
  4. Si `CURRENT_TIME > hora_efectiva + gracia` → WA plantilla `sin_recoger` + push + log en `log_whatsapp`
- **⚠️ Crítico:** Respeta `tiene_extension` — alumnos con extensión no se alertan hasta 18:00+

### Resumen horario
```
00:05 AM — Día 1 mes     → cargosMensualesJob
 7:00 AM — Lunes         → recordatorioComida (WA pago_comida_lunes)
 7:00-16:00 c/5min L-V   → medicamentosJobs
 8:31 AM — Lunes         → procesarComidaNoPagada (cancela + WA sin_comida)
14:00-19:00 c/min L-V    → sinRecogerJob
```

---

## 8. Backend — Servicios Externos

### Cloudinary (`services/cloudinaryService.js`)
- Upload de: fotos alumnos, fotos tutores, QR codes, fotos bitácora, fotos actividades, documentos
- Flag: `CLOUDINARY_ENABLED=false` → mock en dev (retorna data URL base64)
- Carpetas en Cloudinary: `happyschool/qr/`, `happyschool/bitacora/`, `happyschool/actividades-alumno/`, `happyschool/visitantes/`, `happyschool/tareas/`

### WhatsApp Twilio (`services/whatsappService.js`)
- Usa plantillas de `plantillas_whatsapp` table (editables por directora)
- Verifica `whatsapp_activo` en config antes de enviar
- Loguea cada envío en `log_whatsapp`
- 12 plantillas activas (ver sección 17)
- **Variables en plantillas:** `{{nombre}}`, `{{hora}}`, `{{monto}}`, etc.

### Expo Push (`services/pushService.js`)
- Envía a `exp.host/--/api/v2/push/send`
- Token guardado en `usuarios.fcm_token` como `ExponentPushToken[xxx]`
- Funciona en APK/dev build. En Expo Go: registro OK pero entrega limitada.

### QR Service (`services/qrService.js`)
- Genera imagen PNG del QR
- Sube a Cloudinary → retorna URL pública
- QR permanente: `HAPPYSCHOOL:ALUMNO:<uuid>`
- QR temporal: `HAPPYSCHOOL:TEMP:<token>`

---

## 9. Web Frontend — Arquitectura

### URL base de API
```javascript
// src/services/api.js
import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
```

### Auth Store (`src/store/authStore.js`)
- **Persistencia:** Zustand persist → localStorage, key: `happy-school-auth`
- **Estado:** `{ token, refreshToken, usuario: { id, nombre, email, rolPrincipal, genero, parentesco, primerLogin } }`
- **Métodos:** `login(email, password)`, `logout()`, `setToken(token)`, `actualizarUsuario(datos)`

### Interceptores Axios (`src/services/api.js`)
- **Request:** Agrega `Authorization: Bearer {token}` de localStorage
- **Response (401 TOKEN_EXPIRED):**
  1. Cola las peticiones pendientes (evita múltiples refresh simultáneos)
  2. `POST /auth/refresh` con refreshToken
  3. Actualiza tokens en localStorage
  4. Reintenta petición original
  5. En fallo: limpia auth → redirige a `/login`

### Guards de Ruta (`src/App.jsx`)
```jsx
<PrivateRoute element={<Pagina />} rolesPermitidos={['directora', 'maestra_titular']} />
```
- Verifica `token` + `usuario` en store
- Verifica `usuario.rolPrincipal` en `rolesPermitidos`
- Directora entra a páginas de maestra (tiene acceso completo)
- Sin auth → redirige a `/login`
- Auth pero rol incorrecto → redirige a su home

### React Query Config (`src/services/queryClient.js`)
```javascript
defaultOptions: {
  queries: {
    retry: 1,
    staleTime: 30_000,       // 30 segundos
    refetchOnWindowFocus: false
  }
}
```

### Colores por Rol
| Rol | Accent | Clase Tailwind |
|-----|--------|----------------|
| Directora | Morado | `hs-purple` |
| Maestra | Verde | `hs-green` |
| Padre | Rojo | `hs-red` |
| Administrativo | Azul | `hs-blue` |

---

## 10. Web Frontend — Páginas por Rol

### Directora (`/directora`, layout: DirectoraLayout)
| Página | Ruta | Endpoints clave |
|--------|------|-----------------|
| Dashboard | `/` | `/reportes/dashboard`, `/bitacora/incidentes/hoy`, `/alumnos`, `/tareas/alumnos-alerta` |
| Alumnos | `/alumnos` | `/alumnos` + filtros ciclo/grupo |
| Perfil alumno | `/alumnos/:id` | `/alumnos/{id}` completo |
| Asistencia | `/asistencia` | `/asistencia/reportes` |
| Turno Puerta | `/turno-puerta` | `/turnos-puerta` |
| Niños Extensión | `/ninos-extension` | `/asistencia/extension` |
| Visitantes | `/visitantes` | `/visitantes` |
| Grupos | `/grupos` | `/grupos` |
| Personal | `/personal` | `/personal` |
| Usuarios Padres | `/usuarios` | `/usuarios` |
| Pagos | `/pagos` | `/pagos/resumen` |
| Calendario | `/calendario` | `/calendario` |
| Ciclos | `/ciclos` | `/ciclos` |
| Evaluaciones | `/evaluaciones` | `/evaluaciones` |
| Configuración | `/config` | `/config` |
| Aviso Extraordinario | `/aviso` | `/avisos` |
| Servicio Comida | `/comida` | `/comida/menu`, `/comida/confirmaciones` |
| Comida Pagos | `/comida-pagos` | `/comida/pagos` |
| Bitácora | `/bitacora` | `/bitacora` |
| Catálogos | `/catalogos` | `/catalogos` |

### Maestra (`/maestra`, layout: MaestraLayout)
> Roles permitidos: `maestra_titular`, `maestra_especial`, `maestra_puerta`, `directora`

| Página | Ruta | Endpoints clave |
|--------|------|-----------------|
| Dashboard | `/` | `/grupos/mi-grupo`, `/turnos-puerta/hoy`, `/config/horarios`, `/tareas/hoy-pendientes`, `/comida/confirmaciones` |
| Filtro Entrada | `/filtro-entrada` | `/asistencia/entrada`, `/config/negocio`, `/insumos/{id}`, `/bitacora/{id}`, `/comida/confirmacion/{id}` |
| Filtro Salida | `/filtro-salida` | `/asistencia/salida` |
| Asistencia | `/asistencia` | `/asistencia` |
| Bitácora | `/bitacora` | `/bitacora/{id}` |
| Tareas | `/tareas` | `/tareas` |

### Padre (`/padre`, layout: PadreLayout)
| Página | Ruta | Endpoints clave |
|--------|------|-----------------|
| Dashboard | `/` | `/alumnos/mis-hijos`, `/pagos/estado/{id}`, `/calendario`, `/tareas/lista-pendientes`, `/alumnos/{id}/qr-temporal` |
| Bitácora | `/bitacora` | `/alumnos/mis-hijos` |
| Pagos | `/pagos` | `/pagos` |
| Calendario | `/calendario` | `/calendario` |
| Comida | `/comida` | `/comida/semanal` |

### Administrativo (`/admin`, layout: AdministrativoLayout)
| Página | Ruta | Endpoints clave |
|--------|------|-----------------|
| Dashboard | `/` | `/reportes/admin-dashboard` |
| Pagos | `/pagos` | `/pagos` |
| Comida Pagos | `/comida-pagos` | `/comida/pagos` |
| Notificaciones | `/notificaciones` | `/notificaciones` |
| Reportes | `/reportes` | `/reportes` |

---

## 11. Mobile App — Arquitectura

### URL base de API
```javascript
// src/services/api.js
process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api'
```

### Auth Store (`src/store/authStore.js`)
- **Persistencia:** Zustand persist → expo-secure-store (cifrado en dispositivo), key: `happy-school-auth`
- **Estado:** igual que web
- **Adicional:** `registrarPushToken()` → obtiene ExponentPushToken → POST `/notificaciones/registrar-token`

### Interceptores Axios — idénticos a web
- Request: agrega Bearer token desde SecureStore
- Response 401 TOKEN_EXPIRED: refresh → retry → logout si falla

### Enrutamiento (Expo Router)
```
app/
├── index.jsx           → Splash/guard → redirige por rolPrincipal
├── login.jsx
├── (maestra)/
│   ├── _layout.jsx     → Tabs verdes (5 tabs visibles + galeria oculta)
│   ├── index.jsx
│   ├── asistencia.jsx
│   ├── bitacora.jsx    ← 81KB, pantalla más compleja de la app
│   ├── tareas.jsx
│   └── qr-scanner.jsx  ← entrada + salida según hora del día
└── (padre)/
    ├── _layout.jsx     → Tabs rojas (5 tabs visibles + qr + galeria ocultos)
    ├── index.jsx       ← 48KB, dashboard con QR temporal integrado
    ├── bitacora.jsx
    ├── comida.jsx
    ├── pagos.jsx
    └── calendario.jsx
```

### Polling de Notificaciones (mobile)
| Dato | Intervalo |
|------|-----------|
| Config notificaciones | 5 minutos |
| Conteo no leídas | 15 segundos |
| Lista completa | Al abrir modal |
| Notificaciones urgentes | 15 segundos |

---

## 12. Mobile App — Pantallas por Rol

### Maestra

**`(maestra)/index.jsx` — Dashboard**
- Saludo con hora
- Banner modo entrada activo (7:00-8:30am)
- Banner turno puerta
- Banner cumpleaños alumnos hoy 🎂
- Banner alumnos rechazados (fiebre/síntomas)
- FlatList de alumnos del grupo con badge de asistencia
- Estadísticas: presentes / retardos / sin registrar

**`(maestra)/asistencia.jsx` — Asistencia**
- Selector de fecha
- Lista alumnos con estado del día
- Modal registro manual (estado, temperatura, notas)
- Integración QR scanner
- TarjetaAlumno **expandible** al tocar: muestra detalles del checklist de entrada
- Banner cumpleaños en tarjeta del alumno si aplica

**`(maestra)/bitacora.jsx` — Bitácora (81KB)**
- Selector fecha
- Log por alumno con:
  - Estado de ánimo, conducta, comida (4 tiempos)
  - Condición pañal (usa `PANIAL_CONDICION` map: orina→💧Pipí, heces→💩Popó)
  - Insumos, vómito, notas, fotos
  - Firma digital

**`(maestra)/qr-scanner.jsx` — Scanner QR**
- **Modo automático por hora:** si `hora >= horaSalidaNormal` → modo salida, sino → modo entrada
- `ChecklistEntrada` (componente interno): checklist completo salud+higiene+materiales+comida
- `ConfirmacionSalida` (componente interno): quién recoge + checklist salida
- Cadena de hermanos integrada
- Banner QR temporal (amarillo diferenciado)

### Padre

**`(padre)/index.jsx` — Dashboard (48KB)**
- Tarjetas por hijo con:
  - Estado entrada/retardo/rechazo con hora
  - Contador retardos del mes (⚠️ 1-2, 🚫 3+)
  - Snapshot bitácora del día (2×2: ánimo, conducta, fiebre, incidentes)
  - Notas maestra
  - Estado salida: hora + quién recogió
  - Tareas pendientes expandible (color por urgencia)
  - Semáforo de pagos (verde/amarillo/rojo/suspendido + saldo)
  - **QR Temporal integrado en tarjeta:**
    - Sin pase activo: botón "Generar pase para hoy"
    - Con pase activo: nombre autorizado + "Ver QR" + "Cancelar"

**`(padre)/bitacora.jsx`** — Solo lectura del log del hijo

**`(padre)/comida.jsx`** — Confirmación semanal + días específicos + método pago + comprobante

**`(padre)/pagos.jsx`** — Historial pagos + subir comprobante (imagen)

**`(padre)/qr.jsx` (tab oculto)** — QR permanente + QR temporal con generación/cancelación

---

## 13. Mapa de Paridad Web ↔ Mobile

| Feature | Web (archivo) | Mobile (archivo) | Estado |
|---------|--------------|-----------------|--------|
| Dashboard maestra | `maestra/Dashboard.jsx` | `(maestra)/index.jsx` | ✅ Paridad |
| Filtro entrada | `maestra/FiltroEntrada.jsx` | `qr-scanner.jsx` → `ChecklistEntrada` | ✅ Paridad |
| Filtro salida | `maestra/FiltroSalida.jsx` | `qr-scanner.jsx` → `ConfirmacionSalida` | ✅ Paridad |
| Asistencia maestra | `maestra/Asistencia.jsx` | `(maestra)/asistencia.jsx` | ✅ Paridad |
| Bitácora maestra | `maestra/Bitacora.jsx` | `(maestra)/bitacora.jsx` | ✅ Paridad |
| Tareas maestra | `maestra/Tareas.jsx` | `(maestra)/tareas.jsx` | ✅ Paridad |
| Dashboard padre | `padre/Dashboard.jsx` | `(padre)/index.jsx` | ✅ Paridad |
| Bitácora padre | `padre/Bitacora.jsx` | `(padre)/bitacora.jsx` | ✅ Paridad |
| Pagos padre | `padre/Pagos.jsx` | `(padre)/pagos.jsx` | ✅ Paridad |
| Comida padre | `padre/ComidaSemanal.jsx` | `(padre)/comida.jsx` | ✅ Paridad |
| Calendario padre | `padre/Calendario.jsx` | `(padre)/calendario.jsx` | ✅ Paridad |
| QR Temporal padre | `padre/Dashboard.jsx` (QRTemporalCard) | `(padre)/index.jsx` (QRTemporalRow) | ✅ Paridad |
| Portal directora | `directora/*.jsx` | ❌ No existe | ✅ Intencional (admin only) |
| Portal admin | `admin/*.jsx` | ❌ No existe | ✅ Intencional (admin only) |

**⚠️ Gaps conocidos (no bloqueantes para piloto):**
- Firma digital en incidentes (web tiene SignaturePad, mobile no)
- Export PDF/Excel de reportes (web only — intencional)

---

## 14. Autenticación y Autorización

### Flujo de Login
```
1. POST /api/auth/login { email, password }
2. Backend verifica hash bcrypt
3. Retorna { accessToken (15min), refreshToken (7días), usuario }
4. Web: guarda en localStorage (Zustand persist)
   Mobile: guarda en SecureStore (Zustand persist)
5. Axios interceptor agrega Bearer en cada request
```

### Refresh Token
```
1. Request retorna 401 con code: "TOKEN_EXPIRED"
2. Interceptor hace POST /api/auth/refresh { refreshToken }
3. Backend rota: invalida viejo refreshToken, emite nuevos
4. Interceptor actualiza storage + reintenta request original
5. Si refresh falla (token expirado/revocado): logout forzado → /login
```

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| `directora` | Acceso total a todo el sistema |
| `administrativo` | Finanzas, pagos, reportes |
| `maestra_titular` | Su grupo: bitácora, asistencia, tareas |
| `maestra_especial` | Igual que titular pero puede ver varios grupos |
| `maestra_puerta` | Solo filtro entrada/salida |
| `padre` | Solo información de sus hijos |

**Nota:** `directora` siempre pasa el middleware `authorize()` sin importar los roles requeridos.

---

## 15. Reglas de Negocio Críticas

### Retardo (Late Arrival)
- `hora_entrada > hora_fin_filtro` (de `configuracion_general`) → `es_retardo=true`
- `numero_retardo_mes` se acumula por mes calendario
- Al llegar a `max_retardos_mes` (default 3): `puede_entrar=false` al día siguiente
- Dashboard padre muestra: ⚠️ 1-2 retardos, 🚫 3+ (bloqueado)
- WhatsApp `retardo` se envía automáticamente al registrar

### Entrada bloqueada
Condiciones que ponen `puede_entrar=false`:
- Temperatura > 37.5°C
- Síntomas de enfermedad
- 3+ retardos acumulados en el mes

### Cadena de Hermanos (Sibling Chain)
- Al registrar entrada/salida de alumno A → backend retorna hermanos via `GET /alumnos/:id/hermanos`
- Hermanos = misma `familia_id` O mismo tutor principal (`es_tutor_principal=true`)
- UI ofrece registrar hermanos en secuencia sin re-escanear QR
- Pre-llena datos del "quién recoge" del hermano anterior

### QR Temporal
- 1 QR activo por alumno por día (fecha_vigencia = CURRENT_DATE México)
- Padre ingresa nombre de quien va a recoger
- Format: `HAPPYSCHOOL:TEMP:<token>` (diferente del permanente `HAPPYSCHOOL:ALUMNO:<uuid>`)
- Miss ve banner amarillo al escanear: "PASE TEMPORAL — Verificar identidad"
- Se invalida a medianoche hora México (no UTC)

### Extensión de Horario
- Tabla `config_horario_alumno`: `tiene_extension`, `hora_salida_extension`, `genera_cargos`
- Si `genera_cargos=true`: cargo mensual generado automáticamente día 1
- Job `sinRecogerJob` respeta extensión: alumno con extensión no se alerta hasta `hora_salida_extension + gracia`
- Precio diferenciado por nivel: tabla `precios_nivel`

### Comida Semanal
- Padre confirma/cancela antes del domingo de cada semana
- Lunes 7:00 AM: recordatorio WA si no pagó
- Lunes 8:31 AM: cancela automático si no llegó pago
- En FiltroEntrada: maestra ve si alumno tiene comida confirmada
- `estado !== 'cancelado'` controla si se muestra sección de comida en filtro entrada
- 3 estados visuales: pendiente (rojo), pagado (verde), cancelado (gris)

### Pagos y Recargos
- Conceptos pueden tener precio por nivel (`precios_nivel`) o precio único
- Recargo: por porcentaje (único al vencer) O por día (acumulativo desde `dia_recargo`)
- Semáforo: verde → amarillo (config días) → rojo (30d+) → suspendido (60d+)
- Padre sube comprobante → estado `por_confirmar` → directora aprueba/rechaza

### Blacklist en Salida
- `POST /asistencia/salida` verifica tabla `blacklist` contra nombre de quien recoge
- Si hay match: bloquea salida + genera alerta a directora + WA `persona_no_autorizada`
- Motivo de blacklist es privado (no se muestra a la persona)

### Condición Pañal — Display
La tabla guarda KEYS, la UI debe traducirlos:
```javascript
const PANIAL_CONDICION = {
  limpio:  '✅ Limpio',
  orina:   '💧 Pipí',      // ⚠️ NUNCA mostrar "orina" al usuario
  heces:   '💩 Popó',      // ⚠️ NUNCA mostrar "heces" al usuario
  mixto:   '🔄 Mixto',
  diarrea: '⚠️ Diarrea',
};
// Uso: PANIAL_CONDICION[p.condicion] ?? p.condicion
```
Archivos que aplican este map: `web/src/pages/padre/Bitacora.jsx`, `mobile/app/(padre)/bitacora.jsx`, `mobile/app/(maestra)/bitacora.jsx`

---

## 16. Manejo de Fechas y Zona Horaria

> Esta sección causó 20+ bugs a lo largo del desarrollo. Leer antes de tocar cualquier fecha.

### Regla fundamental
La app opera en `America/Mexico_City` (UTC-6). PostgreSQL y Node.js tienen `TZ=America/Mexico_City` en `.env`.

### Qué usar y qué NO usar

| Caso | ❌ Incorrecto | ✅ Correcto |
|------|--------------|-------------|
| Fecha de hoy en frontend | `new Date().toISOString().slice(0,10)` | `new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })` |
| Fecha de hoy en backend SQL | `NOW()::date` | `CURRENT_DATE` |
| Parsear fecha del API | `new Date(apiDate)` | `new Date(apiDate.substring(0,10))` |
| Comparar fechas | Directo con ISO completo | Extraer primero con `.substring(0,10)` |

### Por qué falla `toISOString()`
`toISOString()` devuelve hora UTC. Si son las 7 PM en México (UTC-6), `toISOString()` da el día siguiente. Esto rompió:
- QR temporal (vigencia un día antes de lo esperado)
- Cumpleaños (`esCumpleanos()` marcaba un día antes)
- Filtros de asistencia por fecha
- Todas las queries que comparan con "hoy"

### El API devuelve ISO completo
```javascript
// El API retorna: "2022-04-17T05:00:00.000Z"
// Siempre hacer:
const soloFecha = apiDate.substring(0, 10) // "2022-04-17"
const date = new Date(soloFecha)           // fecha correcta
```

---

## 17. Sistema de Notificaciones

### 3 canales en paralelo
Para eventos importantes, el sistema envía por los 3 canales simultáneamente:

| Canal | Librería/Servicio | Persistencia |
|-------|-----------------|--------------|
| In-app (campanita) | BD tabla `notificaciones` | Permanente, marca leída |
| Push móvil | Expo Push API | Efímera (entregada o no) |
| WhatsApp | Twilio | Permanente en `log_whatsapp` |

### Tipos de notificación urgente (13 tipos)
`fiebre`, `vomito`, `diarrea`, `incidente`, `medicamento`, `sin_recoger`, `persona_no_autorizada`, `salida_anticipada`, `tarea_nueva`, `tarea_cancelada`, `entrada_rechazada`, `aviso_extraordinario`, `alerta_pago`

Notificaciones urgentes abren un modal automáticamente (web + mobile) cuando llegan.

### Plantillas WhatsApp activas (12)
| Clave | Cuándo se envía |
|-------|----------------|
| `retardo` | Al registrar entrada tardía |
| `fiebre` | Maestra registra temperatura alta en bitácora |
| `vomito` | Maestra registra vómito en bitácora |
| `diarrea` | Maestra registra diarrea en bitácora |
| `medicamento` | Maestra administra medicamento |
| `persona_no_autorizada` | Intento de salida con persona en blacklist |
| `salida_anticipada` | Salida antes de hora normal |
| `alerta_salud` | Alerta general de salud |
| `sin_recoger` | Job automático + botón manual miss |
| `sin_comida` | Cancelación de comida (automático o manual) |
| `pago_comida_lunes` | Job lunes 7:00 AM |
| `recordatorio_pago` | Job diario 16:00 + botón admin |

**Cómo editar:** Directora → Configuración → Plantillas WA. Solo el texto es editable, la clave (`clave`) es inmutable.

### Push Notifications — Limitación importante
- Funciona **100%** en: APK (Android), build de producción, development build
- Funciona **parcialmente** en: Expo Go (registro OK, entrega limitada)
- **Para la prueba piloto:** usar Expo Go es suficiente para validar flujos, pero notificaciones push en background requieren APK

---

## 18. Bugs Históricos — NUNCA REPETIR

> Leer esta tabla ANTES de escribir queries, rutas o cambios de schema.

| # | Bug | Causa raíz | Regla |
|---|-----|-----------|-------|
| 1 | Renombrar columna sin auditar | No hacer grep completo antes de migrar | `grep -r "nombre_columna" --include="*.{js,jsx}" . \| grep -v node_modules` antes de cualquier rename |
| 2 | Fechas ISO del API inválidas | API devuelve ISO completo, sin `.substring(0,10)` → fecha inválida | SIEMPRE `.substring(0,10)` antes de parsear fechas del API |
| 3 | `toISOString()` → día siguiente | Después de 6pm: UTC ≠ México | Frontend: `toLocaleDateString('en-CA', {timeZone:'America/Mexico_City'})`. Backend: `CURRENT_DATE` |
| 4 | Backend no recarga rutas | Proceso viejo en memoria | Matar procesos ANTES de reiniciar (en Windows: `Get-Process node \| Stop-Process -Force`) |
| 5 | Columnas inventadas en SELECT | Asumir columnas sin leer schema | Leer el schema de la tabla antes de escribir queries |
| 6 | Sin datos demo para nuevas vistas | Seed no crea datos de prueba | Crear datos demo antes de pedir validación |
| 7 | `deleted_at` en tabla `personal` | `personal` usa `activo` boolean, NO `deleted_at` | Verificar campo de soft-delete de cada tabla (varía) |
| 8 | UNIQUE index bloquea soft-delete | UNIQUE normal impide re-usar email | Usar índice parcial: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` |
| 9 | Stale closure en setTimeout | React captura valor viejo del estado | Construir objeto actualizado y pasarlo directamente al setTimeout |
| 10 | Import named vs default | `{ api }` cuando módulo exporta `export default` | Verificar tipo de export antes de importar |
| 11 | `onSuccess` en `useQuery` RQ v5 | RQ v5 eliminó `onSuccess`/`onError` de `useQuery` | `useEffect([data])` para side effects; `onSuccess` solo en `useMutation` |
| 12 | HTTP 304 Not Modified | Express cacheaba respuestas GET | Middleware ya añade `Cache-Control: no-store` en `/api/` — no remover |
| 13 | `cuanto_comio` en tabla equivocada | Columna existe en `registro_comida`, NO en `bitacora_diaria` | Siempre hacer JOIN a la tabla correcta |
| 14 | Duplicados por múltiples grupos | LEFT JOIN retornaba filas duplicadas | Usar `LATERAL + LIMIT 1` para tomar solo el primer grupo |

### Patrón correcto para React Query v5
```javascript
// ❌ INCORRECTO (RQ v4, no funciona en v5)
useQuery({ queryFn, onSuccess: (data) => {} })

// ✅ CORRECTO
const { data } = useQuery({ queryFn })
useEffect(() => {
  if (data) { /* side effect */ }
}, [data])

// onSuccess SÍ funciona en mutaciones:
useMutation({ mutationFn, onSuccess: (data) => {} })
```

### Soft-delete patterns por tabla
```javascript
// tabla personal → filtrar por activo
WHERE p.activo = true

// tabla alumnos, usuarios → filtrar por deleted_at
WHERE a.deleted_at IS NULL

// tabla asignaciones_grupo → no tiene soft-delete
// tabla eventos → no tiene soft-delete (eliminación física)
```

---

## 19. Variables de Entorno

### Backend (`.env`)
```bash
# Servidor
NODE_ENV=development          # development | production
PORT=3000
TZ=America/Mexico_City        # CRÍTICO: timezone de Node y cron jobs

# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/happy_school

# JWT
JWT_SECRET=<secreto_largo_aleatorio>
JWT_REFRESH_SECRET=<otro_secreto_largo>

# CORS
WEB_URL=https://tu-dominio-web.com      # URL de la web en producción
MOBILE_URL=https://tu-dominio-mobile.com # URL Expo si aplica

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_ENABLED=true     # false en dev sin cuenta

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # sandbox Twilio
WHATSAPP_ENABLED=true       # false para deshabilitar WA globalmente

# Expo Push (no requiere config adicional, usa API pública)
# Firebase (solo si se migra de Expo Push a FCM directo)
FIREBASE_SERVER_KEY=
```

### Web Frontend (`.env`)
```bash
VITE_API_URL=http://localhost:3000/api  # En producción: URL del backend
```

### Mobile App (`.env`)
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api  # En producción: URL del backend
```

### Puertos de desarrollo
| Servicio | Puerto |
|---------|--------|
| Backend | 3000 |
| Web (Vite) | 5173 (fijo, configurado en package.json) |
| Mobile (Expo) | 8081 |

---

## 20. Cómo Levantar el Proyecto (Dev)

### Prerrequisitos
- Node.js ≥ 18
- PostgreSQL 14+
- npm o yarn

### 1. Base de datos
```bash
# Crear BD
createdb happy_school

# Correr migraciones (en orden)
cd backend
node src/migrations/001_schema_inicial.sql  # o psql happy_school < src/migrations/001_...
# Aplicar todas las migraciones en orden numérico
```

### 2. Backend
```bash
cd backend
cp .env.example .env  # Configurar variables
npm install
node src/index.js

# Verificar:
curl http://localhost:3000/health
# Debe responder: {"status":"ok","app":"Happy School API","version":"1.0.0"}
```

### 3. Web
```bash
cd web
cp .env.example .env  # Configurar VITE_API_URL
npm install
npm run dev

# Verificar: http://localhost:5173
```

### 4. Mobile
```bash
cd mobile
cp .env.example .env  # Configurar EXPO_PUBLIC_API_URL
npm install
npx expo start

# Escanear QR con Expo Go (iOS/Android)
# O: npx expo start --android / --ios
```

### En Windows (matar procesos node antes de reiniciar)
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 21. Patrones de Código Usados

### Hook de catálogo (web y mobile idéntico)
```javascript
// Fetch y cache de datos del catálogo con staleTime 30min
const { items, map, isLoading } = useCatalogo('animo')
// items: [{ key: 'feliz', emoji: '😊', label: 'Feliz' }, ...]
// map: { feliz: { emoji: '😊', label: 'Feliz' }, ... }
```

### Patrón fetch + mutación
```javascript
// Fetch con TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['nombre-dato', filtro],
  queryFn: () => api.get('/endpoint').then(r => r.data),
  staleTime: 30_000,
})

// Mutación
const mutation = useMutation({
  mutationFn: (data) => api.post('/endpoint', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['nombre-dato'] })
    toast.success('✅ Guardado')
  },
  onError: (err) => toast.error(err.response?.data?.error)
})
```

### Componentes UI reutilizables de Bitácora
```jsx
// web: web/src/components/ui/BitacoraHelpers.jsx
// mobile: mobile/src/components/BitacoraHelpers.jsx
<Seccion titulo="SALUD" emoji="🌡️">
  <FilaInfo label="Temperatura" valor="37.2°C" />
  <PildoraBool label="Sin fiebre" valor={true} />
</Seccion>
```

### Manejo de moneda (México)
```javascript
// Web
new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto)

// Mobile (igual)
new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto)
```

### Transacciones en backend
```javascript
const client = await getClient()
try {
  await client.query('BEGIN')
  // ... operaciones ...
  await client.query('SAVEPOINT sp1')
  // ... operación que puede fallar ...
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  client.release()
}
```

### Feature flags
```javascript
// WhatsApp — verificar antes de enviar
const config = await query("SELECT valor FROM configuracion_general WHERE clave='whatsapp_activo'")
if (config.rows[0]?.valor !== 'true') return // silencioso

// Cloudinary — verificar antes de subir
if (process.env.CLOUDINARY_ENABLED !== 'true') {
  return { url: 'data:image/...', public_id: 'mock' }
}
```

---

*Documento generado el 2026-05-12 a partir del análisis del código fuente completo (backend + web + mobile) y del historial de 80+ sesiones de desarrollo documentadas en ARCHIVE_LOG.md.*

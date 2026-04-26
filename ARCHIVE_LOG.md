# ARCHIVE_LOG — Happy School App
## Historial de Funcionalidades Completadas

**Última actualización:** 2026-04-25 | Sesiones documentadas: 7 → 77

---

## ✅ SESIÓN 77 — Reorganización Arquitectónica FASES 4-7

**Fecha:** 2026-04-25 | **Estado:** Completado ✅ | **Duración:** ~90 min

**Lo que se hizo:**

### FASE 4 — .gitignore y builds (~20 min)
- Actualizar `.gitignore` raíz: secciones organizadas, agregar `.npm`, `*.tgz`, `.pem`, `.key`, vite cache, metro bundler, EAS
- Crear `web/.gitignore`: Vite-específico (`dist-ssr/`, `.vite/`, timestamps)
- Crear `mobile/.gitignore`: Expo-específico (`android/`, `ios/`, `.eas/`, metro cache)
- Verificar: `web/dist/`, `mobile/.expo/`, `*.log` — ninguno rastreado por git

### FASE 5 — Tests de smoke (~45 min)
- Extraer `backend/src/app.js` (Express puro sin `listen()`) — necesario para testabilidad
- Simplificar `backend/src/index.js` a arranque puro (PORT + jobs)
- Crear `tests/smoke/health.test.js` — GET /health → 200
- Crear `tests/smoke/auth.test.js` — 401 credenciales inválidas, 400 sin campos, login real opcional
- Crear `tests/setup.js` — carga `backend/.env` antes de los tests
- Instalar `jest@30` + `supertest@7` como devDependencies
- Agregar `npm run test:smoke` + config jest en `package.json` raíz
- Resultado: 4/4 tests pasan ✓

### FASE 6 — Script dev unificado (~10 min)
- Instalar `concurrently@9`
- `npm run dev` → backend + web en paralelo (cyan/magenta)
- `npm run dev:full` → backend + web + mobile Expo (cyan/magenta/yellow)
- README actualizado con tabla de scripts, estructura del proyecto, instrucciones smoke test

### FASE 7 — Normalizar imports web (~10 min)
- Migrar 24 imports relativos (`../../`) → alias `@/` en 15 archivos de `web/src/`
  - `pages/directora/` (7 archivos), `pages/maestra/` (2), `pages/padre/` (5), `components/ui/` (1)
- Crear `web/jsconfig.json` — VSCode resuelve `@/` con autocomplete
- Build Vite verificado: ✓ 1651 módulos, sin errores

**Commits:** 4
- `chore: FASE 4 — .gitignore y builds`
- `feat: FASE 5 — Tests de smoke (health + auth)`
- `feat: FASE 6 — Script dev unificado con concurrently`
- `refactor: FASE 7 — Normalizar imports web + README + jsconfig`

---

## ✅ SESIÓN 76 — Reorganización Arquitectónica FASE 3 (Backend Scripts)

**Fecha:** 2026-04-26 | **Estado:** Completado ✅ | **Duración:** ~75 min

**Lo que se hizo:**

### FASE 3 — Reorganización de archivos backend
- Mover `backend/src/database/` → `backend/scripts/` con subcarpetas:
  - `seeds/` — 11 archivos: seed.js + 10 seeds específicos
  - `setup/` — 6 archivos: 6 setups de inicialización
  - `fixes/` — 5 archivos: fixes de datos históricos
  - `checks/` — 1 archivo: validador de datos
- Actualizar todos los imports:
  - `require('../config/database')` → `require('../../src/config/database')` (2 niveles)
  - `require('dotenv').config()` bare → con path explícito `../../.env`
  - Actualizar comentarios de uso en setup_maternal.js y setup_padre_demo.js
- Consolidar migration runners:
  - Eliminar `backend/migrate.js` (hardcoded 014+015)
  - Eliminar `backend/run-migration.js` 
  - Crear `backend/scripts/migrate-runner.js` (genérico, acepta múltiples migraciones)
- Actualizar `backend/package.json`:
  - `"seed": "node src/database/seed.js"` → `"node scripts/seeds/seed.js"`
- Mover docs:
  - `RESUMEN_SESION_63.md` → `/docs/`
  - También movidos VALIDACION_SESION_63.md, VALIDACION_SESION_71.md, SCHEMA_SHORTCUT.md, MEMORY.md a `/docs/`
- Eliminar archivos temporales del root (5 archivos):
  - fix_emojis_skin.js, temp_seed_ana.sql, verify_endpoint.js, test_api.js, test_grupos.js
- Verificaciones:
  - `npm run seed` funciona ✓ (seed completa sin errores de módulo)
  - Backend arranca sin errores ✓
  - Cero referencias a `src/database` en código ✓

**Patrones de import aplicados:**
- Patrón A (sin dotenv): 6 archivos — solo cambiar db require
- Patrón B (bare dotenv): 3 archivos — agregar path explícito + db require
- Patrón C (dotenv con path): 9 archivos — mantener path + db require
- Patrón D (bare dotenv + Pool directo): 3 archivos — agregar path, sin cambio db
- Patrón E (dotenv + Pool directo): 2 archivos — mantener path, sin cambio db

**Archivos modificados:**
- `backend/package.json`
- `backend/scripts/migrate-runner.js` (nuevo)
- 23 archivos en `backend/scripts/` (copiados y editados)

**Archivos eliminados:**
- `backend/src/database/` (directorio completo)
- `backend/migrate.js`
- `backend/run-migration.js`
- 5 temporales del root

**Commits:** 1
- refactor: FASE 3 — Reorganización backend/scripts/

---

## ✅ SESIÓN 75 — Reorganización Arquitectónica FASE 1+2 (Seguridad + Mobile)

**Fecha:** 2026-04-25 | **Estado:** Completado ✅

**Lo que se hizo:**

### FASE 1 — Eliminación de Credenciales (CRÍTICO)
- Eliminar `backend/test_schema.js` (credenciales postgres:happy2026 en git)
- Mover password por defecto a variable `DEFAULT_USER_PASSWORD`
  - `backend/src/routes/personal.js` líneas 108, 178, 184 → usar `process.env.DEFAULT_USER_PASSWORD`
  - Agregar a `.env` y `.env.example` con guías claras
- CORS dinámico: `backend/src/index.js` lee `MOBILE_URL` desde `.env`
- `mobile/.env.example` → placeholder genérico `192.168.1.X` (era IP real `192.168.1.93`)

### FASE 2 — Corregir Imports Rotos Mobile (ALTO)
- Double-src bug: `@/src/...` → `@/...` en `mobile/app/(padre)/`
  - `index.jsx`: NotificationBell, buildGoogleCalendarUrl
  - `comida.jsx`: api, useAuthStore
  - **Causa:** alias `@` apunta a `./src`, por lo que `/src` generaba `./src/src/` (roto)
- Eliminar alias `@hooks` muerto de `mobile/babel.config.js` (directorio no existe)

**Archivos modificados:**
- `backend/src/routes/personal.js`
- `backend/.env` + `.env.example`
- `backend/src/index.js`
- `mobile/.env.example`
- `mobile/app/(padre)/index.jsx`
- `mobile/app/(padre)/comida.jsx`
- `mobile/babel.config.js`

**Archivos eliminados del repo:**
- `backend/test_schema.js` (git rm)

**Commits:** 2
1. refactor: FASE 1+2 — Seguridad + Imports móvil
2. chore: Sesión 75 — Cierre (PENDIENTES + ARCHIVE_LOG + memory)

**Plan completo:** 7 fases de reorganización (FASE 1+2 completadas, FASE 3-7 pendientes para sesiones 76-78)
- **FASE 3+4 (sesión 76):** Reorganizar backend/scripts/ + .gitignore
- **FASE 5+6 (sesión 77):** Tests smoke + script dev unificado
- **FASE 7 (sesión 78):** Normalizar imports web

---

## ✅ SESIÓN 74 — Sincronización Web ↔ Mobile (Paridad Completa)

**Fecha:** 2026-04-25 | **Estado:** Completado ✅

**Lo que se hizo:**
- **Módulo Tareas Maestra mobile:** `mobile/app/(maestra)/tareas.jsx` con 3 tabs (Próximas/Vencidas/Borradores), navegador semanas ISO, modales Nueva/Editar/Entregas con `expo-image-picker`
- **Dashboard Maestra mobile:** Agregados banners "Tareas por recibir hoy" (azul) + "Alumnos en alerta" (rojo), botón acceso rápido
- **Dashboard Padre mobile:** Nuevo componente HijoTareasPendientes — tareas expandibles por hijo con emojis urgencia (🔴/🔥/⚠️/📘)
- **Bitácora Padre mobile:** SelectorCiclo con chips horizontales para navegar ciclos, restricción fechas al rango
- **QR Scanner mobile:** Indicador Extensión de Horario en modo salida — banner naranja si `tiene_extension === true` con hora de salida
- **Bitácoras mobile:** Sincronización comida_extra — visible en tab Comida (padre) y sección separada (maestra) si hay extensión activa en fecha

**Archivos creados:**
- `mobile/app/(maestra)/tareas.jsx`

**Archivos modificados:**
- `mobile/app/(maestra)/_layout.jsx` — agregar ruta Tareas a tabs
- `mobile/app/(maestra)/index.jsx` — banners + botón Tareas
- `mobile/app/(padre)/index.jsx` — componente HijoTareasPendientes
- `mobile/app/(padre)/bitacora.jsx` — SelectorCiclo + comida_extra
- `mobile/app/(maestra)/bitacora.jsx` — comida_extra visible si extensión activa
- `mobile/app/(maestra)/qr-scanner.jsx` — indicador extensión en modo salida

**Commits:** 5
1. Sincronización Mobile — Módulo Tareas + Dashboard Padre
2. Sincronización Mobile — Bitácoras + QR Scanner
3. Sincronizar comida_extra en Bitácoras mobile
4. Cierre de sesión (PENDIENTES)
5. Cierre de sesión (ARCHIVE_LOG + MEMORY)

**Regla nueva:** Cada cambio funcional que aplique a roles móviles se sincroniza en mobile en la misma sesión. **No hay más deuda de paridad web↔mobile.**

---

## ✅ SESIÓN 73 — Módulo Extensión de Horario

**Fecha:** 2026-04-26 | **Estado:** Completado ✅

**Lo que se hizo:**
- Migrations 028 + 029: tabla `historial_servicios` con vigencia por rango (mes_inicio/anio_inicio → mes_fin/anio_fin)
- Alta de extensión: modalidad rango o indefinido, genera cargos pendientes automáticamente en `pagos`
- Baja de extensión: selector limitado al rango activo, cancela cargos futuros pendientes
- Estado actual informativo: muestra alta futura con rango efectivo corregido por bajas registradas
- Rutas movidas de `/comida/historial-servicios` → `/alumnos/:id/historial-servicios`
- FiltroSalida (maestra): badge ⏳ extensión en tarjeta, alerta salida anticipada respeta `hora_salida_extension`
- Bitácoras (directora/maestra/papá): comida_extra visible según extensión en fecha histórica del rango
- GET historial-servicios abierto a maestra y padre para consulta de comida_extra histórica

**Archivos modificados:**
- `backend/migrations/028_historial_servicios.sql` (nuevo)
- `backend/migrations/029_historial_servicios_vigencia.sql` (nuevo)
- `backend/src/controllers/alumnosController.js`
- `backend/src/controllers/comidaController.js`
- `backend/src/routes/alumnos.js`
- `backend/src/routes/asistencia.js`
- `web/src/pages/directora/AlumnoPerfil.jsx`
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/maestra/FiltroSalida.jsx`
- `web/src/pages/padre/Bitacora.jsx`

---

## ✅ SESIÓN 72 — Mejoras PDF Calendario (diseño infantil + lista detallada)

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Nueva paleta de colores vibrante e infantil**
- Púrpura más saturado: `rgb(0.408, 0.216, 0.780)` (antes: `0.502, 0.353, 0.816`)
- Púrpura oscuro: `rgb(0.271, 0.133, 0.545)` para encabezado
- Acentos infantiles: coral, mint, yellow, sky
- Gris border con tinte púrpura: `rgb(0.859, 0.839, 0.902)`

**2. Encabezado mejorado (Página 1)**
- Fondo `purpleDark` en lugar de púrpura plano
- Banda coral de 4 pt decorativa al fondo del encabezado
- Círculos decorativos en esquinas (gris claro, 10-14 pt)
- "Happy School" subido a `size: 20` (era 18)
- Título mes subido a `size: 24` (era 22)
- Contador eventos: color yellow en lugar de purpleLight

**3. Geometría de grilla optimizada**
- `headerH`: 22 → 26 pt (más respiración en cabecera de días)
- `rowH`: 68 → 76 pt (más espacio visual por celda)
- Cabecera días con colores alternados: Dom/Sab más intenso, semana purpleLight
- Línea separadora de 1.5 pt en púrpura al fondo de cabecera

**4. Visuales mejorados en celdas y chips**
- Celdas fin de semana: fondo con tinte púrpura sutil (`rgb(0.980, 0.976, 0.988)`)
- Celda "hoy": borde 1.5 pt en púrpura (era 0.5 pt)
- Número día: `size` 8 → 9, círculo radio 9 → 11
- Chips eventos: altura 12 → 13 pt, `borderRadius` 2 → 3
- **Barra lateral de color 3 pt a la izquierda de cada chip** (NUEVO)
- Fuente chip: 6.5 → 7.5 pt
- Separación entre chips: 14 → 16 pt
- Indicador +N: fondo `purpleLight` pequeño, color `purple`

**5. Leyenda mejorada**
- Posición y=10 → y=14
- Cuadrado color: 8x8 → 10x10 pt
- Línea separadora decorativa con puntos antes de leyenda (loop de círculos)

**6. Segunda página: Lista detallada de eventos (NUEVA)**
- A4 vertical `[595, 842]` con encabezado estilo página 1
- Por cada evento: tarjeta con barra lateral del color de categoría
- Contenido tarjeta:
  - Fecha formateada ("Lun 7 Abr") + hora o "Todo el día"
  - Título + grupo (si existe)
  - Descripción (máx 2 líneas, truncada)
  - Ubicación (si existe, en color sky)
  - Chip de categoría con color
- Filas alternas blanco/grayLight para legibilidad
- Paginación automática: crea páginas adicionales si hay >15-20 eventos
- Pie de página con "Happy School | Generado el DD/MM/YYYY" + número página

### Archivo modificado:
- `backend/src/routes/calendario.js` — endpoint `GET /api/calendario/export-pdf?mes=YYYY-MM`

### Validación técnica:
- ✅ Sintaxis JavaScript válida
- ✅ Router y 8 rutas registradas correctamente
- ✅ 7/7 checks de estructura de código pasaron
- ✅ Backend corriendo, endpoint accesible en `/api/calendario/export-pdf`

---

## ✅ SESIÓN 71 — Integración Calendario Mejorada (3 subtareas)

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Botón "Añadir a Google Calendar" — web padre + mobile**
- `web/src/utils/googleCalendar.js` + `mobile/src/utils/googleCalendar.js` — función `buildGoogleCalendarUrl(evento)`
- URL directa sin OAuth: abre Google Calendar pre-llenado en nueva pestaña/browser
- Maneja todo el día (`YYYYMMDD`) y con hora (`YYYYMMDDTHHmmssZ`)
- Botón en: modal Calendario web, modal Dashboard web, widget próximos web
- Botón en: modal calendario mobile, modal Dashboard mobile, widget próximos mobile

**2. Eventos Enriquecidos — ubicación + recordatorio**
- Migración `027_eventos_enriquecidos.sql`: columnas `ubicacion TEXT` y `recordatorio_horas INT`
- Backend `calendario.js`: POST y PUT actualizados con nuevos campos
- Formulario directora: input ubicación + select recordatorio (1h/2h/24h/48h/72h)
- Vista padre web: muestra 📍 ubicación y 🔔 recordatorio en modales
- Vista padre mobile: 📍 tappable abre Google Maps, 🔔 muestra tiempo
- `buildGoogleCalendarUrl`: incluye `location` si hay ubicación

**3. PDF Calendario Mensual**
- Ruta `GET /calendario/export-pdf?mes=YYYY-MM` con `pdf-lib` (A4 landscape)
- Grilla mensual 7 columnas, chips de color por categoría, hoy resaltado en morado
- Leyenda de categorías al pie de página
- Botón "PDF" en Calendario padre + Calendario directora (descarga blob)
- ⚠️ Pendiente Sesión 72+: lista detallada de eventos bajo la grilla + diseño infantil completo

### Nota técnica:
- `pdf-lib` StandardFonts (Helvetica) = WinAnsi únicamente. Emojis eliminados con `.replace(/[^\x00-\xFF]/g, '')`. Tildes funcionan (Latin-1).
- Para emojis en PDF futuro: embeber fuente TTF Unicode (ej: Noto Emoji)

### Commits:
- `7e06676` — Google Calendar botón web + mobile
- `c6e781e` — PENDIENTES Google Calendar
- `1db319f` — Eventos Enriquecidos
- (cierre sesión) — PDF + PENDIENTES + ARCHIVE_LOG

---

## ✅ SESIÓN 70 — Agrupación por semana ISO + Navegación por tabs + Modal entregas

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Página Tareas (maestra) — Restructuración radical con tabs + navegación por semana**
- Archivo: `web/src/pages/maestra/Tareas.jsx`
- Helpers nuevos:
  - `getISOWeek(dateStr)` — calcula semana ISO (1-53) con corrección año ISO
  - `getSemanaKey(dateStr)` — retorna clave `YYYY-WNN` para ordenamiento lexicográfico
  - `getLunesToDomingo(dateStr)` — formatea rango semana en español ("28 abr – 4 may")
  - `agruparPorSemana(tareas, orden)` — agrupa por semana ISO, ordena ASC o DESC
- **3 tabs principales:**
  - 📬 **Próximas** — tareas no vencidas, navegación por semana (semana actual primero)
  - 🗂️ **Vencidas** — tareas vencidas, navegación por semana (más reciente primero)
  - 📤 **Borradores** — tareas sin publicar (lista simple, sin paginación)
- Componente `NavegadorSemana` — reutilizable para tabs "Próximas" y "Vencidas"
  - Botones ‹ › para navegación con estado disabled en límites
  - Header: "Semana del 28 abr – 4 may · 2 tareas · semana 1 de 3"
  - Previene el problema de listas enormes (50+ tareas por ciclo escolar)

**2. Modal "¿Quién entregó?" — desglose por alumno**
- Componente `ModalEntregas` nuevo
- Query a `GET /tareas/:id/alumnos` (endpoint backend ya existía)
- Dos secciones:
  - ✅ **Entregaron** — lista verde de nombres
  - ❌ **Faltan** — lista roja de nombres
- Badge `📊 X/Y entregaron` ahora es botón clickeable en TareaCard
- Se abre modal al hacer clic, muestra detalle completo de entregas

### Archivos modificados:
- `web/src/pages/maestra/Tareas.jsx` — único archivo frontend

### Backend:
- Sin cambios — endpoints existentes:
  - `GET /tareas/:id/entregas` (conteos)
  - `GET /tareas/:id/alumnos` (lista con nombres y completadas)

---

## ✅ SESIÓN 68 — Tareas Grupales: "¿Entregó tarea?" + Indicador pendientes + Lista completa

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Label "¿Entregó tarea?" en Bitácora maestra (web/src/pages/maestra/Bitacora.jsx)**
- Cambiar label de "¿Trajo la tarea?" → "¿Entregó tarea?" (línea 886)
- Refleja mejor la intención: registrar si el niño entregó la tarea, no solo si la traía

**2. Endpoint nuevo: GET /api/tareas/pendientes-alumno (backend/src/routes/tareas.js)**
- Retorna conteo de tareas publicadas no entregadas del alumno
- Verifica ownership: alumno pertenece al padre en sesión
- Query usa LEFT JOIN a `tarea_alumno` para captar tareas nunca registradas

**3. Endpoint nuevo: GET /api/tareas/lista-pendientes (backend/src/routes/tareas.js)**
- Retorna **lista completa** de tareas pendientes (no solo la más reciente)
- Ordenadas por fecha_limite ASC (más pronto primero)
- Incluye: id, titulo, descripcion, fecha_limite, foto_url, completada, fecha_completada

**4. Dashboard papá — Cambio radical: TareaRecienteCard → Lista de todas las pendientes**
- Antes: mostraba solo la tarea más reciente + badge de conteo
- Ahora: lista numerada de TODAS las tareas pendientes ordenadas por urgencia
- Indicadores de urgencia por color:
  - 🔴 Rojo: Vencida (días pasados)
  - 🔥 Naranja: Hoy
  - ⚠️ Amarillo: Mañana
  - 📘 Azul: Más de 1 día
- Muestra descripción COMPLETA (sin truncar)
- Fecha formateada: "Lun 27 de Abr" con L mayúscula

**5. Tareas en fechas pasadas — endpoint hoy-pendientes acepta parámetro fecha**
- Cambio: endpoint `/tareas/hoy-pendientes` ahora acepta `fecha` como query param
- Antes: siempre filtraba por CURRENT_DATE
- Ahora: permite buscar tareas de cualquier fecha (para bitácora histórica)
- Agrega parámetro `alumno_id` al SELECT para retornar estado `completada` del alumno

**6. Bitácora maestra — cargar estado "¿Entregó tarea?" desde BD**
- Agregar `grupo_id` al objeto alumno cuando se selecciona en lista
- Crear useEffect que carga `trajoTarea` desde `tareasHoy[0].completada`
- Permite ver en bitácora de solo lectura si ya está marcada como entregada

**7. Bitácora papá — mostrar tareas en pestaña "Tareas"**
- Endpoint bitácora ahora retorna `tareas[]` (query a tabla tareas + tarea_alumno)
- Filter corregido: comparar solo fecha YYYY-MM-DD (sin hora UTC)
- Muestra: título, descripción, estado (✅ Entregada / ⏳ Pendiente)

**8. Seed de datos de prueba: seed_tarea_ayer_emilio.js**
- Inserta tarea "Dibujo de la familia" con fecha_limite = ayer
- Permite validar bitácora de fechas pasadas
- Ejecutado: tarea creada con ID e40a122a-19a0-4366-85d9-005e00ec6d9b

### Archivos modificados:
- `web/src/pages/maestra/Bitacora.jsx` — label + grupo_id + useEffect tarea + query fecha
- `backend/src/routes/tareas.js` — 3 nuevos endpoints/cambios: pendientes-alumno, lista-pendientes, hoy-pendientes
- `web/src/pages/padre/Dashboard.jsx` — TareaRecienteCard → lista completa, urgencia, descripción completa
- `web/src/pages/padre/Bitacora.jsx` — filter tareas por fecha YYYY-MM-DD
- `backend/src/routes/bitacora.js` — agregar tareas[] a endpoint GET /:alumnoId
- `backend/src/database/seed_tarea_ayer_emilio.js` — nuevo archivo

### Validación completada ✅
- Dashboard papá: "📚 3 tareas por entregar" → "📚 2 tareas por entregar" (1 marcada como entregada)
- Bitácora miss: "¿Entregó tarea?" aparece en día de ayer con "Dibujo de la familia"
- Bitácora papá: tab Tareas muestra "Dibujo de la familia" ✅ Entregada en día ayer
- Lista Dashboard: todas las tareas pendientes ordenadas por fecha, con urgencia por color

---

## ✅ SESIÓN 67 — Verificación Notificaciones Tareas + UI/UX Dashboard Papá

**Fecha:** 2026-04-24 | **Estado:** Completado

### Cambios completados:

**1. UX Configuración Directora (web/src/pages/directora/Configuracion.jsx)**
- Separar en tabs: "Horarios y reglas" vs "Notificaciones"
- Cada tab con su propio botón Guardar independiente
- Reduce confusión de usuario (antes: 2 botones "Guardar" + "Guardar notif")

**2. Verificación Notificaciones de Tarea (backend + BD)**
- Confirmado: endpoint `PUT /tareas/:id/publicar` inserta notificaciones
- Requería activar tipo `'tarea_nueva'` en `configuracion_general.notificaciones_modal_tipos`
- Solución: panel Configuración ya tenía checkbox, solo necesitaba activarlo
- Validado: notificaciones llegan a papás en tiempo real (campanita)

**3. Fix Dashboard Papá — Hooks Error (web/src/pages/padre/Dashboard.jsx)**
- Bug: `useQuery` dentro de `.reduce()` violaba reglas de Hooks
- Solución: extraer a componente `TareaRecienteCard` (mismo patrón que `PagoResumenCard`)
- Resultado: sin errores de Hooks, Dashboard papá carga limpiamente

**4. Mejora Card Tarea Reciente (web/src/pages/padre/Dashboard.jsx)**
- ✅ Título de sección: "Tareas encargadas" → "Tareas pendientes"
- ✅ Mostrar fecha de creación (Creada: 24/04/2026) — top right, discreta
- ✅ Título más grande (text-lg font-black) — mejor jerarquía visual
- ✅ Descripción completa (sin truncar a 80 chars)
- ✅ Botón "📎 Ver imagen de referencia" + modal si existe foto
- ✅ Badge naranja "Fecha de entrega" prominente con formato corto (lun, 27 abr)
- ✅ Badge estado entrega (Entregada/Pendiente) al final

**5. Fix Fechas (backend + frontend)**
- Backend: agregar `t.created_at` a SELECT endpoint `/tareas/reciente`
- Frontend: `created_at` y `fecha_limite` vienen en ISO 8601 con timestamp
- Solución: `.substring(0, 10)` + manual date parsing para evitar off-by-one por zona horaria
- Formato homologado: mismo que "Próximos eventos" (ej: "lun, 27 abr")

**Archivos modificados:**
- `backend/src/routes/tareas.js` — agregar created_at a query
- `web/src/pages/directora/Configuracion.jsx` — tabs + botones separados
- `web/src/pages/padre/Dashboard.jsx` — 3 cambios: componente TareaRecienteCard, mejoras card, fix fechas

**Validación en browser:**
- ✅ Directora: tabs funcionan, guardar horarios y notificaciones independiente
- ✅ Miss: puede crear/publicar/borrar tareas
- ✅ Papá: ve Dashboard sin errores, tarea con fecha creada + entrega formateadas, modal foto funciona
- ✅ Notificaciones: llegan a papá en campanita al publicar tarea (si `tarea_nueva` activado)

### Pendientes para próxima sesión:
- Dashboard directora: Indicador "[X] Tareas por recibir"
- Bitácora: Campo "Trajo Tarea: SÍ/NO"
- Papá bitácora: Vista de tareas (solo lectura)
- Directora dashboard: Alerta alumnos 3+ tareas sin entregar

---

## ✅ SESIÓN 66 — Revisión Completa de Proceso + Finalizar Módulo Tareas

**Fecha:** 2026-04-24 | **Estado:** Completado

### 1. Revisión y Depuración de Memory (Protocolo + Skills)

**Archivos eliminados (duplicados y obsoletos):**
- `feedback_cierre_sesion.md` (duplicado)
- `feedback_backend_restart.md`, `feedback_servidor_restart.md`, `feedback_cleanup_procesos.md`, `feedback_dev_server.md` (consolidados)
- `bugs_sesion_27.md`, `bugs_sesion_33plus.md`, `bugs_sesion_36.md` (históricos)
- `sesion_38_pendientes_reorganizacion.md`, `sesion_58_dashboard_entrada.md`, `sesion_60_notificaciones_errores.md`, `sesion_61_notificaciones_bugs.md`, `sesion_62_triggers_refactor.md`, `sesion_63_modal_notificaciones.md`, `sesion_64_historial_egresados.md` (históricos)

**Archivos creados:**
- `feedback_servidores.md` — Protocolo unificado Windows (PowerShell para matar, Bash para iniciar, curl para validar)

**Archivos actualizados:**
- `MEMORY.md` — Índice reorganizado: contexto + protocolos + reglas + proyectos activos (de 33 a 8 referencias activas)
- `feedback_schema_errores.md` — Agregada regla sobre relación padres: `alumnos → alumno_padre → padres → usuarios`

### 2. Finalizar Módulo Tareas — 3 Bugs Backend Corregidos

**Archivo:** `backend/src/routes/tareas.js`

**Bug 1: Query de padres incorrecto (usuario_padre1_id inexistente)**
- Afectaba: DELETE /tareas/:id (línea 352-357) + PUT /tareas/:id/publicar (línea 425-431)
- Columnas inventadas: `usuario_padre1_id`, `usuario_padre2_id`, `usuario_encargado_id` (no existen en schema)
- Solución: JOIN correcto `alumnos → alumno_padre → padres → usuarios` (igual a bitacora.js y asistencia.js)

**Bug 2: INSERT notificaciones con columnas inexistentes**
- Afectaba: DELETE (línea 362-365) + PUT publicar (línea 445-447)
- Columnas inventadas: `descripcion`, `urgente`, `referencia_id` (no existen en schema)
- Schema real: `usuario_id, tipo, titulo, cuerpo, datos_extra, leida, enviada_push, created_at`
- Solución: INSERT correcto usando `titulo`, `cuerpo`, `datos_extra` (JSONB con metadatos)

**Bug 3: DELETE notificaciones con referencia_id**
- Línea 376: columna `referencia_id` no existe
- Solución: Usar `datos_extra->>'tarea_id'` para encontrar notificaciones de una tarea específica

**Endpoint DELETE /tareas/:id — Funcionalidad:**
- Permite eliminar tareas publicadas (sin restricción anterior)
- Si estaba publicada: notifica a cada papá + envía WhatsApp
- Limpia `tarea_alumno` y `notificaciones` relacionadas antes de borrar
- Validado en browser: crear → publicar → borrar ✅

### 3. Aprendizajes y Protocolo

**Lecciones clave de esta sesión:**
1. NUNCA asumir columnas por intuición — verificar schema ANTES de escribir queries (leer `001_schema_inicial.sql`)
2. Usar el patrón existente en code — cuando no sabes un JOIN, grep un módulo similar (bitacora.js, asistencia.js)
3. Validar con curl DESPUÉS de cada cambio backend (no solo log files)
4. Levantar ambos servidores ANTES de pedir validación (backend + web, verificados con curl)
5. El error es siempre error real — si dice "columna no existe", esa columna no existe (no es typo)

**Protocolo de inicio de sesión establecido:**
1. Leer MEMORY.md + PENDIENTES.md + archivos memory del sprint
2. PowerShell: matar procesos viejos
3. Bash: levantar backend (sleep 4, curl health)
4. Bash: levantar web (sleep 8, curl http://localhost:5173)
5. Solo entonces: leer código/planificar

**Protocolo de cierre de sesión establecido:**
1. Checklist 6 puntos (archivo correcto, código correcto, backend OK, campos API, Vite actualizado, puerto 5173)
2. PENDIENTES.md: marcar completadas + actualizar estado
3. ARCHIVE_LOG.md: crear entrada con fecha + archivos + bugs + aprendizajes
4. Memory: guardar nuevas reglas de feedback, eliminar duplicados, consolidar
5. Git commit OBLIGATORIO (no esperar que Valeria lo pida)

**Archivos modificados (Sesión 66):**
- `backend/src/routes/tareas.js` — 3 queries corregidas, DELETE + PUT publicar validados
- `PENDIENTES.md` — removida sesión 66, actualizado estado tareas
- `MEMORY.md` — reorganizado índice, 15 duplicados eliminados
- `feedback_schema_errores.md` — agregar regla alumno_padre JOIN
- `feedback_servidores.md` — nuevo archivo protocolo unificado

---

## ✅ SESIÓN 63 — Notificaciones Modal Real-time + Configuración Directora + Mobile Campanita

**Fecha:** 2026-04-24 | **Estado:** Completado (sin fotos por ahora)

### 1. Backend: Configuración de Tipos de Notificación

**Migración:** `backend/migrations/025_notificaciones_modal_config.sql`
- Inserta clave `'notificaciones_modal_tipos'` en tabla `configuracion_general`
- Valor por defecto: `["incidente","aviso_extraordinario"]` (JSON array)

**API Endpoints:** `backend/src/routes/config.js`
- `GET /config/notificaciones` — retorna `{ notificaciones_modal_tipos: [...] }`
- `PUT /config/notificaciones` — solo directora, actualiza tipos que disparan modal
- Ambos autenticados (admitir cualquier rol en GET, solo directora en PUT)

### 2. Frontend Directora: Panel de Configuración de Notificaciones

**Archivo:** `web/src/pages/directora/Configuracion.jsx`
- Nueva sección "🔔 Notificaciones a padres"
- 4 tipos disponibles (hardcodeados): incidente, aviso_extraordinario, bitacora_lista, medicamento
- Checkboxes para activar/desactivar cada tipo
- Botón "Guardar notif" que hace PUT a `/config/notificaciones`
- Query separada que cachea 5 minutos la configuración

**UI:** Sección con fondo rojo (#FFF5F5), checkboxes estilizados, icono por tipo

### 3. Frontend Papá: Modal Urgente + Polling Mejorado

**Archivo:** `web/src/components/NotificacionModal.jsx` (nuevo)
- Componente presentacional puro
- Modal overlay fijo con `position: fixed inset-0 z-50`
- Borde superior de color según tipo (rojo incidente, naranja aviso)
- Icono grande, badge tipo, título, cuerpo, botón "Entendido"
- No cierra con click en overlay (fuerza lectura)

**Archivo:** `web/src/components/NotificationBell.jsx` (modificado)
- Polling aumentado de 30s → 15s (refetchInterval)
- Query paralela `notif-urgentes` que filtra por config de tipos y leída=false
- Sistema de cola: `colaModal` (array) y `modalActual` (objeto)
- `sessionStorage` con clave `notif-modal-${id}` para evitar repetir modales en misma sesión
- `useRef yaMostradas` para rastrear en memoria durante la sesión
- `useEffect` que encola nuevas urgentes detectadas
- `useEffect` que muestra de la cola cuando no hay modal activo
- Handler `handleEntendido` que marca leída y cierra el modal

**Flujo:** Padre ve modal automático cuando llega notificación de tipo configurado como urgente. Al hacer "Entendido", se marca como leída y se muestra la siguiente de la cola.

### 4. Mobile: Campanita de Notificaciones (React Native)

**Archivo:** `mobile/src/components/NotificationBell.jsx` (nuevo)
- Componente React Native autónomo
- `TouchableOpacity` con emoji 🔔
- Badge numérico rojo encima (muestra 9+ si >9 notificaciones)
- `Modal` con `animationType="slide"` (bottom-sheet)
- Lista de notificaciones con scroll
- Íconos por tipo (🚨/📢/💊/📝/🔔)
- No-leídas con fondo #FFF5F5 y punto rojo
- Tap en notificación marca como leída (mutation)
- Queries: `/notificaciones/no-leidas` (polling 30s) + `/notificaciones` (enabled cuando modal abierto)

**Integración:** `mobile/app/(padre)/index.jsx` — MontoedComponent en header del dashboard, al lado del emoji familia

### 5. Validación

- Documento de validación manual: [VALIDACION_SESION_63.md](VALIDACION_SESION_63.md)
- Pasos paso-a-paso para Directora (config), Papá (modal), Mobile (campanita)
- Checklist final con 10+ puntos de validación

### 6. Fix: Incidente sin FormData (mitad de sesión)

**Problema:** FormData multipart con multer causaba errores de boundary. Alumno_id llegaba undefined.

**Solución:** 
- Backend: `POST /bitacora/incidente` sin multer, JSON directo
- Frontend: cambiar de FormData a JSON
- Quitar UI de fotos (se agregarán después con approach correcto)

**Resultado:** Incidente funciona, registra en BD, dispara notificación, modal urgente aparece en portal papá ✅

---

## ✅ SESIÓN 62 — Notificaciones Triggers Automáticos + Refactor Dashboard Papá

**Fecha:** 2026-04-24

### Backend: Bug Fix `notificacion_enviada`
**Archivo:** `backend/src/routes/bitacora.js` (líneas 357-360)

Al registrar medicamento suministrado (`POST /bitacora/medicamento`):
- Ya insertaba notificación en `notificaciones` (sesión anterior)
- **Ahora también actualiza:** `medicamentos.notificacion_enviada = true`
- Ubicado dentro del `if (usuario_id)` para asegurar solo se marca si la notificación fue exitosa

**Razón:** Campo existía en schema desde sesiones anteriores pero nunca se marcaba. Ahora permite rastrear si notificación fue enviada.

### Frontend: Dashboard Papá Refactor UI

**1. Saludo sin coma extra**
- `web/src/pages/padre/Dashboard.jsx` línea 228
- Antes: `"¡Hola, Mamá, Alejandra!"` (coma antes del nombre)
- Ahora: `"¡Hola Mamá Alejandra!"`

**2. Sección "💳 Pagos" reemplaza grid de accesos rápidos**
- Removidas cards de Bitácora y Calendario del dashboard (acceso directo en nav aún disponible)
- Nueva sección con componente `PagoResumenCard` (líneas 231-258)
- Consulta `GET /pagos/estado/:hijoId` por cada hijo (React Query con staleTime 5min)
- Muestra estado en tiempo real:
  - Verde: `"✅ Al día"`
  - Amarillo/Rojo: `"⚠️ Adeudo: $X,XXX MXN"`
  - Suspendido: `"🚫 Suspendido: $X,XXX MXN"`

**Beneficio UX:** Padre ve de un vistazo si hay adeudos sin navegar a /padre/pagos.

---

## ✅ SESIÓN 61 — Bugs Notificaciones Multi-Sesión: Cache, Filtering, Encoding

**Fecha:** 2026-04-24

### Problema Principal
Después de sesión 60, usuarios reportaban que notificaciones aparecían:
- Con estado incorrecto (leída cuando no debería)
- Conteo de confirmaciones incorrecta en portal directora
- Caracteres acentuados corruptos (niños → ni�os)

### Bugs Identificados y Corregidos

**Bug 1: QueryClient cache no se limpiaba en logout**
- **Causa:** React Query singleton vivía en memoria, siguiente usuario heredaba caché
- **Solución:** 
  - Creó `web/src/services/queryClient.js` singleton exportable
  - `authStore.js` llama `queryClient.clear()` en logout
  - `main.jsx` importa queryClient desde services
- **Impacto:** Multi-sesión ahora funciona — Papa A logout → Papa B login ve SUS datos

**Bug 2: Endpoint estado aviso filtraba por título (crítico)**
- **Causa:** `WHERE n.titulo = $1` en lugar de aviso_id → mezcla conteos si dos avisos tienen mismo título
- **Solución:** 
  - Cambió a `WHERE n.datos_extra->>'aviso_id' = $1`
  - Eliminou query intermedia de buscar por título
- **Impacto:** Directora ve conteo exacto de confirmaciones de lectura

**Bug 3: staleTime: 30s prevenía re-fetch inmediato**
- **Causa:** React Query mantenía caché por 30s, dentro de esa ventana no re-fetcheaba
- **Solución:**
  - Eliminó `staleTime: 30_000` de query notificaciones
  - Reducido `refetchInterval` en badge de 60s a 30s
- **Impacto:** Notificaciones siempre frescas al abrir panel

**Bug 4: UTF-8 encoding incorrecto en web**
- **Causa:** axios no declaraba charset UTF-8, navegador enviaba caracteres acentuados corruptos
- **Solución:**
  - `api.js`: agregado `charset=utf-8` a Content-Type header
  - `api.js`: agregado `transformRequest` explícito para JSON
- **Impacto:** "Los niños" se guarda y muestra correctamente, no "ni�os"

**Bonus: Papa Sofia no era tutor principal**
- **Causa:** `papa.sofia.maternal@happyschool.edu.mx` registrado pero `es_tutor_principal = false` para Sofia Reyes Mendoza
- **Solución:** Actualizar BD — SET `es_tutor_principal = true`
- **Impacto:** Papa Sofia ahora recibe notificaciones de su hija

### Archivos Modificados
- `web/src/services/queryClient.js` (nuevo)
- `web/src/main.jsx`
- `web/src/store/authStore.js`
- `web/src/components/NotificationBell.jsx`
- `web/src/services/api.js`
- `backend/src/routes/notificaciones.js`

### Validación
✅ Multi-sesión: Papa A logout → Papa B ve SUS notificaciones, no las de A
✅ Persistencia: Papa A vuelve → su notificación sigue sin leer (no hereda estado de Papa B)
✅ Conteo: Directora ve count correcto de confirmaciones
✅ Encoding: Acentos y caracteres especiales visibles correctamente

---

## ✅ SESIÓN 60 — Notificaciones Globales: Backend Endpoints + Frontend UI

**Fecha:** 2026-04-24

### Problema Principal
Sesión 59 había planeado notificaciones pero se descubrió que faltaba auditoría legal: timestamps de envío Y de lectura para evidencia si padre dice "no me llegó" o "yo sí lo leí".

### Funcionalidades Completadas

**Backend — Endpoints Notificaciones (`backend/src/routes/notificaciones.js`)**
- `GET /` — Últimas 20 notificaciones del usuario autenticado
- `GET /no-leidas` — Contador de notificaciones no leídas
- `PUT /leer-todas` — Marcar todas como leídas (para botón "Marcar todo como leído")
- `PUT /:id/leer` — Marcar una notificación como leída (para clic individual)
- `POST /aviso-extraordinario` — Directora envía aviso urgente a padres (todos o grupos seleccionados)
  - Inserta en tabla `avisos` para persistencia histórica
  - Crea notificación para cada padre tutor principal
  - Retorna `{ ok, enviadas, aviso_id }`
- `GET /aviso-extraordinario/estado/:avisoId` — Estado de lectura de un aviso (tab "Sin leer" vs "Vieron")
  - Query por título para encontrar notificaciones originales
  - Retorna count total, leídas, pendientes + detalle con padre_nombre, alumno_nombre, grupo_nombre, estado lectura
- `GET /avisos-extraordinarios` — Historial de todos los avisos enviados (visible para Directora)

**Frontend — Directora: AvisoExtraordinario (`web/src/pages/directora/AvisoExtraordinario.jsx`)**
- Componente `EnviarAvisoForm`: Input título + textarea cuerpo + multi-select grupos + botón enviar
- Componente `EstadoAviso`: Tabs "Sin leer" (naranja) y "Vieron" (verde)
- Componente `GrupoCard`: Colapsable por grupo, muestra padres y alumnos en cada grupo
- Estado local: `historialLocal` (recién enviados) + query `avisos-extraordinarios` (histórico BD)
- Manejo `expandidosSet` para tracking de qué grupos están desplegados
- Toast notifications de éxito/error

**Frontend — Papá: Notificaciones en Dashboard**
- Campanita en navbar con contador de no leídas
- Click abre modal con listado de notificaciones
- Click en notificación marca como leída (PUT /:id/leer)
- Botón "Marcar todo como leído"

### Error Crítico Detectado y Resuelto

**Raíz:** Migración 023 (`backend/migrations/023_avisos_extraordinarios.sql`) creada pero NUNCA aplicada a BD. Columnas `leida_at`, `tipo`, `grupo_ids` no existían en el schema real.

**Síntomas:** 500 errors en endpoints:
- `PUT /leer` → "column leida_at does not exist"
- `GET /avisos-extraordinarios` → "column grupo_ids does not exist"
- `POST /aviso-extraordinario` → "column tipo does not exist"

**Impacto:** Usuario validó 5+ veces sin solución porque el backend compilaba pero fallaba en runtime.

**Solución:**
- Removidas referencias a columnas no existentes (`leida_at`, `tipo`, `grupo_ids`)
- Backend usa SOLO columnas que ya existen: `leida`, `created_at`, `titulo`, `contenido`, `creado_por`
- Endpoints funcionan con schema actual sin migración

**Lección Guardada en Memoria:** Verificar que columnas existen ANTES de escribir queries. No asumir que migración creada = aplicada.

### Archivos Modificados
1. `backend/migrations/023_avisos_extraordinarios.sql` (creado, no aplicado)
2. `backend/src/routes/notificaciones.js` (endpoints para avisos)
3. `web/src/pages/directora/AvisoExtraordinario.jsx` (nueva, UI completa)
4. `web/src/layouts/DirectoraLayout.jsx` (agregado nav item)
5. `web/src/App.jsx` (agregada ruta)

### Verificación en Browser
- ✅ Campanita en navbar papá muestra contador
- ✅ Click abre modal con notificaciones
- ✅ Click notificación marca como leída (PUT funciona)
- ✅ Directora envía aviso a grupos seleccionados
- ✅ Aviso persiste en histórico
- ✅ Estado actualiza en tiempo real (Sin leer → Vieron)
- ✅ Grupos se expanden/contraen correctamente

### Tareas Pendientes para Sesión 61
- Implementar triggers automáticos en bitácora, medicamento, incidente (INSERT notificaciones)
- Agregar `leida_at` columna a BD cuando sea posible (aplicar migración 023)
- Implementar notificaciones modales en tiempo real (WebSocket o polling)
- Paridad mobile: revisar si mobile necesita notificaciones

---

## ✅ SESIÓN 59 — Bug `mis-hijos`: respuesta objeto vs array en web y mobile

**Fecha:** 2026-04-23

### Problema
El endpoint `GET /alumnos/mis-hijos` devuelve `{ hijos: [...], horaLimiteEntrada }` (objeto), pero 5 componentes asumían que `r.data` era directamente un array, causando `hijos.find is not a function` y `hijos.map is not a function`.

### Archivos Corregidos
- `web/src/pages/padre/Bitacora.jsx` — `hijosData.hijos || []` + renombrada variable para evitar colisión con `data` de bitácora
- `web/src/pages/padre/Pagos.jsx` — `hijosData.hijos || []`
- `web/src/pages/padre/ComidaSemanal.jsx` — `hijosData.hijos || []`
- `mobile/app/(padre)/index.jsx` — `hijosData?.hijos || []`
- `mobile/app/(padre)/pagos.jsx` — `hijosData.hijos || []`

### Reglas Nuevas Guardadas
- Grep en web **y** mobile antes de corregir cualquier bug; corregir ambos en el mismo turno.

---

## ✅ SESIÓN 58 — Dashboard Papá Enriquecido: Entrada Autorizada/Rechazada + Retardos + Advertencias

**Fecha:** 2026-04-23 | **Commits:** 2 (implementación + ajuste formato hora)

### Funcionalidades Completadas

**Dashboard Papá — Visibilidad de entrada y retardos**
- Backend (`alumnos.js` línea 36-45):
  - Endpoint `GET /mis-hijos` ahora retorna `filtro_entrada.numero_retardo_mes` (total retardos acumulados en el mes)
  - Query SQL con COUNT de retardos siempre activo (aunque no haya entrada hoy)
  - Respuesta estructurada: `{ hijos: [...], horaLimiteEntrada }`
- Frontend (`Dashboard.jsx` - HijoCard):
  - 3 estados visuales según retardos acumulados:
    - **0 retardos + entrada autorizada:** Fondo verde, hora de entrada mostrada sin símbolo "@"
    - **1-2 retardos + entrada autorizada:** Fondo amarillo, badge "⚠️ Retardo", alerta "próximo retardo bloquea entrada"
    - **≥3 retardos:** Fondo rojo, alerta "🚫 Límite de retardos alcanzado", indica que mañana será rechazado si llega tarde
  - Entrada rechazada:
    - Motivo enriquecido: 🌡️ para fiebre, 🤒 para síntomas
    - Checklist con ✅/❌: uñas, uniforme, bata, agua, termo, ojos
  - Alerta unificada de retardos (sin repeticiones)

### Archivos Modificados (1 archivo)
- `backend/src/routes/alumnos.js` — campos `numero_retardo_mes` en SELECT y objeto `filtro_entrada`
- `web/src/pages/padre/Dashboard.jsx` — lógica retardos, badges, colores, checklist, hora sin "@"

### Verificación en Browser
- ✅ Dashboard padre: retardos visibles, badges funcionales, hora sin símbolo
- ✅ Colores Tailwind aplicados correctamente (verde/amarillo/rojo)
- ✅ Checklist desplegable con ✅/❌
- ✅ Alerta unificada (sin repeticiones de "Retardo #N")

---

## ✅ SESIÓN 57 — 3 Bugs Entrada: Síntomas vs Retardos + Asistencia Miss + Protocolo Salud

**Fecha:** 2026-04-23 | **Commits:** 2 (implementación + correcciones)

### Bugs Corregidos

**Bug 1 — Alumno rechazado por fiebre mostraba "Retardo #N" (COMPLETAMENTE CORREGIDO)**
- Causa: `es_retardo` se calculaba solo por hora, independiente de síntomas. Frontend mostraba badge sin verificar `puede_entrar`. Endpoint devolvía `numero_retardo_mes` aunque alumno fuera rechazado.
- Backend fix (`asistencia.js`):
  - Reordenar evaluación: síntomas/fiebre primero (máxima prioridad), retardos solo si pasó filtro de salud (línea 27-60)
  - Solo marcar `es_retardo = true` si `puedeEntrar === true`
  - Endpoint `/asistencia/grupo/:id`: `CASE WHEN puede_entrar=false THEN 0 ELSE numero_retardo_mes` (línea 308)
- Frontend fix:
  - `FiltroEntrada.jsx` línea 248: Agregar `&& alumno.estado_asistencia !== 'no_entrada'`
  - `Asistencia.jsx` línea 238: Agregar misma condición
  - `Dashboard.jsx Directora`: `ModalRetardosGrupo` filtra `.filter(a => a.estado_asistencia !== 'no_entrada')` + actualiza cálculo de `totalRetardos` y `tieneAlumnosSeveros`
- Resultado: Alumnos rechazados por síntomas NUNCA muestran retardo en ninguna vista

**Bug 2 — Asistencia Miss mostraba alumnos de otros grupos (COMPLETAMENTE CORREGIDO)**
- Causa: 
  - Backend fallback usaba `ORDER BY ag.created_at DESC LIMIT 1` — retornaba grupo aleatorio
  - Frontend cacheaba query sin invalidar al cambiar usuario
- Backend fix (`grupos.js` línea 126-142):
  - Filtrar por `dias_semana` del día actual: `($2 = ANY(ag.dias_semana) OR ag.dias_semana IS NULL)`
  - Cambiar a `ORDER BY g.nombre LIMIT 1` — determinístico
- Frontend fix (`Dashboard.jsx` Miss):
  - Importar `useQueryClient` de React Query
  - Agregar `useEffect` que invalida caché cuando cambia `usuario.id`: `queryClient.invalidateQueries({ queryKey: ['mi-grupo'] })`
- Resultado: Maestra especial ve su grupo correcto inmediatamente, sin necesidad de F5

**Bug 3 — Protocolo síntomas: visualización en rojo (feature nueva)**
- Backend (`reportes.js`):
  - Query nueva `rechazados_sintomas`: Filtra `puede_entrar = false AND (sin_fiebre = false OR temperatura > 37.5 OR sin_sintomas = false)`
  - Incluye: `nombre_completo`, `grupo_nombre`, `temperatura`, `motivo_no_entrada`
- Frontend Directora (`Dashboard.jsx`):
  - Card roja "🚨 Rechazados por síntomas hoy" similar a incidentes
  - Muestra temperatura en badge rojo, motivo en texto rojo
- Frontend Miss (`Dashboard.jsx`):
  - Banner rojo derivado de `grupo.alumnos` (sin nueva API call)
  - Auto-refetch cada 30s junto con datos del grupo
- Resultado: Alerta visual inmediata en ambos dashboards → protocolo de salud activado

### Archivos Modificados (7 archivos)
- `backend/src/routes/asistencia.js` (línea 27-60: lógica síntomas; línea 308: CASE WHEN)
- `backend/src/routes/grupos.js` (línea 126-142: filtro dias_semana)
- `backend/src/routes/reportes.js` (Query rechazados_sintomas)
- `web/src/pages/maestra/FiltroEntrada.jsx` (línea 248: condición)
- `web/src/pages/maestra/Asistencia.jsx` (línea 238: condición)
- `web/src/pages/maestra/Dashboard.jsx` (useQueryClient + useEffect invalidate)
- `web/src/pages/directora/Dashboard.jsx` (filter + cálculo totalRetardos)

---

## ✅ SESIÓN 56 — Entrada (Filtro) + Ciclos históricos + Fixes

**Fecha:** 2026-04-23 | **Commits:** 8

### Completado

- **Dashboard Maestra — Card "Sin entrada (retardos)":**
  - Endpoint `GET /grupos/mi-grupo/estadisticas/hoy` cuenta alumnos con `estado = 'no_entrada'` cuyo `motivo_no_entrada ILIKE '%retardo%'`
  - Card nueva en grid de stats (5 columnas) con icono UserX, color naranja, refetch cada 30s
  - Suma correcta: En escuela + Retardos + Ausentes + **Sin entrada (retardos)** + Bitácoras guardadas = Total

- **Dashboard Papá — Filtro de entrada (Checklist sanitario):**
  - Endpoint `GET /alumnos/mis-hijos` extendido con datos completos de `registro_entrada` (uñas, bata, agua, uniforme, termo, ojos, etc.)
  - Card de hijo muestra: 🚪 ✅ Entrada autorizada / 🚪 🚫 Rechazada + motivo
  - Grid visual 3×2 con checklist: `if (item === null || undefined) return null` para distinguir false (⚠️) de null
  - **Fix:** Checklist siempre visible incluso si entrada rechazada, para que papá vea qué le faltó

- **Dashboard Papá Bitácora — Selector de ciclo (Fase 1):**
  - Carga ciclos desde `GET /alumnos/:id/ciclos` (actualizado a incluir ciclo actual del grupo + históricos via UNION)
  - Selector con dropdown mostrando ciclo actual marcado con "(Actual)"
  - UI preparada para Fase 2 (filtro de bitácora por ciclo)

- **Fixes implementados:**
  - `FiltroEntradaBadge`: cambiar `if (!item)` → `if (item === null || undefined)` para mostrar `false` como ⚠️
  - `Bitacora.jsx` — Comida: agregar validación `if (c.cuanto_comio)` para evitar "undefined undefined"
  - Endpoint `/alumnos/:id/ciclos`: UNION de inscripciones históricas + ciclo actual del grupo

### Archivos modificados
- `backend/src/routes/grupos.js` (nuevo endpoint estadísticas)
- `backend/src/routes/alumnos.js` (extender mis-hijos + actualizar ciclos)
- `web/src/pages/padre/Dashboard.jsx` (FiltroEntradaBadge + card entrada)
- `web/src/pages/padre/Bitacora.jsx` (SelectorCiclo + validación comida)
- `PENDIENTES.md` (actualizar estado)

### Datos de prueba validados
- Emilio Vega Sánchez (Prekinder) — Entrada autorizada pero faltó bata + agua → ✅ visible en checklist
- Mamá: `mama.emilio@happyschool.edu.mx` / `happy2024`

---

## ✅ SESIÓN 55 — Bug bitácora + Servicio Comida pagos mejorado

**Fecha:** 2026-04-23

### Completado

- **Bug crítico `Bitacora.jsx` (Maestra):** Bloqueado registro de bitácora para alumnos sin entrada. Validación `tieneEntrada = alumno.hora_entrada && ['presente','retardo'].includes(alumno.estado_asistencia)`. Banner rojo informativo + botón guardar deshabilitado si no hay entrada.

- **`ServicioComida.jsx` (Directora) — Tab Pagos:**
  - Badge de nivel del alumno (`nivel_nombre`) junto al nombre en cada tarjeta
  - Tabs de filtro por nivel (Todos, Kinder 1, Kinder 2, etc.) generados dinámicamente
  - Resumen de totales en pesos (💳 Transferencia / 💵 Efectivo / 💰 Gran total) — se actualiza al filtrar por nivel
  - Orden: stats contadores → resumen en pesos → filtros por nivel → lista alumnos

- **`comidaController.js` (Backend):** Query `obtenerConfirmaciones` ahora incluye `g.nivel AS nivel_nombre` y `g.nivel_codigo` via `LEFT JOIN grupos`. Orden cambiado a `g.nivel_codigo, a.nombre_completo`.

### Archivos modificados
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/directora/ServicioComida.jsx`
- `backend/src/controllers/comidaController.js`

---

## ✅ SESIÓN 54 — Menú estructurado + catálogos migrados + precarga bitácora

**Fecha:** 2026-04-23

### Completado

- **`Pagos.jsx` (Directora):** Eliminados arrays hardcoded `METODOS` y `TIPOS_CONCEPTO`. Migrados a `useCatalogo('metodos-pago')` y `useCatalogo('conceptos-pago')`. Props propagados a `ModalPago`, `ModalConceptos` y `FilaAlumno`.

- **`TurnoPuerta.jsx`:** Eliminado objeto `ROL_LABEL` hardcodeado. Migrado a `useCatalogo('roles-personal')` usando `rolMap[key]?.label`.

- **Menú semanal estructurado (BD + Backend + 3 portales):**
  - BD: nueva columna `dias_menu jsonb` en `menu_comida_semanal`
  - Backend `comidaController.js`: recibe, parsea y guarda `dias_menu`
  - `ServicioComida.jsx` (Directora): `ModalSubirMenu` reemplazado por grilla 5 días × 3 tiempos (desayuno, colación, comida) con selector de niveles expand/collapse. Default colación = Maternal (editable). Niveles cargados dinámicamente del backend. Preview estructurado en pantalla.
  - `Bitacora.jsx` (Maestra): precarga `que_comio` por día y nivel del alumno. Maternal ve 3 tiempos, Kinder ve 2 (sin colación). Indicador 📋 en campos precargados.
  - Menú existente (texto) se puede migrar al nuevo formato desde el modal — precarga `dias_menu` si ya existe.

### Datos de prueba creados
- Alumna: **Sofía Reyes Mendoza** — Grupo Maternal, comida confirmada y pagada semana 20-abr-2026
- Papá: `papa.sofia.maternal@happyschool.edu.mx` / `happy2024`

### Bugs detectados (→ Sesión 55)
- Dashboard miss → bitácora sin entrada: fix anterior no funciona, reaparece formulario de entrada
- Servicio Comida / Pagos: falta nivel del alumno y totalizados por método de pago

---

## ✅ SESIÓN 53 — Bugs post-FASE 3: bitácora directora + personal

**Fecha:** 2026-04-23

### Bugs corregidos

- **Personal.jsx — `/directora/personal` no cargaba:**
  - `ModalPersonal` y `TarjetaPersonal` referenciaban `ROLES` sin recibirla como prop → `ReferenceError`
  - Fix: prop `roles={ROLES}` pasada desde `DirectoraPersonal` a ambos componentes
  - Fix adicional: línea 429 usaba `r.value` en lugar de `r.key` en el filtro de roles

- **AlumnoPerfil.jsx — Bitácora directora sin datos:**
  - `ANIMO_LABEL`, `COMP_LABEL`, `CUANTO_LABEL`, `PANIAL_LABEL` usados pero no definidos (eliminados en FASE 3 de maestra sin actualizar directora)
  - Fix: agregado `useCatalogo` + `toMap()` en `BitacoraDirectora` para los 4 catálogos dinámicos
  - Fix: orden de alimentación con `.sort()` explícito (`desayuno→colación→comida→comida_extra`)
  - Fix: sección de incidentes agregada (estaba omitida — API sí la devolvía)
  - Fix: hora de medicamentos formateada con `toLocaleTimeString` (antes mostraba ISO completo)

- **personal.js — Tarjetas mostraban grupos de ciclos históricos:**
  - Query `GET /personal` no filtraba `asignaciones_grupo` por ciclo activo
  - Fix: subquery con `JOIN ciclos_escolares WHERE activo = true`

### Agregados a PENDIENTES (próximas sesiones)
- Dashboard maestra: card "Sin entrada por retardos acumulados"
- Dashboard papá: mostrar resultado del filtro de entrada (qué trajo / qué faltó)

---

## ✅ SESIÓN 52 — FASE 3 Hardcodeados + Bugs Bitácora

**Fecha:** 2026-04-23

### Implementado
- **Backend:** Endpoint `GET /catalogos/:tipo` centralizado con 11 catálogos (animo, comportamiento, cuanto-comio, tiempos-comida, condiciones-panial, niveles, roles-personal, estados-alumno, tipos-documento, metodos-pago, conceptos-pago)
- **Web:** Hook `useCatalogo` + `toMap()` utility. Migradas 5 pantallas: `Bitacora.jsx` (maestra), `Personal.jsx`, `Alumnos.jsx`, `Grupos.jsx`, `CiclosEscolares.jsx`
- **Fix:** Inconsistencia `kinder_1`/`kinder_2`/`kinder_3` → estandarizado a `kinder1`/`kinder2`/`kinder3`
- **Mobile:** `EXPO_PUBLIC_API_URL` en `.env`, `src/constants/catalogos.js` centralizado. Migradas 3 pantallas: bitacora padre, index padre, bitacora maestra
- **Fix timezone:** `SET timezone = 'America/Mexico_City'` en cada conexión del pool (`database.js`) para que `CURRENT_DATE` y `NOW()` siempre usen hora México
- **Fix bug datos cruzados entre alumnos:** `key={alumnoSeleccionado.id}` en `FormBitacora` — fuerza desmontaje al cambiar de alumno
- **Fix actividades lateral:** Quitado `mostrar` del `enabled` de la query `actividades-grupo` — ya carga sin necesidad de abrir el panel
- **Fix comidas no cargaban al re-entrar:** `useEffect([data, alumno.id])` para forzar re-ejecución al montar con caché

### Bugs corregidos en sesión
1. `ANIMOS is not defined` — catálogos declarados en componente padre, no en hijo (`FormBitacora`)
2. `PANIAL_LABEL[key]` retornaba objeto en lugar de string — faltaba `.label`
3. Datos de alumno anterior aparecían en el siguiente — faltaba `key` prop en `FormBitacora`
4. Tiempos de comida no cargaban al abrir bitácora — `useEffect` no se disparaba con datos de caché
5. Actividades del lateral no aparecían — `enabled: mostrar` impedía fetch en modo collapsed

---

## ✅ SESIÓN 51 — Inconsistencias Silenciosas FASE 2

**Fecha:** 2026-04-23

**Archivos modificados:**
- `mobile/app/(padre)/bitacora.jsx` (claves comportamiento)
- `mobile/app/(padre)/index.jsx` (claves ánimo)
- `mobile/app/(maestra)/bitacora.jsx` (emoji no_comio + esfínteres nivel_codigo)
- `web/src/pages/padre/Pagos.jsx` (semáforo de backend)
- `web/src/components/ui/Semaforo.jsx` (simplificar SemaforoPago)

**Tareas Completadas (5/5):**

| Tarea | Detalle |
|-------|---------|
| **#1 Comportamiento vacío padre mobile** | `excelente/bueno` → `muy_bien/bien` en `COMPORTAMIENTO` de bitacora.jsx. ENUM en BD es `muy_bien`, `bien`, `necesita_mejorar`. |
| **#2 Ánimo siempre 🤔 dashboard padre mobile** | Agregar `activo: '⚡'` e `irritable: '😤'`; remover `inquieto` y `energico`. Alineado con web-maestra. |
| **#3 Emoji No comió maestra mobile** | `no_comio: '✅'` → `no_comio: '❌'`. Semánticamente correcto — negación no éxito. |
| **#4 Esfínteres frágil maestra mobile** | Reemplaza `grupoNombre.toLowerCase().includes('kinder 1')` por `['maternal','prekinder','kinder1'].includes(nivelCodigo)`. Pasa `nivel_codigo` estructurado desde `SelectorAlumno`. |
| **#5 Semáforo pagos unificado** | `padre/Pagos.jsx`: usa `semaforo` del backend en lugar de calcular localmente por `saldo_pendiente`. `SemaforoPago.jsx`: simplificado a recibir `estado` string. Backend (`pagos.js` línea 32) es la fuente de verdad. |

**Commit:** `fix: Sesión 51 — FASE 2 inconsistencias silenciosas (5 fixes)` (5 files, 15 insertions, 24 deletions)

---

## ✅ SESIÓN 50 — Fixes Auditoría (Bugs Críticos FASE 1)

**Fecha:** 2026-04-23

**Archivos modificados:**
- `mobile/app/(padre)/index.jsx` (endpoint)
- `mobile/app/(maestra)/bitacora.jsx` (estructura comidas)
- `web/src/pages/directora/AlumnoPerfil.jsx` (qr_code_url + doc names)

**Tareas Completadas (4/4):**

| Tarea | Detalle |
|-------|---------|
| **#1 Dashboard padre mobile — endpoint incorrecto** | Cambiar `/alumnos?rol=padre` → `/alumnos/mis-hijos` (línea 94). Ajustar `.data.alumnos` → `.data` porque `/mis-hijos` devuelve array directo. El padre ahora verá ánimo, conducta e incidentes del hijo. |
| **#2 Comida mobile-maestra no llega al padre** | Reemplazar campos sueltos `que_comio`, `cuanto_comio`, `observaciones_comida` (líneas 238–240) por array estructurado `comidas: [{ tiempo: 'comida', que_comio, cuanto_comio, observaciones }]`. Backend solo procesa el array. |
| **#3 QR no aparece en perfil alumno** | Cambiar `alumno.qr_url` → `alumno.qr_code_url` (línea 577). Backend devuelve `qr_code_url` en la columna correcta. QR ahora visible en Directora. |
| **#4 Semáforo documentación siempre "incompleta"** | Alinear nombres en `TIPOS_DOC` y `DOC_REQUERIDOS`: `cartilla_vacuna` → `cartilla_vacunacion`, `foto_3x4` → `foto_escolar` (líneas 8–19). Alineación con BD resuelve mismatch silencioso. |

**Commits:**
- `fix: Sesión 50 — 4 bugs críticos de auditoría` (3 files, 18 insertions, 15 deletions)
- `chore: Sesión 50 — FASE 1 bugs críticos completada, preparar Sesión 51`

---

## ✅ SESIÓN 48 — Auditoría de Inconsistencias y Hardcodeados

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **Auditoría completa web + mobile** | Revisión exhaustiva de los 131 archivos del proyecto: portales Maestra, Directora, Papá web y Papá mobile. |
| **Inventario de bugs críticos** | Identificados 4 bugs que rompen funcionalidad hoy: endpoint incorrecto en dashboard padre mobile, comida mobile-maestra que no llega al padre, QR nunca visible en perfil, semáforo de documentación siempre "incompleta". |
| **Inventario de inconsistencias silenciosas** | Identificadas 5 inconsistencias donde datos se muestran incorrectos: comportamiento vacío en padre mobile (claves distintas), ánimo siempre 🤔 en dashboard padre mobile, emoji ✅ para "No comió", lógica de esfínteres frágil, semáforo de pagos con 3 lógicas distintas. |
| **Inventario de hardcodeados** | Identificados 16 catálogos duplicados entre portales: niveles, roles, estados alumno, emojis bitácora, tiempos comida, condiciones pañal, tipos documento, métodos pago, conceptos pago, parentescos, etc. IP hardcodeada en mobile. |
| **Plan documentado en PENDIENTES.md** | Sesión 48 organizada en 3 fases con archivos y líneas exactas para cada fix. |

**Sin código modificado esta sesión — solo auditoría y planeación.**

---

## ✅ SESIÓN 47 — Portal Papá: UI + Histórico

**Fecha:** 2026-04-22

**Archivos modificados:**
- `web/src/pages/padre/Dashboard.jsx` (HijoCard enhancement)
- `mobile/app/(padre)/index.jsx` (HijoCard enhancement)
- `backend/src/routes/alumnos.js` (bug fixes)

**Tareas Completadas (6/6):**

| Tarea | Detalle |
|-------|---------|
| **#1 Orden comida en bitácora** | Mostrar Desayuno, Colación, Comida, Comida Extra en orden correcto. Implementado en web/maestra/Bitacora.jsx → propagado a padre/web, padre/mobile, directora. |
| **#2 Próximos 3 días + modal evento** | Dashboard padre muestra eventos próximos con modal interactivo. Implementado en web Dashboard y mobile index con `proximos3Dias()` helper y `ModalEvento` component. |
| **#3 HijoCard dashboard enhancement** | Ánimo + conducta lado a lado (mismo tamaño), alertas fiebre 🌡️ + incidentes ⚠️ en grilla 2x2, notas maestra en yellow. Implementado en web + mobile. |
| **#4 Orden de recibos** | Ya estaba implementado (mes actual → Ver Todos → meses anteriores DESC). |
| **#5 Validación estatus pagos** | Ya estaba implementado (verde solo si saldo_pendiente === 0). |
| **#6 Lógica avance bitácora** | Ya estaba implementado ("En curso" + "Finalizada"). |

**Bugs Arreglados:**
1. Tabla `incidentes_alumno` → `incidentes` en GET /alumnos/mis-hijos (SELECT subquery)
2. Orden de rutas Express: `/mis-hijos` ANTES de `/por-qr/:qrData` (ambas antes de `/:id`)
3. Node.js no recargaba código en Windows → resolvió matando procesos manualmente

**Aprendizajes Documentados:**
- `feedback_emoji_consistency.md` — Emoji fuente de verdad en maestra/Bitacora.jsx
- `feedback_ruta_order_express.md` — Static routes BEFORE parameterized (reconfirmado)

**Próximo Pendiente:**
- 📂 Histórico por ciclo escolar en dashboard padre (ver ciclos pasados)

---

## ✅ SESIÓN 46 — Actividades: Debugging rutas + autorización

**Fecha:** 2026-04-22

**Archivos modificados:**
- `backend/src/routes/bitacora.js` (route ordering, authorization, query parameters)
- `.claude/settings.json` (hooks para auto-restart de servidores)

**Tareas Completadas (1/1):**

| Tarea | Detalle |
|-------|---------|
| **Debugging actividades completo** | GET /bitacora/actividades-grupo → 500 error (ruta interpretada como :alumnoId UUID). Solución: mover ruta estática ANTES de :alumnoId. POST /bitacora/actividades-grupo → 403 Forbidden (authorize middleware con roles no coincidentes). Solución: cambiar a authenticate (cualquier usuario logueado). Parámetros query duplicados → corregir [alumnoId, alumnoId, fecha] a [alumnoId, fecha]. |

**Bugs Arreglados:**
- Express route ordering: static routes ANTES de parameterized routes
- Authorization middleware: role names must match DB exactly
- Query parameters: no duplicar variables en arrays

**Aprendizajes Documentados en memory/:**
- `feedback_servidor_restart.md` — Protocol: restart + validate with curl
- `feedback_ruta_order_express.md` — Express routing best practice
- `feedback_authorize_middleware.md` — Authorization role names from DB

**Impacto:** Feature "actividades múltiples" 100% funcional. End-to-end: maestra captura → alumno participa → papá ve → directora consulta. Listo para UI improvements en Sesión 47.

---

## ✅ SESIÓN 45 — Actividades múltiples: Captura grupo + participación alumno

**Fecha:** 2026-04-22

**Archivos modificados:**
- `backend/migrations/022_actividades_grupo.sql` (nuevo)
- `backend/src/routes/bitacora.js`
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/padre/Bitacora.jsx`
- `web/src/pages/directora/AlumnoPerfil.jsx`

**Tareas Completadas (7/7):**

| Tarea | Detalle |
|-------|---------|
| **Arquitectura BD nueva** | 2 tablas: `actividades_grupo` (catálogo del día por grupo) + `actividades_alumno` (participación individual). Maestra captura UNA SOLA VEZ, alumnos se seleccionan en bitácoras. |
| **Endpoints backend (3 nuevos)** | GET actividades-grupo (listar), POST actividades-grupo (capturar con fotos Cloudinary), POST actividades-alumno (guardar participación, auto-crea bitácora si falta). GET bitácora modificado para devolver actividades con participación. |
| **Panel Maestra — Captura** | Sección colapsable "🎨 Actividades del día" en sidebar. Array dinámico: textarea descripción + input foto por actividad. Guardar independiente. |
| **Sección Bitácora — Participación** | Tarjetas de actividades grupo (foto si tiene + descripción). 3 botones por actividad: ✓ Sí, ✗ No, — Sin registrar. Guardado independiente con API call. |
| **Portal Papá — Tarjetas actividad** | Sección "🎨 Actividades" muestra tarjetas con foto + badge verde ✓/rojo ✗ de participación. Elimina galería separada. Flujo limpio por actividad. |
| **Portal Directora — Lista compacta** | AlumnoPerfil Bitácora: nueva sección actividades con miniatura foto + badge. Layout vertical, no interfiere. |
| **Backward compatibility** | GET bitácora devuelve `actividades` con mismo shape para datos nuevos y fallback legacy. Sin cambios en endpoints existentes. |

**Impacto:** Arquitectura escalable y eficiente. Maestra no escribe actividades N veces (una por alumno), solo una vez. Papá y Directora ven datos visuales con participación clara por actividad. Sistema extensible para futuras mejoras (recurrencias, asignación a sub-grupos, etc).

---

## ✅ SESIÓN 44 — UI Mejoras Portal Maestra

**Fecha:** 2026-04-22

**Archivos modificados:**
- `backend/src/routes/asistencia.js`
- `web/src/pages/maestra/Asistencia.jsx`
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/maestra/FiltroEntrada.jsx`
- `web/src/pages/maestra/FiltroSalida.jsx`

**Tareas Completadas (3/3):**

| Tarea | Detalle |
|-------|---------|
| **Navegación prev/next de fechas** | Agregada en FiltroEntrada, FiltroSalida y Asistencia. Botones ChevronLeft/Right + modo solo lectura para días pasados. Backend acepta `?fecha=YYYY-MM-DD` en rutas filtro-entrada y filtro-salida. |
| **Emojis Bitácora** | Escala visual de comida cambiada de `🍽️🥢🍱🚫` a `😋😊😐❌` para hacerlos más intuitivos en campo CUANTO. |
| **Múltiples actividades por día** | Array dinámico en Bitácora: agregar, eliminar, guardar y recargar sin pérdida. Serializado con `\n`. Compatibilidad hacia atrás con formato anterior. |

**Impacto:** Portal Maestra más usable — navegación fluida entre fechas sin regresar al menú, emojis de comida más claros, actividades sin límite de una por día.

---

## ✅ SESIÓN 43 — UI Mejoras Portal Directora

**Fecha:** 2026-04-22

**Archivos modificados:**
- `web/src/pages/directora/Pagos.jsx`
- `web/src/pages/directora/ServicioComida.jsx` (nuevo)
- `web/src/pages/directora/TurnoPuerta.jsx`
- `web/src/layouts/DirectoraLayout.jsx`
- `web/src/App.jsx`
- `backend/src/routes/turnos-puerta.js`
- `backend/migrations/021_turno_puerta_tipo.sql` (nuevo)
- `backend/run-migration.js` (nuevo — helper reutilizable)

**Tareas Completadas (3/3):**

| Tarea | Detalle |
|-------|---------|
| **Pagos — Selector Grupo → Alumno** | ModalPago global reemplaza select plano con flujo Grupo → Alumno. Preview de recargo estimado + total antes de registrar (misma lógica del backend). |
| **Servicio de Comida unificado** | Nueva página `/directora/comida` con tabs Pagos / Menú. Tab Pagos: 3 cards (Confirmados, Pagados con desglose transf/efect, Sin pagar) + lista alumnos dividida en Semana completa vs Días específicos. Tab Menú: imagen/PDF + subir menú desde modal. Antiguas rutas `comida-menu` y `comida-pagos` redirigen a `/directora/comida`. Nav sidebar colapsado a 1 item. |
| **Turno Puerta ENTRADA/SALIDA** | Migración BD 021: columna `turno` + constraint única por `(fecha, personal_id, turno)`. Tabs Entrada (☀️) / Salida (🌙) independientes. Checkbox "Por semana" para asignar los 5 días de una vez. La misma Miss puede tener ambos turnos el mismo día. |

**Bugs corregidos:**
- `ComidaPagos.jsx` usaba claves inexistentes del backend (`stats.pagado_count`). `ServicioComida.jsx` usa las claves correctas (`stats.pagados.total`, `stats.sin_verificar.total`).
- `ComidaPagos.jsx` leía `conf.nombre_alumno` (undefined). `ServicioComida.jsx` usa `conf.nombre_completo`.

**Impacto:** Portal Directora más usable — selector de alumno intuitivo por grupo, comida unificada en una sola vista con tabs, turno de puerta con distinción entrada/salida.

---

## ✅ SESIÓN 42 — Bug Fix: Bitácora + Automatización Servidores

**Fecha:** 2026-04-22

**Archivos modificados:** 
- `web/src/pages/maestra/Bitacora.jsx` (línea 741-743)
- `.claude/settings.json` (hooks PostToolUse)

**Tareas Completadas (2/2):**

| Tarea | Detalle |
|-------|---------|
| **Bug: Bitácora sin validación entrada** | Filtro: solo mostrar alumnos con `estado_asistencia IN ('presente', 'retardo')`. Alumnos ausentes ya no aparecen en selector de bitácora. |
| **Automatización servidores** | Hooks PostToolUse en `.claude/settings.json`: reinicia Web (puerto 5173) al editar `/web/src/**`, reinicia Backend (puerto 5000) al editar `/backend/src/**`. Procesos asincronos, sin bloqueos. |

**Cambios clave:**
- Línea 741: `const alumnos = (grupo?.alumnos \|\| []).filter(a => ['presente', 'retardo'].includes(a.estado_asistencia))`
- Hook Web: mata proceso puerto 5173, inicia `npm run dev`
- Hook Backend: mata proceso puerto 5000, inicia `npm run dev`
- Script PowerShell: `kill_and_restart_server.ps1` — limpia puerto + inicia servidor

**Impacto:** Evita errores lógicos (bitácora de alumno sin entrada) + acelera desarrollo (no manual restart).

**Protocolo cierre sesión registrado:** Actualizar PENDIENTES → ARCHIVE_LOG + commit automático.

---

## ✅ SESIÓN 41 — Dashboard Directora Unificado

**Fecha:** 2026-04-22

**Archivos modificados:** `web/src/pages/directora/Dashboard.jsx`

**Tareas Completadas (6/6):**

| Tarea | Detalle |
|-------|---------|
| **Asistencia por grupo — Modal** | Cards clickeables (grid 5 cols) → modal overlay con lista de alumnos, estado (presente/retardo/no_entrada/ausente), hora entrada, avatar. Fetch `GET /asistencia/grupo/:id?fecha=hoy` al abrir. |
| **Emoji ⚠️ con tooltip** | Agregado `title="Menos del 80% de alumnos presentes"` cuando presentes < total * 0.8 |
| **Maternal sin asistencia** | Emoji ⬜ cuando `total === 0` (sin alumnos inscritos) |
| **Documentación Incompleta — Cards** | Reemplazo acordeón por grid cards (5 cols). Agrupa por grupo. Clic → modal con lista de alumnos sin docs. Header muestra número de alumnos. |
| **Retardos del Mes — Cards** | Reemplazo acordeón por grid cards (5 cols). Agrupa por grupo. Clic → modal con lista de alumnos + contador retardos. Borde/fondo rojo si hay alumno con ≥3 retardos. |
| **Salidas registradas hoy — Cards** | Reemplazo acordeón por grid cards (5 cols). Clic → modal con lista de salidas. Header muestra número de salidas. Chips de alerta inline (🚨 no autorizadas, ⚠️ anticipadas). |
| **Unificación visual** | Las 4 secciones principales (Asistencia, Salidas, Documentación, Retardos) ahora comparten diseño de cards clickeables + modales. Consistencia 100%. |

**Nuevos componentes:**
- `FilaModal` — fila individual en modal de asistencia
- `ModalAsistenciaGrupo` — modal overlay asistencia por grupo
- `ModalSalidasGrupo` — modal overlay salidas por grupo
- `ModalDocumentacionGrupo` — modal overlay documentación por grupo
- `ModalRetardosGrupo` — modal overlay retardos por grupo
- Función `agruparPorGrupo()` — reutilizable para agrupar listas por grupo
- Constante `ESTADO_STYLE` — estilos para estados de asistencia

**Bugs corregidos en el proceso:**
- Valores del backend como strings (`'0'`, `'031'`) → conversión a número con `parseInt()` antes de comparaciones
- `a.retardos` era string `"031"` (concatenaba en lugar de sumar) → fix: `parseInt(a.retardos || 0)` en reduce
- Modal necesitaba `stopPropagation()` para cerrar solo al clic en overlay, no en contenedor interno

**Pendiente para sesión 42:**
- Modal Pagos (Directora) — selector de grupo + buscador alumno
- Servicio de Comida unificado
- Turno Puerta configuración SALIDA
- Mejoras Portal Maestra (navegación días, emojis bitácora)
- Mejoras Portal Papá (orden bitácora, recibos, validación pagos)
- Notificaciones globales (campanita + modal)

---

## ✅ SESIÓN 40 — UI Mejoras Portal Directora (Parte 1)

**Fecha:** 2026-04-22

**Archivos modificados:** `Semaforo.jsx`, `Grupos.jsx`, `Alumnos.jsx`, `Asistencia.jsx`, `Pagos.jsx`, `Dashboard.jsx`, `index.css`

| Tarea | Detalle |
|-------|---------|
| **Semaforo.jsx** | Badge "Incompleta" → "Documentación Incompleta" |
| **Grupos.jsx — Bug cupo_maximo** | Form usaba `capacidad_maxima` (undefined); corregido a `cupo_maximo` — los valores ahora persisten correctamente al editar |
| **Grupos.jsx — Ciclo activo** | Badge `📅 {cicloActualData}` en encabezado — dato ya venía del backend pero no se renderizaba |
| **Grupos.jsx — Sufijos** | Placeholder mejorado + helper text "Usa sufijos A, B, C" cuando nivel es Kinder 1/2/3 |
| **Alumnos.jsx — Tabs por nivel** | Select de grupo reemplazado por tabs dinámicos derivados del backend. Filtrado por nivel en cliente con `useMemo` |
| **Alumnos.jsx — Iconos visibles** | Removido `opacity-0 group-hover:opacity-100` — iconos siempre visibles |
| **Asistencia.jsx — Orden grupos** | Tabs de grupos ordenados por nivel de aparición en el backend (no hardcodeado) |
| **Asistencia.jsx — Navegación días** | Botones `‹ ›` navegan entre días hábiles, saltando sábado/domingo automáticamente. Fecha parseada con `T12:00` para evitar desfase UTC |
| **Asistencia.jsx — Scrollbar** | Clase `.scrollbar-hidden` en vista mensual — barra morada ya no aparece |
| **Pagos.jsx — Tabs por nivel** | Select de grupo reemplazado por tabs dinámicos derivados del backend. Filtrado usando mapa `grupoNombre→nivel` |
| **Dashboard.jsx** | Sección "Horarios Configurados" eliminada (no era dashboard). `useQuery` de config-horarios y `import Settings` removidos |

**Pendiente para sesión 41:**
- Dashboard: Clic en tarjeta Asistencia → modal detalle + clarificar ⚠️
- Dashboard: Documentación Incompleta agrupada por grupo con acordeón
- Dashboard: Retardos del Mes agrupados por grupo con acordeón
- Pagos: ModalPago global — selector de grupo + buscador de alumno

**Bugs corregidos en el proceso:**
- Niveles hardcodeados en frontend (`maternal`, `kinder_1`) no coincidían con BD (`"Maternal"`, `"Kinder 1"`)
- `new Date("YYYY-MM-DD")` parsea en UTC → `getDay()` devuelve día anterior en timezone México. Fix: usar `T12:00`

---

## ✅ SESIÓN 39 COMPLETADA — Sprint 3 Finalizado

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **Portal Papá — Bitácora** | Selector de ciclos anteriores + navegación por rango de fechas con `GET /alumnos/:id/ciclos` + `GET /bitacora/:id/rango`. Historial completo funcional. |
| **Portal Papá — Pagos** | Agrupación por año/ciclo con encabezados visuales. Recibos ordenados (actual primero, históricos descendente). |
| **Limpieza BD + CURP** | Duplicados Ana García eliminados (soft-delete), CURP obligatoria implementada, validación en backend y seed. |
| **Testing validado** | Historial ciclos y pagos probados en browser. Navegación fluida confirmada. |

**Sprint 3 cerrado:** Funcionalidad de historial por ciclo completamente operativa en ambos portales.

---

## ✅ SESIÓN 39 INICIO — Limpieza de BD + Validación CURP

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **D) Eliminar test_ciclos.js** | Archivo de prueba E2E temporal (sesión 36) eliminado. |
| **C) Limpiar duplicados Ana García López** | 3 registros sin CURP eliminados (soft-delete). Canónico con CURP `GALA220315MDFRLNA1` mantiene relaciones. |
| **Migración CURP obligatoria** | `backend/migrations/020_curp_required_alumnos.sql` — valida que todos los alumnos activos tengan CURP. |
| **Validación backend** | `backend/src/controllers/alumnosController.js` — CURP obligatoria al crear alumnos (retorna 400 si falta). |
| **Script limpieza** | `backend/src/database/fix_duplicados_ana.js` — procesó 26 tablas con `alumno_id`, reasignó relaciones. |
| **Guard seed.js** | `backend/src/database/seed.js` — búsqueda por CURP previene reinserción de duplicados. |

**Prevención futura:**
- CURP como llave de identidad (no nombre)
- Constraint UNIQUE parcial en BD ya existente (`002_unique_constraints.sql`)
- Backend rechaza alumnos sin CURP
- Seed verifica por CURP antes de insertar

---

## ✅ SESIÓN 38 — 5 Bugs Críticos Resueltos

**Fecha:** 2026-04-22

| Bug | Archivo | Fix |
|-----|---------|-----|
| Duplicado $$ en tabla Comida | `web/src/pages/directora/ComidaPagos.jsx:164` | Removido `$` literal extra en template string |
| Orden alimentación bitácora papá | `web/src/pages/padre/Bitacora.jsx:346` | Sort por `['desayuno','colacion','comida','comida_extra']` antes del filter |
| Configuración no carga horarios | `web/src/pages/directora/Configuracion.jsx:54` | Eliminado `onSuccess` deprecado (React Query v5); usa `configData` del hook con `valores ?? configData?.horarios` |
| Calendario filtro por rol padre | `backend/src/routes/calendario.js:60` | Subquery server-side que filtra por grupos del hijo del padre logueado |
| Firma incidentes — Invalid api_key | `backend/src/routes/bitacora.js:427` | Guardado base64 directo en BD; eliminada dependencia de Cloudinary para firmas |

**También en esta sesión:**
- Protocolo "Inicia sesión" / "Cierra sesión" documentado en CONTEXT.md
- Mejora memoria: Claude siempre inicia backend + web (no Valeria)

---

## 🔑 REFERENCIA RÁPIDA

### Credenciales de prueba (contraseña: `HappySchool2026!`)
| Rol | Email |
|-----|-------|
| Directora | directora@happyschool.edu.mx |
| Administrativo | admin@happyschool.edu.mx |
| Maestra Maternal | maternal@happyschool.edu.mx |
| Maestra Prekinder | prekinder@happyschool.edu.mx |
| Maestra Kinder 1 | kinder1@happyschool.edu.mx |
| Maestra Kinder 2 | kinder2@happyschool.edu.mx |
| Maestra Kinder 3 | kinder3@happyschool.edu.mx |
| Padre (Ana García López) | padre@happyschool.edu.mx |

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| directora | Todo |
| administrativo | Financiero |
| maestra_titular | Solo su grupo |
| maestra_especial | Grupos y días asignados |
| maestra_puerta | Solo entrada/salida |
| padre | Solo sus hijo(s) |

### Estructura del Monorepo
```
APP-KINDER/
├── ARCHIVE_LOG.md / PENDIENTES.md
├── backend/
│   ├── migrations/        001_schema_inicial.sql … 016_cobro_extension_config.sql
│   ├── src/
│   │   ├── controllers/   authController.js, alumnosController.js, comidaController.js
│   │   ├── middleware/     auth.js, errorHandler.js, validateRequest.js
│   │   ├── routes/        index.js + 16 módulos completos
│   │   ├── services/      cloudinaryService, whatsappService, qrService
│   │   ├── jobs/          comidaJobs.js (cron lunes 8:31 AM)
│   │   └── database/      seed.js, seed_datos_reales.js, seed_semana_13_17_abril.js
│   └── .env               (no en git — credenciales reales)
├── web/
│   └── src/pages/
│       ├── directora/     Dashboard, Alumnos, AlumnoPerfil, Grupos, Personal,
│       │                  Pagos, Calendario, CiclosEscolares, TurnoPuerta,
│       │                  ComidaMenu, ComidaPagos, Configuracion
│       ├── maestra/       Dashboard, FiltroEntrada, FiltroSalida, Asistencia, Bitacora
│       └── padre/         Dashboard, Bitacora, Pagos, Calendario, ComidaSemanal
└── mobile/
    └── app/
        ├── (maestra)/     index, asistencia, bitacora, galeria, qr-scanner
        └── (padre)/       index, bitacora, pagos, calendario, comida
```

---

## 📋 HISTORIAL POR SESIÓN (reciente → antiguo)

---

### ✅ SESIÓN 37 — Historial por Ciclo Escolar: Sprint 1+2 (2026-04-21)

#### Backend — 5 endpoints nuevos/modificados
- `GET /alumnos?ciclo_id=<uuid>` — Cuando llega `ciclo_id`, usa `inscripciones` como fuente en lugar de `alumnos.grupo_id` directo. Sin `ciclo_id` → comportamiento original sin cambios. `backend/src/controllers/alumnosController.js`
- `GET /alumnos/:id/ciclos` — Devuelve todos los ciclos en que estuvo inscrito un alumno desde tabla `inscripciones`. `backend/src/routes/alumnos.js`
- `GET /bitacora/:alumnoId/rango?fecha_inicio=&fecha_fin=` — Listado de días con resumen por día (estado_animo, comportamiento, notas, maestra). Detalle del día sigue con `?fecha=`. `backend/src/routes/bitacora.js`
- `GET /reportes/dashboard?ciclo_id=<uuid>` — Queries hardcodeadas a `activo = true` ahora usan `COALESCE($ciclo_id::uuid, SELECT id WHERE activo = true)`. `backend/src/routes/reportes.js`
- `GET /grupos` — Para ciclos históricos, `total_alumnos` se calcula desde `inscripciones` (subquery correlacionado). `backend/src/routes/grupos.js`

#### Frontend — Directora
- `SelectorCiclo.jsx` — Componente reutilizable. Muestra "📅 Ciclo actual" + lista históricos. `web/src/components/ui/SelectorCiclo.jsx`
- `Grupos.jsx` — Banner amarillo "📚 Modo solo lectura" + botón nuevo deshabilitado + ✏️ oculto en histórico. `web/src/pages/directora/Grupos.jsx`
- `Alumnos.jsx` — Al cambiar ciclo: limpia filtros, pasa `ciclo_id`, modo solo lectura. `web/src/pages/directora/Alumnos.jsx`

#### Restauración de BD (datos de prueba)
- BD restaurada a **2025-2026 activo**: 18 alumnos con grupos correctos.
- **2026-2027 inactivo**: 10 egresados/bajas (datos del test E2E sesión 36).
- 4 inscripciones con `grupo_id IS NULL` → asignadas a Kinder 3 en 2026-2027.
- **Pendiente sesión 38:** Ana García López tiene 3 registros duplicados en `alumnos`.

#### Bugs resueltos
- **Import named vs default:** `SelectorCiclo` importaba `{ api }` pero `api.js` exporta `default` → cambiar a `import api from`.
- **Estado inicial `inscrito`:** al cambiar al ciclo histórico, filtro `estado='inscrito'` devolvía 0 resultados → `handleCicloChange` resetea `estadoFiltro` a `''`.
- **Botón ✏️ no ocultado:** `TarjetaGrupo`/`TarjetaAlumno` no recibían prop `soloLectura` → pasar prop y envolver en `{!soloLectura && ...}`.
- **total_alumnos = 0 en histórico:** contaba con `alumnos.grupo_id` directo ya movido → subquery correlacionado en `inscripciones`.
- **Maestras sin titular:** al copiar grupos en promoción, todas con `es_titular = false` → marcada la primera por grupo como `es_titular = true` en BD.

---

### ✅ SESIÓN 36 — E2E Promoción + Panel Configuración Grupos (2026-04-21)

#### Funcionalidades completadas
- Test E2E promoción de ciclo escolar — flujo completo validado en BD.
- **Panel selección de grupos** al copiar: checkbox por grupo, nombre editable, "+ Agregar grupo nuevo".
- **Backend `copiar-grupos-del-anterior` mejorado** — acepta body `{ grupos: [...] }` selectivo. Sin body → copia todo. Borra grupos previos del ciclo destino antes de copiar.
- **Selector dinámico de grupo destino en Paso 2** — cuando un nivel tiene múltiples grupos (ej: K2A y K2B), muestra `<select>`.
- **Lógica de estados corregida** — Kinder 3: "🎓 Egresado" fijo. Resto: selector Reinscrito/Baja (sin Egresado).
- **Botón "Reconfigurar grupos"** — visible siempre en Paso 1 una vez seleccionado ciclo destino.
- **Contadores actualizados** — "X promovidos | 🎓 Y egresados | ❌ Z bajas".

#### Resultado verificado en BD
- Ciclo 2026-2027: ACTIVO con 6 grupos. 20 alumnos reinscitos | 5 egresados | 3 bajas.

#### Archivos modificados
- `web/src/pages/directora/CiclosEscolares.jsx`
- `backend/src/routes/ciclos.js`

#### Bugs resueltos
- **Stale closure en `setTimeout`:** `handleSeleccionarDestino(cicloDestino)` usaba valor viejo → construir `destinoActualizado` y pasar directo.
- **`nombre_destino` undefined:** `gruposParaEditar[g.id]` era `undefined` si no se tocó el input → usar `gruposParaEditar[g.id] ?? g.nombre`.
- **Grupos sucios al re-copiar:** endpoint acumulaba duplicados → `DELETE FROM asignaciones_grupo / grupos WHERE ciclo_id = $1` al inicio de cada transacción.
- **401 en GET /grupos:** access token 15min expiraba durante flujo largo del modal (stale closure impedía al interceptor actuar).

---

### ✅ SESIÓN 35 — Indicador "X niños comen hoy" en Dashboards (2026-04-21)

- **Dashboard Miss:** Indicador "🍽️ X niños comen hoy" en verde antes de lista de confirmaciones. Filtra `pago_verificado = true` por día actual. Considera `semana_completa` y `dias_seleccionados.includes(diaHoy)`. Se oculta fines de semana. `web/src/pages/maestra/Dashboard.jsx`
- **Dashboard Directora:** Mismo indicador verde destacado sobre el total semanal. `web/src/components/directora/BannerComidaHoy.jsx`
- Array de nombres de días: `['Domingo', 'Lunes', ...]` en lugar de abreviados.

---

### ✅ SESIÓN 34 — Corrección Duplicados de Grupos (2026-04-21)

- **Root cause:** `GET /grupos` sin `ciclo_id` devolvía grupos de todos los ciclos.
- **Fix `grupos.js`:** sin `ciclo_id`, WHERE incluye `AND g.ciclo_id = (SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1)`.
- **Fix `reportes.js`:** query `asistenciaPorGrupo` filtra por ciclo activo.
- **Fix `pagos.js`:** resumen de pagos por grupo filtra por ciclo activo.
- **Validado:** GET /grupos, GET /reportes/dashboard y GET /pagos devuelven exactamente los 6 grupos del ciclo 2025-2026.

---

### ✅ SESIÓN 33+ — Limpieza y Reestructuración de Grupos 2025-2026 (2026-04-20)

- **Problema:** Ciclo 2025-2026 con grupos incorrectos/duplicados. Necesitaba: Maternal, Prekinder, Kinder 1A, Kinder 1B, Kinder 2, Kinder 3.
- **Restricción crítica:** Datos históricos de semana 13-17 abril referencian UUIDs hardcodeados en seed → NO se pueden eliminar grupos, solo RENOMBRAR.
- **Script `fix_grupos_2025_2026.js`** (transacción atómica, idempotente): renombra, crea K1B, soft-delete sobrantes, índice parcial.
- **Backend:** endpoint `DELETE /:id` (soft-delete) en grupos.js. `preview-promocion` usa LATERAL + LIMIT 1 para evitar duplicados con múltiples grupos por nivel.
- **Seeds actualizados:** `seed.js`, `seed_datos_reales.js`, `seed_semana_13_17_abril.js`.
- **Índice parcial:** `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` — permite soft-delete sin bloquear futuros nombres iguales.

#### Bugs resueltos
- **Índice UNIQUE con `deleted_at`:** bloqueaba recrear grupo con mismo nombre → recrear como índice parcial.
- **Preview duplicados con múltiples grupos mismo nivel:** LEFT JOIN retornaba filas duplicadas → LATERAL con LIMIT 1.

---

### ✅ SESIÓN 32 — Ciclos Escolares: Crear, Cierre y Promoción (2026-04-20)

- **Backend CRUD completo:** `GET /ciclos`, `POST /ciclos`, `GET /ciclos/:id/preview-promocion`, `POST /ciclos/:id/ejecutar-promocion`. Archivo: `backend/src/routes/ciclos.js`
- **Lógica de promoción automática:** Maternal→Prekinder→K1→K2→K3→Egresado.
- **Web `CiclosEscolares.jsx`:** Tabla de ciclos + modal nuevo ciclo + flujo 3 pasos (seleccionar destino → tabla editable → confirmar).
- **Integración:** Ruta en `App.jsx`, enlace en sidebar con ícono `Clock`.

#### Bugs resueltos
- Import `pool` → cambiar a `{ query, getClient }`.
- `getPool()` no existe → usar `getClient()`.
- Parámetro `alumno_id` vs `id` → aceptar ambos con `alumno_id || id`.
- Sincronización: necesitó 3 restarts de backend.

---

### ✅ SESIÓN 31 — Sincronización Web-Mobile Comida + Cleanup (2026-04-20)

- **Mobile comida:** `cargarDatos()` extraída fuera de `useEffect` para ser reutilizable post-confirmación.
- **Sincronización:** Web (`ComidaSemanal.jsx`) y Mobile (`comida.jsx`) llaman al mismo backend.
- **Database cleanup:** 3 duplicados de Ana García López eliminados. Dejado 1 válido con CURP `GALA220315MDFRLNA1`.
- **Migración 016:** clave `hora_inicio_cobro_extension = '15:06'` en `configuracion_general`.
- **Cobros extensión de horario:** Pausado — timezone issues complejos UTC vs America/Mexico_City. Revertido a estado limpio.

---

### ✅ SESIÓN 30 — Dashboard Maestra: Confirmaciones Comida (2026-04-20)

- **Backend:** `GET /comida/confirmaciones` acepta `grupo_id` opcional. Devuelve solo `pago_verificado = true`.
- **Dashboard Maestra:** Sección "🍱 Confirmaciones" con nombre alumno + modalidad. Refetch cada minuto.
- **Función `getLunesActual()`:** cálculo manual `YYYY-MM-DD` sin `toLocaleDateString` (inconsistente por zona horaria).

---

### ✅ SESIÓN 29 — Dashboard Directora + Validación Job Cron (2026-04-20)

- **Job cron 8:31 AM:** Verificado en `backend/src/jobs/comidaJobs.js`. Cron `31 8 * * 1`, zona horaria México, busca confirmaciones sin pago, actualiza a cancelado, envía WhatsApp.
- **Backend `GET /comida/confirmaciones`:** Estructura jerárquica `{ pagados: { total, transferencia, efectivo }, sin_verificar: {...} }`.
- **BannerComidaHoy.jsx:** Rediseño compacto horizontal.
- **`seed_comida_pagos_demo.js`:** 3 registros para semana actual.

#### Bugs resueltos
- Procesos Node viejos devolvían endpoint antiguo → `kill -9` y reiniciar.

---

### ✅ SESIÓN 28 — FASE 6.9 Control de Pagos Comida (2026-04-20)

- **`ComidaPagos.jsx` (NUEVO):** Panel control pagos semanal, navegación anterior/siguiente semana, toggle ✅ Pagado / ❌ No Pagó. `web/src/pages/directora/ComidaPagos.jsx`
- **`FiltroEntrada.jsx`:** Toggle "✅ Pago verificado" / "❌ No pagó - Cancelar" al registrar entrada.
- **HTTP Cache fix:** Middleware desactiva ETags/Cache-Control para `/api/` (no-store, no-cache, must-revalidate).
- **Rutas:** `/directora/comida-pagos` y `/admin/comida-pagos` (reutilizado).

#### Bugs resueltos
- **HTTP 304 Not Modified:** Navegador cacheaba GET `/comida/confirmaciones` → middleware deshabilita cache.
- **json_agg omitía campos NULL:** cambiar a SELECT directo con campos explícitos.
- **Navegación de semanas rota:** parsear `semanaInicio` correctamente antes de sumar/restar días.

---

### ✅ SESIÓN 27 — FASE 6.9 Indicador de Comedor (2026-04-20)

- **Migraciones 014 y 015:** Tablas `control_comida_semanal` y `menu_comida_semanal`.
- **Backend rutas `/comida/*` completas:** GET menu, POST/DELETE menu, GET confirmaciones, POST/GET/PUT confirmación, PUT verificar-pago, PUT cancelar.
- **`comidaController.js`:** Lógica completa con Cloudinary.
- **Job cron lunes 8:31 AM:** `procesarComidaNoPagada()` en `backend/src/jobs/comidaJobs.js`.
- **Web papá `ComidaSemanal.jsx`:** Menú semanal, formulario confirmación, selector modalidad (semana $250 | días $50), método pago.
- **Web directora `ComidaMenu.jsx`:** Crear/editar menú semanal + PDF a Cloudinary.
- **Web maestra `FiltroEntrada.jsx`:** Checkbox verificación pago comida.
- **Mobile papá `comida.jsx`:** Pantalla confirmación semanal React Native.

#### Bugs resueltos
- **Import error `comidaController.js`:** `../database/db` → `../config/database`.
- **Variable shadowing:** local `query` string sobrescribía `query` importado → renombrar a `sql`.
- **auth middleware no exportaba `verifyToken`:** agregar `verifyToken: authenticate`.
- **Navbar emoji 🍽️** → lucide-react `UtensilsCrossed`.

---

### ✅ SESIÓN 26 — FASE 6.8 Bitácora 4 Tiempos (2026-04-19)

- **Migración 013:** Columna `tiempo` en `registro_comida` (desayuno, colacion, comida, comida_extra). Constraint único `(alumno_id, fecha, tiempo)`.
- **Backend:** `GET /bitacora/:alumnoId` retorna `comida` como array. `POST /guardar` acepta array `comidas` con upsert por `(alumno_id, fecha, tiempo)`.
- **Fix duplicados:** `DISTINCT ON (a.id)` en `/alumnos/mis-hijos` y `/grupos/mi-grupo`.
- **UI Miss:** 4 secciones coloreadas (naranja, verde, rojo, púrpura) con textarea + 4 botones emoji "¿Cuánto?" + notas.
- **UI Papá:** 4 secciones, filtra Comida Extra si `tiene_extension === false`.

---

### ✅ SESIÓN 25 — Validación Automatización Cumpleaños (2026-04-19)

- Verificado que ícono 🎂 ya estaba completamente implementado en `FiltroEntrada.jsx`. Función `esCumpleanos()` usa `.substring(0,10)` correctamente.
- **Script `setup_cumpleanos_demo.js`:** actualiza `fecha_nacimiento` de alumnos de prueba.

---

### ✅ SESIÓN 24 — Galería + Firma Digital Incidentes (2026-04-19)

- **Galería de fotos Miss:** Grid 4 columnas en sección Actividades.
- **Galería de fotos Padre:** Grid 3 columnas, fotos clicables en nueva pestaña.
- **Firma digital incidentes (Padre):** `SignaturePad.jsx` (canvas interactivo). Endpoint `PATCH /bitacora/incidente/:id/firma` guarda en Cloudinary (`happyschool/firmas`). Botón "✍️ Firmar" → "✅ Firmado + fecha".
- **Comportamiento:** Sección propia, solo si hay datos.
- **Selector de fecha sin fin de semana:** botones ◀️ ▶️ saltan sábados/domingos.
- **Pañal:** ocultar sección baño si `usa_panial=true`. Migración SQL 012 para Ana García López.

#### Bugs resueltos
- **`usa_panial` no llegaba a frontend:** procesos Node viejos en background → matar todos y reiniciar.

---

### ✅ SESIÓN 23 — "Tarea" → "Actividades" + N fotos (2026-04-19)

- **Migración 011:** RENAME `tarea_realizada` → `actividad_realizada` en `bitacora_diaria`. ADD `actividad_descripcion TEXT`.
- **Backend:** POST `/bitacora/actividades/fotos` (multipart, hasta 10). GET `/bitacora/:alumnoId/actividades`. GET `/:alumnoId` incluye array `actividades`.
- **Backend refactor (renombre):** `grupos.js`, `alumnos.js`, `bitacora.js` actualizados.
- **Web Miss:** Sección "🎨 Actividades" con descripción + input múltiple fotos.
- **Web/Mobile Papá:** Renombrada "Actividades", muestra `actividad_descripcion`, galería fotos.
- **Mobile Miss:** `tarea_realizada` → `actividad_realizada` en useEffect y guardarMutation.

#### Bugs resueltos — CRÍTICOS (renombrado columna sin audit completo)
- `/alumnos/mis-hijos` devolvía 500 por `tarea_realizada` sin actualizar.
- `/grupos/mi-grupo` devolvía 500 por la misma razón.
- **Lección:** Al renombrar columna, SIEMPRE grep completo antes: `grep -r "tarea_realizada" --include="*.js" --include="*.jsx" . | grep -v node_modules`. Documentado en memory.

---

### ✅ SESIÓN 22 — Navegación Rápida a Bitácora (2026-04-20)

- **Dashboard Miss:** Click en alumno de tabla → abre bitácora sin pasos extras. `Bitacora.jsx` captura `alumnoId` de query params (`useSearchParams`).
- **Simplificación acciones:** Quitadas tarjetas "Asistencia" y "Bitácora" (acceso ya integrado en tabla).
- **Fix ruta:** `mi-grupo` movida ANTES de `/:id` en `grupos.js` para evitar conflicto Express.

---

### ✅ SESIÓN 20 — Incidentes + Medicamentos (2026-04-19)

- **Backend `POST /bitacora/incidente`:** Hasta 5 fotos (Cloudinary `happyschool/incidentes`). Notifica WhatsApp plantilla `incidente`. Multer en memoria.
- **Backend `GET /bitacora/incidentes/hoy`:** Solo directora/administrativo. Definida ANTES de `/:alumnoId`.
- **Backend `GET /bitacora/:alumnoId`:** Incluye `incidentes` con JOIN a `personal`.
- **Web Miss — Bitácora:** Sección 💊 Medicamentos (POST `/bitacora/medicamento`) + ⚠️ Incidentes (POST multipart `/bitacora/incidente`).
- **Dashboard Directora:** Panel rojo "⚠️ Incidentes hoy (N)", refetch 60s.
- **Web Papá — Bitácora:** Sección incidentes del día con fotos y hora.
- **Confirmación administración medicamento:** Timestamp + WhatsApp inmediato al padre.

---

### ✅ SESIÓN 19 — Registro Salida (2026-04-19)

- **`GET /api/asistencia/filtro-salida`:** Alumnos con `estado IN ('presente','retardo')` sin salida registrada, agrupados por grupo. Incluye padres + personas autorizadas.
- **Página `/maestra/filtro-salida`:** Lista por grupo, modal con selector "quién recoge", banner ámbar si salida anticipada.
- **JOIN `registro_salida` en `/grupos/mi-grupo`:** Agrega `hora_salida`, `nombre_quien_recoge`, `salida_autorizada`.
- **Dashboard Miss — columnas Entrada/Salida:** Badge hora entrada + hora salida (azul=normal / naranja=anticipada). Banner naranja cuando hay salidas anticipadas.
- **Dashboard Directora — Salidas por grupo hoy:** Acordeón por grupo con chips: `X/Y salieron · X en escuela · ⚠️ anticipadas · 🚨 no autorizadas`.
- **Eliminación "Ver antes":** acceso directo en Bitácora, Pagos y Calendario sin paso intermedio.

---

### ✅ SESIÓN 18 — Configuración + Dashboard Dinámico (2026-04-19)

- **`GET/PUT /api/config/horarios`:** Lee/actualiza 9 claves de `configuracion_general`.
- **Página Configuración directora:** 4 secciones (Entrada, Horario/Salida, Reglas, Períodos de pago).
- **Monitor puntualidad Dashboard Miss:** Banner verde/gris con hora límite de BD. Contador retardos. Reloj cada 30s.
- **Fix timezone retardo:** `toTimeString().slice(0,5)` (UTC) → `toLocaleTimeString('en-CA', { timeZone: 'America/Mexico_City' })`.
- **Dashboard Directora:** Tarjeta ⚙️ con horarios principales + enlace a Configuración.

---

### ✅ SESIÓN 17 — Bitácora Histórica + Roles Auxiliares (2026-04-19)

- **Migración 009:** UNIQUE INDEX parcial en `asignaciones_grupo (grupo_id, ciclo_id) WHERE es_titular = true`.
- **Migración 010:** Rol `maestra_auxiliar`. Karla Espinoza y Mónica Vargas actualizadas.
- **Bitácora histórica Miss (web):** Selector ◄ ► con salto sábado/domingo. Días anteriores = solo lectura total.
- **Bitácora histórica Directora:** Nueva pestaña "📋 Bitácora" en AlumnoPerfil.
- **Fix Baño vs Pañal Miss:** Sección "🚿 Baño" oculta si `usa_panial=true`.
- **Fix timezone `registro_panial`:** `DATE(hora AT TIME ZONE 'America/Mexico_City')`.
- **Etiquetas pañal mejoradas:** "💧 Pipí", "💩 Popó", "✅ Limpio", "🔄 Mixto".

---

### ✅ SESIÓN 16 — Seed Semana 13-17 Abril (2026-04-18)

- **`seed_semana_13_17_abril.js`:** Datos de prueba realistas para 5 días.
  - `registro_entrada`: 121 registros (7:15–8:55am, flag `es_retardo`).
  - `registro_salida`: 121 registros (~3:00pm).
  - `asistencia`: 125 registros (25 alumnos × 5 días).
  - `bitacora_diaria`: 121 registros.
  - `registro_comida` y `registro_banio`: 121 registros cada uno.

---

### ✅ SESIÓN 15 — Seed Datos Reales (25 Alumnos) (2026-04-18)

- **`seed_datos_reales.js`:** 5 alumnos por grupo, nombres reales, CURP de referencia, edades correctas. Idempotente por CURP.
- **50 padres/madres con login:** `mama.X@` / `papa.X@happyschool.edu.mx`, contraseña `HappySchool2026!`.
- **25 personas autorizadas:** 1 por alumno (abuela/tía/tío).
- **`seed_personal_real.js`:** Directora, admin, 5 titulares, 2 auxiliares con nombres reales.

#### Bugs resueltos
- `GET /personal`: `WHERE p.deleted_at IS NULL` reventaba → `WHERE 1=1` (personal no tiene `deleted_at`).
- `GET /grupos`: no devolvía `maestra_nombre` → JOIN con `asignaciones_grupo` + `personal`.
- `Grupos.jsx`: `r.data.personal || []` → `r.data || []`.
- `grupo.capacidad_maxima` → `grupo.cupo_maximo` (nombre real del campo).

---

### ✅ SESIÓN 14 — StatCards + Turno de Puerta (2026-04-18)

- **4ª StatCard "Ausentes":** `UserX` roja. Grid de 3 → 4 columnas en Dashboard Miss.
- **Sistema Turno de Puerta:**
  - Migración `008_turno_puerta.sql`: tabla `turno_puerta` con UNIQUE(fecha, personal_id).
  - `backend/src/routes/turnos-puerta.js`: 4 endpoints (GET hoy, GET lista, POST asignar, DELETE).
  - `GET /asistencia/filtro-entrada`: si maestra tiene turno, `whereGrupo = ''` (ve todos los grupos).
  - `web/directora/TurnoPuerta.jsx`: date picker + lista asignadas + lista disponibles.
  - Dashboard Miss: banner morado "¡Hoy tienes turno de puerta! 🚪".

#### Bugs resueltos
- `rol_principal` está en `usuarios`, no en `personal`. `personal` usa `activo` no `deleted_at`.

---

### ✅ SESIÓN 13 — Filtro de Entrada + QR Scanner (2026-04-18)

- **`GET /asistencia/filtro-entrada`:** Todos los grupos con alumnos y estado de entrada del día.
- **`FiltroEntrada.jsx`:** Reloj en tiempo real, banner cumpleaños, stats, búsqueda, alumnos por grupo, modal checklist.
- **QR Scanner:** `html5-qrcode` → localiza alumno por UUID → abre modal automáticamente.
- **Nav y ruta:** `DoorOpen` en `MaestraLayout`, ruta `/maestra/filtro-entrada`.

---

### ✅ SESIÓN 12 — Mejoras Portal Padre (2026-04-18)

- **Bitácora Padre:** `<Navigate replace>` redirige automáticamente si el padre tiene un solo hijo.
- **Semáforo "Al Corriente":** si `saldo_pendiente > 0` y backend devuelve `semaforo: 'verde'`, se fuerza `amarillo` en cliente.
- **Orden jerárquico de recibos:** mes actual visible al abrir, meses anteriores detrás de "Ver todos (N)".

---

### ✅ SESIÓN 11 — Fix Fechas ISO + Cumpleaños (2026-04-17)

- **Bug `esCumpleanos`:** API devuelve fecha como ISO completo (`"2022-04-17T05:00:00.000Z"`). Sin `.substring(0,10)`, `new Date()` producía fecha inválida → siempre `false`.
- **Fix en 4 archivos:** `web/maestra/Dashboard.jsx`, `web/directora/Dashboard.jsx`, `web/maestra/Asistencia.jsx`, `mobile/(maestra)/qr-scanner.jsx`.
- **Regla documentada:** nunca concatenar fechas del API sin `.substring(0,10)` primero.

---

### ✅ SESIÓN 10 — Auditoría + Dashboard Padre (2026-04-17)

- IP hardcodeada `mobile/src/services/api.js` corregida.
- Auditoría duplicados `plantillas_whatsapp` / `configuracion_general` — sin deuda.
- **Dashboard Padre (web/mobile):** Tarjeta hijo como `<Link>`, eliminado "Ver bitácora completa →" redundante.
- **Alerta cumpleaños 🎂:** en FiltroEntrada QR (web + mobile) y Dashboard maestra.
- **Auditoría hardcoded:** 5 variables identificadas (ROLES, METODOS, TIPOS_CONCEPTO, TIPOS_DOC, DOC_REQUERIDOS).

---

### ✅ SESIÓN 9 — Vista Asistencia Directora (2026-04-17)

- **Vista Asistencia Directora:** tabla-matriz mensual con toggle Hoy/Mensual, navegador mes/año, totales por alumno.
- **`GET /asistencia/grupo/:id/mensual`:** agrupa por alumno con `dias: { 'YYYY-MM-DD': estado }`.
- **BUG CRÍTICO — Zona horaria UTC vs hora local:** `toISOString()` después de las 6pm México devuelve día siguiente. Fix backend: `COALESCE($n::date, CURRENT_DATE)`. Fix frontend: `new Date().toLocaleDateString('en-CA')`.

---

### ✅ SESIÓN 8 — Identidad Visual + Género Personal (2026-04-17)

- **Migración 006:** UNIQUE constraint `ciclos_escolares(nombre)` + `fix_duplicados_ciclos.js` (eliminó 6 duplicados).
- **Migración 007:** campo `genero VARCHAR(10)` en tabla `personal`.
- **Labels "Maestra" → "Miss/Teacher"** en web + mobile (10 archivos).
- **Emojis tono de piel claro 🏻** en 16 archivos.
- **Saludos dinámicos por género** (Miss/Teacher) y por parentesco (Mamá/Papá).
- **`authController.js`:** login/perfil incluyen `parentesco` y `genero`.

---

### ✅ SESIÓN 7 — Vistas Maestra y Padre (2026-04-17)

- **Dashboard Maestra:** stats, acciones rápidas, tabla alumnos con badges, refetch 30s.
- **PadreLayout:** sidebar completo, nav 4 secciones, esquema rojo.
- **Dashboard Padre:** tarjetas por hijo con `bitacora_hoy` embebida.
- **Bitácora Padre:** selector fecha ◄ ►, todas las secciones.
- **Pagos Padre:** semáforo, comida semanal, historial expandible por mes.
- **Calendario Padre:** grilla mensual + lista + modal de detalle.
- **`GET /alumnos/mis-hijos`:** incluye `bitacora_hoy` (LEFT JOIN `bitacora_diaria` + `registro_comida`).
- **`setup_padre_demo.js`:** bitácora, comida, baño, pagos y eventos para Ana.

---

## 🏗️ FASES FUNDACIONALES

### ✅ FASE 4 — Control de Pagos (2026-04-17)
- CRUD conceptos de pago configurables.
- Registro de pagos con recargo automático (día 6+).
- Dashboard financiero con semáforo (verde/amarillo/rojo/suspendido).
- Estado de cuenta por alumno — web y mobile padre.
- `GET /alumnos/mis-hijos`.
- Archivos: `backend/src/routes/pagos.js`, `web/directora/Pagos.jsx`, `mobile/(padre)/pagos.jsx`.

### ✅ FASE 3 — Bitácora y Módulos Completos (2026-04-16 / 2026-04-17)
- Bitácora maestra mobile — formulario completo (ánimo, baño, pañal, esfínteres, comida, tarea, salud, notas).
- Asistencia maestra mobile — semáforo en tiempo real (refresh 30s), modal manual.
- Backend personal — CRUD + asignación grupos + reset-password.
- Web personal — tarjetas con rol, grupos, badge primer login.
- Bitácora padre mobile — lectura con selector de fechas.
- AlumnoPerfil web — documentos, personas autorizadas, blacklist.
- Calendario completo — backend + web directora + mobile padre.
- Migración 002 — índices UNIQUE (curp, grupos, conceptos_pago).

### ✅ FASE 2 — Alumnos y Grupos (2026-04-16)
- `GET /alumnos/por-qr/:qrData`, `GET /grupos/mi-grupo`, `GET /reportes/dashboard`.
- `web/src/pages/directora/Alumnos.jsx` — CRUD completo.
- `backend/src/routes/bitacora.js` — GET, POST /guardar, POST /panial, POST /medicamento.
- Git init, GitHub repo: https://github.com/valreyesg/happy-school-app

### ✅ FASE 1 — Fundación (2026-04-16)
- Monorepo npm workspaces (backend + web) + mobile.
- Esquema PostgreSQL completo (50+ tablas, ENUMs, índices).
- Backend Node.js + Express: auth JWT con rotación de refresh tokens.
- Middleware: authenticate, authorize, errorHandler.
- Servicios: cloudinaryService, whatsappService (Twilio lazy init), qrService.
- Seed inicial: grupos, roles, 19 plantillas WhatsApp, categorías, config general.
- Web: paleta Happy School, CSS utilitario, 4 layouts, router completo.
- Web: authStore (Zustand + persist), api.js (axios + refresh auto).
- Mobile: authStore (SecureStore), Splash, Login, redirect por rol, QR Scanner completo.

---

## ✅ SESIÓN 64 — Panel Historial Egresados + Excel Export (Sprint 3)

**Fecha:** 2026-04-24 | **Estado:** Completado y validado

### 1. Backend: Endpoint de Egresados por Ciclo

**Archivo:** `backend/src/routes/ciclos.js` (líneas 444-474)
- `GET /ciclos/:id/egresados` — obtener alumnos egresados de un ciclo
- Query con JOINs: `inscripciones` → `alumnos` → `grupos` → `asignaciones_grupo` → `personal` (maestra) + `padres`
- Devuelve: id, nombre_completo, foto_url, fecha_nacimiento, grupo_nombre, nivel, maestra_nombre, padres (JSON array)
- Autorización: directora, administrativo
- Agrupa por alumno para evitar duplicados con múltiples padres

### 2. Frontend: Tab "Egresados" en CiclosEscolares

**Archivo:** `web/src/pages/directora/CiclosEscolares.jsx`
- Nuevo componente `TabEgresados` (líneas 590-691)
- Selector de ciclo (solo ciclos cerrados con `!c.activo`)
- Query lazy que se ejecuta solo cuando se selecciona ciclo (`enabled: !!cicloSeleccionado`)
- Tabla con 6 columnas: Foto+Nombre | Grupo | Nivel | Maestra | Fecha nacimiento | Tutor principal
- Muestra contador "X egresados en ciclo Y"
- Estado vacío si no hay registros
- 2 tabs en la página: "Ciclos Escolares" (original) | "Egresados" (nuevo)

### 3. Validación & Fixes

**Problema encontrado:** `exceljs` no estaba instalado en `backend/package.json`
- Ejecutar `npm install exceljs` en `backend/`
- El endpoint `GET /ciclos/:id/export` ya existía pero no funcionaba
- Tras instalar, Excel export funciona correctamente (2 hojas: Grupos/Maestras + Alumnos)

**Validación en browser:** Login → Directora → Ciclos → Tab Egresados (selector ciclo + tabla) ✅

### 4. Commits

- `474ec66` — feat: Sesión 64 — Panel Historial Egresados (Sprint 3)
- `f62ef09` — chore: Sesión 64 — Sprint 3 COMPLETADO
- `268f475` — chore: Instalar exceljs para exportación de ciclos en Excel

---

## 🐛 BUGS HISTÓRICOS — NUNCA REPETIR

> Leer antes de escribir queries, rutas o cambios de schema.

| # | Bug | Causa raíz | Fix |
|---|-----|-----------|-----|
| 1 | **Renombrar columna sin audit** (sesión 23) | Faltó grep completo antes de migrar | `grep -r "nombre_columna" --include="*.{js,jsx}" . \| grep -v node_modules` antes de cualquier rename |
| 2 | **Fechas ISO del API** (sesión 11) | API devuelve ISO completo; sin `.substring(0,10)` → fecha inválida | SIEMPRE `.substring(0,10)` antes de parsear o comparar fechas del API |
| 3 | **Zona horaria UTC vs local** (sesión 9) | `toISOString()` después de 6pm → día siguiente | Backend: `CURRENT_DATE`. Frontend: `toLocaleDateString('en-CA')` |
| 4 | **Node.js no recarga rutas** (recurrente) | Proceso viejo en memoria | Matar procesos (`kill -9` / `taskkill`) ANTES de reiniciar |
| 5 | **Columnas inventadas en SELECT** (sesión 7) | Asumir columnas sin leer schema | Leer `001_schema_inicial.sql` de cada tabla antes de escribir queries |
| 6 | **Variables sin datos demo** (sesión 7) | Seed no crea datos de prueba para vistas nuevas | Crear `setup_<modulo>_demo.js` antes de pedir validación al usuario |
| 7 | **`deleted_at` en tabla `personal`** (sesión 15) | `personal` usa `activo`, no `deleted_at` | Verificar schema de cada tabla antes de filtrar |
| 8 | **Índice UNIQUE bloquea soft-delete** (sesión 33) | UNIQUE normal sin excluir `deleted_at IS NOT NULL` | Usar índice parcial: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` |
| 9 | **Stale closure en setTimeout** (sesión 36) | React captura valor viejo del estado antes del set | Construir objeto actualizado y pasarlo directamente al setTimeout |
| 10 | **Import named vs default** (sesión 37) | `{ api }` cuando el módulo exporta `export default` | Verificar tipo de export antes de importar |
| 11 | **`onSuccess` en `useQuery` RQ v5** (sesión 9) | RQ v5 eliminó `onSuccess`/`onError` de `useQuery` | Usar `useEffect([data])` para side effects; `onSuccess` solo en `useMutation` |
| 12 | **HTTP 304 Not Modified** (sesión 28) | Express cacheaba respuestas GET | Middleware: `Cache-Control: no-store, no-cache, must-revalidate` en `/api/` |
| 13 | **`cuanto_comio` en tabla equivocada** (sesión 7) | Columna existe en `registro_comida`, no en `bitacora_diaria` | JOIN a la tabla correcta; no asumir columnas por intuición |
| 14 | **Preview-promocion duplica por múltiples grupos** (sesión 33) | LEFT JOIN retornaba filas duplicadas con varios grupos por nivel | LATERAL + LIMIT 1 para tomar solo el primer grupo |

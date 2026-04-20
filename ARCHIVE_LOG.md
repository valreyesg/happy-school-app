# Archive Log — Happy School App
## Historial Detallado de Funcionalidades Completadas

## ✅ Log de Tareas Completadas.
## ✅ FASE 1 — Completada (2026-04-16)
- [x] Fundación completa del proyecto (monorepo, schema, backend, web, mobile base)

## ✅ FASE 2 — Completada (2026-04-16)
- [x] Endpoints urgentes para mobile (por-qr, mi-grupo, reportes/dashboard)
- [x] Web directora: CRUD alumnos, grupos, personal
- [x] Git init + GitHub repo

## ✅ FASE 3 — Completada (2026-04-16 / 2026-04-17)
- [x] Bitácora maestra mobile — formulario completo
- [x] Asistencia maestra mobile — semáforo en tiempo real
- [x] Backend personal — CRUD + asignación grupos + reset-password
- [x] Web personal — tarjetas con rol, grupos, primer login
- [x] Bitácora padre mobile — lectura completa con fechas
- [x] AlumnoPerfil web — documentos, personas autorizadas, blacklist
- [x] Calendario completo — backend + web directora + mobile padre
- [x] Migración 002 — índices UNIQUE (curp, grupos, conceptos_pago)

## ✅ FASE 4 — Completada (2026-04-17)
- [x] CRUD conceptos de pago configurables
- [x] Registro de pagos con recargo automático (día 6+)
- [x] Dashboard financiero con semáforo (verde/amarillo/rojo/suspendido)
- [x] Control de comida semanal
- [x] Estado de cuenta por alumno — web y mobile padre
- [x] GET /alumnos/mis-hijos

## ✅ SESIÓN 20 — Completada (2026-04-19)
- [x] **Backend POST `/bitacora/incidente`:** Registra descripción, acciones tomadas y hasta 5 fotos (Cloudinary, carpeta `happyschool/incidentes`). Obtiene `personal_id` del usuario autenticado. Notifica al padre vía WhatsApp (plantilla `incidente`). Multer en memoria.
- [x] **Backend GET `/bitacora/incidentes/hoy`:** Devuelve todos los incidentes del día (todos los grupos) con `alumno_nombre`, `grupo_nombre`, `reportado_por_nombre`. Solo accesible para `directora` y `administrativo`. Ruta definida ANTES de `/:alumnoId` para evitar conflicto de parámetro dinámico.
- [x] **Backend GET `/bitacora/:alumnoId`:** Ahora incluye `incidentes` — JOIN con `personal` para `reportado_por_nombre`, filtrado por `DATE(fecha AT TIME ZONE 'America/Mexico_City')`.
- [x] **Web Miss — Bitácora:** Dos nuevas secciones al fondo del formulario: **💊 Medicamentos del día** (lista registros existentes + form nombre/dosis/notas + botón registrar, POST a `/bitacora/medicamento`) y **⚠️ Incidentes / Accidentes** (lista con fotos + form descripción/acciones/fotos + botón registrar, POST multipart a `/bitacora/incidente`). Ambas ocultas en modo solo lectura.
- [x] **Web Directora — Dashboard:** Panel rojo "⚠️ Incidentes hoy (N)" visible solo cuando hay incidentes. Muestra nombre alumno, grupo, hora, descripción, acciones, fotos clicables y quién reportó. Se refresca cada 60s junto con el resto del dashboard.
- [x] **Web Papá — Bitácora:** Sección "⚠️ Incidentes del día" en rojo con descripción, acciones, fotos y hora. Se nutre del mismo GET `/bitacora/:alumnoId` que ya usaba.
- [x] **Confirmación de Administración de Medicamento:** Registro desde bitácora Miss con timestamp + notificación WhatsApp inmediata al padre (plantilla `medicamento` — ya existía en DB). Marcado como completado en PENDIENTES.

## ✅ SESIÓN 19 — Completada (2026-04-19)
- [x] **Endpoint GET `/api/asistencia/filtro-salida`:** Devuelve alumnos con `estado IN ('presente','retardo')` hoy sin salida registrada, agrupados por grupo. Incluye padres y personas_autorizadas por alumno (para el selector "quién recoge") y `hora_salida_normal` desde `configuracion_general`.
- [x] **Página `/maestra/filtro-salida`:** Lista por grupo con tarjeta por alumno (estado "En escuela" / hora de salida). Modal con selector radio de quién recoge (padres + personas autorizadas + "otro"). Banner ámbar "⚠️ SALIDA ANTICIPADA" en modal y pantalla global si la hora actual es antes de `hora_salida_normal`. Nav item "Registro Salida" (ícono `DoorClosed`) en `MaestraLayout` entre Filtro Entrada y Asistencia.
- [x] **JOIN `registro_salida` en `/grupos/mi-grupo`:** Agrega `salida_id`, `hora_salida`, `nombre_quien_recoge`, `recogido_por_tipo`, `salida_autorizada` a cada alumno del grupo.
- [x] **Dashboard Miss — columnas Entrada/Salida:** Tabla divide "Asistencia" en dos columnas: "Entrada" (badge estado + hora de llegada) y "Salida" (hora en azul=normal / naranja=anticipada, "En escuela" si no ha salido). Banner naranja enlazado a `/maestra/filtro-salida` cuando hay salidas anticipadas, con nombres.
- [x] **Dashboard Directora — panel Salidas por grupo hoy:** Reemplaza lista plana por acordeón por grupo. Cabecera siempre visible con chips: `X/Y salieron · X en escuela · ⚠️ X anticipadas · 🚨 X no autorizadas`. Al expandir muestra lista con hora verde (normal), naranja (anticipada) o roja (no autorizada) y quién recogió. Query en `/reportes/dashboard` devuelve `salidasHoy` (todas) y `salidasAnticipadas` (filtradas por `hora_salida_normal`).

## ✅ SESIÓN 22 — Completada (2026-04-20)
- [x] **Dashboard Miss — Navegación rápida a bitácora:** Click directo en alumno de tabla → abre su bitácora SIN pasos extras. Cambio en `/maestra/Bitacora.jsx`: importa `useSearchParams()`, captura `alumnoId` de query params, auto-selecciona alumno si viene en URL. Ruta `mi-grupo` movida ANTES de `/:id` en `grupos.js` para evitar conflicto con Express.
- [x] **Dashboard Miss — Simplificación de acciones rápidas:** Quitar tarjetas "Asistencia" y "Bitácora" de la sección de acciones. Solo queda "Galería". Motivo: acceso directo ya integrado en la tabla (elimina pasos intermedios). Quitados imports `CheckSquare` y `BookOpen` de Dashboard.

## ✅ SESIÓN 25 — Completada (2026-04-19)
- [x] **Validación de Automatización de Cumpleaños:** Verificado que el ícono 🎂 ya estaba completamente implementado en `FiltroEntrada.jsx` (líneas 11-17, 106-110, 157, 171, 282). Función `esCumpleanos()` compara mes/día actual con fecha_nacimiento usando `.substring(0,10)` para evitar bug de ISO dates. Validado en browser con Ana García López (fecha actualizada a 2026-04-19) → ícono visible en tarjeta y alerta en modal.
- [x] **Script de actualización de fechas (`setup_cumpleanos_demo.js`):** Creado para actualizar fecha_nacimiento de alumnos de prueba. Usa `require('dotenv').config()` y módulo `../config/database` para conectar a PostgreSQL via DATABASE_URL.
- [x] **Preparación para siguientes sesiones:** Identificadas 3 tareas quick-win para próxima sesión (FASE 3.1, FASE 4, FASE 6.8). Documentadas en PENDIENTES.md sin cambios en lo no completado (respetó instrucción del usuario).

## ✅ SESIÓN 24 — Completada (2026-04-19)
- [x] **Galería de fotos en Miss:** Subsección "📷 Galería de actividades guardadas" integrada en sección 🎨 Actividades. Grid 4 columnas con fotos ya subidas. Mostrada solo si hay fotos.
- [x] **Galería de fotos en Padre:** Subsección "📷 Galería de actividades guardadas" integrada en sección 🎨 Actividades (NO como sección separada). Grid 3 columnas. Fotos clickeables que abren en nueva pestaña.
- [x] **Firma digital de incidentes (Padre):** Componente `SignaturePad.jsx` (canvas interactivo). Endpoint `PATCH /bitacora/incidente/:id/firma` guarda firma en Cloudinary (`happyschool/firmas`). UI padre: botón "✍️ Firmar para confirmar enterado" en cada incidente sin firma. Display "✅ Firmado + fecha" cuando ya firmado.
- [x] **Separación Comportamiento:** Sección "🌟 Comportamiento" propia (NO integrada en Actividades). Solo se muestra si hay datos de comportamiento.
- [x] **Selector de fecha sin fin de semana:** Botones ◀️ ▶️ saltan sábados/domingos automáticamente. Navega solo entre días hábiles.
- [x] **Inicializar en primer día hábil:** Padre al entrar no ve domingo. Se inicia en viernes (último día hábil) si hoy es fin de semana.
- [x] **Pañal: ocultar baño si usa_panial=true:** Condición `{!usaPanial && banio && (` en línea 353. Agregado `usa_panial` a GET `/alumnos/mis-hijos`. Migración SQL 012 para actualizar Ana García López a `usa_panial=true`. Solo muestra "Cambios de pañal" para Maternal.
- [x] **Bug: `usa_panial` no llegaba a frontend:** ROOT CAUSE: Procesos Node viejos en background. SOLUTION: Matar todos, reiniciar limpio, usar puerto flexible (5185 al final). Migración SQL 012 ejecutada correctamente con `apply_fix.js`.

## ✅ SESIÓN 23 — Completada (2026-04-19 sesión noche)
### Cambio semántico: "Tarea" → "Actividades" + soporte N fotos
- [x] **Migración 011 (`011_actividad_descripcion.sql`):**
  - RENAME columna `tarea_realizada` → `actividad_realizada` en `bitacora_diaria`
  - ADD columna `actividad_descripcion TEXT` para descripción de actividad (ej: pintura, juego libre)
  - Aplicada manualmente con Node script (problema: DATABASE_URL no se carga en psql bash, resuelto con `node -e` + require('pg'))

- [x] **Backend — Nuevos endpoints bitácora:**
  - POST `/bitacora/actividades/fotos`: Multipart upload de N fotos a tabla `actividades_fotos`. Fields: `alumno_id`, `grupo_id`, `fecha`, `descripcion`, `es_grupal`. Limita a 10 archivos. Devuelve array de registros insertados.
  - GET `/bitacora/:alumnoId/actividades`: Retorna fotos del alumno (individuales O grupales) para esa fecha, ordenadas por `created_at`.
  - GET `/bitacora/:alumnoId`: Ahora incluye `actividades` (array de fotos) en respuesta JSON junto con bitácora, banio, comida, etc.

- [x] **Backend — Cambios en rutas existentes (refactor por renombre):**
  - `/grupos/mi-grupo`: Cambió `bd.tarea_realizada` → `bd.actividad_realizada` en SELECT de alumnos del grupo (línea 133)
  - `/alumnos/mis-hijos`: Cambió `b.tarea_realizada` → `b.actividad_realizada` + actualizado destructuring del mapeo (línea 22, 35)
  - POST `/bitacora/guardar`: Cambió parámetro `tarea_realizada` → `actividad_realizada` (línea 106) + descriptor renombrado (línea 228)

- [x] **Frontend Web Miss — Sección "Actividades":**
  - Renombrada sección de "📚 Tarea" → "🎨 Actividades"
  - Agregado textarea para `actividad_descripcion` (ej: "Pintura con acuarelas")
  - Input file múltiple para subir N fotos de actividad (max 10)
  - Botón "⬆️ Subir fotos" aparece solo si hay archivos seleccionados (mutation `actFotosMutation` POST a `/bitacora/actividades/fotos`)
  - Mantiene botones "✓ Sí realizó / ✗ No realizó" para `actividad_realizada` (booleano)

- [x] **Frontend Web Papá — Bitácora:**
  - Resumen rápido: Cambió ícono de "📚 Tarea" → "🎨 Actividades"
  - Sección renombrada "Tarea y conducta" → "Actividades y conducta"
  - Muestra `actividad_descripcion` si existe
  - Reemplazó "Sí realizó la tarea" → "Sí participó" (más semánticamente correcto)
  - **NUEVA sección Galería 📷:** Grid de 3 columnas con fotos de `actividades`. Fotos clicables (abre fullscreen). Muestra descripción de primera foto si existe.

- [x] **Frontend Mobile Expo Miss — Bitácora:**
  - Cambió lectura de `tarea_realizada` → `actividad_realizada` en useEffect
  - Cambió envío de `tarea_realizada` → `actividad_realizada` en guardarMutation (línea 228)

- [x] **Frontend Mobile Expo Papá — Bitácora:**
  - Resumen: Cambió "📚 Tarea" → "🎨 Actividades"
  - Sección: Renombrada "Tarea y conducta" → "Actividades y conducta"
  - Cambió "Sí realizó la tarea" → "Sí participó"

- [x] **Frontend Mobile Expo Papá — Dashboard:**
  - Cambió emisión en dashboard "📚 Tarea" → "🎨 Actividades"

- [x] **Frontend Web Directora — AlumnoPerfil:**
  - Cambió display de `tarea_realizada` → `actividad_realizada`
  - Agregó fila adicional `actividad_descripcion` cuando existe

### 🐛 BUGS ENCONTRADOS Y RESUELTOS
**CRÍTICO: Renaming de columna sin audit completo causó 500 errors en 2 endpoints**
1. **Error 1:** `/alumnos/mis-hijos` devolvía 500 porque SELECT usaba `tarea_realizada` (no existía)
   - **Root cause:** Faltó actualizar `/alumnos.js` línea 22
   - **Fix:** Cambió a `actividad_realizada` + destructuring mapeo

2. **Error 2:** `/grupos/mi-grupo` devolvía 500 por la misma razón
   - **Root cause:** Faltó actualizar `/grupos.js` línea 133
   - **Fix:** Cambió a `actividad_realizada`

3. **Problema operacional:** Dev server (Vite) no estaba corriendo → localStorage inaccesible → navegador devolvía `chrome-error://`
   - **Root cause:** Bash no mantuvo proceso en background, solo backend estaba activo
   - **Fix:** Reinició `npm run dev` en web/

**LECCIÓN APRENDIDA (Documentada en memory):**
- Al cambiar nombre de columna en schema, SIEMPRE ejecutar grep PRIMERO en TODO el código:
  ```bash
  grep -r "tarea_realizada" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules
  ```
- Actualizar en este orden: backend routes → web pages → mobile → seeds (historicos)
- Backend endpoints a auditar: cualquiera que tenga `SELECT ... FROM bitacora_diaria`
- Test endpoints con curl ANTES de UI testing
- Reiniciar backend + rebuild web + hard refresh navegador (Ctrl+Shift+R)

### 📝 Notas
- Fotos de actividades: Actualmente sin visualización en browser (tabla `actividades_fotos` está cargada pero padre ve "No hay fotos"). **PENDIENTE sesión 24:** validar upload y fetch de fotos Cloudinary.

## ✅ SESIÓN 18 — Completada (2026-04-19)
- [x] **Endpoint GET/PUT `/api/config/horarios`:** Lee y actualiza claves de `configuracion_general` (hora_inicio_filtro, hora_fin_filtro, hora_salida_normal, hora_salida_extension, costo_extension_hora, max_retardos_mes, dia_inicio_pago, dia_fin_pago, alerta_minutos_sin_recoger). GET disponible a todos los roles, PUT solo directora.
- [x] **Página Configuración directora (`/directora/configuracion`):** UI con 4 secciones (Entrada, Horario/Salida, Reglas de negocio, Período de pagos). Campos `input type="time"` y `number`. Botón guardar con feedback visual. Era placeholder `🚧`.
- [x] **Monitor puntualidad en Dashboard Miss:** Banner dinámico verde (filtro abierto) / gris (filtro cerrado) con hora límite tomada de `configuracion_general`. Muestra contador de retardos integrado. Reloj se actualiza cada 30s.
- [x] **Fix timezone retardo en backend:** `asistencia.js` línea 28 — `toTimeString().slice(0,5)` (hora del servidor/UTC) reemplazado por `toLocaleTimeString('en-CA', { timeZone: 'America/Mexico_City', ... })`. Evita marcar retardos incorrectos después de las 6pm.
- [x] **Panel horarios en Dashboard directora:** Tarjeta ⚙️ con 4 horarios principales (apertura, límite, salida normal, salida extensión) + 3 valores de negocio (costo extensión, máx. retardos, período pago). Enlace directo a Configuración.
- [x] **Reorden Dashboard directora:** Asistencia por grupo movida arriba de Documentación incompleta y Retardos del mes.
- [x] **Exposición bitácora en dashboard padre marcada como completada** (fue implementada en sesión 17 pero no registrada).

## ✅ SESIÓN 17 — Completada (2026-04-19)
- [x] **Migración 009 — Constraint único titular por grupo:** `UNIQUE INDEX` parcial en `asignaciones_grupo (grupo_id, ciclo_id) WHERE es_titular = true`. Corrige duplicados previos conservando el registro más antiguo. Verificado: rechaza inserto de segundo titular con error de unicidad.
- [x] **Migración 010 — Rol `maestra_auxiliar`:** `ALTER TYPE rol_principal_tipo ADD VALUE 'maestra_auxiliar'`. Karla Espinoza Luna y Mónica Vargas Castillo actualizadas de `maestra_titular` → `maestra_auxiliar`. Frontend actualizado: nuevo valor en `ROLES`, badge color teal, label "Auxiliar".
- [x] **Bitácora histórica — Miss (web):** Selector ◄ ► en `/maestra/bitacora`. Salta sábado/domingo en navegación. Default = último día hábil (no muestra domingo al abrir). Días anteriores = solo lectura total (`pointer-events-none` en el formulario + guard `if (soloLectura) return` en `guardar()`). Badge "📖 Solo lectura" visible. Endpoint `/grupos/mi-grupo` acepta `?fecha=` opcional.
- [x] **Bitácora histórica — Directora (web):** Nueva pestaña "📋 Bitácora" en `/directora/alumnos/:id`. Navegación ◄ ► con salto de fines de semana. Vista solo-lectura completa: ánimo, alimentación, baño (solo sin pañal) / cambios de pañal (solo con pañal), esfínteres, salud, medicamentos.
- [x] **Fix Baño vs Pañal — Miss:** Sección "🚿 Baño" oculta para niños con `usa_panial=true` (usan `registro_panial`, no `registro_banio`). Sección pañal deshabilitada en modo solo lectura.
- [x] **Fix timezone registro_panial:** Consulta cambiada de `DATE(hora)` a `DATE(hora AT TIME ZONE 'America/Mexico_City')` para evitar desfase UTC/local.
- [x] **Etiquetas pañal:** `PANIAL_CONDICIONES` refactorizado a objetos `{key, label}`. "orina" → "💧 Pipí", "heces" → "💩 Popó", "limpio" → "✅ Limpio", "mixto" → "🔄 Mixto". Aplicado en botones y en lista de registros históricos.

## ✅ SESIÓN 16 — Completada (2026-04-18)
- [x] **Seed semana 13-17 abril 2026:** `seed_semana_13_17_abril.js` — datos de prueba para las 5 tablas de bitácora/asistencia.
  - `registro_entrada`: 121 registros con hora real (7:15–8:55am), flag `es_retardo`.
  - `registro_salida`: 121 registros (~3:00pm), recogido por padre.
  - `asistencia`: 125 registros (25 alumnos × 5 días) con distribución realista.
  - `bitacora_diaria`: 121 registros con `estado_animo`, `comportamiento`, `notas`.
  - `registro_comida` y `registro_banio`: 121 registros cada uno con valores variados.
  - Distribución: lun(2 ausentes), mar(1 retardo), mié(1 retardo+1 ausente), jue(0), vie(2 retardos+1 ausente).

## ✅ SESIÓN 15 — Completada (2026-04-18)
- [x] **Seed datos reales (25 alumnos):** `seed_datos_reales.js` — 5 alumnos por grupo con nombres reales, CURP de referencia, edades correctas por nivel. Idempotente: busca por CURP antes de insertar.
- [x] **Edades corregidas por grupo:** `fix_fechas_alumnos.js` — Maternal 6-18 meses (2024-10 a 2025-08), Prekinder 18-24 meses (2024-05 a 2024-09), Kinder 1 3-4 años, Kinder 2 4-5 años, Kinder 3 5-6 años.
- [x] **Pañal:** Maternal todos (5/5), Prekinder mayoría (4/5 — Lucía ya sin pañal), Kinder 1 solo María Fernanda Castillo (1/5).
- [x] **50 padres/madres con login:** `seed_datos_reales.js` — mamá y papá por alumno, emails `mama.X@happyschool.edu.mx` / `papa.X@happyschool.edu.mx`, contraseña `HappySchool2026!`, vinculados en `alumno_padre`.
- [x] **25 personas autorizadas:** 1 por alumno (abuela/tía/tío), con foto e INE placeholder. Creación idempotente por `SELECT` previo (sin constraint UNIQUE en tabla).
- [x] **Personal con nombres reales:** `seed_personal_real.js` — directora: Carmen Rodríguez Mendoza, admin: Ana María Pérez Torres, titulares: Gabriela Soto Ramírez (Maternal), Sofía Martínez Reyes (Prekinder), Diana Cruz Herrera (K1), Paola Gutiérrez Vega (K2), Andrea Morales Jiménez (K3). Personal registrado también en directora y admin (antes sin registro en tabla `personal`).
- [x] **2 maestras auxiliares:** Karla Espinoza Luna (Maternal) y Mónica Vargas Castillo (Prekinder) — `asignaciones_grupo` con `es_titular = false`.
- [x] **Bug fix GET /personal:** `WHERE p.deleted_at IS NULL` reventaba la query porque `personal` no tiene columna `deleted_at` → corregido a `WHERE 1=1`. La página Personal del portal directora ahora muestra los 9 registros.
- [x] **Bug fix GET /grupos:** endpoint no devolvía `maestra_nombre` → agregado JOIN con `asignaciones_grupo` + `personal` filtrando titular; las tarjetas de grupo ahora muestran la Miss asignada.
- [x] **Bug fix Grupos.jsx:** `r.data.personal || []` → `r.data || []` (el backend retorna array directo, no objeto). Dropdown de maestras en modal de grupo ahora se pobla correctamente.
- [x] **Bug fix Grupos.jsx:** `grupo.capacidad_maxima` → `grupo.cupo_maximo` — la barra de ocupación ahora calcula el porcentaje con el campo real del schema.

## ✅ SESIÓN 14 — Completada (2026-04-18)
- [x] **Contador Ausentes en dashboard Miss:** 4ª StatCard `UserX` roja — calcula alumnos sin estado o con `ausente`; grid cambiado de 3 a 4 columnas.
- [x] **Sistema Turno de Puerta rotativo:**
  - Migración `008_turno_puerta.sql` — tabla `turno_puerta (id, fecha, personal_id, asignado_por)` con UNIQUE(fecha, personal_id).
  - `backend/src/routes/turnos-puerta.js` — 4 endpoints: `GET /hoy` (maestra verifica su turno), `GET /` (directora lista por fecha), `GET /personal` (lista maestras asignables), `POST /` (asignar), `DELETE /:id` (eliminar).
  - `GET /asistencia/filtro-entrada` — ahora hace `Promise.all` con consulta a `turno_puerta`; si la maestra tiene turno hoy, `whereGrupo = ''` (ve todos los grupos).
  - `web/pages/directora/TurnoPuerta.jsx` — página con date picker, lista de asignadas (con botón quitar), lista de disponibles (con botón asignar).
  - `DirectoraLayout.jsx` — ítem "Turno Puerta" con `DoorOpen` en nav.
  - `App.jsx` — ruta `/directora/turno-puerta` registrada.
  - `web/pages/maestra/Dashboard.jsx` — query a `/turnos-puerta/hoy`; banner morado "¡Hoy tienes turno de puerta! 🚪" con link a `/maestra/filtro-entrada`.
- [x] **Fix schema:** columna `rol_principal` está en `usuarios`, no en `personal`; `personal` usa `activo` no `deleted_at` — corregido en queries de `turnos-puerta.js`.

## ✅ SESIÓN 13 — Completada (2026-04-18)
- [x] **Endpoint `GET /asistencia/filtro-entrada`:** devuelve todos los grupos activos con alumnos y estado de entrada del día. Si el usuario tiene grupo asignado (titular/especial) filtra solo ese grupo; si no (maestra_puerta/directora), devuelve todos.
- [x] **Página `FiltroEntrada.jsx`** en `/maestra/filtro-entrada`: reloj en tiempo real, banner cumpleaños, stats Registrados/Pendientes/Total, búsqueda por nombre, alumnos agrupados por grupo (pendientes primero), modal checklist de entrada (salud, higiene, materiales).
- [x] **QR Scanner integrado:** botón "Escanear QR" usa `html5-qrcode` con cámara trasera → localiza al alumno por UUID → abre modal de checklist automáticamente con `qr_escaneado: true`.
- [x] **Nav y ruta:** ícono `DoorOpen` "Filtro Entrada" añadido a `MaestraLayout.jsx`; ruta `/maestra/filtro-entrada` registrada en `App.jsx`.
- [x] **Bug proceso viejo backend:** proceso node no recargaba rutas nuevas → resuelto con `taskkill` + reinicio limpio.

## ✅ SESIÓN 12 — Completada (2026-04-18)
- [x] **Botón "Ver bitácora completa →" eliminado:** reemplazado con `<Navigate replace>` en `web/pages/padre/Bitacora.jsx` — cuando el padre tiene un solo hijo y navega sin `alumnoId`, redirige automáticamente sin paso intermedio
- [x] **Validación semáforo "Al Corriente":** en `web/pages/padre/Pagos.jsx` — si `saldo_pendiente > 0` y el backend devuelve `semaforo: 'verde'` (pago pendiente aún no vencido), se fuerza `amarillo` en el cliente
- [x] **Orden jerárquico de recibos en portal padre:** mes actual siempre visible al abrir Pagos; meses anteriores ocultos detrás de botón "Ver todos los pagos (N)" — refactor completo de `PanelHijo` con nuevo helper `FilaPagos`

## ✅ SESIÓN 11 — Completada (2026-04-17)
- [x] **Bug `esCumpleanos` — fecha ISO vs YYYY-MM-DD:** el API devuelve `fecha_nacimiento` como ISO completo (`"2022-04-17T05:00:00.000Z"`); la función concatenaba `+ 'T12:00:00'` produciendo fecha inválida → `esCumpleanos` siempre devolvía `false`. Fix: `.substring(0, 10)` en los 4 archivos afectados: `web/maestra/Dashboard.jsx`, `web/directora/Dashboard.jsx`, `web/maestra/Asistencia.jsx`, `mobile/(maestra)/qr-scanner.jsx`
- [x] Regla documentada en `SCHEMA_SHORTCUT.md` y `CONTEXT.md` — nunca concatenar fechas del API sin extraer `substring(0,10)` primero
- [x] Banners cumpleaños 🎂 validados y funcionando correctamente tras el fix
- ⚠️ **PENDIENTE SESIÓN 12:** Botón "Ver bitácora completa →" sigue visible en vista Bitácora del padre (web) al navegar desde dashboard o menú lateral

## ✅ SESIÓN 10 — Completada (2026-04-17)
- [x] IP hardcodeada `mobile/src/services/api.js:4` → corregida a `192.168.1.93`
- [x] Auditoría duplicados `plantillas_whatsapp` / `configuracion_general` → ya tenían UNIQUE constraint, sin deuda
- [x] Dashboard padre (web): tarjeta hijo convertida en `<Link>` completo, eliminado botón "Ver bitácora completa →"
- [x] Dashboard padre (mobile): eliminado texto "Ver bitácora completa →" redundante (tarjeta ya era TouchableOpacity)
- [x] Alerta cumpleaños 🎂 en filtro de entrada QR — maestra web (`Asistencia.jsx`) y maestra mobile (`qr-scanner.jsx`) — función `esCumpleanos()` con hora local (`en-CA`)
- [x] Alerta cumpleaños 🎂 en dashboard maestra web — usa alumnos de `mi-grupo` (no query extra)
- [x] Alerta cumpleaños 🎂 en dashboard directora web — query separada `GET /alumnos` filtrando por hoy
- [x] `fecha_nacimiento` Ana García López (Maternal) actualizada a 2022-04-17 para testing
- [x] Auditoría hardcoded: 5 variables identificadas — `ROLES`, `METODOS`, `TIPOS_CONCEPTO`, `TIPOS_DOC`, `DOC_REQUERIDOS` (pendiente migración a DB)
- ⚠️ **PENDIENTE VALIDAR:** cambios del botón bitácora y banners de cumpleaños no se visualizaban al cierre de sesión — investigar en sesión 11

## ✅ SESIÓN 9 — Completada (2026-04-17)
- [x] Vista asistencia directora — tabla-matriz mensual con toggle Hoy/Mensual, navegador mes/año, totales por alumno (presentes, retardos, no entró)
- [x] Endpoint `GET /asistencia/grupo/:id/mensual?mes=&anio=` — agrupa por alumno con `dias: { 'YYYY-MM-DD': estado }`, usa `TO_CHAR` para evitar ambigüedad de timezone
- [x] UNIQUE constraint `ciclos_escolares(nombre)` — 6 duplicados eliminados, migración 006 aplicada (sesión 8, movido aquí)
- [x] **BUG CRÍTICO — Zona horaria UTC vs hora local:** `new Date().toISOString().split('T')[0]` devuelve fecha UTC; después de las 6pm México ya es el día siguiente → asistencia y bitácora aparecían vacías o con fecha incorrecta. Fix backend (`asistencia.js`, `reportes.js`, `bitacora.js`, `grupos.js`): `COALESCE($n::date, CURRENT_DATE)` en SQL. Fix frontend (`padre/Bitacora.jsx`, `maestra/Bitacora.jsx`): `new Date().toLocaleDateString('en-CA')`.

## ✅ SESIÓN 8 — Completada (2026-04-17)
- [x] Migración 006 — UNIQUE constraint `ciclos_escolares(nombre)` + script `fix_duplicados_ciclos.js` que eliminó 6 duplicados y reasignó todas las FKs
- [x] Migración 007 — campo `genero VARCHAR(10)` en tabla `personal` (valores: f/m/o)
- [x] Labels "Maestra" → "Miss" / "Teacher" en toda la UI (web + mobile, 10 archivos)
- [x] Emojis con tono de piel claro 🏻 aplicado a todos los emojis de persona (16 archivos)
- [x] Saludos dinámicos por género: Miss → "¡Bienvenida, Miss [nombre]!" / Teacher → "¡Bienvenido, Teacher [nombre]!" (web + mobile)
- [x] Saludos dinámicos por parentesco: "¡Hola, Mamá/Papá [nombre]!" usando campo `parentesco` de tabla `padres` (web + mobile)
- [x] `authController.js` — login y perfil ahora incluyen `parentesco` y `genero` vía LEFT JOIN
- [x] `personal.js` — POST y PUT aceptan y persisten campo `genero`
- [x] Form de Personal web — nuevo selector de Género (Femenino/Masculino/Otro)

## ✅ SESIÓN 7 — Completada (2026-04-17)
- [x] Maestra Dashboard web — stats, acciones rápidas, tabla de alumnos con badges
- [x] PadreLayout — sidebar completo con nav (Inicio, Bitácora, Pagos, Calendario), esquema rojo
- [x] Padre Dashboard — tarjetas por hijo con `bitacora_hoy` embebida (ánimo, comida, tarea, conducta)
- [x] Padre Bitácora — lectura completa con selector de fecha, todas las secciones
- [x] Padre Pagos — semáforo de adeudo, comida semanal, historial expandible con filtro por mes
- [x] Padre Calendario — grilla mensual + lista + modal de detalle
- [x] `GET /alumnos/mis-hijos` — agrega `bitacora_hoy` con LEFT JOIN a `bitacora_diaria` + `registro_comida`
- [x] `setup_padre_demo.js` — script idempotente que siembra bitácora, comida, baño, pagos y eventos para Ana

## 📋 FASE 6 — Calendario, Comunicación y Contenido
- [x] Calendario de eventos con categorías configurables ✅

## Funcionalidades Completadas ✅

### FASE 1 — Fundación (2026-04-16)
- Monorepo: npm workspaces (backend + web) + mobile independiente
- Esquema PostgreSQL completo (50+ tablas, ENUMs, índices)
- Backend Node.js + Express: auth JWT con rotación de refresh tokens
- Middleware: authenticate, authorize (roles dinámicos), errorHandler
- Controllers: authController, alumnosController (CRUD + foto + QR)
- Rutas completas: auth, alumnos, grupos, asistencia
- Asistencia: retardos automáticos + notificaciones WhatsApp
- Servicios: cloudinaryService, whatsappService (Twilio lazy init), qrService
- Seed inicial: grupos, roles, plantillas WhatsApp (19), categorías, config general
- Web: paleta Happy School, CSS utilitario, componentes base
- Web: SplashPage, LoginPage, Dashboard directora con semáforo
- Web: 4 layouts (directora, administrativo, maestra, padre), router completo
- Web: authStore (Zustand + persist), api.js (axios + refresh auto)
- Mobile: authStore (SecureStore), Splash, Login, redirect por rol
- Mobile: QR Scanner completo (escaneo → checklist → semáforo)
- Mobile: Tabs maestra y padre con dashboards

### FASE 2 — Alumnos y Grupos (2026-04-16)
- `GET /alumnos/por-qr/:qrData` — QR scanner mobile
- `GET /grupos/mi-grupo` — dashboard maestra
- `GET /reportes/dashboard` — stats directora web
- `web/src/pages/directora/Alumnos.jsx` — CRUD completo
- `backend/src/routes/bitacora.js` — GET, POST /guardar, POST /panial, POST /medicamento
- Git init, primer commit, repo GitHub: https://github.com/valreyesg/happy-school-app

### FASE 3 — Bitácora y módulos completos (2026-04-16)
- `mobile/app/(maestra)/bitacora.jsx` — formulario completo (ánimo, baño, pañal, esfínteres, comida, tarea, salud, notas)
- `mobile/app/(maestra)/asistencia.jsx` — semáforo en tiempo real (refresh 30s), modal manual
- `web/src/pages/directora/Grupos.jsx` — CRUD grupos con barra de ocupación
- `backend/src/routes/personal.js` — CRUD personal + reset-password + asignación de grupos
- `web/src/pages/directora/Personal.jsx` — tarjetas con rol, grupos asignados, badge primer login
- `mobile/app/(padre)/bitacora.jsx` — lectura completa con selector de fecha
- `backend/src/routes/alumnos.js` — documentos, personas autorizadas, blacklist
- `web/src/pages/directora/AlumnoPerfil.jsx` — perfil completo con documentos y personas autorizadas
- Calendario completo: `backend/src/routes/calendario.js`, `web/…/Calendario.jsx`, `mobile/…/calendario.jsx`
- Migración 002: índices UNIQUE para curp, grupos(nombre+ciclo), conceptos_pago(nombre)

### SESIÓN 7 — Vistas Maestra y Padre (2026-04-17)
- `web/src/pages/maestra/Dashboard.jsx` — stats (en escuela/retardos/bitácoras), acciones rápidas, tabla alumnos con badges asistencia y bitácora, refetch 30s
- `web/src/layouts/PadreLayout.jsx` — reescrito con sidebar completo, nav 4 secciones, esquema rojo
- `web/src/pages/padre/Dashboard.jsx` — tarjetas por hijo, resumen bitácora_hoy (ánimo/comida/tarea/conducta), accesos rápidos
- `web/src/pages/padre/Bitacora.jsx` — selector fecha ◄ ►, secciones: ánimo héroe, resumen, alimentación, tarea/conducta, baño, pañal, esfínteres, salud, medicamentos, notas
- `web/src/pages/padre/Pagos.jsx` — semáforo verde/amarillo/rojo/suspendido, comida semanal, historial expandible con filtro por mes
- `web/src/pages/padre/Calendario.jsx` — grilla mensual, chips de color por evento, lista inferior, modal de detalle
- `backend/src/routes/alumnos.js` — `GET /alumnos/mis-hijos` ahora incluye `bitacora_hoy` (LEFT JOIN `bitacora_diaria` + `registro_comida`)
- `backend/src/database/setup_padre_demo.js` — script idempotente: bitácora hoy + última semana, comida, baño, pagos 3 meses, 4 eventos calendario

### FASE 4 — Control de Pagos (2026-04-17)
- `backend/src/routes/pagos.js` — CRUD conceptos, registro de pagos con recargo automático (día 6+), dashboard financiero, estado de cuenta por alumno, generación masiva de cargos, comida semanal
- `web/src/pages/directora/Pagos.jsx` — dashboard con semáforo, stats, top morosos, tabla expandible por alumno, modal de pago, gestión de conceptos
- `mobile/app/(padre)/pagos.jsx` — estado de cuenta por hijo, semáforo, saldo pendiente, comida semanal, historial por mes
- `GET /alumnos/mis-hijos` — alumnos vinculados al padre (tabla `alumno_padre`)

---

### Estructura del Monorepo
```
APP-KINDER/
├── MEMORY.md / CONTEXT.md / PENDIENTES.md
├── backend/
│   ├── migrations/  001_schema_inicial.sql, 002_unique_constraints.sql
│   ├── src/
│   │   ├── controllers/   authController.js, alumnosController.js
│   │   ├── middleware/     auth.js, errorHandler.js, validateRequest.js
│   │   ├── routes/        index.js + 14 módulos completos
│   │   ├── services/      cloudinaryService, whatsappService, qrService
│   │   └── database/      seed.js
│   └── .env (no en git — credenciales reales)
├── web/
│   └── src/pages/directora/  Dashboard, Alumnos, AlumnoPerfil, Grupos,
│                              Personal, Pagos, Calendario, Evaluaciones, Config
└── mobile/
    └── app/
        ├── (maestra)/  index, asistencia, bitacora, galeria, qr-scanner
        └── (padre)/    index, bitacora, pagos, calendario, chat
```

---

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| directora | Todo |
| administrativo | Financiero |
| maestra_titular | Solo su grupo |
| maestra_especial | Grupos y días asignados |
| maestra_puerta | Solo entrada/salida |
| padre | Solo sus hijo(s) |

---

### Credenciales de prueba (contraseña: HappySchool2026!)
| Rol | Email |
|-----|-------|
| Directora | directora@happyschool.edu.mx |
| Administrativo | admin@happyschool.edu.mx |
| Maestra Maternal | maternal@happyschool.edu.mx |
| Maestra Prekinder | prekinder@happyschool.edu.mx |
| Maestra Kinder 1 | kinder1@happyschool.edu.mx |
| Maestra Kinder 2 | kinder2@happyschool.edu.mx |
| Maestra Kinder 3 | kinder3@happyschool.edu.mx |
| Padre (alumna Ana García López) | padre@happyschool.edu.mx |

## 🛠️ Historial de Bugs Corregidos
> Leer SIEMPRE antes de escribir queries o rutas nuevas. Estos errores NO deben repetirse.

- **Calendario web en blanco (2026-04-17):** Proceso Node.js stale ejecutando código viejo. Solución: reiniciar backend. Regla permanente en CONTEXT.md.
- **Duplicados en Seed (2026-04-17):** `ON CONFLICT DO NOTHING` sin constraint activo genera duplicados. Se creó `fix_db.ps1`. Solución estructural: siempre tener UNIQUE constraint antes de usar ON CONFLICT.
- **500 en POST /asistencia/entrada (2026-04-17):** La tabla `registro_entrada` no tenía columna `updated_at` pero la ruta la incluía en `ON CONFLICT DO UPDATE SET`. **Causa raíz:** 41 tablas del schema inicial no tenían `updated_at`. **Solución:** Migración 005 agregó `updated_at TIMESTAMPTZ DEFAULT NOW()` a todas las tablas faltantes. SCHEMA_SHORTCUT.md actualizado con regla: todas las tablas tienen `updated_at` — siempre incluirlo en upserts.
- **Ciclos escolares duplicados (2026-04-17):** El seed no tenía UNIQUE constraint en `ciclos_escolares(nombre)`, generando 7 registros activos con el mismo nombre. `LIMIT 1` devolvía el ciclo incorrecto (sin grupos). Solución puntual: desactivar 6 de los 7, conservar el que tiene los grupos. Pendiente: agregar UNIQUE(nombre) a ciclos_escolares en próxima migración.
- **Comportamiento ENUM incorrecto en mobile bitácora (2026-04-17):** `mobile/bitacora.jsx` enviaba `excelente/bueno` al backend pero el ENUM PostgreSQL es `muy_bien/bien/necesita_mejorar`. Habría fallado al guardar. Corregido en mobile. Regla: siempre verificar ENUM en SCHEMA_SHORTCUT.md antes de hardcodear valores de catálogo.
- **`onSuccess` en `useQuery` incompatible con React Query v5 (2026-04-17):** RQ v5 eliminó `onSuccess`/`onError` de `useQuery` (solo existen en `useMutation`). Afectaba: `mobile/bitacora.jsx` (datos existentes no se cargaban), `web/directora/Asistencia.jsx` (grupo inicial no se seleccionaba). Corregidos con `useEffect`. Regla: en `useQuery` usar `useEffect([data])` para side effects; `onSuccess`/`onError` solo en `useMutation`.
- **`nivel_codigo` ausente en alumnos de mi-grupo (2026-04-17):** El endpoint devuelve `nivel_codigo` en el objeto grupo pero no en cada alumno. `Bitacora.jsx` maestra necesitaba este valor para mostrar la sección de esfínteres. Solución: spread `{ ...alumno, nivel_codigo: grupo.nivel_codigo }` al seleccionar alumno. No se modifica el endpoint para no impactar otros consumidores.
- **`b.cuanto_comio` columna inexistente en `mis-hijos` (2026-04-17):** Al agregar `bitacora_hoy` al endpoint `GET /alumnos/mis-hijos`, se hizo LEFT JOIN con `bitacora_diaria` y se seleccionó `b.cuanto_comio` — pero esa columna **no existe** en `bitacora_diaria`, está en `registro_comida`. El error rompió el endpoint completamente (500). **Regla permanente:** antes de escribir cualquier SELECT con JOIN, leer el schema de CADA tabla involucrada en `001_schema_inicial.sql`. No asumir columnas por intuición. Corrección: agregar segundo LEFT JOIN a `registro_comida rc` y seleccionar `rc.cuanto_comio`.
- **Datos demo inexistentes para vistas del padre (2026-04-17):** El seed original solo crea el usuario padre y lo vincula a Ana, pero NO crea: bitácora, pagos, ni eventos. Las 4 vistas del padre quedaron en blanco al entrar. **Regla permanente:** cuando se construye una vista nueva, verificar SIEMPRE que existan datos de prueba en la BD antes de pedir validación al usuario. Si no existen, crear un script `setup_<modulo>_demo.js` con datos idempotentes. Script creado: `backend/src/database/setup_padre_demo.js`.
- **Maestra sin grupo asignado al correr seed múltiples veces (2026-04-17):** `asignaciones_grupo` no tenía UNIQUE constraint, por lo que `ON CONFLICT DO NOTHING` no hacía nada y se creaban duplicados o registros huérfanos. **Solución:** Migración 004 agrega `UNIQUE(personal_id, grupo_id, ciclo_id)`. Script `setup_maternal.js` para configurar el escenario de prueba de forma idempotente.
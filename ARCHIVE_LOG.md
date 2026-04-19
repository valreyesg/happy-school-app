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
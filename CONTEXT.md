# Happy School App — Comunidad Infantil
## Estado del Proyecto

### Última actualización: 2026-04-16 (noche — sesión 4 cerrada)
### Sesión: Calendario completo (backend + web directora + mobile padre) — pendiente debug pantalla en blanco

---

## Escuela
- Nombre: **Happy School — Comunidad Infantil**
- Tamaño real: ~25 alumnos
- 5 grupos: Maternal, Prekinder, Kinder 1, Kinder 2, Kinder 3
- Personal: 1 directora, 1 administrativo, 4 maestras titulares, 1 maestra de inglés
- Dueña del proyecto: **Valeria** (mamá de alumnas y cliente)

---

## Funcionalidades Completadas ✅

### FASE 1 — Fundación (2026-04-16)
- CONTEXT.md y PENDIENTES.md
- Monorepo: npm workspaces (backend + web) + mobile independiente
- Esquema PostgreSQL completo (50+ tablas, ENUMs, índices, datos iniciales, seed)
- Backend Node.js + Express: auth JWT con rotación de refresh tokens
- Middleware: authenticate, authorize (roles dinámicos), errorHandler, validateRequest
- Controllers: authController (login/refresh/logout/cambiarPassword/perfil), alumnosController (CRUD + foto + QR)
- Rutas completas: auth, alumnos, grupos, asistencia
- Ruta asistencia: filtro de entrada con retardos automáticos + notificaciones WhatsApp automáticas
- Servicios: cloudinaryService, whatsappService (Twilio), qrService
- Stubs de rutas: personal, bitacora, pagos, calendario, evaluaciones, galeria, chat, notificaciones, config, reportes
- Seed inicial: grupos, roles, plantillas WhatsApp (19 plantillas), categorías de eventos, configuración general
- Web React + Tailwind: paleta Happy School completa (rojo, amarillo, verde, morado)
- Web: CSS utilitario (btn-hs, card-hs, input-hs, badge-semaforo, skeleton)
- Web: Logo, Semaforo, AvatarAlumno, SkeletonCard (componentes base)
- Web: SplashPage animada, LoginPage con gradiente, Dashboard directora con semáforo
- Web: DirectoraLayout con sidebar, layouts para los 4 portales
- Web: Router completo con PrivateRoute por rol, todas las páginas stub
- Web: authStore (Zustand + persist), api.js (axios + refresh automático)
- Mobile Expo Router: app.json, babel.config.js, tailwind (NativeWind)
- Mobile: authStore (SecureStore), api.js (axios + refresh)
- Mobile: Splash, LoginScreen con KeyboardAvoidingView
- Mobile: Tabs maestra (Inicio, Asistencia, Bitácora, Galería, QR Scanner)
- Mobile: QR Scanner COMPLETO: escaneo → foto alumno → checklist 8 puntos → resultado semáforo
- Mobile: Dashboard maestra con modo entrada automático 7:00–8:30am
- Mobile: Tabs padre (Inicio, Bitácora, Pagos, Calendario, Chat)
- Mobile: Dashboard padre con tarjetas de hijos y resumen de bitácora

---

## Funcionalidades en Progreso 🔄
- FASE 3 iniciada: bitácora, asistencia y grupos completados. Siguiente: medicamentos, incidentes, reportes.

---

## Completado en sesión 3 (2026-04-16)
- `mobile/app/(maestra)/bitacora.jsx` — pantalla completa: selector de alumno → formulario con ánimo, baño, pañal (Maternal), esfínteres, comida, tarea, comportamiento, salud, notas + guardar con upsert
- `web/src/pages/directora/Grupos.jsx` — CRUD completo: tarjetas por nivel con barra de ocupación, modal crear/editar (nombre, nivel, turno, horario, capacidad, color, maestra titular, activo/inactivo)
- `mobile/app/(maestra)/asistencia.jsx` — lista del grupo con semáforo en tiempo real (refresh 30s), buscador, filtros (todos/pendientes/presentes), modal de registro manual (presente/retardo/ausente + temperatura + notas)
- `backend/src/routes/personal.js` — CRUD completo: GET lista (filtros activo/rol), GET detalle, POST crear (personal + usuario en una sola operación), PUT editar (sincroniza activo/rol en usuarios), POST reset-password, POST asignar-grupo, DELETE quitar-grupo
- `web/src/pages/directora/Personal.jsx` — tarjetas con rol coloreado, grupos asignados con ⭐ titular, badge "sin acceder", stats (activos/sin grupo/sin login), modal crear/editar con datos personales + cuenta + asignación de grupo, confirmación de reset de contraseña
- `mobile/app/(padre)/bitacora.jsx` — lectura completa de la bitácora: selector de fecha (‹/›), ánimo héroe, resumen visual 4 iconos, secciones: alimentación, tarea/conducta, baño, pañal, esfínteres, salud (alertas rojas), medicamentos, notas de la maestra
- `backend/src/routes/alumnos.js` — 8 nuevos endpoints: GET/POST/DELETE documentos (Cloudinary), GET/POST/DELETE personas autorizadas (máx. 2, foto + INE x2 obligatorios), GET/POST/DELETE blacklist
- `web/src/pages/directora/AlumnoPerfil.jsx` — ruta `/directora/alumnos/:id`: perfil completo con foto/QR/datos médicos, tutores, personas autorizadas (formulario con 3 fotos drag), documentos (subir PDF/imagen + semáforo de requisitos), notas
- `web/src/pages/directora/Alumnos.jsx` — botón "Ver perfil" (FileText) navega a `/directora/alumnos/:id`
- `web/src/App.jsx` — ruta `alumnos/:id` → DirectoraAlumnoPerfil

## Completado en sesión 2 (2026-04-16)
- `GET /alumnos/por-qr/:qrData` — devuelve alumno + estado de entrada de hoy + retardos del mes
- `GET /grupos/mi-grupo` — devuelve grupo de la maestra + alumnos con asistencia y bitácora del día
- `GET /reportes/dashboard` — stats completas: asistencia, pagos, retardos, documentación, por grupo
- `web/src/pages/directora/Alumnos.jsx` — CRUD completo con búsqueda, filtros, modal crear/editar
- `backend/src/routes/bitacora.js` — rutas completas: GET, POST /guardar, POST /panial, POST /medicamento

## Pendientes — Continuación
Ver PENDIENTES.md para el detalle completo.

---

## Decisiones de Arquitectura

### Stack (FIJO — no cambiar sin autorización de Valeria)
- **Mobile:** React Native con Expo (Android e iOS)
- **Web:** React con Tailwind CSS
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT (access token 15min + refresh token 7 días, rotación)
- **Archivos:** Cloudinary (fotos y documentos)
- **Push notifications:** Firebase Cloud Messaging (FCM)
- **WhatsApp:** Twilio WhatsApp Business API
- **Calendario:** Google Calendar API
- **Exportación:** xlsx + pdfkit

### Estructura del Monorepo
```
APP-KINDER/
├── MEMORY.md           ← LEER PRIMERO
├── CONTEXT.md          ← LEER SEGUNDO
├── PENDIENTES.md       ← LEER TERCERO
├── README.md
├── LICENSE (MIT)
├── package.json (workspace root: backend + web)
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/     authController.js, alumnosController.js
│   │   ├── middleware/      auth.js, errorHandler.js, validateRequest.js
│   │   ├── routes/          index.js + 13 módulos
│   │   └── services/        cloudinaryService.js, whatsappService.js, qrService.js
│   ├── migrations/          001_schema_inicial.sql
│   ├── src/database/seed.js
│   ├── database.json        (node-pg-migrate config)
│   └── package.json
├── web/
│   ├── src/
│   │   ├── components/ui/   Logo, Semaforo, AvatarAlumno, SkeletonCard
│   │   ├── layouts/         DirectoraLayout, AdministrativoLayout, MaestraLayout, PadreLayout
│   │   ├── pages/           directora/, administrativo/, maestra/, padre/
│   │   ├── store/authStore.js
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── mobile/
    ├── app/
    │   ├── _layout.jsx
    │   ├── index.jsx        (Splash)
    │   ├── login.jsx
    │   ├── (maestra)/       _layout, index, asistencia, bitacora, galeria, qr-scanner
    │   └── (padre)/         _layout, index, bitacora, pagos, calendario, chat, galeria, qr
    ├── src/
    │   ├── store/authStore.js (SecureStore)
    │   └── services/api.js
    ├── app.json
    ├── babel.config.js
    ├── tailwind.config.js
    └── package.json
```

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| directora | Todo — académico y configuración |
| administrativo | Todo financiero |
| maestra_titular | Solo su grupo asignado |
| maestra_especial | Grupos y días asignados |
| maestra_puerta | Solo entrada/salida del día |
| padre | Solo su(s) hijo(s) |

### Paleta de Colores Happy School
- Rojo: `#E53E3E` / `#FC8181`
- Amarillo: `#D69E2E` / `#F6E05E`
- Verde: `#38A169` / `#68D391`
- Morado: `#805AD5` / `#B794F4`
- Fondo: `#FFFFFF`

### Semáforo de Estado
- 🟢 Verde: Al corriente / Bien
- 🟡 Amarillo: Atención / En período de pago
- 🔴 Rojo: Urgente / Con atraso
- ⛔ Gris: Suspendido / Más de 30 días

### Reglas de Negocio Clave
- Horario entrada sin retardo: 7:00–8:30am (8:31+ = retardo automático)
- Máx. 3 retardos/mes → al 4to no entra ese día
- Colegiatura: pago sin recargo del 1 al 5 del mes, recargo desde el día 6
- Comida: pago obligatorio cada lunes → sin pago = sin servicio el martes
- Personas autorizadas para recoger: máx. 2, requieren foto + INE obligatorios
- Extensión de horario: $125/hora o fracción después del horario normal
- Alerta a padres si no recogen al alumno en 5 minutos

---

## Credenciales de desarrollo (seed)
- **Directora:** directora@happyschool.edu.mx / HappySchool2026!
- **Admin:** admin@happyschool.edu.mx / HappySchool2026!

---

## Problemas Conocidos
- Los endpoints `/alumnos/por-qr/`, `/grupos/mi-grupo` y `/reportes/dashboard` aún no existen — el mobile los necesita para funcionar completamente
- Mobile: cambiar la IP en `mobile/src/services/api.js` línea 4 por la IP real de tu máquina en desarrollo

---

## Notas Importantes
- Todo el sistema en **español**
- Licencia **MIT** — GitHub opensource
- Máximo **2 toques** para cualquier acción frecuente (regla de UX)
- Todos los catálogos en base de datos, **nunca hardcodeados**
- Preparado para escalar hasta 200 alumnos sin cambios de arquitectura
- En mobile, el QR Scanner activa el modo entrada automáticamente entre 7:00 y 8:30am

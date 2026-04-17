# Happy School App — Comunidad Infantil
## Estado del Proyecto

### Última actualización: 2026-04-17 (sesión 6 cerrada)
### Sesión: Bug fix calendario web — proceso stale + duplicados categorias_evento

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

### FASE 4 — Control de Pagos (2026-04-17)
- `backend/src/routes/pagos.js` — CRUD conceptos, registro de pagos con recargo automático (día 6+), dashboard financiero, estado de cuenta por alumno, generación masiva de cargos, comida semanal
- `web/src/pages/directora/Pagos.jsx` — dashboard con semáforo, stats, top morosos, tabla expandible por alumno, modal de pago, gestión de conceptos
- `mobile/app/(padre)/pagos.jsx` — estado de cuenta por hijo, semáforo, saldo pendiente, comida semanal, historial por mes
- `GET /alumnos/mis-hijos` — alumnos vinculados al padre (tabla `alumno_padre`)

---

## Entorno de Desarrollo

### Cómo iniciar
```
# Backend (en terminal en /backend)
node src/index.js

# Web (en terminal en /web)
npm run dev

# Seed (solo si la DB está vacía o quieres restaurar datos de prueba)
node src/database/seed.js
```

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

### Si el seed crea duplicados
Ejecutar `fix_db.ps1` en `C:\Users\vreyesg\AppData\Local\Temp\` — limpia datos de prueba, aplica migraciones pendientes y re-inserta el seed.

---

## Notas de Schema Importantes (para evitar errores futuros)
- `conceptos_pago.monto` — el campo es `monto` (NO `monto_base`)
- `pagos.monto_base` — el campo es `monto_base` (NO `monto`)
- `alumnos` no tiene columna `activo` — usar `deleted_at IS NULL`
- `personal` no tiene `puesto` ni `ciclo_id` — solo `nombre_completo`, `usuario_id`, etc.
- La relación padres↔alumnos es tabla `alumno_padre` (NO `tutores`)
- Asignación de maestras a grupos: tabla `asignaciones_grupo` (NO `grupos_personal`)

---

## Problemas Conocidos
- ~~Calendario web en blanco~~ ✅ RESUELTO sesión 6 — el proceso del backend estaba desactualizado (ver nota abajo)
- IP hardcodeada en `mobile/src/services/api.js` línea 4 → cambiar a IP real

## Nota crítica de operación — Backend
**Siempre reiniciar el proceso del backend** al iniciar sesión de desarrollo.
Node.js no recarga archivos automáticamente. Si el proceso lleva corriendo desde una sesión anterior, puede estar ejecutando código viejo.
Comando: matar proceso en puerto 3000 y volver a correr `node src/index.js`

## Regla de calidad — Constraints únicos
Toda tabla debe tener UNIQUE o PRIMARY KEY en columnas que no deban repetirse.
Tablas ya protegidas: `usuarios(email)`, `alumnos(curp)`, `grupos(nombre+ciclo_id)`,
`conceptos_pago(nombre)`, `categorias_evento(nombre)` — migración 003.
**Pendiente revisar**: otras tablas que puedan acumular duplicados.

---

## Decisiones de Arquitectura

### Stack (FIJO — no cambiar sin autorización de Valeria)
- **Mobile:** React Native con Expo (Android e iOS)
- **Web:** React con Tailwind CSS
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT (access 15min + refresh 7 días, rotación)
- **Archivos:** Cloudinary
- **Push:** Firebase Cloud Messaging
- **WhatsApp:** Twilio (lazy init para evitar crash con credentials placeholder)
- **Calendario:** Google Calendar API (pendiente)
- **Exportación:** xlsx + pdfkit (pendiente)

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

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| directora | Todo |
| administrativo | Financiero |
| maestra_titular | Solo su grupo |
| maestra_especial | Grupos y días asignados |
| maestra_puerta | Solo entrada/salida |
| padre | Solo sus hijo(s) |

### Reglas de Negocio Clave
- Horario entrada sin retardo: 7:00–8:30am (8:31+ = retardo automático)
- Máx. 3 retardos/mes → al 4to no entra ese día
- Colegiatura: pago sin recargo del 1 al 5, recargo desde día 6 ($50/día)
- Comida: pago lunes → sin pago = sin servicio el martes
- Personas autorizadas para recoger: máx. 2, foto + INE obligatorios
- Extensión de horario: $125/hora después del horario normal

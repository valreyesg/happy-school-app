# PENDIENTES — Happy School App

## Última actualización: 2026-04-16 (noche — sesión 3 cerrada)

---

## ✅ FASE 1 — Completada (2026-04-16)

### Fundación del proyecto
- [x] CONTEXT.md, PENDIENTES.md, MEMORY.md
- [x] README.md, LICENSE (MIT), .gitignore
- [x] Monorepo con npm workspaces
- [x] Esquema completo de PostgreSQL (50+ tablas)
- [x] Migración 001_schema_inicial.sql
- [x] Seed: grupos, roles, plantillas WhatsApp (19), configuración general
- [x] Backend Node.js + Express base con helmet, cors, rate limiting
- [x] Autenticación JWT: login, refresh (rotación), logout, cambiar password
- [x] Middleware: authenticate, authorize (roles dinámicos), errorHandler, validateRequest
- [x] Controllers: authController, alumnosController (CRUD + foto + QR)
- [x] Rutas funcionales: auth, alumnos, grupos, asistencia (con lógica completa)
- [x] Ruta asistencia: filtro de entrada, retardos, salida, verificación blacklist
- [x] Notificaciones WhatsApp automáticas en entrada (retardo, no entrada, fiebre)
- [x] Stubs de rutas: personal, bitacora, pagos, calendario, evaluaciones, galeria, chat, notificaciones, config, reportes
- [x] Servicios: cloudinaryService, whatsappService (Twilio), qrService
- [x] Web: paleta Happy School, fuente Nunito, CSS utilitario completo
- [x] Web: Logo, Semaforo, AvatarAlumno, SkeletonCard
- [x] Web: SplashPage, LoginPage, Dashboard directora (con semáforo y stats)
- [x] Web: DirectoraLayout (sidebar), AdministrativoLayout, MaestraLayout, PadreLayout
- [x] Web: App.jsx con router completo y PrivateRoute por rol
- [x] Web: authStore (Zustand + localStorage persist), api.js (axios + refresh auto)
- [x] Web: todas las páginas stub para los 4 portales
- [x] Mobile: app.json, babel.config.js, NativeWind, package.json
- [x] Mobile: authStore (SecureStore), api.js (axios + refresh auto)
- [x] Mobile: SplashPage → LoginScreen → redirect por rol
- [x] Mobile: Tabs maestra (Inicio, Asistencia, Bitácora, Galería, QR)
- [x] Mobile: QR Scanner COMPLETO (escaneo → checklist 8 puntos → semáforo resultado)
- [x] Mobile: Dashboard maestra con modo entrada automático 7:00–8:30am
- [x] Mobile: Tabs padre (Inicio, Bitácora, Pagos, Calendario, Chat)
- [x] Mobile: Dashboard padre con tarjetas de hijos

---

## 🔴 URGENTE — Necesario para que el mobile funcione

- [x] `GET /alumnos/por-qr/:qrData` — el QR scanner llama este endpoint ✅
- [x] `GET /grupos/mi-grupo` — el dashboard de maestra necesita la lista de alumnos ✅
- [x] `GET /reportes/dashboard` — el dashboard de directora (web) necesita stats ✅

---

## 📋 FASE 2 — Alumnos y Grupos (próxima sesión)

### Backend
- [ ] Endpoint `/alumnos/por-qr/:qrData` — buscar alumno por dato del QR
- [ ] Endpoint `/grupos/mi-grupo` — grupo de la maestra autenticada + alumnos del día
- [ ] Endpoint `/reportes/dashboard` — stats para dashboard directora
- [x] Endpoint documentos: subir, listar, eliminar (con Cloudinary) ✅
- [x] Endpoint personas autorizadas: CRUD por alumno ✅
- [x] Endpoint blacklist: CRUD, verificación en salida ✅

### Web — Directora
- [x] Página `DirectoraAlumnos.jsx` — lista con búsqueda, filtro por grupo, semáforo documentación ✅
- [x] Modal / formulario crear alumno ✅
- [x] Modal / formulario editar alumno ✅
- [x] Vista perfil completo del alumno con documentos y personas autorizadas ✅
- [x] Página `DirectoraGrupos.jsx` — CRUD grupos, asignación de maestras ✅
- [x] Página `DirectoraPersonal.jsx` — CRUD personal, asignación de roles ✅

### Mobile — Maestra
- [x] Pantalla `asistencia.jsx` — lista del grupo con estado de entrada, modo manual si no hay QR ✅
- [x] Pantalla `bitacora.jsx` — formulario por alumno: baño, pañal, esfínteres, comida, ánimo, salud, tarea ✅

### Git
- [x] `git init` en la raíz del proyecto ✅
- [x] Primer commit con toda la FASE 1 + FASE 2 ✅
- [x] Repo en GitHub: https://github.com/valreyesg/happy-school-app ✅
- [x] `.env.example` como único archivo de credenciales ✅

---

## 📋 FASE 3 — Bitácora y Asistencia completa

- [x] Bitácora diaria: registro completo maestra mobile ✅
  - [x] Baño (pipí/popó con + y -) ✅
  - [x] Pañal (solo Maternal: hora, condición, irritación) ✅
  - [x] Control de esfínteres (Prekinder y Kinder 1) ✅
  - [x] Alimentación ✅
  - [x] Estado de ánimo (botones emoji grandes) ✅
  - [x] Tarea y comportamiento ✅
  - [ ] Fotos de actividades (pendiente)
- [x] Bitácora lectura padre mobile — completa con navegación por fecha ✅
- [x] Registro de medicamentos + notificación WhatsApp automática ✅ (backend)
- [ ] Incidentes y accidentes + firma digital del padre
- [ ] Reporte de asistencia: exportar Excel y PDF
- [ ] Vista de asistencia mensual por grupo

---

## 📋 FASE 4 — Control de Pagos

- [ ] CRUD conceptos de pago configurables
- [ ] Registro de pagos con recargos automáticos (cálculo día 6+)
- [ ] Dashboard financiero con semáforo (verde/amarillo/rojo/suspendido)
- [ ] Control de comida semanal (pago lunes, suspensión martes)
- [ ] Cobros de extensión de horario automáticos ($125/hr)
- [ ] Generación de recibos en PDF
- [ ] Envío de recibo por WhatsApp (automático al registrar pago)
- [ ] Estado de cuenta familiar consolidado (familias con varios hijos)
- [ ] Exportación Excel y PDF por alumno / grupo / mes

---

## 📋 FASE 5 — Inscripciones y Administración

- [ ] Formulario de inscripción con carga de documentos
- [ ] Proceso de reinscripción para alumnos existentes
- [ ] Bajas y egresos con historial conservado
- [ ] Panel de configuración directora (grupos, personal, horarios, catálogos)
- [ ] Ciclos escolares: crear, archivar, historial

---

## 📋 FASE 6 — Calendario, Comunicación y Contenido

- [ ] Calendario de eventos con categorías configurables
- [ ] Integración Google Calendar API (botón "Agregar a mi Google Calendar")
- [ ] Temario mensual (PDF o formulario directo)
- [ ] Menú semanal de comida
- [ ] Lista de útiles por grupo (con progreso del padre)
- [ ] Tareas y actividades con fecha límite
- [ ] Avisos con confirmación de lectura (✅)

---

## 📋 FASE 7 — Evaluaciones y Boletas

- [ ] Indicadores de evaluación configurables por nivel
- [ ] Captura de evaluaciones por maestra
- [ ] Revisión y autorización de la directora antes de publicar
- [ ] Generación de boletas en PDF
- [ ] Reporte mensual de desarrollo por alumno en PDF

---

## 📋 FASE 8 — Galería y Chat

- [ ] Álbumes de fotos por evento/mes con compresión automática
- [ ] Privacidad: fotos individuales vs. grupales
- [ ] Chat grupo maestra + padres del grupo
- [ ] Chat individual padre–directora, padre–maestra

---

## 📋 FASE 9 — Notificaciones y WhatsApp

- [ ] Firebase Cloud Messaging: registrar tokens, enviar push
- [ ] Todas las notificaciones automáticas por WhatsApp (19 plantillas ya en DB)
- [ ] Encuestas y votaciones con resultados en tiempo real
- [ ] Panel de plantillas WhatsApp editables desde la app

---

## 📋 FASE 10 — Funciones Avanzadas

- [ ] Modo offline para maestras (caché local, sincronización al reconectar)
- [ ] Backup automático diario
- [ ] Exportaciones Excel y PDF completas (todos los módulos)
- [ ] Dashboard optimizado por rol con métricas del día
- [ ] Pruebas UX, ajustes finales, optimización

---

## 🐛 Bugs Conocidos
- IP hardcodeada en `mobile/src/services/api.js` línea 4 (192.168.1.100) — cambiar a IP real de desarrollo
- Falta el endpoint `/alumnos/por-qr/` — QR scanner falla si se prueba sin él

---

## 💡 Ideas para Futuro (fuera del alcance actual)
- Multitenancy para otras escuelas
- Módulo de nómina del personal
- Facturación electrónica (SAT)

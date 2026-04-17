# PENDIENTES — Happy School App

## Última actualización: 2026-04-17 (sesión 5 cerrada)

---

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
- [ ] Fotos de actividades en bitácora (pendiente)
- [ ] Incidentes y accidentes + firma digital del padre
- [ ] Reporte de asistencia: exportar Excel y PDF
- [ ] Vista de asistencia mensual por grupo

## ✅ FASE 4 — Completada (2026-04-17)
- [x] CRUD conceptos de pago configurables
- [x] Registro de pagos con recargo automático (día 6+)
- [x] Dashboard financiero con semáforo (verde/amarillo/rojo/suspendido)
- [x] Control de comida semanal
- [x] Estado de cuenta por alumno — web y mobile padre
- [x] GET /alumnos/mis-hijos
- [ ] Cobros de extensión de horario automáticos ($125/hr)
- [ ] Generación de recibos en PDF
- [ ] Envío de recibo por WhatsApp (automático al registrar pago)
- [ ] Exportación Excel y PDF por alumno / grupo / mes

---

## 🐛 Bugs Conocidos
- Calendario web en blanco — pendiente debug
- IP hardcodeada en `mobile/src/services/api.js` línea 4

---

## 📋 FASE 5 — Inscripciones y Administración

- [ ] Formulario de inscripción con carga de documentos
- [ ] Proceso de reinscripción para alumnos existentes
- [ ] Bajas y egresos con historial conservado
- [ ] Panel de configuración directora (grupos, personal, horarios, catálogos)
- [ ] Ciclos escolares: crear, archivar, historial

---

## 📋 FASE 6 — Calendario, Comunicación y Contenido

- [x] Calendario de eventos con categorías configurables ✅
- [ ] Integración Google Calendar API
- [ ] Temario mensual (PDF o formulario)
- [ ] Menú semanal de comida
- [ ] Lista de útiles por grupo (con progreso del padre)
- [ ] Tareas y actividades con fecha límite
- [ ] Avisos con confirmación de lectura

---

## 📋 FASE 7 — Evaluaciones y Boletas

- [ ] Indicadores de evaluación configurables por nivel
- [ ] Captura de evaluaciones por maestra
- [ ] Revisión y autorización de la directora
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
- [ ] Todas las notificaciones automáticas por WhatsApp (19 plantillas en DB)
- [ ] Encuestas y votaciones
- [ ] Panel de plantillas WhatsApp editables

---

## 📋 FASE 10 — Funciones Avanzadas

- [ ] Modo offline para maestras (caché local + sincronización)
- [ ] Backup automático diario
- [ ] Exportaciones Excel y PDF completas (todos los módulos)
- [ ] Dashboard optimizado por rol con métricas del día
- [ ] Pruebas UX, ajustes finales, optimización

---

## 💡 Ideas para Futuro (fuera del alcance actual)
- Multitenancy para otras escuelas
- Módulo de nómina del personal
- Facturación electrónica (SAT)

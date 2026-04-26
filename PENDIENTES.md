# PENDIENTES — Happy School App

**Última actualización:** 2026-04-25 | **Sesión actual:** 76
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 📋 SESIÓN 76 — REORGANIZACIÓN ARQUITECTÓNICA (FASES 3+4)

---

## 🏗️ ARQUITECTURA Y ESTRUCTURA — PLAN MULTI-SESIÓN

**Estado:** En progreso (FASE 1+2 completadas en sesión 75 — ver ARCHIVE_LOG)

### FASE 3 — Reorganización de archivos (Sesión 76, ~80 min)
- [ ] Mover `backend/src/database/` → `backend/scripts/`
  - `seeds/` — todos los seed_*.js (11 archivos)
  - `setup/` — todos los setup_*.js (8 archivos)
  - `fixes/` — todos los fix_*.js (5 archivos)
  - `checks/` — check_*.js, apply_fix.js, check_db.js
  - Actualizar imports: `require('../config/database')` → `require('../../src/config/database')`
- [ ] Consolidar migration runners: `migrate.js` + `run-migration.js` → `backend/scripts/migrate-runner.js`
- [ ] Mover docs de Claude: `RESUMEN_SESION_*.md` → `/docs/`
- [ ] Eliminar archivos temporales: fix_emojis_skin.js, temp_seed_ana.sql, verify_endpoint.js, test_api.js, test_grupos.js

### FASE 4 — .gitignore y builds (Sesión 76, ~20 min)
- [ ] Actualizar `.gitignore` raíz: logs, builds, temp files
- [ ] Crear `web/.gitignore` y `mobile/.gitignore`
- [ ] Verificar que `dist/` y `.expo/` no estén versionados

### FASE 5 — Tests de smoke (Sesión 77, ~45 min)
- [ ] Crear `tests/smoke/health.test.js` (GET /health)
- [ ] Crear `tests/smoke/auth.test.js` (login, autorización)
- [ ] Agregar script `npm run test:smoke` a package.json raíz

### FASE 6 — Script dev unificado (Sesión 77, ~15 min)
- [ ] Instalar `concurrently`
- [ ] Agregar scripts: `npm run dev` (backend + web), `npm run dev:full` (+ mobile)
- [ ] Documentar uso en README.md

### FASE 7 — Normalizar imports web (Sesión 78, baja urgencia)
- [ ] Migrar 24 archivos: paths relativos (`../../`) → alias (`@/`)
- [ ] Enfoque: componentes de `pages/` que importan de `services/` y `store/`

---

## 🎨 UX/UI AUDIT Y MEJORA

- [ ] **Revisar y mejorar UX/UI completa (web + mobile)**
  - **Contexto:** Identificar usuarios finales por rol:
    - Papá: necesita información clara de hijo, tareas, pagos
    - Miss: herramienta de trabajo diario, eficiencia crítica
    - Directora: visión ejecutiva, reportes, alertas
    - Mobile: interfaz simplificada para papá en movimiento
  - **Tareas:**
    - [ ] Auditoría UX/UI web (padre, miss, directora)
    - [ ] Auditoría UX/UI mobile
    - [ ] **Consistency check: Formato y estilo de texto homogéneo**
      - Fechas: formato CONSISTENTE (ej: "Lun 24 de Abr" en todos lados)
      - Saludos: mismo tono y estructura en cada portal
      - Capitalización: CONSISTENTE mayúsculas/minúsculas/CamelCase
      - Iconografía: mismo emoji para mismo concepto
      - Espaciado y tamaño fuente en elementos similares
      - **Objetivo:** No parecer que lo hicieron diferentes personas
    - [ ] Consistency check: colores, tipografía, spacing
    - [ ] Validar flujos por rol (¿cada usuario encuentra lo que busca en <3 clicks?)
    - [ ] Accesibilidad (contraste, tamaño texto, navegación)
    - [ ] Responsive design validation (mobile, tablet, desktop)
  - **Herramientas:** Figma, accesibilidad tools, device testing
  - **Complejidad:** ⭐⭐⭐⭐ (2-3 sesiones)

---

## 🔁 DEUDA TÉCNICA — Paridad Web ↔ Mobile

> Correcciones aplicadas en web que deben verificarse y corregirse en mobile si aplica.

- [ ] **Verificar paridad web ↔ mobile completa:** Revisar todas las correcciones hechas en web (sesiones anteriores) y confirmar que mobile tiene los mismos cambios aplicados. Hacer grep por función/endpoint afectado en ambos lados.

---

# 🎯 PRIORIZACIÓN POR SPRINTS

## 🎯 MEDIANO PLAZO — Próximas sesiones (1-2 meses)

### 🍽️ MÓDULO COMIDA AVANZADO (Bitácora 4 tiempos)

### 🏥 SALUD Y MEDICACIÓN (Bloque completo)
- [ ] **Recepción de Medicamento:** Campo Filtro Entrada → foto receta + foto envase → habilitar administración.
- [ ] **Dosis + Recordatorio automático Miss:** Campo bitácora con timestamp.
- [ ] **Justificantes Inasistencia:** Endpoint Directora marcar falta "Justificada" → excluir de contador suspensión.
- [ ] **Depósición especial:** Marcar "Diarrea" en bitácora salud.
- [ ] **Filtro Sanitario Salida:** Checklist (pañal, pertenencias, estado físico) + botón "Entrega Conforme".
- [ ] **Control de Insumos (Maternal/Prekinder):** Contador stock pañales → alerta padre WhatsApp y notificación cuando <5.

### 🚪 SEGURIDAD — SALIDA AVANZADA
- [ ] **Detección Hermanos:** Al QR salida, alerta si hay hermanos en otros grupos.
- [ ] **Protocolo Salida Anticipada:** Formulario motivo + hora + quién retira + firma digital tutor + notificación al otro padre.
- [ ] **QR Temporal (Círculos Confianza):** Pase invitado 2 horas, padre envía por WhatsApp o Correo a tercero.

### 👨‍👩‍👧 GESTIÓN ALUMNOS AVANZADA
- [ ] **Perfil 360°:** Padre + Madre + 2 autorizados (fotos + INE).
- [ ] **No-Duplicidad Inclusiva:** Validar por email/ID (permitir homoparentales: 2 Mamás/Papás).
- [ ] **`familia_id` — Vínculo Hermanos:** Detección automática, navegación rápida, descuentos futuros.

- [ ] **Modalidad "Solo Extensión":** 3:00-6:00 PM, check-in desde 2:45 PM.
- [ ] **Niños Visitantes:** Registro rápido foto + distintivo 🌟.
- [ ] **Automatización de Vistas:** A las 3:06 PM, Dashboard filtra y muestra *únicamente* niños de Extensión o Estancia.
- [ ] **Validación de Cobro Automática:** Entrada >2:45 PM se categoriza como "Servicio de Extensión" o "Estancia por Día".

### 💰 FINANZAS — AUTOMATIZACIÓN AVANZADA
- [ ] **Configuración Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **Segmentación Servicios:** Regulares, Solo Extensión, Estancia por Día.
- [ ] **Recargo Impuntualidad:** $125 MXN automático a las 3:06 PM (niños sin extensión). Panel Directora condonar con motivo.
- [ ] **12 Cargos Colegiatura:** Auto con recargos día 6.
- [ ] **Comprobante Comida:** Adjuntar foto transferencia O marcar "Efectivo Lunes" → recordatorio WhatsApp 8:00 AM.
- [ ] **Exportación Contable:** Excel filtrable para admin.
- [ ] **Generación Recibos PDF:** Automático al registrar pago + envío WhatsApp o Correo papá. Ideal tener dentro del panel de pagos el recibo correspondiente a cada pago.

---

## 🎯 LARGO PLAZO — Futuro (2-3 meses)

### 🗂️ CATÁLOGOS DINÁMICOS — 100% ADMINISTRABLE
- [ ] **Auditoría Hardcoded:** Scan profundo → Estatus, Grados, Roles, Parentescos, Alergias, Tipos Pago, Motivos Salida, Emojis, etc.
- [ ] **Crear tablas dinámicas:** Para cada catálogo identificado.
- [ ] **Panel Directora — CRUD completo:** Crear, editar, eliminar catálogos sin código.
- [ ] **Configuración Negocio:** Panel settings editable (recargos, tolerancia, horarios dashboard).

### 📊 REPORTES Y EXPORTACIONES
- [ ] **Reporte Asistencia:** Excel + PDF (por grupo, mes, alumno).
- [ ] **Reporte Tareas:** Excel con % entrega por grupo/alumno.
- [ ] **Reporte Finanzas:** Excel + PDF (ingresos, adeudos, desglose servicios).

### 🎓 EVALUACIONES Y BOLETAS (FASE 7)
- [ ] **Indicadores configurables:** Por nivel en catálogos dinámicos.
- [ ] **Captura Miss:** Calificaciones/observaciones.
- [ ] **Validación Directora:** Aprobación antes de enviar.
- [ ] **Boletas PDF:** Generación automática.
- [ ] **Reporte Desarrollo:** PDF mensual por alumno.

### 📷 GALERÍA Y CHAT (FASE 8)
- [ ] **Álbumes fotos:** Por evento/mes con compresión.
- [ ] **Privacidad:** Fotos individuales vs. grupales.
- [ ] **Chat Grupo Miss + Papás:** Por grupo.
- [ ] **Chat Familiar:** Papás-Directora-Miss.

### 🔔 NOTIFICACIONES AVANZADAS (FASE 9)
- [ ] **Firebase Cloud Messaging:** Registrar tokens, enviar push.
- [ ] **WhatsApp Automático:** 19 plantillas en DB (ya documentadas).
- [ ] **Panel Plantillas:** Editable por Directora.

### 🚀 OPTIMIZACIÓN FINAL (FASE 10)
- [ ] **Modo Offline Miss:** Caché local + sincronización.
- [ ] **Backup Automático:** Diario.
- [ ] **Pruebas UX + Performance:** Optimización completa.

---

# 📊 TABLA DE PRIORIZACIÓN Y DEPENDENCIAS

| Prioridad | Sprint | Tarea | Complejidad | Estimado | Bloquea |
|-----------|--------|-------|-------------|----------|---------|
| 🔴 CRÍTICA | 39 | Historial ciclo Sprint 3 | ⭐⭐ | 8-10h | Papá portal |
| 🟠 ALTA | 40-41 | Dashboard Directora | ⭐⭐ | 6-8h | Usabilidad |
| 🟠 ALTA | 40-41 | Notificaciones globales | ⭐⭐⭐ | 12-16h | Todos portales |
| 🟡 MEDIA | 40-41 | Tabs por nivel (UI) | ⭐ | 4-5h | - |
| 🟡 MEDIA | 42-43 | Tareas grupales | ⭐⭐⭐ | 16-20h | - |
| 🟢 BAJA | 44+ | Catálogos dinámicos | ⭐⭐⭐⭐ | 24-32h | Configurabilidad |

---

> Historial detallado de sesiones completadas → ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md)
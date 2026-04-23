# PENDIENTES — Happy School App

**Última actualización:** 2026-04-23 | **Estado:** Sesión 50 COMPLETADA — Sesión 51 próxima

---

# 🎯 PRIORIZACIÓN POR SPRINTS

## 📍 SESIÓN 51 (PRÓXIMA) — FASE 2 (Inconsistencias Silenciosas)

### ⚠️ FASE 2 — Inconsistencias Silenciosas (datos que se muestran mal)

- [ ] **Comportamiento vacío en padre mobile:** `mobile/app/(padre)/bitacora.jsx:35-39` usa claves `excelente` y `bueno`. Backend guarda `muy_bien` y `bien`. Fix: alinear a `muy_bien`, `bien`, `necesita_mejorar`.
- [ ] **Ánimo siempre "🤔" en dashboard padre mobile:** `mobile/app/(padre)/index.jsx:21` usa `inquieto` y `energico`. Backend guarda `feliz`, `activo`, `cansado`, `triste`, `irritable`. Fix: alinear claves.
- [ ] **Emoji ✅ para "No comió" en maestra mobile:** `mobile/app/(maestra)/bitacora.jsx:275-280` — semánticamente incorrecto. Fix: alinear con otros portales: `😋 😊 😐 ❌`.
- [ ] **Lógica de esfínteres frágil:** `mobile/app/(maestra)/bitacora.jsx:124-129` — busca "kinder 1" como substring. Fix: usar `nivel_codigo` estructurado.
- [ ] **Semáforo de pagos con 3 lógicas distintas:** Directora (días atraso), Padre (monto), Semaforo.jsx (otro umbral). Fix: calcular en backend, devolver campo `semaforo`.

---

## 🎯 SESIÓN 52 (PRÓXIMA DESPUÉS DE 51) — FASE 3 (Hardcodeados) + Histórico + Notificaciones

### 🗂️ FASE 3 — Eliminar Hardcodeados (catálogos duplicados)

- [ ] **Backend — endpoint `GET /catalogos/:tipo`:** Crear endpoint dinámico para `animo`, `comportamiento`, `cuanto-comio`, `tiempos-comida`, `condiciones-panial`, `niveles`, `roles-personal`, `estados-alumno`, `tipos-documento`, `metodos-pago`, `conceptos-pago`, `tipos-parentesco`.
- [ ] **Web — reemplazar arrays hardcodeados:** `Bitacora.jsx`, `CiclosEscolares.jsx`, `Grupos.jsx`, `Personal.jsx`, `TurnoPuerta.jsx`, `Alumnos.jsx`, `AlumnoPerfil.jsx`, `Pagos.jsx`, `Dashboard.jsx` (padre).
- [ ] **Mobile — reemplazar arrays hardcodeados:** `bitacora.jsx` (padre), `index.jsx` (padre), `bitacora.jsx` (maestra).
- [ ] **IP hardcodeada en mobile:** `mobile/src/services/api.js` → `EXPO_PUBLIC_API_URL` env var en `mobile/.env`.

### 📂 HISTÓRICO POR CICLO ESCOLAR — PORTAL PAPÁ
- [ ] **Dashboard padre — Selector de ciclo:** Mostrar ciclo actual por defecto, permitir consultar ciclos pasados. Endpoint `GET /alumnos/:id/ciclos` ya existe.
- [ ] Aplica a: bitácora histórica, pagos históricos.

### 📢 NOTIFICACIONES GLOBALES (Impacto alto — afecta 3 portales)
- [ ] **Barra de notificaciones (campanita):** Mostrar nueva notificación, marcar como leída, contador.
- [ ] **Modal en pantalla completa:** Cuando Miss/Directora crea evento/tarea/cancela comida → notificación modal en papá.
- [ ] **Triggers multi-evento:** Evento nuevo, Tarea nueva, Pago atrasado, Cancelación comida, Entrega/recogida por tercero.

---

## 🎯 SESIÓN 43-45 — Mediano plazo (1-2 meses)

### 🔄 CICLOS ESCOLARES — COMPLETAR SPRINT 3
- [ ] **Panel "Historial Egresados":** Endpoint `GET /alumnos?estado=egresado&ciclo_id=X` + tabla Directora.
- [ ] **Excel Export + validación:** Descargar/revisar formato antes de cierre de ciclo.

### 📊 GESTIÓN DE TAREAS GRUPALES (Requiere BD + 3 portales)
- [ ] **Miss — Crear Tarea Grupal:**
  - Apartado Miss: Seleccionar grupo → Redactar descripción → Adjuntar foto/PDF.
  - Fecha entrega: default día hábil siguiente (editable).
- [ ] **Papá — Bitácora:** Tareas aparecen automáticamente después de publicar.
- [ ] **Miss — Filtro Entrada (día entrega):** Checklist por alumno "Entregó Tarea: SÍ/NO".
- [ ] **Miss — Dashboard:** Indicador "[X] Tareas por recibir".
- [ ] **Miss — Reporte:** Panel resumen "12/15 entregaron hoy".

### 📅 INTEGRACIÓN CALENDARIO MEJORADA
- [ ] **Google Calendar API:** Botón "Añadir a Google Calendar" en eventos (web papá + móvil).
- [ ] **Eventos Enriquecidos:** Color + Emoji por categoría, ubicación, recordatorios.
- [ ] **PDF Calendario Mensual:** Exportar con diseño infantil (general o por familia).

### 🍽️ MÓDULO COMIDA AVANZADO (Bitácora 4 tiempos)
- [ ] **Bitácora Miss:** Desayuno, Colación, Comida, Comida Extra (visible según horario alumno).
- [ ] **"Comida Extra"** habilitada solo para Extensión/Estancia >3:06 PM.
- [ ] **Tabla `historial_servicios`:** Rastrear altas/bajas extensión por mes.

### 🏥 SALUD Y MEDICACIÓN (Bloque completo)
- [ ] **Recepción de Medicamento:** Campo Filtro Entrada → foto receta + foto envase → habilitar administración.
- [ ] **Dosis + Recordatorio automático Miss:** Campo bitácora con timestamp.
- [ ] **Justificantes Inasistencia:** Endpoint Directora marcar falta "Justificada" → excluir de contador suspensión.
- [ ] **Depósición especial:** Marcar "Diarrea" en bitácora salud.
- [ ] **Filtro Sanitario Salida:** Checklist (pañal, pertenencias, estado físico) + botón "Entrega Conforme".
- [ ] **Control de Insumos (Maternal/Prekinder):** Contador stock pañales → alerta padre WhatsApp cuando <5.

### 🚪 SEGURIDAD — SALIDA AVANZADA
- [ ] **Detección Hermanos:** Al QR salida, alerta si hay hermanos en otros grupos.
- [ ] **Protocolo Salida Anticipada:** Formulario motivo + hora + quién retira + firma digital tutor + notificación al otro padre.
- [ ] **QR Temporal (Círculos Confianza):** Pase invitado 2 horas, padre envía por WhatsApp a tercero.

### 👨‍👩‍👧 GESTIÓN ALUMNOS AVANZADA
- [ ] **Perfil 360°:** Padre + Madre + 2 autorizados (fotos + INE).
- [ ] **No-Duplicidad Inclusiva:** Validar por email/ID (permitir homoparentales: 2 Mamás/Papás).
- [ ] **`familia_id` — Vínculo Hermanos:** Detección automática, navegación rápida, descuentos futuros.
- [ ] **Checkbox `es_extension`:** Icono visual (⏳/🌙) + omitir alertas "salida tardía" hasta 6:00 PM.
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
- [ ] **Generación Recibos PDF:** Automático al registrar pago + envío WhatsApp papá.

---

## 🎯 SESIÓN 46-47 — Largo plazo (2-3 meses)

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
- [ ] **Chat Individual:** Papá-Directora, Papá-Miss.

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
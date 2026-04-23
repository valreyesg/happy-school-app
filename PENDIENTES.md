# PENDIENTES — Happy School App

**Última actualización:** 2026-04-23 | **Estado:** Sesión 57 — Bugs + Protocolo
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

# 🎯 PRIORIZACIÓN POR SPRINTS

## 📍 SESIÓN 57 — BUGS + PROTOCOLO SÍNTOMAS

### 🔴 BUG CRÍTICO: Rechazo por síntomas vs Retardo
- [ ] **Santiago Gutierrez Mendoza:** No entró por fiebre + síntomas, pero vista dice "Retardo #1" (imposible)
  - Revisar: `registro_entrada.puede_entrar`, `motivo_no_entrada`, `es_retardo` — hay inconsistencia
  - **Impacta:** Todas las vistas (Miss, Papá, Directora) que reportan entrada

### 🟠 ASISTENCIA MISS — Solo muestra un alumno incorrecto
- [ ] **Dashboard `/maestra/asistencia`:** Mostrar solo alumnos del grupo de la miss
  - Revisar filtro en endpoint o frontend query de asistencia
  - Actualmente trae alumnos de otros grupos

### 🟠 PROTOCOLO SÍNTOMAS — Alertas visuales
- [ ] **Dashboard Directora + Miss (`/asistencia`):** Card ROJO para alumnos rechazados por síntomas/fiebre
  - Propósito: activar protocolo de salud inmediato
  - Mostrar: nombre, hora, motivo (fiebre 38.5°C / síntomas: tos, diarrea, etc.)

### 👨‍👩‍👧 DASHBOARD PAPÁ — Visibilidad rechazo
- [ ] **Dashboard Papá — Filtro entrada:** Cuando entrada rechazada, mostrar claramente:
  - ✅ Motivo exacto (fiebre X°C / síntomas / retardos acumulados)
  - ✅ Retardos acumulados en el mes (ej: "3/3 retardos — próxima entrada bloqueada")
  - ✅ Advertencia visual roja si ya alcanzó límite
- [ ] **Bitácora Papá:** Agregar sección de entrada con motivo (análogo a comida/salud/incidentes)

### 📢 NOTIFICACIONES GLOBALES (Impacto alto — afecta 3 portales)
- [ ] **Barra de notificaciones (campanita):** Mostrar nueva notificación, marcar como leída, contador.
- [ ] **Modal en pantalla completa:** Cuando Miss/Directora crea evento/tarea/cancela comida → notificación modal en papá.
- [ ] **Triggers multi-evento:** Evento nuevo, Tarea nueva, Pago atrasado, Cancelación comida, Entrega/recogida por tercero.

---

## 🎯 MEDIANO PLAZO — Próximas sesiones (1-2 meses)

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
# PENDIENTES — Happy School App

**Última actualización:** 2026-04-22 | **Estado:** Sesión 46 completada — Actividades: Captura + Validación

---

# 🎯 PRIORIZACIÓN POR SPRINTS

## 📍 SESIÓN 46 — Actividades: Corrección de rutas + autorización

### ✅ COMPLETADAS (1/1)
- [x] **Debugging actividades:** Arreglar GET 500 (ruta ordenamiento), POST 403 (autorización), parámetros queries ✅

**Impacto:** Sistema de actividades múltiples completamente funcional. Maestra captura actividades con fotos en panel lateral, alumno ve actividades en bitácora, papá ve tarjetas con participación, directora ve lista compacta. Base para SESIÓN 47.

---

## 📍 SESIÓN 47 — Portal Papá + Mejoras UI (PRÓXIMA)

### 🎨 MEJORAS UI — PORTAL PAPÁ (6 items)
- [ ] **Bitácora — Alimentación:** Mostrar en orden de Miss (Desayuno, Colación, Comida, Comida Extra).
- [ ] **Vista Preparación (Próximos 3 días):** Dashboard principal muestre Tareas Pendientes + Eventos próximos.
- [ ] **Navegación Bitácora:** Movimiento fluido entre Comida, Actividades, Conducta, Salud sin cerrar modal.
- [ ] **Orden de Recibos:** Mes Actual primero → Meses anteriores descendente → "Ver Todos".
- [ ] **Validación Estatus Pagos:** Verde solo si 100% al corriente (no parcial).
- [ ] **Lógica de Avance Bitácora:** "En curso" durante jornada + "Finalizada" al cerrar. Mensaje "Aún no está lista" solo si 0% capturado.

---

### 📢 NOTIFICACIONES GLOBALES (Impacto alto — afecta 3 portales)
- [ ] **Barra de notificaciones (campanita):** Mostrar nueva notificación, marcar como leída, contador.
- [ ] **Modal en pantalla completa:** Cuando Miss/Directora crea evento/tarea/cancela comida → notificación modal en papá (obligar cerrar manual para confirmar lectura).
- [ ] **Triggers multi-evento:**
  - Evento nuevo de Miss.
  - Tarea nueva.
  - Pago atrasado.
  - Cancelación comida.
  - Entrega/recogida por tercero (no padre logueado).

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
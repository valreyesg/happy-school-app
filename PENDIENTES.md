# PENDIENTES — Happy School App

**Última actualización:** 2026-04-22 | **Estado:** Sesión 48 completada (auditoría) → Sesión 49 próxima: implementar fixes

---

# 🎯 PRIORIZACIÓN POR SPRINTS

## 🔴 SESIÓN 48 — Auditoría: Bugs Críticos + Inconsistencias entre Portales (PRÓXIMA)

> Resultado de auditoría completa Sesión 47. Tres tipos de trabajo: bugs que rompen funcionalidad hoy, inconsistencias silenciosas (datos incorrectos que no se ven), y eliminación de hardcodeados.

### 🐛 FASE 1 — Bugs Críticos (funcionalidad rota hoy)

- [ ] **Dashboard padre mobile — endpoint incorrecto:** `mobile/app/(padre)/index.jsx:94` llama `/alumnos?rol=padre` en vez de `/alumnos/mis-hijos`. El padre mobile nunca ve ánimo, conducta ni alertas del hijo porque el endpoint genérico no devuelve `bitacora_hoy`. Fix: cambiar a `api.get('/alumnos/mis-hijos')`.
- [ ] **Comida desde mobile-maestra no llega al padre:** `mobile/app/(maestra)/bitacora.jsx:239` envía campos sueltos (`que_comio`, `cuanto_comio`, `observaciones_comida`). El backend solo procesa el array `comidas: [{ tiempo, que_comio, cuanto_comio, observaciones }]`. Fix: reestructurar formulario mobile de comida a modelo de 4 tiempos igual que web-maestra.
- [ ] **QR no aparece en perfil de alumno:** `web/src/pages/directora/AlumnoPerfil.jsx:577` accede a `alumno.qr_url` pero el backend devuelve `alumno.qr_code_url`. Fix: renombrar a `qr_code_url`.
- [ ] **Semáforo de documentación siempre "incompleta":** Frontend define `cartilla_vacuna` y `foto_3x4` como requeridos; backend busca `cartilla_vacunacion` y `foto_escolar`. Fix: unificar nombres en ambos lados para que coincidan exactamente.

### ⚠️ FASE 2 — Inconsistencias Silenciosas (datos que se muestran mal)

- [ ] **Comportamiento vacío en padre mobile:** `mobile/app/(padre)/bitacora.jsx:35-39` usa claves `excelente` y `bueno`. El backend guarda `muy_bien` y `bien` (que escribe la maestra). Fix: alinear claves a `muy_bien`, `bien`, `necesita_mejorar`.
- [ ] **Ánimo siempre "🤔" en dashboard padre mobile:** `mobile/app/(padre)/index.jsx:21` usa `inquieto` y `energico` como claves, omitiendo `activo` e `irritable` que sí guarda la maestra. Fix: alinear a `feliz`, `activo`, `cansado`, `triste`, `irritable`.
- [ ] **Emoji ✅ para "No comió" en maestra mobile:** `mobile/app/(maestra)/bitacora.jsx:275-280` usa ✅ para `no_comio` (semánticamente incorrecto) y emojis de comida oriental sin sentido. Fix: alinear con los otros portales: `😋 😊 😐 ❌`.
- [ ] **Lógica de esfínteres frágil en mobile-maestra:** `mobile/app/(maestra)/bitacora.jsx:124-129` detecta el nivel buscando "kinder 1" como substring del nombre del grupo (frágil). Web-maestra usa el campo estructurado `nivel_codigo`. Fix: pasar `nivel_codigo` como parámetro a la pantalla y usar comparación estructurada.
- [ ] **Semáforo de pagos con lógica diferente en cada portal:** Directora calcula por días de atraso (≥30=rojo, ≥60=suspendido), Padre por monto (>$1,000=rojo), Semaforo.jsx con otro umbral. Fix: calcular `semaforo` en backend y devolver el campo calculado; eliminar lógica local en los 3 frontends.

### 🗂️ FASE 3 — Eliminar Hardcodeados (catálogos duplicados)

- [ ] **Backend — endpoint `GET /catalogos/:tipo`:** Crear endpoint que devuelva catálogos dinámicos: `animo`, `comportamiento`, `cuanto-comio`, `tiempos-comida`, `condiciones-panial`, `niveles` (con `nivel_siguiente` y `requiere_control_esfinteres`), `roles-personal` (con `requiere_grupo`), `estados-alumno`, `tipos-documento` (con `requerido: boolean`), `metodos-pago`, `conceptos-pago`, `tipos-parentesco`.
- [ ] **Web — reemplazar arrays hardcodeados:** `Bitacora.jsx` (maestra), `CiclosEscolares.jsx`, `Grupos.jsx` (fix inconsistencia `kinder_1` vs `kinder1`), `Personal.jsx`, `TurnoPuerta.jsx`, `Alumnos.jsx`, `AlumnoPerfil.jsx`, `Pagos.jsx` (directora y padre), `Dashboard.jsx` (padre).
- [ ] **Mobile — reemplazar arrays hardcodeados:** `mobile/(padre)/bitacora.jsx`, `mobile/(padre)/index.jsx`, `mobile/(maestra)/bitacora.jsx`.
- [ ] **IP hardcodeada en mobile:** `mobile/src/services/api.js` tiene `192.168.1.93:3000` fija. Fix: mover a variable de entorno `EXPO_PUBLIC_API_URL` en `mobile/.env` (agregar al `.gitignore`).

---

## 📍 SESIÓN 50 — Histórico + Notificaciones

### 📂 HISTÓRICO POR CICLO ESCOLAR — PORTAL PAPÁ (pendiente mover a Sesión 48 si se completa la auditoría antes)
- [ ] **Dashboard padre — Selector de ciclo:** Mostrar ciclo actual por defecto, permitir consultar ciclos pasados.
- [ ] Aplica a: bitácora histórica, pagos históricos. Endpoint `GET /alumnos/:id/ciclos` ya existe en backend.

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
# PENDIENTES — Happy School App

## Última actualización: 2026-04-19 (sesión 26 completada)

---

## 🔜 PRÓXIMA SESIÓN — Prioridad alta

### ⚡ FASE 6.9 — Indicador de Comedor (Confirmación y Control de Pago)
- [ ] Portal papá: módulo de confirmación semanal de servicio comida (domingo antes de dormir)
  - Selector: "Confirmo servicio de comida para la próxima semana"
  - Selector método de pago: "Transferencia (confirmar a más tardar lunes)" | "Efectivo el lunes"
  - Guardado en tabla `control_comida` o similar con `estado` (pendiente/confirmado/pagado/cancelado)
- [ ] Si no hay pago recibido el lunes 8:00 AM → estado = `cancelado` + notificación papá vía WhatsApp
- [ ] Dashboard Directora/Administrador: Banner con contador "🍽️ X niños confirmaron comida hoy" (basado en domingo anterior)

---

## 📋 FASE 3 — Pendientes
- [ ] Reporte de asistencia: exportar Excel y PDF

---

## 📋 FASE 4 — Pendientes
- [ ] Cobros de extensión de horario automáticos ($125/hr)
- [ ] Generación de recibos en PDF
- [ ] Envío de recibo por WhatsApp al registrar pago
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
- [ ] Integración Google Calendar API
- [ ] Temario mensual (PDF o formulario)
- [ ] Menú semanal de comida
- [ ] Lista de útiles por grupo (con progreso del padre)
- [ ] Módulo de tareas grupales (Miss publica → aparece en bitácora del padre)
- [ ] Avisos con confirmación de lectura
- [ ] Automatización de cumpleaños (ícono 🎂 en vistas)
- [ ] Exportación PDF calendario mensual

---

## 📋 FASE 7 — Evaluaciones y Boletas
- [ ] Indicadores de evaluación configurables por nivel
- [ ] Captura de evaluaciones por maestra
- [ ] Revisión y autorización directora
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
- [ ] Notificaciones automáticas por WhatsApp (19 plantillas en DB)
- [ ] Panel de plantillas WhatsApp editables

---

## 📋 FASE 10 — Funciones Avanzadas
- [ ] Modo offline para maestras (caché local + sincronización)
- [ ] Backup automático diario
- [ ] Dashboard optimizado por rol con métricas del día
- [ ] Pruebas UX, ajustes finales, optimización

---

# 🚀 LISTADO MAESTRO DE ACTUALIZACIONES - HAPPY SCHOOL (17 DE ABRIL 2026)

## 1. SALUD Y MEDICACIÓN SEGURA
- [ ] **Protocolo de Recepción de Medicamento:**
    - Agregar sección en el Filtro de Entrada para registro de medicinas entregadas por el padre.
    - Requerir **Foto de la Receta** y **Foto del Envase** para habilitar la administración.
    - Registro de dosis, horario y recordatorio automático para la maestra.
- [x] **Confirmación de Administración:** ✅ sesión 20 — registro con timestamp desde bitácora Miss + notificación WhatsApp automática al padre.
- [ ] **Módulo de Justificantes de Inasistencia:**
    - Endpoint para que Directora/Admin marquen faltas como "Justificadas".
    - Lógica de exclusión: Las faltas justificadas no deben sumar al contador de "Suspensión por retardos/faltas".
    - Repositorio de fotos de recetas médicas vinculadas a la inasistencia.
- [ ] **Filtro Sanitario de Salida:**
    - Checklist de entrega: Pañal limpio, Pertenencias completas, Estado físico.
    - Botón de "Entrega Conforme" para registro legal de la escuela.
- [ ] **Control de Insumos (Maternal/Prekinder):**
    - Contador automático que descuenta stock al registrar "Cambio de Pañal" en la bitácora.
    - Alerta de reabastecimiento automática al padre vía WhatsApp cuando el stock baje de 5 unidades.

## 2. SEGURIDAD Y SALIDA AVANZADA
- [ ] **Círculos de Confianza (QR Temporal):**
    - Generación de "Pase de Invitado" (QR único con vigencia de 2 horas) para que el padre lo envíe por WhatsApp a terceros autorizados.
- [ ] **Detección Automática de Hermanos:**
    - Al escanear el QR de salida, mostrar alerta si el alumno tiene hermanos en otros grupos para gestionar la entrega conjunta.
- [ ] **Protocolo de Salida Anticipada — Avanzado:**
    - **Formulario de Incidencia:** Capturar motivo, hora exacta y quién retira.
    - **Firma de Respaldo:** Agregar componente de firma digital para el tutor en salidas fuera de horario.
    - **Notificación:** Enviar aviso push automático al otro padre/tutor informando que el alumno ha sido retirado.

## 3. IDENTIDAD VISUAL Y LENGUAJE (DIVERSIDAD Y CULTURA)
- [x] **Unificación de Etnia:** ✅ sesión 8 — tono de piel claro 🏻 aplicado en 16 archivos (👧🏻👦🏻👶🏻👩🏻‍🏫)
- [x] **Localización de Lenguaje (Miss/Teacher):** ✅ sesión 8 — etiquetas "Maestra"→"Miss"/"Teacher" + saludos dinámicos por `genero` (personal) y `parentesco` (padres) en web y mobile
- [x] **Dashboard Dinámico y Configurable:**
    - [x] Implementar tabla `settings` para rangos horarios: **Entrada**, **Académico** y **Salida/QR**. ✅ sesión 18
    - [x] El Dashboard cambia automáticamente según la hora y configuración de `settings`. ✅ sesión 18
    - [x] Alerta especial: "¡Hoy es el cumple de [Nombre]! 🎈" durante el filtro de entrada. ✅ sesión 13

## 4. GESTIÓN DE ALUMNOS Y SEGURIDAD FAMILIAR
- [ ] **Perfil 360° y Seguridad:**
    - Registro expandido: Padre, Madre y hasta 2 autorizados adicionales con carga de fotos e INE.
    - **Validación de No-Duplicidad Inclusiva:** Basada en identidad (`email`/`id`), permitiendo familias homoparentales (2 Mamás / 2 Papás).
- [ ] **Vínculo de Hermanos:** Lógica de `familia_id` para detección automática, navegación rápida y descuentos.
- [ ] **Indicador de Horario Extendido (Alumnos Regulares):**
    - Checkbox `es_extension` + Icono visual (reloj ⏳ o luna 🌙).
    - Lógica: Omitir alertas de "salida tardía" hasta las 6:00 PM.
- [ ] **Modalidad "Solo Extensión" (Externos):**
    - Perfil para niños que entran a las 3:00 PM y salen a las 6:00 PM (Check-in desde 2:45 PM).
- [ ] **Módulo de Niños Visitantes (Días Especiales/CTE):**
    - Registro Rápido con foto y distintivo visual 🌟 en Dashboard.
- [ ] **Automatización de Vistas:** A las 3:06 PM, el Dashboard filtra y muestra *únicamente* niños de Extensión o Estancia Diaria.
- [ ] **Validación de Cobro Automática:** Entrada posterior a las 2:45 PM de niños externos se categoriza como "Servicio de Extensión" o "Estancia por Día".

## 5. ESTRUCTURA ACADÉMICA, PERSONAL Y TAREAS
- [ ] **Módulo de Ciclos Escolares:** Tabla `ciclos_escolares` (Agosto - Julio) con 12 mensualidades y selector de históricos.
- [~] **Personal Escolar:** campo `genero` ✅ sesión 8 — rol "Miss Auxiliar" pendiente
- [ ] **Gestión de Tareas en Bitácora:**
    - **Asignación:** Campo en la bitácora diaria para que la Miss/Teacher describa la tarea.
    - **Vencimiento:** Configurar por default para el día hábil siguiente (con opción de modificar fecha).
    - **Seguimiento:** El sistema debe mostrar en el filtro de entrada del día de entrega un checklist para marcar si el alumno **"Entregó Tarea"**.
    - **Reporte:** Alerta visual en el dashboard de la Miss sobre tareas pendientes de entrega.

## 6. FINANZAS Y COBRANZA AUTOMATIZADA
- [ ] **Configuración de Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **Segmentación de Servicios:** Alumnos Regulares, **Solo Extensión** y Estancia por Día.
- [ ] **Gestión de Recargos por Impuntualidad (3:05 PM):**
    - Cargo automático de **$125.00 MXN** a las 3:06 PM (por default) a niños sin extensión.
    - Panel de la Directora para **Condonar** cargos con registro obligatorio de motivo.
- [ ] **Gestión de Cobro Mensual y Logística de Comida:**
    - Generación de 12 cargos de colegiatura con recargos automáticos el día 6.
    - **Control de Comida (Lunes):**
        - Los padres deben confirmar el servicio a más tardar el **domingo previo**.
        - Módulo para adjuntar **Comprobante de Pago** (Transferencia) o marcar **"Efectivo el Lunes"**.
        - Recordatorio automático los lunes (8:00 AM) para quienes informaron pago en efectivo.
- [ ] **Exportación Contable:** Botón para generar **Excel** (datos puros) con filtros para la administración.

## 7. CALENDARIO Y REPORTES
- [x] **Automatización de Cumpleaños:** ✅ sesión 25 — Ícono 🎂 en Filtro de Entrada (ya estaba implementado, validado y funcionando).
- [ ] **Eventos Enriquecidos:** Panel para asignar Color y Emoji por categoría. Campos para ubicación y recordatorios.
- [ ] **Exportación:** Generar PDF del calendario mensual con diseño infantil (general o por familia).

## 8. CONTROL DE ALIMENTACIÓN Y LOGÍSTICA
- [ ] **Bitácora de 4 Tiempos:** Desayuno, Colación, Comida y Comida Extra.
    - "Comida Extra" habilitada solo para niños de Extensión o Estancia posterior a las 3:06 PM.
- [ ] **Historial de Suscripciones:** Tabla `historial_servicios` para rastrear altas/bajas mensuales en servicio de extensión.

## 9. ADMINISTRACIÓN DE CATÁLOGOS (AUDITORÍA TÉCNICA Y DINAMISMO TOTAL)
- [ ] **Auditoría de Datos "Quemados" (Hardcoded):**
    - **Instrucción Crítica:** Claude debe realizar un escaneo profundo de todo el código para identificar CUALQUIER lista, valor o etiqueta fija (Estatus, Grados, Roles, Parentescos, Alergias, Tipos de Pago, Motivos de Salida, etc.).
- [ ] **Migración y Panel UI de Administración:**
    - **Finalidad:** Convertir la App en un sistema **100% Administrable por la Directora**.
    - Migrar todos los valores identificados a tablas de Base de Datos.
    - Desarrollar interfaz robusta para crear, editar o eliminar cualquier elemento de estos catálogos sin intervención técnica.
- [ ] **Configuración de Negocio Dinámica:**
    - Panel para editar la tabla `settings`: Montos de recargos, tiempos de tolerancia y rangos horarios del Dashboard.

## 10. GESTIÓN DE TAREAS GRUPALES
- [ ] **Módulo de Creación Grupal:**
    - Apartado específico donde la **Miss/Teacher** selecciona su grupo y redacta la tarea una sola vez para todos los alumnos.
    - Opción de adjuntar foto o archivo (ej. foto del libro o PDF de la actividad).
- [ ] **Lógica de Vencimiento Automático:**
    - Por defecto, la fecha de entrega se establece para el **día hábil siguiente**.
    - La Miss puede ajustar la fecha si es un proyecto a largo plazo.
- [ ] **Sincronización con Bitácora Individual:**
    - Una vez publicada la tarea grupal, esta debe aparecer automáticamente en la bitácora individual de cada niño en la app de los papás.
- [ ] **Seguimiento en Filtro de Entrada (Checklist Individual):**
    - El día del vencimiento, al momento de escanear el QR o registrar la entrada, el sistema debe desplegar un checklist individual para marcar: **"Entregó Tarea: [SÍ / NO]"**.
- [ ] **Reporte para la Miss:**
    - Panel resumen que muestre: "12/15 alumnos entregaron la tarea de hoy".

## 11. MÉTRICAS DE CONTROL EN DASHBOARD (VISTA MISS/TEACHER)
- [x] **Contador de Asistencia en Tiempo Real:** ✅ sesión 14 — 4 StatCards: En escuela hoy, Retardos, Ausentes, Bitácoras guardadas
- [x] **Monitor de Puntualidad y Estatus:**
    - [x] **Retardos:** Banner en dashboard Miss con estado filtro y contador vs `hora_fin_filtro`. ✅ sesión 18
    - [x] **Salidas Anticipadas:** Banner naranja en dashboard Miss + columna Entrada/Salida en tabla. ✅ sesión 19
- [ ] **Indicador de Comedor:**
    - Basado en la confirmación del domingo, mostrar cuántos niños del grupo requieren servicio de comida ese día para validación con cocina.
- [ ] **Pendientes de Tarea:**
    - Indicador de: "[X] Tareas por recibir" (basado en el módulo de Tareas Grupales).

## 12. PORTAL DEL PAPÁ (EXPERIENCIA DE USUARIO Y DASHBOARD)

### 📊 Dashboard Ejecutivo y Predictivo (Cero Clics)
- [x] **Exposición Directa de Bitácora:** Mostrar el contenido de la bitácora del día actual directamente en la pantalla principal del Dashboard. ✅ sesión 17
- [ ] **Lógica de Avance y Cierre:** - Mientras la Miss captura durante la jornada, la bitácora muestra los datos parciales con un indicador de **"En curso"**.
    - Al momento de la entrega/salida, el sistema marca la bitácora como **"Finalizada"**.
    - El mensaje "Aún no está lista" solo aparece si no hay datos capturados (0% de avance).
- [x] **Eliminación de Pasos Intermedios (Acceso Directo):** - Eliminación del botón "Ver antes" en **Bitácora, Pagos y Calendario**. Entrada directa al contenido final al dar clic. ✅ sesión 19
- [ ] **Vista de Preparación (Próximos 3 días):** Priorizar **Tareas Pendientes** (mañana) y **Eventos** (próximos 3 días) para anticipar materiales o vestimenta.

### 🍱 Bitácora de Actividades y Salud
- [ ] **Navegación Fluida:** Movimiento libre entre los iconos de: **Comida, Actividades (antes Tarea), Conducta y Salud** dentro del detalle.
- [ ] **Módulo de Actividades (En Escuela):** - Visualización de la **Foto de la actividad** grupal o individual.
    - Indicador visual de si el niño realizó la actividad programada.
- [ ] **Control de Alimentación (4 Tiempos):** Separación visual clara de **Desayuno, Colación, Comida y Comida Extra**.
- [ ] **Salud y Pañales:** Especificar **"Diarrea"** en reportes de deposición cuando sea detectada por la Miss.

### 💰 Finanzas y Control de Pagos
- [ ] **Validación de Estatus:** Bloqueo estricto de color verde o texto "Al Corriente" si existe cualquier adeudo pendiente.
- [ ] **Orden Jerárquico de Recibos:** 1. Mes Actual (al inicio).
    2. Meses anteriores (en orden cronológico descendente).
    3. Botón final de **"Ver Todos"**.

### 📅 Integración de Calendario
- [ ] **Sincronización Externa:** Botón funcional **"Añadir a Google Calendar"** en la vista de eventos y en el calendario mensual.

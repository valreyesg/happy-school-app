# PENDIENTES — Happy School App

**Última actualización:** 2026-05-09 — Sesión XX+57 (Plantillas WhatsApp sin disparador — funciones + 3 disparadores conectados)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 🔧 FASE B — Pendientes restantes

### 📱 Deploy y Producción
- [ ] Backend en Railway o Render (plan gratis disponible)
- [ ] Web en Vercel o Netlify
- [ ] Mobile: generar APK / build nativo (requerido para notificaciones push en background y descarga de QR)
- [ ] Validar modal urgente push en background (requiere build nativo, no funciona en Expo Go)
- [ ] Pruebas completas con credenciales Twilio reales (producción) — sandbox validado, pendiente validar con cuenta real

---

## 📱 MOBILE — Portal Maestra — Correcciones pendientes

### 🟠 IMPORTANTES — Paridad con web (Bitácora maestra)
- [ ] **Alimentación no segmentada por tiempos** — Web tiene 4 tiempos: Desayuno, Colación, Comida, Comida Extra. Mobile tiene un solo campo genérico. Implementar tabs/secciones por tiempo en [bitacora.jsx](mobile/app/(maestra)/bitacora.jsx)
- [ ] **Medicamentos incompletos** — Web tiene 3 sub-secciones: Recepción (recibir del padre), Administración (dar al niño), Registrar recepción. Mobile solo tiene "Nueva recepción". Agregar flujo de Administración.
- [ ] **Incidentes/Accidentes ausentes** — Sección completamente faltante en mobile. Web tiene: descripción, acciones tomadas, fotos. Agregar sección en bitácora maestra.
- [ ] **Actividades del día ausentes** — Web tiene sección grupal con fotos + descripción de actividad del día y participación por alumno. Mobile no la tiene.

### 🟡 MENORES — UX/Diseño Maestra
- [ ] **Turno de puerta no aparece** — Web llama `/turnos-puerta/hoy` en el dashboard. Mobile no hace esa llamada. Agregar banner igual que web.
- [ ] **Confirmaciones de comida ausentes** — Web tiene sección completa en dashboard con alumnos confirmados por día. Mobile no la tiene. Endpoint: `/comida/confirmaciones`
- [ ] **Campanita de notificaciones ausente** — `NotificationBell.jsx` existe en `src/components/` pero no está integrada en el header del layout de maestra. Agregar al header igual que en web.
- [ ] **Acciones rápidas poco informativas** — Dashboard maestra: faltan banners contextuales (cumpleaños, rechazados por salud). Paridad con web.

### 🟡 MENORES — Portal Padre Mobile
- [ ] **Eventos próximos** — El dashboard padre muestra eventos pero revisar si el diseño y datos coinciden con web (próximos 3 días, badge de categoría, modal con detalle)
- [ ] **Tarea pendiente en dashboard** — No muestra tarea pendiente del alumno. Verificar llamada a `/tareas/lista-pendientes?alumno_id=`

### 🔍 Pendiente validar (manual)
- [ ] QR normal scan desde app de la Miss

---

## 🚀 FASE E — Largo plazo (1–2 meses)

### 🚪 QR Temporal — Círculos de Confianza — CASI COMPLETO
- [ ] Validar pase vencido en Expo Go
- [ ] Botón "Descargar QR" en modal — implementado, requiere build nativo (expo-media-library no funciona en Expo Go)

### 🔔 WhatsApp Automático completo
- [x] **Prueba sandbox completada** — Sandbox funciona end-to-end. Fix aplicado: números MX se normalizan a `+521XXXXXXXXXX`. Recibo de pago llegó correctamente (2026-05-08).
- [x] **Link recibo accesible para padres** — Ruta pública `/api/pagos/:id/recibo-publico` sin JWT. Validado (2026-05-08).
- [x] **QR temporal compartido por WhatsApp** — Flujo manual validado (2026-05-08).
- [x] **10 funciones `notificar*` implementadas** — `recordatorio_pago`, `recargo`, `evento_nuevo`, `boleta_lista`, `sin_recoger`, `documentos_pendientes`, `encuesta_nueva`, `aviso_nuevo`, `suspension`, `pago_comida_lunes` en `whatsappService.js`. Probadas 10/10 vía API Twilio (2026-05-09).
- [x] **Disparadores conectados** — `sin_recoger` (botón 📲 en FiltroSalida, aparece solo después de hora de salida), `aviso_nuevo` (POST aviso extraordinario), `suspension` (baja de historial de servicios).
- [ ] **Validar mañana con Twilio** — Límite diario del sandbox (50 msg) alcanzado en pruebas. Pendiente validar en browser: botón 📲 en FiltroSalida después de las 15:00 con alumno Camila (mama.camila@happyschool.edu.mx → tel 9932160007).
- [ ] Conectar disparadores restantes: `evento_nuevo` (al crear evento en calendario), `encuesta_nueva` (al publicar encuesta), `documentos_pendientes` (desde expediente alumno), `recordatorio_pago` / `recargo` (job mensual), `boleta_lista` (módulo boletas), `pago_comida_lunes` (job lunes)

### 🚀 Optimización Final
- [ ] Modo Offline Miss: caché local + sincronización
- [ ] Backup automático diario
- [ ] Pruebas UX + Performance: optimización completa
- [ ] Álbumes fotos: por evento/mes con compresión (módulo extra, no prioritario)
- [ ] Evaluaciones y Boletas: indicadores configurables por nivel, captura calificaciones (Miss), validación Directora, boletas PDF automáticas, reporte desarrollo PDF mensual

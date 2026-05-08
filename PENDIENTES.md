# PENDIENTES — Happy School App

**Última actualización:** 2026-05-07 — Sesión XX+54 cont. (Mobile: bugs asistencia, bitácora, tareas, backend QR)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 🔧 FASE B — Pendientes restantes

### 📱 Deploy y Producción
- [ ] Backend en Railway o Render (plan gratis disponible)
- [ ] Web en Vercel o Netlify
- [ ] Mobile: generar APK / build nativo (requerido para notificaciones push en background y descarga de QR)
- [ ] Validar modal urgente push en background (requiere build nativo, no funciona en Expo Go)

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
- [ ] Envío recibo por WhatsApp al padre — pendiente credenciales Twilio reales (`TWILIO_ACCOUNT_SID=ACxxx`)
- [ ] QR temporal compartido por WhatsApp sin imagen — solo envía texto, falta adjuntar imagen generada (`Share.share()` → agregar attachment con URI de la imagen)
- [ ] Pruebas completas con credenciales Twilio reales
- [ ] Implementar plantillas sin disparador: recordatorio_pago, recargo, evento_nuevo, boleta_lista, sin_recoger, documentos_pendientes, encuesta_nueva, aviso_nuevo, suspension, pago_comida_lunes

### 🚀 Optimización Final
- [ ] Modo Offline Miss: caché local + sincronización
- [ ] Backup automático diario
- [ ] Pruebas UX + Performance: optimización completa
- [ ] Álbumes fotos: por evento/mes con compresión (módulo extra, no prioritario)
- [ ] Evaluaciones y Boletas: indicadores configurables por nivel, captura calificaciones (Miss), validación Directora, boletas PDF automáticas, reporte desarrollo PDF mensual

# PENDIENTES — Happy School App

**Última actualización:** 2026-05-07 — Sesión XX+48 (Notificaciones push en tiempo real — mobile ✅)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 🔧 FASE B — Pendientes restantes

### 🧪 Validación Módulo SALUD Y MEDICACIÓN — casos edge
- [ ] Job cron a las 10:00 AM sábado (fuera de lun-vie) → validar NO ejecuta
- [ ] Job cron a las 15:58 (dentro de rango lun-vie) → validar ejecuta correctamente
- [ ] Cambio de fecha (medianoche) → datos de ayer no aparecen (aislamiento por día)

### 📱 Deploy real (producción)
- [ ] Backend en Railway o Render (plan gratis disponible)
- [ ] Web en Vercel o Netlify
- [ ] Mobile en Expo Go o generar APK

### 📝 Feedback Valeria — Portal Padre Mobile — Pendientes restantes

#### 🟡 Notificaciones push en tiempo real — mobile — PENDIENTE VALIDACIÓN VALERIA
- [ ] Validar en Expo Go / device: que al enviar aviso extraordinario desde web, aparece modal urgente en mobile automáticamente (sin tocar la app)
- [ ] Validar que el badge de campanita sube en ≤15 s al llegar notificación nueva
- [ ] Validar que al presionar "Entendido" la notificación se marca como leída y el badge baja
- [ ] Validar que si llegan 2 urgentes seguidas, se muestran en cola (una tras otra, no simultáneas)
- [ ] Validar que la misma notificación NO aparece dos veces en la misma sesión

#### 🟡 Features faltantes (paridad con web)

### 📝 Feedback Valeria — Portal Maestra Mobile
- [ ] Revisar portal maestra mobile (pendiente)

---

## 🎯 FASE C — completada ✅

---

## 🏦 FASE D — 5–8 sesiones

### 💰 Portal Administrador — Finanzas y Pagos
> Portal separado (o tab en directora) para gestión completa de pagos. — Ver historial completo en ARCHIVE_LOG (Sesiones XX+36, XX+37, XX+38)

- [ ] Envío recibo por WhatsApp al padre — pendiente credenciales Twilio reales (`TWILIO_ACCOUNT_SID=ACxxx`)

### 🎓 Evaluaciones y Boletas
- [ ] Indicadores configurables por nivel (catálogos dinámicos)
- [ ] Captura calificaciones/observaciones (Miss)
- [ ] Validación Directora antes de publicar
- [ ] Boletas PDF automáticas
- [ ] Reporte Desarrollo: PDF mensual por alumno


### 🔔 Firebase Push Notifications
- [ ] Registrar tokens FCM en tabla `usuarios.fcm_token`
- [ ] Implementar envío push desde backend
- [ ] Activar campo `enviada_push` en tabla `notificaciones`

---

## 🚀 FASE E — Largo plazo (1–2 meses)

### 🚪 QR Temporal — Círculos de Confianza
- [ ] Pase invitado 2 horas, padre envía por WhatsApp o Correo a tercero

### 📷 Galería y Chat
- [ ] Álbumes fotos: por evento/mes con compresión
- [ ] Privacidad: fotos individuales vs. grupales
- [ ] Chat Grupo Miss + Papás: por grupo
- [ ] Chat Familiar: Papás-Directora-Miss

### 🔔 WhatsApp Automático completo
- [ ] Implementar las 19 plantillas restantes en sus módulos (ya están en DB)
- [ ] Pruebas completas con credenciales Twilio reales

### 🚀 Optimización Final
- [ ] Modo Offline Miss: caché local + sincronización
- [ ] Backup automático diario
- [ ] Pruebas UX + Performance: optimización completa

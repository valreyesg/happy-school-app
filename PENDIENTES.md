# PENDIENTES — Happy School App

**Última actualización:** 2026-05-07 — Sesión XX+51 (Validación Notificaciones Push Mobile + Fix modal Entendido ✅)
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

#### ✅ Notificaciones push en tiempo real — mobile — VALIDADO 2026-05-07
- [x] Badge de campanita sube en ≤15 s al llegar notificación nueva
- [x] Al presionar "Entendido" la notificación se marca como leída y el badge baja
- [x] 2 urgentes seguidas se muestran en cola (una tras otra, no simultáneas)
- [x] La misma notificación NO aparece dos veces en la misma sesión
- [x] Botón "Entendido" ocupa todo el ancho del modal (fix overflow:hidden)
- [ ] Validar modal urgente en background (requiere build nativo, no Expo Go)

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


---

## 🚀 FASE E — Largo plazo (1–2 meses)

### 🚪 QR Temporal — Círculos de Confianza — PENDIENTE VALIDACIÓN MOBILE
- [x] Web: generación, visualización, cancelación y compartir QR temporal ✅ VALIDADO
- [ ] Validar en Expo Go / device (padre): que aparece sección "🔐 Pase temporal" en pantalla QR mobile
- [ ] Validar que el padre puede generar pase temporal desde mobile
- [ ] Validar que la Miss escanea QR temporal y ve banner amarillo "PASE TEMPORAL — Verificar identidad" con nombre del autorizado
- [ ] Validar que el pase expirado/cancelado muestra error correcto al escanear


### 🔔 WhatsApp Automático completo
- [ ] Implementar las 19 plantillas restantes en sus módulos (ya están en DB)
- [ ] Pruebas completas con credenciales Twilio reales

### 🚀 Optimización Final
- [ ] Modo Offline Miss: caché local + sincronización
- [ ] Backup automático diario
- [ ] Pruebas UX + Performance: optimización completa
- [ ] Álbumes fotos: por evento/mes con compresión (módulo extra, no prioritario)

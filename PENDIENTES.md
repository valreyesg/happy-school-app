# PENDIENTES — Happy School App

**Última actualización:** 2026-05-06 — Sesión XX+40 (Bitácora Mobile — Paridad web: bugs + tabs + higiene)
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

#### 🔴 Notificaciones push en tiempo real — mobile
- [ ] Modal push al recibir aviso del admin — en web aparece modal en tiempo real; en mobile no hay listener activo. Implementar polling o WebSocket listener en mobile para mostrar modal cuando llega notificación nueva mientras la app está abierta.

#### 🟡 Features faltantes (paridad con web) — parcialmente resueltas en XX+40

**✅ Resuelto en XX+40 — Bitácora mobile (paridad web):**
- [x] Bitácora del 29/abr y fechas sin `bitacora_diaria` ahora se muestran si hay comidas (`!bit && comidas.length === 0`)
- [x] "undefined undefined" en comida corregido con `fmtCuanto()`
- [x] Tabs Entrada y Tareas agregados (7 tabs con scroll horizontal + flecha indicadora ›)
- [x] Higiene: contadores Pipí/Popó ocultos cuando alumno usa pañal (paridad web)
- [x] Bug preexistente: `TIEMPOS_COMIDA` no definido en mobile — corregido
- [x] Tab Entrada: muestra hora, retardo, estado autorizado/rechazado, checklist completo

**Pendiente aún:**
- [ ] Bitácora: declarar medicamentos desde mobile (formulario + foto receta) — solo web tiene esta función
- [ ] No aparece módulo de Comida en barra inferior mobile (existe pantalla `comida.jsx` pero no está en nav)
- [ ] No hay opción de cambiar contraseña en mobile

#### 🟡 UX / Diseño — Pendientes
- [ ] Iconos en general se ven anticuados y diferentes al portal web
- [ ] Barra inferior: nombres de módulos se cortan, no caben completos

#### 🟡 Flujo de pagos (nuevo requerimiento)
- [ ] Portal padre: permitir registrar pago subiendo comprobante de transferencia
- [ ] Portal directora/admin: validar ese pago en lugar de capturarlo manualmente

### 📝 Feedback Valeria — Portal Maestra Mobile
- [ ] Revisar portal maestra mobile (pendiente)

---

## 🎯 FASE C — 2–4 sesiones

### 🔧 CRÍTICO — Revisión configuración Cloudinary (cuando se tengan credenciales)
- [ ] Obtener credenciales reales: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Actualizar `backend/.env` y activar `CLOUDINARY_ENABLED=true`
- [ ] Audit completo de uploads: QR, foto alumno, foto personal, foto tutor, galería

### 📱 Panel Plantillas WhatsApp editable (directora)
- [ ] UI para editar las 19 plantillas desde el portal directora

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

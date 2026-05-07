# PENDIENTES — Happy School App

**Última actualización:** 2026-05-07 — Sesión XX+38 (FASE D: D5+D7 — Recibo PDF + WhatsApp + Comprobante Comida)
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

### 📝 Feedback Valeria — Portal Padre Mobile (Sesión XX+38)

#### 🔴 Bugs / Funcionalidad rota
- [ ] Saludo se corta — nombre no cabe por iconos campanita y puerta en el header
- [ ] Icono QR muestra icono de celular en lugar de QR — confuso
- [ ] Modal de adeudo NO aparece aunque el alumno tiene deuda
- [ ] Campanita muestra badge "1" pero al abrir no hay notificaciones
- [ ] Calendario no carga eventos pasados (abril tenía eventos, no aparecen)
- [ ] Pagos dice "al corriente" en verde aunque hay adeudo real
- [ ] Bitácora: no se ven sábados/domingos corregidos (web ya lo tiene arreglado — paridad pendiente)
- [ ] Bitácora: registro del 29 de abril existe en web pero no aparece en mobile
- [ ] 3 iconos en barra inferior muestran X (broken icons)
- [ ] Barra inferior ocupa espacio del botón de regreso de Android — iconos no clickeables

#### 🟡 Features faltantes (paridad con web)
- [ ] Bitácora: no se puede dar de alta medicamentos ni declararlos (solo web)
- [ ] No aparece módulo de Comida (existe en web)
- [ ] No hay opción de cambiar contraseña

#### 🟡 UX / Diseño
- [ ] Iconos en general se ven anticuados y diferentes al portal web
- [ ] Dashboard: tiene iconos de Chat y Fotos que no están desarrollados — quitar o deshabilitar
- [ ] Dashboard: intención es ver eventos próximos + adeudo + tarea pendiente
- [ ] Barra inferior: nombres de módulos se cortan, no caben completos
- [ ] Barra inferior: nombre "Eventos" debería ser "Calendario" para coincidir con web

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

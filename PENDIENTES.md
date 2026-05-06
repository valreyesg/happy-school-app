# PENDIENTES — Happy School App

**Última actualización:** 2026-05-05 — Sesión XX+31 (Fase B parcial: Cloudinary desacoplado + Mobile en celular + SDK 54)
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

### 📝 Feedback Valeria — Portal Padre Mobile
- [ ] Revisar comentarios de Valeria sobre portal padre (próxima sesión)
- [ ] Mejoras UX portal padre mobile

---

## 🎯 FASE C — 2–4 sesiones

### 🔧 CRÍTICO — Revisión configuración Cloudinary (cuando se tengan credenciales)
- [ ] Obtener credenciales reales: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Actualizar `backend/.env` y activar `CLOUDINARY_ENABLED=true`
- [ ] Audit completo de uploads: QR, foto alumno, foto personal, foto tutor, galería

### 💰 Configuración Precios diferenciados por nivel
- [ ] Costos diferenciados: Maternal → Kinder 3

### 🚪 Seguridad — Detección Hermanos en QR salida
- [ ] Al escanear QR salida, alerta si hay hermanos en otros grupos

### 📊 Reportes básicos
- [ ] Reporte Asistencia: Excel + PDF (por grupo, mes, alumno)
- [ ] Reporte Tareas: Excel con % entrega por grupo/alumno

### 📱 Panel Plantillas WhatsApp editable (directora)
- [ ] UI para editar las 19 plantillas desde el portal directora

### 🗂️ Auditoría Hardcoded adicional (FASE 8+)
- [ ] Scan profundo → Estatus, Grados, Tipos Pago, Motivos Salida, Emojis, etc.
- [ ] Crear tablas dinámicas nuevas para catálogos identificados
- [ ] Panel settings editable (recargos, tolerancia, horarios dashboard)

---

## 🏦 FASE D — 5–8 sesiones

### 💰 Portal Administrador — Finanzas y Pagos
> Portal separado (o tab en directora) para gestión completa de pagos.

- [ ] Resumen ingresos del mes
- [ ] Lista alumnos con adeudos
- [ ] Registro manual de pagos
- [ ] Estado colegiatura por alumno (12 cargos automáticos con recargo día 6)
- [ ] Historial cobros: extensión, comida
- [ ] Segmentación servicios: Regulares, Solo Extensión, Estancia por Día
- [ ] Generación recibos PDF automático + envío WhatsApp/Correo al padre
- [ ] Exportación contable: Excel filtrable para admin
- [ ] Comprobante Comida: adjuntar foto transferencia O marcar "Efectivo Lunes"

### 🎓 Evaluaciones y Boletas
- [ ] Indicadores configurables por nivel (catálogos dinámicos)
- [ ] Captura calificaciones/observaciones (Miss)
- [ ] Validación Directora antes de publicar
- [ ] Boletas PDF automáticas
- [ ] Reporte Desarrollo: PDF mensual por alumno

### 📊 Reporte Finanzas
- [ ] Excel + PDF (ingresos, adeudos, desglose servicios)

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

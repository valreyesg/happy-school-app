# PENDIENTES — Happy School App

**Última actualización:** 2026-05-04 — Sesión XX+28 (Reorganización prioridades)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## ⚡ FASE A — Esta sesión o la próxima (30 min – 2 horas)

### ✅ Bug fechas UTC vs CDMX — 20 archivos
> Algunos portales muestran un día adelantado después de las 6 PM (usan `toISOString()` que retorna UTC).

**Fix doble:**
1. ✅ `backend/.env` → agregar `TZ=America/Mexico_City`
2. ✅ Reemplazar `toISOString().split('T')[0]` → `toLocaleDateString('en-CA')` en:

**Web (8 archivos):** ✅ TODOS
- ✅ `web/src/pages/directora/Asistencia.jsx:431`
- ✅ `web/src/pages/directora/Bitacora.jsx:86`
- ✅ `web/src/pages/directora/Pagos.jsx:83`
- ✅ `web/src/pages/directora/Visitantes.jsx:10`
- ✅ `web/src/pages/maestra/Tareas.jsx:61`
- ✅ `web/src/pages/padre/Dashboard.jsx:15-16`
- ✅ `web/src/pages/padre/ComidaSemanal.jsx:69`
- ✅ `web/src/components/directora/BannerComidaHoy.jsx:23`

**Mobile (5 archivos):** ✅ TODOS
- ✅ `mobile/app/(padre)/bitacora.jsx:99,108,118,132`
- ✅ `mobile/app/(padre)/comida.jsx:59`
- ✅ `mobile/app/(padre)/index.jsx:30-31`
- ✅ `mobile/app/(maestra)/bitacora.jsx:129`
- ✅ `mobile/app/(maestra)/tareas.jsx:72`

**Backend (3 archivos):** ✅ TODOS
- ✅ `backend/src/routes/bitacora.js:64`
- ✅ `backend/src/routes/tareas.js:57`
- ✅ `backend/src/routes/visitantes.js:15`

---

### ✅ Bug tareas.js — foto_url guarda objeto en lugar de URL
- ✅ `backend/src/routes/tareas.js:302,368` — cambiar a destructuring `const { url, public_id } = await uploadToCloudinary(...)` (igual que todos los demás archivos)

---

### 🔌 Módulo WhatsApp desacoplado (ya casi listo)
> WhatsApp es opcional. Si no hay credenciales Twilio → notificaciones en-app siguen, Twilio silenciado sin errores.

- [ ] `backend/src/services/whatsappService.js` — proteger inicialización: si `TWILIO_ACCOUNT_SID` vacío → no-op silencioso
- [ ] `backend/.env` — agregar `WHATSAPP_ENABLED=false`
- [ ] `backend/.env.example` — documentar flag

---

### 🔌 Fix qrService.js — usar cloudinaryService centralizado
- [ ] `backend/src/services/qrService.js` — refactorizar para usar `cloudinaryService.js` en vez de cloudinary directo (así hereda el modo disabled)

---

### 🌐 Validación en browser pendiente — Batch D.4+
- [ ] `directora/Alumnos.jsx` — ModalQR: validar mostrar QR, descargar, regenerar (UI implementada)

---

## 🔧 FASE B — Próximas 1–2 sesiones

### 🔌 Módulo Cloudinary desacoplado (opcional para la directora)
> Si no se tienen credenciales Cloudinary → fotos no suben pero el sistema no da error 500.

- [ ] `backend/src/services/cloudinaryService.js` — agregar flag `CLOUDINARY_ENABLED`: si `false` → retorna `{ url: null, public_id: null }` sin errores
- [ ] `backend/.env` — agregar `CLOUDINARY_ENABLED=false`
- [ ] `backend/.env.example` — documentar flag
- [ ] Configurar credenciales reales de Cloudinary cuando estén disponibles

---

### 📱 Acceso desde celular / otra computadora
> Valeria quiere ver la app desde su celular o desde otra compu.

**Opción A — Red local (10 min, sin internet):**
- [ ] `web/vite.config.js` — agregar `server: { host: '0.0.0.0' }` para exponer en red local
- [ ] Obtener IP local: `ipconfig` en Windows
- [ ] Mobile: `npx expo start --lan` para ver en Expo Go con la misma red WiFi
- [ ] Acceso: `http://192.168.x.x:5173` desde celular en la misma red

**Opción C — Deploy real (producción, 1 sesión):**
- [ ] Backend en Railway o Render (plan gratis disponible)
- [ ] Web en Vercel o Netlify
- [ ] Mobile en Expo Go o generar APK

---

### 🧪 Validación Módulo SALUD Y MEDICACIÓN — casos edge
- [ ] Job cron a las 10:00 AM sábado (fuera de lun-vie) → validar NO ejecuta
- [ ] Job cron a las 15:58 (dentro de rango lun-vie) → validar ejecuta correctamente
- [ ] Cambio de fecha (medianoche) → datos de ayer no aparecen (aislamiento por día)

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

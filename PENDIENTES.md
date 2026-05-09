# PENDIENTES — Happy School App

**Última actualización:** 2026-05-08 — Sesión XX+70 (QA mobile: Fix animo crash padre, FiltroSalida QR, Tab Salida web+mobile, nombre_quien_recoge)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

### 📋 VALERIA — Validar ítems pendientes (mobile + web)
- [ ] **Ítem 15** — Bitácora padre mobile: botones galería y cámara siguen funcionando
- [ ] **Ítem 16** — Navegar fechas en bitácora padre mobile, asistencia maestra, bitácora maestra mobile
- [ ] **Ítem 17-19** — Dashboard padre web, FiltroSalida, FiltroEntrada: funcionan igual
- [ ] **Ítem 20** — Dashboard padre mobile: eventos con `fecha_inicio` null no crashean la app
- [ ] **Ítem 23** — Bitácora padre web: sección medicamentos funciona y aparece solo **una** vez
- [ ] **Ítem 27** — Bitácora padre web: navegar una semana con 2 clics ("← Semana anterior")
- [ ] **Ítem 28** — Bitácora padre mobile: 1 botón de foto → ActionSheet Galería/Cámara

---

## 📚 DOCUMENTACIÓN — Pre-QA / Piloto con escuela real

> Orden de ejecución acordado con Valeria (2026-05-08). Hacer antes del deploy.

### 1️⃣ Manual de usuario — Directora
- [ ] Redactar manual completo para el rol Directora (portal web)
- Incluir: Dashboard, Alumnos, Grupos, Personal, Usuarios, Ciclos Escolares, Pagos, Configuración, Turno Puerta, Niños Extensión, Calendario, Bitácora, Asistencia, Reportes, WhatsApp

### 2️⃣ Manual de usuario — Administrador
- [ ] Redactar manual completo para el rol Administrador (portal web)
- Incluir: Dashboard, Pagos, Reportes, Notificaciones, Inscripciones

### 3️⃣ Manual de usuario — Maestra
- [ ] Redactar manual completo para el rol Maestra (portal web + app mobile)
- Web: Dashboard, Asistencia, Bitácora, Filtro Entrada, Filtro Salida, Tareas, Galería
- Mobile: Dashboard, Asistencia, Bitácora, Tareas, QR Scanner

### 4️⃣ Manual de usuario — Padre
- [ ] Redactar manual completo para el rol Padre (portal web + app mobile)
- Web: Dashboard, Bitácora, Calendario, Pagos, Comida Semanal
- Mobile: Dashboard, Bitácora, Calendario, Pagos, QR

### 5️⃣ Guía de onboarding — configurar escuela desde cero
- [ ] Redactar guía paso a paso para la primera configuración de la app
- Cubrir flujo completo: acceso inicial → ciclo escolar → grupos → personal/maestras → alumnos → padres → personas autorizadas → configuración horarios → catálogos

### 6️⃣ Checklist de alta de escuela — orden exacto
- [ ] Redactar checklist ejecutable (con casillas) en el orden correcto de dependencias
- Orden: Ciclo escolar → Grupos → Personal (maestras) → Asignar maestra titular a grupo → Alumnos → Padres/tutores → Personas autorizadas → Configuración (horarios, precios) → Catálogos → Verificación final

### 7️⃣ FAQ / Casos comunes de soporte
- [ ] Redactar documento de preguntas frecuentes y situaciones comunes durante el piloto
- Incluir: qué hacer si un padre no puede entrar, cómo corregir una salida mal registrada, cómo resetear contraseña, qué pasa si el QR no escanea, cómo agregar persona autorizada, etc.

### 8️⃣ Guía de variables de entorno
- [ ] Documentar cada variable en `.env` (backend y mobile): qué hace, si es obligatoria u opcional, ejemplo de valor
- Aplica para cuando se configure en Railway/Render/Vercel

### 9️⃣ Guía de migraciones en producción
- [ ] Documentar cómo aplicar las 51 migraciones en la BD de producción (Railway/Render PostgreSQL)
- Incluir: comando exacto, orden, qué hacer si falla una migración

### 🔟 Plan de respaldo de base de datos
- [ ] Documentar cómo hacer backup manual de PostgreSQL en producción
- Incluir: comando pg_dump, dónde guardar el archivo, frecuencia recomendada

### 1️⃣1️⃣ Plan de rollback
- [ ] Documentar qué hacer si algo falla en producción durante el piloto
- Incluir: cómo revertir un deploy en Railway/Render, cómo restaurar BD desde backup

---

### 📱 Deploy y Producción
- [ ] Backend en Railway o Render (plan gratis disponible)
- [ ] Web en Vercel o Netlify
- [ ] Mobile: generar APK / build nativo (requerido para notificaciones push en background y descarga de QR)
- [ ] Validar modal urgente push en background (requiere build nativo, no funciona en Expo Go)
- [ ] Botón "Descargar QR" en modal — implementado, requiere build nativo (expo-media-library no funciona en Expo Go)
- [ ] Pruebas completas con credenciales Twilio reales (producción) — sandbox validado, pendiente validar con cuenta real

---

## 🚀 FASE E — Largo plazo (1–2 meses)

### 🔔 WhatsApp — Validar con Twilio
- [ ] **Validar con Twilio** — Probar en browser:
  - `sin_recoger`: botón 📲 en FiltroSalida después de las 15:00 con alumno Camila (mama.camila@happyschool.edu.mx → tel 9932160007)
  - `recordatorio_pago`: botón 📲 en tabla Adeudos (Pagos), padre con saldo pendiente
- [ ] Conectar disparadores futuros (si se decide): `boleta_lista`, `pago_comida_lunes`, `recargo` (jobs)

### 🚀 Optimización Final
- [ ] Modo Offline Miss: caché local + sincronización
- [ ] Backup automático diario
- [ ] Álbumes fotos: por evento/mes con compresión (módulo extra, no prioritario)
- [ ] Evaluaciones y Boletas: indicadores configurables por nivel, captura calificaciones (Miss), validación Directora, boletas PDF automáticas, reporte desarrollo PDF mensual

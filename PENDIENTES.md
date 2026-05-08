# PENDIENTES — Happy School App

**Última actualización:** 2026-05-08 — Sesión XX+59 (Paridad Bitácora Maestra Mobile)
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

### 🟠 IMPORTANTES — Paridad con web (Bitácora maestra) — Diferencias detectadas en revisión Sesión XX+59

- [ ] **Alimentación: precarga del menú semanal ausente** — Web precarga automáticamente el menú del día en los campos "¿Qué comió?" si el alumno tiene comida confirmada esa semana. Mobile no hace esa llamada. Endpoint: `GET /comida/menu?semana=` + `GET /comida/confirmacion/:alumnoId?semana=`. UX mobile: mostrar texto gris en el placeholder si hay menú disponible, igual que web (editable).
- [ ] **Medicamentos: fotos de receta y envase ausentes en recepción** — Web permite adjuntar foto de receta y foto del envase al registrar recepción (multipart). Mobile solo envía texto. Agregar dos botones de cámara/galería en el form de recepción en [bitacora.jsx](mobile/app/(maestra)/bitacora.jsx), enviar como `foto_receta` y `foto_envase`.
- [ ] **Actividades: fotos del alumno por actividad ausentes** — Web tiene sección "📷 Fotos del alumno" por cada actividad con subida de fotos y eliminación. Mobile no lo tiene. Agregar botón de cámara/galería por actividad → `POST /bitacora/actividades/:actividadGrupoId/fotos-alumno` (multipart `fotos[]`). UX mobile: galería horizontal de miniaturas bajo cada actividad, igual que web.

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

### 🚪 QR Temporal — Círculos de Confianza
- [ ] Validar pase vencido en Expo Go
- [ ] Botón "Descargar QR" en modal — implementado, requiere build nativo (expo-media-library no funciona en Expo Go)

### 🔔 WhatsApp — Validar con Twilio
- [ ] **Validar con Twilio** — Probar en browser:
  - `sin_recoger`: botón 📲 en FiltroSalida después de las 15:00 con alumno Camila (mama.camila@happyschool.edu.mx → tel 9932160007)
  - `recordatorio_pago`: botón 📲 en tabla Adeudos (Pagos), padre con saldo pendiente
- [ ] Conectar disparadores futuros (si se decide): `boleta_lista`, `pago_comida_lunes`, `recargo` (jobs)

### 🚀 Optimización Final
- [ ] Modo Offline Miss: caché local + sincronización
- [ ] Backup automático diario
- [ ] Pruebas UX + Performance: optimización completa
- [ ] Álbumes fotos: por evento/mes con compresión (módulo extra, no prioritario)
- [ ] Evaluaciones y Boletas: indicadores configurables por nivel, captura calificaciones (Miss), validación Directora, boletas PDF automáticas, reporte desarrollo PDF mensual

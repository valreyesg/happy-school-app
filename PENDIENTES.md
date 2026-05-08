# PENDIENTES — Happy School App

**Última actualización:** 2026-05-08 — Sesión XX+66 (UX: reducir clics a máx. 2 — Ítems 26-29 completados)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

### 📋 VALERIA — Validar ítems XX+63 al XX+66 (pendientes acumulados)
- [ ] **Calendario web padre** — El día de hoy aparece resaltado correctamente
- [ ] **Dashboard padre web** — Navegar páginas y regresar: no hace spinner si pasaron menos de 5 min
- [ ] **Dashboard maestra mobile** — Abre la app, carga normal sin errores
- [ ] **Ítems 8-10** — Fechas en Tareas, Pagos, FiltroEntrada/Salida funcionan igual que antes
- [ ] **Ítem 11** — Badges de estado en Asistencia, FiltroEntrada se ven igual
- [ ] **Ítems 13-14** — Descarga Excel/PDF en Tareas funciona; saludos en dashboards normales
- [ ] **Ítem 15** — Bitácora padre mobile: botones galería y cámara siguen funcionando
- [ ] **Ítem 16** — Navegar fechas en bitácora padre mobile, asistencia maestra, bitácora maestra mobile
- [ ] **Ítem 12** — Bitácora maestra web + mobile: secciones se ven igual que antes
- [ ] **Ítem 17-19** — Dashboard padre web, FiltroSalida, FiltroEntrada: funcionan igual
- [ ] **Ítem 20** — Dashboard padre mobile: eventos con `fecha_inicio` null no crashean la app
- [ ] **Ítem 23** — Bitácora padre web: sección medicamentos funciona y aparece solo **una** vez
- [ ] **Ítem 24** — Tareas maestra web: crear tarea y editar tarea funcionan correctamente
- [ ] **Ítem 25** — Dashboard maestra mobile con grupo real: lista alumnos hace scroll suave
- [ ] **Ítem 26** — FiltroSalida web: registrar salida en 1 sola vista (sin botón "Siguiente")
- [ ] **Ítem 27** — Bitácora padre web: navegar una semana con 2 clics ("← Semana anterior")
- [ ] **Ítem 28** — Bitácora padre mobile: 1 botón de foto → ActionSheet Galería/Cámara
- [ ] **Ítem 29** — Dashboard maestra mobile: botón QR rojo prominente, siempre visible

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
- [ ] Álbumes fotos: por evento/mes con compresión (módulo extra, no prioritario)
- [ ] Evaluaciones y Boletas: indicadores configurables por nivel, captura calificaciones (Miss), validación Directora, boletas PDF automáticas, reporte desarrollo PDF mensual

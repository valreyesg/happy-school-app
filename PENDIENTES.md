# PENDIENTES — Happy School App

**Última actualización:** 2026-05-11 — Sesión XX+78 (Validación sin_recoger + Fix extensión horario job automático)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 📸 DOCUMENTACIÓN — Capturas de pantalla reales (próxima sesión)

> Los 7 HTMLs están completos en `docs/v1.0.0-beta/`. Cada uno tiene placeholders amarillos que indican exactamente qué capturar. Solo falta agregar las imágenes reales.

### Pasos para completar la documentación

- [ ] Levantar backend + web (o acceder al servidor)
- [ ] Tomar capturas de pantalla por módulo, guardar en `docs/v1.0.0-beta/assets/img/` con el nombre exacto del placeholder
- [ ] Reemplazar cada `<div class="img-placeholder">` por `<img src="assets/img/NOMBRE.png">` en los 7 HTMLs

### Nombres de imágenes pendientes (por archivo HTML)

**manual_directora.html:** `login_directora.png`, `dashboard_directora.png`, `asistencia_directora.png`, `turno_puerta.png`, `lista_alumnos.png`, `perfil_alumno.png`, `pagos_directora.png`, `aviso_extraordinario.png`

**manual_maestra.html:** `dashboard_maestra.png`, `filtro_entrada_web.png`, `filtro_salida_web.png`, `asistencia_maestra_mobile.png`, `bitacora_maestra.png`, `tareas_maestra.png`, `qr_scanner_mobile.png`

**manual_padre.html:** `app_store_padre.png`, `dashboard_padre_mobile.png`, `qr_padre_mobile.png`, `bitacora_padre_mobile.png`, `pagos_padre_mobile.png`

**manual_administrador.html:** `dashboard_admin.png`, `pagos_admin.png`, `notificaciones_pago.png`

**guia_capacitacion.html:** `ciclos_escolares.png`, `grupos_nuevo.png`, `personal_nuevo.png`, `alumnos_nuevo.png`, `perfil_alumno_padres.png`

**faq_soporte.html:** `faq_usuarios_lista.png`

**guia_tecnica.html:** `railway_variables.png`

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
> Sandbox: `join although-previous` → +14155238886. Números registrados: 9931669869 (Héctor) y 9932160007 (Adriana).
> ✅ `retardo` — validado sesión XX+75

### 🚀 Optimización Final
- [ ] Modo Offline Miss: caché local + sincronización
- [ ] Backup automático diario
- [ ] Álbumes fotos: por evento/mes con compresión (módulo extra, no prioritario)
- [ ] Evaluaciones y Boletas: indicadores configurables por nivel, captura calificaciones (Miss), validación Directora, boletas PDF automáticas, reporte desarrollo PDF mensual

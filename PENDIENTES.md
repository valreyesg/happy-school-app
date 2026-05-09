# PENDIENTES — Happy School App

**Última actualización:** 2026-05-08 — Sesión XX+73 (Documentación v1.0.0-beta: 11 documentos .md redactados)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 📚 DOCUMENTACIÓN — Versión HTML con imágenes (próxima sesión)

> Los 11 documentos .md están completos en `docs/v1.0.0-beta/`. Falta convertirlos a HTML estilo Mintlify con capturas de pantalla reales.

### Archivos HTML a generar (7 en total)

| Archivo | Contenido | Audiencia |
|---------|-----------|-----------|
| `manual_directora.html` | Manual Directora | Directora |
| `manual_maestra.html` | Manual Maestra | Maestras |
| `manual_padre.html` | Manual Padre/Tutor | Padres |
| `manual_administrador.html` | Manual Administrador | Administrativo |
| `guia_capacitacion.html` | Checklist alta + Guía onboarding | Valeria |
| `faq_soporte.html` | FAQ casos comunes | Valeria |
| `guia_tecnica.html` | Variables + Migraciones + Respaldo + Rollback | Valeria |

### Requisitos para la siguiente sesión

- [ ] **Capturas de pantalla reales** de la app (web + mobile) por cada sección de cada manual
  - Estrategia: levantar backend + web, tomar capturas pantalla a pantalla
  - Guardar en `docs/v1.0.0-beta/assets/img/` con nombre descriptivo
  - Ej: `dashboard_directora.png`, `filtro_entrada_web.png`, `qr_padre_mobile.png`
- [ ] **Generar HTMLs** estilo Mintlify: sidebar fijo, contenido scrollable, offline (sin dependencias externas)
- [ ] **Cada HTML es autocontenido** — CSS y fuentes inlineadas, imágenes referenciadas por ruta relativa

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

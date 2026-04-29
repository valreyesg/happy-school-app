# PENDIENTES — Happy School App

**Última actualización:** 2026-04-29 | **Sesión XX+12:** ✅ COMPLETADA | **Próximos pendientes:** QR Temporal + SALUD edge cases + UX/UI Audit
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

> ⏳ **Historial detallado de sesiones completadas → ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md)**
> Sesiones completadas: Sesión 7, 73-86, XX, XX+1, XX+2, XX+3, XX+4, XX+5, XX+6, XX+7, XX+8, XX+9, XX+10, XX+11, XX+12 (todas archivadas, este archivo solo tiene PENDIENTES FUTUROS)

---

## ✅ SESIÓN XX+12 — QR MEJORADO + GESTIÓN USUARIOS PADRES (2026-04-29)

### Bloques Implementados:
1. ✅ Backend: qr_code_url en GET /alumnos/mis-hijos
2. ✅ Backend: Nueva ruta /padres (CRUD: crear-cuenta, activar, inactivar, reset-password)
3. ✅ Web: Fix bug QR parsing en FiltroEntrada (parsear HAPPYSCHOOL:ALUMNO:uuid)
4. ✅ Web: Scanner QR en FiltroSalida (botón naranja)
5. ✅ Web: Modal QR en Directora/Alumnos (generar/regenerar)
6. ✅ Mobile: Pantalla QR padre real (tabs + imagen 280x280)
7. ✅ Web: Nueva página /directora/usuarios (gestión padres: crear, activar, inactivar)

### 🐛 Issues Encontrados (Validación parcial):

**BLOQUE 2 - QR Padre (MOBILE):** PENDIENTE validar en sesión siguiente
**BLOQUE 3 - FiltroEntrada (WEB):** PENDIENTE validar en sesión siguiente
**BLOQUE 4 - FiltroSalida (WEB):** PENDIENTE validar en sesión siguiente

**BLOQUE 5 - Directora/Usuarios (WEB):** ✅ FUNCIONANDO (después de reiniciar backend)
**BLOQUE 2 - Modal QR (WEB):** ⚠️ ERROR 500 EN REGENERAR-QR
- **Problema:** `{"error":"Invalid api_key placeholder"}`
- **Causa:** Variables de entorno CLOUDINARY_* están en `placeholder` en `.env`
- **Solución:** Reemplazar con credenciales reales de Cloudinary
- **Archivos afectados:** `backend/.env` (líneas 11-13)
- **Acción requerida:** Proporcionar credenciales de Cloudinary válidas:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET

### Próxima Sesión:
- [ ] Actualizar credenciales Cloudinary en `.env`
- [ ] Reiniciar backend
- [ ] Validar BLOQUE 5 (Modal QR) después de fix
- [ ] Validar BLOQUE 1, 3, 4 (Mobile + FiltroEntrada/Salida)
- [ ] Implementar QR Temporal (Círculos Confianza) — línea 61

---

## 🧪 VALIDACIÓN PENDIENTE — Módulo SALUD Y MEDICACIÓN (casos edge - PRÓXIMA SESIÓN)

> ℹ️ Módulo funcional 100% — Bloques 1-10 implementados. Todos los casos edge completados.
> Detalles técnicos en [ARCHIVE_LOG.md](ARCHIVE_LOG.md) — Sesiones 73-86, XX-XX+9

### Casos Edge Pendientes de Validar (PRÓXIMA SESIÓN):
- [ ] **Job cron a las 10:00 AM sábado** (fuera de lun-vie) → Validar NO ejecuta
- [ ] **Job cron a las 15:58** (dentro de rango lun-vie) → Validar ejecuta correctamente
- [ ] **Cambio de fecha (medianoche)** → Datos de ayer no aparecen (aislamiento por día)

### Integraciones Pendientes (FUTURO):
- [ ] **Notificaciones WhatsApp (Vómito + Medicamentos):** Integrar WhatsApp (in-app ya existe)

---

---

## 🎨 UX/UI AUDIT Y MEJORA

- [ ] **Revisar y mejorar UX/UI completa (web + mobile)**
  - **Contexto:** Identificar usuarios finales por rol:
    - Papá: necesita información clara de hijo, tareas, pagos
    - Miss: herramienta de trabajo diario, eficiencia crítica
    - Directora: visión ejecutiva, reportes, alertas
    - Mobile: interfaz simplificada para papá en movimiento
  - **Tareas:**
    - [ ] Auditoría UX/UI web (padre, miss, directora)
    - [ ] Auditoría UX/UI mobile
    - [ ] **Consistency check: Formato y estilo de texto homogéneo**
      - Fechas: formato CONSISTENTE (ej: "Lun 24 de Abr" en todos lados)
      - Saludos: mismo tono y estructura en cada portal
      - Capitalización: CONSISTENTE mayúsculas/minúsculas/CamelCase
      - Iconografía: mismo emoji para mismo concepto
      - Espaciado y tamaño fuente en elementos similares
      - **Objetivo:** No parecer que lo hicieron diferentes personas
    - [ ] Consistency check: colores, tipografía, spacing
    - [ ] Validar flujos por rol (¿cada usuario encuentra lo que busca en <3 clicks?)
    - [ ] Accesibilidad (contraste, tamaño texto, navegación)
    - [ ] Responsive design validation (mobile, tablet, desktop)
  - **Herramientas:** Figma, accesibilidad tools, device testing
  - **Complejidad:** ⭐⭐⭐⭐ (2-3 sesiones)

---

## 🎯 MEDIANO PLAZO — Próximas sesiones (1-2 meses)

### 🚪 SEGURIDAD — SALIDA AVANZADA
- [ ] **Detección Hermanos:** Al QR salida, alerta si hay hermanos en otros grupos.
- [ ] **QR Temporal (Círculos Confianza):** Pase invitado 2 horas, padre envía por WhatsApp o Correo a tercero.

### 💰 FINANZAS — AUTOMATIZACIÓN AVANZADA

> ℹ️ **Nota técnica:** Al registrar un niño de servicio extendido (`modalidad_pago = 'por_dia'`)
> o un visitante con extensión, el backend YA genera automáticamente un cargo en `pagos`
> con `origen = 'extension_dia'` / `'visitante_extension'` y estado `'pendiente'`.
> La validación y UI de estos cobros se trabajará cuando se llegue a este módulo.

- [ ] **Configuración Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **Segmentación Servicios:** Regulares, Solo Extensión, Estancia por Día.
- [ ] **12 Cargos Colegiatura:** Auto con recargos día 6.
- [ ] **Comprobante Comida:** Adjuntar foto transferencia O marcar "Efectivo Lunes" → recordatorio WhatsApp 8:00 AM.
- [ ] **Exportación Contable:** Excel filtrable para admin.
- [ ] **Generación Recibos PDF:** Automático al registrar pago + envío WhatsApp o Correo papá. Ideal tener dentro del panel de pagos el recibo correspondiente a cada pago.

---

## 🎯 LARGO PLAZO — Futuro (2-3 meses)

### 🗂️ CATÁLOGOS DINÁMICOS — 100% ADMINISTRABLE
- [ ] **Auditoría Hardcoded:** Scan profundo → Estatus, Grados, Roles, Parentescos, Alergias, Tipos Pago, Motivos Salida, Emojis, etc.
- [ ] **Crear tablas dinámicas:** Para cada catálogo identificado.
- [ ] **Panel Directora — CRUD completo:** Crear, editar, eliminar catálogos sin código.
- [ ] **Configuración Negocio:** Panel settings editable (recargos, tolerancia, horarios dashboard).

### 📊 REPORTES Y EXPORTACIONES
- [ ] **Reporte Asistencia:** Excel + PDF (por grupo, mes, alumno).
- [ ] **Reporte Tareas:** Excel con % entrega por grupo/alumno.
- [ ] **Reporte Finanzas:** Excel + PDF (ingresos, adeudos, desglose servicios).

### 🎓 EVALUACIONES Y BOLETAS
- [ ] **Indicadores configurables:** Por nivel en catálogos dinámicos.
- [ ] **Captura Miss:** Calificaciones/observaciones.
- [ ] **Validación Directora:** Aprobación antes de enviar.
- [ ] **Boletas PDF:** Generación automática.
- [ ] **Reporte Desarrollo:** PDF mensual por alumno.

### 📷 GALERÍA Y CHAT
- [ ] **Álbumes fotos:** Por evento/mes con compresión.
- [ ] **Privacidad:** Fotos individuales vs. grupales.
- [ ] **Chat Grupo Miss + Papás:** Por grupo.
- [ ] **Chat Familiar:** Papás-Directora-Miss.

### 🔔 NOTIFICACIONES AVANZADAS
- [ ] **Firebase Cloud Messaging:** Registrar tokens, enviar push.
- [ ] **WhatsApp Automático:** 19 plantillas en DB (ya documentadas).
- [ ] **Panel Plantillas:** Editable por Directora.

### 🚀 OPTIMIZACIÓN FINAL
- [ ] **Modo Offline Miss:** Caché local + sincronización.
- [ ] **Backup Automático:** Diario.
- [ ] **Pruebas UX + Performance:** Optimización completa.

---

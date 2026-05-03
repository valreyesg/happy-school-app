# PENDIENTES — Happy School App

**Última actualización:** 2026-04-30 — Sesión XX+20 | **Próximos pendientes:** Validación Batch B + Batch D.4+ (bugs fixes) + FASE 5.3 Mobile
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 📋 VALIDACIONES PENDIENTES

### 🌐 VALIDACIÓN EN BROWSER — FASES 5.2 (Batches B-D) + 5.3 (por Valeria en http://localhost:5173)

**FASE 4.4 — Button component mobile (en browser, verificar estilos):**
- [ ] **Bitácora Padre:** Botón "Ver referencia" es ghost small
- [ ] **Pagos Padre:** Botones `‹` y `›` navegación mes son ghost small

**FASE 5.2 — Migración 35+ modales a Modal.jsx (VALIDACIÓN CRITICAL):**

**Batch B (3 archivos, 9 modales) — PARCIAL:**
- [ ] `directora/Usuarios.jsx` — crear cuenta (confirm + resultado + reset password)

**Batch D.4+ (4 archivos, ~16 modales — Mega-formas):**
- [ ] `directora/Grupos.jsx` — ModalGrupo (crear + editar grupo, asignar maestras)
  - [x] Crear grupo: nombre, color (picker), nivel dropdown ✅
  - [ ] Editar grupo: todos los campos editables
    - [x] Nombre, color, nivel ✅
    - [ ] ⚠️ **BUG:** horario_salida NO se refleja en tarjeta después de editar (backend recibe, pero no guarda o GET no devuelve actualizado)
  - [ ] Asignar maestras: selector maestras, botón agregar/quitar (actualmente solo lectura en edición)
- [ ] `directora/CiclosEscolares.jsx` — ModalNuevoCiclo + ModalPromocion
  - [ ] ModalNuevoCiclo: form simple (nombre, fecha_inicio, fecha_fin)
  - [ ] ModalPromocion: 3 pasos (seleccionar destino, revisar promoción, confirmar cierre)
- [ ] `directora/Alumnos.jsx` — ModalAlumno + ModalQR
  - [ ] ModalAlumno: crear + editar alumno (nombre, nivel, padres, alergias, foto)
  - [ ] ModalQR: mostrar QR, regenerar QR, descargar

**FASE 5.3 — NativeWind removal (Mobile):**
- [ ] `npm install` en mobile/ sin errores
- [ ] `expo start` arranca sin crashes
- [ ] Button, ModalSheet, NotificationBell mantienen aspecto visual
- [ ] Consola sin warnings sobre nativewind

---

## 🔧 CRÍTICO — REVISIÓN CONFIGURACIÓN CLOUDINARY

> **Estado:** ⚠️ BLOQUEANTE — Afecta múltiples funcionalidades de generación/carga de archivos
> **Prioridad:** ALTA — Debe resolverse antes de siguientes validaciones
> **Afectadas:** QR (generar/regenerar), Fotos alumnos, Fotos personal, Fotos tutores, Galerías

### Problema Detectado:
```
Error: Invalid api_key placeholder
Ubicación: backend/.env líneas 11-13
CLOUDINARY_CLOUD_NAME=placeholder
CLOUDINARY_API_KEY=placeholder
CLOUDINARY_API_SECRET=placeholder
```

### Funcionalidades Bloqueadas:
- [ ] Generar QR (alumnos sin QR)
- [ ] Regenerar QR (alumnos con QR viejo)
- [ ] Subir foto alumno
- [ ] Subir foto personal
- [ ] Subir foto tutor
- [ ] Subir fotos galería

### Acciones Requeridas:
1. **Obtener credenciales válidas de Cloudinary:**
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET

2. **Actualizar `backend/.env`** con credenciales reales

3. **Reiniciar backend** y validar:
   ```
   curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/alumnos/<id>/regenerar-qr -X POST
   ```
   Debe retornar `200` con `{ "qr_url": "https://..." }`

4. **Audit completo de uploads** después de fix:
   - [ ] QR (generar nuevo)
   - [ ] Foto alumno
   - [ ] Foto personal
   - [ ] Foto tutor
   - [ ] Galería fotos

---

## 🧪 VALIDACIÓN PENDIENTE — Módulo SALUD Y MEDICACIÓN (casos edge)

> ℹ️ Módulo funcional 100% — Bloques 1-10 implementados. Todos los casos edge completados.

### Casos Edge Pendientes de Validar:
- [ ] **Job cron a las 10:00 AM sábado** (fuera de lun-vie) → Validar NO ejecuta
- [ ] **Job cron a las 15:58** (dentro de rango lun-vie) → Validar ejecuta correctamente
- [ ] **Cambio de fecha (medianoche)** → Datos de ayer no aparecen (aislamiento por día)

---

## 🎨 UX/UI AUDIT Y MEJORA

- [ ] **Revisar y mejorar UX/UI completa (web + mobile)**
  - **Contexto:** Identificar usuarios finales por rol:
    - Papá: necesita información clara de hijo, tareas, pagos
    - Miss: herramienta de trabajo diario, eficiencia crítica
    - Directora: visión ejecutiva, reportes, alertas
  - **Tareas:**
    - [ ] Auditoría UX/UI web (padre, miss, directora)
    - [ ] Auditoría UX/UI mobile
    - [ ] **Consistency check: Formato y estilo de texto homogéneo**
      - Fechas: formato CONSISTENTE (ej: "Lun 24 de Abr" en todos lados)
      - Saludos: mismo tono y estructura en cada portal
      - Capitalización: CONSISTENTE mayúsculas/minúsculas/CamelCase
      - Iconografía: mismo emoji para mismo concepto
      - Espaciado y tamaño fuente en elementos similares
    - [ ] Consistency check: colores, tipografía, spacing
    - [ ] Validar flujos por rol (¿cada usuario encuentra lo que busca en <3 clicks?)
    - [ ] Accesibilidad (contraste, tamaño texto, navegación)
    - [ ] Responsive design validation (mobile, tablet, desktop)

---

## 🎯 MEDIANO PLAZO — Próximas sesiones (1-2 meses)

### 🚪 SEGURIDAD — SALIDA AVANZADA
- [ ] **Detección Hermanos:** Al QR salida, alerta si hay hermanos en otros grupos.
- [ ] **QR Temporal (Círculos Confianza):** Pase invitado 2 horas, padre envía por WhatsApp o Correo a tercero.

### 💰 FINANZAS — AUTOMATIZACIÓN AVANZADA
- [ ] **Configuración Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **Segmentación Servicios:** Regulares, Solo Extensión, Estancia por Día.
- [ ] **12 Cargos Colegiatura:** Auto con recargos día 6.
- [ ] **Comprobante Comida:** Adjuntar foto transferencia O marcar "Efectivo Lunes" → recordatorio WhatsApp 8:00 AM.
- [ ] **Exportación Contable:** Excel filtrable para admin.
- [ ] **Generación Recibos PDF:** Automático al registrar pago + envío WhatsApp o Correo papá.

---

## 🎯 LARGO PLAZO — Futuro (2-3 meses)

### 🗂️ CATÁLOGOS DINÁMICOS — FASE 7 PENDIENTE
- [ ] **Auditoría Hardcoded:** Scan profundo → Estatus, Grados, Roles, Tipos Pago, Motivos Salida, Emojis, etc.
- [ ] **Crear tablas dinámicas:** Para catálogos nuevos identificados en auditoría
- [ ] **Configuración Negocio:** Panel settings editable (recargos, tolerancia, horarios dashboard)

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

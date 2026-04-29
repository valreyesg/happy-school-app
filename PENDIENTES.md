# PENDIENTES — Happy School App

**Última actualización:** 2026-04-28 | **Sesión actual:** XX+7 ✅ | **Próximos pendientes:** Catálogos FASE 5-6 + SALUD edge cases + Pañal→Insumos
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

> ⏳ **Historial detallado de sesiones completadas → ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md)**
> Sesiones completadas: Sesión 7, 73-86, XX, XX+1, XX+2, XX+3, XX+4, XX+5, XX+6, XX+7 (todas archivadas, este archivo solo tiene PENDIENTES FUTUROS)

---


## 🗂️ CATÁLOGOS ADMINISTRABLES — Panel Directora (✅ FASE 4 COMPLETADA)

> ℹ️ **Auditoría completa realizada.** Se encontraron 35+ items hardcodeados entre web, mobile y backend.
> Arquitectura diseñada con regla de oro: **nada se elimina físicamente, solo se inactiva** (historial inmutable).

### ✅ COMPLETADO:
- ✅ **FASE 1:** Migración 041 — Tabla `catalogos` + `configuracion_historial` + 15 tipos insertados en BD
- ✅ **FASE 2:** Backend `GET /api/catalogos/:tipo` migrado a BD (mismo contrato, fallback al JS si falla)
- ✅ **FASE 2:** Endpoints CRUD: `GET/POST/PUT/DELETE /api/catalogos/:tipo` con TIPOS_CERRADOS (roles-personal, estados-alumno, checklist-entrada/salida)
- ✅ **FASE 3:** `GET/PUT /api/config/negocio` — precios comida, semáforo, docs requeridos, límites
- ✅ **FASE 3:** `GET /api/config/negocio/historial` — log de quién cambió qué y cuándo
- ✅ **FASE 3:** `semaforoAlumno` en `pagos.js` lee umbrales dinámicos de BD (fallback 1/30/60)
- ✅ **FASE 3:** `comidaController.js` lee precios de BD (fallback 250/50)
- ✅ **FASE 3:** Dashboard morosos lee `max_morosos_dashboard` de BD (fallback 10)
- ✅ **FASE 4:** Componente `CatalogoEditor.jsx` creado + tab Catálogos en `Configuracion.jsx`
- ✅ **FASE 4:** Config negocio (precios, semáforo, límites) integrada en tab "Horarios y reglas"
- ✅ **FASE 4:** Un solo botón "Guardar horarios y reglas" para ambas APIs en paralelo

### ⏳ PENDIENTE próxima sesión (FASE 5-6):
- [ ] **FASE 5:** `useCatalogo.js` — cambiar `staleTime: Infinity` a 30 min + invalidación al guardar
- [ ] **FASE 5:** `ComidaSemanal.jsx` (padre) — leer precios de `GET /api/config/negocio`
- [ ] **FASE 5:** `FiltroEntrada.jsx` (maestra) — reemplazar `monto / 50` por `monto / PRECIO_DIA` dinámico
- [ ] **FASE 6:** Mobile — crear `useCatalogo` hook + reemplazar arrays hardcodeados + precios dinámicos

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

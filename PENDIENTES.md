# PENDIENTES — Happy School App

**Última actualización:** 2026-04-28 | **Sesión actual:** XX+8 ✅ | **Próximos pendientes:** Catálogos FASE 5 validar + FASE 6 mobile + 4 catálogos nuevos + SALUD edge cases
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

> ⏳ **Historial detallado de sesiones completadas → ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md)**
> Sesiones completadas: Sesión 7, 73-86, XX, XX+1, XX+2, XX+3, XX+4, XX+5, XX+6, XX+7 (todas archivadas, este archivo solo tiene PENDIENTES FUTUROS)

---

## 🧪 VALIDACIÓN PENDIENTE — Módulo SALUD Y MEDICACIÓN (casos edge)

> ℹ️ Módulo funcional 100% — Bloques 1-10 implementados. Pendiente: casos edge de validación (mañana).
> Detalles técnicos en [ARCHIVE_LOG.md](ARCHIVE_LOG.md) — Sesiones 73-86, XX-XX+3

### Casos Edge Pendientes de Validar (MAÑANA):
- [ ] **Alumno CON pañal pero SIN insumos en stock** → Comportamiento cuando stock = 0
- [ ] **Recepción medicamento sin hora programada** → Confirma "Sin hora" aparece en lista
- [ ] **Job cron a las 10:00 AM sábado** (fuera de lun-vie) → Validar NO ejecuta
- [ ] **Job cron a las 15:58** (dentro de rango lun-vie) → Validar ejecuta correctamente
- [ ] **Cambio de fecha (medianoche)** → Datos de ayer no aparecen (aislamiento por día)

### Integraciones Pendientes (FUTURO):
- [ ] **Pañal → Insumos:** Al registrar pañal, stock se decrementa en `insumos_movimientos`
- [ ] **Notificaciones WhatsApp (Vómito + Medicamentos):** Integrar WhatsApp (in-app ya existe)

---

---

## 🗂️ CATÁLOGOS ADMINISTRABLES — FASE 5 validar + FASE 6 mobile + 4 catálogos nuevos

> ℹ️ **FASES 1-5 COMPLETADAS en código.** FASE 5 pendiente de validar en browser. FASE 6 mobile pendiente.
> Detalles técnicos en [ARCHIVE_LOG.md](ARCHIVE_LOG.md) — Sesiones XX+6, XX+7, XX+8

### ✅ FASE 5 — Completado en sesión XX+8 (validar en browser):
- [x] `useCatalogo.js` — `staleTime` cambiado de `Infinity` a 30 min, `gcTime` a 60 min
- [x] `ComidaSemanal.jsx` — precios leen de `GET /api/config/negocio` (fallback $250/$50)
- [x] `FiltroEntrada.jsx` — `monto / 50` reemplazado por `monto / precioDia` dinámico

### ⏳ FASE 6 — Mobile (próxima sesión):
- [ ] Crear `mobile/src/hooks/useCatalogo.js` (staleTime 30 min, fallback a constants)
- [ ] Reemplazar 7 arrays en `mobile/src/constants/catalogos.js` por `useCatalogo()`
- [ ] `(maestra)/bitacora.jsx` + `(padre)/bitacora.jsx` + `(padre)/index.jsx` — usar hook
- [ ] Consolidar query `vomito-intensidad` existente con nuevo hook
- [ ] Precios dinámicos desde `GET /api/config/negocio` en mobile

### ⏳ 4 CATÁLOGOS NUEVOS (próxima sesión):

> **Orden de implementación:** Niveles (trivial) → Alergias → Parentesco → Categorías Eventos

**1. Niveles** (tipo ya existe en BD + `useCatalogo('niveles')` ya funciona en web)
- [ ] Agregar `niveles` al tab Catálogos de `Configuracion.jsx` — 1 línea, patrón ya existe
- [ ] Mobile `(maestra)/bitacora.jsx` línea 125 — `['maternal','prekinder','kinder1']` hardcodeado en lógica de esfínteres

**2. Alergias** (actualmente campo `TEXT` libre — convertir a catálogo de selección)
- [ ] Migración 042: tipo `'alergias'` con valores (Lactosa, Gluten, Maní, Huevo, Mariscos, Frutos secos, Sin alergias)
- [ ] Agregar `alergias` a tab Catálogos en `Configuracion.jsx`
- [ ] `Alumnos.jsx` + `AlumnoPerfil.jsx` — cambiar `<input type="text">` por selector múltiple

**3. Parentesco** (actualmente `VARCHAR` libre — convertir a catálogo + unificar saludo)
- [ ] Migración 042: tipo `'parentesco'` con valores (Mamá, Papá, Abuela/o, Tía/o, Tutor/a, Otro)
- [ ] Agregar `parentesco` a tab Catálogos en `Configuracion.jsx`
- [ ] `AlumnoPerfil.jsx` — cambiar inputs libres de parentesco por selector
- [ ] Unificar `SALUDO_PARENTESCO` web (`Dashboard.jsx`) ↔ mobile (`(padre)/index.jsx`) — mobile solo tiene 3 keys, web tiene 6

**4. Categorías de Eventos** (tabla propia `categorias_evento`, NO es catálogo genérico)
- [ ] Agregar sección de gestión en `web/src/pages/directora/Calendario.jsx` — lista con botones crear/editar/inactivar
- [ ] Backend ya tiene `GET/POST /calendario/categorias` — solo falta la UI

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

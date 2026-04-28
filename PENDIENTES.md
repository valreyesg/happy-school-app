# PENDIENTES — Happy School App

**Última actualización:** 2026-04-28 | **Sesión actual:** XX+3 → Próximos pendientes: UX/UI Audit + Mediano/Largo plazo
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

> ⏳ **Historial detallado de sesiones completadas → ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md)**
> Sesiones completadas: Sesión 7, 73-86, XX, XX+1, XX+2, XX+3 (todas archivadas, este archivo solo tiene PENDIENTES FUTUROS)

---

## 🧪 VALIDACIÓN PENDIENTE — Módulo SALUD Y MEDICACIÓN (casos edge + integraciones)

> ℹ️ Módulo funcional 100% — Bloques 1-10 implementados y validados. Pendiente: casos edge y validaciones especiales. 
> Detalles técnicos en [ARCHIVE_LOG.md](ARCHIVE_LOG.md) — Sesiones 73-86, XX-XX+3

### Integraciones Pendientes:
- [ ] **Pañal → Insumos:** Al registrar pañal, stock se decrementa en `insumos_movimientos` (validar lógica movimientos)
- [ ] **Salida Sanitaria → Reporte:** (futuro) Data de salida se usa en módulo reportes
- [ ] **Notificaciones WhatsApp (Vómito + Medicamentos):** Integrar WhatsApp para vómitos y administración de medicamentos (in-app ya existe, falta WhatsApp)

### Casos Edge Pendientes de Validación:
- [ ] Alumno CON pañal pero SIN insumos en stock → Comportamiento cuando stock = 0
- [ ] Múltiples vómitos en el día → Validar que aparecen todos ordenados por hora
- [ ] Recepción medicamento sin hora programada → Confirma "Sin hora" aparece en lista
- [ ] Job cron a las 3:05 PM (fuera de horario 7-16) → Validar NO ejecuta
- [ ] Job cron a las 10:00 AM sábado (fuera de lun-vie) → Validar NO ejecuta
- [ ] Job cron a las 15:58 (dentro de rango) → Validar ejecuta correctamente
- [ ] Entrega conforme SIN marcar checkboxes → POST aceptable con valores `false`
- [ ] Cambio de fecha (medianoche) → Datos de ayer no aparecen (aislamiento por día)

---

## ✅ VALIDACIÓN COMPLETADA — Sesión 81 (Gestión Alumnos Bloque 1)

**Estado:** VALIDACIÓN 100% COMPLETADA EN BROWSER (2026-04-28)
**Implementador:** Claude | **Revisión:** Valeria

### ✅ Padres / Tutores (AlumnoPerfil.jsx: SeccionPadres)
- [x] Agregar tutor nuevo → tutor aparece sin recargar + toast ✅
- [x] Editar tutor → cambiar datos → guardan sin recargar ✅
- [x] Desactivar tutor (soft-delete) → desaparece de lista activa ✅
- [x] Email único por alumno → rechaza si existe en otro alumno NO hermano ✅
- [x] Email permitido para hermanos → alumnos hermanos pueden compartir tutor ✅
- [x] Máximo 2 tutores activos → botón "+ Agregar" se oculta en 2 tutores ✅
- [ ] Subir foto del tutor → aparece en tarjeta (PENDIENTE)

### Tutores — Funcionalidades faltantes (PENDIENTE PRÓXIMA SESIÓN):
- [ ] **Cambiar tutor principal:** Toggle para marcar/desmarcar `es_tutor_principal` en tutor ya existente (endpoint PUT + UI)
- [ ] **Desvincular tutor completo:** Botón para desvincular sin desactivar (vs. desactivar que es soft-delete)
- [ ] **Copiar tutores al vincular hermanos:** Al hacer POST `/alumnos/:id/familia`, copiar tutores de ambos alumnos para que compartan la misma lista

### ✅ Hermanos (AlumnoPerfil.jsx: SeccionHermanos)
- [x] Vincular hermanos → buscador + selección + tarjeta + toast ✅
- [x] Navegación recíproca → click navega al perfil del hermano ✅
- [x] Vínculo bidireccional → aparece en ambos perfiles ✅
- [x] Desvincular → desaparece de ambos perfiles ✅

### ⏳ Panel Extensión Vespertina (Dashboard.jsx: PanelExtensionVespertina) — PENDIENTE VALIDAR
- [ ] Banner morado aparece a las 3:06 PM
- [ ] 3 grupos: con extensión, sin extensión (cobro), ya salieron
- [ ] Toggle "Ver todos / Modo extensión" funciona
- [ ] Mensaje "Todos los niños han salido" cuando corresponde

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

### 👨‍👩‍👧 GESTIÓN ALUMNOS AVANZADA — Bloque 2 (✅ COMPLETADO EN SESIONES 82 + 84)
> ✅ Completado: Niños Extensión + Visitantes + Hermanos backend + Generación automática de cobros en pagos
> ✅ Completado Sesión 84: UI Hermanos (AlumnoPerfil.jsx) + Chip hermanos tarjeta + Mobile QR extensión + Banner hermanos sin salir
> ⏳ Pendiente: Validación/UI de cobros (módulo Finanzas)
> Ver ARCHIVE_LOG.md — Sesión 82 y Sesión 84 para detalles técnicos

### 💰 FINANZAS — AUTOMATIZACIÓN AVANZADA

> ℹ️ **Nota técnica:** Al registrar un niño de servicio extendido (`modalidad_pago = 'por_dia'`)
> o un visitante con extensión, el backend YA genera automáticamente un cargo en `pagos`
> con `origen = 'extension_dia'` / `'visitante_extension'` y estado `'pendiente'`.
> La validación y UI de estos cobros se trabajará cuando se llegue a este módulo.

- [ ] **Configuración Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **Segmentación Servicios:** Regulares, Solo Extensión, Estancia por Día.
- [x] **Recargo Impuntualidad:** $125 MXN automático a las 3:06 PM (niños sin extensión). ✅ Sesión 86
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

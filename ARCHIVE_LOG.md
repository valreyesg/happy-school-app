# ARCHIVE_LOG — Happy School App
## Historial de Funcionalidades Completadas

**Última actualización:** 2026-04-30 | Sesiones documentadas: 7 → 82 → XX → 83 → 84 → 85 → 86 → XX (insumos) → XX (Mejoras Salud) → XX+1 (Salida Anticipada) → XX+2 (Mobile Bloques 3+5B) → XX+3 (Pendientes Validación Salud) → XX+4 (Validación Sesión 81 + Fixes Tutores) → XX+5 (Validaciones Edge + Limpieza PENDIENTES) → XX+6 (Catálogos Administrables FASES 1-3 + inicio FASE 4) → XX+7 (Catálogos FASE 4 COMPLETADA) → XX+8 (Catálogos FASE 5 + Validación Pañal→Insumos) → XX+11 (Integración Catálogos + Docs Tutores + Notificaciones + Categorías Eventos) → **XX+17 (FASE 5.2 Batch D.1-3 + FASE 5.3 Decisión NativeWind)**

---

## ✅ SESIÓN XX+17 (2026-04-30) — FASE 5.2 Batch D.1-3 + FASE 5.3 (COMPLETADO)

**Fecha:** 2026-04-30 | **Estado:** ✅ IMPLEMENTACIÓN COMPLETADA — PENDIENTE VALIDACIÓN EN BROWSER

### FASE 5.2 — Migración Modales Web a Modal.jsx — Batches A-D.1-3

**Resumen:** 35+ modales inline refactorizados a usar componente Modal.jsx centralizado.

#### Batch A (Sesión anterior) ✅
- 6 modales en 5 archivos simples (Perfil, LoginPage, padre/Calendario, padre/Dashboard, directora/Visitantes)

#### Batch B (Sesión anterior) ✅
- 9 modales en 3 archivos (directora/Usuarios, directora/Dashboard, directora/Asistencia)

#### Batch C (Sesión anterior) ✅
- 15 modales en 7+ archivos (maestra/Tareas 3, directora/Pagos 2, directora/Calendario 2, etc.)

#### Batch D.1-3 (ESTA SESIÓN) ✅
**maestra/FiltroEntrada.jsx** (Commit: 7fc5216)
- ModalEntrada: multi-sección (salud, higiene, materiales, comida, medicamentos, toallitas, cumpleaños)
- QRScannerModal: escanear credencial alumno
- Validaciones: checklist con flags inverted (ej: sin_fiebre = true es "SIN problema")
- Props Modal: `size="md"`, `closeOnBackdrop={false}` (prevenir pérdida de datos)

**maestra/FiltroSalida.jsx** (Commit: da27123)
- ModalSalida: 2 pasos (paso 1: selector quién recoge + alerta anticipada/tardía, paso 2: checklist sanitario)
- QRScannerModal: escanear credencial alumno
- Progress indicator: barra visual de paso 1→2
- Props Modal: `size="md"`, `closeOnBackdrop={false}`

**maestra/Asistencia.jsx** (Commit: 61c2b01)
- ModalEntrada: checklist entrada (salud, higiene, materiales)
- Similar a FiltroEntrada pero más simple
- Props Modal: `size="md"`, `closeOnBackdrop={false}`

#### Batch D.4+ — DIFERIDO A PRÓXIMA SESIÓN
- directora/Personal.jsx (445 líneas, mega-form con asignación grupos)
- directora/Grupos.jsx (315 líneas, form asignación maestras)
- directora/CiclosEscolares.jsx (650 líneas, wizard 3 pasos)
- directora/Alumnos.jsx (275 líneas, form alta/edición alumno)

### FASE 5.3 — Decisión NativeWind Mobile (Commit: 3670c5c)

**Decisión:** Opción A — **Eliminar NativeWind**, mantener StyleSheet + theme.js

**Cambios implementados:**
- ✅ Removido `nativewind` de dependencies
- ✅ Removido `tailwindcss` de devDependencies  
- ✅ Removido preset NativeWind de tailwind.config.js
- ✅ Verificado: CERO referencias a nativewind en código mobile

**Razón:** Button.jsx y componentes mobile ya completamente migrados a StyleSheet + theme.js; NativeWind nunca se usaba

**Beneficio:** Reducir dependencias, coherencia arquitectónica (web=Tailwind CSS, mobile=StyleSheet nativo RN)

### Validaciones Pendientes (en PENDIENTES.md)

**Web (35+ modales):**
- [ ] Batch A: 6 modales en 5 archivos
- [ ] Batch B: 9 modales en 3 archivos
- [ ] Batch C: 15 modales en 7+ archivos
- [ ] Batch D.1-3: 5 modales en 3 archivos (FiltroEntrada, FiltroSalida, Asistencia)

**Mobile:**
- [ ] Verificar `npm install` funciona sin nativewind
- [ ] Expo start sin crashes
- [ ] Button, ModalSheet, NotificationBell sin cambios visuales
- [ ] Consola sin warnings

### Commits (Sesión XX+17)
1. `7fc5216` — feat: FASE 5.2 — Batch D.1 FiltroEntrada (2 modales) completo
2. `da27123` — feat: FASE 5.2 — Batch D.2 FiltroSalida (2 modales) completo
3. `61c2b01` — feat: FASE 5.2 — Batch D.3 Asistencia (1 modal) completo
4. `7b1ef2b` — docs: Actualizar PENDIENTES.md — FASE 5.2 Batch C+D status
5. `667e34f` — docs: PENDIENTES.md — FASE 5.2 Batch D.1-3 validación checklist
6. `3670c5c` — refactor: FASE 5.3 — Eliminar NativeWind mobile
7. `3a2504b` — docs: PENDIENTES.md — FASE 5.3 validación checklist

---

## ✅ SESIÓN XX+11 (2026-04-29) — Integración Catálogos + Docs Tutores + Notificaciones + Categorías Eventos (COMPLETADO)

**Fecha:** 2026-04-29 | **Estado:** ✅ COMPLETADO Y VALIDADO EN BROWSER

### BLOQUE 1 — Documentos INE en formulario tutores ✅
- `web/src/pages/directora/AlumnoPerfil.jsx` — SeccionPadres
  - Nuevo tutor y editar tutor: 3 campos de imagen (Foto, INE frente, INE reverso)
  - Grid 3 columnas con upload dashed border
  - Al guardar: POST a `/alumnos/{alumnoId}/padres/{padreId}/documentos` con FormData

### BLOQUE 2 — Notificaciones a todos los padres ✅
- `backend/src/routes/bitacora.js` — Vómito, Diarrea, Bitácora lista, Incidente: loop sobre TODOS los padres del alumno (eliminado filtro `es_tutor_principal = true`)
- `backend/src/routes/asistencia.js` — Retardo en entrada: mismo patrón
- `backend/src/routes/notificaciones.js` — Aviso extraordinario: eliminado filtro es_tutor_principal en ambas branches (sin/con grupo_ids)

### BLOQUE 3 — Configuración notificaciones ampliada ✅
- `web/src/pages/directora/Configuracion.jsx` — `TIPOS_NOTIFICACION` expandido de 5 a 12 tipos
  - Nuevos: entrada_rechazada, salida_anticipada, alerta_vomito, alerta_diarrea, solicitud_toallitas, solicitud_paniales, bitacora_lista, tarea_cancelada
- `web/src/components/NotificacionModal.jsx` — `CONFIG_TIPO` con estilos específicos para los 12 tipos
- `backend/src/routes/tareas.js` — Bug fix: tarea cancelada ahora usa tipo `tarea_cancelada` (antes usaba `tarea_nueva`)

### BLOQUE 4a — Parentesco en formularios (dropdown) ✅
- `web/src/pages/directora/AlumnoPerfil.jsx` — SeccionPadres y SeccionPersonasAutorizadas
  - `useCatalogo('parentesco')` en 3 formularios: editar tutor, nuevo tutor, nueva persona autorizada
  - `<select>` en lugar de `<input>` texto libre

### BLOQUE 4b — Alergias multi-select en formulario alumno ✅
- `web/src/pages/directora/Alumnos.jsx` — ModalAlumno
  - `useCatalogo('alergias')` con checkboxes para cada alergia del catálogo
  - Campo "Otras alergias" para texto libre adicional
  - Concatenación: alergias seleccionadas + otras → `form.alergias` (string)

### BLOQUE 5 — Categorías de Eventos en Configuración ✅
- **Backend** (`backend/src/routes/calendario.js`) — 3 rutas nuevas:
  - `GET /categorias/admin` — lista activos+inactivos (directora)
  - `PUT /categorias/:id` — editar o cambiar activo (COALESCE + UNIQUE constraint)
  - `DELETE /categorias/:id` — soft-delete
- **Web** — Componente `CategoriasEventoCard` agregado al final del tab Catálogos en `Configuracion.jsx`
  - Lista activas con botones Editar / Desactivar
  - Inactivas colapsadas con botón Reactivar
  - Usa `ModalCategoria` existente para crear/editar
- `web/src/components/directora/ModalCategoria.jsx` — Modal nuevo con campos nombre, color_hex (picker + hex), icono emoji
- Calendatio.jsx limpiado: panel "Gestionar categorías" removido, imports simplificados

### Validación ✅
- Configuración → Catálogos → 📅 Categorías de eventos visible y funcional
- CRUD completo: crear, editar, desactivar, reactivar validado en browser

---

## ✅ SESIÓN XX+10 (2026-04-29) — FASE 6 Catálogos Mobile + 4 Catálogos Nuevos (COMPLETADO)

**Fecha:** 2026-04-29 | **Estado:** ✅ COMPLETADO Y VALIDADO EN BROWSER

### FASE 6 — Mobile Catálogos Dinámicos ✅
- **Hook creado:** `mobile/src/hooks/useCatalogo.js` (React Query, staleTime 30 min, fallback a constants)
- **3 Componentes actualizados:**
  - `mobile/app/(maestra)/bitacora.jsx` — animo, cuanto, comportamiento, condiciones_panial
  - `mobile/app/(padre)/bitacora.jsx` — mapas animo, cuanto, comportamiento
  - `mobile/app/(padre)/index.jsx` — mapas animo, cuanto, comportamiento
- **Fallback robusto:** Si servidor no disponible, valores vienen de constants locales

### 4 Catálogos Nuevos — 3/4 Implementados ✅
| Catálogo | Valores | BD | UI Web | Estado |
|----------|---------|-------|--------|--------|
| **Niveles** | Maternal, Prekinder, Kinder1-3 | ✅ | ✅ | Completo |
| **Alergias** | 7 valores (Lactosa, Gluten, Maní, Huevo, Mariscos, Frutos secos, Sin alergias) | ✅ | ✅ | Completo |
| **Parentesco** | 8 valores (Mamá, Papá, Abuela/o, Tía/o, Tutor/a, Otro) | ✅ | ✅ | Completo |
| **Categorías Eventos** | (tabla propia) | ✅ Backend | ⏳ | Falta UI Calendario.jsx |

- **Validación:** ✅ Confirmada en browser — Directora → Configuración → Catálogos (3 catálogos visibles y editables)
- **Commits:** 2 (FASE 6 + actualizar PENDIENTES)

---

## ✅ SESIÓN XX+9 (2026-04-29) — Solicitud Pañales + Medicamento Sin Hora (COMPLETADO)

**Fecha:** 2026-04-29 | **Estado:** ✅ COMPLETADO — Dos features críticas implementadas y validadas

### 1️⃣ **Solicitud de Pañales** ✅
- **Problema identificado:** Stock = 0 pero sin botón para solicitar pañales al papá
- **Solución implementada:**
  - Backend: POST `/insumos/:alumnoId/solicitar-paniales` → crea solicitud tipo 'panial'
  - Frontend: Botón rojo "🧷 Solicitar pañales" aparece cuando stock = 0
  - Badge rojo "Solicitud de pañales enviada" cuando ya existe solicitud
  - Notificación al papá: WhatsApp + en-app modal urgente
- **Validado:** ✅ Funcional en bitácora maestra de Camila Torres García (Kinder 1B)

### 2️⃣ **Medicamento Sin Hora Programada** ✅
- **Problema identificado:** Medicamento recibido SIN hora mostraba "⏳ Tomas pendientes" (falso)
- **Solución implementada:**
  - Nueva sección "⏱️ Sin hora programada" en tab SALUD bitácora maestra
  - Separada de "⏳ Tomas pendientes" (solo con horas programadas)
  - Botón "Administrar" envía `tomaId: null` al backend
  - Backend marca recepción como administrada directamente (si no hay toma específica)
- **Validado:** ✅ Funcional sin errores

### 3️⃣ **Notificaciones al Papá** ✅
- **Problema identificado:** Notificaciones se creaban pero no se veían en UI papá
- **Solución:** Agregados tipos urgentes `solicitud_paniales` + `solicitud_toallitas` a config
- **Resultado:** Papá verá modal urgente + notificación en campanita al recargar

### Próximas tareas:
- ⏳ Casos edge SALUD: Job cron (sábado, rango), cambio fecha (medianoche)
- ⏳ FASE 6 mobile — Catálogos dinámicos
- ⏳ 4 catálogos nuevos — Niveles, Alergias, Parentesco, Categorías Eventos

---

## 📚 REFERENCIA RÁPIDA — Módulo SALUD Y MEDICACIÓN (100% COMPLETADO)

**Estado:** ✅ COMPLETADO — Bloques 1-10 implementados y funcionales

**Sesiones:** 73-86, XX-XX+3, XX+1
- **Sesión 79:** Bloques 1-5 COMPLETADOS (salud general, medicación, recepción, medicamentos)
- **Sesión 82:** Hermanos + QR + cron medicamentos (3 bugs corregidos)
- **Sesión 83-86:** Validaciones + Salida sanitaria + Recargo extensión + Insumos pañales
- **Sesión XX+1:** Salida anticipada + Bitácora directora con vómitos
- **Sesión XX+3:** Validaciones edge completadas

**Pendiente:** Casos edge de validación (stock=0, medicamento sin hora, job cron días no laborales, cambio medianoche)

**Próximo:** Integración Pañal→Insumos + WhatsApp (mañana)

---

## ✅ SESIÓN XX+7 (2026-04-28) — Catálogos Administrables: FASE 4 COMPLETADA (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO — FASE 4 UI Web + Fixes Críticos

### Trabajo realizado:

**FASE 4 — UI Web Directora** ✅
- `web/src/pages/directora/Configuracion.jsx` — extendido con tab "Catálogos"
  - 10 catálogos editables: animo, comportamiento, cuanto-comio, tiempos-comida, condiciones-panial, vomito-intensidad, tipos-insumo, tipos-documento, metodos-pago, conceptos-pago
  - Cada catálogo usa `CatalogoEditor.jsx` reutilizable
  - Edición inline: label, emoji, reordenar, activar/desactivar
  - Protección automática de items de sistema (🔒 no se pueden desactivar)

**Config Negocio Integrada en "Horarios y reglas"** ✅
- Tres secciones nuevas al final del tab:
  1. **💰 Precios de comida:** precio_comida_semana, precio_comida_dia
  2. **🚨 Semáforo:** semaforo_dias_amarillo, semaforo_dias_suspendido (nota: NO hay "verde")
  3. **📊 Dashboard:** max_morosos_dashboard
- Un solo botón "Guardar horarios y reglas" para ambas APIs en paralelo
- Ambas mutaciones cargando en paralelo, refrescan datos después de guardar

**Backend — TIPOS_CERRADOS Explícita** ✅
- Cambio crítico: `POST /catalogos/:tipo` ahora valida contra lista explícita de tipos bloqueados
- TIPOS_CERRADOS = ['roles-personal', 'estados-alumno', 'checklist-entrada', 'checklist-salida']
- Permite agregar a comportamiento, animo, comida, etc (que SÍ necesitan crecer)
- Frontend usa misma lista para ocultar botón "Agregar" en tipos cerrados

**Fix Crítico — Nombres de Campos BD** 🔴
- Problema: config negocio no se guardaba porque usaba nombres inventados
- Solución: Auditar CLAVES_NEGOCIO en `backend/src/routes/config.js`
  - `precio_comida_semana` (no "mensual")
  - `semaforo_dias_amarillo` (no "dias_amarillo")
  - `semaforo_dias_suspendido` (no "dias_rojo" — no existe "verde")
  - `precio_comida_dia` ✅
  - `max_morosos_dashboard` ✅
- Lección: **NUNCA inventar nombres de campos. Siempre auditar BD primero.**

### Validación en Browser:
- ✅ Editar catálogo item (emoji, label)
- ✅ Agregar item nuevo (comportamiento, animo, etc)
- ✅ Cambiar precio semanal comida
- ✅ Ajustar semáforo (amarillo + suspendido)
- ✅ Cambiar max morosos dashboard
- ✅ Guardar todo con un botón
- ✅ Valores se refrescan después de guardar

### Archivos modificados:
- `web/src/pages/directora/Configuracion.jsx` — tab catálogos + config negocio
- `web/src/components/directora/CatalogoEditor.jsx` — TIPOS_CERRADOS en frontend
- `backend/src/routes/catalogos.js` — TIPOS_CERRADOS en backend
- `web/src/pages/directora/Catalogos.jsx` — versión alternativa (no usada, pero preparada)
- `PENDIENTES.md` — FASE 4 marcada completada

### Pendiente para próxima sesión (FASE 5-6):
- [ ] **FASE 5:** `useCatalogo.js` — cambiar `staleTime: Infinity` a 30 min + invalidación al guardar
- [ ] **FASE 5:** `ComidaSemanal.jsx` (padre) — leer precios de `GET /api/config/negocio`
- [ ] **FASE 5:** `FiltroEntrada.jsx` (maestra) — reemplazar `monto / 50` por `monto / PRECIO_DIA` dinámico
- [ ] **FASE 6:** Mobile — crear `useCatalogo` hook + reemplazar arrays hardcodeados + precios dinámicos

---

## ⏳ SESIÓN XX+6 (2026-04-28) — Catálogos Administrables: Auditoría + FASES 1-3 + inicio FASE 4 (75% Completado)

**Fecha:** 2026-04-28 | **Estado:** 75% — FASES 1-3 backend completas, FASE 4 web en progreso

### Trabajo realizado:

**Auditoría de hardcodeados — Resultados:**
- **35+ items hardcodeados** encontrados en web, mobile y backend
- Clasificados en: CRÍTICOS (precios, umbrales), ALTOS (catálogos de dominio), MEDIOS (límites operativos)
- Catálogos de sistema identificados (ligados a ENUMs de BD): roles-personal, estados-alumno, comportamiento, checklists de entrada/salida
- Regla de oro establecida: **nada se elimina físicamente, solo se inactiva** — historial siempre conservado

**FASE 1 — Migración 041** ✅
- Tabla `catalogos` con campos: tipo, key, label, emoji, color, orden, activo, es_sistema, editable_key, inactivado_at
- Tabla `configuracion_historial` para auditoría de cambios de precio/configuración
- 15 tipos de catálogos insertados (72 registros totales)
- 9 claves nuevas en `configuracion_general`: precios comida, umbrales semáforo, docs requeridos, límites operativos
- `ON CONFLICT DO NOTHING` en todos los INSERTs — seguro de re-ejecutar

**FASE 2 — Backend endpoints catálogos** ✅
- `GET /api/catalogos/:tipo` → ahora lee de BD (mismo contrato de respuesta, fallback al objeto JS si BD falla)
- `GET /api/catalogos` → lista todos los tipos con conteo activos/inactivos (solo directora)
- `GET /api/catalogos/:tipo/admin` → items incluyendo inactivos para gestión
- `POST /api/catalogos/:tipo` → crear item nuevo con validación (rechaza en tipos de sistema)
- `PUT /api/catalogos/:tipo/:key` → editar label/emoji/color/orden/activo; bloquea key si es_sistema
- `DELETE /api/catalogos/:tipo/:key` → soft delete (activo=false + inactivado_at); rechaza si es_sistema=true; mínimo 1 activo
- `PUT /api/catalogos/:tipo/reorder` → reordenar con [{key, orden}]

**FASE 3 — Config negocio dinámica** ✅
- `GET /api/config/negocio` → lee 9 claves de configuracion_general (accesible todos los roles)
- `PUT /api/config/negocio` → actualiza claves + guarda en `configuracion_historial` (solo directora)
- `GET /api/config/negocio/historial` → log de quién cambió qué y cuándo (solo directora)
- `backend/src/routes/pagos.js` → `semaforoAlumno()` ahora lee umbrales de BD (fallback 1/30/60 días)
- `backend/src/routes/pagos.js` → dashboard morosos usa `max_morosos_dashboard` de BD (fallback 10)
- `backend/src/controllers/comidaController.js` → precios $250/$50 leen de BD (fallback garantizado)

**FASE 4 — UI Web (INICIO)** ⏳
- `web/src/components/directora/CatalogoEditor.jsx` creado — componente reutilizable con: edición inline label/emoji, toggle activo/inactivo, reordenar con flechas, protección de sistema (🔒), sección de inactivos colapsable con opción de reactivar, formulario de nuevo item

### Pendiente para continuar (próxima sesión):
- FASE 4: `Catalogos.jsx` (página con 5 tabs) + ruta + link sidebar
- FASE 5: `useCatalogo.js` staleTime + `ComidaSemanal.jsx` + `FiltroEntrada.jsx` precios dinámicos
- FASE 6: Mobile hook + arrays dinámicos

### Archivos modificados:
- `backend/migrations/041_catalogos_administrables.sql` (nuevo)
- `backend/src/routes/catalogos.js` — reescritura completa + CRUD
- `backend/src/routes/config.js` — endpoints /negocio + /historial
- `backend/src/routes/pagos.js` — getSemaforoConfig() + max_morosos dinámico
- `backend/src/controllers/comidaController.js` — precios dinámicos
- `web/src/components/directora/CatalogoEditor.jsx` (nuevo)
- `PENDIENTES.md` — sección catálogos actualizada

---

## ✅ SESIÓN XX+5 (2026-04-28) — Validaciones Edge SALUD + Limpieza PENDIENTES (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO

### Casos Edge Validados en Browser:
- ✅ **Múltiples vómitos en el día** → Aparecen todos ordenados por hora correctamente
- ✅ **Job cron a las 3:05 PM** (fuera de horario 7-16) → NO ejecuta (validado)
- ✅ **Entrega conforme SIN checkboxes** → POST acepta valores `false` sin error
- ✅ **Panel Extensión / Recargo $125** → Salida tardía detecta y aplica recargo automático (Sesión 86, validado en browser hoy)

### Limpieza PENDIENTES.md:
- Movida sección "GESTIÓN ALUMNOS AVANZADA Bloque 2" (completada Sesiones 82+84) fuera de PENDIENTES
- Movido "Recargo Impuntualidad ✅" fuera de lista activa de FINANZAS
- PENDIENTES.md queda solo con tareas genuinamente futuras

### Pendiente para mañana (casos edge restantes):
- [ ] Alumno CON pañal pero SIN insumos en stock → stock = 0
- [ ] Recepción medicamento sin hora programada → "Sin hora" en lista
- [ ] Job cron a las 10:00 AM sábado → NO ejecuta
- [ ] Job cron a las 15:58 → ejecuta correctamente
- [ ] Cambio de fecha medianoche → aislamiento por día

---

## ✅ SESIÓN XX+4 (2026-04-28) — Validación Sesión 81 (Padres/Tutores/Hermanos) + Fixes Arquitectura BD (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO — Sesión 81 VALIDADA + 4 Bugs Críticos Solucionados

### Funcionalidades Validadas (Sesión 81):

**✅ Padres / Tutores (AlumnoPerfil.jsx: SeccionPadres) — VALIDADO**
- Agregar tutor nuevo → vinculación + lista sin recargar + toast ✅
- Editar tutor → cambiar datos (nombre, parentesco, teléfono, email) → guardado sin recargar ✅
- Desactivar tutor (soft-delete) → histórico preservado, botón "+ Agregar" reaparece ✅
- Email único entre alumnos → rechaza si email existe en otro alumno NO hermano ✅
- Email permitido para hermanos → alumnos con mismo `familia_id` pueden compartir tutor ✅
- Máximo 2 tutores activos → UI límite visual cuando reach 2 tutores ✅

**✅ Hermanos (AlumnoPerfil.jsx: SeccionHermanos) — VALIDADO**
- Vincular hermanos → buscador + selección + tarjeta + toast "Hermanos vinculados" ✅
- Navegación recíproca → click en hermano navega a su perfil ✅
- Vínculo bidireccional → si A vincula B, B muestra A (relación simétrica) ✅
- Desvincular → desaparece de ambos perfiles ✅

**⏳ Panel Extensión Vespertina (Dashboard.jsx: PanelExtensionVespertina) — PENDIENTE VALIDAR**
- Banner morado "Vista de Extensión Activa" aparece a las 3:06 PM ⏳
- 3 grupos separados: con extensión (verde), sin extensión (naranja + cobro), ya salieron ⏳
- Toggle "Ver todos / Modo extensión" alterna entre vistas ⏳
- Mensaje "Todos los niños han salido" cuando no hay alumnos en escuela ⏳

### Bugs Críticos Solucionados:

**Bug #1 — CURP vacía silenciosa (workaround inefectivo)**
- **Problema:** Editar alumno con CURP vacía guardaba como NULL silenciosamente
- **Causa:** `ON CONFLICT DO NOTHING` + índice UNIQUE parcial `WHERE curp IS NOT NULL` permitía '' duplicados
- **Solución:** Validación frontend + backend obliga CURP obligatoria tanto en crear como editar
- **Archivo:** `web/src/pages/directora/Alumnos.jsx` linea 343-347, `backend/src/controllers/alumnosController.js` linea 249-252

**Bug #2 — Máximo 2 tutores no validado**
- **Problema:** Permitía agregar 3er tutor, decía "éxito" pero no se guardaba
- **Causa:** Validación en backend no existía, `ON CONFLICT DO NOTHING` silenciaba
- **Solución:** Validación de conteo en POST `/:id/padres`, UI oculta botón "+ Agregar" en 2 tutores
- **Archivos:** `backend/src/routes/alumnos.js` linea 312-318, `web/src/pages/directora/AlumnoPerfil.jsx` linea 217

**Bug #3 — Soft-delete de tutores no existía**
- **Problema:** No había forma de desactivar un tutor sin borrarlo físicamente
- **Causa:** Tabla `alumno_padre` no tenía campos `activo` y `desactivado_at`
- **Solución:** Migración `036_alumno_padre_activo.sql` + endpoint PATCH desactivar + UI botón "Desactivar"
- **Archivos:** Migración `backend/migrations/036_alumno_padre_activo.sql`, `backend/src/routes/alumnos.js` linea 382-391, `web/src/pages/directora/AlumnoPerfil.jsx` linea 220 + función `desactivarTutor`

**Bug #4 — Email único no validaba entre alumnos**
- **Problema:** Permitía agregar a Sebastián un tutor que ya tenía Sofía (no hermanos)
- **Causa:** POST `/alumnos/:id/padres` reutilizaba tutor por email sin validar `familia_id`
- **Solución:** 
  - POST: Validación email en otro alumno NO hermano → rechaza
  - PUT: Validación igual al cambiar email de un tutor existente
  - Cambio arquitectónico: SIEMPRE crear nuevo registro en `padres` (no reutilizar por email), evita ediciones cruzadas
- **Archivos:** `backend/src/routes/alumnos.js` linea 322-350 (POST) linea 373-399 (PUT)

### Archivos Modificados:
- `backend/migrations/036_alumno_padre_activo.sql` (nuevo)
- `backend/src/routes/alumnos.js` — validaciones CURP, límite 2 tutores, PATCH desactivar, email único
- `backend/src/controllers/alumnosController.js` — CURP obligatoria, filtro tutores activos
- `web/src/pages/directora/Alumnos.jsx` — CURP required + validación frontend
- `web/src/pages/directora/AlumnoPerfil.jsx` — botón desactivar, UI límite 2 tutores, función desactivarTutor

### Datos BD Limpiados:
- Eliminados registros duplicados de `madre.sofia@happyschool.edu.mx` (eran 2-3, dejados 1)
- Desactivadas relaciones cruzadas incorrectas de Sofía y Sebastián con tutor compartido
- Base lista para nuevos agregados sin duplicidades

### Validaciones Completadas:
- ✅ Padres/Tutores: 6/7 items validados en browser (falta: subir foto del tutor)
- ✅ Hermanos: 4/4 items validados en browser
- ⏳ Panel Extensión Vespertina: PENDIENTE (4 items — banner, 3 grupos, toggle, mensaje)
- ✅ 4 bugs críticos solucionados + arquitectura BD consistente

---

## ✅ SESIÓN XX+3 (2026-04-28) — Pendientes Validación Salud: Directora Justificaciones + Vista Mensual + Mobile Pañal (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO — 4 pendientes cerrados

### Funcionalidades Implementadas:

**Tarea 4 — Vista Mensual sin scroll: contenedor ancho** ✅
- Archivo: `web/src/pages/directora/Asistencia.jsx` línea 405
- Cambio: Condicional `max-w-full` cuando modo="mensual", `max-w-4xl` en modo "Hoy"
- Status: ✅ Validado — tabla muestra los 30 días de abril sin scroll

**Tarea 1 — Backend: endpoint mensual incluye datos de justificación** ✅
- Archivo: `backend/src/routes/asistencia.js` líneas 603-630
- Cambios:
  - SELECT extendido: `justificacion_motivo`, `justificada_at`, `justificacion_comprobante_url`, `justificada_por_nombre` (LEFT JOIN personal)
  - Agrupación: si `estado = 'justificado'`, devuelve objeto `{ estado, motivo, justificada_at, comprobante_url, justificada_por }`
- Status: ✅ Validado — curl devuelve objeto con datos completos

**Tarea 2 — Web: modal de lectura para celdas justificadas** ✅
- Archivo: `web/src/pages/directora/Asistencia.jsx` líneas 139, 247, 259-274, 357-401
- Cambios:
  - Estado `viendoJustificacion` para guardar datos de justificación
  - Normalización de `diaData` (puede ser objeto o string)
  - onClick actualizado: abre modal de lectura si celda está justificada
  - Modal nuevos con: alumno + fecha, motivo en fondo azul, comprobante (imagen o PDF), quién justificó + cuándo
  - Cursor pointer en celdas justificadas
- Status: ✅ Validado — clic en celda azul abre modal de lectura con motivo

**Tarea 3 — Mobile: ocultar toggle pañal para alumnos sin pañal** ✅
- Archivo: `mobile/app/(maestra)/bitacora.jsx` líneas 837-843
- Cambio: Agregar propiedad `mostrar: usaPanial` a item `panial_limpio`, aplicar `.filter(item => item.mostrar)`
- Status: ✅ Validado — alumno sin pañal NO muestra toggle, alumno con pañal SÍ muestra

### Archivos Modificados:
- `backend/src/routes/asistencia.js` — SELECT extendido, agrupación objeto para justificados
- `web/src/pages/directora/Asistencia.jsx` — Contenedor ancho, estado modal, normalización, onClick, modal lectura
- `mobile/app/(maestra)/bitacora.jsx` — Filtro items salida por `mostrar: usaPanial`

### Validaciones Completadas:
- ✅ Vista mensual: todos los días de abril visibles sin scroll
- ✅ Justificación: modal lectura al clic en celda azul, motivo visible
- ✅ Mobile: toggle pañal oculto para alumnos sin pañal (`usa_panial = false`)

### Commits:
- 1 commit: `feat: Sesión XX+3 — Pendientes validación salud (directora justificaciones + vista mensual + mobile pañal)`

---

## ✅ SESIÓN XX+2 (2026-04-28) — Paridad Mobile: Bloques 3 + 5B (Insumos Pañales + Vómito) — 100% COMPLETADO

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO — Sincronización funcionalidad web a mobile

### Funcionalidades Implementadas:

**BLOQUE 3 — Insumos Pañales Mobile** ✅
- Archivo: `mobile/app/(maestra)/bitacora.jsx` (líneas 217-223, 233-240, 449-464, 487-496)
- Cambios implementados:
  - ✅ Query `/insumos/:alumnoId` corregida: default `{}` en lugar de `[]`, catch devuelve `{}`
  - ✅ Derivadas `stockDiario` (insumosData.stock) y `solicitudesToallitas` (insumosData.solicitudes_toallitas)
  - ✅ Bloque morado "Pañales hoy" con cantidad e icono, colores dinámicos:
    - Verde si cantidad >= 3
    - Amarillo si cantidad >= 1 y < 3
    - Rojo si cantidad < 1
  - ✅ Texto "Sin registro de entrada aún" si `no_registrado = true`
  - ✅ Banner amarillo "🧻 Solicitud de toallitas enviada al papá" si hay solicitudes pendientes
  - ✅ Mutation `toallitasMutation` para POST `/insumos/:alumnoId/solicitar-toallitas`
  - ✅ Botón "🧻 Solicitar toallitas húmedas" naranja (`#FBBF24`), visible solo si NO hay solicitudes
  - ✅ Alert al completar solicitud: "✅ Solicitud enviada al papá"

**BLOQUE 5B — Vómito Mobile** ✅
- Archivo: `mobile/app/(maestra)/bitacora.jsx` (líneas 309-317, 345-351, 679-690, 705-722)
- Cambios implementados:
  - ✅ Query `vomitosCatalogo` desde `/catalogos/vomito-intensidad` con fallback hardcodeado (leve/moderado/fuerte)
  - ✅ Constante `INTENSIDADES_VOMITO` para usar catálogo en formulario
  - ✅ POST `/bitacora/vomito` incluye `bitacora_id` (mejora de datos backend)
  - ✅ Sección "🤢 Episodios de vómito" con tarjetas naranja:
    - Cada vómito en View con fondo `#FFF7ED`, borde naranja `#FED7AA`
    - Muestra: "Intensidad: [valor]", hora y notas (si existen)
  - ✅ Botones intensidad naranjas (`#EA580C` cuando seleccionados, `#FFF7ED` por defecto)
  - ✅ Labels desde catálogo `int.label` (Leve, Moderado, Fuerte)

### Archivos Modificados:
- `mobile/app/(maestra)/bitacora.jsx` — 8 cambios puntuales (queries, mutations, renders)
- `VALIDACIONES_SALUD_MEDICACION.md` — Bloques 3 y 5B marcados como ✅ COMPLETADOS en mobile

### Validaciones Completadas:
- ✅ Bloque 3: Stock visible, colores correctos (verde/amarillo/rojo), botón solicitar toallitas, banner solicitud pendiente
- ✅ Bloque 5B: Vómitos como tarjetas naranja, botones intensidad naranjas, POST incluye bitacora_id, catálogo con fallback

### Commits:
- 1 commit: `feat: Sesión XX — Paridad Mobile Bloques 3 + 5B (Insumos Pañales + Vómito)`

---

## ✅ SESIÓN XX+1 (2026-04-28) — Salida Anticipada + Correcciones Bitácora Directora (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO

### Funcionalidades Implementadas:

**1 — Notificación Salida Anticipada** ✅
- BD: Plantilla `salida_anticipada` insertada en `plantillas_whatsapp`
- Backend: `backend/src/routes/asistencia.js` — POST `/asistencia/salida` notifica a ambos tutores cuando `es_anticipada = true`
  - Resolución de nombre: busca en `padres` o `personas_autorizadas` según tipo de quien recoge
  - Notificación in-app (INSERT en `notificaciones`) + WhatsApp por tutor
  - Mensaje incluye: hora, quién recogió (nombre + parentesco), motivo
- Frontend: `web/src/pages/padre/Dashboard.jsx` — bloque "⚠️ Salida anticipada" con hora y motivo

**2 — Dashboard Padre muestra estado de salida** ✅
- Backend: `backend/src/routes/alumnos.js` — GET `/alumnos/mis-hijos` ahora incluye `filtro_salida` (hora_salida, salida_anticipada, motivo_salida) via LEFT JOIN con `registro_salida`
- Frontend: `web/src/pages/padre/Dashboard.jsx` — bloque visible en HijoCard, diferenciado por color (amarillo=anticipada, azul=normal)

**3 — Vómitos visibles en Bitácora Directora (AlumnoPerfil)** ✅
- Archivo: `web/src/pages/directora/AlumnoPerfil.jsx`
- Sección "🤢 Vómitos" agregada en `BitacoraDirectora` — muestra hora, intensidad (emoji diferenciado) y notas
- Estaba faltando aunque el backend ya devolvía `data.vomitos`

**4 — Menú "Bitácora" eliminado del sidebar Directora** ✅
- `web/src/layouts/DirectoraLayout.jsx` — eliminado item del menú y import `BookOpen`
- `web/src/App.jsx` — eliminada ruta `/directora/bitacora` e import `DirectoraBitacora`
- La bitácora se consulta en Alumnos (AlumnoPerfil → pestaña Bitácora)

### Archivos Modificados:
- `backend/src/routes/asistencia.js` — Notificación salida anticipada (ambos tutores, nombre+parentesco)
- `backend/src/routes/alumnos.js` — JOIN registro_salida en mis-hijos, expone filtro_salida
- `web/src/pages/directora/AlumnoPerfil.jsx` — Sección vómitos en BitacoraDirectora
- `web/src/pages/padre/Dashboard.jsx` — Bloque salida en HijoCard
- `web/src/layouts/DirectoraLayout.jsx` — Eliminado menú Bitácora
- `web/src/App.jsx` — Eliminada ruta y import DirectoraBitacora

### Validado:
- ✅ Salida anticipada Sofía Reyes Mendoza → notificación in-app llega al padre con nombre de quien recogió y motivo
- ✅ Dashboard padre muestra "⚠️ Salida anticipada" con hora y motivo
- ✅ Vómitos de Sofía visibles en bitácora directora (AlumnoPerfil)
- ✅ Menú sidebar directora ya no tiene sección "Bitácora"
- ✅ Diarrea validada (ya estaba implementada desde sesión anterior)
- ✅ Job medicamentos 14:00 validado (sesión anterior)

---

## ✅ SESIÓN ACTUAL (2026-04-28) — Mejoras Bloques 4-5: Justificantes + Vómito + Bitácora Directora (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO — 4 mejoras implementadas y validadas (Leyenda + Comprobante + Notificación siempre + Bitácora Directora)

### Mejoras Implementadas:

**Mejora 1 — Leyenda "Justificado" en Vista Mensual Asistencia** ✅
- Archivo: `web/src/pages/directora/Asistencia.jsx` línea 197-202
- Cambio: Agregado item azul `bg-blue-400` con etiqueta "Justificado" en leyenda
- Status: ✅ Validado en browser

**Mejora 2 — Comprobante Opcional en Justificantes** ✅
- Migración: `backend/migrations/031_justificante_comprobante.sql` (nuevas columnas URL + public_id)
- Backend: `backend/src/routes/asistencia.js` — Multer + Cloudinary upload
  - Dev: mock de URL, Prod: upload real a Cloudinary
  - Upsert INSERT ... ON CONFLICT (crea fila si no existe para ausencias virtuales)
- Frontend: `web/src/pages/directora/Asistencia.jsx` — Input file + FormData multipart
- Status: ✅ Validado (archivo sube a Cloudinary, URL se guarda en BD)

**Mejora 3A — Bitácora Directora con Vómitos** ✅ **Creada, requiere validación en próxima sesión**
- Archivo nuevo: `web/src/pages/directora/Bitacora.jsx` (~220 líneas)
- Flujo: Seleccionar Grupo → Alumno → Navegar Fecha → Ver vómitos + salud + medicamentos
- Componente `BitacoraDiaria` muestra:
  - 🤢 Vómitos (hora + intensidad + notas)
  - 🏥 Salud General (fiebre, temperatura, malestar)
  - 💊 Medicamentos administrados
- Ruta: `/directora/bitacora` (agregada en App.jsx + DirectoraLayout.jsx con link "📖 Bitácora")
- Status: ✅ Creada, ⏳ Pendiente validar en browser

**Mejora 3B — Notificación Vómito SIEMPRE (cualquier intensidad)** ✅
- Archivo: `backend/src/routes/bitacora.js` línea 80-117
- Cambio: Removido condicional `if (intensidad === 'fuerte')` → notifica cualquier intensidad
- Emoji diferenciado: 🤢 leve, 🤮 moderado, 🚨 fuerte
- Status: ✅ Validado (padre recibe notificación para cualquier intensidad)

### Bugs Corregidos en Esta Sesión:

| Bug | Archivo | Fix |
|-----|---------|-----|
| Vómito 400 "Referencia inválida" | `bitacora.js:75` | FK `registrado_por` ahora usa `req.user.id` directo, no SELECT de personal |
| Vómito pantalla blanca catalogo | `Bitacora.jsx:555` | Extrae `.items` de response |
| Justificante 404 "no encontrado" | `asistencia.js:700` | Upsert en lugar de UPDATE (crea si no existe) |
| Justificante no clickeable | `Asistencia.jsx:245` | Cursor pointer + onClick directo |

### Archivos Modificados:

**Backend:**
- `backend/src/routes/bitacora.js` — Fix `registrado_por`, cambio a notificación siempre
- `backend/src/routes/asistencia.js` — Add multer, upsert justificar, upload Cloudinary
- `backend/migrations/031_justificante_comprobante.sql` (nueva)

**Frontend:**
- `web/src/pages/directora/Asistencia.jsx` — Leyenda azul, comprobante form, cursor pointer
- `web/src/pages/maestra/Bitacora.jsx` — Fix `.items` en catalogo
- `web/src/pages/directora/Bitacora.jsx` (nueva) — Bitácora directora con 3 tabs
- `web/src/layouts/DirectoraLayout.jsx` — Add link "📖 Bitácora"
- `web/src/App.jsx` — Add ruta `/directora/bitacora`

### Validaciones Completadas:
- ✅ Bloque 4 — Justificantes: modal abre, se guarda motivo, celda cambia a azul, comprobante sube
- ✅ Bloque 5 — Vómito: form registra vómito, selector intensidad, padre recibe notificación cualquier intensidad
- ✅ Leyenda azul visible en vista mensual asistencia
- ✅ Mejoras funcionan sin errores

### Pendiente para Próxima Sesión:
- ⏳ Validar Bitácora Directora en browser (seleccionar grupo → alumno → fecha → ver vómitos/salud/medicamentos)
- ⏳ Implementar Bloques 6-7 (Diarrea + Salida Sanitaria) si aplica
- ⏳ Validar job medicamentos a las 14:00 (recordatorio)

### Commits:
- Múltiples commits durante la sesión con fixes incrementales
- Commit final: `chore: Sesión XX — Cierre protocolo — Mejoras Bloques 4-5 + Bitácora Directora`

---

## ✅ SESIÓN 86 — Detección y Cobro de Salida Tardía sin Extensión (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO — Recargo automático $125 cuando alumno sin extensión es recogido después de `hora_inicio_cobro_extension`

### Implementado:

**BD — Migración 039:**
- ✅ Creado concepto de pago `'Salida tardía'` (tipo: `'extension'`, monto: `125.00`, es_mensual: `false`)
- ✅ Concepto activo para registrar pagos automáticos

**Backend — `routes/asistencia.js`:**
- ✅ GET `/asistencia/filtro-salida` — Expone `hora_inicio_cobro_extension` (tolerancia configurable desde directora)
- ✅ POST `/asistencia/salida` — Lógica completa de detección y cobro:
  - Lee configuración desde `configuracion_general`: `hora_salida_normal`, `hora_inicio_cobro_extension`, `costo_extension_hora`
  - Lee estado de extensión del alumno desde `config_horario_alumno` (`tiene_extension`)
  - **Condición:** Si alumno NO tiene extensión Y hora actual >= `hora_inicio_cobro_extension`:
    - Calcula `minutos_tarde` = minutos desde `hora_salida_normal` hasta hora actual
    - Establece `cobro_extension` = valor fijo de `costo_extension_hora` (ej: $125)
    - Guarda en `registro_salida`: `es_extension=true`, `minutos_tarde`, `cobro_extension`
    - Crea registro en `pagos` con `origen='salida_tardia'`, `estado='pendiente'`, `mes_correspondiente`, `anio_correspondiente`
  - Respuesta incluye `es_salida_tardia` y `pago_salida_tardia` (con monto_total)
- ✅ Hora consultada en zona Mexico City (`America/Mexico_City`) para validez en contexto local

**Frontend — `pages/maestra/FiltroSalida.jsx`:**
- ✅ Helper `esSalidaTardia(alumno, horaInicioCobro)` — Retorna true si sin extensión Y hora >= tolerancia
- ✅ Modal de salida recibe `horaInicioCobro` del backend
- ✅ Badge rojo "SALIDA TARDÍA" visible en Paso 1 cuando aplica condición
- ✅ Toast diferenciado con emoji ⏰ al confirmar: "Salida registrada — Recargo $X generado"
- ✅ Payload a backend incluye información (aunque backend calcula todo, frontend informa visualmente)

### Validaciones completadas:
- ✅ Alumno sin extensión, salida después de tolerancia → cálculo correcto de minutos_tarde
- ✅ Pago generado en `pagos` con origen `'salida_tardia'` y estado `'pendiente'`
- ✅ Pago visible en página de Pagos (directora) con monto correcto y campos mes/año rellenos
- ✅ Badge rojo visible en el modal antes de confirmar salida
- ✅ Toast con monto aparece al completar registro
- ✅ Alumno CON extensión → no genera cobro (correcto)
- ✅ Alumno sin extensión pero salida dentro de tolerancia (< 3:06pm) → no genera cobro (correcto)

### Archivos modificados:
- `backend/migrations/039_concepto_salida_tardia.sql` (nueva)
- `backend/src/routes/asistencia.js` (GET y POST /asistencia/salida y /asistencia/filtro-salida)
- `web/src/pages/maestra/FiltroSalida.jsx` (helper `esSalidaTardia`, badge, toast)

### Pendiente para próxima sesión:
- ⏳ Notificación a padres en portal (campanita) cuando se genera recargo
- ⏳ Notificación WhatsApp a padres (opcional, requiere plantilla)
- ⏳ Panel directora para condonar recargos (PENDIENTES.md línea 72)

---

## ✅ SESIÓN XX — Insumos: Persistencia y Visualización Pañales + Toallitas (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO Y VALIDADO — Persistencia de pañales y toallitas traídos en entrada, visible en 3 bitácoras

### Implementado:

**BD — Migración 040:**
- ✅ Nueva columna `trajo_toallitas BOOLEAN DEFAULT false` en `registro_entrada`
- Se marca cuando el padre entrega toallitas en FiltroEntrada

**Backend — `routes/insumos.js`:**
- ✅ PUT `/insumos/solicitudes/:solicitudId/recibida` — Al marcar "Las trajo hoy":
  - Resuelve la solicitud en `insumos_solicitudes`
  - **Crea o actualiza** `registro_entrada` con `trajo_toallitas = true` usando `INSERT ... ON CONFLICT`
  - Maneja caso donde `registro_entrada` aún no existe (padre entrega en salida, no entrada)

**Backend — `routes/asistencia.js`:**
- ✅ GET `/asistencia/filtro-entrada/:alumnoId?fecha=YYYY-MM-DD` — Expone 2 nuevas columnas:
  - `trajo_paniales` (ya existía, ahora visible)
  - `trajo_toallitas` (nueva)

**Frontend — Bitácora del Padre** (`pages/padre/Bitacora.jsx`):
- ✅ Tab "Entrada" → Checklist: agrega 2 píldoras condicionales:
  - `Trajo pañales` — aparece si `usa_panial && entradaMostrada.trajo_paniales`
  - `Trajo toallitas` — aparece si `entradaMostrada.trajo_toallitas`
- ✅ **Fix:** Cambió lógica para usar siempre `entradaHistorica` (query dinámica) en lugar de datos cacheados (`entradaHoy`)

**Frontend — Bitácora de la Maestra** (`pages/maestra/Bitacora.jsx`):
- ✅ Agregó query dinámica a `/asistencia/filtro-entrada/:alumnoId`
- ✅ Bloque pañales → notas visuales (badges):
  - Verde: `🧷 Trajo pañales hoy` si `trajo_paniales = true`
  - Azul: `🧻 Trajo toallitas hoy` si `trajo_toallitas = true`

**Frontend — Bitácora de la Directora** (`pages/directora/AlumnoPerfil.jsx`):
- ✅ Agregó query dinámica a `/asistencia/filtro-entrada/:alumnoId`
- ✅ Nueva sección visual: `🧷 Insumos traídos`
  - Badges verdes/azules con pañales y toallitas traídos
  - Solo aparece si hay datos

### Validaciones completadas:
- ✅ FiltroEntrada: presionó "Las trajo hoy" en banner de toallitas
- ✅ BD: `trajo_toallitas` marcado como `true` en `registro_entrada`
- ✅ Bitácora Maestra: muestra badge azul `🧻 Trajo toallitas hoy`
- ✅ Bitácora Padre: muestra píldora `Trajo toallitas` en checklist entrada
- ✅ Bitácora Directora: muestra sección `Insumos traídos` con badge toallitas
- ✅ Alumno: Sofía Reyes Mendoza (ID: `a35cebfa-88be-45f0-b72a-83afdf77e18b`)

### Archivos modificados:
- `backend/migrations/040_trajo_toallitas_entrada.sql` (nueva)
- `backend/src/routes/insumos.js` (PUT `/insumos/solicitudes/:id/recibida`)
- `backend/src/routes/asistencia.js` (GET `/asistencia/filtro-entrada/:alumnoId`)
- `web/src/pages/padre/Bitacora.jsx` (fix lógica entrada, 2 píldoras)
- `web/src/pages/maestra/Bitacora.jsx` (query entrada, badges)
- `web/src/pages/directora/AlumnoPerfil.jsx` (query entrada, sección insumos)

### Commit:
- Hash: `63e0927` — `feat: Sesión XX — Persistencia y visualización de insumos (pañales/toallitas) en bitácoras`

### Notas técnicas:
- **Problema:** Al marcar "Las trajo hoy" ANTES de registrar entrada, no existía `registro_entrada` aún
- **Solución:** `INSERT ... ON CONFLICT (alumno_id, fecha) DO UPDATE` crea o actualiza el registro
- **Por qué aparecía en maestra pero no en padre:** Padre usaba datos cacheados (`entradaHoy`), ahora usa query dinámica
- Stock diario sigue en tabla separada (`insumos_stock_diario`), se descuenta por cambios de pañal
- Solicitudes de toallitas siguen en tabla separada (`insumos_solicitudes`), se resuelven en entrada

---

## ✅ SESIÓN 85 — Refactorización Salida Sanitaria → FiltroSalida (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO — Integración de checklist sanitario en modal de salida con validación de salida anticipada

### Implementado:

**BD — Migración 038:**
- ✅ Agregadas columnas `es_anticipada` (BOOLEAN, DEFAULT false) y `motivo_salida` (TEXT) a `registro_salida`

**Backend — `routes/asistencia.js`:**
- ✅ GET `/asistencia/filtro-salida` — Agregado campo `usa_panial` en SELECT (necesario para mostrar/ocultar checkbox en Paso 2)
- ✅ POST `/asistencia/salida` — Ampliado para aceptar campos de salida anticipada + checklist sanitario
  - Validación: `motivo_salida` obligatorio si `es_anticipada = true` (retorna 400 si falta)
  - Transacción explícita: INSERT a `registro_salida` (con columnas nuevas) + INSERT condicional a `registro_salida_sanitario`
  - Respuesta incluye `salida_sanitaria` con los datos del checklist registrado

**Frontend — `pages/maestra/FiltroSalida.jsx`:**
- ✅ ModalSalida refactorizado a **2 pasos**:
  - **Paso 1:** Selector "¿Quién recoge?" + Campo obligatorio "Motivo salida anticipada" (visible solo si `anticipada = true`)
  - **Paso 2:** Checklist sanitario con campos:
    - 🧷 Pañal limpio al salir (solo si `alumno.usa_panial = true`)
    - 🎒 Pertenencias completas
    - 💚 Estado físico normal
    - Textarea: Observaciones (opcional)
    - ✅ Entrega conforme
- ✅ Barra de progreso visual (indicador Paso 1/Paso 2)
- ✅ Validaciones integradas:
  - Paso 1: Quién recoge requerido, motivo obligatorio en salida anticipada
  - Paso 2: Todos los campos sanitarios capturados (booleanos + notas)
- ✅ Payload enviado incluye: `es_anticipada`, `motivo_salida`, `panial_limpio`, `pertenencias_ok`, `estado_fisico_ok`, `notas_sanitarias`, `entrega_conforme`

**Frontend — `pages/maestra/Bitacora.jsx`:**
- ✅ Sección "🚪 Salida Sanitaria" convertida a **solo lectura**:
  - Muestra datos capturados con checkmarks ✓/✗ por campo
  - Si no hay salida registrada: "⏳ Pendiente de registrar salida" + nota explicativa
  - Eliminado estado editable (`salidaSanitaria`, `salidaGuardada`)
  - Eliminada mutation de escritura (`POST /asistencia/salida-sanitario`)
  - Mantiene solo query de lectura (`GET /asistencia/salida-sanitario/:alumnoId`)

### Validaciones completadas:
- ✅ FiltroSalida: Paso 1 con selector "quién recoge"
- ✅ FiltroSalida: Paso 2 con checklist sanitario (checkboxes + observaciones)
- ✅ Salida normal (no anticipada): no muestra campo de motivo en Paso 1, avanza directo a Paso 2
- ✅ Salida anticipada (antes de `hora_salida_normal` de BD): muestra campo motivo obligatorio, valida antes de pasar a Paso 2
- ✅ Registros guardados en BD: `registro_salida` tiene `es_anticipada` y `motivo_salida` correctamente
- ✅ Registros guardados en BD: `registro_salida_sanitario` guarda el checklist
- ✅ Bitácora: muestra datos de salida sanitaria (solo lectura, sin botón de guardar)
- ✅ Alumno sin `usa_panial`: checkbox de pañal no aparece en Paso 2

### Archivos modificados:
- `backend/migrations/038_salida_anticipada_motivo.sql` (nueva)
- `backend/migrations/037_fix_registrado_por_fk.sql` (corregida — eliminada línea que intentaba ALTER ninos_extension)
- `backend/src/routes/asistencia.js` (POST /salida + GET /filtro-salida)
- `web/src/pages/maestra/FiltroSalida.jsx` (ModalSalida refactorizado)
- `web/src/pages/maestra/Bitacora.jsx` (sección Salida Sanitaria a solo lectura)

---

## ✅ SESIÓN 84 — UI Hermanos + QR Extensión Mobile + Cron Medicamentos (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO — UI hermanos web, QR extensión mobile, cron medicamentos corregido y validado

### Implementado:

**Backend — `alumnosController.js`:**
- ✅ `buscarPorQR` ahora devuelve `tiene_extension`, `hora_salida_extension`, `hermanos_sin_salir`
- ✅ `listar` (ambas queries: actual e histórica) ahora incluye `total_hermanos` por alumno

**Backend — `jobs/medicamentosJobs.js` — 3 bugs corregidos:**
- ✅ Bug 1: `g.maestra_titular_id` no existe en `grupos` → corregido con JOIN a `asignaciones_grupo` + `personal`
- ✅ Bug 2: INSERT usaba columnas `mensaje` y `deep_link` inexistentes → corregido a `cuerpo` y `datos_extra` (JSONB)
- ✅ Bug 3: Insertaba `personal.id` en lugar de `usuarios.id` → corregido con `p_tit.usuario_id`

**Backend — `routes/bitacora.js`:**
- ✅ Notificación de medicamento administrado ahora llega a TODOS los padres vinculados (no solo tutor principal)
- ✅ Ambos flujos corregidos: con `toma_id` y compatibilidad sin `toma_id`

**Frontend Web — `layouts/MaestraLayout.jsx`:**
- ✅ Campanita `NotificationBell` agregada al header de la miss (no existía)

**Frontend Web — `pages/directora/Alumnos.jsx`:**
- ✅ Chip "👨‍👩‍👧 N hermanos" en tarjeta de alumno (azul, visible si `total_hermanos > 0`)

**Mobile — `app/(maestra)/qr-scanner.jsx`:**
- ✅ Guard QR ampliado: acepta `HAPPYSCHOOL:ALUMNO:` y `HAPPYSCHOOL:EXT:`
- ✅ Alert "⏰ Entrada temprana" si escanean QR extensión antes de las 14:45
- ✅ `buscarExtensionMutation` → `/ninos-extension/por-qr/:qrData`
- ✅ Banner naranja para niños de extensión en resultado
- ✅ Banner rojo de hermanos sin salida en modo salida (`hermanos_sin_salir > 0`)

### Validaciones completadas:
- ✅ Cron medicamentos disparó a las ~14:20, notificación apareció en campanita de la miss
- ✅ Miss administró medicamento desde bitácora, se registró correctamente
- ✅ Notificación llegó al papá tutor principal (Adriana García López)
- ✅ Fix notificación a ambos padres implementado (Héctor Torres Núñez también recibirá)
- ✅ UI hermanos en AlumnoPerfil.jsx (ya existía completa desde sesión anterior) — validado vínculo hermanos

---

## ✅ SESIÓN 83 — VISITANTES + FIXES UPLOAD (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO — Visitantes en página dedicada, upload fixes críticos

**Objetivo:** Crear página dedicada `/directora/visitantes` con registro, foto, extensión día, salida, eliminación. Diagnosticar y fijar error crítico "Unexpected end of form" en upload de fotos.

### Implementado (100%):

**Backend:**
- ✅ Fix crítico `app.js` — removido `upload.any()` global que consumía streams multipart antes de rutas
- ✅ Restaurado `upload.single('foto')` en `/visitantes` POST 
- ✅ Restaurado `upload.single('foto')` en `/ninos-extension` POST y PUT
- ✅ Mock Cloudinary service para desarrollo (sin credenciales reales)
- ✅ Migración `037_fix_registrado_por_fk.sql` — FK visitantes.registrado_por corregida (usuarios, no personal)

**Frontend Web:**
- ✅ Nueva página `/directora/visitantes` (Visitantes.jsx) — CRUD completo
- ✅ Dashboard.jsx simplificado — Link a página dedicada (sin modal "registrar")
- ✅ DirectoraLayout.jsx — nav item "Visitantes 👁️"
- ✅ App.jsx — ruta `/directora/visitantes` agregada
- ✅ Formato hora_entrada corregido (ISO → locale time HH:MM)

**Validaciones completadas:**
- ✅ Registrar visitante CON foto → sube sin error 500
- ✅ Registrar visitante SIN foto → funciona igual
- ✅ Card muestra: nombre, grupo, tutor, hora entrada (formato correcto HH:MM), hora salida (si existe), badges extensión
- ✅ Botones: activar extensión día, registrar salida, eliminar (solo sin salida registrada)
- ✅ Pago automático generado al activar extensión día (origen='visitante_extension', monto=150)

**Archivos modificados:**
- `backend/src/app.js` — Removidas 3 líneas multer global
- `backend/src/routes/visitantes.js` — Restaurado multer, upload.single, req.file
- `backend/src/routes/ninos_extension.js` — Restaurado multer, upload.single, req.file
- `backend/src/services/cloudinaryService.js` — Mock Cloudinary para dev
- `web/src/services/api.js` — Removido default Content-Type header
- `web/src/pages/directora/Visitantes.jsx` — Nueva página CRUD
- `web/src/pages/directora/Dashboard.jsx` — Simplificado visitantes section
- `web/src/App.jsx` — Agregada ruta `/directora/visitantes`
- `web/src/layouts/DirectoraLayout.jsx` — Agregado nav item Visitantes
- `backend/migrations/037_fix_registrado_por_fk.sql` — Nueva migración

**Root cause diagnosis:**
- Error "Unexpected end of form" causado por `app.use(upload.any())` global en app.js línea 37
- Multer global consumía stream multipart ANTES de que rutas específicas pudieran acceder
- Error secundario: axios.create() con `headers: { 'Content-Type': 'application/json' }` forzaba JSON encoding
- Fix: quitar ambos, deixar multer por ruta con headers automáticos

**Commit:** próximo

---

## ✅ SESIÓN XX — INSUMOS PAÑALES + SOLICITUD TOALLITAS HÚMEDAS (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% BACKEND + WEB — Validación FiltroEntrada mañana

**Objetivo:** Rediseñar stock de insumos: 5 pañales diarios (se resetean c/ día), solicitud de toallitas húmedas con notificación WhatsApp al papá

### Implementado (100%):

**Backend:**
- ✅ Migración `037_insumos_paniales_diario.sql`
  - Nueva tabla `insumos_stock_diario` (alumno_id, fecha, cantidad)
  - Nueva tabla `insumos_solicitudes` (alumno_id, fecha, tipo, resuelta, resuelta_en_entrada)
  - Nuevo campo `trajo_paniales` en `registro_entrada`
  - Eliminadas filas toallita + papel de `insumos_alumno`
- ✅ Ruta `GET /insumos/:alumnoId` — devuelve `{ stock: { cantidad, no_registrado }, solicitudes_toallitas: [...] }`
- ✅ Ruta `POST /insumos/:alumnoId/solicitar-toallitas` — crea solicitud + WhatsApp + notificación interna
- ✅ Ruta `PUT /insumos/solicitudes/:id/recibida` — marca resuelta
- ✅ Lógica `POST /asistencia/entrada` — si `trajo_paniales=true` → stock=5; si no → stock=saldo_ayer
- ✅ Descuento automático en `POST /bitacora/panial` — resta 1 del stock diario

**Frontend Web:**
- ✅ `FiltroEntrada.jsx` — checkbox "Trajo pañales hoy (5)" + banner toallitas pendientes + botón marcar recibidas
- ✅ `Bitacora.jsx` — bloque morado stock, botón "Solicitar toallitas húmedas", alerta solicitud, colores semáforo ajustados (≥3 verde, ≥1 amarillo, <1 rojo)

**Validaciones completadas (hoy):**
- ✅ Sofía Reyes Mendoza: solicitud creada + papá recibió WhatsApp
- ✅ Stock inicializado: 4 pañales (5 - 1 cambio de hoy)
- ✅ Bloque morado renderiza correctamente
- ✅ Botón says "🧻 Solicitar toallitas húmedas"
- ✅ Alerta amarilla de solicitud pendiente visible

### Pendiente (validar mañana 2026-04-28):
- [ ] FiltroEntrada muestre "🧻 Pendiente: llevar toallitas" (banner)
- [ ] Botón "✅ Las trajo hoy" marque como resuelta
- [ ] Stock sin pañales: desmarcar "Trajo pañales" → stock = 4 (saldo ayer)
- [ ] **Nota técnica:** Query de solicitudes puede necesitar cambio si no muestra de ayer (`fecha <= CURRENT_DATE`)

**Commit:** bdcbfae

---

## ✅ SESIÓN 82 — GESTIÓN ALUMNOS BLOQUE 2 (85% Completado)

**Fecha:** 2026-04-27 | **Estado:** 85% COMPLETADO — Pendiente: Alumnos.jsx UI + mobile qr-scanner

**Objetivo:** Agregar 3 tipos de personas externas (niños extensión, visitantes, hermanos) + detección de hermanos en QR salida + cobros automáticos

### Implementado (100%):

**Backend:**
- ✅ 3 migraciones ejecutadas:
  - `036_pagos_origen.sql` — campo `pagos.origen` (manual, extension_dia, visitante_extension, retardo)
  - `034_ninos_extension.sql` — tabla `ninos_extension` + `registro_extension` (QR, modalidad pago, entrada/salida)
  - `035_visitantes.sql` — tabla `visitantes` (foto, extensión día, hora entrada/salida)
- ✅ Ruta completa `/ninos-extension` — CRUD, entrada/salida automáticas, QR único (`HAPPYSCHOOL:EXT:<id>`), pagos automáticos
- ✅ Ruta completa `/visitantes` — CRUD, extensión del día, pagos automáticos (`origen = 'visitante_extension'`)
- ✅ Query detección hermanos en `POST /asistencia/salida` — retorna `hermanos_sin_salir[]`

**Frontend Web:**
- ✅ `NinosExtension.jsx` (página completa) — crear, editar, eliminar, modal QR con descarga, indicador activo/inactivo, modalidad pago
- ✅ `Dashboard.jsx` — sección "Visitantes de hoy" con botón "+ Registrar", lista visitantes con badge naranja, modal registro visitante
- ✅ `App.jsx` — ruta agregada `/directora/ninos-extension`
- ✅ `DirectoraLayout.jsx` — nav item "Niños de Extensión"

**Validaciones completadas:**
- ✅ Crear niño extensión mensual desde web
- ✅ Migraciones ejecutadas sin errores
- ✅ Rutas backend funcionales

### Pendiente (85% → 100%):

**Frontend Web (~30 min):**
- ⏳ `Alumnos.jsx` — Agregar sección "Hermanos" en modal detalle alumno
  - Query GET `/alumnos/:id/hermanos`
  - Buscar alumno + botón "Vincular" → POST `/alumnos/:id/familia` con `hermano_id`
  - Lista hermanos vinculados + botón "Desvincular" → DELETE `/alumnos/:id/familia`
  - Chip "X hermanos" en tarjeta del listado

**Frontend Mobile (~20 min):**
- ⏳ `qr-scanner.jsx` — Ampliar para niños extensión
  - Guard QR extendido: detectar `HAPPYSCHOOL:EXT:` + `HAPPYSCHOOL:ALUMNO:`
  - GET `/ninos-extension/por-qr/:qrData` si es extensión
  - ComponenteResultadoExtension (fondo naranja/ámbar)
  - Alert "Entrada temprana" si hora < 14:45 (no bloquear)
  - Banner alerta hermanos en salida (si `hermanos_sin_salir.length > 0`)

### Archivos creados:
- `backend/migrations/034_ninos_extension.sql`
- `backend/migrations/035_visitantes.sql`
- `backend/migrations/036_pagos_origen.sql`
- `backend/src/routes/ninos_extension.js` (266 líneas)
- `backend/src/routes/visitantes.js` (207 líneas)
- `web/src/pages/directora/NinosExtension.jsx` (308 líneas)

### Archivos modificados:
- `backend/src/routes/index.js` — registrar 2 rutas nuevas
- `backend/src/routes/asistencia.js` — agregar query hermanos
- `web/src/App.jsx` — import + ruta
- `web/src/layouts/DirectoraLayout.jsx` — nav item
- `web/src/pages/directora/Dashboard.jsx` — query visitantes + componente ModalNuevoVisitante

### Decisiones de diseño:

**QR niños extensión:** Formato `HAPPYSCHOOL:EXT:<UUID>` mantiene consistencia con alumno regular. Se genera automáticamente al crear niño.

**Pagos automáticos:** Campo `pagos.origen` diferencia cargos para poder condonarlos masivamente. Flujos:
- Niño extensión modalidad `por_dia` → pago automático al registrar entrada (si no existe ya)
- Visitante con extensión día → pago automático al activar flag

**Detección hermanos:** Via `familia_id` compartido. Query en salida busca hermanos con entrada hoy + sin salida + no deletados. Backend retorna array en respuesta.

### Commits:
- `172f3a6` — docs: VALIDACIONES actualizado — Sesión 81 Fixes medicamentos
- (Se crearán commits en próxima sesión tras cierre)

---

## ✅ SESIÓN 81 — GESTIÓN ALUMNOS AVANZADA (Bloque 1) + MEDICAMENTOS (Tomas Múltiples)

---

### ✅ PARTE 2: MEDICAMENTOS CON TOMAS MÚLTIPLES — FIXES FINALES

**Fecha:** 2026-04-27 | **Estado:** ✅ COMPLETADO 100% + Validación en progreso (job 14:00)

**Problema resuelto:** El padre entrega medicamento una sola vez pero puede necesitar múltiples dosis al día (ej. 8am y 2pm). Sesión anterior implementó backend + padre. Hoy: 3 fixes críticos UX para flujo completo miss → papá.

**3 Bugs identificados y corregidos:**

1. **Horarios no visibles en FiltroEntrada** — mostraba "Sin hora programada" aunque papá agregó horarios
   - **Causa:** Lectura de campo legacy `med.hora_programada` (NULL en recepcion_medicamento)
   - **Fuente correcta:** `med.tomas[].hora_programada` (tabla toma_medicamento)
   - **Fix:** `med.tomas?.length > 0 ? med.tomas.map(t => t.hora_programada.substring(0, 5)).join(', ') : 'Sin hora'`
   - **Archivos:** FiltroEntrada.jsx web (línea 241) + mobile (línea 715)

2. **Miss olvida dar clic "Recibir"** — medicamento no se marca como recibido
   - **Impacto:** Job cron no dispara recordatorio (filtra `rm.recibido = true`)
   - **Causa:** UX: Miss tiene 2 acciones (entrada + clic recibir), olvida la segunda
   - **Fix:** Auto-marcar medicamentos al registrar entrada
   - **Ubicación:** asistencia.js POST /entrada (línea 97-104) — UPDATE recepcion_medicamento SET recibido=true
   - **Resultado:** Medicamentos auto-recibidos al pasar FiltroEntrada, job ya los encuentra

3. **Papá no recibe notificación de administración** — flujo nuevo (toma_id) no notificaba
   - **Causa:** Notificación solo en rama compatibilidad (sin toma_id)
   - **Fix:** Copiar bloque notificaciones al flujo toma_id
   - **Ubicación:** bitacora.js PATCH /administrar (línea 681-717) — query padre + enviarMensaje + INSERT notificaciones
   - **Resultado:** Papá recibe WhatsApp + notificación in-app cuando toma se administra

### Cambios implementados

**BD:**
- Migración `033_tomas_medicamento.sql` aplicada:
  - Nueva tabla `toma_medicamento` (UUID, recepcion_id, hora_programada, recordatorio_enviado, administrado, administrado_at, administrado_por, medicamento_id, created_at)
  - Índices: `idx_toma_recepcion`, `idx_toma_fecha`
  - Campo `hora_programada` en `recepcion_medicamento` queda deprecado (se mantiene datos históricos)

**Backend (`backend/src/routes/bitacora.js`):**
- `POST /medicamento/recepcion` — ahora acepta array `horas` (JSON):
  - Recibe medicamento name, dosis, array de horas programadas
  - Crea recepción + una fila toma_medicamento por cada hora
  - Retorna recepción con tomas array embebido (json_agg)
  - Fotos ahora en Base64 (evita problemas multer/busboy) — fallback a data URL si Cloudinary no disponible en dev
- `GET /:alumnoId` — query actualizado para incluir LEFT JOIN toma_medicamento con json_agg
- `PATCH /medicamento/recepcion/:id/administrar` — ahora acepta `toma_id` para administrar dosis individual
  - Si viene `toma_id` → marca esa toma como administrada
  - Si no viene → comportamiento anterior (compatibilidad)

**Backend (`backend/src/jobs/medicamentosJobs.js`):**
- Bug fix: `rm.nombre_medicamento` → `rm.nombre` (columna correcta)
- Query ahora busca en `toma_medicamento` en lugar de `recepcion_medicamento.hora_programada`
- Filtra tomas: `administrado=false AND recordatorio_enviado=false AND rm.recibido=true`
- Notificaciones disparan por TOMA, no por recepción
- Marca `recordatorio_enviado=true` en `toma_medicamento` (nivel de dosis)

**Frontend padre (`web/src/pages/padre/Bitacora.jsx`):**
- Estado `horasMed` — array de strings "HH:MM" (reemplaza `hora_programada` único)
- Formulario medicamento:
  - Lista dinámica de inputs `type="time"`
  - Botón "+ Agregar hora" para N dosis
  - Botón "✕" para eliminar hora individual
  - Foto receta → obligatoria, se convierte a Base64 antes de enviar
- Display recepciones:
  - Muestra tomas como lista de badges con hora + estado (⏳ pendiente / ✅ administrado)
  - Badge principal de recepción:
    - ✅ Dado (todas las tomas administradas)
    - 📬 Recibido (en manos de miss, pendiente administración)
    - ⏳ Pendiente (papá no ha recibido confirmación)
  - Botón 🗑 para borrar (solo si no recibido ni administrado)
- Ambas secciones (con/sin bitácora) muestran el mismo formulario y lista

**Frontend miss (`web/src/pages/maestra/Bitacora.jsx`):**
- Sección medicamentos → query en toma_medicamento level (no recepción level)
- Display: una FILA por TOMA (no una fila por recepción)
  - Muestra: medicamento name, dosis, hora programada, botón "Administrar"
  - Administrar → envía `toma_id` al backend
- Badge de estado: ⏳ Pendientes (solo tomas no administradas)

### Archivos modificados
- `backend/migrations/033_tomas_medicamento.sql` (nuevo)
- `backend/src/routes/bitacora.js` (POST recepcion, GET bitacora, PATCH administrar)
- `backend/src/jobs/medicamentosJobs.js` (query + bug fix)
- `web/src/pages/padre/Bitacora.jsx` (formulario, display, delete mutation)
- `web/src/pages/maestra/Bitacora.jsx` (display tomas, administrar mutation)

### Validaciones completadas (Sesión 81 Parte 2)
- ✅ Horarios visibles en FiltroEntrada (web + mobile)
- ✅ Medicamentos auto-marcados como recibidos al entrar (FiltroEntrada)
- ✅ Papá recibe notificación al administrar toma (WhatsApp + in-app)
- ✅ Paridad web ↔ mobile confirmada
- ⏳ **VALIDACIÓN PENDIENTE:** Job cron a las 14:00 dispara recordatorio a miss
  - **Cronograma:** Validación por Valeria a las 14:00 hoy (2026-04-27)
  - **Qué revisar:** Notificación in-app a miss + BD `notificaciones` tipo='recordatorio_medicamento'

---

## ✅ SESIÓN 81 — GESTIÓN ALUMNOS AVANZADA (Bloque 1)

**Fecha:** 2026-04-26 | **Estado:** BLOQUE 1 COMPLETADO ✅ | **Bloque 2:** pendiente

### Aclaraciones de negocio definidas esta sesión
- **Estructura familiar:** 1 tutor principal (mamá o papá) en tabla `padres`. Máximo 2 personas autorizadas para recoger (límite correcto, no se cambió). Campo `parentesco` es texto libre → soporta "Mamá 1", "Mamá 2", etc.
- **Niños de Solo Extensión:** NO son alumnos de la escuela. Solo usan servicio vespertino 3-6 PM. Irán en tabla separada `ninos_extension` (Bloque 2).
- **Niños Visitantes:** NO son alumnos. Vienen un día puntual. Tabla `visitantes` (Bloque 2).
- **Alumnos regulares tarde:** Un alumno regular que llega tarde = retardo (ya implementado). NUNCA se convierte en estancia por día.

### Cambios implementados

**BD:**
- Migración `031_familia_id.sql` aplicada — columna `familia_id UUID` + índice en tabla `alumnos`.

**Backend (`backend/src/routes/alumnos.js`):**
- `POST /alumnos/:id/padres` — vincula o reutiliza tutor por email (no-duplicidad). Campos: nombre_completo, parentesco (texto libre), telefono, telefono_whatsapp, email, es_tutor_principal.
- `PUT /alumnos/:id/padres/:padreId` — editar datos del tutor desde perfil del alumno.
- `POST /alumnos/:id/padres/:padreId/foto` — subir foto del tutor a Cloudinary.
- `GET /alumnos/:id/hermanos` — retorna hermanos con mismo `familia_id`.
- `POST /alumnos/:id/familia` — vincula dos alumnos como hermanos (comparten `familia_id`).
- `DELETE /alumnos/:id/familia` — desvincula alumno de su familia.

**Backend (`backend/src/controllers/alumnosController.js`):**
- Agregado `familia_id` a lista de campos permitidos en `actualizar()`.

**Backend (`backend/src/routes/reportes.js`):**
- Nueva query en `/reportes/dashboard`: `extensionVespertina` — alumnos con asistencia hoy + su estado de extensión + si ya registraron salida. Alimenta el panel vespertino del dashboard.

**Frontend (`web/src/pages/directora/AlumnoPerfil.jsx`):**
- Nuevo componente `SeccionPadres` — reemplaza la vista solo-lectura de tutores. Permite editar nombre, parentesco, teléfono, WhatsApp, email de cada tutor y subir su foto. Botón "+ Agregar" para vincular nuevo tutor.
- Nuevo componente `SeccionHermanos` — muestra hermanos con navegación directa a su perfil. Buscador para vincular hermano existente. Botón desvincular.

**Frontend (`web/src/pages/directora/Dashboard.jsx`):**
- Nuevo componente `PanelExtensionVespertina` — aparece automáticamente a las 3:06 PM. Muestra 3 grupos:
  1. ✅ Con extensión contratada (salida pendiente)
  2. ⚠️ Sin extensión — salida pendiente (aviso: se generará cobro al salir)
  3. Ya salieron (colapsado)
- Botón "Ver todos / Modo extensión" para toggle manual.
- Reloj se recalcula cada 60 segundos para activación automática.

### Archivos modificados
- `backend/migrations/031_familia_id.sql` (nuevo)
- `backend/src/routes/alumnos.js`
- `backend/src/routes/reportes.js`
- `backend/src/controllers/alumnosController.js`
- `web/src/pages/directora/AlumnoPerfil.jsx`
- `web/src/pages/directora/Dashboard.jsx`

---

## ✅ SESIÓN 80 — SALUD Y MEDICACIÓN (100% Frontend + Job Backend)

**Fecha:** 2026-04-26 | **Estado:** 100% COMPLETADO ✅ | **Duración:** ~100 min

**Lo que se hizo en Frontend Web (Maestra):**
- Bloque 6: Agregado flag `es_diarrea` al envío de pañal — banner rojo ⚠️ en sección Salud
- Bloque 7: Sección "Salida Sanitaria" con checkboxes (pañal limpio, pertenencias, estado) + entrega conforme
  - Query GET `/asistencia/salida-sanitario/:alumnoId` para precargar
  - Mutation POST `/asistencia/salida-sanitario` para guardar

**Lo que se hizo en Frontend Mobile:**
- Bloque 5: Sección "Vómito" con botón toggle, selector 3-botones intensidad (leve/moderado/fuerte), notas
  - Mutation POST `/bitacora/vomito` 
  - Listado de vómitos del día con hora + intensidad + notas
- Bloque 6: Modificado `registrarPanial()` para enviar `es_diarrea: condicion === 'diarrea'`
  - Banner rojo en sección Salud si hay diarrea
- Bloque 7: Sección "Salida Sanitaria" con 4 Switches (pañal/pertenencias/estado/entrega) + notas
  - Mutation POST `/asistencia/salida-sanitario`

**Lo que se hizo en Frontend Web (Padre):**
- Bloque 8: Tab Salud mejorado para mostrar:
  - Listado de vómitos (hora + intensidad + notas) si existen
  - Banner ⚠️ si hay diarrea
  - Empty state actualizado (considera vómitos y diarrea)

**Lo que se hizo en Backend:**
- Bloque 9: Job cron medicamentos — `backend/src/jobs/medicamentosJobs.js`
  - Schedule: cada 5 min, 7:00-16:00, lun-vie (UTC México)
  - Query: recepciones NO administradas con `hora_programada` en ventana ±10 min
  - Acción: INSERT notificación tipo `recordatorio_medicamento` a maestra titular
  - Integración en `backend/src/index.js` — se ejecuta al iniciar servidor

**Validación:**
- ✅ Sintaxis JS backend y frontend sin errores
- ✅ Backend iniciado con ambos jobs (comida + medicamentos)
- ✅ Cambios presentes en todos 5 archivos clave

---

## ✅ SESIÓN 78 — SALUD Y MEDICACIÓN (50% Backend)

**Fecha:** 2026-04-26 | **Estado:** Backend 100% ✅, Frontend pendiente Sesión 79 | **Duración:** ~90 min

**Lo que se hizo en Backend:**

### Migración SQL 030 ✅
- Tabla `recepcion_medicamento` — autorización previa con fotos receta + envase
- Tabla `registro_vomito` — episodios múltiples/día con intensidad (leve/moderado/fuerte)
- Tabla `registro_salida_sanitario` — checklist de entrega al tutor (pañal/pertenencias/estado físico)
- Tabla `insumos_alumno` — stock dinámico pañales, toallitas, crema por alumno
- Tabla `insumos_movimientos` — historial de cambios (recarga/descuento/ajuste)
- ALTER TABLE asistencia — columnas justificacion_motivo, justificada_por, justificada_at
- ALTER TABLE registro_panial — columna es_diarrea boolean

### Catálogos Backend ✅
- Agregado `diarrea` a `condiciones-panial` (⚠️ emoji)
- Creados `tipos-insumo` (panial, toallitas, crema)
- Creados `vomito-intensidad` (leve, moderado, fuerte)
- Mismos catálogos en mobile/src/constants/catalogos.js para paridad

### Endpoints Bitácora ✅
- **POST /bitacora/vomito** — registrar episodios, notif padre si intensidad='fuerte'
- **POST /bitacora/panial (MODIFICADO)** — agregar es_diarrea, notif padre si true
- **POST /bitacora/medicamento/recepcion** — multipart foto_receta + foto_envase
- **GET /bitacora/medicamento/pendientes** — listar recepciones no administradas
- **PATCH /bitacora/medicamento/recepcion/:id/administrar** — marcar como administrado + notif
- **GET /:alumnoId** — incluye vomitos[], recepciones_medicamento[]

### Routes Insumos (NUEVO) ✅
- **GET /insumos/:alumnoId** — stock actual todos tipos
- **POST /insumos/:alumnoId/recarga** — crear/actualizar + historial
- **GET /insumos/alertas/hoy** — para directora, alumnos con stock bajo

### Endpoints Asistencia ✅
- **PATCH /asistencia/:alumnoId/justificar** — marcar falta como justificada
- **POST /asistencia/salida-sanitario** — registrar checklist salida (upsert)
- **GET /asistencia/salida-sanitario/:alumnoId** — obtener checklist

**Pendiente para Sesión 79:** Frontend web + mobile + job cron medicamentos

---

## ✅ SESIÓN 77 — Reorganización Arquitectónica FASES 4-7

**Fecha:** 2026-04-25 | **Estado:** Completado ✅ | **Duración:** ~90 min

**Lo que se hizo:**

### FASE 4 — .gitignore y builds (~20 min)
- Actualizar `.gitignore` raíz: secciones organizadas, agregar `.npm`, `*.tgz`, `.pem`, `.key`, vite cache, metro bundler, EAS
- Crear `web/.gitignore`: Vite-específico (`dist-ssr/`, `.vite/`, timestamps)
- Crear `mobile/.gitignore`: Expo-específico (`android/`, `ios/`, `.eas/`, metro cache)
- Verificar: `web/dist/`, `mobile/.expo/`, `*.log` — ninguno rastreado por git

### FASE 5 — Tests de smoke (~45 min)
- Extraer `backend/src/app.js` (Express puro sin `listen()`) — necesario para testabilidad
- Simplificar `backend/src/index.js` a arranque puro (PORT + jobs)
- Crear `tests/smoke/health.test.js` — GET /health → 200
- Crear `tests/smoke/auth.test.js` — 401 credenciales inválidas, 400 sin campos, login real opcional
- Crear `tests/setup.js` — carga `backend/.env` antes de los tests
- Instalar `jest@30` + `supertest@7` como devDependencies
- Agregar `npm run test:smoke` + config jest en `package.json` raíz
- Resultado: 4/4 tests pasan ✓

### FASE 6 — Script dev unificado (~10 min)
- Instalar `concurrently@9`
- `npm run dev` → backend + web en paralelo (cyan/magenta)
- `npm run dev:full` → backend + web + mobile Expo (cyan/magenta/yellow)
- README actualizado con tabla de scripts, estructura del proyecto, instrucciones smoke test

### FASE 7 — Normalizar imports web (~10 min)
- Migrar 24 imports relativos (`../../`) → alias `@/` en 15 archivos de `web/src/`
  - `pages/directora/` (7 archivos), `pages/maestra/` (2), `pages/padre/` (5), `components/ui/` (1)
- Crear `web/jsconfig.json` — VSCode resuelve `@/` con autocomplete
- Build Vite verificado: ✓ 1651 módulos, sin errores

**Commits:** 4
- `chore: FASE 4 — .gitignore y builds`
- `feat: FASE 5 — Tests de smoke (health + auth)`
- `feat: FASE 6 — Script dev unificado con concurrently`
- `refactor: FASE 7 — Normalizar imports web + README + jsconfig`

---

## ✅ SESIÓN 76 — Reorganización Arquitectónica FASE 3 (Backend Scripts)

**Fecha:** 2026-04-26 | **Estado:** Completado ✅ | **Duración:** ~75 min

**Lo que se hizo:**

### FASE 3 — Reorganización de archivos backend
- Mover `backend/src/database/` → `backend/scripts/` con subcarpetas:
  - `seeds/` — 11 archivos: seed.js + 10 seeds específicos
  - `setup/` — 6 archivos: 6 setups de inicialización
  - `fixes/` — 5 archivos: fixes de datos históricos
  - `checks/` — 1 archivo: validador de datos
- Actualizar todos los imports:
  - `require('../config/database')` → `require('../../src/config/database')` (2 niveles)
  - `require('dotenv').config()` bare → con path explícito `../../.env`
  - Actualizar comentarios de uso en setup_maternal.js y setup_padre_demo.js
- Consolidar migration runners:
  - Eliminar `backend/migrate.js` (hardcoded 014+015)
  - Eliminar `backend/run-migration.js` 
  - Crear `backend/scripts/migrate-runner.js` (genérico, acepta múltiples migraciones)
- Actualizar `backend/package.json`:
  - `"seed": "node src/database/seed.js"` → `"node scripts/seeds/seed.js"`
- Mover docs:
  - `RESUMEN_SESION_63.md` → `/docs/`
  - También movidos VALIDACION_SESION_63.md, VALIDACION_SESION_71.md, SCHEMA_SHORTCUT.md, MEMORY.md a `/docs/`
- Eliminar archivos temporales del root (5 archivos):
  - fix_emojis_skin.js, temp_seed_ana.sql, verify_endpoint.js, test_api.js, test_grupos.js
- Verificaciones:
  - `npm run seed` funciona ✓ (seed completa sin errores de módulo)
  - Backend arranca sin errores ✓
  - Cero referencias a `src/database` en código ✓

**Patrones de import aplicados:**
- Patrón A (sin dotenv): 6 archivos — solo cambiar db require
- Patrón B (bare dotenv): 3 archivos — agregar path explícito + db require
- Patrón C (dotenv con path): 9 archivos — mantener path + db require
- Patrón D (bare dotenv + Pool directo): 3 archivos — agregar path, sin cambio db
- Patrón E (dotenv + Pool directo): 2 archivos — mantener path, sin cambio db

**Archivos modificados:**
- `backend/package.json`
- `backend/scripts/migrate-runner.js` (nuevo)
- 23 archivos en `backend/scripts/` (copiados y editados)

**Archivos eliminados:**
- `backend/src/database/` (directorio completo)
- `backend/migrate.js`
- `backend/run-migration.js`
- 5 temporales del root

**Commits:** 1
- refactor: FASE 3 — Reorganización backend/scripts/

---

## ✅ SESIÓN 75 — Reorganización Arquitectónica FASE 1+2 (Seguridad + Mobile)

**Fecha:** 2026-04-25 | **Estado:** Completado ✅

**Lo que se hizo:**

### FASE 1 — Eliminación de Credenciales (CRÍTICO)
- Eliminar `backend/test_schema.js` (credenciales postgres:happy2026 en git)
- Mover password por defecto a variable `DEFAULT_USER_PASSWORD`
  - `backend/src/routes/personal.js` líneas 108, 178, 184 → usar `process.env.DEFAULT_USER_PASSWORD`
  - Agregar a `.env` y `.env.example` con guías claras
- CORS dinámico: `backend/src/index.js` lee `MOBILE_URL` desde `.env`
- `mobile/.env.example` → placeholder genérico `192.168.1.X` (era IP real `192.168.1.93`)

### FASE 2 — Corregir Imports Rotos Mobile (ALTO)
- Double-src bug: `@/src/...` → `@/...` en `mobile/app/(padre)/`
  - `index.jsx`: NotificationBell, buildGoogleCalendarUrl
  - `comida.jsx`: api, useAuthStore
  - **Causa:** alias `@` apunta a `./src`, por lo que `/src` generaba `./src/src/` (roto)
- Eliminar alias `@hooks` muerto de `mobile/babel.config.js` (directorio no existe)

**Archivos modificados:**
- `backend/src/routes/personal.js`
- `backend/.env` + `.env.example`
- `backend/src/index.js`
- `mobile/.env.example`
- `mobile/app/(padre)/index.jsx`
- `mobile/app/(padre)/comida.jsx`
- `mobile/babel.config.js`

**Archivos eliminados del repo:**
- `backend/test_schema.js` (git rm)

**Commits:** 2
1. refactor: FASE 1+2 — Seguridad + Imports móvil
2. chore: Sesión 75 — Cierre (PENDIENTES + ARCHIVE_LOG + memory)

**Plan completo:** 7 fases de reorganización (FASE 1+2 completadas, FASE 3-7 pendientes para sesiones 76-78)
- **FASE 3+4 (sesión 76):** Reorganizar backend/scripts/ + .gitignore
- **FASE 5+6 (sesión 77):** Tests smoke + script dev unificado
- **FASE 7 (sesión 78):** Normalizar imports web

---

## ✅ SESIÓN 74 — Sincronización Web ↔ Mobile (Paridad Completa)

**Fecha:** 2026-04-25 | **Estado:** Completado ✅

**Lo que se hizo:**
- **Módulo Tareas Maestra mobile:** `mobile/app/(maestra)/tareas.jsx` con 3 tabs (Próximas/Vencidas/Borradores), navegador semanas ISO, modales Nueva/Editar/Entregas con `expo-image-picker`
- **Dashboard Maestra mobile:** Agregados banners "Tareas por recibir hoy" (azul) + "Alumnos en alerta" (rojo), botón acceso rápido
- **Dashboard Padre mobile:** Nuevo componente HijoTareasPendientes — tareas expandibles por hijo con emojis urgencia (🔴/🔥/⚠️/📘)
- **Bitácora Padre mobile:** SelectorCiclo con chips horizontales para navegar ciclos, restricción fechas al rango
- **QR Scanner mobile:** Indicador Extensión de Horario en modo salida — banner naranja si `tiene_extension === true` con hora de salida
- **Bitácoras mobile:** Sincronización comida_extra — visible en tab Comida (padre) y sección separada (maestra) si hay extensión activa en fecha

**Archivos creados:**
- `mobile/app/(maestra)/tareas.jsx`

**Archivos modificados:**
- `mobile/app/(maestra)/_layout.jsx` — agregar ruta Tareas a tabs
- `mobile/app/(maestra)/index.jsx` — banners + botón Tareas
- `mobile/app/(padre)/index.jsx` — componente HijoTareasPendientes
- `mobile/app/(padre)/bitacora.jsx` — SelectorCiclo + comida_extra
- `mobile/app/(maestra)/bitacora.jsx` — comida_extra visible si extensión activa
- `mobile/app/(maestra)/qr-scanner.jsx` — indicador extensión en modo salida

**Commits:** 5
1. Sincronización Mobile — Módulo Tareas + Dashboard Padre
2. Sincronización Mobile — Bitácoras + QR Scanner
3. Sincronizar comida_extra en Bitácoras mobile
4. Cierre de sesión (PENDIENTES)
5. Cierre de sesión (ARCHIVE_LOG + MEMORY)

**Regla nueva:** Cada cambio funcional que aplique a roles móviles se sincroniza en mobile en la misma sesión. **No hay más deuda de paridad web↔mobile.**

---

## ✅ SESIÓN 73 — Módulo Extensión de Horario

**Fecha:** 2026-04-26 | **Estado:** Completado ✅

**Lo que se hizo:**
- Migrations 028 + 029: tabla `historial_servicios` con vigencia por rango (mes_inicio/anio_inicio → mes_fin/anio_fin)
- Alta de extensión: modalidad rango o indefinido, genera cargos pendientes automáticamente en `pagos`
- Baja de extensión: selector limitado al rango activo, cancela cargos futuros pendientes
- Estado actual informativo: muestra alta futura con rango efectivo corregido por bajas registradas
- Rutas movidas de `/comida/historial-servicios` → `/alumnos/:id/historial-servicios`
- FiltroSalida (maestra): badge ⏳ extensión en tarjeta, alerta salida anticipada respeta `hora_salida_extension`
- Bitácoras (directora/maestra/papá): comida_extra visible según extensión en fecha histórica del rango
- GET historial-servicios abierto a maestra y padre para consulta de comida_extra histórica

**Archivos modificados:**
- `backend/migrations/028_historial_servicios.sql` (nuevo)
- `backend/migrations/029_historial_servicios_vigencia.sql` (nuevo)
- `backend/src/controllers/alumnosController.js`
- `backend/src/controllers/comidaController.js`
- `backend/src/routes/alumnos.js`
- `backend/src/routes/asistencia.js`
- `web/src/pages/directora/AlumnoPerfil.jsx`
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/maestra/FiltroSalida.jsx`
- `web/src/pages/padre/Bitacora.jsx`

---

## ✅ SESIÓN 72 — Mejoras PDF Calendario (diseño infantil + lista detallada)

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Nueva paleta de colores vibrante e infantil**
- Púrpura más saturado: `rgb(0.408, 0.216, 0.780)` (antes: `0.502, 0.353, 0.816`)
- Púrpura oscuro: `rgb(0.271, 0.133, 0.545)` para encabezado
- Acentos infantiles: coral, mint, yellow, sky
- Gris border con tinte púrpura: `rgb(0.859, 0.839, 0.902)`

**2. Encabezado mejorado (Página 1)**
- Fondo `purpleDark` en lugar de púrpura plano
- Banda coral de 4 pt decorativa al fondo del encabezado
- Círculos decorativos en esquinas (gris claro, 10-14 pt)
- "Happy School" subido a `size: 20` (era 18)
- Título mes subido a `size: 24` (era 22)
- Contador eventos: color yellow en lugar de purpleLight

**3. Geometría de grilla optimizada**
- `headerH`: 22 → 26 pt (más respiración en cabecera de días)
- `rowH`: 68 → 76 pt (más espacio visual por celda)
- Cabecera días con colores alternados: Dom/Sab más intenso, semana purpleLight
- Línea separadora de 1.5 pt en púrpura al fondo de cabecera

**4. Visuales mejorados en celdas y chips**
- Celdas fin de semana: fondo con tinte púrpura sutil (`rgb(0.980, 0.976, 0.988)`)
- Celda "hoy": borde 1.5 pt en púrpura (era 0.5 pt)
- Número día: `size` 8 → 9, círculo radio 9 → 11
- Chips eventos: altura 12 → 13 pt, `borderRadius` 2 → 3
- **Barra lateral de color 3 pt a la izquierda de cada chip** (NUEVO)
- Fuente chip: 6.5 → 7.5 pt
- Separación entre chips: 14 → 16 pt
- Indicador +N: fondo `purpleLight` pequeño, color `purple`

**5. Leyenda mejorada**
- Posición y=10 → y=14
- Cuadrado color: 8x8 → 10x10 pt
- Línea separadora decorativa con puntos antes de leyenda (loop de círculos)

**6. Segunda página: Lista detallada de eventos (NUEVA)**
- A4 vertical `[595, 842]` con encabezado estilo página 1
- Por cada evento: tarjeta con barra lateral del color de categoría
- Contenido tarjeta:
  - Fecha formateada ("Lun 7 Abr") + hora o "Todo el día"
  - Título + grupo (si existe)
  - Descripción (máx 2 líneas, truncada)
  - Ubicación (si existe, en color sky)
  - Chip de categoría con color
- Filas alternas blanco/grayLight para legibilidad
- Paginación automática: crea páginas adicionales si hay >15-20 eventos
- Pie de página con "Happy School | Generado el DD/MM/YYYY" + número página

### Archivo modificado:
- `backend/src/routes/calendario.js` — endpoint `GET /api/calendario/export-pdf?mes=YYYY-MM`

### Validación técnica:
- ✅ Sintaxis JavaScript válida
- ✅ Router y 8 rutas registradas correctamente
- ✅ 7/7 checks de estructura de código pasaron
- ✅ Backend corriendo, endpoint accesible en `/api/calendario/export-pdf`

---

## ✅ SESIÓN 71 — Integración Calendario Mejorada (3 subtareas)

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Botón "Añadir a Google Calendar" — web padre + mobile**
- `web/src/utils/googleCalendar.js` + `mobile/src/utils/googleCalendar.js` — función `buildGoogleCalendarUrl(evento)`
- URL directa sin OAuth: abre Google Calendar pre-llenado en nueva pestaña/browser
- Maneja todo el día (`YYYYMMDD`) y con hora (`YYYYMMDDTHHmmssZ`)
- Botón en: modal Calendario web, modal Dashboard web, widget próximos web
- Botón en: modal calendario mobile, modal Dashboard mobile, widget próximos mobile

**2. Eventos Enriquecidos — ubicación + recordatorio**
- Migración `027_eventos_enriquecidos.sql`: columnas `ubicacion TEXT` y `recordatorio_horas INT`
- Backend `calendario.js`: POST y PUT actualizados con nuevos campos
- Formulario directora: input ubicación + select recordatorio (1h/2h/24h/48h/72h)
- Vista padre web: muestra 📍 ubicación y 🔔 recordatorio en modales
- Vista padre mobile: 📍 tappable abre Google Maps, 🔔 muestra tiempo
- `buildGoogleCalendarUrl`: incluye `location` si hay ubicación

**3. PDF Calendario Mensual**
- Ruta `GET /calendario/export-pdf?mes=YYYY-MM` con `pdf-lib` (A4 landscape)
- Grilla mensual 7 columnas, chips de color por categoría, hoy resaltado en morado
- Leyenda de categorías al pie de página
- Botón "PDF" en Calendario padre + Calendario directora (descarga blob)
- ⚠️ Pendiente Sesión 72+: lista detallada de eventos bajo la grilla + diseño infantil completo

### Nota técnica:
- `pdf-lib` StandardFonts (Helvetica) = WinAnsi únicamente. Emojis eliminados con `.replace(/[^\x00-\xFF]/g, '')`. Tildes funcionan (Latin-1).
- Para emojis en PDF futuro: embeber fuente TTF Unicode (ej: Noto Emoji)

### Commits:
- `7e06676` — Google Calendar botón web + mobile
- `c6e781e` — PENDIENTES Google Calendar
- `1db319f` — Eventos Enriquecidos
- (cierre sesión) — PDF + PENDIENTES + ARCHIVE_LOG

---

## ✅ SESIÓN 70 — Agrupación por semana ISO + Navegación por tabs + Modal entregas

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Página Tareas (maestra) — Restructuración radical con tabs + navegación por semana**
- Archivo: `web/src/pages/maestra/Tareas.jsx`
- Helpers nuevos:
  - `getISOWeek(dateStr)` — calcula semana ISO (1-53) con corrección año ISO
  - `getSemanaKey(dateStr)` — retorna clave `YYYY-WNN` para ordenamiento lexicográfico
  - `getLunesToDomingo(dateStr)` — formatea rango semana en español ("28 abr – 4 may")
  - `agruparPorSemana(tareas, orden)` — agrupa por semana ISO, ordena ASC o DESC
- **3 tabs principales:**
  - 📬 **Próximas** — tareas no vencidas, navegación por semana (semana actual primero)
  - 🗂️ **Vencidas** — tareas vencidas, navegación por semana (más reciente primero)
  - 📤 **Borradores** — tareas sin publicar (lista simple, sin paginación)
- Componente `NavegadorSemana` — reutilizable para tabs "Próximas" y "Vencidas"
  - Botones ‹ › para navegación con estado disabled en límites
  - Header: "Semana del 28 abr – 4 may · 2 tareas · semana 1 de 3"
  - Previene el problema de listas enormes (50+ tareas por ciclo escolar)

**2. Modal "¿Quién entregó?" — desglose por alumno**
- Componente `ModalEntregas` nuevo
- Query a `GET /tareas/:id/alumnos` (endpoint backend ya existía)
- Dos secciones:
  - ✅ **Entregaron** — lista verde de nombres
  - ❌ **Faltan** — lista roja de nombres
- Badge `📊 X/Y entregaron` ahora es botón clickeable en TareaCard
- Se abre modal al hacer clic, muestra detalle completo de entregas

### Archivos modificados:
- `web/src/pages/maestra/Tareas.jsx` — único archivo frontend

### Backend:
- Sin cambios — endpoints existentes:
  - `GET /tareas/:id/entregas` (conteos)
  - `GET /tareas/:id/alumnos` (lista con nombres y completadas)

---

## ✅ SESIÓN 68 — Tareas Grupales: "¿Entregó tarea?" + Indicador pendientes + Lista completa

**Fecha:** 2026-04-24 | **Estado:** Completado ✅

### Cambios completados:

**1. Label "¿Entregó tarea?" en Bitácora maestra (web/src/pages/maestra/Bitacora.jsx)**
- Cambiar label de "¿Trajo la tarea?" → "¿Entregó tarea?" (línea 886)
- Refleja mejor la intención: registrar si el niño entregó la tarea, no solo si la traía

**2. Endpoint nuevo: GET /api/tareas/pendientes-alumno (backend/src/routes/tareas.js)**
- Retorna conteo de tareas publicadas no entregadas del alumno
- Verifica ownership: alumno pertenece al padre en sesión
- Query usa LEFT JOIN a `tarea_alumno` para captar tareas nunca registradas

**3. Endpoint nuevo: GET /api/tareas/lista-pendientes (backend/src/routes/tareas.js)**
- Retorna **lista completa** de tareas pendientes (no solo la más reciente)
- Ordenadas por fecha_limite ASC (más pronto primero)
- Incluye: id, titulo, descripcion, fecha_limite, foto_url, completada, fecha_completada

**4. Dashboard papá — Cambio radical: TareaRecienteCard → Lista de todas las pendientes**
- Antes: mostraba solo la tarea más reciente + badge de conteo
- Ahora: lista numerada de TODAS las tareas pendientes ordenadas por urgencia
- Indicadores de urgencia por color:
  - 🔴 Rojo: Vencida (días pasados)
  - 🔥 Naranja: Hoy
  - ⚠️ Amarillo: Mañana
  - 📘 Azul: Más de 1 día
- Muestra descripción COMPLETA (sin truncar)
- Fecha formateada: "Lun 27 de Abr" con L mayúscula

**5. Tareas en fechas pasadas — endpoint hoy-pendientes acepta parámetro fecha**
- Cambio: endpoint `/tareas/hoy-pendientes` ahora acepta `fecha` como query param
- Antes: siempre filtraba por CURRENT_DATE
- Ahora: permite buscar tareas de cualquier fecha (para bitácora histórica)
- Agrega parámetro `alumno_id` al SELECT para retornar estado `completada` del alumno

**6. Bitácora maestra — cargar estado "¿Entregó tarea?" desde BD**
- Agregar `grupo_id` al objeto alumno cuando se selecciona en lista
- Crear useEffect que carga `trajoTarea` desde `tareasHoy[0].completada`
- Permite ver en bitácora de solo lectura si ya está marcada como entregada

**7. Bitácora papá — mostrar tareas en pestaña "Tareas"**
- Endpoint bitácora ahora retorna `tareas[]` (query a tabla tareas + tarea_alumno)
- Filter corregido: comparar solo fecha YYYY-MM-DD (sin hora UTC)
- Muestra: título, descripción, estado (✅ Entregada / ⏳ Pendiente)

**8. Seed de datos de prueba: seed_tarea_ayer_emilio.js**
- Inserta tarea "Dibujo de la familia" con fecha_limite = ayer
- Permite validar bitácora de fechas pasadas
- Ejecutado: tarea creada con ID e40a122a-19a0-4366-85d9-005e00ec6d9b

### Archivos modificados:
- `web/src/pages/maestra/Bitacora.jsx` — label + grupo_id + useEffect tarea + query fecha
- `backend/src/routes/tareas.js` — 3 nuevos endpoints/cambios: pendientes-alumno, lista-pendientes, hoy-pendientes
- `web/src/pages/padre/Dashboard.jsx` — TareaRecienteCard → lista completa, urgencia, descripción completa
- `web/src/pages/padre/Bitacora.jsx` — filter tareas por fecha YYYY-MM-DD
- `backend/src/routes/bitacora.js` — agregar tareas[] a endpoint GET /:alumnoId
- `backend/src/database/seed_tarea_ayer_emilio.js` — nuevo archivo

### Validación completada ✅
- Dashboard papá: "📚 3 tareas por entregar" → "📚 2 tareas por entregar" (1 marcada como entregada)
- Bitácora miss: "¿Entregó tarea?" aparece en día de ayer con "Dibujo de la familia"
- Bitácora papá: tab Tareas muestra "Dibujo de la familia" ✅ Entregada en día ayer
- Lista Dashboard: todas las tareas pendientes ordenadas por fecha, con urgencia por color

---

## ✅ SESIÓN 67 — Verificación Notificaciones Tareas + UI/UX Dashboard Papá

**Fecha:** 2026-04-24 | **Estado:** Completado

### Cambios completados:

**1. UX Configuración Directora (web/src/pages/directora/Configuracion.jsx)**
- Separar en tabs: "Horarios y reglas" vs "Notificaciones"
- Cada tab con su propio botón Guardar independiente
- Reduce confusión de usuario (antes: 2 botones "Guardar" + "Guardar notif")

**2. Verificación Notificaciones de Tarea (backend + BD)**
- Confirmado: endpoint `PUT /tareas/:id/publicar` inserta notificaciones
- Requería activar tipo `'tarea_nueva'` en `configuracion_general.notificaciones_modal_tipos`
- Solución: panel Configuración ya tenía checkbox, solo necesitaba activarlo
- Validado: notificaciones llegan a papás en tiempo real (campanita)

**3. Fix Dashboard Papá — Hooks Error (web/src/pages/padre/Dashboard.jsx)**
- Bug: `useQuery` dentro de `.reduce()` violaba reglas de Hooks
- Solución: extraer a componente `TareaRecienteCard` (mismo patrón que `PagoResumenCard`)
- Resultado: sin errores de Hooks, Dashboard papá carga limpiamente

**4. Mejora Card Tarea Reciente (web/src/pages/padre/Dashboard.jsx)**
- ✅ Título de sección: "Tareas encargadas" → "Tareas pendientes"
- ✅ Mostrar fecha de creación (Creada: 24/04/2026) — top right, discreta
- ✅ Título más grande (text-lg font-black) — mejor jerarquía visual
- ✅ Descripción completa (sin truncar a 80 chars)
- ✅ Botón "📎 Ver imagen de referencia" + modal si existe foto
- ✅ Badge naranja "Fecha de entrega" prominente con formato corto (lun, 27 abr)
- ✅ Badge estado entrega (Entregada/Pendiente) al final

**5. Fix Fechas (backend + frontend)**
- Backend: agregar `t.created_at` a SELECT endpoint `/tareas/reciente`
- Frontend: `created_at` y `fecha_limite` vienen en ISO 8601 con timestamp
- Solución: `.substring(0, 10)` + manual date parsing para evitar off-by-one por zona horaria
- Formato homologado: mismo que "Próximos eventos" (ej: "lun, 27 abr")

**Archivos modificados:**
- `backend/src/routes/tareas.js` — agregar created_at a query
- `web/src/pages/directora/Configuracion.jsx` — tabs + botones separados
- `web/src/pages/padre/Dashboard.jsx` — 3 cambios: componente TareaRecienteCard, mejoras card, fix fechas

**Validación en browser:**
- ✅ Directora: tabs funcionan, guardar horarios y notificaciones independiente
- ✅ Miss: puede crear/publicar/borrar tareas
- ✅ Papá: ve Dashboard sin errores, tarea con fecha creada + entrega formateadas, modal foto funciona
- ✅ Notificaciones: llegan a papá en campanita al publicar tarea (si `tarea_nueva` activado)

### Pendientes para próxima sesión:
- Dashboard directora: Indicador "[X] Tareas por recibir"
- Bitácora: Campo "Trajo Tarea: SÍ/NO"
- Papá bitácora: Vista de tareas (solo lectura)
- Directora dashboard: Alerta alumnos 3+ tareas sin entregar

---

## ✅ SESIÓN 66 — Revisión Completa de Proceso + Finalizar Módulo Tareas

**Fecha:** 2026-04-24 | **Estado:** Completado

### 1. Revisión y Depuración de Memory (Protocolo + Skills)

**Archivos eliminados (duplicados y obsoletos):**
- `feedback_cierre_sesion.md` (duplicado)
- `feedback_backend_restart.md`, `feedback_servidor_restart.md`, `feedback_cleanup_procesos.md`, `feedback_dev_server.md` (consolidados)
- `bugs_sesion_27.md`, `bugs_sesion_33plus.md`, `bugs_sesion_36.md` (históricos)
- `sesion_38_pendientes_reorganizacion.md`, `sesion_58_dashboard_entrada.md`, `sesion_60_notificaciones_errores.md`, `sesion_61_notificaciones_bugs.md`, `sesion_62_triggers_refactor.md`, `sesion_63_modal_notificaciones.md`, `sesion_64_historial_egresados.md` (históricos)

**Archivos creados:**
- `feedback_servidores.md` — Protocolo unificado Windows (PowerShell para matar, Bash para iniciar, curl para validar)

**Archivos actualizados:**
- `MEMORY.md` — Índice reorganizado: contexto + protocolos + reglas + proyectos activos (de 33 a 8 referencias activas)
- `feedback_schema_errores.md` — Agregada regla sobre relación padres: `alumnos → alumno_padre → padres → usuarios`

### 2. Finalizar Módulo Tareas — 3 Bugs Backend Corregidos

**Archivo:** `backend/src/routes/tareas.js`

**Bug 1: Query de padres incorrecto (usuario_padre1_id inexistente)**
- Afectaba: DELETE /tareas/:id (línea 352-357) + PUT /tareas/:id/publicar (línea 425-431)
- Columnas inventadas: `usuario_padre1_id`, `usuario_padre2_id`, `usuario_encargado_id` (no existen en schema)
- Solución: JOIN correcto `alumnos → alumno_padre → padres → usuarios` (igual a bitacora.js y asistencia.js)

**Bug 2: INSERT notificaciones con columnas inexistentes**
- Afectaba: DELETE (línea 362-365) + PUT publicar (línea 445-447)
- Columnas inventadas: `descripcion`, `urgente`, `referencia_id` (no existen en schema)
- Schema real: `usuario_id, tipo, titulo, cuerpo, datos_extra, leida, enviada_push, created_at`
- Solución: INSERT correcto usando `titulo`, `cuerpo`, `datos_extra` (JSONB con metadatos)

**Bug 3: DELETE notificaciones con referencia_id**
- Línea 376: columna `referencia_id` no existe
- Solución: Usar `datos_extra->>'tarea_id'` para encontrar notificaciones de una tarea específica

**Endpoint DELETE /tareas/:id — Funcionalidad:**
- Permite eliminar tareas publicadas (sin restricción anterior)
- Si estaba publicada: notifica a cada papá + envía WhatsApp
- Limpia `tarea_alumno` y `notificaciones` relacionadas antes de borrar
- Validado en browser: crear → publicar → borrar ✅

### 3. Aprendizajes y Protocolo

**Lecciones clave de esta sesión:**
1. NUNCA asumir columnas por intuición — verificar schema ANTES de escribir queries (leer `001_schema_inicial.sql`)
2. Usar el patrón existente en code — cuando no sabes un JOIN, grep un módulo similar (bitacora.js, asistencia.js)
3. Validar con curl DESPUÉS de cada cambio backend (no solo log files)
4. Levantar ambos servidores ANTES de pedir validación (backend + web, verificados con curl)
5. El error es siempre error real — si dice "columna no existe", esa columna no existe (no es typo)

**Protocolo de inicio de sesión establecido:**
1. Leer MEMORY.md + PENDIENTES.md + archivos memory del sprint
2. PowerShell: matar procesos viejos
3. Bash: levantar backend (sleep 4, curl health)
4. Bash: levantar web (sleep 8, curl http://localhost:5173)
5. Solo entonces: leer código/planificar

**Protocolo de cierre de sesión establecido:**
1. Checklist 6 puntos (archivo correcto, código correcto, backend OK, campos API, Vite actualizado, puerto 5173)
2. PENDIENTES.md: marcar completadas + actualizar estado
3. ARCHIVE_LOG.md: crear entrada con fecha + archivos + bugs + aprendizajes
4. Memory: guardar nuevas reglas de feedback, eliminar duplicados, consolidar
5. Git commit OBLIGATORIO (no esperar que Valeria lo pida)

**Archivos modificados (Sesión 66):**
- `backend/src/routes/tareas.js` — 3 queries corregidas, DELETE + PUT publicar validados
- `PENDIENTES.md` — removida sesión 66, actualizado estado tareas
- `MEMORY.md` — reorganizado índice, 15 duplicados eliminados
- `feedback_schema_errores.md` — agregar regla alumno_padre JOIN
- `feedback_servidores.md` — nuevo archivo protocolo unificado

---

## ✅ SESIÓN 63 — Notificaciones Modal Real-time + Configuración Directora + Mobile Campanita

**Fecha:** 2026-04-24 | **Estado:** Completado (sin fotos por ahora)

### 1. Backend: Configuración de Tipos de Notificación

**Migración:** `backend/migrations/025_notificaciones_modal_config.sql`
- Inserta clave `'notificaciones_modal_tipos'` en tabla `configuracion_general`
- Valor por defecto: `["incidente","aviso_extraordinario"]` (JSON array)

**API Endpoints:** `backend/src/routes/config.js`
- `GET /config/notificaciones` — retorna `{ notificaciones_modal_tipos: [...] }`
- `PUT /config/notificaciones` — solo directora, actualiza tipos que disparan modal
- Ambos autenticados (admitir cualquier rol en GET, solo directora en PUT)

### 2. Frontend Directora: Panel de Configuración de Notificaciones

**Archivo:** `web/src/pages/directora/Configuracion.jsx`
- Nueva sección "🔔 Notificaciones a padres"
- 4 tipos disponibles (hardcodeados): incidente, aviso_extraordinario, bitacora_lista, medicamento
- Checkboxes para activar/desactivar cada tipo
- Botón "Guardar notif" que hace PUT a `/config/notificaciones`
- Query separada que cachea 5 minutos la configuración

**UI:** Sección con fondo rojo (#FFF5F5), checkboxes estilizados, icono por tipo

### 3. Frontend Papá: Modal Urgente + Polling Mejorado

**Archivo:** `web/src/components/NotificacionModal.jsx` (nuevo)
- Componente presentacional puro
- Modal overlay fijo con `position: fixed inset-0 z-50`
- Borde superior de color según tipo (rojo incidente, naranja aviso)
- Icono grande, badge tipo, título, cuerpo, botón "Entendido"
- No cierra con click en overlay (fuerza lectura)

**Archivo:** `web/src/components/NotificationBell.jsx` (modificado)
- Polling aumentado de 30s → 15s (refetchInterval)
- Query paralela `notif-urgentes` que filtra por config de tipos y leída=false
- Sistema de cola: `colaModal` (array) y `modalActual` (objeto)
- `sessionStorage` con clave `notif-modal-${id}` para evitar repetir modales en misma sesión
- `useRef yaMostradas` para rastrear en memoria durante la sesión
- `useEffect` que encola nuevas urgentes detectadas
- `useEffect` que muestra de la cola cuando no hay modal activo
- Handler `handleEntendido` que marca leída y cierra el modal

**Flujo:** Padre ve modal automático cuando llega notificación de tipo configurado como urgente. Al hacer "Entendido", se marca como leída y se muestra la siguiente de la cola.

### 4. Mobile: Campanita de Notificaciones (React Native)

**Archivo:** `mobile/src/components/NotificationBell.jsx` (nuevo)
- Componente React Native autónomo
- `TouchableOpacity` con emoji 🔔
- Badge numérico rojo encima (muestra 9+ si >9 notificaciones)
- `Modal` con `animationType="slide"` (bottom-sheet)
- Lista de notificaciones con scroll
- Íconos por tipo (🚨/📢/💊/📝/🔔)
- No-leídas con fondo #FFF5F5 y punto rojo
- Tap en notificación marca como leída (mutation)
- Queries: `/notificaciones/no-leidas` (polling 30s) + `/notificaciones` (enabled cuando modal abierto)

**Integración:** `mobile/app/(padre)/index.jsx` — MontoedComponent en header del dashboard, al lado del emoji familia

### 5. Validación

- Documento de validación manual: [VALIDACION_SESION_63.md](VALIDACION_SESION_63.md)
- Pasos paso-a-paso para Directora (config), Papá (modal), Mobile (campanita)
- Checklist final con 10+ puntos de validación

### 6. Fix: Incidente sin FormData (mitad de sesión)

**Problema:** FormData multipart con multer causaba errores de boundary. Alumno_id llegaba undefined.

**Solución:** 
- Backend: `POST /bitacora/incidente` sin multer, JSON directo
- Frontend: cambiar de FormData a JSON
- Quitar UI de fotos (se agregarán después con approach correcto)

**Resultado:** Incidente funciona, registra en BD, dispara notificación, modal urgente aparece en portal papá ✅

---

## ✅ SESIÓN 62 — Notificaciones Triggers Automáticos + Refactor Dashboard Papá

**Fecha:** 2026-04-24

### Backend: Bug Fix `notificacion_enviada`
**Archivo:** `backend/src/routes/bitacora.js` (líneas 357-360)

Al registrar medicamento suministrado (`POST /bitacora/medicamento`):
- Ya insertaba notificación en `notificaciones` (sesión anterior)
- **Ahora también actualiza:** `medicamentos.notificacion_enviada = true`
- Ubicado dentro del `if (usuario_id)` para asegurar solo se marca si la notificación fue exitosa

**Razón:** Campo existía en schema desde sesiones anteriores pero nunca se marcaba. Ahora permite rastrear si notificación fue enviada.

### Frontend: Dashboard Papá Refactor UI

**1. Saludo sin coma extra**
- `web/src/pages/padre/Dashboard.jsx` línea 228
- Antes: `"¡Hola, Mamá, Alejandra!"` (coma antes del nombre)
- Ahora: `"¡Hola Mamá Alejandra!"`

**2. Sección "💳 Pagos" reemplaza grid de accesos rápidos**
- Removidas cards de Bitácora y Calendario del dashboard (acceso directo en nav aún disponible)
- Nueva sección con componente `PagoResumenCard` (líneas 231-258)
- Consulta `GET /pagos/estado/:hijoId` por cada hijo (React Query con staleTime 5min)
- Muestra estado en tiempo real:
  - Verde: `"✅ Al día"`
  - Amarillo/Rojo: `"⚠️ Adeudo: $X,XXX MXN"`
  - Suspendido: `"🚫 Suspendido: $X,XXX MXN"`

**Beneficio UX:** Padre ve de un vistazo si hay adeudos sin navegar a /padre/pagos.

---

## ✅ SESIÓN 61 — Bugs Notificaciones Multi-Sesión: Cache, Filtering, Encoding

**Fecha:** 2026-04-24

### Problema Principal
Después de sesión 60, usuarios reportaban que notificaciones aparecían:
- Con estado incorrecto (leída cuando no debería)
- Conteo de confirmaciones incorrecta en portal directora
- Caracteres acentuados corruptos (niños → ni�os)

### Bugs Identificados y Corregidos

**Bug 1: QueryClient cache no se limpiaba en logout**
- **Causa:** React Query singleton vivía en memoria, siguiente usuario heredaba caché
- **Solución:** 
  - Creó `web/src/services/queryClient.js` singleton exportable
  - `authStore.js` llama `queryClient.clear()` en logout
  - `main.jsx` importa queryClient desde services
- **Impacto:** Multi-sesión ahora funciona — Papa A logout → Papa B login ve SUS datos

**Bug 2: Endpoint estado aviso filtraba por título (crítico)**
- **Causa:** `WHERE n.titulo = $1` en lugar de aviso_id → mezcla conteos si dos avisos tienen mismo título
- **Solución:** 
  - Cambió a `WHERE n.datos_extra->>'aviso_id' = $1`
  - Eliminou query intermedia de buscar por título
- **Impacto:** Directora ve conteo exacto de confirmaciones de lectura

**Bug 3: staleTime: 30s prevenía re-fetch inmediato**
- **Causa:** React Query mantenía caché por 30s, dentro de esa ventana no re-fetcheaba
- **Solución:**
  - Eliminó `staleTime: 30_000` de query notificaciones
  - Reducido `refetchInterval` en badge de 60s a 30s
- **Impacto:** Notificaciones siempre frescas al abrir panel

**Bug 4: UTF-8 encoding incorrecto en web**
- **Causa:** axios no declaraba charset UTF-8, navegador enviaba caracteres acentuados corruptos
- **Solución:**
  - `api.js`: agregado `charset=utf-8` a Content-Type header
  - `api.js`: agregado `transformRequest` explícito para JSON
- **Impacto:** "Los niños" se guarda y muestra correctamente, no "ni�os"

**Bonus: Papa Sofia no era tutor principal**
- **Causa:** `papa.sofia.maternal@happyschool.edu.mx` registrado pero `es_tutor_principal = false` para Sofia Reyes Mendoza
- **Solución:** Actualizar BD — SET `es_tutor_principal = true`
- **Impacto:** Papa Sofia ahora recibe notificaciones de su hija

### Archivos Modificados
- `web/src/services/queryClient.js` (nuevo)
- `web/src/main.jsx`
- `web/src/store/authStore.js`
- `web/src/components/NotificationBell.jsx`
- `web/src/services/api.js`
- `backend/src/routes/notificaciones.js`

### Validación
✅ Multi-sesión: Papa A logout → Papa B ve SUS notificaciones, no las de A
✅ Persistencia: Papa A vuelve → su notificación sigue sin leer (no hereda estado de Papa B)
✅ Conteo: Directora ve count correcto de confirmaciones
✅ Encoding: Acentos y caracteres especiales visibles correctamente

---

## ✅ SESIÓN 60 — Notificaciones Globales: Backend Endpoints + Frontend UI

**Fecha:** 2026-04-24

### Problema Principal
Sesión 59 había planeado notificaciones pero se descubrió que faltaba auditoría legal: timestamps de envío Y de lectura para evidencia si padre dice "no me llegó" o "yo sí lo leí".

### Funcionalidades Completadas

**Backend — Endpoints Notificaciones (`backend/src/routes/notificaciones.js`)**
- `GET /` — Últimas 20 notificaciones del usuario autenticado
- `GET /no-leidas` — Contador de notificaciones no leídas
- `PUT /leer-todas` — Marcar todas como leídas (para botón "Marcar todo como leído")
- `PUT /:id/leer` — Marcar una notificación como leída (para clic individual)
- `POST /aviso-extraordinario` — Directora envía aviso urgente a padres (todos o grupos seleccionados)
  - Inserta en tabla `avisos` para persistencia histórica
  - Crea notificación para cada padre tutor principal
  - Retorna `{ ok, enviadas, aviso_id }`
- `GET /aviso-extraordinario/estado/:avisoId` — Estado de lectura de un aviso (tab "Sin leer" vs "Vieron")
  - Query por título para encontrar notificaciones originales
  - Retorna count total, leídas, pendientes + detalle con padre_nombre, alumno_nombre, grupo_nombre, estado lectura
- `GET /avisos-extraordinarios` — Historial de todos los avisos enviados (visible para Directora)

**Frontend — Directora: AvisoExtraordinario (`web/src/pages/directora/AvisoExtraordinario.jsx`)**
- Componente `EnviarAvisoForm`: Input título + textarea cuerpo + multi-select grupos + botón enviar
- Componente `EstadoAviso`: Tabs "Sin leer" (naranja) y "Vieron" (verde)
- Componente `GrupoCard`: Colapsable por grupo, muestra padres y alumnos en cada grupo
- Estado local: `historialLocal` (recién enviados) + query `avisos-extraordinarios` (histórico BD)
- Manejo `expandidosSet` para tracking de qué grupos están desplegados
- Toast notifications de éxito/error

**Frontend — Papá: Notificaciones en Dashboard**
- Campanita en navbar con contador de no leídas
- Click abre modal con listado de notificaciones
- Click en notificación marca como leída (PUT /:id/leer)
- Botón "Marcar todo como leído"

### Error Crítico Detectado y Resuelto

**Raíz:** Migración 023 (`backend/migrations/023_avisos_extraordinarios.sql`) creada pero NUNCA aplicada a BD. Columnas `leida_at`, `tipo`, `grupo_ids` no existían en el schema real.

**Síntomas:** 500 errors en endpoints:
- `PUT /leer` → "column leida_at does not exist"
- `GET /avisos-extraordinarios` → "column grupo_ids does not exist"
- `POST /aviso-extraordinario` → "column tipo does not exist"

**Impacto:** Usuario validó 5+ veces sin solución porque el backend compilaba pero fallaba en runtime.

**Solución:**
- Removidas referencias a columnas no existentes (`leida_at`, `tipo`, `grupo_ids`)
- Backend usa SOLO columnas que ya existen: `leida`, `created_at`, `titulo`, `contenido`, `creado_por`
- Endpoints funcionan con schema actual sin migración

**Lección Guardada en Memoria:** Verificar que columnas existen ANTES de escribir queries. No asumir que migración creada = aplicada.

### Archivos Modificados
1. `backend/migrations/023_avisos_extraordinarios.sql` (creado, no aplicado)
2. `backend/src/routes/notificaciones.js` (endpoints para avisos)
3. `web/src/pages/directora/AvisoExtraordinario.jsx` (nueva, UI completa)
4. `web/src/layouts/DirectoraLayout.jsx` (agregado nav item)
5. `web/src/App.jsx` (agregada ruta)

### Verificación en Browser
- ✅ Campanita en navbar papá muestra contador
- ✅ Click abre modal con notificaciones
- ✅ Click notificación marca como leída (PUT funciona)
- ✅ Directora envía aviso a grupos seleccionados
- ✅ Aviso persiste en histórico
- ✅ Estado actualiza en tiempo real (Sin leer → Vieron)
- ✅ Grupos se expanden/contraen correctamente

### Tareas Pendientes para Sesión 61
- Implementar triggers automáticos en bitácora, medicamento, incidente (INSERT notificaciones)
- Agregar `leida_at` columna a BD cuando sea posible (aplicar migración 023)
- Implementar notificaciones modales en tiempo real (WebSocket o polling)
- Paridad mobile: revisar si mobile necesita notificaciones

---

## ✅ SESIÓN 59 — Bug `mis-hijos`: respuesta objeto vs array en web y mobile

**Fecha:** 2026-04-23

### Problema
El endpoint `GET /alumnos/mis-hijos` devuelve `{ hijos: [...], horaLimiteEntrada }` (objeto), pero 5 componentes asumían que `r.data` era directamente un array, causando `hijos.find is not a function` y `hijos.map is not a function`.

### Archivos Corregidos
- `web/src/pages/padre/Bitacora.jsx` — `hijosData.hijos || []` + renombrada variable para evitar colisión con `data` de bitácora
- `web/src/pages/padre/Pagos.jsx` — `hijosData.hijos || []`
- `web/src/pages/padre/ComidaSemanal.jsx` — `hijosData.hijos || []`
- `mobile/app/(padre)/index.jsx` — `hijosData?.hijos || []`
- `mobile/app/(padre)/pagos.jsx` — `hijosData.hijos || []`

### Reglas Nuevas Guardadas
- Grep en web **y** mobile antes de corregir cualquier bug; corregir ambos en el mismo turno.

---

## ✅ SESIÓN 58 — Dashboard Papá Enriquecido: Entrada Autorizada/Rechazada + Retardos + Advertencias

**Fecha:** 2026-04-23 | **Commits:** 2 (implementación + ajuste formato hora)

### Funcionalidades Completadas

**Dashboard Papá — Visibilidad de entrada y retardos**
- Backend (`alumnos.js` línea 36-45):
  - Endpoint `GET /mis-hijos` ahora retorna `filtro_entrada.numero_retardo_mes` (total retardos acumulados en el mes)
  - Query SQL con COUNT de retardos siempre activo (aunque no haya entrada hoy)
  - Respuesta estructurada: `{ hijos: [...], horaLimiteEntrada }`
- Frontend (`Dashboard.jsx` - HijoCard):
  - 3 estados visuales según retardos acumulados:
    - **0 retardos + entrada autorizada:** Fondo verde, hora de entrada mostrada sin símbolo "@"
    - **1-2 retardos + entrada autorizada:** Fondo amarillo, badge "⚠️ Retardo", alerta "próximo retardo bloquea entrada"
    - **≥3 retardos:** Fondo rojo, alerta "🚫 Límite de retardos alcanzado", indica que mañana será rechazado si llega tarde
  - Entrada rechazada:
    - Motivo enriquecido: 🌡️ para fiebre, 🤒 para síntomas
    - Checklist con ✅/❌: uñas, uniforme, bata, agua, termo, ojos
  - Alerta unificada de retardos (sin repeticiones)

### Archivos Modificados (1 archivo)
- `backend/src/routes/alumnos.js` — campos `numero_retardo_mes` en SELECT y objeto `filtro_entrada`
- `web/src/pages/padre/Dashboard.jsx` — lógica retardos, badges, colores, checklist, hora sin "@"

### Verificación en Browser
- ✅ Dashboard padre: retardos visibles, badges funcionales, hora sin símbolo
- ✅ Colores Tailwind aplicados correctamente (verde/amarillo/rojo)
- ✅ Checklist desplegable con ✅/❌
- ✅ Alerta unificada (sin repeticiones de "Retardo #N")

---

## ✅ SESIÓN 57 — 3 Bugs Entrada: Síntomas vs Retardos + Asistencia Miss + Protocolo Salud

**Fecha:** 2026-04-23 | **Commits:** 2 (implementación + correcciones)

### Bugs Corregidos

**Bug 1 — Alumno rechazado por fiebre mostraba "Retardo #N" (COMPLETAMENTE CORREGIDO)**
- Causa: `es_retardo` se calculaba solo por hora, independiente de síntomas. Frontend mostraba badge sin verificar `puede_entrar`. Endpoint devolvía `numero_retardo_mes` aunque alumno fuera rechazado.
- Backend fix (`asistencia.js`):
  - Reordenar evaluación: síntomas/fiebre primero (máxima prioridad), retardos solo si pasó filtro de salud (línea 27-60)
  - Solo marcar `es_retardo = true` si `puedeEntrar === true`
  - Endpoint `/asistencia/grupo/:id`: `CASE WHEN puede_entrar=false THEN 0 ELSE numero_retardo_mes` (línea 308)
- Frontend fix:
  - `FiltroEntrada.jsx` línea 248: Agregar `&& alumno.estado_asistencia !== 'no_entrada'`
  - `Asistencia.jsx` línea 238: Agregar misma condición
  - `Dashboard.jsx Directora`: `ModalRetardosGrupo` filtra `.filter(a => a.estado_asistencia !== 'no_entrada')` + actualiza cálculo de `totalRetardos` y `tieneAlumnosSeveros`
- Resultado: Alumnos rechazados por síntomas NUNCA muestran retardo en ninguna vista

**Bug 2 — Asistencia Miss mostraba alumnos de otros grupos (COMPLETAMENTE CORREGIDO)**
- Causa: 
  - Backend fallback usaba `ORDER BY ag.created_at DESC LIMIT 1` — retornaba grupo aleatorio
  - Frontend cacheaba query sin invalidar al cambiar usuario
- Backend fix (`grupos.js` línea 126-142):
  - Filtrar por `dias_semana` del día actual: `($2 = ANY(ag.dias_semana) OR ag.dias_semana IS NULL)`
  - Cambiar a `ORDER BY g.nombre LIMIT 1` — determinístico
- Frontend fix (`Dashboard.jsx` Miss):
  - Importar `useQueryClient` de React Query
  - Agregar `useEffect` que invalida caché cuando cambia `usuario.id`: `queryClient.invalidateQueries({ queryKey: ['mi-grupo'] })`
- Resultado: Maestra especial ve su grupo correcto inmediatamente, sin necesidad de F5

**Bug 3 — Protocolo síntomas: visualización en rojo (feature nueva)**
- Backend (`reportes.js`):
  - Query nueva `rechazados_sintomas`: Filtra `puede_entrar = false AND (sin_fiebre = false OR temperatura > 37.5 OR sin_sintomas = false)`
  - Incluye: `nombre_completo`, `grupo_nombre`, `temperatura`, `motivo_no_entrada`
- Frontend Directora (`Dashboard.jsx`):
  - Card roja "🚨 Rechazados por síntomas hoy" similar a incidentes
  - Muestra temperatura en badge rojo, motivo en texto rojo
- Frontend Miss (`Dashboard.jsx`):
  - Banner rojo derivado de `grupo.alumnos` (sin nueva API call)
  - Auto-refetch cada 30s junto con datos del grupo
- Resultado: Alerta visual inmediata en ambos dashboards → protocolo de salud activado

### Archivos Modificados (7 archivos)
- `backend/src/routes/asistencia.js` (línea 27-60: lógica síntomas; línea 308: CASE WHEN)
- `backend/src/routes/grupos.js` (línea 126-142: filtro dias_semana)
- `backend/src/routes/reportes.js` (Query rechazados_sintomas)
- `web/src/pages/maestra/FiltroEntrada.jsx` (línea 248: condición)
- `web/src/pages/maestra/Asistencia.jsx` (línea 238: condición)
- `web/src/pages/maestra/Dashboard.jsx` (useQueryClient + useEffect invalidate)
- `web/src/pages/directora/Dashboard.jsx` (filter + cálculo totalRetardos)

---

## ✅ SESIÓN 56 — Entrada (Filtro) + Ciclos históricos + Fixes

**Fecha:** 2026-04-23 | **Commits:** 8

### Completado

- **Dashboard Maestra — Card "Sin entrada (retardos)":**
  - Endpoint `GET /grupos/mi-grupo/estadisticas/hoy` cuenta alumnos con `estado = 'no_entrada'` cuyo `motivo_no_entrada ILIKE '%retardo%'`
  - Card nueva en grid de stats (5 columnas) con icono UserX, color naranja, refetch cada 30s
  - Suma correcta: En escuela + Retardos + Ausentes + **Sin entrada (retardos)** + Bitácoras guardadas = Total

- **Dashboard Papá — Filtro de entrada (Checklist sanitario):**
  - Endpoint `GET /alumnos/mis-hijos` extendido con datos completos de `registro_entrada` (uñas, bata, agua, uniforme, termo, ojos, etc.)
  - Card de hijo muestra: 🚪 ✅ Entrada autorizada / 🚪 🚫 Rechazada + motivo
  - Grid visual 3×2 con checklist: `if (item === null || undefined) return null` para distinguir false (⚠️) de null
  - **Fix:** Checklist siempre visible incluso si entrada rechazada, para que papá vea qué le faltó

- **Dashboard Papá Bitácora — Selector de ciclo (Fase 1):**
  - Carga ciclos desde `GET /alumnos/:id/ciclos` (actualizado a incluir ciclo actual del grupo + históricos via UNION)
  - Selector con dropdown mostrando ciclo actual marcado con "(Actual)"
  - UI preparada para Fase 2 (filtro de bitácora por ciclo)

- **Fixes implementados:**
  - `FiltroEntradaBadge`: cambiar `if (!item)` → `if (item === null || undefined)` para mostrar `false` como ⚠️
  - `Bitacora.jsx` — Comida: agregar validación `if (c.cuanto_comio)` para evitar "undefined undefined"
  - Endpoint `/alumnos/:id/ciclos`: UNION de inscripciones históricas + ciclo actual del grupo

### Archivos modificados
- `backend/src/routes/grupos.js` (nuevo endpoint estadísticas)
- `backend/src/routes/alumnos.js` (extender mis-hijos + actualizar ciclos)
- `web/src/pages/padre/Dashboard.jsx` (FiltroEntradaBadge + card entrada)
- `web/src/pages/padre/Bitacora.jsx` (SelectorCiclo + validación comida)
- `PENDIENTES.md` (actualizar estado)

### Datos de prueba validados
- Emilio Vega Sánchez (Prekinder) — Entrada autorizada pero faltó bata + agua → ✅ visible en checklist
- Mamá: `mama.emilio@happyschool.edu.mx` / `happy2024`

---

## ✅ SESIÓN 55 — Bug bitácora + Servicio Comida pagos mejorado

**Fecha:** 2026-04-23

### Completado

- **Bug crítico `Bitacora.jsx` (Maestra):** Bloqueado registro de bitácora para alumnos sin entrada. Validación `tieneEntrada = alumno.hora_entrada && ['presente','retardo'].includes(alumno.estado_asistencia)`. Banner rojo informativo + botón guardar deshabilitado si no hay entrada.

- **`ServicioComida.jsx` (Directora) — Tab Pagos:**
  - Badge de nivel del alumno (`nivel_nombre`) junto al nombre en cada tarjeta
  - Tabs de filtro por nivel (Todos, Kinder 1, Kinder 2, etc.) generados dinámicamente
  - Resumen de totales en pesos (💳 Transferencia / 💵 Efectivo / 💰 Gran total) — se actualiza al filtrar por nivel
  - Orden: stats contadores → resumen en pesos → filtros por nivel → lista alumnos

- **`comidaController.js` (Backend):** Query `obtenerConfirmaciones` ahora incluye `g.nivel AS nivel_nombre` y `g.nivel_codigo` via `LEFT JOIN grupos`. Orden cambiado a `g.nivel_codigo, a.nombre_completo`.

### Archivos modificados
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/directora/ServicioComida.jsx`
- `backend/src/controllers/comidaController.js`

---

## ✅ SESIÓN 54 — Menú estructurado + catálogos migrados + precarga bitácora

**Fecha:** 2026-04-23

### Completado

- **`Pagos.jsx` (Directora):** Eliminados arrays hardcoded `METODOS` y `TIPOS_CONCEPTO`. Migrados a `useCatalogo('metodos-pago')` y `useCatalogo('conceptos-pago')`. Props propagados a `ModalPago`, `ModalConceptos` y `FilaAlumno`.

- **`TurnoPuerta.jsx`:** Eliminado objeto `ROL_LABEL` hardcodeado. Migrado a `useCatalogo('roles-personal')` usando `rolMap[key]?.label`.

- **Menú semanal estructurado (BD + Backend + 3 portales):**
  - BD: nueva columna `dias_menu jsonb` en `menu_comida_semanal`
  - Backend `comidaController.js`: recibe, parsea y guarda `dias_menu`
  - `ServicioComida.jsx` (Directora): `ModalSubirMenu` reemplazado por grilla 5 días × 3 tiempos (desayuno, colación, comida) con selector de niveles expand/collapse. Default colación = Maternal (editable). Niveles cargados dinámicamente del backend. Preview estructurado en pantalla.
  - `Bitacora.jsx` (Maestra): precarga `que_comio` por día y nivel del alumno. Maternal ve 3 tiempos, Kinder ve 2 (sin colación). Indicador 📋 en campos precargados.
  - Menú existente (texto) se puede migrar al nuevo formato desde el modal — precarga `dias_menu` si ya existe.

### Datos de prueba creados
- Alumna: **Sofía Reyes Mendoza** — Grupo Maternal, comida confirmada y pagada semana 20-abr-2026
- Papá: `papa.sofia.maternal@happyschool.edu.mx` / `happy2024`

### Bugs detectados (→ Sesión 55)
- Dashboard miss → bitácora sin entrada: fix anterior no funciona, reaparece formulario de entrada
- Servicio Comida / Pagos: falta nivel del alumno y totalizados por método de pago

---

## ✅ SESIÓN 53 — Bugs post-FASE 3: bitácora directora + personal

**Fecha:** 2026-04-23

### Bugs corregidos

- **Personal.jsx — `/directora/personal` no cargaba:**
  - `ModalPersonal` y `TarjetaPersonal` referenciaban `ROLES` sin recibirla como prop → `ReferenceError`
  - Fix: prop `roles={ROLES}` pasada desde `DirectoraPersonal` a ambos componentes
  - Fix adicional: línea 429 usaba `r.value` en lugar de `r.key` en el filtro de roles

- **AlumnoPerfil.jsx — Bitácora directora sin datos:**
  - `ANIMO_LABEL`, `COMP_LABEL`, `CUANTO_LABEL`, `PANIAL_LABEL` usados pero no definidos (eliminados en FASE 3 de maestra sin actualizar directora)
  - Fix: agregado `useCatalogo` + `toMap()` en `BitacoraDirectora` para los 4 catálogos dinámicos
  - Fix: orden de alimentación con `.sort()` explícito (`desayuno→colación→comida→comida_extra`)
  - Fix: sección de incidentes agregada (estaba omitida — API sí la devolvía)
  - Fix: hora de medicamentos formateada con `toLocaleTimeString` (antes mostraba ISO completo)

- **personal.js — Tarjetas mostraban grupos de ciclos históricos:**
  - Query `GET /personal` no filtraba `asignaciones_grupo` por ciclo activo
  - Fix: subquery con `JOIN ciclos_escolares WHERE activo = true`

### Agregados a PENDIENTES (próximas sesiones)
- Dashboard maestra: card "Sin entrada por retardos acumulados"
- Dashboard papá: mostrar resultado del filtro de entrada (qué trajo / qué faltó)

---

## ✅ SESIÓN 52 — FASE 3 Hardcodeados + Bugs Bitácora

**Fecha:** 2026-04-23

### Implementado
- **Backend:** Endpoint `GET /catalogos/:tipo` centralizado con 11 catálogos (animo, comportamiento, cuanto-comio, tiempos-comida, condiciones-panial, niveles, roles-personal, estados-alumno, tipos-documento, metodos-pago, conceptos-pago)
- **Web:** Hook `useCatalogo` + `toMap()` utility. Migradas 5 pantallas: `Bitacora.jsx` (maestra), `Personal.jsx`, `Alumnos.jsx`, `Grupos.jsx`, `CiclosEscolares.jsx`
- **Fix:** Inconsistencia `kinder_1`/`kinder_2`/`kinder_3` → estandarizado a `kinder1`/`kinder2`/`kinder3`
- **Mobile:** `EXPO_PUBLIC_API_URL` en `.env`, `src/constants/catalogos.js` centralizado. Migradas 3 pantallas: bitacora padre, index padre, bitacora maestra
- **Fix timezone:** `SET timezone = 'America/Mexico_City'` en cada conexión del pool (`database.js`) para que `CURRENT_DATE` y `NOW()` siempre usen hora México
- **Fix bug datos cruzados entre alumnos:** `key={alumnoSeleccionado.id}` en `FormBitacora` — fuerza desmontaje al cambiar de alumno
- **Fix actividades lateral:** Quitado `mostrar` del `enabled` de la query `actividades-grupo` — ya carga sin necesidad de abrir el panel
- **Fix comidas no cargaban al re-entrar:** `useEffect([data, alumno.id])` para forzar re-ejecución al montar con caché

### Bugs corregidos en sesión
1. `ANIMOS is not defined` — catálogos declarados en componente padre, no en hijo (`FormBitacora`)
2. `PANIAL_LABEL[key]` retornaba objeto en lugar de string — faltaba `.label`
3. Datos de alumno anterior aparecían en el siguiente — faltaba `key` prop en `FormBitacora`
4. Tiempos de comida no cargaban al abrir bitácora — `useEffect` no se disparaba con datos de caché
5. Actividades del lateral no aparecían — `enabled: mostrar` impedía fetch en modo collapsed

---

## ✅ SESIÓN 51 — Inconsistencias Silenciosas FASE 2

**Fecha:** 2026-04-23

**Archivos modificados:**
- `mobile/app/(padre)/bitacora.jsx` (claves comportamiento)
- `mobile/app/(padre)/index.jsx` (claves ánimo)
- `mobile/app/(maestra)/bitacora.jsx` (emoji no_comio + esfínteres nivel_codigo)
- `web/src/pages/padre/Pagos.jsx` (semáforo de backend)
- `web/src/components/ui/Semaforo.jsx` (simplificar SemaforoPago)

**Tareas Completadas (5/5):**

| Tarea | Detalle |
|-------|---------|
| **#1 Comportamiento vacío padre mobile** | `excelente/bueno` → `muy_bien/bien` en `COMPORTAMIENTO` de bitacora.jsx. ENUM en BD es `muy_bien`, `bien`, `necesita_mejorar`. |
| **#2 Ánimo siempre 🤔 dashboard padre mobile** | Agregar `activo: '⚡'` e `irritable: '😤'`; remover `inquieto` y `energico`. Alineado con web-maestra. |
| **#3 Emoji No comió maestra mobile** | `no_comio: '✅'` → `no_comio: '❌'`. Semánticamente correcto — negación no éxito. |
| **#4 Esfínteres frágil maestra mobile** | Reemplaza `grupoNombre.toLowerCase().includes('kinder 1')` por `['maternal','prekinder','kinder1'].includes(nivelCodigo)`. Pasa `nivel_codigo` estructurado desde `SelectorAlumno`. |
| **#5 Semáforo pagos unificado** | `padre/Pagos.jsx`: usa `semaforo` del backend en lugar de calcular localmente por `saldo_pendiente`. `SemaforoPago.jsx`: simplificado a recibir `estado` string. Backend (`pagos.js` línea 32) es la fuente de verdad. |

**Commit:** `fix: Sesión 51 — FASE 2 inconsistencias silenciosas (5 fixes)` (5 files, 15 insertions, 24 deletions)

---

## ✅ SESIÓN 50 — Fixes Auditoría (Bugs Críticos FASE 1)

**Fecha:** 2026-04-23

**Archivos modificados:**
- `mobile/app/(padre)/index.jsx` (endpoint)
- `mobile/app/(maestra)/bitacora.jsx` (estructura comidas)
- `web/src/pages/directora/AlumnoPerfil.jsx` (qr_code_url + doc names)

**Tareas Completadas (4/4):**

| Tarea | Detalle |
|-------|---------|
| **#1 Dashboard padre mobile — endpoint incorrecto** | Cambiar `/alumnos?rol=padre` → `/alumnos/mis-hijos` (línea 94). Ajustar `.data.alumnos` → `.data` porque `/mis-hijos` devuelve array directo. El padre ahora verá ánimo, conducta e incidentes del hijo. |
| **#2 Comida mobile-maestra no llega al padre** | Reemplazar campos sueltos `que_comio`, `cuanto_comio`, `observaciones_comida` (líneas 238–240) por array estructurado `comidas: [{ tiempo: 'comida', que_comio, cuanto_comio, observaciones }]`. Backend solo procesa el array. |
| **#3 QR no aparece en perfil alumno** | Cambiar `alumno.qr_url` → `alumno.qr_code_url` (línea 577). Backend devuelve `qr_code_url` en la columna correcta. QR ahora visible en Directora. |
| **#4 Semáforo documentación siempre "incompleta"** | Alinear nombres en `TIPOS_DOC` y `DOC_REQUERIDOS`: `cartilla_vacuna` → `cartilla_vacunacion`, `foto_3x4` → `foto_escolar` (líneas 8–19). Alineación con BD resuelve mismatch silencioso. |

**Commits:**
- `fix: Sesión 50 — 4 bugs críticos de auditoría` (3 files, 18 insertions, 15 deletions)
- `chore: Sesión 50 — FASE 1 bugs críticos completada, preparar Sesión 51`

---

## ✅ SESIÓN 48 — Auditoría de Inconsistencias y Hardcodeados

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **Auditoría completa web + mobile** | Revisión exhaustiva de los 131 archivos del proyecto: portales Maestra, Directora, Papá web y Papá mobile. |
| **Inventario de bugs críticos** | Identificados 4 bugs que rompen funcionalidad hoy: endpoint incorrecto en dashboard padre mobile, comida mobile-maestra que no llega al padre, QR nunca visible en perfil, semáforo de documentación siempre "incompleta". |
| **Inventario de inconsistencias silenciosas** | Identificadas 5 inconsistencias donde datos se muestran incorrectos: comportamiento vacío en padre mobile (claves distintas), ánimo siempre 🤔 en dashboard padre mobile, emoji ✅ para "No comió", lógica de esfínteres frágil, semáforo de pagos con 3 lógicas distintas. |
| **Inventario de hardcodeados** | Identificados 16 catálogos duplicados entre portales: niveles, roles, estados alumno, emojis bitácora, tiempos comida, condiciones pañal, tipos documento, métodos pago, conceptos pago, parentescos, etc. IP hardcodeada en mobile. |
| **Plan documentado en PENDIENTES.md** | Sesión 48 organizada en 3 fases con archivos y líneas exactas para cada fix. |

**Sin código modificado esta sesión — solo auditoría y planeación.**

---

## ✅ SESIÓN 47 — Portal Papá: UI + Histórico

**Fecha:** 2026-04-22

**Archivos modificados:**
- `web/src/pages/padre/Dashboard.jsx` (HijoCard enhancement)
- `mobile/app/(padre)/index.jsx` (HijoCard enhancement)
- `backend/src/routes/alumnos.js` (bug fixes)

**Tareas Completadas (6/6):**

| Tarea | Detalle |
|-------|---------|
| **#1 Orden comida en bitácora** | Mostrar Desayuno, Colación, Comida, Comida Extra en orden correcto. Implementado en web/maestra/Bitacora.jsx → propagado a padre/web, padre/mobile, directora. |
| **#2 Próximos 3 días + modal evento** | Dashboard padre muestra eventos próximos con modal interactivo. Implementado en web Dashboard y mobile index con `proximos3Dias()` helper y `ModalEvento` component. |
| **#3 HijoCard dashboard enhancement** | Ánimo + conducta lado a lado (mismo tamaño), alertas fiebre 🌡️ + incidentes ⚠️ en grilla 2x2, notas maestra en yellow. Implementado en web + mobile. |
| **#4 Orden de recibos** | Ya estaba implementado (mes actual → Ver Todos → meses anteriores DESC). |
| **#5 Validación estatus pagos** | Ya estaba implementado (verde solo si saldo_pendiente === 0). |
| **#6 Lógica avance bitácora** | Ya estaba implementado ("En curso" + "Finalizada"). |

**Bugs Arreglados:**
1. Tabla `incidentes_alumno` → `incidentes` en GET /alumnos/mis-hijos (SELECT subquery)
2. Orden de rutas Express: `/mis-hijos` ANTES de `/por-qr/:qrData` (ambas antes de `/:id`)
3. Node.js no recargaba código en Windows → resolvió matando procesos manualmente

**Aprendizajes Documentados:**
- `feedback_emoji_consistency.md` — Emoji fuente de verdad en maestra/Bitacora.jsx
- `feedback_ruta_order_express.md` — Static routes BEFORE parameterized (reconfirmado)

**Próximo Pendiente:**
- 📂 Histórico por ciclo escolar en dashboard padre (ver ciclos pasados)

---

## ✅ SESIÓN 46 — Actividades: Debugging rutas + autorización

**Fecha:** 2026-04-22

**Archivos modificados:**
- `backend/src/routes/bitacora.js` (route ordering, authorization, query parameters)
- `.claude/settings.json` (hooks para auto-restart de servidores)

**Tareas Completadas (1/1):**

| Tarea | Detalle |
|-------|---------|
| **Debugging actividades completo** | GET /bitacora/actividades-grupo → 500 error (ruta interpretada como :alumnoId UUID). Solución: mover ruta estática ANTES de :alumnoId. POST /bitacora/actividades-grupo → 403 Forbidden (authorize middleware con roles no coincidentes). Solución: cambiar a authenticate (cualquier usuario logueado). Parámetros query duplicados → corregir [alumnoId, alumnoId, fecha] a [alumnoId, fecha]. |

**Bugs Arreglados:**
- Express route ordering: static routes ANTES de parameterized routes
- Authorization middleware: role names must match DB exactly
- Query parameters: no duplicar variables en arrays

**Aprendizajes Documentados en memory/:**
- `feedback_servidor_restart.md` — Protocol: restart + validate with curl
- `feedback_ruta_order_express.md` — Express routing best practice
- `feedback_authorize_middleware.md` — Authorization role names from DB

**Impacto:** Feature "actividades múltiples" 100% funcional. End-to-end: maestra captura → alumno participa → papá ve → directora consulta. Listo para UI improvements en Sesión 47.

---

## ✅ SESIÓN 45 — Actividades múltiples: Captura grupo + participación alumno

**Fecha:** 2026-04-22

**Archivos modificados:**
- `backend/migrations/022_actividades_grupo.sql` (nuevo)
- `backend/src/routes/bitacora.js`
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/padre/Bitacora.jsx`
- `web/src/pages/directora/AlumnoPerfil.jsx`

**Tareas Completadas (7/7):**

| Tarea | Detalle |
|-------|---------|
| **Arquitectura BD nueva** | 2 tablas: `actividades_grupo` (catálogo del día por grupo) + `actividades_alumno` (participación individual). Maestra captura UNA SOLA VEZ, alumnos se seleccionan en bitácoras. |
| **Endpoints backend (3 nuevos)** | GET actividades-grupo (listar), POST actividades-grupo (capturar con fotos Cloudinary), POST actividades-alumno (guardar participación, auto-crea bitácora si falta). GET bitácora modificado para devolver actividades con participación. |
| **Panel Maestra — Captura** | Sección colapsable "🎨 Actividades del día" en sidebar. Array dinámico: textarea descripción + input foto por actividad. Guardar independiente. |
| **Sección Bitácora — Participación** | Tarjetas de actividades grupo (foto si tiene + descripción). 3 botones por actividad: ✓ Sí, ✗ No, — Sin registrar. Guardado independiente con API call. |
| **Portal Papá — Tarjetas actividad** | Sección "🎨 Actividades" muestra tarjetas con foto + badge verde ✓/rojo ✗ de participación. Elimina galería separada. Flujo limpio por actividad. |
| **Portal Directora — Lista compacta** | AlumnoPerfil Bitácora: nueva sección actividades con miniatura foto + badge. Layout vertical, no interfiere. |
| **Backward compatibility** | GET bitácora devuelve `actividades` con mismo shape para datos nuevos y fallback legacy. Sin cambios en endpoints existentes. |

**Impacto:** Arquitectura escalable y eficiente. Maestra no escribe actividades N veces (una por alumno), solo una vez. Papá y Directora ven datos visuales con participación clara por actividad. Sistema extensible para futuras mejoras (recurrencias, asignación a sub-grupos, etc).

---

## ✅ SESIÓN 44 — UI Mejoras Portal Maestra

**Fecha:** 2026-04-22

**Archivos modificados:**
- `backend/src/routes/asistencia.js`
- `web/src/pages/maestra/Asistencia.jsx`
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/maestra/FiltroEntrada.jsx`
- `web/src/pages/maestra/FiltroSalida.jsx`

**Tareas Completadas (3/3):**

| Tarea | Detalle |
|-------|---------|
| **Navegación prev/next de fechas** | Agregada en FiltroEntrada, FiltroSalida y Asistencia. Botones ChevronLeft/Right + modo solo lectura para días pasados. Backend acepta `?fecha=YYYY-MM-DD` en rutas filtro-entrada y filtro-salida. |
| **Emojis Bitácora** | Escala visual de comida cambiada de `🍽️🥢🍱🚫` a `😋😊😐❌` para hacerlos más intuitivos en campo CUANTO. |
| **Múltiples actividades por día** | Array dinámico en Bitácora: agregar, eliminar, guardar y recargar sin pérdida. Serializado con `\n`. Compatibilidad hacia atrás con formato anterior. |

**Impacto:** Portal Maestra más usable — navegación fluida entre fechas sin regresar al menú, emojis de comida más claros, actividades sin límite de una por día.

---

## ✅ SESIÓN 43 — UI Mejoras Portal Directora

**Fecha:** 2026-04-22

**Archivos modificados:**
- `web/src/pages/directora/Pagos.jsx`
- `web/src/pages/directora/ServicioComida.jsx` (nuevo)
- `web/src/pages/directora/TurnoPuerta.jsx`
- `web/src/layouts/DirectoraLayout.jsx`
- `web/src/App.jsx`
- `backend/src/routes/turnos-puerta.js`
- `backend/migrations/021_turno_puerta_tipo.sql` (nuevo)
- `backend/run-migration.js` (nuevo — helper reutilizable)

**Tareas Completadas (3/3):**

| Tarea | Detalle |
|-------|---------|
| **Pagos — Selector Grupo → Alumno** | ModalPago global reemplaza select plano con flujo Grupo → Alumno. Preview de recargo estimado + total antes de registrar (misma lógica del backend). |
| **Servicio de Comida unificado** | Nueva página `/directora/comida` con tabs Pagos / Menú. Tab Pagos: 3 cards (Confirmados, Pagados con desglose transf/efect, Sin pagar) + lista alumnos dividida en Semana completa vs Días específicos. Tab Menú: imagen/PDF + subir menú desde modal. Antiguas rutas `comida-menu` y `comida-pagos` redirigen a `/directora/comida`. Nav sidebar colapsado a 1 item. |
| **Turno Puerta ENTRADA/SALIDA** | Migración BD 021: columna `turno` + constraint única por `(fecha, personal_id, turno)`. Tabs Entrada (☀️) / Salida (🌙) independientes. Checkbox "Por semana" para asignar los 5 días de una vez. La misma Miss puede tener ambos turnos el mismo día. |

**Bugs corregidos:**
- `ComidaPagos.jsx` usaba claves inexistentes del backend (`stats.pagado_count`). `ServicioComida.jsx` usa las claves correctas (`stats.pagados.total`, `stats.sin_verificar.total`).
- `ComidaPagos.jsx` leía `conf.nombre_alumno` (undefined). `ServicioComida.jsx` usa `conf.nombre_completo`.

**Impacto:** Portal Directora más usable — selector de alumno intuitivo por grupo, comida unificada en una sola vista con tabs, turno de puerta con distinción entrada/salida.

---

## ✅ SESIÓN 42 — Bug Fix: Bitácora + Automatización Servidores

**Fecha:** 2026-04-22

**Archivos modificados:** 
- `web/src/pages/maestra/Bitacora.jsx` (línea 741-743)
- `.claude/settings.json` (hooks PostToolUse)

**Tareas Completadas (2/2):**

| Tarea | Detalle |
|-------|---------|
| **Bug: Bitácora sin validación entrada** | Filtro: solo mostrar alumnos con `estado_asistencia IN ('presente', 'retardo')`. Alumnos ausentes ya no aparecen en selector de bitácora. |
| **Automatización servidores** | Hooks PostToolUse en `.claude/settings.json`: reinicia Web (puerto 5173) al editar `/web/src/**`, reinicia Backend (puerto 5000) al editar `/backend/src/**`. Procesos asincronos, sin bloqueos. |

**Cambios clave:**
- Línea 741: `const alumnos = (grupo?.alumnos \|\| []).filter(a => ['presente', 'retardo'].includes(a.estado_asistencia))`
- Hook Web: mata proceso puerto 5173, inicia `npm run dev`
- Hook Backend: mata proceso puerto 5000, inicia `npm run dev`
- Script PowerShell: `kill_and_restart_server.ps1` — limpia puerto + inicia servidor

**Impacto:** Evita errores lógicos (bitácora de alumno sin entrada) + acelera desarrollo (no manual restart).

**Protocolo cierre sesión registrado:** Actualizar PENDIENTES → ARCHIVE_LOG + commit automático.

---

## ✅ SESIÓN 41 — Dashboard Directora Unificado

**Fecha:** 2026-04-22

**Archivos modificados:** `web/src/pages/directora/Dashboard.jsx`

**Tareas Completadas (6/6):**

| Tarea | Detalle |
|-------|---------|
| **Asistencia por grupo — Modal** | Cards clickeables (grid 5 cols) → modal overlay con lista de alumnos, estado (presente/retardo/no_entrada/ausente), hora entrada, avatar. Fetch `GET /asistencia/grupo/:id?fecha=hoy` al abrir. |
| **Emoji ⚠️ con tooltip** | Agregado `title="Menos del 80% de alumnos presentes"` cuando presentes < total * 0.8 |
| **Maternal sin asistencia** | Emoji ⬜ cuando `total === 0` (sin alumnos inscritos) |
| **Documentación Incompleta — Cards** | Reemplazo acordeón por grid cards (5 cols). Agrupa por grupo. Clic → modal con lista de alumnos sin docs. Header muestra número de alumnos. |
| **Retardos del Mes — Cards** | Reemplazo acordeón por grid cards (5 cols). Agrupa por grupo. Clic → modal con lista de alumnos + contador retardos. Borde/fondo rojo si hay alumno con ≥3 retardos. |
| **Salidas registradas hoy — Cards** | Reemplazo acordeón por grid cards (5 cols). Clic → modal con lista de salidas. Header muestra número de salidas. Chips de alerta inline (🚨 no autorizadas, ⚠️ anticipadas). |
| **Unificación visual** | Las 4 secciones principales (Asistencia, Salidas, Documentación, Retardos) ahora comparten diseño de cards clickeables + modales. Consistencia 100%. |

**Nuevos componentes:**
- `FilaModal` — fila individual en modal de asistencia
- `ModalAsistenciaGrupo` — modal overlay asistencia por grupo
- `ModalSalidasGrupo` — modal overlay salidas por grupo
- `ModalDocumentacionGrupo` — modal overlay documentación por grupo
- `ModalRetardosGrupo` — modal overlay retardos por grupo
- Función `agruparPorGrupo()` — reutilizable para agrupar listas por grupo
- Constante `ESTADO_STYLE` — estilos para estados de asistencia

**Bugs corregidos en el proceso:**
- Valores del backend como strings (`'0'`, `'031'`) → conversión a número con `parseInt()` antes de comparaciones
- `a.retardos` era string `"031"` (concatenaba en lugar de sumar) → fix: `parseInt(a.retardos || 0)` en reduce
- Modal necesitaba `stopPropagation()` para cerrar solo al clic en overlay, no en contenedor interno

**Pendiente para sesión 42:**
- Modal Pagos (Directora) — selector de grupo + buscador alumno
- Servicio de Comida unificado
- Turno Puerta configuración SALIDA
- Mejoras Portal Maestra (navegación días, emojis bitácora)
- Mejoras Portal Papá (orden bitácora, recibos, validación pagos)
- Notificaciones globales (campanita + modal)

---

## ✅ SESIÓN 40 — UI Mejoras Portal Directora (Parte 1)

**Fecha:** 2026-04-22

**Archivos modificados:** `Semaforo.jsx`, `Grupos.jsx`, `Alumnos.jsx`, `Asistencia.jsx`, `Pagos.jsx`, `Dashboard.jsx`, `index.css`

| Tarea | Detalle |
|-------|---------|
| **Semaforo.jsx** | Badge "Incompleta" → "Documentación Incompleta" |
| **Grupos.jsx — Bug cupo_maximo** | Form usaba `capacidad_maxima` (undefined); corregido a `cupo_maximo` — los valores ahora persisten correctamente al editar |
| **Grupos.jsx — Ciclo activo** | Badge `📅 {cicloActualData}` en encabezado — dato ya venía del backend pero no se renderizaba |
| **Grupos.jsx — Sufijos** | Placeholder mejorado + helper text "Usa sufijos A, B, C" cuando nivel es Kinder 1/2/3 |
| **Alumnos.jsx — Tabs por nivel** | Select de grupo reemplazado por tabs dinámicos derivados del backend. Filtrado por nivel en cliente con `useMemo` |
| **Alumnos.jsx — Iconos visibles** | Removido `opacity-0 group-hover:opacity-100` — iconos siempre visibles |
| **Asistencia.jsx — Orden grupos** | Tabs de grupos ordenados por nivel de aparición en el backend (no hardcodeado) |
| **Asistencia.jsx — Navegación días** | Botones `‹ ›` navegan entre días hábiles, saltando sábado/domingo automáticamente. Fecha parseada con `T12:00` para evitar desfase UTC |
| **Asistencia.jsx — Scrollbar** | Clase `.scrollbar-hidden` en vista mensual — barra morada ya no aparece |
| **Pagos.jsx — Tabs por nivel** | Select de grupo reemplazado por tabs dinámicos derivados del backend. Filtrado usando mapa `grupoNombre→nivel` |
| **Dashboard.jsx** | Sección "Horarios Configurados" eliminada (no era dashboard). `useQuery` de config-horarios y `import Settings` removidos |

**Pendiente para sesión 41:**
- Dashboard: Clic en tarjeta Asistencia → modal detalle + clarificar ⚠️
- Dashboard: Documentación Incompleta agrupada por grupo con acordeón
- Dashboard: Retardos del Mes agrupados por grupo con acordeón
- Pagos: ModalPago global — selector de grupo + buscador de alumno

**Bugs corregidos en el proceso:**
- Niveles hardcodeados en frontend (`maternal`, `kinder_1`) no coincidían con BD (`"Maternal"`, `"Kinder 1"`)
- `new Date("YYYY-MM-DD")` parsea en UTC → `getDay()` devuelve día anterior en timezone México. Fix: usar `T12:00`

---

## ✅ SESIÓN 39 COMPLETADA — Sprint 3 Finalizado

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **Portal Papá — Bitácora** | Selector de ciclos anteriores + navegación por rango de fechas con `GET /alumnos/:id/ciclos` + `GET /bitacora/:id/rango`. Historial completo funcional. |
| **Portal Papá — Pagos** | Agrupación por año/ciclo con encabezados visuales. Recibos ordenados (actual primero, históricos descendente). |
| **Limpieza BD + CURP** | Duplicados Ana García eliminados (soft-delete), CURP obligatoria implementada, validación en backend y seed. |
| **Testing validado** | Historial ciclos y pagos probados en browser. Navegación fluida confirmada. |

**Sprint 3 cerrado:** Funcionalidad de historial por ciclo completamente operativa en ambos portales.

---

## ✅ SESIÓN 39 INICIO — Limpieza de BD + Validación CURP

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **D) Eliminar test_ciclos.js** | Archivo de prueba E2E temporal (sesión 36) eliminado. |
| **C) Limpiar duplicados Ana García López** | 3 registros sin CURP eliminados (soft-delete). Canónico con CURP `GALA220315MDFRLNA1` mantiene relaciones. |
| **Migración CURP obligatoria** | `backend/migrations/020_curp_required_alumnos.sql` — valida que todos los alumnos activos tengan CURP. |
| **Validación backend** | `backend/src/controllers/alumnosController.js` — CURP obligatoria al crear alumnos (retorna 400 si falta). |
| **Script limpieza** | `backend/src/database/fix_duplicados_ana.js` — procesó 26 tablas con `alumno_id`, reasignó relaciones. |
| **Guard seed.js** | `backend/src/database/seed.js` — búsqueda por CURP previene reinserción de duplicados. |

**Prevención futura:**
- CURP como llave de identidad (no nombre)
- Constraint UNIQUE parcial en BD ya existente (`002_unique_constraints.sql`)
- Backend rechaza alumnos sin CURP
- Seed verifica por CURP antes de insertar

---

## ✅ SESIÓN 38 — 5 Bugs Críticos Resueltos

**Fecha:** 2026-04-22

| Bug | Archivo | Fix |
|-----|---------|-----|
| Duplicado $$ en tabla Comida | `web/src/pages/directora/ComidaPagos.jsx:164` | Removido `$` literal extra en template string |
| Orden alimentación bitácora papá | `web/src/pages/padre/Bitacora.jsx:346` | Sort por `['desayuno','colacion','comida','comida_extra']` antes del filter |
| Configuración no carga horarios | `web/src/pages/directora/Configuracion.jsx:54` | Eliminado `onSuccess` deprecado (React Query v5); usa `configData` del hook con `valores ?? configData?.horarios` |
| Calendario filtro por rol padre | `backend/src/routes/calendario.js:60` | Subquery server-side que filtra por grupos del hijo del padre logueado |
| Firma incidentes — Invalid api_key | `backend/src/routes/bitacora.js:427` | Guardado base64 directo en BD; eliminada dependencia de Cloudinary para firmas |

**También en esta sesión:**
- Protocolo "Inicia sesión" / "Cierra sesión" documentado en CONTEXT.md
- Mejora memoria: Claude siempre inicia backend + web (no Valeria)

---

## 🔑 REFERENCIA RÁPIDA

### Credenciales de prueba (contraseña: `HappySchool2026!`)
| Rol | Email |
|-----|-------|
| Directora | directora@happyschool.edu.mx |
| Administrativo | admin@happyschool.edu.mx |
| Maestra Maternal | maternal@happyschool.edu.mx |
| Maestra Prekinder | prekinder@happyschool.edu.mx |
| Maestra Kinder 1 | kinder1@happyschool.edu.mx |
| Maestra Kinder 2 | kinder2@happyschool.edu.mx |
| Maestra Kinder 3 | kinder3@happyschool.edu.mx |
| Padre (Ana García López) | padre@happyschool.edu.mx |

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| directora | Todo |
| administrativo | Financiero |
| maestra_titular | Solo su grupo |
| maestra_especial | Grupos y días asignados |
| maestra_puerta | Solo entrada/salida |
| padre | Solo sus hijo(s) |

### Estructura del Monorepo
```
APP-KINDER/
├── ARCHIVE_LOG.md / PENDIENTES.md
├── backend/
│   ├── migrations/        001_schema_inicial.sql … 016_cobro_extension_config.sql
│   ├── src/
│   │   ├── controllers/   authController.js, alumnosController.js, comidaController.js
│   │   ├── middleware/     auth.js, errorHandler.js, validateRequest.js
│   │   ├── routes/        index.js + 16 módulos completos
│   │   ├── services/      cloudinaryService, whatsappService, qrService
│   │   ├── jobs/          comidaJobs.js (cron lunes 8:31 AM)
│   │   └── database/      seed.js, seed_datos_reales.js, seed_semana_13_17_abril.js
│   └── .env               (no en git — credenciales reales)
├── web/
│   └── src/pages/
│       ├── directora/     Dashboard, Alumnos, AlumnoPerfil, Grupos, Personal,
│       │                  Pagos, Calendario, CiclosEscolares, TurnoPuerta,
│       │                  ComidaMenu, ComidaPagos, Configuracion
│       ├── maestra/       Dashboard, FiltroEntrada, FiltroSalida, Asistencia, Bitacora
│       └── padre/         Dashboard, Bitacora, Pagos, Calendario, ComidaSemanal
└── mobile/
    └── app/
        ├── (maestra)/     index, asistencia, bitacora, galeria, qr-scanner
        └── (padre)/       index, bitacora, pagos, calendario, comida
```

---

## 📋 HISTORIAL POR SESIÓN (reciente → antiguo)

---

### ✅ SESIÓN 37 — Historial por Ciclo Escolar: Sprint 1+2 (2026-04-21)

#### Backend — 5 endpoints nuevos/modificados
- `GET /alumnos?ciclo_id=<uuid>` — Cuando llega `ciclo_id`, usa `inscripciones` como fuente en lugar de `alumnos.grupo_id` directo. Sin `ciclo_id` → comportamiento original sin cambios. `backend/src/controllers/alumnosController.js`
- `GET /alumnos/:id/ciclos` — Devuelve todos los ciclos en que estuvo inscrito un alumno desde tabla `inscripciones`. `backend/src/routes/alumnos.js`
- `GET /bitacora/:alumnoId/rango?fecha_inicio=&fecha_fin=` — Listado de días con resumen por día (estado_animo, comportamiento, notas, maestra). Detalle del día sigue con `?fecha=`. `backend/src/routes/bitacora.js`
- `GET /reportes/dashboard?ciclo_id=<uuid>` — Queries hardcodeadas a `activo = true` ahora usan `COALESCE($ciclo_id::uuid, SELECT id WHERE activo = true)`. `backend/src/routes/reportes.js`
- `GET /grupos` — Para ciclos históricos, `total_alumnos` se calcula desde `inscripciones` (subquery correlacionado). `backend/src/routes/grupos.js`

#### Frontend — Directora
- `SelectorCiclo.jsx` — Componente reutilizable. Muestra "📅 Ciclo actual" + lista históricos. `web/src/components/ui/SelectorCiclo.jsx`
- `Grupos.jsx` — Banner amarillo "📚 Modo solo lectura" + botón nuevo deshabilitado + ✏️ oculto en histórico. `web/src/pages/directora/Grupos.jsx`
- `Alumnos.jsx` — Al cambiar ciclo: limpia filtros, pasa `ciclo_id`, modo solo lectura. `web/src/pages/directora/Alumnos.jsx`

#### Restauración de BD (datos de prueba)
- BD restaurada a **2025-2026 activo**: 18 alumnos con grupos correctos.
- **2026-2027 inactivo**: 10 egresados/bajas (datos del test E2E sesión 36).
- 4 inscripciones con `grupo_id IS NULL` → asignadas a Kinder 3 en 2026-2027.
- **Pendiente sesión 38:** Ana García López tiene 3 registros duplicados en `alumnos`.

#### Bugs resueltos
- **Import named vs default:** `SelectorCiclo` importaba `{ api }` pero `api.js` exporta `default` → cambiar a `import api from`.
- **Estado inicial `inscrito`:** al cambiar al ciclo histórico, filtro `estado='inscrito'` devolvía 0 resultados → `handleCicloChange` resetea `estadoFiltro` a `''`.
- **Botón ✏️ no ocultado:** `TarjetaGrupo`/`TarjetaAlumno` no recibían prop `soloLectura` → pasar prop y envolver en `{!soloLectura && ...}`.
- **total_alumnos = 0 en histórico:** contaba con `alumnos.grupo_id` directo ya movido → subquery correlacionado en `inscripciones`.
- **Maestras sin titular:** al copiar grupos en promoción, todas con `es_titular = false` → marcada la primera por grupo como `es_titular = true` en BD.

---

### ✅ SESIÓN 36 — E2E Promoción + Panel Configuración Grupos (2026-04-21)

#### Funcionalidades completadas
- Test E2E promoción de ciclo escolar — flujo completo validado en BD.
- **Panel selección de grupos** al copiar: checkbox por grupo, nombre editable, "+ Agregar grupo nuevo".
- **Backend `copiar-grupos-del-anterior` mejorado** — acepta body `{ grupos: [...] }` selectivo. Sin body → copia todo. Borra grupos previos del ciclo destino antes de copiar.
- **Selector dinámico de grupo destino en Paso 2** — cuando un nivel tiene múltiples grupos (ej: K2A y K2B), muestra `<select>`.
- **Lógica de estados corregida** — Kinder 3: "🎓 Egresado" fijo. Resto: selector Reinscrito/Baja (sin Egresado).
- **Botón "Reconfigurar grupos"** — visible siempre en Paso 1 una vez seleccionado ciclo destino.
- **Contadores actualizados** — "X promovidos | 🎓 Y egresados | ❌ Z bajas".

#### Resultado verificado en BD
- Ciclo 2026-2027: ACTIVO con 6 grupos. 20 alumnos reinscitos | 5 egresados | 3 bajas.

#### Archivos modificados
- `web/src/pages/directora/CiclosEscolares.jsx`
- `backend/src/routes/ciclos.js`

#### Bugs resueltos
- **Stale closure en `setTimeout`:** `handleSeleccionarDestino(cicloDestino)` usaba valor viejo → construir `destinoActualizado` y pasar directo.
- **`nombre_destino` undefined:** `gruposParaEditar[g.id]` era `undefined` si no se tocó el input → usar `gruposParaEditar[g.id] ?? g.nombre`.
- **Grupos sucios al re-copiar:** endpoint acumulaba duplicados → `DELETE FROM asignaciones_grupo / grupos WHERE ciclo_id = $1` al inicio de cada transacción.
- **401 en GET /grupos:** access token 15min expiraba durante flujo largo del modal (stale closure impedía al interceptor actuar).

---

### ✅ SESIÓN 35 — Indicador "X niños comen hoy" en Dashboards (2026-04-21)

- **Dashboard Miss:** Indicador "🍽️ X niños comen hoy" en verde antes de lista de confirmaciones. Filtra `pago_verificado = true` por día actual. Considera `semana_completa` y `dias_seleccionados.includes(diaHoy)`. Se oculta fines de semana. `web/src/pages/maestra/Dashboard.jsx`
- **Dashboard Directora:** Mismo indicador verde destacado sobre el total semanal. `web/src/components/directora/BannerComidaHoy.jsx`
- Array de nombres de días: `['Domingo', 'Lunes', ...]` en lugar de abreviados.

---

### ✅ SESIÓN 34 — Corrección Duplicados de Grupos (2026-04-21)

- **Root cause:** `GET /grupos` sin `ciclo_id` devolvía grupos de todos los ciclos.
- **Fix `grupos.js`:** sin `ciclo_id`, WHERE incluye `AND g.ciclo_id = (SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1)`.
- **Fix `reportes.js`:** query `asistenciaPorGrupo` filtra por ciclo activo.
- **Fix `pagos.js`:** resumen de pagos por grupo filtra por ciclo activo.
- **Validado:** GET /grupos, GET /reportes/dashboard y GET /pagos devuelven exactamente los 6 grupos del ciclo 2025-2026.

---

### ✅ SESIÓN 33+ — Limpieza y Reestructuración de Grupos 2025-2026 (2026-04-20)

- **Problema:** Ciclo 2025-2026 con grupos incorrectos/duplicados. Necesitaba: Maternal, Prekinder, Kinder 1A, Kinder 1B, Kinder 2, Kinder 3.
- **Restricción crítica:** Datos históricos de semana 13-17 abril referencian UUIDs hardcodeados en seed → NO se pueden eliminar grupos, solo RENOMBRAR.
- **Script `fix_grupos_2025_2026.js`** (transacción atómica, idempotente): renombra, crea K1B, soft-delete sobrantes, índice parcial.
- **Backend:** endpoint `DELETE /:id` (soft-delete) en grupos.js. `preview-promocion` usa LATERAL + LIMIT 1 para evitar duplicados con múltiples grupos por nivel.
- **Seeds actualizados:** `seed.js`, `seed_datos_reales.js`, `seed_semana_13_17_abril.js`.
- **Índice parcial:** `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` — permite soft-delete sin bloquear futuros nombres iguales.

#### Bugs resueltos
- **Índice UNIQUE con `deleted_at`:** bloqueaba recrear grupo con mismo nombre → recrear como índice parcial.
- **Preview duplicados con múltiples grupos mismo nivel:** LEFT JOIN retornaba filas duplicadas → LATERAL con LIMIT 1.

---

### ✅ SESIÓN 32 — Ciclos Escolares: Crear, Cierre y Promoción (2026-04-20)

- **Backend CRUD completo:** `GET /ciclos`, `POST /ciclos`, `GET /ciclos/:id/preview-promocion`, `POST /ciclos/:id/ejecutar-promocion`. Archivo: `backend/src/routes/ciclos.js`
- **Lógica de promoción automática:** Maternal→Prekinder→K1→K2→K3→Egresado.
- **Web `CiclosEscolares.jsx`:** Tabla de ciclos + modal nuevo ciclo + flujo 3 pasos (seleccionar destino → tabla editable → confirmar).
- **Integración:** Ruta en `App.jsx`, enlace en sidebar con ícono `Clock`.

#### Bugs resueltos
- Import `pool` → cambiar a `{ query, getClient }`.
- `getPool()` no existe → usar `getClient()`.
- Parámetro `alumno_id` vs `id` → aceptar ambos con `alumno_id || id`.
- Sincronización: necesitó 3 restarts de backend.

---

### ✅ SESIÓN 31 — Sincronización Web-Mobile Comida + Cleanup (2026-04-20)

- **Mobile comida:** `cargarDatos()` extraída fuera de `useEffect` para ser reutilizable post-confirmación.
- **Sincronización:** Web (`ComidaSemanal.jsx`) y Mobile (`comida.jsx`) llaman al mismo backend.
- **Database cleanup:** 3 duplicados de Ana García López eliminados. Dejado 1 válido con CURP `GALA220315MDFRLNA1`.
- **Migración 016:** clave `hora_inicio_cobro_extension = '15:06'` en `configuracion_general`.
- **Cobros extensión de horario:** Pausado — timezone issues complejos UTC vs America/Mexico_City. Revertido a estado limpio.

---

### ✅ SESIÓN 30 — Dashboard Maestra: Confirmaciones Comida (2026-04-20)

- **Backend:** `GET /comida/confirmaciones` acepta `grupo_id` opcional. Devuelve solo `pago_verificado = true`.
- **Dashboard Maestra:** Sección "🍱 Confirmaciones" con nombre alumno + modalidad. Refetch cada minuto.
- **Función `getLunesActual()`:** cálculo manual `YYYY-MM-DD` sin `toLocaleDateString` (inconsistente por zona horaria).

---

### ✅ SESIÓN 29 — Dashboard Directora + Validación Job Cron (2026-04-20)

- **Job cron 8:31 AM:** Verificado en `backend/src/jobs/comidaJobs.js`. Cron `31 8 * * 1`, zona horaria México, busca confirmaciones sin pago, actualiza a cancelado, envía WhatsApp.
- **Backend `GET /comida/confirmaciones`:** Estructura jerárquica `{ pagados: { total, transferencia, efectivo }, sin_verificar: {...} }`.
- **BannerComidaHoy.jsx:** Rediseño compacto horizontal.
- **`seed_comida_pagos_demo.js`:** 3 registros para semana actual.

#### Bugs resueltos
- Procesos Node viejos devolvían endpoint antiguo → `kill -9` y reiniciar.

---

### ✅ SESIÓN 28 — FASE 6.9 Control de Pagos Comida (2026-04-20)

- **`ComidaPagos.jsx` (NUEVO):** Panel control pagos semanal, navegación anterior/siguiente semana, toggle ✅ Pagado / ❌ No Pagó. `web/src/pages/directora/ComidaPagos.jsx`
- **`FiltroEntrada.jsx`:** Toggle "✅ Pago verificado" / "❌ No pagó - Cancelar" al registrar entrada.
- **HTTP Cache fix:** Middleware desactiva ETags/Cache-Control para `/api/` (no-store, no-cache, must-revalidate).
- **Rutas:** `/directora/comida-pagos` y `/admin/comida-pagos` (reutilizado).

#### Bugs resueltos
- **HTTP 304 Not Modified:** Navegador cacheaba GET `/comida/confirmaciones` → middleware deshabilita cache.
- **json_agg omitía campos NULL:** cambiar a SELECT directo con campos explícitos.
- **Navegación de semanas rota:** parsear `semanaInicio` correctamente antes de sumar/restar días.

---

### ✅ SESIÓN 27 — FASE 6.9 Indicador de Comedor (2026-04-20)

- **Migraciones 014 y 015:** Tablas `control_comida_semanal` y `menu_comida_semanal`.
- **Backend rutas `/comida/*` completas:** GET menu, POST/DELETE menu, GET confirmaciones, POST/GET/PUT confirmación, PUT verificar-pago, PUT cancelar.
- **`comidaController.js`:** Lógica completa con Cloudinary.
- **Job cron lunes 8:31 AM:** `procesarComidaNoPagada()` en `backend/src/jobs/comidaJobs.js`.
- **Web papá `ComidaSemanal.jsx`:** Menú semanal, formulario confirmación, selector modalidad (semana $250 | días $50), método pago.
- **Web directora `ComidaMenu.jsx`:** Crear/editar menú semanal + PDF a Cloudinary.
- **Web maestra `FiltroEntrada.jsx`:** Checkbox verificación pago comida.
- **Mobile papá `comida.jsx`:** Pantalla confirmación semanal React Native.

#### Bugs resueltos
- **Import error `comidaController.js`:** `../database/db` → `../config/database`.
- **Variable shadowing:** local `query` string sobrescribía `query` importado → renombrar a `sql`.
- **auth middleware no exportaba `verifyToken`:** agregar `verifyToken: authenticate`.
- **Navbar emoji 🍽️** → lucide-react `UtensilsCrossed`.

---

### ✅ SESIÓN 26 — FASE 6.8 Bitácora 4 Tiempos (2026-04-19)

- **Migración 013:** Columna `tiempo` en `registro_comida` (desayuno, colacion, comida, comida_extra). Constraint único `(alumno_id, fecha, tiempo)`.
- **Backend:** `GET /bitacora/:alumnoId` retorna `comida` como array. `POST /guardar` acepta array `comidas` con upsert por `(alumno_id, fecha, tiempo)`.
- **Fix duplicados:** `DISTINCT ON (a.id)` en `/alumnos/mis-hijos` y `/grupos/mi-grupo`.
- **UI Miss:** 4 secciones coloreadas (naranja, verde, rojo, púrpura) con textarea + 4 botones emoji "¿Cuánto?" + notas.
- **UI Papá:** 4 secciones, filtra Comida Extra si `tiene_extension === false`.

---

### ✅ SESIÓN 25 — Validación Automatización Cumpleaños (2026-04-19)

- Verificado que ícono 🎂 ya estaba completamente implementado en `FiltroEntrada.jsx`. Función `esCumpleanos()` usa `.substring(0,10)` correctamente.
- **Script `setup_cumpleanos_demo.js`:** actualiza `fecha_nacimiento` de alumnos de prueba.

---

### ✅ SESIÓN 24 — Galería + Firma Digital Incidentes (2026-04-19)

- **Galería de fotos Miss:** Grid 4 columnas en sección Actividades.
- **Galería de fotos Padre:** Grid 3 columnas, fotos clicables en nueva pestaña.
- **Firma digital incidentes (Padre):** `SignaturePad.jsx` (canvas interactivo). Endpoint `PATCH /bitacora/incidente/:id/firma` guarda en Cloudinary (`happyschool/firmas`). Botón "✍️ Firmar" → "✅ Firmado + fecha".
- **Comportamiento:** Sección propia, solo si hay datos.
- **Selector de fecha sin fin de semana:** botones ◀️ ▶️ saltan sábados/domingos.
- **Pañal:** ocultar sección baño si `usa_panial=true`. Migración SQL 012 para Ana García López.

#### Bugs resueltos
- **`usa_panial` no llegaba a frontend:** procesos Node viejos en background → matar todos y reiniciar.

---

### ✅ SESIÓN 23 — "Tarea" → "Actividades" + N fotos (2026-04-19)

- **Migración 011:** RENAME `tarea_realizada` → `actividad_realizada` en `bitacora_diaria`. ADD `actividad_descripcion TEXT`.
- **Backend:** POST `/bitacora/actividades/fotos` (multipart, hasta 10). GET `/bitacora/:alumnoId/actividades`. GET `/:alumnoId` incluye array `actividades`.
- **Backend refactor (renombre):** `grupos.js`, `alumnos.js`, `bitacora.js` actualizados.
- **Web Miss:** Sección "🎨 Actividades" con descripción + input múltiple fotos.
- **Web/Mobile Papá:** Renombrada "Actividades", muestra `actividad_descripcion`, galería fotos.
- **Mobile Miss:** `tarea_realizada` → `actividad_realizada` en useEffect y guardarMutation.

#### Bugs resueltos — CRÍTICOS (renombrado columna sin audit completo)
- `/alumnos/mis-hijos` devolvía 500 por `tarea_realizada` sin actualizar.
- `/grupos/mi-grupo` devolvía 500 por la misma razón.
- **Lección:** Al renombrar columna, SIEMPRE grep completo antes: `grep -r "tarea_realizada" --include="*.js" --include="*.jsx" . | grep -v node_modules`. Documentado en memory.

---

### ✅ SESIÓN 22 — Navegación Rápida a Bitácora (2026-04-20)

- **Dashboard Miss:** Click en alumno de tabla → abre bitácora sin pasos extras. `Bitacora.jsx` captura `alumnoId` de query params (`useSearchParams`).
- **Simplificación acciones:** Quitadas tarjetas "Asistencia" y "Bitácora" (acceso ya integrado en tabla).
- **Fix ruta:** `mi-grupo` movida ANTES de `/:id` en `grupos.js` para evitar conflicto Express.

---

### ✅ SESIÓN 20 — Incidentes + Medicamentos (2026-04-19)

- **Backend `POST /bitacora/incidente`:** Hasta 5 fotos (Cloudinary `happyschool/incidentes`). Notifica WhatsApp plantilla `incidente`. Multer en memoria.
- **Backend `GET /bitacora/incidentes/hoy`:** Solo directora/administrativo. Definida ANTES de `/:alumnoId`.
- **Backend `GET /bitacora/:alumnoId`:** Incluye `incidentes` con JOIN a `personal`.
- **Web Miss — Bitácora:** Sección 💊 Medicamentos (POST `/bitacora/medicamento`) + ⚠️ Incidentes (POST multipart `/bitacora/incidente`).
- **Dashboard Directora:** Panel rojo "⚠️ Incidentes hoy (N)", refetch 60s.
- **Web Papá — Bitácora:** Sección incidentes del día con fotos y hora.
- **Confirmación administración medicamento:** Timestamp + WhatsApp inmediato al padre.

---

### ✅ SESIÓN 19 — Registro Salida (2026-04-19)

- **`GET /api/asistencia/filtro-salida`:** Alumnos con `estado IN ('presente','retardo')` sin salida registrada, agrupados por grupo. Incluye padres + personas autorizadas.
- **Página `/maestra/filtro-salida`:** Lista por grupo, modal con selector "quién recoge", banner ámbar si salida anticipada.
- **JOIN `registro_salida` en `/grupos/mi-grupo`:** Agrega `hora_salida`, `nombre_quien_recoge`, `salida_autorizada`.
- **Dashboard Miss — columnas Entrada/Salida:** Badge hora entrada + hora salida (azul=normal / naranja=anticipada). Banner naranja cuando hay salidas anticipadas.
- **Dashboard Directora — Salidas por grupo hoy:** Acordeón por grupo con chips: `X/Y salieron · X en escuela · ⚠️ anticipadas · 🚨 no autorizadas`.
- **Eliminación "Ver antes":** acceso directo en Bitácora, Pagos y Calendario sin paso intermedio.

---

### ✅ SESIÓN 18 — Configuración + Dashboard Dinámico (2026-04-19)

- **`GET/PUT /api/config/horarios`:** Lee/actualiza 9 claves de `configuracion_general`.
- **Página Configuración directora:** 4 secciones (Entrada, Horario/Salida, Reglas, Períodos de pago).
- **Monitor puntualidad Dashboard Miss:** Banner verde/gris con hora límite de BD. Contador retardos. Reloj cada 30s.
- **Fix timezone retardo:** `toTimeString().slice(0,5)` (UTC) → `toLocaleTimeString('en-CA', { timeZone: 'America/Mexico_City' })`.
- **Dashboard Directora:** Tarjeta ⚙️ con horarios principales + enlace a Configuración.

---

### ✅ SESIÓN 17 — Bitácora Histórica + Roles Auxiliares (2026-04-19)

- **Migración 009:** UNIQUE INDEX parcial en `asignaciones_grupo (grupo_id, ciclo_id) WHERE es_titular = true`.
- **Migración 010:** Rol `maestra_auxiliar`. Karla Espinoza y Mónica Vargas actualizadas.
- **Bitácora histórica Miss (web):** Selector ◄ ► con salto sábado/domingo. Días anteriores = solo lectura total.
- **Bitácora histórica Directora:** Nueva pestaña "📋 Bitácora" en AlumnoPerfil.
- **Fix Baño vs Pañal Miss:** Sección "🚿 Baño" oculta si `usa_panial=true`.
- **Fix timezone `registro_panial`:** `DATE(hora AT TIME ZONE 'America/Mexico_City')`.
- **Etiquetas pañal mejoradas:** "💧 Pipí", "💩 Popó", "✅ Limpio", "🔄 Mixto".

---

### ✅ SESIÓN 16 — Seed Semana 13-17 Abril (2026-04-18)

- **`seed_semana_13_17_abril.js`:** Datos de prueba realistas para 5 días.
  - `registro_entrada`: 121 registros (7:15–8:55am, flag `es_retardo`).
  - `registro_salida`: 121 registros (~3:00pm).
  - `asistencia`: 125 registros (25 alumnos × 5 días).
  - `bitacora_diaria`: 121 registros.
  - `registro_comida` y `registro_banio`: 121 registros cada uno.

---

### ✅ SESIÓN 15 — Seed Datos Reales (25 Alumnos) (2026-04-18)

- **`seed_datos_reales.js`:** 5 alumnos por grupo, nombres reales, CURP de referencia, edades correctas. Idempotente por CURP.
- **50 padres/madres con login:** `mama.X@` / `papa.X@happyschool.edu.mx`, contraseña `HappySchool2026!`.
- **25 personas autorizadas:** 1 por alumno (abuela/tía/tío).
- **`seed_personal_real.js`:** Directora, admin, 5 titulares, 2 auxiliares con nombres reales.

#### Bugs resueltos
- `GET /personal`: `WHERE p.deleted_at IS NULL` reventaba → `WHERE 1=1` (personal no tiene `deleted_at`).
- `GET /grupos`: no devolvía `maestra_nombre` → JOIN con `asignaciones_grupo` + `personal`.
- `Grupos.jsx`: `r.data.personal || []` → `r.data || []`.
- `grupo.capacidad_maxima` → `grupo.cupo_maximo` (nombre real del campo).

---

### ✅ SESIÓN 14 — StatCards + Turno de Puerta (2026-04-18)

- **4ª StatCard "Ausentes":** `UserX` roja. Grid de 3 → 4 columnas en Dashboard Miss.
- **Sistema Turno de Puerta:**
  - Migración `008_turno_puerta.sql`: tabla `turno_puerta` con UNIQUE(fecha, personal_id).
  - `backend/src/routes/turnos-puerta.js`: 4 endpoints (GET hoy, GET lista, POST asignar, DELETE).
  - `GET /asistencia/filtro-entrada`: si maestra tiene turno, `whereGrupo = ''` (ve todos los grupos).
  - `web/directora/TurnoPuerta.jsx`: date picker + lista asignadas + lista disponibles.
  - Dashboard Miss: banner morado "¡Hoy tienes turno de puerta! 🚪".

#### Bugs resueltos
- `rol_principal` está en `usuarios`, no en `personal`. `personal` usa `activo` no `deleted_at`.

---

### ✅ SESIÓN 13 — Filtro de Entrada + QR Scanner (2026-04-18)

- **`GET /asistencia/filtro-entrada`:** Todos los grupos con alumnos y estado de entrada del día.
- **`FiltroEntrada.jsx`:** Reloj en tiempo real, banner cumpleaños, stats, búsqueda, alumnos por grupo, modal checklist.
- **QR Scanner:** `html5-qrcode` → localiza alumno por UUID → abre modal automáticamente.
- **Nav y ruta:** `DoorOpen` en `MaestraLayout`, ruta `/maestra/filtro-entrada`.

---

### ✅ SESIÓN 12 — Mejoras Portal Padre (2026-04-18)

- **Bitácora Padre:** `<Navigate replace>` redirige automáticamente si el padre tiene un solo hijo.
- **Semáforo "Al Corriente":** si `saldo_pendiente > 0` y backend devuelve `semaforo: 'verde'`, se fuerza `amarillo` en cliente.
- **Orden jerárquico de recibos:** mes actual visible al abrir, meses anteriores detrás de "Ver todos (N)".

---

### ✅ SESIÓN 11 — Fix Fechas ISO + Cumpleaños (2026-04-17)

- **Bug `esCumpleanos`:** API devuelve fecha como ISO completo (`"2022-04-17T05:00:00.000Z"`). Sin `.substring(0,10)`, `new Date()` producía fecha inválida → siempre `false`.
- **Fix en 4 archivos:** `web/maestra/Dashboard.jsx`, `web/directora/Dashboard.jsx`, `web/maestra/Asistencia.jsx`, `mobile/(maestra)/qr-scanner.jsx`.
- **Regla documentada:** nunca concatenar fechas del API sin `.substring(0,10)` primero.

---

### ✅ SESIÓN 10 — Auditoría + Dashboard Padre (2026-04-17)

- IP hardcodeada `mobile/src/services/api.js` corregida.
- Auditoría duplicados `plantillas_whatsapp` / `configuracion_general` — sin deuda.
- **Dashboard Padre (web/mobile):** Tarjeta hijo como `<Link>`, eliminado "Ver bitácora completa →" redundante.
- **Alerta cumpleaños 🎂:** en FiltroEntrada QR (web + mobile) y Dashboard maestra.
- **Auditoría hardcoded:** 5 variables identificadas (ROLES, METODOS, TIPOS_CONCEPTO, TIPOS_DOC, DOC_REQUERIDOS).

---

### ✅ SESIÓN 9 — Vista Asistencia Directora (2026-04-17)

- **Vista Asistencia Directora:** tabla-matriz mensual con toggle Hoy/Mensual, navegador mes/año, totales por alumno.
- **`GET /asistencia/grupo/:id/mensual`:** agrupa por alumno con `dias: { 'YYYY-MM-DD': estado }`.
- **BUG CRÍTICO — Zona horaria UTC vs hora local:** `toISOString()` después de las 6pm México devuelve día siguiente. Fix backend: `COALESCE($n::date, CURRENT_DATE)`. Fix frontend: `new Date().toLocaleDateString('en-CA')`.

---

### ✅ SESIÓN 8 — Identidad Visual + Género Personal (2026-04-17)

- **Migración 006:** UNIQUE constraint `ciclos_escolares(nombre)` + `fix_duplicados_ciclos.js` (eliminó 6 duplicados).
- **Migración 007:** campo `genero VARCHAR(10)` en tabla `personal`.
- **Labels "Maestra" → "Miss/Teacher"** en web + mobile (10 archivos).
- **Emojis tono de piel claro 🏻** en 16 archivos.
- **Saludos dinámicos por género** (Miss/Teacher) y por parentesco (Mamá/Papá).
- **`authController.js`:** login/perfil incluyen `parentesco` y `genero`.

---

### ✅ SESIÓN 7 — Vistas Maestra y Padre (2026-04-17)

- **Dashboard Maestra:** stats, acciones rápidas, tabla alumnos con badges, refetch 30s.
- **PadreLayout:** sidebar completo, nav 4 secciones, esquema rojo.
- **Dashboard Padre:** tarjetas por hijo con `bitacora_hoy` embebida.
- **Bitácora Padre:** selector fecha ◄ ►, todas las secciones.
- **Pagos Padre:** semáforo, comida semanal, historial expandible por mes.
- **Calendario Padre:** grilla mensual + lista + modal de detalle.
- **`GET /alumnos/mis-hijos`:** incluye `bitacora_hoy` (LEFT JOIN `bitacora_diaria` + `registro_comida`).
- **`setup_padre_demo.js`:** bitácora, comida, baño, pagos y eventos para Ana.

---

## 🏗️ FASES FUNDACIONALES

### ✅ FASE 4 — Control de Pagos (2026-04-17)
- CRUD conceptos de pago configurables.
- Registro de pagos con recargo automático (día 6+).
- Dashboard financiero con semáforo (verde/amarillo/rojo/suspendido).
- Estado de cuenta por alumno — web y mobile padre.
- `GET /alumnos/mis-hijos`.
- Archivos: `backend/src/routes/pagos.js`, `web/directora/Pagos.jsx`, `mobile/(padre)/pagos.jsx`.

### ✅ FASE 3 — Bitácora y Módulos Completos (2026-04-16 / 2026-04-17)
- Bitácora maestra mobile — formulario completo (ánimo, baño, pañal, esfínteres, comida, tarea, salud, notas).
- Asistencia maestra mobile — semáforo en tiempo real (refresh 30s), modal manual.
- Backend personal — CRUD + asignación grupos + reset-password.
- Web personal — tarjetas con rol, grupos, badge primer login.
- Bitácora padre mobile — lectura con selector de fechas.
- AlumnoPerfil web — documentos, personas autorizadas, blacklist.
- Calendario completo — backend + web directora + mobile padre.
- Migración 002 — índices UNIQUE (curp, grupos, conceptos_pago).

### ✅ FASE 2 — Alumnos y Grupos (2026-04-16)
- `GET /alumnos/por-qr/:qrData`, `GET /grupos/mi-grupo`, `GET /reportes/dashboard`.
- `web/src/pages/directora/Alumnos.jsx` — CRUD completo.
- `backend/src/routes/bitacora.js` — GET, POST /guardar, POST /panial, POST /medicamento.
- Git init, GitHub repo: https://github.com/valreyesg/happy-school-app

### ✅ FASE 1 — Fundación (2026-04-16)
- Monorepo npm workspaces (backend + web) + mobile.
- Esquema PostgreSQL completo (50+ tablas, ENUMs, índices).
- Backend Node.js + Express: auth JWT con rotación de refresh tokens.
- Middleware: authenticate, authorize, errorHandler.
- Servicios: cloudinaryService, whatsappService (Twilio lazy init), qrService.
- Seed inicial: grupos, roles, 19 plantillas WhatsApp, categorías, config general.
- Web: paleta Happy School, CSS utilitario, 4 layouts, router completo.
- Web: authStore (Zustand + persist), api.js (axios + refresh auto).
- Mobile: authStore (SecureStore), Splash, Login, redirect por rol, QR Scanner completo.

---

## ✅ SESIÓN 64 — Panel Historial Egresados + Excel Export (Sprint 3)

**Fecha:** 2026-04-24 | **Estado:** Completado y validado

### 1. Backend: Endpoint de Egresados por Ciclo

**Archivo:** `backend/src/routes/ciclos.js` (líneas 444-474)
- `GET /ciclos/:id/egresados` — obtener alumnos egresados de un ciclo
- Query con JOINs: `inscripciones` → `alumnos` → `grupos` → `asignaciones_grupo` → `personal` (maestra) + `padres`
- Devuelve: id, nombre_completo, foto_url, fecha_nacimiento, grupo_nombre, nivel, maestra_nombre, padres (JSON array)
- Autorización: directora, administrativo
- Agrupa por alumno para evitar duplicados con múltiples padres

### 2. Frontend: Tab "Egresados" en CiclosEscolares

**Archivo:** `web/src/pages/directora/CiclosEscolares.jsx`
- Nuevo componente `TabEgresados` (líneas 590-691)
- Selector de ciclo (solo ciclos cerrados con `!c.activo`)
- Query lazy que se ejecuta solo cuando se selecciona ciclo (`enabled: !!cicloSeleccionado`)
- Tabla con 6 columnas: Foto+Nombre | Grupo | Nivel | Maestra | Fecha nacimiento | Tutor principal
- Muestra contador "X egresados en ciclo Y"
- Estado vacío si no hay registros
- 2 tabs en la página: "Ciclos Escolares" (original) | "Egresados" (nuevo)

### 3. Validación & Fixes

**Problema encontrado:** `exceljs` no estaba instalado en `backend/package.json`
- Ejecutar `npm install exceljs` en `backend/`
- El endpoint `GET /ciclos/:id/export` ya existía pero no funcionaba
- Tras instalar, Excel export funciona correctamente (2 hojas: Grupos/Maestras + Alumnos)

**Validación en browser:** Login → Directora → Ciclos → Tab Egresados (selector ciclo + tabla) ✅

### 4. Commits

- `474ec66` — feat: Sesión 64 — Panel Historial Egresados (Sprint 3)
- `f62ef09` — chore: Sesión 64 — Sprint 3 COMPLETADO
- `268f475` — chore: Instalar exceljs para exportación de ciclos en Excel

---

## ✅ SESIÓN XX+12 — QR MEJORADO + GESTIÓN USUARIOS PADRES (2026-04-29)

**Fecha:** 2026-04-29

**Archivos modificados:**
- `backend/src/routes/padres.js` — Email institucional, preview, GET mejorado
- `backend/src/controllers/authController.js` — Validación contraseña
- `web/src/pages/directora/Usuarios.jsx` — Tabs por nivel, agrupación, badges
- `web/src/pages/LoginPage.jsx` — Modal primer login
- `mobile/src/pages/PadreScreen.jsx` — QR padre real
- `web/src/App.jsx` — Ruta /perfil

**Bloques Implementados (7/7):**

1. ✅ Backend: qr_code_url en GET /alumnos/mis-hijos
2. ✅ Backend: Nueva ruta /padres (CRUD: crear-cuenta, activar, inactivar, reset-password)
3. ✅ Web: Fix bug QR parsing en FiltroEntrada (parsear HAPPYSCHOOL:ALUMNO:uuid)
4. ✅ Web: Scanner QR en FiltroSalida (botón naranja)
5. ✅ Web: Modal QR en Directora/Alumnos (generar/regenerar)
6. ✅ Mobile: Pantalla QR padre real (tabs + imagen 280x280)
7. ✅ Web: Nueva página /directora/usuarios (gestión padres: crear, activar, inactivar)

**Mejoras Detectadas y Resueltas:**

**Email Institucional Generado Automáticamente:**
- Función `limpiarNombre()`: Normaliza nombres con NFD, elimina acentos, convierte a lowercase, reemplaza espacios con underscores
- Función `generarEmailInstitucional(padreId)`: Genera `tutor_primer_nombre_hijo@happyschool.edu.mx` (tutor principal) o `nombre_completo_alumno@happyschool.edu.mx` (segundo tutor)
- Resuelve conflictos con sufijos numéricos (2, 3, 4) o timestamp fallback
- Endpoint `GET /padres/:id/preview-email`: Previsualiza email sin crear

**Dirección Pedagógica Correcta:**
- Cambio fundamental: Email personal del padre (en tabla `padres.email`) ≠ Email de cuenta del portal (en tabla `usuarios.email`)
- Email personal = datos de contacto, NO login
- Email institucional = username del portal, generado automáticamente

**Organización por Nivel y Grupo:**
- Query `GET /padres` ahora retorna `nivel_nombre`, `grupo_nombre`, `es_tutor_principal`
- Frontend agrupa padres por nivel (Maternal, Kinder 1, 2, 3) luego por grupo (A, B, C)
- Tabs de filtro basados en niveles (como Alumnos.jsx)
- Padres agrupados por alumno (mamá y papá juntos)

**Tarjetas de Padres Mejoradas:**
- Email institucional visible (no personal)
- Badges: nombre hijo (azul), grupo (púrpura), "👤 Principal" (verde) si es tutor principal
- Modal "Crear cuenta" muestra preview de email institucional

**Cambio de Contraseña al Primer Login:**
- Modal bloqueante obliga cambio antes de acceso
- Validación: 8 caracteres mínimo, incluye letras y números
- POST `PUT /auth/cambiar-password` con `passwordActual` y `passwordNuevo`

**Resumen Técnico:**

| Componente | Cambio |
|-----------|--------|
| Email generación | Algoritmo hash sobre primer nombre hijo + timestamp fallback |
| Validación password | `/[a-zA-Z]/` + `/[0-9]/` + 8 char mínimo |
| GET /padres | Incluye `nivel_nombre`, `grupo_nombre`, array `hijos` con es_tutor_principal |
| Frontend agrupación | `useMemo` agrupa por nivel → grupo |
| Badges | Mostrar nombre hijo, grupo, tutor principal indicator |

**Commits:**
- `67066a4` — feat: Sesión XX+11 — Integración Catálogos + Docs Tutores + Notificaciones + Categorías Eventos
- Sesión XX+12 validaciones implementadas dentro del mismo ciclo XX+13

---

## ✅ SESIÓN XX+13 — USUARIOS PADRES + CAMBIO CONTRASEÑA (2026-04-29)

**Fecha:** 2026-04-29

**Archivos modificados:**
- `backend/src/routes/padres.js` — Email institucional, preview, GET mejorado
- `backend/src/controllers/authController.js` — Validación contraseña
- `web/src/pages/directora/Usuarios.jsx` — Tabs por nivel, agrupación, badges
- `web/src/pages/LoginPage.jsx` — Modal primer login
- `web/src/pages/Perfil.jsx` — Página perfil + cambio contraseña
- `web/src/layouts/PerfilLayout.jsx` — Layout para perfil (NUEVO)
- `web/src/layouts/PadreLayout.jsx` — Link a "Mi Perfil"
- `web/src/App.jsx` — Ruta /perfil

**Bloques Implementados (12/12):**

1. ✅ Backend: Email institucional generado automáticamente (tutor_nombre@happyschool.edu.mx)
2. ✅ Backend: GET /padres/:id/preview-email para previsualizar antes de crear
3. ✅ Backend: POST /padres/:id/crear-cuenta usa email institucional
4. ✅ Backend: GET /padres retorna nivel, grupo, es_tutor_principal, hijos ordenados
5. ✅ Web: Tabs por Nivel (Maternal, Kinder 1, 2, 3)
6. ✅ Web: Padres agrupados por alumno (mamá y papá juntos)
7. ✅ Web: Tarjetas con badges (nombre hijo, grupo, "👤 Principal" si es tutor)
8. ✅ Web: Modal de cambio de contraseña al PRIMER LOGIN (bloqueante)
9. ✅ Web: Página /perfil con layout completo (sidebar, volver, logout)
10. ✅ Web: Opción cambiar contraseña en /perfil (accesible después)
11. ✅ Backend: Validación contraseña: 8 caracteres mínimo, letras y números
12. ✅ Web: Validación contraseña en cliente y servidor

**Resumen de Estado:**
- **Implementación:** 12/12 bloques ✅
- **Compilación:** 100% ✅
- **Validación funcional:** 100% ✅
  - Creación de cuentas de padres
  - Cambio de contraseña al primer login
  - Cambio de contraseña desde /perfil
  - Tabs y agrupación por nivel/grupo
  - Badges de tutor principal y grupo

**Mejoras Realizadas vs. XX+12:**
- Email institucional generado automáticamente (no reutiliza email personal)
- Tabs por nivel (como en Alumnos)
- Padres agrupados por alumno (mamá y papá juntos)
- Modal bloqueante de cambio contraseña al primer login
- Página /perfil accesible desde menú lateral
- Validación de contraseña: 8 caracteres, letras y números
- Layout consistente con el portal

**Resumen Técnico:**

| Componente | Cambio |
|-----------|--------|
| Email generación | Algoritmo hash sobre primer nombre hijo + timestamp fallback |
| Validación password | `/[a-zA-Z]/` + `/[0-9]/` + 8 char mínimo |
| GET /padres | Incluye `nivel_nombre`, `grupo_nombre`, array `hijos` con es_tutor_principal |
| Frontend agrupación | `useMemo` agrupa por nivel → grupo |
| Badges | Mostrar nombre hijo, grupo, tutor principal indicator |

**Commits:**
- `39c392d` — feat: Sesión XX+13 — Usuarios Padres + Cambio Contraseña (COMPLETADO)

---

## ✅ CATÁLOGOS DINÁMICOS — FASES 1-6 COMPLETADAS (Sesiones XX+6, XX+7, XX+8, XX+10, XX+11)

**Fecha:** 2026-04-29 | **Estado:** ✅ 6 FASES COMPLETADAS

**Resumen:** Sistema de catálogos dinámicos implementado en 6 fases. Backend endpoints, tablas BD, UI web para editar, hooks mobile y web con React Query. 4 catálogos principales operacionales: Niveles, Alergias, Parentesco, Categorías Eventos.

### FASES COMPLETADAS:

**FASE 1-3 — Backend endpoints + tablas (Sesiones XX+6, XX+7, XX+8)**
- Endpoints GET/PUT/DELETE catálogos
- Tablas dinámicas: niveles, animo, cuanto, comportamiento, condiciones_panial, parentesco, alergias, categorías_eventos
- Validaciones y soft-delete

**FASE 4 — Panel Directora UI (Sesión XX+7)**
- `Configuracion.jsx` → Tab "Catálogos"
- CRUD completo: crear, editar, desactivar, reactivar
- Cards por catálogo con estados

**FASE 5 — Hook `useCatalogo` web (Sesión XX+8)**
- React Query con staleTime 30 min
- Invalidación al guardar
- Fallback a constants si offline
- Integrado en 5+ componentes (Bitácora, Personal, Alumnos, Grupos, Ciclos)

**FASE 6 — Hook `useCatalogo` mobile (Sesión XX+10)**
- React Query + fallback constants
- Integrado en bitácora maestra, bitácora padre, dashboard padre
- 3/4 catálogos en mobile (Niveles, Alergias, Parentesco)

**SESIÓN XX+11 — Integración final**
- Docs INE tutores (foto, INE frente, INE reverso)
- Notificaciones expandidas a 12 tipos
- Parentesco dropdown en formularios
- Alergias multi-select
- Categorías Eventos UI en Calendario
- Integración completa de catálogos en todo el sistema

### Catálogos Operacionales:
- ✅ Niveles (Maternal, Prekinder, Kinder 1-3)
- ✅ Alergias (7 valores: Lactosa, Gluten, Maní, Huevo, Mariscos, Frutos secos, Sin alergias)
- ✅ Parentesco (8 valores: Mamá, Papá, Abuela/o, Tía/o, Tutor/a, Otro)
- ✅ Categorías Eventos (tabla propia, CRUD en Calendario)

### Próximas tareas (FASE 7):
- [ ] Auditoría hardcodeados (estatus, grados, roles, tipos pago, etc)
- [ ] Crear tablas dinámicas para catálogos nuevos
- [ ] Panel settings editable

---

## 🐛 BUGS HISTÓRICOS — NUNCA REPETIR

> Leer antes de escribir queries, rutas o cambios de schema.

| # | Bug | Causa raíz | Fix |
|---|-----|-----------|-----|
| 1 | **Renombrar columna sin audit** (sesión 23) | Faltó grep completo antes de migrar | `grep -r "nombre_columna" --include="*.{js,jsx}" . \| grep -v node_modules` antes de cualquier rename |
| 2 | **Fechas ISO del API** (sesión 11) | API devuelve ISO completo; sin `.substring(0,10)` → fecha inválida | SIEMPRE `.substring(0,10)` antes de parsear o comparar fechas del API |
| 3 | **Zona horaria UTC vs local** (sesión 9) | `toISOString()` después de 6pm → día siguiente | Backend: `CURRENT_DATE`. Frontend: `toLocaleDateString('en-CA')` |
| 4 | **Node.js no recarga rutas** (recurrente) | Proceso viejo en memoria | Matar procesos (`kill -9` / `taskkill`) ANTES de reiniciar |
| 5 | **Columnas inventadas en SELECT** (sesión 7) | Asumir columnas sin leer schema | Leer `001_schema_inicial.sql` de cada tabla antes de escribir queries |
| 6 | **Variables sin datos demo** (sesión 7) | Seed no crea datos de prueba para vistas nuevas | Crear `setup_<modulo>_demo.js` antes de pedir validación al usuario |
| 7 | **`deleted_at` en tabla `personal`** (sesión 15) | `personal` usa `activo`, no `deleted_at` | Verificar schema de cada tabla antes de filtrar |
| 8 | **Índice UNIQUE bloquea soft-delete** (sesión 33) | UNIQUE normal sin excluir `deleted_at IS NOT NULL` | Usar índice parcial: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` |
| 9 | **Stale closure en setTimeout** (sesión 36) | React captura valor viejo del estado antes del set | Construir objeto actualizado y pasarlo directamente al setTimeout |
| 10 | **Import named vs default** (sesión 37) | `{ api }` cuando el módulo exporta `export default` | Verificar tipo de export antes de importar |
| 11 | **`onSuccess` en `useQuery` RQ v5** (sesión 9) | RQ v5 eliminó `onSuccess`/`onError` de `useQuery` | Usar `useEffect([data])` para side effects; `onSuccess` solo en `useMutation` |
| 12 | **HTTP 304 Not Modified** (sesión 28) | Express cacheaba respuestas GET | Middleware: `Cache-Control: no-store, no-cache, must-revalidate` en `/api/` |
| 13 | **`cuanto_comio` en tabla equivocada** (sesión 7) | Columna existe en `registro_comida`, no en `bitacora_diaria` | JOIN a la tabla correcta; no asumir columnas por intuición |
| 14 | **Preview-promocion duplica por múltiples grupos** (sesión 33) | LEFT JOIN retornaba filas duplicadas con varios grupos por nivel | LATERAL + LIMIT 1 para tomar solo el primer grupo |

# PENDIENTES — Happy School App

**Última actualización:** 2026-04-29 — Sesión XX+15 | **Próximos pendientes:** Validación UX/UI (Sesión XX+15) + Cloudinary + QR Temporal
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## ✅ VALIDACIÓN UX/UI — FASES 1-5.1 (Sesiones XX+15/XX+16 — COMPLETADAS)

> **Estado:** IMPLEMENTADO — Cambios completados. PENDIENTE: Validación en browser + device por Valeria
> **Sesión:** XX+15/XX+16 — Homogenización web + componentes base mobile + ANIMO keys + AppShell paridad
> **Bloqueante:** NO — cambios solo de estilos y estructura, sin funcionalidad afectada

### ✅ Cambios implementados:

#### **WEB — TOKENS Y COLORES:**
- [x] **Agregados tokens:** `hs-blue` (#3B82F6) y `hs-orange` (#F97316) en web + mobile
- [x] **Sidebar Padre:** Corregido `bg-red-500` → `bg-hs-red` (nav, avatar, etiqueta, logout)
- [x] **Hovers:** 19 archivos actualizados `hover:bg-purple-700` → `hover:bg-hs-purple-dark`
- [x] **Botones azules:** 54+ instancias `bg-blue-*` → `bg-hs-blue` (acciones informativas)
- [x] **Botones naranjas:** 69 instancias `bg-orange-*` → `bg-hs-orange` (registrar vómito, medicamentos)
- [x] **SelectorCiclo:** Actualizado a `input-hs` (coherencia con otros inputs)
- [x] **Clases faltantes:** Definidas `.btn-hs-primary` y `.btn-hs-ghost` en index.css
- [x] **Labels:** Clases `.label-hs` y `.label-hs-section` agregadas

#### **MOBILE — COMPONENTES BASE:**
- [x] **theme.js:** Fuente única de verdad para colores (COLORS, RADIUS, SCREEN_BG)
- [x] **Button.jsx:** Componente reutilizable (variantes: primary, secondary, outline, ghost, danger)
- [x] **ModalSheet.jsx:** Componente reutilizable para modales mobile
- [x] **Modal.jsx (web):** Componente reutilizable para modales web

#### **FASE 3.5 — ANIMO keys:**
- [x] **padre/Bitacora.jsx:** Eliminadas 2 keys obsoletas (`energico`, `inquieto`) — quedan solo 5 correctas
- [x] **maestra/Dashboard.jsx:** `inquieto → irritable`, `energico → activo` en `EMOJIS_ANIMO`
- [x] **mobile/(maestra)/index.jsx:** Mismo reemplazo que Dashboard web

---

### 📋 CHECKLIST DE VALIDACIÓN EN BROWSER (por Valeria)

**Portal PADRE (http://localhost:5173/padre):**
- [ ] Sidebar rojo es el correcto (`#E53E3E`)
- [ ] Navegación activa se ve en púrpura
- [ ] Avatar es rojo correcto
- [ ] Botón "Añadir a Google Calendar" es azul correcto (`#3B82F6`)
- [ ] Banners informativos azules coherentes
- [ ] Todos los botones tienen color visible sin hover

**Portal MAESTRA (http://localhost:5173/maestra):**
- [ ] Botones "Registrar vómito" naranjas (`#F97316`)
- [ ] Botones "Administrar" naranjas coherentes
- [ ] Hovers suaves en botones púrpura

**Portal DIRECTORA (http://localhost:5173/directora):**
- [ ] SelectorCiclo (en Alumnos) se ve como los otros inputs
- [ ] Botones de modales púrpura con color visible
- [ ] Badges en AlumnoPerfil se ven coherentes
- [ ] Botón "Enviar aviso extraordinario" naranja correcto
- [ ] Todos los tabs tienen color de fondo visible

**FASE 3.5 — ANIMO keys (http://localhost:5173):**
- [ ] **Bitácora Padre:** Selector de ánimo muestra exactamente 5 opciones (Feliz 😊, Activo ⚡, Cansado 😴, Triste 😢, Irritable 😤) — sin `Enérgico` ni `Inquieto` duplicados
- [ ] **Dashboard Maestra:** Alumnos con ánimo `activo` muestran ⚡ (no vacío)
- [ ] **Dashboard Maestra:** Alumnos con ánimo `irritable` muestran 😤 (no vacío)

**FASE 4.4 — Button component mobile (en device/emulador):**
- [ ] **Dashboard Padre:** Botón "Añadir a Google Calendar" en modal evento es outline con color visible
- [ ] **Dashboard Padre:** Botón "Cerrar" modal evento es ghost con estilo claro
- [ ] **Bitácora Padre:** Botón "Ver referencia" (foto adjunta) es ghost small con estilo claro
- [ ] **Pagos Padre:** Botones `‹` y `›` de navegación mes son ghost small, `›` disabled en mes actual
- [ ] **Asistencia Maestra:** Botón "Cancelar" en modal es ghost
- [ ] **Asistencia Maestra:** Botón "Registrar" en modal es primary, muestra indicador cuando `saving`
- [ ] **Asistencia Maestra:** Filtros (Todos/Pendientes/Presentes) cambian de ghost a primary cuando activos

**GENERAL:**
- [ ] App se siente más homogénea visualmente
- [ ] NO hay botones invisibles esperando hover
- [ ] Colores primarios (púrpura, rojo, azul, naranja) consistentes
- [ ] Consola browser: SIN errores de Tailwind o CSS

**Conclusión:** ✅ Cuando hayas validado todos los items, confirmar aquí para cerrar validación.

---

## 📱 VALIDACIÓN MOBILE — device/emulador (por Valeria)

**FASE 4.4 — Button component (dispositivo físico o Expo):**
- [ ] **Dashboard Padre:** Botón "Añadir a Google Calendar" en modal evento es outline, color visible, tap sin lag
- [ ] **Dashboard Padre:** Botón "Cerrar" modal evento es ghost, tap responde
- [ ] **Bitácora Padre:** Botón "Ver referencia" (foto adjunta) es ghost small, tap abre modal foto
- [ ] **Pagos Padre:** Botones `‹` y `›` navegación mes son ghost small, `›` grayed out (disabled) en mes actual
- [ ] **Asistencia Maestra:** Modal registro manual — botón "Cancelar" es ghost, botón "Registrar" es primary
- [ ] **Asistencia Maestra:** Botón "Registrar" muestra spinner cuando `saving`, luego desaparece
- [ ] **Asistencia Maestra:** Filtros (Todos/Pendientes/Presentes) son ghost normalmente, cambian a primary cuando se tocan
- [ ] **General mobile:** Todos los botones nuevos tienen tamaño tocable (min 48px), sin text truncation

**Conclusión mobile:** ✅ Cuando hayas validado todos los items en device, confirmar aquí.

---

## 🔧 VALIDACIÓN APPSHELL — Paridad web (por Valeria en browser)

**FASE 5.1 — AppShell compartido (http://localhost:5173 en los 3 portales):**

**Portal PADRE (http://localhost:5173/padre):**
- [ ] Header SIEMPRE visible (antes solo en móvil) — contiene Menu hamburguesa, Logo móvil, NotificationBell
- [ ] NotificationBell visible en MÓVIL (nuevo — antes solo en desktop)
- [ ] NotificationBell visible en DESKTOP (confirmar sigue ahí)
- [ ] Sidebar rojo correcto con nav activo en rojo
- [ ] Sidebar toggle móvil funciona, logout responde
- [ ] NO hay topbar desktop separado (antes: `hidden lg:flex` con campanita)

**Portal MAESTRA (http://localhost:5173/maestra):**
- [ ] Header SIEMPRE visible (igual que antes — sin cambios) — Menu, Logo móvil, NotificationBell
- [ ] NotificationBell visible en MÓVIL Y DESKTOP (confirmar sigue igual)
- [ ] Sidebar verde correcto con nav activo en verde
- [ ] Sidebar toggle móvil funciona, logout responde

**Portal DIRECTORA (http://localhost:5173/directora):**
- [ ] Header SIEMPRE visible (antes solo en móvil) — contiene Menu hamburguesa, Logo móvil, NotificationBell
- [ ] NotificationBell visible en MÓVIL (NUEVO — antes ausente)
- [ ] NotificationBell visible en DESKTOP (NUEVO — antes ausente)
- [ ] Sidebar púrpura correcto con nav activo en púrpura
- [ ] Sidebar toggle móvil funciona, logout responde

**GENERAL (Los 3 portales):**
- [ ] Logout hover color consistente: fondo rojo claro + texto rojo (antes: Padre era hs-red/10)
- [ ] Footer con `space-y-2` entre avatar y botón logout (antes: solo en Padre)
- [ ] Responsive correcto: en móvil (< 1024px), el header y sidebar se comportan igual en los 3
- [ ] En desktop (≥ 1024px), el sidebar es sidebar (no se oculta), header visible, NotificationBell siempre visible
- [ ] Consola browser: SIN errores de clase Tailwind no reconocidas (ej: `bg-hs-red`, `text-hs-green`, etc.)

**Conclusión AppShell:** ✅ Cuando hayas validado todos los items, confirmar aquí para cerrar validación.

---

## 🎨 FASES UX/UI PENDIENTES — Próximas sesiones

> **Estado:** FASES 1-4.5 + 3.5 + 5.1 COMPLETADAS (Sesión XX+16)
> **Próximo:** FASE 4.5 (limpiar TODOs) + FASE 5 (refactores mayores)
> **Tiempo estimado:** 2-3 sesiones (limpieza + AppShell + modales)

### ✅ FASE 3.5 — ANIMO keys (COMPLETADA Sesión XX+16)

- Fuente de verdad confirmada: `feliz / activo / cansado / triste / irritable`
- Corregidos 3 archivos: `padre/Bitacora.jsx`, `maestra/Dashboard.jsx`, `mobile/(maestra)/index.jsx`
- Pendiente validación visual en browser (ver checklist arriba)

### ✅ FASE 4.4 — Aplicar componente Button en mobile (COMPLETADA Sesión XX+16)

**Botones migrados (7 total):**
- [x] `(padre)/index.jsx` — 3 botones: Google Calendar (outline), Cerrar modal (ghost), Ver referencia (ghost sm)
- [x] `(padre)/pagos.jsx` — 2 botones: navegación mes anterior/siguiente (ghost sm)
- [x] `(maestra)/asistencia.jsx` — 3 botones: Cancelar (ghost), Registrar (primary + loading), Filtros (variant condicional)

**Archivos modificados:**
- ✅ `mobile/app/(padre)/index.jsx` — 3 botones migrados + import
- ✅ `mobile/app/(padre)/pagos.jsx` — 2 botones migrados + import + limpiar TouchableOpacity del import
- ✅ `mobile/app/(maestra)/asistencia.jsx` — 3 botones migrados + import

**Pendiente validación en device/emulador (por Valeria)**

### ✅ FASE 4.5 — Limpiar comentarios obsoletos (COMPLETADA Sesión XX+16)

- Sin TODOs encontrados en mobile/FASES 4.x — código ya estaba limpio

### ✅ FASE 5.1 — Extraer AppShell compartido (web) (COMPLETADA Sesión XX+16)

**Cambios ejecutados:**
- [x] Creado `web/src/layouts/AppShell.jsx` — estructura unificada para los 3 portales
- [x] Refactorizado `PadreLayout.jsx` (22 líneas, -88 líneas duplicadas)
- [x] Refactorizado `MaestraLayout.jsx` (20 líneas, -89 líneas duplicadas)
- [x] Refactorizado `DirectoraLayout.jsx` (25 líneas, -86 líneas duplicadas)

**Paridad alcanzada:**
- Header siempre visible en los 3 portales (antes: Padre solo móvil, Directora solo móvil)
- NotificationBell visible móvil + desktop en los 3 (antes: Padre desktop solo, Directora ausente)
- Logout hover color consistente: `hover:bg-red-50 hover:text-red-500` en los 3
- Footer con `space-y-2` en los 3 (antes: solo en Padre)
- Código duplicado eliminado: ~126 líneas (330 → 240 total)

**Pendiente validación en browser (ver checklist "VALIDACIÓN APPSHELL" arriba)**

> Sin TODOs encontrados en mobile/FASES 4.x — código limpio

### ✅ FASE 5.1 — Extraer AppShell compartido (web) (COMPLETADA Sesión XX+16)

**Cambios ejecutados:**
- [x] Creado `web/src/layouts/AppShell.jsx` — estructura unificada para los 3 portales
- [x] Refactorizado `MaestraLayout.jsx` — usa AppShell con `accentColor="hs-green"`
- [x] Refactorizado `PadreLayout.jsx` — usa AppShell con `accentColor="hs-red"`
- [x] Refactorizado `DirectoraLayout.jsx` — usa AppShell con `accentColor="hs-purple"`

**Paridad alcanzada:**
- ✅ Header siempre visible en los 3 portales (antes: Padre solo móvil, Directora solo móvil)
- ✅ NotificationBell visible en móvil + desktop en los 3 (antes: Padre desktop solo, Directora ausente)
- ✅ Mismo logout hover color en los 3 (antes: Padre `hs-red/10`, otros `red-50`)
- ✅ Footer con `space-y-2` en los 3 (antes: solo en Padre)
- ✅ Código duplicado eliminado: ~90 líneas por layout

**Pendiente validación en browser (por Valeria)**

### 📋 FASE 5 — Refactores mayores (PRÓXIMAS SESIONES)

> Tiempo: 4-8 horas | Riesgo: MEDIO-ALTO

**FASE 5.2 — Migrar modales web a Modal.jsx:**
- [ ] Identificar todos los modales (15+ archivos)
- [ ] Migrar uno por uno a usar componente Modal
- [ ] Testing individual de cada modal

**FASE 5.2 — Migrar modales web a Modal.jsx:**
- [ ] Identificar todos los modales (15+ archivos)
- [ ] Migrar uno por uno a usar componente Modal
- [ ] Testing individual de cada modal

**FASE 5.3 — Decisión sobre NativeWind mobile:**
- [ ] Opción A (recomendada): Eliminar NativeWind, quedarse con StyleSheet + theme.js
- [ ] Opción B: Adoptar NativeWind completamente (20+ horas, refactor mayor)

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
- [ ] Cualquier `uploadToCloudinary()` en el sistema

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

### 🗂️ CATÁLOGOS DINÁMICOS — FASE 7 PENDIENTE (Auditoría Hardcoded + Settings)

Ver FASES 1-6 completadas en [ARCHIVE_LOG.md](ARCHIVE_LOG.md)

- [ ] **Auditoría Hardcoded:** Scan profundo → Estatus, Grados, Roles, Tipos Pago, Motivos Salida, Emojis, etc.
  - Identificar arrays hardcodeados en componentes
  - Priorizar por frecuencia de uso
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

---

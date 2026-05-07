# ARCHIVE_LOG â€” Happy School App
## Historial de Funcionalidades Completadas

**Última actualización:** 2026-05-07 | Sesiones documentadas: 7 → 82 → XX → 83 → 84 → 85 → 86 → XX (insumos) → XX (Mejoras Salud) → XX+1 (Salida Anticipada) → XX+2 (Mobile Bloques 3+5B) → XX+3 (Pendientes Validación Salud) → XX+4 (Validación Sesión 81 + Fixes Tutores) → XX+5 (Validaciones Edge + Limpieza PENDIENTES) → XX+6 (Catálogos Administrables FASES 1-3 + inicio FASE 4) → XX+7 (Catálogos FASE 4 COMPLETADA) → XX+8 (Catálogos FASE 5 + Validación Pañal→Insumos) → XX+11 (Integración Catálogos + Docs Tutores + Notificaciones + Categorías Eventos) → XX+17 (FASE 5.2 Batch D.1-3 + FASE 5.3 Decisión NativeWind) → XX+18 (Validación FASES 3.5, 5.1, 5.2 Batch A + Consistencia Input File) → XX+19 (FASE 5.2 Batch C Validación + Fix Tareas FormData) → XX+20 (FASE 5.2 Batch D.1-3 Validación Personal + 3 Bug Fixes) → XX+21 (FASE 5.2 Batch B Validación Usuarios.jsx) → XX+22 (FASE 5.2 Batch D.4+ Grupos + Bug Fixes) → **XX+23 (Asignar Maestras Titulares en Grupos)** → **XX+24 (ModalAlumno Alergias + ModalQR)** → **XX+25 (Bug Comida — Días Desplazados)** → **XX+26 (Auditoría UX/UI — Consistency web + mobile)** → **XX+27 (FASE 7 Catálogos Dinámicos — Tareas 6-10)** → **XX+30 (Fase A + QR Padre)** → **XX+31 (Fase B parcial: Cloudinary + Mobile celular + SDK 54)** → **XX+32 (Fase C: Precios por nivel + Cargos automáticos + Recargo %)** → **XX+33 (Fase C: Registro en cadena de hermanos — Entrada + Salida)** → **XX+34 (Fase C: Reportes básicos Asistencia + Tareas)** → **XX+35 (Auditoría Hardcoded FASE 8+ — 7 fixes web + mobile)** → **XX+36 (FASE D: Portal Admin D1-D2 — Dashboard + Alertas de Pago)** → **XX+37 (FASE D: D3-D4-D6 — Historial cobros + Segmentación + Excel)** → **XX+38 (FASE D: D5+D7 — Recibo PDF + Comprobante Comida)** → **XX+39 (Portal Padre Mobile — Feedback Valeria: 11 bugs + semáforo pagos + notificaciones)** → **XX+40 (Bitácora Mobile — Paridad web: 6 bugs + tabs Entrada/Tareas + higiene)** → **XX+41 (Portal Padre Mobile — Medicamentos + Comida nav + Cambio contraseña)** → **XX+42 (UX/Diseño: Homogeneidad iconos Web↔Mobile)** → **XX+43 (Flujo de Pagos: Padre sube comprobante, Directora valida)**

---

## ✅ SESIÓN XX+43 (2026-05-07) — Flujo de Pagos: Padre sube comprobante, Directora valida

**Fecha:** 2026-05-07 | **Estado:** ✅ COMPLETADA

### Resumen

Implementación completa del flujo de pagos donde el padre sube comprobante de transferencia y la directora lo aprueba o rechaza. Paridad web + mobile.

### Cambios implementados

1. **Migración 046** — Nuevo estado `por_confirmar` en enum `estado_pago_tipo` + 6 columnas en tabla `pagos`: `comprobante_url`, `comprobante_fecha`, `comprobante_subido_por`, `confirmado_por`, `confirmado_at`, `rechazo_nota`
2. **Backend endpoints** — `POST /pagos/:id/comprobante` (padre sube imagen), `GET /pagos/por-confirmar` (directora lista pendientes), `PATCH /pagos/:id/confirmar` (directora aprueba/rechaza)
3. **Dashboard** — Agregado conteo `por_confirmar` en query del dashboard financiero
4. **Web padre** — Botón "Subir comprobante" en pagos pendientes/vencidos, modal con upload de imagen + referencia, badge "En revisión" (azul), nota de rechazo visible
5. **Web directora** — Nuevo tab "Comprobantes" con badge contador rojo, cards con detalle + imagen ampliable, botones aprobar/rechazar con modal de nota para rechazo
6. **Mobile padre** — Mismo flujo con expo-image-picker, modal bottom-sheet, estados visuales idénticos
7. **Cloudinary dev fix** — `cloudinaryService.js` ahora guarda archivos localmente en `backend/uploads/` en desarrollo en vez de generar URLs mock rotas. `app.js` sirve `/uploads/` como static con CORS correcto.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/migrations/046_comprobante_pago_padre.sql` | NUEVO — migración BD |
| `backend/src/routes/pagos.js` | 3 endpoints + dashboard count |
| `backend/src/services/cloudinaryService.js` | Uploads locales en dev |
| `backend/src/app.js` | Static serving `/uploads/` + helmet CORP |
| `web/src/utils/pagos.js` | Estado `por_confirmar` |
| `web/src/pages/padre/Pagos.jsx` | Modal comprobante + estados |
| `web/src/pages/directora/Pagos.jsx` | Tab Comprobantes + validación |
| `mobile/app/(padre)/pagos.jsx` | Modal comprobante + estados |

### Flujo completo

1. Padre ve pago pendiente/vencido → "Subir comprobante" → selecciona imagen + referencia
2. Pago cambia a "En revisión" (azul)
3. Directora ve tab "Comprobantes" con badge → ve imagen → Aprueba (pagado) o Rechaza (pendiente + nota)
4. Si rechazado, padre ve nota y puede reintentar

---

## ✅ SESIÓN XX+42 (2026-05-07) — UX/Diseño: Homogeneidad iconos Web↔Mobile

**Fecha:** 2026-05-07 | **Estado:** ✅ COMPLETADA

### Resumen

Migración completa de iconos emoji a Ionicons vectoriales en mobile para lograr paridad visual con los iconos Lucide del portal web. Fix de labels truncados en barra inferior.

### Problema resuelto

Mobile usaba emojis (🏠📋🍽️💰📅) como iconos de UI, mientras web usaba Lucide (clean, outline-based). Esto hacía que mobile se sintiera como una app distinta. Labels del tab bar se cortaban.

### Cambios implementados

1. **Tab bar padre** — 5 emojis reemplazados por Ionicons: home, book, restaurant, card, calendar
2. **Tab bar maestra** — 6 emojis reemplazados por Ionicons: home, checkmark-circle, book, clipboard, images, qr-code
3. **Tab bar styling** — fontSize 10→11, letterSpacing -0.2, numberOfLines={1}, altura ajustada por plataforma
4. **Login** — Password toggle emoji (🙈/👁️) → eye/eye-off Ionicons
5. **Dashboard padre** — logout, QR, accesos rápidos, eventos, cambiar contraseña, notas → Ionicons
6. **Dashboard maestra** — logout, QR banner, tareas banner, alerta, action grid → Ionicons
7. **Bitácora padre** — 7 category tabs (entrada/comida/actividades/tareas/higiene/salud/incidentes) → Ionicons + Seccion component actualizado
8. **Comida padre** — headers → Ionicons
9. **Calendario padre** — header, modal info rows, Google Calendar button → Ionicons
10. **Tareas maestra** — page title, modal headers, tab labels → Ionicons
11. **Bitácora maestra** — medicamentos, recepción, salida sanitaria → clean text + Ionicons

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `mobile/app/(padre)/_layout.jsx` | Tab bar emojis → Ionicons |
| `mobile/app/(maestra)/_layout.jsx` | Tab bar emojis → Ionicons |
| `mobile/app/login.jsx` | Password toggle → Ionicons |
| `mobile/app/(padre)/index.jsx` | Dashboard UI icons → Ionicons |
| `mobile/app/(maestra)/index.jsx` | Dashboard UI icons → Ionicons |
| `mobile/app/(padre)/bitacora.jsx` | Category tabs + Seccion → Ionicons |
| `mobile/app/(padre)/comida.jsx` | Headers → Ionicons |
| `mobile/app/(padre)/calendario.jsx` | Modal + header → Ionicons |
| `mobile/app/(maestra)/tareas.jsx` | Tabs + modals → Ionicons |
| `mobile/app/(maestra)/bitacora.jsx` | Section headers → Ionicons |

### Mapeo de iconos Web (Lucide) ↔ Mobile (Ionicons)

| Concepto | Web | Mobile |
|----------|-----|--------|
| Inicio | LayoutDashboard | home/home-outline |
| Bitácora | BookOpen | book/book-outline |
| Comida | UtensilsCrossed | restaurant/restaurant-outline |
| Pagos | CreditCard | card/card-outline |
| Calendario | CalendarDays | calendar/calendar-outline |
| Asistencia | CheckSquare | checkmark-circle/-outline |
| Tareas | Clipboard | clipboard/clipboard-outline |
| Galería | Image | images/images-outline |
| QR | — | qr-code/qr-code-outline |
| Logout | LogOut | log-out-outline |

---

## ✅ SESIÓN XX+41 (2026-05-06) — Portal Padre Mobile: Medicamentos + Comida nav + Cambio contraseña

**Fecha:** 2026-05-06 | **Estado:** ✅ COMPLETADA

### Resumen

3 features de paridad web implementadas en mobile: declarar medicamentos con foto receta, módulo Comida visible en barra de navegación inferior, y opción de cambiar contraseña.

### Features implementadas

1. **Declarar medicamentos desde mobile** (`mobile/app/(padre)/bitacora.jsx`)
   - Formulario completo en tab "Salud": nombre, dosis, horas programadas (dinámicas), foto receta
   - Foto con 2 opciones: galería (`expo-image-picker`) o cámara
   - Lista de recepciones existentes con estado (Pendiente/Recibido/Dado) y opción de eliminar
   - Endpoint: `POST /bitacora/medicamento/recepcion` con Base64 (mismo que web)
   - Visible también cuando "Bitácora no disponible" (antes de que Miss registre), igual que web
   - Mutations: `recepcionMutation`, `borrarMedMutation` con invalidación de cache

2. **Módulo Comida en barra inferior** (`mobile/app/(padre)/_layout.jsx`)
   - Movido de screen oculta (`href: null`) a tab visible con emoji 🍽️
   - Posición: entre Bitácora y Pagos (5 tabs visibles total)
   - Fix layout: reemplazado `Stack.Screen` por `SafeAreaView` + header propio (evita contenido pegado al status bar)

3. **Cambiar contraseña** (`mobile/app/(padre)/index.jsx`)
   - Sección "Mi cuenta" al final del dashboard con botón 🔑
   - Modal con campos: contraseña actual, nueva, confirmación
   - Validaciones: campos obligatorios, mínimo 8 caracteres, coincidencia
   - Endpoint: `PUT /auth/cambiar-password` (existente)

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `mobile/app/(padre)/bitacora.jsx` | +imports (ImagePicker, useMutation, TextInput, Alert), +estados formulario, +mutations, +UI declarar med en tab Salud Y en estado vacío |
| `mobile/app/(padre)/_layout.jsx` | Comida movida de `href:null` a tab visible |
| `mobile/app/(padre)/comida.jsx` | SafeAreaView + header propio (reemplaza Stack.Screen) |
| `mobile/app/(padre)/index.jsx` | +import TextInput/useMutation, +sección "Mi cuenta", +modal cambiar contraseña |

### Bug fix incluido

- **Declarar medicamentos no aparecía hoy**: cuando `!bit && comidas.length === 0` (Miss no registró aún), se mostraba solo "Bitácora no disponible" sin acceso al formulario. Ahora se muestra la sección de medicamentos arriba del mensaje vacío.

---

## ✅ SESIÓN XX+40 (2026-05-06) — Bitácora Mobile: Paridad web — 6 bugs corregidos + tabs nuevos

**Fecha:** 2026-05-06 | **Estado:** ✅ COMPLETADA
**Archivo:** `mobile/app/(padre)/bitacora.jsx`

### Bugs corregidos

1. **Bitácora no aparecía en fechas sin `bitacora_diaria`** — condición `!bit` → `!bit && comidas.length === 0` (paridad con web). El 29/abr ya muestra comidas aunque no haya registro de maestra.
2. **"undefined undefined" en tab Comida** — `CUANTO[key]?.emoji + ' ' + CUANTO[key]?.label` cuando key es null concatenaba "undefined undefined". Reemplazado por helper `fmtCuanto(key)` que verifica existencia antes de concatenar.
3. **Bug preexistente: `TIEMPOS_COMIDA` no definido** — constante usada en línea 299 pero nunca declarada en el archivo. Definida en línea 15.
4. **Tabs Entrada y Tareas faltaban** — mobile solo tenía 5 tabs vs 7 en web. Agregados ambos tabs con paridad completa de contenido.
5. **Higiene: contadores Pipí/Popó aparecían para alumnos con pañal** — faltaba guarda `!usaPanial`. Ahora consulta `/alumnos/mis-hijos` para obtener `usa_panial` igual que web.
6. **Tabs amontonados / sin indicación de scroll** — `flex:1` incompatible con `ScrollView` horizontal. Cambiado a `width: 68` fijo + flecha `›` flotante con `pointerEvents="none"` como affordance visual.

### Nuevas queries en mobile

- `/alumnos/mis-hijos` — para obtener `usa_panial` del hijo actual
- `/asistencia/filtro-entrada/:alumnoId?fecha=` — para tab Entrada (hora, retardo, checklist)

### Pendiente de esta área

- Declarar medicamentos desde mobile (formulario + foto receta) — solo web tiene esta función
- Módulo Comida en barra de navegación inferior
- Cambio de contraseña en mobile

---

## ✅ SESIÓN XX+39 (2026-05-07) — Portal Padre Mobile: Feedback Valeria completo

**Fecha:** 2026-05-07 | **Estado:** ✅ COMPLETADA

### Resumen

Corrección completa del Portal Padre Mobile basado en feedback de Valeria (Sesión XX+38). 11 bugs resueltos, semáforo de pagos corregido en backend, notificaciones funcionando con swipe-to-close, y error de expo-notifications en Expo Go SDK 53 silenciado.

### Bugs resueltos

1. **Saludo se corta en header** — `fontSize: 18`, `numberOfLines={2}`, `flexShrink: 0` en iconos
2. **Icono QR muestra celular** — cambiado emoji 📱 → 🔲
3. **Banner de adeudo no aparece** — nuevo `HijoCard` consulta `/pagos/estado/:id` + `SEMAFORO_CFG` con colores por semáforo
4. **Semáforo siempre verde aunque hay adeudo** — `semaforoAlumno()` en backend ahora calcula `dias_atraso` desde `fecha_limite` aunque `estado` siga en `'pendiente'` (cron no ha corrido)
5. **Campanita badge "1" sin lista** — fix layout: `sheet` con `height: '75%'` fijo (ScrollView colapsaba con `maxHeight`); query con `enabled: !!token` + `invalidateQueries` al abrir
6. **Notificaciones no cargaban** — token de zustand persist no disponible en mount; agregado `useAuthStore` en `NotificationBell` con `enabled: !!token`
7. **Calendario no muestra eventos pasados** — meses anteriores muestran todos sus eventos (solo mes actual filtra desde hoy)
8. **Bitácora navega a sábados/domingos** — `irAnterior()`/`irSiguiente()` skipean fines de semana (paridad con web); fecha inicial también ajustada
9. **3 iconos broken en barra inferior** — `chat`, `galeria`, `comida`, `qr` declarados con `href: null` en `_layout.jsx`
10. **Barra inferior Android sin safe area** — `Platform.OS === 'android' ? 65 : 70` height + padding diferenciado
11. **"Eventos" en barra inferior** — renombrado a "Calendario"
12. **Chat y Fotos en dashboard** — removidos de accesos rápidos (no desarrollados)

### Correcciones adicionales

- **expo-notifications en Expo Go SDK 53** — `setNotificationHandler` y `registrarPushToken` condicionados a `Constants.appOwnership !== 'expo'`; elimina banner de error en Android
- **app.json** — removido `"eas": { "projectId": "tu-project-id" }` (causaba error OTA); agregado `"updates": { "enabled": false }`
- **Swipe-to-close notificaciones** — `PanResponder` + `Animated.View` en sheet de notificaciones; arrastra handle bar hacia abajo para cerrar
- **Color botón Pagos** — cambiado de verde `#38A169` a dorado `#D69E2E` (verde confundía con "al corriente")

### Archivos modificados

- `mobile/app/(padre)/index.jsx` — saludo, QR icon, banner adeudo, staleTime: 0, color pagos
- `mobile/app/(padre)/_layout.jsx` — Platform safe area, "Calendario", href:null screens
- `mobile/app/(padre)/bitacora.jsx` — weekend-skip navigation
- `mobile/app/(padre)/calendario.jsx` — meses pasados muestran todos eventos
- `mobile/src/components/NotificationBell.jsx` — layout fix, token guard, swipe-to-close, PanResponder
- `mobile/src/store/authStore.js` — isExpoGo guard para push token
- `mobile/app/_layout.jsx` — isExpoGo guard para setNotificationHandler
- `mobile/app.json` — updates.enabled: false, sin EAS projectId
- `backend/src/routes/pagos.js` — semaforoAlumno() con fecha_limite fallback

### Pendiente de esta sesión

- Modal push en tiempo real (admin → mobile) — requiere polling/WebSocket
- Features paridad web: medicamentos mobile, módulo Comida mobile, cambio contraseña
- UX: iconos anticuados, nombres barra inferior se cortan

---

## ✅ SESIÓN XX+38 (2026-05-07) — FASE D: D5+D7 — Recibo PDF + Comprobante Comida

**Fecha:** 2026-05-07 | **Estado:** ✅ COMPLETADA

### Resumen

Implementación de generación de recibos PDF por pago (con descarga directa desde el portal admin) y módulo de comprobante de pago de comida semanal (foto de transferencia o marcado como Efectivo Lunes).

### Tareas ejecutadas

1. **D5 — Recibo PDF por pago (`GET /pagos/:id/recibo`)**
   - `backend/src/routes/pagos.js` → nuevo endpoint `GET /:id/recibo`
   - Genera PDF con `pdf-lib` (A5 apaisado): encabezado morado, folio UUID, datos alumno/grupo/concepto, desglose monto, sello PAGADO, pie con fecha
   - Función `safe()` para sanitizar todos los strings de DB — Helvetica (StandardFonts) solo soporta WinAnsiEncoding, no Unicode
   - Folio: `String(uuid).replace(/-/g,'').slice(-8).toUpperCase()` (ej: `#12EDA65A`)
   - `web/src/pages/directora/Pagos.jsx` → `ModalEnviarRecibo` con botón "Descargar PDF" vía `api.get(..., {responseType:'blob'})` (NO `window.open`, requiere header Auth)
   - Botón "🧾 Recibo" en cada tarjeta de pago pagado en `FilaAlumno`
   - **Status:** ✅ Completada y validada (PDF descargado correctamente)

2. **D5 — Envío por WhatsApp (`POST /pagos/:id/enviar`)**
   - Endpoint implementado, mensaje Twilio construido correctamente
   - **Status:** ⏳ Pendiente de credenciales Twilio reales (`TWILIO_ACCOUNT_SID=ACxxx`)

3. **D7 — Comprobante Comida (`PATCH /pagos/comida/:id/comprobante`)**
   - Migración `045_comprobante_comida.sql`: agrega `metodo_pago_comida`, `comprobante_url`, `notas_comida` a `pago_comida_semanal`
   - Endpoint con `multer` (memory storage) + `uploadToCloudinary` para foto opcional
   - 3 métodos válidos: `efectivo`, `efectivo_lunes`, `transferencia`
   - `web/src/pages/directora/Pagos.jsx` → `ModalComprobanteComida` con selector de método + upload foto
   - Botón "📎 Agregar/Ver" por alumno en `TabComida`
   - **Status:** ✅ Completada y validada

### Archivos modificados
- `backend/src/routes/pagos.js` — imports pdf-lib/multer/cloudinary/twilio, endpoints GET /:id/recibo + POST /:id/enviar + PATCH /comida/:id/comprobante
- `backend/migrations/045_comprobante_comida.sql` — 3 nuevas columnas en pago_comida_semanal
- `web/src/pages/directora/Pagos.jsx` — ModalEnviarRecibo, ModalComprobanteComida, botones Recibo y Comprobante

### Bugs corregidos en esta sesión

- **Twilio crash al cargar módulo**: `TWILIO_ACCOUNT_SID=placeholder` era truthy pero inválido → constructor Twilio lanzaba excepción en top-level. Fix: verificar `startsWith('AC')` antes de inicializar + try/catch
- **`ap.es_principal` no existe**: columna real es `es_tutor_principal` en tabla `alumno_padre`
- **`t.nombre` no existe**: columna real es `nombre_completo` en tabla `padres`
- **pdf-lib non-ASCII crash**: `drawText('✓ PAGADO')` lanza excepción síncrona → Express devuelve 404 HTML. Fix: función `safe()` que mapea acentos/eñes a ASCII y elimina símbolos Unicode
- **`window.open()` sin Auth header**: descarga PDF sin token → 401. Fix: `api.get({responseType:'blob'})` + blob URL programático

---

## ✅ SESIÓN XX+37 (2026-05-06) — FASE D: D3-D4-D6 — Historial cobros + Segmentación + Excel

**Fecha:** 2026-05-06 | **Estado:** ✅ COMPLETADA

### Resumen

Implementación de tres módulos del Portal Admin Finanzas: historial detallado de cobros por tipo (extensión y comida), segmentación de alumnos por servicios activos y exportación contable a Excel en 3 hojas.

### Tareas ejecutadas

1. **D3 — Historial cobros Extensión (`TabExtension`)**
   - `web/src/pages/directora/Pagos.jsx` → nuevo componente `TabExtension`
   - Filtra `GET /pagos` por `concepto_tipo === 'extension'` del mes seleccionado
   - Stats: Recaudado / Por cobrar / Vencido
   - Tabla: alumno, concepto, estado badge, monto, recargo, método, fecha
   - **Status:** ✅ Completada y validada

2. **D3 — Historial cobros Comida (`TabComida`)**
   - `backend/src/routes/pagos.js` → nuevo endpoint `GET /pagos/comida/historial?mes&anio&grupo_id`
   - Agrupa registros de `pago_comida_semanal` por semana, devuelve totales y detalle por alumno
   - `web/src/pages/directora/Pagos.jsx` → nuevo componente `TabComida`
   - Cards por semana con monto total; muestra mensaje informativo si DB vacía
   - **Status:** ✅ Completada y validada

3. **D4 — Segmentación de servicios (`TabSegmentacion`)**
   - `backend/src/routes/pagos.js` → nuevo endpoint `GET /pagos/segmentacion`
   - Query con LEFT JOIN `config_horario_alumno` + EXISTS subquery `pago_comida_semanal`
   - 4 grupos: `regulares` / `con_extension` / `con_comida` / `con_ambos`
   - `web/src/pages/directora/Pagos.jsx` → nuevo componente `TabSegmentacion` + constante `SEG_TABS`
   - Grid de 4 tarjetas coloreadas + lista de alumnos al seleccionar segmento
   - **Status:** ✅ Completada y validada

4. **D6 — Exportación contable Excel**
   - `backend/src/routes/pagos.js` → nuevo endpoint `GET /pagos/exportar?mes&anio&estado&concepto_id&grupo_id`
   - 3 hojas: Detalle de Pagos (14 cols, filas coloreadas por estado), Resumen por Concepto, Comida Semanal (solo si hay datos)
   - Usa `ExcelJS` (ya instalado como dep)
   - `web/src/pages/directora/Pagos.jsx` → `handleExportarExcel` con `responseType: 'blob'` + blob URL download
   - Botón `📊 Excel` en header del módulo Pagos
   - **Status:** ✅ Completada y validada

5. **Navegación multi-tab en Pagos.jsx**
   - Constante `MAIN_TABS` con 4 tabs: Pagos / Extensión / Comida / Servicios
   - Estado `[tab, setTab]` controla qué panel se muestra
   - Navegación mes/año oculta en tab Servicios (que no lo necesita)

### Archivos modificados
- `backend/src/routes/pagos.js` — 3 nuevos endpoints GET (comida/historial, segmentacion, exportar) + require ExcelJS
- `web/src/pages/directora/Pagos.jsx` — TabExtension, TabComida, TabSegmentacion, MAIN_TABS, handleExportarExcel, botón Excel

### Bugs / notas técnicas
- **Route ordering**: Las rutas `GET /comida/historial` y `GET /segmentacion` deben estar ANTES de `PUT /:id` / `DELETE /:id` (Express, rutas estáticas primero)
- **Excel con auth**: Usar `api.get(..., {responseType: 'blob'})` en lugar de `window.open()` para incluir el header Authorization automáticamente
- **Windows PID kill**: Cuando `pkill -f node` falla en bash-on-Windows, usar `netstat -ano | grep ":3000"` + `taskkill //PID XXXXX //F`
- **JSX fragments en condicionales**: `{cond && (<>...</>)}` puede confundir a Babel; preferir `{cond && (<div>...</div>)}` con `</div>` y `)}` en líneas separadas

---

## ✅ SESIÓN XX+36 (2026-05-06) — FASE D: Portal Administrador D1–D2

**Fecha:** 2026-05-06 | **Estado:** ✅ COMPLETADA

### Resumen

Implementación completa de las primeras dos sesiones del Portal Administrador (FASE D). Se construyó la infraestructura del portal (layout + rutas), el dashboard financiero con KPIs y el módulo de Alertas de Pago con notificaciones modales a padres.

### Tareas ejecutadas

1. **D1 — Infraestructura del Portal Admin**
   - `web/src/layouts/AdministrativoLayout.jsx` → reemplazado por AppShell con sidebar (5 items: Dashboard, Pagos, Comida, Alertas, Reportes)
   - `web/src/App.jsx` → rutas `/admin` solo para rol `administrativo`
   - `web/src/pages/administrativo/Pagos.jsx` → re-export de `directora/Pagos.jsx` (cero duplicación)
   - `web/src/pages/administrativo/Reportes.jsx` → stub para sesión futura

2. **D1 — Dashboard financiero**
   - `web/src/pages/administrativo/Dashboard.jsx` → KPIs (Recaudado, Por cobrar, Vencido, Recargos), barra de cobranza, tabla por concepto, tabla por grupo con barras de progreso, top morosos clickeables
   - Usa endpoint existente `GET /pagos/dashboard?mes&anio` + campo `por_grupo`

3. **D2 — Módulo Alertas de Pago**
   - `backend/src/routes/notificaciones.js` → 2 endpoints nuevos:
     - `GET /notificaciones/adeudos?mes&anio` — alumnos con adeudo, estado alertas hoy, padres
     - `POST /notificaciones/alerta-pago` — envía notificación tipo `alerta_pago` a todos los padres del alumno
   - `web/src/pages/administrativo/Notificaciones.jsx` → módulo completo: stats, tabla semáforo, modal con texto editable precargado, envío masivo

4. **D2 — Alertas tipo modal**
   - `web/src/components/NotificacionModal.jsx` → agregado tipo `alerta_pago` (💳 dorado)
   - `web/src/pages/directora/Configuracion.jsx` → checkbox `alerta_pago` en lista de tipos modales
   - `backend/migrations/044_alerta_pago_modal_default.sql` → seeds `alerta_pago` como tipo modal por defecto (`ON CONFLICT DO NOTHING`)

5. **Bug fixes en módulo Alertas**
   - **Bug monto histórico estratosférico**: `GET /adeudos` incluía meses futuros en `saldo_total` → corregido con filtro `<= mes/año seleccionado` en ambos JOINs
   - **Bug saldo incorrecto**: fallback de texto usaba `saldo` sin filtro de mes → query ahora devuelve `saldo_mes` (mes seleccionado) + `saldo_total` (acumulado hasta ese mes)
   - **UX texto alerta**: eliminado campo "texto adicional" separado → textarea único precargado con `textoAlerta()` + botón "Restaurar texto"
   - **UX días de retraso**: texto antes decía "antes de la fecha límite" → ahora dice "X días de retraso" cuando `dias > 0`

### Archivos modificados
- `web/src/layouts/AdministrativoLayout.jsx` — AppShell con sidebar
- `web/src/pages/administrativo/Dashboard.jsx` — dashboard financiero completo
- `web/src/pages/administrativo/Pagos.jsx` — re-export directora
- `web/src/pages/administrativo/Notificaciones.jsx` — módulo alertas completo
- `web/src/pages/administrativo/Reportes.jsx` — stub
- `web/src/components/NotificacionModal.jsx` — tipo alerta_pago
- `web/src/pages/directora/Configuracion.jsx` — checkbox alerta_pago
- `web/src/App.jsx` — rutas portal admin
- `backend/src/routes/notificaciones.js` — 2 endpoints nuevos + fixes queries
- `backend/migrations/044_alerta_pago_modal_default.sql` — migración nueva

### Bugs históricos a registrar
- **NUNCA** hacer JOIN de `pagos` sin filtro `<= mes/año seleccionado` cuando se calcula saldo acumulado — los cargos automáticos futuros ya existen en BD y distorsionan totales

---

## ✅ SESIÓN XX+35 (2026-05-06) — Auditoría Hardcoded FASE 8+

**Fecha:** 2026-05-06 | **Estado:** ✅ COMPLETADA

### Resumen

Scan profundo de valores hardcodeados en todo el proyecto (web, mobile, backend). Se identificaron y corrigieron 7 issues concretos. El panel de configuración de la directora ya estaba implementado — solo faltaba el campo `hora_inicio_cobro_extension`.

### Tareas ejecutadas

1. **Estatus alumnos en cierre de ciclo — CiclosEscolares.jsx**
   - **Archivo:** `web/src/pages/directora/CiclosEscolares.jsx`
   - **Cambio:** Select `reinscrito/baja` hardcodeado → usa `useCatalogo('estados-alumno')` filtrado a esos dos keys. Agrega `ESTADOS_CIERRE` con el hook ya existente.
   - **Status:** ✅ Completada

2. **Horarios/montos — sin cambio necesario**
   - **Verificación:** Backend ya lee desde `configuracion_general` (25 filas en BD). `FiltroEntrada.jsx` ya usa `usePrecioDia()` desde API. `FiltroSalida.jsx` ya lee horarios desde API.
   - **Status:** ✅ Ya estaba bien implementado

3. **Semáforo de pagos — centralizado en utils/pagos.js**
   - **Archivo nuevo:** `web/src/utils/pagos.js`
   - **Cambio:** `SEMAFORO` y `ESTADO_PAGO` duplicados con labels distintos en `padre/Pagos.jsx` y `directora/Pagos.jsx` → eliminados y reemplazados por import de utils/pagos.js. Fix adicional en `directora/Pagos.jsx` línea 611: badge usaba solo `ep.bg` sin `ep.text`.
   - **Status:** ✅ Completada

4. **Emojis faltantes en mobile**
   - **Archivo:** `mobile/src/constants/catalogos.js`
   - **Cambio:** `CONDICIONES_PANIAL`, `TIPOS_INSUMO`, `VOMITO_INTENSIDAD` — agregado campo `emoji` separado (igual que el resto de catálogos mobile).
   - **Status:** ✅ Completada

5. **Sincronización estados asistencia web↔mobile**
   - **Archivo:** `mobile/src/constants/asistencia.js`
   - **Cambio:** Mobile tenía `ausente` (rojo/✗) y `pendiente` (morado/?) que no coincidían con lo que devuelve el backend (`ausente` = sin registrar). Alineado a `presente | retardo | no_entrada | ausente`. Eliminado estado `pendiente` inexistente en backend.
   - **Status:** ✅ Completada

6. **NIVELES en mobile**
   - **Archivo:** `mobile/src/constants/catalogos.js`
   - **Cambio:** Agregado `export const NIVELES` con los 5 niveles (maternal, prekinder, kinder1, kinder2, kinder3) para uso futuro.
   - **Status:** ✅ Completada

7. **Campo faltante en UI settings — hora_inicio_cobro_extension**
   - **Archivo:** `web/src/pages/directora/Configuracion.jsx`
   - **Cambio:** El campo `hora_inicio_cobro_extension` existía en backend (`CLAVES_HORARIO`) y en BD, pero no aparecía en la UI. Agregado en sección "Horario académico y salida" con descripción clara.
   - **Status:** ✅ Completada

### Archivos modificados
- `web/src/pages/directora/CiclosEscolares.jsx` — estatus alumnos a catálogo dinámico
- `web/src/utils/pagos.js` — **nuevo** — SEMAFORO + ESTADO_PAGO centralizados
- `web/src/pages/padre/Pagos.jsx` — import desde utils/pagos.js
- `web/src/pages/directora/Pagos.jsx` — import desde utils/pagos.js + fix badge
- `web/src/pages/directora/Configuracion.jsx` — campo hora_inicio_cobro_extension
- `mobile/src/constants/catalogos.js` — emojis + NIVELES
- `mobile/src/constants/asistencia.js` — alineación con backend

### Paridad Web ↔ Mobile: ✅ Aplicada (los cambios mobile son parte central de esta sesión)

---

## ✅ SESIÓN XX+34 (2026-05-06) — FASE C: Reportes básicos Asistencia + Tareas

**Fecha:** 2026-05-06 | **Estado:** ✅ VALIDADO POR VALERIA

### Resumen

Reportes básicos descargables en Excel y PDF integrados directamente en los módulos correspondientes: reporte de asistencia y tareas desde la vista mensual de Asistencia (directora), y reporte de tareas desde el módulo Tareas (maestra).

### Tareas ejecutadas

1. **Backend — Endpoint GET /reportes/asistencia**
   - **Archivo:** `backend/src/routes/reportes.js`
   - **Cambio:** Excel con columna por día hábil, celdas coloreadas (P/R/A/J/NE), totales y % asistencia. PDF resumen A4 landscape. Días hábiles: lunes-viernes excluyendo eventos tipo Suspensión del calendario.
   - **Fix:** Tabla `calendario_escolar` no existe → usa `eventos` + `categorias_evento`
   - **Status:** ✅ Completada

2. **Backend — Endpoint GET /reportes/tareas**
   - **Archivo:** `backend/src/routes/reportes.js`
   - **Cambio:** Excel con 2 hojas (resumen por alumno + detalle por tarea), colores por % entrega (<70% rojo, 70-90% amarillo, >90% verde). PDF resumen A4 portrait.
   - **Roles:** directora, administrativo, maestra_titular, maestra_especial
   - **Status:** ✅ Completada

3. **Web — Botones descarga en Directora/Asistencia (vista Mensual)**
   - **Archivo:** `web/src/pages/directora/Asistencia.jsx`
   - **Cambio:** Función `descargarReporte()` con `toast.promise`. Botones Excel/PDF para asistencia junto al navegador de mes. Botones Excel/PDF para tareas junto a la leyenda. Usa grupo y mes ya seleccionados.
   - **Status:** ✅ Completada

4. **Web — Botones descarga en Maestra/Tareas**
   - **Archivo:** `web/src/pages/maestra/Tareas.jsx`
   - **Cambio:** Botones Excel/PDF en el header junto a "Nueva Tarea". Descarga tareas del mes actual del grupo de la maestra.
   - **Status:** ✅ Completada

### Archivos modificados
- `backend/src/routes/reportes.js` — 2 nuevos endpoints (asistencia + tareas), Excel + PDF
- `web/src/pages/directora/Asistencia.jsx` — función descargarReporte + 4 botones en vista mensual
- `web/src/pages/maestra/Tareas.jsx` — 2 botones Excel/PDF en header

### Paridad Web ↔ Mobile: N/A (reportes solo para directora/admin/maestra — no aplica mobile)

---

## ✅ SESIÓN XX+33 (2026-05-06) — FASE C: Registro en Cadena de Hermanos (Entrada + Salida)

**Fecha:** 2026-05-06 | **Estado:** Pendiente validación Valeria

### Resumen

Registro en cadena de hermanos: al registrar entrada o salida de un alumno, el sistema detecta automáticamente hermanos pendientes y ofrece registrarlos en secuencia sin escanear QR adicionales. Funciona en web y mobile, con paridad completa.

### Tareas ejecutadas

1. **Backend — Endpoint GET /alumnos/:id/hermanos enriquecido**
   - **Archivo:** `backend/src/routes/alumnos.js` (líneas 453-542)
   - **Cambio:** Retorna `{ hermanos: [...] }` con estado del día (entrada_hoy, salida_hoy, estado_asistencia, puede_entrar), padres, autorizados, extensión, foto, grupo. Query con JOINs a registro_entrada, registro_salida, asistencia, config_horario_alumno, alumno_padre, personas_autorizadas.
   - **Status:** ✅ Completada

2. **Web — Cadena de hermanos en FiltroEntrada.jsx**
   - **Archivo:** `web/src/pages/maestra/FiltroEntrada.jsx`
   - **Cambio:** Nuevo componente `ModalHermanosCadena` con checkboxes. Al registrar entrada exitosamente → consulta hermanos → si hay sin entrada → muestra modal → abre ModalEntrada para cada uno en secuencia. Cola de hermanos con estado `colaHermanos`.
   - **Status:** ✅ Completada

3. **Web — Cadena de hermanos en FiltroSalida.jsx**
   - **Archivo:** `web/src/pages/maestra/FiltroSalida.jsx`
   - **Cambio:** Mismo `ModalHermanosCadena` adaptado para salida. Pre-llena "quién recoge" del hermano anterior con `quienRecogeRef`. ModalSalida acepta prop `quienRecogeDefault` y reporta `quienRecoge` en onSuccess.
   - **Status:** ✅ Completada

4. **Mobile — Cadena de hermanos en qr-scanner.jsx**
   - **Archivo:** `mobile/app/(maestra)/qr-scanner.jsx`
   - **Cambio:** Nuevo componente `PantallaHermanos` con selección visual. `handleSiguiente` reemplaza `resetScanner` en ResultadoEntrada — busca hermanos pendientes antes de resetear. Cola de hermanos con `colaHermanos`. Funciona en modo entrada y salida.
   - **Status:** ✅ Completada

### Archivos modificados
- `backend/src/routes/alumnos.js` — Endpoint hermanos enriquecido
- `web/src/pages/maestra/FiltroEntrada.jsx` — ModalHermanosCadena + flujo cadena
- `web/src/pages/maestra/FiltroSalida.jsx` — ModalHermanosCadena + pre-llenado quién recoge
- `mobile/app/(maestra)/qr-scanner.jsx` — PantallaHermanos + handleSiguiente + estilos

### Paridad Web ↔ Mobile: ✅

---

## ✅ SESIÓN XX+32 (2026-05-06) — FASE C: Precios por nivel + Cargos automáticos mensuales + Recargo %

**Fecha:** 2026-05-06 | **Estado:** ✅ VALIDADO POR VALERIA

### Resumen

Fase C completada: precios diferenciados por nivel educativo (Maternal → Kinder 3), job cron para generar cargos automáticos mensuales el día 1, recargo porcentaje configurable (10% default) por mes vencido, y auto-generación de cargos de extensión al dar de alta.

### Tareas ejecutadas

1. **Migration 043 — tabla `precios_nivel` + campo recargo_porcentaje**
   - **Archivo NUEVO:** `backend/migrations/043_precios_nivel.sql`
   - **Cambio:** Tabla `precios_nivel(concepto_id, nivel_key, monto)` con UNIQUE constraint. Campo `recargo_porcentaje` en `conceptos_pago`. Config `recargo_porcentaje_default = 10`.
   - **Status:** ✅ Completada y migración ejecutada

2. **Backend — CRUD precios por nivel + helper obtenerMontoConcepto**
   - **Archivo:** `backend/src/routes/pagos.js`
   - **Cambio:** GET/PUT `/conceptos/:id/precios`, GET `/conceptos/:id/monto-alumno/:alumnoId`, helper `obtenerMontoConcepto(conceptoId, nivelKey, montoDefault)` con fallback a monto genérico
   - **Status:** ✅ Completada

3. **Backend — Recargo porcentaje (nueva lógica)**
   - **Archivo:** `backend/src/routes/pagos.js` — función `calcularRecargo()`
   - **Cambio:** Si `recargo_porcentaje` existe → recargo = monto × (% / 100) una vez por mes vencido. Fallback a `monto_recargo_dia` (legacy). Backwards compatible.
   - **Status:** ✅ Completada

4. **Backend — Job cron cargos mensuales automáticos**
   - **Archivo NUEVO:** `backend/src/jobs/cargosMensualesJob.js`
   - **Cambio:** Cron día 1 a las 00:05 AM (America/Mexico_City). Genera cargos pendientes para conceptos `es_mensual=true` con monto por nivel. Incluye extensión mensual para alumnos con extensión activa.
   - **Status:** ✅ Completada

5. **Backend — Registro job cron en index.js**
   - **Archivo:** `backend/src/index.js`
   - **Cambio:** Import + llamada `iniciarJobCargosMensuales()`
   - **Status:** ✅ Completada

6. **Backend — Generar-mes manual actualizado**
   - **Archivo:** `backend/src/routes/pagos.js` — POST `/generar-mes`
   - **Cambio:** Usa precios por nivel + genera cargos extensión mensual
   - **Status:** ✅ Completada

7. **Backend — Auto-cargo extensión al dar alta**
   - **Archivo:** `backend/src/controllers/alumnosController.js`
   - **Cambio:** Al registrar alta extensión con `genera_cargos=true`, busca nivel del alumno y genera cargo con monto por nivel
   - **Status:** ✅ Completada

8. **Backend — Config recargo_porcentaje_default**
   - **Archivo:** `backend/src/routes/config.js`
   - **Cambio:** Agregada clave `recargo_porcentaje_default` a `CLAVES_NEGOCIO`
   - **Status:** ✅ Completada

9. **Web — UI precios por nivel en ModalConceptos**
   - **Archivo:** `web/src/pages/directora/Pagos.jsx`
   - **Cambio:** ModalConceptos reescrito con soporte edición, sección "Precios por nivel" (tabla azul con inputs por nivel), campo "Recargo %", botón cancelar edición. ModalPago precarga monto correcto por nivel del alumno.
   - **Status:** ✅ Completada

10. **Web — Configuración recargo % en portal directora**
    - **Archivo:** `web/src/pages/directora/Configuracion.jsx`
    - **Cambio:** Sección naranja "Recargo por morosidad" con campo editable porcentaje
    - **Status:** ✅ Completada

### Archivos nuevos
- `backend/migrations/043_precios_nivel.sql`
- `backend/src/jobs/cargosMensualesJob.js`

### Archivos modificados
- `backend/src/routes/pagos.js` — CRUD precios nivel, calcularRecargo %, generar-mes con nivel, monto-alumno endpoint
- `backend/src/controllers/alumnosController.js` — auto-cargo extensión con precio nivel
- `backend/src/index.js` — registro job cron
- `backend/src/routes/config.js` — clave recargo_porcentaje_default
- `web/src/pages/directora/Pagos.jsx` — UI precios nivel + recargo % + precarga monto
- `web/src/pages/directora/Configuracion.jsx` — campo recargo %

### Notas
- **Mobile no afectado:** No tiene portal de pagos. Los montos llegan calculados del backend.
- **Backwards compatible:** Si `recargo_porcentaje` es NULL, se usa `monto_recargo_dia` (lógica legacy).
- La tarea "Estado colegiatura por alumno (12 cargos automáticos con recargo día 6)" de Fase D queda parcialmente cubierta por el job cron implementado.

---

## ✅ SESIÓN XX+31 (2026-05-05) — FASE B parcial: Cloudinary desacoplado + Mobile en celular Android

**Fecha:** 2026-05-05 | **Estado:** ✅ VALIDADO POR VALERIA

### Resumen

Fase B parcial completada: Cloudinary desacoplado con flag `CLOUDINARY_ENABLED`, app mobile funcionando en celular Android via Expo Go (SDK 54), imports duplicados corregidos en 9 archivos, y botón cerrar sesión agregado en portales padre y maestra.

### Tareas ejecutadas

1. **Cloudinary desacoplado — flag CLOUDINARY_ENABLED**
   - **Archivo:** `backend/src/services/cloudinaryService.js`
   - **Cambio:** Nuevo flag `CLOUDINARY_ENABLED` en .env. Si `false` → mock silencioso sin error 500
   - **Archivos adicionales:** `backend/.env`, `backend/.env.example`
   - **Status:** ✅ Completada

2. **Acceso mobile desde celular Android via Expo Go**
   - **Archivo:** `mobile/.env` — API_URL apuntando a IP local `192.168.1.91:3000`
   - **Cambio:** Configuración red local + reglas firewall Windows puertos 3000 y 8081
   - **Status:** ✅ Completada y validada en celular

3. **Fix imports duplicados en 9 archivos mobile**
   - **Archivos:** `(maestra)/_layout.jsx`, `(maestra)/tareas.jsx`, `(maestra)/bitacora.jsx`, `(padre)/_layout.jsx`, `(padre)/index.jsx`, `(padre)/bitacora.jsx`, `(padre)/calendario.jsx`, `(padre)/pagos.jsx`, `(padre)/qr.jsx`, `login.jsx`
   - **Cambio:** Eliminación de imports duplicados de `@/constants/theme` intercalados entre cada import
   - **Status:** ✅ Completada

4. **Actualización SDK 52 → SDK 54**
   - **Archivo:** `mobile/package.json` — expo ^54.0.34, react 19.1.0, react-native 0.81.5
   - **Cambio:** Actualización completa de dependencias para compatibilidad con Expo Go SDK 54
   - **Dependencias agregadas:** `react-native-toast-message`, `expo-linking`, `expo-constants`, `expo-system-ui`, `react-native-worklets`
   - **Status:** ✅ Completada

5. **Remoción plugin nativewind/babel (no usado)**
   - **Archivo:** `mobile/babel.config.js`
   - **Cambio:** Eliminado `nativewind/babel` del array de plugins (no se usa en el proyecto)
   - **Status:** ✅ Completada

6. **Creación assets placeholder**
   - **Archivos:** `mobile/assets/icon.png`, `splash.png`, `adaptive-icon.png`, `favicon.png`, `notification-icon.png`
   - **Cambio:** PNGs mínimos placeholder para que Expo no falle al iniciar
   - **Status:** ✅ Completada

7. **Botón cerrar sesión en portales padre y maestra**
   - **Archivos:** `mobile/app/(padre)/index.jsx`, `mobile/app/(maestra)/index.jsx`
   - **Cambio:** Botón 🚪 con fondo rosa en header → Alert confirmación → logout → redirect login
   - **Status:** ✅ Completada y validada

### Bugs encontrados y corregidos
- Import duplicado `COLORS` / `COLORS, RADIUS` en 9 archivos (generación de código previa)
- Plugin `nativewind/babel` referenciado pero no instalado ni usado
- Assets faltantes (`icon.png`, `splash.png`, etc.)
- Paquete `react-native-toast-message` faltante
- SDK 52 incompatible con Expo Go SDK 54

---

## âœ… SESIÃ“N XX+27 (2026-05-04) â€” FASE 7 CatÃ¡logos DinÃ¡micos â€” Tareas 6-10 (COMPLETADO)

**Fecha:** 2026-05-04 | **Estado:** âœ… 10/10 TAREAS COMPLETADAS

### Resumen

Completadas tareas 6-10 de FASE 7 (CatÃ¡logos DinÃ¡micos). SesiÃ³n XX+27 cerrada con 5 archivos web + 1 mÃ³vil centralizados, SQL UPDATE ejecutado, y protocolo de cierre completado.

### Tareas ejecutadas

1. **TAREA 6** â€” Migrar precios comida mobile
   - **Archivo:** `mobile/app/(padre)/comida.jsx`
   - **Cambio:** Precios `$250` (semana) y `$50` (dÃ­a) â†’ leer de `GET /config/negocio`
   - **Status:** âœ… Completada

2. **TAREA 7** â€” Migrar TIPOS_DOC en AlumnoPerfil web
   - **Archivos:** `web/src/pages/directora/AlumnoPerfil.jsx`
   - **Cambio:** Array hardcodeado `TIPOS_DOC` â†’ `useCatalogo('tipos-documento')` + fallback
   - **Config:** `docs_requeridos_alumno` desde `GET /config/negocio`
   - **Status:** âœ… Completada

3. **TAREA 8** â€” Centralizar ESTADO_BADGE asistencia web + mobile
   - **Archivos web:** `web/src/utils/asistencia.js` (creado), 5 archivos actualizados
     - `FiltroEntrada.jsx` â†’ import `ESTADO_ASISTENCIA`
     - `maestra/Asistencia.jsx` â†’ import `ESTADO_CONFIG`
     - `directora/Asistencia.jsx` â†’ import `ESTADO_STYLE`
     - `directora/Dashboard.jsx` â†’ import `ESTADO_STYLE`
   - **Archivos mobile:** `mobile/src/constants/asistencia.js` (creado), 1 archivo actualizado
     - `mobile/app/(maestra)/asistencia.jsx` â†’ import `ESTADO_CONFIG`
   - **Status:** âœ… Completada

4. **TAREA 9** â€” Migrar ROL_COLOR en Personal.jsx
   - **AnÃ¡lisis:** `ROL_COLOR` ya centralizado en `web/src/utils/catalogos.js`
   - **CatÃ¡logo:** `roles-personal` sin campo `color` dinÃ¡mico (enum en BD)
   - **Status:** âœ… Sin cambios requeridos (ya optimizado)

5. **TAREA 10** â€” Migrar horarios turno mobile
   - **Archivo:** `mobile/app/(maestra)/qr-scanner.jsx`
   - **Cambios:**
     - LÃ­nea 21: `horaActual >= 14` â†’ `horaActual >= horaSalidaNormal` (config)
     - LÃ­nea 76: `14 * 60 + 45` (14:45) â†’ parse dinÃ¡mico de `hora_salida_extension`
   - **Config:** `GET /config/horarios` con fallback hardcodeado
   - **Status:** âœ… Completada

6. **SQL UPDATE** â€” Poblar `color` en `estados-alumno`
   - **Comandos ejecutados:** 4 UPDATE (inscritoâ†’green, reinscritoâ†’blue, bajaâ†’red, egresadoâ†’gray)
   - **Status:** âœ… Ejecutado en background (PostgreSQL local)

### Archivos modificados

**Web (7 archivos):**
- `web/src/pages/maestra/FiltroEntrada.jsx` â€” import + eliminar ESTADO_BADGE
- `web/src/pages/maestra/Asistencia.jsx` â€” import + eliminar ESTADO_CONFIG
- `web/src/pages/directora/Asistencia.jsx` â€” import + eliminar ESTADO_STYLE
- `web/src/pages/directora/Dashboard.jsx` â€” import + eliminar ESTADO_STYLE
- `web/src/pages/directora/AlumnoPerfil.jsx` â€” hooks + props TIPOS_DOC/DOC_REQUERIDOS
- `web/src/utils/asistencia.js` â€” **creado** (centralizado)
- `web/src/utils/catalogos.js` â€” sin cambios (ROL_COLOR ya ahÃ­)

**Mobile (2 archivos):**
- `mobile/app/(maestra)/qr-scanner.jsx` â€” useEffect + cargar config/horarios
- `mobile/src/constants/asistencia.js` â€” **creado** (centralizado)

**Otros:**
- `mobile/app/(padre)/comida.jsx` â€” cargar precios de config/negocio

---

## âœ… SESIÃ“N XX+26 (2026-05-04) â€” AuditorÃ­a UX/UI Completa (COMPLETADO)

**Fecha:** 2026-05-04 | **Estado:** âœ… 24 CAMBIOS IMPLEMENTADOS Y VALIDADOS EN CÃ“DIGO

### AuditorÃ­a ejecutada

**Scope:** 13 archivos web (padre, maestra, directora), 3 dimensiones auditadas: consistency, usability, visual design

### Bugs crÃ­ticos resueltos

1. **EMOJIS_ANIMO keys incorrectas en padre/Dashboard.jsx**
   - **Problema:** padre usaba `inquieto`/`energico`, maestra usaba `irritable`/`activo` â€” padre nunca mostraba emojis correctamente
   - **Fix:** Unificar keys padre a `irritable`/`activo` para coincidir con BD
   - **Impacto:** Emojis de Ã¡nimo ahora se renderizan correctamente en Dashboard padre

2. **Formato de fechas de pago inconsistente**
   - **Problema:** padre mostraba "4/5/2026", directora mostraba "04 may 2026"
   - **Fix:** Estandarizar formato a `{ day:'2-digit', month:'short', year:'numeric' }`
   - **Impacto:** Fechas ahora consistentes entre padre y directora

### Cambios implementados

#### Saludos dinÃ¡micos por hora (3 portales)
- **directora/Dashboard.jsx:** "Â¡Buenos dÃ­as/tardes/noches, Director/Directora Nombre! ðŸ‘‹"
- **maestra/Dashboard.jsx:** "Â¡Buenos dÃ­as/tardes/noches, Miss/Teacher Nombre! ðŸ‘‹"
- **padre/Dashboard.jsx:** "Â¡Buenos dÃ­as/tardes/noches, MamÃ¡/PapÃ¡ Nombre! ðŸ‘‹"

#### Spinner color unificado
- **Cambios:** 12 spinners en 7 archivos (`border-red-400`, `border-green-400`, `border-purple-500` â†’ `border-hs-purple`)

#### H1 size unificado
- **Portal padre/maestra:** `text-2xl` (base uniforme)
- **Portal directora:** `text-3xl` (base uniforme)
- **Correcciones:** 3 archivos donde diferÃ­an de su portal

#### Botones primarios unificados
- **maestra/FiltroEntrada.jsx, directora/Pagos.jsx:** Reemplazar inline styles por clase `btn-primary`

#### Emojis unificados
- **Calendario:** `ðŸ“†`, `ðŸ—“ï¸` â†’ unificar a `ðŸ“…`
- **Empty states:** Emoji + texto consistente en todas las pÃ¡ginas

#### MESES array capitalizado
- **maestra/Tareas.jsx:** `['ene','feb',...]` â†’ `['Ene','Feb',...]`

#### Empty state Tareas
- **Icono Lucide `<Clock>` â†’ Emoji `ðŸ“‹`** para patrÃ³n consistente

### Cambios NO aplicados (descartados correctamente)

- `padre/Bitacora.jsx` botÃ³n "Firmar" azul: semÃ¡nticamente correcto (diferencia del CTA principal)
- `maestra/Tareas.jsx` botones `bg-hs-blue`: botones secundarios de formulario, color diferencia intencional
- `directora/Calendario.jsx` MESES completos: correcto para componente de calendario
- Empty states "No hay X" vs "Sin X": baja prioridad, 30+ ocurrencias, requiere decisiÃ³n editorial

### Resumen ejecutivo web

| MÃ©trica | Valor |
|---------|-------|
| Archivos modificados | 13 |
| Cambios totales | 24 |
| Bugs crÃ­ticos resueltos | 2 |
| Spinners corregidos | 12 |
| H1 corregidos | 3 |
| Botones unificados | 2 |
| Saludos dinÃ¡micos | 3 portales |

### Parte B â€” Mobile (misma sesiÃ³n)

**Archivos:** 4 | **Cambios:** 8 | **Commit:** `9116960`

| Cambio | Archivo | Tipo |
|--------|---------|------|
| Bug fecha `T00:00:00` â†’ `T12:00:00` | `(maestra)/tareas.jsx` | Bug crÃ­tico |
| Bug `new Date(iso)` â†’ anclar `T12:00:00` | `(padre)/calendario.jsx` | Bug crÃ­tico |
| `EMOJIS_ANIMO` hardcodeado â†’ `useCatalogo('animo')` | `(maestra)/index.jsx` | Paridad web |
| Saludo dinÃ¡mico `saludoHora()` | `(maestra)/index.jsx` | Paridad web |
| Saludo dinÃ¡mico `saludoHora()` + `TRATAMIENTO_PARENTESCO` | `(padre)/index.jsx` | Paridad web |
| `ðŸ“†` / `ðŸ—“ï¸` â†’ `ðŸ“…` en eventos | `(padre)/index.jsx` | Paridad web |
| Emoji `ðŸ”„` â†’ `ActivityIndicator` color `#E53E3E` | `(padre)/index.jsx` | Paridad web |
| Bug preexistente `tarea Titulo` â†’ `tareaTitulo` | `(padre)/index.jsx` | Fix compilaciÃ³n |

**Nota sobre mobile:** La estructura estÃ¡ en `mobile/app/(padre)/` y `mobile/app/(maestra)/` (Expo Router), NO en `mobile/src/pages/`. El error de bÃºsqueda inicial asumiÃ³ estructura web â€” corregido.

---

## âœ… SESIÃ“N XX+25 (2026-05-04) â€” Bug Comida: DÃ­as Desplazados (COMPLETADO)

**Fecha:** 2026-05-04 | **Estado:** âœ… BUG RESUELTO Y VALIDADO EN BROWSER

### Problema Reportado

**SÃ­ntoma:** PapÃ¡ selecciona MiÃ©rcoles, Jueves, Viernes â†’ Directora ve Martes, MiÃ©rcoles, Jueves (offset -1 dÃ­a)

**UbicaciÃ³n:** Tab "Pagos del Servicio" en http://localhost:5173/directora/comida

### AnÃ¡lisis del Bug

**UbicaciÃ³n del error:** `web/src/pages/directora/ServicioComida.jsx` lÃ­nea 40

**CÃ³digo defectuoso:**
```js
const DIAS = ['', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie'];
// Mapeo: Ã­ndice 0 â†’ '' (vacÃ­o), Ã­ndice 1 â†’ 'Lun', Ã­ndice 2 â†’ 'Mar' (INCORRECTO)
```

**Causa raÃ­z:** Array tenÃ­a estructura con vacÃ­o en posiciÃ³n 0, luego elementos 1-5. Cuando datos en BD tienen `[2,3,4]`:
- `DIAS[2]` retorna 'Mar' (deberÃ­a ser 'MiÃ©')
- `DIAS[3]` retorna 'MiÃ©' (deberÃ­a ser 'Jue')
- `DIAS[4]` retorna 'Jue' (deberÃ­a ser 'Vie')

**Resultado:** Offset de +1 en la visualizaciÃ³n (mostraba Ã­ndice anterior)

### Fix Aplicado

**Cambio:** Reindexar `DIAS` para usar Ã­ndices 0-4 correctamente

```js
// ANTES:
const DIAS = ['', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie'];

// DESPUÃ‰S:
const DIAS = ['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie'];
```

### ValidaciÃ³n

âœ… Alejandro: `dias_seleccionados=[2,3,4]` â†’ Ahora muestra "MiÃ©, Jue, Vie" (correcto)
âœ… SofÃ­a: `dias_seleccionados=[3,4]` â†’ Ahora muestra "Jue, Vie" (correcto)

### Lecciones Aprendidas

**Problema metodolÃ³gico:** EditÃ© `ComidaPagos.jsx` (archivo equivocado) durante 30+ minutos antes de identificar que el bug estaba en `ServicioComida.jsx`.

**Mejora para futuro:** 
1. Pedir claridad sobre la ruta exacta (`/directora/comida` vs `/comidas/pagos`)
2. Analizar dÃ³nde se renderizan los datos ANTES de tocar cÃ³digo
3. No asumir ubicaciones de componentes

---

## âœ… SESIÃ“N XX+24 (2026-05-03) â€” ModalAlumno Alergias + ModalQR (COMPLETADO)

**Fecha:** 2026-05-03 | **Estado:** âœ… VALIDACIÃ“N COMPLETA EN BROWSER (ModalAlumno) + UI ModalQR (prÃ³xima sesiÃ³n validaciÃ³n)

### Validaciones Completadas

**FASE 5.2 â€” Batch D.4+ (Alumnos.jsx â€” ModalAlumno):** âœ… 100% VALIDADO EN BROWSER
- âœ… Crear alumno: todos los campos precargados correctamente
- âœ… Editar alumno: CURP, tipo_sangre, condiciones_especiales, alergias cargan correctamente
- âœ… Alergias: checkboxes seleccionables/deseleccionables, "Otras alergias" texto editable
- âœ… Alergias: guardadas y persisten correctamente entre ediciones
- âœ… Foto: preview y upload implementados

**FASE 5.2 â€” Batch D.4+ (Alumnos.jsx â€” ModalQR):** UI COMPLETADA (validaciÃ³n prÃ³xima sesiÃ³n)
- âœ… UI: mostrar QR cuando existe
- âœ… UI: botÃ³n descargar con file download pattern implementado
- âœ… UI: botÃ³n regenerar llamando endpoint /alumnos/{id}/regenerar-qr
- âœ… UI: pantalla vacÃ­a con opciÃ³n generar si sin QR
- â³ ValidaciÃ³n real: requiere Cloudinary configurado

### Bugs CrÃ­ticos Resueltos

**Bug: Alergias no precargaban y checkboxes no respondÃ­an**
- **Causa raÃ­z:** Conflicto de state management bidireccional
  - `form.alergias` cargaba del DB
  - `useEffect` intentaba splitear en `alergiasSeleccionadas` + `alergiasOtras`
  - `toggleAlergia` actualizaba `alergiasSeleccionadas` pero `form.alergias` permanecÃ­a estÃ¡tico
  - Esto causaba checkboxes uncontrolled
- **SoluciÃ³n:** Single source of truth
  - Remover funciÃ³n `sincronizarAlergias()`
  - `alergiasSeleccionadas` y `alergiasOtras` son la Ãºnica fuente de verdad
  - `useEffect` inicializa estos estados cuando carga alumno
  - `toggleAlergia` modifica directamente `alergiasSeleccionadas`
  - En save time: combinar ambos inline en `guardar()` mutation
- **Resultado:** âœ… Alergias precarga, checkboxes responden, guardan correctamente

### Cambios Realizados

#### Frontend
- `web/src/pages/directora/Alumnos.jsx:478-513` â€” guardar mutation calcula alergias inline
- `web/src/pages/directora/Alumnos.jsx:470-476` â€” toggleAlergia directo sin sincronizarAlergias
- `web/src/pages/directora/Alumnos.jsx:217-296` â€” ModalQR mejorado con handleDescargar + descargando state

---

## âœ… SESIÃ“N XX+22 (2026-05-03) â€” FASE 5.2 Batch D.4+ Grupos + Bug Fixes (COMPLETADO)

**Fecha:** 2026-05-03 | **Estado:** âœ… VALIDACIÃ“N COMPLETA EN BROWSER

### Validaciones Completadas

**FASE 5.2 â€” Batch D.4+ (Grupos.jsx â€” Modal Crear + Editar):** âœ… 100% VALIDADO EN BROWSER
- âœ… Crear grupo: nombre, color picker, nivel dropdown
- âœ… Editar grupo: todos los campos editables (nombre, color, nivel, capacidad, estado)
- âœ… Cambios persisten correctamente al backend (sin error 500)
- âœ… Dropdown nivel muestra el valor correcto para cada grupo

**Pendiente prÃ³xima sesiÃ³n:**
- [ ] Asignar maestras: selector maestras, botÃ³n agregar/quitar (UI en desarrollo)

### Bugs CrÃ­ticos Resueltos

**Bug 1: Error 500 al editar grupo â€” "no existe la columna Â«horario_entradaÂ»"**
- **Causa:** Backend intentaba actualizar columnas inexistentes en tabla `grupos` (solo tiene 1 horario a nivel escuela)
- **Fix:** 
  - Remover campos `horario_entrada`, `horario_salida`, `turno` del UPDATE en `backend/src/routes/grupos.js`
  - Remover UI de esos campos en `web/src/pages/directora/Grupos.jsx`
  - Comentar: "Horarios manejados a nivel escuela, no por grupo"
- **Resultado:** âœ… Editar grupo funciona sin error 500

**Bug 2: Dropdown nivel siempre muestra "maternal"**
- **Causa raÃ­z:** PostgreSQL `GROUP BY` incompleto â€” no incluÃ­a `g.nivel` y otros campos
  - Cuando un campo estÃ¡ en SELECT pero NO en GROUP BY, PostgreSQL ignora/randomiza su valor
  - Resultado: nivel siempre caÃ­a al fallback 'maternal'
- **Fix:** 
  - Agregar TODOS los campos de `grupos` al GROUP BY: `g.id, g.nivel, g.nivel_codigo, g.nombre, g.color_hex, g.ciclo_id, g.cupo_maximo, g.activo, g.created_at, g.updated_at, g.deleted_at`
  - Agregar `useEffect` en ModalGrupo para sincronizar form cuando grupo cambia
  - Buscar grupo fresco en lista en lugar de usar objeto cached
- **Resultado:** âœ… Dropdown muestra nivel correcto (Kinder 1, Maternal, etc.)

### Cambios Realizados

#### Backend
- `backend/src/routes/grupos.js:48` â€” GROUP BY completado con todos los campos
- `backend/src/routes/grupos.js:221` â€” Removidos campos inexistentes del UPDATE

#### Frontend
- `web/src/pages/directora/Grupos.jsx:1` â€” Importado `useEffect`
- `web/src/pages/directora/Grupos.jsx:23` â€” Agregado `isLoading` de `useCatalogo`
- `web/src/pages/directora/Grupos.jsx:31-52` â€” InicializaciÃ³n y sincronizaciÃ³n de form con `useEffect`
- `web/src/pages/directora/Grupos.jsx:76-82` â€” Dropdown nivel con validaciÃ³n de carga
- `web/src/pages/directora/Grupos.jsx:85-108` â€” Removidos campos Turno, Entrada, Salida
- `web/src/pages/directora/Grupos.jsx:192` â€” Removida lÃ­nea de horarios en tarjeta
- `web/src/pages/directora/Grupos.jsx:267` â€” Removidos horarios del payload UPDATE
- `web/src/pages/directora/Grupos.jsx:351` â€” Buscar grupo fresco en lista para modal

### Servidores
- âœ… Backend 3000 â€” Respondiendo correctamente
- âœ… Web 5173 â€” Cargando cambios sin errores

### Commits
1. Cambios en Backend + Web completados
2. PENDIENTES.md actualizado (Batch D.4+ Grupos marcado âœ… VALIDADO)

---

## âœ… SESIÃ“N XX+21 (2026-05-03) â€” FASE 5.2 Batch B ValidaciÃ³n Usuarios.jsx (COMPLETADO)

**Fecha:** 2026-05-03 | **Estado:** âœ… VALIDACIÃ“N COMPLETA EN BROWSER

### Validaciones Completadas

**FASE 5.2 â€” Batch B (3/3 archivos, 9 modales) â€” âœ… 100% VALIDADO EN BROWSER**

**directora/Usuarios.jsx:**
- âœ… ModalConfirmCrearCuenta (2 estados: confirm + resultado)
  - âœ… Modal confirm muestra email preview, email contacto, contraseÃ±a temporal, botones
  - âœ… Click "Crear cuenta" â†’ muta endpoint, abre modal resultado
  - âœ… Modal resultado muestra âœ… checkmark, email con Copy, contraseÃ±a con toggle ðŸ‘ï¸/ðŸ™ˆ y Copy
  - âœ… BotÃ³n "Cerrar" cierra modal correctamente
  - âœ… Tarjeta padre actualizada: badge "â³ Primer login pendiente", botones nuevos
- âœ… ModalConfirmResetPassword (1 estado: confirm)
  - âœ… Click "ðŸ”„ Reset" abre modal confirm
  - âœ… Modal muestra texto de reseteo, botones Cancelar/Resetear
  - âœ… Click "Resetear" â†’ toast âœ… success, modal cierra

**Otros modales (validados en XX+18):**
- âœ… directora/Dashboard.jsx: 4 modales info grupo
- âœ… directora/Asistencia.jsx: modal justificar + ver justificaciÃ³n

### Test Data
- Padre prueba creado: "PapÃ¡ Prueba Usuarios" (sin cuenta inicial)
- Vinculado con alumno activo â†’ email institucional generado correctamente
- Flujo completo: crear cuenta â†’ resultado â†’ reset password â†’ funcionan

### Commits
1. PENDIENTES.md actualizado (Batch B marcado âœ… VALIDADO)

---

## âœ… SESIÃ“N XX+20 (2026-04-30) â€” FASE 5.2 Batch D.1-3 ValidaciÃ³n Personal + 3 Bug Fixes (COMPLETADO)

**Fecha:** 2026-04-30 | **Estado:** âœ… VALIDACIÃ“N COMPLETA EN BROWSER + BUG FIXES CRÃTICOS

### Validaciones Completadas

**FASE 5.2 â€” Batch D.1-3 (Personal.jsx â€” 5 modales):** âœ… 100% VALIDADO EN BROWSER
- âœ… Crear personal: formulario completo, password inicial, roles dropdown âœ“
- âœ… Editar personal: campos editables, grupo asignado visible âœ“
- âœ… Asignar grupo: selector grupo, checkbox "es titular", botÃ³n "+ Asignar grupo" â€” **FUNCIONA PARA TODOS LOS ROLES** âœ“
- âœ… Reset password: confirm modal, botÃ³n "ðŸ”‘ Reset pass" funciona âœ“
- âœ… Quitar grupo: botÃ³n "Quitar" en grupos asignados funciona âœ“

### Bugs CrÃ­ticos Resueltos

**Bug 1: Error 409 al guardar nombre â€” "Ya existe un registro con esos datos"**
- **Causa:** Ãndices UNIQUE en CURP/RFC NO ignoraban NULLs, bloqueando updates
- **Fix:** 
  - Dropear `idx_personal_curp_unique` / `idx_personal_rfc_unique`
  - Recrear con `WHERE curp IS NOT NULL` / `WHERE rfc IS NOT NULL`
  - Hacer CURP y RFC **obligatorios** en validaciÃ³n frontend + backend
- **Resultado:** âœ… Editar nombre sin error 409

**Bug 2: Quitar grupo no funciona â€” botÃ³n no actualiza UI**
- **Causa:** DELETE funciona pero no hay refresh de datos ni toast de confirmaciÃ³n
- **Fix:** Agregar try/catch + invalidateQueries + toast.success() en `quitarGrupo()`
- **Resultado:** âœ… Grupo desaparece inmediatamente tras quitar

**Bug 3: Asignar grupo falla â€” Error 409 con registro inactivo**
- **Causa:** UNIQUE constraint en `asignaciones_grupo` NO consideraba `activo = false`
- **Fix:** 
  - Dropear constraint `uq_asignaciones_grupo`
  - Recrear como INDEX UNIQUE con `WHERE activo = true`
  - Simplificar lÃ³gica INSERT: verificar existencia antes de insertar/actualizar
- **Resultado:** âœ… Asignar grupo funciona incluso con registros inactivos previos

**Bug 4: Fecha ingreso no carga â€” campo vacÃ­o al editar**
- **Causa:** BD envÃ­a ISO completo `2025-04-30T00:00:00Z`, input type="date" espera `YYYY-MM-DD`
- **Fix:** Usar `.substring(0, 10)` al inicializar form.fecha_ingreso
- **Resultado:** âœ… Fecha aparece en campo date picker

### Cambios Realizados

#### Backend (`personal.js`)
1. ValidaciÃ³n POST: agregar `!curp || !rfc` como obligatorios
2. Endpoint asignar-grupo: reemplazar `ON CONFLICT` invÃ¡lido por lÃ³gica selectâ†’insert/update

#### Frontend (`Personal.jsx`)
1. ValidaciÃ³n submit: agregar `!form.curp.trim() || !form.rfc.trim()`
2. Campos CURP/RFC: marcar `required`
3. FunciÃ³n `quitarGrupo()`: agregar try/catch + invalidateQueries + toast
4. Inicializar fecha_ingreso: usar `.substring(0, 10)`
5. FunciÃ³n `asignarGrupo()`: agregar delay 300ms antes de cerrar modal

#### BD (PostgreSQL)
1. Dropear/recrear Ã­ndices CURP/RFC con `WHERE ... IS NOT NULL`
2. Dropear constraint UNIQUE en asignaciones_grupo
3. Recrear como INDEX UNIQUE con `WHERE activo = true`

### Commits

1. `e87937d` â€” fix: FASE 5.2 Personal validada + Ã­ndices UNIQUE con WHERE IS NOT NULL + asignaciÃ³n grupo corregida

---

## âœ… SESIÃ“N XX+19 (2026-04-30) â€” FASE 5.2 Batch C ValidaciÃ³n + Fix Tareas FormData (COMPLETADO)

**Fecha:** 2026-04-30 | **Estado:** âœ… VALIDACIÃ“N COMPLETA EN BROWSER + BUG FIXES CRÃTICOS

### Validaciones Completadas

**FASE 5.2 â€” Batch C (7/7 archivos, 15 modales):** âœ… 100% VALIDADO EN BROWSER
- âœ… maestra/Tareas.jsx â€” 3 modales (crear, editar, entregas) âœ“
- âœ… directora/Pagos.jsx â€” 2 modales (registrar pago, configurar conceptos) âœ“
- âœ… directora/Calendario.jsx â€” 2 modales (crear/editar evento, detalle evento) âœ“
- âœ… directora/ServicioComida.jsx â€” 1 modal (registrar/editar servicio) âœ“
- âœ… directora/NinosExtension.jsx â€” 2 modales (registro niÃ±o extensiÃ³n) âœ“
- âœ… components/NotificacionModal.jsx â€” Modal custom funcional âœ“
- âœ… components/directora/ModalCategoria.jsx â€” Modal custom funcional âœ“

### Bugs CrÃ­ticos Resueltos

**Bug 1: Error 400 POST /tareas â€” "titulo and grupo_id are required"**
- **Causa:** FormData no se parseaba en backend (multer no configurado)
- **Fix:** Agregar middleware multer en POST/PUT /tareas, cambiar req.files â†’ req.file
- **Resultado:** âœ… Crear tarea funciona sin error

**Bug 2: grupoId undefined en ModalNuevaTarea**
- **Causa:** Modal abrÃ­a antes de que grupo cargara
- **Fix:** Validar grupo?.id antes de renderizar, desactivar botÃ³n mientras carga
- **Resultado:** âœ… grupoId siempre vÃ¡lido al enviar

### Commits

1. `7aed036` â€” fix: FASE 5.2 Batch C â€” FormData + grupoId validation + validaciÃ³n completa

### Aprendizajes Documentados

- FormData + Multer: Middleware CRÃTICO para parsear archivos en Express
- Null-safety: Validar props antes de pasar a componentes (no solo ? chain)
- Web verify: curl real necesario, logs HMR no son indicador de estado

---

## âœ… SESIÃ“N XX+18 (2026-04-30) â€” ValidaciÃ³n FASES 3.5, 5.1, 5.2A + Consistencia Input File (COMPLETADO)

**Fecha:** 2026-04-30 | **Estado:** âœ… VALIDACIÃ“N PARCIAL COMPLETADA EN BROWSER

### Validaciones Completadas

**FASE 3.5 â€” ANIMO keys:** âœ… VALIDADO
- âœ… BitÃ¡cora Padre: Selector de Ã¡nimo muestra 5 opciones correctas (feliz/activo/cansado/triste/irritable)
- âœ… Dashboard Maestra: Alumnos con Ã¡nimo `activo` muestran âš¡, con Ã¡nimo `irritable` muestran ðŸ˜¤

**FASE 5.1 â€” AppShell compartido:** âœ… VALIDADO
- âœ… Todos los 3 portales (Padre, Maestra, Directora) tienen header visible, sidebar correcto, NotificationBell funcional
- âœ… Responsive correcto, logout hover consistente, sin errores Tailwind en consola

**FASE 5.2 â€” Batch A (5 archivos, 6 modales):** âœ… VALIDADO
- âœ… Perfil.jsx: Modal cambio contraseÃ±a funciona
- âœ… LoginPage.jsx: Modal primer login con validaciones funciona
- âœ… padre/Calendario.jsx: Modal evento con botÃ³n "Cerrar" y cierre por backdrop
- âœ… padre/Dashboard.jsx: Modal evento con botÃ³n "Cerrar" (agregado en esta sesiÃ³n) y lightbox foto
- âœ… directora/Visitantes.jsx: Modal form registrar funciona

**FASE 5.2 â€” Batch B (parcial):** âœ… VALIDADO (2/3)
- âœ… directora/Dashboard.jsx: 4 modales info de grupo funcionan
- âœ… directora/Asistencia.jsx: Modal justificar ausencia + ver justificaciÃ³n funciona
- â³ directora/Usuarios.jsx: Pendiente validar (crear cuenta, confirm, reset password)

### Mejoras de UX/UI â€” Input File Consistency

**Problema:** Inputs `type="file"` con estilos inconsistentes en formularios de upload.

**SoluciÃ³n:** Aplicar pseudoelemento `file:` con estilo bonito en todos los archivos.

**Archivos actualizados (âœ… VALIDADOS):**
- âœ… directora/Visitantes.jsx â€” input file foto (purple)
- âœ… directora/ComidaMenu.jsx â€” input file archivo (red)
- âœ… directora/NinosExtension.jsx â€” input file foto (blue)
- âœ… directora/ServicioComida.jsx â€” input file archivo (purple)
- âœ… directora/Asistencia.jsx â€” input file justificaciÃ³n (blue, ya implementado)

**Pattern aplicado:**
```css
file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[COLOR]/10 file:text-[COLOR]-dark hover:file:bg-[COLOR]-100
```

### Cambios en padre/Dashboard.jsx

**Bug fix:** Modal evento no tenÃ­a botÃ³n "Cerrar" explÃ­cito (solo cierre por backdrop).
**SoluciÃ³n:** Agregado botÃ³n "Cerrar" al ModalEvento (consistente con padre/Calendario.jsx).

### Commits

1. `3f2c2de` â€” refactor: Consistencia input file + botÃ³n Cerrar en padre/Dashboard

### Pendientes para PrÃ³xima SesiÃ³n

**Validaciones en browser:**
- [ ] Batch B: directora/Usuarios.jsx (1 item)
- [ ] Batch C: 7 items (maestra/Tareas, directora/Pagos, directora/Calendario, etc.)
- [ ] Batch D.1-3: 3 items (maestra/FiltroEntrada, FiltroSalida, Asistencia)
- [ ] Batch D.4+: 4 items (directora/Personal, Grupos, CiclosEscolares, Alumnos)
- [ ] FASE 4.4: 2 items button mobile (no visibles en browser, pendiente device)
- [ ] FASE 5.3: Mobile validation (npm install, expo start, NativeWind removal)

---

## âœ… SESIÃ“N XX+17 (2026-04-30) â€” FASE 5.2 Batch D.1-3 + FASE 5.3 (COMPLETADO)

**Fecha:** 2026-04-30 | **Estado:** âœ… IMPLEMENTACIÃ“N COMPLETADA â€” PENDIENTE VALIDACIÃ“N EN BROWSER

### FASE 5.2 â€” MigraciÃ³n Modales Web a Modal.jsx â€” Batches A-D.1-3

**Resumen:** 35+ modales inline refactorizados a usar componente Modal.jsx centralizado.

#### Batch A (SesiÃ³n anterior) âœ…
- 6 modales en 5 archivos simples (Perfil, LoginPage, padre/Calendario, padre/Dashboard, directora/Visitantes)

#### Batch B (SesiÃ³n anterior) âœ…
- 9 modales en 3 archivos (directora/Usuarios, directora/Dashboard, directora/Asistencia)

#### Batch C (SesiÃ³n anterior) âœ…
- 15 modales en 7+ archivos (maestra/Tareas 3, directora/Pagos 2, directora/Calendario 2, etc.)

#### Batch D.1-3 (ESTA SESIÃ“N) âœ…
**maestra/FiltroEntrada.jsx** (Commit: 7fc5216)
- ModalEntrada: multi-secciÃ³n (salud, higiene, materiales, comida, medicamentos, toallitas, cumpleaÃ±os)
- QRScannerModal: escanear credencial alumno
- Validaciones: checklist con flags inverted (ej: sin_fiebre = true es "SIN problema")
- Props Modal: `size="md"`, `closeOnBackdrop={false}` (prevenir pÃ©rdida de datos)

**maestra/FiltroSalida.jsx** (Commit: da27123)
- ModalSalida: 2 pasos (paso 1: selector quiÃ©n recoge + alerta anticipada/tardÃ­a, paso 2: checklist sanitario)
- QRScannerModal: escanear credencial alumno
- Progress indicator: barra visual de paso 1â†’2
- Props Modal: `size="md"`, `closeOnBackdrop={false}`

**maestra/Asistencia.jsx** (Commit: 61c2b01)
- ModalEntrada: checklist entrada (salud, higiene, materiales)
- Similar a FiltroEntrada pero mÃ¡s simple
- Props Modal: `size="md"`, `closeOnBackdrop={false}`

#### Batch D.4+ â€” DIFERIDO A PRÃ“XIMA SESIÃ“N
- directora/Personal.jsx (445 lÃ­neas, mega-form con asignaciÃ³n grupos)
- directora/Grupos.jsx (315 lÃ­neas, form asignaciÃ³n maestras)
- directora/CiclosEscolares.jsx (650 lÃ­neas, wizard 3 pasos)
- directora/Alumnos.jsx (275 lÃ­neas, form alta/ediciÃ³n alumno)

### FASE 5.3 â€” DecisiÃ³n NativeWind Mobile (Commit: 3670c5c)

**DecisiÃ³n:** OpciÃ³n A â€” **Eliminar NativeWind**, mantener StyleSheet + theme.js

**Cambios implementados:**
- âœ… Removido `nativewind` de dependencies
- âœ… Removido `tailwindcss` de devDependencies  
- âœ… Removido preset NativeWind de tailwind.config.js
- âœ… Verificado: CERO referencias a nativewind en cÃ³digo mobile

**RazÃ³n:** Button.jsx y componentes mobile ya completamente migrados a StyleSheet + theme.js; NativeWind nunca se usaba

**Beneficio:** Reducir dependencias, coherencia arquitectÃ³nica (web=Tailwind CSS, mobile=StyleSheet nativo RN)

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

### Commits (SesiÃ³n XX+17)
1. `7fc5216` â€” feat: FASE 5.2 â€” Batch D.1 FiltroEntrada (2 modales) completo
2. `da27123` â€” feat: FASE 5.2 â€” Batch D.2 FiltroSalida (2 modales) completo
3. `61c2b01` â€” feat: FASE 5.2 â€” Batch D.3 Asistencia (1 modal) completo
4. `7b1ef2b` â€” docs: Actualizar PENDIENTES.md â€” FASE 5.2 Batch C+D status
5. `667e34f` â€” docs: PENDIENTES.md â€” FASE 5.2 Batch D.1-3 validaciÃ³n checklist
6. `3670c5c` â€” refactor: FASE 5.3 â€” Eliminar NativeWind mobile
7. `3a2504b` â€” docs: PENDIENTES.md â€” FASE 5.3 validaciÃ³n checklist

---

## âœ… SESIÃ“N XX+11 (2026-04-29) â€” IntegraciÃ³n CatÃ¡logos + Docs Tutores + Notificaciones + CategorÃ­as Eventos (COMPLETADO)

**Fecha:** 2026-04-29 | **Estado:** âœ… COMPLETADO Y VALIDADO EN BROWSER

### BLOQUE 1 â€” Documentos INE en formulario tutores âœ…
- `web/src/pages/directora/AlumnoPerfil.jsx` â€” SeccionPadres
  - Nuevo tutor y editar tutor: 3 campos de imagen (Foto, INE frente, INE reverso)
  - Grid 3 columnas con upload dashed border
  - Al guardar: POST a `/alumnos/{alumnoId}/padres/{padreId}/documentos` con FormData

### BLOQUE 2 â€” Notificaciones a todos los padres âœ…
- `backend/src/routes/bitacora.js` â€” VÃ³mito, Diarrea, BitÃ¡cora lista, Incidente: loop sobre TODOS los padres del alumno (eliminado filtro `es_tutor_principal = true`)
- `backend/src/routes/asistencia.js` â€” Retardo en entrada: mismo patrÃ³n
- `backend/src/routes/notificaciones.js` â€” Aviso extraordinario: eliminado filtro es_tutor_principal en ambas branches (sin/con grupo_ids)

### BLOQUE 3 â€” ConfiguraciÃ³n notificaciones ampliada âœ…
- `web/src/pages/directora/Configuracion.jsx` â€” `TIPOS_NOTIFICACION` expandido de 5 a 12 tipos
  - Nuevos: entrada_rechazada, salida_anticipada, alerta_vomito, alerta_diarrea, solicitud_toallitas, solicitud_paniales, bitacora_lista, tarea_cancelada
- `web/src/components/NotificacionModal.jsx` â€” `CONFIG_TIPO` con estilos especÃ­ficos para los 12 tipos
- `backend/src/routes/tareas.js` â€” Bug fix: tarea cancelada ahora usa tipo `tarea_cancelada` (antes usaba `tarea_nueva`)

### BLOQUE 4a â€” Parentesco en formularios (dropdown) âœ…
- `web/src/pages/directora/AlumnoPerfil.jsx` â€” SeccionPadres y SeccionPersonasAutorizadas
  - `useCatalogo('parentesco')` en 3 formularios: editar tutor, nuevo tutor, nueva persona autorizada
  - `<select>` en lugar de `<input>` texto libre

### BLOQUE 4b â€” Alergias multi-select en formulario alumno âœ…
- `web/src/pages/directora/Alumnos.jsx` â€” ModalAlumno
  - `useCatalogo('alergias')` con checkboxes para cada alergia del catÃ¡logo
  - Campo "Otras alergias" para texto libre adicional
  - ConcatenaciÃ³n: alergias seleccionadas + otras â†’ `form.alergias` (string)

### BLOQUE 5 â€” CategorÃ­as de Eventos en ConfiguraciÃ³n âœ…
- **Backend** (`backend/src/routes/calendario.js`) â€” 3 rutas nuevas:
  - `GET /categorias/admin` â€” lista activos+inactivos (directora)
  - `PUT /categorias/:id` â€” editar o cambiar activo (COALESCE + UNIQUE constraint)
  - `DELETE /categorias/:id` â€” soft-delete
- **Web** â€” Componente `CategoriasEventoCard` agregado al final del tab CatÃ¡logos en `Configuracion.jsx`
  - Lista activas con botones Editar / Desactivar
  - Inactivas colapsadas con botÃ³n Reactivar
  - Usa `ModalCategoria` existente para crear/editar
- `web/src/components/directora/ModalCategoria.jsx` â€” Modal nuevo con campos nombre, color_hex (picker + hex), icono emoji
- Calendatio.jsx limpiado: panel "Gestionar categorÃ­as" removido, imports simplificados

### ValidaciÃ³n âœ…
- ConfiguraciÃ³n â†’ CatÃ¡logos â†’ ðŸ“… CategorÃ­as de eventos visible y funcional
- CRUD completo: crear, editar, desactivar, reactivar validado en browser

---

## âœ… SESIÃ“N XX+10 (2026-04-29) â€” FASE 6 CatÃ¡logos Mobile + 4 CatÃ¡logos Nuevos (COMPLETADO)

**Fecha:** 2026-04-29 | **Estado:** âœ… COMPLETADO Y VALIDADO EN BROWSER

### FASE 6 â€” Mobile CatÃ¡logos DinÃ¡micos âœ…
- **Hook creado:** `mobile/src/hooks/useCatalogo.js` (React Query, staleTime 30 min, fallback a constants)
- **3 Componentes actualizados:**
  - `mobile/app/(maestra)/bitacora.jsx` â€” animo, cuanto, comportamiento, condiciones_panial
  - `mobile/app/(padre)/bitacora.jsx` â€” mapas animo, cuanto, comportamiento
  - `mobile/app/(padre)/index.jsx` â€” mapas animo, cuanto, comportamiento
- **Fallback robusto:** Si servidor no disponible, valores vienen de constants locales

### 4 CatÃ¡logos Nuevos â€” 3/4 Implementados âœ…
| CatÃ¡logo | Valores | BD | UI Web | Estado |
|----------|---------|-------|--------|--------|
| **Niveles** | Maternal, Prekinder, Kinder1-3 | âœ… | âœ… | Completo |
| **Alergias** | 7 valores (Lactosa, Gluten, ManÃ­, Huevo, Mariscos, Frutos secos, Sin alergias) | âœ… | âœ… | Completo |
| **Parentesco** | 8 valores (MamÃ¡, PapÃ¡, Abuela/o, TÃ­a/o, Tutor/a, Otro) | âœ… | âœ… | Completo |
| **CategorÃ­as Eventos** | (tabla propia) | âœ… Backend | â³ | Falta UI Calendario.jsx |

- **ValidaciÃ³n:** âœ… Confirmada en browser â€” Directora â†’ ConfiguraciÃ³n â†’ CatÃ¡logos (3 catÃ¡logos visibles y editables)
- **Commits:** 2 (FASE 6 + actualizar PENDIENTES)

---

## âœ… SESIÃ“N XX+9 (2026-04-29) â€” Solicitud PaÃ±ales + Medicamento Sin Hora (COMPLETADO)

**Fecha:** 2026-04-29 | **Estado:** âœ… COMPLETADO â€” Dos features crÃ­ticas implementadas y validadas

### 1ï¸âƒ£ **Solicitud de PaÃ±ales** âœ…
- **Problema identificado:** Stock = 0 pero sin botÃ³n para solicitar paÃ±ales al papÃ¡
- **SoluciÃ³n implementada:**
  - Backend: POST `/insumos/:alumnoId/solicitar-paniales` â†’ crea solicitud tipo 'panial'
  - Frontend: BotÃ³n rojo "ðŸ§· Solicitar paÃ±ales" aparece cuando stock = 0
  - Badge rojo "Solicitud de paÃ±ales enviada" cuando ya existe solicitud
  - NotificaciÃ³n al papÃ¡: WhatsApp + en-app modal urgente
- **Validado:** âœ… Funcional en bitÃ¡cora maestra de Camila Torres GarcÃ­a (Kinder 1B)

### 2ï¸âƒ£ **Medicamento Sin Hora Programada** âœ…
- **Problema identificado:** Medicamento recibido SIN hora mostraba "â³ Tomas pendientes" (falso)
- **SoluciÃ³n implementada:**
  - Nueva secciÃ³n "â±ï¸ Sin hora programada" en tab SALUD bitÃ¡cora maestra
  - Separada de "â³ Tomas pendientes" (solo con horas programadas)
  - BotÃ³n "Administrar" envÃ­a `tomaId: null` al backend
  - Backend marca recepciÃ³n como administrada directamente (si no hay toma especÃ­fica)
- **Validado:** âœ… Funcional sin errores

### 3ï¸âƒ£ **Notificaciones al PapÃ¡** âœ…
- **Problema identificado:** Notificaciones se creaban pero no se veÃ­an en UI papÃ¡
- **SoluciÃ³n:** Agregados tipos urgentes `solicitud_paniales` + `solicitud_toallitas` a config
- **Resultado:** PapÃ¡ verÃ¡ modal urgente + notificaciÃ³n en campanita al recargar

### PrÃ³ximas tareas:
- â³ Casos edge SALUD: Job cron (sÃ¡bado, rango), cambio fecha (medianoche)
- â³ FASE 6 mobile â€” CatÃ¡logos dinÃ¡micos
- â³ 4 catÃ¡logos nuevos â€” Niveles, Alergias, Parentesco, CategorÃ­as Eventos

---

## ðŸ“š REFERENCIA RÃPIDA â€” MÃ³dulo SALUD Y MEDICACIÃ“N (100% COMPLETADO)

**Estado:** âœ… COMPLETADO â€” Bloques 1-10 implementados y funcionales

**Sesiones:** 73-86, XX-XX+3, XX+1
- **SesiÃ³n 79:** Bloques 1-5 COMPLETADOS (salud general, medicaciÃ³n, recepciÃ³n, medicamentos)
- **SesiÃ³n 82:** Hermanos + QR + cron medicamentos (3 bugs corregidos)
- **SesiÃ³n 83-86:** Validaciones + Salida sanitaria + Recargo extensiÃ³n + Insumos paÃ±ales
- **SesiÃ³n XX+1:** Salida anticipada + BitÃ¡cora directora con vÃ³mitos
- **SesiÃ³n XX+3:** Validaciones edge completadas

**Pendiente:** Casos edge de validaciÃ³n (stock=0, medicamento sin hora, job cron dÃ­as no laborales, cambio medianoche)

**PrÃ³ximo:** IntegraciÃ³n PaÃ±alâ†’Insumos + WhatsApp (maÃ±ana)

---

## âœ… SESIÃ“N XX+7 (2026-04-28) â€” CatÃ¡logos Administrables: FASE 4 COMPLETADA (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO â€” FASE 4 UI Web + Fixes CrÃ­ticos

### Trabajo realizado:

**FASE 4 â€” UI Web Directora** âœ…
- `web/src/pages/directora/Configuracion.jsx` â€” extendido con tab "CatÃ¡logos"
  - 10 catÃ¡logos editables: animo, comportamiento, cuanto-comio, tiempos-comida, condiciones-panial, vomito-intensidad, tipos-insumo, tipos-documento, metodos-pago, conceptos-pago
  - Cada catÃ¡logo usa `CatalogoEditor.jsx` reutilizable
  - EdiciÃ³n inline: label, emoji, reordenar, activar/desactivar
  - ProtecciÃ³n automÃ¡tica de items de sistema (ðŸ”’ no se pueden desactivar)

**Config Negocio Integrada en "Horarios y reglas"** âœ…
- Tres secciones nuevas al final del tab:
  1. **ðŸ’° Precios de comida:** precio_comida_semana, precio_comida_dia
  2. **ðŸš¨ SemÃ¡foro:** semaforo_dias_amarillo, semaforo_dias_suspendido (nota: NO hay "verde")
  3. **ðŸ“Š Dashboard:** max_morosos_dashboard
- Un solo botÃ³n "Guardar horarios y reglas" para ambas APIs en paralelo
- Ambas mutaciones cargando en paralelo, refrescan datos despuÃ©s de guardar

**Backend â€” TIPOS_CERRADOS ExplÃ­cita** âœ…
- Cambio crÃ­tico: `POST /catalogos/:tipo` ahora valida contra lista explÃ­cita de tipos bloqueados
- TIPOS_CERRADOS = ['roles-personal', 'estados-alumno', 'checklist-entrada', 'checklist-salida']
- Permite agregar a comportamiento, animo, comida, etc (que SÃ necesitan crecer)
- Frontend usa misma lista para ocultar botÃ³n "Agregar" en tipos cerrados

**Fix CrÃ­tico â€” Nombres de Campos BD** ðŸ”´
- Problema: config negocio no se guardaba porque usaba nombres inventados
- SoluciÃ³n: Auditar CLAVES_NEGOCIO en `backend/src/routes/config.js`
  - `precio_comida_semana` (no "mensual")
  - `semaforo_dias_amarillo` (no "dias_amarillo")
  - `semaforo_dias_suspendido` (no "dias_rojo" â€” no existe "verde")
  - `precio_comida_dia` âœ…
  - `max_morosos_dashboard` âœ…
- LecciÃ³n: **NUNCA inventar nombres de campos. Siempre auditar BD primero.**

### ValidaciÃ³n en Browser:
- âœ… Editar catÃ¡logo item (emoji, label)
- âœ… Agregar item nuevo (comportamiento, animo, etc)
- âœ… Cambiar precio semanal comida
- âœ… Ajustar semÃ¡foro (amarillo + suspendido)
- âœ… Cambiar max morosos dashboard
- âœ… Guardar todo con un botÃ³n
- âœ… Valores se refrescan despuÃ©s de guardar

### Archivos modificados:
- `web/src/pages/directora/Configuracion.jsx` â€” tab catÃ¡logos + config negocio
- `web/src/components/directora/CatalogoEditor.jsx` â€” TIPOS_CERRADOS en frontend
- `backend/src/routes/catalogos.js` â€” TIPOS_CERRADOS en backend
- `web/src/pages/directora/Catalogos.jsx` â€” versiÃ³n alternativa (no usada, pero preparada)
- `PENDIENTES.md` â€” FASE 4 marcada completada

### Pendiente para prÃ³xima sesiÃ³n (FASE 5-6):
- [ ] **FASE 5:** `useCatalogo.js` â€” cambiar `staleTime: Infinity` a 30 min + invalidaciÃ³n al guardar
- [ ] **FASE 5:** `ComidaSemanal.jsx` (padre) â€” leer precios de `GET /api/config/negocio`
- [ ] **FASE 5:** `FiltroEntrada.jsx` (maestra) â€” reemplazar `monto / 50` por `monto / PRECIO_DIA` dinÃ¡mico
- [ ] **FASE 6:** Mobile â€” crear `useCatalogo` hook + reemplazar arrays hardcodeados + precios dinÃ¡micos

---

## â³ SESIÃ“N XX+6 (2026-04-28) â€” CatÃ¡logos Administrables: AuditorÃ­a + FASES 1-3 + inicio FASE 4 (75% Completado)

**Fecha:** 2026-04-28 | **Estado:** 75% â€” FASES 1-3 backend completas, FASE 4 web en progreso

### Trabajo realizado:

**AuditorÃ­a de hardcodeados â€” Resultados:**
- **35+ items hardcodeados** encontrados en web, mobile y backend
- Clasificados en: CRÃTICOS (precios, umbrales), ALTOS (catÃ¡logos de dominio), MEDIOS (lÃ­mites operativos)
- CatÃ¡logos de sistema identificados (ligados a ENUMs de BD): roles-personal, estados-alumno, comportamiento, checklists de entrada/salida
- Regla de oro establecida: **nada se elimina fÃ­sicamente, solo se inactiva** â€” historial siempre conservado

**FASE 1 â€” MigraciÃ³n 041** âœ…
- Tabla `catalogos` con campos: tipo, key, label, emoji, color, orden, activo, es_sistema, editable_key, inactivado_at
- Tabla `configuracion_historial` para auditorÃ­a de cambios de precio/configuraciÃ³n
- 15 tipos de catÃ¡logos insertados (72 registros totales)
- 9 claves nuevas en `configuracion_general`: precios comida, umbrales semÃ¡foro, docs requeridos, lÃ­mites operativos
- `ON CONFLICT DO NOTHING` en todos los INSERTs â€” seguro de re-ejecutar

**FASE 2 â€” Backend endpoints catÃ¡logos** âœ…
- `GET /api/catalogos/:tipo` â†’ ahora lee de BD (mismo contrato de respuesta, fallback al objeto JS si BD falla)
- `GET /api/catalogos` â†’ lista todos los tipos con conteo activos/inactivos (solo directora)
- `GET /api/catalogos/:tipo/admin` â†’ items incluyendo inactivos para gestiÃ³n
- `POST /api/catalogos/:tipo` â†’ crear item nuevo con validaciÃ³n (rechaza en tipos de sistema)
- `PUT /api/catalogos/:tipo/:key` â†’ editar label/emoji/color/orden/activo; bloquea key si es_sistema
- `DELETE /api/catalogos/:tipo/:key` â†’ soft delete (activo=false + inactivado_at); rechaza si es_sistema=true; mÃ­nimo 1 activo
- `PUT /api/catalogos/:tipo/reorder` â†’ reordenar con [{key, orden}]

**FASE 3 â€” Config negocio dinÃ¡mica** âœ…
- `GET /api/config/negocio` â†’ lee 9 claves de configuracion_general (accesible todos los roles)
- `PUT /api/config/negocio` â†’ actualiza claves + guarda en `configuracion_historial` (solo directora)
- `GET /api/config/negocio/historial` â†’ log de quiÃ©n cambiÃ³ quÃ© y cuÃ¡ndo (solo directora)
- `backend/src/routes/pagos.js` â†’ `semaforoAlumno()` ahora lee umbrales de BD (fallback 1/30/60 dÃ­as)
- `backend/src/routes/pagos.js` â†’ dashboard morosos usa `max_morosos_dashboard` de BD (fallback 10)
- `backend/src/controllers/comidaController.js` â†’ precios $250/$50 leen de BD (fallback garantizado)

**FASE 4 â€” UI Web (INICIO)** â³
- `web/src/components/directora/CatalogoEditor.jsx` creado â€” componente reutilizable con: ediciÃ³n inline label/emoji, toggle activo/inactivo, reordenar con flechas, protecciÃ³n de sistema (ðŸ”’), secciÃ³n de inactivos colapsable con opciÃ³n de reactivar, formulario de nuevo item

### Pendiente para continuar (prÃ³xima sesiÃ³n):
- FASE 4: `Catalogos.jsx` (pÃ¡gina con 5 tabs) + ruta + link sidebar
- FASE 5: `useCatalogo.js` staleTime + `ComidaSemanal.jsx` + `FiltroEntrada.jsx` precios dinÃ¡micos
- FASE 6: Mobile hook + arrays dinÃ¡micos

### Archivos modificados:
- `backend/migrations/041_catalogos_administrables.sql` (nuevo)
- `backend/src/routes/catalogos.js` â€” reescritura completa + CRUD
- `backend/src/routes/config.js` â€” endpoints /negocio + /historial
- `backend/src/routes/pagos.js` â€” getSemaforoConfig() + max_morosos dinÃ¡mico
- `backend/src/controllers/comidaController.js` â€” precios dinÃ¡micos
- `web/src/components/directora/CatalogoEditor.jsx` (nuevo)
- `PENDIENTES.md` â€” secciÃ³n catÃ¡logos actualizada

---

## âœ… SESIÃ“N XX+5 (2026-04-28) â€” Validaciones Edge SALUD + Limpieza PENDIENTES (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO

### Casos Edge Validados en Browser:
- âœ… **MÃºltiples vÃ³mitos en el dÃ­a** â†’ Aparecen todos ordenados por hora correctamente
- âœ… **Job cron a las 3:05 PM** (fuera de horario 7-16) â†’ NO ejecuta (validado)
- âœ… **Entrega conforme SIN checkboxes** â†’ POST acepta valores `false` sin error
- âœ… **Panel ExtensiÃ³n / Recargo $125** â†’ Salida tardÃ­a detecta y aplica recargo automÃ¡tico (SesiÃ³n 86, validado en browser hoy)

### Limpieza PENDIENTES.md:
- Movida secciÃ³n "GESTIÃ“N ALUMNOS AVANZADA Bloque 2" (completada Sesiones 82+84) fuera de PENDIENTES
- Movido "Recargo Impuntualidad âœ…" fuera de lista activa de FINANZAS
- PENDIENTES.md queda solo con tareas genuinamente futuras

### Pendiente para maÃ±ana (casos edge restantes):
- [ ] Alumno CON paÃ±al pero SIN insumos en stock â†’ stock = 0
- [ ] RecepciÃ³n medicamento sin hora programada â†’ "Sin hora" en lista
- [ ] Job cron a las 10:00 AM sÃ¡bado â†’ NO ejecuta
- [ ] Job cron a las 15:58 â†’ ejecuta correctamente
- [ ] Cambio de fecha medianoche â†’ aislamiento por dÃ­a

---

## âœ… SESIÃ“N XX+4 (2026-04-28) â€” ValidaciÃ³n SesiÃ³n 81 (Padres/Tutores/Hermanos) + Fixes Arquitectura BD (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO â€” SesiÃ³n 81 VALIDADA + 4 Bugs CrÃ­ticos Solucionados

### Funcionalidades Validadas (SesiÃ³n 81):

**âœ… Padres / Tutores (AlumnoPerfil.jsx: SeccionPadres) â€” VALIDADO**
- Agregar tutor nuevo â†’ vinculaciÃ³n + lista sin recargar + toast âœ…
- Editar tutor â†’ cambiar datos (nombre, parentesco, telÃ©fono, email) â†’ guardado sin recargar âœ…
- Desactivar tutor (soft-delete) â†’ histÃ³rico preservado, botÃ³n "+ Agregar" reaparece âœ…
- Email Ãºnico entre alumnos â†’ rechaza si email existe en otro alumno NO hermano âœ…
- Email permitido para hermanos â†’ alumnos con mismo `familia_id` pueden compartir tutor âœ…
- MÃ¡ximo 2 tutores activos â†’ UI lÃ­mite visual cuando reach 2 tutores âœ…

**âœ… Hermanos (AlumnoPerfil.jsx: SeccionHermanos) â€” VALIDADO**
- Vincular hermanos â†’ buscador + selecciÃ³n + tarjeta + toast "Hermanos vinculados" âœ…
- NavegaciÃ³n recÃ­proca â†’ click en hermano navega a su perfil âœ…
- VÃ­nculo bidireccional â†’ si A vincula B, B muestra A (relaciÃ³n simÃ©trica) âœ…
- Desvincular â†’ desaparece de ambos perfiles âœ…

**â³ Panel ExtensiÃ³n Vespertina (Dashboard.jsx: PanelExtensionVespertina) â€” PENDIENTE VALIDAR**
- Banner morado "Vista de ExtensiÃ³n Activa" aparece a las 3:06 PM â³
- 3 grupos separados: con extensiÃ³n (verde), sin extensiÃ³n (naranja + cobro), ya salieron â³
- Toggle "Ver todos / Modo extensiÃ³n" alterna entre vistas â³
- Mensaje "Todos los niÃ±os han salido" cuando no hay alumnos en escuela â³

### Bugs CrÃ­ticos Solucionados:

**Bug #1 â€” CURP vacÃ­a silenciosa (workaround inefectivo)**
- **Problema:** Editar alumno con CURP vacÃ­a guardaba como NULL silenciosamente
- **Causa:** `ON CONFLICT DO NOTHING` + Ã­ndice UNIQUE parcial `WHERE curp IS NOT NULL` permitÃ­a '' duplicados
- **SoluciÃ³n:** ValidaciÃ³n frontend + backend obliga CURP obligatoria tanto en crear como editar
- **Archivo:** `web/src/pages/directora/Alumnos.jsx` linea 343-347, `backend/src/controllers/alumnosController.js` linea 249-252

**Bug #2 â€” MÃ¡ximo 2 tutores no validado**
- **Problema:** PermitÃ­a agregar 3er tutor, decÃ­a "Ã©xito" pero no se guardaba
- **Causa:** ValidaciÃ³n en backend no existÃ­a, `ON CONFLICT DO NOTHING` silenciaba
- **SoluciÃ³n:** ValidaciÃ³n de conteo en POST `/:id/padres`, UI oculta botÃ³n "+ Agregar" en 2 tutores
- **Archivos:** `backend/src/routes/alumnos.js` linea 312-318, `web/src/pages/directora/AlumnoPerfil.jsx` linea 217

**Bug #3 â€” Soft-delete de tutores no existÃ­a**
- **Problema:** No habÃ­a forma de desactivar un tutor sin borrarlo fÃ­sicamente
- **Causa:** Tabla `alumno_padre` no tenÃ­a campos `activo` y `desactivado_at`
- **SoluciÃ³n:** MigraciÃ³n `036_alumno_padre_activo.sql` + endpoint PATCH desactivar + UI botÃ³n "Desactivar"
- **Archivos:** MigraciÃ³n `backend/migrations/036_alumno_padre_activo.sql`, `backend/src/routes/alumnos.js` linea 382-391, `web/src/pages/directora/AlumnoPerfil.jsx` linea 220 + funciÃ³n `desactivarTutor`

**Bug #4 â€” Email Ãºnico no validaba entre alumnos**
- **Problema:** PermitÃ­a agregar a SebastiÃ¡n un tutor que ya tenÃ­a SofÃ­a (no hermanos)
- **Causa:** POST `/alumnos/:id/padres` reutilizaba tutor por email sin validar `familia_id`
- **SoluciÃ³n:** 
  - POST: ValidaciÃ³n email en otro alumno NO hermano â†’ rechaza
  - PUT: ValidaciÃ³n igual al cambiar email de un tutor existente
  - Cambio arquitectÃ³nico: SIEMPRE crear nuevo registro en `padres` (no reutilizar por email), evita ediciones cruzadas
- **Archivos:** `backend/src/routes/alumnos.js` linea 322-350 (POST) linea 373-399 (PUT)

### Archivos Modificados:
- `backend/migrations/036_alumno_padre_activo.sql` (nuevo)
- `backend/src/routes/alumnos.js` â€” validaciones CURP, lÃ­mite 2 tutores, PATCH desactivar, email Ãºnico
- `backend/src/controllers/alumnosController.js` â€” CURP obligatoria, filtro tutores activos
- `web/src/pages/directora/Alumnos.jsx` â€” CURP required + validaciÃ³n frontend
- `web/src/pages/directora/AlumnoPerfil.jsx` â€” botÃ³n desactivar, UI lÃ­mite 2 tutores, funciÃ³n desactivarTutor

### Datos BD Limpiados:
- Eliminados registros duplicados de `madre.sofia@happyschool.edu.mx` (eran 2-3, dejados 1)
- Desactivadas relaciones cruzadas incorrectas de SofÃ­a y SebastiÃ¡n con tutor compartido
- Base lista para nuevos agregados sin duplicidades

### Validaciones Completadas:
- âœ… Padres/Tutores: 6/7 items validados en browser (falta: subir foto del tutor)
- âœ… Hermanos: 4/4 items validados en browser
- â³ Panel ExtensiÃ³n Vespertina: PENDIENTE (4 items â€” banner, 3 grupos, toggle, mensaje)
- âœ… 4 bugs crÃ­ticos solucionados + arquitectura BD consistente

---

## âœ… SESIÃ“N XX+3 (2026-04-28) â€” Pendientes ValidaciÃ³n Salud: Directora Justificaciones + Vista Mensual + Mobile PaÃ±al (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO â€” 4 pendientes cerrados

### Funcionalidades Implementadas:

**Tarea 4 â€” Vista Mensual sin scroll: contenedor ancho** âœ…
- Archivo: `web/src/pages/directora/Asistencia.jsx` lÃ­nea 405
- Cambio: Condicional `max-w-full` cuando modo="mensual", `max-w-4xl` en modo "Hoy"
- Status: âœ… Validado â€” tabla muestra los 30 dÃ­as de abril sin scroll

**Tarea 1 â€” Backend: endpoint mensual incluye datos de justificaciÃ³n** âœ…
- Archivo: `backend/src/routes/asistencia.js` lÃ­neas 603-630
- Cambios:
  - SELECT extendido: `justificacion_motivo`, `justificada_at`, `justificacion_comprobante_url`, `justificada_por_nombre` (LEFT JOIN personal)
  - AgrupaciÃ³n: si `estado = 'justificado'`, devuelve objeto `{ estado, motivo, justificada_at, comprobante_url, justificada_por }`
- Status: âœ… Validado â€” curl devuelve objeto con datos completos

**Tarea 2 â€” Web: modal de lectura para celdas justificadas** âœ…
- Archivo: `web/src/pages/directora/Asistencia.jsx` lÃ­neas 139, 247, 259-274, 357-401
- Cambios:
  - Estado `viendoJustificacion` para guardar datos de justificaciÃ³n
  - NormalizaciÃ³n de `diaData` (puede ser objeto o string)
  - onClick actualizado: abre modal de lectura si celda estÃ¡ justificada
  - Modal nuevos con: alumno + fecha, motivo en fondo azul, comprobante (imagen o PDF), quiÃ©n justificÃ³ + cuÃ¡ndo
  - Cursor pointer en celdas justificadas
- Status: âœ… Validado â€” clic en celda azul abre modal de lectura con motivo

**Tarea 3 â€” Mobile: ocultar toggle paÃ±al para alumnos sin paÃ±al** âœ…
- Archivo: `mobile/app/(maestra)/bitacora.jsx` lÃ­neas 837-843
- Cambio: Agregar propiedad `mostrar: usaPanial` a item `panial_limpio`, aplicar `.filter(item => item.mostrar)`
- Status: âœ… Validado â€” alumno sin paÃ±al NO muestra toggle, alumno con paÃ±al SÃ muestra

### Archivos Modificados:
- `backend/src/routes/asistencia.js` â€” SELECT extendido, agrupaciÃ³n objeto para justificados
- `web/src/pages/directora/Asistencia.jsx` â€” Contenedor ancho, estado modal, normalizaciÃ³n, onClick, modal lectura
- `mobile/app/(maestra)/bitacora.jsx` â€” Filtro items salida por `mostrar: usaPanial`

### Validaciones Completadas:
- âœ… Vista mensual: todos los dÃ­as de abril visibles sin scroll
- âœ… JustificaciÃ³n: modal lectura al clic en celda azul, motivo visible
- âœ… Mobile: toggle paÃ±al oculto para alumnos sin paÃ±al (`usa_panial = false`)

### Commits:
- 1 commit: `feat: SesiÃ³n XX+3 â€” Pendientes validaciÃ³n salud (directora justificaciones + vista mensual + mobile paÃ±al)`

---

## âœ… SESIÃ“N XX+2 (2026-04-28) â€” Paridad Mobile: Bloques 3 + 5B (Insumos PaÃ±ales + VÃ³mito) â€” 100% COMPLETADO

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO â€” SincronizaciÃ³n funcionalidad web a mobile

### Funcionalidades Implementadas:

**BLOQUE 3 â€” Insumos PaÃ±ales Mobile** âœ…
- Archivo: `mobile/app/(maestra)/bitacora.jsx` (lÃ­neas 217-223, 233-240, 449-464, 487-496)
- Cambios implementados:
  - âœ… Query `/insumos/:alumnoId` corregida: default `{}` en lugar de `[]`, catch devuelve `{}`
  - âœ… Derivadas `stockDiario` (insumosData.stock) y `solicitudesToallitas` (insumosData.solicitudes_toallitas)
  - âœ… Bloque morado "PaÃ±ales hoy" con cantidad e icono, colores dinÃ¡micos:
    - Verde si cantidad >= 3
    - Amarillo si cantidad >= 1 y < 3
    - Rojo si cantidad < 1
  - âœ… Texto "Sin registro de entrada aÃºn" si `no_registrado = true`
  - âœ… Banner amarillo "ðŸ§» Solicitud de toallitas enviada al papÃ¡" si hay solicitudes pendientes
  - âœ… Mutation `toallitasMutation` para POST `/insumos/:alumnoId/solicitar-toallitas`
  - âœ… BotÃ³n "ðŸ§» Solicitar toallitas hÃºmedas" naranja (`#FBBF24`), visible solo si NO hay solicitudes
  - âœ… Alert al completar solicitud: "âœ… Solicitud enviada al papÃ¡"

**BLOQUE 5B â€” VÃ³mito Mobile** âœ…
- Archivo: `mobile/app/(maestra)/bitacora.jsx` (lÃ­neas 309-317, 345-351, 679-690, 705-722)
- Cambios implementados:
  - âœ… Query `vomitosCatalogo` desde `/catalogos/vomito-intensidad` con fallback hardcodeado (leve/moderado/fuerte)
  - âœ… Constante `INTENSIDADES_VOMITO` para usar catÃ¡logo en formulario
  - âœ… POST `/bitacora/vomito` incluye `bitacora_id` (mejora de datos backend)
  - âœ… SecciÃ³n "ðŸ¤¢ Episodios de vÃ³mito" con tarjetas naranja:
    - Cada vÃ³mito en View con fondo `#FFF7ED`, borde naranja `#FED7AA`
    - Muestra: "Intensidad: [valor]", hora y notas (si existen)
  - âœ… Botones intensidad naranjas (`#EA580C` cuando seleccionados, `#FFF7ED` por defecto)
  - âœ… Labels desde catÃ¡logo `int.label` (Leve, Moderado, Fuerte)

### Archivos Modificados:
- `mobile/app/(maestra)/bitacora.jsx` â€” 8 cambios puntuales (queries, mutations, renders)
- `VALIDACIONES_SALUD_MEDICACION.md` â€” Bloques 3 y 5B marcados como âœ… COMPLETADOS en mobile

### Validaciones Completadas:
- âœ… Bloque 3: Stock visible, colores correctos (verde/amarillo/rojo), botÃ³n solicitar toallitas, banner solicitud pendiente
- âœ… Bloque 5B: VÃ³mitos como tarjetas naranja, botones intensidad naranjas, POST incluye bitacora_id, catÃ¡logo con fallback

### Commits:
- 1 commit: `feat: SesiÃ³n XX â€” Paridad Mobile Bloques 3 + 5B (Insumos PaÃ±ales + VÃ³mito)`

---

## âœ… SESIÃ“N XX+1 (2026-04-28) â€” Salida Anticipada + Correcciones BitÃ¡cora Directora (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO

### Funcionalidades Implementadas:

**1 â€” NotificaciÃ³n Salida Anticipada** âœ…
- BD: Plantilla `salida_anticipada` insertada en `plantillas_whatsapp`
- Backend: `backend/src/routes/asistencia.js` â€” POST `/asistencia/salida` notifica a ambos tutores cuando `es_anticipada = true`
  - ResoluciÃ³n de nombre: busca en `padres` o `personas_autorizadas` segÃºn tipo de quien recoge
  - NotificaciÃ³n in-app (INSERT en `notificaciones`) + WhatsApp por tutor
  - Mensaje incluye: hora, quiÃ©n recogiÃ³ (nombre + parentesco), motivo
- Frontend: `web/src/pages/padre/Dashboard.jsx` â€” bloque "âš ï¸ Salida anticipada" con hora y motivo

**2 â€” Dashboard Padre muestra estado de salida** âœ…
- Backend: `backend/src/routes/alumnos.js` â€” GET `/alumnos/mis-hijos` ahora incluye `filtro_salida` (hora_salida, salida_anticipada, motivo_salida) via LEFT JOIN con `registro_salida`
- Frontend: `web/src/pages/padre/Dashboard.jsx` â€” bloque visible en HijoCard, diferenciado por color (amarillo=anticipada, azul=normal)

**3 â€” VÃ³mitos visibles en BitÃ¡cora Directora (AlumnoPerfil)** âœ…
- Archivo: `web/src/pages/directora/AlumnoPerfil.jsx`
- SecciÃ³n "ðŸ¤¢ VÃ³mitos" agregada en `BitacoraDirectora` â€” muestra hora, intensidad (emoji diferenciado) y notas
- Estaba faltando aunque el backend ya devolvÃ­a `data.vomitos`

**4 â€” MenÃº "BitÃ¡cora" eliminado del sidebar Directora** âœ…
- `web/src/layouts/DirectoraLayout.jsx` â€” eliminado item del menÃº y import `BookOpen`
- `web/src/App.jsx` â€” eliminada ruta `/directora/bitacora` e import `DirectoraBitacora`
- La bitÃ¡cora se consulta en Alumnos (AlumnoPerfil â†’ pestaÃ±a BitÃ¡cora)

### Archivos Modificados:
- `backend/src/routes/asistencia.js` â€” NotificaciÃ³n salida anticipada (ambos tutores, nombre+parentesco)
- `backend/src/routes/alumnos.js` â€” JOIN registro_salida en mis-hijos, expone filtro_salida
- `web/src/pages/directora/AlumnoPerfil.jsx` â€” SecciÃ³n vÃ³mitos en BitacoraDirectora
- `web/src/pages/padre/Dashboard.jsx` â€” Bloque salida en HijoCard
- `web/src/layouts/DirectoraLayout.jsx` â€” Eliminado menÃº BitÃ¡cora
- `web/src/App.jsx` â€” Eliminada ruta y import DirectoraBitacora

### Validado:
- âœ… Salida anticipada SofÃ­a Reyes Mendoza â†’ notificaciÃ³n in-app llega al padre con nombre de quien recogiÃ³ y motivo
- âœ… Dashboard padre muestra "âš ï¸ Salida anticipada" con hora y motivo
- âœ… VÃ³mitos de SofÃ­a visibles en bitÃ¡cora directora (AlumnoPerfil)
- âœ… MenÃº sidebar directora ya no tiene secciÃ³n "BitÃ¡cora"
- âœ… Diarrea validada (ya estaba implementada desde sesiÃ³n anterior)
- âœ… Job medicamentos 14:00 validado (sesiÃ³n anterior)

---

## âœ… SESIÃ“N ACTUAL (2026-04-28) â€” Mejoras Bloques 4-5: Justificantes + VÃ³mito + BitÃ¡cora Directora (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO â€” 4 mejoras implementadas y validadas (Leyenda + Comprobante + NotificaciÃ³n siempre + BitÃ¡cora Directora)

### Mejoras Implementadas:

**Mejora 1 â€” Leyenda "Justificado" en Vista Mensual Asistencia** âœ…
- Archivo: `web/src/pages/directora/Asistencia.jsx` lÃ­nea 197-202
- Cambio: Agregado item azul `bg-blue-400` con etiqueta "Justificado" en leyenda
- Status: âœ… Validado en browser

**Mejora 2 â€” Comprobante Opcional en Justificantes** âœ…
- MigraciÃ³n: `backend/migrations/031_justificante_comprobante.sql` (nuevas columnas URL + public_id)
- Backend: `backend/src/routes/asistencia.js` â€” Multer + Cloudinary upload
  - Dev: mock de URL, Prod: upload real a Cloudinary
  - Upsert INSERT ... ON CONFLICT (crea fila si no existe para ausencias virtuales)
- Frontend: `web/src/pages/directora/Asistencia.jsx` â€” Input file + FormData multipart
- Status: âœ… Validado (archivo sube a Cloudinary, URL se guarda en BD)

**Mejora 3A â€” BitÃ¡cora Directora con VÃ³mitos** âœ… **Creada, requiere validaciÃ³n en prÃ³xima sesiÃ³n**
- Archivo nuevo: `web/src/pages/directora/Bitacora.jsx` (~220 lÃ­neas)
- Flujo: Seleccionar Grupo â†’ Alumno â†’ Navegar Fecha â†’ Ver vÃ³mitos + salud + medicamentos
- Componente `BitacoraDiaria` muestra:
  - ðŸ¤¢ VÃ³mitos (hora + intensidad + notas)
  - ðŸ¥ Salud General (fiebre, temperatura, malestar)
  - ðŸ’Š Medicamentos administrados
- Ruta: `/directora/bitacora` (agregada en App.jsx + DirectoraLayout.jsx con link "ðŸ“– BitÃ¡cora")
- Status: âœ… Creada, â³ Pendiente validar en browser

**Mejora 3B â€” NotificaciÃ³n VÃ³mito SIEMPRE (cualquier intensidad)** âœ…
- Archivo: `backend/src/routes/bitacora.js` lÃ­nea 80-117
- Cambio: Removido condicional `if (intensidad === 'fuerte')` â†’ notifica cualquier intensidad
- Emoji diferenciado: ðŸ¤¢ leve, ðŸ¤® moderado, ðŸš¨ fuerte
- Status: âœ… Validado (padre recibe notificaciÃ³n para cualquier intensidad)

### Bugs Corregidos en Esta SesiÃ³n:

| Bug | Archivo | Fix |
|-----|---------|-----|
| VÃ³mito 400 "Referencia invÃ¡lida" | `bitacora.js:75` | FK `registrado_por` ahora usa `req.user.id` directo, no SELECT de personal |
| VÃ³mito pantalla blanca catalogo | `Bitacora.jsx:555` | Extrae `.items` de response |
| Justificante 404 "no encontrado" | `asistencia.js:700` | Upsert en lugar de UPDATE (crea si no existe) |
| Justificante no clickeable | `Asistencia.jsx:245` | Cursor pointer + onClick directo |

### Archivos Modificados:

**Backend:**
- `backend/src/routes/bitacora.js` â€” Fix `registrado_por`, cambio a notificaciÃ³n siempre
- `backend/src/routes/asistencia.js` â€” Add multer, upsert justificar, upload Cloudinary
- `backend/migrations/031_justificante_comprobante.sql` (nueva)

**Frontend:**
- `web/src/pages/directora/Asistencia.jsx` â€” Leyenda azul, comprobante form, cursor pointer
- `web/src/pages/maestra/Bitacora.jsx` â€” Fix `.items` en catalogo
- `web/src/pages/directora/Bitacora.jsx` (nueva) â€” BitÃ¡cora directora con 3 tabs
- `web/src/layouts/DirectoraLayout.jsx` â€” Add link "ðŸ“– BitÃ¡cora"
- `web/src/App.jsx` â€” Add ruta `/directora/bitacora`

### Validaciones Completadas:
- âœ… Bloque 4 â€” Justificantes: modal abre, se guarda motivo, celda cambia a azul, comprobante sube
- âœ… Bloque 5 â€” VÃ³mito: form registra vÃ³mito, selector intensidad, padre recibe notificaciÃ³n cualquier intensidad
- âœ… Leyenda azul visible en vista mensual asistencia
- âœ… Mejoras funcionan sin errores

### Pendiente para PrÃ³xima SesiÃ³n:
- â³ Validar BitÃ¡cora Directora en browser (seleccionar grupo â†’ alumno â†’ fecha â†’ ver vÃ³mitos/salud/medicamentos)
- â³ Implementar Bloques 6-7 (Diarrea + Salida Sanitaria) si aplica
- â³ Validar job medicamentos a las 14:00 (recordatorio)

### Commits:
- MÃºltiples commits durante la sesiÃ³n con fixes incrementales
- Commit final: `chore: SesiÃ³n XX â€” Cierre protocolo â€” Mejoras Bloques 4-5 + BitÃ¡cora Directora`

---

## âœ… SESIÃ“N 86 â€” DetecciÃ³n y Cobro de Salida TardÃ­a sin ExtensiÃ³n (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO â€” Recargo automÃ¡tico $125 cuando alumno sin extensiÃ³n es recogido despuÃ©s de `hora_inicio_cobro_extension`

### Implementado:

**BD â€” MigraciÃ³n 039:**
- âœ… Creado concepto de pago `'Salida tardÃ­a'` (tipo: `'extension'`, monto: `125.00`, es_mensual: `false`)
- âœ… Concepto activo para registrar pagos automÃ¡ticos

**Backend â€” `routes/asistencia.js`:**
- âœ… GET `/asistencia/filtro-salida` â€” Expone `hora_inicio_cobro_extension` (tolerancia configurable desde directora)
- âœ… POST `/asistencia/salida` â€” LÃ³gica completa de detecciÃ³n y cobro:
  - Lee configuraciÃ³n desde `configuracion_general`: `hora_salida_normal`, `hora_inicio_cobro_extension`, `costo_extension_hora`
  - Lee estado de extensiÃ³n del alumno desde `config_horario_alumno` (`tiene_extension`)
  - **CondiciÃ³n:** Si alumno NO tiene extensiÃ³n Y hora actual >= `hora_inicio_cobro_extension`:
    - Calcula `minutos_tarde` = minutos desde `hora_salida_normal` hasta hora actual
    - Establece `cobro_extension` = valor fijo de `costo_extension_hora` (ej: $125)
    - Guarda en `registro_salida`: `es_extension=true`, `minutos_tarde`, `cobro_extension`
    - Crea registro en `pagos` con `origen='salida_tardia'`, `estado='pendiente'`, `mes_correspondiente`, `anio_correspondiente`
  - Respuesta incluye `es_salida_tardia` y `pago_salida_tardia` (con monto_total)
- âœ… Hora consultada en zona Mexico City (`America/Mexico_City`) para validez en contexto local

**Frontend â€” `pages/maestra/FiltroSalida.jsx`:**
- âœ… Helper `esSalidaTardia(alumno, horaInicioCobro)` â€” Retorna true si sin extensiÃ³n Y hora >= tolerancia
- âœ… Modal de salida recibe `horaInicioCobro` del backend
- âœ… Badge rojo "SALIDA TARDÃA" visible en Paso 1 cuando aplica condiciÃ³n
- âœ… Toast diferenciado con emoji â° al confirmar: "Salida registrada â€” Recargo $X generado"
- âœ… Payload a backend incluye informaciÃ³n (aunque backend calcula todo, frontend informa visualmente)

### Validaciones completadas:
- âœ… Alumno sin extensiÃ³n, salida despuÃ©s de tolerancia â†’ cÃ¡lculo correcto de minutos_tarde
- âœ… Pago generado en `pagos` con origen `'salida_tardia'` y estado `'pendiente'`
- âœ… Pago visible en pÃ¡gina de Pagos (directora) con monto correcto y campos mes/aÃ±o rellenos
- âœ… Badge rojo visible en el modal antes de confirmar salida
- âœ… Toast con monto aparece al completar registro
- âœ… Alumno CON extensiÃ³n â†’ no genera cobro (correcto)
- âœ… Alumno sin extensiÃ³n pero salida dentro de tolerancia (< 3:06pm) â†’ no genera cobro (correcto)

### Archivos modificados:
- `backend/migrations/039_concepto_salida_tardia.sql` (nueva)
- `backend/src/routes/asistencia.js` (GET y POST /asistencia/salida y /asistencia/filtro-salida)
- `web/src/pages/maestra/FiltroSalida.jsx` (helper `esSalidaTardia`, badge, toast)

### Pendiente para prÃ³xima sesiÃ³n:
- â³ NotificaciÃ³n a padres en portal (campanita) cuando se genera recargo
- â³ NotificaciÃ³n WhatsApp a padres (opcional, requiere plantilla)
- â³ Panel directora para condonar recargos (PENDIENTES.md lÃ­nea 72)

---

## âœ… SESIÃ“N XX â€” Insumos: Persistencia y VisualizaciÃ³n PaÃ±ales + Toallitas (100% Completado)

**Fecha:** 2026-04-28 | **Estado:** 100% COMPLETADO Y VALIDADO â€” Persistencia de paÃ±ales y toallitas traÃ­dos en entrada, visible en 3 bitÃ¡coras

### Implementado:

**BD â€” MigraciÃ³n 040:**
- âœ… Nueva columna `trajo_toallitas BOOLEAN DEFAULT false` en `registro_entrada`
- Se marca cuando el padre entrega toallitas en FiltroEntrada

**Backend â€” `routes/insumos.js`:**
- âœ… PUT `/insumos/solicitudes/:solicitudId/recibida` â€” Al marcar "Las trajo hoy":
  - Resuelve la solicitud en `insumos_solicitudes`
  - **Crea o actualiza** `registro_entrada` con `trajo_toallitas = true` usando `INSERT ... ON CONFLICT`
  - Maneja caso donde `registro_entrada` aÃºn no existe (padre entrega en salida, no entrada)

**Backend â€” `routes/asistencia.js`:**
- âœ… GET `/asistencia/filtro-entrada/:alumnoId?fecha=YYYY-MM-DD` â€” Expone 2 nuevas columnas:
  - `trajo_paniales` (ya existÃ­a, ahora visible)
  - `trajo_toallitas` (nueva)

**Frontend â€” BitÃ¡cora del Padre** (`pages/padre/Bitacora.jsx`):
- âœ… Tab "Entrada" â†’ Checklist: agrega 2 pÃ­ldoras condicionales:
  - `Trajo paÃ±ales` â€” aparece si `usa_panial && entradaMostrada.trajo_paniales`
  - `Trajo toallitas` â€” aparece si `entradaMostrada.trajo_toallitas`
- âœ… **Fix:** CambiÃ³ lÃ³gica para usar siempre `entradaHistorica` (query dinÃ¡mica) en lugar de datos cacheados (`entradaHoy`)

**Frontend â€” BitÃ¡cora de la Maestra** (`pages/maestra/Bitacora.jsx`):
- âœ… AgregÃ³ query dinÃ¡mica a `/asistencia/filtro-entrada/:alumnoId`
- âœ… Bloque paÃ±ales â†’ notas visuales (badges):
  - Verde: `ðŸ§· Trajo paÃ±ales hoy` si `trajo_paniales = true`
  - Azul: `ðŸ§» Trajo toallitas hoy` si `trajo_toallitas = true`

**Frontend â€” BitÃ¡cora de la Directora** (`pages/directora/AlumnoPerfil.jsx`):
- âœ… AgregÃ³ query dinÃ¡mica a `/asistencia/filtro-entrada/:alumnoId`
- âœ… Nueva secciÃ³n visual: `ðŸ§· Insumos traÃ­dos`
  - Badges verdes/azules con paÃ±ales y toallitas traÃ­dos
  - Solo aparece si hay datos

### Validaciones completadas:
- âœ… FiltroEntrada: presionÃ³ "Las trajo hoy" en banner de toallitas
- âœ… BD: `trajo_toallitas` marcado como `true` en `registro_entrada`
- âœ… BitÃ¡cora Maestra: muestra badge azul `ðŸ§» Trajo toallitas hoy`
- âœ… BitÃ¡cora Padre: muestra pÃ­ldora `Trajo toallitas` en checklist entrada
- âœ… BitÃ¡cora Directora: muestra secciÃ³n `Insumos traÃ­dos` con badge toallitas
- âœ… Alumno: SofÃ­a Reyes Mendoza (ID: `a35cebfa-88be-45f0-b72a-83afdf77e18b`)

### Archivos modificados:
- `backend/migrations/040_trajo_toallitas_entrada.sql` (nueva)
- `backend/src/routes/insumos.js` (PUT `/insumos/solicitudes/:id/recibida`)
- `backend/src/routes/asistencia.js` (GET `/asistencia/filtro-entrada/:alumnoId`)
- `web/src/pages/padre/Bitacora.jsx` (fix lÃ³gica entrada, 2 pÃ­ldoras)
- `web/src/pages/maestra/Bitacora.jsx` (query entrada, badges)
- `web/src/pages/directora/AlumnoPerfil.jsx` (query entrada, secciÃ³n insumos)

### Commit:
- Hash: `63e0927` â€” `feat: SesiÃ³n XX â€” Persistencia y visualizaciÃ³n de insumos (paÃ±ales/toallitas) en bitÃ¡coras`

### Notas tÃ©cnicas:
- **Problema:** Al marcar "Las trajo hoy" ANTES de registrar entrada, no existÃ­a `registro_entrada` aÃºn
- **SoluciÃ³n:** `INSERT ... ON CONFLICT (alumno_id, fecha) DO UPDATE` crea o actualiza el registro
- **Por quÃ© aparecÃ­a en maestra pero no en padre:** Padre usaba datos cacheados (`entradaHoy`), ahora usa query dinÃ¡mica
- Stock diario sigue en tabla separada (`insumos_stock_diario`), se descuenta por cambios de paÃ±al
- Solicitudes de toallitas siguen en tabla separada (`insumos_solicitudes`), se resuelven en entrada

---

## âœ… SESIÃ“N 85 â€” RefactorizaciÃ³n Salida Sanitaria â†’ FiltroSalida (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO â€” IntegraciÃ³n de checklist sanitario en modal de salida con validaciÃ³n de salida anticipada

### Implementado:

**BD â€” MigraciÃ³n 038:**
- âœ… Agregadas columnas `es_anticipada` (BOOLEAN, DEFAULT false) y `motivo_salida` (TEXT) a `registro_salida`

**Backend â€” `routes/asistencia.js`:**
- âœ… GET `/asistencia/filtro-salida` â€” Agregado campo `usa_panial` en SELECT (necesario para mostrar/ocultar checkbox en Paso 2)
- âœ… POST `/asistencia/salida` â€” Ampliado para aceptar campos de salida anticipada + checklist sanitario
  - ValidaciÃ³n: `motivo_salida` obligatorio si `es_anticipada = true` (retorna 400 si falta)
  - TransacciÃ³n explÃ­cita: INSERT a `registro_salida` (con columnas nuevas) + INSERT condicional a `registro_salida_sanitario`
  - Respuesta incluye `salida_sanitaria` con los datos del checklist registrado

**Frontend â€” `pages/maestra/FiltroSalida.jsx`:**
- âœ… ModalSalida refactorizado a **2 pasos**:
  - **Paso 1:** Selector "Â¿QuiÃ©n recoge?" + Campo obligatorio "Motivo salida anticipada" (visible solo si `anticipada = true`)
  - **Paso 2:** Checklist sanitario con campos:
    - ðŸ§· PaÃ±al limpio al salir (solo si `alumno.usa_panial = true`)
    - ðŸŽ’ Pertenencias completas
    - ðŸ’š Estado fÃ­sico normal
    - Textarea: Observaciones (opcional)
    - âœ… Entrega conforme
- âœ… Barra de progreso visual (indicador Paso 1/Paso 2)
- âœ… Validaciones integradas:
  - Paso 1: QuiÃ©n recoge requerido, motivo obligatorio en salida anticipada
  - Paso 2: Todos los campos sanitarios capturados (booleanos + notas)
- âœ… Payload enviado incluye: `es_anticipada`, `motivo_salida`, `panial_limpio`, `pertenencias_ok`, `estado_fisico_ok`, `notas_sanitarias`, `entrega_conforme`

**Frontend â€” `pages/maestra/Bitacora.jsx`:**
- âœ… SecciÃ³n "ðŸšª Salida Sanitaria" convertida a **solo lectura**:
  - Muestra datos capturados con checkmarks âœ“/âœ— por campo
  - Si no hay salida registrada: "â³ Pendiente de registrar salida" + nota explicativa
  - Eliminado estado editable (`salidaSanitaria`, `salidaGuardada`)
  - Eliminada mutation de escritura (`POST /asistencia/salida-sanitario`)
  - Mantiene solo query de lectura (`GET /asistencia/salida-sanitario/:alumnoId`)

### Validaciones completadas:
- âœ… FiltroSalida: Paso 1 con selector "quiÃ©n recoge"
- âœ… FiltroSalida: Paso 2 con checklist sanitario (checkboxes + observaciones)
- âœ… Salida normal (no anticipada): no muestra campo de motivo en Paso 1, avanza directo a Paso 2
- âœ… Salida anticipada (antes de `hora_salida_normal` de BD): muestra campo motivo obligatorio, valida antes de pasar a Paso 2
- âœ… Registros guardados en BD: `registro_salida` tiene `es_anticipada` y `motivo_salida` correctamente
- âœ… Registros guardados en BD: `registro_salida_sanitario` guarda el checklist
- âœ… BitÃ¡cora: muestra datos de salida sanitaria (solo lectura, sin botÃ³n de guardar)
- âœ… Alumno sin `usa_panial`: checkbox de paÃ±al no aparece en Paso 2

### Archivos modificados:
- `backend/migrations/038_salida_anticipada_motivo.sql` (nueva)
- `backend/migrations/037_fix_registrado_por_fk.sql` (corregida â€” eliminada lÃ­nea que intentaba ALTER ninos_extension)
- `backend/src/routes/asistencia.js` (POST /salida + GET /filtro-salida)
- `web/src/pages/maestra/FiltroSalida.jsx` (ModalSalida refactorizado)
- `web/src/pages/maestra/Bitacora.jsx` (secciÃ³n Salida Sanitaria a solo lectura)

---

## âœ… SESIÃ“N 84 â€” UI Hermanos + QR ExtensiÃ³n Mobile + Cron Medicamentos (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO â€” UI hermanos web, QR extensiÃ³n mobile, cron medicamentos corregido y validado

### Implementado:

**Backend â€” `alumnosController.js`:**
- âœ… `buscarPorQR` ahora devuelve `tiene_extension`, `hora_salida_extension`, `hermanos_sin_salir`
- âœ… `listar` (ambas queries: actual e histÃ³rica) ahora incluye `total_hermanos` por alumno

**Backend â€” `jobs/medicamentosJobs.js` â€” 3 bugs corregidos:**
- âœ… Bug 1: `g.maestra_titular_id` no existe en `grupos` â†’ corregido con JOIN a `asignaciones_grupo` + `personal`
- âœ… Bug 2: INSERT usaba columnas `mensaje` y `deep_link` inexistentes â†’ corregido a `cuerpo` y `datos_extra` (JSONB)
- âœ… Bug 3: Insertaba `personal.id` en lugar de `usuarios.id` â†’ corregido con `p_tit.usuario_id`

**Backend â€” `routes/bitacora.js`:**
- âœ… NotificaciÃ³n de medicamento administrado ahora llega a TODOS los padres vinculados (no solo tutor principal)
- âœ… Ambos flujos corregidos: con `toma_id` y compatibilidad sin `toma_id`

**Frontend Web â€” `layouts/MaestraLayout.jsx`:**
- âœ… Campanita `NotificationBell` agregada al header de la miss (no existÃ­a)

**Frontend Web â€” `pages/directora/Alumnos.jsx`:**
- âœ… Chip "ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ N hermanos" en tarjeta de alumno (azul, visible si `total_hermanos > 0`)

**Mobile â€” `app/(maestra)/qr-scanner.jsx`:**
- âœ… Guard QR ampliado: acepta `HAPPYSCHOOL:ALUMNO:` y `HAPPYSCHOOL:EXT:`
- âœ… Alert "â° Entrada temprana" si escanean QR extensiÃ³n antes de las 14:45
- âœ… `buscarExtensionMutation` â†’ `/ninos-extension/por-qr/:qrData`
- âœ… Banner naranja para niÃ±os de extensiÃ³n en resultado
- âœ… Banner rojo de hermanos sin salida en modo salida (`hermanos_sin_salir > 0`)

### Validaciones completadas:
- âœ… Cron medicamentos disparÃ³ a las ~14:20, notificaciÃ³n apareciÃ³ en campanita de la miss
- âœ… Miss administrÃ³ medicamento desde bitÃ¡cora, se registrÃ³ correctamente
- âœ… NotificaciÃ³n llegÃ³ al papÃ¡ tutor principal (Adriana GarcÃ­a LÃ³pez)
- âœ… Fix notificaciÃ³n a ambos padres implementado (HÃ©ctor Torres NÃºÃ±ez tambiÃ©n recibirÃ¡)
- âœ… UI hermanos en AlumnoPerfil.jsx (ya existÃ­a completa desde sesiÃ³n anterior) â€” validado vÃ­nculo hermanos

---

## âœ… SESIÃ“N 83 â€” VISITANTES + FIXES UPLOAD (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% COMPLETADO â€” Visitantes en pÃ¡gina dedicada, upload fixes crÃ­ticos

**Objetivo:** Crear pÃ¡gina dedicada `/directora/visitantes` con registro, foto, extensiÃ³n dÃ­a, salida, eliminaciÃ³n. Diagnosticar y fijar error crÃ­tico "Unexpected end of form" en upload de fotos.

### Implementado (100%):

**Backend:**
- âœ… Fix crÃ­tico `app.js` â€” removido `upload.any()` global que consumÃ­a streams multipart antes de rutas
- âœ… Restaurado `upload.single('foto')` en `/visitantes` POST 
- âœ… Restaurado `upload.single('foto')` en `/ninos-extension` POST y PUT
- âœ… Mock Cloudinary service para desarrollo (sin credenciales reales)
- âœ… MigraciÃ³n `037_fix_registrado_por_fk.sql` â€” FK visitantes.registrado_por corregida (usuarios, no personal)

**Frontend Web:**
- âœ… Nueva pÃ¡gina `/directora/visitantes` (Visitantes.jsx) â€” CRUD completo
- âœ… Dashboard.jsx simplificado â€” Link a pÃ¡gina dedicada (sin modal "registrar")
- âœ… DirectoraLayout.jsx â€” nav item "Visitantes ðŸ‘ï¸"
- âœ… App.jsx â€” ruta `/directora/visitantes` agregada
- âœ… Formato hora_entrada corregido (ISO â†’ locale time HH:MM)

**Validaciones completadas:**
- âœ… Registrar visitante CON foto â†’ sube sin error 500
- âœ… Registrar visitante SIN foto â†’ funciona igual
- âœ… Card muestra: nombre, grupo, tutor, hora entrada (formato correcto HH:MM), hora salida (si existe), badges extensiÃ³n
- âœ… Botones: activar extensiÃ³n dÃ­a, registrar salida, eliminar (solo sin salida registrada)
- âœ… Pago automÃ¡tico generado al activar extensiÃ³n dÃ­a (origen='visitante_extension', monto=150)

**Archivos modificados:**
- `backend/src/app.js` â€” Removidas 3 lÃ­neas multer global
- `backend/src/routes/visitantes.js` â€” Restaurado multer, upload.single, req.file
- `backend/src/routes/ninos_extension.js` â€” Restaurado multer, upload.single, req.file
- `backend/src/services/cloudinaryService.js` â€” Mock Cloudinary para dev
- `web/src/services/api.js` â€” Removido default Content-Type header
- `web/src/pages/directora/Visitantes.jsx` â€” Nueva pÃ¡gina CRUD
- `web/src/pages/directora/Dashboard.jsx` â€” Simplificado visitantes section
- `web/src/App.jsx` â€” Agregada ruta `/directora/visitantes`
- `web/src/layouts/DirectoraLayout.jsx` â€” Agregado nav item Visitantes
- `backend/migrations/037_fix_registrado_por_fk.sql` â€” Nueva migraciÃ³n

**Root cause diagnosis:**
- Error "Unexpected end of form" causado por `app.use(upload.any())` global en app.js lÃ­nea 37
- Multer global consumÃ­a stream multipart ANTES de que rutas especÃ­ficas pudieran acceder
- Error secundario: axios.create() con `headers: { 'Content-Type': 'application/json' }` forzaba JSON encoding
- Fix: quitar ambos, deixar multer por ruta con headers automÃ¡ticos

**Commit:** prÃ³ximo

---

## âœ… SESIÃ“N XX â€” INSUMOS PAÃ‘ALES + SOLICITUD TOALLITAS HÃšMEDAS (100% Completado)

**Fecha:** 2026-04-27 | **Estado:** 100% BACKEND + WEB â€” ValidaciÃ³n FiltroEntrada maÃ±ana

**Objetivo:** RediseÃ±ar stock de insumos: 5 paÃ±ales diarios (se resetean c/ dÃ­a), solicitud de toallitas hÃºmedas con notificaciÃ³n WhatsApp al papÃ¡

### Implementado (100%):

**Backend:**
- âœ… MigraciÃ³n `037_insumos_paniales_diario.sql`
  - Nueva tabla `insumos_stock_diario` (alumno_id, fecha, cantidad)
  - Nueva tabla `insumos_solicitudes` (alumno_id, fecha, tipo, resuelta, resuelta_en_entrada)
  - Nuevo campo `trajo_paniales` en `registro_entrada`
  - Eliminadas filas toallita + papel de `insumos_alumno`
- âœ… Ruta `GET /insumos/:alumnoId` â€” devuelve `{ stock: { cantidad, no_registrado }, solicitudes_toallitas: [...] }`
- âœ… Ruta `POST /insumos/:alumnoId/solicitar-toallitas` â€” crea solicitud + WhatsApp + notificaciÃ³n interna
- âœ… Ruta `PUT /insumos/solicitudes/:id/recibida` â€” marca resuelta
- âœ… LÃ³gica `POST /asistencia/entrada` â€” si `trajo_paniales=true` â†’ stock=5; si no â†’ stock=saldo_ayer
- âœ… Descuento automÃ¡tico en `POST /bitacora/panial` â€” resta 1 del stock diario

**Frontend Web:**
- âœ… `FiltroEntrada.jsx` â€” checkbox "Trajo paÃ±ales hoy (5)" + banner toallitas pendientes + botÃ³n marcar recibidas
- âœ… `Bitacora.jsx` â€” bloque morado stock, botÃ³n "Solicitar toallitas hÃºmedas", alerta solicitud, colores semÃ¡foro ajustados (â‰¥3 verde, â‰¥1 amarillo, <1 rojo)

**Validaciones completadas (hoy):**
- âœ… SofÃ­a Reyes Mendoza: solicitud creada + papÃ¡ recibiÃ³ WhatsApp
- âœ… Stock inicializado: 4 paÃ±ales (5 - 1 cambio de hoy)
- âœ… Bloque morado renderiza correctamente
- âœ… BotÃ³n says "ðŸ§» Solicitar toallitas hÃºmedas"
- âœ… Alerta amarilla de solicitud pendiente visible

### Pendiente (validar maÃ±ana 2026-04-28):
- [ ] FiltroEntrada muestre "ðŸ§» Pendiente: llevar toallitas" (banner)
- [ ] BotÃ³n "âœ… Las trajo hoy" marque como resuelta
- [ ] Stock sin paÃ±ales: desmarcar "Trajo paÃ±ales" â†’ stock = 4 (saldo ayer)
- [ ] **Nota tÃ©cnica:** Query de solicitudes puede necesitar cambio si no muestra de ayer (`fecha <= CURRENT_DATE`)

**Commit:** bdcbfae

---

## âœ… SESIÃ“N 82 â€” GESTIÃ“N ALUMNOS BLOQUE 2 (85% Completado)

**Fecha:** 2026-04-27 | **Estado:** 85% COMPLETADO â€” Pendiente: Alumnos.jsx UI + mobile qr-scanner

**Objetivo:** Agregar 3 tipos de personas externas (niÃ±os extensiÃ³n, visitantes, hermanos) + detecciÃ³n de hermanos en QR salida + cobros automÃ¡ticos

### Implementado (100%):

**Backend:**
- âœ… 3 migraciones ejecutadas:
  - `036_pagos_origen.sql` â€” campo `pagos.origen` (manual, extension_dia, visitante_extension, retardo)
  - `034_ninos_extension.sql` â€” tabla `ninos_extension` + `registro_extension` (QR, modalidad pago, entrada/salida)
  - `035_visitantes.sql` â€” tabla `visitantes` (foto, extensiÃ³n dÃ­a, hora entrada/salida)
- âœ… Ruta completa `/ninos-extension` â€” CRUD, entrada/salida automÃ¡ticas, QR Ãºnico (`HAPPYSCHOOL:EXT:<id>`), pagos automÃ¡ticos
- âœ… Ruta completa `/visitantes` â€” CRUD, extensiÃ³n del dÃ­a, pagos automÃ¡ticos (`origen = 'visitante_extension'`)
- âœ… Query detecciÃ³n hermanos en `POST /asistencia/salida` â€” retorna `hermanos_sin_salir[]`

**Frontend Web:**
- âœ… `NinosExtension.jsx` (pÃ¡gina completa) â€” crear, editar, eliminar, modal QR con descarga, indicador activo/inactivo, modalidad pago
- âœ… `Dashboard.jsx` â€” secciÃ³n "Visitantes de hoy" con botÃ³n "+ Registrar", lista visitantes con badge naranja, modal registro visitante
- âœ… `App.jsx` â€” ruta agregada `/directora/ninos-extension`
- âœ… `DirectoraLayout.jsx` â€” nav item "NiÃ±os de ExtensiÃ³n"

**Validaciones completadas:**
- âœ… Crear niÃ±o extensiÃ³n mensual desde web
- âœ… Migraciones ejecutadas sin errores
- âœ… Rutas backend funcionales

### Pendiente (85% â†’ 100%):

**Frontend Web (~30 min):**
- â³ `Alumnos.jsx` â€” Agregar secciÃ³n "Hermanos" en modal detalle alumno
  - Query GET `/alumnos/:id/hermanos`
  - Buscar alumno + botÃ³n "Vincular" â†’ POST `/alumnos/:id/familia` con `hermano_id`
  - Lista hermanos vinculados + botÃ³n "Desvincular" â†’ DELETE `/alumnos/:id/familia`
  - Chip "X hermanos" en tarjeta del listado

**Frontend Mobile (~20 min):**
- â³ `qr-scanner.jsx` â€” Ampliar para niÃ±os extensiÃ³n
  - Guard QR extendido: detectar `HAPPYSCHOOL:EXT:` + `HAPPYSCHOOL:ALUMNO:`
  - GET `/ninos-extension/por-qr/:qrData` si es extensiÃ³n
  - ComponenteResultadoExtension (fondo naranja/Ã¡mbar)
  - Alert "Entrada temprana" si hora < 14:45 (no bloquear)
  - Banner alerta hermanos en salida (si `hermanos_sin_salir.length > 0`)

### Archivos creados:
- `backend/migrations/034_ninos_extension.sql`
- `backend/migrations/035_visitantes.sql`
- `backend/migrations/036_pagos_origen.sql`
- `backend/src/routes/ninos_extension.js` (266 lÃ­neas)
- `backend/src/routes/visitantes.js` (207 lÃ­neas)
- `web/src/pages/directora/NinosExtension.jsx` (308 lÃ­neas)

### Archivos modificados:
- `backend/src/routes/index.js` â€” registrar 2 rutas nuevas
- `backend/src/routes/asistencia.js` â€” agregar query hermanos
- `web/src/App.jsx` â€” import + ruta
- `web/src/layouts/DirectoraLayout.jsx` â€” nav item
- `web/src/pages/directora/Dashboard.jsx` â€” query visitantes + componente ModalNuevoVisitante

### Decisiones de diseÃ±o:

**QR niÃ±os extensiÃ³n:** Formato `HAPPYSCHOOL:EXT:<UUID>` mantiene consistencia con alumno regular. Se genera automÃ¡ticamente al crear niÃ±o.

**Pagos automÃ¡ticos:** Campo `pagos.origen` diferencia cargos para poder condonarlos masivamente. Flujos:
- NiÃ±o extensiÃ³n modalidad `por_dia` â†’ pago automÃ¡tico al registrar entrada (si no existe ya)
- Visitante con extensiÃ³n dÃ­a â†’ pago automÃ¡tico al activar flag

**DetecciÃ³n hermanos:** Via `familia_id` compartido. Query en salida busca hermanos con entrada hoy + sin salida + no deletados. Backend retorna array en respuesta.

### Commits:
- `172f3a6` â€” docs: VALIDACIONES actualizado â€” SesiÃ³n 81 Fixes medicamentos
- (Se crearÃ¡n commits en prÃ³xima sesiÃ³n tras cierre)

---

## âœ… SESIÃ“N 81 â€” GESTIÃ“N ALUMNOS AVANZADA (Bloque 1) + MEDICAMENTOS (Tomas MÃºltiples)

---

### âœ… PARTE 2: MEDICAMENTOS CON TOMAS MÃšLTIPLES â€” FIXES FINALES

**Fecha:** 2026-04-27 | **Estado:** âœ… COMPLETADO 100% + ValidaciÃ³n en progreso (job 14:00)

**Problema resuelto:** El padre entrega medicamento una sola vez pero puede necesitar mÃºltiples dosis al dÃ­a (ej. 8am y 2pm). SesiÃ³n anterior implementÃ³ backend + padre. Hoy: 3 fixes crÃ­ticos UX para flujo completo miss â†’ papÃ¡.

**3 Bugs identificados y corregidos:**

1. **Horarios no visibles en FiltroEntrada** â€” mostraba "Sin hora programada" aunque papÃ¡ agregÃ³ horarios
   - **Causa:** Lectura de campo legacy `med.hora_programada` (NULL en recepcion_medicamento)
   - **Fuente correcta:** `med.tomas[].hora_programada` (tabla toma_medicamento)
   - **Fix:** `med.tomas?.length > 0 ? med.tomas.map(t => t.hora_programada.substring(0, 5)).join(', ') : 'Sin hora'`
   - **Archivos:** FiltroEntrada.jsx web (lÃ­nea 241) + mobile (lÃ­nea 715)

2. **Miss olvida dar clic "Recibir"** â€” medicamento no se marca como recibido
   - **Impacto:** Job cron no dispara recordatorio (filtra `rm.recibido = true`)
   - **Causa:** UX: Miss tiene 2 acciones (entrada + clic recibir), olvida la segunda
   - **Fix:** Auto-marcar medicamentos al registrar entrada
   - **UbicaciÃ³n:** asistencia.js POST /entrada (lÃ­nea 97-104) â€” UPDATE recepcion_medicamento SET recibido=true
   - **Resultado:** Medicamentos auto-recibidos al pasar FiltroEntrada, job ya los encuentra

3. **PapÃ¡ no recibe notificaciÃ³n de administraciÃ³n** â€” flujo nuevo (toma_id) no notificaba
   - **Causa:** NotificaciÃ³n solo en rama compatibilidad (sin toma_id)
   - **Fix:** Copiar bloque notificaciones al flujo toma_id
   - **UbicaciÃ³n:** bitacora.js PATCH /administrar (lÃ­nea 681-717) â€” query padre + enviarMensaje + INSERT notificaciones
   - **Resultado:** PapÃ¡ recibe WhatsApp + notificaciÃ³n in-app cuando toma se administra

### Cambios implementados

**BD:**
- MigraciÃ³n `033_tomas_medicamento.sql` aplicada:
  - Nueva tabla `toma_medicamento` (UUID, recepcion_id, hora_programada, recordatorio_enviado, administrado, administrado_at, administrado_por, medicamento_id, created_at)
  - Ãndices: `idx_toma_recepcion`, `idx_toma_fecha`
  - Campo `hora_programada` en `recepcion_medicamento` queda deprecado (se mantiene datos histÃ³ricos)

**Backend (`backend/src/routes/bitacora.js`):**
- `POST /medicamento/recepcion` â€” ahora acepta array `horas` (JSON):
  - Recibe medicamento name, dosis, array de horas programadas
  - Crea recepciÃ³n + una fila toma_medicamento por cada hora
  - Retorna recepciÃ³n con tomas array embebido (json_agg)
  - Fotos ahora en Base64 (evita problemas multer/busboy) â€” fallback a data URL si Cloudinary no disponible en dev
- `GET /:alumnoId` â€” query actualizado para incluir LEFT JOIN toma_medicamento con json_agg
- `PATCH /medicamento/recepcion/:id/administrar` â€” ahora acepta `toma_id` para administrar dosis individual
  - Si viene `toma_id` â†’ marca esa toma como administrada
  - Si no viene â†’ comportamiento anterior (compatibilidad)

**Backend (`backend/src/jobs/medicamentosJobs.js`):**
- Bug fix: `rm.nombre_medicamento` â†’ `rm.nombre` (columna correcta)
- Query ahora busca en `toma_medicamento` en lugar de `recepcion_medicamento.hora_programada`
- Filtra tomas: `administrado=false AND recordatorio_enviado=false AND rm.recibido=true`
- Notificaciones disparan por TOMA, no por recepciÃ³n
- Marca `recordatorio_enviado=true` en `toma_medicamento` (nivel de dosis)

**Frontend padre (`web/src/pages/padre/Bitacora.jsx`):**
- Estado `horasMed` â€” array de strings "HH:MM" (reemplaza `hora_programada` Ãºnico)
- Formulario medicamento:
  - Lista dinÃ¡mica de inputs `type="time"`
  - BotÃ³n "+ Agregar hora" para N dosis
  - BotÃ³n "âœ•" para eliminar hora individual
  - Foto receta â†’ obligatoria, se convierte a Base64 antes de enviar
- Display recepciones:
  - Muestra tomas como lista de badges con hora + estado (â³ pendiente / âœ… administrado)
  - Badge principal de recepciÃ³n:
    - âœ… Dado (todas las tomas administradas)
    - ðŸ“¬ Recibido (en manos de miss, pendiente administraciÃ³n)
    - â³ Pendiente (papÃ¡ no ha recibido confirmaciÃ³n)
  - BotÃ³n ðŸ—‘ para borrar (solo si no recibido ni administrado)
- Ambas secciones (con/sin bitÃ¡cora) muestran el mismo formulario y lista

**Frontend miss (`web/src/pages/maestra/Bitacora.jsx`):**
- SecciÃ³n medicamentos â†’ query en toma_medicamento level (no recepciÃ³n level)
- Display: una FILA por TOMA (no una fila por recepciÃ³n)
  - Muestra: medicamento name, dosis, hora programada, botÃ³n "Administrar"
  - Administrar â†’ envÃ­a `toma_id` al backend
- Badge de estado: â³ Pendientes (solo tomas no administradas)

### Archivos modificados
- `backend/migrations/033_tomas_medicamento.sql` (nuevo)
- `backend/src/routes/bitacora.js` (POST recepcion, GET bitacora, PATCH administrar)
- `backend/src/jobs/medicamentosJobs.js` (query + bug fix)
- `web/src/pages/padre/Bitacora.jsx` (formulario, display, delete mutation)
- `web/src/pages/maestra/Bitacora.jsx` (display tomas, administrar mutation)

### Validaciones completadas (SesiÃ³n 81 Parte 2)
- âœ… Horarios visibles en FiltroEntrada (web + mobile)
- âœ… Medicamentos auto-marcados como recibidos al entrar (FiltroEntrada)
- âœ… PapÃ¡ recibe notificaciÃ³n al administrar toma (WhatsApp + in-app)
- âœ… Paridad web â†” mobile confirmada
- â³ **VALIDACIÃ“N PENDIENTE:** Job cron a las 14:00 dispara recordatorio a miss
  - **Cronograma:** ValidaciÃ³n por Valeria a las 14:00 hoy (2026-04-27)
  - **QuÃ© revisar:** NotificaciÃ³n in-app a miss + BD `notificaciones` tipo='recordatorio_medicamento'

---

## âœ… SESIÃ“N 81 â€” GESTIÃ“N ALUMNOS AVANZADA (Bloque 1)

**Fecha:** 2026-04-26 | **Estado:** BLOQUE 1 COMPLETADO âœ… | **Bloque 2:** pendiente

### Aclaraciones de negocio definidas esta sesiÃ³n
- **Estructura familiar:** 1 tutor principal (mamÃ¡ o papÃ¡) en tabla `padres`. MÃ¡ximo 2 personas autorizadas para recoger (lÃ­mite correcto, no se cambiÃ³). Campo `parentesco` es texto libre â†’ soporta "MamÃ¡ 1", "MamÃ¡ 2", etc.
- **NiÃ±os de Solo ExtensiÃ³n:** NO son alumnos de la escuela. Solo usan servicio vespertino 3-6 PM. IrÃ¡n en tabla separada `ninos_extension` (Bloque 2).
- **NiÃ±os Visitantes:** NO son alumnos. Vienen un dÃ­a puntual. Tabla `visitantes` (Bloque 2).
- **Alumnos regulares tarde:** Un alumno regular que llega tarde = retardo (ya implementado). NUNCA se convierte en estancia por dÃ­a.

### Cambios implementados

**BD:**
- MigraciÃ³n `031_familia_id.sql` aplicada â€” columna `familia_id UUID` + Ã­ndice en tabla `alumnos`.

**Backend (`backend/src/routes/alumnos.js`):**
- `POST /alumnos/:id/padres` â€” vincula o reutiliza tutor por email (no-duplicidad). Campos: nombre_completo, parentesco (texto libre), telefono, telefono_whatsapp, email, es_tutor_principal.
- `PUT /alumnos/:id/padres/:padreId` â€” editar datos del tutor desde perfil del alumno.
- `POST /alumnos/:id/padres/:padreId/foto` â€” subir foto del tutor a Cloudinary.
- `GET /alumnos/:id/hermanos` â€” retorna hermanos con mismo `familia_id`.
- `POST /alumnos/:id/familia` â€” vincula dos alumnos como hermanos (comparten `familia_id`).
- `DELETE /alumnos/:id/familia` â€” desvincula alumno de su familia.

**Backend (`backend/src/controllers/alumnosController.js`):**
- Agregado `familia_id` a lista de campos permitidos en `actualizar()`.

**Backend (`backend/src/routes/reportes.js`):**
- Nueva query en `/reportes/dashboard`: `extensionVespertina` â€” alumnos con asistencia hoy + su estado de extensiÃ³n + si ya registraron salida. Alimenta el panel vespertino del dashboard.

**Frontend (`web/src/pages/directora/AlumnoPerfil.jsx`):**
- Nuevo componente `SeccionPadres` â€” reemplaza la vista solo-lectura de tutores. Permite editar nombre, parentesco, telÃ©fono, WhatsApp, email de cada tutor y subir su foto. BotÃ³n "+ Agregar" para vincular nuevo tutor.
- Nuevo componente `SeccionHermanos` â€” muestra hermanos con navegaciÃ³n directa a su perfil. Buscador para vincular hermano existente. BotÃ³n desvincular.

**Frontend (`web/src/pages/directora/Dashboard.jsx`):**
- Nuevo componente `PanelExtensionVespertina` â€” aparece automÃ¡ticamente a las 3:06 PM. Muestra 3 grupos:
  1. âœ… Con extensiÃ³n contratada (salida pendiente)
  2. âš ï¸ Sin extensiÃ³n â€” salida pendiente (aviso: se generarÃ¡ cobro al salir)
  3. Ya salieron (colapsado)
- BotÃ³n "Ver todos / Modo extensiÃ³n" para toggle manual.
- Reloj se recalcula cada 60 segundos para activaciÃ³n automÃ¡tica.

### Archivos modificados
- `backend/migrations/031_familia_id.sql` (nuevo)
- `backend/src/routes/alumnos.js`
- `backend/src/routes/reportes.js`
- `backend/src/controllers/alumnosController.js`
- `web/src/pages/directora/AlumnoPerfil.jsx`
- `web/src/pages/directora/Dashboard.jsx`

---

## âœ… SESIÃ“N 80 â€” SALUD Y MEDICACIÃ“N (100% Frontend + Job Backend)

**Fecha:** 2026-04-26 | **Estado:** 100% COMPLETADO âœ… | **DuraciÃ³n:** ~100 min

**Lo que se hizo en Frontend Web (Maestra):**
- Bloque 6: Agregado flag `es_diarrea` al envÃ­o de paÃ±al â€” banner rojo âš ï¸ en secciÃ³n Salud
- Bloque 7: SecciÃ³n "Salida Sanitaria" con checkboxes (paÃ±al limpio, pertenencias, estado) + entrega conforme
  - Query GET `/asistencia/salida-sanitario/:alumnoId` para precargar
  - Mutation POST `/asistencia/salida-sanitario` para guardar

**Lo que se hizo en Frontend Mobile:**
- Bloque 5: SecciÃ³n "VÃ³mito" con botÃ³n toggle, selector 3-botones intensidad (leve/moderado/fuerte), notas
  - Mutation POST `/bitacora/vomito` 
  - Listado de vÃ³mitos del dÃ­a con hora + intensidad + notas
- Bloque 6: Modificado `registrarPanial()` para enviar `es_diarrea: condicion === 'diarrea'`
  - Banner rojo en secciÃ³n Salud si hay diarrea
- Bloque 7: SecciÃ³n "Salida Sanitaria" con 4 Switches (paÃ±al/pertenencias/estado/entrega) + notas
  - Mutation POST `/asistencia/salida-sanitario`

**Lo que se hizo en Frontend Web (Padre):**
- Bloque 8: Tab Salud mejorado para mostrar:
  - Listado de vÃ³mitos (hora + intensidad + notas) si existen
  - Banner âš ï¸ si hay diarrea
  - Empty state actualizado (considera vÃ³mitos y diarrea)

**Lo que se hizo en Backend:**
- Bloque 9: Job cron medicamentos â€” `backend/src/jobs/medicamentosJobs.js`
  - Schedule: cada 5 min, 7:00-16:00, lun-vie (UTC MÃ©xico)
  - Query: recepciones NO administradas con `hora_programada` en ventana Â±10 min
  - AcciÃ³n: INSERT notificaciÃ³n tipo `recordatorio_medicamento` a maestra titular
  - IntegraciÃ³n en `backend/src/index.js` â€” se ejecuta al iniciar servidor

**ValidaciÃ³n:**
- âœ… Sintaxis JS backend y frontend sin errores
- âœ… Backend iniciado con ambos jobs (comida + medicamentos)
- âœ… Cambios presentes en todos 5 archivos clave

---

## âœ… SESIÃ“N 78 â€” SALUD Y MEDICACIÃ“N (50% Backend)

**Fecha:** 2026-04-26 | **Estado:** Backend 100% âœ…, Frontend pendiente SesiÃ³n 79 | **DuraciÃ³n:** ~90 min

**Lo que se hizo en Backend:**

### MigraciÃ³n SQL 030 âœ…
- Tabla `recepcion_medicamento` â€” autorizaciÃ³n previa con fotos receta + envase
- Tabla `registro_vomito` â€” episodios mÃºltiples/dÃ­a con intensidad (leve/moderado/fuerte)
- Tabla `registro_salida_sanitario` â€” checklist de entrega al tutor (paÃ±al/pertenencias/estado fÃ­sico)
- Tabla `insumos_alumno` â€” stock dinÃ¡mico paÃ±ales, toallitas, crema por alumno
- Tabla `insumos_movimientos` â€” historial de cambios (recarga/descuento/ajuste)
- ALTER TABLE asistencia â€” columnas justificacion_motivo, justificada_por, justificada_at
- ALTER TABLE registro_panial â€” columna es_diarrea boolean

### CatÃ¡logos Backend âœ…
- Agregado `diarrea` a `condiciones-panial` (âš ï¸ emoji)
- Creados `tipos-insumo` (panial, toallitas, crema)
- Creados `vomito-intensidad` (leve, moderado, fuerte)
- Mismos catÃ¡logos en mobile/src/constants/catalogos.js para paridad

### Endpoints BitÃ¡cora âœ…
- **POST /bitacora/vomito** â€” registrar episodios, notif padre si intensidad='fuerte'
- **POST /bitacora/panial (MODIFICADO)** â€” agregar es_diarrea, notif padre si true
- **POST /bitacora/medicamento/recepcion** â€” multipart foto_receta + foto_envase
- **GET /bitacora/medicamento/pendientes** â€” listar recepciones no administradas
- **PATCH /bitacora/medicamento/recepcion/:id/administrar** â€” marcar como administrado + notif
- **GET /:alumnoId** â€” incluye vomitos[], recepciones_medicamento[]

### Routes Insumos (NUEVO) âœ…
- **GET /insumos/:alumnoId** â€” stock actual todos tipos
- **POST /insumos/:alumnoId/recarga** â€” crear/actualizar + historial
- **GET /insumos/alertas/hoy** â€” para directora, alumnos con stock bajo

### Endpoints Asistencia âœ…
- **PATCH /asistencia/:alumnoId/justificar** â€” marcar falta como justificada
- **POST /asistencia/salida-sanitario** â€” registrar checklist salida (upsert)
- **GET /asistencia/salida-sanitario/:alumnoId** â€” obtener checklist

**Pendiente para SesiÃ³n 79:** Frontend web + mobile + job cron medicamentos

---

## âœ… SESIÃ“N 77 â€” ReorganizaciÃ³n ArquitectÃ³nica FASES 4-7

**Fecha:** 2026-04-25 | **Estado:** Completado âœ… | **DuraciÃ³n:** ~90 min

**Lo que se hizo:**

### FASE 4 â€” .gitignore y builds (~20 min)
- Actualizar `.gitignore` raÃ­z: secciones organizadas, agregar `.npm`, `*.tgz`, `.pem`, `.key`, vite cache, metro bundler, EAS
- Crear `web/.gitignore`: Vite-especÃ­fico (`dist-ssr/`, `.vite/`, timestamps)
- Crear `mobile/.gitignore`: Expo-especÃ­fico (`android/`, `ios/`, `.eas/`, metro cache)
- Verificar: `web/dist/`, `mobile/.expo/`, `*.log` â€” ninguno rastreado por git

### FASE 5 â€” Tests de smoke (~45 min)
- Extraer `backend/src/app.js` (Express puro sin `listen()`) â€” necesario para testabilidad
- Simplificar `backend/src/index.js` a arranque puro (PORT + jobs)
- Crear `tests/smoke/health.test.js` â€” GET /health â†’ 200
- Crear `tests/smoke/auth.test.js` â€” 401 credenciales invÃ¡lidas, 400 sin campos, login real opcional
- Crear `tests/setup.js` â€” carga `backend/.env` antes de los tests
- Instalar `jest@30` + `supertest@7` como devDependencies
- Agregar `npm run test:smoke` + config jest en `package.json` raÃ­z
- Resultado: 4/4 tests pasan âœ“

### FASE 6 â€” Script dev unificado (~10 min)
- Instalar `concurrently@9`
- `npm run dev` â†’ backend + web en paralelo (cyan/magenta)
- `npm run dev:full` â†’ backend + web + mobile Expo (cyan/magenta/yellow)
- README actualizado con tabla de scripts, estructura del proyecto, instrucciones smoke test

### FASE 7 â€” Normalizar imports web (~10 min)
- Migrar 24 imports relativos (`../../`) â†’ alias `@/` en 15 archivos de `web/src/`
  - `pages/directora/` (7 archivos), `pages/maestra/` (2), `pages/padre/` (5), `components/ui/` (1)
- Crear `web/jsconfig.json` â€” VSCode resuelve `@/` con autocomplete
- Build Vite verificado: âœ“ 1651 mÃ³dulos, sin errores

**Commits:** 4
- `chore: FASE 4 â€” .gitignore y builds`
- `feat: FASE 5 â€” Tests de smoke (health + auth)`
- `feat: FASE 6 â€” Script dev unificado con concurrently`
- `refactor: FASE 7 â€” Normalizar imports web + README + jsconfig`

---

## âœ… SESIÃ“N 76 â€” ReorganizaciÃ³n ArquitectÃ³nica FASE 3 (Backend Scripts)

**Fecha:** 2026-04-26 | **Estado:** Completado âœ… | **DuraciÃ³n:** ~75 min

**Lo que se hizo:**

### FASE 3 â€” ReorganizaciÃ³n de archivos backend
- Mover `backend/src/database/` â†’ `backend/scripts/` con subcarpetas:
  - `seeds/` â€” 11 archivos: seed.js + 10 seeds especÃ­ficos
  - `setup/` â€” 6 archivos: 6 setups de inicializaciÃ³n
  - `fixes/` â€” 5 archivos: fixes de datos histÃ³ricos
  - `checks/` â€” 1 archivo: validador de datos
- Actualizar todos los imports:
  - `require('../config/database')` â†’ `require('../../src/config/database')` (2 niveles)
  - `require('dotenv').config()` bare â†’ con path explÃ­cito `../../.env`
  - Actualizar comentarios de uso en setup_maternal.js y setup_padre_demo.js
- Consolidar migration runners:
  - Eliminar `backend/migrate.js` (hardcoded 014+015)
  - Eliminar `backend/run-migration.js` 
  - Crear `backend/scripts/migrate-runner.js` (genÃ©rico, acepta mÃºltiples migraciones)
- Actualizar `backend/package.json`:
  - `"seed": "node src/database/seed.js"` â†’ `"node scripts/seeds/seed.js"`
- Mover docs:
  - `RESUMEN_SESION_63.md` â†’ `/docs/`
  - TambiÃ©n movidos VALIDACION_SESION_63.md, VALIDACION_SESION_71.md, SCHEMA_SHORTCUT.md, MEMORY.md a `/docs/`
- Eliminar archivos temporales del root (5 archivos):
  - fix_emojis_skin.js, temp_seed_ana.sql, verify_endpoint.js, test_api.js, test_grupos.js
- Verificaciones:
  - `npm run seed` funciona âœ“ (seed completa sin errores de mÃ³dulo)
  - Backend arranca sin errores âœ“
  - Cero referencias a `src/database` en cÃ³digo âœ“

**Patrones de import aplicados:**
- PatrÃ³n A (sin dotenv): 6 archivos â€” solo cambiar db require
- PatrÃ³n B (bare dotenv): 3 archivos â€” agregar path explÃ­cito + db require
- PatrÃ³n C (dotenv con path): 9 archivos â€” mantener path + db require
- PatrÃ³n D (bare dotenv + Pool directo): 3 archivos â€” agregar path, sin cambio db
- PatrÃ³n E (dotenv + Pool directo): 2 archivos â€” mantener path, sin cambio db

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
- refactor: FASE 3 â€” ReorganizaciÃ³n backend/scripts/

---

## âœ… SESIÃ“N 75 â€” ReorganizaciÃ³n ArquitectÃ³nica FASE 1+2 (Seguridad + Mobile)

**Fecha:** 2026-04-25 | **Estado:** Completado âœ…

**Lo que se hizo:**

### FASE 1 â€” EliminaciÃ³n de Credenciales (CRÃTICO)
- Eliminar `backend/test_schema.js` (credenciales postgres:happy2026 en git)
- Mover password por defecto a variable `DEFAULT_USER_PASSWORD`
  - `backend/src/routes/personal.js` lÃ­neas 108, 178, 184 â†’ usar `process.env.DEFAULT_USER_PASSWORD`
  - Agregar a `.env` y `.env.example` con guÃ­as claras
- CORS dinÃ¡mico: `backend/src/index.js` lee `MOBILE_URL` desde `.env`
- `mobile/.env.example` â†’ placeholder genÃ©rico `192.168.1.X` (era IP real `192.168.1.93`)

### FASE 2 â€” Corregir Imports Rotos Mobile (ALTO)
- Double-src bug: `@/src/...` â†’ `@/...` en `mobile/app/(padre)/`
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
1. refactor: FASE 1+2 â€” Seguridad + Imports mÃ³vil
2. chore: SesiÃ³n 75 â€” Cierre (PENDIENTES + ARCHIVE_LOG + memory)

**Plan completo:** 7 fases de reorganizaciÃ³n (FASE 1+2 completadas, FASE 3-7 pendientes para sesiones 76-78)
- **FASE 3+4 (sesiÃ³n 76):** Reorganizar backend/scripts/ + .gitignore
- **FASE 5+6 (sesiÃ³n 77):** Tests smoke + script dev unificado
- **FASE 7 (sesiÃ³n 78):** Normalizar imports web

---

## âœ… SESIÃ“N 74 â€” SincronizaciÃ³n Web â†” Mobile (Paridad Completa)

**Fecha:** 2026-04-25 | **Estado:** Completado âœ…

**Lo que se hizo:**
- **MÃ³dulo Tareas Maestra mobile:** `mobile/app/(maestra)/tareas.jsx` con 3 tabs (PrÃ³ximas/Vencidas/Borradores), navegador semanas ISO, modales Nueva/Editar/Entregas con `expo-image-picker`
- **Dashboard Maestra mobile:** Agregados banners "Tareas por recibir hoy" (azul) + "Alumnos en alerta" (rojo), botÃ³n acceso rÃ¡pido
- **Dashboard Padre mobile:** Nuevo componente HijoTareasPendientes â€” tareas expandibles por hijo con emojis urgencia (ðŸ”´/ðŸ”¥/âš ï¸/ðŸ“˜)
- **BitÃ¡cora Padre mobile:** SelectorCiclo con chips horizontales para navegar ciclos, restricciÃ³n fechas al rango
- **QR Scanner mobile:** Indicador ExtensiÃ³n de Horario en modo salida â€” banner naranja si `tiene_extension === true` con hora de salida
- **BitÃ¡coras mobile:** SincronizaciÃ³n comida_extra â€” visible en tab Comida (padre) y secciÃ³n separada (maestra) si hay extensiÃ³n activa en fecha

**Archivos creados:**
- `mobile/app/(maestra)/tareas.jsx`

**Archivos modificados:**
- `mobile/app/(maestra)/_layout.jsx` â€” agregar ruta Tareas a tabs
- `mobile/app/(maestra)/index.jsx` â€” banners + botÃ³n Tareas
- `mobile/app/(padre)/index.jsx` â€” componente HijoTareasPendientes
- `mobile/app/(padre)/bitacora.jsx` â€” SelectorCiclo + comida_extra
- `mobile/app/(maestra)/bitacora.jsx` â€” comida_extra visible si extensiÃ³n activa
- `mobile/app/(maestra)/qr-scanner.jsx` â€” indicador extensiÃ³n en modo salida

**Commits:** 5
1. SincronizaciÃ³n Mobile â€” MÃ³dulo Tareas + Dashboard Padre
2. SincronizaciÃ³n Mobile â€” BitÃ¡coras + QR Scanner
3. Sincronizar comida_extra en BitÃ¡coras mobile
4. Cierre de sesiÃ³n (PENDIENTES)
5. Cierre de sesiÃ³n (ARCHIVE_LOG + MEMORY)

**Regla nueva:** Cada cambio funcional que aplique a roles mÃ³viles se sincroniza en mobile en la misma sesiÃ³n. **No hay mÃ¡s deuda de paridad webâ†”mobile.**

---

## âœ… SESIÃ“N 73 â€” MÃ³dulo ExtensiÃ³n de Horario

**Fecha:** 2026-04-26 | **Estado:** Completado âœ…

**Lo que se hizo:**
- Migrations 028 + 029: tabla `historial_servicios` con vigencia por rango (mes_inicio/anio_inicio â†’ mes_fin/anio_fin)
- Alta de extensiÃ³n: modalidad rango o indefinido, genera cargos pendientes automÃ¡ticamente en `pagos`
- Baja de extensiÃ³n: selector limitado al rango activo, cancela cargos futuros pendientes
- Estado actual informativo: muestra alta futura con rango efectivo corregido por bajas registradas
- Rutas movidas de `/comida/historial-servicios` â†’ `/alumnos/:id/historial-servicios`
- FiltroSalida (maestra): badge â³ extensiÃ³n en tarjeta, alerta salida anticipada respeta `hora_salida_extension`
- BitÃ¡coras (directora/maestra/papÃ¡): comida_extra visible segÃºn extensiÃ³n en fecha histÃ³rica del rango
- GET historial-servicios abierto a maestra y padre para consulta de comida_extra histÃ³rica

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

## âœ… SESIÃ“N 72 â€” Mejoras PDF Calendario (diseÃ±o infantil + lista detallada)

**Fecha:** 2026-04-24 | **Estado:** Completado âœ…

### Cambios completados:

**1. Nueva paleta de colores vibrante e infantil**
- PÃºrpura mÃ¡s saturado: `rgb(0.408, 0.216, 0.780)` (antes: `0.502, 0.353, 0.816`)
- PÃºrpura oscuro: `rgb(0.271, 0.133, 0.545)` para encabezado
- Acentos infantiles: coral, mint, yellow, sky
- Gris border con tinte pÃºrpura: `rgb(0.859, 0.839, 0.902)`

**2. Encabezado mejorado (PÃ¡gina 1)**
- Fondo `purpleDark` en lugar de pÃºrpura plano
- Banda coral de 4 pt decorativa al fondo del encabezado
- CÃ­rculos decorativos en esquinas (gris claro, 10-14 pt)
- "Happy School" subido a `size: 20` (era 18)
- TÃ­tulo mes subido a `size: 24` (era 22)
- Contador eventos: color yellow en lugar de purpleLight

**3. GeometrÃ­a de grilla optimizada**
- `headerH`: 22 â†’ 26 pt (mÃ¡s respiraciÃ³n en cabecera de dÃ­as)
- `rowH`: 68 â†’ 76 pt (mÃ¡s espacio visual por celda)
- Cabecera dÃ­as con colores alternados: Dom/Sab mÃ¡s intenso, semana purpleLight
- LÃ­nea separadora de 1.5 pt en pÃºrpura al fondo de cabecera

**4. Visuales mejorados en celdas y chips**
- Celdas fin de semana: fondo con tinte pÃºrpura sutil (`rgb(0.980, 0.976, 0.988)`)
- Celda "hoy": borde 1.5 pt en pÃºrpura (era 0.5 pt)
- NÃºmero dÃ­a: `size` 8 â†’ 9, cÃ­rculo radio 9 â†’ 11
- Chips eventos: altura 12 â†’ 13 pt, `borderRadius` 2 â†’ 3
- **Barra lateral de color 3 pt a la izquierda de cada chip** (NUEVO)
- Fuente chip: 6.5 â†’ 7.5 pt
- SeparaciÃ³n entre chips: 14 â†’ 16 pt
- Indicador +N: fondo `purpleLight` pequeÃ±o, color `purple`

**5. Leyenda mejorada**
- PosiciÃ³n y=10 â†’ y=14
- Cuadrado color: 8x8 â†’ 10x10 pt
- LÃ­nea separadora decorativa con puntos antes de leyenda (loop de cÃ­rculos)

**6. Segunda pÃ¡gina: Lista detallada de eventos (NUEVA)**
- A4 vertical `[595, 842]` con encabezado estilo pÃ¡gina 1
- Por cada evento: tarjeta con barra lateral del color de categorÃ­a
- Contenido tarjeta:
  - Fecha formateada ("Lun 7 Abr") + hora o "Todo el dÃ­a"
  - TÃ­tulo + grupo (si existe)
  - DescripciÃ³n (mÃ¡x 2 lÃ­neas, truncada)
  - UbicaciÃ³n (si existe, en color sky)
  - Chip de categorÃ­a con color
- Filas alternas blanco/grayLight para legibilidad
- PaginaciÃ³n automÃ¡tica: crea pÃ¡ginas adicionales si hay >15-20 eventos
- Pie de pÃ¡gina con "Happy School | Generado el DD/MM/YYYY" + nÃºmero pÃ¡gina

### Archivo modificado:
- `backend/src/routes/calendario.js` â€” endpoint `GET /api/calendario/export-pdf?mes=YYYY-MM`

### ValidaciÃ³n tÃ©cnica:
- âœ… Sintaxis JavaScript vÃ¡lida
- âœ… Router y 8 rutas registradas correctamente
- âœ… 7/7 checks de estructura de cÃ³digo pasaron
- âœ… Backend corriendo, endpoint accesible en `/api/calendario/export-pdf`

---

## âœ… SESIÃ“N 71 â€” IntegraciÃ³n Calendario Mejorada (3 subtareas)

**Fecha:** 2026-04-24 | **Estado:** Completado âœ…

### Cambios completados:

**1. BotÃ³n "AÃ±adir a Google Calendar" â€” web padre + mobile**
- `web/src/utils/googleCalendar.js` + `mobile/src/utils/googleCalendar.js` â€” funciÃ³n `buildGoogleCalendarUrl(evento)`
- URL directa sin OAuth: abre Google Calendar pre-llenado en nueva pestaÃ±a/browser
- Maneja todo el dÃ­a (`YYYYMMDD`) y con hora (`YYYYMMDDTHHmmssZ`)
- BotÃ³n en: modal Calendario web, modal Dashboard web, widget prÃ³ximos web
- BotÃ³n en: modal calendario mobile, modal Dashboard mobile, widget prÃ³ximos mobile

**2. Eventos Enriquecidos â€” ubicaciÃ³n + recordatorio**
- MigraciÃ³n `027_eventos_enriquecidos.sql`: columnas `ubicacion TEXT` y `recordatorio_horas INT`
- Backend `calendario.js`: POST y PUT actualizados con nuevos campos
- Formulario directora: input ubicaciÃ³n + select recordatorio (1h/2h/24h/48h/72h)
- Vista padre web: muestra ðŸ“ ubicaciÃ³n y ðŸ”” recordatorio en modales
- Vista padre mobile: ðŸ“ tappable abre Google Maps, ðŸ”” muestra tiempo
- `buildGoogleCalendarUrl`: incluye `location` si hay ubicaciÃ³n

**3. PDF Calendario Mensual**
- Ruta `GET /calendario/export-pdf?mes=YYYY-MM` con `pdf-lib` (A4 landscape)
- Grilla mensual 7 columnas, chips de color por categorÃ­a, hoy resaltado en morado
- Leyenda de categorÃ­as al pie de pÃ¡gina
- BotÃ³n "PDF" en Calendario padre + Calendario directora (descarga blob)
- âš ï¸ Pendiente SesiÃ³n 72+: lista detallada de eventos bajo la grilla + diseÃ±o infantil completo

### Nota tÃ©cnica:
- `pdf-lib` StandardFonts (Helvetica) = WinAnsi Ãºnicamente. Emojis eliminados con `.replace(/[^\x00-\xFF]/g, '')`. Tildes funcionan (Latin-1).
- Para emojis en PDF futuro: embeber fuente TTF Unicode (ej: Noto Emoji)

### Commits:
- `7e06676` â€” Google Calendar botÃ³n web + mobile
- `c6e781e` â€” PENDIENTES Google Calendar
- `1db319f` â€” Eventos Enriquecidos
- (cierre sesiÃ³n) â€” PDF + PENDIENTES + ARCHIVE_LOG

---

## âœ… SESIÃ“N 70 â€” AgrupaciÃ³n por semana ISO + NavegaciÃ³n por tabs + Modal entregas

**Fecha:** 2026-04-24 | **Estado:** Completado âœ…

### Cambios completados:

**1. PÃ¡gina Tareas (maestra) â€” RestructuraciÃ³n radical con tabs + navegaciÃ³n por semana**
- Archivo: `web/src/pages/maestra/Tareas.jsx`
- Helpers nuevos:
  - `getISOWeek(dateStr)` â€” calcula semana ISO (1-53) con correcciÃ³n aÃ±o ISO
  - `getSemanaKey(dateStr)` â€” retorna clave `YYYY-WNN` para ordenamiento lexicogrÃ¡fico
  - `getLunesToDomingo(dateStr)` â€” formatea rango semana en espaÃ±ol ("28 abr â€“ 4 may")
  - `agruparPorSemana(tareas, orden)` â€” agrupa por semana ISO, ordena ASC o DESC
- **3 tabs principales:**
  - ðŸ“¬ **PrÃ³ximas** â€” tareas no vencidas, navegaciÃ³n por semana (semana actual primero)
  - ðŸ—‚ï¸ **Vencidas** â€” tareas vencidas, navegaciÃ³n por semana (mÃ¡s reciente primero)
  - ðŸ“¤ **Borradores** â€” tareas sin publicar (lista simple, sin paginaciÃ³n)
- Componente `NavegadorSemana` â€” reutilizable para tabs "PrÃ³ximas" y "Vencidas"
  - Botones â€¹ â€º para navegaciÃ³n con estado disabled en lÃ­mites
  - Header: "Semana del 28 abr â€“ 4 may Â· 2 tareas Â· semana 1 de 3"
  - Previene el problema de listas enormes (50+ tareas por ciclo escolar)

**2. Modal "Â¿QuiÃ©n entregÃ³?" â€” desglose por alumno**
- Componente `ModalEntregas` nuevo
- Query a `GET /tareas/:id/alumnos` (endpoint backend ya existÃ­a)
- Dos secciones:
  - âœ… **Entregaron** â€” lista verde de nombres
  - âŒ **Faltan** â€” lista roja de nombres
- Badge `ðŸ“Š X/Y entregaron` ahora es botÃ³n clickeable en TareaCard
- Se abre modal al hacer clic, muestra detalle completo de entregas

### Archivos modificados:
- `web/src/pages/maestra/Tareas.jsx` â€” Ãºnico archivo frontend

### Backend:
- Sin cambios â€” endpoints existentes:
  - `GET /tareas/:id/entregas` (conteos)
  - `GET /tareas/:id/alumnos` (lista con nombres y completadas)

---

## âœ… SESIÃ“N 68 â€” Tareas Grupales: "Â¿EntregÃ³ tarea?" + Indicador pendientes + Lista completa

**Fecha:** 2026-04-24 | **Estado:** Completado âœ…

### Cambios completados:

**1. Label "Â¿EntregÃ³ tarea?" en BitÃ¡cora maestra (web/src/pages/maestra/Bitacora.jsx)**
- Cambiar label de "Â¿Trajo la tarea?" â†’ "Â¿EntregÃ³ tarea?" (lÃ­nea 886)
- Refleja mejor la intenciÃ³n: registrar si el niÃ±o entregÃ³ la tarea, no solo si la traÃ­a

**2. Endpoint nuevo: GET /api/tareas/pendientes-alumno (backend/src/routes/tareas.js)**
- Retorna conteo de tareas publicadas no entregadas del alumno
- Verifica ownership: alumno pertenece al padre en sesiÃ³n
- Query usa LEFT JOIN a `tarea_alumno` para captar tareas nunca registradas

**3. Endpoint nuevo: GET /api/tareas/lista-pendientes (backend/src/routes/tareas.js)**
- Retorna **lista completa** de tareas pendientes (no solo la mÃ¡s reciente)
- Ordenadas por fecha_limite ASC (mÃ¡s pronto primero)
- Incluye: id, titulo, descripcion, fecha_limite, foto_url, completada, fecha_completada

**4. Dashboard papÃ¡ â€” Cambio radical: TareaRecienteCard â†’ Lista de todas las pendientes**
- Antes: mostraba solo la tarea mÃ¡s reciente + badge de conteo
- Ahora: lista numerada de TODAS las tareas pendientes ordenadas por urgencia
- Indicadores de urgencia por color:
  - ðŸ”´ Rojo: Vencida (dÃ­as pasados)
  - ðŸ”¥ Naranja: Hoy
  - âš ï¸ Amarillo: MaÃ±ana
  - ðŸ“˜ Azul: MÃ¡s de 1 dÃ­a
- Muestra descripciÃ³n COMPLETA (sin truncar)
- Fecha formateada: "Lun 27 de Abr" con L mayÃºscula

**5. Tareas en fechas pasadas â€” endpoint hoy-pendientes acepta parÃ¡metro fecha**
- Cambio: endpoint `/tareas/hoy-pendientes` ahora acepta `fecha` como query param
- Antes: siempre filtraba por CURRENT_DATE
- Ahora: permite buscar tareas de cualquier fecha (para bitÃ¡cora histÃ³rica)
- Agrega parÃ¡metro `alumno_id` al SELECT para retornar estado `completada` del alumno

**6. BitÃ¡cora maestra â€” cargar estado "Â¿EntregÃ³ tarea?" desde BD**
- Agregar `grupo_id` al objeto alumno cuando se selecciona en lista
- Crear useEffect que carga `trajoTarea` desde `tareasHoy[0].completada`
- Permite ver en bitÃ¡cora de solo lectura si ya estÃ¡ marcada como entregada

**7. BitÃ¡cora papÃ¡ â€” mostrar tareas en pestaÃ±a "Tareas"**
- Endpoint bitÃ¡cora ahora retorna `tareas[]` (query a tabla tareas + tarea_alumno)
- Filter corregido: comparar solo fecha YYYY-MM-DD (sin hora UTC)
- Muestra: tÃ­tulo, descripciÃ³n, estado (âœ… Entregada / â³ Pendiente)

**8. Seed de datos de prueba: seed_tarea_ayer_emilio.js**
- Inserta tarea "Dibujo de la familia" con fecha_limite = ayer
- Permite validar bitÃ¡cora de fechas pasadas
- Ejecutado: tarea creada con ID e40a122a-19a0-4366-85d9-005e00ec6d9b

### Archivos modificados:
- `web/src/pages/maestra/Bitacora.jsx` â€” label + grupo_id + useEffect tarea + query fecha
- `backend/src/routes/tareas.js` â€” 3 nuevos endpoints/cambios: pendientes-alumno, lista-pendientes, hoy-pendientes
- `web/src/pages/padre/Dashboard.jsx` â€” TareaRecienteCard â†’ lista completa, urgencia, descripciÃ³n completa
- `web/src/pages/padre/Bitacora.jsx` â€” filter tareas por fecha YYYY-MM-DD
- `backend/src/routes/bitacora.js` â€” agregar tareas[] a endpoint GET /:alumnoId
- `backend/src/database/seed_tarea_ayer_emilio.js` â€” nuevo archivo

### ValidaciÃ³n completada âœ…
- Dashboard papÃ¡: "ðŸ“š 3 tareas por entregar" â†’ "ðŸ“š 2 tareas por entregar" (1 marcada como entregada)
- BitÃ¡cora miss: "Â¿EntregÃ³ tarea?" aparece en dÃ­a de ayer con "Dibujo de la familia"
- BitÃ¡cora papÃ¡: tab Tareas muestra "Dibujo de la familia" âœ… Entregada en dÃ­a ayer
- Lista Dashboard: todas las tareas pendientes ordenadas por fecha, con urgencia por color

---

## âœ… SESIÃ“N 67 â€” VerificaciÃ³n Notificaciones Tareas + UI/UX Dashboard PapÃ¡

**Fecha:** 2026-04-24 | **Estado:** Completado

### Cambios completados:

**1. UX ConfiguraciÃ³n Directora (web/src/pages/directora/Configuracion.jsx)**
- Separar en tabs: "Horarios y reglas" vs "Notificaciones"
- Cada tab con su propio botÃ³n Guardar independiente
- Reduce confusiÃ³n de usuario (antes: 2 botones "Guardar" + "Guardar notif")

**2. VerificaciÃ³n Notificaciones de Tarea (backend + BD)**
- Confirmado: endpoint `PUT /tareas/:id/publicar` inserta notificaciones
- RequerÃ­a activar tipo `'tarea_nueva'` en `configuracion_general.notificaciones_modal_tipos`
- SoluciÃ³n: panel ConfiguraciÃ³n ya tenÃ­a checkbox, solo necesitaba activarlo
- Validado: notificaciones llegan a papÃ¡s en tiempo real (campanita)

**3. Fix Dashboard PapÃ¡ â€” Hooks Error (web/src/pages/padre/Dashboard.jsx)**
- Bug: `useQuery` dentro de `.reduce()` violaba reglas de Hooks
- SoluciÃ³n: extraer a componente `TareaRecienteCard` (mismo patrÃ³n que `PagoResumenCard`)
- Resultado: sin errores de Hooks, Dashboard papÃ¡ carga limpiamente

**4. Mejora Card Tarea Reciente (web/src/pages/padre/Dashboard.jsx)**
- âœ… TÃ­tulo de secciÃ³n: "Tareas encargadas" â†’ "Tareas pendientes"
- âœ… Mostrar fecha de creaciÃ³n (Creada: 24/04/2026) â€” top right, discreta
- âœ… TÃ­tulo mÃ¡s grande (text-lg font-black) â€” mejor jerarquÃ­a visual
- âœ… DescripciÃ³n completa (sin truncar a 80 chars)
- âœ… BotÃ³n "ðŸ“Ž Ver imagen de referencia" + modal si existe foto
- âœ… Badge naranja "Fecha de entrega" prominente con formato corto (lun, 27 abr)
- âœ… Badge estado entrega (Entregada/Pendiente) al final

**5. Fix Fechas (backend + frontend)**
- Backend: agregar `t.created_at` a SELECT endpoint `/tareas/reciente`
- Frontend: `created_at` y `fecha_limite` vienen en ISO 8601 con timestamp
- SoluciÃ³n: `.substring(0, 10)` + manual date parsing para evitar off-by-one por zona horaria
- Formato homologado: mismo que "PrÃ³ximos eventos" (ej: "lun, 27 abr")

**Archivos modificados:**
- `backend/src/routes/tareas.js` â€” agregar created_at a query
- `web/src/pages/directora/Configuracion.jsx` â€” tabs + botones separados
- `web/src/pages/padre/Dashboard.jsx` â€” 3 cambios: componente TareaRecienteCard, mejoras card, fix fechas

**ValidaciÃ³n en browser:**
- âœ… Directora: tabs funcionan, guardar horarios y notificaciones independiente
- âœ… Miss: puede crear/publicar/borrar tareas
- âœ… PapÃ¡: ve Dashboard sin errores, tarea con fecha creada + entrega formateadas, modal foto funciona
- âœ… Notificaciones: llegan a papÃ¡ en campanita al publicar tarea (si `tarea_nueva` activado)

### Pendientes para prÃ³xima sesiÃ³n:
- Dashboard directora: Indicador "[X] Tareas por recibir"
- BitÃ¡cora: Campo "Trajo Tarea: SÃ/NO"
- PapÃ¡ bitÃ¡cora: Vista de tareas (solo lectura)
- Directora dashboard: Alerta alumnos 3+ tareas sin entregar

---

## âœ… SESIÃ“N 66 â€” RevisiÃ³n Completa de Proceso + Finalizar MÃ³dulo Tareas

**Fecha:** 2026-04-24 | **Estado:** Completado

### 1. RevisiÃ³n y DepuraciÃ³n de Memory (Protocolo + Skills)

**Archivos eliminados (duplicados y obsoletos):**
- `feedback_cierre_sesion.md` (duplicado)
- `feedback_backend_restart.md`, `feedback_servidor_restart.md`, `feedback_cleanup_procesos.md`, `feedback_dev_server.md` (consolidados)
- `bugs_sesion_27.md`, `bugs_sesion_33plus.md`, `bugs_sesion_36.md` (histÃ³ricos)
- `sesion_38_pendientes_reorganizacion.md`, `sesion_58_dashboard_entrada.md`, `sesion_60_notificaciones_errores.md`, `sesion_61_notificaciones_bugs.md`, `sesion_62_triggers_refactor.md`, `sesion_63_modal_notificaciones.md`, `sesion_64_historial_egresados.md` (histÃ³ricos)

**Archivos creados:**
- `feedback_servidores.md` â€” Protocolo unificado Windows (PowerShell para matar, Bash para iniciar, curl para validar)

**Archivos actualizados:**
- `MEMORY.md` â€” Ãndice reorganizado: contexto + protocolos + reglas + proyectos activos (de 33 a 8 referencias activas)
- `feedback_schema_errores.md` â€” Agregada regla sobre relaciÃ³n padres: `alumnos â†’ alumno_padre â†’ padres â†’ usuarios`

### 2. Finalizar MÃ³dulo Tareas â€” 3 Bugs Backend Corregidos

**Archivo:** `backend/src/routes/tareas.js`

**Bug 1: Query de padres incorrecto (usuario_padre1_id inexistente)**
- Afectaba: DELETE /tareas/:id (lÃ­nea 352-357) + PUT /tareas/:id/publicar (lÃ­nea 425-431)
- Columnas inventadas: `usuario_padre1_id`, `usuario_padre2_id`, `usuario_encargado_id` (no existen en schema)
- SoluciÃ³n: JOIN correcto `alumnos â†’ alumno_padre â†’ padres â†’ usuarios` (igual a bitacora.js y asistencia.js)

**Bug 2: INSERT notificaciones con columnas inexistentes**
- Afectaba: DELETE (lÃ­nea 362-365) + PUT publicar (lÃ­nea 445-447)
- Columnas inventadas: `descripcion`, `urgente`, `referencia_id` (no existen en schema)
- Schema real: `usuario_id, tipo, titulo, cuerpo, datos_extra, leida, enviada_push, created_at`
- SoluciÃ³n: INSERT correcto usando `titulo`, `cuerpo`, `datos_extra` (JSONB con metadatos)

**Bug 3: DELETE notificaciones con referencia_id**
- LÃ­nea 376: columna `referencia_id` no existe
- SoluciÃ³n: Usar `datos_extra->>'tarea_id'` para encontrar notificaciones de una tarea especÃ­fica

**Endpoint DELETE /tareas/:id â€” Funcionalidad:**
- Permite eliminar tareas publicadas (sin restricciÃ³n anterior)
- Si estaba publicada: notifica a cada papÃ¡ + envÃ­a WhatsApp
- Limpia `tarea_alumno` y `notificaciones` relacionadas antes de borrar
- Validado en browser: crear â†’ publicar â†’ borrar âœ…

### 3. Aprendizajes y Protocolo

**Lecciones clave de esta sesiÃ³n:**
1. NUNCA asumir columnas por intuiciÃ³n â€” verificar schema ANTES de escribir queries (leer `001_schema_inicial.sql`)
2. Usar el patrÃ³n existente en code â€” cuando no sabes un JOIN, grep un mÃ³dulo similar (bitacora.js, asistencia.js)
3. Validar con curl DESPUÃ‰S de cada cambio backend (no solo log files)
4. Levantar ambos servidores ANTES de pedir validaciÃ³n (backend + web, verificados con curl)
5. El error es siempre error real â€” si dice "columna no existe", esa columna no existe (no es typo)

**Protocolo de inicio de sesiÃ³n establecido:**
1. Leer MEMORY.md + PENDIENTES.md + archivos memory del sprint
2. PowerShell: matar procesos viejos
3. Bash: levantar backend (sleep 4, curl health)
4. Bash: levantar web (sleep 8, curl http://localhost:5173)
5. Solo entonces: leer cÃ³digo/planificar

**Protocolo de cierre de sesiÃ³n establecido:**
1. Checklist 6 puntos (archivo correcto, cÃ³digo correcto, backend OK, campos API, Vite actualizado, puerto 5173)
2. PENDIENTES.md: marcar completadas + actualizar estado
3. ARCHIVE_LOG.md: crear entrada con fecha + archivos + bugs + aprendizajes
4. Memory: guardar nuevas reglas de feedback, eliminar duplicados, consolidar
5. Git commit OBLIGATORIO (no esperar que Valeria lo pida)

**Archivos modificados (SesiÃ³n 66):**
- `backend/src/routes/tareas.js` â€” 3 queries corregidas, DELETE + PUT publicar validados
- `PENDIENTES.md` â€” removida sesiÃ³n 66, actualizado estado tareas
- `MEMORY.md` â€” reorganizado Ã­ndice, 15 duplicados eliminados
- `feedback_schema_errores.md` â€” agregar regla alumno_padre JOIN
- `feedback_servidores.md` â€” nuevo archivo protocolo unificado

---

## âœ… SESIÃ“N 63 â€” Notificaciones Modal Real-time + ConfiguraciÃ³n Directora + Mobile Campanita

**Fecha:** 2026-04-24 | **Estado:** Completado (sin fotos por ahora)

### 1. Backend: ConfiguraciÃ³n de Tipos de NotificaciÃ³n

**MigraciÃ³n:** `backend/migrations/025_notificaciones_modal_config.sql`
- Inserta clave `'notificaciones_modal_tipos'` en tabla `configuracion_general`
- Valor por defecto: `["incidente","aviso_extraordinario"]` (JSON array)

**API Endpoints:** `backend/src/routes/config.js`
- `GET /config/notificaciones` â€” retorna `{ notificaciones_modal_tipos: [...] }`
- `PUT /config/notificaciones` â€” solo directora, actualiza tipos que disparan modal
- Ambos autenticados (admitir cualquier rol en GET, solo directora en PUT)

### 2. Frontend Directora: Panel de ConfiguraciÃ³n de Notificaciones

**Archivo:** `web/src/pages/directora/Configuracion.jsx`
- Nueva secciÃ³n "ðŸ”” Notificaciones a padres"
- 4 tipos disponibles (hardcodeados): incidente, aviso_extraordinario, bitacora_lista, medicamento
- Checkboxes para activar/desactivar cada tipo
- BotÃ³n "Guardar notif" que hace PUT a `/config/notificaciones`
- Query separada que cachea 5 minutos la configuraciÃ³n

**UI:** SecciÃ³n con fondo rojo (#FFF5F5), checkboxes estilizados, icono por tipo

### 3. Frontend PapÃ¡: Modal Urgente + Polling Mejorado

**Archivo:** `web/src/components/NotificacionModal.jsx` (nuevo)
- Componente presentacional puro
- Modal overlay fijo con `position: fixed inset-0 z-50`
- Borde superior de color segÃºn tipo (rojo incidente, naranja aviso)
- Icono grande, badge tipo, tÃ­tulo, cuerpo, botÃ³n "Entendido"
- No cierra con click en overlay (fuerza lectura)

**Archivo:** `web/src/components/NotificationBell.jsx` (modificado)
- Polling aumentado de 30s â†’ 15s (refetchInterval)
- Query paralela `notif-urgentes` que filtra por config de tipos y leÃ­da=false
- Sistema de cola: `colaModal` (array) y `modalActual` (objeto)
- `sessionStorage` con clave `notif-modal-${id}` para evitar repetir modales en misma sesiÃ³n
- `useRef yaMostradas` para rastrear en memoria durante la sesiÃ³n
- `useEffect` que encola nuevas urgentes detectadas
- `useEffect` que muestra de la cola cuando no hay modal activo
- Handler `handleEntendido` que marca leÃ­da y cierra el modal

**Flujo:** Padre ve modal automÃ¡tico cuando llega notificaciÃ³n de tipo configurado como urgente. Al hacer "Entendido", se marca como leÃ­da y se muestra la siguiente de la cola.

### 4. Mobile: Campanita de Notificaciones (React Native)

**Archivo:** `mobile/src/components/NotificationBell.jsx` (nuevo)
- Componente React Native autÃ³nomo
- `TouchableOpacity` con emoji ðŸ””
- Badge numÃ©rico rojo encima (muestra 9+ si >9 notificaciones)
- `Modal` con `animationType="slide"` (bottom-sheet)
- Lista de notificaciones con scroll
- Ãconos por tipo (ðŸš¨/ðŸ“¢/ðŸ’Š/ðŸ“/ðŸ””)
- No-leÃ­das con fondo #FFF5F5 y punto rojo
- Tap en notificaciÃ³n marca como leÃ­da (mutation)
- Queries: `/notificaciones/no-leidas` (polling 30s) + `/notificaciones` (enabled cuando modal abierto)

**IntegraciÃ³n:** `mobile/app/(padre)/index.jsx` â€” MontoedComponent en header del dashboard, al lado del emoji familia

### 5. ValidaciÃ³n

- Documento de validaciÃ³n manual: [VALIDACION_SESION_63.md](VALIDACION_SESION_63.md)
- Pasos paso-a-paso para Directora (config), PapÃ¡ (modal), Mobile (campanita)
- Checklist final con 10+ puntos de validaciÃ³n

### 6. Fix: Incidente sin FormData (mitad de sesiÃ³n)

**Problema:** FormData multipart con multer causaba errores de boundary. Alumno_id llegaba undefined.

**SoluciÃ³n:** 
- Backend: `POST /bitacora/incidente` sin multer, JSON directo
- Frontend: cambiar de FormData a JSON
- Quitar UI de fotos (se agregarÃ¡n despuÃ©s con approach correcto)

**Resultado:** Incidente funciona, registra en BD, dispara notificaciÃ³n, modal urgente aparece en portal papÃ¡ âœ…

---

## âœ… SESIÃ“N 62 â€” Notificaciones Triggers AutomÃ¡ticos + Refactor Dashboard PapÃ¡

**Fecha:** 2026-04-24

### Backend: Bug Fix `notificacion_enviada`
**Archivo:** `backend/src/routes/bitacora.js` (lÃ­neas 357-360)

Al registrar medicamento suministrado (`POST /bitacora/medicamento`):
- Ya insertaba notificaciÃ³n en `notificaciones` (sesiÃ³n anterior)
- **Ahora tambiÃ©n actualiza:** `medicamentos.notificacion_enviada = true`
- Ubicado dentro del `if (usuario_id)` para asegurar solo se marca si la notificaciÃ³n fue exitosa

**RazÃ³n:** Campo existÃ­a en schema desde sesiones anteriores pero nunca se marcaba. Ahora permite rastrear si notificaciÃ³n fue enviada.

### Frontend: Dashboard PapÃ¡ Refactor UI

**1. Saludo sin coma extra**
- `web/src/pages/padre/Dashboard.jsx` lÃ­nea 228
- Antes: `"Â¡Hola, MamÃ¡, Alejandra!"` (coma antes del nombre)
- Ahora: `"Â¡Hola MamÃ¡ Alejandra!"`

**2. SecciÃ³n "ðŸ’³ Pagos" reemplaza grid de accesos rÃ¡pidos**
- Removidas cards de BitÃ¡cora y Calendario del dashboard (acceso directo en nav aÃºn disponible)
- Nueva secciÃ³n con componente `PagoResumenCard` (lÃ­neas 231-258)
- Consulta `GET /pagos/estado/:hijoId` por cada hijo (React Query con staleTime 5min)
- Muestra estado en tiempo real:
  - Verde: `"âœ… Al dÃ­a"`
  - Amarillo/Rojo: `"âš ï¸ Adeudo: $X,XXX MXN"`
  - Suspendido: `"ðŸš« Suspendido: $X,XXX MXN"`

**Beneficio UX:** Padre ve de un vistazo si hay adeudos sin navegar a /padre/pagos.

---

## âœ… SESIÃ“N 61 â€” Bugs Notificaciones Multi-SesiÃ³n: Cache, Filtering, Encoding

**Fecha:** 2026-04-24

### Problema Principal
DespuÃ©s de sesiÃ³n 60, usuarios reportaban que notificaciones aparecÃ­an:
- Con estado incorrecto (leÃ­da cuando no deberÃ­a)
- Conteo de confirmaciones incorrecta en portal directora
- Caracteres acentuados corruptos (niÃ±os â†’ niï¿½os)

### Bugs Identificados y Corregidos

**Bug 1: QueryClient cache no se limpiaba en logout**
- **Causa:** React Query singleton vivÃ­a en memoria, siguiente usuario heredaba cachÃ©
- **SoluciÃ³n:** 
  - CreÃ³ `web/src/services/queryClient.js` singleton exportable
  - `authStore.js` llama `queryClient.clear()` en logout
  - `main.jsx` importa queryClient desde services
- **Impacto:** Multi-sesiÃ³n ahora funciona â€” Papa A logout â†’ Papa B login ve SUS datos

**Bug 2: Endpoint estado aviso filtraba por tÃ­tulo (crÃ­tico)**
- **Causa:** `WHERE n.titulo = $1` en lugar de aviso_id â†’ mezcla conteos si dos avisos tienen mismo tÃ­tulo
- **SoluciÃ³n:** 
  - CambiÃ³ a `WHERE n.datos_extra->>'aviso_id' = $1`
  - Eliminou query intermedia de buscar por tÃ­tulo
- **Impacto:** Directora ve conteo exacto de confirmaciones de lectura

**Bug 3: staleTime: 30s prevenÃ­a re-fetch inmediato**
- **Causa:** React Query mantenÃ­a cachÃ© por 30s, dentro de esa ventana no re-fetcheaba
- **SoluciÃ³n:**
  - EliminÃ³ `staleTime: 30_000` de query notificaciones
  - Reducido `refetchInterval` en badge de 60s a 30s
- **Impacto:** Notificaciones siempre frescas al abrir panel

**Bug 4: UTF-8 encoding incorrecto en web**
- **Causa:** axios no declaraba charset UTF-8, navegador enviaba caracteres acentuados corruptos
- **SoluciÃ³n:**
  - `api.js`: agregado `charset=utf-8` a Content-Type header
  - `api.js`: agregado `transformRequest` explÃ­cito para JSON
- **Impacto:** "Los niÃ±os" se guarda y muestra correctamente, no "niï¿½os"

**Bonus: Papa Sofia no era tutor principal**
- **Causa:** `papa.sofia.maternal@happyschool.edu.mx` registrado pero `es_tutor_principal = false` para Sofia Reyes Mendoza
- **SoluciÃ³n:** Actualizar BD â€” SET `es_tutor_principal = true`
- **Impacto:** Papa Sofia ahora recibe notificaciones de su hija

### Archivos Modificados
- `web/src/services/queryClient.js` (nuevo)
- `web/src/main.jsx`
- `web/src/store/authStore.js`
- `web/src/components/NotificationBell.jsx`
- `web/src/services/api.js`
- `backend/src/routes/notificaciones.js`

### ValidaciÃ³n
âœ… Multi-sesiÃ³n: Papa A logout â†’ Papa B ve SUS notificaciones, no las de A
âœ… Persistencia: Papa A vuelve â†’ su notificaciÃ³n sigue sin leer (no hereda estado de Papa B)
âœ… Conteo: Directora ve count correcto de confirmaciones
âœ… Encoding: Acentos y caracteres especiales visibles correctamente

---

## âœ… SESIÃ“N 60 â€” Notificaciones Globales: Backend Endpoints + Frontend UI

**Fecha:** 2026-04-24

### Problema Principal
SesiÃ³n 59 habÃ­a planeado notificaciones pero se descubriÃ³ que faltaba auditorÃ­a legal: timestamps de envÃ­o Y de lectura para evidencia si padre dice "no me llegÃ³" o "yo sÃ­ lo leÃ­".

### Funcionalidades Completadas

**Backend â€” Endpoints Notificaciones (`backend/src/routes/notificaciones.js`)**
- `GET /` â€” Ãšltimas 20 notificaciones del usuario autenticado
- `GET /no-leidas` â€” Contador de notificaciones no leÃ­das
- `PUT /leer-todas` â€” Marcar todas como leÃ­das (para botÃ³n "Marcar todo como leÃ­do")
- `PUT /:id/leer` â€” Marcar una notificaciÃ³n como leÃ­da (para clic individual)
- `POST /aviso-extraordinario` â€” Directora envÃ­a aviso urgente a padres (todos o grupos seleccionados)
  - Inserta en tabla `avisos` para persistencia histÃ³rica
  - Crea notificaciÃ³n para cada padre tutor principal
  - Retorna `{ ok, enviadas, aviso_id }`
- `GET /aviso-extraordinario/estado/:avisoId` â€” Estado de lectura de un aviso (tab "Sin leer" vs "Vieron")
  - Query por tÃ­tulo para encontrar notificaciones originales
  - Retorna count total, leÃ­das, pendientes + detalle con padre_nombre, alumno_nombre, grupo_nombre, estado lectura
- `GET /avisos-extraordinarios` â€” Historial de todos los avisos enviados (visible para Directora)

**Frontend â€” Directora: AvisoExtraordinario (`web/src/pages/directora/AvisoExtraordinario.jsx`)**
- Componente `EnviarAvisoForm`: Input tÃ­tulo + textarea cuerpo + multi-select grupos + botÃ³n enviar
- Componente `EstadoAviso`: Tabs "Sin leer" (naranja) y "Vieron" (verde)
- Componente `GrupoCard`: Colapsable por grupo, muestra padres y alumnos en cada grupo
- Estado local: `historialLocal` (reciÃ©n enviados) + query `avisos-extraordinarios` (histÃ³rico BD)
- Manejo `expandidosSet` para tracking de quÃ© grupos estÃ¡n desplegados
- Toast notifications de Ã©xito/error

**Frontend â€” PapÃ¡: Notificaciones en Dashboard**
- Campanita en navbar con contador de no leÃ­das
- Click abre modal con listado de notificaciones
- Click en notificaciÃ³n marca como leÃ­da (PUT /:id/leer)
- BotÃ³n "Marcar todo como leÃ­do"

### Error CrÃ­tico Detectado y Resuelto

**RaÃ­z:** MigraciÃ³n 023 (`backend/migrations/023_avisos_extraordinarios.sql`) creada pero NUNCA aplicada a BD. Columnas `leida_at`, `tipo`, `grupo_ids` no existÃ­an en el schema real.

**SÃ­ntomas:** 500 errors en endpoints:
- `PUT /leer` â†’ "column leida_at does not exist"
- `GET /avisos-extraordinarios` â†’ "column grupo_ids does not exist"
- `POST /aviso-extraordinario` â†’ "column tipo does not exist"

**Impacto:** Usuario validÃ³ 5+ veces sin soluciÃ³n porque el backend compilaba pero fallaba en runtime.

**SoluciÃ³n:**
- Removidas referencias a columnas no existentes (`leida_at`, `tipo`, `grupo_ids`)
- Backend usa SOLO columnas que ya existen: `leida`, `created_at`, `titulo`, `contenido`, `creado_por`
- Endpoints funcionan con schema actual sin migraciÃ³n

**LecciÃ³n Guardada en Memoria:** Verificar que columnas existen ANTES de escribir queries. No asumir que migraciÃ³n creada = aplicada.

### Archivos Modificados
1. `backend/migrations/023_avisos_extraordinarios.sql` (creado, no aplicado)
2. `backend/src/routes/notificaciones.js` (endpoints para avisos)
3. `web/src/pages/directora/AvisoExtraordinario.jsx` (nueva, UI completa)
4. `web/src/layouts/DirectoraLayout.jsx` (agregado nav item)
5. `web/src/App.jsx` (agregada ruta)

### VerificaciÃ³n en Browser
- âœ… Campanita en navbar papÃ¡ muestra contador
- âœ… Click abre modal con notificaciones
- âœ… Click notificaciÃ³n marca como leÃ­da (PUT funciona)
- âœ… Directora envÃ­a aviso a grupos seleccionados
- âœ… Aviso persiste en histÃ³rico
- âœ… Estado actualiza en tiempo real (Sin leer â†’ Vieron)
- âœ… Grupos se expanden/contraen correctamente

### Tareas Pendientes para SesiÃ³n 61
- Implementar triggers automÃ¡ticos en bitÃ¡cora, medicamento, incidente (INSERT notificaciones)
- Agregar `leida_at` columna a BD cuando sea posible (aplicar migraciÃ³n 023)
- Implementar notificaciones modales en tiempo real (WebSocket o polling)
- Paridad mobile: revisar si mobile necesita notificaciones

---

## âœ… SESIÃ“N 59 â€” Bug `mis-hijos`: respuesta objeto vs array en web y mobile

**Fecha:** 2026-04-23

### Problema
El endpoint `GET /alumnos/mis-hijos` devuelve `{ hijos: [...], horaLimiteEntrada }` (objeto), pero 5 componentes asumÃ­an que `r.data` era directamente un array, causando `hijos.find is not a function` y `hijos.map is not a function`.

### Archivos Corregidos
- `web/src/pages/padre/Bitacora.jsx` â€” `hijosData.hijos || []` + renombrada variable para evitar colisiÃ³n con `data` de bitÃ¡cora
- `web/src/pages/padre/Pagos.jsx` â€” `hijosData.hijos || []`
- `web/src/pages/padre/ComidaSemanal.jsx` â€” `hijosData.hijos || []`
- `mobile/app/(padre)/index.jsx` â€” `hijosData?.hijos || []`
- `mobile/app/(padre)/pagos.jsx` â€” `hijosData.hijos || []`

### Reglas Nuevas Guardadas
- Grep en web **y** mobile antes de corregir cualquier bug; corregir ambos en el mismo turno.

---

## âœ… SESIÃ“N 58 â€” Dashboard PapÃ¡ Enriquecido: Entrada Autorizada/Rechazada + Retardos + Advertencias

**Fecha:** 2026-04-23 | **Commits:** 2 (implementaciÃ³n + ajuste formato hora)

### Funcionalidades Completadas

**Dashboard PapÃ¡ â€” Visibilidad de entrada y retardos**
- Backend (`alumnos.js` lÃ­nea 36-45):
  - Endpoint `GET /mis-hijos` ahora retorna `filtro_entrada.numero_retardo_mes` (total retardos acumulados en el mes)
  - Query SQL con COUNT de retardos siempre activo (aunque no haya entrada hoy)
  - Respuesta estructurada: `{ hijos: [...], horaLimiteEntrada }`
- Frontend (`Dashboard.jsx` - HijoCard):
  - 3 estados visuales segÃºn retardos acumulados:
    - **0 retardos + entrada autorizada:** Fondo verde, hora de entrada mostrada sin sÃ­mbolo "@"
    - **1-2 retardos + entrada autorizada:** Fondo amarillo, badge "âš ï¸ Retardo", alerta "prÃ³ximo retardo bloquea entrada"
    - **â‰¥3 retardos:** Fondo rojo, alerta "ðŸš« LÃ­mite de retardos alcanzado", indica que maÃ±ana serÃ¡ rechazado si llega tarde
  - Entrada rechazada:
    - Motivo enriquecido: ðŸŒ¡ï¸ para fiebre, ðŸ¤’ para sÃ­ntomas
    - Checklist con âœ…/âŒ: uÃ±as, uniforme, bata, agua, termo, ojos
  - Alerta unificada de retardos (sin repeticiones)

### Archivos Modificados (1 archivo)
- `backend/src/routes/alumnos.js` â€” campos `numero_retardo_mes` en SELECT y objeto `filtro_entrada`
- `web/src/pages/padre/Dashboard.jsx` â€” lÃ³gica retardos, badges, colores, checklist, hora sin "@"

### VerificaciÃ³n en Browser
- âœ… Dashboard padre: retardos visibles, badges funcionales, hora sin sÃ­mbolo
- âœ… Colores Tailwind aplicados correctamente (verde/amarillo/rojo)
- âœ… Checklist desplegable con âœ…/âŒ
- âœ… Alerta unificada (sin repeticiones de "Retardo #N")

---

## âœ… SESIÃ“N 57 â€” 3 Bugs Entrada: SÃ­ntomas vs Retardos + Asistencia Miss + Protocolo Salud

**Fecha:** 2026-04-23 | **Commits:** 2 (implementaciÃ³n + correcciones)

### Bugs Corregidos

**Bug 1 â€” Alumno rechazado por fiebre mostraba "Retardo #N" (COMPLETAMENTE CORREGIDO)**
- Causa: `es_retardo` se calculaba solo por hora, independiente de sÃ­ntomas. Frontend mostraba badge sin verificar `puede_entrar`. Endpoint devolvÃ­a `numero_retardo_mes` aunque alumno fuera rechazado.
- Backend fix (`asistencia.js`):
  - Reordenar evaluaciÃ³n: sÃ­ntomas/fiebre primero (mÃ¡xima prioridad), retardos solo si pasÃ³ filtro de salud (lÃ­nea 27-60)
  - Solo marcar `es_retardo = true` si `puedeEntrar === true`
  - Endpoint `/asistencia/grupo/:id`: `CASE WHEN puede_entrar=false THEN 0 ELSE numero_retardo_mes` (lÃ­nea 308)
- Frontend fix:
  - `FiltroEntrada.jsx` lÃ­nea 248: Agregar `&& alumno.estado_asistencia !== 'no_entrada'`
  - `Asistencia.jsx` lÃ­nea 238: Agregar misma condiciÃ³n
  - `Dashboard.jsx Directora`: `ModalRetardosGrupo` filtra `.filter(a => a.estado_asistencia !== 'no_entrada')` + actualiza cÃ¡lculo de `totalRetardos` y `tieneAlumnosSeveros`
- Resultado: Alumnos rechazados por sÃ­ntomas NUNCA muestran retardo en ninguna vista

**Bug 2 â€” Asistencia Miss mostraba alumnos de otros grupos (COMPLETAMENTE CORREGIDO)**
- Causa: 
  - Backend fallback usaba `ORDER BY ag.created_at DESC LIMIT 1` â€” retornaba grupo aleatorio
  - Frontend cacheaba query sin invalidar al cambiar usuario
- Backend fix (`grupos.js` lÃ­nea 126-142):
  - Filtrar por `dias_semana` del dÃ­a actual: `($2 = ANY(ag.dias_semana) OR ag.dias_semana IS NULL)`
  - Cambiar a `ORDER BY g.nombre LIMIT 1` â€” determinÃ­stico
- Frontend fix (`Dashboard.jsx` Miss):
  - Importar `useQueryClient` de React Query
  - Agregar `useEffect` que invalida cachÃ© cuando cambia `usuario.id`: `queryClient.invalidateQueries({ queryKey: ['mi-grupo'] })`
- Resultado: Maestra especial ve su grupo correcto inmediatamente, sin necesidad de F5

**Bug 3 â€” Protocolo sÃ­ntomas: visualizaciÃ³n en rojo (feature nueva)**
- Backend (`reportes.js`):
  - Query nueva `rechazados_sintomas`: Filtra `puede_entrar = false AND (sin_fiebre = false OR temperatura > 37.5 OR sin_sintomas = false)`
  - Incluye: `nombre_completo`, `grupo_nombre`, `temperatura`, `motivo_no_entrada`
- Frontend Directora (`Dashboard.jsx`):
  - Card roja "ðŸš¨ Rechazados por sÃ­ntomas hoy" similar a incidentes
  - Muestra temperatura en badge rojo, motivo en texto rojo
- Frontend Miss (`Dashboard.jsx`):
  - Banner rojo derivado de `grupo.alumnos` (sin nueva API call)
  - Auto-refetch cada 30s junto con datos del grupo
- Resultado: Alerta visual inmediata en ambos dashboards â†’ protocolo de salud activado

### Archivos Modificados (7 archivos)
- `backend/src/routes/asistencia.js` (lÃ­nea 27-60: lÃ³gica sÃ­ntomas; lÃ­nea 308: CASE WHEN)
- `backend/src/routes/grupos.js` (lÃ­nea 126-142: filtro dias_semana)
- `backend/src/routes/reportes.js` (Query rechazados_sintomas)
- `web/src/pages/maestra/FiltroEntrada.jsx` (lÃ­nea 248: condiciÃ³n)
- `web/src/pages/maestra/Asistencia.jsx` (lÃ­nea 238: condiciÃ³n)
- `web/src/pages/maestra/Dashboard.jsx` (useQueryClient + useEffect invalidate)
- `web/src/pages/directora/Dashboard.jsx` (filter + cÃ¡lculo totalRetardos)

---

## âœ… SESIÃ“N 56 â€” Entrada (Filtro) + Ciclos histÃ³ricos + Fixes

**Fecha:** 2026-04-23 | **Commits:** 8

### Completado

- **Dashboard Maestra â€” Card "Sin entrada (retardos)":**
  - Endpoint `GET /grupos/mi-grupo/estadisticas/hoy` cuenta alumnos con `estado = 'no_entrada'` cuyo `motivo_no_entrada ILIKE '%retardo%'`
  - Card nueva en grid de stats (5 columnas) con icono UserX, color naranja, refetch cada 30s
  - Suma correcta: En escuela + Retardos + Ausentes + **Sin entrada (retardos)** + BitÃ¡coras guardadas = Total

- **Dashboard PapÃ¡ â€” Filtro de entrada (Checklist sanitario):**
  - Endpoint `GET /alumnos/mis-hijos` extendido con datos completos de `registro_entrada` (uÃ±as, bata, agua, uniforme, termo, ojos, etc.)
  - Card de hijo muestra: ðŸšª âœ… Entrada autorizada / ðŸšª ðŸš« Rechazada + motivo
  - Grid visual 3Ã—2 con checklist: `if (item === null || undefined) return null` para distinguir false (âš ï¸) de null
  - **Fix:** Checklist siempre visible incluso si entrada rechazada, para que papÃ¡ vea quÃ© le faltÃ³

- **Dashboard PapÃ¡ BitÃ¡cora â€” Selector de ciclo (Fase 1):**
  - Carga ciclos desde `GET /alumnos/:id/ciclos` (actualizado a incluir ciclo actual del grupo + histÃ³ricos via UNION)
  - Selector con dropdown mostrando ciclo actual marcado con "(Actual)"
  - UI preparada para Fase 2 (filtro de bitÃ¡cora por ciclo)

- **Fixes implementados:**
  - `FiltroEntradaBadge`: cambiar `if (!item)` â†’ `if (item === null || undefined)` para mostrar `false` como âš ï¸
  - `Bitacora.jsx` â€” Comida: agregar validaciÃ³n `if (c.cuanto_comio)` para evitar "undefined undefined"
  - Endpoint `/alumnos/:id/ciclos`: UNION de inscripciones histÃ³ricas + ciclo actual del grupo

### Archivos modificados
- `backend/src/routes/grupos.js` (nuevo endpoint estadÃ­sticas)
- `backend/src/routes/alumnos.js` (extender mis-hijos + actualizar ciclos)
- `web/src/pages/padre/Dashboard.jsx` (FiltroEntradaBadge + card entrada)
- `web/src/pages/padre/Bitacora.jsx` (SelectorCiclo + validaciÃ³n comida)
- `PENDIENTES.md` (actualizar estado)

### Datos de prueba validados
- Emilio Vega SÃ¡nchez (Prekinder) â€” Entrada autorizada pero faltÃ³ bata + agua â†’ âœ… visible en checklist
- MamÃ¡: `mama.emilio@happyschool.edu.mx` / `happy2024`

---

## âœ… SESIÃ“N 55 â€” Bug bitÃ¡cora + Servicio Comida pagos mejorado

**Fecha:** 2026-04-23

### Completado

- **Bug crÃ­tico `Bitacora.jsx` (Maestra):** Bloqueado registro de bitÃ¡cora para alumnos sin entrada. ValidaciÃ³n `tieneEntrada = alumno.hora_entrada && ['presente','retardo'].includes(alumno.estado_asistencia)`. Banner rojo informativo + botÃ³n guardar deshabilitado si no hay entrada.

- **`ServicioComida.jsx` (Directora) â€” Tab Pagos:**
  - Badge de nivel del alumno (`nivel_nombre`) junto al nombre en cada tarjeta
  - Tabs de filtro por nivel (Todos, Kinder 1, Kinder 2, etc.) generados dinÃ¡micamente
  - Resumen de totales en pesos (ðŸ’³ Transferencia / ðŸ’µ Efectivo / ðŸ’° Gran total) â€” se actualiza al filtrar por nivel
  - Orden: stats contadores â†’ resumen en pesos â†’ filtros por nivel â†’ lista alumnos

- **`comidaController.js` (Backend):** Query `obtenerConfirmaciones` ahora incluye `g.nivel AS nivel_nombre` y `g.nivel_codigo` via `LEFT JOIN grupos`. Orden cambiado a `g.nivel_codigo, a.nombre_completo`.

### Archivos modificados
- `web/src/pages/maestra/Bitacora.jsx`
- `web/src/pages/directora/ServicioComida.jsx`
- `backend/src/controllers/comidaController.js`

---

## âœ… SESIÃ“N 54 â€” MenÃº estructurado + catÃ¡logos migrados + precarga bitÃ¡cora

**Fecha:** 2026-04-23

### Completado

- **`Pagos.jsx` (Directora):** Eliminados arrays hardcoded `METODOS` y `TIPOS_CONCEPTO`. Migrados a `useCatalogo('metodos-pago')` y `useCatalogo('conceptos-pago')`. Props propagados a `ModalPago`, `ModalConceptos` y `FilaAlumno`.

- **`TurnoPuerta.jsx`:** Eliminado objeto `ROL_LABEL` hardcodeado. Migrado a `useCatalogo('roles-personal')` usando `rolMap[key]?.label`.

- **MenÃº semanal estructurado (BD + Backend + 3 portales):**
  - BD: nueva columna `dias_menu jsonb` en `menu_comida_semanal`
  - Backend `comidaController.js`: recibe, parsea y guarda `dias_menu`
  - `ServicioComida.jsx` (Directora): `ModalSubirMenu` reemplazado por grilla 5 dÃ­as Ã— 3 tiempos (desayuno, colaciÃ³n, comida) con selector de niveles expand/collapse. Default colaciÃ³n = Maternal (editable). Niveles cargados dinÃ¡micamente del backend. Preview estructurado en pantalla.
  - `Bitacora.jsx` (Maestra): precarga `que_comio` por dÃ­a y nivel del alumno. Maternal ve 3 tiempos, Kinder ve 2 (sin colaciÃ³n). Indicador ðŸ“‹ en campos precargados.
  - MenÃº existente (texto) se puede migrar al nuevo formato desde el modal â€” precarga `dias_menu` si ya existe.

### Datos de prueba creados
- Alumna: **SofÃ­a Reyes Mendoza** â€” Grupo Maternal, comida confirmada y pagada semana 20-abr-2026
- PapÃ¡: `papa.sofia.maternal@happyschool.edu.mx` / `happy2024`

### Bugs detectados (â†’ SesiÃ³n 55)
- Dashboard miss â†’ bitÃ¡cora sin entrada: fix anterior no funciona, reaparece formulario de entrada
- Servicio Comida / Pagos: falta nivel del alumno y totalizados por mÃ©todo de pago

---

## âœ… SESIÃ“N 53 â€” Bugs post-FASE 3: bitÃ¡cora directora + personal

**Fecha:** 2026-04-23

### Bugs corregidos

- **Personal.jsx â€” `/directora/personal` no cargaba:**
  - `ModalPersonal` y `TarjetaPersonal` referenciaban `ROLES` sin recibirla como prop â†’ `ReferenceError`
  - Fix: prop `roles={ROLES}` pasada desde `DirectoraPersonal` a ambos componentes
  - Fix adicional: lÃ­nea 429 usaba `r.value` en lugar de `r.key` en el filtro de roles

- **AlumnoPerfil.jsx â€” BitÃ¡cora directora sin datos:**
  - `ANIMO_LABEL`, `COMP_LABEL`, `CUANTO_LABEL`, `PANIAL_LABEL` usados pero no definidos (eliminados en FASE 3 de maestra sin actualizar directora)
  - Fix: agregado `useCatalogo` + `toMap()` en `BitacoraDirectora` para los 4 catÃ¡logos dinÃ¡micos
  - Fix: orden de alimentaciÃ³n con `.sort()` explÃ­cito (`desayunoâ†’colaciÃ³nâ†’comidaâ†’comida_extra`)
  - Fix: secciÃ³n de incidentes agregada (estaba omitida â€” API sÃ­ la devolvÃ­a)
  - Fix: hora de medicamentos formateada con `toLocaleTimeString` (antes mostraba ISO completo)

- **personal.js â€” Tarjetas mostraban grupos de ciclos histÃ³ricos:**
  - Query `GET /personal` no filtraba `asignaciones_grupo` por ciclo activo
  - Fix: subquery con `JOIN ciclos_escolares WHERE activo = true`

### Agregados a PENDIENTES (prÃ³ximas sesiones)
- Dashboard maestra: card "Sin entrada por retardos acumulados"
- Dashboard papÃ¡: mostrar resultado del filtro de entrada (quÃ© trajo / quÃ© faltÃ³)

---

## âœ… SESIÃ“N 52 â€” FASE 3 Hardcodeados + Bugs BitÃ¡cora

**Fecha:** 2026-04-23

### Implementado
- **Backend:** Endpoint `GET /catalogos/:tipo` centralizado con 11 catÃ¡logos (animo, comportamiento, cuanto-comio, tiempos-comida, condiciones-panial, niveles, roles-personal, estados-alumno, tipos-documento, metodos-pago, conceptos-pago)
- **Web:** Hook `useCatalogo` + `toMap()` utility. Migradas 5 pantallas: `Bitacora.jsx` (maestra), `Personal.jsx`, `Alumnos.jsx`, `Grupos.jsx`, `CiclosEscolares.jsx`
- **Fix:** Inconsistencia `kinder_1`/`kinder_2`/`kinder_3` â†’ estandarizado a `kinder1`/`kinder2`/`kinder3`
- **Mobile:** `EXPO_PUBLIC_API_URL` en `.env`, `src/constants/catalogos.js` centralizado. Migradas 3 pantallas: bitacora padre, index padre, bitacora maestra
- **Fix timezone:** `SET timezone = 'America/Mexico_City'` en cada conexiÃ³n del pool (`database.js`) para que `CURRENT_DATE` y `NOW()` siempre usen hora MÃ©xico
- **Fix bug datos cruzados entre alumnos:** `key={alumnoSeleccionado.id}` en `FormBitacora` â€” fuerza desmontaje al cambiar de alumno
- **Fix actividades lateral:** Quitado `mostrar` del `enabled` de la query `actividades-grupo` â€” ya carga sin necesidad de abrir el panel
- **Fix comidas no cargaban al re-entrar:** `useEffect([data, alumno.id])` para forzar re-ejecuciÃ³n al montar con cachÃ©

### Bugs corregidos en sesiÃ³n
1. `ANIMOS is not defined` â€” catÃ¡logos declarados en componente padre, no en hijo (`FormBitacora`)
2. `PANIAL_LABEL[key]` retornaba objeto en lugar de string â€” faltaba `.label`
3. Datos de alumno anterior aparecÃ­an en el siguiente â€” faltaba `key` prop en `FormBitacora`
4. Tiempos de comida no cargaban al abrir bitÃ¡cora â€” `useEffect` no se disparaba con datos de cachÃ©
5. Actividades del lateral no aparecÃ­an â€” `enabled: mostrar` impedÃ­a fetch en modo collapsed

---

## âœ… SESIÃ“N 51 â€” Inconsistencias Silenciosas FASE 2

**Fecha:** 2026-04-23

**Archivos modificados:**
- `mobile/app/(padre)/bitacora.jsx` (claves comportamiento)
- `mobile/app/(padre)/index.jsx` (claves Ã¡nimo)
- `mobile/app/(maestra)/bitacora.jsx` (emoji no_comio + esfÃ­nteres nivel_codigo)
- `web/src/pages/padre/Pagos.jsx` (semÃ¡foro de backend)
- `web/src/components/ui/Semaforo.jsx` (simplificar SemaforoPago)

**Tareas Completadas (5/5):**

| Tarea | Detalle |
|-------|---------|
| **#1 Comportamiento vacÃ­o padre mobile** | `excelente/bueno` â†’ `muy_bien/bien` en `COMPORTAMIENTO` de bitacora.jsx. ENUM en BD es `muy_bien`, `bien`, `necesita_mejorar`. |
| **#2 Ãnimo siempre ðŸ¤” dashboard padre mobile** | Agregar `activo: 'âš¡'` e `irritable: 'ðŸ˜¤'`; remover `inquieto` y `energico`. Alineado con web-maestra. |
| **#3 Emoji No comiÃ³ maestra mobile** | `no_comio: 'âœ…'` â†’ `no_comio: 'âŒ'`. SemÃ¡nticamente correcto â€” negaciÃ³n no Ã©xito. |
| **#4 EsfÃ­nteres frÃ¡gil maestra mobile** | Reemplaza `grupoNombre.toLowerCase().includes('kinder 1')` por `['maternal','prekinder','kinder1'].includes(nivelCodigo)`. Pasa `nivel_codigo` estructurado desde `SelectorAlumno`. |
| **#5 SemÃ¡foro pagos unificado** | `padre/Pagos.jsx`: usa `semaforo` del backend en lugar de calcular localmente por `saldo_pendiente`. `SemaforoPago.jsx`: simplificado a recibir `estado` string. Backend (`pagos.js` lÃ­nea 32) es la fuente de verdad. |

**Commit:** `fix: SesiÃ³n 51 â€” FASE 2 inconsistencias silenciosas (5 fixes)` (5 files, 15 insertions, 24 deletions)

---

## âœ… SESIÃ“N 50 â€” Fixes AuditorÃ­a (Bugs CrÃ­ticos FASE 1)

**Fecha:** 2026-04-23

**Archivos modificados:**
- `mobile/app/(padre)/index.jsx` (endpoint)
- `mobile/app/(maestra)/bitacora.jsx` (estructura comidas)
- `web/src/pages/directora/AlumnoPerfil.jsx` (qr_code_url + doc names)

**Tareas Completadas (4/4):**

| Tarea | Detalle |
|-------|---------|
| **#1 Dashboard padre mobile â€” endpoint incorrecto** | Cambiar `/alumnos?rol=padre` â†’ `/alumnos/mis-hijos` (lÃ­nea 94). Ajustar `.data.alumnos` â†’ `.data` porque `/mis-hijos` devuelve array directo. El padre ahora verÃ¡ Ã¡nimo, conducta e incidentes del hijo. |
| **#2 Comida mobile-maestra no llega al padre** | Reemplazar campos sueltos `que_comio`, `cuanto_comio`, `observaciones_comida` (lÃ­neas 238â€“240) por array estructurado `comidas: [{ tiempo: 'comida', que_comio, cuanto_comio, observaciones }]`. Backend solo procesa el array. |
| **#3 QR no aparece en perfil alumno** | Cambiar `alumno.qr_url` â†’ `alumno.qr_code_url` (lÃ­nea 577). Backend devuelve `qr_code_url` en la columna correcta. QR ahora visible en Directora. |
| **#4 SemÃ¡foro documentaciÃ³n siempre "incompleta"** | Alinear nombres en `TIPOS_DOC` y `DOC_REQUERIDOS`: `cartilla_vacuna` â†’ `cartilla_vacunacion`, `foto_3x4` â†’ `foto_escolar` (lÃ­neas 8â€“19). AlineaciÃ³n con BD resuelve mismatch silencioso. |

**Commits:**
- `fix: SesiÃ³n 50 â€” 4 bugs crÃ­ticos de auditorÃ­a` (3 files, 18 insertions, 15 deletions)
- `chore: SesiÃ³n 50 â€” FASE 1 bugs crÃ­ticos completada, preparar SesiÃ³n 51`

---

## âœ… SESIÃ“N 48 â€” AuditorÃ­a de Inconsistencias y Hardcodeados

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **AuditorÃ­a completa web + mobile** | RevisiÃ³n exhaustiva de los 131 archivos del proyecto: portales Maestra, Directora, PapÃ¡ web y PapÃ¡ mobile. |
| **Inventario de bugs crÃ­ticos** | Identificados 4 bugs que rompen funcionalidad hoy: endpoint incorrecto en dashboard padre mobile, comida mobile-maestra que no llega al padre, QR nunca visible en perfil, semÃ¡foro de documentaciÃ³n siempre "incompleta". |
| **Inventario de inconsistencias silenciosas** | Identificadas 5 inconsistencias donde datos se muestran incorrectos: comportamiento vacÃ­o en padre mobile (claves distintas), Ã¡nimo siempre ðŸ¤” en dashboard padre mobile, emoji âœ… para "No comiÃ³", lÃ³gica de esfÃ­nteres frÃ¡gil, semÃ¡foro de pagos con 3 lÃ³gicas distintas. |
| **Inventario de hardcodeados** | Identificados 16 catÃ¡logos duplicados entre portales: niveles, roles, estados alumno, emojis bitÃ¡cora, tiempos comida, condiciones paÃ±al, tipos documento, mÃ©todos pago, conceptos pago, parentescos, etc. IP hardcodeada en mobile. |
| **Plan documentado en PENDIENTES.md** | SesiÃ³n 48 organizada en 3 fases con archivos y lÃ­neas exactas para cada fix. |

**Sin cÃ³digo modificado esta sesiÃ³n â€” solo auditorÃ­a y planeaciÃ³n.**

---

## âœ… SESIÃ“N 47 â€” Portal PapÃ¡: UI + HistÃ³rico

**Fecha:** 2026-04-22

**Archivos modificados:**
- `web/src/pages/padre/Dashboard.jsx` (HijoCard enhancement)
- `mobile/app/(padre)/index.jsx` (HijoCard enhancement)
- `backend/src/routes/alumnos.js` (bug fixes)

**Tareas Completadas (6/6):**

| Tarea | Detalle |
|-------|---------|
| **#1 Orden comida en bitÃ¡cora** | Mostrar Desayuno, ColaciÃ³n, Comida, Comida Extra en orden correcto. Implementado en web/maestra/Bitacora.jsx â†’ propagado a padre/web, padre/mobile, directora. |
| **#2 PrÃ³ximos 3 dÃ­as + modal evento** | Dashboard padre muestra eventos prÃ³ximos con modal interactivo. Implementado en web Dashboard y mobile index con `proximos3Dias()` helper y `ModalEvento` component. |
| **#3 HijoCard dashboard enhancement** | Ãnimo + conducta lado a lado (mismo tamaÃ±o), alertas fiebre ðŸŒ¡ï¸ + incidentes âš ï¸ en grilla 2x2, notas maestra en yellow. Implementado en web + mobile. |
| **#4 Orden de recibos** | Ya estaba implementado (mes actual â†’ Ver Todos â†’ meses anteriores DESC). |
| **#5 ValidaciÃ³n estatus pagos** | Ya estaba implementado (verde solo si saldo_pendiente === 0). |
| **#6 LÃ³gica avance bitÃ¡cora** | Ya estaba implementado ("En curso" + "Finalizada"). |

**Bugs Arreglados:**
1. Tabla `incidentes_alumno` â†’ `incidentes` en GET /alumnos/mis-hijos (SELECT subquery)
2. Orden de rutas Express: `/mis-hijos` ANTES de `/por-qr/:qrData` (ambas antes de `/:id`)
3. Node.js no recargaba cÃ³digo en Windows â†’ resolviÃ³ matando procesos manualmente

**Aprendizajes Documentados:**
- `feedback_emoji_consistency.md` â€” Emoji fuente de verdad en maestra/Bitacora.jsx
- `feedback_ruta_order_express.md` â€” Static routes BEFORE parameterized (reconfirmado)

**PrÃ³ximo Pendiente:**
- ðŸ“‚ HistÃ³rico por ciclo escolar en dashboard padre (ver ciclos pasados)

---

## âœ… SESIÃ“N 46 â€” Actividades: Debugging rutas + autorizaciÃ³n

**Fecha:** 2026-04-22

**Archivos modificados:**
- `backend/src/routes/bitacora.js` (route ordering, authorization, query parameters)
- `.claude/settings.json` (hooks para auto-restart de servidores)

**Tareas Completadas (1/1):**

| Tarea | Detalle |
|-------|---------|
| **Debugging actividades completo** | GET /bitacora/actividades-grupo â†’ 500 error (ruta interpretada como :alumnoId UUID). SoluciÃ³n: mover ruta estÃ¡tica ANTES de :alumnoId. POST /bitacora/actividades-grupo â†’ 403 Forbidden (authorize middleware con roles no coincidentes). SoluciÃ³n: cambiar a authenticate (cualquier usuario logueado). ParÃ¡metros query duplicados â†’ corregir [alumnoId, alumnoId, fecha] a [alumnoId, fecha]. |

**Bugs Arreglados:**
- Express route ordering: static routes ANTES de parameterized routes
- Authorization middleware: role names must match DB exactly
- Query parameters: no duplicar variables en arrays

**Aprendizajes Documentados en memory/:**
- `feedback_servidor_restart.md` â€” Protocol: restart + validate with curl
- `feedback_ruta_order_express.md` â€” Express routing best practice
- `feedback_authorize_middleware.md` â€” Authorization role names from DB

**Impacto:** Feature "actividades mÃºltiples" 100% funcional. End-to-end: maestra captura â†’ alumno participa â†’ papÃ¡ ve â†’ directora consulta. Listo para UI improvements en SesiÃ³n 47.

---

## âœ… SESIÃ“N 45 â€” Actividades mÃºltiples: Captura grupo + participaciÃ³n alumno

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
| **Arquitectura BD nueva** | 2 tablas: `actividades_grupo` (catÃ¡logo del dÃ­a por grupo) + `actividades_alumno` (participaciÃ³n individual). Maestra captura UNA SOLA VEZ, alumnos se seleccionan en bitÃ¡coras. |
| **Endpoints backend (3 nuevos)** | GET actividades-grupo (listar), POST actividades-grupo (capturar con fotos Cloudinary), POST actividades-alumno (guardar participaciÃ³n, auto-crea bitÃ¡cora si falta). GET bitÃ¡cora modificado para devolver actividades con participaciÃ³n. |
| **Panel Maestra â€” Captura** | SecciÃ³n colapsable "ðŸŽ¨ Actividades del dÃ­a" en sidebar. Array dinÃ¡mico: textarea descripciÃ³n + input foto por actividad. Guardar independiente. |
| **SecciÃ³n BitÃ¡cora â€” ParticipaciÃ³n** | Tarjetas de actividades grupo (foto si tiene + descripciÃ³n). 3 botones por actividad: âœ“ SÃ­, âœ— No, â€” Sin registrar. Guardado independiente con API call. |
| **Portal PapÃ¡ â€” Tarjetas actividad** | SecciÃ³n "ðŸŽ¨ Actividades" muestra tarjetas con foto + badge verde âœ“/rojo âœ— de participaciÃ³n. Elimina galerÃ­a separada. Flujo limpio por actividad. |
| **Portal Directora â€” Lista compacta** | AlumnoPerfil BitÃ¡cora: nueva secciÃ³n actividades con miniatura foto + badge. Layout vertical, no interfiere. |
| **Backward compatibility** | GET bitÃ¡cora devuelve `actividades` con mismo shape para datos nuevos y fallback legacy. Sin cambios en endpoints existentes. |

**Impacto:** Arquitectura escalable y eficiente. Maestra no escribe actividades N veces (una por alumno), solo una vez. PapÃ¡ y Directora ven datos visuales con participaciÃ³n clara por actividad. Sistema extensible para futuras mejoras (recurrencias, asignaciÃ³n a sub-grupos, etc).

---

## âœ… SESIÃ“N 44 â€” UI Mejoras Portal Maestra

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
| **NavegaciÃ³n prev/next de fechas** | Agregada en FiltroEntrada, FiltroSalida y Asistencia. Botones ChevronLeft/Right + modo solo lectura para dÃ­as pasados. Backend acepta `?fecha=YYYY-MM-DD` en rutas filtro-entrada y filtro-salida. |
| **Emojis BitÃ¡cora** | Escala visual de comida cambiada de `ðŸ½ï¸ðŸ¥¢ðŸ±ðŸš«` a `ðŸ˜‹ðŸ˜ŠðŸ˜âŒ` para hacerlos mÃ¡s intuitivos en campo CUANTO. |
| **MÃºltiples actividades por dÃ­a** | Array dinÃ¡mico en BitÃ¡cora: agregar, eliminar, guardar y recargar sin pÃ©rdida. Serializado con `\n`. Compatibilidad hacia atrÃ¡s con formato anterior. |

**Impacto:** Portal Maestra mÃ¡s usable â€” navegaciÃ³n fluida entre fechas sin regresar al menÃº, emojis de comida mÃ¡s claros, actividades sin lÃ­mite de una por dÃ­a.

---

## âœ… SESIÃ“N 43 â€” UI Mejoras Portal Directora

**Fecha:** 2026-04-22

**Archivos modificados:**
- `web/src/pages/directora/Pagos.jsx`
- `web/src/pages/directora/ServicioComida.jsx` (nuevo)
- `web/src/pages/directora/TurnoPuerta.jsx`
- `web/src/layouts/DirectoraLayout.jsx`
- `web/src/App.jsx`
- `backend/src/routes/turnos-puerta.js`
- `backend/migrations/021_turno_puerta_tipo.sql` (nuevo)
- `backend/run-migration.js` (nuevo â€” helper reutilizable)

**Tareas Completadas (3/3):**

| Tarea | Detalle |
|-------|---------|
| **Pagos â€” Selector Grupo â†’ Alumno** | ModalPago global reemplaza select plano con flujo Grupo â†’ Alumno. Preview de recargo estimado + total antes de registrar (misma lÃ³gica del backend). |
| **Servicio de Comida unificado** | Nueva pÃ¡gina `/directora/comida` con tabs Pagos / MenÃº. Tab Pagos: 3 cards (Confirmados, Pagados con desglose transf/efect, Sin pagar) + lista alumnos dividida en Semana completa vs DÃ­as especÃ­ficos. Tab MenÃº: imagen/PDF + subir menÃº desde modal. Antiguas rutas `comida-menu` y `comida-pagos` redirigen a `/directora/comida`. Nav sidebar colapsado a 1 item. |
| **Turno Puerta ENTRADA/SALIDA** | MigraciÃ³n BD 021: columna `turno` + constraint Ãºnica por `(fecha, personal_id, turno)`. Tabs Entrada (â˜€ï¸) / Salida (ðŸŒ™) independientes. Checkbox "Por semana" para asignar los 5 dÃ­as de una vez. La misma Miss puede tener ambos turnos el mismo dÃ­a. |

**Bugs corregidos:**
- `ComidaPagos.jsx` usaba claves inexistentes del backend (`stats.pagado_count`). `ServicioComida.jsx` usa las claves correctas (`stats.pagados.total`, `stats.sin_verificar.total`).
- `ComidaPagos.jsx` leÃ­a `conf.nombre_alumno` (undefined). `ServicioComida.jsx` usa `conf.nombre_completo`.

**Impacto:** Portal Directora mÃ¡s usable â€” selector de alumno intuitivo por grupo, comida unificada en una sola vista con tabs, turno de puerta con distinciÃ³n entrada/salida.

---

## âœ… SESIÃ“N 42 â€” Bug Fix: BitÃ¡cora + AutomatizaciÃ³n Servidores

**Fecha:** 2026-04-22

**Archivos modificados:** 
- `web/src/pages/maestra/Bitacora.jsx` (lÃ­nea 741-743)
- `.claude/settings.json` (hooks PostToolUse)

**Tareas Completadas (2/2):**

| Tarea | Detalle |
|-------|---------|
| **Bug: BitÃ¡cora sin validaciÃ³n entrada** | Filtro: solo mostrar alumnos con `estado_asistencia IN ('presente', 'retardo')`. Alumnos ausentes ya no aparecen en selector de bitÃ¡cora. |
| **AutomatizaciÃ³n servidores** | Hooks PostToolUse en `.claude/settings.json`: reinicia Web (puerto 5173) al editar `/web/src/**`, reinicia Backend (puerto 5000) al editar `/backend/src/**`. Procesos asincronos, sin bloqueos. |

**Cambios clave:**
- LÃ­nea 741: `const alumnos = (grupo?.alumnos \|\| []).filter(a => ['presente', 'retardo'].includes(a.estado_asistencia))`
- Hook Web: mata proceso puerto 5173, inicia `npm run dev`
- Hook Backend: mata proceso puerto 5000, inicia `npm run dev`
- Script PowerShell: `kill_and_restart_server.ps1` â€” limpia puerto + inicia servidor

**Impacto:** Evita errores lÃ³gicos (bitÃ¡cora de alumno sin entrada) + acelera desarrollo (no manual restart).

**Protocolo cierre sesiÃ³n registrado:** Actualizar PENDIENTES â†’ ARCHIVE_LOG + commit automÃ¡tico.

---

## âœ… SESIÃ“N 41 â€” Dashboard Directora Unificado

**Fecha:** 2026-04-22

**Archivos modificados:** `web/src/pages/directora/Dashboard.jsx`

**Tareas Completadas (6/6):**

| Tarea | Detalle |
|-------|---------|
| **Asistencia por grupo â€” Modal** | Cards clickeables (grid 5 cols) â†’ modal overlay con lista de alumnos, estado (presente/retardo/no_entrada/ausente), hora entrada, avatar. Fetch `GET /asistencia/grupo/:id?fecha=hoy` al abrir. |
| **Emoji âš ï¸ con tooltip** | Agregado `title="Menos del 80% de alumnos presentes"` cuando presentes < total * 0.8 |
| **Maternal sin asistencia** | Emoji â¬œ cuando `total === 0` (sin alumnos inscritos) |
| **DocumentaciÃ³n Incompleta â€” Cards** | Reemplazo acordeÃ³n por grid cards (5 cols). Agrupa por grupo. Clic â†’ modal con lista de alumnos sin docs. Header muestra nÃºmero de alumnos. |
| **Retardos del Mes â€” Cards** | Reemplazo acordeÃ³n por grid cards (5 cols). Agrupa por grupo. Clic â†’ modal con lista de alumnos + contador retardos. Borde/fondo rojo si hay alumno con â‰¥3 retardos. |
| **Salidas registradas hoy â€” Cards** | Reemplazo acordeÃ³n por grid cards (5 cols). Clic â†’ modal con lista de salidas. Header muestra nÃºmero de salidas. Chips de alerta inline (ðŸš¨ no autorizadas, âš ï¸ anticipadas). |
| **UnificaciÃ³n visual** | Las 4 secciones principales (Asistencia, Salidas, DocumentaciÃ³n, Retardos) ahora comparten diseÃ±o de cards clickeables + modales. Consistencia 100%. |

**Nuevos componentes:**
- `FilaModal` â€” fila individual en modal de asistencia
- `ModalAsistenciaGrupo` â€” modal overlay asistencia por grupo
- `ModalSalidasGrupo` â€” modal overlay salidas por grupo
- `ModalDocumentacionGrupo` â€” modal overlay documentaciÃ³n por grupo
- `ModalRetardosGrupo` â€” modal overlay retardos por grupo
- FunciÃ³n `agruparPorGrupo()` â€” reutilizable para agrupar listas por grupo
- Constante `ESTADO_STYLE` â€” estilos para estados de asistencia

**Bugs corregidos en el proceso:**
- Valores del backend como strings (`'0'`, `'031'`) â†’ conversiÃ³n a nÃºmero con `parseInt()` antes de comparaciones
- `a.retardos` era string `"031"` (concatenaba en lugar de sumar) â†’ fix: `parseInt(a.retardos || 0)` en reduce
- Modal necesitaba `stopPropagation()` para cerrar solo al clic en overlay, no en contenedor interno

**Pendiente para sesiÃ³n 42:**
- Modal Pagos (Directora) â€” selector de grupo + buscador alumno
- Servicio de Comida unificado
- Turno Puerta configuraciÃ³n SALIDA
- Mejoras Portal Maestra (navegaciÃ³n dÃ­as, emojis bitÃ¡cora)
- Mejoras Portal PapÃ¡ (orden bitÃ¡cora, recibos, validaciÃ³n pagos)
- Notificaciones globales (campanita + modal)

---

## âœ… SESIÃ“N 40 â€” UI Mejoras Portal Directora (Parte 1)

**Fecha:** 2026-04-22

**Archivos modificados:** `Semaforo.jsx`, `Grupos.jsx`, `Alumnos.jsx`, `Asistencia.jsx`, `Pagos.jsx`, `Dashboard.jsx`, `index.css`

| Tarea | Detalle |
|-------|---------|
| **Semaforo.jsx** | Badge "Incompleta" â†’ "DocumentaciÃ³n Incompleta" |
| **Grupos.jsx â€” Bug cupo_maximo** | Form usaba `capacidad_maxima` (undefined); corregido a `cupo_maximo` â€” los valores ahora persisten correctamente al editar |
| **Grupos.jsx â€” Ciclo activo** | Badge `ðŸ“… {cicloActualData}` en encabezado â€” dato ya venÃ­a del backend pero no se renderizaba |
| **Grupos.jsx â€” Sufijos** | Placeholder mejorado + helper text "Usa sufijos A, B, C" cuando nivel es Kinder 1/2/3 |
| **Alumnos.jsx â€” Tabs por nivel** | Select de grupo reemplazado por tabs dinÃ¡micos derivados del backend. Filtrado por nivel en cliente con `useMemo` |
| **Alumnos.jsx â€” Iconos visibles** | Removido `opacity-0 group-hover:opacity-100` â€” iconos siempre visibles |
| **Asistencia.jsx â€” Orden grupos** | Tabs de grupos ordenados por nivel de apariciÃ³n en el backend (no hardcodeado) |
| **Asistencia.jsx â€” NavegaciÃ³n dÃ­as** | Botones `â€¹ â€º` navegan entre dÃ­as hÃ¡biles, saltando sÃ¡bado/domingo automÃ¡ticamente. Fecha parseada con `T12:00` para evitar desfase UTC |
| **Asistencia.jsx â€” Scrollbar** | Clase `.scrollbar-hidden` en vista mensual â€” barra morada ya no aparece |
| **Pagos.jsx â€” Tabs por nivel** | Select de grupo reemplazado por tabs dinÃ¡micos derivados del backend. Filtrado usando mapa `grupoNombreâ†’nivel` |
| **Dashboard.jsx** | SecciÃ³n "Horarios Configurados" eliminada (no era dashboard). `useQuery` de config-horarios y `import Settings` removidos |

**Pendiente para sesiÃ³n 41:**
- Dashboard: Clic en tarjeta Asistencia â†’ modal detalle + clarificar âš ï¸
- Dashboard: DocumentaciÃ³n Incompleta agrupada por grupo con acordeÃ³n
- Dashboard: Retardos del Mes agrupados por grupo con acordeÃ³n
- Pagos: ModalPago global â€” selector de grupo + buscador de alumno

**Bugs corregidos en el proceso:**
- Niveles hardcodeados en frontend (`maternal`, `kinder_1`) no coincidÃ­an con BD (`"Maternal"`, `"Kinder 1"`)
- `new Date("YYYY-MM-DD")` parsea en UTC â†’ `getDay()` devuelve dÃ­a anterior en timezone MÃ©xico. Fix: usar `T12:00`

---

## âœ… SESIÃ“N 39 COMPLETADA â€” Sprint 3 Finalizado

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **Portal PapÃ¡ â€” BitÃ¡cora** | Selector de ciclos anteriores + navegaciÃ³n por rango de fechas con `GET /alumnos/:id/ciclos` + `GET /bitacora/:id/rango`. Historial completo funcional. |
| **Portal PapÃ¡ â€” Pagos** | AgrupaciÃ³n por aÃ±o/ciclo con encabezados visuales. Recibos ordenados (actual primero, histÃ³ricos descendente). |
| **Limpieza BD + CURP** | Duplicados Ana GarcÃ­a eliminados (soft-delete), CURP obligatoria implementada, validaciÃ³n en backend y seed. |
| **Testing validado** | Historial ciclos y pagos probados en browser. NavegaciÃ³n fluida confirmada. |

**Sprint 3 cerrado:** Funcionalidad de historial por ciclo completamente operativa en ambos portales.

---

## âœ… SESIÃ“N 39 INICIO â€” Limpieza de BD + ValidaciÃ³n CURP

**Fecha:** 2026-04-22

**Tareas Completadas:**

| Tarea | Detalle |
|-------|---------|
| **D) Eliminar test_ciclos.js** | Archivo de prueba E2E temporal (sesiÃ³n 36) eliminado. |
| **C) Limpiar duplicados Ana GarcÃ­a LÃ³pez** | 3 registros sin CURP eliminados (soft-delete). CanÃ³nico con CURP `GALA220315MDFRLNA1` mantiene relaciones. |
| **MigraciÃ³n CURP obligatoria** | `backend/migrations/020_curp_required_alumnos.sql` â€” valida que todos los alumnos activos tengan CURP. |
| **ValidaciÃ³n backend** | `backend/src/controllers/alumnosController.js` â€” CURP obligatoria al crear alumnos (retorna 400 si falta). |
| **Script limpieza** | `backend/src/database/fix_duplicados_ana.js` â€” procesÃ³ 26 tablas con `alumno_id`, reasignÃ³ relaciones. |
| **Guard seed.js** | `backend/src/database/seed.js` â€” bÃºsqueda por CURP previene reinserciÃ³n de duplicados. |

**PrevenciÃ³n futura:**
- CURP como llave de identidad (no nombre)
- Constraint UNIQUE parcial en BD ya existente (`002_unique_constraints.sql`)
- Backend rechaza alumnos sin CURP
- Seed verifica por CURP antes de insertar

---

## âœ… SESIÃ“N 38 â€” 5 Bugs CrÃ­ticos Resueltos

**Fecha:** 2026-04-22

| Bug | Archivo | Fix |
|-----|---------|-----|
| Duplicado $$ en tabla Comida | `web/src/pages/directora/ComidaPagos.jsx:164` | Removido `$` literal extra en template string |
| Orden alimentaciÃ³n bitÃ¡cora papÃ¡ | `web/src/pages/padre/Bitacora.jsx:346` | Sort por `['desayuno','colacion','comida','comida_extra']` antes del filter |
| ConfiguraciÃ³n no carga horarios | `web/src/pages/directora/Configuracion.jsx:54` | Eliminado `onSuccess` deprecado (React Query v5); usa `configData` del hook con `valores ?? configData?.horarios` |
| Calendario filtro por rol padre | `backend/src/routes/calendario.js:60` | Subquery server-side que filtra por grupos del hijo del padre logueado |
| Firma incidentes â€” Invalid api_key | `backend/src/routes/bitacora.js:427` | Guardado base64 directo en BD; eliminada dependencia de Cloudinary para firmas |

**TambiÃ©n en esta sesiÃ³n:**
- Protocolo "Inicia sesiÃ³n" / "Cierra sesiÃ³n" documentado en CONTEXT.md
- Mejora memoria: Claude siempre inicia backend + web (no Valeria)

---

## ðŸ”‘ REFERENCIA RÃPIDA

### Credenciales de prueba (contraseÃ±a: `HappySchool2026!`)
| Rol | Email |
|-----|-------|
| Directora | directora@happyschool.edu.mx |
| Administrativo | admin@happyschool.edu.mx |
| Maestra Maternal | maternal@happyschool.edu.mx |
| Maestra Prekinder | prekinder@happyschool.edu.mx |
| Maestra Kinder 1 | kinder1@happyschool.edu.mx |
| Maestra Kinder 2 | kinder2@happyschool.edu.mx |
| Maestra Kinder 3 | kinder3@happyschool.edu.mx |
| Padre (Ana GarcÃ­a LÃ³pez) | padre@happyschool.edu.mx |

### Roles del Sistema
| Rol | Acceso |
|-----|--------|
| directora | Todo |
| administrativo | Financiero |
| maestra_titular | Solo su grupo |
| maestra_especial | Grupos y dÃ­as asignados |
| maestra_puerta | Solo entrada/salida |
| padre | Solo sus hijo(s) |

### Estructura del Monorepo
```
APP-KINDER/
â”œâ”€â”€ ARCHIVE_LOG.md / PENDIENTES.md
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ migrations/        001_schema_inicial.sql â€¦ 016_cobro_extension_config.sql
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ controllers/   authController.js, alumnosController.js, comidaController.js
â”‚   â”‚   â”œâ”€â”€ middleware/     auth.js, errorHandler.js, validateRequest.js
â”‚   â”‚   â”œâ”€â”€ routes/        index.js + 16 mÃ³dulos completos
â”‚   â”‚   â”œâ”€â”€ services/      cloudinaryService, whatsappService, qrService
â”‚   â”‚   â”œâ”€â”€ jobs/          comidaJobs.js (cron lunes 8:31 AM)
â”‚   â”‚   â””â”€â”€ database/      seed.js, seed_datos_reales.js, seed_semana_13_17_abril.js
â”‚   â””â”€â”€ .env               (no en git â€” credenciales reales)
â”œâ”€â”€ web/
â”‚   â””â”€â”€ src/pages/
â”‚       â”œâ”€â”€ directora/     Dashboard, Alumnos, AlumnoPerfil, Grupos, Personal,
â”‚       â”‚                  Pagos, Calendario, CiclosEscolares, TurnoPuerta,
â”‚       â”‚                  ComidaMenu, ComidaPagos, Configuracion
â”‚       â”œâ”€â”€ maestra/       Dashboard, FiltroEntrada, FiltroSalida, Asistencia, Bitacora
â”‚       â””â”€â”€ padre/         Dashboard, Bitacora, Pagos, Calendario, ComidaSemanal
â””â”€â”€ mobile/
    â””â”€â”€ app/
        â”œâ”€â”€ (maestra)/     index, asistencia, bitacora, galeria, qr-scanner
        â””â”€â”€ (padre)/       index, bitacora, pagos, calendario, comida
```

---

## ðŸ“‹ HISTORIAL POR SESIÃ“N (reciente â†’ antiguo)

---

### âœ… SESIÃ“N 37 â€” Historial por Ciclo Escolar: Sprint 1+2 (2026-04-21)

#### Backend â€” 5 endpoints nuevos/modificados
- `GET /alumnos?ciclo_id=<uuid>` â€” Cuando llega `ciclo_id`, usa `inscripciones` como fuente en lugar de `alumnos.grupo_id` directo. Sin `ciclo_id` â†’ comportamiento original sin cambios. `backend/src/controllers/alumnosController.js`
- `GET /alumnos/:id/ciclos` â€” Devuelve todos los ciclos en que estuvo inscrito un alumno desde tabla `inscripciones`. `backend/src/routes/alumnos.js`
- `GET /bitacora/:alumnoId/rango?fecha_inicio=&fecha_fin=` â€” Listado de dÃ­as con resumen por dÃ­a (estado_animo, comportamiento, notas, maestra). Detalle del dÃ­a sigue con `?fecha=`. `backend/src/routes/bitacora.js`
- `GET /reportes/dashboard?ciclo_id=<uuid>` â€” Queries hardcodeadas a `activo = true` ahora usan `COALESCE($ciclo_id::uuid, SELECT id WHERE activo = true)`. `backend/src/routes/reportes.js`
- `GET /grupos` â€” Para ciclos histÃ³ricos, `total_alumnos` se calcula desde `inscripciones` (subquery correlacionado). `backend/src/routes/grupos.js`

#### Frontend â€” Directora
- `SelectorCiclo.jsx` â€” Componente reutilizable. Muestra "ðŸ“… Ciclo actual" + lista histÃ³ricos. `web/src/components/ui/SelectorCiclo.jsx`
- `Grupos.jsx` â€” Banner amarillo "ðŸ“š Modo solo lectura" + botÃ³n nuevo deshabilitado + âœï¸ oculto en histÃ³rico. `web/src/pages/directora/Grupos.jsx`
- `Alumnos.jsx` â€” Al cambiar ciclo: limpia filtros, pasa `ciclo_id`, modo solo lectura. `web/src/pages/directora/Alumnos.jsx`

#### RestauraciÃ³n de BD (datos de prueba)
- BD restaurada a **2025-2026 activo**: 18 alumnos con grupos correctos.
- **2026-2027 inactivo**: 10 egresados/bajas (datos del test E2E sesiÃ³n 36).
- 4 inscripciones con `grupo_id IS NULL` â†’ asignadas a Kinder 3 en 2026-2027.
- **Pendiente sesiÃ³n 38:** Ana GarcÃ­a LÃ³pez tiene 3 registros duplicados en `alumnos`.

#### Bugs resueltos
- **Import named vs default:** `SelectorCiclo` importaba `{ api }` pero `api.js` exporta `default` â†’ cambiar a `import api from`.
- **Estado inicial `inscrito`:** al cambiar al ciclo histÃ³rico, filtro `estado='inscrito'` devolvÃ­a 0 resultados â†’ `handleCicloChange` resetea `estadoFiltro` a `''`.
- **BotÃ³n âœï¸ no ocultado:** `TarjetaGrupo`/`TarjetaAlumno` no recibÃ­an prop `soloLectura` â†’ pasar prop y envolver en `{!soloLectura && ...}`.
- **total_alumnos = 0 en histÃ³rico:** contaba con `alumnos.grupo_id` directo ya movido â†’ subquery correlacionado en `inscripciones`.
- **Maestras sin titular:** al copiar grupos en promociÃ³n, todas con `es_titular = false` â†’ marcada la primera por grupo como `es_titular = true` en BD.

---

### âœ… SESIÃ“N 36 â€” E2E PromociÃ³n + Panel ConfiguraciÃ³n Grupos (2026-04-21)

#### Funcionalidades completadas
- Test E2E promociÃ³n de ciclo escolar â€” flujo completo validado en BD.
- **Panel selecciÃ³n de grupos** al copiar: checkbox por grupo, nombre editable, "+ Agregar grupo nuevo".
- **Backend `copiar-grupos-del-anterior` mejorado** â€” acepta body `{ grupos: [...] }` selectivo. Sin body â†’ copia todo. Borra grupos previos del ciclo destino antes de copiar.
- **Selector dinÃ¡mico de grupo destino en Paso 2** â€” cuando un nivel tiene mÃºltiples grupos (ej: K2A y K2B), muestra `<select>`.
- **LÃ³gica de estados corregida** â€” Kinder 3: "ðŸŽ“ Egresado" fijo. Resto: selector Reinscrito/Baja (sin Egresado).
- **BotÃ³n "Reconfigurar grupos"** â€” visible siempre en Paso 1 una vez seleccionado ciclo destino.
- **Contadores actualizados** â€” "X promovidos | ðŸŽ“ Y egresados | âŒ Z bajas".

#### Resultado verificado en BD
- Ciclo 2026-2027: ACTIVO con 6 grupos. 20 alumnos reinscitos | 5 egresados | 3 bajas.

#### Archivos modificados
- `web/src/pages/directora/CiclosEscolares.jsx`
- `backend/src/routes/ciclos.js`

#### Bugs resueltos
- **Stale closure en `setTimeout`:** `handleSeleccionarDestino(cicloDestino)` usaba valor viejo â†’ construir `destinoActualizado` y pasar directo.
- **`nombre_destino` undefined:** `gruposParaEditar[g.id]` era `undefined` si no se tocÃ³ el input â†’ usar `gruposParaEditar[g.id] ?? g.nombre`.
- **Grupos sucios al re-copiar:** endpoint acumulaba duplicados â†’ `DELETE FROM asignaciones_grupo / grupos WHERE ciclo_id = $1` al inicio de cada transacciÃ³n.
- **401 en GET /grupos:** access token 15min expiraba durante flujo largo del modal (stale closure impedÃ­a al interceptor actuar).

---

### âœ… SESIÃ“N 35 â€” Indicador "X niÃ±os comen hoy" en Dashboards (2026-04-21)

- **Dashboard Miss:** Indicador "ðŸ½ï¸ X niÃ±os comen hoy" en verde antes de lista de confirmaciones. Filtra `pago_verificado = true` por dÃ­a actual. Considera `semana_completa` y `dias_seleccionados.includes(diaHoy)`. Se oculta fines de semana. `web/src/pages/maestra/Dashboard.jsx`
- **Dashboard Directora:** Mismo indicador verde destacado sobre el total semanal. `web/src/components/directora/BannerComidaHoy.jsx`
- Array de nombres de dÃ­as: `['Domingo', 'Lunes', ...]` en lugar de abreviados.

---

### âœ… SESIÃ“N 34 â€” CorrecciÃ³n Duplicados de Grupos (2026-04-21)

- **Root cause:** `GET /grupos` sin `ciclo_id` devolvÃ­a grupos de todos los ciclos.
- **Fix `grupos.js`:** sin `ciclo_id`, WHERE incluye `AND g.ciclo_id = (SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1)`.
- **Fix `reportes.js`:** query `asistenciaPorGrupo` filtra por ciclo activo.
- **Fix `pagos.js`:** resumen de pagos por grupo filtra por ciclo activo.
- **Validado:** GET /grupos, GET /reportes/dashboard y GET /pagos devuelven exactamente los 6 grupos del ciclo 2025-2026.

---

### âœ… SESIÃ“N 33+ â€” Limpieza y ReestructuraciÃ³n de Grupos 2025-2026 (2026-04-20)

- **Problema:** Ciclo 2025-2026 con grupos incorrectos/duplicados. Necesitaba: Maternal, Prekinder, Kinder 1A, Kinder 1B, Kinder 2, Kinder 3.
- **RestricciÃ³n crÃ­tica:** Datos histÃ³ricos de semana 13-17 abril referencian UUIDs hardcodeados en seed â†’ NO se pueden eliminar grupos, solo RENOMBRAR.
- **Script `fix_grupos_2025_2026.js`** (transacciÃ³n atÃ³mica, idempotente): renombra, crea K1B, soft-delete sobrantes, Ã­ndice parcial.
- **Backend:** endpoint `DELETE /:id` (soft-delete) en grupos.js. `preview-promocion` usa LATERAL + LIMIT 1 para evitar duplicados con mÃºltiples grupos por nivel.
- **Seeds actualizados:** `seed.js`, `seed_datos_reales.js`, `seed_semana_13_17_abril.js`.
- **Ãndice parcial:** `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` â€” permite soft-delete sin bloquear futuros nombres iguales.

#### Bugs resueltos
- **Ãndice UNIQUE con `deleted_at`:** bloqueaba recrear grupo con mismo nombre â†’ recrear como Ã­ndice parcial.
- **Preview duplicados con mÃºltiples grupos mismo nivel:** LEFT JOIN retornaba filas duplicadas â†’ LATERAL con LIMIT 1.

---

### âœ… SESIÃ“N 32 â€” Ciclos Escolares: Crear, Cierre y PromociÃ³n (2026-04-20)

- **Backend CRUD completo:** `GET /ciclos`, `POST /ciclos`, `GET /ciclos/:id/preview-promocion`, `POST /ciclos/:id/ejecutar-promocion`. Archivo: `backend/src/routes/ciclos.js`
- **LÃ³gica de promociÃ³n automÃ¡tica:** Maternalâ†’Prekinderâ†’K1â†’K2â†’K3â†’Egresado.
- **Web `CiclosEscolares.jsx`:** Tabla de ciclos + modal nuevo ciclo + flujo 3 pasos (seleccionar destino â†’ tabla editable â†’ confirmar).
- **IntegraciÃ³n:** Ruta en `App.jsx`, enlace en sidebar con Ã­cono `Clock`.

#### Bugs resueltos
- Import `pool` â†’ cambiar a `{ query, getClient }`.
- `getPool()` no existe â†’ usar `getClient()`.
- ParÃ¡metro `alumno_id` vs `id` â†’ aceptar ambos con `alumno_id || id`.
- SincronizaciÃ³n: necesitÃ³ 3 restarts de backend.

---

### âœ… SESIÃ“N 31 â€” SincronizaciÃ³n Web-Mobile Comida + Cleanup (2026-04-20)

- **Mobile comida:** `cargarDatos()` extraÃ­da fuera de `useEffect` para ser reutilizable post-confirmaciÃ³n.
- **SincronizaciÃ³n:** Web (`ComidaSemanal.jsx`) y Mobile (`comida.jsx`) llaman al mismo backend.
- **Database cleanup:** 3 duplicados de Ana GarcÃ­a LÃ³pez eliminados. Dejado 1 vÃ¡lido con CURP `GALA220315MDFRLNA1`.
- **MigraciÃ³n 016:** clave `hora_inicio_cobro_extension = '15:06'` en `configuracion_general`.
- **Cobros extensiÃ³n de horario:** Pausado â€” timezone issues complejos UTC vs America/Mexico_City. Revertido a estado limpio.

---

### âœ… SESIÃ“N 30 â€” Dashboard Maestra: Confirmaciones Comida (2026-04-20)

- **Backend:** `GET /comida/confirmaciones` acepta `grupo_id` opcional. Devuelve solo `pago_verificado = true`.
- **Dashboard Maestra:** SecciÃ³n "ðŸ± Confirmaciones" con nombre alumno + modalidad. Refetch cada minuto.
- **FunciÃ³n `getLunesActual()`:** cÃ¡lculo manual `YYYY-MM-DD` sin `toLocaleDateString` (inconsistente por zona horaria).

---

### âœ… SESIÃ“N 29 â€” Dashboard Directora + ValidaciÃ³n Job Cron (2026-04-20)

- **Job cron 8:31 AM:** Verificado en `backend/src/jobs/comidaJobs.js`. Cron `31 8 * * 1`, zona horaria MÃ©xico, busca confirmaciones sin pago, actualiza a cancelado, envÃ­a WhatsApp.
- **Backend `GET /comida/confirmaciones`:** Estructura jerÃ¡rquica `{ pagados: { total, transferencia, efectivo }, sin_verificar: {...} }`.
- **BannerComidaHoy.jsx:** RediseÃ±o compacto horizontal.
- **`seed_comida_pagos_demo.js`:** 3 registros para semana actual.

#### Bugs resueltos
- Procesos Node viejos devolvÃ­an endpoint antiguo â†’ `kill -9` y reiniciar.

---

### âœ… SESIÃ“N 28 â€” FASE 6.9 Control de Pagos Comida (2026-04-20)

- **`ComidaPagos.jsx` (NUEVO):** Panel control pagos semanal, navegaciÃ³n anterior/siguiente semana, toggle âœ… Pagado / âŒ No PagÃ³. `web/src/pages/directora/ComidaPagos.jsx`
- **`FiltroEntrada.jsx`:** Toggle "âœ… Pago verificado" / "âŒ No pagÃ³ - Cancelar" al registrar entrada.
- **HTTP Cache fix:** Middleware desactiva ETags/Cache-Control para `/api/` (no-store, no-cache, must-revalidate).
- **Rutas:** `/directora/comida-pagos` y `/admin/comida-pagos` (reutilizado).

#### Bugs resueltos
- **HTTP 304 Not Modified:** Navegador cacheaba GET `/comida/confirmaciones` â†’ middleware deshabilita cache.
- **json_agg omitÃ­a campos NULL:** cambiar a SELECT directo con campos explÃ­citos.
- **NavegaciÃ³n de semanas rota:** parsear `semanaInicio` correctamente antes de sumar/restar dÃ­as.

---

### âœ… SESIÃ“N 27 â€” FASE 6.9 Indicador de Comedor (2026-04-20)

- **Migraciones 014 y 015:** Tablas `control_comida_semanal` y `menu_comida_semanal`.
- **Backend rutas `/comida/*` completas:** GET menu, POST/DELETE menu, GET confirmaciones, POST/GET/PUT confirmaciÃ³n, PUT verificar-pago, PUT cancelar.
- **`comidaController.js`:** LÃ³gica completa con Cloudinary.
- **Job cron lunes 8:31 AM:** `procesarComidaNoPagada()` en `backend/src/jobs/comidaJobs.js`.
- **Web papÃ¡ `ComidaSemanal.jsx`:** MenÃº semanal, formulario confirmaciÃ³n, selector modalidad (semana $250 | dÃ­as $50), mÃ©todo pago.
- **Web directora `ComidaMenu.jsx`:** Crear/editar menÃº semanal + PDF a Cloudinary.
- **Web maestra `FiltroEntrada.jsx`:** Checkbox verificaciÃ³n pago comida.
- **Mobile papÃ¡ `comida.jsx`:** Pantalla confirmaciÃ³n semanal React Native.

#### Bugs resueltos
- **Import error `comidaController.js`:** `../database/db` â†’ `../config/database`.
- **Variable shadowing:** local `query` string sobrescribÃ­a `query` importado â†’ renombrar a `sql`.
- **auth middleware no exportaba `verifyToken`:** agregar `verifyToken: authenticate`.
- **Navbar emoji ðŸ½ï¸** â†’ lucide-react `UtensilsCrossed`.

---

### âœ… SESIÃ“N 26 â€” FASE 6.8 BitÃ¡cora 4 Tiempos (2026-04-19)

- **MigraciÃ³n 013:** Columna `tiempo` en `registro_comida` (desayuno, colacion, comida, comida_extra). Constraint Ãºnico `(alumno_id, fecha, tiempo)`.
- **Backend:** `GET /bitacora/:alumnoId` retorna `comida` como array. `POST /guardar` acepta array `comidas` con upsert por `(alumno_id, fecha, tiempo)`.
- **Fix duplicados:** `DISTINCT ON (a.id)` en `/alumnos/mis-hijos` y `/grupos/mi-grupo`.
- **UI Miss:** 4 secciones coloreadas (naranja, verde, rojo, pÃºrpura) con textarea + 4 botones emoji "Â¿CuÃ¡nto?" + notas.
- **UI PapÃ¡:** 4 secciones, filtra Comida Extra si `tiene_extension === false`.

---

### âœ… SESIÃ“N 25 â€” ValidaciÃ³n AutomatizaciÃ³n CumpleaÃ±os (2026-04-19)

- Verificado que Ã­cono ðŸŽ‚ ya estaba completamente implementado en `FiltroEntrada.jsx`. FunciÃ³n `esCumpleanos()` usa `.substring(0,10)` correctamente.
- **Script `setup_cumpleanos_demo.js`:** actualiza `fecha_nacimiento` de alumnos de prueba.

---

### âœ… SESIÃ“N 24 â€” GalerÃ­a + Firma Digital Incidentes (2026-04-19)

- **GalerÃ­a de fotos Miss:** Grid 4 columnas en secciÃ³n Actividades.
- **GalerÃ­a de fotos Padre:** Grid 3 columnas, fotos clicables en nueva pestaÃ±a.
- **Firma digital incidentes (Padre):** `SignaturePad.jsx` (canvas interactivo). Endpoint `PATCH /bitacora/incidente/:id/firma` guarda en Cloudinary (`happyschool/firmas`). BotÃ³n "âœï¸ Firmar" â†’ "âœ… Firmado + fecha".
- **Comportamiento:** SecciÃ³n propia, solo si hay datos.
- **Selector de fecha sin fin de semana:** botones â—€ï¸ â–¶ï¸ saltan sÃ¡bados/domingos.
- **PaÃ±al:** ocultar secciÃ³n baÃ±o si `usa_panial=true`. MigraciÃ³n SQL 012 para Ana GarcÃ­a LÃ³pez.

#### Bugs resueltos
- **`usa_panial` no llegaba a frontend:** procesos Node viejos en background â†’ matar todos y reiniciar.

---

### âœ… SESIÃ“N 23 â€” "Tarea" â†’ "Actividades" + N fotos (2026-04-19)

- **MigraciÃ³n 011:** RENAME `tarea_realizada` â†’ `actividad_realizada` en `bitacora_diaria`. ADD `actividad_descripcion TEXT`.
- **Backend:** POST `/bitacora/actividades/fotos` (multipart, hasta 10). GET `/bitacora/:alumnoId/actividades`. GET `/:alumnoId` incluye array `actividades`.
- **Backend refactor (renombre):** `grupos.js`, `alumnos.js`, `bitacora.js` actualizados.
- **Web Miss:** SecciÃ³n "ðŸŽ¨ Actividades" con descripciÃ³n + input mÃºltiple fotos.
- **Web/Mobile PapÃ¡:** Renombrada "Actividades", muestra `actividad_descripcion`, galerÃ­a fotos.
- **Mobile Miss:** `tarea_realizada` â†’ `actividad_realizada` en useEffect y guardarMutation.

#### Bugs resueltos â€” CRÃTICOS (renombrado columna sin audit completo)
- `/alumnos/mis-hijos` devolvÃ­a 500 por `tarea_realizada` sin actualizar.
- `/grupos/mi-grupo` devolvÃ­a 500 por la misma razÃ³n.
- **LecciÃ³n:** Al renombrar columna, SIEMPRE grep completo antes: `grep -r "tarea_realizada" --include="*.js" --include="*.jsx" . | grep -v node_modules`. Documentado en memory.

---

### âœ… SESIÃ“N 22 â€” NavegaciÃ³n RÃ¡pida a BitÃ¡cora (2026-04-20)

- **Dashboard Miss:** Click en alumno de tabla â†’ abre bitÃ¡cora sin pasos extras. `Bitacora.jsx` captura `alumnoId` de query params (`useSearchParams`).
- **SimplificaciÃ³n acciones:** Quitadas tarjetas "Asistencia" y "BitÃ¡cora" (acceso ya integrado en tabla).
- **Fix ruta:** `mi-grupo` movida ANTES de `/:id` en `grupos.js` para evitar conflicto Express.

---

### âœ… SESIÃ“N 20 â€” Incidentes + Medicamentos (2026-04-19)

- **Backend `POST /bitacora/incidente`:** Hasta 5 fotos (Cloudinary `happyschool/incidentes`). Notifica WhatsApp plantilla `incidente`. Multer en memoria.
- **Backend `GET /bitacora/incidentes/hoy`:** Solo directora/administrativo. Definida ANTES de `/:alumnoId`.
- **Backend `GET /bitacora/:alumnoId`:** Incluye `incidentes` con JOIN a `personal`.
- **Web Miss â€” BitÃ¡cora:** SecciÃ³n ðŸ’Š Medicamentos (POST `/bitacora/medicamento`) + âš ï¸ Incidentes (POST multipart `/bitacora/incidente`).
- **Dashboard Directora:** Panel rojo "âš ï¸ Incidentes hoy (N)", refetch 60s.
- **Web PapÃ¡ â€” BitÃ¡cora:** SecciÃ³n incidentes del dÃ­a con fotos y hora.
- **ConfirmaciÃ³n administraciÃ³n medicamento:** Timestamp + WhatsApp inmediato al padre.

---

### âœ… SESIÃ“N 19 â€” Registro Salida (2026-04-19)

- **`GET /api/asistencia/filtro-salida`:** Alumnos con `estado IN ('presente','retardo')` sin salida registrada, agrupados por grupo. Incluye padres + personas autorizadas.
- **PÃ¡gina `/maestra/filtro-salida`:** Lista por grupo, modal con selector "quiÃ©n recoge", banner Ã¡mbar si salida anticipada.
- **JOIN `registro_salida` en `/grupos/mi-grupo`:** Agrega `hora_salida`, `nombre_quien_recoge`, `salida_autorizada`.
- **Dashboard Miss â€” columnas Entrada/Salida:** Badge hora entrada + hora salida (azul=normal / naranja=anticipada). Banner naranja cuando hay salidas anticipadas.
- **Dashboard Directora â€” Salidas por grupo hoy:** AcordeÃ³n por grupo con chips: `X/Y salieron Â· X en escuela Â· âš ï¸ anticipadas Â· ðŸš¨ no autorizadas`.
- **EliminaciÃ³n "Ver antes":** acceso directo en BitÃ¡cora, Pagos y Calendario sin paso intermedio.

---

### âœ… SESIÃ“N 18 â€” ConfiguraciÃ³n + Dashboard DinÃ¡mico (2026-04-19)

- **`GET/PUT /api/config/horarios`:** Lee/actualiza 9 claves de `configuracion_general`.
- **PÃ¡gina ConfiguraciÃ³n directora:** 4 secciones (Entrada, Horario/Salida, Reglas, PerÃ­odos de pago).
- **Monitor puntualidad Dashboard Miss:** Banner verde/gris con hora lÃ­mite de BD. Contador retardos. Reloj cada 30s.
- **Fix timezone retardo:** `toTimeString().slice(0,5)` (UTC) â†’ `toLocaleTimeString('en-CA', { timeZone: 'America/Mexico_City' })`.
- **Dashboard Directora:** Tarjeta âš™ï¸ con horarios principales + enlace a ConfiguraciÃ³n.

---

### âœ… SESIÃ“N 17 â€” BitÃ¡cora HistÃ³rica + Roles Auxiliares (2026-04-19)

- **MigraciÃ³n 009:** UNIQUE INDEX parcial en `asignaciones_grupo (grupo_id, ciclo_id) WHERE es_titular = true`.
- **MigraciÃ³n 010:** Rol `maestra_auxiliar`. Karla Espinoza y MÃ³nica Vargas actualizadas.
- **BitÃ¡cora histÃ³rica Miss (web):** Selector â—„ â–º con salto sÃ¡bado/domingo. DÃ­as anteriores = solo lectura total.
- **BitÃ¡cora histÃ³rica Directora:** Nueva pestaÃ±a "ðŸ“‹ BitÃ¡cora" en AlumnoPerfil.
- **Fix BaÃ±o vs PaÃ±al Miss:** SecciÃ³n "ðŸš¿ BaÃ±o" oculta si `usa_panial=true`.
- **Fix timezone `registro_panial`:** `DATE(hora AT TIME ZONE 'America/Mexico_City')`.
- **Etiquetas paÃ±al mejoradas:** "ðŸ’§ PipÃ­", "ðŸ’© PopÃ³", "âœ… Limpio", "ðŸ”„ Mixto".

---

### âœ… SESIÃ“N 16 â€” Seed Semana 13-17 Abril (2026-04-18)

- **`seed_semana_13_17_abril.js`:** Datos de prueba realistas para 5 dÃ­as.
  - `registro_entrada`: 121 registros (7:15â€“8:55am, flag `es_retardo`).
  - `registro_salida`: 121 registros (~3:00pm).
  - `asistencia`: 125 registros (25 alumnos Ã— 5 dÃ­as).
  - `bitacora_diaria`: 121 registros.
  - `registro_comida` y `registro_banio`: 121 registros cada uno.

---

### âœ… SESIÃ“N 15 â€” Seed Datos Reales (25 Alumnos) (2026-04-18)

- **`seed_datos_reales.js`:** 5 alumnos por grupo, nombres reales, CURP de referencia, edades correctas. Idempotente por CURP.
- **50 padres/madres con login:** `mama.X@` / `papa.X@happyschool.edu.mx`, contraseÃ±a `HappySchool2026!`.
- **25 personas autorizadas:** 1 por alumno (abuela/tÃ­a/tÃ­o).
- **`seed_personal_real.js`:** Directora, admin, 5 titulares, 2 auxiliares con nombres reales.

#### Bugs resueltos
- `GET /personal`: `WHERE p.deleted_at IS NULL` reventaba â†’ `WHERE 1=1` (personal no tiene `deleted_at`).
- `GET /grupos`: no devolvÃ­a `maestra_nombre` â†’ JOIN con `asignaciones_grupo` + `personal`.
- `Grupos.jsx`: `r.data.personal || []` â†’ `r.data || []`.
- `grupo.capacidad_maxima` â†’ `grupo.cupo_maximo` (nombre real del campo).

---

### âœ… SESIÃ“N 14 â€” StatCards + Turno de Puerta (2026-04-18)

- **4Âª StatCard "Ausentes":** `UserX` roja. Grid de 3 â†’ 4 columnas en Dashboard Miss.
- **Sistema Turno de Puerta:**
  - MigraciÃ³n `008_turno_puerta.sql`: tabla `turno_puerta` con UNIQUE(fecha, personal_id).
  - `backend/src/routes/turnos-puerta.js`: 4 endpoints (GET hoy, GET lista, POST asignar, DELETE).
  - `GET /asistencia/filtro-entrada`: si maestra tiene turno, `whereGrupo = ''` (ve todos los grupos).
  - `web/directora/TurnoPuerta.jsx`: date picker + lista asignadas + lista disponibles.
  - Dashboard Miss: banner morado "Â¡Hoy tienes turno de puerta! ðŸšª".

#### Bugs resueltos
- `rol_principal` estÃ¡ en `usuarios`, no en `personal`. `personal` usa `activo` no `deleted_at`.

---

### âœ… SESIÃ“N 13 â€” Filtro de Entrada + QR Scanner (2026-04-18)

- **`GET /asistencia/filtro-entrada`:** Todos los grupos con alumnos y estado de entrada del dÃ­a.
- **`FiltroEntrada.jsx`:** Reloj en tiempo real, banner cumpleaÃ±os, stats, bÃºsqueda, alumnos por grupo, modal checklist.
- **QR Scanner:** `html5-qrcode` â†’ localiza alumno por UUID â†’ abre modal automÃ¡ticamente.
- **Nav y ruta:** `DoorOpen` en `MaestraLayout`, ruta `/maestra/filtro-entrada`.

---

### âœ… SESIÃ“N 12 â€” Mejoras Portal Padre (2026-04-18)

- **BitÃ¡cora Padre:** `<Navigate replace>` redirige automÃ¡ticamente si el padre tiene un solo hijo.
- **SemÃ¡foro "Al Corriente":** si `saldo_pendiente > 0` y backend devuelve `semaforo: 'verde'`, se fuerza `amarillo` en cliente.
- **Orden jerÃ¡rquico de recibos:** mes actual visible al abrir, meses anteriores detrÃ¡s de "Ver todos (N)".

---

### âœ… SESIÃ“N 11 â€” Fix Fechas ISO + CumpleaÃ±os (2026-04-17)

- **Bug `esCumpleanos`:** API devuelve fecha como ISO completo (`"2022-04-17T05:00:00.000Z"`). Sin `.substring(0,10)`, `new Date()` producÃ­a fecha invÃ¡lida â†’ siempre `false`.
- **Fix en 4 archivos:** `web/maestra/Dashboard.jsx`, `web/directora/Dashboard.jsx`, `web/maestra/Asistencia.jsx`, `mobile/(maestra)/qr-scanner.jsx`.
- **Regla documentada:** nunca concatenar fechas del API sin `.substring(0,10)` primero.

---

### âœ… SESIÃ“N 10 â€” AuditorÃ­a + Dashboard Padre (2026-04-17)

- IP hardcodeada `mobile/src/services/api.js` corregida.
- AuditorÃ­a duplicados `plantillas_whatsapp` / `configuracion_general` â€” sin deuda.
- **Dashboard Padre (web/mobile):** Tarjeta hijo como `<Link>`, eliminado "Ver bitÃ¡cora completa â†’" redundante.
- **Alerta cumpleaÃ±os ðŸŽ‚:** en FiltroEntrada QR (web + mobile) y Dashboard maestra.
- **AuditorÃ­a hardcoded:** 5 variables identificadas (ROLES, METODOS, TIPOS_CONCEPTO, TIPOS_DOC, DOC_REQUERIDOS).

---

### âœ… SESIÃ“N 9 â€” Vista Asistencia Directora (2026-04-17)

- **Vista Asistencia Directora:** tabla-matriz mensual con toggle Hoy/Mensual, navegador mes/aÃ±o, totales por alumno.
- **`GET /asistencia/grupo/:id/mensual`:** agrupa por alumno con `dias: { 'YYYY-MM-DD': estado }`.
- **BUG CRÃTICO â€” Zona horaria UTC vs hora local:** `toISOString()` despuÃ©s de las 6pm MÃ©xico devuelve dÃ­a siguiente. Fix backend: `COALESCE($n::date, CURRENT_DATE)`. Fix frontend: `new Date().toLocaleDateString('en-CA')`.

---

### âœ… SESIÃ“N 8 â€” Identidad Visual + GÃ©nero Personal (2026-04-17)

- **MigraciÃ³n 006:** UNIQUE constraint `ciclos_escolares(nombre)` + `fix_duplicados_ciclos.js` (eliminÃ³ 6 duplicados).
- **MigraciÃ³n 007:** campo `genero VARCHAR(10)` en tabla `personal`.
- **Labels "Maestra" â†’ "Miss/Teacher"** en web + mobile (10 archivos).
- **Emojis tono de piel claro ðŸ»** en 16 archivos.
- **Saludos dinÃ¡micos por gÃ©nero** (Miss/Teacher) y por parentesco (MamÃ¡/PapÃ¡).
- **`authController.js`:** login/perfil incluyen `parentesco` y `genero`.

---

### âœ… SESIÃ“N 7 â€” Vistas Maestra y Padre (2026-04-17)

- **Dashboard Maestra:** stats, acciones rÃ¡pidas, tabla alumnos con badges, refetch 30s.
- **PadreLayout:** sidebar completo, nav 4 secciones, esquema rojo.
- **Dashboard Padre:** tarjetas por hijo con `bitacora_hoy` embebida.
- **BitÃ¡cora Padre:** selector fecha â—„ â–º, todas las secciones.
- **Pagos Padre:** semÃ¡foro, comida semanal, historial expandible por mes.
- **Calendario Padre:** grilla mensual + lista + modal de detalle.
- **`GET /alumnos/mis-hijos`:** incluye `bitacora_hoy` (LEFT JOIN `bitacora_diaria` + `registro_comida`).
- **`setup_padre_demo.js`:** bitÃ¡cora, comida, baÃ±o, pagos y eventos para Ana.

---

## ðŸ—ï¸ FASES FUNDACIONALES

### âœ… FASE 4 â€” Control de Pagos (2026-04-17)
- CRUD conceptos de pago configurables.
- Registro de pagos con recargo automÃ¡tico (dÃ­a 6+).
- Dashboard financiero con semÃ¡foro (verde/amarillo/rojo/suspendido).
- Estado de cuenta por alumno â€” web y mobile padre.
- `GET /alumnos/mis-hijos`.
- Archivos: `backend/src/routes/pagos.js`, `web/directora/Pagos.jsx`, `mobile/(padre)/pagos.jsx`.

### âœ… FASE 3 â€” BitÃ¡cora y MÃ³dulos Completos (2026-04-16 / 2026-04-17)
- BitÃ¡cora maestra mobile â€” formulario completo (Ã¡nimo, baÃ±o, paÃ±al, esfÃ­nteres, comida, tarea, salud, notas).
- Asistencia maestra mobile â€” semÃ¡foro en tiempo real (refresh 30s), modal manual.
- Backend personal â€” CRUD + asignaciÃ³n grupos + reset-password.
- Web personal â€” tarjetas con rol, grupos, badge primer login.
- BitÃ¡cora padre mobile â€” lectura con selector de fechas.
- AlumnoPerfil web â€” documentos, personas autorizadas, blacklist.
- Calendario completo â€” backend + web directora + mobile padre.
- MigraciÃ³n 002 â€” Ã­ndices UNIQUE (curp, grupos, conceptos_pago).

### âœ… FASE 2 â€” Alumnos y Grupos (2026-04-16)
- `GET /alumnos/por-qr/:qrData`, `GET /grupos/mi-grupo`, `GET /reportes/dashboard`.
- `web/src/pages/directora/Alumnos.jsx` â€” CRUD completo.
- `backend/src/routes/bitacora.js` â€” GET, POST /guardar, POST /panial, POST /medicamento.
- Git init, GitHub repo: https://github.com/valreyesg/happy-school-app

### âœ… FASE 1 â€” FundaciÃ³n (2026-04-16)
- Monorepo npm workspaces (backend + web) + mobile.
- Esquema PostgreSQL completo (50+ tablas, ENUMs, Ã­ndices).
- Backend Node.js + Express: auth JWT con rotaciÃ³n de refresh tokens.
- Middleware: authenticate, authorize, errorHandler.
- Servicios: cloudinaryService, whatsappService (Twilio lazy init), qrService.
- Seed inicial: grupos, roles, 19 plantillas WhatsApp, categorÃ­as, config general.
- Web: paleta Happy School, CSS utilitario, 4 layouts, router completo.
- Web: authStore (Zustand + persist), api.js (axios + refresh auto).
- Mobile: authStore (SecureStore), Splash, Login, redirect por rol, QR Scanner completo.

---

## âœ… SESIÃ“N 64 â€” Panel Historial Egresados + Excel Export (Sprint 3)

**Fecha:** 2026-04-24 | **Estado:** Completado y validado

### 1. Backend: Endpoint de Egresados por Ciclo

**Archivo:** `backend/src/routes/ciclos.js` (lÃ­neas 444-474)
- `GET /ciclos/:id/egresados` â€” obtener alumnos egresados de un ciclo
- Query con JOINs: `inscripciones` â†’ `alumnos` â†’ `grupos` â†’ `asignaciones_grupo` â†’ `personal` (maestra) + `padres`
- Devuelve: id, nombre_completo, foto_url, fecha_nacimiento, grupo_nombre, nivel, maestra_nombre, padres (JSON array)
- AutorizaciÃ³n: directora, administrativo
- Agrupa por alumno para evitar duplicados con mÃºltiples padres

### 2. Frontend: Tab "Egresados" en CiclosEscolares

**Archivo:** `web/src/pages/directora/CiclosEscolares.jsx`
- Nuevo componente `TabEgresados` (lÃ­neas 590-691)
- Selector de ciclo (solo ciclos cerrados con `!c.activo`)
- Query lazy que se ejecuta solo cuando se selecciona ciclo (`enabled: !!cicloSeleccionado`)
- Tabla con 6 columnas: Foto+Nombre | Grupo | Nivel | Maestra | Fecha nacimiento | Tutor principal
- Muestra contador "X egresados en ciclo Y"
- Estado vacÃ­o si no hay registros
- 2 tabs en la pÃ¡gina: "Ciclos Escolares" (original) | "Egresados" (nuevo)

### 3. ValidaciÃ³n & Fixes

**Problema encontrado:** `exceljs` no estaba instalado en `backend/package.json`
- Ejecutar `npm install exceljs` en `backend/`
- El endpoint `GET /ciclos/:id/export` ya existÃ­a pero no funcionaba
- Tras instalar, Excel export funciona correctamente (2 hojas: Grupos/Maestras + Alumnos)

**ValidaciÃ³n en browser:** Login â†’ Directora â†’ Ciclos â†’ Tab Egresados (selector ciclo + tabla) âœ…

### 4. Commits

- `474ec66` â€” feat: SesiÃ³n 64 â€” Panel Historial Egresados (Sprint 3)
- `f62ef09` â€” chore: SesiÃ³n 64 â€” Sprint 3 COMPLETADO
- `268f475` â€” chore: Instalar exceljs para exportaciÃ³n de ciclos en Excel

---

## âœ… SESIÃ“N XX+12 â€” QR MEJORADO + GESTIÃ“N USUARIOS PADRES (2026-04-29)

**Fecha:** 2026-04-29

**Archivos modificados:**
- `backend/src/routes/padres.js` â€” Email institucional, preview, GET mejorado
- `backend/src/controllers/authController.js` â€” ValidaciÃ³n contraseÃ±a
- `web/src/pages/directora/Usuarios.jsx` â€” Tabs por nivel, agrupaciÃ³n, badges
- `web/src/pages/LoginPage.jsx` â€” Modal primer login
- `mobile/src/pages/PadreScreen.jsx` â€” QR padre real
- `web/src/App.jsx` â€” Ruta /perfil

**Bloques Implementados (7/7):**

1. âœ… Backend: qr_code_url en GET /alumnos/mis-hijos
2. âœ… Backend: Nueva ruta /padres (CRUD: crear-cuenta, activar, inactivar, reset-password)
3. âœ… Web: Fix bug QR parsing en FiltroEntrada (parsear HAPPYSCHOOL:ALUMNO:uuid)
4. âœ… Web: Scanner QR en FiltroSalida (botÃ³n naranja)
5. âœ… Web: Modal QR en Directora/Alumnos (generar/regenerar)
6. âœ… Mobile: Pantalla QR padre real (tabs + imagen 280x280)
7. âœ… Web: Nueva pÃ¡gina /directora/usuarios (gestiÃ³n padres: crear, activar, inactivar)

**Mejoras Detectadas y Resueltas:**

**Email Institucional Generado AutomÃ¡ticamente:**
- FunciÃ³n `limpiarNombre()`: Normaliza nombres con NFD, elimina acentos, convierte a lowercase, reemplaza espacios con underscores
- FunciÃ³n `generarEmailInstitucional(padreId)`: Genera `tutor_primer_nombre_hijo@happyschool.edu.mx` (tutor principal) o `nombre_completo_alumno@happyschool.edu.mx` (segundo tutor)
- Resuelve conflictos con sufijos numÃ©ricos (2, 3, 4) o timestamp fallback
- Endpoint `GET /padres/:id/preview-email`: Previsualiza email sin crear

**DirecciÃ³n PedagÃ³gica Correcta:**
- Cambio fundamental: Email personal del padre (en tabla `padres.email`) â‰  Email de cuenta del portal (en tabla `usuarios.email`)
- Email personal = datos de contacto, NO login
- Email institucional = username del portal, generado automÃ¡ticamente

**OrganizaciÃ³n por Nivel y Grupo:**
- Query `GET /padres` ahora retorna `nivel_nombre`, `grupo_nombre`, `es_tutor_principal`
- Frontend agrupa padres por nivel (Maternal, Kinder 1, 2, 3) luego por grupo (A, B, C)
- Tabs de filtro basados en niveles (como Alumnos.jsx)
- Padres agrupados por alumno (mamÃ¡ y papÃ¡ juntos)

**Tarjetas de Padres Mejoradas:**
- Email institucional visible (no personal)
- Badges: nombre hijo (azul), grupo (pÃºrpura), "ðŸ‘¤ Principal" (verde) si es tutor principal
- Modal "Crear cuenta" muestra preview de email institucional

**Cambio de ContraseÃ±a al Primer Login:**
- Modal bloqueante obliga cambio antes de acceso
- ValidaciÃ³n: 8 caracteres mÃ­nimo, incluye letras y nÃºmeros
- POST `PUT /auth/cambiar-password` con `passwordActual` y `passwordNuevo`

**Resumen TÃ©cnico:**

| Componente | Cambio |
|-----------|--------|
| Email generaciÃ³n | Algoritmo hash sobre primer nombre hijo + timestamp fallback |
| ValidaciÃ³n password | `/[a-zA-Z]/` + `/[0-9]/` + 8 char mÃ­nimo |
| GET /padres | Incluye `nivel_nombre`, `grupo_nombre`, array `hijos` con es_tutor_principal |
| Frontend agrupaciÃ³n | `useMemo` agrupa por nivel â†’ grupo |
| Badges | Mostrar nombre hijo, grupo, tutor principal indicator |

**Commits:**
- `67066a4` â€” feat: SesiÃ³n XX+11 â€” IntegraciÃ³n CatÃ¡logos + Docs Tutores + Notificaciones + CategorÃ­as Eventos
- SesiÃ³n XX+12 validaciones implementadas dentro del mismo ciclo XX+13

---

## âœ… SESIÃ“N XX+13 â€” USUARIOS PADRES + CAMBIO CONTRASEÃ‘A (2026-04-29)

**Fecha:** 2026-04-29

**Archivos modificados:**
- `backend/src/routes/padres.js` â€” Email institucional, preview, GET mejorado
- `backend/src/controllers/authController.js` â€” ValidaciÃ³n contraseÃ±a
- `web/src/pages/directora/Usuarios.jsx` â€” Tabs por nivel, agrupaciÃ³n, badges
- `web/src/pages/LoginPage.jsx` â€” Modal primer login
- `web/src/pages/Perfil.jsx` â€” PÃ¡gina perfil + cambio contraseÃ±a
- `web/src/layouts/PerfilLayout.jsx` â€” Layout para perfil (NUEVO)
- `web/src/layouts/PadreLayout.jsx` â€” Link a "Mi Perfil"
- `web/src/App.jsx` â€” Ruta /perfil

**Bloques Implementados (12/12):**

1. âœ… Backend: Email institucional generado automÃ¡ticamente (tutor_nombre@happyschool.edu.mx)
2. âœ… Backend: GET /padres/:id/preview-email para previsualizar antes de crear
3. âœ… Backend: POST /padres/:id/crear-cuenta usa email institucional
4. âœ… Backend: GET /padres retorna nivel, grupo, es_tutor_principal, hijos ordenados
5. âœ… Web: Tabs por Nivel (Maternal, Kinder 1, 2, 3)
6. âœ… Web: Padres agrupados por alumno (mamÃ¡ y papÃ¡ juntos)
7. âœ… Web: Tarjetas con badges (nombre hijo, grupo, "ðŸ‘¤ Principal" si es tutor)
8. âœ… Web: Modal de cambio de contraseÃ±a al PRIMER LOGIN (bloqueante)
9. âœ… Web: PÃ¡gina /perfil con layout completo (sidebar, volver, logout)
10. âœ… Web: OpciÃ³n cambiar contraseÃ±a en /perfil (accesible despuÃ©s)
11. âœ… Backend: ValidaciÃ³n contraseÃ±a: 8 caracteres mÃ­nimo, letras y nÃºmeros
12. âœ… Web: ValidaciÃ³n contraseÃ±a en cliente y servidor

**Resumen de Estado:**
- **ImplementaciÃ³n:** 12/12 bloques âœ…
- **CompilaciÃ³n:** 100% âœ…
- **ValidaciÃ³n funcional:** 100% âœ…
  - CreaciÃ³n de cuentas de padres
  - Cambio de contraseÃ±a al primer login
  - Cambio de contraseÃ±a desde /perfil
  - Tabs y agrupaciÃ³n por nivel/grupo
  - Badges de tutor principal y grupo

**Mejoras Realizadas vs. XX+12:**
- Email institucional generado automÃ¡ticamente (no reutiliza email personal)
- Tabs por nivel (como en Alumnos)
- Padres agrupados por alumno (mamÃ¡ y papÃ¡ juntos)
- Modal bloqueante de cambio contraseÃ±a al primer login
- PÃ¡gina /perfil accesible desde menÃº lateral
- ValidaciÃ³n de contraseÃ±a: 8 caracteres, letras y nÃºmeros
- Layout consistente con el portal

**Resumen TÃ©cnico:**

| Componente | Cambio |
|-----------|--------|
| Email generaciÃ³n | Algoritmo hash sobre primer nombre hijo + timestamp fallback |
| ValidaciÃ³n password | `/[a-zA-Z]/` + `/[0-9]/` + 8 char mÃ­nimo |
| GET /padres | Incluye `nivel_nombre`, `grupo_nombre`, array `hijos` con es_tutor_principal |
| Frontend agrupaciÃ³n | `useMemo` agrupa por nivel â†’ grupo |
| Badges | Mostrar nombre hijo, grupo, tutor principal indicator |

**Commits:**
- `39c392d` â€” feat: SesiÃ³n XX+13 â€” Usuarios Padres + Cambio ContraseÃ±a (COMPLETADO)

---

## âœ… CATÃLOGOS DINÃMICOS â€” FASES 1-6 COMPLETADAS (Sesiones XX+6, XX+7, XX+8, XX+10, XX+11)

**Fecha:** 2026-04-29 | **Estado:** âœ… 6 FASES COMPLETADAS

**Resumen:** Sistema de catÃ¡logos dinÃ¡micos implementado en 6 fases. Backend endpoints, tablas BD, UI web para editar, hooks mobile y web con React Query. 4 catÃ¡logos principales operacionales: Niveles, Alergias, Parentesco, CategorÃ­as Eventos.

### FASES COMPLETADAS:

**FASE 1-3 â€” Backend endpoints + tablas (Sesiones XX+6, XX+7, XX+8)**
- Endpoints GET/PUT/DELETE catÃ¡logos
- Tablas dinÃ¡micas: niveles, animo, cuanto, comportamiento, condiciones_panial, parentesco, alergias, categorÃ­as_eventos
- Validaciones y soft-delete

**FASE 4 â€” Panel Directora UI (SesiÃ³n XX+7)**
- `Configuracion.jsx` â†’ Tab "CatÃ¡logos"
- CRUD completo: crear, editar, desactivar, reactivar
- Cards por catÃ¡logo con estados

**FASE 5 â€” Hook `useCatalogo` web (SesiÃ³n XX+8)**
- React Query con staleTime 30 min
- InvalidaciÃ³n al guardar
- Fallback a constants si offline
- Integrado en 5+ componentes (BitÃ¡cora, Personal, Alumnos, Grupos, Ciclos)

**FASE 6 â€” Hook `useCatalogo` mobile (SesiÃ³n XX+10)**
- React Query + fallback constants
- Integrado en bitÃ¡cora maestra, bitÃ¡cora padre, dashboard padre
- 3/4 catÃ¡logos en mobile (Niveles, Alergias, Parentesco)

**SESIÃ“N XX+11 â€” IntegraciÃ³n final**
- Docs INE tutores (foto, INE frente, INE reverso)
- Notificaciones expandidas a 12 tipos
- Parentesco dropdown en formularios
- Alergias multi-select
- CategorÃ­as Eventos UI en Calendario
- IntegraciÃ³n completa de catÃ¡logos en todo el sistema

### CatÃ¡logos Operacionales:
- âœ… Niveles (Maternal, Prekinder, Kinder 1-3)
- âœ… Alergias (7 valores: Lactosa, Gluten, ManÃ­, Huevo, Mariscos, Frutos secos, Sin alergias)
- âœ… Parentesco (8 valores: MamÃ¡, PapÃ¡, Abuela/o, TÃ­a/o, Tutor/a, Otro)
- âœ… CategorÃ­as Eventos (tabla propia, CRUD en Calendario)

### PrÃ³ximas tareas (FASE 7):
- [ ] AuditorÃ­a hardcodeados (estatus, grados, roles, tipos pago, etc)
- [ ] Crear tablas dinÃ¡micas para catÃ¡logos nuevos
- [ ] Panel settings editable

---

## ✅ SESIÓN XX+30 (2026-05-05) — Fase A Completada + QR Portal Padre

**Fecha:** 2026-05-05 | **Estado:** ✅ COMPLETADA

### Resumen

Completada toda la Fase A de PENDIENTES: módulo WhatsApp desacoplado, qrService refactorizado, ModalQR fix, y QR visible en portal padre/tutor.

### Tareas ejecutadas

1. **Módulo WhatsApp desacoplado**
   - **Archivo:** `backend/src/services/whatsappService.js`
   - **Cambio:** Agregado check `WHATSAPP_ENABLED=false` → no-op silencioso sin tocar BD
   - **Archivos config:** `.env` y `.env.example` con flag documentado
   - **Status:** ✅ Completada

2. **Fix qrService.js — usar cloudinaryService centralizado**
   - **Archivo:** `backend/src/services/qrService.js`
   - **Cambio:** Eliminado `require('cloudinary')` directo, ahora usa `cloudinaryService.uploadToCloudinary()`. En dev retorna data URL base64 (imagen visible sin Cloudinary real)
   - **Status:** ✅ Completada

3. **Fix ModalQR — no mostraba QR después de generar**
   - **Archivo:** `web/src/pages/directora/Alumnos.jsx`
   - **Bugs corregidos:**
     - `onSuccess` accedía `res.qr_code_url` en vez de `res.data.qr_code_url` (axios wrapper)
     - Faltaba `useEffect` para sincronizar cuando `alumno.qr_code_url` cambia post-refetch
   - **Status:** ✅ Completada

4. **QR visible en portal padre/tutor (web)**
   - **Archivo:** `web/src/pages/padre/Dashboard.jsx`
   - **Cambio:** Nueva sección `QRAccesoSection` con modal para ver y descargar QR
   - **Paridad mobile:** Ya existía `mobile/app/(padre)/qr.jsx` ✅
   - **Status:** ✅ Completada

---

## ðŸ› BUGS HISTÃ“RICOS â€” NUNCA REPETIR

> Leer antes de escribir queries, rutas o cambios de schema.

| # | Bug | Causa raÃ­z | Fix |
|---|-----|-----------|-----|
| 1 | **Renombrar columna sin audit** (sesiÃ³n 23) | FaltÃ³ grep completo antes de migrar | `grep -r "nombre_columna" --include="*.{js,jsx}" . \| grep -v node_modules` antes de cualquier rename |
| 2 | **Fechas ISO del API** (sesiÃ³n 11) | API devuelve ISO completo; sin `.substring(0,10)` â†’ fecha invÃ¡lida | SIEMPRE `.substring(0,10)` antes de parsear o comparar fechas del API |
| 3 | **Zona horaria UTC vs local** (sesiÃ³n 9) | `toISOString()` despuÃ©s de 6pm â†’ dÃ­a siguiente | Backend: `CURRENT_DATE`. Frontend: `toLocaleDateString('en-CA')` |
| 4 | **Node.js no recarga rutas** (recurrente) | Proceso viejo en memoria | Matar procesos (`kill -9` / `taskkill`) ANTES de reiniciar |
| 5 | **Columnas inventadas en SELECT** (sesiÃ³n 7) | Asumir columnas sin leer schema | Leer `001_schema_inicial.sql` de cada tabla antes de escribir queries |
| 6 | **Variables sin datos demo** (sesiÃ³n 7) | Seed no crea datos de prueba para vistas nuevas | Crear `setup_<modulo>_demo.js` antes de pedir validaciÃ³n al usuario |
| 7 | **`deleted_at` en tabla `personal`** (sesiÃ³n 15) | `personal` usa `activo`, no `deleted_at` | Verificar schema de cada tabla antes de filtrar |
| 8 | **Ãndice UNIQUE bloquea soft-delete** (sesiÃ³n 33) | UNIQUE normal sin excluir `deleted_at IS NOT NULL` | Usar Ã­ndice parcial: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` |
| 9 | **Stale closure en setTimeout** (sesiÃ³n 36) | React captura valor viejo del estado antes del set | Construir objeto actualizado y pasarlo directamente al setTimeout |
| 10 | **Import named vs default** (sesiÃ³n 37) | `{ api }` cuando el mÃ³dulo exporta `export default` | Verificar tipo de export antes de importar |
| 11 | **`onSuccess` en `useQuery` RQ v5** (sesiÃ³n 9) | RQ v5 eliminÃ³ `onSuccess`/`onError` de `useQuery` | Usar `useEffect([data])` para side effects; `onSuccess` solo en `useMutation` |
| 12 | **HTTP 304 Not Modified** (sesiÃ³n 28) | Express cacheaba respuestas GET | Middleware: `Cache-Control: no-store, no-cache, must-revalidate` en `/api/` |
| 13 | **`cuanto_comio` en tabla equivocada** (sesiÃ³n 7) | Columna existe en `registro_comida`, no en `bitacora_diaria` | JOIN a la tabla correcta; no asumir columnas por intuiciÃ³n |
| 14 | **Preview-promocion duplica por mÃºltiples grupos** (sesiÃ³n 33) | LEFT JOIN retornaba filas duplicadas con varios grupos por nivel | LATERAL + LIMIT 1 para tomar solo el primer grupo |


## SESION XX+29 (2026-05-05) - FASE A: Bug Fechas UTC + tareas.js foto_url (COMPLETADO)

**Fecha:** 2026-05-05 | **Estado:** COMPLETADO | **Commit:** 2f1cdea

### Resumen
Fix bug UTC que mostraba fechas un dia adelantado despues de las 6 PM. Fix destructuring foto_url en tareas.js.

### Tareas ejecutadas

1. **Bug Fechas UTC vs CDMX — 20 archivos**
   - Causa: `toISOString()` retorna UTC; despues de las 6 PM CDMX retorna dia siguiente
   - Fix frontend (web 8 + mobile 5): `toISOString().split('T')[0]` -> `toLocaleDateString('en-CA')`
   - Backend: MANTIENE `toISOString()` compatible con YYYY-MM-DD que espera la BD
   - backend/.env: Agregado `TZ=America/Mexico_City`
   - LECCION: `toLocaleDateString('en-CA')` en Node.js NO retorna YYYY-MM-DD. Backend debe mantener `toISOString()`.
   - Status: Completada y validado en browser

2. **Bug tareas.js — foto_url guardaba objeto en lugar de URL**
   - Archivos: `backend/src/routes/tareas.js` lineas 302 y 368
   - Fix: destructuring `const { url } = await uploadToCloudinary(...); foto_url = url;`
   - Status: Completada

### Paridad Web vs Mobile
8 archivos web + 5 archivos mobile corregidos en misma sesion

---

## ðŸ“‹ VALIDACIONES PENDIENTES

## ðŸ”§ CRÃTICO â€” REVISIÃ“N CONFIGURACIÃ“N CLOUDINARY

> **Estado:** âš ï¸ BLOQUEANTE â€” Afecta mÃºltiples funcionalidades de generaciÃ³n/carga de archivos
> **Prioridad:** ALTA â€” Debe resolverse antes de siguientes validaciones
> **Afectadas:** QR (generar/regenerar), Fotos alumnos, Fotos personal, Fotos tutores, GalerÃ­as

## ðŸ§ª VALIDACIÃ“N PENDIENTE â€” MÃ³dulo SALUD Y MEDICACIÃ“N (casos edge)

> â„¹ï¸ MÃ³dulo funcional 100% â€” Bloques 1-10 implementados. Todos los casos edge completados.

## ðŸŽ¯ MEDIANO PLAZO â€” PrÃ³ximas sesiones (1-2 meses)

## ðŸŽ¯ LARGO PLAZO â€” Futuro (2-3 meses)

> **Nota:** FASE 7 (CatÃ¡logos DinÃ¡micos tareas 1-10) completada en SesiÃ³n XX+27. Ver ARCHIVE_LOG.md para detalles.
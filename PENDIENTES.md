# PENDIENTES — Happy School App

**Última actualización:** 2026-04-27 | **Sesión actual:** 82 + XX (Insumos)
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 🟡 VALIDACIONES PENDIENTES — SESIÓN XX: SOLICITUD TOALLITAS HÚMEDAS (MAÑANA)

### Validar mañana (2026-04-28):
1. **FiltroEntrada de Sofía Reyes Mendoza**
   - [ ] Debe aparecer banner amarillo "🧻 Pendiente: llevar toallitas"
   - [ ] Presionar "✅ Las trajo hoy" → debe marcar como resuelta y desaparecer banner
   - [ ] **NOTA:** La query de solicitudes solo busca `fecha = CURRENT_DATE` — si necesita mostrar solicitudes de ayer, cambiar a `fecha <= CURRENT_DATE`

2. **Stock sin pañales**
   - [ ] Desmarcar "Trajo pañales hoy" en entrada
   - [ ] Abrir bitácora → stock debe ser "4 pañales" (saldo de ayer)
   - [ ] Registrar cambio → stock baja a "3 pañales"

---

## ✅ COMPLETADO — SESIÓN XX: INSUMOS PAÑALES (MOVER A ARCHIVE_LOG)

### Validado hoy (2026-04-27):
- ✅ Migración 037: Stock diario + Solicitudes toallitas creadas
- ✅ Backend: 5 endpoints reescritos (GET, POST, PUT /insumos)
- ✅ Asistencia: Lógica `trajo_paniales` con stock inteligente
- ✅ Bitácora: Descuento automático al registrar cambio de pañal
- ✅ FiltroEntrada: Checkbox "Trajo pañales hoy (5)" + banner toallitas pendientes
- ✅ Bitácora: Bloque morado stock con colores (verde ≥3, amarillo ≥1, rojo <1)
- ✅ Botón "🧻 Solicitar toallitas húmedas" funcional
- ✅ Sofía Reyes Mendoza: Solicitud creada + notificación WhatsApp al papá
- ✅ Stock inicial: 4 pañales (5 - 1 cambio registrado hoy)

---

## 🔴 VALIDACIONES PENDIENTES — SESIÓN 82 (CRÍTICO)

### Validar antes de continuar:
1. **Niños de extensión:**
   - Crear niño extensión (mensual) desde web → verificar en lista
   - Crear niño extensión (por_dia) → verificar pago generado en tabla `pagos` con `origen = 'extension_dia'`
   - Ver QR y descargar imagen
   - Escanear QR en mobile (cuando esté listo) → verificar registro en `registro_extension`
   - Intentar entrada antes de 14:45 → verificar aviso sin bloquear

2. **Visitantes:**
   - Registrar visitante desde Dashboard → aparece en lista
   - Foto sube a Cloudinary (verificar en tabla `visitantes.foto_url`)
   - Activar extensión día → verificar pago generado con `origen = 'visitante_extension'`
   - Registrar salida → verificar confirmación del cargo

3. **Hermanos (falta implementar UI):**
   - Vincular dos alumnos desde Alumnos.jsx (cuando esté lista UI)
   - Verificar ambos quedan con mismo `familia_id`
   - Escanear QR salida → verificar alerta "Hermanos aún en escuela"

4. **Job cron medicamentos (de Sesión 81):**
   - A las 14:00 → verificar que dispara recordatorio a miss
   - Medicamentos están marcados `recibido = true`

---

---

## 🔵 TAREAS RESTANTES — BLOQUE 2 (para Sesión 83)

### Pendiente completar:
1. **Alumnos.jsx — UI hermanos** (~30 min)
   - Modal detalle alumno con sección "Hermanos"
   - Buscar + vincular hermano → POST `/alumnos/:id/familia`
   - Desvincular → DELETE `/alumnos/:id/familia`
   - Chip "2 hermanos" en tarjeta

2. **mobile/qr-scanner.jsx — Soporte QR extensión** (~20 min)
   - Guard extendido: `HAPPYSCHOOL:EXT:` + `HAPPYSCHOOL:ALUMNO:`
   - ComponenteResultadoExtension (naranja)
   - Alert si hora < 14:45 ("Entrada temprana")
   - Banner alerta hermanos en salida

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

### 🍽️ MÓDULO COMIDA AVANZADO (Bitácora 4 tiempos)

### 🚪 SEGURIDAD — SALIDA AVANZADA
- [ ] **Detección Hermanos:** Al QR salida, alerta si hay hermanos en otros grupos.
- [ ] **Protocolo Salida Anticipada:** Formulario motivo + hora + quién retira + firma digital tutor + notificación al otro padre.
- [ ] **QR Temporal (Círculos Confianza):** Pase invitado 2 horas, padre envía por WhatsApp o Correo a tercero.

### 👨‍👩‍👧 GESTIÓN ALUMNOS AVANZADA — Bloque 2 (pendiente)
> Bloque 1 completado en Sesión 81. Ver ARCHIVE_LOG para detalle.


- [ ] **Modalidad "Solo Extensión" — Tabla `ninos_extension`:**
  - Los niños de extensión NO son alumnos de la escuela. Solo asisten 3:00-6:00 PM.
  - Crear tabla `ninos_extension` (migración `032_ninos_extension.sql`): nombre, fecha_nacimiento, foto, tutor_nombre, tutor_telefono, tutor_email, modalidad_pago ('mensual'|'por_dia'), activo.
  - Crear tabla `registro_extension` para sus entradas/salidas (separada de `registro_entrada` de alumnos).
  - Backend: rutas CRUD en `backend/src/routes/ninos_extension.js`.
  - Web: pantalla nueva en panel directora "Niños de Extensión" (no dentro de Alumnos.jsx).
  - Mobile: scanner QR para registrar entrada/salida de niños de extensión desde las 2:45 PM.

- [ ] **Niños Visitantes — Tabla `visitantes`:**
  - Niño externo que viene un día (ej: viernes de consejo técnico). No es alumno.
  - Crear tabla `visitantes` (migración `033_visitantes.sql`): nombre, fecha, foto_url, foto_public_id, grupo_visitado_id, tutor_nombre, tutor_telefono, hora_entrada, hora_salida, tiene_extension_dia (BOOLEAN), registrado_por.
  - Backend: `backend/src/routes/visitantes.js` con GET (por fecha), POST (registro), PATCH (salida / activar extensión del día). Registrar en `routes/index.js`.
  - Web: sección "Visitantes de hoy" en Dashboard — modal registro rápido con foto, badge naranja "VISITANTE", botón "Agregar extensión hoy", botón "Registrar salida".

- [ ] **Validación de Cobro Automática — Solo Extensión y Visitantes:**
  - ⚠️ Los alumnos regulares que llegan tarde = retardo (ya implementado). NO cambia.
  - Al registrar salida de visitante con `tiene_extension_dia = true` → confirmar cargo generado.
  - Al registrar entrada de niño de extensión antes de las 2:45 PM → mostrar aviso de horario (no bloquear).
  - Migración `034_pagos_origen.sql`: `ALTER TABLE pagos ADD COLUMN IF NOT EXISTS origen VARCHAR(20) DEFAULT 'manual'` — para distinguir cargos automáticos y poder condonarlos desde directora.

- [ ] **Detección Hermanos en QR salida** (ver también SEGURIDAD — SALIDA AVANZADA):
  - Al escanear QR de salida, si el alumno tiene `familia_id`, alertar "Hay hermanos en otros grupos: [nombres]".

### 💰 FINANZAS — AUTOMATIZACIÓN AVANZADA
- [ ] **Configuración Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **Segmentación Servicios:** Regulares, Solo Extensión, Estancia por Día.
- [ ] **Recargo Impuntualidad:** $125 MXN automático a las 3:06 PM (niños sin extensión). Panel Directora condonar con motivo.
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

---

## 📝 NOTA IMPORTANTE — Query de Solicitudes Toallitas

**En:** `backend/src/routes/insumos.js` (GET `/:alumnoId`)

**Query actual:**
```sql
SELECT id, fecha, created_at FROM insumos_solicitudes
WHERE alumno_id = $1 AND fecha = CURRENT_DATE AND resuelta = false
```

**Problema:** Solo busca solicitudes de HOY. Si mañana hay una solicitud de AYER no resuelta, no aparecerá.

**Fix (si es necesario):**
```sql
SELECT id, fecha, created_at FROM insumos_solicitudes
WHERE alumno_id = $1 AND resuelta = false AND fecha <= CURRENT_DATE
```

Esto mostraría solicitudes no resueltas de hoy y días anteriores.

**Decidir mañana tras validar:** ¿Necesita la query este cambio?

---

> Historial detallado de sesiones completadas → ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md)

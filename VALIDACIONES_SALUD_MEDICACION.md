# ✅ VALIDACIONES — Módulo SALUD Y MEDICACIÓN (Sesión 81)

**Última actualización:** 2026-04-27 | **Estado:** Implementado + fixes aplicados, validación en progreso (14:00 para job cron)

---

## 📋 CHECKLIST VALIDACIÓN POR BLOQUE

### BLOQUE 1 ✅ — Recepción Medicamento Web
**Archivos:** 
- `web/src/pages/maestra/Bitacora.jsx` (sección principal)
- `web/src/pages/maestra/FiltroEntrada.jsx` (alerta en modal entrada) ⭐ NUEVO

**En Bitácora.jsx:**
- [ ] Al seleccionar un alumno con entrada, aparece sección "💊 Medicamentos"
- [ ] Subtítulo "⏳ Pendientes" muestra recepciones NO administradas
  - [ ] Cada recepción: nombre + dosis + hora programada
  - [ ] Color naranja (fondo amarillo + borde naranja)
  - [ ] Botón "Administrar" funciona → PATCH `/bitacora/medicamento/recepcion/:id/administrar`
  - [ ] Recepción desaparece de "Pendientes" tras administrar
- [ ] Subtítulo "✅ Administrados" muestra medicamentos ya administrados
  - [ ] Cada medicamento: nombre + dosis + hora administración
  - [ ] Color azul (fondo azul claro + borde azul)
- [ ] Botones "💊 Administrar" y "📋 Registrar recepción"
- [ ] Formulario "Nueva recepción (traída por papá)":
  - [ ] Inputs: nombre*, dosis*, hora opcional
  - [ ] Botones fotos: receta (opt) + envase (opt)
  - [ ] Botón "💾 Guardar recepción" → POST `/bitacora/medicamento/recepcion`
  - [ ] Botón "✕" cancela y cierra form

**En FiltroEntrada.jsx (NUEVO Sesión 81):**
- [ ] Al abrir modal entrada, si alumno tiene medicamentos pendientes (sin administrar):
  - [ ] Aparece sección "💊 Medicamentos pendientes"
  - [ ] Lista mostrando: nombre + dosis + hora programada (o "Sin hora programada")
  - [ ] Color naranja claro (fondo naranja-50, borde naranja-200)
  - [ ] Solo muestra recepciones sin administrar (`administrado = false`)

---

### BLOQUE 2 ✅ — Recepción Medicamento Mobile
**Archivo:** `mobile/app/(maestra)/bitacora.jsx`

- [ ] Al seleccionar un alumno, aparece sección "💊 Medicamentos"
- [ ] Subtítulo "⏳ Pendientes" muestra recepciones con:
  - [ ] Nombre + dosis en texto oscuro
  - [ ] Hora en gris pequeño
  - [ ] Botón "Administrar" naranja funcional
- [ ] Subtítulo "✅ Administrados" muestra medicamentos ya administrados
  - [ ] Nombre + dosis en azul
  - [ ] Hora administración en azul claro
- [ ] Botón "📋 Nueva recepción" abre form
- [ ] Form con inputs: nombre*, dosis*, hora opcional
- [ ] Botón "💾 Guardar" → POST `/bitacora/medicamento/recepcion`

---

### BLOQUE 3 ✅ — Insumos Web + Mobile
**Archivo:** `web/src/pages/maestra/Bitacora.jsx` / `mobile/app/(maestra)/bitacora.jsx`

**WEB:**
- [ ] En sección "👶🏻 Cambios de pañal", antes de botones, aparece "Stock disponible"
- [ ] Lista: tipo (limpio/orina/heces/mixto/diarrea) + cantidad
- [ ] Colores dinámicos:
  - [ ] Verde (>=10)
  - [ ] Amarillo (>=5 <10)
  - [ ] Rojo (<5)
- [ ] GET `/insumos/:alumnoId` carga al abrir bitácora

**MOBILE:**
- [ ] Misma sección con colores dinámicos
- [ ] GET `/insumos/:alumnoId` se ejecuta correctamente

---

### BLOQUE 4 ✅ — Justificantes Inasistencia (Directora)
**Archivo:** `web/src/pages/directora/Asistencia.jsx`

- [ ] En vista mensual, celda con ausencia (sin fondo especial al inicio)
- [ ] Al hover sobre celda ausente:
  - [ ] Aparece botón "Justificar" en tooltip
  - [ ] Botón es clickeable
- [ ] Modal abre con:
  - [ ] Nombre del alumno + fecha
  - [ ] Textarea "Motivo de la justificación…"
  - [ ] Botones: "💾 Justificar" + "✕ Cancelar"
- [ ] Al justificar:
  - [ ] PATCH `/asistencia/:alumnoId/justificar` con motivo
  - [ ] Celda pinta azul 📋 "Justificado"
  - [ ] Motivo se almacena en BD
- [ ] Vista persiste al recargar

---

### BLOQUE 5 ✅ — Vómito Web
**Archivo:** `web/src/pages/maestra/Bitacora.jsx`

- [ ] Sección "🌡️ Salud" tiene título dinámico: "🌡️ Salud 🤢" si hay vómitos
- [ ] Lista de vómitos del día (si existen):
  - [ ] Cada vómito: hora + intensidad + notas (si existen)
  - [ ] Color naranja claro
- [ ] Botón "+ Registrar vómito" abre form
- [ ] Form con:
  - [ ] Selector intensidad (3 botones: Leve/Moderado/Fuerte)
  - [ ] Textarea notas (opcional)
  - [ ] Botón "💾 Guardar vómito"
- [ ] POST `/bitacora/vomito` → registro aparece en lista inmediatamente
- [ ] Form colapsa tras guardar

---

### BLOQUE 5B ✅ — Vómito Mobile
**Archivo:** `mobile/app/(maestra)/bitacora.jsx`

- [ ] Sección "Salud" incluye subsección "🤢 Vómitos del día" (si existen)
  - [ ] Cada vómito: hora + intensidad + notas
- [ ] Botón "🤢 + Registrar vómito" o "🤢 Cancelar" (toggle)
- [ ] Al expandir:
  - [ ] Label "Intensidad"
  - [ ] 3 botones: Leve/Moderado/Fuerte (se resaltan al seleccionar)
  - [ ] Input notas multiline
  - [ ] Botón "💾 Guardar" naranja
- [ ] POST `/bitacora/vomito` funciona
- [ ] Vómito aparece en lista tras guardar

---

### BLOQUE 6 ✅ — Diarrea Web + Mobile
**Archivo:** `web/src/pages/maestra/Bitacora.jsx` / `mobile/app/(maestra)/bitacora.jsx`

**WEB:**
- [ ] Botones de pañal incluyen "⚠️ Diarrea"
- [ ] Al hacer click en "Diarrea":
  - [ ] POST `/bitacora/panial` con `es_diarrea: true`
  - [ ] En sección Salud aparece banner rojo:
    - [ ] "⚠️ Deposición anormal registrada hoy"
    - [ ] Color fondo rojo-100, texto rojo-800, borde rojo-400
- [ ] Banner persiste al recargar si hay diarrea hoy

**MOBILE:**
- [ ] Botones de pañal incluyen "⚠️ Diarrea"
- [ ] Al hacer click:
  - [ ] POST `/bitacora/panial` con `condicion: 'diarrea'` + `es_diarrea: true`
  - [ ] Banner rojo aparece en sección Salud:
    - [ ] "⚠️ Deposición anormal registrada hoy"
    - [ ] Fondo rojo claro, texto rojo oscuro

---

### BLOQUE 7 ✅ — Salida Sanitaria Web + Mobile
**Archivo:** `web/src/pages/maestra/Bitacora.jsx` / `mobile/app/(maestra)/bitacora.jsx`

**WEB:**
- [ ] Nueva sección "🚪 Salida Sanitaria" al final (antes de botón fijo guardar)
- [ ] 3 checkboxes:
  - [ ] "🧷 Pañal limpio al salir"
  - [ ] "🎒 Pertenencias completas"
  - [ ] "💚 Estado físico normal"
- [ ] Textarea "Observaciones…"
- [ ] Checkbox "✅ Entrega conforme" (destacado en bold)
- [ ] Botón "💾 Guardar checklist" verde
- [ ] Funcionalidad:
  - [ ] GET `/asistencia/salida-sanitario/:alumnoId` precarga si existe hoy
  - [ ] POST `/asistencia/salida-sanitario` guarda valores
  - [ ] Badge verde "✅ Checklist guardado" aparece tras guardar
  - [ ] Estados persisten si se abre otro alumno y vuelves

**MOBILE:**
- [ ] Sección "🚪 Salida Sanitaria" al final (antes de Notas generales)
- [ ] 4 Switches:
  - [ ] "🧷 Pañal limpio al salir"
  - [ ] "🎒 Pertenencias completas"
  - [ ] "💚 Estado físico normal"
  - [ ] "✅ Entrega conforme"
- [ ] Input notas multiline
- [ ] Botón "💾 Guardar checklist" verde
- [ ] POST `/asistencia/salida-sanitario` funciona
- [ ] Badge verde confirma guardado

---

### BLOQUE 8 ✅ — Vista Padre Tab Salud
**Archivo:** `web/src/pages/padre/Bitacora.jsx`

- [ ] Tab "Salud" existe en bitácora padre
- [ ] Muestra:
  - [ ] Fiebre (si tuvo): "🌡 Tuvo fiebre — XX°C"
  - [ ] Malestar (si aplica): "⚕️ Descripción"
  - [ ] Medicamentos administrados: lista con nombre + dosis + hora
  - [ ] **NUEVO** Vómitos (si existen):
    - [ ] Título "🤢 Vómitos"
    - [ ] Cada vómito: hora + intensidad + notas (si existen)
    - [ ] Fondo naranja claro
  - [ ] **NUEVO** Diarrea (si existe):
    - [ ] Banner rojo: "⚠️ Deposición anormal registrada hoy"
- [ ] Empty state: "Sin registros de salud" (solo si NO hay nada)
- [ ] Datos refrescan correctamente si cambias de alumno

---

### BLOQUE 9 ✅ — Job Recordatorio Medicamentos
**Archivo:** `backend/src/jobs/medicamentosJobs.js` / `backend/src/index.js`

**Configuración del Job:**
- [ ] Archivo `medicamentosJobs.js` existe
- [ ] Función `iniciarJobMedicamentos()` exportada
- [ ] Schedule: `*/5 7-16 * * 1-5` (cada 5 min, 7:00-16:00, lun-vie)
- [ ] Timezone: `America/Mexico_City`

**Lógica:**
- [ ] Query consulta:
  - [ ] Recepciones NO administradas (`administrado = false`)
  - [ ] Hora programada en ventana ±10 min de ahora
  - [ ] Fecha actual (CURRENT_DATE)
  - [ ] Válido JOIN con alumnos y grupos
- [ ] Para cada recepción:
  - [ ] Consulta `maestra_titular_id` del grupo
  - [ ] Salta si no hay titular
  - [ ] INSERT en `notificaciones`:
    - [ ] usuario_id = maestra_titular_id
    - [ ] tipo = 'recordatorio_medicamento'
    - [ ] titulo = '💊 Medicamento pendiente'
    - [ ] mensaje = "Nombre_Alumno necesita Nombre_Medicamento a las HH:MM"
    - [ ] deep_link = "/maestra/bitacora?alumnoId=XXX"
    - [ ] leida = false

**Inicialización:**
- [ ] En `backend/src/index.js` línea 3: require medicamentosJobs
- [ ] En `backend/src/index.js` línea 8: `iniciarJobMedicamentos()` se ejecuta
- [ ] Backend inicia sin errores
- [ ] Logs muestran: "[medicamentosJob] Iniciado — cada 5 min 7:00-16:00 lun-vie"

**Test manual:**
- [ ] Crear una recepción medicamento con `hora_programada` = ahora (o ±5 min)
- [ ] Esperar a que el cron ejecute (máximo 5 min)
- [ ] Verificar que aparece notificación en BD (`SELECT * FROM notificaciones WHERE tipo = 'recordatorio_medicamento'`)
- [ ] Verificar que la notificación llega a maestra en UI

---

## 🧪 VALIDACIÓN INTEGRACIÓN CROSS-BLOCQUES

- [ ] **Pañal → Insumos:** Al registrar pañal, stock se decrementa en `insumos_movimientos`
- [ ] **Pañal (Diarrea) → Padre:** Padre ve banner diarrea en Tab Salud
- [ ] **Vómito → Padre:** Padre ve lista de vómitos en Tab Salud
- [ ] **Vómito intensidad fuerte → Notificación:** Backend env WhatsApp a papá (ver logística notificaciones)
- [ ] **Medicamento recepción → Job:** A la hora programada, maestra recibe notificación si NO administrado
- [ ] **Medicamento administración → Padre:** Padre ve medicamento en Tab Salud
- [ ] **Salida Sanitaria → Reporte:** (futuro) Data se usa en reportes de salida
- [ ] **Paridad Web ↔ Mobile:** Mismos datos se muestran en ambas plataformas

---

## 🎯 VALIDACIÓN POR ROL

### 👩‍🏫 Maestra (Web)
- [ ] Puede registrar todos los 9 bloques
- [ ] Recibe notificación medicamentos a tiempo
- [ ] Puede administrar recepciones
- [ ] Puede justificar ausencias (si es directora)
- [ ] Datos persisten al cambiar de alumno

### 📱 Maestra (Mobile)
- [ ] Puede registrar bloques 2, 5, 6, 7
- [ ] Formularios responsive
- [ ] Guardado funciona sin errores
- [ ] Datos sincronizan con web (mismo alumno)

### 👨‍👩‍👧 Padre (Web)
- [ ] Ve Tab Salud con todos los registros del día
- [ ] Ve vómitos + diarrea + medicamentos
- [ ] Tab Salud no muestra recepciones pendientes (solo administradas)
- [ ] Información es legible y clara

### 👩‍💼 Directora (Web)
- [ ] Puede justificar ausencias en vista mensual
- [ ] Modal abre correctamente
- [ ] Justificación se marca en BD
- [ ] Puede ver historial de justificaciones (pendiente: columna en tabla)

---

## ⚠️ CASOS EDGE A VALIDAR

- [ ] Alumno SIN pañal (`usa_panial = false`) → No aparecen secciones Insumos/Pañal/Diarrea/Salida
- [ ] Alumno CON pañal pero SIN insumos en stock → No se muestra "Stock disponible" (o está vacío)
- [ ] Múltiples vómitos en el día → Aparecen todos ordenados por hora
- [ ] Recepción medicamento sin hora programada → Aparece "Sin hora" en lista
- [ ] Job cron a las 3:05 PM (fuera de rango) → No ejecuta
- [ ] Job cron a las 10:00 AM sábado → No ejecuta
- [ ] Job cron a las 15:58 PM (dentro de rango) → Ejecuta correctamente
- [ ] Entrega conforme SIN checkboxes → POST aceptable (valores false)
- [ ] Cambio de fecha (pasar día) → Datos de ayer NO aparecen (aislamiento por fecha)

---

## 📊 VALIDACIÓN DE DATOS

Verifica en BD post-validación:

```sql
-- Recepciones medicamento
SELECT * FROM recepcion_medicamento WHERE alumno_id = ? AND DATE(created_at) = CURRENT_DATE;

-- Vómitos
SELECT * FROM registro_vomito WHERE alumno_id = ? AND DATE(created_at) = CURRENT_DATE;

-- Pañal con diarrea
SELECT * FROM registro_panial WHERE alumno_id = ? AND es_diarrea = true AND DATE(created_at) = CURRENT_DATE;

-- Salida sanitaria
SELECT * FROM registro_salida_sanitario WHERE alumno_id = ? AND fecha = CURRENT_DATE;

-- Notificaciones medicamentos
SELECT * FROM notificaciones WHERE tipo = 'recordatorio_medicamento' ORDER BY created_at DESC LIMIT 10;

-- Justificaciones
SELECT * FROM asistencia WHERE alumno_id = ? AND justificada = true AND DATE(fecha) > CURRENT_DATE - 7;
```

---

## 🚀 PLAN DE VALIDACIÓN

1. **Fase 1 (15 min):** Validar Bloques 1-4 (completos desde Sesión 79)
2. **Fase 2 (20 min):** Validar Bloque 5 (Vómito web + mobile)
3. **Fase 3 (15 min):** Validar Bloque 6 (Diarrea web + mobile)
4. **Fase 4 (20 min):** Validar Bloque 7 (Salida Sanitaria web + mobile)
5. **Fase 5 (10 min):** Validar Bloque 8 (Vista Padre)
6. **Fase 6 (10 min):** Validar Bloque 9 (Job backend)
7. **Fase 7 (10 min):** Validar casos edge + integraciones cross-blocques

**Tiempo total:** ~1 hora 40 min

---

## ✅ MARCADORES DE ÉXITO

- ✅ Todos los checkboxes de bloques 1-9 marcados
- ✅ Todos los casos edge validados sin errores
- ✅ BD refleja datos correctamente
- ✅ Paridad web ↔ mobile confirmada
- ✅ Roles (maestra/padre/directora) tienen acceso correcto
- ✅ Job medicamentos ejecuta sin errores cada 5 min

Tras completar esta validación: **Módulo SALUD Y MEDICACIÓN = PRODUCCIÓN READY** 🎉

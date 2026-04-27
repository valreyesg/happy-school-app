# PENDIENTES — Happy School App

**Última actualización:** 2026-04-28 | **Sesión actual:** 84
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

## 🟡 VALIDACIONES PENDIENTES — (ejecutar hoy/mañana)

### Sesión 81: Job Cron Medicamentos (validar hoy ~14:00)
- [ ] A las 14:00 → verificar que dispara recordatorio a miss
- [ ] Notificación in-app a miss debe aparecer
- [ ] BD notificaciones registro: `tipo='recordatorio_medicamento'`
- **Referencia:** ARCHIVE_LOG — Sesión 81 Parte 2 (línea 268)

### Sesión XX: Solicitud Toallitas Húmedas (validar mañana 2026-04-28)
1. **FiltroEntrada de Sofía Reyes Mendoza**
   - [ ] Debe aparecer banner amarillo "🧻 Pendiente: llevar toallitas"
   - [ ] Presionar "✅ Las trajo hoy" → debe marcar como resuelta y desaparecer banner
   - [ ] **NOTA:** La query de solicitudes solo busca `fecha = CURRENT_DATE` — si necesita mostrar solicitudes de ayer, cambiar a `fecha <= CURRENT_DATE`

2. **Stock sin pañales**
   - [ ] Desmarcar "Trajo pañales hoy" en entrada
   - [ ] Abrir bitácora → stock debe ser "4 pañales" (saldo de ayer)
   - [ ] Registrar cambio → stock baja a "3 pañales"

---

---

## 🔵 TAREAS RESTANTES — BLOQUE 2 (para próximas sesiones)

### Pendiente completar (NO en Sesión 83 — todavía):
1. **Alumnos.jsx — UI hermanos** (~30 min)
   - Modal detalle alumno con sección "Hermanos"
   - Buscar + vincular hermano → POST `/alumnos/:id/familia`
   - Desvincular → DELETE `/alumnos/:id/familia`
   - Chip "X hermanos" en tarjeta

2. **mobile/qr-scanner.jsx — Soporte QR extensión + hermanos** (~20 min)
   - Guard QR extendido: `HAPPYSCHOOL:EXT:` + `HAPPYSCHOOL:ALUMNO:`
   - ComponenteResultadoExtension (naranja/ámbar)
   - Alert si hora < 14:45 ("Entrada temprana", no bloquear)
   - Banner alerta hermanos en salida (detectar `hermanos_sin_salir`)

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

### 👨‍👩‍👧 GESTIÓN ALUMNOS AVANZADA — Bloque 2 (✅ COMPLETADO EN SESIÓN 82)
> ✅ Completado: Niños Extensión + Visitantes + Hermanos backend + Validación cobros automáticos
> ⏳ Pendiente (próximas sesiones): UI Hermanos (Alumnos.jsx) + Mobile QR extensión (qr-scanner.jsx)
> Ver ARCHIVE_LOG.md — Sesión 82 para detalles técnicos y commits

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

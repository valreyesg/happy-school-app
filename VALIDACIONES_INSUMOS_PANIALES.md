# Validación — Rediseño Insumos Pañales (Sesión XX)

**Última actualización:** 2026-04-28 | **Estado:** Backend 100% completo. Validación 2026-04-28 pendiente (Sesión 86)

## Cambios implementados

### BD (Migración 037)
✅ Nueva tabla `insumos_stock_diario` — stock diario (5 fijos) por alumno y fecha
✅ Nueva tabla `insumos_solicitudes` — solicitudes de toallitas con estado de entrega
✅ Nuevo campo `trajo_paniales` en `registro_entrada`
✅ Eliminadas filas de `toallita` y `papel` de `insumos_alumno`

### Backend
✅ `GET /insumos/:alumnoId` → devuelve `{ stock: { cantidad, no_registrado }, solicitudes_toallitas: [...] }`
✅ `POST /insumos/:alumnoId/solicitar-toallitas` → crea solicitud + envía WhatsApp al papá
✅ `PUT /insumos/solicitudes/:id/recibida` → marca como resuelta en entrada
✅ `POST /asistencia/entrada` → lógica: si `trajo_paniales=true` → stock=5; si no → trae saldo de ayer
✅ `POST /bitacora/panial` → descuenta 1 del stock diario

### Frontend — FiltroEntrada
✅ Checkbox "Trajo pañales hoy (5)" en sección Higiene (solo si `usa_panial=true`)
✅ Banner amarillo con alerta "Pendiente: llevar toallitas" si hay solicitudes pendientes
✅ Botón "✅ Las trajo hoy" para marcar solicitud como resuelta

### Frontend — Bitácora
✅ Bloque stock diario con estilo morado `bg-purple-50 border-purple-200`
✅ Colores semáforo ajustados: verde ≥3, amarillo ≥1, rojo <1 (escala de 5)
✅ Mensaje "Sin registro de entrada aún" si stock no está inicializado
✅ Bloque amarillo de alerta de solicitud de toallitas si está pendiente
✅ Botón "🧻 Solicitar toallitas al papá" — solo aparece si no hay solicitud pendiente

---

## Checklist de validación

### 1. FiltroEntrada — Sofía Reyes Mendoza
- [x] Abrir FiltroEntrada de Sofía
- [x] Confirmar que aparece checkbox "Trajo pañales hoy (5)" en Higiene
- [x] Marcar "Sí trajo" (✅)
- [x] Guardar entrada
- [x] Confirmar toast "✅ Entrada — Sofía"

### 2. Bitácora — verificar stock inicial
- [x] Abrir bitácora de Sofía después de pasar entrada
- [x] Confirmar que aparece bloque morado "Pañales hoy: 4 pañales" (amarillo, porque quedaron 4 al tener 1 cambio)
- [x] Registrar un cambio de pañal (ya había 1 cambio hoy)
- [x] Confirmar que stock baja correctamente (4 pañales mostrados)

### 3. Solicitar toallitas
- [x] En bitácora de Sofía, presionar "🧻 Solicitar toallitas húmedas"
- [x] Confirmar toast "✅ Solicitud enviada al papá"
- [x] Confirmar que aparece bloque amarillo "🧻 Solicitud de toallitas enviada al papá"
- [x] Confirmar que botón desaparece (porque ya hay solicitud pendiente)
- [x] **CONFIRMADO:** Papá recibió notificación WhatsApp

### 4. FiltroEntrada — día siguiente con solicitud pendiente
- [ ] Cambiar fecha a mañana (2026-04-28)
- [ ] Abrir FiltroEntrada de Sofía nuevamente
- [ ] Confirmar que aparece banner amarillo "🧻 Pendiente: llevar toallitas"
- [ ] Presionar "✅ Las trajo hoy"
- [ ] Confirmar toast "✅ Toallitas marcadas como recibidas"
- [ ] Confirmar que banner desaparece

### 5. Stock sin trajo pañales
- [ ] En siguiente día, desmarcar "Trajo pañales hoy" (⬜)
- [ ] Guardar entrada
- [ ] Abrir bitácora → stock debería ser "4 pañales" (el saldo del día anterior)
- [ ] Registrar cambio → stock baja a "3 pañales"

---

## Notas
- Los colores semáforo ahora usan escala de 5: verde ≥3, amarillo ≥1, rojo <1
- El stock se resetea cada día según filtro de entrada
- Toallitas ya no tienen conteo, solo solicitud con notificación al papá (WhatsApp + notificación interna)
- Papel fue eliminado completamente
- Sofía Reyes Mendoza: stock inicial = 4 pañales (insertado manualmente, porque ya tuvo 1 cambio)
- Botón dice "🧻 Solicitar toallitas húmedas" (no "al papá")

## ⚠️ Nota técnica — Query de solicitudes
**Archivo:** `backend/src/routes/insumos.js` (línea ~30)

**Query actual:**
```sql
WHERE alumno_id = $1 AND fecha = CURRENT_DATE AND resuelta = false
```

**Problema:** Solo busca solicitudes de HOY. Si mañana hay solicitud de AYER sin resolver, no aparecerá en FiltroEntrada.

**Solución (si es necesario):**
```sql
WHERE alumno_id = $1 AND resuelta = false AND fecha <= CURRENT_DATE
```

**Decidir mañana tras validar:** ¿Necesita este cambio? Validar en FiltroEntrada el 2026-04-28.

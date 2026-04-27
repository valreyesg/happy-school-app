# Validación — Rediseño Insumos Pañales (Sesión XX)

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
- [ ] Abrir FiltroEntrada de Sofía
- [ ] Confirmar que aparece checkbox "Trajo pañales hoy (5)" en Higiene
- [ ] Marcar "Sí trajo" (✅)
- [ ] Guardar entrada
- [ ] Confirmar toast "✅ Entrada — Sofía"

### 2. Bitácora — verificar stock inicial
- [ ] Abrir bitácora de Sofía después de pasar entrada
- [ ] Confirmar que aparece bloque morado "Pañales hoy: 5 pañales" (verde)
- [ ] Registrar un cambio de pañal
- [ ] Confirmar que stock baja a "4 pañales"

### 3. Solicitar toallitas
- [ ] En bitácora de Sofía, presionar "🧻 Solicitar toallitas al papá"
- [ ] Confirmar toast "✅ Solicitud enviada al papá"
- [ ] Confirmar que aparece bloque amarillo "🧻 Solicitud de toallitas enviada al papá"
- [ ] Confirmar que botón desaparece (porque ya hay solicitud pendiente)

### 4. FiltroEntrada — día siguiente con solicitud pendiente
- [ ] Cambiar fecha en sistema a mañana (o simular)
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
- Toallitas ya no tienen conteo, solo solicitud con notificación al papá
- Papel fue eliminado completamente

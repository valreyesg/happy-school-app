# Validación Sesión 63 — Notificaciones Modal + Mobile

## ✅ COMPLETADO: Código implementado

Todos los cambios de código están listos. Los servidores están corriendo:
- Backend: http://localhost:3000 ✅
- Frontend: http://localhost:5173 ✅

---

## 🔧 VALIDACIÓN MANUAL — Directora (Configuración)

### Paso 1: Entrar a Configuración
1. Abre http://localhost:5173 en el navegador
2. Ingresa como **Directora**
3. Navega a **Panel Directora** → **Configuración** (`/directora/config`)

### Paso 2: Ver sección de Notificaciones
En el formulario de Configuración, debe haber una nueva sección (abajo):
- **🔔 Notificaciones a padres**
- Descripción: *"Los tipos marcados aparecerán como ventana emergente en el portal del papá."*
- 4 checkboxes:
  - [✓] 🚨 Incidente escolar
  - [✓] 📢 Aviso extraordinario  
  - [ ] 📝 Bitácora del día lista
  - [ ] 💊 Medicamento administrado

### Paso 3: Guardar configuración
- Activa/desactiva checkboxes según gustes
- Click en botón rojo **"Guardar notif"**
- Espera confirmación ✅

**Resultado esperado:** El backend actualiza `configuracion_general.notificaciones_modal_tipos` con el array JSON.

---

## 👨‍👩‍👧 VALIDACIÓN MANUAL — Papá (Modal Urgente)

### Paso 4: Insertar notificación de prueba
Necesitas el UUID del padre. Desde la BD o desde el portal papá (ve el network tab en DevTools).

```sql
-- Ejecuta esto en Supabase/SQL (reemplaza <padre-usuario-id>):
INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
VALUES (
  '<padre-usuario-id>',
  'Incidente registrado — Ana García',
  'Ana tuvo una caída leve en el patio.',
  'incidente',
  '{"alumno_id":"xxx"}'
);
```

### Paso 5: Abre portal papá
1. En la MISMA pestaña del navegador: http://localhost:5173/padre
2. Ingresa como **Papá**
3. Ve al Dashboard

### Paso 6: Espera el modal
- El polling es cada 15 segundos
- Dentro de máx 15 segundos, debe aparecer un **modal emergente**:
  - Icono grande: 🚨
  - Borde superior: rojo
  - Título: "Incidente registrado — Ana García"
  - Cuerpo: "Ana tuvo una caída leve en el patio."
  - Botón: "Entendido"

### Paso 7: Cierra modal
- Click en "Entendido"
- El modal desaparece
- La notificación se marca como leída en la campanita
- El badge en la campanita baja en 1

**Resultado esperado:** Modal urgente apareció automáticamente y se cerró al hacer click.

---

## 📱 VALIDACIÓN MOBILE (Expo)

### Paso 8: Abre Expo
```bash
cd mobile
npm start
```

Escanea el QR en tu teléfono o abre en emulador Android/iOS.

### Paso 9: Dashboard Padre Mobile
- En el header debe verse una **campanita 🔔** arriba a la derecha
- Si hay notificaciones no leídas, muestra **badge rojo** con el número
- En el ejemplo anterior debería mostrar el badge

### Paso 10: Toca la campanita
- Se abre un bottom-sheet (modal deslizable)
- Lista todas las notificaciones
- Cada notificación muestra:
  - Icono por tipo (🚨 incidente, 📢 aviso, 📝 bitácora, 💊 medicina)
  - Título
  - Cuerpo
  - Fecha
  - Punto rojo si no leída

### Paso 11: Toca una notificación
- Si está no leída, el punto rojo desaparece
- El badge de la campanita baja en 1

**Resultado esperado:** Campanita funciona y muestra notificaciones.

---

## 🧪 VALIDACIÓN — Diferenciación por tipo

### Paso 12: Prueba que Bitácora NO dispara modal
Desde SQL:
```sql
INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
VALUES ('<padre-usuario-id>', 'Bitácora lista', 'Se guardó la bitácora.', 'bitacora_lista', '{}');
```

**Resultado esperado:**
- NO aparece modal urgente
- SÍ aparece en la campanita (campanita dice +1)

### Paso 13: Desactiva incidente en Directora, inserta otro
1. Directora va a `/directora/config`
2. Desactiva ☐ Incidente escolar
3. Guardar
4. Desde SQL:
```sql
INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
VALUES ('<padre-usuario-id>', 'Nueva caída', 'Otro incidente.', 'incidente', '{}');
```

**Resultado esperado:**
- NO aparece modal (desactivado en config)
- SÍ aparece en la campanita

---

## 📋 Checklist Final

- [ ] Sección notificaciones visible en `/directora/config`
- [ ] Guardar configuración funciona (el backend actualiza)
- [ ] Modal urgente aparece después de INSERT incidente
- [ ] Modal se cierra con "Entendido"
- [ ] Bitácora NO dispara modal (solo campanita)
- [ ] Directora puede desactivar tipos (modal no aparece)
- [ ] Campanita mobile visible en header padre
- [ ] Badge numérico en campanita mobile
- [ ] Bottom-sheet de notificaciones abre al tocar campanita
- [ ] Tap en notificación marca como leída

---

## 🐛 Si algo falla

1. **Modal no aparece:** Revisa la consola del navegador (DevTools). ¿Hay error en React?
2. **Backend no recibe PUT:** Revisa logs de backend (`/tmp/backend.log`). ¿Error de SQL?
3. **Mobile no compila:** Verifica que el import `@/src/components/NotificationBell` existe
4. **Campanita mobile no muestra badge:** ¿El query `/notificaciones/no-leidas` retorna count?

---

**Generado:** Sesión 63 — Validación lista para Valeria

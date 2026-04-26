# ✅ Validación — Sesión 71: Google Calendar

## Checklist de validación en browser

### 🌐 Web Padre (`http://localhost:5173/padre`)

#### 1. Portal Calendario
- [ ] Navegar a **Calendario** (sidebar o ruta `/padre/calendario`)
- [ ] Hacer clic en cualquier evento para abrir el modal
- [ ] Verificar que aparece el **botón azul "Añadir a Google Calendar"** encima del botón "Cerrar"
- [ ] Hacer clic en el botón → Google Calendar debe abrir en **nueva pestaña** con:
  - Título del evento pre-llenado
  - Fecha/hora correcta (validar formato)
  - Descripción con categoría e icono
  - Nota "Agregado desde Happy School 🏫"
- [ ] Cerrar Google Calendar sin guardar → Modal padre debe seguir abierto (stopPropagation funciona)

#### 2. Dashboard
- [ ] Ir a **Dashboard** (ruta `/padre`)
- [ ] Buscar sección "Próximos eventos" (próximos 3 días)
- [ ] Si hay eventos, verificar que aparece un **ícono 📅 azul** junto al `›` en cada evento
- [ ] Hacer clic en el ícono de calendario → Google Calendar debe abrir en nueva pestaña
- [ ] Hacer clic en el **título del evento** → Modal debe abrirse (no cerrar el feed)
- [ ] En el modal, verificar botón "Añadir a Google Calendar"

### 📱 Mobile (Expo Go o simulador)

#### 3. Mobile Calendario
- [ ] Abrir app en Expo Go o simulador
- [ ] Navegar a **Calendario** (tap)
- [ ] Hacer tap en un evento de la lista "Próximos eventos"
- [ ] Modal detalle debe mostrar **botón azul claro "📅 Añadir a Google Calendar"**
- [ ] Hacer tap → Browser del sistema debe abrirse con Google Calendar
- [ ] Cerrar browser → Volver a modal (no debe cerrarse)

#### 4. Mobile Dashboard
- [ ] En Dashboard, buscar sección "Próximos eventos"
- [ ] Si hay eventos, verificar que aparece **emoji 🗓️** compacto al lado del `›`
- [ ] Hacer tap en el emoji → Browser se abre con Google Calendar
- [ ] Hacer tap en el título → Modal se abre (no se cierra el dashboard)

## Casos de prueba específicos

### Evento todo el día
- Buscar evento con `es_todo_el_dia: true`
- En Google Calendar, debe aparecer como **evento de todo el día** (sin hora)
- Formato esperado en URL: `dates=YYYYMMDD/YYYYMMDD`

### Evento con hora
- Buscar evento con hora (ej: 9:00 AM — 10:00 AM)
- En Google Calendar, debe mostrar **con hora exacta**
- Formato esperado en URL: `dates=YYYYMMDDTHHmmssZ/YYYYMMDDTHHmmssZ`

### Evento con tildes y emojis
- Evento con título como "Día de las Madres" o "Fiesta 🎉"
- Verificar que Google Calendar lo recibe correctamente (no gibberish)
- El encoding automático de `URLSearchParams` debe manejar esto

### Evento sin fecha_fin
- Buscar evento donde `fecha_fin` es null
- Botón debe funcionar sin error
- En Google Calendar, fin = inicio (evento puntual o mismo día)

## URLs de prueba directa

Si no hay datos en la BD, puedes probar estas URLs de ejemplo directamente:

**Evento con hora:**
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=D%C3%ADa+de+las+Madres&dates=20260509T090000Z%2F20260509T100000Z&details=%F0%9F%8E%89+Festival%0ACelebraci%C3%B3n+especial%0A%0AAgregado+desde+Happy+School+%F0%9F%8F%AB
```

**Evento todo el día:**
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=Suspensi%C3%B3n+de+clases&dates=20260501%2F20260502&details=%E2%9B%94+Suspension%0AD%C3%ADa+feriado%0A%0AAgregado+desde+Happy+School+%F0%9F%8F%AB
```

## Notas técnicas

- **No requiere login de Google:** URL pública, abre Google Calendar del usuario autenticado en el navegador
- **stopPropagation():** Ícono del widget no dispara click del evento padre (web)
- **Linking.openURL():** Mobile abre link en browser del sistema (Chrome/Safari)
- **Encoding:** `URLSearchParams` maneja tildes, emojis, saltos de línea automáticamente

## Validación completada ✅

Una vez verificados todos los puntos, puedes:
1. Actualizar memory con feedback
2. Continuar con siguiente sub-tarea: **Eventos Enriquecidos** o **PDF Calendario**
3. Marcar en PENDIENTES

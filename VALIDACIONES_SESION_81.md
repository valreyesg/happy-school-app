# Validaciones — Sesión 81
**Fecha:** 2026-04-26 | **Estado:** Archivado (función completada, ver ARCHIVE_LOG.md Sesiones 82+)

---

## 1. Perfil de alumno → Padres / Tutores

### Editar tutor existente
- [ ] Abrir perfil de cualquier alumno que ya tenga tutor registrado
- [ ] Clic en botón **Editar** junto al tutor → se abren los campos (nombre, parentesco, teléfono, WhatsApp, email)
- [ ] Cambiar el teléfono → clic **Guardar** → el nuevo teléfono aparece en pantalla sin recargar la página
- [ ] Cerrar con **Cancelar** → los datos vuelven a los originales

### Foto del tutor
- [ ] En la tarjeta del tutor, hacer clic sobre el avatar (iniciales o foto)
- [ ] Seleccionar una imagen desde el archivo
- [ ] La foto aparece en la tarjeta del tutor

### Agregar nuevo tutor
- [ ] Clic en botón **+ Agregar** en la sección Padres / Tutores
- [ ] Llenar nombre, parentesco (texto libre: "Mamá", "Abuela tutora", etc.), teléfono → clic **Agregar tutor**
- [ ] El nuevo tutor aparece en la lista

### No-duplicidad por email
- [ ] Intentar agregar un tutor con un email que ya existe en el sistema (de otro alumno)
- [ ] El sistema debe reutilizar ese tutor sin crear un duplicado (aparece vinculado, no hay error)

---

## 2. Perfil de alumno → Hermanos

### Vincular hermanos
- [ ] En el perfil de alumno A, la sección **Hermanos** muestra "Sin hermanos vinculados"
- [ ] Clic en **+ Vincular** → aparece un buscador
- [ ] Escribir el nombre de alumno B (mínimo 2 letras) → aparecen resultados con foto y grupo
- [ ] Clic en alumno B → aparece tarjeta con su foto, nombre y grupo
- [ ] Toast de confirmación "Hermanos vinculados"

### Navegación rápida entre hermanos
- [ ] Desde el perfil de alumno A, clic en la tarjeta del hermano B → navega al perfil de B
- [ ] En el perfil de B, la sección Hermanos debe mostrar a A (el vínculo es recíproco)

### Desvincular
- [ ] En el perfil de alumno A, clic en **"Desvincular de esta familia"**
- [ ] La sección Hermanos queda vacía para A
- [ ] En el perfil de B, A ya no aparece como hermano

---

## 3. Dashboard → Panel Extensión Vespertina

> ⚠️ Para probar sin esperar a las 3:06 PM: cambiar la hora del sistema a **15:10**, recargar el dashboard, luego volver la hora a la correcta.

- [ ] A las 3:06 PM aparece automáticamente un banner morado con el texto "Vista de Extensión Activa"
- [ ] El panel muestra la hora actual y el mensaje de filtro
- [ ] Se ven **niños con extensión contratada** en tarjetas verdes (alumnos con extensión activa y sin salida registrada)
- [ ] Se ven **niños sin extensión con salida pendiente** en tarjetas naranjas con aviso "Al registrar su salida se generará cobro de estancia por día"
- [ ] La sección **"Ya salieron"** aparece colapsada con el total
- [ ] Clic en **"Ver todos"** → el banner se mantiene pero desaparece la separación por grupos (modo informativo)
- [ ] Clic en **"Modo extensión"** → vuelven los tres grupos separados
- [ ] Si no hay nadie en escuela después de las 3 PM → mensaje "Todos los niños han salido"

---

## Notas
- Si algo no funciona, revisar la consola del navegador (F12 → Console) y reportar el error exacto
- El backend debe estar corriendo en puerto 3000 antes de validar

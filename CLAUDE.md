# CLAUDE.md — Happy School App — Protocolos Obligatorios

> **Última actualización:** 2026-04-29 (Sesión XX+14)

---

## 🚨 AL INICIAR SESIÓN — OBLIGATORIO

**ANTES de cualquier otra acción**, ejecutar el protocolo de servidores:

### Paso 1 — Matar procesos viejos
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Paso 2 — Levantar backend
```bash
cd backend && node src/index.js > /tmp/backend.log 2>&1 &
sleep 4
curl -s http://localhost:3000/health
```
**Debe responder:** `{"status":"ok","app":"Happy School API","version":"1.0.0"}`

### Paso 3 — Levantar web
```bash
cd web && npm run dev > /tmp/web.log 2>&1 &
sleep 6
grep "Local:" /tmp/web.log
```
**Debe mostrar:** `Local: http://localhost:5173/`

⚠️ **Si no suben ambos → NO proceder con la tarea.**

---

## 🚨 PARIDAD WEB ↔ MOBILE — OBLIGATORIO

**Todo cambio funcional (nueva feature, bug fix, comportamiento) se implementa en WEB y MOBILE en la misma sesión.**

### Checklist de Paridad

1. **Identificar si el cambio afecta mobile:**
   - ¿Es un endpoint nuevo/modificado? → Sí, mobile lo usa
   - ¿Es una UI solo para web? → No, mobile no necesita cambio
   - ¿Es un hook o lógica compartida? → Sí, ambos la usan

2. **Grep en ambos proyectos:**
   ```bash
   # Buscar el endpoint o componente en web
   grep -r "nombreEndpoint\|nombreComponente" web/src/ --include="*.jsx" --include="*.js"
   
   # Buscar lo mismo en mobile
   grep -r "nombreEndpoint\|nombreComponente" mobile/src/ --include="*.jsx" --include="*.js"
   ```

3. **Si cambio afecta ambos:**
   - Editar web PRIMERO, validar con `/validate`
   - Editar mobile CON LOS MISMOS CAMBIOS
   - Ejecutar `/validate` en mobile también
   - Solo después: pedir validación a Valeria

4. **Si cambio solo en web (ej: UI Directora):**
   - Confirmar en comentario de código: "// Solo web, no afecta mobile"
   - Mobile ignorado en `/validate`

Ver memoria: [Sesión 74 — Paridad Web ↔ Mobile](memory/sesion_74_paridad_movil.md)

---

## 🚨 DESPUÉS DE CADA CAMBIO — EJECUTAR `/validate` OBLIGATORIO

**NUNCA** pedir validación en browser sin ejecutar `/validate` primero.

El skill `/validate` ejecuta automáticamente:

1. **Confirmar archivo editado** → Grep para verificar que el cambio quedó en el archivo
2. **Validar código sin errores** → Leer bloque completo, revisar tipos, parseFloat()
3. **Reiniciar backend si cambié routes** → curl http://localhost:3000/health
4. **⚠️ REINICIAR WEB SI CAMBIÉ ARCHIVOS WEB** → PowerShell matar procesos + npm run dev + validar puerto 5173
5. **Validar campos del API** → Curl al endpoint, confirmar campos existen
6. **Confirmar Vite sirviendo** → curl al archivo en Vite, grep del código nuevo
7. **Verificar puertos** → Backend=3000, Web=5173

### 🚨 REGLA CRÍTICA: SI EDITÉ WEB → SIEMPRE REINICIAR WEB

No es "opcional" ni "si falla". **Si toqué un archivo en web/** → reiniciar web OBLIGATORIO:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 2000
cd web && npm run dev > /tmp/web.log 2>&1 &
sleep 6
grep "Local:" /tmp/web.log  # DEBE mostrar 5173, nunca otro puerto
```

### Cuando falla `/validate`

No procedo a validación en browser. **Arreglo primero:**
- ¿Archivo no existe? → Re-editar
- ¿Backend no responde? → Reiniciar
- ¿Vite en puerto equivocado? → Matar y reiniciar
- ¿Solo en web, no en mobile? → Hacer cambio en mobile ahora

### Solo después de `/validate` ✅

Mostrar resumen visual (qué cambió, dónde, paridad web↔mobile, puertos validados).

Luego: **"Cambios validados. Valida en browser en http://localhost:5173/..."**

---

## 📝 PROTOCOLO DE CIERRE DE SESIÓN — AL FINAL

Ejecutar comando `/cierre`:
- Mover tareas completadas de `PENDIENTES.md` → `ARCHIVE_LOG.md`
- Eliminar esas secciones de `PENDIENTES.md`
- Actualizar memoria relevante
- Commit git con mensaje de sesión completada

---

## 🐛 Bugs históricos — NUNCA REPETIR

Ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md) sección "BUGS HISTÓRICOS — NUNCA REPETIR" (19 bugs documentados).

Antes de escribir queries, rutas o cambios de schema: **leer esa tabla completa.**

---

## 📚 Memoria del proyecto

Ubicación: `.claude/projects/c--Users-vreyesg-SynologyDrive-Documentos-VALERIA-APP-KINDER/memory/`

**Importante:** Cuando termines una sesión, actualizar memoria de proyectos activos y feedback.

---

## 🔗 Referencias rápidas

- **PENDIENTES.md** — Trabajo futuro (Cloudinary, QR Temporal, UX/UI)
- **ARCHIVE_LOG.md** — Historial de sesiones completadas (73-86, XX-XX+13)
- **Servidores** — [feedback_servidores.md](memory/feedback_servidores.md)
- **Test changes** — [feedback_test_changes.md](memory/feedback_test_changes.md)
- **Schema queries** — [feedback_sesion_66_schema_queries.md](memory/feedback_sesion_66_schema_queries.md)
- **Paridad web/mobile** — [sesion_74_paridad_movil.md](memory/sesion_74_paridad_movil.md)

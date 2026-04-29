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

- Grep por el endpoint o componente en ambos proyectos antes de cerrar
- No existe "lo haré después en mobile"
- Ver memoria: [Sesión 74 — Paridad Web ↔ Mobile](https://claude-web-path/memory/sesion_74_paridad_movil.md)

---

## 🚨 ANTES DE PEDIR VALIDACIÓN AL USUARIO — OBLIGATORIO

### Checklist de 6 puntos (feedback_test_changes.md)

1. **¿Es el archivo correcto?** → Verificar la ruta en `App.jsx` para confirmar qué componente renderiza la URL. No asumir el nombre del archivo.

2. **¿El código es correcto?** → Leer el bloque modificado completo. Revisar tipos de datos: números del backend llegan como strings — usar `parseFloat()` antes de operar.

3. **¿El backend fue reiniciado?** → Después de cualquier cambio en controllers/routes, matar el proceso del puerto 3000 con PowerShell y reiniciar. Verificar con `curl http://localhost:3000/health`.

4. **¿Los campos coinciden?** → Hacer curl autenticado al endpoint y confirmar que los campos que usa el frontend existen en la respuesta real.
   - Credenciales: `directora@happyschool.edu.mx` / `HappySchool2026!`
   - Token en campo: `accessToken`

5. **¿Vite tiene el archivo nuevo?** → `curl http://localhost:5173/src/pages/...jsx | grep "texto_clave"` para confirmar que el HMR actualizó el módulo.

6. **¿El puerto es 5173?** → Si Vite arrancó en otro puerto, matar todos los procesos node con PowerShell y reiniciar limpio.

### Solo después de pasar los 6 puntos

Mostrar resumen con: qué cambió, en qué archivos, cómo validar paso a paso.

Luego: **Pedir validación en browser** con instrucciones claras.

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

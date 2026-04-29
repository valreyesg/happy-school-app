# /validate — Checklist de Validación Pre-Navegador

## Descripción

Ejecuta automáticamente el checklist de 6 puntos ANTES de pedir validación en browser.
Confirma que:
1. El archivo correcto fue editado
2. El código está sintácticamente correcto
3. Backend está reiniciado y responde
4. Los campos del API coinciden con frontend
5. Vite sirviendo el archivo actualizado
6. Ports correctos (5173 para web)

## Uso

Después de cualquier cambio en web/backend/mobile, ejecuto:
```
/validate
```

## Protocolo Completo

⚠️ **REGLA CRÍTICA:** Si edité web → SIEMPRE reiniciar web. No es opcional.

### Paso 1: Confirmar archivo editado
```bash
# Si edité web:
grep -n "TEXTO_CLAVE_DEL_CAMBIO" web/src/pages/...jsx

# Si edité backend:
grep -n "TEXTO_CLAVE_DEL_CAMBIO" backend/src/routes/...js
```
**Verificación:** El texto que acabo de escribir aparece en el archivo con número de línea ✅

### Paso 2: Validar código sin errores
- Leer el bloque editado completo
- Verificar tipos de datos (strings vs numbers)
- Verificar que parseFloat() está donde corresponde
- Verificar que las referencias a campos existen

### Paso 3: Reiniciar backend si fue necesario
```bash
# Si toqué controllers/routes:
curl http://localhost:3000/health
```
**Debe responder:** `{"status":"ok",...}`

Si no responde → reiniciar backend:
```powershell
Get-Process node | Stop-Process -Force
cd backend && node src/index.js > /tmp/backend.log 2>&1 &
sleep 4
curl http://localhost:3000/health
```

### Paso 3B: Reiniciar web si fue necesario
```bash
# Si toqué archivos web (pages, components, layouts):
curl http://localhost:5173/ | grep "<!DOCTYPE"
```
**Debe responder:** HTML de página Vite

**CRÍTICO: Si cambié archivos en web/, SIEMPRE reiniciar web:**
```powershell
# Matar todos los node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Esperar 2 segundos
Start-Sleep -Milliseconds 2000

# Reiniciar web
cd web && npm run dev > /tmp/web.log 2>&1 &
sleep 6

# Confirmar que levantó en puerto 5173 (NO otro puerto)
grep "Local:" /tmp/web.log
```

**Debe mostrar:** `Local: http://localhost:5173/`

Si muestra otro puerto (ej: 5174) → hay proceso fantasma, repetir matar+reiniciar.

### Paso 4: Validar campos del API
```bash
# Endpoint que cambié:
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/endpoint | jq .

# Confirmar que los campos que usa frontend existen en respuesta
```

### Paso 5: Confirmar Vite sirviendo cambio
```bash
# Para archivo que edité:
curl http://localhost:5173/src/pages/...jsx | grep "TEXTO_CLAVE"

# Si no aparece → puerto equivocado o Vite no reloadó
```

**Si falla → web ya fue reiniciada en Paso 3B, volver a intentar curl**

### Paso 6: Verificar puertos
- Backend: puerto 3000 ✅
- Web: puerto 5173 ✅ (NO otro puerto)

## Output: Mostrar Resumen Visual

```
📋 VALIDACIÓN PRE-NAVEGADOR
═══════════════════════════════════════════

✅ Archivo editado: web/src/pages/directora/Usuarios.jsx
✅ Código sintácticamente correcto (sin errores)
✅ Backend levantado: curl http://localhost:3000/health → 200 OK
✅ Backend reiniciado: (N/A, no toqué routes)
✅ Web reiniciado: ✅ (Proceso mató + npm run dev + puerto 5173)
✅ API campos válidos: GET /padres retorna [nivel_nombre, grupo_nombre, ...]
✅ Vite sirviendo cambio: http://localhost:5173/src/pages/... → contiene nuevo código
✅ Puertos: backend=3000 ✅, web=5173 ✅

📁 Archivos modificados: 1
   - web/src/pages/directora/Usuarios.jsx (líneas 45-62)

🎯 Paridad web↔mobile:
   - Este cambio NO afecta mobile (solo UI)
   - Mobile no necesita sincronización

🌐 LISTO PARA VALIDAR EN BROWSER
Acceder a: http://localhost:5173/directora/usuarios
```

## Casos de Fallo

### ❌ Archivo no existe después de edición
```
Causa: Edit tool no escribió el archivo
Acción: Re-leer el archivo, verificar contenido, re-editar si necesario
```

### ❌ Código con errores de sintaxis
```
Causa: Paréntesis sin cerrar, comillas desapareadas, etc.
Acción: Leer línea por línea, corregir, re-editar
```

### ❌ Backend no responde
```
Causa: Proceso viejo aún en memoria del puerto 3000
Acción: PowerShell → Get-Process node | Stop-Process -Force
        Reiniciar: cd backend && node src/index.js > /tmp/backend.log 2>&1 &
```

### ❌ Vite en puerto equivocado (ej: 5174)
```
Causa: Puerto 5173 ocupado por proceso fantasma
Acción: PowerShell → Get-Process node | Stop-Process -Force
        Reiniciar web limpiamente
```

### ❌ Cambios solo en web, no en mobile
```
Causa: Olvidé sincronizar
Acción: Grep el endpoint/componente en mobile/, editar también
        Re-validar
```

## Cuando Ejecutar

- **SIEMPRE después de editar código**
- **ANTES de decirle a Valeria "valida en browser"**
- **Si algo falla**: no procedo, arreglo primero

## Resultado Final

Solo cuando TODO está ✅ puedo decir:
**"Cambios validados. Valida en browser en http://localhost:5173/..."**

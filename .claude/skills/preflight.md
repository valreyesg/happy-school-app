# /preflight — Validación Pre-Desarrollo Obligatoria

## Descripción

Ejecuta ANTES de empezar cualquier desarrollo nuevo o bug fix.
Previene:
- Inventar columnas que no existen
- Romper algo que estaba funcionando
- Olvidar sincronizar mobile
- Usar endpoints equivocados

## Uso

Cuando Valeria pida una tarea, ejecuto:
```
/preflight [descripción de tarea]
```

## Protocolo Completo

### Paso 1: Leer la tarea y identificar alcance

**¿Qué sistemas afecta?**
- [ ] Backend (routes, controllers, database)
- [ ] Web (páginas, componentes, layouts)
- [ ] Mobile (pantallas, hooks, llamadas API)
- [ ] Base de datos (nuevas columnas, tablas)

### Paso 2: Audit de schema (SI afecta BD)

Si toqué base de datos, LEER PRIMERO:
```bash
# Ver schema actual de la tabla
grep -A 20 "CREATE TABLE nombre_tabla" backend/src/database/001_schema_inicial.sql

# O si hay migraciones:
ls -la backend/migrations/ | grep -i "nombre_tabla"
```

**NUNCA inventar columnas.** Si no existe en schema:
- ❌ NO usar la columna
- ✅ Preguntar a Valeria: "¿Esta columna existe?"
- ✅ Crear migración si es necesario

### Paso 3: Audit de endpoints (SI afecta backend)

Si cambio el backend, verificar endpoints existentes:
```bash
# Listar todos los endpoints que toco
grep -n "router\.\(get\|post\|put\|delete\)" backend/src/routes/nombre_ruta.js

# Verificar parámetros y respuestas esperadas
grep -A 10 "router.get('/endpoint')" backend/src/routes/nombre_ruta.js
```

**NUNCA cambiar parámetros de endpoint sin actualizar mobile también.**

### Paso 4: Audit de componentes web (SI afecta web)

Si cambio web, verificar dependencias:
```bash
# ¿Existe el archivo?
test -f web/src/pages/ruta/Componente.jsx && echo "✅ Existe" || echo "❌ No existe"

# ¿Usa endpoint que voy a cambiar?
grep -n "GET\|POST\|PUT\|DELETE" web/src/pages/ruta/Componente.jsx

# ¿Está importado en App.jsx?
grep "Componente" web/src/App.jsx
```

### Paso 5: Audit de mobile (SIEMPRE)

**CRÍTICO:** Si el cambio es funcional (no solo UI), mobile también:

```bash
# ¿Existe el componente en mobile?
grep -r "nombreComponente" mobile/src/ --include="*.jsx" --include="*.js"

# ¿Usa el mismo endpoint?
grep -r "GET\|POST" mobile/src/ | grep "nombre_endpoint"

# Si existe en ambos → CAMBIOS EN AMBOS
# Si NO existe en mobile → solo web, comentar "// Solo web"
```

### Paso 6: Audit de regresiones (CRÍTICO)

Antes de tocar código existente, identificar quién lo usa:

```bash
# Si voy a cambiar una función
grep -r "nombreFuncion" web/src/ backend/src/ mobile/src/ --include="*.jsx" --include="*.js"

# Si voy a cambiar un endpoint
grep -r "GET /padres" web/src/ backend/src/ mobile/src/ --include="*.jsx" --include="*.js"

# Si voy a cambiar una columna BD
grep -r "nombre_columna" backend/src/ --include="*.js"
```

**Lista explícita:** "Esto usa X en 5 lugares: archivo1.jsx:45, archivo2.js:120, ..."

### Paso 7: Validación de bugs previos (NUNCA repetir)

Si es un bug fix, verificar en ARCHIVE_LOG:
```bash
# ¿Se reportó antes?
grep -i "nombre_del_bug\|descripción" ARCHIVE_LOG.md

# ¿Qué causó? ¿Cómo se arregló?
grep -A 5 -B 5 "Bug" ARCHIVE_LOG.md | grep -A 10 "causa raíz"
```

**No repetir bug viejo.** Si es un fix existente, aplicar la solución conocida.

## Output: Resumen Pre-Desarrollo

```
📋 PREFLIGHT CHECKLIST — Tarea: [descripción]
═══════════════════════════════════════════════

✅ Alcance identificado:
   - Backend: SI (cambiar endpoint GET /padres)
   - Web: SI (nueva UI para tabs)
   - Mobile: SI (usar mismo endpoint, componentes nuevos)
   - BD: NO

✅ Schema auditado (N/A - sin cambios BD)

✅ Endpoints auditados:
   - GET /padres → usado en:
     • web/src/pages/directora/Usuarios.jsx:42
     • mobile/src/pages/PadresScreen.jsx:15
   ✅ Cambio en ambos lugares

✅ Componentes web:
   - Usuarios.jsx existe ✅
   - Importado en App.jsx ✅
   - Usa GET /padres ✅

✅ Mobile sincronización:
   - PadresScreen.jsx existe ✅
   - Usa mismo GET /padres ✅
   - Necesita actualización: SI

✅ Regressions identificadas:
   - GET /padres usado en 2 lugares web + 1 mobile = 3 total
   - Cambios necesarios en 3 archivos

✅ Bugs previos:
   - ✅ Verificado en ARCHIVE_LOG
   - No es repetición de bug conocido

═══════════════════════════════════════════════
🚀 SEGURO PROCEDER CON DESARROLLO

Cambios esperados:
1. backend/src/routes/padres.js — GET /padres (línea X)
2. web/src/pages/directora/Usuarios.jsx — Consumir cambio (línea Y)
3. mobile/src/pages/PadresScreen.jsx — Consumir cambio (línea Z)

IMPORTANTE: Después de CADA cambio → ejecutar /validate
```

## Casos de BLOQUEO (No proceder)

### ❌ Columna no existe en schema
```
Error: Tarea dice "mostrar columna nombre_columna"
Verificación: No existe en schema de tabla

ACCIÓN: Preguntar a Valeria antes de proceder
- ¿Hay migración pendiente?
- ¿Se debe crear la columna?
- ¿Es otro nombre?
```

### ❌ Endpoint no existe
```
Error: Tarea dice "cambiar POST /usuarios" pero no existe

ACCIÓN: 
- Verificar ruta correcta
- ¿Es GET en lugar de POST?
- ¿Está en otro archivo de routes?
- Preguntar a Valeria
```

### ❌ Cambio solo en web, mobile necesita actualización
```
Error: Cambio funcional solo en web/src/, mobile/src/ no toca

ACCIÓN:
- Grep para confirmar mobile usa endpoint/componente
- Si SÍ: hacer cambio en mobile AHORA antes de /validate
- Si NO: comentar código "// Solo web, no afecta mobile"
```

### ❌ Regresión potencial no identificada
```
Error: Función usada en 5 lugares, identifiqué 3

ACCIÓN: Grep más profundo, buscar en:
- web/src/hooks/
- web/src/utils/
- web/src/pages/ (todas las subcarpetas)
- backend/src/utils/
- mobile/src/hooks/
```

## Cuando Ejecutar

**SIEMPRE PRIMERO** antes de cualquier desarrollo:
1. Valeria describe tarea
2. Yo ejecuto `/preflight [tarea]`
3. Si pasa ✅ → procedo con desarrollo
4. Si falla ❌ → pregunto a Valeria antes de proceder
5. Después de cada cambio → `/validate`

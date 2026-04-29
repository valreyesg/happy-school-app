# /regress — Auditoría de Regresiones (Algo se rompió)

## Descripción

Si después de `/validate` algo se rompe o no funciona como esperado, ejecuto `/regress` para:
1. Identificar qué cambié que causa el problema
2. Encontrar todas las dependencias rotas
3. Arreglarlo O revertir el cambio

## Uso

Si Valeria reporta: "cambié X y se rompió Y", ejecuto:
```
/regress [qué se rompió] [cuándo pasó]
```

## Protocolo Completo

### Paso 1: Reproducir el problema

**¿Qué exactamente falla?**
```
- ¿Error en consola? → Leer completo
- ¿Página no carga? → Qué URL, qué error
- ¿Datos no aparecen? → Dónde, qué esperaba vs qué ve
- ¿API error? → Code HTTP, respuesta
```

### Paso 2: Identificar último cambio

```bash
# Ver commits recientes
git log --oneline -10

# Ver diff del último cambio
git diff HEAD~1 HEAD

# Ver exactamente qué cambié en qué archivos
git diff HEAD~1 --name-only
```

**Aislar:** Qué archivos toqué en última sesión.

### Paso 3: Audit de cadena de dependencias

Para cada archivo que cambié, buscar todo lo que lo usa:

```bash
# Si cambié un endpoint
grep -r "nombreEndpoint" web/src/ backend/src/ mobile/src/ --include="*.jsx" --include="*.js"

# Si cambié un componente
grep -r "NombreComponente" web/src/ backend/src/ --include="*.jsx" --include="*.js"

# Si cambié una función
grep -r "nombreFuncion" web/src/ backend/src/ mobile/src/ --include="*.jsx" --include="*.js"
```

**Lista completa:** "Cambié X que se usa en: archivo1:línea1, archivo2:línea2, ..."

### Paso 4: Verificar cada dependencia

Para CADA lugar que usa lo que cambié:

```bash
# ¿Sigue siendo compatible?
cat archivo_que_usa_lo_que_cambié.jsx | grep -A 5 "nombreEndpoint\|nombreComponente"

# ¿Parámetros cambiaron?
# ¿Response structure cambió?
# ¿Props esperadas?
```

**Para CADA uno:** Verificar que es compatible.

### Paso 5: Revertir O arreglar

#### Opción A: Revertir cambio (si afecta mucho)
```bash
git revert HEAD
/validate  # Re-validar
```

#### Opción B: Arreglar todas las dependencias
```bash
# Para CADA archivo dependiente
edit archivo1.jsx  # Arreglar llamada
edit archivo2.jsx  # Arreglar parámetros
edit archivo3.jsx  # Arreglar response handling

# Después de cada fix
/validate
```

## Output: Reporte de Regresión

```
🔴 AUDITORÍA DE REGRESIÓN
═════════════════════════════════════════════

Problema: GET /padres no retorna nivel_nombre, usuarios ven error "undefined"

Último cambio:
- Commit: abc123 (hace 5 minutos)
- Cambió: backend/src/routes/padres.js líneas 45-62

Dependencias identificadas (rompe 3 lugares):
1. web/src/pages/directora/Usuarios.jsx:45
   └─ Espera: { nivel_nombre }
   └─ Obtiene: undefined ❌
   
2. mobile/src/pages/PadresScreen.jsx:12
   └─ Intenta acceder a nivel_nombre
   └─ Falla: Cannot read property 'nivel_nombre' ❌

3. web/src/hooks/useCatalogo.jsx:78
   └─ Filtra por nivel_nombre
   └─ Falla: Cannot filter undefined ❌

═════════════════════════════════════════════

Causa raíz: Cambié SELECT para no incluir nivel_nombre

Solución: 
- Opción A: Revertir commit abc123
- Opción B: Arreglar 3 archivos que lo usan

Procediendo con Opción B...

✅ Arreglado archivo 1/3
✅ Arreglado archivo 2/3
✅ Arreglado archivo 3/3

/validate en cada fix...
✅ Todos pasan

═════════════════════════════════════════════
✅ REGRESIÓN RESUELTA
```

## Casos Críticos

### ❌ Cambio que afecta múltiples sistemas

Si el cambio es complejo:
1. **Identificar todos los sitios rotos** (no solo lo obvio)
2. **Considerar revertir** si afecta >5 lugares
3. **Si arreglas:** arregla TODOS antes de `push`

### ❌ Cambio que rompe BD

Si cambié schema:
1. **Leer ARCHIVE_LOG:** ¿Se hizo migración?
2. **Verificar todas las queries** que usan esa tabla
3. Si es grave → revertir y crear migración formal

### ❌ Cambio que rompe API

Si cambié endpoint:
1. **Versionar el endpoint** (ej: GET /padres vs GET /padres/v2)
2. O **actualizar todos los clientes** (web + mobile)
3. Nunca cambiar parámetros sin actualizar clientes

## Cuando Ejecutar

- **Valeria reporta:** "Se rompió X"
- **Yo detecté:** Cambio causa problema
- **Después de /validate si algo falla**

NUNCA ignorar regresiones. Arreglar ANTES de siguiente tarea.

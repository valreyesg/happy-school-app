# /cierre — Protocolo Automático de Cierre de Sesión

## Descripción

Ejecuta el protocolo completo de cierre de sesión:
1. Identifica secciones completadas en PENDIENTES.md (marcadas con ✅)
2. Mueve cada sección a ARCHIVE_LOG.md (antes de BUGS HISTÓRICOS)
3. Elimina esas secciones de PENDIENTES.md
4. Actualiza timestamps en ambos archivos
5. Ejecuta `git commit` con mensaje de sesión completada

## Uso

```
/cierre
```

## Protocolo Detallado

### Paso 1: Leer PENDIENTES.md e identificar completadas

Buscar todas las secciones que comienzan con `## ✅` o `## 🔧 CRÍTICO` (si está completada).

### Paso 2: Mover a ARCHIVE_LOG.md

Para cada sección completada:
- Copiar el bloque completo (desde `## ✅ SESIÓN XX+YY` hasta la siguiente línea `---` o siguiente sección)
- Insertar en ARCHIVE_LOG.md ANTES de la sección `## 🐛 BUGS HISTÓRICOS — NUNCA REPETIR`
- Verificar que el formato se preserva

### Paso 3: Limpiar PENDIENTES.md

- Eliminar esa misma sección de PENDIENTES.md
- Mantener solo trabajo FUTURO en PENDIENTES.md

### Paso 4: Actualizar metadata

- En PENDIENTES.md: actualizar `**Última actualización:** 2026-XX-XX | Sesión XX+YY`
- En ARCHIVE_LOG.md: si hay cambios en cabecera, actualizar también

### Paso 5: Git commit

```bash
git add PENDIENTES.md ARCHIVE_LOG.md
git commit -m "chore: Sesión XX+YY — Cierre automático de pendientes completadas"
```

### Paso 6: Confirmar a usuario

Mostrar resumen visual:
- Qué secciones se movieron
- Qué archivos se modificaron
- Confirmación de commit exitoso

## Comportamiento esperado

✅ Todas las secciones completadas movidas a ARCHIVE_LOG
✅ PENDIENTES.md limpio, solo con trabajo futuro
✅ Timestamps actualizados
✅ Commit realizado con éxito

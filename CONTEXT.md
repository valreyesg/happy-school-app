# Happy School App — Comunidad Infantil
## Estado del Proyecto

### Última actualización: 2026-04-22 (sesión 38 COMPLETADA — 5 bugs críticos resueltos)

## ✅ SESIÓN 38 — 5 Bugs Críticos Resueltos

### Trabajo técnico completado
- ✅ **Duplicado $$** en ComidaPagos.jsx — template string corregido.
- ✅ **Orden alimentación** bitácora papá — sort canónico desayuno→colación→comida→comida_extra.
- ✅ **Configuración no carga horarios** — onSuccess deprecado eliminado, usa configData del hook.
- ✅ **Calendario filtro por rol** — subquery server-side; papá solo ve su grupo + globales.
- ✅ **Firma incidentes** — base64 guardado directo en BD, eliminada dependencia Cloudinary.

### Mejoras de proceso
- ✅ Protocolo "Inicia sesión" / "Cierra sesión" documentado en CONTEXT.md.
- ✅ Memoria actualizada: Claude siempre inicia backend + web antes de pedir validación.

### Próxima sesión (39)
- Sprint 3 historial Portal Papá: Bitácora selector ciclos + Pagos agrupados por ciclo.
- Limpieza BD: duplicados Ana García + constraint UNIQUE alumnos.

## ✅ SESIÓN 37 — Historial por Ciclo + Reorganización de Documentación

### Trabajo técnico completado
- ✅ Backend: 5 endpoints nuevos/modificados para historial por ciclo (`GET /alumnos?ciclo_id`, `GET /alumnos/:id/ciclos`, `GET /bitacora/:alumnoId/rango`, `GET /reportes/dashboard?ciclo_id`, `GET /grupos`).
- ✅ Frontend Directora: `SelectorCiclo.jsx` reutilizable, Grupos.jsx y Alumnos.jsx integradas con selector + modo solo lectura para ciclos históricos.
- ✅ BD: Restaurada a 2025-2026 activo con 18 alumnos. 2026-2027 inactivo con 10 egresados/bajas.

### Documentación reorganizada
- ✅ **PENDIENTES.md** — Reescrito: 4 sprints claros (38, 39-40, 41-42, 43+), 8 deduplicaciones, tabla de priorización. 254 líneas limpias, sin duplicados.
- ✅ **ARCHIVE_LOG.md** — Creado/reorganizado: Referencia rápida (credenciales, roles, estructura), 31 sesiones documentadas (37→7), 14 bugs históricos en tabla. 497 líneas bien estructuradas.
- ✅ **MEMORY.md** — Actualizado con referencia a sesión 37.

### Próxima sesión (38)
- Atacar 5 bugs críticos (3-4h): firma incidentes, calendario filtro rol, orden alimentación, horarios config, duplicados $$
- Sprint 3 historial Portal Papá (Pagos + Bitácora por ciclo)
- Limpieza: duplicados Ana García + constraint UNIQUE alumnos

> [!IMPORTANT]
> **INSTRUCCIONES DE SISTEMA (SYSTEM SKILLS):**
> - **Rol:** Senior Fullstack Developer (Node/React/Expo).
> - **Estilo:** Brevedad extrema. Ir directo al código o solución técnica.
> - **Higiene:** Respetar estrictamente `.claudeignore` y `SCHEMA_SHORTCUT.md`.
> - **UX Guardrail:** Validar toda interfaz contra la "Regla de los 2 clics".
>
> **PROTOCOLO DE INICIO — trigger: "Inicia sesión"**
> Cuando Valeria diga "Inicia sesión [bullets opcionales de lo que atacará hoy]", ejecutar EN ESTE ORDEN:
> 1. Leer CONTEXT.md, PENDIENTES.md y SCHEMA_SHORTCUT.md (ya hecho al leer esto)
> 2. NO leer ARCHIVE_LOG.md salvo que se pida explícitamente
> 3. Respetar `.claudeignore`
> 4. Responder: resumen de sesión anterior (1 línea) + sugerencia de qué atacar hoy ordenado por impacto/velocidad
> 5. Si Valeria incluyó bullets de lo que atacará → confirmar que tengo contexto suficiente y empezar directo
>
> **PROTOCOLO DE CIERRE — trigger: "Cierra sesión"**
> Cuando Valeria diga "Cierra sesión", ejecutar EN ESTE ORDEN sin preguntar:
> 1. PENDIENTES.md → marcar ✅ SOLO los items trabajados esta sesión (no tocar el resto)
> 2. CONTEXT.md → actualizar "Última actualización" + bloque sesión actual + "Próxima sesión"
> 3. ARCHIVE_LOG.md → insertar bloque nuevo AL INICIO del log (después del header), sin releer el archivo completo
> 4. `git add` de los 4 archivos + commit `"feat: SESIÓN XX — [resumen 1 línea]"`

---

## Escuela
- Nombre: **Happy School — Comunidad Infantil**
- Tamaño real: ~25 alumnos
- 5 grupos: Maternal, Prekinder, Kinder 1, Kinder 2, Kinder 3
- Personal: 1 directora, 1 administrativo, 4 maestras titulares, 1 maestra de inglés
- Dueña del proyecto: **Valeria** (mamá de alumnas y cliente)

## Reglas que NUNCA deben cambiar
- Todo el sistema en español
- Máximo 2 toques para acciones frecuentes
- Nunca hardcodear catálogos en el código
- Siempre leer CONTEXT.md, PENDIENTES.md y SCHEMA_SHORTCUT.md al iniciar sesión. 
- Ignora archivos históricos y NO leas ARCHIVE_LOG.md a menos que te lo pida expresamente.
- Siempre actualizar CONTEXT.md, PENDIENTES.md y SCHEMA_SHORTCUT.md al terminar sesión, marca lo hecho y mueve los detalles técnicos al ARCHIVE_LOG.md para mantener el contexto limpio.Limpia los pendientes y actualiza el log.
- Diseño infantil y colorido en todo momento
- No tomar decisiones de arquitectura sin consultar CONTEXT.md
- Nunca cambiar el stack sin autorización de Valeria

---

## Entorno de Desarrollo

### Cómo iniciar
```
# Backend (en terminal en /backend)
node src/index.js

# Web (en terminal en /web)
npm run dev

# Seed (solo si la DB está vacía o quieres restaurar datos de prueba)
node src/database/seed.js
```

### Si el seed crea duplicados
Ejecutar `fix_db.ps1` en `C:\Users\vreyesg\AppData\Local\Temp\` — limpia datos de prueba, aplica migraciones pendientes y re-inserta el seed.

---

## Problemas Conocidos
- ~~Calendario web en blanco~~ ✅ RESUELTO sesión 6 — el proceso del backend estaba desactualizado (ver nota abajo)
- IP hardcodeada en `mobile/src/services/api.js` línea 4 → cambiar a IP real

## Nota crítica de operación — Backend
**REGLA ABSOLUTA: Claude debe reiniciar el backend después de cualquier cambio en rutas o controladores.**
Node.js no recarga archivos automáticamente. Si el proceso lleva corriendo, ejecuta código viejo y las nuevas rutas no existen.

Comandos (ejecutar en secuencia desde `/backend`):
```bash
kill -9 $(ps aux | grep node | grep -v grep | awk '{print $1}') 2>/dev/null
sleep 1
node src/index.js &
sleep 3 && curl -s http://localhost:3000/health
```
Si `kill` no funciona por PID, usar: `kill -9 PID_DEL_PROCESO_HIJO` (segundo número en la fila de `ps aux`).

## ⚠️ REGLA CRÍTICA — Fechas y zona horaria
**NUNCA usar `new Date().toISOString().split('T')[0]`** para obtener la fecha de "hoy", ni en backend ni en frontend.
Razón: devuelve fecha UTC. Después de las 6pm México (UTC-6) ya es el día siguiente en UTC → asistencia y bitácora aparecen vacías o con fecha incorrecta.
- **Backend:** usar `CURRENT_DATE` de PostgreSQL, o `COALESCE($n::date, CURRENT_DATE)` cuando el parámetro es opcional.
- **Frontend:** usar `new Date().toLocaleDateString('en-CA')` → devuelve `'YYYY-MM-DD'` en hora local del navegador.

## ⚠️ REGLA CRÍTICA — Formato de fechas del API
Los campos `DATE`/`TIMESTAMP` de la DB llegan del API como ISO completo (`"2022-04-17T05:00:00.000Z"`), **no** como `"YYYY-MM-DD"`.
**NUNCA** concatenar directamente `fecha + 'T12:00:00'` → produce fecha inválida, la lógica falla silenciosamente (siempre `false`).
**SIEMPRE** extraer primero: `fecha.substring(0, 10)` antes de parsear o comparar.
Aplica en: comparadores de cumpleaños, vencimientos, rangos, cualquier campo fecha del API.

## Regla de calidad — Constraints únicos
**Pendiente revisar**: otras tablas que puedan acumular duplicados.

---

## Decisiones de Arquitectura

### Stack (FIJO — no cambiar sin autorización de Valeria)
- **Mobile:** React Native con Expo (Android e iOS)
- **Web:** React con Tailwind CSS
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT (access 15min + refresh 7 días, rotación)
- **Archivos:** Cloudinary
- **Push:** Firebase Cloud Messaging
- **WhatsApp:** Twilio (lazy init para evitar crash con credentials placeholder)
- **Calendario:** Google Calendar API (pendiente)
- **Exportación:** xlsx + pdfkit (pendiente)


### Reglas de Negocio Clave
- Horario entrada sin retardo: 7:00–8:30am (8:31+ = retardo automático)
- Máx. 3 retardos/mes → al 4to no entra ese día
- Colegiatura: pago sin recargo del 1 al 5, recargo desde día 6 ($50/día)
- Comida: pago lunes → sin pago = sin servicio el martes
- Personas autorizadas para recoger: máx. 2, foto + INE obligatorios
- Extensión de horario: $125/hora después del horario normal

## 🛠️ Protocolo de Desarrollo — LEER ANTES DE PROGRAMAR

### Antes de cualquier query SQL o endpoint:
1. Leer el schema REAL de CADA tabla en `backend/migrations/001_schema_inicial.sql`. **Nunca asumir nombres de columnas por intuición** — esto ha causado 500s repetidos.
2. Verificar columnas en las tablas de JOIN, no solo en la tabla principal.
3. Consultar `SCHEMA_SHORTCUT.md` para columnas con nombres contraintuitivos y ENUMs.

### Antes de pedir validación al usuario:
4. Verificar que existan **datos de prueba** para la vista que se acaba de construir. Si no existen, crear `setup_<modulo>_demo.js` idempotente y ejecutarlo antes de avisar.
5. Reiniciar el backend después de cualquier cambio en rutas o controladores.

### Cuando se modifica un endpoint:
6. Buscar **todos los consumidores** del endpoint (web + mobile) y verificar que el cambio no los rompa. Usar `grep` en todo el proyecto.

### Al finalizar la sesión:
7. Actualizar `CONTEXT.md`, `PENDIENTES.md`, `ARCHIVE_LOG.md` y `SCHEMA_SHORTCUT.md`.
8. Mover lo completado de PENDIENTES a ARCHIVE_LOG.
9. Respetar `.claudeignore` para no desperdiciar tokens en dependencias o archivos binarios.
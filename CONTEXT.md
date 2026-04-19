# Happy School App — Comunidad Infantil
## Estado del Proyecto

### Última actualización: 2026-04-19 (sesión 18 cerrada)
### Sesión: (1) Endpoint GET/PUT `/api/config/horarios` sobre `configuracion_general`. (2) Página Configuración directora con UI editable de horarios y reglas de negocio. (3) Monitor puntualidad en Dashboard Miss — banner dinámico con hora límite desde DB. (4) Fix timezone retardo (`toLocaleTimeString` con `America/Mexico_City`). (5) Panel horarios en Dashboard directora con enlace a Configuración. (6) Reorden Dashboard directora: Asistencia por grupo sube sobre Documentación/Retardos.
### Próxima sesión: (1) UI de registro de salida + alerta de salida anticipada vs `hora_salida_normal`, (2) salidas anticipadas en monitor dashboard Miss

> [!IMPORTANT]
> **INSTRUCCIONES DE SISTEMA (SYSTEM SKILLS):**
> - **Rol:** Senior Fullstack Developer (Node/React/Expo).
> - **Estilo:** Brevedad extrema. Ir directo al código o solución técnica.
> - **Higiene:** Respetar estrictamente `.claudeignore` y `SCHEMA_SHORTCUT.md`.
> - **Protocolo de Cierre:** Actualizar `PENDIENTES.md` y `ARCHIVE_LOG.md` tras CADA cambio.
> - **UX Guardrail:** Validar toda interfaz contra la "Regla de los 2 clics".

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
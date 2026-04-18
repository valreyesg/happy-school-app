# Happy School App — Comunidad Infantil
## Estado del Proyecto

### Última actualización: 2026-04-17 (sesión 8 cerrada)
### Sesión: Deuda técnica + identidad visual — constraints únicos, emojis, Miss/Teacher, saludos dinámicos
### Próxima sesión: validar cambios en browser, luego Galería Maestra web, Vista asistencia mensual o FASE 5

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
**Siempre reiniciar el proceso del backend** al iniciar sesión de desarrollo.
Node.js no recarga archivos automáticamente. Si el proceso lleva corriendo desde una sesión anterior, puede estar ejecutando código viejo.
Comando: matar proceso en puerto 3000 y volver a correr `node src/index.js`

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
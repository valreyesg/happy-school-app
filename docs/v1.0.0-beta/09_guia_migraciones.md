# Guía de Migraciones en Producción
## Happy School App — v1.0.0-beta

**Fecha:** 2026-05-08
**Para uso de:** Valeria (deploy en producción)

---

> Este documento explica cómo aplicar las migraciones de base de datos al desplegar en producción por primera vez, o al actualizar a una nueva versión.

---

## ¿Qué son las migraciones?

Las migraciones son archivos SQL que crean o modifican la estructura de la base de datos (tablas, columnas, índices, etc.). Deben aplicarse en orden numérico exacto.

La aplicación tiene **49 archivos de migración** ubicados en:
```
backend/migrations/
```

---

## Herramienta utilizada

La aplicación usa **`node-pg-migrate`** para gestionar las migraciones.

---

## Comandos disponibles

Todos los comandos se ejecutan desde la carpeta `backend/`:

```bash
# Aplicar todas las migraciones pendientes
npm run migrate

# Revertir la última migración aplicada
npm run migrate:down

# Cargar datos iniciales (seed)
npm run seed
```

---

## Primer deploy — base de datos vacía

Cuando configuras la base de datos en producción por primera vez:

### Paso 1 — Verificar la variable DATABASE_URL

Asegurarse de que el archivo `backend/.env` (o las variables de entorno del servidor) tiene `DATABASE_URL` apuntando a la base de datos de producción.

```bash
# Probar la conexión antes de migrar
cd backend
node -e "const { Pool } = require('pg'); const p = new Pool({connectionString: process.env.DATABASE_URL}); p.query('SELECT NOW()').then(r => console.log('Conexión OK:', r.rows[0])).catch(e => console.error('Error:', e.message));"
```

### Paso 2 — Aplicar todas las migraciones

```bash
cd backend
npm run migrate
```

El comando aplica todas las migraciones en orden (001, 002, 003... hasta 049). Deberías ver algo similar a:

```
> node-pg-migrate up
Connecting to database...
Running migration: 001_schema_inicial
Running migration: 002_unique_constraints
...
Running migration: 049_plantillas_whatsapp_faltantes
Migrations applied successfully.
```

### Paso 3 — Cargar datos iniciales (seed)

Después de migrar, cargar los datos mínimos para que la app funcione (catálogos, configuración inicial, usuario Directora):

```bash
cd backend
npm run seed
```

> **Importante:** El seed solo debe correrse una vez en una base de datos nueva. Correrlo de nuevo en una BD con datos podría causar duplicados o errores.

---

## Actualización a nueva versión

Cuando hay una actualización de la aplicación con nuevas migraciones:

1. Hacer backup de la base de datos antes (ver [Plan de Respaldo](10_plan_respaldo.md))
2. Desplegar el nuevo código
3. Ejecutar las migraciones:
   ```bash
   cd backend
   npm run migrate
   ```
4. El comando detecta automáticamente cuáles migraciones ya se aplicaron y solo ejecuta las nuevas
5. Reiniciar el servidor si es necesario

---

## Qué hacer si una migración falla

### Síntoma
El comando `npm run migrate` muestra un error y se detiene.

### Pasos de diagnóstico

1. **Leer el mensaje de error completo** — Generalmente indica qué tabla o columna causó el problema

2. **Verificar si la migración ya fue aplicada parcialmente:**
   ```sql
   -- Conectarse a la BD y verificar la tabla de migraciones
   SELECT * FROM pgmigrations ORDER BY run_on DESC LIMIT 10;
   ```

3. **Error común: tabla ya existe**
   ```
   ERROR: relation "nombre_tabla" already exists
   ```
   Significa que la migración ya fue aplicada de forma manual o hay un conflicto. Verificar si la tabla existe y si tiene la estructura correcta.

4. **Error común: columna ya existe**
   ```
   ERROR: column "nombre_columna" of relation "tabla" already exists
   ```
   La columna ya fue agregada. Si la estructura es correcta, esta migración específica puede marcarse como aplicada manualmente:
   ```sql
   INSERT INTO pgmigrations (name, run_on) VALUES ('nombre_de_la_migracion', NOW());
   ```

5. **Cualquier otro error no conocido:** Restaurar desde backup y contactar a Valeria antes de continuar.

---

## Lista de migraciones (referencia)

| # | Archivo | Qué hace |
|---|---------|----------|
| 001 | schema_inicial | Crea todas las tablas principales del sistema |
| 002-009 | unique_constraints, ciclos, grupos... | Restricciones de unicidad y ajustes menores |
| 010-019 | roles, actividades, comida... | Funcionalidades iniciales |
| 020-029 | curp, avisos, eventos... | Validaciones y módulos adicionales |
| 030-039 | salud, medicamentos, visitantes... | Módulos de salud y extensión |
| 040-049 | catálogos, pagos, fotos, WhatsApp | Catálogos administrables, pagos, multimedia |

---

## Verificar estado de las migraciones

Para ver qué migraciones ya están aplicadas:

```sql
SELECT name, run_on FROM pgmigrations ORDER BY run_on;
```

---

*Happy School App — v1.0.0-beta | Happys School — 2026*

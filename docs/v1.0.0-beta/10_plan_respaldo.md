# Plan de Respaldo de Base de Datos
## Happy School App — v1.0.0-beta

**Fecha:** 2026-05-08
**Para uso de:** Valeria (producción)

---

## ¿Por qué es importante el respaldo?

La base de datos contiene toda la información de la escuela: alumnos, padres, pagos, bitácoras, asistencias, configuraciones. Sin un respaldo reciente, un fallo en el servidor podría significar pérdida de datos irreversible.

---

## Respaldo manual (pg_dump)

### Desde el servidor de producción (Railway/Render)

```bash
# Exportar toda la base de datos a un archivo .dump
pg_dump "$DATABASE_URL" -Fc -f backup_$(date +%Y%m%d_%H%M%S).dump
```

Este comando crea un archivo `backup_YYYYMMDD_HHMMSS.dump` en el directorio actual.

**Variables explicadas:**
- `$DATABASE_URL` — La URL de conexión PostgreSQL (del `.env` de producción)
- `-Fc` — Formato custom de PostgreSQL (más eficiente, soporta restauración selectiva)
- `-f` — Nombre del archivo de salida

### Alternativa en formato SQL legible

```bash
pg_dump "$DATABASE_URL" --no-owner --no-acl > backup_$(date +%Y%m%d).sql
```

---

## Guardar el respaldo

Después de generar el archivo `.dump` o `.sql`:

1. **Descargarlo a tu computadora** — Guardar en una carpeta segura (no en el servidor)
2. **Subirlo a Google Drive** o cualquier servicio de nube personal
3. **Nombrado recomendado:** `happy_school_YYYYMMDD.dump`

---

## Frecuencia recomendada

| Período | Cuándo hacer backup |
|---------|---------------------|
| **Durante el piloto** | Cada semana (mínimo) |
| **Después del piloto** | Antes de cada actualización de la app |
| **En producción estable** | Automatizado cada 24 horas (Railway incluye esto en planes pagados) |

> **Antes de cualquier actualización de la app:** siempre hacer backup primero.

---

## Restaurar desde un backup

Si necesitas restaurar la base de datos desde un archivo de respaldo:

```bash
# Restaurar desde archivo .dump (formato custom)
pg_restore -d "$DATABASE_URL" --no-owner --clean backup_YYYYMMDD.dump

# Restaurar desde archivo .sql
psql "$DATABASE_URL" < backup_YYYYMMDD.sql
```

> **Advertencia:** La restauración sobrescribe los datos actuales. Solo usar en emergencias o al configurar un nuevo entorno.

---

## Verificar que el backup es válido

Después de hacer un backup, verificar que no está corrupto:

```bash
# Listar el contenido del backup (no restaura, solo verifica)
pg_restore --list backup_YYYYMMDD.dump | head -20
```

Si muestra una lista de tablas y objetos, el backup está bien formado.

---

## Backup automático en Railway

Railway ofrece backups automáticos en sus planes de pago:
- En el dashboard de Railway → Base de datos → Backups
- Configurar frecuencia (diaria recomendada)
- Los backups se guardan por 7 días en el plan básico

---

*Happy School App — v1.0.0-beta | Happys School — 2026*

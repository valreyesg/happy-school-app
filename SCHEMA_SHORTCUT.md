# Schema Shortcut (Referencia Rápida de DB)

## 🚨 REGLAS DE ORO DE COLUMNAS
- **Conceptos de Pago:** Usar `monto` (NO `monto_base`).
- **Pagos:** Usar `monto_base` (NO `monto`).
- **Alumnos:** NO existe columna `activo`. Filtrar siempre por `deleted_at IS NULL`.
- **Personal:** NO existe columna `puesto` ni `ciclo_id`.
- **Relación Padres:** La tabla es `alumno_padre` (NO `tutores`).
- **Asignación de maestras a grupos:** La tabla es `asignaciones_grupo` (NO `grupos_personal`).

## 🆕 COLUMNAS AÑADIDAS (sesión 8)
- `personal.genero` — VARCHAR(10), valores: `f` | `m` | `o` (default `f`)
- `padres.parentesco` — ya existía: `padre` | `madre` | `tutor` | `abuelo` | etc.
- Login y `/perfil` ya devuelven `parentesco` y `genero` en el objeto `usuario`

## 🛡️ CONSTRAINTS (UNIQUE)
- `usuarios(email)`
- `alumnos(curp)`
- `grupos(nombre, ciclo_id)`
- `conceptos_pago(nombre)`
- `categorias_evento(nombre)`
- `asignaciones_grupo(personal_id, grupo_id, ciclo_id)` ← migración 004

## ⏱️ COLUMNAS updated_at
> **Todas las tablas tienen `updated_at`** — migración 005 las estandarizó.
> Siempre incluir `updated_at = NOW()` en cualquier `ON CONFLICT DO UPDATE SET`.
> Excepción: `configuracion_general` usa PK de texto (`clave`), no UUID — verificar antes de hacer upserts.

## 🗂️ RELACIÓN ENTRE TABLAS DE BITÁCORA
La bitácora de un día es la combinación de VARIAS tablas — no está toda en una sola:
- `bitacora_diaria` → estado_animo, tarea_realizada, comportamiento, tuvo_fiebre, notas (NO tiene cuanto_comio)
- `registro_comida` → cuanto_comio, que_comio, observaciones (JOIN por alumno_id + fecha)
- `registro_banio` → pipi_count, popo_count (JOIN por alumno_id + fecha)
- `registro_panial` → cambios de pañal con hora (solo Maternal — JOIN por alumno_id + DATE(hora))
- `control_esfinteres` → fue_solo, pidio_ir, tuvo_accidente (JOIN por alumno_id + fecha)
- `medicamentos` → nombre, dosis, hora_administracion (JOIN por alumno_id + fecha)

> ⚠️ **Regla:** antes de hacer cualquier JOIN en un SELECT, verificar en qué tabla exacta vive cada columna leyendo `001_schema_inicial.sql`. Nunca asumir.

## 📋 ENUMS DISPONIBLES
- `rol_principal_tipo`: `directora | administrativo | maestra_titular | maestra_especial | maestra_puerta | padre`
- `estado_alumno_tipo`: `inscrito | reinscrito | baja | egresado | prospecto`
- `estado_pago_tipo`: `pendiente | pagado | vencido | cancelado`
- `estado_asistencia_tipo`: `presente | ausente | retardo | justificado | no_entrada`
- `nivel_comportamiento_tipo`: `muy_bien | bien | necesita_mejorar`
- `nivel_logro_tipo`: `logrado | en_proceso | por_lograr`

# Checklist de Alta de Escuela
## Happy School App — v1.0.0-beta

**Escuela piloto:** Happys School
**Fecha:** 2026-05-08
**Para uso de:** Valeria (durante capacitación con la Directora)

---

> **¿Para qué sirve este documento?**
> Este checklist te guía paso a paso para dejar la aplicación lista desde cero.
> El orden es importante: cada paso depende del anterior. Si se hacen en otro orden, el sistema puede mostrar errores.

---

## Antes de empezar

Asegúrate de tener a la mano:

- [ ] Acceso de Directora a la aplicación
- [ ] Listado del personal (nombre completo, CURP, RFC, correo, teléfono, rol)
- [ ] Listado de alumnos inscritos (nombre, fecha de nacimiento, CURP, grupo asignado)
- [ ] Datos de los padres/tutores de cada alumno (nombre, parentesco, teléfono, correo)
- [ ] Fotografías y copias de INE de las personas autorizadas a recoger alumnos
- [ ] Logotipo de la escuela (opcional, para personalización)
- [ ] Fechas exactas del ciclo escolar

---

## Paso 1 — Crear el Ciclo Escolar

**Dónde:** Menú lateral → Ciclos Escolares

Un ciclo escolar es el año lectivo (por ejemplo: 2025-2026). Todo lo demás se asocia a este ciclo, así que es lo primero que debes crear.

- [ ] Ir a **Ciclos Escolares** en el menú de la Directora
- [ ] Hacer clic en **"Nuevo ciclo"**
- [ ] Llenar los datos:
  - **Nombre:** `2025-2026` (o el año que corresponda)
  - **Fecha de inicio:** Primer día de clases
  - **Fecha de fin:** Último día del ciclo escolar
- [ ] Guardar el ciclo
- [ ] Activar el ciclo haciendo clic en el botón **"Activar"** (solo puede haber un ciclo activo a la vez)

> **Nota:** Si ya existe un ciclo de años anteriores, no lo elimines. Solo activa el nuevo.

---

## Paso 2 — Crear los Grupos (Salones)

**Dónde:** Menú lateral → Grupos

Los grupos son los salones de clase (ej: Kinder 1A, Maternal B). Cada grupo pertenece a un ciclo escolar.

Para cada salón:

- [ ] Ir a **Grupos** en el menú
- [ ] Hacer clic en **"Nuevo grupo"**
- [ ] Llenar los datos:
  - **Nombre del grupo:** Ej. `Kinder 1A`, `Maternal B`, `Prekinder`
  - **Nivel:** Seleccionar de la lista (Maternal / Prekinder / Kinder 1 / Kinder 2 / Kinder 3)
  - **Ciclo escolar:** Seleccionar el que se creó en el Paso 1
  - **Cupo máximo:** Número de alumnos que caben en el salón
  - **Color:** Color que identificará al grupo en la app (opcional)
- [ ] Guardar

Repetir para cada salón que tenga la escuela.

---

## Paso 3 — Registrar al Personal

**Dónde:** Menú lateral → Personal

El personal incluye: maestras titulares, maestras de materias especiales, maestra de puerta, y administrativos.

Para cada persona:

- [ ] Ir a **Personal** en el menú
- [ ] Hacer clic en **"Nuevo integrante"**
- [ ] Llenar los datos:
  - **Nombre completo**
  - **CURP** (obligatorio)
  - **RFC** (obligatorio)
  - **Correo electrónico** (será su usuario para entrar a la app)
  - **Teléfono**
  - **Fecha de ingreso**
  - **Rol principal:** Seleccionar el tipo de puesto:
    - `Maestra titular` — Encargada de un grupo
    - `Maestra especial` — Da materias como inglés, música
    - `Maestra de puerta` — Controla entradas y salidas
    - `Administrativo` — Acceso al portal de pagos y reportes
  - **Contraseña inicial:** Una contraseña temporal que la persona cambiará en su primer inicio de sesión
- [ ] Guardar

Repetir para todo el personal.

> **Importante:** La contraseña debe tener al menos 8 caracteres, con letras y números. Ejemplo: `HappyS2025`

---

## Paso 4 — Asignar Maestras Titulares a los Grupos

**Dónde:** Menú lateral → Grupos (o desde Personal)

Cada grupo debe tener una maestra titular asignada. Esto es necesario para que la maestra vea a sus alumnos en la app.

- [ ] Ir a **Grupos**
- [ ] Entrar al detalle de cada grupo
- [ ] Buscar la opción **"Asignar maestra titular"**
- [ ] Seleccionar la maestra del Paso 3
- [ ] Guardar

Repetir para cada grupo.

> Si una maestra da clases en varios grupos (ej: inglés en todos los kinders), se puede asignar como maestra especial en cada grupo también.

---

## Paso 5 — Registrar a los Alumnos

**Dónde:** Menú lateral → Alumnos

- [ ] Ir a **Alumnos** en el menú
- [ ] Hacer clic en **"Nuevo alumno"**
- [ ] Llenar los datos:
  - **Nombre completo**
  - **Fecha de nacimiento**
  - **CURP** (obligatorio — identifica al alumno de forma única)
  - **Grupo:** Seleccionar el grupo del Paso 2
  - **Ciclo escolar:** Seleccionar el del Paso 1
  - **Usa pañal:** Solo para nivel Maternal
  - **Alergias:** Si tiene alguna (ej: maní, lácteos)
  - **Condiciones especiales:** Si tiene alguna condición médica relevante
  - **Tipo de sangre**
  - **Médico de cabecera:** Nombre y teléfono (para emergencias)
- [ ] Guardar

Repetir para cada alumno.

---

## Paso 6 — Registrar a los Padres y Tutores

**Dónde:** Desde el perfil de cada alumno

Cada alumno puede tener hasta 2 padres/tutores registrados. Desde el perfil del alumno se añaden.

Para cada alumno:

- [ ] Ir al perfil del alumno (Alumnos → clic en el nombre)
- [ ] Buscar la sección **"Padres / Tutores"**
- [ ] Hacer clic en **"Agregar padre/tutor"**
- [ ] Llenar los datos:
  - **Nombre completo**
  - **Parentesco:** Madre / Padre / Abuelo/a / Tutor / Otro
  - **Teléfono** (obligatorio)
  - **Teléfono de WhatsApp** (puede ser el mismo o diferente)
  - **Correo electrónico**
  - **¿Es tutor principal?** — Marcar al responsable principal
- [ ] Guardar

Repetir para cada padre/tutor de cada alumno.

> **Hermanos:** Si dos alumnos son hermanos, sus padres pueden compartir el mismo correo electrónico. El sistema lo permite automáticamente.

---

## Paso 7 — Crear Cuentas de Acceso para los Padres

**Dónde:** Menú lateral → Usuarios

Después de registrar a los padres, hay que crearles una cuenta para que puedan entrar a la app.

- [ ] Ir a **Usuarios** en el menú
- [ ] Buscar al padre/tutor en la lista
- [ ] Hacer clic en **"Crear cuenta"**
- [ ] El sistema generará automáticamente un correo institucional y una contraseña temporal
- [ ] Anotar o compartir esos datos con el padre

Repetir para cada padre que necesite acceso.

> Los padres cambiarán su contraseña la primera vez que entren a la app.

---

## Paso 8 — Registrar las Personas Autorizadas para Recoger

**Dónde:** Desde el perfil de cada alumno

Las personas autorizadas son las que pueden recoger al alumno además de sus padres (ej: abuelos, tíos, vecinos de confianza). Cada alumno puede tener hasta 2 personas autorizadas.

**Para registrar una persona autorizada se necesitan obligatoriamente:**
- Fotografía del rostro
- Foto de la parte frontal de su INE
- Foto de la parte posterior de su INE

Para cada alumno:

- [ ] Ir al perfil del alumno
- [ ] Buscar la sección **"Personas autorizadas"**
- [ ] Hacer clic en **"Agregar persona autorizada"**
- [ ] Llenar los datos:
  - **Nombre completo**
  - **Parentesco** (ej: abuela, tío, vecino)
  - **Teléfono**
  - **Foto de la persona** (subir desde archivo o cámara)
  - **INE por delante** (subir desde archivo)
  - **INE por detrás** (subir desde archivo)
- [ ] Guardar

---

## Paso 9 — Configurar los Horarios de la Escuela

**Dónde:** Menú lateral → Configuración

Estos son los horarios que el sistema usa para calcular retardos, horario de salida, y extensión.

- [ ] Ir a **Configuración** en el menú
- [ ] Revisar y ajustar:
  - **Hora de inicio del filtro de entrada:** A qué hora empieza a registrarse la entrada (ej: 7:00 AM)
  - **Hora límite sin retardo:** Hasta qué hora se puede llegar sin que cuente como retardo (ej: 8:30 AM)
  - **Hora de salida normal:** A qué hora termina el horario regular (ej: 3:00 PM)
  - **Hora de salida extensión:** A qué hora termina el horario extendido (ej: 6:00 PM)
  - **Costo por hora de extensión:** Cuánto cobra la escuela por cada hora extra
  - **Máximo de retardos por mes:** A partir de cuántos retardos se bloquea la entrada al día siguiente (ej: 3)
- [ ] Guardar

---

## Paso 10 — Configurar los Catálogos (Opcional pero recomendado)

**Dónde:** Menú lateral → Catálogos

Los catálogos son las listas de opciones que aparecen en la app al registrar información del alumno: estados de ánimo, actividades del día, tipos de incidentes, medicamentos frecuentes, etc.

- [ ] Ir a **Catálogos**
- [ ] Revisar cada categoría y agregar o quitar opciones según las necesidades de la escuela
- [ ] Guardar los cambios

---

## Paso 11 — Configurar los Conceptos de Pago (Si aplica)

**Dónde:** Menú lateral → Configuración → Conceptos de pago

Si la escuela cobrará colegiatura o servicios desde la app, hay que configurar los conceptos y precios.

- [ ] Ir a la sección de configuración de pagos
- [ ] Agregar los conceptos que apliquen:
  - Colegiatura mensual (por nivel)
  - Servicio de extensión
  - Inscripción
  - Materiales
  - Otros
- [ ] Asignar precio a cada concepto
- [ ] Guardar

---

## Paso 12 — Verificación Final

Antes de dar acceso a maestras y padres, verificar que todo esté correcto:

- [ ] El ciclo escolar está activo
- [ ] Todos los grupos tienen maestra titular asignada
- [ ] Todos los alumnos tienen grupo asignado
- [ ] Todos los alumnos tienen al menos un padre/tutor registrado
- [ ] Los padres que necesitan acceso tienen cuenta creada
- [ ] Los horarios de la escuela están configurados
- [ ] Las personas autorizadas tienen sus fotos y documentos subidos

---

## Accesos por Rol — Resumen

| Rol | Plataforma | Cómo acceder |
|-----|------------|--------------|
| Directora | Solo web | `https://[url-de-la-escuela]/login` |
| Maestra | Web + App móvil | `https://[url-de-la-escuela]/login` y app Happy School |
| Padre/Tutor | Web + App móvil | `https://[url-de-la-escuela]/login` y app Happy School |
| Administrativo | Solo web | `https://[url-de-la-escuela]/login` |

---

## ¿Qué sigue después del alta?

Una vez completado este checklist, la aplicación está lista para usarse. El siguiente paso es la capacitación de cada rol:

1. Capacitar a la Directora — [Manual de Directora](03_manual_directora.md)
2. Capacitar a las Maestras — [Manual de Maestra](04_manual_maestra.md)
3. Capacitar a los Padres — [Manual de Padre](05_manual_padre.md)

---

*Happy School App — v1.0.0-beta | Happys School — 2026*

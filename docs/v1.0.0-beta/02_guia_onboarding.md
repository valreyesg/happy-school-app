# Guía de Onboarding — Configurar la Escuela desde Cero
## Happy School App — v1.0.0-beta

**Escuela piloto:** Happys School
**Fecha:** 2026-05-08
**Para uso de:** Valeria (durante capacitación con la Directora)

---

> **¿Para qué sirve esta guía?**
> Esta guía es más detallada que el checklist. Explica **por qué** se hace cada paso, qué va a ver la Directora en cada pantalla, y qué hacer si algo no sale como se esperaba.
> Úsala en paralelo con el [Checklist de Alta](01_checklist_alta_escuela.md) durante la capacitación.

---

## Cómo entrar a la aplicación

### Primera vez que entra la Directora

1. Abrir un navegador (Chrome recomendado)
2. Ir a la dirección de la aplicación
3. En la pantalla de inicio de sesión ingresar:
   - **Correo:** el correo registrado para la Directora
   - **Contraseña:** la contraseña temporal asignada
4. Al entrar por primera vez, el sistema pedirá **cambiar la contraseña**
   - La nueva contraseña debe tener mínimo 8 caracteres, con letras y números
   - Ejemplo de contraseña válida: `Happys2026` (no usar solo números ni solo letras)
5. Después del cambio de contraseña, la Directora llega a su **Dashboard principal**

### Qué ve la Directora al entrar

Al entrar, la Directora ve su panel principal con un resumen del día:
- Cuántos alumnos están en la escuela
- Alertas importantes (alumnos sin recoger, retardos, pagos pendientes)
- Acceso rápido a los módulos más usados

A la izquierda está el **menú lateral** con todas las opciones.

---

## Módulo 1 — Ciclos Escolares

### ¿Qué es un ciclo escolar en la app?

Un ciclo escolar es el período lectivo completo (normalmente un año). Funciona como el "contenedor" de todo: los grupos, los alumnos y los registros de asistencia siempre pertenecen a un ciclo específico.

### Por qué es lo primero que se configura

Sin un ciclo activo, no se pueden crear grupos, y sin grupos no se pueden inscribir alumnos. Es el punto de partida de todo.

### Cómo crear el ciclo

1. En el menú lateral, clic en **Ciclos Escolares**
2. Aparece la lista de ciclos (si es la primera vez, estará vacía)
3. Clic en el botón **"Nuevo ciclo"**
4. Llenar el formulario:
   - **Nombre:** Se recomienda el formato `2025-2026`
   - **Fecha de inicio:** Primer día oficial de clases
   - **Fecha de fin:** Último día del ciclo
5. Clic en **Guardar**
6. El ciclo aparece en la lista con un estado de "Inactivo"
7. Hacer clic en el botón **"Activar"** para marcarlo como el ciclo en curso

> **Solo puede haber un ciclo activo a la vez.** Si se activa un ciclo nuevo, el anterior se desactiva automáticamente. Los datos del ciclo anterior no se pierden.

### Para ciclos futuros

Cuando llegue el siguiente ciclo escolar, la app tiene una opción para **copiar la estructura del ciclo anterior** (grupos y maestras). Esto ahorra tiempo y evita empezar de cero cada año.

---

## Módulo 2 — Grupos

### ¿Qué es un grupo en la app?

Un grupo es un salón de clase con un nombre, un nivel educativo, y una maestra titular asignada. Los alumnos se inscriben en un grupo.

### Niveles disponibles

| Nivel en la app | Descripción |
|-----------------|-------------|
| Maternal | Bebés y niños pequeños (generalmente 1-2 años) |
| Prekinder | Preparación para kinder (3 años aprox.) |
| Kinder 1 | Primer año de kinder (3-4 años) |
| Kinder 2 | Segundo año de kinder (4-5 años) |
| Kinder 3 | Tercer año de kinder (5-6 años) |

### Cómo crear un grupo

1. En el menú lateral, clic en **Grupos**
2. Clic en **"Nuevo grupo"**
3. Llenar el formulario:
   - **Nombre del grupo:** Nombre que usará la escuela (ej: `Kinder 1A`, `Maternal Azul`)
   - **Nivel:** Seleccionar de la lista
   - **Ciclo escolar:** Seleccionar el ciclo activo
   - **Cupo máximo:** Número máximo de alumnos (el sistema avisará si se excede)
   - **Color:** Color con el que aparecerá el grupo en la app (cada grupo puede tener un color diferente para identificarlo rápidamente)
4. Clic en **Guardar**

Repetir para cada salón.

### Asignar maestra titular al grupo

La maestra titular es la responsable del grupo. Para que la maestra pueda ver a sus alumnos y registrar asistencia y bitácora, debe estar asignada como titular.

**Opción A — Desde el grupo:**
1. Entrar al detalle del grupo
2. Buscar la sección "Maestra titular"
3. Clic en "Asignar maestra"
4. Seleccionar la maestra de la lista
5. Guardar

**Opción B — Desde el perfil de la maestra (Personal → perfil → Asignar a grupo)**

> Un grupo puede tener solo una maestra titular, pero puede tener varias maestras de materias especiales asignadas.

---

## Módulo 3 — Personal

### ¿Qué tipos de personal maneja la app?

| Rol | Qué puede hacer en la app |
|-----|--------------------------|
| **Maestra titular** | Ver su grupo, registrar asistencia, escribir bitácora, asignar tareas, hacer filtro de entrada/salida, usar el escáner QR |
| **Maestra especial** | Igual que titular pero puede trabajar en varios grupos (ej: maestra de inglés) |
| **Maestra de puerta** | Solo filtro de entrada y salida, escáner QR |
| **Administrativo** | Portal de pagos, reportes, notificaciones de adeudos |

### Cómo registrar a una persona del personal

1. En el menú lateral, clic en **Personal**
2. Clic en **"Nuevo integrante"**
3. Llenar el formulario:
   - **Nombre completo:** Nombre como aparecerá en la app
   - **CURP:** 18 caracteres, sin espacios (obligatorio)
   - **RFC:** 13 caracteres (obligatorio)
   - **Correo electrónico:** Será el usuario con el que entra a la app (debe ser único)
   - **Teléfono:** Para contacto interno
   - **Fecha de ingreso:** Cuándo empezó a trabajar en la escuela
   - **Género:** Para que la app use "Miss" o el tratamiento correcto
   - **Rol principal:** El tipo de puesto (ver tabla arriba)
   - **Contraseña inicial:** Una contraseña temporal. Se recomienda una que sea fácil de recordar temporalmente, como `Happys2026`
4. Clic en **Guardar**

> La persona recibirá o le dirán su correo y contraseña. La primera vez que entre, el sistema le pedirá que cambie la contraseña.

### ¿Qué pasa si una maestra tiene dos roles?

Por ejemplo, una maestra que es titular de un grupo pero también da inglés en otros grupos. En ese caso:
- Se registra con rol `Maestra titular`
- Se le asigna como titular en su grupo
- Se le asigna como maestra especial en los demás grupos con la materia "Inglés"

---

## Módulo 4 — Alumnos

### Cómo registrar un alumno

1. En el menú lateral, clic en **Alumnos**
2. Clic en **"Nuevo alumno"**
3. Llenar el formulario:

   **Datos básicos (obligatorios):**
   - **Nombre completo**
   - **Fecha de nacimiento**
   - **CURP:** 18 caracteres (obligatorio — identifica al alumno de forma única en el sistema)
   - **Grupo:** El salón al que pertenece
   - **Ciclo escolar:** El ciclo activo

   **Datos de salud (opcionales pero recomendados):**
   - **Usa pañal:** Solo para nivel Maternal
   - **Alergias:** Si tiene alguna (ej: "Maní, polvo")
   - **Condiciones especiales:** Información médica relevante (ej: "Asma leve, usa inhalador")
   - **Tipo de sangre:** Para emergencias
   - **Médico de cabecera:** Nombre y teléfono del doctor del niño

4. Clic en **Guardar**

### Información importante sobre el CURP

- El CURP es obligatorio y único por alumno
- Si el mismo niño se reinscribe en un ciclo nuevo, el sistema lo reconocerá por su CURP y no creará duplicados
- Si no se tiene el CURP a la mano, se puede agregar después editando el perfil del alumno

### Ver el perfil completo de un alumno

Al hacer clic en el nombre de un alumno en la lista, se abre su perfil completo con:
- Datos generales y de salud
- Su código QR personal (para el filtro de entrada/salida)
- Padres/tutores vinculados
- Personas autorizadas
- Historial de pagos
- Historial de asistencia

---

## Módulo 5 — Padres y Tutores

### Diferencia entre "padre/tutor" y "cuenta de acceso"

En la app hay dos cosas separadas:
1. **El registro del padre/tutor:** Sus datos de contacto vinculados al alumno
2. **La cuenta de acceso:** El usuario y contraseña para entrar a la app

Primero se registran los datos, después se crea la cuenta.

### Cómo registrar a un padre/tutor

Desde el **perfil del alumno** (no desde el menú principal):

1. Ir a Alumnos → clic en el nombre del alumno
2. En la sección "Padres / Tutores", clic en **"Agregar padre/tutor"**
3. Llenar el formulario:
   - **Nombre completo**
   - **Parentesco:** Madre / Padre / Abuelo/a / Tutor / Tío/a / Otro
   - **Teléfono** (obligatorio — para contacto de emergencia)
   - **Teléfono de WhatsApp:** Puede ser el mismo número u otro diferente. Este número recibirá los mensajes de la escuela
   - **Correo electrónico:** Se usará para crear su cuenta de acceso
   - **¿Es tutor principal?** — Si se marca, este padre/tutor es el responsable principal. Solo uno puede ser el principal
4. Guardar

### Límites importantes

- **Máximo 2 padres/tutores por alumno**
- Si dos alumnos son hermanos, el sistema permite que los padres compartan el mismo correo

### Cómo crear la cuenta de acceso para el padre

Una vez registrado el padre/tutor, se crea su cuenta desde el menú **Usuarios**:

1. En el menú lateral, clic en **Usuarios**
2. Buscar al padre en la lista
3. Clic en **"Crear cuenta"**
4. El sistema genera automáticamente un correo institucional y una contraseña temporal
5. Anotar o compartir esos datos con el padre

> Los padres recibirán estos datos y los usarán para entrar a la app web o la app móvil. La primera vez les pedirá cambiar la contraseña.

---

## Módulo 6 — Personas Autorizadas

### ¿Qué es una persona autorizada?

Son las personas (además de los padres) que están autorizadas para recoger al alumno. Por ejemplo: abuela, tío, empleada doméstica, vecino de confianza.

Cuando una de estas personas llega a recoger al alumno, la maestra de puerta puede escanear o verificar su identidad en la app.

### Requisitos para registrar una persona autorizada

Es **obligatorio** subir tres imágenes:
1. **Fotografía del rostro** de la persona
2. **Parte frontal de su INE**
3. **Parte posterior de su INE**

Sin estas tres imágenes el registro no se puede guardar.

### Cómo registrar a una persona autorizada

Desde el **perfil del alumno**:

1. Ir al perfil del alumno
2. En la sección "Personas autorizadas", clic en **"Agregar persona autorizada"**
3. Llenar el formulario:
   - **Nombre completo**
   - **Parentesco** (ej: Abuela, Tío, Empleada doméstica)
   - **Teléfono**
4. Subir las tres imágenes obligatorias (foto, INE frente, INE reverso)
5. Guardar

> **Límite:** Máximo 2 personas autorizadas por alumno.

### ¿Qué pasa si una persona llega a recoger y no está registrada?

La maestra de puerta no puede autorizar la salida. Debe comunicarse con los padres para confirmar. Por eso es importante tener esta información completa antes del primer día de clases.

---

## Módulo 7 — Configuración General

### ¿Qué se configura aquí?

Los horarios y reglas que el sistema usa automáticamente:

| Configuración | Descripción | Valor sugerido |
|---------------|-------------|----------------|
| Inicio del filtro de entrada | A qué hora empieza a registrarse quién llega | 7:00 AM |
| Límite sin retardo | Hasta qué hora se puede llegar sin retardo | 8:30 AM |
| Hora de salida normal | Hora oficial de fin de clases | 3:00 PM |
| Hora de salida extensión | Hora máxima del servicio extendido | 6:00 PM |
| Costo por hora de extensión | Lo que cobra la escuela por cada hora extra | Según la escuela |
| Máximo de retardos por mes | A partir de cuántos retardos se bloquea la entrada al día siguiente | 3 |
| Días de pago sin recargo | Los días del mes en que se puede pagar sin penalización | Del 1 al 5 |

### Cómo cambiar la configuración

1. En el menú lateral, clic en **Configuración**
2. Modificar los valores que necesiten ajuste
3. Guardar

> **Importante:** Cambios en esta configuración afectan a todos los alumnos inmediatamente.

---

## Módulo 8 — Catálogos

### ¿Qué son los catálogos?

Son las listas de opciones que aparecen en varios formularios de la app. Por ejemplo:
- **Estados de ánimo del alumno:** Feliz, tranquilo, triste, agitado...
- **Actividades del día:** Pintura, lectura, música, patio...
- **Tipos de incidentes:** Golpe, llanto excesivo, fiebre...
- **Medicamentos frecuentes:** Paracetamol, ibuprofeno...
- **Tipos de comida:** Sopa, guisado, fruta...

### Cuándo modificar los catálogos

- Antes del primer día de clases, revisar que las opciones correspondan a las actividades reales de la escuela
- Se pueden agregar, editar o desactivar opciones en cualquier momento

### Cómo modificar un catálogo

1. En el menú lateral, clic en **Catálogos**
2. Seleccionar la categoría que se quiere modificar
3. Agregar nuevas opciones, editar las existentes, o desactivar las que no apliquen
4. Guardar

---

## Errores comunes durante el alta y cómo resolverlos

| Mensaje de error | Por qué ocurre | Cómo resolverlo |
|-----------------|----------------|-----------------|
| "El CURP ya está registrado" | Ya existe un alumno o personal con ese CURP | Verificar que el CURP sea correcto. Si es el mismo niño, no crear duplicado, buscar el registro existente |
| "El correo ya está en uso" | Ese correo ya tiene una cuenta en el sistema | Usar un correo diferente, o buscar la cuenta existente |
| "No se pudo guardar: ciclo_id requerido" | Se está intentando crear un grupo sin ciclo activo | Primero activar un ciclo escolar (Paso 1 del checklist) |
| "Las imágenes son obligatorias" | Se intentó guardar una persona autorizada sin subir las fotos | Subir las 3 imágenes requeridas (foto, INE frente, INE reverso) |
| "Máximo 2 padres por alumno" | El alumno ya tiene 2 padres registrados | Editar uno de los existentes en lugar de agregar uno nuevo |
| "Máximo 2 personas autorizadas" | El alumno ya tiene 2 personas autorizadas registradas | Editar o reemplazar una de las existentes |
| La app muestra el grupo vacío | La maestra no está asignada al grupo | Asignar la maestra titular al grupo (Paso 4 del checklist) |

---

## Preguntas frecuentes del onboarding

**¿Se pueden importar alumnos desde Excel?**
Actualmente no hay importación masiva. Cada alumno se registra individualmente desde la app.

**¿Qué pasa con los datos del ciclo anterior?**
Se conservan. Al crear un nuevo ciclo, los datos anteriores siguen disponibles en el histórico.

**¿Los padres pueden cambiar su propia contraseña?**
Sí, desde la sección "Mi perfil" dentro de la app web o móvil.

**¿Se puede cambiar el correo de un padre después de creada la cuenta?**
Sí, desde el menú Usuarios, buscando el usuario y editando sus datos.

**¿Qué pasa si un alumno cambia de grupo durante el año?**
Se puede editar el perfil del alumno y cambiar el grupo asignado. El historial anterior se conserva.

**¿Cuánto tiempo tarda el alta completa de una escuela?**
Depende del número de alumnos. Para una escuela pequeña (50-80 alumnos) el registro completo puede tomar entre 2 y 4 horas de trabajo continuo.

---

## Checklist rápido de verificación post-alta

Antes de dar por terminada la configuración, verificar:

- [ ] Hay un ciclo escolar activo
- [ ] Cada grupo tiene maestra titular asignada
- [ ] Todos los alumnos tienen CURP registrado
- [ ] Todos los alumnos tienen al menos un padre/tutor con teléfono
- [ ] Los padres que necesitan acceso tienen cuenta creada y se les compartieron sus datos
- [ ] Los horarios del filtro de entrada/salida están configurados correctamente
- [ ] Los catálogos reflejan las actividades reales de la escuela

---

*Happy School App — v1.0.0-beta | Happys School — 2026*

# Manual de Usuario — Administrador
## Happy School App — v1.0.0-beta

**Escuela piloto:** Happys School
**Fecha:** 2026-05-08
**Plataforma:** Portal web (solo computadora o tablet en navegador)

---

> **¿Para quién es este manual?**
> Para el personal con rol **Administrador** en la aplicación Happy School. Este rol está especializado en el manejo de pagos, cobranza, y comunicación con padres sobre adeudos.

---

## Cómo entrar a la aplicación

1. Abrir **Chrome** en la computadora
2. Ir a la dirección de la aplicación
3. Ingresar tu correo y contraseña
4. Hacer clic en **"Iniciar sesión"**

### Primera vez que entras

La primera vez el sistema te pedirá cambiar tu contraseña:
- Mínimo 8 caracteres
- Letras y números

---

## ¿Qué puede hacer el Administrador?

El rol de Administrador tiene acceso a la parte **financiera y de pagos** de la escuela:

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Resumen financiero del mes |
| **Pagos** | Registrar pagos, ver historial, gestionar adeudos |
| **Notificaciones** | Enviar alertas de pago a padres |
| **Pagos de comida** | Gestionar el cobro del servicio de comida |
| **Reportes** | Reportes financieros (próximamente) |

> El Administrador **no tiene acceso** a la información académica (alumnos, grupos, asistencia, bitácoras). Solo ve la parte de pagos y cobranza.

---

## Pantalla principal — Dashboard Financiero

Al entrar, verás el **resumen financiero del mes**.

### Tarjetas de resumen (parte superior)

| Tarjeta | Qué muestra |
|---------|-------------|
| **Recaudado** | Total cobrado en el mes y número de pagos registrados |
| **Por cobrar** | Total pendiente de cobrar y número de cargos pendientes |
| **Vencido** | Total en adeudo cuyo plazo ya pasó |
| **Recargos cobrados** | Total de recargos por pagos tardíos |

### Barra de cobranza

Una barra horizontal con tres colores muestra visualmente el estado del mes:
- 🟢 Verde: Porcentaje pagado
- 🟡 Amarillo: Porcentaje pendiente
- 🔴 Rojo: Porcentaje vencido

### Desglose por concepto

Tabla que muestra, para cada tipo de cobro (colegiatura, inscripción, comida, etc.):
- Cuántos alumnos pagaron
- Cuántos están pendientes
- Cuántos están vencidos
- El total recaudado

### Cobranza por grupo

Tarjetas por grupo con:
- Nombre del grupo y número de alumnos
- Barra de progreso de pago del grupo (qué porcentaje pagó)
- Conteo de pagados / pendientes / vencidos

### Alumnos con adeudos vencidos

Lista de los alumnos con más tiempo de adeudo:
- Foto, nombre, y grupo del alumno
- Días de adeudo
- Monto total que debe
- Hacer clic en un alumno lleva directamente a su historial de pagos

### Navegar entre meses

Usar los botones **← →** en la parte superior para ver el resumen de meses anteriores.

---

## Módulo: Pagos

**Acceso:** Menú lateral → Pagos

Centro de administración de todos los cobros.

### Registrar un pago

Cuando un padre realiza un pago (en efectivo o transferencia):

1. Hacer clic en **"Registrar pago"**
2. Seleccionar el alumno (puedes buscar por nombre)
3. Seleccionar el concepto de pago (colegiatura, inscripción, etc.)
4. Ingresar el monto
5. Seleccionar la fecha de pago
6. Seleccionar el método: **Efectivo** o **Transferencia**
7. Si aplica recargo por pago tardío, el sistema lo calcula automáticamente
8. Hacer clic en **"Guardar"**

### Ver la lista de pagos

- Filtrar por mes, grupo, o alumno específico
- Ver el estado de cada pago: Pagado / Pendiente / Vencido / En revisión
- Exportar la lista a **Excel**

### Generar cargos del mes

Al inicio de cada mes, hay que generar los cargos automáticos para todos los alumnos:

1. Hacer clic en **"Generar mes"**
2. Seleccionar el mes y el ciclo
3. Confirmar

El sistema crea automáticamente los cargos de colegiatura para cada alumno según su nivel y las tarifas configuradas.

### Validar comprobantes de transferencia

Los padres pueden subir fotos de sus comprobantes desde la app. Para validarlos:

1. Ir a la sección **"Por confirmar"** o buscar pagos con estado "En revisión"
2. Hacer clic en el pago para ver el comprobante
3. Revisar la imagen
4. Hacer clic en **"Validar"** si es correcto, o **"Rechazar"** si no lo es
   - Si se rechaza, escribir el motivo (el padre lo verá en su app)

### Descargar recibo de pago

Desde el detalle de cualquier pago registrado, puedes descargar el recibo en PDF para entregarlo al padre.

---

## Módulo: Notificaciones de Pago

**Acceso:** Menú lateral → Notificaciones

Aquí puedes enviar **alertas de pago** a los padres con adeudos pendientes.

### Qué ves en esta pantalla

- Lista de alumnos que tienen pagos pendientes o vencidos
- Para cada alumno: monto adeudado, días de adeudo, y quiénes son sus padres
- Indicador si ya se les envió una alerta hoy y si la leyeron

### Estadísticas rápidas (parte superior)

- Total de familias con adeudos
- Cuántas familias aún no han recibido alerta hoy
- Cuántas alertas ya fueron leídas hoy

### Enviar alerta individual

Para enviar un recordatorio a una familia específica:

1. Buscar al alumno en la lista
2. Hacer clic en el botón **"Enviar alerta"** junto al nombre
3. Se abre un mensaje pre-llenado con los datos del adeudo — puedes editarlo
4. Hacer clic en **"Enviar"**

El padre recibirá la notificación en su app móvil y/o por WhatsApp (si está activo).

### Enviar alertas masivas

Para enviar a todos los que aún no han recibido alerta hoy:

1. Hacer clic en **"Alertar a todos"** (muestra el número de destinatarios)
2. El sistema envía automáticamente un mensaje personalizado a cada familia

### Filtrar la lista

Puedes filtrar para ver:
- **Todos** — Todos los que deben
- **Sin alertar** — Los que no han recibido aviso hoy
- **Alertados hoy** — Los que ya recibieron aviso hoy

---

## Módulo: Pagos de Comida

**Acceso:** Menú lateral → Comida Pagos (o desde el menú principal)

Gestión específica del servicio de comida semanal.

### Qué puedes hacer

- Ver quién confirmó el servicio de comida de la semana
- Registrar el pago recibido (efectivo del lunes o transferencia)
- Verificar comprobantes de transferencia
- Ver totales por método de pago (efectivo vs transferencia)

### Navegar entre semanas

Usar los botones **← Anterior** y **Siguiente →** para cambiar de semana.

### Verificar un pago de comida

1. Buscar al alumno en la lista de la semana
2. Si pagó, cambiar el estado a **"Pagado"**
3. Si no pagó, dejarlo en estado sin verificar

---

## Módulo: Reportes

**Acceso:** Menú lateral → Reportes

> Esta funcionalidad estará disponible en una próxima actualización de la aplicación.

---

## Diferencias con el rol de Directora

| Función | Administrador | Directora |
|---------|:---:|:---:|
| Dashboard financiero | ✅ | ✅ (diferente) |
| Gestión de pagos | ✅ | ✅ |
| Alertas de pago | ✅ | ✅ |
| Gestión de alumnos | ❌ | ✅ |
| Gestión de grupos | ❌ | ✅ |
| Gestión de personal | ❌ | ✅ |
| Asistencia y bitácoras | ❌ | ✅ |
| Configuración del sistema | ❌ | ✅ |
| Calendario y avisos | ❌ | ✅ |

---

## Preguntas frecuentes

**¿Puedo registrar pagos de cualquier alumno, no solo de un grupo específico?**
Sí. El Administrador tiene acceso a los pagos de todos los alumnos de la escuela.

**¿Puedo ver el nombre y datos personales de los alumnos?**
Solo el nombre, grupo, y datos relacionados a pagos. No tienes acceso a la bitácora, historial médico, ni información académica.

**¿Qué pasa si registro un pago con el monto equivocado?**
Puedes editar el pago desde la lista mientras no haya sido confirmado. Si ya fue confirmado, contactar a la Directora.

**¿Los padres reciben confirmación cuando registro su pago?**
Sí, el padre ve en su app que el pago pasó a estado "Pagado" y puede descargar el recibo.

**¿Puedo generar los cargos del mes sin que la Directora lo autorice?**
Sí, el Administrador tiene permiso para generar los cargos mensuales.

---

*Happy School App — v1.0.0-beta | Happys School — 2026*

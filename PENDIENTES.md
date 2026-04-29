# PENDIENTES — Happy School App

**Última actualización:** 2026-04-29 | **Sesión XX+13:** ✅ COMPLETADA | **Próximos pendientes:** Resolver Cloudinary + QR Temporal + UX/UI Audit
⚠️ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquí)

---

> ⏳ **Historial detallado de sesiones completadas → ver [ARCHIVE_LOG.md](ARCHIVE_LOG.md)**
> Sesiones completadas: Sesión 7, 73-86, XX, XX+1, XX+2, XX+3, XX+4, XX+5, XX+6, XX+7, XX+8, XX+9, XX+10, XX+11, XX+12, XX+13 (todas archivadas, este archivo solo tiene PENDIENTES FUTUROS)

---

## ✅ SESIÓN XX+13 — USUARIOS PADRES + CAMBIO CONTRASEÑA (2026-04-29)

### Bloques Implementados:
1. ✅ Backend: Email institucional generado automáticamente (tutor_nombre@happyschool.edu.mx)
2. ✅ Backend: GET /padres/:id/preview-email para previsualizar antes de crear
3. ✅ Backend: POST /padres/:id/crear-cuenta usa email institucional
4. ✅ Backend: GET /padres retorna nivel, grupo, es_tutor_principal, hijos ordenados
5. ✅ Web: Tabs por Nivel (Maternal, Kinder 1, 2, 3)
6. ✅ Web: Padres agrupados por alumno (mamá y papá juntos)
7. ✅ Web: Tarjetas con badges (nombre hijo, grupo, "👤 Principal" si es tutor)
8. ✅ Web: Modal de cambio de contraseña al PRIMER LOGIN (bloqueante)
9. ✅ Web: Página /perfil con layout completo (sidebar, volver, logout)
10. ✅ Web: Opción cambiar contraseña en /perfil (accesible después)
11. ✅ Backend: Validación contraseña: 8 caracteres mínimo, letras y números
12. ✅ Web: Validación contraseña en cliente y servidor

### Resumen de Estado:
- **Implementación:** 12/12 bloques ✅
- **Compilación:** 100% ✅
- **Validación funcional:** 100% ✅
  - Creación de cuentas de padres
  - Cambio de contraseña al primer login
  - Cambio de contraseña desde /perfil
  - Tabs y agrupación por nivel/grupo
  - Badges de tutor principal y grupo

### Mejoras Realizadas vs. XX+12:
- Email institucional generado automáticamente (no reutiliza email personal)
- Tabs por nivel (como en Alumnos)
- Padres agrupados por alumno (mamá y papá juntos)
- Modal bloqueante de cambio contraseña al primer login
- Página /perfil accesible desde menú lateral
- Validación de contraseña: 8 caracteres, letras y números
- Layout consistente con el portal

---

## ✅ SESIÓN XX+12 — QR MEJORADO + GESTIÓN USUARIOS PADRES (2026-04-29)

### Bloques Implementados:
1. ✅ Backend: qr_code_url en GET /alumnos/mis-hijos
2. ✅ Backend: Nueva ruta /padres (CRUD: crear-cuenta, activar, inactivar, reset-password)
3. ✅ Web: Fix bug QR parsing en FiltroEntrada (parsear HAPPYSCHOOL:ALUMNO:uuid)
4. ✅ Web: Scanner QR en FiltroSalida (botón naranja)
5. ✅ Web: Modal QR en Directora/Alumnos (generar/regenerar)
6. ✅ Mobile: Pantalla QR padre real (tabs + imagen 280x280)
7. ✅ Web: Nueva página /directora/usuarios (gestión padres: crear, activar, inactivar)

### 🐛 Issues Encontrados (Validación parcial):

**BLOQUE 2 - QR Padre (MOBILE):** PENDIENTE validar en sesión siguiente
**BLOQUE 3 - FiltroEntrada (WEB):** PENDIENTE validar en sesión siguiente
**BLOQUE 4 - FiltroSalida (WEB):** PENDIENTE validar en sesión siguiente

**BLOQUE 5 - Directora/Usuarios (WEB):** ✅ FUNCIONANDO CORRECTAMENTE
- Página `/directora/usuarios` carga sin errores
- Grid de padres se muestra
- Búsqueda filtra correctamente
- Botones de acciones presentes

**BLOQUES 1, 3, 4 - Mobile QR + Scanners Web:** ⏳ PENDIENTE VALIDAR EN SESIÓN SIGUIENTE
- Código implementado correctamente
- No dependen de Cloudinary
- Requieren validación manual en browser

**BLOQUE 2 - Modal QR Generar/Regenerar:** ⚠️ BLOQUEADO POR CLOUDINARY
- Ver motivo en sección "CRÍTICO — REVISIÓN CONFIGURACIÓN CLOUDINARY" (arriba)

### Resumen de Estado:
- **Implementación:** 7/7 bloques ✅
- **Compilación:** 100% ✅
- **Validación funcional:** 2/7 bloques (28%)
  - ✅ BLOQUE 5 (Directora/Usuarios)
  - ⏳ BLOQUES 1, 3, 4 (pendiente)
  - ⚠️ BLOQUE 2 (bloqueado por Cloudinary)

### 🎯 Mejoras Detectadas en Validación:

**1. BLOQUE 5 - Organización de padres:**
- [ ] Agrupar padres por **NIVEL** (Maternal, Kinder 1, Kinder 2, Kinder 3)
- [ ] Dentro de cada nivel, agrupar por **GRUPO** (A, B, C, etc.)
- [ ] Cada grupo mostrar lista de padres con sus hijos
- **Beneficio:** Directora ve padres organizados como ve alumnos

**2. BLOQUE 5 - Aclaración: Email alumno ≠ Email usuario padre:**
- [ ] El email que registramos en **Alumnos** es del alumno (puede ser generic@ o del colegio)
- [ ] El email que registramos en **Padres** es del padre/tutor (su email personal)
- [ ] Al crear cuenta de padre, se usa email DE PADRES, no de alumno
- [ ] **VALIDAR:** Que el formulario/modal de crear cuenta muestre CORRECTAMENTE el email del padre (no del alumno)

### Próxima Sesión — Orden de Trabajo:
1. **[BLOQUEANTE] CRÍTICO:** Resolver configuración Cloudinary (ver sección "CRÍTICO — REVISIÓN CONFIGURACIÓN CLOUDINARY" arriba)
   - Obtener credenciales válidas
   - Actualizar `backend/.env`
   - Reiniciar backend
   - Validar que `POST /api/alumnos/:id/regenerar-qr` retorna 200

2. **DESPUÉS de fix Cloudinary:**
   - [ ] Validar BLOQUE 2 (Modal QR Directora)
   - [ ] Validar BLOQUES 1, 3, 4 (Mobile QR + Scanners entrada/salida)
   - [ ] Audit completo de uploads (fotos alumno, personal, tutor, galerías)

3. **ENTONCES:** Implementar QR Temporal (Círculos Confianza) — línea 61

---

## 🔧 CRÍTICO — REVISIÓN CONFIGURACIÓN CLOUDINARY

> **Estado:** ⚠️ BLOQUEANTE — Afecta múltiples funcionalidades de generación/carga de archivos
> **Prioridad:** ALTA — Debe resolverse antes de siguientes validaciones
> **Afectadas:** QR (generar/regenerar), Fotos alumnos, Fotos personal, Fotos tutores, Galerías

### Problema Detectado:
```
Error: Invalid api_key placeholder
Ubicación: backend/.env líneas 11-13
CLOUDINARY_CLOUD_NAME=placeholder
CLOUDINARY_API_KEY=placeholder
CLOUDINARY_API_SECRET=placeholder
```

### Funcionalidades Bloqueadas:
- [ ] Generar QR (alumnos sin QR)
- [ ] Regenerar QR (alumnos con QR viejo)
- [ ] Subir foto alumno
- [ ] Subir foto personal
- [ ] Subir foto tutor
- [ ] Subir fotos galería
- [ ] Cualquier `uploadToCloudinary()` en el sistema

### Acciones Requeridas:
1. **Obtener credenciales válidas de Cloudinary:**
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET

2. **Actualizar `backend/.env`** con credenciales reales

3. **Reiniciar backend** y validar:
   ```
   curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/alumnos/<id>/regenerar-qr -X POST
   ```
   Debe retornar `200` con `{ "qr_url": "https://..." }`

4. **Audit completo de uploads** después de fix:
   - [ ] QR (generar nuevo)
   - [ ] Foto alumno
   - [ ] Foto personal
   - [ ] Foto tutor
   - [ ] Galería fotos

---

## 🧪 VALIDACIÓN PENDIENTE — Módulo SALUD Y MEDICACIÓN (casos edge - PRÓXIMA SESIÓN)

> ℹ️ Módulo funcional 100% — Bloques 1-10 implementados. Todos los casos edge completados.
> Detalles técnicos en [ARCHIVE_LOG.md](ARCHIVE_LOG.md) — Sesiones 73-86, XX-XX+9

### Casos Edge Pendientes de Validar (PRÓXIMA SESIÓN):
- [ ] **Job cron a las 10:00 AM sábado** (fuera de lun-vie) → Validar NO ejecuta
- [ ] **Job cron a las 15:58** (dentro de rango lun-vie) → Validar ejecuta correctamente
- [ ] **Cambio de fecha (medianoche)** → Datos de ayer no aparecen (aislamiento por día)

### Integraciones Pendientes (FUTURO):
- [ ] **Notificaciones WhatsApp (Vómito + Medicamentos):** Integrar WhatsApp (in-app ya existe)

---

---

## 🎨 UX/UI AUDIT Y MEJORA

- [ ] **Revisar y mejorar UX/UI completa (web + mobile)**
  - **Contexto:** Identificar usuarios finales por rol:
    - Papá: necesita información clara de hijo, tareas, pagos
    - Miss: herramienta de trabajo diario, eficiencia crítica
    - Directora: visión ejecutiva, reportes, alertas
    - Mobile: interfaz simplificada para papá en movimiento
  - **Tareas:**
    - [ ] Auditoría UX/UI web (padre, miss, directora)
    - [ ] Auditoría UX/UI mobile
    - [ ] **Consistency check: Formato y estilo de texto homogéneo**
      - Fechas: formato CONSISTENTE (ej: "Lun 24 de Abr" en todos lados)
      - Saludos: mismo tono y estructura en cada portal
      - Capitalización: CONSISTENTE mayúsculas/minúsculas/CamelCase
      - Iconografía: mismo emoji para mismo concepto
      - Espaciado y tamaño fuente en elementos similares
      - **Objetivo:** No parecer que lo hicieron diferentes personas
    - [ ] Consistency check: colores, tipografía, spacing
    - [ ] Validar flujos por rol (¿cada usuario encuentra lo que busca en <3 clicks?)
    - [ ] Accesibilidad (contraste, tamaño texto, navegación)
    - [ ] Responsive design validation (mobile, tablet, desktop)
  - **Herramientas:** Figma, accesibilidad tools, device testing
  - **Complejidad:** ⭐⭐⭐⭐ (2-3 sesiones)

---

## 🎯 MEDIANO PLAZO — Próximas sesiones (1-2 meses)

### 🚪 SEGURIDAD — SALIDA AVANZADA
- [ ] **Detección Hermanos:** Al QR salida, alerta si hay hermanos en otros grupos.
- [ ] **QR Temporal (Círculos Confianza):** Pase invitado 2 horas, padre envía por WhatsApp o Correo a tercero.

### 💰 FINANZAS — AUTOMATIZACIÓN AVANZADA

> ℹ️ **Nota técnica:** Al registrar un niño de servicio extendido (`modalidad_pago = 'por_dia'`)
> o un visitante con extensión, el backend YA genera automáticamente un cargo en `pagos`
> con `origen = 'extension_dia'` / `'visitante_extension'` y estado `'pendiente'`.
> La validación y UI de estos cobros se trabajará cuando se llegue a este módulo.

- [ ] **Configuración Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **Segmentación Servicios:** Regulares, Solo Extensión, Estancia por Día.
- [ ] **12 Cargos Colegiatura:** Auto con recargos día 6.
- [ ] **Comprobante Comida:** Adjuntar foto transferencia O marcar "Efectivo Lunes" → recordatorio WhatsApp 8:00 AM.
- [ ] **Exportación Contable:** Excel filtrable para admin.
- [ ] **Generación Recibos PDF:** Automático al registrar pago + envío WhatsApp o Correo papá. Ideal tener dentro del panel de pagos el recibo correspondiente a cada pago.

---

## 🎯 LARGO PLAZO — Futuro (2-3 meses)

### 🗂️ CATÁLOGOS DINÁMICOS — 100% ADMINISTRABLE
- [ ] **Auditoría Hardcoded:** Scan profundo → Estatus, Grados, Roles, Parentescos, Alergias, Tipos Pago, Motivos Salida, Emojis, etc.
- [ ] **Crear tablas dinámicas:** Para cada catálogo identificado.
- [ ] **Panel Directora — CRUD completo:** Crear, editar, eliminar catálogos sin código.
- [ ] **Configuración Negocio:** Panel settings editable (recargos, tolerancia, horarios dashboard).

### 📊 REPORTES Y EXPORTACIONES
- [ ] **Reporte Asistencia:** Excel + PDF (por grupo, mes, alumno).
- [ ] **Reporte Tareas:** Excel con % entrega por grupo/alumno.
- [ ] **Reporte Finanzas:** Excel + PDF (ingresos, adeudos, desglose servicios).

### 🎓 EVALUACIONES Y BOLETAS
- [ ] **Indicadores configurables:** Por nivel en catálogos dinámicos.
- [ ] **Captura Miss:** Calificaciones/observaciones.
- [ ] **Validación Directora:** Aprobación antes de enviar.
- [ ] **Boletas PDF:** Generación automática.
- [ ] **Reporte Desarrollo:** PDF mensual por alumno.

### 📷 GALERÍA Y CHAT
- [ ] **Álbumes fotos:** Por evento/mes con compresión.
- [ ] **Privacidad:** Fotos individuales vs. grupales.
- [ ] **Chat Grupo Miss + Papás:** Por grupo.
- [ ] **Chat Familiar:** Papás-Directora-Miss.

### 🔔 NOTIFICACIONES AVANZADAS
- [ ] **Firebase Cloud Messaging:** Registrar tokens, enviar push.
- [ ] **WhatsApp Automático:** 19 plantillas en DB (ya documentadas).
- [ ] **Panel Plantillas:** Editable por Directora.

### 🚀 OPTIMIZACIÓN FINAL
- [ ] **Modo Offline Miss:** Caché local + sincronización.
- [ ] **Backup Automático:** Diario.
- [ ] **Pruebas UX + Performance:** Optimización completa.

---

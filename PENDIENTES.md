# PENDIENTES â€” Happy School App

**Ãšltima actualizaciÃ³n:** 2026-05-04 â€” SesiÃ³n XX+27 COMPLETADA (FASE 7 CatÃ¡logos DinÃ¡micos â€” 10/10 tareas)
âš ï¸ **REGLA:** Tareas completadas = MOVER a ARCHIVE_LOG + ELIMINAR de PENDIENTES (no dejar historial aquÃ­)

---

### ðŸŒ VALIDACIÃ“N EN BROWSER â€” FASES 5.2 (Batches restantes) + Pendientes Edge

**FASE 5.2 â€” MigraciÃ³n 35+ modales a Modal.jsx (VALIDACIÃ“N CRITICAL):**

**Batch D.4+ â€” Pendientes:**
- [ ] `directora/Alumnos.jsx` â€” ModalQR: validar mostrar QR, descargar, regenerar (UI implementada, prÃ³xima sesiÃ³n validaciÃ³n)

---

### Problema Detectado:
```
Error: Invalid api_key placeholder
UbicaciÃ³n: backend/.env lÃ­neas 11-13
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
- [ ] Subir fotos galerÃ­a

### Acciones Requeridas:
1. **Obtener credenciales vÃ¡lidas de Cloudinary:**
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

4. **Audit completo de uploads** despuÃ©s de fix:
   - [ ] QR (generar nuevo)
   - [ ] Foto alumno
   - [ ] Foto personal
   - [ ] Foto tutor
   - [ ] GalerÃ­a fotos

---

### Casos Edge Pendientes de Validar:
- [ ] **Job cron a las 10:00 AM sÃ¡bado** (fuera de lun-vie) â†’ Validar NO ejecuta
- [ ] **Job cron a las 15:58** (dentro de rango lun-vie) â†’ Validar ejecuta correctamente
- [ ] **Cambio de fecha (medianoche)** â†’ Datos de ayer no aparecen (aislamiento por dÃ­a)

---

### ðŸšª SEGURIDAD â€” SALIDA AVANZADA
- [ ] **DetecciÃ³n Hermanos:** Al QR salida, alerta si hay hermanos en otros grupos.
- [ ] **QR Temporal (CÃ­rculos Confianza):** Pase invitado 2 horas, padre envÃ­a por WhatsApp o Correo a tercero.

### ðŸ’° FINANZAS â€” AUTOMATIZACIÃ“N AVANZADA
- [ ] **ConfiguraciÃ³n Precios:** Costos diferenciados por nivel (Maternal a Kinder 3).
- [ ] **SegmentaciÃ³n Servicios:** Regulares, Solo ExtensiÃ³n, Estancia por DÃ­a.
- [ ] **12 Cargos Colegiatura:** Auto con recargos dÃ­a 6.
- [ ] **Comprobante Comida:** Adjuntar foto transferencia O marcar "Efectivo Lunes" â†’ recordatorio WhatsApp 8:00 AM.
- [ ] **ExportaciÃ³n Contable:** Excel filtrable para admin.
- [ ] **GeneraciÃ³n Recibos PDF:** AutomÃ¡tico al registrar pago + envÃ­o WhatsApp o Correo papÃ¡.

---

### ðŸ—‚ï¸ NUEVAS AUDITORÃAS â€” CATÃLOGOS ADICIONALES (FASE 8+)
- [ ] **AuditorÃ­a Hardcoded adicional:** Scan profundo â†’ Estatus, Grados, Tipos Pago, Motivos Salida, Emojis, etc. (mÃ¡s allÃ¡ de FASE 7)
- [ ] **Crear tablas dinÃ¡micas nuevas:** Para catÃ¡logos adicionales identificados en futuras auditorÃ­as
- [ ] **ConfiguraciÃ³n Negocio avanzada:** Panel settings editable (recargos, tolerancia, horarios dashboard)

### ðŸ“Š REPORTES Y EXPORTACIONES
- [ ] **Reporte Asistencia:** Excel + PDF (por grupo, mes, alumno).
- [ ] **Reporte Tareas:** Excel con % entrega por grupo/alumno.
- [ ] **Reporte Finanzas:** Excel + PDF (ingresos, adeudos, desglose servicios).

### ðŸŽ“ EVALUACIONES Y BOLETAS
- [ ] **Indicadores configurables:** Por nivel en catÃ¡logos dinÃ¡micos.
- [ ] **Captura Miss:** Calificaciones/observaciones.
- [ ] **ValidaciÃ³n Directora:** AprobaciÃ³n antes de enviar.
- [ ] **Boletas PDF:** GeneraciÃ³n automÃ¡tica.
- [ ] **Reporte Desarrollo:** PDF mensual por alumno.

### ðŸ“· GALERÃA Y CHAT
- [ ] **Ãlbumes fotos:** Por evento/mes con compresiÃ³n.
- [ ] **Privacidad:** Fotos individuales vs. grupales.
- [ ] **Chat Grupo Miss + PapÃ¡s:** Por grupo.
- [ ] **Chat Familiar:** PapÃ¡s-Directora-Miss.

### ðŸ”” NOTIFICACIONES AVANZADAS
- [ ] **Firebase Cloud Messaging:** Registrar tokens, enviar push.
- [ ] **WhatsApp AutomÃ¡tico:** 19 plantillas en DB (ya documentadas).
- [ ] **Panel Plantillas:** Editable por Directora.

### ðŸš€ OPTIMIZACIÃ“N FINAL
- [ ] **Modo Offline Miss:** CachÃ© local + sincronizaciÃ³n.
- [ ] **Backup AutomÃ¡tico:** Diario.
- [ ] **Pruebas UX + Performance:** OptimizaciÃ³n completa.

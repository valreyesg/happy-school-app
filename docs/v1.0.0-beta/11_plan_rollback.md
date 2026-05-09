# Plan de Rollback
## Happy School App — v1.0.0-beta

**Fecha:** 2026-05-08
**Para uso de:** Valeria (producción)

---

> Este documento describe qué hacer si algo falla durante o después de un deploy en producción.

---

## Regla de oro antes de cualquier deploy

**Siempre hacer backup antes de actualizar.** Ver [Plan de Respaldo](10_plan_respaldo.md).

Sin backup reciente, el rollback de base de datos no es posible.

---

## Escenario 1 — El backend no arranca después del deploy

**Síntomas:**
- La API devuelve error 500 o no responde
- Los logs del servidor muestran errores de arranque

**Pasos:**

1. Revisar los logs inmediatamente:
   - Railway: Dashboard → Deployment → View logs
   - Render: Dashboard → Logs

2. Identificar el error (error de conexión BD, variable de entorno faltante, etc.)

3. Si es una variable de entorno faltante:
   - Agregar la variable en el panel del servicio
   - Redeploy automático o manual

4. Si es un error de código:
   - Railway/Render permiten hacer **rollback a un deploy anterior** desde el dashboard
   - Railway: Deployments → seleccionar el deploy anterior → "Redeploy"
   - Render: Manual Deploys → seleccionar versión anterior

---

## Escenario 2 — Una migración de BD falló a mitad

**Síntomas:**
- El servidor arrancó pero ciertas funcionalidades no funcionan
- Los logs muestran errores de SQL ("column does not exist", "relation does not exist")

**Pasos:**

1. **No hacer más cambios** hasta resolver

2. Verificar qué migraciones se aplicaron:
   ```sql
   SELECT name, run_on FROM pgmigrations ORDER BY run_on DESC LIMIT 5;
   ```

3. Si la migración que falló dejó la BD en estado inconsistente:
   - **Opción A:** Revertir la migración manualmente con `npm run migrate:down` (solo si es la última)
   - **Opción B:** Restaurar desde el backup previo al deploy

4. Corregir el script de migración y volver a intentar

---

## Escenario 3 — El frontend web no carga o muestra errores

**Síntomas:**
- La página web da error 404, pantalla en blanco, o errores de JavaScript

**Pasos:**

1. Verificar que `VITE_API_URL` en Vercel apunta al backend correcto
2. Si el problema es de código: hacer rollback desde el panel de Vercel
   - Vercel: Deployments → seleccionar el deploy anterior → "Redeploy"
3. Si el problema es de variables de entorno: corregirlas y redeploy

---

## Escenario 4 — Datos corruptos o borrados accidentalmente

**Síntomas:**
- Alumnos, pagos u otros datos desaparecieron
- La BD tiene datos incorrectos

**Pasos:**

1. Restaurar desde el backup más reciente:
   ```bash
   pg_restore -d "$DATABASE_URL" --no-owner --clean backup_YYYYMMDD.dump
   ```

2. Verificar que los datos se restauraron correctamente

3. Si el backup también tiene los datos incorrectos, buscar un backup más antiguo

> **Nota:** La restauración desde backup borrará todos los datos agregados después de la fecha del backup. Evaluar qué es menos perjudicial antes de proceder.

---

## Escenario 5 — La app mobile deja de funcionar

**Síntomas:**
- Los padres o maestras reportan que la app no carga o muestra errores

**Pasos:**

1. Verificar si el backend está funcionando (probar la URL de la API en el navegador)
2. Si el backend caído es la causa → resolver primero el backend (Escenario 1)
3. Si el problema es de la app en sí:
   - Si está en Expo Go: los usuarios deben recargar la app
   - Si está en build nativo (APK): publicar una versión de corrección

---

## Cómo hacer rollback de código en Railway

1. Entrar a [railway.app](https://railway.app)
2. Ir al proyecto → servicio del backend
3. Clic en **"Deployments"**
4. Buscar el último deploy exitoso (antes del problema)
5. Clic en **"..."** → **"Redeploy"**
6. El servicio vuelve a la versión anterior en ~1-2 minutos

---

## Cómo hacer rollback de código en Vercel

1. Entrar a [vercel.com](https://vercel.com)
2. Ir al proyecto del frontend
3. Clic en **"Deployments"**
4. Buscar el último deploy exitoso
5. Clic en **"..."** → **"Promote to Production"**
6. El frontend vuelve a la versión anterior inmediatamente

---

## Lista de verificación post-rollback

Después de cualquier rollback:

- [ ] El backend responde correctamente: `curl https://tu-backend.railway.app/health`
- [ ] El frontend web carga sin errores
- [ ] Se puede iniciar sesión con usuario de prueba
- [ ] Verificar la funcionalidad afectada específicamente
- [ ] Documentar qué causó el problema para no repetirlo

---

*Happy School App — v1.0.0-beta | Happys School — 2026*

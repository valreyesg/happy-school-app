# Guía de Variables de Entorno
## Happy School App — v1.0.0-beta

**Fecha:** 2026-05-08
**Para uso de:** Valeria (deploy en producción)

---

> Este documento describe cada variable de entorno necesaria para desplegar la aplicación en producción (Railway/Render para backend, Vercel/Netlify para web).

---

## Backend — `backend/.env`

### Variables obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://usuario:contraseña@host:5432/happy_school` |
| `JWT_SECRET` | Clave secreta para firmar tokens de acceso (mínimo 64 caracteres) | Generar con: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Clave secreta para tokens de refresh (diferente a JWT_SECRET) | Generar con: `openssl rand -hex 32` |

### Variables de tiempo de tokens (opcionales, tienen defaults)

| Variable | Descripción | Default | Valor recomendado |
|----------|-------------|---------|-------------------|
| `JWT_ACCESS_EXPIRES` | Tiempo de expiración del token de acceso | `15m` | `15m` |
| `JWT_REFRESH_EXPIRES` | Tiempo de expiración del token de refresh | `7d` | `7d` |

### Variables del servidor (opcionales)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto en que escucha el servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `TZ` | Zona horaria del servidor | `America/Mexico_City` |

### Cloudinary — subida de fotos e imágenes

> Requeridas si `CLOUDINARY_ENABLED=true`. Sin Cloudinary, las fotos de bitácora, personas autorizadas y comprobantes de pago no funcionan.

| Variable | Descripción |
|----------|-------------|
| `CLOUDINARY_ENABLED` | `true` para activar, `false` para desactivar |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en cloudinary.com → Settings → Cloud Name |
| `CLOUDINARY_API_KEY` | API Key en cloudinary.com → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | API Secret en cloudinary.com → Settings → API Keys |

### Firebase — notificaciones push

> Requeridas para que las maestras y padres reciban notificaciones en sus celulares.

| Variable | Descripción | Dónde obtener |
|----------|-------------|---------------|
| `FIREBASE_PROJECT_ID` | ID del proyecto de Firebase | Firebase Console → Configuración del proyecto |
| `FIREBASE_PRIVATE_KEY` | Clave privada (JSON string completo con comillas) | Firebase Console → Configuración → Cuentas de servicio → Generar clave privada |
| `FIREBASE_CLIENT_EMAIL` | Email del service account | Mismo archivo JSON de la clave privada |

> **Importante:** El valor de `FIREBASE_PRIVATE_KEY` debe ir entre comillas y con los saltos de línea `\n` preservados exactamente como en el archivo JSON descargado.

### Twilio — mensajes de WhatsApp

> Requeridas si `WHATSAPP_ENABLED=true`. Sin Twilio, los mensajes de WhatsApp no se envían pero el resto de la app funciona.

| Variable | Descripción |
|----------|-------------|
| `WHATSAPP_ENABLED` | `true` para activar WhatsApp, `false` para desactivar |
| `TWILIO_ACCOUNT_SID` | Account SID de la cuenta Twilio |
| `TWILIO_AUTH_TOKEN` | Auth Token de la cuenta Twilio |
| `TWILIO_WHATSAPP_FROM` | Número de WhatsApp de Twilio, formato: `whatsapp:+14155238886` |

### URLs de la aplicación

| Variable | Descripción | Valor en producción |
|----------|-------------|---------------------|
| `APP_URL` | URL pública del backend | `https://tu-backend.railway.app` |
| `APP_BASE_URL` | URL base del backend (igual a APP_URL) | `https://tu-backend.railway.app` |
| `WEB_URL` | URL pública del frontend web | `https://tu-app.vercel.app` |
| `MOBILE_URL` | URL de la app mobile (Expo) | `https://tu-app.expo.dev` |

### Otros

| Variable | Descripción | Valor recomendado |
|----------|-------------|-------------------|
| `DEFAULT_USER_PASSWORD` | Contraseña por defecto al restablecer | Cambiar de `HappySchool2026!` a algo más seguro en producción |

---

## Web Frontend — `web/.env.local`

Solo una variable:

| Variable | Descripción | Valor desarrollo | Valor producción |
|----------|-------------|-----------------|------------------|
| `VITE_API_URL` | URL del backend (con `/api` al final) | `http://localhost:3000/api` | `https://tu-backend.railway.app/api` |

---

## App Mobile — `mobile/.env`

Solo una variable:

| Variable | Descripción | Valor desarrollo | Valor producción |
|----------|-------------|-----------------|------------------|
| `EXPO_PUBLIC_API_URL` | URL del backend (con `/api` al final) | `http://192.168.1.X:3000/api` (IP de tu máquina) | `https://tu-backend.railway.app/api` |

> **Nota sobre desarrollo mobile:** En desarrollo, usar la IP de la computadora en la red local (no `localhost`), porque el celular no puede acceder a `localhost` de la computadora.

---

## Cómo configurar en Railway (backend)

1. Entrar a [railway.app](https://railway.app)
2. Ir al proyecto → pestaña **Variables**
3. Agregar cada variable una por una (o pegar el contenido del `.env` como texto)
4. Railway reinicia el servidor automáticamente al guardar

---

## Cómo configurar en Vercel (web)

1. Entrar a [vercel.com](https://vercel.com)
2. Ir al proyecto → **Settings** → **Environment Variables**
3. Agregar `VITE_API_URL` con el valor de producción
4. Hacer un nuevo deploy después de guardar

---

## Notas de seguridad

- **Nunca subir archivos `.env` al repositorio de Git**
- Los secretos (`JWT_SECRET`, `JWT_REFRESH_SECRET`, claves de API) deben ser únicos y distintos entre desarrollo y producción
- La `DATABASE_URL` de producción no debe compartirse por correo o WhatsApp
- Rotar las claves si se sospecha que fueron expuestas

---

*Happy School App — v1.0.0-beta | Happys School — 2026*

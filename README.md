# Happy School App — Comunidad Infantil 🏫

Aplicación multiplataforma para la escuela Happy School - Comunidad Infantil.

## Portales
- 👩‍💼 **Directora** — Administración académica y configuración
- 💼 **Administrativo** — Pagos, cobros y seguimiento financiero
- 👩‍🏫 **Maestras** — Bitácora, asistencia y comunicación
- 👨‍👩‍👧 **Padres de Familia** — Información de sus hijos

## Stack Tecnológico
- **Mobile:** React Native + Expo
- **Web:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Auth:** JWT
- **Archivos:** Cloudinary
- **Push:** Firebase Cloud Messaging
- **WhatsApp:** Twilio WhatsApp Business API
- **Calendario:** Google Calendar API

## Estructura del Proyecto

```
APP-KINDER/
├── backend/        # API Express (puerto 3000)
├── web/            # React + Vite (puerto 5173)
├── mobile/         # Expo / React Native
└── tests/
    └── smoke/      # Tests de humo (health + auth)
```

## Inicio Rápido

```bash
# 1. Instalar dependencias (web, backend y mobile)
npm run install:all

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales de BD, JWT, Cloudinary, etc.

# 3. Migrar base de datos
npm run db:migrate

# 4. Arrancar en desarrollo
npm run dev          # backend + web en paralelo
npm run dev:full     # backend + web + mobile Expo
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Backend + Web en paralelo (con logs de color) |
| `npm run dev:full` | Backend + Web + Mobile Expo |
| `npm run backend` | Solo backend |
| `npm run web` | Solo web |
| `npm run test:smoke` | Tests de humo (requiere BD activa) |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:seed` | Cargar datos iniciales |

## Tests de humo

Los tests validan que el backend arranca y que auth responde correctamente.
Para el test de login válido, definir en el entorno:

```bash
SMOKE_TEST_EMAIL=tu@email.com SMOKE_TEST_PASSWORD=tupassword npm run test:smoke
```

## Licencia
MIT — Ver [LICENSE](LICENSE)

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

## Inicio Rápido

```bash
# Instalar dependencias
npm run install:all

# Variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales

# Correr migraciones
npm run db:migrate

# Iniciar backend
npm run backend

# Iniciar web
npm run web

# Iniciar mobile (en otra terminal)
cd mobile && npx expo start
```

## Licencia
MIT — Ver [LICENSE](LICENSE)

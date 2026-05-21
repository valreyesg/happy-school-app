# ── Stage 1: Build de Vite ────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# VITE_API_URL=/api → relativa, nginx en este mismo contenedor hace el proxy
# El browser NUNCA intenta alcanzar el DNS interno del cluster directamente
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: nginx sirviendo los estáticos ─────────────────────
FROM nginx:1.25-alpine AS production

# Eliminar config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra config de nginx
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copiar los archivos compilados de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

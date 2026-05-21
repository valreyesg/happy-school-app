# ── Stage 1: Instalar dependencias de producción ─────────────
FROM node:18-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Imagen de producción ─────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=America/Mexico_City

# Copiar node_modules de producción
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente y archivos necesarios
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY migrations/ ./migrations/
COPY database.json ./database.json
COPY package*.json ./

# Crear directorio de uploads (el PVC se montará aquí en K8s)
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Ejecutar como usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["node", "src/index.js"]

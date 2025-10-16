# Dockerfile para Sistema de Clínica Médica
# Optimizado para Railway

# Etapa de construcción
FROM node:22-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install

# Copiar código fuente
COPY . .

# Generar cliente de Prisma
RUN pnpm run db:generate

# Construir aplicación
RUN pnpm run build

# Etapa de producción
FROM node:22-alpine AS runner

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat curl

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción y utilidades para runtime
RUN npm install -g pnpm tsx
RUN pnpm install --prod

# Copiar aplicación construida
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar archivos de Prisma y scripts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Generar Prisma Client en la imagen final (evita depender de rutas de node_modules del build)
RUN pnpm prisma generate

# Cambiar propietario
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto (Railway usa puerto dinámico)
EXPOSE $PORT

# Variables de entorno
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256 --max-semi-space-size=64"
ENV TZ=America/Santo_Domingo

# Healthcheck de la aplicación (liveness simple que no depende de DB)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:$PORT/api/health/liveness || exit 1

# Comando de inicio: ejecutar migraciones y iniciar servidor
CMD ["sh", "-c", "echo '🚀 Iniciando Railway...' && export DATABASE_URL=\"$DATABASE_PUBLIC_URL\" && (npx prisma migrate deploy || npx prisma db push) && echo '✅ Migraciones completadas' && pnpm run db:setup-production-admin && echo '✅ Admin configurado' && node server.js"]

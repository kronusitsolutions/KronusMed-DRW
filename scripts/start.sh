#!/bin/sh
set -e

RETRIES=${DB_RETRIES:-10}
SLEEP=${DB_RETRY_SLEEP:-5}

echo "⏳ Aplicando migraciones (si existen) con hasta $RETRIES reintentos..."
for i in $(seq 1 $RETRIES); do
  if pnpm prisma migrate deploy; then
    echo "✅ migrate deploy finalizado"
    break
  else
    echo "⚠️  migrate deploy intento $i/$RETRIES falló, reintentando en ${SLEEP}s..."
    sleep $SLEEP
  fi
done

echo "➡️  Asegurando esquema con prisma db push (crea tablas si no existen)..."
PUSHED=""
for i in $(seq 1 $RETRIES); do
  if pnpm prisma db push; then
    PUSHED="yes"
    echo "✅ db push exitoso"
    break
  else
    echo "⚠️  db push intento $i/$RETRIES falló, reintentando en ${SLEEP}s..."
    sleep $SLEEP
  fi
done

if [ -z "$PUSHED" ]; then
  echo "❌ No se pudo aplicar prisma db push tras $RETRIES intentos. Continuando para no bloquear el arranque."
fi

# Crear admin inicial si las variables están definidas
if [ -n "$INITIAL_ADMIN_EMAIL" ] && [ -n "$INITIAL_ADMIN_PASSWORD" ]; then
  echo "🔐 Configurando administrador inicial..."
  node scripts/setup-production-admin.js || true
else
  echo "⚠️  Variables INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD no definidas"
  echo "   Para crear un admin inicial, configura estas variables en Railway:"
  echo "   - INITIAL_ADMIN_EMAIL=admin@tu-dominio.com"
  echo "   - INITIAL_ADMIN_PASSWORD=tu_password_seguro"
  echo "   - INITIAL_ADMIN_NAME=Administrador (opcional)"
  echo "   Luego redespliega la aplicación"
fi

echo "🚀 Iniciando servidor"
node server.js



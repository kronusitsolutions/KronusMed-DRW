#!/bin/sh

# Script de inicialización para Railway
# Ejecuta migraciones y crea admin de forma segura

set -e  # Salir en cualquier error

echo "🚀 Iniciando configuración de Railway..."

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "INITIAL_ADMIN_EMAIL: $INITIAL_ADMIN_EMAIL"
echo "INITIAL_ADMIN_PASSWORD: ${INITIAL_ADMIN_PASSWORD:+[CONFIGURADA]}"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no está configurada"
    exit 1
fi

# Ejecutar migraciones
echo "📊 Ejecutando migraciones de base de datos..."
if pnpm prisma migrate deploy; then
    echo "✅ Migraciones ejecutadas correctamente"
elif pnpm prisma db push; then
    echo "✅ Base de datos sincronizada con db push"
else
    echo "❌ Error en migraciones"
    exit 1
fi

# Crear admin si las variables están configuradas
if [ ! -z "$INITIAL_ADMIN_EMAIL" ] && [ ! -z "$INITIAL_ADMIN_PASSWORD" ]; then
    echo "👤 Creando administrador inicial..."
    if pnpm run db:setup-production-admin; then
        echo "✅ Administrador creado correctamente"
    else
        echo "⚠️  Error al crear admin, pero continuando..."
    fi
else
    echo "⚠️  Variables de admin no configuradas, saltando creación de admin"
fi

echo "🎉 Configuración completada, iniciando servidor..."

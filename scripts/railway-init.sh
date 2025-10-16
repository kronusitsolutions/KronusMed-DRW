#!/bin/sh

# Script de inicialización para Railway
# Ejecuta migraciones y crea admin de forma segura

echo "🚀 Iniciando configuración de Railway..."

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no está configurada"
    exit 1
fi

if [ -z "$INITIAL_ADMIN_EMAIL" ] || [ -z "$INITIAL_ADMIN_PASSWORD" ]; then
    echo "⚠️  Variables de admin no configuradas, saltando creación de admin"
    echo "   Configura INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD en Railway"
else
    echo "✅ Variables de admin configuradas"
fi

# Ejecutar migraciones
echo "📊 Ejecutando migraciones de base de datos..."
pnpm prisma migrate deploy || pnpm prisma db push

if [ $? -eq 0 ]; then
    echo "✅ Migraciones ejecutadas correctamente"
else
    echo "❌ Error en migraciones"
    exit 1
fi

# Crear admin si las variables están configuradas
if [ ! -z "$INITIAL_ADMIN_EMAIL" ] && [ ! -z "$INITIAL_ADMIN_PASSWORD" ]; then
    echo "👤 Creando administrador inicial..."
    pnpm run db:setup-production-admin
    if [ $? -eq 0 ]; then
        echo "✅ Administrador creado correctamente"
    else
        echo "⚠️  Error al crear admin, pero continuando..."
    fi
fi

echo "🎉 Configuración completada, iniciando servidor..."

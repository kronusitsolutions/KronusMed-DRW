#!/bin/sh

# Script de inicialización para Railway
# Ejecuta migraciones y crea admin de forma segura
# SOLUCIÓN: Usa DATABASE_PUBLIC_URL si está disponible

set -e  # Salir en cualquier error

echo "🚀 Iniciando configuración de Railway..."

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "DATABASE_PUBLIC_URL: ${DATABASE_PUBLIC_URL:0:30}..."
echo "INITIAL_ADMIN_EMAIL: $INITIAL_ADMIN_EMAIL"
echo "INITIAL_ADMIN_PASSWORD: ${INITIAL_ADMIN_PASSWORD:+[CONFIGURADA]}"

# SOLUCIÓN CRÍTICA: Usar DATABASE_PUBLIC_URL si está disponible
if [ ! -z "$DATABASE_PUBLIC_URL" ]; then
    echo "✅ Usando DATABASE_PUBLIC_URL (recomendado para Railway)"
    export DATABASE_URL="$DATABASE_PUBLIC_URL"
elif [ ! -z "$DATABASE_URL" ]; then
    echo "⚠️  Usando DATABASE_URL (puede fallar en Railway)"
else
    echo "❌ No hay URL de base de datos configurada"
    exit 1
fi

# Ejecutar migraciones con manejo de errores mejorado
echo "📊 Ejecutando migraciones de base de datos..."
if pnpm prisma migrate deploy; then
    echo "✅ Migraciones ejecutadas correctamente"
elif pnpm prisma db push; then
    echo "✅ Base de datos sincronizada con db push"
else
    echo "❌ Error en migraciones - intentando crear tablas manualmente..."
    # Fallback: crear tablas manualmente
    node scripts/create-tables-directly.js || {
        echo "❌ Error crítico: No se pudieron crear las tablas"
        exit 1
    }
fi

# Crear admin si las variables están configuradas
if [ ! -z "$INITIAL_ADMIN_EMAIL" ] && [ ! -z "$INITIAL_ADMIN_PASSWORD" ]; then
    echo "👤 Creando administrador inicial..."
    if pnpm run db:setup-production-admin; then
        echo "✅ Administrador creado correctamente"
    else
        echo "⚠️  Error al crear admin, intentando método alternativo..."
        node scripts/create-admin.js || echo "⚠️  Admin no creado, pero continuando..."
    fi
else
    echo "⚠️  Variables de admin no configuradas, saltando creación de admin"
fi

echo "🎉 Configuración completada, iniciando servidor..."

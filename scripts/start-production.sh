#!/bin/bash

# Script de inicio para producción en Railway
set -e

echo "🚀 Iniciando aplicación en Railway..."

# Función para manejar errores
handle_error() {
    echo "❌ Error en: $1"
    echo "🔧 Continuando con el siguiente paso..."
    return 0
}

# 1. Configurar variables de entorno
echo "📋 Configurando variables de entorno..."
if [ -n "$DATABASE_PUBLIC_URL" ]; then
    echo "✅ Usando DATABASE_PUBLIC_URL"
    export DATABASE_URL="$DATABASE_PUBLIC_URL"
else
    echo "⚠️  Usando DATABASE_URL (puede fallar en Railway)"
fi

# 2. Ejecutar migraciones
echo "📊 Ejecutando migraciones..."
if npx prisma migrate deploy; then
    echo "✅ Migraciones aplicadas exitosamente"
elif npx prisma db push; then
    echo "✅ Base de datos sincronizada con db push"
else
    echo "⚠️  Migraciones fallaron, intentando crear tablas manualmente..."
    if node scripts/create-tables-directly.js; then
        echo "✅ Tablas creadas manualmente"
    else
        echo "❌ No se pudieron crear las tablas"
        exit 1
    fi
fi

# 3. Crear administrador
echo "👤 Configurando administrador..."
if pnpm run db:setup-production-admin; then
    echo "✅ Administrador configurado"
else
    echo "⚠️  Fallback: creando administrador manualmente..."
    if node scripts/create-admin.js; then
        echo "✅ Administrador creado manualmente"
    else
        echo "❌ No se pudo crear el administrador"
        exit 1
    fi
fi

# 4. Verificar estado
echo "🔍 Verificando estado de la aplicación..."
if node scripts/verify-deployment.js; then
    echo "✅ Verificación exitosa"
else
    echo "⚠️  Verificación falló, pero continuando..."
fi

# 5. Iniciar servidor
echo "🚀 Iniciando servidor..."
exec node server.js

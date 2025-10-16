#!/bin/bash

echo "🔍 Verificando conexión a Railway DB..."

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL no está configurada"
  exit 1
fi

echo "✅ DATABASE_URL configurada"

# Probar conexión con psql (si está disponible)
if command -v psql &> /dev/null; then
  echo "🔌 Probando conexión con psql..."
  if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    echo "✅ Conexión exitosa con psql"
  else
    echo "❌ Error de conexión con psql"
  fi
fi

# Probar con Node.js
echo "🔌 Probando conexión con Node.js..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT 1`
  .then(() => {
    console.log('✅ Conexión exitosa con Prisma');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Error de conexión con Prisma:', error.message);
    process.exit(1);
  });
"

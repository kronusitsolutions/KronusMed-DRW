const { PrismaClient } = require('@prisma/client');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function migrateDatabase() {
  try {
    console.log('🔍 Probando conexión con URL pública...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión exitosa con URL pública');
    
    console.log('📊 Sincronizando esquema...');
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY)`;
    console.log('✅ Tabla de prueba creada');
    
    // Ahora intentar las migraciones de Prisma
    console.log('🚀 Ejecutando migraciones...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Migraciones completadas');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrateDatabase();

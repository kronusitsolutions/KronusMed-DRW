const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión exitosa');
    
    // Intentar crear las tablas
    console.log('📊 Intentando sincronizar esquema...');
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY)`;
    console.log('✅ Tabla de prueba creada');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

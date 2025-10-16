const { PrismaClient } = require('@prisma/client');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function createEnums() {
  try {
    console.log('🔍 Creando tipos ENUM...');
    
    // Crear ENUM UserRole
    await prisma.$executeRaw`CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'BILLING')`;
    console.log('✅ ENUM UserRole creado');
    
    // Crear ENUM Gender
    await prisma.$executeRaw`CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER')`;
    console.log('✅ ENUM Gender creado');
    
    // Crear ENUM PatientStatus
    await prisma.$executeRaw`CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'INACTIVE')`;
    console.log('✅ ENUM PatientStatus creado');
    
    // Crear ENUM InvoiceStatus
    await prisma.$executeRaw`CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED', 'EXONERATED')`;
    console.log('✅ ENUM InvoiceStatus creado');
    
    console.log('🎉 ¡Todos los ENUMs creados exitosamente!');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Los ENUMs ya existen, continuando...');
    } else {
      console.log('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createEnums();

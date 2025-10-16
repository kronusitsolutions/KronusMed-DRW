const { PrismaClient } = require('@prisma/client');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function fixTables() {
  try {
    console.log('🔧 Actualizando tablas para usar tipos ENUM...');
    
    // Actualizar tabla users para usar UserRole
    await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole"`;
    console.log('✅ Tabla users actualizada');
    
    // Actualizar tabla patients para usar Gender y PatientStatus
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "gender" TYPE "Gender" USING "gender"::"Gender"`;
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "status" TYPE "PatientStatus" USING "status"::"PatientStatus"`;
    console.log('✅ Tabla patients actualizada');
    
    // Actualizar tabla invoices para usar InvoiceStatus
    await prisma.$executeRaw`ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus" USING "status"::"InvoiceStatus"`;
    console.log('✅ Tabla invoices actualizada');
    
    console.log('🎉 ¡Tablas actualizadas correctamente!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTables();

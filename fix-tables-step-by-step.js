const { PrismaClient } = require('@prisma/client');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function fixTablesStepByStep() {
  try {
    console.log('🔧 Solucionando tipos ENUM paso a paso...');
    
    // 1. Eliminar valores por defecto
    await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`;
    console.log('✅ Valor por defecto eliminado de users.role');
    
    // 2. Actualizar columna role
    await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole"`;
    console.log('✅ Columna role actualizada a UserRole');
    
    // 3. Restaurar valor por defecto
    await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'BILLING'::"UserRole"`;
    console.log('✅ Valor por defecto restaurado');
    
    // Hacer lo mismo para patients
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "gender" TYPE "Gender" USING "gender"::"Gender"`;
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "status" TYPE "PatientStatus" USING "status"::"PatientStatus"`;
    console.log('✅ Tabla patients actualizada');
    
    // Hacer lo mismo para invoices
    await prisma.$executeRaw`ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus" USING "status"::"InvoiceStatus"`;
    console.log('✅ Tabla invoices actualizada');
    
    console.log('🎉 ¡Todas las tablas actualizadas correctamente!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTablesStepByStep();

const { PrismaClient } = require('@prisma/client');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function fixPatientsTable() {
  try {
    console.log('🔧 Solucionando tabla patients...');
    
    // Eliminar valores por defecto
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "status" DROP DEFAULT`;
    console.log('✅ Valor por defecto eliminado de patients.status');
    
    // Actualizar columna status
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "status" TYPE "PatientStatus" USING "status"::"PatientStatus"`;
    console.log('✅ Columna status actualizada a PatientStatus');
    
    // Restaurar valor por defecto
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"PatientStatus"`;
    console.log('✅ Valor por defecto restaurado');
    
    // Actualizar columna gender
    await prisma.$executeRaw`ALTER TABLE "patients" ALTER COLUMN "gender" TYPE "Gender" USING "gender"::"Gender"`;
    console.log('✅ Columna gender actualizada a Gender');
    
    console.log('🎉 ¡Tabla patients actualizada correctamente!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPatientsTable();

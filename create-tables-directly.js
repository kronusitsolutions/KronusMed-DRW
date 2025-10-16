const { PrismaClient } = require('@prisma/client');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function createTables() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión exitosa');
    
    console.log('📊 Creando tablas...');
    
    // Crear tabla users
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'BILLING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "doctorProfile" TEXT,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Tabla users creada');
    
    // Crear tabla patients
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "patients" (
        "id" TEXT NOT NULL,
        "patientNumber" TEXT NOT NULL DEFAULT 'A000001',
        "name" TEXT NOT NULL,
        "age" INTEGER,
        "gender" TEXT NOT NULL,
        "phone" TEXT,
        "address" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "insuranceId" TEXT,
        "nationality" TEXT,
        "cedula" TEXT,
        "allergies" TEXT,
        "birthDate" TIMESTAMP(3),
        "bloodType" TEXT,
        "emergencyContact" TEXT,
        "medicalHistory" TEXT,
        CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Tabla patients creada');
    
    // Crear tabla services
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "services" (
        "id" TEXT NOT NULL DEFAULT 'serv0001',
        "name" TEXT NOT NULL,
        "description" TEXT,
        "price" DOUBLE PRECISION NOT NULL,
        "category" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "services_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Tabla services creada');
    
    // Crear tabla invoices
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" TEXT NOT NULL,
        "invoiceNumber" TEXT NOT NULL,
        "patientId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "pendingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "dueDate" TIMESTAMP(3),
        "paidAt" TIMESTAMP(3),
        "notes" TEXT,
        "insuranceCalculation" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Tabla invoices creada');
    
    console.log('🎉 ¡Todas las tablas principales creadas exitosamente!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTables();

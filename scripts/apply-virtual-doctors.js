const { PrismaClient } = require('@prisma/client')

async function applyVirtualDoctors() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Aplicando migración de doctores virtuales...')
    
    // Verificar qué enums ya existen
    const existingEnums = await prisma.$queryRaw`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typname IN ('DoctorStatus', 'MedicalNoteType')
    `
    
    console.log('📋 Enums existentes:', existingEnums.map(e => e.typname))
    
    // Crear enums solo si no existen
    if (!existingEnums.find(e => e.typname === 'DoctorStatus')) {
      await prisma.$executeRaw`CREATE TYPE "DoctorStatus" AS ENUM ('ACTIVE', 'INACTIVE')`
      console.log('✅ Enum DoctorStatus creado')
    } else {
      console.log('⚠️  Enum DoctorStatus ya existe')
    }
    
    if (!existingEnums.find(e => e.typname === 'MedicalNoteType')) {
      await prisma.$executeRaw`CREATE TYPE "MedicalNoteType" AS ENUM ('PRIMERA_CONSULTA', 'SEGUIMIENTO', 'CONTROL', 'URGENCIA')`
      console.log('✅ Enum MedicalNoteType creado')
    } else {
      console.log('⚠️  Enum MedicalNoteType ya existe')
    }
    
    // Verificar si la tabla doctors ya existe
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'doctors'
    `
    
    if (tableExists.length === 0) {
      console.log('🔨 Creando tabla doctors...')
      
      await prisma.$executeRaw`
        CREATE TABLE "doctors" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "specialization" TEXT,
          "phone" TEXT,
          "email" TEXT,
          "status" "DoctorStatus" NOT NULL DEFAULT 'ACTIVE',
          "userId" TEXT,
          "availability" JSONB,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
        )
      `
      console.log('✅ Tabla doctors creada')
    } else {
      console.log('⚠️  Tabla doctors ya existe')
    }
    
    // Agregar columnas a appointments si no existen
    const appointmentColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name IN ('doctorProfileId')
    `
    
    if (!appointmentColumns.find(c => c.column_name === 'doctorProfileId')) {
      await prisma.$executeRaw`ALTER TABLE "appointments" ADD COLUMN "doctorProfileId" TEXT`
      console.log('✅ Columna doctorProfileId agregada a appointments')
    } else {
      console.log('⚠️  Columna doctorProfileId ya existe en appointments')
    }
    
    // Agregar columnas a medical_notes si no existen
    const medicalNotesColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'medical_notes' 
      AND column_name IN ('doctorProfileId')
    `
    
    if (!medicalNotesColumns.find(c => c.column_name === 'doctorProfileId')) {
      await prisma.$executeRaw`ALTER TABLE "medical_notes" ADD COLUMN "doctorProfileId" TEXT`
      console.log('✅ Columna doctorProfileId agregada a medical_notes')
    } else {
      console.log('⚠️  Columna doctorProfileId ya existe en medical_notes')
    }
    
    // Agregar columna a users si no existe
    const userColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'doctorProfile'
    `
    
    if (!userColumns.find(c => c.column_name === 'doctorProfile')) {
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN "doctorProfile" TEXT`
      console.log('✅ Columna doctorProfile agregada a users')
    } else {
      console.log('⚠️  Columna doctorProfile ya existe en users')
    }
    
    // Crear índices
    const indexes = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "doctors_userId_key" ON "doctors"("userId")',
      'CREATE INDEX IF NOT EXISTS "doctors_status_idx" ON "doctors"("status")',
      'CREATE INDEX IF NOT EXISTS "doctors_name_idx" ON "doctors"("name")',
      'CREATE INDEX IF NOT EXISTS "appointments_doctorProfileId_idx" ON "appointments"("doctorProfileId")'
    ]
    
    for (const indexQuery of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery)
        console.log(`✅ Índice creado: ${indexQuery.split('"')[1]}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Índice ya existe: ${indexQuery.split('"')[1]}`)
        } else {
          console.log(`❌ Error creando índice: ${error.message}`)
        }
      }
    }
    
    // Crear foreign keys
    const foreignKeys = [
      'ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE',
      'ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "medical_notes" ADD CONSTRAINT "medical_notes_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE'
    ]
    
    for (const fkQuery of foreignKeys) {
      try {
        await prisma.$executeRawUnsafe(fkQuery)
        console.log(`✅ Foreign key creado`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Foreign key ya existe`)
        } else {
          console.log(`❌ Error creando foreign key: ${error.message}`)
        }
      }
    }
    
    // Marcar la migración como completada
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations" 
      SET "finished_at" = NOW(), 
          "logs" = 'Migration completed manually - virtual doctors system implemented'
      WHERE "migration_name" = '20241220000000_add_virtual_doctors'
      AND "finished_at" IS NULL
    `
    
    console.log('✅ Migración de doctores virtuales marcada como completada')
    console.log('🎉 Sistema de doctores virtuales implementado exitosamente')
    
  } catch (error) {
    console.error('❌ Error al aplicar migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  applyVirtualDoctors()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error.message)
      process.exit(1)
    })
}

module.exports = { applyVirtualDoctors }

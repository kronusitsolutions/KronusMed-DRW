const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function applyOptionalFieldsMigration() {
  try {
    console.log('🚀 Iniciando migración para hacer campos opcionales...')

    // 1. Hacer campos opcionales
    console.log('📝 Haciendo campos nationality y cedula opcionales...')
    await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN nationality DROP NOT NULL`
    await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN cedula DROP NOT NULL`
    console.log('✅ Campos hechos opcionales')

    // 2. Actualizar registros existentes
    console.log('🔄 Actualizando registros existentes...')
    const updateResult = await prisma.$executeRaw`
      UPDATE patients 
      SET nationality = 'No especificada' 
      WHERE nationality IS NULL
    `
    console.log(`✅ Actualizados ${updateResult} registros con nationality`)

    const updateResult2 = await prisma.$executeRaw`
      UPDATE patients 
      SET cedula = 'PENDIENTE' 
      WHERE cedula IS NULL
    `
    console.log(`✅ Actualizados ${updateResult2} registros con cedula`)

    // 3. Verificar el resultado
    console.log('🔍 Verificando migración...')
    const patients = await prisma.patient.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        nationality: true,
        cedula: true
      }
    })
    console.log('📊 Muestra de pacientes:', patients)

    console.log('🎉 Migración completada exitosamente!')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyOptionalFieldsMigration()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script falló:', error)
      process.exit(1)
    })
}

module.exports = { applyOptionalFieldsMigration }

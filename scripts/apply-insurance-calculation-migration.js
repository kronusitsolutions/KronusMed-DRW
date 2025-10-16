const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migración para agregar insuranceCalculation a invoices...')
    
    // Verificar si la columna ya existe
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name = 'insuranceCalculation'
    `
    
    if (result.length > 0) {
      console.log('✅ La columna insuranceCalculation ya existe en la tabla invoices')
      return
    }
    
    // Agregar la columna
    await prisma.$executeRaw`
      ALTER TABLE "invoices" ADD COLUMN "insuranceCalculation" JSONB
    `
    
    console.log('✅ Migración aplicada exitosamente')
    console.log('📝 Se agregó la columna insuranceCalculation a la tabla invoices')
    
  } catch (error) {
    console.error('❌ Error al aplicar migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()
  .then(() => {
    console.log('🎉 Migración completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error en la migración:', error)
    process.exit(1)
  })

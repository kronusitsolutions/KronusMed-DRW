const { PrismaClient } = require('@prisma/client')

async function fixFailedMigration() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando estado de la migración fallida...')
    
    // Verificar si la columna ya existe
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name = 'insuranceCalculation'
    `
    
    if (tableInfo.length > 0) {
      console.log('✅ La columna insuranceCalculation ya existe en la tabla invoices')
      console.log('📝 Marcando migración como completada...')
      
      // Marcar la migración como completada en la tabla _prisma_migrations
      await prisma.$executeRaw`
        UPDATE "_prisma_migrations" 
        SET "finished_at" = NOW(), 
            "logs" = 'Migration completed manually - column already exists'
        WHERE "migration_name" = '20241211000000_add_insurance_calculation_to_invoices'
        AND "finished_at" IS NULL
      `
      
      console.log('✅ Migración marcada como completada')
    } else {
      console.log('⚠️  La columna no existe, aplicando migración...')
      
      // Aplicar la migración manualmente
      await prisma.$executeRaw`
        ALTER TABLE "invoices" ADD COLUMN "insuranceCalculation" JSONB
      `
      
      console.log('✅ Columna insuranceCalculation agregada exitosamente')
    }
    
    console.log('🎉 Migración reparada exitosamente')
    
  } catch (error) {
    console.error('❌ Error al reparar migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  fixFailedMigration()
    .then(() => {
      console.log('✅ Script completado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error)
      process.exit(1)
    })
}

module.exports = { fixFailedMigration }

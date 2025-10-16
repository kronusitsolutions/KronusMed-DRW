// Script para migrar facturas de estado OVERDUE a EXONERATED
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateOverdueToExonerated() {
  try {
    console.log('🔄 Migrando facturas de estado OVERDUE a EXONERATED...')
    
    // Contar facturas con estado OVERDUE
    const overdueCount = await prisma.invoice.count({
      where: { status: 'OVERDUE' }
    })
    
    console.log(`📊 Encontradas ${overdueCount} facturas con estado OVERDUE`)
    
    if (overdueCount === 0) {
      console.log('✅ No hay facturas para migrar')
      return
    }
    
    // Actualizar facturas de OVERDUE a EXONERATED
    const result = await prisma.invoice.updateMany({
      where: { status: 'OVERDUE' },
      data: { status: 'EXONERATED' }
    })
    
    console.log(`✅ Migradas ${result.count} facturas de OVERDUE a EXONERATED`)
    
    // Verificar la migración
    const exoneratedCount = await prisma.invoice.count({
      where: { status: 'EXONERATED' }
    })
    
    console.log(`📈 Total de facturas exoneradas: ${exoneratedCount}`)
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateOverdueToExonerated()
  .then(() => {
    console.log('🎉 Migración completada exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error en la migración:', error)
    process.exit(1)
  })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function applyExoneratedMigration() {
  try {
    console.log('🔄 Aplicando migración para estado EXONERATED...')
    
    // Paso 1: Verificar si ya existe el estado EXONERATED
    console.log('📊 Verificando estados actuales...')
    const statusCounts = await prisma.$queryRaw`
      SELECT "status", COUNT(*) as count
      FROM "invoices" 
      GROUP BY "status"
      ORDER BY "status"
    `
    
    console.log('📈 Estados actuales en la base de datos:')
    statusCounts.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} facturas`)
    })
    
    // Paso 2: Intentar actualizar facturas de OVERDUE a EXONERATED
    console.log('\n🔄 Actualizando facturas de OVERDUE a EXONERATED...')
    
    try {
      const result = await prisma.$executeRaw`
        UPDATE "invoices" 
        SET "status" = 'EXONERATED' 
        WHERE "status" = 'OVERDUE'
      `
      console.log(`✅ Actualizadas ${result} facturas de OVERDUE a EXONERATED`)
    } catch (error) {
      if (error.message.includes('enum') || error.message.includes('EXONERATED')) {
        console.log('⚠️  El estado EXONERATED no existe en el enum. Aplicando migración del enum...')
        
        // Intentar agregar el valor al enum
        try {
          await prisma.$executeRaw`ALTER TYPE "InvoiceStatus" ADD VALUE 'EXONERATED'`
          console.log('✅ Valor EXONERATED agregado al enum InvoiceStatus')
          
          // Ahora actualizar las facturas
          const result = await prisma.$executeRaw`
            UPDATE "invoices" 
            SET "status" = 'EXONERATED' 
            WHERE "status" = 'OVERDUE'
          `
          console.log(`✅ Actualizadas ${result} facturas de OVERDUE a EXONERATED`)
        } catch (enumError) {
          console.error('❌ Error al agregar valor al enum:', enumError.message)
          throw enumError
        }
      } else {
        throw error
      }
    }
    
    // Paso 3: Verificar el resultado final
    console.log('\n📊 Verificando resultado final...')
    const finalStatusCounts = await prisma.$queryRaw`
      SELECT "status", COUNT(*) as count
      FROM "invoices" 
      GROUP BY "status"
      ORDER BY "status"
    `
    
    console.log('📈 Estados finales en la base de datos:')
    finalStatusCounts.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} facturas`)
    })
    
    // Verificar que no hay facturas con OVERDUE
    const overdueCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "invoices" 
      WHERE "status" = 'OVERDUE'
    `
    
    if (overdueCount[0].count === '0') {
      console.log('✅ No hay facturas con estado OVERDUE')
    } else {
      console.log(`⚠️  Aún hay ${overdueCount[0].count} facturas con estado OVERDUE`)
    }
    
    console.log('\n🎉 Migración completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyExoneratedMigration()
  .then(() => {
    console.log('✅ Migración aplicada correctamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error en la migración:', error)
    process.exit(1)
  })

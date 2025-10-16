// Script para diagnosticar el estado de los enums en la base de datos
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function diagnoseInvoiceStatus() {
  try {
    console.log('🔍 Diagnosticando estado de facturas en la base de datos...\n')
    
    // 1. Verificar estados actuales
    console.log('📊 Estados actuales en la tabla invoices:')
    const statusCounts = await prisma.$queryRaw`
      SELECT "status", COUNT(*) as count
      FROM "invoices" 
      GROUP BY "status"
      ORDER BY "status"
    `
    
    statusCounts.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} facturas`)
    })
    
    // 2. Verificar si EXONERATED existe en el enum
    console.log('\n🔍 Verificando si EXONERATED existe en el enum...')
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT 'EXONERATED'::"InvoiceStatus" as test_enum
      `
      console.log('✅ El estado EXONERATED existe en el enum')
    } catch (error) {
      if (error.message.includes('EXONERATED') || error.message.includes('enum')) {
        console.log('❌ El estado EXONERATED NO existe en el enum')
        console.log('💡 Necesitas ejecutar la migración del enum')
      } else {
        console.log('⚠️ Error inesperado:', error.message)
      }
    }
    
    // 3. Verificar facturas con OVERDUE
    console.log('\n🔍 Verificando facturas con estado OVERDUE...')
    const overdueInvoices = await prisma.$queryRaw`
      SELECT "id", "invoiceNumber", "status", "totalAmount"
      FROM "invoices" 
      WHERE "status" = 'OVERDUE'
      LIMIT 5
    `
    
    if (overdueInvoices.length > 0) {
      console.log(`📋 Encontradas ${overdueInvoices.length} facturas con estado OVERDUE:`)
      overdueInvoices.forEach(invoice => {
        console.log(`  - ${invoice.invoiceNumber}: $${invoice.totalAmount}`)
      })
    } else {
      console.log('✅ No hay facturas con estado OVERDUE')
    }
    
    // 4. Verificar facturas con EXONERATED
    console.log('\n🔍 Verificando facturas con estado EXONERATED...')
    try {
      const exoneratedInvoices = await prisma.$queryRaw`
        SELECT "id", "invoiceNumber", "status", "totalAmount"
        FROM "invoices" 
        WHERE "status" = 'EXONERATED'
        LIMIT 5
      `
      
      if (exoneratedInvoices.length > 0) {
        console.log(`📋 Encontradas ${exoneratedInvoices.length} facturas con estado EXONERATED:`)
        exoneratedInvoices.forEach(invoice => {
          console.log(`  - ${invoice.invoiceNumber}: $${invoice.totalAmount}`)
        })
      } else {
        console.log('ℹ️ No hay facturas con estado EXONERATED')
      }
    } catch (error) {
      console.log('❌ No se puede consultar facturas EXONERATED:', error.message)
    }
    
    console.log('\n🎯 Diagnóstico completado')
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseInvoiceStatus()
  .then(() => {
    console.log('✅ Diagnóstico finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error en el diagnóstico:', error)
    process.exit(1)
  })

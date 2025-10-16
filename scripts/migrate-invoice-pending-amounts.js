/**
 * Script para migrar facturas existentes y agregar campos de montos pendientes
 * Este script actualiza las facturas existentes para incluir los nuevos campos:
 * - paidAmount: Monto total pagado
 * - pendingAmount: Monto pendiente
 * - status: Actualiza el estado a PARTIAL si hay pagos parciales
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateInvoicePendingAmounts() {
  console.log('🔄 Iniciando migración de montos pendientes en facturas...')
  
  try {
    // Obtener todas las facturas existentes
    const invoices = await prisma.invoice.findMany({
      include: {
        payments: true
      }
    })
    
    console.log(`📊 Encontradas ${invoices.length} facturas para migrar`)
    
    let updatedCount = 0
    let errorCount = 0
    
    for (const invoice of invoices) {
      try {
        // Calcular el monto total pagado basado en los pagos existentes
        const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
        const pendingAmount = invoice.totalAmount - totalPaid
        
        // Determinar el nuevo estado
        let newStatus = invoice.status
        
        if (totalPaid > 0 && totalPaid < invoice.totalAmount) {
          newStatus = 'PARTIAL'
        } else if (totalPaid >= invoice.totalAmount) {
          newStatus = 'PAID'
        } else {
          newStatus = 'PENDING'
        }
        
        // Actualizar la factura
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: totalPaid,
            pendingAmount: pendingAmount,
            status: newStatus,
            paidAt: newStatus === 'PAID' ? new Date() : null
          }
        })
        
        updatedCount++
        
        if (updatedCount % 10 === 0) {
          console.log(`✅ Procesadas ${updatedCount} facturas...`)
        }
        
      } catch (error) {
        console.error(`❌ Error al migrar factura ${invoice.invoiceNumber}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n📈 Resumen de la migración:')
    console.log(`✅ Facturas actualizadas: ${updatedCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    
    // Verificar el resultado
    const statusCounts = await prisma.invoice.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log('\n📊 Estados de facturas después de la migración:')
    statusCounts.forEach(status => {
      console.log(`   ${status.status}: ${status._count.status} facturas`)
    })
    
    console.log('\n🎉 Migración completada exitosamente!')
    
  } catch (error) {
    console.error('💥 Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  migrateInvoicePendingAmounts()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando el script:', error)
      process.exit(1)
    })
}

module.exports = { migrateInvoicePendingAmounts }

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetInvoiceStatus() {
  try {
    console.log('🔄 Cambiando factura de vuelta a PENDING para pruebas...')

    // Obtener la primera factura
    const invoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!invoice) {
      console.log('❌ No hay facturas para cambiar')
      return
    }

    console.log(`📋 Factura encontrada: ${invoice.invoiceNumber} - Estado actual: ${invoice.status}`)

    // Cambiar a PENDING
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { 
        status: 'PENDING',
        paidAt: null
      }
    })

    console.log(`✅ Estado actualizado: ${updatedInvoice.status}`)
    console.log(`📅 Fecha de pago: ${updatedInvoice.paidAt ? updatedInvoice.paidAt.toLocaleDateString() : 'N/A'}`)

  } catch (error) {
    console.error('❌ Error al cambiar estado:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetInvoiceStatus()

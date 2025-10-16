const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testInvoiceStatus() {
  try {
    console.log('🔍 Verificando facturas y sus estados...')

    // Obtener todas las facturas
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        paidAt: true,
        patient: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Total de facturas: ${invoices.length}`)
    console.log('\n📋 Facturas encontradas:')
    
    invoices.forEach((invoice, index) => {
      console.log(`${index + 1}. ${invoice.invoiceNumber} - ${invoice.patient.name} - $${invoice.totalAmount} - ${invoice.status} - ${invoice.createdAt.toLocaleDateString()}`)
    })

    // Mostrar estadísticas por estado
    const statusCounts = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1
      return acc
    }, {})

    console.log('\n📈 Estadísticas por estado:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} facturas`)
    })

    // Probar cambio de estado si hay facturas
    if (invoices.length > 0) {
      const testInvoice = invoices[0]
      console.log(`\n🧪 Probando cambio de estado para: ${testInvoice.invoiceNumber}`)
      console.log(`Estado actual: ${testInvoice.status}`)
      
      // Cambiar a PAID si no está pagado
      if (testInvoice.status !== 'PAID') {
        console.log('🔄 Cambiando estado a PAID...')
        
        const updatedInvoice = await prisma.invoice.update({
          where: { id: testInvoice.id },
          data: { 
            status: 'PAID',
            paidAt: new Date()
          }
        })
        
        console.log(`✅ Estado actualizado: ${updatedInvoice.status}`)
        console.log(`📅 Fecha de pago: ${updatedInvoice.paidAt?.toLocaleDateString()}`)
      } else {
        console.log('ℹ️ La factura ya está pagada')
      }
    }

  } catch (error) {
    console.error('❌ Error al verificar facturas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testInvoiceStatus()

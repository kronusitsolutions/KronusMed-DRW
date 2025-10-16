const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testInvoiceAPI() {
  try {
    console.log('🧪 Probando API de actualización de facturas...')

    // Obtener la primera factura
    const invoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!invoice) {
      console.log('❌ No hay facturas para probar')
      return
    }

    console.log(`📋 Factura encontrada: ${invoice.invoiceNumber} - Estado actual: ${invoice.status}`)

    // Simular la actualización directamente en la base de datos
    console.log('🔄 Simulando actualización a PAID...')
    
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { 
        status: 'PAID',
        paidAt: new Date()
      },
      include: {
        patient: {
          select: {
            name: true
          }
        }
      }
    })

    console.log('✅ Actualización exitosa:')
    console.log(`- ID: ${updatedInvoice.id}`)
    console.log(`- Número: ${updatedInvoice.invoiceNumber}`)
    console.log(`- Estado: ${updatedInvoice.status}`)
    console.log(`- Paciente: ${updatedInvoice.patient.name}`)
    console.log(`- Fecha de pago: ${updatedInvoice.paidAt?.toLocaleDateString()}`)

    // Probar otro cambio
    console.log('\n🔄 Cambiando a CANCELLED...')
    
    const cancelledInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { 
        status: 'CANCELLED',
        paidAt: null
      }
    })

    console.log(`✅ Estado cambiado a: ${cancelledInvoice.status}`)

    // Volver a PENDING
    console.log('\n🔄 Volviendo a PENDING...')
    
    const pendingInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { 
        status: 'PENDING',
        paidAt: null
      }
    })

    console.log(`✅ Estado final: ${pendingInvoice.status}`)

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testInvoiceAPI()

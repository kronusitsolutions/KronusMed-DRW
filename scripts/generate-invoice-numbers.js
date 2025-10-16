const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Función para generar el siguiente número de factura
function generateNextInvoiceNumber(lastNumber) {
  if (!lastNumber) {
    return 'INV-0000001'
  }

  // Extraer el número después de "INV-"
  const numberPart = lastNumber.substring(4)
  const nextNumber = parseInt(numberPart) + 1
  
  // Formatear con 8 dígitos
  const formattedNumber = nextNumber.toString().padStart(8, '0')
  
  return `INV-${formattedNumber}`
}

async function generateInvoiceNumbers() {
  try {
    console.log('🔧 Generando números de factura con formato INV-0000000...')

    // Obtener todas las facturas
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`📊 Total de facturas: ${invoices.length}`)

    if (invoices.length === 0) {
      console.log('❌ No hay facturas para asignar números')
      return
    }

    // Encontrar el último número asignado entre las facturas existentes
    let nextNumber = 'INV-00000001'
    // Aceptar tanto 7 como 8 dígitos para migración
    const invoicesWithNumbers = invoices.filter(inv => inv.invoiceNumber && /^INV-\d{7,8}$/.test(inv.invoiceNumber))
    
    if (invoicesWithNumbers.length > 0) {
      const lastInvoice = invoicesWithNumbers.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber))[0]
      nextNumber = generateNextInvoiceNumber(lastInvoice.invoiceNumber)
    }

    console.log(`🔢 Próximo número a asignar: ${nextNumber}`)

    // Asignar números a cada factura que no tenga uno
    let assignedCount = 0
    for (const invoice of invoices) {
      // Verificar si ya tiene un número válido (formato INV-0000000)
      if (invoice.invoiceNumber && /^INV-\d{7}$/.test(invoice.invoiceNumber)) {
        console.log(`✅ Factura ${invoice.id} ya tiene número: ${invoice.invoiceNumber}`)
        continue
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { invoiceNumber: nextNumber }
      })

      console.log(`✅ Factura ${invoice.id} - Número asignado: ${nextNumber}`)
      nextNumber = generateNextInvoiceNumber(nextNumber)
      assignedCount++
    }

    if (assignedCount === 0) {
      console.log('✅ Todas las facturas ya tienen números válidos')
    } else {
      console.log(`\n🎉 ${assignedCount} números de factura generados exitosamente`)
    }

    // Mostrar resumen
    const allInvoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        invoiceNumber: 'asc'
      }
    })

    console.log('\n📋 Resumen de facturas:')
    allInvoices.forEach((invoice, index) => {
      console.log(`${index + 1}. ${invoice.invoiceNumber} - $${invoice.totalAmount} - ${invoice.status} - ${invoice.createdAt.toLocaleDateString()}`)
    })

  } catch (error) {
    console.error('❌ Error al generar números de factura:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateInvoiceNumbers()

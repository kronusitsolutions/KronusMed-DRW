const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function to8Digits(numberStr) {
  const numeric = parseInt(numberStr, 10)
  if (Number.isNaN(numeric)) return null
  return numeric.toString().padStart(8, '0')
}

async function run() {
  try {
    console.log('🔄 Migrando invoiceNumber a formato INV-00000001 (8 dígitos) ...')

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, invoiceNumber: true }
    })

    let updates = 0
    for (const inv of invoices) {
      if (!inv.invoiceNumber || !inv.invoiceNumber.startsWith('INV-')) continue
      const numPart = inv.invoiceNumber.slice(4)
      if (/^\d{8}$/.test(numPart)) continue // ya correcto
      if (!/^\d+$/.test(numPart)) continue

      const newNum = to8Digits(numPart)
      if (!newNum) continue

      const newInvoiceNumber = `INV-${newNum}`
      if (newInvoiceNumber === inv.invoiceNumber) continue

      await prisma.invoice.update({
        where: { id: inv.id },
        data: { invoiceNumber: newInvoiceNumber }
      })
      updates++
      console.log(`✅ ${inv.invoiceNumber} -> ${newInvoiceNumber}`)
    }

    console.log(`\n🎉 Migración completada. Registros actualizados: ${updates}`)
  } catch (e) {
    console.error('❌ Error en migración:', e)
  } finally {
    await prisma.$disconnect()
  }
}

run()

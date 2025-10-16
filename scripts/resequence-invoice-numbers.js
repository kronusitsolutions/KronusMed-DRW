const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function makeNumber(n) {
  return `INV-${String(n).padStart(8, '0')}`
}

async function run() {
  try {
    console.log('🔧 Resequenciando invoiceNumber → INV-00000001 ...')

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, invoiceNumber: true, createdAt: true }
    })

    let updates = 0
    for (let i = 0; i < invoices.length; i++) {
      const target = makeNumber(i + 1)
      const inv = invoices[i]
      if (inv.invoiceNumber === target) continue

      await prisma.invoice.update({
        where: { id: inv.id },
        data: { invoiceNumber: target }
      })
      updates++
      console.log(`✅ ${inv.invoiceNumber} -> ${target}`)
    }

    console.log(`\n🎉 Listo. Total actualizados: ${updates}. Total facturas: ${invoices.length}`)
  } catch (e) {
    console.error('❌ Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

run()

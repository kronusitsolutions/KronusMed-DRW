const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function run() {
  try {
    const inv = await prisma.invoice.findMany({
      orderBy: { invoiceNumber: 'asc' },
      select: { id: true, invoiceNumber: true, totalAmount: true }
    })
    console.log(inv)
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

run()

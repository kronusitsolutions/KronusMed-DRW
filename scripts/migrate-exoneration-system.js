const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateExonerationSystem() {
  try {
    console.log('🔄 Iniciando migración del sistema de exoneraciones...')
    
    // Verificar si ya existen exoneraciones
    const existingExonerations = await prisma.invoiceExoneration.count()
    
    if (existingExonerations > 0) {
      console.log(`📋 Ya existen ${existingExonerations} exoneraciones en el sistema`)
      console.log('✅ Sistema de exoneraciones ya está configurado')
      return
    }

    // Buscar facturas que ya están marcadas como exoneradas
    const exoneratedInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { status: 'PAID' },
          { notes: { contains: 'EXONERADA' } }
        ],
        insuranceCalculation: {
          path: ['isExonerated'],
          equals: true
        }
      },
      include: {
        items: {
          include: {
            service: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`📋 Encontradas ${exoneratedInvoices.length} facturas exoneradas para migrar`)

    // Migrar facturas exoneradas existentes
    for (const invoice of exoneratedInvoices) {
      try {
        console.log(`🔄 Migrando factura ${invoice.invoiceNumber}...`)
        
        // Crear registro de exoneración
        await prisma.invoiceExoneration.create({
          data: {
            invoiceId: invoice.id,
            originalAmount: invoice.totalAmount,
            exoneratedAmount: invoice.totalAmount,
            reason: 'Migración automática - Factura previamente exonerada',
            authorizedBy: invoice.userId,
            notes: 'Migrado automáticamente del sistema anterior',
            isPrinted: false
          }
        })

        console.log(`✅ Factura ${invoice.invoiceNumber} migrada exitosamente`)
      } catch (error) {
        console.error(`❌ Error migrando factura ${invoice.invoiceNumber}:`, error.message)
      }
    }

    // Obtener estadísticas finales
    const finalCount = await prisma.invoiceExoneration.count()
    const totalExonerated = await prisma.invoiceExoneration.aggregate({
      _sum: {
        exoneratedAmount: true
      }
    })

    console.log('✅ Migración completada exitosamente!')
    console.log('📊 Estadísticas:')
    console.log(`  • Exoneraciones migradas: ${finalCount}`)
    console.log(`  • Total exonerado: $${totalExonerated._sum.exoneratedAmount?.toFixed(2) || '0.00'}`)
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
migrateExonerationSystem()

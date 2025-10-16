/**
 * Script para probar que los datos de ventas diarias incluyan correctamente los montos pagados y pendientes
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testDailySalesData() {
  console.log('🧪 Probando datos de ventas diarias...')
  
  try {
    // 1. Verificar datos en la base de datos
    console.log('\n1️⃣ Verificando datos en la base de datos...')
    
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        patient: {
          select: {
            name: true,
            patientNumber: true
          }
        },
        user: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            service: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`📊 Encontradas ${todayInvoices.length} facturas del día`)
    
    todayInvoices.forEach((invoice, index) => {
      console.log(`\n📋 Factura ${index + 1}: ${invoice.invoiceNumber}`)
      console.log(`   - Paciente: ${invoice.patient.name}`)
      console.log(`   - Estado: ${invoice.status}`)
      console.log(`   - Total: $${invoice.totalAmount.toFixed(2)}`)
      console.log(`   - Pagado: $${(invoice.paidAmount || 0).toFixed(2)}`)
      console.log(`   - Pendiente: $${(invoice.pendingAmount || 0).toFixed(2)}`)
      
      if (invoice.status === 'PARTIAL') {
        console.log(`   - ✅ Es una factura parcial`)
        const totalPaidAndPending = (invoice.paidAmount || 0) + (invoice.pendingAmount || 0)
        console.log(`   - Verificación: ${(invoice.paidAmount || 0).toFixed(2)} + ${(invoice.pendingAmount || 0).toFixed(2)} = ${totalPaidAndPending.toFixed(2)}`)
        console.log(`   - Debe ser igual a: ${invoice.totalAmount.toFixed(2)}`)
        
        if (Math.abs(totalPaidAndPending - invoice.totalAmount) < 0.01) {
          console.log(`   ✅ Cálculos correctos`)
        } else {
          console.log(`   ❌ Error en cálculos`)
        }
      }
    })
    
    // 2. Probar la API de ventas diarias
    console.log('\n2️⃣ Probando API de ventas diarias...')
    
    const todayStr = today.toISOString().split('T')[0]
    const response = await fetch(`http://localhost:3000/api/reports/daily-sales?date=${todayStr}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Error en API: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log('\n📈 Resumen de la API:')
    console.log(`   - Total facturado: $${data.summary.totalFacturado.toFixed(2)}`)
    console.log(`   - Facturas pagadas: ${data.summary.facturasPagadas}`)
    console.log(`   - Facturas pendientes: ${data.summary.facturasPendientes}`)
    console.log(`   - Facturas parciales: ${data.summary.facturasParciales}`)
    console.log(`   - Monto parcial pagado: $${data.summary.montoParcialPagado.toFixed(2)}`)
    console.log(`   - Monto parcial pendiente: $${data.summary.montoParcialPendiente.toFixed(2)}`)
    
    console.log('\n📋 Facturas individuales:')
    data.invoices.forEach((invoice, index) => {
      console.log(`\n📄 Factura ${index + 1}: ${invoice.invoiceNumber}`)
      console.log(`   - Paciente: ${invoice.patientName}`)
      console.log(`   - Estado: ${invoice.status}`)
      console.log(`   - Total: $${invoice.totalAmount.toFixed(2)}`)
      console.log(`   - Pagado: $${(invoice.paidAmount || 0).toFixed(2)}`)
      console.log(`   - Pendiente: $${(invoice.pendingAmount || 0).toFixed(2)}`)
      
      if (invoice.status === 'PARTIAL') {
        console.log(`   - ✅ Es una factura parcial`)
        const totalPaidAndPending = (invoice.paidAmount || 0) + (invoice.pendingAmount || 0)
        console.log(`   - Verificación: ${(invoice.paidAmount || 0).toFixed(2)} + ${(invoice.pendingAmount || 0).toFixed(2)} = ${totalPaidAndPending.toFixed(2)}`)
        console.log(`   - Debe ser igual a: ${invoice.totalAmount.toFixed(2)}`)
        
        if (Math.abs(totalPaidAndPending - invoice.totalAmount) < 0.01) {
          console.log(`   ✅ Cálculos correctos en la API`)
        } else {
          console.log(`   ❌ Error en cálculos en la API`)
        }
      }
    })
    
    // 3. Verificar que los datos coinciden
    console.log('\n3️⃣ Verificando consistencia...')
    
    const dbPartialInvoices = todayInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const apiPartialInvoices = data.invoices.filter(invoice => invoice.status === 'PARTIAL')
    
    console.log(`📊 Facturas parciales en BD: ${dbPartialInvoices.length}`)
    console.log(`📊 Facturas parciales en API: ${apiPartialInvoices.length}`)
    
    if (dbPartialInvoices.length === apiPartialInvoices.length) {
      console.log('✅ Cantidad de facturas parciales coincide')
    } else {
      console.log('❌ Error en cantidad de facturas parciales')
    }
    
    // Verificar montos
    const dbTotalPaid = dbPartialInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0)
    const apiTotalPaid = apiPartialInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0)
    
    const dbTotalPending = dbPartialInvoices.reduce((sum, invoice) => sum + (invoice.pendingAmount || 0), 0)
    const apiTotalPending = apiPartialInvoices.reduce((sum, invoice) => sum + (invoice.pendingAmount || 0), 0)
    
    console.log(`💰 Total pagado en BD: $${dbTotalPaid.toFixed(2)}`)
    console.log(`💰 Total pagado en API: $${apiTotalPaid.toFixed(2)}`)
    console.log(`⏳ Total pendiente en BD: $${dbTotalPending.toFixed(2)}`)
    console.log(`⏳ Total pendiente en API: $${apiTotalPending.toFixed(2)}`)
    
    if (Math.abs(dbTotalPaid - apiTotalPaid) < 0.01 && Math.abs(dbTotalPending - apiTotalPending) < 0.01) {
      console.log('✅ Montos coinciden entre BD y API')
    } else {
      console.log('❌ Error en montos entre BD y API')
    }
    
    console.log('\n🎉 ¡Pruebas de datos de ventas diarias completadas!')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testDailySalesData()
    .then(() => {
      console.log('✅ Script de pruebas ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas:', error)
      process.exit(1)
    })
}

module.exports = { testDailySalesData }

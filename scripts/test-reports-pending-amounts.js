/**
 * Script para probar que los reportes incluyan correctamente los montos pendientes
 * Verifica que las APIs de reportes reflejen las facturas parciales
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testReportsPendingAmounts() {
  console.log('🧪 Probando reportes con montos pendientes...')
  
  try {
    // 1. Verificar datos en la base de datos
    console.log('\n1️⃣ Verificando datos en la base de datos...')
    
    const invoiceStats = await prisma.invoice.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        pendingAmount: true
      }
    })
    
    console.log('📊 Estadísticas por estado:')
    invoiceStats.forEach(stat => {
      console.log(`   ${stat.status}:`)
      console.log(`     - Cantidad: ${stat._count.status}`)
      console.log(`     - Total: $${(stat._sum.totalAmount || 0).toFixed(2)}`)
      console.log(`     - Pagado: $${(stat._sum.paidAmount || 0).toFixed(2)}`)
      console.log(`     - Pendiente: $${(stat._sum.pendingAmount || 0).toFixed(2)}`)
    })
    
    // 2. Probar API de reporte comprehensivo
    console.log('\n2️⃣ Probando API de reporte comprehensivo...')
    
    const comprehensiveResponse = await fetch('http://localhost:3000/api/reports/comprehensive?period=6', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!comprehensiveResponse.ok) {
      throw new Error(`Error en API comprehensiva: ${comprehensiveResponse.status} ${comprehensiveResponse.statusText}`)
    }
    
    const comprehensiveData = await comprehensiveResponse.json()
    
    console.log('📈 Reporte comprehensivo:')
    console.log(`   - Facturas pagadas: ${comprehensiveData.financial.paidInvoices}`)
    console.log(`   - Facturas pendientes: ${comprehensiveData.financial.pendingInvoices}`)
    console.log(`   - Facturas parciales: ${comprehensiveData.financial.partialInvoices || 'No disponible'}`)
    console.log(`   - Ingresos parciales: $${(comprehensiveData.financial.partialRevenue || 0).toFixed(2)}`)
    console.log(`   - Pendiente parcial: $${(comprehensiveData.financial.partialPendingRevenue || 0).toFixed(2)}`)
    
    if (comprehensiveData.global) {
      console.log('\n📊 Estadísticas globales:')
      console.log(`   - Facturas pagadas: ${comprehensiveData.global.paidInvoices}`)
      console.log(`   - Facturas pendientes: ${comprehensiveData.global.pendingInvoices}`)
      console.log(`   - Facturas parciales: ${comprehensiveData.global.partialInvoices || 'No disponible'}`)
      console.log(`   - Ingresos parciales: $${(comprehensiveData.global.totalPartialRevenue || 0).toFixed(2)}`)
      console.log(`   - Pendiente parcial: $${(comprehensiveData.global.totalPartialPendingRevenue || 0).toFixed(2)}`)
    }
    
    // 3. Probar API de ventas diarias
    console.log('\n3️⃣ Probando API de ventas diarias...')
    
    const today = new Date().toISOString().split('T')[0]
    const dailyResponse = await fetch(`http://localhost:3000/api/reports/daily-sales?date=${today}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!dailyResponse.ok) {
      throw new Error(`Error en API diaria: ${dailyResponse.status} ${dailyResponse.statusText}`)
    }
    
    const dailyData = await dailyResponse.json()
    
    console.log('📅 Ventas diarias:')
    console.log(`   - Total facturado: $${dailyData.summary.totalFacturado.toFixed(2)}`)
    console.log(`   - Facturas pagadas: ${dailyData.summary.facturasPagadas}`)
    console.log(`   - Facturas pendientes: ${dailyData.summary.facturasPendientes}`)
    console.log(`   - Facturas parciales: ${dailyData.summary.facturasParciales || 'No disponible'}`)
    console.log(`   - Monto parcial pagado: $${(dailyData.summary.montoParcialPagado || 0).toFixed(2)}`)
    console.log(`   - Monto parcial pendiente: $${(dailyData.summary.montoParcialPendiente || 0).toFixed(2)}`)
    
    // 4. Verificar que los cálculos son correctos
    console.log('\n4️⃣ Verificando cálculos...')
    
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })
    
    const todayPendientes = todayInvoices.filter(invoice => 
      invoice.status === 'PENDING' || invoice.status === 'PARTIAL'
    )
    const todayPendientesTotal = todayInvoices.filter(invoice => invoice.status === 'PENDING')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0) +
      todayInvoices.filter(invoice => invoice.status === 'PARTIAL')
      .reduce((sum, invoice) => sum + (invoice.pendingAmount || 0), 0)
    
    const todayParciales = todayInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const todayParcialesTotal = todayParciales.reduce((sum, invoice) => {
      return sum + (invoice.paidAmount || 0)
    }, 0)
    const todayParcialesPendiente = todayParciales.reduce((sum, invoice) => {
      return sum + (invoice.pendingAmount || 0)
    }, 0)
    
    console.log('✅ Verificación de cálculos:')
    console.log(`   - Facturas pendientes/parciales del día: ${todayPendientes.length}`)
    console.log(`   - Monto pendiente del día: $${todayPendientesTotal.toFixed(2)}`)
    console.log(`   - Facturas parciales del día: ${todayParciales.length}`)
    console.log(`   - Monto pagado parcialmente del día: $${todayParcialesTotal.toFixed(2)}`)
    console.log(`   - Monto pendiente parcial del día: $${todayParcialesPendiente.toFixed(2)}`)
    
    // Verificar que coinciden con la API
    if (dailyData.summary.facturasPendientes === todayInvoices.filter(i => i.status === 'PENDING').length && 
        Math.abs(dailyData.summary.totalPendiente - todayPendientesTotal) < 0.01) {
      console.log('✅ Cálculos de facturas pendientes coinciden')
    } else {
      console.log('❌ Error en cálculos de facturas pendientes')
    }
    
    if (dailyData.summary.facturasParciales === todayParciales.length && 
        Math.abs((dailyData.summary.montoParcialPagado || 0) - todayParcialesTotal) < 0.01) {
      console.log('✅ Cálculos de facturas parciales coinciden')
    } else {
      console.log('❌ Error en cálculos de facturas parciales')
    }
    
    console.log('\n🎉 ¡Pruebas de reportes completadas exitosamente!')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testReportsPendingAmounts()
    .then(() => {
      console.log('✅ Script de pruebas ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas:', error)
      process.exit(1)
    })
}

module.exports = { testReportsPendingAmounts }

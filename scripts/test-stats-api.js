/**
 * Script para probar la API de estadísticas de facturas
 * Verifica que los datos se reflejen correctamente
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testStatsAPI() {
  console.log('🧪 Probando API de estadísticas de facturas...')
  
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
    
    // 2. Probar la API de estadísticas
    console.log('\n2️⃣ Probando API de estadísticas...')
    
    const response = await fetch('http://localhost:3000/api/invoices/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Error en API: ${response.status} ${response.statusText}`)
    }
    
    const stats = await response.json()
    
    console.log('📈 Estadísticas del día:')
    console.log(`   - Total facturas: ${stats.totalInvoices}`)
    console.log(`   - Total facturado: $${stats.totalFacturado.toFixed(2)}`)
    console.log(`   - Exoneradas: ${stats.exoneradasCount} ($${stats.exoneradasTotal.toFixed(2)})`)
    console.log(`   - Pendientes: ${stats.pendientesCount} ($${stats.pendientesTotal.toFixed(2)})`)
    console.log(`   - Parciales: ${stats.parcialesCount} ($${stats.parcialesTotal.toFixed(2)})`)
    
    console.log('\n📊 Estadísticas globales:')
    console.log(`   - Total facturas: ${stats.global.totalInvoices}`)
    console.log(`   - Total facturado: $${stats.global.totalFacturado.toFixed(2)}`)
    console.log(`   - Exoneradas: ${stats.global.exoneradasCount} ($${stats.global.exoneradasTotal.toFixed(2)})`)
    console.log(`   - Pendientes: ${stats.global.pendientesCount} ($${stats.global.pendientesTotal.toFixed(2)})`)
    console.log(`   - Parciales: ${stats.global.parcialesCount} ($${stats.global.parcialesTotal.toFixed(2)})`)
    
    // 3. Verificar que los cálculos son correctos
    console.log('\n3️⃣ Verificando cálculos...')
    
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })
    
    const todayPendientes = todayInvoices.filter(invoice => 
      invoice.status === 'PENDING' || invoice.status === 'PARTIAL'
    )
    const todayPendientesTotal = todayPendientes.reduce((sum, invoice) => {
      return sum + (invoice.pendingAmount || invoice.totalAmount)
    }, 0)
    
    const todayParciales = todayInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const todayParcialesTotal = todayParciales.reduce((sum, invoice) => {
      return sum + (invoice.paidAmount || 0)
    }, 0)
    
    console.log('✅ Verificación de cálculos:')
    console.log(`   - Facturas pendientes/parciales del día: ${todayPendientes.length}`)
    console.log(`   - Monto pendiente del día: $${todayPendientesTotal.toFixed(2)}`)
    console.log(`   - Facturas parciales del día: ${todayParciales.length}`)
    console.log(`   - Monto pagado parcialmente del día: $${todayParcialesTotal.toFixed(2)}`)
    
    // Verificar que coinciden con la API
    if (stats.pendientesCount === todayPendientes.length && 
        Math.abs(stats.pendientesTotal - todayPendientesTotal) < 0.01) {
      console.log('✅ Cálculos de facturas pendientes coinciden')
    } else {
      console.log('❌ Error en cálculos de facturas pendientes')
    }
    
    if (stats.parcialesCount === todayParciales.length && 
        Math.abs(stats.parcialesTotal - todayParcialesTotal) < 0.01) {
      console.log('✅ Cálculos de facturas parciales coinciden')
    } else {
      console.log('❌ Error en cálculos de facturas parciales')
    }
    
    console.log('\n🎉 ¡Pruebas de estadísticas completadas exitosamente!')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testStatsAPI()
    .then(() => {
      console.log('✅ Script de pruebas ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas:', error)
      process.exit(1)
    })
}

module.exports = { testStatsAPI }

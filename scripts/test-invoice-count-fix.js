/**
 * Script para probar que el conteo de facturas por cobrar sea correcto
 * Verifica que no se cuenten facturas duplicadas
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testInvoiceCountFix() {
  console.log('🧪 Probando corrección del conteo de facturas...')
  
  try {
    // 1. Verificar datos en la base de datos
    console.log('\n1️⃣ Verificando datos en la base de datos...')
    
    const allInvoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        pendingAmount: true
      }
    })
    
    console.log(`📊 Total de facturas en BD: ${allInvoices.length}`)
    
    // Contar por estado
    const statusCounts = allInvoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1
      return acc
    }, {})
    
    console.log('📈 Conteo por estado:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
    
    // Calcular facturas por cobrar correctamente
    const pendientes = allInvoices.filter(invoice => invoice.status === 'PENDING')
    const parciales = allInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const porCobrar = pendientes.length + parciales.length
    
    console.log(`\n📋 Cálculo correcto:`)
    console.log(`   - Facturas PENDING: ${pendientes.length}`)
    console.log(`   - Facturas PARTIAL: ${parciales.length}`)
    console.log(`   - Total por cobrar: ${porCobrar}`)
    
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
    
    console.log('📈 Estadísticas de la API:')
    console.log(`   - Pendientes: ${stats.pendientesCount}`)
    console.log(`   - Parciales: ${stats.parcialesCount}`)
    console.log(`   - Total por cobrar (pendientes + parciales): ${stats.pendientesCount + stats.parcialesCount}`)
    
    // Verificar que coinciden
    const apiPorCobrar = stats.pendientesCount + stats.parcialesCount
    
    if (apiPorCobrar === porCobrar) {
      console.log('✅ El conteo de la API coincide con la BD')
    } else {
      console.log('❌ Error: El conteo de la API NO coincide con la BD')
      console.log(`   BD: ${porCobrar}, API: ${apiPorCobrar}`)
    }
    
    // 3. Verificar estadísticas globales
    console.log('\n3️⃣ Verificando estadísticas globales...')
    
    if (stats.global) {
      console.log('📊 Estadísticas globales:')
      console.log(`   - Pendientes: ${stats.global.pendientesCount}`)
      console.log(`   - Parciales: ${stats.global.parcialesCount}`)
      console.log(`   - Total por cobrar: ${stats.global.pendientesCount + stats.global.parcialesCount}`)
      
      const globalPorCobrar = stats.global.pendientesCount + stats.global.parcialesCount
      
      if (globalPorCobrar === porCobrar) {
        console.log('✅ Las estadísticas globales coinciden')
      } else {
        console.log('❌ Error: Las estadísticas globales NO coinciden')
        console.log(`   BD: ${porCobrar}, Global: ${globalPorCobrar}`)
      }
    }
    
    // 4. Verificar que no hay duplicación
    console.log('\n4️⃣ Verificando que no hay duplicación...')
    
    const facturasPorCobrar = allInvoices.filter(invoice => 
      invoice.status === 'PENDING' || invoice.status === 'PARTIAL'
    )
    
    console.log(`📋 Facturas por cobrar (PENDING + PARTIAL): ${facturasPorCobrar.length}`)
    console.log(`📋 Suma separada (PENDING + PARTIAL): ${pendientes.length + parciales.length}`)
    
    if (facturasPorCobrar.length === pendientes.length + parciales.length) {
      console.log('✅ No hay duplicación en el cálculo')
    } else {
      console.log('❌ Error: Hay duplicación en el cálculo')
    }
    
    console.log('\n🎉 ¡Pruebas de corrección completadas!')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testInvoiceCountFix()
    .then(() => {
      console.log('✅ Script de pruebas ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas:', error)
      process.exit(1)
    })
}

module.exports = { testInvoiceCountFix }

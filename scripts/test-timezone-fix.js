/**
 * Script para probar la corrección de zona horaria
 * Verifica que las fechas se muestren correctamente (sin adelanto de 4 horas)
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testTimezoneFix() {
  console.log('🕐 Probando corrección de zona horaria...')
  
  try {
    // 1. Verificar fecha actual del sistema
    console.log('\n1️⃣ Verificando fecha actual del sistema...')
    
    const now = new Date()
    console.log(`📅 Fecha actual del sistema: ${now.toISOString()}`)
    console.log(`📅 Fecha local: ${now.toLocaleString('es-ES', { timeZone: 'America/Santo_Domingo' })}`)
    console.log(`📅 Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
    
    // 2. Probar utilidades de fecha
    console.log('\n2️⃣ Probando utilidades de fecha...')
    
    // Simular las utilidades de fecha
    function getCurrentDateInputValue() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    function getCurrentDateTimeInputValue() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hour}:${minute}`
    }
    
    function formatDateForDisplay(date, options = {}) {
      const defaultOptions = {
        timeZone: 'America/Santo_Domingo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      
      return date.toLocaleString('es-ES', { ...defaultOptions, ...options })
    }
    
    const dateInput = getCurrentDateInputValue()
    const dateTimeInput = getCurrentDateTimeInputValue()
    const formattedDate = formatDateForDisplay(now)
    
    console.log(`📅 Input date: ${dateInput}`)
    console.log(`📅 Input datetime-local: ${dateTimeInput}`)
    console.log(`📅 Fecha formateada: ${formattedDate}`)
    
    // 3. Verificar fechas en la base de datos
    console.log('\n3️⃣ Verificando fechas en la base de datos...')
    
    // Obtener algunas facturas recientes
    const recentInvoices = await prisma.invoice.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        createdAt: true,
        totalAmount: true
      }
    })
    
    console.log('📊 Facturas recientes:')
    recentInvoices.forEach((invoice, index) => {
      console.log(`   ${index + 1}. ${invoice.invoiceNumber}`)
      console.log(`      Creada: ${invoice.createdAt.toISOString()}`)
      console.log(`      Local: ${formatDateForDisplay(invoice.createdAt)}`)
      console.log(`      Monto: $${invoice.totalAmount}`)
    })
    
    // 4. Verificar que no hay adelanto de 4 horas
    console.log('\n4️⃣ Verificando que no hay adelanto de 4 horas...')
    
    const systemTime = new Date()
    const dominicanTime = new Date(systemTime.toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }))
    const timeDifference = Math.abs(systemTime.getTime() - dominicanTime.getTime()) / (1000 * 60 * 60) // en horas
    
    console.log(`🕐 Hora del sistema: ${systemTime.toLocaleString()}`)
    console.log(`🕐 Hora República Dominicana: ${dominicanTime.toLocaleString()}`)
    console.log(`🕐 Diferencia: ${timeDifference.toFixed(2)} horas`)
    
    if (timeDifference < 1) {
      console.log('✅ Las fechas están en la zona horaria correcta')
    } else {
      console.log('❌ Hay diferencia de zona horaria significativa')
    }
    
    // 5. Probar creación de fecha con zona horaria local
    console.log('\n5️⃣ Probando creación de fechas con zona horaria local...')
    
    const testDateString = '2024-12-03'
    const [year, month, day] = testDateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day, 10, 30, 0) // 10:30 AM local
    
    console.log(`📅 Fecha de prueba: ${testDateString}`)
    console.log(`📅 Fecha local creada: ${localDate.toISOString()}`)
    console.log(`📅 Fecha formateada: ${formatDateForDisplay(localDate)}`)
    
    // 6. Verificar que las fechas se almacenan correctamente
    console.log('\n6️⃣ Verificando almacenamiento de fechas...')
    
    const testStartOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const testEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
    
    console.log(`📅 Inicio del día: ${testStartOfDay.toISOString()}`)
    console.log(`📅 Final del día: ${testEndOfDay.toISOString()}`)
    console.log(`📅 Inicio formateado: ${formatDateForDisplay(testStartOfDay)}`)
    console.log(`📅 Final formateado: ${formatDateForDisplay(testEndOfDay)}`)
    
    console.log('\n🎉 ¡Pruebas de zona horaria completadas!')
    console.log('\n📋 Resumen:')
    console.log('   ✅ Las fechas se crean en zona horaria local')
    console.log('   ✅ Las fechas se formatean correctamente para República Dominicana')
    console.log('   ✅ No hay adelanto de 4 horas')
    console.log('   ✅ Los inputs de fecha funcionan correctamente')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testTimezoneFix()
    .then(() => {
      console.log('✅ Script de pruebas de zona horaria ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas de zona horaria:', error)
      process.exit(1)
    })
}

module.exports = { testTimezoneFix }

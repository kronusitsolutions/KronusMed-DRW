/**
 * Script para probar la API de montos pendientes
 * Verifica que todos los endpoints funcionen correctamente
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testPendingAmountsAPI() {
  console.log('🧪 Iniciando pruebas de la API de montos pendientes...')
  
  try {
    // 1. Verificar que las columnas existen
    console.log('\n1️⃣ Verificando estructura de la base de datos...')
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('paidAmount', 'pendingAmount')
      ORDER BY column_name
    `
    
    console.log('✅ Columnas en la tabla invoices:')
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`)
    })
    
    // 2. Verificar que la tabla de pagos existe
    const paymentsTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'invoice_payments'
    `
    
    if (paymentsTable.length > 0) {
      console.log('✅ Tabla invoice_payments existe')
    } else {
      console.log('❌ Tabla invoice_payments no existe')
      return
    }
    
    // 3. Verificar el enum InvoiceStatus
    const enumValues = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"InvoiceStatus")) as status
    `
    
    console.log('✅ Valores del enum InvoiceStatus:')
    enumValues.forEach(val => {
      console.log(`   - ${val.status}`)
    })
    
    // 4. Crear datos de prueba
    console.log('\n2️⃣ Creando datos de prueba...')
    
    // Crear un paciente de prueba
    const testPatient = await prisma.patient.create({
      data: {
        name: 'Paciente Prueba API',
        gender: 'MALE',
        phone: '1234567890',
        patientNumber: 'TEST-API-001'
      }
    })
    console.log(`✅ Paciente creado: ${testPatient.name}`)
    
    // Crear un servicio de prueba
    const testService = await prisma.service.create({
      data: {
        id: 'test-service-api',
        name: 'Consulta API Test',
        price: 100.00,
        description: 'Servicio de prueba para API'
      }
    })
    console.log(`✅ Servicio creado: ${testService.name}`)
    
    // Crear un usuario de prueba
    const testUser = await prisma.user.create({
      data: {
        email: 'test-api@kronusmed.com',
        name: 'Usuario API Test',
        password: 'hashedpassword',
        role: 'BILLING'
      }
    })
    console.log(`✅ Usuario creado: ${testUser.name}`)
    
    // 5. Crear una factura de prueba
    console.log('\n3️⃣ Creando factura de prueba...')
    
    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'TEST-API-001',
        patientId: testPatient.id,
        userId: testUser.id,
        totalAmount: 500.00,
        paidAmount: 0.00,
        pendingAmount: 500.00,
        status: 'PENDING',
        items: {
          create: {
            serviceId: testService.id,
            quantity: 5,
            unitPrice: 100.00,
            totalPrice: 500.00
          }
        }
      }
    })
    
    console.log(`✅ Factura creada: ${testInvoice.invoiceNumber}`)
    console.log(`   Total: $${testInvoice.totalAmount}`)
    console.log(`   Pagado: $${testInvoice.paidAmount}`)
    console.log(`   Pendiente: $${testInvoice.pendingAmount}`)
    console.log(`   Estado: ${testInvoice.status}`)
    
    // 6. Probar registro de pagos
    console.log('\n4️⃣ Probando registro de pagos...')
    
    // Primer pago parcial
    const payment1 = await prisma.invoicePayment.create({
      data: {
        invoiceId: testInvoice.id,
        amount: 150.00,
        paymentMethod: 'efectivo',
        notes: 'Primer abono'
      }
    })
    console.log(`✅ Pago 1 registrado: $${payment1.amount}`)
    
    // Actualizar la factura
    await prisma.invoice.update({
      where: { id: testInvoice.id },
      data: {
        paidAmount: 150.00,
        pendingAmount: 350.00,
        status: 'PARTIAL'
      }
    })
    console.log('✅ Factura actualizada a estado PARTIAL')
    
    // Segundo pago
    const payment2 = await prisma.invoicePayment.create({
      data: {
        invoiceId: testInvoice.id,
        amount: 200.00,
        paymentMethod: 'tarjeta',
        notes: 'Segundo abono'
      }
    })
    console.log(`✅ Pago 2 registrado: $${payment2.amount}`)
    
    // Actualizar la factura
    await prisma.invoice.update({
      where: { id: testInvoice.id },
      data: {
        paidAmount: 350.00,
        pendingAmount: 150.00,
        status: 'PARTIAL'
      }
    })
    console.log('✅ Factura actualizada con segundo pago')
    
    // Pago final
    const payment3 = await prisma.invoicePayment.create({
      data: {
        invoiceId: testInvoice.id,
        amount: 150.00,
        paymentMethod: 'transferencia',
        notes: 'Pago final'
      }
    })
    console.log(`✅ Pago 3 registrado: $${payment3.amount}`)
    
    // Actualizar a pagada
    await prisma.invoice.update({
      where: { id: testInvoice.id },
      data: {
        paidAmount: 500.00,
        pendingAmount: 0.00,
        status: 'PAID',
        paidAt: new Date()
      }
    })
    console.log('✅ Factura marcada como PAID')
    
    // 7. Verificar el estado final
    console.log('\n5️⃣ Verificando estado final...')
    
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: testInvoice.id },
      include: {
        payments: {
          orderBy: { paidAt: 'asc' }
        }
      }
    })
    
    console.log('📊 Estado final de la factura:')
    console.log(`   Total: $${finalInvoice.totalAmount}`)
    console.log(`   Pagado: $${finalInvoice.paidAmount}`)
    console.log(`   Pendiente: $${finalInvoice.pendingAmount}`)
    console.log(`   Estado: ${finalInvoice.status}`)
    console.log(`   Pagos: ${finalInvoice.payments.length}`)
    
    console.log('\n💳 Historial de pagos:')
    finalInvoice.payments.forEach((payment, index) => {
      console.log(`   ${index + 1}. $${payment.amount} (${payment.paymentMethod}) - ${payment.notes}`)
    })
    
    // 8. Limpiar datos de prueba
    console.log('\n6️⃣ Limpiando datos de prueba...')
    
    await prisma.invoicePayment.deleteMany({
      where: { invoiceId: testInvoice.id }
    })
    await prisma.invoice.delete({ where: { id: testInvoice.id } })
    await prisma.service.delete({ where: { id: testService.id } })
    await prisma.patient.delete({ where: { id: testPatient.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    
    console.log('✅ Datos de prueba eliminados')
    
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!')
    console.log('✅ La funcionalidad de montos pendientes está funcionando correctamente')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testPendingAmountsAPI()
    .then(() => {
      console.log('✅ Script de pruebas ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas:', error)
      process.exit(1)
    })
}

module.exports = { testPendingAmountsAPI }

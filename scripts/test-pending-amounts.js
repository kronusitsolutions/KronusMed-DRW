/**
 * Script para probar la funcionalidad de montos pendientes
 * Este script crea facturas de prueba y registra pagos parciales
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPendingAmounts() {
  console.log('🧪 Iniciando pruebas de montos pendientes...')
  
  try {
    // Crear un paciente de prueba
    const testPatient = await prisma.patient.create({
      data: {
        name: 'Paciente Prueba Montos Pendientes',
        gender: 'MALE',
        phone: '1234567890',
        patientNumber: 'TEST001'
      }
    })
    
    console.log(`👤 Paciente de prueba creado: ${testPatient.name}`)
    
    // Crear un servicio de prueba
    const testService = await prisma.service.create({
      data: {
        id: 'test-service-pending',
        name: 'Consulta General - Prueba',
        price: 100.00,
        description: 'Servicio de prueba para montos pendientes'
      }
    })
    
    console.log(`🔧 Servicio de prueba creado: ${testService.name}`)
    
    // Crear un usuario de prueba
    const testUser = await prisma.user.create({
      data: {
        email: 'test-pending@kronusmed.com',
        name: 'Usuario Prueba',
        password: 'hashedpassword',
        role: 'BILLING'
      }
    })
    
    console.log(`👨‍💼 Usuario de prueba creado: ${testUser.name}`)
    
    // Crear una factura de prueba
    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'TEST-PENDING-001',
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
    
    console.log(`📄 Factura de prueba creada: ${testInvoice.invoiceNumber}`)
    console.log(`💰 Total: $${testInvoice.totalAmount}, Pendiente: $${testInvoice.pendingAmount}`)
    
    // Simular pagos parciales
    const payments = [
      { amount: 150.00, method: 'efectivo', notes: 'Primer abono' },
      { amount: 200.00, method: 'tarjeta', notes: 'Segundo abono' },
      { amount: 100.00, method: 'transferencia', notes: 'Tercer abono' }
    ]
    
    let currentPaidAmount = 0
    
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i]
      currentPaidAmount += payment.amount
      
      // Crear el pago
      await prisma.invoicePayment.create({
        data: {
          invoiceId: testInvoice.id,
          amount: payment.amount,
          paymentMethod: payment.method,
          notes: payment.notes
        }
      })
      
      // Actualizar la factura
      const newPendingAmount = testInvoice.totalAmount - currentPaidAmount
      const newStatus = newPendingAmount <= 0 ? 'PAID' : 'PARTIAL'
      
      await prisma.invoice.update({
        where: { id: testInvoice.id },
        data: {
          paidAmount: currentPaidAmount,
          pendingAmount: newPendingAmount,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : null
        }
      })
      
      console.log(`💳 Pago ${i + 1}: $${payment.amount} (${payment.method})`)
      console.log(`   Pagado: $${currentPaidAmount}, Pendiente: $${newPendingAmount}, Estado: ${newStatus}`)
    }
    
    // Verificar el estado final
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: testInvoice.id },
      include: {
        payments: {
          orderBy: { paidAt: 'asc' }
        }
      }
    })
    
    console.log('\n📊 Estado final de la factura:')
    console.log(`   Total: $${finalInvoice.totalAmount}`)
    console.log(`   Pagado: $${finalInvoice.paidAmount}`)
    console.log(`   Pendiente: $${finalInvoice.pendingAmount}`)
    console.log(`   Estado: ${finalInvoice.status}`)
    console.log(`   Pagos registrados: ${finalInvoice.payments.length}`)
    
    console.log('\n💳 Historial de pagos:')
    finalInvoice.payments.forEach((payment, index) => {
      console.log(`   ${index + 1}. $${payment.amount} (${payment.paymentMethod}) - ${payment.notes}`)
    })
    
    // Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    await prisma.invoicePayment.deleteMany({
      where: { invoiceId: testInvoice.id }
    })
    await prisma.invoice.delete({ where: { id: testInvoice.id } })
    await prisma.service.delete({ where: { id: testService.id } })
    await prisma.patient.delete({ where: { id: testPatient.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    
    console.log('✅ Datos de prueba eliminados')
    console.log('\n🎉 Pruebas de montos pendientes completadas exitosamente!')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testPendingAmounts()
    .then(() => {
      console.log('✅ Script de pruebas ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas:', error)
      process.exit(1)
    })
}

module.exports = { testPendingAmounts }

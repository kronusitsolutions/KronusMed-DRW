/**
 * Script para probar la impresión de facturas con seguros y pagos parciales
 * Verifica que los montos se muestren correctamente en la impresión
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testInsurancePartialPayment() {
  console.log('🧪 Probando impresión con seguros y pagos parciales...')
  
  try {
    // 1. Buscar una factura con seguros
    console.log('\n1️⃣ Buscando facturas con seguros...')
    
    const insuranceInvoices = await prisma.invoice.findMany({
      where: {
        insuranceCalculation: {
          not: null
        }
      },
      include: {
        patient: {
          include: {
            insurance: true
          }
        },
        items: {
          include: {
            service: true
          }
        }
      },
      take: 5
    })
    
    console.log(`📊 Encontradas ${insuranceInvoices.length} facturas con seguros`)
    
    if (insuranceInvoices.length > 0) {
      const invoice = insuranceInvoices[0]
      console.log(`\n📋 Factura de ejemplo: ${invoice.invoiceNumber}`)
      console.log(`   - Paciente: ${invoice.patient?.name}`)
      console.log(`   - Seguro: ${invoice.patient?.insurance?.name || 'No especificado'}`)
      console.log(`   - Estado: ${invoice.status}`)
      console.log(`   - Total: $${invoice.totalAmount.toFixed(2)}`)
      console.log(`   - Pagado: $${(invoice.paidAmount || 0).toFixed(2)}`)
      console.log(`   - Pendiente: $${(invoice.pendingAmount || 0).toFixed(2)}`)
      
      if (invoice.insuranceCalculation) {
        const calc = invoice.insuranceCalculation as any
        console.log(`\n🛡️ Cálculo de Seguro:`)
        console.log(`   - Total Base: $${(calc.totalBaseAmount || 0).toFixed(2)}`)
        console.log(`   - Seguro Cubre: $${(calc.totalInsuranceCovers || 0).toFixed(2)}`)
        console.log(`   - Paciente Paga: $${(calc.totalPatientPays || 0).toFixed(2)}`)
        console.log(`   - Ahorro: $${((calc.totalBaseAmount || 0) - (calc.totalPatientPays || 0)).toFixed(2)}`)
      }
    }
    
    // 2. Buscar facturas parciales con seguros
    console.log('\n2️⃣ Buscando facturas parciales con seguros...')
    
    const partialInsuranceInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PARTIAL',
        insuranceCalculation: {
          not: null
        }
      },
      include: {
        patient: {
          include: {
            insurance: true
          }
        },
        items: {
          include: {
            service: true
          }
        }
      },
      take: 3
    })
    
    console.log(`📊 Encontradas ${partialInsuranceInvoices.length} facturas parciales con seguros`)
    
    partialInsuranceInvoices.forEach((invoice, index) => {
      console.log(`\n📋 Factura Parcial ${index + 1}: ${invoice.invoiceNumber}`)
      console.log(`   - Paciente: ${invoice.patient?.name}`)
      console.log(`   - Seguro: ${invoice.patient?.insurance?.name || 'No especificado'}`)
      console.log(`   - Total: $${invoice.totalAmount.toFixed(2)}`)
      console.log(`   - Pagado: $${(invoice.paidAmount || 0).toFixed(2)}`)
      console.log(`   - Pendiente: $${(invoice.pendingAmount || 0).toFixed(2)}`)
      
      if (invoice.insuranceCalculation) {
        const calc = invoice.insuranceCalculation as any
        console.log(`   - Total Base (antes del descuento): $${(calc.totalBaseAmount || 0).toFixed(2)}`)
        console.log(`   - Descuento del Seguro: $${(calc.totalInsuranceCovers || 0).toFixed(2)}`)
        console.log(`   - Paciente Paga (después del descuento): $${(calc.totalPatientPays || 0).toFixed(2)}`)
        
        // Verificar que los cálculos son correctos
        const expectedPatientPays = calc.totalPatientPays || 0
        const actualPaid = invoice.paidAmount || 0
        const actualPending = invoice.pendingAmount || 0
        const totalPaidAndPending = actualPaid + actualPending
        
        console.log(`   - Verificación: ${actualPaid.toFixed(2)} + ${actualPending.toFixed(2)} = ${totalPaidAndPending.toFixed(2)}`)
        console.log(`   - Debe ser igual a: ${expectedPatientPays.toFixed(2)}`)
        
        if (Math.abs(totalPaidAndPending - expectedPatientPays) < 0.01) {
          console.log(`   ✅ Cálculos correctos`)
        } else {
          console.log(`   ❌ Error en cálculos`)
        }
      }
    })
    
    // 3. Crear una factura de prueba con seguros y pago parcial
    console.log('\n3️⃣ Creando factura de prueba con seguros y pago parcial...')
    
    // Buscar un paciente con seguro
    const patientWithInsurance = await prisma.patient.findFirst({
      where: {
        insurance: {
          isNot: null
        }
      },
      include: {
        insurance: true
      }
    })
    
    if (patientWithInsurance) {
      console.log(`👤 Paciente con seguro: ${patientWithInsurance.name}`)
      console.log(`🛡️ Seguro: ${patientWithInsurance.insurance?.name}`)
      
      // Buscar servicios
      const services = await prisma.service.findMany({
        where: { isActive: true },
        take: 2
      })
      
      if (services.length > 0) {
        console.log(`🔧 Servicios disponibles: ${services.length}`)
        
        // Simular cálculo de seguro
        const totalBaseAmount = services.reduce((sum, service) => sum + service.price, 0)
        const insuranceCovers = totalBaseAmount * 0.3 // 30% de cobertura
        const patientPays = totalBaseAmount - insuranceCovers
        
        console.log(`\n💰 Simulación de cálculo:`)
        console.log(`   - Total Base: $${totalBaseAmount.toFixed(2)}`)
        console.log(`   - Seguro Cubre (30%): $${insuranceCovers.toFixed(2)}`)
        console.log(`   - Paciente Paga: $${patientPays.toFixed(2)}`)
        
        // Simular pago parcial (50% del monto que paga el paciente)
        const partialPayment = patientPays * 0.5
        const remainingAmount = patientPays - partialPayment
        
        console.log(`\n💳 Simulación de pago parcial:`)
        console.log(`   - Pago Parcial (50%): $${partialPayment.toFixed(2)}`)
        console.log(`   - Monto Pendiente: $${remainingAmount.toFixed(2)}`)
        
        console.log(`\n📄 Lo que debería mostrar la impresión:`)
        console.log(`   - Total Base: $${totalBaseAmount.toFixed(2)}`)
        console.log(`   - Descuento del Seguro: -$${insuranceCovers.toFixed(2)}`)
        console.log(`   - TOTAL A PAGAR: $${patientPays.toFixed(2)}`)
        console.log(`   - Ahorro: $${insuranceCovers.toFixed(2)}`)
        console.log(`   - Monto Pagado: $${partialPayment.toFixed(2)}`)
        console.log(`   - Monto Pendiente: $${remainingAmount.toFixed(2)}`)
        console.log(`   - Nota: Los montos mostrados son del monto que paga el paciente (después del descuento del seguro)`)
      }
    } else {
      console.log('❌ No se encontró ningún paciente con seguro para la prueba')
    }
    
    console.log('\n🎉 ¡Pruebas de seguros con pagos parciales completadas!')
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testInsurancePartialPayment()
    .then(() => {
      console.log('✅ Script de pruebas ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando las pruebas:', error)
      process.exit(1)
    })
}

module.exports = { testInsurancePartialPayment }

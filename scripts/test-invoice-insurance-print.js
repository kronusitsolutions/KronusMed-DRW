// Script para probar la impresión de facturas con seguros
const testInvoice = {
  id: "test-invoice-1",
  invoiceNumber: "INV-00000001",
  patient: {
    id: "patient-1",
    name: "Juana",
    insurance: {
      id: "insurance-1",
      name: "Senasa"
    }
  },
  items: [
    {
      service: {
        id: "service-1",
        name: "Consulta Diabetólogo"
      },
      quantity: 1,
      unitPrice: 1000.00,
      totalPrice: 1000.00
    },
    {
      service: {
        id: "service-2", 
        name: "Limpieza"
      },
      quantity: 1,
      unitPrice: 300.00,
      totalPrice: 300.00
    }
  ],
  insuranceCalculation: {
    items: [
      {
        serviceId: "service-1",
        serviceName: "Consulta Diabetólogo",
        basePrice: 1000.00,
        coveragePercent: 40.0,
        insuranceCovers: 400.00,
        patientPays: 600.00,
        insuranceName: "Senasa"
      },
      {
        serviceId: "service-2",
        serviceName: "Limpieza", 
        basePrice: 300.00,
        coveragePercent: 40.0,
        insuranceCovers: 120.00,
        patientPays: 180.00,
        insuranceName: "Senasa"
      }
    ],
    totalBaseAmount: 1300.00,
    totalInsuranceCovers: 520.00,
    totalPatientPays: 780.00
  },
  totalAmount: 780.00,
  status: "PAID",
  createdAt: new Date().toISOString()
}

console.log('🧪 Probando factura con seguros:')
console.log('📋 Factura:', testInvoice.invoiceNumber)
console.log('👤 Paciente:', testInvoice.patient.name)
console.log('🏥 Seguro:', testInvoice.patient.insurance.name)
console.log('💰 Total Base:', testInvoice.insuranceCalculation.totalBaseAmount)
console.log('💸 Descuento:', testInvoice.insuranceCalculation.totalInsuranceCovers)
console.log('💵 Total a Pagar:', testInvoice.insuranceCalculation.totalPatientPays)
console.log('🎯 Ahorro:', testInvoice.insuranceCalculation.totalBaseAmount - testInvoice.insuranceCalculation.totalPatientPays)

// Simular la lógica de detección de seguros
const hasInsurance = testInvoice.patient?.insurance || testInvoice.insuranceCalculation
console.log('\n✅ ¿Tiene seguro?', hasInsurance ? 'SÍ' : 'NO')

if (hasInsurance) {
  console.log('📊 Columnas de la tabla: Servicio | Cantidad | Precio Unit. | Cobertura | Seguro Cubre | Paciente Paga')
  console.log('📈 Totales: Total Base | Descuento Total | Seguro Cubre | Total a Pagar | Ahorro')
} else {
  console.log('📊 Columnas de la tabla: Servicio | Cantidad | Precio Unit. | Total')
  console.log('📈 Totales: Total')
}

console.log('\n🎉 Prueba completada - La factura debería mostrar los cálculos de seguros correctamente')

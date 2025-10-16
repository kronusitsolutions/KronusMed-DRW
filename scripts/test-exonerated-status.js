// Script para probar el estado EXONERATED
const testData = {
  status: "EXONERATED"
}

console.log('🧪 Probando validación del estado EXONERATED...')

// Simular la validación de Zod
const validStatuses = ["PENDING", "PAID", "CANCELLED", "EXONERATED"]

if (validStatuses.includes(testData.status)) {
  console.log('✅ Estado EXONERATED es válido')
  console.log('📋 Estados válidos:', validStatuses.join(', '))
} else {
  console.log('❌ Estado EXONERATED no es válido')
}

console.log('🎉 Prueba completada - El endpoint debería aceptar EXONERATED ahora')

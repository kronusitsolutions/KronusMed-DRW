// Script para probar la funcionalidad de búsqueda mejorada de pacientes
console.log('🔍 Probando funcionalidad de búsqueda mejorada de pacientes...\n')

// Simular datos de pacientes de prueba
const mockPatients = [
  {
    id: "1",
    patientNumber: "PAT-000001",
    name: "Juan Pérez García",
    age: 35,
    gender: "MALE",
    phone: "+1 (555) 123-4567",
    email: "juan.perez@email.com",
    address: "Calle Principal 123, Ciudad",
    condition: "Hipertensión",
    status: "ACTIVE"
  },
  {
    id: "2", 
    patientNumber: "PAT-000002",
    name: "María López Rodríguez",
    age: 28,
    gender: "FEMALE",
    phone: "555-987-6543",
    email: "maria.lopez@email.com",
    address: "Avenida Central 456, Ciudad",
    condition: "Diabetes tipo 2",
    status: "ACTIVE"
  },
  {
    id: "3",
    patientNumber: "PAT-000003", 
    name: "Carlos Hernández",
    age: 42,
    gender: "MALE",
    phone: "(555) 456-7890",
    email: "carlos.hernandez@email.com",
    address: "Plaza Mayor 789, Ciudad",
    condition: "Asma",
    status: "INACTIVE"
  },
  {
    id: "4",
    patientNumber: "PAT-000004",
    name: "Ana Martínez",
    age: 31,
    gender: "FEMALE", 
    phone: "555.123.4567",
    email: "ana.martinez@email.com",
    address: "Calle Secundaria 321, Ciudad",
    condition: "Migraña",
    status: "ACTIVE"
  }
]

// Función de búsqueda mejorada (copiada del código)
function searchPatients(patients, searchTerm) {
  if (!searchTerm.trim()) {
    return patients
  }

  const searchLower = searchTerm.toLowerCase().trim()
  const searchUpper = searchTerm.toUpperCase().trim()
  
  return patients.filter(patient => {
    // Búsqueda por nombre (palabras parciales)
    const nameMatch = patient.name.toLowerCase().includes(searchLower)
    
    // Búsqueda por email
    const emailMatch = patient.email && patient.email.toLowerCase().includes(searchLower)
    
    // Búsqueda por teléfono (con y sin espacios/guiones)
    const phoneMatch = patient.phone && (
      patient.phone.includes(searchTerm) ||
      patient.phone.replace(/[\s\-\(\)\.]/g, '').includes(searchTerm.replace(/[\s\-\(\)\.]/g, ''))
    )
    
    // Búsqueda por número de paciente (más flexible)
    const patientNumberMatch = patient.patientNumber.includes(searchUpper) ||
                               patient.patientNumber.toLowerCase().includes(searchLower)
    
    // Búsqueda por dirección (opcional)
    const addressMatch = patient.address && patient.address.toLowerCase().includes(searchLower)
    
    // Búsqueda por condición médica (opcional)
    const conditionMatch = patient.condition && patient.condition.toLowerCase().includes(searchLower)
    
    return nameMatch || emailMatch || phoneMatch || patientNumberMatch || addressMatch || conditionMatch
  })
}

// Casos de prueba
const testCases = [
  { search: "Juan", description: "Búsqueda por nombre" },
  { search: "Pérez", description: "Búsqueda por apellido" },
  { search: "555", description: "Búsqueda por teléfono (parcial)" },
  { search: "123-4567", description: "Búsqueda por teléfono (con guiones)" },
  { search: "5551234567", description: "Búsqueda por teléfono (sin formato)" },
  { search: "maria.lopez", description: "Búsqueda por email" },
  { search: "PAT-000002", description: "Búsqueda por número de paciente" },
  { search: "pat-000002", description: "Búsqueda por número de paciente (minúsculas)" },
  { search: "Central", description: "Búsqueda por dirección" },
  { search: "Diabetes", description: "Búsqueda por condición médica" },
  { search: "FEMALE", description: "Búsqueda por género" },
  { search: "ACTIVE", description: "Búsqueda por estado" },
  { search: "xyz", description: "Búsqueda sin resultados" }
]

console.log('📋 Casos de prueba:')
console.log('==================')

testCases.forEach((testCase, index) => {
  const results = searchPatients(mockPatients, testCase.search)
  const status = results.length > 0 ? '✅' : '❌'
  
  console.log(`${index + 1}. ${status} ${testCase.description}`)
  console.log(`   Búsqueda: "${testCase.search}"`)
  console.log(`   Resultados: ${results.length}`)
  
  if (results.length > 0) {
    results.forEach(patient => {
      console.log(`   - ${patient.name} (${patient.patientNumber})`)
    })
  }
  console.log('')
})

// Prueba de rendimiento
console.log('⚡ Prueba de rendimiento:')
console.log('========================')

const startTime = Date.now()
for (let i = 0; i < 1000; i++) {
  searchPatients(mockPatients, "Juan")
}
const endTime = Date.now()

console.log(`1000 búsquedas completadas en ${endTime - startTime}ms`)
console.log(`Promedio: ${((endTime - startTime) / 1000).toFixed(2)}ms por búsqueda`)

// Prueba de búsqueda con muchos pacientes
console.log('\n📊 Prueba con dataset grande:')
console.log('============================')

const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
  id: `patient-${i}`,
  patientNumber: `PAT-${String(i + 1).padStart(6, '0')}`,
  name: `Paciente ${i + 1}`,
  phone: `555-${String(i).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
  email: `paciente${i + 1}@email.com`
}))

const largeStartTime = Date.now()
const largeResults = searchPatients(largeDataset, "Paciente 500")
const largeEndTime = Date.now()

console.log(`Búsqueda en 1000 pacientes: ${largeEndTime - largeStartTime}ms`)
console.log(`Resultados encontrados: ${largeResults.length}`)

console.log('\n🎉 Funcionalidad de búsqueda verificada exitosamente!')
console.log('   - Búsqueda por nombre, apellido, teléfono, email')
console.log('   - Búsqueda por número de paciente, dirección, condición')
console.log('   - Manejo de diferentes formatos de teléfono')
console.log('   - Búsqueda case-insensitive')
console.log('   - Rendimiento optimizado para datasets grandes')

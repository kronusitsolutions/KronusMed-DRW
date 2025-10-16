const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Función para generar el siguiente ID
function generateNextPatientId(lastId) {
  if (!lastId) {
    return 'A000001'
  }

  // Extraer la letra y el número
  const letter = lastId.charAt(0)
  const number = parseInt(lastId.substring(1))
  
  // Incrementar el número
  const nextNumber = number + 1
  
  // Formatear con 6 dígitos
  const formattedNumber = nextNumber.toString().padStart(6, '0')
  
  return `${letter}${formattedNumber}`
}

async function generatePatientIds() {
  try {
    console.log('🔧 Generando IDs de paciente con formato A000001...')

    // Obtener todos los pacientes
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`📊 Total de pacientes: ${patients.length}`)

    if (patients.length === 0) {
      console.log('❌ No hay pacientes para asignar IDs')
      return
    }

    // Encontrar el último ID asignado entre los pacientes existentes
    let nextId = 'A000001'
    const patientsWithIds = patients.filter(p => p.patientNumber && /^[A-Z]\d{6}$/.test(p.patientNumber))
    
    if (patientsWithIds.length > 0) {
      const lastPatient = patientsWithIds.sort((a, b) => b.patientNumber.localeCompare(a.patientNumber))[0]
      nextId = generateNextPatientId(lastPatient.patientNumber)
    }

    console.log(`🔢 Próximo ID a asignar: ${nextId}`)

    // Asignar IDs a cada paciente que no tenga uno
    let assignedCount = 0
    for (const patient of patients) {
      // Verificar si ya tiene un ID válido (formato A000001)
      if (patient.patientNumber && /^[A-Z]\d{6}$/.test(patient.patientNumber)) {
        console.log(`✅ Paciente ${patient.name} ya tiene ID: ${patient.patientNumber}`)
        continue
      }

      await prisma.patient.update({
        where: { id: patient.id },
        data: { patientNumber: nextId }
      })

      console.log(`✅ Paciente ${patient.name} - ID asignado: ${nextId}`)
      nextId = generateNextPatientId(nextId)
      assignedCount++
    }

    if (assignedCount === 0) {
      console.log('✅ Todos los pacientes ya tienen IDs válidos')
    } else {
      console.log(`\n🎉 ${assignedCount} IDs de paciente generados exitosamente`)
    }

    // Mostrar resumen
    const allPatients = await prisma.patient.findMany({
      select: {
        id: true,
        patientNumber: true,
        name: true,
        age: true,
        gender: true
      },
      orderBy: {
        patientNumber: 'asc'
      }
    })

    console.log('\n📋 Resumen de pacientes:')
    allPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.patientNumber} - ${patient.name} (${patient.age} años, ${patient.gender})`)
    })

  } catch (error) {
    console.error('❌ Error al generar IDs de paciente:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generatePatientIds()

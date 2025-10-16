const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generatePatientNumbers() {
  try {
    console.log('🔧 Generando números de paciente únicos...')

    // Obtener todos los pacientes
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Filtrar pacientes sin número (los que tienen 0 o null)
    const patientsWithoutNumber = patients.filter(p => !p.patientNumber || p.patientNumber === 0)

    console.log(`📊 Pacientes sin número: ${patientsWithoutNumber.length}`)

    if (patientsWithoutNumber.length === 0) {
      console.log('✅ Todos los pacientes ya tienen números asignados')
      return
    }

    // Generar números secuenciales
    let nextNumber = 1

    // Verificar cuál es el siguiente número disponible
    const lastPatient = await prisma.patient.findFirst({
      where: {
        patientNumber: {
          not: null
        }
      },
      orderBy: {
        patientNumber: 'desc'
      }
    })

    if (lastPatient && lastPatient.patientNumber) {
      nextNumber = lastPatient.patientNumber + 1
    }

    console.log(`🔢 Próximo número a asignar: ${nextNumber}`)

    // Asignar números a cada paciente
    for (const patient of patientsWithoutNumber) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { patientNumber: nextNumber }
      })

      console.log(`✅ Paciente ${patient.name} - Número asignado: ${nextNumber}`)
      nextNumber++
    }

    console.log('\n🎉 Números de paciente generados exitosamente')

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
      console.log(`${index + 1}. #${patient.patientNumber} - ${patient.name} (${patient.age} años, ${patient.gender})`)
    })

  } catch (error) {
    console.error('❌ Error al generar números de paciente:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generatePatientNumbers()

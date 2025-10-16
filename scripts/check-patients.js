const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPatients() {
  try {
    console.log('🔍 Verificando pacientes en la base de datos...')

    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        patientNumber: true,
        name: true,
        age: true,
        gender: true,
        status: true
      },
      orderBy: {
        patientNumber: 'asc'
      }
    })

    console.log(`\n📊 Total de pacientes: ${patients.length}`)
    console.log('\n👥 Pacientes encontrados:')
    
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.patientNumber} - ${patient.name} (ID: ${patient.id}) - ${patient.age} años - ${patient.gender} - ${patient.status}`)
    })

    if (patients.length === 0) {
      console.log('\n❌ No se encontraron pacientes en la base de datos')
    } else {
      console.log('\n✅ Pacientes verificados correctamente')
    }

  } catch (error) {
    console.error('❌ Error al verificar pacientes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPatients()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testMedicalNotesAPI() {
  try {
    console.log('🧪 Probando API de notas médicas...')

    // 1. Verificar que hay usuarios
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    })
    console.log('Usuarios disponibles:', users.length)

    // 2. Verificar que hay pacientes
    const patients = await prisma.patient.findMany({
      select: { id: true, name: true }
    })
    console.log('Pacientes disponibles:', patients.length)

    if (patients.length === 0) {
      console.log('❌ No hay pacientes para probar')
      return
    }

    const testPatient = patients[0]
    console.log('Paciente de prueba:', testPatient.name, '(ID:', testPatient.id + ')')

    // 3. Verificar que hay doctores
    const doctors = users.filter(u => u.role === 'DOCTOR' || u.role === 'ADMIN')
    console.log('Doctores disponibles:', doctors.length)

    if (doctors.length === 0) {
      console.log('❌ No hay doctores para probar')
      return
    }

    const testDoctor = doctors[0]
    console.log('Doctor de prueba:', testDoctor.name, '(ID:', testDoctor.id + ')')

    // 4. Crear una nota médica de prueba
    console.log('\n📝 Creando nota médica de prueba...')
    
    const testNote = await prisma.medicalNote.create({
      data: {
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        date: new Date(),
        type: 'PRIMERA_CONSULTA',
        notes: 'Nota de prueba creada automáticamente',
        duration: '30 min',
        treatment: 'Tratamiento de prueba'
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('✅ Nota creada:', testNote.id)

    // 5. Verificar que se puede obtener la nota
    const retrievedNotes = await prisma.medicalNote.findMany({
      where: {
        patientId: testPatient.id
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    console.log('✅ Notas recuperadas:', retrievedNotes.length)
    console.log('Primera nota:', {
      id: retrievedNotes[0].id,
      patient: retrievedNotes[0].patient.name,
      doctor: retrievedNotes[0].doctor.name,
      type: retrievedNotes[0].type,
      date: retrievedNotes[0].date
    })

    console.log('\n🎉 Prueba completada exitosamente')

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMedicalNotesAPI()

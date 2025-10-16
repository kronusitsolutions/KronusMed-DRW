const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkMedicalNotes() {
  try {
    console.log('🔍 Verificando notas médicas en la base de datos...')

    const notes = await prisma.medicalNote.findMany({
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

    console.log(`\n📊 Total de notas médicas: ${notes.length}`)
    console.log('\n📝 Notas encontradas:')
    
    notes.forEach((note, index) => {
      console.log(`${index + 1}. Paciente: ${note.patient.name} | Doctor: ${note.doctor.name} | Fecha: ${note.date} | Tipo: ${note.type}`)
    })

    if (notes.length === 0) {
      console.log('\n❌ No se encontraron notas médicas en la base de datos')
    } else {
      console.log('\n✅ Notas médicas verificadas correctamente')
    }

    // Verificar estructura de la tabla
    console.log('\n🔧 Verificando estructura de la tabla medical_notes...')
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'medical_notes'
        ORDER BY ordinal_position
      `
      console.log('Estructura de la tabla:', tableInfo)
    } catch (error) {
      console.log('Error al verificar estructura:', error.message)
    }

  } catch (error) {
    console.error('❌ Error al verificar notas médicas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMedicalNotes()

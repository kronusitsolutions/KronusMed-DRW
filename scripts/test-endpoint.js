const { PrismaClient } = require('@prisma/client')
const { getServerSession } = require('next-auth')
const { authOptions } = require('../lib/auth')

const prisma = new PrismaClient()

async function testEndpoint() {
  try {
    console.log('🧪 Probando endpoint directamente...')

    // Simular request
    const mockRequest = {
      url: 'http://localhost:3000/api/medical-notes?patientId=cme39kpa30000mq0ynktoz2d6'
    }

    console.log('1. Probando getServerSession...')
    try {
      const session = await getServerSession(authOptions)
      console.log('Session:', session ? 'Encontrada' : 'No encontrada')
    } catch (error) {
      console.log('Error en getServerSession:', error.message)
    }

    console.log('2. Probando conexión a BD...')
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: 'cme39kpa30000mq0ynktoz2d6' }
      })
      console.log('Paciente encontrado:', !!patient)
    } catch (error) {
      console.log('Error en BD:', error.message)
    }

    console.log('3. Probando consulta de notas...')
    try {
      const notes = await prisma.medicalNote.findMany({
        where: {
          patientId: 'cme39kpa30000mq0ynktoz2d6'
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
      console.log('Notas encontradas:', notes.length)
    } catch (error) {
      console.log('Error en consulta:', error.message)
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEndpoint()

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/medical-notes-simple - Iniciando...')
    
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    console.log('PatientId recibido:', patientId)

    // Simular respuesta exitosa
    const mockNotes = [
      {
        id: 'test-1',
        patientId: patientId,
        doctorId: 'test-doctor',
        date: new Date().toISOString(),
        type: 'PRIMERA_CONSULTA',
        notes: 'Nota de prueba',
        duration: '30 min',
        treatment: 'Tratamiento de prueba',
        nextAppointment: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctor: {
          id: 'test-doctor',
          name: 'Dr. Test',
          email: 'test@test.com'
        },
        patient: {
          id: patientId,
          name: 'Paciente Test'
        }
      }
    ]

    console.log('✅ Notas simuladas creadas')
    return NextResponse.json(mockNotes)
    
  } catch (error) {
    console.error('❌ Error en GET /api/medical-notes-simple:', error)
    return NextResponse.json({ 
      error: 'Error al obtener notas médicas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/medical-notes-simple - Iniciando...')
    
    const body = await request.json()
    console.log('Body recibido:', body)

    // Simular creación exitosa
    const mockNote = {
      id: 'test-' + Date.now(),
      patientId: body.patientId,
      doctorId: body.doctorId,
      date: new Date(body.date).toISOString(),
      type: body.type,
      notes: body.notes,
      duration: body.duration,
      treatment: body.treatment || null,
      nextAppointment: body.nextAppointment ? new Date(body.nextAppointment).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doctor: {
        id: body.doctorId,
        name: 'Dr. Test',
        email: 'test@test.com'
      },
      patient: {
        id: body.patientId,
        name: 'Paciente Test'
      }
    }

    console.log('✅ Nota simulada creada:', mockNote.id)
    return NextResponse.json(mockNote, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error en POST /api/medical-notes-simple:', error)
    return NextResponse.json({ 
      error: 'Error al crear nota médica',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

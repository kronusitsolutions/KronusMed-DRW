import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/medical-notes-fixed - Iniciando...')
    
    const session = await getServerSession(authOptions)
    console.log('Session encontrada:', !!session)
    
    if (!session) {
      console.log('❌ No hay sesión')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    console.log('PatientId recibido:', patientId)

    if (!patientId) {
      console.log('❌ No hay patientId')
      return NextResponse.json({ error: 'ID del paciente es requerido' }, { status: 400 })
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })
    console.log('Paciente encontrado:', !!patient)

    if (!patient) {
      console.log('❌ Paciente no encontrado')
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    const notes = await prisma.medicalNote.findMany({
      where: {
        patientId: patientId
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
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

    console.log('✅ Notas encontradas:', notes.length)
    return NextResponse.json(notes)
    
  } catch (error) {
    console.error('❌ Error en GET /api/medical-notes-fixed:', error)
    return NextResponse.json({ 
      error: 'Error al obtener notas médicas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/medical-notes-fixed - Iniciando...')
    
    const session = await getServerSession(authOptions)
    console.log('Session encontrada:', !!session)
    
    if (!session) {
      console.log('❌ No hay sesión')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea doctor o admin
    if (!["ADMIN", "DOCTOR"].includes(session.user.role)) {
      console.log('❌ Rol no autorizado:', session.user.role)
      return NextResponse.json({ error: 'Solo doctores pueden agregar notas médicas' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Body recibido:', body)

    // Validación simple
    if (!body.patientId || !body.doctorId || !body.date || !body.type || !body.notes || !body.duration) {
      console.log('❌ Datos incompletos')
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId }
    })

    if (!patient) {
      console.log('❌ Paciente no encontrado')
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    // Verificar que el doctor existe
    const doctor = await prisma.user.findUnique({
      where: { id: body.doctorId }
    })

    if (!doctor) {
      console.log('❌ Doctor no encontrado')
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 })
    }

    const newNote = await prisma.medicalNote.create({
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        date: new Date(body.date),
        type: body.type,
        notes: body.notes,
        duration: body.duration,
        treatment: body.treatment || null,
        nextAppointment: body.nextAppointment ? new Date(body.nextAppointment) : null
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
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

    console.log('✅ Nota creada:', newNote.id)
    
    // Crear log de auditoría
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'MEDICAL_NOTE',
      entityId: newNote.id,
      newData: newNote,
      description: `Nota médica creada para paciente ${patient.name} por ${session.user.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })
    
    return NextResponse.json(newNote, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error en POST /api/medical-notes-fixed:', error)
    return NextResponse.json({ 
      error: 'Error al crear nota médica',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

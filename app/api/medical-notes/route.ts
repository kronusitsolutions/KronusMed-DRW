import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { encryptObject, decryptObject } from '@/lib/encryption.server'
import { logger } from '@/lib/logger'

const medicalNoteSchema = z.object({
  patientId: z.string().min(1, "ID del paciente es requerido"),
  doctorId: z.string().min(1, "ID del doctor es requerido"),
  date: z.string().min(1, "Fecha es requerida"),
  type: z.enum(["PRIMERA_CONSULTA", "SEGUIMIENTO", "CONTROL", "URGENCIA"]),
  notes: z.string().min(1, "Notas son requeridas"),
  duration: z.string().min(1, "Duración es requerida"),
  treatment: z.string().optional(),
  nextAppointment: z.string().optional(),
  reason: z.string().optional(),
  diagnosis: z.string().optional(),
  symptoms: z.string().optional(),
  vitalSigns: z.object({
    bloodPressure: z.string().optional(),
    temperature: z.string().optional(),
    heartRate: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional()
  }).optional(),
  prescriptions: z.array(z.object({
    medication: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string().optional()
  })).optional(),
  followUpDate: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/medical-notes - Iniciando...')
    
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

    // Desencriptar datos sensibles antes de enviar
    const decryptedNotes = notes.map(note => 
      decryptObject(note, ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms'])
    )

    logger.info('Notas médicas obtenidas exitosamente', {
      count: notes.length,
      patientId,
      userId: session.user.id
    })
    
    return NextResponse.json(decryptedNotes)
    
  } catch (error) {
    console.error('❌ Error en GET /api/medical-notes:', error)
    return NextResponse.json({ 
      error: 'Error al obtener notas médicas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/medical-notes - Iniciando...')
    
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
    
    const data = medicalNoteSchema.parse(body)
    
    // Encriptar datos sensibles antes de guardar
    const encryptedData = encryptObject(data, ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms'])

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    })

    if (!patient) {
      console.log('❌ Paciente no encontrado')
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    // Verificar que el doctor existe
    const doctor = await prisma.user.findUnique({
      where: { id: data.doctorId }
    })

    if (!doctor) {
      console.log('❌ Doctor no encontrado')
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 })
    }

    const newNote = await prisma.medicalNote.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: new Date(data.date),
        type: data.type,
        notes: encryptedData.notes,
        duration: data.duration,
        treatment: encryptedData.treatment,
        nextAppointment: data.nextAppointment ? new Date(data.nextAppointment) : null,
        reason: encryptedData.reason,
        diagnosis: encryptedData.diagnosis,
        symptoms: encryptedData.symptoms,
        vitalSigns: data.vitalSigns,
        prescriptions: data.prescriptions,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null
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

    // Desencriptar datos para la respuesta
    const decryptedNote = decryptObject(newNote, ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms'])
    
    logger.info('Nota médica creada exitosamente', {
      noteId: newNote.id,
      patientId: data.patientId,
      userId: session.user.id
    })
    
    return NextResponse.json(decryptedNote, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error en POST /api/medical-notes:', error)
    return NextResponse.json({ 
      error: 'Error al crear nota médica',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

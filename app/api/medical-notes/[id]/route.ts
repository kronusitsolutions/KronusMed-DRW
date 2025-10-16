import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { encryptObject, decryptObject } from '@/lib/encryption.server'
import { logger } from '@/lib/logger'

const updateMedicalNoteSchema = z.object({
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: noteId } = await params

    const note = await prisma.medicalNote.findUnique({
      where: { id: noteId },
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
            name: true,
            patientNumber: true
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json({ error: 'Consulta médica no encontrada' }, { status: 404 })
    }

    // Desencriptar datos para usuarios autorizados (médicos, facturación, administradores)
    const decryptedNote = decryptObject(note, ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms'])

    logger.info('Consulta médica obtenida exitosamente', {
      noteId,
      userId: session.user.id
    })

    return NextResponse.json(decryptedNote)
    
  } catch (error) {
    console.error('Error en GET /api/medical-notes/[id]:', error)
    return NextResponse.json({ 
      error: 'Error al obtener consulta médica',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea doctor o admin
    if (!["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Solo doctores pueden editar consultas médicas' }, { status: 403 })
    }

    const { id: noteId } = await params
    const body = await request.json()
    
    const data = updateMedicalNoteSchema.parse(body)
    
    // Verificar que la consulta existe
    const existingNote = await prisma.medicalNote.findUnique({
      where: { id: noteId }
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Consulta médica no encontrada' }, { status: 404 })
    }

    // Encriptar datos sensibles para almacenamiento seguro
    const encryptedData = encryptObject(data, ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms'])

    const updatedNote = await prisma.medicalNote.update({
      where: { id: noteId },
      data: {
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
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            patientNumber: true
          }
        }
      }
    })

    // Desencriptar datos para usuarios autorizados (médicos, facturación, administradores)
    const decryptedNote = decryptObject(updatedNote, ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms'])
    
    logger.info('Consulta médica actualizada exitosamente', {
      noteId,
      userId: session.user.id
    })
    
    return NextResponse.json(decryptedNote)
    
  } catch (error) {
    console.error('Error en PUT /api/medical-notes/[id]:', error)
    return NextResponse.json({ 
      error: 'Error al actualizar consulta médica',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea doctor o admin
    if (!["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Solo doctores pueden eliminar consultas médicas' }, { status: 403 })
    }

    const { id: noteId } = await params

    // Verificar que la consulta existe
    const existingNote = await prisma.medicalNote.findUnique({
      where: { id: noteId }
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Consulta médica no encontrada' }, { status: 404 })
    }

    await prisma.medicalNote.delete({
      where: { id: noteId }
    })
    
    logger.info('Consulta médica eliminada exitosamente', {
      noteId,
      userId: session.user.id
    })
    
    return NextResponse.json({ message: 'Consulta médica eliminada exitosamente' })
    
  } catch (error) {
    console.error('Error en DELETE /api/medical-notes/[id]:', error)
    return NextResponse.json({ 
      error: 'Error al eliminar consulta médica',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

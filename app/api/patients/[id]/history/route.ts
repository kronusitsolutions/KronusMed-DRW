import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptObject } from '@/lib/encryption.server'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: patientId } = await params

    // Obtener información completa del paciente
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        insurance: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    // Obtener historial de consultas médicas
    const medicalNotes = await prisma.medicalNote.findMany({
      where: {
        patientId: patientId
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Desencriptar datos para usuarios autorizados (médicos, facturación, administradores)
    const isAuthorized = session.user.role === 'ADMIN' || session.user.role === 'DOCTOR' || session.user.role === 'BILLING'
    
    const decryptedPatient = isAuthorized 
      ? decryptObject(patient, ['phone', 'address'])
      : patient
    
    // Desencriptar datos de consultas para usuarios autorizados
    const decryptedNotes = medicalNotes.map(note => 
      isAuthorized 
        ? decryptObject(note, ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms'])
        : note
    )

    // Obtener estadísticas del historial
    const stats = {
      totalConsultations: medicalNotes.length,
      firstConsultation: medicalNotes.length > 0 ? medicalNotes[medicalNotes.length - 1].date : null,
      lastConsultation: medicalNotes.length > 0 ? medicalNotes[0].date : null,
      consultationTypes: {
        PRIMERA_CONSULTA: medicalNotes.filter(n => n.type === 'PRIMERA_CONSULTA').length,
        SEGUIMIENTO: medicalNotes.filter(n => n.type === 'SEGUIMIENTO').length,
        CONTROL: medicalNotes.filter(n => n.type === 'CONTROL').length,
        URGENCIA: medicalNotes.filter(n => n.type === 'URGENCIA').length
      }
    }

    logger.info('Historial de paciente obtenido exitosamente', {
      patientId,
      consultationsCount: medicalNotes.length,
      userId: session.user.id
    })

    return NextResponse.json({
      patient: decryptedPatient,
      consultations: decryptedNotes,
      stats
    })
    
  } catch (error) {
    console.error('Error en GET /api/patients/[id]/history:', error)
    return NextResponse.json({ 
      error: 'Error al obtener historial del paciente',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

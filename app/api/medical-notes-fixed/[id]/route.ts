import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado. Solo doctores y administradores pueden editar notas médicas." }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verificar que la nota médica existe
    const existingNote = await prisma.medicalNote.findUnique({
      where: { id },
      include: {
        patient: {
          select: { name: true }
        }
      }
    })

    if (!existingNote) {
      return NextResponse.json({ error: "Nota médica no encontrada" }, { status: 404 })
    }

    // Validar datos requeridos
    if (!body.date || !body.type || !body.notes || !body.duration) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const updatedNote = await prisma.medicalNote.update({
      where: { id },
      data: {
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
            name: true
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

    // Crear log de auditoría
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'MEDICAL_NOTE',
      entityId: id,
      oldData: existingNote,
      newData: updatedNote,
      description: `Nota médica editada para paciente ${existingNote.patient.name} por ${session.user.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error("Error al actualizar nota médica:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo los administradores pueden eliminar notas médicas." }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la nota médica existe
    const existingNote = await prisma.medicalNote.findUnique({
      where: { id }
    })

    if (!existingNote) {
      return NextResponse.json({ error: "Nota médica no encontrada" }, { status: 404 })
    }

    // Obtener información del paciente para el log
    const patient = await prisma.patient.findUnique({
      where: { id: existingNote.patientId },
      select: { name: true }
    })

    await prisma.medicalNote.delete({
      where: { id }
    })

    // Crear log de auditoría
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'MEDICAL_NOTE',
      entityId: id,
      oldData: existingNote,
      description: `Nota médica eliminada para paciente ${patient?.name || 'Desconocido'} por ${session.user.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ message: "Nota médica eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar nota médica:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

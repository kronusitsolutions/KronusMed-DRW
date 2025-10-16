import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const appointmentUpdateSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  serviceId: z.string().optional(),
  date: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            nationality: true,
            cedula: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede ver sus propias citas
    if (session.user.role === "DOCTOR" && appointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error al obtener cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = appointmentUpdateSchema.parse(body)

    // Verificar que la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede editar sus propias citas
    if (session.user.role === "DOCTOR" && existingAppointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Si se está cambiando la fecha o doctor, verificar conflictos
    if (validatedData.date || validatedData.doctorId) {
      const newDate = validatedData.date ? new Date(validatedData.date) : existingAppointment.date
      const newDoctorId = validatedData.doctorId || existingAppointment.doctorId

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: id }, // Excluir la cita actual
          doctorId: newDoctorId,
          date: newDate,
          status: {
            not: "CANCELLED"
          }
        }
      })

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: "El doctor ya tiene una cita programada en esa fecha" },
          { status: 400 }
        )
      }
    }

    const updateData: any = { ...validatedData }
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            nationality: true,
            cedula: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    return NextResponse.json(appointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al actualizar cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    // Solo permitir actualización del estado
    const statusSchema = z.object({
      status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    })
    
    const validatedData = statusSchema.parse(body)

    // Verificar que la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede cambiar el estado de sus propias citas
    if (session.user.role === "DOCTOR" && existingAppointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: validatedData.status },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            nationality: true,
            cedula: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    return NextResponse.json(appointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Estado inválido", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al actualizar estado de cita:", error)
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

    if (!session || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede eliminar sus propias citas
    if (session.user.role === "DOCTOR" && existingAppointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    await prisma.appointment.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Cita eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

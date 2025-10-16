import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { cache, DashboardCache } from "@/lib/cache"

// Optimizaciones para Node.js 22
const APPOINTMENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const DOCTOR_AVAILABILITY_CACHE_TTL = 2 * 60 * 1000 // 2 minutos

// Esquema para actualización
const updateSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  doctorProfileId: z.string().optional(),
  serviceId: z.string().optional().or(z.literal("")).or(z.literal("none")),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional()
})

// Función para validar disponibilidad del doctor
async function validateDoctorAvailability(
  doctorId: string | undefined,
  doctorProfileId: string | undefined,
  date: string,
  excludeId?: string
): Promise<{ available: boolean; message?: string }> {
  try {
    const appointmentDate = new Date(date)
    const startOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0)
    const endOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 23, 59, 59)

    const whereClause: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        not: "CANCELLED"
      }
    }

    // Agregar filtro de doctor
    if (doctorId) {
      whereClause.doctorId = doctorId
    } else if (doctorProfileId) {
      whereClause.doctorProfileId = doctorProfileId
    }

    // Excluir cita actual si es actualización
    if (excludeId) {
      whereClause.id = { not: excludeId }
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: whereClause
    })

    return {
      available: !existingAppointment,
      message: existingAppointment ? "El doctor ya tiene una cita programada en esa fecha" : undefined
    }
  } catch (error) {
    console.error("Error validando disponibilidad:", error)
    return { available: false, message: "Error al verificar disponibilidad" }
  }
}

// GET - Obtener cita por ID
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

    // Verificar caché
    const cacheKey = `appointment:${id}`
    const cachedAppointment = cache.get(cacheKey)
    
    if (cachedAppointment) {
      return NextResponse.json(cachedAppointment)
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            nationality: true,
            cedula: true,
            patientNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        },
        doctorProfile: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede ver sus propias citas
    if (session.user.role === "DOCTOR") {
      const isOwner = appointment.doctorId === session.user.id || 
                     appointment.doctorProfileId === session.user.id
      if (!isOwner) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    // Guardar en caché con TTL optimizado para Node.js 22
    cache.set(cacheKey, appointment, APPOINTMENT_CACHE_TTL)

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error al obtener cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cita
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

    // Validar datos
    const validatedData = updateSchema.parse(body)

    // Verificar que la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede editar sus propias citas
    if (session.user.role === "DOCTOR") {
      const isOwner = existingAppointment.doctorId === session.user.id || 
                     existingAppointment.doctorProfileId === session.user.id
      if (!isOwner) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    // Si se está cambiando la fecha o el doctor, verificar disponibilidad
    if (validatedData.date || validatedData.doctorId || validatedData.doctorProfileId) {
      const dateToCheck = validatedData.date || existingAppointment.date.toISOString().split('T')[0]
      const doctorIdToCheck = validatedData.doctorId || existingAppointment.doctorId
      const doctorProfileIdToCheck = validatedData.doctorProfileId || existingAppointment.doctorProfileId

      const availability = await validateDoctorAvailability(
        doctorIdToCheck,
        doctorProfileIdToCheck,
        dateToCheck,
        id
      )

      if (!availability.available) {
        return NextResponse.json(
          { error: availability.message },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {}

    if (validatedData.patientId) {
      updateData.patient = { connect: { id: validatedData.patientId } }
    }

    if (validatedData.doctorId) {
      updateData.doctor = { connect: { id: validatedData.doctorId } }
      updateData.doctorProfile = { disconnect: true }
    }

    if (validatedData.doctorProfileId) {
      updateData.doctorProfile = { connect: { id: validatedData.doctorProfileId } }
      updateData.doctor = { disconnect: true }
    }

    if (validatedData.serviceId !== undefined) {
      if (validatedData.serviceId === "none" || validatedData.serviceId === "") {
        updateData.service = { disconnect: true }
      } else {
        updateData.service = { connect: { id: validatedData.serviceId } }
      }
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    if (validatedData.startTime !== undefined) {
      updateData.startTime = validatedData.startTime
    }

    if (validatedData.endTime !== undefined) {
      updateData.endTime = validatedData.endTime
    }

    if (validatedData.reason !== undefined) {
      updateData.reason = validatedData.reason
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }

    // Actualizar cita
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
            cedula: true,
            patientNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        },
        doctorProfile: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true
          }
        }
      }
    })

    // Invalidar caché
    cache.delete(`appointment:${id}`)
    DashboardCache.invalidateDashboard()
    cache.delete(`appointments:*`)

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error al actualizar cita:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cita
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede eliminar sus propias citas
    if (session.user.role === "DOCTOR") {
      const isOwner = existingAppointment.doctorId === session.user.id || 
                     existingAppointment.doctorProfileId === session.user.id
      if (!isOwner) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    // Eliminar cita
    await prisma.appointment.delete({
      where: { id }
    })

    // Invalidar caché
    cache.delete(`appointment:${id}`)
    DashboardCache.invalidateDashboard()
    cache.delete(`appointments:*`)

    return NextResponse.json({ message: "Cita eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar solo el estado
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

    const statusSchema = z.object({
      status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    })

    const { status } = statusSchema.parse(body)

    // Verificar que la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Si es doctor, solo puede cambiar el estado de sus propias citas
    if (session.user.role === "DOCTOR") {
      const isOwner = existingAppointment.doctorId === session.user.id || 
                     existingAppointment.doctorProfileId === session.user.id
      if (!isOwner) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    // Actualizar solo el estado
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            nationality: true,
            cedula: true,
            patientNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        },
        doctorProfile: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true
          }
        }
      }
    })

    // Invalidar caché
    cache.delete(`appointment:${id}`)
    DashboardCache.invalidateDashboard()
    cache.delete(`appointments:*`)

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
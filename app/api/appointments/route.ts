import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const appointmentSchema = z.object({
  patientId: z.string().min(1, "El paciente es requerido"),
  doctorId: z.string().optional(),           // Para usuarios con rol DOCTOR (legacy)
  doctorProfileId: z.string().optional(),    // Para doctores virtuales (nuevo)
  serviceId: z.string().optional(),
  date: z.string().min(1, "La fecha es requerida"),
  reason: z.string().min(1, "El motivo de la cita es requerido"),
  notes: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).default("SCHEDULED")
}).refine(data => data.doctorId || data.doctorProfileId, {
  message: "Debe seleccionar un doctor",
  path: ["doctorId"]
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const status = searchParams.get("status")
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 1000) // Máximo 100 por página
    const skip = (page - 1) * limit

    const where: any = {}

    if (date) {
      // Usar zona horaria local para las fechas
      const [year, month, day] = date.split('-').map(Number)
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (status) {
      where.status = status
    }

    if (patientId) {
      where.patientId = patientId
    }

    if (doctorId) {
      where.OR = [
        { doctorId: doctorId },
        { doctorProfileId: doctorId }
      ]
    }

    // Si es doctor, solo ver sus propias citas
    if (session.user.role === "DOCTOR") {
      where.OR = [
        { doctorId: session.user.id },
        { doctorProfileId: session.user.id }
      ]
    }

    // Consulta optimizada con paginación
    const [appointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
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
              category: true
            }
          }
        },
        orderBy: [
          { date: "asc" }
        ]
      }),
      prisma.appointment.count({ where })
    ])

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error al obtener citas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIO CREAR CITA ===")
    
    const session = await getServerSession(authOptions)
    console.log("Session:", session?.user?.role)

    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Body recibido:", JSON.stringify(body, null, 2))
    
    const validatedData = appointmentSchema.parse(body)
    console.log("Datos validados:", JSON.stringify(validatedData, null, 2))

    // Verificar disponibilidad del doctor
    const doctorIdToCheck = validatedData.doctorId || validatedData.doctorProfileId
    const isDoctorProfile = !!validatedData.doctorProfileId
    console.log("Doctor ID a verificar:", doctorIdToCheck, "Es doctor profile:", isDoctorProfile)

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          { doctorId: isDoctorProfile ? null : doctorIdToCheck },
          { doctorProfileId: isDoctorProfile ? doctorIdToCheck : null }
        ],
        date: new Date(validatedData.date),
        status: {
          not: "CANCELLED"
        }
      }
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: "El doctor ya tiene una cita programada en esa fecha" },
        { status: 400 }
      )
    }

    const { patientId, doctorId, doctorProfileId, serviceId, ...appointmentData } = validatedData;
    console.log("Datos para crear cita:", { patientId, doctorId, doctorProfileId, serviceId, appointmentData })
    
    // Usar la variable isDoctorProfile ya declarada arriba
    const doctorIdToUse = isDoctorProfile ? doctorProfileId : doctorId;
    
    console.log("Tipo de doctor:", isDoctorProfile ? "doctorProfile" : "user", "ID:", doctorIdToUse);
    
    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(validatedData.date),
        reason: appointmentData.reason || "Consulta médica",
        notes: appointmentData.notes,
        status: appointmentData.status,
        patient: { connect: { id: patientId } },
        ...(isDoctorProfile ? 
          { doctorProfile: { connect: { id: doctorIdToUse } } } : 
          { doctor: { connect: { id: doctorIdToUse } } }
        ),
        ...(serviceId && serviceId !== "none" && serviceId !== "" && { service: { connect: { id: serviceId } } })
      },
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
            category: true
          }
        }
      }
    })

    console.log("Cita creada exitosamente:", appointment.id)
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("=== ERROR AL CREAR CITA ===")
    console.error("Error completo:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    
    if (error instanceof z.ZodError) {
      console.error("Error de validación Zod:", error.errors)
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al crear cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

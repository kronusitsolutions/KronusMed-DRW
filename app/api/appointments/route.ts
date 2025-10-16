import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { cache, DashboardCache } from "@/lib/cache"

// Optimizaciones para Node.js 22
const APPOINTMENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const DOCTOR_AVAILABILITY_CACHE_TTL = 2 * 60 * 1000 // 2 minutos

// Esquema de validación optimizado
const appointmentSchema = z.object({
  patientId: z.string().min(1, "El paciente es requerido"),
  doctorId: z.string().optional(),
  doctorProfileId: z.string().optional(),
  serviceId: z.string().optional().or(z.literal("")).or(z.literal("none")),
  date: z.string().min(1, "La fecha es requerida"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().min(1, "El motivo de la cita es requerido"),
  notes: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).default("SCHEDULED")
}).refine(data => data.doctorId || data.doctorProfileId, {
  message: "Debe seleccionar un doctor",
  path: ["doctorId"]
})

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

// Función optimizada para Node.js 22 - validar disponibilidad del doctor
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

    // Verificar caché primero (optimización Node.js 22)
    const cacheKey = `doctor_availability:${doctorId || doctorProfileId}:${date}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached as { available: boolean; message?: string }
    }

    // Construir where clause de manera más eficiente
    const whereClause = {
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        not: "CANCELLED" as const
      },
      ...(doctorId ? { doctorId } : { doctorProfileId }),
      ...(excludeId && { id: { not: excludeId } })
    }

    // Extraer ID real del doctor (remover prefijos como "user:" o "virtual:")
    const cleanDoctorId = doctorId?.includes(':') ? doctorId.split(':')[1] : doctorId
    const cleanDoctorProfileId = doctorProfileId?.includes(':') ? doctorProfileId.split(':')[1] : doctorProfileId


    // Usar Promise.all para operaciones paralelas (optimización Node.js 22)
    const [existingAppointment, doctorInfo] = await Promise.all([
      prisma.appointment.findFirst({ where: whereClause }),
      // Buscar en ambas tablas para mayor robustez
      Promise.all([
        cleanDoctorId ? prisma.user.findUnique({ where: { id: cleanDoctorId }, select: { name: true } }) : null,
        cleanDoctorProfileId ? prisma.doctor.findUnique({ where: { id: cleanDoctorProfileId }, select: { name: true } }) : null
      ]).then(([userDoctor, virtualDoctor]) => userDoctor || virtualDoctor)
    ])

    if (!doctorInfo) {
      return { available: false, message: "Doctor no encontrado" }
    }

    const result = {
      available: !existingAppointment,
      message: existingAppointment 
        ? `El doctor ${doctorInfo.name} ya tiene una cita programada en esa fecha` 
        : undefined
    }

    // Cachear resultado con TTL optimizado
    cache.set(cacheKey, result, DOCTOR_AVAILABILITY_CACHE_TTL)

    return result
  } catch (error) {
    console.error("Error validando disponibilidad:", error)
    return { available: false, message: "Error al verificar disponibilidad" }
  }
}

// GET - Obtener citas con filtros y paginación (optimizado para Node.js 22)
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (date) {
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

    // Verificar caché después de construir filtros (optimización Node.js 22)
    const cacheKey = `appointments:${JSON.stringify({ where, page, limit })}`
    const cachedResult = cache.get(cacheKey)
    
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }


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
        },
        orderBy: [
          { date: "asc" }
        ]
      }),
      prisma.appointment.count({ where })
    ])


    const result = {
      appointments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    }

    // Guardar en caché con TTL optimizado para Node.js 22
    cache.set(cacheKey, result, APPOINTMENT_CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al obtener citas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cita
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar datos
    const validatedData = appointmentSchema.parse(body)

    // Verificar disponibilidad del doctor
    const availability = await validateDoctorAvailability(
      validatedData.doctorId,
      validatedData.doctorProfileId,
      validatedData.date
    )

    if (!availability.available) {
      return NextResponse.json(
        { error: availability.message },
        { status: 400 }
      )
    }

    // Preparar datos para crear
    const { patientId, doctorId, doctorProfileId, serviceId, ...appointmentData } = validatedData

    // Extraer IDs limpios para la creación
    const cleanDoctorId = doctorId?.includes(':') ? doctorId.split(':')[1] : doctorId
    const cleanDoctorProfileId = doctorProfileId?.includes(':') ? doctorProfileId.split(':')[1] : doctorProfileId


    const appointmentDataToCreate = {
      date: new Date(validatedData.date),
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      reason: appointmentData.reason,
      notes: appointmentData.notes,
      status: appointmentData.status,
      patient: { connect: { id: patientId } },
      ...(cleanDoctorId && { doctor: { connect: { id: cleanDoctorId } } }),
      ...(cleanDoctorProfileId && { doctorProfile: { connect: { id: cleanDoctorProfileId } } }),
      ...(serviceId && serviceId !== "none" && serviceId !== "" && { service: { connect: { id: serviceId } } })
    }

    // Crear cita con transacción optimizada para Node.js 22
    const appointment = await prisma.$transaction(async (tx) => {
      const newAppointment = await tx.appointment.create({
        data: appointmentDataToCreate,
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

      return newAppointment
    })

    // Invalidar caché de manera eficiente (optimización Node.js 22)
    const cacheInvalidationPromises = [
      DashboardCache.invalidateDashboard(),
      cache.delete(`appointments:*`),
      cache.delete(`doctor_availability:${cleanDoctorId || cleanDoctorProfileId}:*`)
    ]
    
    // Ejecutar invalidación de caché en paralelo
    await Promise.all(cacheInvalidationPromises)

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Error al crear cita:", error)
    
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
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { encryptObject, decryptObject } from "@/lib/encryption.server"
import { logger } from "@/lib/logger"

const patientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
  age: z.number().min(0, "La edad debe ser mayor a 0").optional(), // Campo legacy
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  cedula: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    
    // Parámetros de paginación optimizados para producción
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 100) // Límite entre 1-100
    const skip = (page - 1) * limit

    const where: any = {}

    // Búsqueda optimizada con ILIKE para mejor rendimiento
    if (search && search.trim()) {
      const searchTerm = search.trim()
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } },
        { nationality: { contains: searchTerm, mode: "insensitive" } },
        { cedula: { contains: searchTerm, mode: "insensitive" } },
        { patientNumber: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } }
      ]
    }

    if (status) {
      where.status = status
    }

    // Consulta optimizada con paginación y conteo paralelo
    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          patientNumber: true,
          name: true,
          age: true,
          gender: true,
          phone: true,
          address: true,
          nationality: true,
          cedula: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.patient.count({ where })
    ])

    // Desencriptar datos para usuarios autorizados (médicos, facturación, administradores)
    const decryptedPatients = patients.map(patient => 
      decryptObject(patient, ['phone', 'address'])
    )

    const totalPages = Math.ceil(totalCount / limit)

    logger.info("Pacientes obtenidos con paginación", {
      count: patients.length,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasSearch: !!search,
      searchTerm: search
    })

    return NextResponse.json({
      patients: decryptedPatients,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    })
  } catch (error) {
    logger.error("Error al obtener pacientes:", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    
    console.log("Datos recibidos del frontend:", JSON.stringify(body, null, 2))
    
    const validatedData = patientSchema.parse(body)
    console.log("Datos validados exitosamente:", JSON.stringify(validatedData, null, 2))
    
    // Encriptar datos sensibles para almacenamiento seguro
    const encryptedData = encryptObject(validatedData, ['phone', 'address'])

    // Generar número de paciente único
    let patientNumber = "A000001"
    try {
      const lastPatient = await prisma.patient.findFirst({
        orderBy: { patientNumber: "desc" }
      })
      
      if (lastPatient) {
        const lastNumber = parseInt(lastPatient.patientNumber.substring(1))
        patientNumber = `A${String(lastNumber + 1).padStart(6, '0')}`
      }
    } catch (error) {
      logger.warn("Error al generar número de paciente, usando por defecto:", error instanceof Error ? error : new Error(String(error)))
    }

    const patient = await prisma.patient.create({
      data: {
        patientNumber,
        name: validatedData.name,
        birthDate: new Date(validatedData.birthDate),
        age: validatedData.age, // Mantener para compatibilidad
        gender: validatedData.gender,
        phone: encryptedData.phone,
        address: encryptedData.address,
        nationality: validatedData.nationality, // OPCIONAL
        cedula: validatedData.cedula, // OPCIONAL
        status: validatedData.status
      }
    })

    // Desencriptar datos para usuarios autorizados (médicos, facturación, administradores)
    const decryptedPatient = decryptObject(patient, ['phone', 'address'])

    logger.info("Paciente creado exitosamente", {
      patientId: patient.id,
      patientNumber: patient.patientNumber
    })

    return NextResponse.json(decryptedPatient, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Error de validación Zod:", error.errors)
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al crear paciente:", error)
    logger.error("Error al crear paciente:", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

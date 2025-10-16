import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { encryptObject, decryptObject } from "@/lib/encryption.server"
import { logger } from "@/lib/logger"

const patientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  age: z.number().min(0, "La edad debe ser mayor a 0"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional().transform(val => val === "" ? null : val),
  address: z.string().optional().transform(val => val === "" ? null : val),
  nationality: z.string().optional().transform(val => val === "" ? null : val), // OPCIONAL
  cedula: z.string().optional().transform(val => val === "" ? null : val), // OPCIONAL
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
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { nationality: { contains: search, mode: "insensitive" } },
        { cedula: { contains: search, mode: "insensitive" } },
        { patientNumber: { contains: search, mode: "insensitive" } }
      ]
    }

    if (status) {
      where.status = status
    }

    // Consulta optimizada con paginación
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

    // Desencriptar datos sensibles antes de enviar
    const decryptedPatients = patients.map(patient => 
      decryptObject(patient, ['phone', 'address'])
    )

    logger.info("Pacientes obtenidos exitosamente", {
      count: patients.length,
      total: totalCount,
      page,
      limit
    })

    return NextResponse.json({
      patients: decryptedPatients,
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
    
    const validatedData = patientSchema.parse(body)
    
    // Encriptar datos sensibles antes de guardar
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
        age: validatedData.age,
        gender: validatedData.gender,
        phone: encryptedData.phone,
        address: encryptedData.address,
        nationality: validatedData.nationality, // OPCIONAL
        cedula: validatedData.cedula, // OPCIONAL
        status: validatedData.status
      }
    })

    // Desencriptar datos antes de enviar
    const decryptedPatient = decryptObject(patient, ['phone', 'address'])

    logger.info("Paciente creado exitosamente", {
      patientId: patient.id,
      patientNumber: patient.patientNumber
    })

    return NextResponse.json(decryptedPatient, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Error al crear paciente:", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

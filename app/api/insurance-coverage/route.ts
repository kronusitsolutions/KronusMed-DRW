import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const coverageSchema = z.object({
  insuranceId: z.string().min(1, "ID del seguro es requerido"),
  serviceId: z.string().min(1, "ID del servicio es requerido"),
  coveragePercent: z.number().min(0).max(100, "El porcentaje debe estar entre 0 y 100"),
  isActive: z.boolean().default(true)
})

const updateCoverageSchema = z.object({
  id: z.string().min(1, "ID de la regla es requerido"),
  coveragePercent: z.number().min(0).max(100, "El porcentaje debe estar entre 0 y 100"),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const insuranceId = searchParams.get("insuranceId")
    const serviceId = searchParams.get("serviceId")

    const where: any = {}
    if (insuranceId) where.insuranceId = insuranceId
    if (serviceId) where.serviceId = serviceId

    const coverageRules = await prisma.insuranceCoverage.findMany({
      where,
      include: {
        insurance: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: [
        { insurance: { name: "asc" } },
        { service: { name: "asc" } }
      ]
    })

    return NextResponse.json(coverageRules)
  } catch (error) {
    console.error("Error al obtener reglas de cobertura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = coverageSchema.parse(body)

    // Verificar que el seguro y el servicio existen
    const [insurance, service] = await Promise.all([
      prisma.insurance.findUnique({ where: { id: validatedData.insuranceId } }),
      prisma.service.findUnique({ where: { id: validatedData.serviceId } })
    ])

    if (!insurance) {
      return NextResponse.json({ error: "Seguro no encontrado" }, { status: 404 })
    }

    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
    }

    const coverageRule = await prisma.insuranceCoverage.upsert({
      where: {
        insuranceId_serviceId: {
          insuranceId: validatedData.insuranceId,
          serviceId: validatedData.serviceId
        }
      },
      update: {
        coveragePercent: validatedData.coveragePercent,
        isActive: validatedData.isActive
      },
      create: {
        serviceId: validatedData.serviceId,
        insuranceId: validatedData.insuranceId,
        coveragePercent: validatedData.coveragePercent,
        isActive: validatedData.isActive
      },
      include: {
        insurance: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })

    return NextResponse.json(coverageRule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error al crear/actualizar regla de cobertura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCoverageSchema.parse(body)

    // Verificar que la regla existe
    const existingRule = await prisma.insuranceCoverage.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingRule) {
      return NextResponse.json({ error: "Regla de cobertura no encontrada" }, { status: 404 })
    }

    const updatedRule = await prisma.insuranceCoverage.update({
      where: { id: validatedData.id },
      data: {
        coveragePercent: validatedData.coveragePercent,
        isActive: validatedData.isActive
      },
      include: {
        insurance: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })

    return NextResponse.json(updatedRule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error al actualizar regla de cobertura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

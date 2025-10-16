import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const doctorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener doctores virtuales
    const virtualDoctors = await prisma.doctor.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    // Obtener usuarios con rol DOCTOR
    const userDoctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR"
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: "asc"
      }
    })

    // Combinar ambos tipos manteniendo compatibilidad
    const allDoctors = [
      ...userDoctors.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        type: "user"
      })),
      ...virtualDoctors.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email || d.user?.email,
        specialization: d.specialization,
        phone: d.phone,
        type: "virtual",
        userId: d.userId,
        status: d.status
      }))
    ]

    return NextResponse.json(allDoctors)
  } catch (error) {
    console.error("Error al obtener doctores:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = doctorSchema.parse(body)

    const doctor = await prisma.doctor.create({
      data: {
        name: validatedData.name,
        specialization: validatedData.specialization,
        phone: validatedData.phone,
        email: validatedData.email || null,
        notes: validatedData.notes,
        status: validatedData.status
      }
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error("Error al crear doctor:", error)
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

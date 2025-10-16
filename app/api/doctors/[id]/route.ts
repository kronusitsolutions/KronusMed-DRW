import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const doctorUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"])
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
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(doctor)
  } catch (error) {
    console.error("Error al obtener doctor:", error)
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
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = doctorUpdateSchema.parse(body)

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name: validatedData.name,
        specialization: validatedData.specialization,
        phone: validatedData.phone,
        email: validatedData.email || null,
        notes: validatedData.notes,
        status: validatedData.status
      }
    })

    return NextResponse.json(doctor)
  } catch (error) {
    console.error("Error al actualizar doctor:", error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar si el doctor tiene citas asociadas
    const appointmentsCount = await prisma.appointment.count({
      where: { doctorProfileId: id }
    })

    if (appointmentsCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el doctor porque tiene citas asociadas" },
        { status: 400 }
      )
    }

    await prisma.doctor.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar doctor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

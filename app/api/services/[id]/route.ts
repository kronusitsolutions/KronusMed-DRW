import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const serviceSchema = z.object({
  name: z.string().min(1, "El nombre del servicio es requerido"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor a 0"),
  category: z.string().optional(),
  isActive: z.boolean().default(true)
})

// GET individual service
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const service = await prisma.service.findUnique({
      where: { id: (await context.params).id }
    })

    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error("Error al obtener servicio:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT update service
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = serviceSchema.parse(body)

    const service = await prisma.service.update({
      where: { id: (await context.params).id },
      data: validatedData
    })

    return NextResponse.json(service)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al actualizar servicio:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PATCH update service (partial update)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    
    // Esquema más flexible para actualizaciones parciales
    const partialServiceSchema = z.object({
      name: z.string().min(1, "El nombre del servicio es requerido").optional(),
      description: z.string().optional(),
      price: z.number().min(0, "El precio debe ser mayor a 0").optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional()
    })

    const validatedData = partialServiceSchema.parse(body)

    // Verificar que el servicio existe
    const existingService = await prisma.service.findUnique({
      where: { id: (await context.params).id }
    })

    if (!existingService) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
    }

    const service = await prisma.service.update({
      where: { id: (await context.params).id },
      data: validatedData
    })

    return NextResponse.json(service)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al actualizar servicio:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE service
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el servicio existe
    const existingService = await prisma.service.findUnique({
      where: { id: (await context.params).id }
    })

    if (!existingService) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
    }

    // Verificar si el servicio está siendo usado en facturas
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: { serviceId: (await context.params).id }
    })

    if (invoiceItems.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el servicio porque está siendo usado en facturas" },
        { status: 400 }
      )
    }

    await prisma.service.delete({
      where: { id: (await context.params).id }
    })

    return NextResponse.json({ message: "Servicio eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar servicio:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

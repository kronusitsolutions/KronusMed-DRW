import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const invoiceDesignUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  logoUrl: z.string().optional(),
  logoPosition: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
  businessName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  customMessage: z.string().optional(),
  format: z.enum(["80MM", "LETTER"]).optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const design = await prisma.invoiceDesign.findUnique({
      where: { id }
    })

    if (!design) {
      return NextResponse.json({ error: "Diseño no encontrado" }, { status: 404 })
    }

    return NextResponse.json(design)
  } catch (error) {
    console.error("Error al obtener diseño de factura:", error)
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
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = invoiceDesignUpdateSchema.parse(body)

    // Verificar si el diseño existe
    const existingDesign = await prisma.invoiceDesign.findUnique({
      where: { id }
    })

    if (!existingDesign) {
      return NextResponse.json({ error: "Diseño no encontrado" }, { status: 404 })
    }

    // Si se está activando esta configuración, desactivar las demás
    if (validatedData.isActive === true) {
      await prisma.invoiceDesign.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      })
    }

    const updatedDesign = await prisma.invoiceDesign.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(updatedDesign)
  } catch (error) {
    console.error("Error al actualizar diseño de factura:", error)
    
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
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar si el diseño existe
    const existingDesign = await prisma.invoiceDesign.findUnique({
      where: { id }
    })

    if (!existingDesign) {
      return NextResponse.json({ error: "Diseño no encontrado" }, { status: 404 })
    }

    // No permitir eliminar la configuración activa
    if (existingDesign.isActive) {
      return NextResponse.json(
        { error: "No se puede eliminar la configuración activa" },
        { status: 400 }
      )
    }

    await prisma.invoiceDesign.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Diseño eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar diseño de factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const addServiceSchema = z.object({
  serviceId: z.string().min(1, "El servicio es requerido"),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0, "El precio unitario debe ser mayor o igual a 0"),
  totalPrice: z.number().min(0, "El precio total debe ser mayor o igual a 0")
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addServiceSchema.parse(body)
    const { id: invoiceId } = await context.params

    // Verificar que la factura existe y está en estado PENDING
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    if (invoice.status !== 'PENDING') {
      return NextResponse.json({ 
        error: "Solo se pueden modificar servicios en facturas pendientes" 
      }, { status: 400 })
    }

    // Verificar que el servicio existe
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
    }

    // Agregar el nuevo item a la factura
    const newItem = await prisma.invoiceItem.create({
      data: {
        invoiceId,
        serviceId: validatedData.serviceId,
        quantity: validatedData.quantity,
        unitPrice: validatedData.unitPrice,
        totalPrice: validatedData.totalPrice
      }
    })

    // Recalcular el total de la factura
    const allItems = await prisma.invoiceItem.findMany({
      where: { invoiceId }
    })

    const newTotalAmount = allItems.reduce((sum, item) => sum + item.totalPrice, 0)

    // Actualizar la factura con el nuevo total
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount: newTotalAmount,
        pendingAmount: newTotalAmount // Actualizar también el monto pendiente
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            nationality: true,
            cedula: true
          }
        },
        items: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Servicio agregado exitosamente",
      invoice: updatedInvoice,
      newItem
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al agregar servicio:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: invoiceId, itemId } = await context.params

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

    // Verificar que el item existe
    const item = await prisma.invoiceItem.findUnique({
      where: { id: itemId }
    })

    if (!item || item.invoiceId !== invoiceId) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    }

    // Verificar que no es el último item de la factura
    const remainingItems = await prisma.invoiceItem.count({
      where: { 
        invoiceId,
        id: { not: itemId }
      }
    })

    if (remainingItems === 0) {
      return NextResponse.json({ 
        error: "No se puede eliminar el último servicio de la factura" 
      }, { status: 400 })
    }

    // Eliminar el item
    await prisma.invoiceItem.delete({
      where: { id: itemId }
    })

    // Recalcular el total de la factura
    const remainingItemsData = await prisma.invoiceItem.findMany({
      where: { invoiceId }
    })

    const newTotalAmount = remainingItemsData.reduce((sum, item) => sum + item.totalPrice, 0)

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
      message: "Servicio eliminado exitosamente",
      invoice: updatedInvoice
    })

  } catch (error) {
    console.error("Error al eliminar servicio:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

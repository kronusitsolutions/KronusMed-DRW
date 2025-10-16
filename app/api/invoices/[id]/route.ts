import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Helper function para mapear estados (ya no es necesario mapear EXONERATED)
function mapStatusForDB(status: string): string {
  return status
}

function mapStatusForResponse(invoice: any): any {
  return invoice
}

const updateInvoiceSchema = z.object({
  status: z.enum(["PENDING", "PARTIAL", "PAID", "CANCELLED", "EXONERATED", "OVERDUE"]).optional(),
  paidAt: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let body: any = null
  let validatedData: any = null
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    body = await request.json()
    validatedData = updateInvoiceSchema.parse(body)

    const updateData: any = {}
    
    if (validatedData.status) {
      updateData.status = validatedData.status
      
      // Si el estado cambia a PAID, establecer paidAt
      if (validatedData.status === "PAID") {
        updateData.paidAt = new Date()
      } else {
        updateData.paidAt = null
      }
    }

    const { id } = await context.params
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(invoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al actualizar factura:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: body,
      validatedData: validatedData
    })
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo administradores pueden eliminar facturas
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo administradores pueden eliminar facturas." }, { status: 401 })
    }

    // Verificar que la factura existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: (await context.params).id }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Eliminar la factura (los items se eliminan automáticamente por CASCADE)
    await prisma.invoice.delete({
      where: { id: (await context.params).id }
    })

    return NextResponse.json({ message: "Factura eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

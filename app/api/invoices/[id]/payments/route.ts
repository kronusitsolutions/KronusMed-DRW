import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const paymentSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a 0"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
})

// Crear un nuevo pago para una factura
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
    const validatedData = paymentSchema.parse(body)
    const { id: invoiceId } = await context.params

    // Verificar que la factura existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Verificar que el pago no exceda el monto pendiente
    if (validatedData.amount > invoice.pendingAmount) {
      return NextResponse.json({ 
        error: `El monto del pago (${validatedData.amount}) no puede exceder el monto pendiente (${invoice.pendingAmount})` 
      }, { status: 400 })
    }

    // Crear el pago
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes
      }
    })

    // Actualizar la factura con los nuevos montos
    const newPaidAmount = invoice.paidAmount + validatedData.amount
    const newPendingAmount = invoice.totalAmount - newPaidAmount
    
    // Determinar el nuevo estado
    let newStatus = invoice.status
    if (newPendingAmount <= 0) {
      newStatus = "PAID"
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL"
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newStatus,
        paidAt: newStatus === "PAID" ? new Date() : invoice.paidAt
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
        },
        payments: {
          orderBy: {
            paidAt: 'desc'
          }
        }
      }
    })

    return NextResponse.json({
      invoice: updatedInvoice,
      payment: payment
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Datos inválidos", 
        details: error.errors 
      }, { status: 400 })
    }

    console.error("Error al crear pago:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}

// Obtener todos los pagos de una factura
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: invoiceId } = await context.params

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: {
        paidAt: 'desc'
      }
    })

    return NextResponse.json(payments)

  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: invoiceId, paymentId } = await context.params

    // Obtener el pago específico con la factura relacionada
    const payment = await prisma.invoicePayment.findFirst({
      where: { 
        id: paymentId,
        invoiceId: invoiceId 
      },
      include: {
        invoice: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                phone: true,
                nationality: true,
                cedula: true,
                patientNumber: true,
                insurance: {
                  select: {
                    name: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                name: true
              }
            },
            items: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    price: true
                  }
                }
              }
            },
            exoneration: {
              select: {
                exoneratedAmount: true,
                reason: true,
                author: {
                  select: {
                    name: true
                  }
                }
              }
            },
            payments: {
              orderBy: {
                paidAt: 'desc'
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ 
      payment,
      invoice: payment.invoice
    })
  } catch (error) {
    console.error("Error al obtener pago para impresión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

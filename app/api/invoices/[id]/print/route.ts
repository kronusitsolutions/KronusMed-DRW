import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: invoiceId } = await context.params

    // Obtener la factura completa con todos sus items para impresión
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
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
        },
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Error al obtener factura para impresión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

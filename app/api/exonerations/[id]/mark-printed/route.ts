import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params

    const exoneration = await prisma.invoiceExoneration.update({
      where: { id },
      data: {
        isPrinted: true,
        printedAt: new Date()
      },
      include: {
        invoice: {
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
        },
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      exoneration,
      message: "Exoneración marcada como impresa"
    })
  } catch (error) {
    console.error("Error al marcar exoneración como impresa:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const patientId = searchParams.get("patientId")
    const includePrinted = searchParams.get("includePrinted") === "true"

    const where: any = {}

    // Filtros de fecha
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Filtro por paciente
    if (patientId) {
      where.invoice = {
        patientId: patientId
      }
    }

    // Filtro por impresión
    if (!includePrinted) {
      where.isPrinted = false
    }

    const exonerations = await prisma.invoiceExoneration.findMany({
      where,
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
      },
      orderBy: { createdAt: "desc" }
    })

    // Calcular totales
    const totals = exonerations.reduce((acc: any, exoneration: any) => {
      acc.totalExonerated += exoneration.exoneratedAmount
      acc.count += 1
      return acc
    }, { totalExonerated: 0, count: 0 })

    return NextResponse.json({
      exonerations,
      totals,
      summary: {
        totalExonerated: totals.totalExonerated,
        totalCount: totals.count,
        printedCount: exonerations.filter((e: any) => e.isPrinted).length,
        pendingPrintCount: exonerations.filter((e: any) => !e.isPrinted).length
      }
    })
  } catch (error) {
    console.error("Error al obtener exoneraciones:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

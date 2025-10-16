import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const exonerationSchema = z.object({
  reason: z.string().min(1, "La razón es requerida"),
  exoneratedAmount: z.number().min(0, "El monto exonerado debe ser mayor o igual a 0"),
  originalAmount: z.number().min(0, "El monto original debe ser mayor o igual a 0")
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
    const validatedData = exonerationSchema.parse(body)

    const { id } = await context.params

    // Verificar que la factura existe y no está ya exonerada
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        exoneration: true
      }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    if (existingInvoice.status === "EXONERATED") {
      return NextResponse.json({ error: "La factura ya está exonerada" }, { status: 400 })
    }

    if (existingInvoice.exoneration) {
      return NextResponse.json({ error: "La factura ya tiene una exoneración registrada" }, { status: 400 })
    }

    // Crear la exoneración y actualizar el estado de la factura en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el registro de exoneración
      const exoneration = await tx.invoiceExoneration.create({
        data: {
          invoiceId: id,
          exoneratedAmount: validatedData.exoneratedAmount,
          originalAmount: validatedData.originalAmount,
          reason: validatedData.reason,
          authorizedBy: session.user.id
        }
      })

      // Actualizar el estado de la factura a EXONERATED
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          status: "EXONERATED"
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
          exoneration: {
            include: {
              author: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      return { invoice: updatedInvoice, exoneration }
    })

    return NextResponse.json({
      message: "Factura exonerada exitosamente",
      invoice: result.invoice,
      exoneration: result.exoneration
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al exonerar factura:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
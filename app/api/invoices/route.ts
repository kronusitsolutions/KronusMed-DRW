import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isInsuranceBillingEnabled } from "@/lib/insurance-calculator"

// Helper function para mapear estados en respuestas
function mapInvoiceStatus(invoice: any): any {
  if (invoice.status === "OVERDUE") {
    return { ...invoice, status: "EXONERATED" }
  }
  return invoice
}

const invoiceItemSchema = z.object({
  serviceId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  notes: z.string().optional()
})

const invoiceSchema = z.object({
  patientId: z.string(),
  items: z.array(invoiceItemSchema).min(1, "Debe incluir al menos un servicio"),
  totalAmount: z.number().min(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  insuranceCalculation: z.any().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    
    // Parámetros de paginación optimizados para producción
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 100) // Límite entre 1-100
    const skip = (page - 1) * limit

    const where: any = {}

    if (patientId) {
      where.patientId = patientId
    }

    if (status) {
      where.status = status
    }

    // Búsqueda optimizada
    if (search && search.trim()) {
      const searchTerm = search.trim()
      where.OR = [
        { invoiceNumber: { contains: searchTerm, mode: "insensitive" } },
        { 
          patient: {
            name: { contains: searchTerm, mode: "insensitive" }
          }
        },
        { 
          patient: {
            patientNumber: { contains: searchTerm, mode: "insensitive" }
          }
        }
      ]
    }

    // Consulta optimizada con paginación
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.invoice.count({ where })
    ])

    // Mapear OVERDUE a EXONERATED en la respuesta
    const mappedInvoices = invoices.map(mapInvoiceStatus)

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      invoices: mappedInvoices,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    })
  } catch (error) {
    console.error("Error al obtener facturas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = invoiceSchema.parse(body)

    // Verificar si el sistema de seguros está habilitado
    const insuranceBillingEnabled = await isInsuranceBillingEnabled()
    
    let finalTotalAmount = validatedData.totalAmount
    let insuranceCalculation = validatedData.insuranceCalculation || null

    // Si el sistema de seguros está habilitado y no se proporcionaron datos de cálculo
    if (insuranceBillingEnabled && !insuranceCalculation) {
      try {
        // TODO: Implementar llamada a la nueva API de cálculo de seguros
        // insuranceCalculation = await calculateInsuranceCoverage(
        //   validatedData.patientId,
        //   validatedData.items.map(item => ({
        //     serviceId: item.serviceId,
        //     quantity: item.quantity,
        //     unitPrice: item.unitPrice
        //   }))
        // )
        
        // Usar el total calculado con seguros
        finalTotalAmount = insuranceCalculation.totalPatientPays
      } catch (error) {
        console.error("Error al calcular cobertura de seguros:", error)
        // Continuar con el total original si hay error en el cálculo
      }
    } else if (insuranceCalculation) {
      // Usar los datos de cálculo proporcionados
      finalTotalAmount = insuranceCalculation.totalPatientPays || validatedData.totalAmount
    }

    // Generar número de factura único con formato INV-00000001 (8 dígitos)
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' }
    })
    
    let invoiceNumber = 'INV-00000001'
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const numberPart = lastInvoice.invoiceNumber.substring(4)
      const nextNumber = parseInt(numberPart) + 1
      const formattedNumber = nextNumber.toString().padStart(8, '0')
      invoiceNumber = `INV-${formattedNumber}`
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: validatedData.patientId,
        userId: session.user.id,
        totalAmount: finalTotalAmount,
        paidAmount: 0, // Inicializar en 0
        pendingAmount: finalTotalAmount, // Inicialmente igual al total
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        notes: validatedData.notes,
        insuranceCalculation: insuranceCalculation,
        items: {
          create: validatedData.items.map(item => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes
          }))
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            nationality: true,
            cedula: true
            // insurance: {
            //   select: {
            //     id: true,
            //     name: true
            //   }
            // }
          }
        },
        items: {
          include: {
            service: true
          }
        }
      }
    })

    // Incluir información de cálculo de seguros en la respuesta
    const response = {
      ...invoice,
      insuranceCalculation
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al crear factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

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
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    console.log('API daily-sales recibió:', { date, startDate, endDate })
    
    // Determinar el rango de fechas
    let startOfPeriod: Date
    let endOfPeriod: Date
    let periodLabel: string
    
    if (startDate && endDate) {
      // Usar rango personalizado con zona horaria local
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
      startOfPeriod = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
      endOfPeriod = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
      periodLabel = `Del ${startDate} al ${endDate}`
    } else if (date) {
      // Usar fecha específica con zona horaria local
      const [year, month, day] = date.split('-').map(Number)
      startOfPeriod = new Date(year, month - 1, day, 0, 0, 0, 0)
      endOfPeriod = new Date(year, month - 1, day, 23, 59, 59, 999)
      periodLabel = date
    } else {
      // Usar fecha actual por defecto
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      const [year, month, day] = todayString.split('-').map(Number)
      startOfPeriod = new Date(year, month - 1, day, 0, 0, 0, 0)
      endOfPeriod = new Date(year, month - 1, day, 23, 59, 59, 999)
      periodLabel = todayString
    }

    // Consultas paralelas para obtener todos los datos del período
    const [
      dailyInvoices,
      dailyExonerations,
      serviceStats,
      totalStats
    ] = await Promise.all([
      // Facturas del período con detalles
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod
          }
        },
        include: {
          patient: {
            select: {
              name: true,
              patientNumber: true
            }
          },
          user: {
            select: {
              name: true
            }
          },
          items: {
            include: {
              service: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          exoneration: {
            select: {
              reason: true,
              originalAmount: true,
              exoneratedAmount: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),

      // Exoneraciones del período
      prisma.invoiceExoneration.findMany({
        where: {
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod
          }
        },
        include: {
          invoice: {
            include: {
              patient: {
                select: {
                  name: true,
                  patientNumber: true
                }
              }
            }
          },
          author: {
            select: {
              name: true
            }
          }
        }
      }),

      // Estadísticas de servicios del período (solo facturas pagadas)
      prisma.invoiceItem.groupBy({
        by: ['serviceId'],
        where: {
          invoice: {
            createdAt: {
              gte: startOfPeriod,
              lte: endOfPeriod
            },
            status: 'PAID' // Solo incluir facturas pagadas
          }
        },
        _sum: {
          totalPrice: true,
          quantity: true
        },
        _count: {
          serviceId: true
        },
        orderBy: {
          _sum: {
            totalPrice: 'desc'
          }
        }
      }),

      // Estadísticas totales del período
      prisma.invoice.aggregate({
        where: {
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      })
    ])

    // Obtener detalles de los servicios más utilizados
    const serviceDetails = await Promise.all(
      serviceStats.map(async (stat) => {
        const service = await prisma.service.findUnique({
          where: { id: stat.serviceId },
          select: {
            name: true,
            category: true,
            price: true
          }
        })
        return {
          ...service,
          totalRevenue: stat._sum.totalPrice || 0,
          totalQuantity: stat._sum.quantity || 0,
          invoiceCount: stat._count.serviceId || 0
        }
      })
    )

    // Calcular estadísticas por estado
    const invoicesByStatus = dailyInvoices.reduce((acc, invoice) => {
      const status = invoice.status
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0, paidAmount: 0, pendingAmount: 0 }
      }
      acc[status].count++
      acc[status].amount += invoice.totalAmount
      
      // Para facturas parciales, también contar montos pagados y pendientes
      if (status === 'PARTIAL') {
        acc[status].paidAmount += (invoice.paidAmount || 0)
        acc[status].pendingAmount += (invoice.pendingAmount || 0)
      }
      
      return acc
    }, {} as Record<string, { count: number; amount: number; paidAmount?: number; pendingAmount?: number }>)

    // Calcular totales
    // Total Facturado: Solo montos realmente cobrados (PAID + paidAmount de PARTIAL)
    const totalFacturado = (invoicesByStatus.PAID?.amount || 0) + (invoicesByStatus.PARTIAL?.paidAmount || 0)
    const totalFacturas = totalStats._count.id || 0
    const totalExonerado = dailyExonerations.reduce((sum, ex) => sum + (ex.originalAmount || 0), 0)
    const totalPendiente = (invoicesByStatus.PENDING?.amount || 0) + (invoicesByStatus.PARTIAL?.pendingAmount || 0)
    const totalPagado = (invoicesByStatus.PAID?.amount || 0) + (invoicesByStatus.PARTIAL?.paidAmount || 0)

    // Preparar datos para el reporte
    const reportData = {
      date: periodLabel,
      summary: {
        totalFacturado,
        totalFacturas,
        totalPagado,
        totalPendiente,
        totalExonerado,
        facturasPagadas: invoicesByStatus.PAID?.count || 0,
        facturasPendientes: invoicesByStatus.PENDING?.count || 0,
        facturasParciales: invoicesByStatus.PARTIAL?.count || 0,
        facturasExoneradas: invoicesByStatus.EXONERATED?.count || 0,
        montoParcialPagado: invoicesByStatus.PARTIAL?.paidAmount || 0,
        montoParcialPendiente: invoicesByStatus.PARTIAL?.pendingAmount || 0
      },
      invoices: dailyInvoices.map(invoice => {
        // Crear lista de servicios principales para mostrar en la tabla
        const mainServices = invoice.items.map(item => item.service.name).join(', ')
        const serviceCategories = [...new Set(invoice.items.map(item => item.service.category))].join(', ')
        
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          patientName: invoice.patient.name,
          patientNumber: invoice.patient.patientNumber,
          doctorName: invoice.user.name,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
          createdAt: invoice.createdAt,
          paidAmount: invoice.paidAmount || 0,
          pendingAmount: invoice.pendingAmount || 0,
          mainServices, // Servicios principales para mostrar en la tabla
          serviceCategories, // Categorías de servicios
          items: invoice.items.map(item => ({
            serviceName: item.service.name,
            category: item.service.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          exoneration: invoice.exoneration ? {
            reason: invoice.exoneration.reason,
            originalAmount: invoice.exoneration.originalAmount,
            exoneratedAmount: invoice.exoneration.exoneratedAmount
          } : null
        }
      }),
      exonerations: dailyExonerations.map(ex => ({
        id: ex.id,
        invoiceNumber: ex.invoice.invoiceNumber,
        patientName: ex.invoice.patient.name,
        patientNumber: ex.invoice.patient.patientNumber,
        reason: ex.reason,
        originalAmount: ex.originalAmount,
        exoneratedAmount: ex.exoneratedAmount,
        authorizedBy: ex.author.name,
        createdAt: ex.createdAt
      })),
      serviceBreakdown: serviceDetails,
      invoicesByStatus
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error("Error al generar reporte de ventas del día:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

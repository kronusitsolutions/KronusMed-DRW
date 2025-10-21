import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { comparePeriods, formatComparisonData } from "@/lib/period-comparison"
import { PeriodData } from "@/lib/report-calculations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const currentStartDate = searchParams.get("currentStartDate")
    const currentEndDate = searchParams.get("currentEndDate")
    const previousStartDate = searchParams.get("previousStartDate")
    const previousEndDate = searchParams.get("previousEndDate")

    if (!currentStartDate || !currentEndDate || !previousStartDate || !previousEndDate) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 })
    }

    const currentStart = new Date(currentStartDate)
    const currentEnd = new Date(currentEndDate)
    const previousStart = new Date(previousStartDate)
    const previousEnd = new Date(previousEndDate)

    // Obtener datos del período actual
    const [currentInvoices, currentAppointments, currentPatients] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: currentStart,
            lte: currentEnd
          }
        },
        include: {
          patient: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          items: {
            include: {
              service: { select: { name: true, category: true, price: true } }
            }
          }
        }
      }),
      prisma.appointment.findMany({
        where: {
          date: {
            gte: currentStart,
            lte: currentEnd
          }
        },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } }
        }
      }),
      prisma.patient.findMany({
        where: {
          createdAt: {
            gte: currentStart,
            lte: currentEnd
          },
          status: 'ACTIVE'
        }
      })
    ])

    // Obtener datos del período anterior
    const [previousInvoices, previousAppointments, previousPatients] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd
          }
        },
        include: {
          patient: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          items: {
            include: {
              service: { select: { name: true, category: true, price: true } }
            }
          }
        }
      }),
      prisma.appointment.findMany({
        where: {
          date: {
            gte: previousStart,
            lte: previousEnd
          }
        },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } }
        }
      }),
      prisma.patient.findMany({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd
          },
          status: 'ACTIVE'
        }
      })
    ])

    // Calcular métricas del período actual
    const currentPaidInvoices = currentInvoices.filter(invoice => invoice.status === 'PAID')
    const currentPendingInvoices = currentInvoices.filter(invoice => invoice.status === 'PENDING')
    const currentPartialInvoices = currentInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const currentExoneratedInvoices = currentInvoices.filter(invoice => invoice.status === 'EXONERATED')

    const currentRevenue = currentPaidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) + 
                         currentPartialInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0)
    
    const currentTotalInvoices = currentInvoices.length
    const currentTotalAppointments = currentAppointments.length
    const currentTotalPatients = currentPatients.length
    const currentAvgRevenuePerAppointment = currentTotalAppointments > 0 ? currentRevenue / currentTotalAppointments : 0
    const currentCollectionRate = currentTotalInvoices > 0 ? (currentPaidInvoices.length / currentTotalInvoices) * 100 : 0
    const currentExoneratedPercentage = currentTotalInvoices > 0 ? (currentExoneratedInvoices.length / currentTotalInvoices) * 100 : 0

    // Calcular métricas del período anterior
    const previousPaidInvoices = previousInvoices.filter(invoice => invoice.status === 'PAID')
    const previousPendingInvoices = previousInvoices.filter(invoice => invoice.status === 'PENDING')
    const previousPartialInvoices = previousInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const previousExoneratedInvoices = previousInvoices.filter(invoice => invoice.status === 'EXONERATED')

    const previousRevenue = previousPaidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) + 
                          previousPartialInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0)
    
    const previousTotalInvoices = previousInvoices.length
    const previousTotalAppointments = previousAppointments.length
    const previousTotalPatients = previousPatients.length
    const previousAvgRevenuePerAppointment = previousTotalAppointments > 0 ? previousRevenue / previousTotalAppointments : 0
    const previousCollectionRate = previousTotalInvoices > 0 ? (previousPaidInvoices.length / previousTotalInvoices) * 100 : 0
    const previousExoneratedPercentage = previousTotalInvoices > 0 ? (previousExoneratedInvoices.length / previousTotalInvoices) * 100 : 0

    // Crear objetos PeriodData
    const currentPeriod: PeriodData = {
      startDate: currentStart,
      endDate: currentEnd,
      totalRevenue: currentRevenue,
      totalInvoices: currentTotalInvoices,
      paidInvoices: currentPaidInvoices.length,
      pendingInvoices: currentPendingInvoices.length,
      partialInvoices: currentPartialInvoices.length,
      exoneratedInvoices: currentExoneratedInvoices.length,
      totalPatients: currentTotalPatients,
      totalAppointments: currentTotalAppointments,
      avgRevenuePerAppointment: currentAvgRevenuePerAppointment,
      collectionRate: currentCollectionRate,
      exoneratedPercentage: currentExoneratedPercentage
    }

    const previousPeriod: PeriodData = {
      startDate: previousStart,
      endDate: previousEnd,
      totalRevenue: previousRevenue,
      totalInvoices: previousTotalInvoices,
      paidInvoices: previousPaidInvoices.length,
      pendingInvoices: previousPendingInvoices.length,
      partialInvoices: previousPartialInvoices.length,
      exoneratedInvoices: previousExoneratedInvoices.length,
      totalPatients: previousTotalPatients,
      totalAppointments: previousTotalAppointments,
      avgRevenuePerAppointment: previousAvgRevenuePerAppointment,
      collectionRate: previousCollectionRate,
      exoneratedPercentage: previousExoneratedPercentage
    }

    // Realizar comparación
    const comparison = comparePeriods(currentPeriod, previousPeriod)
    const formattedData = formatComparisonData(comparison)

    return NextResponse.json({
      periods: {
        current: {
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
          label: `${currentStart.toLocaleDateString('es-ES')} - ${currentEnd.toLocaleDateString('es-ES')}`
        },
        previous: {
          startDate: previousStart.toISOString(),
          endDate: previousEnd.toISOString(),
          label: `${previousStart.toLocaleDateString('es-ES')} - ${previousEnd.toLocaleDateString('es-ES')}`
        }
      },
      comparison: formattedData,
      rawData: {
        current: currentPeriod,
        previous: previousPeriod
      }
    })

  } catch (error) {
    console.error("Error al generar comparación de períodos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

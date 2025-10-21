import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  calculateAgingReport, 
  calculatePatientMetrics, 
  calculatePartialPaymentsTrend,
  calculatePartialPaymentConversion,
  calculateDelinquencyRate,
  calculateAverageDaysOverdue,
  PeriodData
} from "@/lib/report-calculations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const period = searchParams.get("period") || "6" // meses por defecto

    // Calcular fechas según el período
    let dateFilter = {}
    let periodLabel = ""

    if (startDate && endDate) {
      // Rango personalizado
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
      periodLabel = `Del ${new Date(startDate).toLocaleDateString('es-ES')} al ${new Date(endDate).toLocaleDateString('es-ES')}`
    } else {
      // Período predefinido
      const months = parseInt(period)
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
      
      dateFilter = {
        createdAt: {
          gte: from,
          lte: now
        }
      }
      periodLabel = `Últimos ${months} meses`
    }

    // Obtener TODOS los datos sin filtros de fecha para cálculos globales
    const [
      allInvoices,
      allPatients,
      allAppointments,
      allServices
    ] = await Promise.all([
      // Todas las facturas con relaciones
      prisma.invoice.findMany({
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              patientNumber: true
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
                  category: true,
                  price: true
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
        orderBy: { createdAt: 'desc' }
      }),

      // Todos los pacientes activos
      prisma.patient.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          age: true,
          birthDate: true,
          gender: true,
          nationality: true,
          createdAt: true,
          appointments: {
            select: {
              id: true,
              date: true,
              status: true
            }
          },
          invoices: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true
            }
          }
        }
      }),

      // Todas las citas
      prisma.appointment.findMany({
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              patientNumber: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        orderBy: { date: 'desc' }
      }),

      // Todos los servicios
      prisma.service.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          price: true
        }
      })
    ])

    // Filtrar datos por el período seleccionado
    const invoicesInRange = allInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt)
      if (startDate && endDate) {
        return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate)
      } else {
        const months = parseInt(period)
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
        return invoiceDate >= from && invoiceDate <= now
      }
    })

    const appointmentsInRange = allAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      if (startDate && endDate) {
        return appointmentDate >= new Date(startDate) && appointmentDate <= new Date(endDate)
      } else {
        const months = parseInt(period)
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
        return appointmentDate >= from && appointmentDate <= now
      }
    })

    // Calcular estadísticas globales (sin filtro de fecha)
    const totalInvoices = allInvoices.length
    const paidInvoices = allInvoices.filter(invoice => invoice.status === 'PAID')
    const pendingInvoices = allInvoices.filter(invoice => invoice.status === 'PENDING')
    const partialInvoices = allInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const exoneratedInvoices = allInvoices.filter(invoice => invoice.status === 'EXONERATED' || invoice.exoneration)
    
    // Total Revenue: Solo montos realmente cobrados (PAID + paidAmount de PARTIAL)
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) + 
                        partialInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0)
    
    const totalPaidRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const totalPendingRevenue = pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const totalPartialRevenue = partialInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0)
    const totalPartialPendingRevenue = partialInvoices.reduce((sum, invoice) => sum + (invoice.pendingAmount || 0), 0)
    const totalExoneratedRevenue = exoneratedInvoices.reduce((sum, invoice) => {
      return sum + (invoice.exoneration?.originalAmount || invoice.totalAmount || 0)
    }, 0)

    // Calcular estadísticas del período seleccionado
    const periodPaidInvoices = invoicesInRange.filter(invoice => invoice.status === 'PAID')
    const periodPendingInvoices = invoicesInRange.filter(invoice => invoice.status === 'PENDING')
    const periodPartialInvoices = invoicesInRange.filter(invoice => invoice.status === 'PARTIAL')
    const periodExoneratedInvoices = invoicesInRange.filter(invoice => invoice.status === 'EXONERATED' || invoice.exoneration)

    const periodRevenue = periodPaidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const periodPendingRevenue = periodPendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const periodPartialRevenue = periodPartialInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0)
    const periodPartialPendingRevenue = periodPartialInvoices.reduce((sum, invoice) => sum + (invoice.pendingAmount || 0), 0)
    const periodExoneratedRevenue = periodExoneratedInvoices.reduce((sum, invoice) => {
      return sum + (invoice.exoneration?.originalAmount || invoice.totalAmount || 0)
    }, 0)

    // Calcular ingresos mensuales para el período
    const monthlyRevenue = []
    if (startDate && endDate) {
      // Para rango personalizado, agrupar por mes
      const start = new Date(startDate)
      const end = new Date(endDate)
      const months = []
      
      let current = new Date(start.getFullYear(), start.getMonth(), 1)
      while (current <= end) {
        months.push(new Date(current))
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      }

      months.forEach(month => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        
        const monthInvoices = allInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt)
          return invoiceDate >= monthStart && invoiceDate <= monthEnd && (invoice.status === 'PAID' || invoice.status === 'PARTIAL')
        })
        
        const revenue = monthInvoices.reduce((sum, invoice) => {
          if (invoice.status === 'PAID') {
            return sum + invoice.totalAmount
          } else if (invoice.status === 'PARTIAL') {
            return sum + (invoice.paidAmount || 0)
          }
          return sum
        }, 0)
        
        monthlyRevenue.push({
          month: month.toLocaleDateString('es-ES', { month: 'short' }),
          revenue
        })
      })
    } else {
      // Para período predefinido
      const months = parseInt(period)
      const now = new Date()
      
      for (let i = 0; i < months; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        
        const monthInvoices = allInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt)
          return invoiceDate >= monthStart && invoiceDate <= monthEnd && (invoice.status === 'PAID' || invoice.status === 'PARTIAL')
        })
        
        const revenue = monthInvoices.reduce((sum, invoice) => {
          if (invoice.status === 'PAID') {
            return sum + invoice.totalAmount
          } else if (invoice.status === 'PARTIAL') {
            return sum + (invoice.paidAmount || 0)
          }
          return sum
        }, 0)
        
        monthlyRevenue.push({
          month: month.toLocaleDateString('es-ES', { month: 'short' }),
          revenue
        })
      }
    }

    // Calcular servicios más populares del período
    const serviceStats = new Map<string, { revenue: number; count: number }>()
    
    periodPaidInvoices.forEach(invoice => {
      if (invoice.items) {
        invoice.items.forEach(item => {
          const serviceName = item.service?.name || 'Servicio'
          const current = serviceStats.get(serviceName) || { revenue: 0, count: 0 }
          serviceStats.set(serviceName, {
            revenue: current.revenue + (item.totalPrice || item.unitPrice * item.quantity),
            count: current.count + item.quantity
          })
        })
      }
    })

    const topServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calcular estadísticas por médico
    const doctorStats = new Map<string, { patients: Set<string>; appointments: number; completed: number }>()
    
    appointmentsInRange.forEach(appointment => {
      const doctorName = appointment.doctor?.name || 'Médico'
      const current = doctorStats.get(doctorName) || { patients: new Set(), appointments: 0, completed: 0 }
      current.patients.add(appointment.patientId)
      current.appointments++
      if (appointment.status === 'COMPLETED') current.completed++
      doctorStats.set(doctorName, current)
    })

    const doctorPatients = Array.from(doctorStats.entries()).map(([doctorName, stats]) => ({
      doctorName,
      patientCount: stats.patients.size,
      appointmentCount: stats.appointments,
      completedAppointments: stats.completed
    }))

    // Calcular tendencias de adquisición
    const acquisitionTrends = monthlyRevenue.map((monthData, index) => {
      const month = new Date()
      if (startDate && endDate) {
        const start = new Date(startDate)
        month.setFullYear(start.getFullYear())
        month.setMonth(start.getMonth() + index)
      } else {
        month.setMonth(month.getMonth() - (parseInt(period) - 1 - index))
      }
      
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
      
      const monthPatients = allPatients.filter(patient => {
        const patientDate = new Date(patient.createdAt)
        return patientDate >= monthStart && patientDate <= monthEnd
      })
      
      const newPatients = monthPatients.length
      const returningPatients = appointmentsInRange.filter(appointment => {
        const appointmentDate = new Date(appointment.date)
        return appointmentDate >= monthStart && appointmentDate <= monthEnd && 
               appointment.patient
      }).length
      
      return {
        month: monthData.month,
        newPatients,
        returningPatients
      }
    })

    // Calcular exoneraciones del período
    const exonerationsByReason = new Map<string, { count: number; amount: number }>()
    
    periodExoneratedInvoices.forEach(invoice => {
      const reason = invoice.exoneration?.reason || 'Sin razón especificada'
      const current = exonerationsByReason.get(reason) || { count: 0, amount: 0 }
      const amount = invoice.exoneration?.originalAmount || invoice.totalAmount || 0
      exonerationsByReason.set(reason, {
        count: current.count + 1,
        amount: current.amount + amount
      })
    })

    const exonerationsByReasonArray = Array.from(exonerationsByReason.entries())
      .map(([reason, stats]) => ({ reason, ...stats }))
      .sort((a, b) => b.amount - a.amount)

    // Calcular métricas finales
    const totalAppointments = appointmentsInRange.length
    const activePatients = allPatients.length
    const avgRevenuePerAppointment = totalAppointments > 0 ? periodRevenue / totalAppointments : 0
    const exoneratedPercentage = totalInvoices > 0 ? (exoneratedInvoices.length / totalInvoices) * 100 : 0
    const collectionRate = totalInvoices > 0 ? (paidInvoices.length / totalInvoices) * 100 : 0

    // Calcular fechas reales del período
    let actualStartDate: string = startDate || ''
    let actualEndDate: string = endDate || ''
    
    if (!actualStartDate || !actualEndDate) {
      // Si no hay fechas específicas, calcular basado en el período
      const months = parseInt(period)
      actualEndDate = new Date().toISOString().split('T')[0]
      const startDateObj = new Date()
      startDateObj.setMonth(startDateObj.getMonth() - months)
      actualStartDate = startDateObj.toISOString().split('T')[0]
    }

    // === NUEVOS CÁLCULOS Y KPIs ===
    
    // Aging report de cuentas por cobrar
    const agingReport = calculateAgingReport(allInvoices)
    
    // Métricas de pacientes
    const patientMetrics = calculatePatientMetrics(allPatients, allAppointments, allInvoices)
    
    // Tendencias de pagos parciales
    const partialPaymentsTrend = calculatePartialPaymentsTrend(allInvoices, parseInt(period))
    
    // Conversión de pagos parciales
    const partialPaymentConversion = calculatePartialPaymentConversion(partialInvoices)
    
    // Tasa de morosidad
    const delinquencyRate = calculateDelinquencyRate(
      pendingInvoices.length, 
      partialInvoices.length, 
      allInvoices.length
    )
    
    // Promedio de días de atraso
    const averageDaysOverdue = calculateAverageDaysOverdue(allInvoices)
    
    // Calcular período anterior para comparación
    const currentStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - (parseInt(period) - 1), 1)
    const currentEnd = endDate ? new Date(endDate) : now
    const previousStart = new Date(currentStart.getTime() - (currentEnd.getTime() - currentStart.getTime()))
    const previousEnd = new Date(currentStart.getTime() - 1)
    
    // Datos del período anterior para comparación
    const previousPeriodInvoices = allInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt)
      return invoiceDate >= previousStart && invoiceDate <= previousEnd
    })
    
    const previousPeriodRevenue = previousPeriodInvoices
      .filter(invoice => invoice.status === 'PAID' || invoice.status === 'PARTIAL')
      .reduce((sum, invoice) => {
        if (invoice.status === 'PAID') return sum + invoice.totalAmount
        if (invoice.status === 'PARTIAL') return sum + (invoice.paidAmount || 0)
        return sum
      }, 0)
    
    const previousPeriodAppointments = allAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      return appointmentDate >= previousStart && appointmentDate <= previousEnd
    })
    
    const previousPeriodPatients = allPatients.filter(patient => {
      const patientDate = new Date(patient.createdAt)
      return patientDate >= previousStart && patientDate <= previousEnd
    })

    const reportData = {
      periodInfo: {
        label: periodLabel,
        startDate: actualStartDate,
        endDate: actualEndDate,
        months: parseInt(period)
      },
      global: {
        totalInvoices,
        totalRevenue,
        totalPaidRevenue,
        totalPendingRevenue,
        totalPartialRevenue,
        totalPartialPendingRevenue,
        totalExoneratedRevenue,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        partialInvoices: partialInvoices.length,
        exoneratedInvoices: exoneratedInvoices.length,
        activePatients: allPatients.length,
        totalAppointments: allAppointments.length
      },
      period: {
        totalRevenue: periodRevenue,
        paidInvoices: periodPaidInvoices.length,
        pendingInvoices: periodPendingInvoices.length,
        exoneratedInvoices: periodExoneratedInvoices.length,
        exoneratedAmount: periodExoneratedRevenue,
        totalAppointments,
        activePatients,
        avgRevenuePerAppointment,
        exoneratedPercentage,
        collectionRate
      },
      financial: {
        totalRevenue: periodRevenue,
        paidInvoices: periodPaidInvoices.length,
        pendingInvoices: periodPendingInvoices.length,
        partialInvoices: periodPartialInvoices.length,
        exoneratedInvoices: periodExoneratedInvoices.length,
        exoneratedAmount: periodExoneratedRevenue,
        partialRevenue: periodPartialRevenue,
        partialPendingRevenue: periodPartialPendingRevenue,
        monthlyRevenue,
        monthlyExonerations: monthlyRevenue.map(m => ({ month: m.month, count: 0, amount: 0 })), // Placeholder
        topServices,
        exoneratedServices: [] // Placeholder
      },
      totals: {
        totalAppointments,
        activePatients,
        avgRevenuePerAppointment,
        exoneratedPercentage,
        collectionRate
      },
      doctorPatients,
      acquisitionTrends,
      exonerations: {
        totalExonerations: periodExoneratedInvoices.length,
        totalExoneratedAmount: periodExoneratedRevenue,
        exonerationsByReason: exonerationsByReasonArray,
        monthlyExonerations: monthlyRevenue.map(m => ({ month: m.month, count: 0, amount: 0 })) // Placeholder
      },
      // === NUEVOS KPIs ===
      agingReport,
      patientMetrics,
      partialPaymentsTrend,
      partialPaymentConversion,
      delinquencyRate,
      averageDaysOverdue,
      comparison: {
        current: {
          revenue: periodRevenue,
          appointments: totalAppointments,
          patients: activePatients
        },
        previous: {
          revenue: previousPeriodRevenue,
          appointments: previousPeriodAppointments.length,
          patients: previousPeriodPatients.length
        }
      }
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error("Error al generar reporte comprensivo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

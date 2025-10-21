import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  calculatePatientMetrics,
  calculateRetentionRate,
  calculateLTV,
  calculateDelinquencyRate,
  calculateAverageDaysOverdue
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
    const period = searchParams.get("period") || "6"

    // Configurar rango de fechas
    let dateFilter: { createdAt?: { gte: Date; lte: Date } } = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    } else {
      const months = parseInt(period)
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
      dateFilter = {
        createdAt: {
          gte: from,
          lte: now
        }
      }
    }

    // Obtener todos los datos necesarios
    const [patients, appointments, invoices, allPatients] = await Promise.all([
      // Pacientes del período
      prisma.patient.findMany({
        where: {
          status: 'ACTIVE',
          ...dateFilter
        },
        include: {
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
              createdAt: true,
              paidAmount: true,
              pendingAmount: true
            }
          }
        }
      }),

      // Todas las citas del período
      prisma.appointment.findMany({
        where: {
          date: {
            gte: dateFilter.createdAt?.gte || new Date(),
            lte: dateFilter.createdAt?.lte || new Date()
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              createdAt: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),

      // Todas las facturas del período
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: dateFilter.createdAt?.gte || new Date(),
            lte: dateFilter.createdAt?.lte || new Date()
          }
        },
        include: {
          patient: {
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
                  category: true
                }
              }
            }
          }
        }
      }),

      // Todos los pacientes activos (para cálculos globales)
      prisma.patient.findMany({
        where: { status: 'ACTIVE' },
        include: {
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
              createdAt: true,
              paidAmount: true,
              pendingAmount: true
            }
          }
        }
      })
    ])

    // Calcular métricas de pacientes
    const patientMetrics = calculatePatientMetrics(patients, appointments, invoices)

    // Calcular KPIs adicionales específicos del consultorio
    const totalRevenue = invoices
      .filter(inv => inv.status === 'PAID' || inv.status === 'PARTIAL')
      .reduce((sum, inv) => {
        if (inv.status === 'PAID') return sum + inv.totalAmount
        if (inv.status === 'PARTIAL') return sum + (inv.paidAmount || 0)
        return sum
      }, 0)

    // Tasa de retención global (pacientes que han regresado)
    const returningPatients = allPatients.filter(patient => {
      const patientAppointments = appointments.filter(a => a.patientId === patient.id)
      return patientAppointments.length > 1
    }).length

    const globalRetentionRate = calculateRetentionRate(allPatients.length, returningPatients)

    // LTV promedio global
    const globalLTV = calculateLTV(totalRevenue, patients.length, patientMetrics.avgVisitsPerPatient)

    // Tasa de ausentismo (no-show rate)
    const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length
    const noShowRate = appointments.length > 0 ? (noShowAppointments / appointments.length) * 100 : 0

    // Tasa de conversión (primera cita → paciente recurrente)
    const firstTimePatients = patients.filter(p => {
      const patientAppointments = appointments.filter(a => a.patientId === p.id)
      return patientAppointments.length === 1
    })

    const convertedPatients = firstTimePatients.filter(p => {
      const patientAppointments = appointments.filter(a => a.patientId === p.id)
      return patientAppointments.length > 1
    }).length

    const conversionRate = firstTimePatients.length > 0 ? (convertedPatients / firstTimePatients.length) * 100 : 0

    // Análisis de servicios más rentables
    const serviceRevenue = new Map()
    invoices.forEach(invoice => {
      if (invoice.status === 'PAID' || invoice.status === 'PARTIAL') {
        invoice.items.forEach(item => {
          const serviceName = item.service.name
          const revenue = item.totalPrice
          const current = serviceRevenue.get(serviceName) || { revenue: 0, count: 0 }
          serviceRevenue.set(serviceName, {
            revenue: current.revenue + revenue,
            count: current.count + item.quantity,
            category: item.service.category
          })
        })
      }
    })

    const topServices = Array.from(serviceRevenue.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Análisis de médicos más productivos
    const doctorStats = new Map()
    appointments.forEach(appointment => {
      const doctorName = appointment.doctor?.name || 'Sin médico'
      const current = doctorStats.get(doctorName) || { 
        appointments: 0, 
        completed: 0, 
        patients: new Set(), 
        revenue: 0 
      }
      
      current.appointments++
      if (appointment.status === 'COMPLETED') current.completed++
      current.patients.add(appointment.patientId)
      
      // Calcular ingresos del médico
      const doctorInvoices = invoices.filter(inv => 
        inv.patientId === appointment.patientId && 
        (inv.status === 'PAID' || inv.status === 'PARTIAL')
      )
      const doctorRevenue = doctorInvoices.reduce((sum, inv) => {
        if (inv.status === 'PAID') return sum + inv.totalAmount
        if (inv.status === 'PARTIAL') return sum + (inv.paidAmount || 0)
        return sum
      }, 0)
      current.revenue += doctorRevenue
      
      doctorStats.set(doctorName, current)
    })

    const topDoctors = Array.from(doctorStats.entries())
      .map(([name, stats]) => ({
        name,
        appointments: stats.appointments,
        completed: stats.completed,
        completionRate: stats.appointments > 0 ? (stats.completed / stats.appointments) * 100 : 0,
        uniquePatients: stats.patients.size,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Análisis de días de la semana más productivos
    const dayStats = new Map()
    appointments.forEach(appointment => {
      const dayOfWeek = new Date(appointment.date).toLocaleDateString('es-ES', { weekday: 'long' })
      const current = dayStats.get(dayOfWeek) || { appointments: 0, revenue: 0 }
      current.appointments++
      
      // Calcular ingresos del día
      const dayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt)
        const appDate = new Date(appointment.date)
        return invDate.toDateString() === appDate.toDateString() && 
               (inv.status === 'PAID' || inv.status === 'PARTIAL')
      })
      
      const dayRevenue = dayInvoices.reduce((sum, inv) => {
        if (inv.status === 'PAID') return sum + inv.totalAmount
        if (inv.status === 'PARTIAL') return sum + (inv.paidAmount || 0)
        return sum
      }, 0)
      
      current.revenue += dayRevenue
      dayStats.set(dayOfWeek, current)
    })

    const dayProductivity = Array.from(dayStats.entries())
      .map(([day, stats]) => ({
        day,
        appointments: stats.appointments,
        revenue: stats.revenue,
        avgRevenuePerAppointment: stats.appointments > 0 ? stats.revenue / stats.appointments : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Métricas de morosidad
    const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING')
    const partialInvoices = invoices.filter(inv => inv.status === 'PARTIAL')
    const delinquencyRate = calculateDelinquencyRate(
      pendingInvoices.length,
      partialInvoices.length,
      invoices.length
    )

    const averageDaysOverdue = calculateAverageDaysOverdue(invoices)

    const kpisData = {
      period: {
        startDate: dateFilter.createdAt?.gte || null,
        endDate: dateFilter.createdAt?.lte || null,
        months: parseInt(period)
      },
      patientMetrics,
      globalMetrics: {
        totalPatients: allPatients.length,
        totalRevenue,
        globalRetentionRate,
        globalLTV,
        noShowRate,
        conversionRate,
        delinquencyRate,
        averageDaysOverdue
      },
      productivity: {
        topServices,
        topDoctors,
        dayProductivity
      },
      trends: {
        monthlyPatientGrowth: [], // Se puede implementar si se necesita
        monthlyRevenueGrowth: [], // Se puede implementar si se necesita
        appointmentTrends: [] // Se puede implementar si se necesita
      }
    }

    return NextResponse.json(kpisData)

  } catch (error) {
    console.error("Error al generar KPIs de consultorio:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

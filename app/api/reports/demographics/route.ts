import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const groupBy = searchParams.get("groupBy") || "age" // age, gender, nationality

    // Configurar rango de fechas
    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    }

    // Obtener datos demográficos de pacientes
    const patients = await prisma.patient.findMany({
      where: {
        status: 'ACTIVE',
        ...dateFilter
      },
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
            createdAt: true,
            paidAmount: true,
            pendingAmount: true
          }
        }
      }
    })

    // Calcular edad actual para pacientes que tienen birthDate
    const patientsWithCalculatedAge = patients.map(patient => {
      let calculatedAge = patient.age
      if (patient.birthDate && !patient.age) {
        const today = new Date()
        const birth = new Date(patient.birthDate)
        calculatedAge = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          calculatedAge--
        }
      }
      return {
        ...patient,
        calculatedAge
      }
    })

    // Análisis por edad
    const ageGroups = {
      "0-17": { count: 0, appointments: 0, revenue: 0, patients: [] as any[] },
      "18-30": { count: 0, appointments: 0, revenue: 0, patients: [] as any[] },
      "31-45": { count: 0, appointments: 0, revenue: 0, patients: [] as any[] },
      "46-60": { count: 0, appointments: 0, revenue: 0, patients: [] as any[] },
      "61-75": { count: 0, appointments: 0, revenue: 0, patients: [] as any[] },
      "75+": { count: 0, appointments: 0, revenue: 0, patients: [] as any[] }
    }

    // Análisis por género
    const genderStats = {
      MALE: { count: 0, appointments: 0, revenue: 0, patients: [] as any[] },
      FEMALE: { count: 0, appointments: 0, revenue: 0, patients: [] as any[] },
      OTHER: { count: 0, appointments: 0, revenue: 0, patients: [] as any[] }
    }

    // Análisis por nacionalidad
    const nationalityStats: Record<string, { count: 0, appointments: 0, revenue: 0, patients: any[] }> = {}

    // Procesar cada paciente
    patientsWithCalculatedAge.forEach(patient => {
      const appointments = patient.appointments.length
      const revenue = patient.invoices
        .filter(inv => inv.status === 'PAID' || inv.status === 'PARTIAL')
        .reduce((sum, inv) => {
          if (inv.status === 'PAID') {
            return sum + inv.totalAmount
          } else if (inv.status === 'PARTIAL') {
            return sum + ((inv as any).paidAmount || 0)
          }
          return sum
        }, 0)

      // Agrupar por edad
      const age = patient.calculatedAge || 0
      let ageGroup = "75+"
      if (age <= 17) ageGroup = "0-17"
      else if (age <= 30) ageGroup = "18-30"
      else if (age <= 45) ageGroup = "31-45"
      else if (age <= 60) ageGroup = "46-60"
      else if (age <= 75) ageGroup = "61-75"

      ageGroups[ageGroup].count++
      ageGroups[ageGroup].appointments += appointments
      ageGroups[ageGroup].revenue += revenue
      ageGroups[ageGroup].patients.push({
        id: patient.id,
        name: patient.name,
        age: patient.calculatedAge,
        appointments,
        revenue
      })

      // Agrupar por género
      genderStats[patient.gender].count++
      genderStats[patient.gender].appointments += appointments
      genderStats[patient.gender].revenue += revenue
      genderStats[patient.gender].patients.push({
        id: patient.id,
        name: patient.name,
        age: patient.calculatedAge,
        appointments,
        revenue
      })

      // Agrupar por nacionalidad
      const nationality = patient.nationality || 'No especificada'
      if (!nationalityStats[nationality]) {
        nationalityStats[nationality] = { count: 0, appointments: 0, revenue: 0, patients: [] }
      }
      nationalityStats[nationality].count++
      nationalityStats[nationality].appointments += appointments
      nationalityStats[nationality].revenue += revenue
      nationalityStats[nationality].patients.push({
        id: patient.id,
        name: patient.name,
        age: patient.calculatedAge,
        appointments,
        revenue
      })
    })

    // Calcular estadísticas generales
    const totalPatients = patients.length
    const totalAppointments = patients.reduce((sum, p) => sum + p.appointments.length, 0)
    const totalRevenue = patients.reduce((sum, p) => 
      sum + p.invoices.filter(inv => inv.status === 'PAID' || inv.status === 'PARTIAL').reduce((s, inv) => {
        if (inv.status === 'PAID') {
          return s + inv.totalAmount
        } else if (inv.status === 'PARTIAL') {
          return s + ((inv as any).paidAmount || 0)
        }
        return s
      }, 0), 0
    )

    // Preparar datos según el groupBy solicitado
    let groupedData = {}
    let chartData = []

    switch (groupBy) {
      case 'age':
        groupedData = ageGroups
        chartData = Object.entries(ageGroups).map(([group, data]) => ({
          group,
          count: data.count,
          appointments: data.appointments,
          revenue: data.revenue,
          avgAppointmentsPerPatient: data.count > 0 ? (data.appointments / data.count).toFixed(2) : 0,
          avgRevenuePerPatient: data.count > 0 ? (data.revenue / data.count).toFixed(2) : 0
        }))
        break
      
      case 'gender':
        groupedData = genderStats
        chartData = Object.entries(genderStats).map(([gender, data]) => ({
          group: gender === 'MALE' ? 'Masculino' : 'Femenino',
          count: data.count,
          appointments: data.appointments,
          revenue: data.revenue,
          avgAppointmentsPerPatient: data.count > 0 ? (data.appointments / data.count).toFixed(2) : 0,
          avgRevenuePerPatient: data.count > 0 ? (data.revenue / data.count).toFixed(2) : 0
        }))
        break
      
      case 'nationality':
        groupedData = nationalityStats
        chartData = Object.entries(nationalityStats)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([nationality, data]) => ({
            group: nationality,
            count: data.count,
            appointments: data.appointments,
            revenue: data.revenue,
            avgAppointmentsPerPatient: data.count > 0 ? (data.appointments / data.count).toFixed(2) : 0,
            avgRevenuePerPatient: data.count > 0 ? (data.revenue / data.count).toFixed(2) : 0
          }))
        break
    }

    const reportData = {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
        groupBy
      },
      summary: {
        totalPatients,
        totalAppointments,
        totalRevenue,
        avgAppointmentsPerPatient: totalPatients > 0 ? (totalAppointments / totalPatients).toFixed(2) : 0,
        avgRevenuePerPatient: totalPatients > 0 ? (totalRevenue / totalPatients).toFixed(2) : 0
      },
      groupedData,
      chartData,
      rawData: {
        ageGroups,
        genderStats,
        nationalityStats
      }
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error("Error al generar reporte demográfico:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

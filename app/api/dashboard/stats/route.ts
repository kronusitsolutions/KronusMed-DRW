import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cache, DashboardCache } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 Iniciando consulta de dashboard stats...")

    const today = new Date().toISOString().split('T')[0]
    console.log("📅 Fecha de hoy:", today)

    // Consultas simples y seguras
    const [activePatients, pendingInvoices] = await Promise.all([
      prisma.patient.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.invoice.count({
        where: { status: 'PENDING' }
      })
    ])

    // Consulta separada para appointments (más simple)
    const todayAppointments = await prisma.appointment.count({
      where: {
        date: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    // Consulta separada para monto pendiente
    const pendingAmount = await prisma.invoice.aggregate({
      where: { status: 'PENDING' },
      _sum: { totalAmount: true }
    })

    console.log("📊 Estadísticas obtenidas:", {
      todayAppointments,
      activePatients,
      pendingInvoices,
      pendingAmount: pendingAmount._sum.totalAmount || 0
    })

    const responseData = {
      stats: {
        todayAppointments: Number(todayAppointments) || 0,
        activePatients: Number(activePatients) || 0,
        pendingInvoices: Number(pendingInvoices) || 0,
        pendingAmount: Number(pendingAmount._sum.totalAmount || 0)
      },
      appointments: [] // Mantenemos appointments vacío por ahora
    }

    console.log("✅ Dashboard stats generado exitosamente")
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ Error al obtener estadísticas del dashboard:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

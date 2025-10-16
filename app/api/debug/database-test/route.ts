import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 Iniciando prueba de base de datos...")

    // Pruebas básicas de conectividad
    const tests = []

    // Test 1: Conteo de pacientes
    try {
      const patientCount = await prisma.patient.count()
      tests.push({ test: "Pacientes", result: "✅", count: patientCount })
    } catch (error) {
      tests.push({ test: "Pacientes", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    // Test 2: Conteo de facturas
    try {
      const invoiceCount = await prisma.invoice.count()
      tests.push({ test: "Facturas", result: "✅", count: invoiceCount })
    } catch (error) {
      tests.push({ test: "Facturas", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    // Test 3: Conteo de citas
    try {
      const appointmentCount = await prisma.appointment.count()
      tests.push({ test: "Citas", result: "✅", count: appointmentCount })
    } catch (error) {
      tests.push({ test: "Citas", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    // Test 4: Conteo de servicios
    try {
      const serviceCount = await prisma.service.count()
      tests.push({ test: "Servicios", result: "✅", count: serviceCount })
    } catch (error) {
      tests.push({ test: "Servicios", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    // Test 5: Consulta de pacientes activos
    try {
      const activePatients = await prisma.patient.count({
        where: { status: 'ACTIVE' }
      })
      tests.push({ test: "Pacientes Activos", result: "✅", count: activePatients })
    } catch (error) {
      tests.push({ test: "Pacientes Activos", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    // Test 6: Consulta de facturas pendientes
    try {
      const pendingInvoices = await prisma.invoice.count({
        where: { status: 'PENDING' }
      })
      tests.push({ test: "Facturas Pendientes", result: "✅", count: pendingInvoices })
    } catch (error) {
      tests.push({ test: "Facturas Pendientes", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    // Test 7: Consulta de citas de hoy
    try {
      const today = new Date().toISOString().split('T')[0]
      const todayAppointments = await prisma.appointment.count({
        where: {
          date: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })
      tests.push({ test: "Citas de Hoy", result: "✅", count: todayAppointments })
    } catch (error) {
      tests.push({ test: "Citas de Hoy", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    // Test 8: Agregación de monto total
    try {
      const totalAmount = await prisma.invoice.aggregate({
        where: { status: 'PENDING' },
        _sum: { totalAmount: true }
      })
      tests.push({ test: "Monto Total Pendiente", result: "✅", amount: totalAmount._sum.totalAmount || 0 })
    } catch (error) {
      tests.push({ test: "Monto Total Pendiente", result: "❌", error: error instanceof Error ? error.message : 'Error desconocido' })
    }

    const successCount = tests.filter(t => t.result === "✅").length
    const totalTests = tests.length

    console.log(`📊 Pruebas completadas: ${successCount}/${totalTests}`)

    return NextResponse.json({
      success: successCount === totalTests,
      tests,
      summary: {
        total: totalTests,
        passed: successCount,
        failed: totalTests - successCount,
        successRate: `${Math.round((successCount / totalTests) * 100)}%`
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error en prueba de base de datos:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

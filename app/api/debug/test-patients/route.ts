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

    console.log("🔍 Iniciando prueba de API de pacientes...")

    // Prueba 1: Contar pacientes
    const patientCount = await prisma.patient.count()
    console.log("📊 Total de pacientes:", patientCount)

    // Prueba 2: Obtener algunos pacientes
    const patients = await prisma.patient.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        nationality: true,
        cedula: true,
        status: true,
        createdAt: true
      }
    })
    console.log("👥 Primeros 5 pacientes:", patients)

    // Prueba 3: Buscar por nacionalidad
    const dominicanPatients = await prisma.patient.count({
      where: {
        nationality: {
          contains: "Dominicana",
          mode: "insensitive"
        }
      }
    })
    console.log("🇩🇴 Pacientes dominicanos:", dominicanPatients)

    // Prueba 4: Buscar por cédula
    const cedulaSearch = await prisma.patient.findMany({
      where: {
        cedula: {
          contains: "123",
          mode: "insensitive"
        }
      },
      take: 3,
      select: {
        id: true,
        name: true,
        cedula: true
      }
    })
    console.log("🆔 Búsqueda por cédula:", cedulaSearch)

    return NextResponse.json({
      success: true,
      tests: [
        {
          test: "Contar pacientes",
          result: "✅",
          count: patientCount
        },
        {
          test: "Obtener pacientes",
          result: "✅",
          count: patients.length
        },
        {
          test: "Buscar por nacionalidad",
          result: "✅",
          count: dominicanPatients
        },
        {
          test: "Buscar por cédula",
          result: "✅",
          count: cedulaSearch.length
        }
      ],
      summary: {
        total: 4,
        passed: 4,
        failed: 0,
        successRate: "100%"
      },
      sampleData: {
        patients: patients,
        cedulaSearch: cedulaSearch
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error en prueba de pacientes:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

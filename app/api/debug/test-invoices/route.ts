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

    console.log("🔍 Iniciando prueba de API de facturas...")

    // Prueba 1: Verificar estructura de la tabla patients
    console.log("📋 Verificando estructura de tabla patients...")
    const patientColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'patients'
      ORDER BY ordinal_position
    ` as any[]
    
    console.log("📊 Columnas de patients:", patientColumns)

    // Prueba 2: Verificar si existe la columna insuranceId
    const hasInsuranceId = patientColumns.some(col => col.column_name === 'insurance_id')
    console.log("🔍 Tiene columna insurance_id:", hasInsuranceId)

    // Prueba 3: Intentar obtener un paciente sin la relación insurance
    console.log("👤 Probando consulta de paciente sin insurance...")
    const patientWithoutInsurance = await prisma.patient.findFirst({
      select: {
        id: true,
        name: true,
        nationality: true,
        cedula: true,
        status: true
      }
    })
    console.log("✅ Paciente sin insurance:", patientWithoutInsurance)

    // Prueba 4: Intentar obtener facturas sin la relación insurance
    console.log("📄 Probando consulta de facturas sin insurance...")
    const invoicesWithoutInsurance = await prisma.invoice.findMany({
      take: 3,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            nationality: true,
            cedula: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    console.log("✅ Facturas sin insurance:", invoicesWithoutInsurance.length)

    // Prueba 5: Si existe insuranceId, probar con insurance
    let invoicesWithInsurance = null
    if (hasInsuranceId) {
      console.log("🏥 Probando consulta de facturas con insurance...")
      try {
        invoicesWithInsurance = await prisma.invoice.findMany({
          take: 3,
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                nationality: true,
                cedula: true,
                insurance: {
                  select: {
                    id: true,
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
            }
          }
        })
        console.log("✅ Facturas con insurance:", invoicesWithInsurance.length)
      } catch (error) {
        console.log("❌ Error con insurance:", error)
      }
    }

    return NextResponse.json({
      success: true,
      tests: [
        {
          test: "Estructura de tabla patients",
          result: "✅",
          columns: patientColumns.length
        },
        {
          test: "Columna insurance_id existe",
          result: hasInsuranceId ? "✅" : "❌",
          details: hasInsuranceId ? "Existe" : "No existe"
        },
        {
          test: "Consulta paciente sin insurance",
          result: "✅",
          count: patientWithoutInsurance ? 1 : 0
        },
        {
          test: "Consulta facturas sin insurance",
          result: "✅",
          count: invoicesWithoutInsurance.length
        },
        {
          test: "Consulta facturas con insurance",
          result: hasInsuranceId ? (invoicesWithInsurance ? "✅" : "❌") : "⏭️",
          count: invoicesWithInsurance ? invoicesWithInsurance.length : 0
        }
      ],
      summary: {
        total: 5,
        passed: hasInsuranceId ? (invoicesWithInsurance ? 5 : 4) : 4,
        failed: hasInsuranceId ? (invoicesWithInsurance ? 0 : 1) : 1,
        successRate: hasInsuranceId ? (invoicesWithInsurance ? "100%" : "80%") : "80%"
      },
      details: {
        patientColumns: patientColumns,
        hasInsuranceId: hasInsuranceId,
        samplePatient: patientWithoutInsurance,
        sampleInvoices: invoicesWithoutInsurance,
        sampleInvoicesWithInsurance: invoicesWithInsurance
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error en prueba de facturas:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

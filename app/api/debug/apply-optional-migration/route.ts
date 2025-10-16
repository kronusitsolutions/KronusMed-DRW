import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🚀 Iniciando migración para hacer campos opcionales...")

    const results = []

    try {
      // 1. Hacer campos opcionales
      console.log("📝 Haciendo campos nationality y cedula opcionales...")
      await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN nationality DROP NOT NULL`
      await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN cedula DROP NOT NULL`
      results.push({ step: "Hacer campos opcionales", status: "✅" })

      // 2. Actualizar registros existentes
      console.log("🔄 Actualizando registros existentes...")
      const updateResult1 = await prisma.$executeRaw`
        UPDATE patients 
        SET nationality = 'No especificada' 
        WHERE nationality IS NULL
      `
      results.push({ step: "Actualizar nationality", status: "✅", affected: updateResult1 })

      const updateResult2 = await prisma.$executeRaw`
        UPDATE patients 
        SET cedula = 'PENDIENTE' 
        WHERE cedula IS NULL
      `
      results.push({ step: "Actualizar cedula", status: "✅", affected: updateResult2 })

      // 3. Verificar el resultado
      console.log("🔍 Verificando migración...")
      const patients = await prisma.patient.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          nationality: true,
          cedula: true
        }
      })
      results.push({ step: "Verificar datos", status: "✅", sample: patients })

      console.log("🎉 Migración completada exitosamente!")

      return NextResponse.json({
        success: true,
        message: "Migración aplicada exitosamente",
        results,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error("❌ Error durante la migración:", error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        results,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Error general en migración:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 Verificando estado de migración...")

    // Verificar estructura de la tabla
    const columns = await prisma.$queryRaw`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'patients' AND column_name IN ('nationality', 'cedula')
    ` as { column_name: string, is_nullable: string, data_type: string }[]

    // Verificar datos de pacientes usando SQL directo
    const patientCount = await prisma.patient.count()
    
    const nationalityResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM patients WHERE nationality IS NOT NULL
    ` as { count: bigint }[]
    
    const cedulaResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM patients WHERE cedula IS NOT NULL
    ` as { count: bigint }[]

    const patientsWithNationality = Number(nationalityResult[0].count)
    const patientsWithCedula = Number(cedulaResult[0].count)

    const checks = columns.map(col => ({
      field: col.column_name,
      isOptional: col.is_nullable === 'YES',
      dataType: col.data_type,
      status: col.is_nullable === 'YES' ? "✅" : "❌"
    }))

    checks.push({
      field: "Datos con nationality",
      isOptional: false, // Cambiado de null a false
      dataType: `${patientsWithNationality}/${patientCount}`,
      status: patientsWithNationality === patientCount ? "✅" : "⚠️"
    })

    checks.push({
      field: "Datos con cedula", 
      isOptional: false, // Cambiado de null a false
      dataType: `${patientsWithCedula}/${patientCount}`,
      status: patientsWithCedula === patientCount ? "✅" : "⚠️"
    })

    const successCount = checks.filter(c => c.status === "✅").length
    const totalChecks = checks.length

    return NextResponse.json({
      success: successCount === totalChecks,
      message: `Verificación completada: ${successCount}/${totalChecks} checks exitosos`,
      checks,
      summary: {
        total: totalChecks,
        passed: successCount,
        failed: totalChecks - successCount,
        successRate: `${Math.round((successCount / totalChecks) * 100)}%`
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error durante la verificación:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

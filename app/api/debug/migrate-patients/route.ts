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

    console.log("🚀 Iniciando migración de campos de pacientes...")

    const results = []

    try {
      // 1. Agregar nuevas columnas
      console.log("📝 Agregando columnas nationality y cedula...")
      await prisma.$executeRaw`ALTER TABLE patients ADD COLUMN IF NOT EXISTS nationality VARCHAR(255)`
      await prisma.$executeRaw`ALTER TABLE patients ADD COLUMN IF NOT EXISTS cedula VARCHAR(255)`
      results.push({ step: "Agregar columnas", status: "✅" })

      // 2. Eliminar columnas obsoletas
      console.log("🗑️ Eliminando columnas obsoletas...")
      try {
        await prisma.$executeRaw`ALTER TABLE patients DROP COLUMN IF EXISTS email`
        results.push({ step: "Eliminar email", status: "✅" })
      } catch (error) {
        results.push({ step: "Eliminar email", status: "⚠️", note: "No existía" })
      }

      try {
        await prisma.$executeRaw`ALTER TABLE patients DROP COLUMN IF EXISTS condition`
        results.push({ step: "Eliminar condition", status: "✅" })
      } catch (error) {
        results.push({ step: "Eliminar condition", status: "⚠️", note: "No existía" })
      }

      try {
        await prisma.$executeRaw`ALTER TABLE patients DROP COLUMN IF EXISTS last_visit`
        results.push({ step: "Eliminar last_visit", status: "✅" })
      } catch (error) {
        results.push({ step: "Eliminar last_visit", status: "⚠️", note: "No existía" })
      }

      // 3. Crear índices
      console.log("🔍 Creando índices...")
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_patients_cedula ON patients(cedula)`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_patients_nationality ON patients(nationality)`
      results.push({ step: "Crear índices", status: "✅" })

      // 4. Actualizar datos existentes
      console.log("🔄 Actualizando datos existentes...")
      const updateResult = await prisma.$executeRaw`
        UPDATE patients 
        SET nationality = 'Dominicana', cedula = 'PENDIENTE' 
        WHERE nationality IS NULL OR cedula IS NULL
      `
      results.push({ step: "Actualizar datos existentes", status: "✅", affected: updateResult })

      // 5. Hacer columnas NOT NULL
      console.log("🔒 Estableciendo NOT NULL...")
      await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN nationality SET NOT NULL`
      await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN cedula SET NOT NULL`
      results.push({ step: "Establecer NOT NULL", status: "✅" })

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

    const checks = []

    try {
      // Verificar si las columnas existen
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name IN ('nationality', 'cedula', 'email', 'condition', 'last_visit')
        ORDER BY column_name
      `

      const columnNames = (columns as any[]).map(col => col.column_name)
      
      checks.push({
        check: "Columna nationality",
        status: columnNames.includes('nationality') ? "✅" : "❌",
        details: columnNames.includes('nationality') ? "Existe" : "No existe"
      })

      checks.push({
        check: "Columna cedula",
        status: columnNames.includes('cedula') ? "✅" : "❌",
        details: columnNames.includes('cedula') ? "Existe" : "No existe"
      })

      checks.push({
        check: "Columna email (debe estar eliminada)",
        status: !columnNames.includes('email') ? "✅" : "⚠️",
        details: !columnNames.includes('email') ? "Eliminada correctamente" : "Aún existe"
      })

      checks.push({
        check: "Columna condition (debe estar eliminada)",
        status: !columnNames.includes('condition') ? "✅" : "⚠️",
        details: !columnNames.includes('condition') ? "Eliminada correctamente" : "Aún existe"
      })

      checks.push({
        check: "Columna last_visit (debe estar eliminada)",
        status: !columnNames.includes('last_visit') ? "✅" : "⚠️",
        details: !columnNames.includes('last_visit') ? "Eliminada correctamente" : "Aún existe"
      })

      // Verificar índices
      const indexes = await prisma.$queryRaw`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'patients' 
        AND indexname IN ('idx_patients_cedula', 'idx_patients_nationality')
      `

      const indexNames = (indexes as any[]).map(idx => idx.indexname)

      checks.push({
        check: "Índice idx_patients_cedula",
        status: indexNames.includes('idx_patients_cedula') ? "✅" : "❌",
        details: indexNames.includes('idx_patients_cedula') ? "Existe" : "No existe"
      })

      checks.push({
        check: "Índice idx_patients_nationality",
        status: indexNames.includes('idx_patients_nationality') ? "✅" : "❌",
        details: indexNames.includes('idx_patients_nationality') ? "Existe" : "No existe"
      })

      // Verificar datos de pacientes
      const patientCount = await prisma.patient.count()
      const patientsWithNewFields = await prisma.patient.count({
        where: {
          AND: [
            { nationality: { not: "" } },
            { cedula: { not: "" } }
          ]
        }
      })

      checks.push({
        check: "Datos de pacientes actualizados",
        status: patientsWithNewFields === patientCount ? "✅" : "⚠️",
        details: `${patientsWithNewFields}/${patientCount} pacientes tienen los nuevos campos`
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
        checks,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Error general en verificación:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🚀 Iniciando migración completa de pacientes...")

    const results = []

    try {
      // 1. Verificar si las columnas existen
      console.log("🔍 Verificando columnas existentes...")
      const existingColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name IN ('nationality', 'cedula', 'email', 'condition', 'last_visit')
      ` as { column_name: string }[]

      const columnNames = existingColumns.map(col => col.column_name)
      console.log("Columnas existentes:", columnNames)

      // 2. Agregar nuevas columnas si no existen
      if (!columnNames.includes('nationality')) {
        console.log("📝 Agregando columna nationality...")
        await prisma.$executeRaw`ALTER TABLE patients ADD COLUMN nationality VARCHAR(255)`
        results.push({ step: "Agregar nationality", status: "✅" })
      } else {
        results.push({ step: "Agregar nationality", status: "⚠️", note: "Ya existe" })
      }

      if (!columnNames.includes('cedula')) {
        console.log("📝 Agregando columna cedula...")
        await prisma.$executeRaw`ALTER TABLE patients ADD COLUMN cedula VARCHAR(255)`
        results.push({ step: "Agregar cedula", status: "✅" })
      } else {
        results.push({ step: "Agregar cedula", status: "⚠️", note: "Ya existe" })
      }

      // 3. Eliminar columnas obsoletas si existen
      if (columnNames.includes('email')) {
        console.log("🗑️ Eliminando columna email...")
        await prisma.$executeRaw`ALTER TABLE patients DROP COLUMN email`
        results.push({ step: "Eliminar email", status: "✅" })
      } else {
        results.push({ step: "Eliminar email", status: "⚠️", note: "No existe" })
      }

      if (columnNames.includes('condition')) {
        console.log("🗑️ Eliminando columna condition...")
        await prisma.$executeRaw`ALTER TABLE patients DROP COLUMN condition`
        results.push({ step: "Eliminar condition", status: "✅" })
      } else {
        results.push({ step: "Eliminar condition", status: "⚠️", note: "No existe" })
      }

      if (columnNames.includes('last_visit')) {
        console.log("🗑️ Eliminando columna last_visit...")
        await prisma.$executeRaw`ALTER TABLE patients DROP COLUMN last_visit`
        results.push({ step: "Eliminar last_visit", status: "✅" })
      } else {
        results.push({ step: "Eliminar last_visit", status: "⚠️", note: "No existe" })
      }

      // 4. Crear índices
      console.log("🔍 Creando índices...")
      try {
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_patients_cedula ON patients(cedula)`
        results.push({ step: "Crear índice cedula", status: "✅" })
      } catch (error) {
        results.push({ step: "Crear índice cedula", status: "⚠️", note: "Ya existe" })
      }

      try {
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_patients_nationality ON patients(nationality)`
        results.push({ step: "Crear índice nationality", status: "✅" })
      } catch (error) {
        results.push({ step: "Crear índice nationality", status: "⚠️", note: "Ya existe" })
      }

      // 5. Actualizar datos existentes
      console.log("🔄 Actualizando datos existentes...")
      const updateNationalityResult = await prisma.$executeRaw`
        UPDATE patients SET nationality = 'No especificada' WHERE nationality IS NULL
      `
      results.push({ step: "Actualizar nationality nula", status: "✅", affected: updateNationalityResult })

      const updateCedulaResult = await prisma.$executeRaw`
        UPDATE patients SET cedula = 'PENDIENTE' WHERE cedula IS NULL
      `
      results.push({ step: "Actualizar cedula nula", status: "✅", affected: updateCedulaResult })

      // 6. Hacer columnas opcionales (quitar NOT NULL)
      console.log("🔓 Haciendo columnas opcionales...")
      try {
        await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN nationality DROP NOT NULL`
        results.push({ step: "Hacer nationality opcional", status: "✅" })
      } catch (error) {
        results.push({ step: "Hacer nationality opcional", status: "⚠️", note: "Ya era opcional" })
      }

      try {
        await prisma.$executeRaw`ALTER TABLE patients ALTER COLUMN cedula DROP NOT NULL`
        results.push({ step: "Hacer cedula opcional", status: "✅" })
      } catch (error) {
        results.push({ step: "Hacer cedula opcional", status: "⚠️", note: "Ya era opcional" })
      }

      console.log("🎉 Migración completa exitosa!")

      return NextResponse.json({
        success: true,
        message: "Migración completa aplicada exitosamente",
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
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 Verificando estado de migración...")

    // Verificar columnas
    const columns = await prisma.$queryRaw`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'patients' 
      AND column_name IN ('nationality', 'cedula', 'email', 'condition', 'last_visit')
    ` as { column_name: string, is_nullable: string, data_type: string }[]

    // Verificar datos
    const patientCount = await prisma.patient.count()
    const patientsWithNationality = await prisma.patient.count({
      where: { nationality: { not: null } }
    })
    const patientsWithCedula = await prisma.patient.count({
      where: { cedula: { not: null } }
    })

    const checks = columns.map(col => ({
      field: col.column_name,
      exists: true,
      isOptional: col.is_nullable === 'YES',
      dataType: col.data_type,
      status: col.is_nullable === 'YES' ? "✅" : "❌"
    }))

    // Verificar campos que no existen
    const expectedFields = ['nationality', 'cedula']
    const existingFieldNames = columns.map(col => col.column_name)
    expectedFields.forEach(field => {
      if (!existingFieldNames.includes(field)) {
        checks.push({
          field,
          exists: false,
          isOptional: false,
          dataType: "NO EXISTE",
          status: "❌"
        })
      }
    })

    checks.push({
      field: "Datos con nationality",
      exists: true,
      isOptional: false,
      dataType: `${patientsWithNationality}/${patientCount}`,
      status: patientsWithNationality === patientCount ? "✅" : "⚠️"
    })

    checks.push({
      field: "Datos con cedula", 
      exists: true,
      isOptional: false,
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

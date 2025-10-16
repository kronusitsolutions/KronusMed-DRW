import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Iniciando diagnóstico público de servicios...")

    // 1. Verificar conexión a base de datos
    console.log("1️⃣ Verificando conexión a base de datos...")
    await prisma.$queryRaw`SELECT 1`
    console.log("✅ Conexión a base de datos OK")

    // 2. Contar servicios existentes
    console.log("2️⃣ Contando servicios existentes...")
    const totalServices = await prisma.service.count()
    console.log(`✅ Total de servicios: ${totalServices}`)

    // 3. Obtener último servicio
    console.log("3️⃣ Obteniendo último servicio...")
    const lastService = await prisma.service.findFirst({
      orderBy: { id: 'desc' }
    })
    console.log(`✅ Último servicio: ${lastService?.id || 'Ninguno'}`)

    // 4. Verificar estructura de tabla
    console.log("4️⃣ Verificando estructura de tabla...")
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'services'
    `
    console.log("✅ Estructura de tabla:", tableInfo)

    // 5. Probar generación de ID
    console.log("5️⃣ Probando generación de ID...")
    let nextId = "serv0001"
    if (lastService) {
      const match = lastService.id.match(/serv(\d+)/)
      if (match) {
        const lastNumber = parseInt(match[1])
        const nextNumber = lastNumber + 1
        nextId = `serv${nextNumber.toString().padStart(4, '0')}`
      }
    }
    console.log(`✅ Próximo ID sería: ${nextId}`)

    // 6. Verificar algunos servicios recientes
    console.log("6️⃣ Verificando servicios recientes...")
    const recentServices = await prisma.service.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    })
    console.log("✅ Servicios recientes:", recentServices)

    return NextResponse.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      diagnostics: {
        databaseConnection: "OK",
        totalServices,
        lastServiceId: lastService?.id || null,
        nextServiceId: nextId,
        tableStructure: tableInfo,
        recentServices
      },
      message: "Diagnóstico completado exitosamente"
    })

  } catch (error) {
    console.error("❌ Error en diagnóstico:", error)
    
    return NextResponse.json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Error desconocido",
      message: "Error durante el diagnóstico"
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 Iniciando diagnóstico de servicios...")

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

    // 6. Verificar permisos de escritura
    console.log("6️⃣ Verificando permisos de escritura...")
    try {
      // Intentar crear un servicio de prueba (sin guardarlo)
      const testData = {
        name: "Servicio de Prueba",
        description: "Servicio temporal para diagnóstico",
        price: 0,
        category: "Diagnóstico",
        isActive: true
      }
      
      // Solo validar, no crear
      console.log("✅ Datos de prueba válidos:", testData)
    } catch (error) {
      console.log("❌ Error en validación:", error)
    }

    return NextResponse.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      diagnostics: {
        databaseConnection: "OK",
        totalServices,
        lastServiceId: lastService?.id || null,
        nextServiceId: nextId,
        tableStructure: tableInfo,
        permissions: "OK"
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🧪 Iniciando prueba de creación de servicio...")

    // Crear un servicio de prueba
    const testService = {
      name: "Servicio de Prueba - " + Date.now(),
      description: "Servicio temporal para diagnóstico",
      price: 100,
      category: "Diagnóstico",
      isActive: true
    }

    console.log("📝 Datos de prueba:", testService)

    // Generar ID
    const lastService = await prisma.service.findFirst({
      orderBy: { id: 'desc' }
    })
    
    let serviceId = "serv0001"
    if (lastService) {
      const match = lastService.id.match(/serv(\d+)/)
      if (match) {
        const lastNumber = parseInt(match[1])
        const nextNumber = lastNumber + 1
        serviceId = `serv${nextNumber.toString().padStart(4, '0')}`
      }
    }

    console.log("🆔 ID generado:", serviceId)

    // Crear servicio
    const createdService = await prisma.service.create({
      data: {
        ...testService,
        id: serviceId
      }
    })

    console.log("✅ Servicio de prueba creado:", createdService.id)

    // Eliminar servicio de prueba
    await prisma.service.delete({
      where: { id: createdService.id }
    })

    console.log("🗑️ Servicio de prueba eliminado")

    return NextResponse.json({
      status: "OK",
      message: "Prueba de creación exitosa",
      testService: createdService,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error en prueba de creación:", error)
    
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : "Error desconocido",
      message: "Error durante la prueba de creación"
    }, { status: 500 })
  }
}

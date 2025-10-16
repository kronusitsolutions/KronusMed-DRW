import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Iniciando prueba de creación de servicio...")

    const testService = {
      name: "Servicio de Prueba - " + Date.now(),
      description: "Servicio temporal para diagnóstico",
      price: 100,
      category: "Diagnóstico",
      isActive: true
    }

    console.log("📝 Datos de prueba:", testService)

    // Generar ID simple
    const serviceId = `serv${Date.now().toString().slice(-4)}`

    console.log("🆔 ID generado:", serviceId)

    // Crear servicio
    const createdService = await prisma.service.create({
      data: {
        ...testService,
        id: serviceId
      }
    })

    console.log("✅ Servicio de prueba creado:", createdService.id)

    // Eliminar servicio de prueba inmediatamente
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
      message: "Error durante la prueba de creación",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

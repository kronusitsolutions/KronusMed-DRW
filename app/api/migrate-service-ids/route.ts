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

    console.log('🔄 Iniciando migración de IDs de servicios...')
    
    // Obtener todos los servicios ordenados por fecha de creación
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`📋 Encontrados ${services.length} servicios para migrar`)
    
    const migrationResults = []
    
    // Migrar cada servicio con un nuevo ID secuencial
    for (let i = 0; i < services.length; i++) {
      const service = services[i]
      const newId = `serv${(i + 1).toString().padStart(4, '0')}`
      
      console.log(`🔄 Migrando servicio: ${service.id} → ${newId} (${service.name})`)
      
      try {
        // Actualizar el servicio con el nuevo ID
        const updatedService = await prisma.service.update({
          where: { id: service.id },
          data: { id: newId }
        })
        
        migrationResults.push({
          oldId: service.id,
          newId: newId,
          name: service.name,
          success: true
        })
      } catch (error) {
        console.error(`❌ Error migrando servicio ${service.id}:`, error)
        migrationResults.push({
          oldId: service.id,
          newId: newId,
          name: service.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    console.log('✅ Migración completada!')
    
    return NextResponse.json({
      success: true,
      message: `Migración completada. ${migrationResults.filter(r => r.success).length} servicios migrados exitosamente.`,
      results: migrationResults
    })
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

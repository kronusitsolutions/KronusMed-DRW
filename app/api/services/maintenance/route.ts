import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cache, ServiceCache } from "@/lib/cache"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { action } = await request.json()

    switch (action) {
      case 'clear_cache':
        return await clearCache()
      
      case 'optimize_database':
        return await optimizeDatabase()
      
      case 'cleanup_connections':
        return await cleanupConnections()
      
      case 'vacuum_analyze':
        return await vacuumAnalyze()
      
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error en mantenimiento:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

async function clearCache() {
  try {
    // Limpiar caché de servicios
    ServiceCache.invalidateServices()
    
    // Limpiar todo el caché
    cache.clear()
    
    return NextResponse.json({
      message: "Caché limpiado exitosamente",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new Error(`Error limpiando caché: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function optimizeDatabase() {
  try {
    // Crear índices si no existen
    const indexes = [
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_name_search 
       ON services USING gin(to_tsvector('spanish', name))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category 
       ON services (category) WHERE category IS NOT NULL`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active 
       ON services (is_active, name) WHERE is_active = true`
    ]
    
    for (const indexQuery of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery)
      } catch (error) {
        // Ignorar errores de índices que ya existen
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (!errorMessage.includes('already exists')) {
          console.warn('Error creando índice:', errorMessage)
        }
      }
    }
    
    return NextResponse.json({
      message: "Base de datos optimizada exitosamente",
      indexesCreated: indexes.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new Error(`Error optimizando base de datos: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function cleanupConnections() {
  try {
    // Terminar conexiones inactivas
    const result = await prisma.$executeRaw`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE state = 'idle' 
      AND state_change < now() - interval '10 minutes'
      AND pid <> pg_backend_pid()
    `
    
    return NextResponse.json({
      message: "Conexiones inactivas limpiadas",
      connectionsTerminated: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new Error(`Error limpiando conexiones: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function vacuumAnalyze() {
  try {
    // Ejecutar VACUUM ANALYZE en tablas principales
    await prisma.$executeRaw`VACUUM ANALYZE services`
    await prisma.$executeRaw`VACUUM ANALYZE invoice_items`
    await prisma.$executeRaw`VACUUM ANALYZE appointments`
    
    return NextResponse.json({
      message: "VACUUM ANALYZE ejecutado exitosamente",
      tablesAnalyzed: ['services', 'invoice_items', 'appointments'],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new Error(`Error ejecutando VACUUM ANALYZE: ${error instanceof Error ? error.message : String(error)}`)
  }
}

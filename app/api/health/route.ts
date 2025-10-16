import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`
    
    // Verificar que las tablas principales existen
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'patients', 'services', 'invoices', 'appointments')
    `
    
    const requiredTables = ['users', 'patients', 'services', 'invoices', 'appointments']
    const existingTables = (tables as any[]).map(t => t.table_name)
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    if (missingTables.length > 0) {
      return NextResponse.json(
        { 
          status: 'warning', 
          message: 'Algunas tablas no existen', 
          missingTables 
        },
        { status: 200 }
      )
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Sistema funcionando correctamente',
      timestamp: new Date().toISOString(),
      database: 'connected',
      tables: existingTables
    })
  } catch (error: unknown) {
    console.error('Health check failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        message: 'Error en el sistema',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

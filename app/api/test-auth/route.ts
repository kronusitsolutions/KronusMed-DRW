import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Probando autenticación...')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No autorizado',
        message: 'No hay sesión activa'
      }, { status: 401 })
    }

    // Verificar conexión a base de datos
    const userCount = await prisma.user.count()
    console.log('Usuarios en BD:', userCount)

    return NextResponse.json({
      success: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        }
      },
      database: {
        userCount
      }
    })

  } catch (error) {
    console.error('Error en test-auth:', error)
    return NextResponse.json({ 
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

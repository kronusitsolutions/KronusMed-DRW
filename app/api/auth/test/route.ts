import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verificar configuración de NextAuth
    const session = await getServerSession(authOptions)
    
    // Verificar conexión a base de datos
    const userCount = await prisma.user.count()
    
    // Verificar variables de entorno
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV
    }
    
    // Verificar si hay usuarios en la base de datos
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true }
    })
    
    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      session: session ? {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      } : null,
      database: {
        connected: true,
        userCount,
        adminUser: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        } : null
      },
      environment: envCheck,
      recommendations: {
        hasSession: !!session,
        hasAdminUser: !!adminUser,
        hasValidEnv: Object.values(envCheck).every(Boolean)
      }
    })
  } catch (error) {
    console.error('Error en endpoint de prueba:', error)
    
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error desconocido',
      environment: {
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}

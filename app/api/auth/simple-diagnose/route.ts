import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar variables de entorno básicas
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      SECURE_COOKIES: process.env.SECURE_COOKIES,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV
    }

    // Análisis de problemas básicos
    const issues: string[] = []
    const recommendations: string[] = []

    if (!process.env.NEXTAUTH_URL) {
      issues.push('NEXTAUTH_URL no está configurada')
      recommendations.push('Configurar NEXTAUTH_URL con la URL de tu app en Railway')
    }

    if (!process.env.NEXTAUTH_SECRET) {
      issues.push('NEXTAUTH_SECRET no está configurada')
      recommendations.push('Generar y configurar NEXTAUTH_SECRET')
    }

    if (process.env.NODE_ENV === 'production' && process.env.SECURE_COOKIES !== 'true') {
      issues.push('SECURE_COOKIES debe ser true en producción')
      recommendations.push('Configurar SECURE_COOKIES=true en Railway')
    }

    if (!process.env.DATABASE_URL) {
      issues.push('DATABASE_URL no está configurada')
      recommendations.push('Verificar DATABASE_URL en Railway')
    }

    return NextResponse.json({
      status: issues.length === 0 ? 'OK' : 'ISSUES_FOUND',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      issues,
      recommendations,
      message: 'Endpoint de diagnóstico básico - Para diagnóstico completo usar /api/auth/diagnose'
    })

  } catch (error) {
    console.error('Error en diagnóstico básico:', error)
    
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Error interno del servidor',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        SECURE_COOKIES: process.env.SECURE_COOKIES
      }
    }, { status: 500 })
  }
}

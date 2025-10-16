import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { securityMiddleware } from '@/lib/security'
import { logger } from '@/lib/logger'

// Rutas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/api/users',
  '/api/patients',
  '/api/services',
  '/api/invoices',
  '/api/appointments',
  '/api/upload',
  '/api/upload-simple',
  '/api/invoice-design'
]

// Rutas públicas
const publicRoutes = [
  '/',
  '/auth/signin',
  '/api/auth',
  '/api/health'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Aplicar middleware de seguridad
  const securityResponse = securityMiddleware(request)
  if (securityResponse) return securityResponse

  // Permitir rutas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar autenticación para rutas protegidas
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      // Log del intento de acceso no autorizado
      logger.warn("Acceso no autorizado", {
        pathname,
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })

      // Redirigir a login si no está autenticado
      const url = new URL('/auth/signin', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // Verificar roles para rutas específicas
    if (pathname.startsWith('/api/users') && token.role !== 'ADMIN') {
      logger.warn("Acceso denegado a usuarios", {
        userId: token.userId,
        role: token.role,
        pathname
      })
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (pathname.startsWith('/api/services') && !['ADMIN', 'BILLING'].includes(token.role)) {
      logger.warn("Acceso denegado a servicios", {
        userId: token.userId,
        role: token.role,
        pathname
      })
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (pathname.startsWith('/api/invoice-design') && token.role !== 'ADMIN') {
      logger.warn("Acceso denegado a diseño de facturas", {
        userId: token.userId,
        role: token.role,
        pathname
      })
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Headers de seguridad
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
}

// Función para aplicar headers de seguridad
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Función para validar rate limiting básico
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const key = ip
  
  const current = requestCounts.get(key)
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

// Función para validar tamaño de request
export function validateRequestSize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    return size <= maxSize
  }
  return true
}

// Función para validar Content-Type
export function validateContentType(request: NextRequest, allowedTypes: string[] = ['application/json']): boolean {
  const contentType = request.headers.get('content-type')
  if (!contentType) return false
  
  return allowedTypes.some(type => contentType.includes(type))
}

// Middleware de seguridad
export function securityMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  
  // Validar rate limiting
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones' },
      { status: 429 }
    )
  }
  
  // Permitir uploads sin validaciones estrictas
  if (pathname.startsWith('/api/upload')) {
    return null
  }
  
  // Validar tamaño de request para POST/PUT (excepto uploads)
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (!validateRequestSize(request)) {
      return NextResponse.json(
        { error: 'Request demasiado grande' },
        { status: 413 }
      )
    }
    
    if (!validateContentType(request)) {
      return NextResponse.json(
        { error: 'Content-Type no válido' },
        { status: 415 }
      )
    }
  }
  // En App Route Handlers no se debe usar NextResponse.next().
  // Retornar null indica que todo está OK y la ruta puede continuar.
  return null
}

// Función para sanitizar parámetros de URL
export function sanitizeQueryParams(params: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams()
  
  for (const [key, value] of params.entries()) {
    // Sanitizar key y value
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)
    const sanitizedValue = value.replace(/[<>]/g, '').substring(0, 100)
    
    if (sanitizedKey && sanitizedValue) {
      sanitized.set(sanitizedKey, sanitizedValue)
    }
  }
  
  return sanitized
}

// Función para validar y sanitizar IDs de URL
export function validateAndSanitizeId(id: string): string | null {
  if (!id || typeof id !== 'string') return null
  
  // Validar formato de ID (cuid)
  const cuidRegex = /^c[a-z0-9]{24}$/
  if (!cuidRegex.test(id)) return null
  
  return id
}

// Función para crear respuesta de error segura
export function createSecureErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: securityHeaders
    }
  )
}

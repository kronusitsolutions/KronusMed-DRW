import { NextRequest } from 'next/server'
import { sanitizeForLogs } from './encryption.edge'

// Tipos de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Interfaz para el contexto del log
export interface LogContext {
  userId?: string
  role?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  duration?: number
  [key: string]: any
}

// Campos sensibles que deben ser redactados en logs
const SENSITIVE_FIELDS = [
  'password',
  'notes',
  'condition',
  'treatment',
  'phone',
  'email',
  'address',
  'reason',
  'oldData',
  'newData'
]

// Clase Logger
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    // Sanitizar contexto para remover datos sensibles
    const sanitizedContext = context ? sanitizeForLogs(context, SENSITIVE_FIELDS) : null
    const contextStr = sanitizedContext ? ` | ${JSON.stringify(sanitizedContext)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // En producción, solo log error y warn
    return ['error', 'warn'].includes(level)
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined
        } : undefined
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  private logWithContext(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    switch (level) {
      case 'error':
        this.error(message, error, context)
        break
      case 'warn':
        this.warn(message, context)
        break
      case 'info':
        this.info(message, context)
        break
      case 'debug':
      default:
        this.debug(message, context)
        break
    }
  }

  // Método para logs de API
  apiLog(level: LogLevel, message: string, request: NextRequest, context?: LogContext): void {
    const apiContext = {
      ...context,
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: request.nextUrl.pathname,
      method: request.method
    }
    
    this.logWithContext(level, message, apiContext)
  }

  // Método para logs de autenticación
  authLog(level: LogLevel, message: string, userId?: string, context?: LogContext): void {
    const authContext = {
      ...context,
      userId,
      event: 'authentication'
    }
    
    this.logWithContext(level, message, authContext)
  }

  // Método para logs de base de datos
  dbLog(level: LogLevel, message: string, operation?: string, context?: LogContext): void {
    const dbContext = {
      ...context,
      operation,
      event: 'database'
    }
    
    this.logWithContext(level, message, dbContext)
  }
}

// Instancia global del logger
export const logger = new Logger()

// Función helper para extraer contexto de request
export function extractRequestContext(request: NextRequest): LogContext {
  return {
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: request.nextUrl.pathname,
    method: request.method
  }
}

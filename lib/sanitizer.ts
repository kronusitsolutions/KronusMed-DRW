import { z } from 'zod'

// Función para sanitizar strings
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicos
    .replace(/javascript:/gi, '') // Remover javascript: protocol
    .replace(/on\w+=/gi, '') // Remover event handlers
    .substring(0, 1000) // Limitar longitud
}

// Función para sanitizar email
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  const sanitized = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return emailRegex.test(sanitized) ? sanitized : ''
}

// Función para sanitizar teléfono
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  
  return phone
    .replace(/[^\d\s\(\)\-\+]/g, '') // Solo números, espacios, paréntesis, guiones y +
    .trim()
    .substring(0, 20)
}

// Función para sanitizar números
export function sanitizeNumber(input: any): number {
  const num = Number(input)
  return isNaN(num) ? 0 : Math.max(0, num)
}

// Función para sanitizar precio
export function sanitizePrice(input: any): number {
  const num = Number(input)
  return isNaN(num) ? 0 : Math.max(0, Math.round(num * 100) / 100)
}

// Función para sanitizar fecha
export function sanitizeDate(input: any): Date | null {
  if (!input) return null
  
  const date = new Date(input)
  return isNaN(date.getTime()) ? null : date
}

// Función para sanitizar ID
export function sanitizeId(input: any): string {
  if (typeof input !== 'string') return ''
  
  // Solo permitir caracteres válidos para ID (cuid)
  return input.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50)
}

// Función para sanitizar texto largo
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, maxLength)
}

// Schemas de validación con sanitización
export const sanitizedStringSchema = z.string()
  .transform(sanitizeString)
  .refine(val => val.length > 0, 'Campo requerido')

export const sanitizedEmailSchema = z.string()
  .transform(sanitizeEmail)
  .refine(val => val.length > 0, 'Email inválido')

export const sanitizedPhoneSchema = z.string()
  .transform(sanitizePhone)
  .refine(val => val.length > 0, 'Teléfono inválido')

export const sanitizedNumberSchema = z.number()
  .or(z.string().transform(val => sanitizeNumber(val)))

export const sanitizedPriceSchema = z.number()
  .or(z.string().transform(val => sanitizePrice(val)))

export const sanitizedIdSchema = z.string()
  .transform(sanitizeId)
  .refine(val => val.length > 0, 'ID inválido')

export const sanitizedTextSchema = z.string()
  .transform(val => sanitizeText(val))
  .refine(val => val.length > 0, 'Texto requerido')

// Función para sanitizar objeto completo
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(obj)
  } catch (error) {
    throw new Error(`Error de validación: ${error}`)
  }
}

// Función para validar y sanitizar request body
export async function sanitizeRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return sanitizeObject(body, schema)
  } catch (error) {
    throw new Error('Error al procesar el cuerpo de la petición')
  }
}

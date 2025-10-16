/**
 * Utilidades de fecha con zona horaria correcta para República Dominicana
 * Soluciona el problema de hora adelantada 4 horas
 */

// Zona horaria de República Dominicana (UTC-4)
const TIMEZONE = 'America/Santo_Domingo'

/**
 * Obtiene la fecha actual en la zona horaria de El Salvador
 */
export function getCurrentDate(): Date {
  return new Date()
}

/**
 * Convierte una fecha UTC a la zona horaria de República Dominicana
 */
export function toDominicanTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Crear fecha en zona horaria de República Dominicana
  const dominicanDate = new Date(dateObj.toLocaleString('en-US', { timeZone: TIMEZONE }))
  
  return dominicanDate
}

/**
 * Convierte una fecha de República Dominicana a UTC para almacenar en BD
 */
export function toUTC(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // La fecha ya está en UTC si viene de la BD
  return dateObj
}

/**
 * Formatea una fecha para mostrar en la zona horaria local
 */
export function formatDateForDisplay(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }
  
  return dateObj.toLocaleString('es-ES', { ...defaultOptions, ...options })
}

/**
 * Formatea solo la fecha (sin hora) para mostrar
 */
export function formatDateOnly(date: Date | string): string {
  return formatDateForDisplay(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Formatea solo la hora para mostrar
 */
export function formatTimeOnly(date: Date | string): string {
  return formatDateForDisplay(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Obtiene el inicio del día en zona horaria de República Dominicana
 */
export function getStartOfDay(date?: Date | string): Date {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  
  // Crear fecha en zona horaria de República Dominicana
  const dominicanDate = new Date(dateObj.toLocaleString('en-US', { timeZone: TIMEZONE }))
  
  // Establecer a las 00:00:00
  dominicanDate.setHours(0, 0, 0, 0)
  
  return dominicanDate
}

/**
 * Obtiene el final del día en zona horaria de República Dominicana
 */
export function getEndOfDay(date?: Date | string): Date {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  
  // Crear fecha en zona horaria de República Dominicana
  const dominicanDate = new Date(dateObj.toLocaleString('en-US', { timeZone: TIMEZONE }))
  
  // Establecer a las 23:59:59.999
  dominicanDate.setHours(23, 59, 59, 999)
  
  return dominicanDate
}

/**
 * Convierte una fecha de formulario (YYYY-MM-DD) a Date en zona horaria local
 */
export function parseFormDate(dateString: string): Date {
  // Crear fecha en zona horaria local
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month - 1 porque Date usa 0-indexado
}

/**
 * Convierte una fecha de formulario datetime-local a Date en zona horaria local
 */
export function parseFormDateTime(dateTimeString: string): Date {
  // Crear fecha en zona horaria local
  const [datePart, timePart] = dateTimeString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  
  return new Date(year, month - 1, day, hour, minute)
}

/**
 * Convierte una Date a string para input type="date"
 */
export function toDateInputValue(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Formatear en zona horaria local
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Convierte una Date a string para input type="datetime-local"
 */
export function toDateTimeInputValue(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Formatear en zona horaria local
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hour = String(dateObj.getHours()).padStart(2, '0')
  const minute = String(dateObj.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hour}:${minute}`
}

/**
 * Obtiene la fecha actual formateada para input type="date"
 */
export function getCurrentDateInputValue(): string {
  return toDateInputValue(new Date())
}

/**
 * Obtiene la fecha actual formateada para input type="datetime-local"
 */
export function getCurrentDateTimeInputValue(): string {
  return toDateTimeInputValue(new Date())
}

/**
 * Verifica si una fecha está en el rango de hoy (zona horaria local)
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear()
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function getDayName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[dateObj.getDay()]
}

/**
 * Obtiene el nombre del mes en español
 */
export function getMonthName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[dateObj.getMonth()]
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Agrega días a una fecha
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Agrega meses a una fecha
 */
export function addMonths(date: Date | string, months: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Obtiene el primer día del mes
 */
export function getFirstDayOfMonth(date?: Date | string): Date {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
}

/**
 * Obtiene el último día del mes
 */
export function getLastDayOfMonth(date?: Date | string): Date {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0)
}

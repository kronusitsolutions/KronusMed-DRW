/**
 * Utilidades para el manejo de edad y fecha de nacimiento
 * Permite migración gradual de edad a fecha de nacimiento
 */

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param birthDate - Fecha de nacimiento
 * @returns Edad en años
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Calcula una fecha de nacimiento aproximada basada en la edad
 * @param age - Edad en años
 * @returns Fecha de nacimiento aproximada (1 de enero del año calculado)
 */
export function calculateBirthDateFromAge(age: number): Date {
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - age
  return new Date(birthYear, 0, 1) // 1 de enero del año calculado
}

/**
 * Obtiene la edad a mostrar, priorizando la calculada desde fecha de nacimiento
 * @param age - Edad almacenada en la base de datos
 * @param birthDate - Fecha de nacimiento (opcional, string o Date)
 * @returns Edad a mostrar
 */
export function getDisplayAge(age: number, birthDate?: string | Date | null): number {
  if (birthDate) {
    // Si es string, convertir a Date
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
    return calculateAge(date)
  }
  return age
}

/**
 * Valida si una fecha de nacimiento es válida
 * @param birthDate - Fecha de nacimiento
 * @returns true si es válida, false si no
 */
export function isValidBirthDate(birthDate: Date): boolean {
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 150, 0, 1) // Máximo 150 años
  
  return birthDate <= today && birthDate >= minDate
}

/**
 * Formatea la edad para mostrar
 * @param age - Edad en años
 * @returns String formateado
 */
export function formatAge(age: number): string {
  if (age === 1) {
    return '1 año'
  }
  return `${age} años`
}

/**
 * Obtiene la fecha de nacimiento para usar en formularios
 * @param birthDate - Fecha de nacimiento de la base de datos (string o Date)
 * @param age - Edad de la base de datos (como respaldo)
 * @returns Fecha de nacimiento para el formulario
 */
export function getFormBirthDate(birthDate?: string | Date | null, age?: number): string {
  if (birthDate) {
    // Si es string, devolverlo directamente
    if (typeof birthDate === 'string') {
      return birthDate.split('T')[0] // Formato YYYY-MM-DD
    }
    // Si es Date, convertir a string
    return birthDate.toISOString().split('T')[0]
  }
  
  if (age) {
    const calculatedBirthDate = calculateBirthDateFromAge(age)
    return calculatedBirthDate.toISOString().split('T')[0]
  }
  
  return ''
}

/**
 * Convierte una fecha de formulario a Date
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date object
 */
export function parseFormDate(dateString: string): Date {
  // Crear fecha en zona horaria local (no UTC)
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month - 1 porque Date usa 0-indexado
}

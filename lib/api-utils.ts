/**
 * Utilidades para manejar respuestas de API con paginación
 * Proporciona funciones para extraer datos de respuestas que pueden ser arrays o objetos con paginación
 */

/**
 * Extrae el array de datos de una respuesta de API que puede ser:
 * - Un array directo (formato antiguo)
 * - Un objeto con paginación { data: [...], pagination: {...} }
 * - Un objeto con el array en una propiedad específica
 */
export function extractDataFromResponse<T>(
  response: any,
  dataKey: string = 'data'
): T[] {
  if (Array.isArray(response)) {
    return response
  }
  
  if (response && typeof response === 'object') {
    // Buscar el array en diferentes propiedades comunes
    const possibleKeys = [dataKey, 'items', 'results', 'list']
    
    for (const key of possibleKeys) {
      if (Array.isArray(response[key])) {
        return response[key]
      }
    }
    
    // Si no se encuentra un array, devolver array vacío
    console.warn(`No se encontró array de datos en la respuesta. Claves disponibles:`, Object.keys(response))
    return []
  }
  
  console.warn('Respuesta de API no es un array ni un objeto válido:', response)
  return []
}

/**
 * Extrae datos de pacientes de una respuesta de API
 */
export function extractPatientsFromResponse(response: any): any[] {
  return extractDataFromResponse(response, 'patients')
}

/**
 * Extrae datos de facturas de una respuesta de API
 */
export function extractInvoicesFromResponse(response: any): any[] {
  return extractDataFromResponse(response, 'invoices')
}

/**
 * Extrae datos de citas de una respuesta de API
 */
export function extractAppointmentsFromResponse(response: any): any[] {
  return extractDataFromResponse(response, 'appointments')
}

/**
 * Extrae datos de servicios de una respuesta de API
 */
export function extractServicesFromResponse(response: any): any[] {
  return extractDataFromResponse(response, 'services')
}

/**
 * Extrae información de paginación de una respuesta de API
 */
export function extractPaginationFromResponse(response: any): any {
  if (Array.isArray(response)) {
    return null
  }
  
  if (response && typeof response === 'object') {
    return response.pagination || response.meta || null
  }
  
  return null
}

/**
 * Función helper para hacer fetch y extraer datos automáticamente
 */
export async function fetchAndExtractData<T>(
  url: string,
  dataKey: string = 'data',
  options?: RequestInit
): Promise<{ data: T[]; pagination?: any }> {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const responseData = await response.json()
    const data = extractDataFromResponse<T>(responseData, dataKey)
    const pagination = extractPaginationFromResponse(responseData)
    
    return { data, pagination }
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error)
    throw error
  }
}

/**
 * Función específica para obtener pacientes
 */
export async function fetchPatients(options?: RequestInit) {
  return fetchAndExtractData('/api/patients', 'patients', options)
}

/**
 * Función específica para obtener facturas
 */
export async function fetchInvoices(options?: RequestInit) {
  return fetchAndExtractData('/api/invoices', 'invoices', options)
}

/**
 * Función específica para obtener citas
 */
export async function fetchAppointments(options?: RequestInit) {
  return fetchAndExtractData('/api/appointments', 'appointments', options)
}

/**
 * Función específica para obtener servicios
 */
export async function fetchServices(options?: RequestInit) {
  return fetchAndExtractData('/api/services', 'services', options)
}

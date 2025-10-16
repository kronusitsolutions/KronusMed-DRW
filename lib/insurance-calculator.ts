export interface InsuranceCalculation {
  serviceId: string
  serviceName: string
  basePrice: number
  coveragePercent: number
  insuranceCovers: number
  patientPays: number
  insuranceName?: string
}

export interface InvoiceCalculation {
  items: InsuranceCalculation[]
  totalBaseAmount: number
  totalInsuranceCovers: number
  totalPatientPays: number
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('US$', '$')
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(percent: number): string {
  return `${percent.toFixed(1)}%`
}

/**
 * Verifica si el sistema de seguros está habilitado
 * Esta función debe ser llamada desde el servidor
 */
export async function isInsuranceBillingEnabled(): Promise<boolean> {
  try {
    // Esta función debe ser implementada en una API route
    // Por ahora retornamos false para evitar errores
    return false
  } catch (error) {
    console.error("Error al verificar feature flag de facturación con seguros:", error)
    return false
  }
}
/**
 * Utilidades para cálculos de reportes
 * Funciones para calcular KPIs, tendencias y métricas de negocio
 */

export interface PeriodData {
  startDate: Date
  endDate: Date
  totalRevenue: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  partialInvoices: number
  exoneratedInvoices: number
  totalPatients: number
  totalAppointments: number
  avgRevenuePerAppointment: number
  collectionRate: number
  exoneratedPercentage: number
}

export interface AgingReport {
  current: number // 0-30 días
  days31to60: number // 31-60 días
  days61to90: number // 61-90 días
  over90: number // 90+ días
  total: number
}

export interface TrendData {
  value: number
  previousValue: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface PatientMetrics {
  totalPatients: number
  newPatients: number
  returningPatients: number
  retentionRate: number
  avgVisitsPerPatient: number
  ltv: number // Lifetime Value promedio
  noShowRate: number
  conversionRate: number // Primera cita → paciente recurrente
}

/**
 * Calcula la tasa de crecimiento entre dos períodos
 */
export function calculateGrowthRate(current: number, previous: number): TrendData {
  const change = current - previous
  const changePercent = previous > 0 ? (change / previous) * 100 : 0
  
  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (changePercent > 2) trend = 'up'
  else if (changePercent < -2) trend = 'down'
  
  return {
    value: current,
    previousValue: previous,
    change,
    changePercent,
    trend
  }
}

/**
 * Calcula la tasa de retención de pacientes
 */
export function calculateRetentionRate(
  totalPatients: number,
  returningPatients: number
): number {
  return totalPatients > 0 ? (returningPatients / totalPatients) * 100 : 0
}

/**
 * Calcula el Lifetime Value promedio de un paciente
 */
export function calculateLTV(
  totalRevenue: number,
  totalPatients: number,
  avgVisitsPerPatient: number
): number {
  if (totalPatients === 0) return 0
  return totalRevenue / totalPatients
}

/**
 * Calcula el aging report de cuentas por cobrar
 */
export function calculateAgingReport(invoices: any[]): AgingReport {
  const now = new Date()
  const aging = {
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
    total: 0
  }

  invoices.forEach(invoice => {
    if (invoice.status === 'PENDING' || invoice.status === 'PARTIAL') {
      const daysDiff = Math.floor((now.getTime() - new Date(invoice.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const amount = invoice.status === 'PARTIAL' ? (invoice.pendingAmount || 0) : invoice.totalAmount
      
      aging.total += amount
      
      if (daysDiff <= 30) {
        aging.current += amount
      } else if (daysDiff <= 60) {
        aging.days31to60 += amount
      } else if (daysDiff <= 90) {
        aging.days61to90 += amount
      } else {
        aging.over90 += amount
      }
    }
  })

  return aging
}

/**
 * Calcula la tendencia de una serie de datos
 */
export function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}

/**
 * Calcula métricas de pacientes
 */
export function calculatePatientMetrics(
  patients: any[],
  appointments: any[],
  invoices: any[]
): PatientMetrics {
  const totalPatients = patients.length
  
  // Pacientes nuevos vs recurrentes
  const newPatients = patients.filter(p => {
    const patientAppointments = appointments.filter(a => a.patientId === p.id)
    return patientAppointments.length === 1
  }).length
  
  const returningPatients = totalPatients - newPatients
  
  // Tasa de retención
  const retentionRate = calculateRetentionRate(totalPatients, returningPatients)
  
  // Promedio de visitas por paciente
  const totalAppointments = appointments.length
  const avgVisitsPerPatient = totalPatients > 0 ? totalAppointments / totalPatients : 0
  
  // LTV promedio
  const totalRevenue = invoices
    .filter(inv => inv.status === 'PAID' || inv.status === 'PARTIAL')
    .reduce((sum, inv) => {
      if (inv.status === 'PAID') return sum + inv.totalAmount
      if (inv.status === 'PARTIAL') return sum + (inv.paidAmount || 0)
      return sum
    }, 0)
  
  const ltv = calculateLTV(totalRevenue, totalPatients, avgVisitsPerPatient)
  
  // Tasa de ausentismo (no-show rate)
  const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length
  const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0
  
  // Tasa de conversión (primera cita → paciente recurrente)
  const firstTimePatients = patients.filter(p => {
    const patientAppointments = appointments.filter(a => a.patientId === p.id)
    return patientAppointments.length === 1
  })
  
  const convertedPatients = firstTimePatients.filter(p => {
    const patientAppointments = appointments.filter(a => a.patientId === p.id)
    return patientAppointments.length > 1
  }).length
  
  const conversionRate = firstTimePatients.length > 0 ? (convertedPatients / firstTimePatients.length) * 100 : 0
  
  return {
    totalPatients,
    newPatients,
    returningPatients,
    retentionRate,
    avgVisitsPerPatient,
    ltv,
    noShowRate,
    conversionRate
  }
}

/**
 * Calcula la tasa de morosidad
 */
export function calculateDelinquencyRate(
  pendingInvoices: number,
  partialInvoices: number,
  totalInvoices: number
): number {
  const totalPending = pendingInvoices + partialInvoices
  return totalInvoices > 0 ? (totalPending / totalInvoices) * 100 : 0
}

/**
 * Calcula el promedio de días de atraso en pagos
 */
export function calculateAverageDaysOverdue(invoices: any[]): number {
  const now = new Date()
  const overdueInvoices = invoices.filter(invoice => {
    if (invoice.status !== 'PENDING' && invoice.status !== 'PARTIAL') return false
    if (!invoice.dueDate) return true // Sin fecha de vencimiento = atrasado
    return new Date(invoice.dueDate) < now
  })
  
  if (overdueInvoices.length === 0) return 0
  
  const totalDays = overdueInvoices.reduce((sum, invoice) => {
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoice.createdAt)
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    return sum + Math.max(0, daysDiff)
  }, 0)
  
  return totalDays / overdueInvoices.length
}

/**
 * Calcula tendencias de pagos parciales
 */
export function calculatePartialPaymentsTrend(
  invoices: any[],
  periodMonths: number
): { monthly: { month: string; partialCount: number; partialAmount: number }[] } {
  const monthlyData: { [key: string]: { partialCount: number; partialAmount: number } } = {}
  
  // Inicializar meses
  const now = new Date()
  for (let i = 0; i < periodMonths; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - (periodMonths - 1 - i), 1)
    const monthKey = month.toLocaleDateString('es-ES', { month: 'short' })
    monthlyData[monthKey] = { partialCount: 0, partialAmount: 0 }
  }
  
  // Procesar facturas parciales
  invoices.forEach(invoice => {
    if (invoice.status === 'PARTIAL') {
      const invoiceDate = new Date(invoice.createdAt)
      const monthKey = invoiceDate.toLocaleDateString('es-ES', { month: 'short' })
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].partialCount++
        monthlyData[monthKey].partialAmount += invoice.paidAmount || 0
      }
    }
  })
  
  return {
    monthly: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      partialCount: data.partialCount,
      partialAmount: data.partialAmount
    }))
  }
}

/**
 * Calcula métricas de conversión de pagos parciales
 */
export function calculatePartialPaymentConversion(
  partialInvoices: any[]
): { conversionRate: number; avgDaysToComplete: number } {
  const completedPartials = partialInvoices.filter(inv => inv.status === 'PAID')
  const conversionRate = partialInvoices.length > 0 ? (completedPartials.length / partialInvoices.length) * 100 : 0
  
  // Calcular días promedio para completar pago
  let totalDays = 0
  let completedCount = 0
  
  completedPartials.forEach(invoice => {
    if (invoice.paidAt) {
      const daysDiff = Math.floor(
        (new Date(invoice.paidAt).getTime() - new Date(invoice.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      totalDays += daysDiff
      completedCount++
    }
  })
  
  const avgDaysToComplete = completedCount > 0 ? totalDays / completedCount : 0
  
  return {
    conversionRate,
    avgDaysToComplete
  }
}

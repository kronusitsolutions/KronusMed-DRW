/**
 * Utilidades para comparación de períodos
 * Funciones para comparar métricas entre diferentes períodos de tiempo
 */

import { PeriodData, TrendData } from './report-calculations'

export interface PeriodComparison {
  current: PeriodData
  previous: PeriodData
  comparison: {
    revenue: TrendData
    invoices: TrendData
    patients: TrendData
    appointments: TrendData
    collectionRate: TrendData
    avgRevenuePerAppointment: TrendData
  }
  summary: {
    overallGrowth: number
    bestMetric: string
    worstMetric: string
    recommendations: string[]
  }
}

/**
 * Compara dos períodos y calcula las diferencias
 */
export function comparePeriods(current: PeriodData, previous: PeriodData): PeriodComparison {
  // Calcular tendencias para cada métrica
  const revenue = calculateTrendData(current.totalRevenue, previous.totalRevenue)
  const invoices = calculateTrendData(current.totalInvoices, previous.totalInvoices)
  const patients = calculateTrendData(current.totalPatients, previous.totalPatients)
  const appointments = calculateTrendData(current.totalAppointments, previous.totalAppointments)
  const collectionRate = calculateTrendData(current.collectionRate, previous.collectionRate)
  const avgRevenuePerAppointment = calculateTrendData(
    current.avgRevenuePerAppointment, 
    previous.avgRevenuePerAppointment
  )

  // Calcular crecimiento general
  const overallGrowth = revenue.changePercent

  // Identificar mejor y peor métrica
  const metrics = [
    { name: 'Ingresos', trend: revenue },
    { name: 'Facturas', trend: invoices },
    { name: 'Pacientes', trend: patients },
    { name: 'Citas', trend: appointments },
    { name: 'Tasa de Cobro', trend: collectionRate },
    { name: 'Ingreso por Cita', trend: avgRevenuePerAppointment }
  ]

  const bestMetric = metrics.reduce((best, current) => 
    current.trend.changePercent > best.trend.changePercent ? current : best
  ).name

  const worstMetric = metrics.reduce((worst, current) => 
    current.trend.changePercent < worst.trend.changePercent ? current : worst
  ).name

  // Generar recomendaciones
  const recommendations = generateRecommendations({
    revenue,
    invoices,
    patients,
    appointments,
    collectionRate,
    avgRevenuePerAppointment
  })

  return {
    current,
    previous,
    comparison: {
      revenue,
      invoices,
      patients,
      appointments,
      collectionRate,
      avgRevenuePerAppointment
    },
    summary: {
      overallGrowth,
      bestMetric,
      worstMetric,
      recommendations
    }
  }
}

/**
 * Calcula datos de tendencia entre dos valores
 */
function calculateTrendData(current: number, previous: number): TrendData {
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
 * Genera recomendaciones basadas en las tendencias
 */
function generateRecommendations(metrics: {
  revenue: TrendData
  invoices: TrendData
  patients: TrendData
  appointments: TrendData
  collectionRate: TrendData
  avgRevenuePerAppointment: TrendData
}): string[] {
  const recommendations: string[] = []

  // Análisis de ingresos
  if (metrics.revenue.trend === 'down') {
    recommendations.push('📉 Los ingresos han disminuido. Revisar estrategias de precios y servicios.')
  } else if (metrics.revenue.trend === 'up') {
    recommendations.push('📈 Excelente crecimiento en ingresos. Mantener estrategias actuales.')
  }

  // Análisis de tasa de cobro
  if (metrics.collectionRate.trend === 'down') {
    recommendations.push('⚠️ La tasa de cobro ha disminuido. Implementar seguimiento más agresivo de cuentas por cobrar.')
  } else if (metrics.collectionRate.value < 80) {
    recommendations.push('🔍 La tasa de cobro está por debajo del 80%. Revisar procesos de cobranza.')
  }

  // Análisis de pacientes
  if (metrics.patients.trend === 'down') {
    recommendations.push('👥 Disminución en número de pacientes. Revisar estrategias de marketing y retención.')
  } else if (metrics.patients.trend === 'up') {
    recommendations.push('✅ Crecimiento en base de pacientes. Asegurar capacidad para atender la demanda.')
  }

  // Análisis de citas
  if (metrics.appointments.trend === 'down' && metrics.patients.trend === 'up') {
    recommendations.push('📅 Más pacientes pero menos citas. Revisar disponibilidad y programación.')
  }

  // Análisis de ingreso por cita
  if (metrics.avgRevenuePerAppointment.trend === 'up') {
    recommendations.push('💰 Aumento en ingreso por cita. Considerar servicios premium o ajustes de precios.')
  } else if (metrics.avgRevenuePerAppointment.trend === 'down') {
    recommendations.push('💡 Disminución en ingreso por cita. Revisar mix de servicios y precios.')
  }

  // Recomendaciones generales
  if (metrics.revenue.trend === 'up' && metrics.patients.trend === 'up') {
    recommendations.push('🎯 Crecimiento saludable en ingresos y pacientes. Considerar expansión.')
  }

  if (metrics.collectionRate.value > 90 && metrics.revenue.trend === 'up') {
    recommendations.push('🏆 Excelente rendimiento financiero. Mantener estándares actuales.')
  }

  return recommendations
}

/**
 * Calcula la varianza entre dos períodos
 */
export function calculateVariance(current: number, previous: number): {
  absolute: number
  percentage: number
  direction: 'increase' | 'decrease' | 'stable'
} {
  const absolute = current - previous
  const percentage = previous > 0 ? (absolute / previous) * 100 : 0
  
  let direction: 'increase' | 'decrease' | 'stable' = 'stable'
  if (percentage > 2) direction = 'increase'
  else if (percentage < -2) direction = 'decrease'
  
  return {
    absolute,
    percentage,
    direction
  }
}

/**
 * Obtiene indicador visual de tendencia
 */
export function getTrendIndicator(trend: 'up' | 'down' | 'stable', changePercent: number): {
  icon: string
  color: string
  text: string
} {
  switch (trend) {
    case 'up':
      return {
        icon: '↗️',
        color: 'text-green-600',
        text: `+${changePercent.toFixed(1)}%`
      }
    case 'down':
      return {
        icon: '↘️',
        color: 'text-red-600',
        text: `${changePercent.toFixed(1)}%`
      }
    default:
      return {
        icon: '→',
        color: 'text-gray-600',
        text: `${changePercent.toFixed(1)}%`
      }
  }
}

/**
 * Calcula el período anterior basado en el período actual
 */
export function getPreviousPeriod(currentStart: Date, currentEnd: Date): {
  start: Date
  end: Date
} {
  const duration = currentEnd.getTime() - currentStart.getTime()
  const previousEnd = new Date(currentStart.getTime() - 1) // Un día antes del inicio actual
  const previousStart = new Date(previousEnd.getTime() - duration)
  
  return {
    start: previousStart,
    end: previousEnd
  }
}

/**
 * Formatea datos de comparación para mostrar en UI
 */
export function formatComparisonData(comparison: PeriodComparison): {
  metrics: Array<{
    name: string
    current: number
    previous: number
    change: number
    changePercent: number
    trend: 'up' | 'down' | 'stable'
    indicator: { icon: string; color: string; text: string }
  }>
  summary: {
    overallGrowth: number
    bestMetric: string
    worstMetric: string
    recommendations: string[]
  }
} {
  const metrics = [
    {
      name: 'Ingresos',
      current: comparison.current.totalRevenue,
      previous: comparison.previous.totalRevenue,
      change: comparison.comparison.revenue.change,
      changePercent: comparison.comparison.revenue.changePercent,
      trend: comparison.comparison.revenue.trend,
      indicator: getTrendIndicator(
        comparison.comparison.revenue.trend,
        comparison.comparison.revenue.changePercent
      )
    },
    {
      name: 'Facturas',
      current: comparison.current.totalInvoices,
      previous: comparison.previous.totalInvoices,
      change: comparison.comparison.invoices.change,
      changePercent: comparison.comparison.invoices.changePercent,
      trend: comparison.comparison.invoices.trend,
      indicator: getTrendIndicator(
        comparison.comparison.invoices.trend,
        comparison.comparison.invoices.changePercent
      )
    },
    {
      name: 'Pacientes',
      current: comparison.current.totalPatients,
      previous: comparison.previous.totalPatients,
      change: comparison.comparison.patients.change,
      changePercent: comparison.comparison.patients.changePercent,
      trend: comparison.comparison.patients.trend,
      indicator: getTrendIndicator(
        comparison.comparison.patients.trend,
        comparison.comparison.patients.changePercent
      )
    },
    {
      name: 'Citas',
      current: comparison.current.totalAppointments,
      previous: comparison.previous.totalAppointments,
      change: comparison.comparison.appointments.change,
      changePercent: comparison.comparison.appointments.changePercent,
      trend: comparison.comparison.appointments.trend,
      indicator: getTrendIndicator(
        comparison.comparison.appointments.trend,
        comparison.comparison.appointments.changePercent
      )
    },
    {
      name: 'Tasa de Cobro',
      current: comparison.current.collectionRate,
      previous: comparison.previous.collectionRate,
      change: comparison.comparison.collectionRate.change,
      changePercent: comparison.comparison.collectionRate.changePercent,
      trend: comparison.comparison.collectionRate.trend,
      indicator: getTrendIndicator(
        comparison.comparison.collectionRate.trend,
        comparison.comparison.collectionRate.changePercent
      )
    },
    {
      name: 'Ingreso por Cita',
      current: comparison.current.avgRevenuePerAppointment,
      previous: comparison.previous.avgRevenuePerAppointment,
      change: comparison.comparison.avgRevenuePerAppointment.change,
      changePercent: comparison.comparison.avgRevenuePerAppointment.changePercent,
      trend: comparison.comparison.avgRevenuePerAppointment.trend,
      indicator: getTrendIndicator(
        comparison.comparison.avgRevenuePerAppointment.trend,
        comparison.comparison.avgRevenuePerAppointment.changePercent
      )
    }
  ]

  return {
    metrics,
    summary: comparison.summary
  }
}

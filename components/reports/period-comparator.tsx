"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  Calendar,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComparisonMetric {
  name: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
  format?: 'currency' | 'percentage' | 'number'
  target?: number
}

interface PeriodComparatorProps {
  title: string
  description?: string
  currentPeriod: {
    label: string
    startDate: string
    endDate: string
  }
  previousPeriod: {
    label: string
    startDate: string
    endDate: string
  }
  metrics: ComparisonMetric[]
  className?: string
  showTargets?: boolean
}

export function PeriodComparator({
  title,
  description,
  currentPeriod,
  previousPeriod,
  metrics,
  className,
  showTargets = false
}: PeriodComparatorProps) {
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'number':
        return new Intl.NumberFormat('es-ES').format(value)
      default:
        return value.toString()
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusBadge = (metric: ComparisonMetric) => {
    if (!showTargets || !metric.target) return null
    
    const achievement = (metric.current / metric.target) * 100
    
    if (achievement >= 100) {
      return <Badge variant="default" className="bg-green-100 text-green-800">✅ Objetivo</Badge>
    } else if (achievement >= 80) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🎯 Cerca</Badge>
    } else {
      return <Badge variant="outline" className="bg-red-100 text-red-800">📉 Pendiente</Badge>
    }
  }

  return (
    <Card className={cn("bg-white", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        )}
        
        {/* Períodos */}
        <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {previousPeriod.label}
              </div>
              <div className="text-xs text-gray-500">
                {previousPeriod.startDate} - {previousPeriod.endDate}
              </div>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-gray-400" />
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {currentPeriod.label}
              </div>
              <div className="text-xs text-gray-500">
                {currentPeriod.startDate} - {currentPeriod.endDate}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  {metric.name}
                </h4>
                {getStatusBadge(metric)}
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Período anterior */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Anterior</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {formatValue(metric.previous, metric.format)}
                  </div>
                </div>
                
                {/* Cambio */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Cambio</div>
                  <div className={cn(
                    "flex items-center space-x-1 text-sm font-medium",
                    getTrendColor(metric.trend)
                  )}>
                    {getTrendIcon(metric.trend)}
                    <span>
                      {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {/* Período actual */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Actual</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatValue(metric.current, metric.format)}
                  </div>
                </div>
                
                {/* Objetivo (si está disponible) */}
                {showTargets && metric.target && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Objetivo</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {formatValue(metric.target, metric.format)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Resumen general */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-blue-900">Resumen de Rendimiento</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xs text-blue-600 mb-1">Métricas Mejoradas</div>
              <div className="text-lg font-semibold text-green-600">
                {metrics.filter(m => m.trend === 'up').length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-blue-600 mb-1">Métricas Estables</div>
              <div className="text-lg font-semibold text-gray-600">
                {metrics.filter(m => m.trend === 'stable').length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-blue-600 mb-1">Métricas en Declive</div>
              <div className="text-lg font-semibold text-red-600">
                {metrics.filter(m => m.trend === 'down').length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente especializado para comparación financiera
export function FinancialPeriodComparator({
  title,
  description,
  currentPeriod,
  previousPeriod,
  metrics,
  className
}: {
  title: string
  description?: string
  currentPeriod: { label: string; startDate: string; endDate: string }
  previousPeriod: { label: string; startDate: string; endDate: string }
  metrics: ComparisonMetric[]
  className?: string
}) {
  return (
    <PeriodComparator
      title={title}
      description={description}
      currentPeriod={currentPeriod}
      previousPeriod={previousPeriod}
      metrics={metrics}
      className={className}
      showTargets={false}
    />
  )
}

// Componente especializado para comparación con objetivos
export function TargetPeriodComparator({
  title,
  description,
  currentPeriod,
  previousPeriod,
  metrics,
  className
}: {
  title: string
  description?: string
  currentPeriod: { label: string; startDate: string; endDate: string }
  previousPeriod: { label: string; startDate: string; endDate: string }
  metrics: ComparisonMetric[]
  className?: string
}) {
  return (
    <PeriodComparator
      title={title}
      description={description}
      currentPeriod={currentPeriod}
      previousPeriod={previousPeriod}
      metrics={metrics}
      className={className}
      showTargets={true}
    />
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'stable'
  }
  icon?: React.ReactNode
  className?: string
  format?: 'currency' | 'percentage' | 'number' | 'text'
  status?: 'excellent' | 'good' | 'warning' | 'critical'
  sparkline?: number[]
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
  format = 'text',
  status,
  sparkline
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
        return new Intl.NumberFormat('es-ES').format(val)
      default:
        return val.toString()
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500'
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      getStatusColor(),
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </div>
          {trend && (
            <div className={cn("flex items-center space-x-1 text-xs", getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {Math.abs(trend.value).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {description}
          </p>
        )}
        
        {sparkline && sparkline.length > 0 && (
          <div className="h-8 flex items-end space-x-1">
            {sparkline.map((point, index) => (
              <div
                key={index}
                className="bg-gray-300 rounded-sm flex-1 min-w-[2px]"
                style={{
                  height: `${Math.max(10, (point / Math.max(...sparkline)) * 100)}%`
                }}
              />
            ))}
          </div>
        )}
        
        {status && (
          <div className="flex items-center space-x-2">
            <Badge 
              variant={status === 'excellent' ? 'default' : 
                      status === 'good' ? 'secondary' :
                      status === 'warning' ? 'outline' : 'destructive'}
              className="text-xs"
            >
              {status === 'excellent' ? 'Excelente' :
               status === 'good' ? 'Bueno' :
               status === 'warning' ? 'Atención' : 'Crítico'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente especializado para métricas financieras
export function FinancialMetricCard({
  title,
  value,
  trend,
  description,
  className,
  icon
}: {
  title: string
  value: number
  trend?: { value: number; direction: 'up' | 'down' | 'stable' }
  description?: string
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <MetricCard
      title={title}
      value={value}
      format="currency"
      trend={trend}
      description={description}
      className={className}
      icon={icon}
      status={trend?.direction === 'up' ? 'excellent' : 
              trend?.direction === 'down' ? 'critical' : 'good'}
    />
  )
}

// Componente especializado para métricas de porcentaje
export function PercentageMetricCard({
  title,
  value,
  trend,
  description,
  target,
  className,
  icon
}: {
  title: string
  value: number
  trend?: { value: number; direction: 'up' | 'down' | 'stable' }
  description?: string
  target?: number
  className?: string
  icon?: React.ReactNode
}) {
  const getStatus = () => {
    if (target === undefined) return undefined
    
    if (value >= target) return 'excellent'
    if (value >= target * 0.8) return 'good'
    if (value >= target * 0.6) return 'warning'
    return 'critical'
  }

  return (
    <MetricCard
      title={title}
      value={value}
      format="percentage"
      trend={trend}
      description={description}
      status={getStatus()}
      className={className}
      icon={icon}
    />
  )
}

// Componente especializado para métricas de pacientes
export function PatientMetricCard({
  title,
  value,
  trend,
  description,
  className,
  icon
}: {
  title: string
  value: number
  trend?: { value: number; direction: 'up' | 'down' | 'stable' }
  description?: string
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <MetricCard
      title={title}
      value={value}
      format="number"
      trend={trend}
      description={description}
      className={className}
      icon={icon}
    />
  )
}

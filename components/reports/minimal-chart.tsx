"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MinimalChartProps {
  title: string
  description?: string
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  type?: 'line' | 'bar' | 'area'
  height?: number
  showGrid?: boolean
  showTooltips?: boolean
  className?: string
}

export function MinimalChart({
  title,
  description,
  data,
  type = 'line',
  height = 200,
  showGrid = true,
  showTooltips = true,
  className
}: MinimalChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const getPointY = (value: number) => {
    return ((maxValue - value) / range) * (height - 40) + 20
  }

  const getBarHeight = (value: number) => {
    return ((value - minValue) / range) * (height - 40)
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  return (
    <Card className={cn("bg-white", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            width="100%"
            height={height}
            className="overflow-visible"
            viewBox={`0 0 400 ${height}`}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {showGrid && (
              <g className="text-gray-200">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                  <line
                    key={index}
                    x1="20"
                    x2="380"
                    y1={20 + ratio * (height - 40)}
                    y2={20 + ratio * (height - 40)}
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                ))}
              </g>
            )}

            {/* Y-axis labels */}
            <g className="text-xs text-gray-500">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const value = maxValue - (ratio * range)
                return (
                  <text
                    key={index}
                    x="15"
                    y={20 + ratio * (height - 40) + 4}
                    textAnchor="end"
                    className="fill-current"
                  >
                    {formatValue(value)}
                  </text>
                )
              })}
            </g>

            {/* Chart content */}
            {type === 'line' && (
              <g>
                {/* Line path */}
                <path
                  d={data.map((point, index) => {
                    const x = 20 + (index * 360) / (data.length - 1)
                    const y = getPointY(point.value)
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                
                {/* Data points */}
                {data.map((point, index) => {
                  const x = 20 + (index * 360) / (data.length - 1)
                  const y = getPointY(point.value)
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      className="drop-shadow-sm"
                    />
                  )
                })}
              </g>
            )}

            {type === 'bar' && (
              <g>
                {data.map((point, index) => {
                  const x = 20 + (index * 360) / data.length
                  const width = 360 / data.length - 4
                  const barHeight = getBarHeight(point.value)
                  const y = height - 20 - barHeight
                  
                  return (
                    <rect
                      key={index}
                      x={x}
                      y={y}
                      width={width}
                      height={barHeight}
                      fill={point.color || "#3b82f6"}
                      rx="2"
                      className="drop-shadow-sm"
                    />
                  )
                })}
              </g>
            )}

            {type === 'area' && (
              <g>
                {/* Area path */}
                <path
                  d={`M 20 ${height - 20} ${data.map((point, index) => {
                    const x = 20 + (index * 360) / (data.length - 1)
                    const y = getPointY(point.value)
                    return `L ${x} ${y}`
                  }).join(' ')} L ${20 + (360 * (data.length - 1)) / (data.length - 1)} ${height - 20} Z`}
                  fill="url(#areaGradient)"
                  opacity="0.3"
                />
                
                {/* Line path */}
                <path
                  d={data.map((point, index) => {
                    const x = 20 + (index * 360) / (data.length - 1)
                    const y = getPointY(point.value)
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
              </g>
            )}

            {/* X-axis labels */}
            <g className="text-xs text-gray-500">
              {data.map((point, index) => {
                const x = 20 + (index * 360) / (data.length - 1)
                return (
                  <text
                    key={index}
                    x={x}
                    y={height - 5}
                    textAnchor="middle"
                    className="fill-current"
                  >
                    {point.name}
                  </text>
                )
              })}
            </g>

            {/* Gradient definition for area charts */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente especializado para gráficos de líneas
export function LineChart({
  title,
  description,
  data,
  height = 200,
  className
}: {
  title: string
  description?: string
  data: Array<{ name: string; value: number; color?: string }>
  height?: number
  className?: string
}) {
  return (
    <MinimalChart
      title={title}
      description={description}
      data={data}
      type="line"
      height={height}
      className={className}
    />
  )
}

// Componente especializado para gráficos de barras
export function BarChart({
  title,
  description,
  data,
  height = 200,
  className
}: {
  title: string
  description?: string
  data: Array<{ name: string; value: number; color?: string }>
  height?: number
  className?: string
}) {
  return (
    <MinimalChart
      title={title}
      description={description}
      data={data}
      type="bar"
      height={height}
      className={className}
    />
  )
}

// Componente especializado para gráficos de área
export function AreaChart({
  title,
  description,
  data,
  height = 200,
  className
}: {
  title: string
  description?: string
  data: Array<{ name: string; value: number; color?: string }>
  height?: number
  className?: string
}) {
  return (
    <MinimalChart
      title={title}
      description={description}
      data={data}
      type="area"
      height={height}
      className={className}
    />
  )
}

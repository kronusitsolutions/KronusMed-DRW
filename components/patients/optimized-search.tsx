"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Loader2 } from 'lucide-react'

interface OptimizedSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
}

/**
 * Componente de búsqueda optimizado para paginación del servidor
 * Incluye debounce visual y estados de carga
 */
export function OptimizedSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  isLoading = false,
  className = ""
}: OptimizedSearchProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar con el valor externo
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Manejar cambios con debounce visual
  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    setIsTyping(true)
    
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Debounce de 300ms
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
      setIsTyping(false)
    }, 300)
  }

  // Limpiar búsqueda
  const handleClear = () => {
    setLocalValue('')
    onChange('')
    setIsTyping(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  // Determinar el estado del ícono
  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
    }
    if (isTyping) {
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-pulse" />
    }
    return <Search className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {getIcon()}
        <Input
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-10 pr-10 h-full"
          disabled={isLoading}
        />
        {localValue && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Indicador de estado */}
      {isTyping && !isLoading && (
        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
          Escribiendo...
        </div>
      )}
    </div>
  )
}

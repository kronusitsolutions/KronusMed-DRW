"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react'
import { PaginationInfo } from '@/hooks/use-patients-pagination'

interface PaginationControlsProps {
  pagination: PaginationInfo
  isLoading: boolean
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  showLimitSelector?: boolean
  showPageInput?: boolean
  className?: string
}

/**
 * Componente de controles de paginación inteligente
 * Muestra navegación optimizada con diferentes opciones de control
 */
export function PaginationControls({
  pagination,
  isLoading,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
  showPageInput = true,
  className = ""
}: PaginationControlsProps) {
  const { page, totalPages, total, limit, hasNext, hasPrev } = pagination

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (page <= 3) {
        // Al inicio: 1, 2, 3, 4, ..., última
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        // Al final: 1, ..., penúltima, última-2, última-1, última
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // En el medio: 1, ..., actual-1, actual, actual+1, ..., última
        pages.push(1)
        pages.push('ellipsis')
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  // Calcular información de rango
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Información de paginación */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Mostrando {startItem}-{endItem} de {total} pacientes
          </span>
          {totalPages > 1 && (
            <span className="text-muted-foreground/60">
              • Página {page} de {totalPages}
            </span>
          )}
        </div>

        {/* Selector de límite por página */}
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Mostrar:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">por página</span>
          </div>
        )}
      </div>

      {/* Controles de navegación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              {/* Primera página */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={!hasPrev || isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Página anterior */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={!hasPrev || isLoading}
                  className="gap-1 pl-2.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>
              </PaginationItem>

              {/* Números de página */}
              {pageNumbers.map((pageNum, index) => (
                <PaginationItem key={index}>
                  {pageNum === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <Button
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum as number)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )}
                </PaginationItem>
              ))}

              {/* Página siguiente */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={!hasNext || isLoading}
                  className="gap-1 pr-2.5"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Última página */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  disabled={!hasNext || isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Input de página directa */}
      {showPageInput && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Ir a página:</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            value=""
            placeholder={page.toString()}
            className="w-20 h-8 text-center"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const newPage = parseInt(target.value)
                if (newPage >= 1 && newPage <= totalPages) {
                  onPageChange(newPage)
                  target.value = ''
                }
              }
            }}
            disabled={isLoading}
          />
          <span className="text-sm text-muted-foreground">de {totalPages}</span>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/patients/pagination-controls"
import { OptimizedSearch } from "@/components/patients/optimized-search"

/**
 * Página de prueba para verificar la paginación
 */
export default function TestPaginationPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Simular datos de paginación
  const mockPagination = {
    page: currentPage,
    limit: itemsPerPage,
    total: 150,
    totalPages: Math.ceil(150 / itemsPerPage),
    hasNext: currentPage < Math.ceil(150 / itemsPerPage),
    hasPrev: currentPage > 1,
    nextPage: currentPage < Math.ceil(150 / itemsPerPage) ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  }

  const handlePageChange = (page: number) => {
    setIsLoading(true)
    setCurrentPage(page)
    
    // Simular carga
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit)
    setCurrentPage(1) // Reset a la primera página
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Prueba de Paginación</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Controles de Paginación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda optimizada */}
          <div className="flex items-center gap-4">
            <OptimizedSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar pacientes..."
              isLoading={isLoading}
              className="flex-1 max-w-md"
            />
            <Button
              onClick={() => setIsLoading(!isLoading)}
              variant="outline"
            >
              {isLoading ? 'Parar Carga' : 'Simular Carga'}
            </Button>
          </div>

          {/* Información de estado */}
          <div className="text-sm text-muted-foreground">
            <p>Página actual: {currentPage}</p>
            <p>Elementos por página: {itemsPerPage}</p>
            <p>Total de páginas: {mockPagination.totalPages}</p>
            <p>Búsqueda: "{searchTerm}"</p>
          </div>

          {/* Controles de paginación */}
          <PaginationControls
            pagination={mockPagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            showLimitSelector={true}
            showPageInput={true}
          />
        </CardContent>
      </Card>

      {/* Información de prueba */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Botones de navegación:</strong> Prueba "Anterior", "Siguiente", "Primera página", "Última página"</p>
            <p>2. <strong>Números de página:</strong> Haz clic en los números para ir a páginas específicas</p>
            <p>3. <strong>Selector de límite:</strong> Cambia el número de elementos por página</p>
            <p>4. <strong>Input de página:</strong> Escribe un número y presiona Enter</p>
            <p>5. <strong>Búsqueda:</strong> Escribe en el campo de búsqueda para ver el debounce</p>
            <p>6. <strong>Estados de carga:</strong> Activa "Simular Carga" para ver los estados de loading</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

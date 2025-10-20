import { useState, useEffect, useCallback } from 'react'

export interface Service {
  id: string
  name: string
  description?: string
  price: number
  priceType?: 'FIXED' | 'DYNAMIC'
  category?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  nextPage: number | null
  prevPage: number | null
}

export interface UseServicesPaginationReturn {
  services: Service[]
  pagination: PaginationInfo
  isLoading: boolean
  error: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  categoryFilter: string
  setCategoryFilter: (category: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  refetch: () => Promise<void>
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  clearFilters: () => void
}

/**
 * Hook personalizado para manejar paginación de servicios con búsqueda
 * Optimizado para producción con consultas eficientes al backend
 */
export function useServicesPagination(initialLimit: number = 20): UseServicesPaginationReturn {
  const [services, setServices] = useState<Service[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    nextPage: null,
    prevPage: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Función para construir la URL con parámetros
  const buildUrl = useCallback((page: number, search: string, category: string, status: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: initialLimit.toString()
    })
    
    if (search.trim()) {
      params.set('search', search.trim())
    }
    
    if (category !== 'all') {
      params.set('category', category)
    }
    
    if (status !== 'all') {
      params.set('status', status)
    }
    
    return `/api/services?${params.toString()}`
  }, [initialLimit])

  // Función principal para cargar servicios
  const fetchServices = useCallback(async (page: number, search: string, category: string, status: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = buildUrl(page, search, category, status)
      console.log(`Cargando servicios: ${url}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Validar estructura de respuesta
      if (!data.services || !Array.isArray(data.services) || !data.pagination) {
        throw new Error("Formato de respuesta inválido")
      }
      
      console.log(`Servicios cargados: ${data.services.length} de ${data.pagination.total}`)
      
      setServices(data.services)
      setPagination(data.pagination)
      setCurrentPage(page)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar servicios'
      console.error("Error al cargar servicios:", errorMessage)
      setError(errorMessage)
      setServices([])
      setPagination({
        page: 1,
        limit: initialLimit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null
      })
    } finally {
      setIsLoading(false)
    }
  }, [buildUrl, initialLimit])

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServices(1, searchTerm, categoryFilter, statusFilter)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, categoryFilter, statusFilter]) // Solo cuando cambien los filtros

  // Funciones de navegación
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchServices(page, searchTerm, categoryFilter, statusFilter)
    }
  }, [fetchServices, searchTerm, categoryFilter, statusFilter, pagination.totalPages])

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.page + 1)
    }
  }, [goToPage, pagination.hasNext, pagination.page])

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      goToPage(pagination.page - 1)
    }
  }, [goToPage, pagination.hasPrev, pagination.page])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }, [])

  // Función de recarga
  const refetch = useCallback(() => {
    return fetchServices(currentPage, searchTerm, categoryFilter, statusFilter)
  }, [fetchServices, currentPage, searchTerm, categoryFilter, statusFilter])

  return {
    services,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    refetch,
    goToPage,
    nextPage,
    prevPage,
    clearFilters
  }
}

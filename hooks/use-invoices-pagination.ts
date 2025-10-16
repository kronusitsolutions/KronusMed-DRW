import { useState, useEffect, useCallback } from 'react'
import { Invoice, InvoiceItem } from '@/types/invoice'

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

export interface UseInvoicesPaginationReturn {
  invoices: Invoice[]
  pagination: PaginationInfo
  isLoading: boolean
  error: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
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
 * Hook personalizado para manejar paginación de facturas con búsqueda
 * Optimizado para producción con consultas eficientes al backend
 */
export function useInvoicesPagination(initialLimit: number = 20): UseInvoicesPaginationReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([])
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Función para construir la URL con parámetros
  const buildUrl = useCallback((page: number, search: string, status: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: initialLimit.toString()
    })
    
    if (search.trim()) {
      params.set('search', search.trim())
    }
    
    if (status !== 'all') {
      params.set('status', status)
    }
    
    return `/api/invoices?${params.toString()}`
  }, [initialLimit])

  // Función principal para cargar facturas
  const fetchInvoices = useCallback(async (page: number, search: string, status: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = buildUrl(page, search, status)
      console.log(`Cargando facturas: ${url}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Validar estructura de respuesta
      if (!data.invoices || !Array.isArray(data.invoices) || !data.pagination) {
        throw new Error("Formato de respuesta inválido")
      }
      
      console.log(`Facturas cargadas: ${data.invoices.length} de ${data.pagination.total}`)
      
      setInvoices(data.invoices)
      setPagination(data.pagination)
      setCurrentPage(page)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar facturas'
      console.error("Error al cargar facturas:", errorMessage)
      setError(errorMessage)
      setInvoices([])
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
      fetchInvoices(1, searchTerm, statusFilter)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter]) // Solo cuando cambien los filtros

  // Funciones de navegación
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchInvoices(page, searchTerm, statusFilter)
    }
  }, [fetchInvoices, searchTerm, statusFilter, pagination.totalPages])

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
    setStatusFilter('all')
    setCurrentPage(1)
  }, [])

  // Función de recarga
  const refetch = useCallback(() => {
    return fetchInvoices(currentPage, searchTerm, statusFilter)
  }, [fetchInvoices, currentPage, searchTerm, statusFilter])

  return {
    invoices,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
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

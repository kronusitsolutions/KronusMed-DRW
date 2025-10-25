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
  addService: (service: Service) => void
  updateService: (service: Service) => void
  removeService: (serviceId: string) => void
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  clearFilters: () => void
}

/**
 * Hook simplificado para gestión de servicios con actualizaciones instantáneas
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
      console.log(`🔄 Cargando servicios: ${url}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.services || !Array.isArray(data.services) || !data.pagination) {
        throw new Error("Formato de respuesta inválido")
      }
      
      console.log(`✅ Servicios cargados: ${data.services.length} de ${data.pagination.total}`)
      console.log(`📋 Servicios:`, data.services.map(s => s.name))
      
      setServices(data.services)
      setPagination(data.pagination)
      setCurrentPage(page)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar servicios'
      console.error("Error al cargar servicios:", errorMessage)
      setError(errorMessage)
      setServices([])
    } finally {
      setIsLoading(false)
    }
  }, [buildUrl])

  // Carga inicial
  useEffect(() => {
    console.log("🔄 Carga inicial de servicios")
    fetchServices(1, searchTerm, categoryFilter, statusFilter)
  }, []) // Solo al montar

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServices(1, searchTerm, categoryFilter, statusFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, categoryFilter, statusFilter])

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

  // FUNCIONES PARA ACTUALIZACIONES INSTANTÁNEAS
  const addService = useCallback((newService: Service) => {
    console.log("➕ Agregando servicio instantáneamente:", newService.name)
    
    setServices(prevServices => {
      const updated = [newService, ...prevServices]
      console.log(`📊 Total servicios: ${updated.length}`)
      return updated
    })
    
    setPagination(prevPagination => ({
      ...prevPagination,
      total: prevPagination.total + 1
    }))
  }, [])

  const updateService = useCallback((updatedService: Service) => {
    console.log("🔄 Actualizando servicio:", updatedService.name)
    
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === updatedService.id ? updatedService : service
      )
    )
  }, [])

  const removeService = useCallback((serviceId: string) => {
    console.log("🗑️ Eliminando servicio:", serviceId)
    
    setServices(prevServices => {
      const updated = prevServices.filter(service => service.id !== serviceId)
      console.log(`📊 Servicios restantes: ${updated.length}`)
      return updated
    })
    
    setPagination(prevPagination => ({
      ...prevPagination,
      total: Math.max(0, prevPagination.total - 1)
    }))
  }, [])

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
    addService,
    updateService,
    removeService,
    goToPage,
    nextPage,
    prevPage,
    clearFilters
  }
}
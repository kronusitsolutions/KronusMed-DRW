import { useState, useEffect, useCallback } from 'react'

export interface Patient {
  id: string
  patientNumber: string
  name: string
  age?: number | null
  birthDate?: string | null
  gender: string
  phone?: string | null
  address?: string | null
  nationality?: string | null
  cedula?: string | null
  status: string
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

export interface UsePatientsPaginationReturn {
  patients: Patient[]
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
 * Hook personalizado para manejar paginación de pacientes con búsqueda
 * Optimizado para producción con consultas eficientes al backend
 */
export function usePatientsPagination(initialLimit: number = 20): UsePatientsPaginationReturn {
  const [patients, setPatients] = useState<Patient[]>([])
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
    
    return `/api/patients?${params.toString()}`
  }, [initialLimit])

  // Función principal para cargar pacientes
  const fetchPatients = useCallback(async (page: number, search: string, status: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = buildUrl(page, search, status)
      console.log(`Cargando pacientes: ${url}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Validar estructura de respuesta
      if (!data.patients || !Array.isArray(data.patients) || !data.pagination) {
        throw new Error("Formato de respuesta inválido")
      }
      
      console.log(`Pacientes cargados: ${data.patients.length} de ${data.pagination.total}`)
      
      setPatients(data.patients)
      setPagination(data.pagination)
      setCurrentPage(page)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar pacientes'
      console.error("Error al cargar pacientes:", errorMessage)
      setError(errorMessage)
      setPatients([])
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
      fetchPatients(1, searchTerm, statusFilter)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter]) // Solo cuando cambien los filtros

  // Funciones de navegación
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPatients(page, searchTerm, statusFilter)
    }
  }, [fetchPatients, searchTerm, statusFilter, pagination.totalPages])

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
    return fetchPatients(currentPage, searchTerm, statusFilter)
  }, [fetchPatients, currentPage, searchTerm, statusFilter])

  return {
    patients,
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

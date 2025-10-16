import { useState, useMemo, useCallback } from 'react'

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

/**
 * Hook personalizado para búsqueda instantánea de pacientes
 * Optimizado para manejar hasta 2000 registros con búsqueda en tiempo real
 */
export function usePatientSearch(patients: Patient[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Función de búsqueda optimizada con debounce implícito
  const searchPatients = useCallback((patients: Patient[], searchTerm: string) => {
    if (!Array.isArray(patients)) {
      console.warn("searchPatients recibió datos que no son un array:", patients)
      return []
    }

    if (!searchTerm.trim()) {
      return patients
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return patients.filter(patient => {
      // Búsqueda por nombre (palabras parciales)
      const nameMatch = patient.name?.toLowerCase().includes(searchLower) || false
      
      // Búsqueda por teléfono (con y sin espacios/guiones)
      const phoneMatch = patient.phone && (
        patient.phone.includes(searchTerm) ||
        patient.phone.replace(/[\s\-\(\)]/g, '').includes(searchTerm.replace(/[\s\-\(\)]/g, ''))
      )
      
      // Búsqueda por número de paciente
      const patientNumberMatch = patient.patientNumber?.toLowerCase().includes(searchLower) || false
      
      // Búsqueda por dirección
      const addressMatch = patient.address?.toLowerCase().includes(searchLower) || false
      
      // Búsqueda por nacionalidad
      const nationalityMatch = patient.nationality?.toLowerCase().includes(searchLower) || false
      
      // Búsqueda por cédula
      const cedulaMatch = patient.cedula?.toLowerCase().includes(searchLower) || false
      
      return nameMatch || phoneMatch || patientNumberMatch || addressMatch || nationalityMatch || cedulaMatch
    })
  }, [])

  // Filtrar por status
  const filterByStatus = useCallback((patients: Patient[], status: string) => {
    if (status === 'all') return patients
    return patients.filter(patient => patient.status === status)
  }, [])

  // Aplicar filtros combinados con useMemo para optimización
  const filteredPatients = useMemo(() => {
    let result = patients

    // Aplicar filtro de status
    result = filterByStatus(result, statusFilter)

    // Aplicar búsqueda de texto
    result = searchPatients(result, searchTerm)

    return result
  }, [patients, searchTerm, statusFilter, searchPatients, filterByStatus])

  // Estadísticas de búsqueda
  const searchStats = useMemo(() => ({
    total: patients.length,
    filtered: filteredPatients.length,
    hasSearch: searchTerm.trim().length > 0,
    hasStatusFilter: statusFilter !== 'all'
  }), [patients.length, filteredPatients.length, searchTerm, statusFilter])

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('all')
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredPatients,
    searchStats,
    clearSearch
  }
}

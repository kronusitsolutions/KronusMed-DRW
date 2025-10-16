import { useState, useMemo } from 'react'
import { Consultation } from './use-patient-history'

export interface ConsultationFilters {
  searchTerm: string
  dateRange: {
    start: string | null
    end: string | null
  }
  doctorId: string | null
  consultationType: string | null
}

export function useConsultationFilters(consultations: Consultation[]) {
  const [filters, setFilters] = useState<ConsultationFilters>({
    searchTerm: '',
    dateRange: {
      start: null,
      end: null
    },
    doctorId: null,
    consultationType: null
  })

  const filteredConsultations = useMemo(() => {
    return consultations.filter(consultation => {
      // Filtro por término de búsqueda
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesSearch = 
          consultation.reason?.toLowerCase().includes(searchLower) ||
          consultation.diagnosis?.toLowerCase().includes(searchLower) ||
          consultation.notes.toLowerCase().includes(searchLower) ||
          consultation.symptoms?.toLowerCase().includes(searchLower) ||
          consultation.doctor?.name.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Filtro por rango de fechas
      if (filters.dateRange.start || filters.dateRange.end) {
        const consultationDate = new Date(consultation.date)
        
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start)
          if (consultationDate < startDate) return false
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end)
          endDate.setHours(23, 59, 59, 999) // Incluir todo el día
          if (consultationDate > endDate) return false
        }
      }

      // Filtro por doctor
      if (filters.doctorId && consultation.doctorId !== filters.doctorId) {
        return false
      }

      // Filtro por tipo de consulta
      if (filters.consultationType && consultation.type !== filters.consultationType) {
        return false
      }

      return true
    })
  }, [consultations, filters])

  const updateFilter = (key: keyof ConsultationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateRange: {
        start: null,
        end: null
      },
      doctorId: null,
      consultationType: null
    })
  }

  const getFilterStats = () => {
    const total = consultations.length
    const filtered = filteredConsultations.length
    const activeFilters = Object.values(filters).filter(value => {
      if (typeof value === 'string') return value !== ''
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== null && v !== '')
      }
      return value !== null
    }).length

    return {
      total,
      filtered,
      activeFilters
    }
  }

  return {
    filters,
    filteredConsultations,
    updateFilter,
    clearFilters,
    getFilterStats
  }
}

import { useState, useEffect, useCallback } from 'react'
import { Patient } from './use-patient-search'

interface UsePatientsReturn {
  patients: Patient[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  totalCount: number
}

/**
 * Hook personalizado para cargar y manejar todos los pacientes
 * Optimizado para cargar hasta 2000 registros de una vez
 */
export function usePatients(): UsePatientsReturn {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log("Cargando todos los pacientes...")
      const response = await fetch("/api/patients/all")
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Validar que la respuesta sea un array
      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido: se esperaba un array")
      }
      
      console.log(`Pacientes cargados exitosamente: ${data.length}`)
      setPatients(data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar pacientes'
      console.error("Error al cargar pacientes:", errorMessage)
      setError(errorMessage)
      setPatients([]) // Limpiar datos en caso de error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar pacientes al montar el componente
  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  return {
    patients,
    isLoading,
    error,
    refetch: fetchPatients,
    totalCount: patients.length
  }
}

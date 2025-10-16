import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface Patient {
  id: string
  patientNumber: string
  name: string
  age?: number | null
  gender: string
  phone?: string | null
  address?: string | null
  nationality?: string | null
  cedula?: string | null
  status: string
  birthDate?: string | null
  bloodType?: string | null
  allergies?: string | null
  emergencyContact?: string | null
  medicalHistory?: string | null
  insurance?: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface Consultation {
  id: string
  patientId: string
  doctorId: string
  date: string
  type: string
  notes: string
  duration: string
  treatment?: string | null
  nextAppointment?: string | null
  reason?: string | null
  diagnosis?: string | null
  symptoms?: string | null
  vitalSigns?: {
    bloodPressure?: string
    temperature?: string
    heartRate?: string
    weight?: string
    height?: string
  } | null
  prescriptions?: Array<{
    medication: string
    dosage: string
    frequency: string
    duration?: string
  }> | null
  followUpDate?: string | null
  doctor?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface HistoryStats {
  totalConsultations: number
  firstConsultation: string | null
  lastConsultation: string | null
  consultationTypes: {
    PRIMERA_CONSULTA: number
    SEGUIMIENTO: number
    CONTROL: number
    URGENCIA: number
  }
}

export interface PatientHistory {
  patient: Patient
  consultations: Consultation[]
  stats: HistoryStats
}

export function usePatientHistory(patientId: string) {
  const { data: session } = useSession()
  const [data, setData] = useState<PatientHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    if (!patientId || !session) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${patientId}/history`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar historial')
      }

      const historyData = await response.json()
      setData(historyData)
    } catch (err) {
      console.error('Error fetching patient history:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const addConsultation = async (consultationData: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt' | 'doctor'>) => {
    try {
      const response = await fetch('/api/medical-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consultationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear consulta')
      }

      // Recargar el historial después de agregar
      await fetchHistory()
      return true
    } catch (err) {
      console.error('Error adding consultation:', err)
      setError(err instanceof Error ? err.message : 'Error al crear consulta')
      return false
    }
  }

  const updateConsultation = async (consultationId: string, consultationData: Partial<Consultation>) => {
    try {
      const response = await fetch(`/api/medical-notes/${consultationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consultationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar consulta')
      }

      // Recargar el historial después de actualizar
      await fetchHistory()
      return true
    } catch (err) {
      console.error('Error updating consultation:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar consulta')
      return false
    }
  }

  const deleteConsultation = async (consultationId: string) => {
    try {
      const response = await fetch(`/api/medical-notes/${consultationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar consulta')
      }

      // Recargar el historial después de eliminar
      await fetchHistory()
      return true
    } catch (err) {
      console.error('Error deleting consultation:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar consulta')
      return false
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [patientId, session])

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory,
    addConsultation,
    updateConsultation,
    deleteConsultation
  }
}

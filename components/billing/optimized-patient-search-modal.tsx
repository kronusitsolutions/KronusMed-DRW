"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, X, User, Phone, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { OptimizedSearch } from '@/components/patients/optimized-search'

interface Patient {
  id: string
  patientNumber: string
  name: string
  age: number
  gender: string
  phone?: string | null
  address?: string | null
  nationality?: string | null
  cedula?: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface OptimizedPatientSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPatient: (patient: Patient) => void
  selectedPatientId?: string
  className?: string
}

/**
 * Modal optimizado para búsqueda de pacientes en crear factura
 * Con paginación del servidor y búsqueda instantánea
 */
export function OptimizedPatientSearchModal({
  isOpen,
  onClose,
  onSelectPatient,
  selectedPatientId,
  className = ""
}: OptimizedPatientSearchModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Cargar pacientes con búsqueda
  const fetchPatients = async (search: string = '') => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: '50' // Límite para búsqueda
      })
      
      if (search.trim()) {
        params.set('search', search.trim())
      }
      
      const response = await fetch(`/api/patients?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Manejar tanto formato paginado como formato simple
      const patientsData = data.patients || data
      
      if (!Array.isArray(patientsData)) {
        throw new Error("Formato de respuesta inválido")
      }
      
      setPatients(patientsData)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar pacientes'
      console.error("Error al cargar pacientes:", errorMessage)
      setError(errorMessage)
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar pacientes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchPatients(searchTerm)
    }
  }, [isOpen])

  // Búsqueda con debounce
  useEffect(() => {
    if (!isOpen) return

    const timeoutId = setTimeout(() => {
      fetchPatients(searchTerm)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, isOpen])

  // Seleccionar paciente
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    onSelectPatient(patient)
    onClose()
  }

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
    setSelectedPatient(null)
  }

  // Renderizar elemento de paciente
  const renderPatientItem = (patient: Patient) => (
    <Card 
      key={patient.id} 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        selectedPatientId === patient.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleSelectPatient(patient)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-gray-900 truncate">
                  {patient.name}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {patient.patientNumber}
              </Badge>
              <Badge 
                variant={patient.status === 'ACTIVE' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {patient.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{patient.age} años</span>
              </div>
              
              {patient.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span className="truncate max-w-32">{patient.phone}</span>
                </div>
              )}
              
              {patient.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-32">{patient.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <Card className={`w-full max-w-2xl max-h-[80vh] overflow-hidden ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Seleccionar Paciente</CardTitle>
            <CardDescription>
              Busca y selecciona un paciente para crear la factura
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Búsqueda */}
          <OptimizedSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre, teléfono, cédula, número de paciente..."
            isLoading={isLoading}
            className="w-full"
          />

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPatients(searchTerm)}
                  className="ml-2"
                >
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm text-muted-foreground">Buscando pacientes...</p>
              </div>
            </div>
          )}

          {/* Lista de Pacientes */}
          {!isLoading && !error && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {patients.length > 0 ? (
                patients.map(renderPatientItem)
              ) : (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <User className="h-12 w-12 text-muted-foreground/50" />
                    <div className="text-lg font-medium text-muted-foreground">
                      No se encontraron pacientes
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {searchTerm
                        ? 'Intenta ajustar los términos de búsqueda'
                        : 'No hay pacientes registrados'
                      }
                    </div>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearSearch}
                        className="mt-2"
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información de búsqueda */}
          {!isLoading && !error && patients.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              {searchTerm ? (
                <span>
                  {patients.length} resultado{patients.length !== 1 ? 's' : ''} encontrado{patients.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>Mostrando {patients.length} pacientes</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

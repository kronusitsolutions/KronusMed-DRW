"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, Eye, Edit, Trash2, Calendar, Phone, MapPin, User, FileText } from 'lucide-react'
import { Patient } from '@/hooks/use-patient-search'
import { getDisplayAge, formatAge } from '@/lib/age-utils'
import { usePatientSearch } from '@/hooks/use-patient-search'

interface VirtualizedPatientListProps {
  patients: Patient[]
  onViewPatient?: (patient: Patient) => void
  onEditPatient?: (patient: Patient) => void
  onDeletePatient?: (patient: Patient) => void
  onViewMedicalNotes?: (patient: Patient) => void
  height?: number
  itemHeight?: number
  className?: string
}

/**
 * Componente de lista virtualizada personalizada para pacientes
 * Renderiza solo los elementos visibles para optimizar el rendimiento
 */
export function VirtualizedPatientList({
  patients,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
  onViewMedicalNotes,
  height = 600,
  itemHeight = 80,
  className = ""
}: VirtualizedPatientListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(height)

  // Hook de búsqueda personalizado
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredPatients,
    searchStats,
    clearSearch
  } = usePatientSearch(patients)

  // Calcular elementos visibles
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      filteredPatients.length
    )
    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, itemHeight, filteredPatients.length])

  // Elementos visibles para renderizar
  const visiblePatients = useMemo(() => {
    return filteredPatients.slice(visibleRange.startIndex, visibleRange.endIndex)
  }, [filteredPatients, visibleRange])

  // Altura total del contenido virtualizado
  const totalHeight = filteredPatients.length * itemHeight

  // Manejar scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Actualizar altura del contenedor
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Renderizar elemento individual de paciente
  const renderPatientItem = (patient: Patient, index: number) => {
    const actualIndex = visibleRange.startIndex + index
    const top = actualIndex * itemHeight

    return (
      <div
        key={patient.id}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: itemHeight,
          transform: `translateY(${top}px)`
        }}
      >
        <Card className="h-full mx-2 mb-2 hover:shadow-md transition-shadow">
          <CardContent className="p-4 h-full flex items-center justify-between">
            {/* Información del paciente */}
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
                  <span>{formatAge(getDisplayAge(patient.age || 0, patient.birthDate))}</span>
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

            {/* Acciones */}
            <div className="flex items-center gap-2 ml-4">
              {onViewMedicalNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewMedicalNotes(patient)}
                  className="h-8 w-8 p-0"
                  title="Ver notas médicas"
                >
                  <FileText className="h-3 w-3" />
                </Button>
              )}
              
              {onViewPatient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewPatient(patient)}
                  className="h-8 w-8 p-0"
                  title="Ver detalles"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
              
              {onEditPatient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditPatient(patient)}
                  className="h-8 w-8 p-0"
                  title="Editar"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              
              {onDeletePatient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeletePatient(patient)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda y filtros */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono, cédula, nacionalidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="INACTIVE">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          {(searchStats.hasSearch || searchStats.hasStatusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0"
              title="Limpiar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Estadísticas de búsqueda */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {searchStats.hasSearch || searchStats.hasStatusFilter ? (
              <span>
                Mostrando {searchStats.filtered} de {searchStats.total} pacientes
              </span>
            ) : (
              <span>{searchStats.total} pacientes en total</span>
            )}
          </div>
          
          {searchStats.hasSearch && (
            <div className="flex items-center gap-2">
              <span>Búsqueda: "{searchTerm}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista virtualizada */}
      <div
        ref={containerRef}
        className="relative overflow-auto border rounded-lg"
        style={{ height: `${height}px` }}
        onScroll={handleScroll}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {visiblePatients.map((patient, index) => 
            renderPatientItem(patient, index)
          )}
        </div>
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-2">
            <User className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-lg font-medium text-muted-foreground">
              No se encontraron pacientes
            </div>
            <div className="text-sm text-muted-foreground">
              {searchStats.hasSearch || searchStats.hasStatusFilter
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay pacientes registrados'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

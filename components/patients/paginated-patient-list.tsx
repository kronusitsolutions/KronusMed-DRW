"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, X, Eye, Edit, Trash2, Calendar, Phone, MapPin, User, FileText, Loader2, AlertCircle } from 'lucide-react'
import { OptimizedSearch } from './optimized-search'
import { Patient, PaginationInfo } from '@/hooks/use-patients-pagination'
import { getDisplayAge, formatAge } from '@/lib/age-utils'
import { PaginationControls } from './pagination-controls'

interface PaginatedPatientListProps {
  patients: Patient[]
  pagination: PaginationInfo
  isLoading: boolean
  error: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  onViewPatient?: (patient: Patient) => void
  onEditPatient?: (patient: Patient) => void
  onDeletePatient?: (patient: Patient) => void
  onViewMedicalNotes?: (patient: Patient) => void
  onRefetch?: () => void
  className?: string
}

/**
 * Componente de lista de pacientes con paginación del servidor
 * Optimizado para producción con consultas eficientes
 */
export function PaginatedPatientList({
  patients,
  pagination,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onPageChange,
  onLimitChange,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
  onViewMedicalNotes,
  onRefetch,
  className = ""
}: PaginatedPatientListProps) {
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Handlers para acciones
  const handleAction = async (action: () => Promise<void> | void) => {
    try {
      setIsActionLoading(true)
      await action()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async (patient: Patient) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${patient.name}?`)) {
      return
    }

    await handleAction(async () => {
      if (onDeletePatient) {
        await onDeletePatient(patient)
      }
    })
  }

  // Renderizar elemento individual de paciente
  const renderPatientItem = (patient: Patient) => (
    <Card key={patient.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
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
                disabled={isActionLoading}
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
                disabled={isActionLoading}
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
                disabled={isActionLoading}
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
                onClick={() => handleDelete(patient)}
                disabled={isActionLoading}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda y filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            Búsqueda y filtrado optimizado con paginación del servidor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <OptimizedSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre, teléfono, cédula, nacionalidad..."
                isLoading={isLoading}
                className="flex-1 max-w-md h-10"
              />
              
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
                disabled={isLoading}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="INACTIVE">Inactivos</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                  title="Limpiar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {onRefetch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefetch}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Recargar
                </Button>
              )}
            </div>

            {/* Estadísticas de búsqueda */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Buscando...</span>
                  </div>
                ) : (
                  <>
                    {searchTerm || statusFilter !== 'all' ? (
                      <span>
                        {pagination.total} resultado{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span>{pagination.total} pacientes en total</span>
                    )}
                    {pagination.totalPages > 1 && (
                      <span className="text-muted-foreground/60">
                        • Página {pagination.page} de {pagination.totalPages}
                      </span>
                    )}
                  </>
                )}
              </div>
              
              {searchTerm && !isLoading && (
                <div className="flex items-center gap-2">
                  <span>Búsqueda: "{searchTerm}"</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {onRefetch && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefetch}
                className="ml-2"
              >
                Reintentar
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando pacientes...</p>
          </div>
        </div>
      )}

      {/* Lista de Pacientes */}
      {!isLoading && !error && (
        <>
          <div className="space-y-2">
            {patients.length > 0 ? (
              patients.map(renderPatientItem)
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-2">
                  <User className="h-12 w-12 text-muted-foreground/50" />
                  <div className="text-lg font-medium text-muted-foreground">
                    No se encontraron pacientes
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'No hay pacientes registrados'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controles de Paginación */}
          {pagination.totalPages > 1 && (
            <PaginationControls
              pagination={pagination}
              isLoading={isLoading}
              onPageChange={onPageChange}
              onLimitChange={onLimitChange}
              showLimitSelector={!!onLimitChange}
              showPageInput={true}
            />
          )}
        </>
      )}
    </div>
  )
}

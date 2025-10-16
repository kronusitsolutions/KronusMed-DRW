"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Search, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  DollarSign,
  Tag,
  Calendar,
  Activity
} from "lucide-react"
import { Service } from "@/hooks/use-services-pagination"

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  nextPage: number | null
  prevPage: number | null
}

interface PaginatedServiceListProps {
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
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onEditService: (service: Service) => void
  onDeleteService: (service: Service) => void
  onRefetch: () => Promise<void>
  className?: string
}

export function PaginatedServiceList({
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
  onPageChange,
  onLimitChange,
  onEditService,
  onDeleteService,
  onRefetch,
  className = ""
}: PaginatedServiceListProps) {
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)

  const handleDelete = async (service: Service) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`)) {
      setIsActionLoading(service.id)
      try {
        await onDeleteService(service)
        await onRefetch()
      } finally {
        setIsActionLoading(null)
      }
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800 hover:bg-green-200" 
      : "bg-red-100 text-red-800 hover:bg-red-200"
  }

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Activo" : "Inactivo"
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderServiceItem = (service: Service) => (
    <Card key={service.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg truncate">{service.name}</h3>
              <Badge className={getStatusColor(service.isActive)}>
                {getStatusText(service.isActive)}
              </Badge>
            </div>
            
            {service.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {service.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{formatPrice(service.price)}</span>
              </div>
              
              {service.category && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>{service.category}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Creado: {formatDate(service.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditService(service)}
              disabled={isActionLoading === service.id}
              className="h-8 w-8 p-0"
              title="Editar servicio"
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(service)}
              disabled={isActionLoading === service.id}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="Eliminar servicio"
            >
              {isActionLoading === service.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar servicios por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="consulta">Consulta</SelectItem>
            <SelectItem value="procedimiento">Procedimiento</SelectItem>
            <SelectItem value="laboratorio">Laboratorio</SelectItem>
            <SelectItem value="imagenes">Imágenes</SelectItem>
            <SelectItem value="medicina">Medicina</SelectItem>
            <SelectItem value="otros">Otros</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Cargando servicios...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Activity className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Error al cargar servicios</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={onRefetch} variant="outline">
            Reintentar
          </Button>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4" />
            <p className="font-medium">No se encontraron servicios</p>
            <p className="text-sm">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay servicios registrados en el sistema'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(renderServiceItem)}
        </div>
      )}

      {/* Paginación */}
      {!isLoading && !error && services.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} servicios
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="px-3 py-1 text-sm">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

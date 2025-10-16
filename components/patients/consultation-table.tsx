"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Grid3X3,
  List
} from "lucide-react"
import { Consultation } from "@/hooks/use-patient-history"
import { useConsultationFilters } from "@/hooks/use-consultation-filters"
import { ConsultationMobileCard } from "./consultation-mobile-card"
import { useIsMobile } from "@/hooks/use-mobile"

interface ConsultationTableProps {
  consultations: Consultation[]
  onViewConsultation: (consultation: Consultation) => void
  onEditConsultation: (consultation: Consultation) => void
  onDeleteConsultation: (consultation: Consultation) => void
  onExportPDF: (consultationIds?: string[]) => void
  isLoading?: boolean
  doctors?: Array<{ id: string; name: string }>
}

export function ConsultationTable({
  consultations,
  onViewConsultation,
  onEditConsultation,
  onDeleteConsultation,
  onExportPDF,
  isLoading = false,
  doctors = []
}: ConsultationTableProps) {
  const [selectedConsultations, setSelectedConsultations] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const isMobile = useIsMobile()
  
  const {
    filters,
    filteredConsultations,
    updateFilter,
    clearFilters,
    getFilterStats
  } = useConsultationFilters(consultations)

  const stats = getFilterStats()

  const getConsultationTypeLabel = (type: string) => {
    switch (type) {
      case 'PRIMERA_CONSULTA': return 'Primera Consulta'
      case 'SEGUIMIENTO': return 'Seguimiento'
      case 'CONTROL': return 'Control'
      case 'URGENCIA': return 'Urgencia'
      default: return type
    }
  }

  const getConsultationTypeVariant = (type: string) => {
    switch (type) {
      case 'PRIMERA_CONSULTA': return 'default'
      case 'SEGUIMIENTO': return 'secondary'
      case 'CONTROL': return 'outline'
      case 'URGENCIA': return 'destructive'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSelectConsultation = (consultationId: string) => {
    setSelectedConsultations(prev => 
      prev.includes(consultationId)
        ? prev.filter(id => id !== consultationId)
        : [...prev, consultationId]
    )
  }

  const handleSelectAll = () => {
    if (selectedConsultations.length === filteredConsultations.length) {
      setSelectedConsultations([])
    } else {
      setSelectedConsultations(filteredConsultations.map(c => c.id))
    }
  }

  const handleExportSelected = () => {
    onExportPDF(selectedConsultations)
    setSelectedConsultations([])
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando consultas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Consultas
            <Badge variant="outline" className="ml-2">
              {stats.filtered} de {stats.total}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Toggle de vista para móviles */}
            {isMobile && (
              <div className="flex items-center border rounded-lg">
                <Button
                  onClick={() => setViewMode('table')}
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('cards')}
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {selectedConsultations.length > 0 && (
              <Button
                onClick={handleExportSelected}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar Seleccionadas</span>
                <span className="sm:hidden">({selectedConsultations.length})</span>
              </Button>
            )}
            <Button
              onClick={() => onExportPDF()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Todo</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por motivo, diagnóstico, síntomas..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por tipo */}
            <Select
              value={filters.consultationType || 'all'}
              onValueChange={(value) => updateFilter('consultationType', value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tipo de consulta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="PRIMERA_CONSULTA">Primera Consulta</SelectItem>
                <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                <SelectItem value="CONTROL">Control</SelectItem>
                <SelectItem value="URGENCIA">Urgencia</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por doctor */}
            <Select
              value={filters.doctorId || 'all'}
              onValueChange={(value) => updateFilter('doctorId', value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Médico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los médicos</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros de fecha */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Fecha desde
              </label>
              <Input
                type="date"
                value={filters.dateRange.start || ''}
                onChange={(e) => updateFilter('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value || null
                })}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Fecha hasta
              </label>
              <Input
                type="date"
                value={filters.dateRange.end || ''}
                onChange={(e) => updateFilter('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value || null
                })}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla de consultas */}
        {filteredConsultations.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay consultas médicas
            </h3>
            <p className="text-gray-500">
              {stats.activeFilters > 0 
                ? 'No se encontraron consultas con los filtros aplicados.'
                : 'Este paciente no tiene consultas médicas registradas.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Vista de tabla (desktop) */}
            {(!isMobile || viewMode === 'table') && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedConsultations.length === filteredConsultations.length && filteredConsultations.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                          aria-label="Seleccionar todas las consultas"
                        />
                      </TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsultations.map((consultation) => (
                      <TableRow key={consultation.id} className="hover:bg-gray-50">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedConsultations.includes(consultation.id)}
                            onChange={() => handleSelectConsultation(consultation.id)}
                            className="rounded border-gray-300"
                            aria-label={`Seleccionar consulta del ${formatDate(consultation.date)}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatDate(consultation.date)}</div>
                            <div className="text-sm text-gray-500">{formatTime(consultation.date)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="truncate">
                              {consultation.reason || 'No especificado'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="truncate">
                              {consultation.diagnosis || 'No especificado'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {consultation.doctor?.name || 'Desconocido'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getConsultationTypeVariant(consultation.type)}>
                            {getConsultationTypeLabel(consultation.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => onViewConsultation(consultation)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              aria-label={`Ver detalles de consulta del ${formatDate(consultation.date)}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => onEditConsultation(consultation)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              aria-label={`Editar consulta del ${formatDate(consultation.date)}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => onDeleteConsultation(consultation)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              aria-label={`Eliminar consulta del ${formatDate(consultation.date)}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Vista de tarjetas (móvil) */}
            {isMobile && viewMode === 'cards' && (
              <div className="space-y-4">
                {filteredConsultations.map((consultation) => (
                  <ConsultationMobileCard
                    key={consultation.id}
                    consultation={consultation}
                    onView={onViewConsultation}
                    onEdit={onEditConsultation}
                    onDelete={onDeleteConsultation}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Download, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Column {
  key: string
  label: string
  sortable?: boolean
  format?: 'text' | 'currency' | 'percentage' | 'number' | 'date'
  width?: string
}

interface DataTableProps {
  title: string
  description?: string
  columns: Column[]
  data: Record<string, any>[]
  searchable?: boolean
  exportable?: boolean
  sortable?: boolean
  filterable?: boolean
  className?: string
  onRowClick?: (row: Record<string, any>) => void
  actions?: Array<{
    label: string
    onClick: (row: Record<string, any>) => void
    icon?: React.ReactNode
  }>
}

export function DataTable({
  title,
  description,
  columns,
  data,
  searchable = true,
  exportable = true,
  sortable = true,
  filterable = false,
  className,
  onRowClick,
  actions
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Filtrar datos
  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Ordenar datos
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (aValue === bValue) return 0
    
    const comparison = aValue < bValue ? -1 : 1
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Paginación
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (columnKey: string) => {
    if (!sortable) return
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-'
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Number(value))
      case 'percentage':
        return `${Number(value).toFixed(1)}%`
      case 'number':
        return new Intl.NumberFormat('es-ES').format(Number(value))
      case 'date':
        return new Date(value).toLocaleDateString('es-ES')
      default:
        return String(value)
    }
  }

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(',')
    const rows = sortedData.map(row =>
      columns.map(col => `"${row[col.key] || ''}"`).join(',')
    )
    
    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card className={cn("bg-white", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="text-gray-600 hover:text-gray-900"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
        
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "font-semibold text-gray-700",
                      sortable && column.sortable !== false && "cursor-pointer hover:bg-gray-100",
                      column.width && `w-${column.width}`
                    )}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortable && column.sortable !== false && (
                        <div className="flex flex-col">
                          <ChevronUp 
                            className={cn(
                              "h-3 w-3",
                              sortColumn === column.key && sortDirection === 'asc' 
                                ? "text-blue-600" 
                                : "text-gray-400"
                            )}
                          />
                          <ChevronDown 
                            className={cn(
                              "h-3 w-3 -mt-1",
                              sortColumn === column.key && sortDirection === 'desc' 
                                ? "text-blue-600" 
                                : "text-gray-400"
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="w-12"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className="text-sm text-gray-900"
                    >
                      {formatValue(row[column.key], column.format)}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick(row)
                              }}
                            >
                              {action.icon && (
                                <span className="mr-2">{action.icon}</span>
                              )}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, sortedData.length)} de {sortedData.length} resultados
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente especializado para tablas financieras
export function FinancialDataTable({
  title,
  description,
  data,
  className
}: {
  title: string
  description?: string
  data: Record<string, any>[]
  className?: string
}) {
  const columns: Column[] = [
    { key: 'name', label: 'Concepto', sortable: true },
    { key: 'amount', label: 'Monto', sortable: true, format: 'currency' },
    { key: 'percentage', label: 'Participación', sortable: true, format: 'percentage' },
    { key: 'trend', label: 'Tendencia', sortable: true }
  ]

  return (
    <DataTable
      title={title}
      description={description}
      columns={columns}
      data={data}
      className={className}
    />
  )
}

// Componente especializado para tablas de pacientes
export function PatientDataTable({
  title,
  description,
  data,
  className
}: {
  title: string
  description?: string
  data: Record<string, any>[]
  className?: string
}) {
  const columns: Column[] = [
    { key: 'name', label: 'Paciente', sortable: true },
    { key: 'age', label: 'Edad', sortable: true, format: 'number' },
    { key: 'gender', label: 'Género', sortable: true },
    { key: 'appointments', label: 'Citas', sortable: true, format: 'number' },
    { key: 'revenue', label: 'Ingresos', sortable: true, format: 'currency' }
  ]

  return (
    <DataTable
      title={title}
      description={description}
      columns={columns}
      data={data}
      className={className}
    />
  )
}

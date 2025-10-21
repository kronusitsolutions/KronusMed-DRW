"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, X, Eye, Edit, Trash2, Calendar, Phone, MapPin, User, FileText, Loader2, AlertCircle, DollarSign, Printer, CreditCard, ChevronDown, Receipt } from 'lucide-react'
import { OptimizedSearch } from '@/components/patients/optimized-search'
import { PaginationControls } from '@/components/patients/pagination-controls'
import { Invoice } from '@/types/invoice'
import { PaginationInfo } from '@/hooks/use-invoices-pagination'

interface PaginatedInvoiceListProps {
  invoices: Invoice[]
  pagination: PaginationInfo
  isLoading: boolean
  error: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  onViewInvoice?: (invoice: Invoice) => void
  onEditInvoice?: (invoice: Invoice) => void
  onDeleteInvoice?: (invoice: Invoice) => void
  onPrintInvoice?: (invoice: Invoice) => void
  onRegisterPayment?: (invoice: Invoice) => void
  onPrintPaymentReceipt?: (invoiceId: string, paymentId: string) => void
  onRefetch?: () => void
  className?: string
}

/**
 * Componente de lista de facturas con paginación del servidor
 * Optimizado para producción con consultas eficientes
 */
export function PaginatedInvoiceList({
  invoices,
  pagination,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onPageChange,
  onLimitChange,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onPrintInvoice,
  onRegisterPayment,
  onPrintPaymentReceipt,
  onRefetch,
  className = ""
}: PaginatedInvoiceListProps) {
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

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la factura ${invoice.invoiceNumber}?`)) {
      return
    }

    await handleAction(async () => {
      if (onDeleteInvoice) {
        await onDeleteInvoice(invoice)
      }
    })
  }

  // Renderizar elemento individual de factura
  const renderInvoiceItem = (invoice: Invoice) => (
    <Card key={invoice.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Información de la factura */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-gray-900 truncate">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <Badge 
                variant={
                  invoice.status === 'PAID' ? 'default' : 
                  invoice.status === 'PENDING' ? 'secondary' : 
                  invoice.status === 'PARTIAL' ? 'outline' :
                  'destructive'
                }
                className="text-xs"
              >
                {invoice.status === 'PAID' ? 'Pagada' : 
                 invoice.status === 'PENDING' ? 'Pendiente' : 
                 invoice.status === 'PARTIAL' ? 'Parcial' :
                 invoice.status === 'CANCELLED' ? 'Cancelada' : invoice.status}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              {invoice.patient && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{invoice.patient.name}</span>
                  {invoice.patient.patientNumber && (
                    <span className="text-muted-foreground">({invoice.patient.patientNumber})</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">${invoice.totalAmount.toFixed(2)}</span>
                </div>
                
                {/* Mostrar montos pendientes si aplica */}
                {invoice.status === 'PARTIAL' && (
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-600">Pagado:</span>
                      <span className="font-medium text-green-600">${(invoice.paidAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-600">⏳</span>
                      <span className="text-gray-600">Pendiente:</span>
                      <span className="font-medium text-orange-600">${(invoice.pendingAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {invoice.status === 'PENDING' && (
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className="text-orange-600">⏳</span>
                    <span className="text-gray-600">Pendiente:</span>
                    <span className="font-medium text-orange-600">${(invoice.pendingAmount || invoice.totalAmount).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 ml-4">
            {onViewInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewInvoice(invoice)}
                disabled={isActionLoading}
                className="h-8 w-8 p-0"
                title="Ver factura"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            
            {onPrintInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintInvoice(invoice)}
                disabled={isActionLoading}
                className="h-8 w-8 p-0"
                title="Imprimir factura"
              >
                <Printer className="h-3 w-3" />
              </Button>
            )}
            
            {/* Botón para registrar pago - solo para facturas pendientes o parciales */}
            {onRegisterPayment && (invoice.status === 'PENDING' || invoice.status === 'PARTIAL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRegisterPayment(invoice)}
                disabled={isActionLoading}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                title="Registrar pago"
              >
                <CreditCard className="h-3 w-3" />
              </Button>
            )}
            
            {/* Botón para ver pagos - solo para facturas parciales */}
            {onPrintPaymentReceipt && invoice.status === 'PARTIAL' && invoice.payments && invoice.payments.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isActionLoading}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    title="Ver pagos"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2">
                    <div className="text-sm font-medium mb-2">Pagos Realizados</div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {invoice.payments.map((payment, index) => (
                        <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium">
                              Pago #{index + 1}
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(payment.paidAt).toLocaleDateString('es-ES')} - ${payment.amount.toFixed(2)}
                            </div>
                            {payment.paymentMethod && (
                              <div className="text-xs text-gray-500">
                                {payment.paymentMethod}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPrintPaymentReceipt(invoice.id, payment.id)}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                            title="Imprimir recibo"
                          >
                            <Receipt className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {onEditInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditInvoice(invoice)}
                disabled={isActionLoading}
                className="h-8 w-8 p-0"
                title="Editar factura"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            
            {onDeleteInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(invoice)}
                disabled={isActionLoading}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Eliminar factura"
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
          <CardTitle>Lista de Facturas</CardTitle>
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
                placeholder="Buscar por número de factura, paciente, monto..."
                isLoading={isLoading}
                className="flex-1 max-w-md"
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
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="PAID">Pagadas</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="PARTIAL">Parciales</SelectItem>
                  <SelectItem value="CANCELLED">Canceladas</SelectItem>
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
                      <span>{pagination.total} facturas en total</span>
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
            <p className="text-sm text-muted-foreground">Cargando facturas...</p>
          </div>
        </div>
      )}

      {/* Lista de Facturas */}
      {!isLoading && !error && (
        <>
          <div className="space-y-2">
            {invoices.length > 0 ? (
              invoices.map(renderInvoiceItem)
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <div className="text-lg font-medium text-muted-foreground">
                    No se encontraron facturas
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'No hay facturas registradas'
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

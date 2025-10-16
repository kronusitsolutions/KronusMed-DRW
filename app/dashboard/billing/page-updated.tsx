"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Icons
import { 
  Plus, 
  Printer, 
  Eye, 
  DollarSign, 
  FileText, 
  Calendar, 
  Loader2, 
  Trash2, 
  Gift, 
  Search, 
  X,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react'

// Custom Components
import { PaginatedInvoiceList } from '@/components/billing/paginated-invoice-list'
import { OptimizedPatientSearchModal } from '@/components/billing/optimized-patient-search-modal'
import { PatientInsuranceSelector } from '@/components/billing/patient-insurance-selector'
import { useInvoicesPagination } from '@/hooks/use-invoices-pagination'
import { Invoice } from '@/types/invoice'
import { toast } from "sonner"

// Types
interface Service {
  id: string
  name: string
  price: number
  category?: string
  description?: string
  isActive?: boolean
  uniqueId?: number
}

interface Patient {
  id: string
  name: string
  phone?: string | null
  nationality?: string | null
  cedula?: string | null
  patientNumber?: string
  insurance?: {
    name: string
  }
}

export default function BillingPageUpdated() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Hook de paginación para facturas
  const {
    invoices,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    goToPage,
    refetch
  } = useInvoicesPagination(20)

  // Estados para crear factura
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedPatientInsurance, setSelectedPatientInsurance] = useState<string | null>(null)
  const [insuranceCalculation, setInsuranceCalculation] = useState<any>(null)

  // Estados para servicios
  const [services, setServices] = useState<Service[]>([])
  const [serviceSearch, setServiceSearch] = useState("")
  const [isLoadingServices, setIsLoadingServices] = useState(false)

  // Estados de carga
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingInvoice, setIsDeletingInvoice] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
  }, [status, router])

  // Cargar servicios
  const fetchServices = async () => {
    try {
      setIsLoadingServices(true)
      const response = await fetch("/api/services?limit=250")
      if (response.ok) {
        const data = await response.json()
        const servicesData = data.services || data
        const activeServices = servicesData.filter((service: Service) => service.isActive)
        setServices(activeServices)
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error)
    } finally {
      setIsLoadingServices(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchServices()
    }
  }, [session])

  // Filtrar servicios
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services
    return services.filter(service => 
      service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      service.category?.toLowerCase().includes(serviceSearch.toLowerCase())
    )
  }, [services, serviceSearch])

  // Handlers para facturas
  const handleViewInvoice = (invoice: Invoice) => {
    toast.info(`Viendo factura ${invoice.invoiceNumber}`)
    // Implementar lógica de visualización
  }

  const handleEditInvoice = (invoice: Invoice) => {
    toast.info(`Editando factura ${invoice.invoiceNumber}`)
    // Implementar lógica de edición
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      setIsDeletingInvoice(invoice.id)
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success("Factura eliminada exitosamente")
        await refetch()
      } else {
        toast.error("Error al eliminar factura")
      }
    } catch (error) {
      toast.error("Error al eliminar factura")
    } finally {
      setIsDeletingInvoice(null)
    }
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    toast.info(`Imprimiendo factura ${invoice.invoiceNumber}`)
    // Implementar lógica de impresión
  }

  // Handlers para crear factura
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setSelectedPatientInsurance(null)
    setInsuranceCalculation(null)
  }

  const addService = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName)
    if (service) {
      const newService = {
        ...service,
        uniqueId: Date.now()
      }
      setSelectedServices(prev => [...prev, newService])
    }
  }

  const removeService = (uniqueId: number) => {
    setSelectedServices(prev => prev.filter(s => s.uniqueId !== uniqueId))
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0)
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient) {
      toast.error("Debes seleccionar un paciente")
      return
    }

    if (selectedServices.length === 0) {
      toast.error("Debes seleccionar al menos un servicio")
      return
    }

    try {
      setIsSubmitting(true)
      
      const invoiceData = {
        patientId: selectedPatient.id,
        services: selectedServices.map(s => ({
          serviceId: s.id,
          quantity: 1,
          unitPrice: s.price,
          totalPrice: s.price
        })),
        totalAmount: calculateTotal(),
        status: "PENDING"
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        toast.success("Factura creada exitosamente")
        setIsCreateDialogOpen(false)
        setSelectedPatient(null)
        setSelectedServices([])
        setSelectedPatientInsurance(null)
        setInsuranceCalculation(null)
        await refetch()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al crear la factura")
      }
    } catch (error) {
      toast.error("Error al crear la factura")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona las facturas con búsqueda y paginación optimizada
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Factura</DialogTitle>
              <DialogDescription>
                Genera una nueva factura para servicios del paciente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice}>
              <div className="space-y-4 pt-4">
                {/* Selección de Paciente */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">Paciente</Label>
                  <div className="col-span-3 space-y-3">
                    {selectedPatient ? (
                      <Card className="p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm text-blue-900">Paciente seleccionado:</h4>
                            <div className="text-sm text-blue-700">
                              {selectedPatient.name} ({selectedPatient.patientNumber})
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPatient(null)}
                            className="h-6 w-6 p-0 text-blue-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPatientSearchOpen(true)}
                        className="w-full justify-start"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Buscar y seleccionar paciente
                      </Button>
                    )}
                  </div>
                </div>

                {/* Selección de Servicios */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">Servicios</Label>
                  <div className="col-span-3 space-y-3">
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar servicios..."
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="pl-10 pr-4"
                        />
                      </div>
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                          <div 
                            key={service.id} 
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                            onClick={() => addService(service.name)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900 truncate">{service.name}</span>
                                <div className="text-xs text-gray-400 mt-1">ID: {service.id}</div>
                              </div>
                              <div className="text-right ml-3">
                                <span className="text-blue-600 font-semibold text-sm">
                                  ${service.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <FileText className="h-6 w-6 text-muted-foreground/50" />
                            <div className="text-sm font-medium">No hay servicios disponibles</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {selectedServices.length > 0 && (
                      <div className="border rounded-lg p-3 space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Servicios seleccionados:</h4>
                        {selectedServices.map((service) => (
                          <div key={service.uniqueId} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <div>
                              <span className="font-medium">{service.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-blue-600">${service.price.toFixed(2)}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeService(service.uniqueId!)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Quitar
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selector de Seguro Médico */}
                {selectedPatient && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <div className="text-right pt-2">
                      <Label>Seguro Médico</Label>
                    </div>
                    <div className="col-span-3 space-y-3">
                      <PatientInsuranceSelector
                        patientId={selectedPatient.id}
                        currentInsuranceId={selectedPatientInsurance || undefined}
                        onInsuranceChange={setSelectedPatientInsurance}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !selectedPatient || selectedServices.length === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Factura"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Página Actual</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pagination.page}</div>
            <p className="text-xs text-muted-foreground">
              de {pagination.totalPages} páginas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mostrando</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              de {pagination.total} facturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Optimizado</div>
            <p className="text-xs text-muted-foreground">
              Paginación del servidor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Paginada de Facturas */}
      <PaginatedInvoiceList
        invoices={invoices}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onPageChange={goToPage}
        onViewInvoice={handleViewInvoice}
        onEditInvoice={handleEditInvoice}
        onDeleteInvoice={handleDeleteInvoice}
        onPrintInvoice={handlePrintInvoice}
        onRefetch={refetch}
      />

      {/* Modal de Búsqueda de Pacientes */}
      <OptimizedPatientSearchModal
        isOpen={isPatientSearchOpen}
        onClose={() => setIsPatientSearchOpen(false)}
        onSelectPatient={handleSelectPatient}
        selectedPatientId={selectedPatient?.id}
      />
    </div>
  )
}

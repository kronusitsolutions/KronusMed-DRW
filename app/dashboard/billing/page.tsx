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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
import { PatientInsuranceSelector } from '@/components/billing/patient-insurance-selector'
import { InsuranceBillingTable } from '@/components/billing/insurance-billing-table'
import { PaymentModal } from '@/components/billing/payment-modal'
import { useInvoicesPagination } from '@/hooks/use-invoices-pagination'
import { Invoice } from '@/types/invoice'
import { getActiveInvoiceDesign, getFormatStyles, getLogoPositionClass } from "@/lib/invoice-design-utils"
import { toast } from "sonner"

// Types
interface Service {
  id: string
  name: string
  price: number
  priceType?: 'FIXED' | 'DYNAMIC'
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

  // Estados para estadísticas globales
  const [globalStats, setGlobalStats] = useState({
    totalInvoices: 0,
    totalFacturado: 0,
    exoneradasCount: 0,
    exoneradasTotal: 0,
    pendientesCount: 0,
    pendientesTotal: 0,
    parcialesCount: 0,
    parcialesTotal: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Estados para crear factura
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedPatientInsurance, setSelectedPatientInsurance] = useState<string | null>(null)
  const [insuranceCalculation, setInsuranceCalculation] = useState<any>(null)
  
  // Estados para servicios dinámicos
  const [dynamicPrices, setDynamicPrices] = useState<{[key: string]: number}>({})
  const [editingDynamicPrice, setEditingDynamicPrice] = useState<string | null>(null)
  
  // Estados para búsqueda simple de pacientes
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([])
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)
  const [showPatientResults, setShowPatientResults] = useState(false)

  // Estados para servicios
  const [services, setServices] = useState<Service[]>([])
  const [serviceSearch, setServiceSearch] = useState("")
  const [isLoadingServices, setIsLoadingServices] = useState(false)

  // Estados de carga
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingInvoice, setIsDeletingInvoice] = useState<string | null>(null)
  
  // Estados para edición de facturas
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Estados para edición de servicios
  const [newServiceId, setNewServiceId] = useState<string>("")
  const [newServiceQuantity, setNewServiceQuantity] = useState<number>(1)
  const [newServiceDynamicPrice, setNewServiceDynamicPrice] = useState<number>(0)
  const [isUpdatingServices, setIsUpdatingServices] = useState(false)
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0)
  
  // Estados para pagos
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null)
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)
  
  // Estados para exoneración
  const [isExonerationDialogOpen, setIsExonerationDialogOpen] = useState(false)
  const [exonerationReason, setExonerationReason] = useState("")
  const [isCreatingExoneration, setIsCreatingExoneration] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
  }, [status, router])

  // Cargar servicios con paginación optimizada
  const fetchServices = async (searchTerm = '') => {
    try {
      setIsLoadingServices(true)
      
      // Construir parámetros de búsqueda
      const params = new URLSearchParams({
        limit: '250', // Obtener todos los servicios activos
        status: 'active' // Solo servicios activos
      })
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }
      
      const response = await fetch(`/api/services?${params}`)
      if (response.ok) {
        const data = await response.json()
        const servicesData = data.services || data
        
        // Asegurar que solo obtenemos servicios activos
        const activeServices = servicesData.filter((service: Service) => service.isActive)
        setServices(activeServices)
        setFilteredServices(activeServices)
      } else {
        console.error("Error en la respuesta de servicios:", response.status)
        setServices([])
        setFilteredServices([])
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error)
      setServices([])
      setFilteredServices([])
    } finally {
      setIsLoadingServices(false)
    }
  }

  // Cargar estadísticas globales
  const fetchGlobalStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await fetch("/api/invoices/stats")
      if (response.ok) {
        const data = await response.json()
        setGlobalStats(data)
      }
    } catch (error) {
      console.error("Error al cargar estadísticas globales:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Búsqueda simple de pacientes
  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setPatientSearchResults([])
      setShowPatientResults(false)
      return
    }

    try {
      setIsSearchingPatients(true)
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const patientsData = data.patients || data
        setPatientSearchResults(patientsData)
        setShowPatientResults(true)
      }
    } catch (error) {
      console.error("Error al buscar pacientes:", error)
      setPatientSearchResults([])
    } finally {
      setIsSearchingPatients(false)
    }
  }

  // Debounce para búsqueda de pacientes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(patientSearchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [patientSearchTerm])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.patient-search-container')) {
        setShowPatientResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (session) {
      fetchServices()
      fetchGlobalStats()
    }
  }, [session])

  // Estados para servicios filtrados
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  
  // Efecto para búsqueda de servicios con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServices(serviceSearch)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [serviceSearch])

  // Actualizar servicios filtrados cuando cambien los servicios
  useEffect(() => {
    setFilteredServices(services)
  }, [services])

  // Handlers para facturas
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsViewDialogOpen(true)
  }


  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsEditDialogOpen(true)
    // Resetear estados de servicios
    setNewServiceId("")
    setNewServiceQuantity(1)
    // Calcular el total inicial
    const initialTotal = invoice.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0
    setCalculatedTotal(initialTotal)
  }

  // Función para recalcular el total de la factura
  const recalculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0)
    setCalculatedTotal(total)
    return total
  }

  // Efecto para actualizar el total cuando cambie la factura seleccionada
  useEffect(() => {
    if (selectedInvoice && selectedInvoice.items) {
      const total = selectedInvoice.items.reduce((sum, item) => sum + item.totalPrice, 0)
      setCalculatedTotal(total)
    }
  }, [selectedInvoice])

  // Función para agregar servicio a una factura
  const handleAddService = async (invoiceId: string) => {
    if (!newServiceId || newServiceQuantity < 1) return

    try {
      setIsUpdatingServices(true)
      
      const selectedService = services.find(s => s.id === newServiceId)
      if (!selectedService) return

      // Determinar el precio según el tipo de servicio
      let unitPrice = selectedService.price
      let totalPrice = selectedService.price * newServiceQuantity

      if (selectedService.priceType === 'DYNAMIC') {
        if (newServiceDynamicPrice <= 0) {
          toast.error("Los servicios dinámicos requieren un precio válido")
          return
        }
        unitPrice = newServiceDynamicPrice
        totalPrice = newServiceDynamicPrice * newServiceQuantity
      }

      const response = await fetch(`/api/invoices/${invoiceId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: newServiceId,
          quantity: newServiceQuantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          dynamicPrice: selectedService.priceType === 'DYNAMIC' ? newServiceDynamicPrice : undefined
        })
      })

      if (response.ok) {
        toast.success("Servicio agregado exitosamente")
        refetch() // Recargar la lista de facturas
        
        // Actualizar el total dinámicamente
        const newTotal = calculatedTotal + (selectedService.price * newServiceQuantity)
        setCalculatedTotal(newTotal)
        
        // Resetear formulario
        setNewServiceId("")
        setNewServiceQuantity(1)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al agregar servicio")
      }
    } catch (error) {
      console.error("Error al agregar servicio:", error)
      toast.error("Error al agregar servicio")
    } finally {
      setIsUpdatingServices(false)
    }
  }

  // Función para eliminar servicio de una factura
  const handleRemoveService = async (invoiceId: string, itemId: string) => {
    try {
      setIsUpdatingServices(true)
      
      const response = await fetch(`/api/invoices/${invoiceId}/services/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Servicio eliminado exitosamente")
        refetch() // Recargar la lista de facturas
        
        // Encontrar el item eliminado para actualizar el total
        const removedItem = selectedInvoice?.items?.find(item => item.id === itemId)
        if (removedItem) {
          const newTotal = calculatedTotal - removedItem.totalPrice
          setCalculatedTotal(newTotal)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al eliminar servicio")
      }
    } catch (error) {
      console.error("Error al eliminar servicio:", error)
      toast.error("Error al eliminar servicio")
    } finally {
      setIsUpdatingServices(false)
    }
  }

  const handleRegisterPayment = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    refetch()
    fetchGlobalStats()
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
        await fetchGlobalStats()
      } else {
        toast.error("Error al eliminar factura")
      }
    } catch (error) {
      toast.error("Error al eliminar factura")
    } finally {
      setIsDeletingInvoice(null)
    }
  }

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(invoiceId)
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const updatedInvoice = await response.json()
        toast.success(`Estado actualizado a: ${getStatusText(newStatus)}`)
        await refetch()
        await fetchGlobalStats()
        
        // Actualizar la factura seleccionada si es la misma
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice(updatedInvoice)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al actualizar estado")
      }
    } catch (error) {
      toast.error("Error al actualizar estado")
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'PAID': 'Pagado',
      'CANCELLED': 'Cancelado',
      'EXONERATED': 'Exonerado'
    }
    return statusMap[status] || status
  }

  const handleExonerateInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setExonerationReason("")
    setIsExonerationDialogOpen(true)
  }

  const handleCreateExoneration = async () => {
    if (!selectedInvoice || !exonerationReason.trim()) {
      toast.error("Debes proporcionar una razón para la exoneración")
      return
    }

    try {
      setIsCreatingExoneration(true)
      
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/exonerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: exonerationReason.trim(),
          exoneratedAmount: selectedInvoice.totalAmount,
          originalAmount: selectedInvoice.totalAmount
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Factura exonerada exitosamente")
        setIsExonerationDialogOpen(false)
        setExonerationReason("")
        await refetch()
        await fetchGlobalStats()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al exonerar la factura")
      }
    } catch (error) {
      toast.error("Error al exonerar la factura")
    } finally {
      setIsCreatingExoneration(false)
    }
  }

  const handlePrintPaymentReceipt = async (invoiceId: string, paymentId: string) => {
    try {
      // Obtener el diseño activo
      const design = await getActiveInvoiceDesign()
      
      // Obtener los datos del pago y factura para impresión
      const response = await fetch(`/api/invoices/${invoiceId}/payments/${paymentId}/print`)
      if (!response.ok) {
        throw new Error('Error al obtener los datos del pago')
      }
      const { payment, invoice } = await response.json()
      
      // Crear una nueva ventana para imprimir
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión. Verifica que los popups estén habilitados.")
        return
      }

      // Generar el contenido HTML del recibo con diseño personalizado
      const receiptContent = await generatePaymentReceiptHTML(payment, invoice, design)
      
      printWindow.document.write(receiptContent)
      printWindow.document.close()
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        
        // Cerrar la ventana después de imprimir
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }
      
      toast.success(`Preparando recibo REC-${paymentId} para impresión...`)
    } catch (error) {
      console.error("Error al imprimir recibo:", error)
      toast.error("Error al preparar el recibo para impresión")
    }
  }

  const handlePrintInvoice = async (invoice: Invoice) => {
    try {
      // Obtener el diseño activo
      const design = await getActiveInvoiceDesign()
      
      // Obtener la factura completa con todos sus items para impresión
      const response = await fetch(`/api/invoices/${invoice.id}/print`)
      if (!response.ok) {
        throw new Error('Error al obtener los datos de la factura')
      }
      const { invoice: fullInvoice } = await response.json()
      
      // Crear una nueva ventana para imprimir
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión. Verifica que los popups estén habilitados.")
        return
      }

      // Generar el contenido HTML de la factura con diseño personalizado
      const invoiceContent = fullInvoice.status === 'EXONERATED' 
        ? await generateExonerationInvoiceHTML(fullInvoice, design)
        : await generateInvoiceHTMLWithDesign(fullInvoice, design)
      
      printWindow.document.write(invoiceContent)
      printWindow.document.close()
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        
        // Cerrar la ventana después de imprimir
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }
      
      toast.success(`Preparando factura ${fullInvoice.invoiceNumber} para impresión...`)
    } catch (error) {
      console.error("Error al imprimir factura:", error)
      toast.error("Error al preparar la factura para impresión")
    }
  }

  // Función para generar el HTML de la factura de exoneración
  const generateExonerationInvoiceHTML = async (invoice: Invoice, design: any) => {
    const currentDate = new Date().toLocaleDateString('es-ES')
    const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('es-ES')
    
    // Usar diseño personalizado o valores por defecto
    const finalDesign = design || {
      businessName: 'Sistema de Clínica Médica',
      address: 'Dirección no configurada',
      phone: 'Teléfono no configurado',
      taxId: 'RNC no configurado',
      customMessage: 'Gracias por su preferencia',
      format: '80MM',
      logoUrl: '',
      logoPosition: 'LEFT'
    }
    
    const formatStyles = getFormatStyles(finalDesign.format)
    const logoPositionClass = getLogoPositionClass(finalDesign.logoPosition)
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura de Exoneración ${invoice.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background: white;
          }
          .invoice-container {
            max-width: ${formatStyles.maxWidth};
            margin: 0 auto;
            padding: ${formatStyles.padding};
            font-size: ${formatStyles.fontSize};
            background: white;
            border: 3px solid #dc2626;
          }
          .exoneration-header {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            text-align: center;
            padding: 15px;
            margin: -3px -3px 15px -3px;
            border-radius: 5px 5px 0 0;
          }
          .exoneration-title {
            font-size: ${finalDesign.format === '80MM' ? '18px' : '24px'};
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .exoneration-subtitle {
            font-size: ${finalDesign.format === '80MM' ? '12px' : '16px'};
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          .header { 
            text-align: center; 
            margin-bottom: 10px; 
          }
          .business-name {
            font-weight: bold;
            font-size: ${finalDesign.format === '80MM' ? '14px' : '18px'};
            margin: 0;
          }
          .business-info {
            text-align: center;
            margin-bottom: 8px;
            font-size: ${finalDesign.format === '80MM' ? '9px' : '12px'};
            color: #666;
          }
          .separator {
            border-top: 1px solid #ccc;
            margin: 8px 0;
          }
          .invoice-info { 
            margin-bottom: 8px; 
            font-size: ${finalDesign.format === '80MM' ? '10px' : '12px'};
          }
          .invoice-info p {
            margin: 2px 0;
          }
          .exoneration-details {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .exoneration-details h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: ${finalDesign.format === '80MM' ? '14px' : '16px'};
          }
          .exoneration-reason {
            background: white;
            border: 1px solid #fecaca;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-style: italic;
            color: #374151;
          }
          .amounts {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-weight: bold;
          }
          .original-amount {
            color: #6b7280;
            text-decoration: line-through;
          }
          .exonerated-amount {
            color: #dc2626;
            font-size: ${finalDesign.format === '80MM' ? '14px' : '18px'};
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: ${finalDesign.format === '80MM' ? '9px' : '12px'};
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: ${finalDesign.format === '80MM' ? '4px' : '8px'};
            text-align: left;
          }
          .items-table th {
            background: #f5f5f5;
            font-weight: bold;
          }
          .total { 
            text-align: right; 
            font-weight: bold; 
            font-size: ${finalDesign.format === '80MM' ? '12px' : '16px'}; 
            margin-top: 10px; 
            border-top: 2px solid #dc2626;
            padding-top: 8px;
            color: #dc2626;
          }
          
          .payment-summary {
            margin-top: 15px;
            padding: 15px;
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
          }
          
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: ${finalDesign.format === '80MM' ? '10px' : '14px'};
          }
          
          .payment-row:last-child {
            margin-bottom: 0;
          }
          
          .payment-pending {
            font-weight: bold;
            color: #dc2626;
            border-top: 1px solid #fbbf24;
            padding-top: 8px;
          }
          .custom-message {
            text-align: center;
            margin-top: 15px;
            font-style: italic;
            font-size: ${finalDesign.format === '80MM' ? '8px' : '10px'};
            color: #666;
          }
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: ${logoPositionClass === 'justify-start' ? 'flex-start' : logoPositionClass === 'justify-center' ? 'center' : 'flex-end'};
            margin-bottom: 10px;
          }
          .logo {
            max-height: ${finalDesign.format === '80MM' ? '30px' : '50px'};
            max-width: ${finalDesign.format === '80MM' ? '60px' : '100px'};
            margin-right: 10px;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48px;
            color: rgba(220, 38, 38, 0.1);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
          }
          @media print {
            body { margin: 0; }
            .invoice-container { 
              max-width: none;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="watermark">EXONERADA</div>
        <div class="invoice-container">
          <div class="exoneration-header">
            <h1 class="exoneration-title">Factura de Exoneración</h1>
            <p class="exoneration-subtitle">Documento Oficial de Exoneración de Pago</p>
          </div>
          
          <div class="header">
            ${finalDesign.logoUrl ? `
              <div class="logo-container">
                <img src="${finalDesign.logoUrl}" alt="Logo" class="logo" />
                <h1 class="business-name">${finalDesign.businessName}</h1>
              </div>
            ` : `
              <h1 class="business-name">${finalDesign.businessName}</h1>
            `}
            
            ${(finalDesign.address || finalDesign.phone || finalDesign.taxId) ? `
              <div class="business-info">
                ${finalDesign.address ? `<div>${finalDesign.address}</div>` : ''}
                ${finalDesign.phone ? `<div>Tel: ${finalDesign.phone}</div>` : ''}
                ${finalDesign.taxId ? `<div>RNC: ${finalDesign.taxId}</div>` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="invoice-info">
            <p><strong>Factura Original:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Fecha de Emisión:</strong> ${invoiceDate}</p>
            <p><strong>Fecha de Exoneración:</strong> ${currentDate}</p>
            ${invoice.patient ? `<p><strong>Paciente:</strong> ${invoice.patient.name}</p>` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="exoneration-details">
            <h3>Detalles de la Exoneración</h3>
            <div class="exoneration-reason">
              <strong>Motivo de Exoneración:</strong><br>
              ${invoice.exoneration?.reason || 'No especificado'}
            </div>
            <div class="amounts">
              <div class="original-amount">
                Monto Original: $${invoice.totalAmount.toFixed(2)}
              </div>
              <div class="exonerated-amount">
                Monto Exonerado: $${invoice.exoneration?.exoneratedAmount?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.service?.name || 'Servicio'}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <div class="total">
            Total Exonerado: $${invoice.exoneration?.exoneratedAmount?.toFixed(2) || '0.00'}
          </div>
          
          ${finalDesign.customMessage ? `
            <div class="separator"></div>
            <div class="custom-message">
              ${finalDesign.customMessage}
            </div>
          ` : ''}
          
          <div class="separator"></div>
          <div style="text-align: center; font-size: 10px; color: #666; margin-top: 10px;">
            <p>Esta factura ha sido oficialmente exonerada y no requiere pago.</p>
            <p>Documento generado el ${currentDate} por el sistema KronusMed</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Función para generar el HTML del recibo de pago con diseño personalizado
  const generatePaymentReceiptHTML = async (payment: any, invoice: Invoice, design: any) => {
    const currentDate = new Date().toLocaleDateString('es-ES')
    const paymentDate = new Date(payment.paidAt).toLocaleDateString('es-ES')
    const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('es-ES')
    
    // Usar diseño personalizado o valores por defecto
    const finalDesign = design || {
      businessName: 'Sistema de Clínica Médica',
      address: 'Dirección no configurada',
      phone: 'Teléfono no configurado',
      taxId: 'RNC no configurado',
      customMessage: 'Gracias por su preferencia',
      format: '80MM',
      logoUrl: '',
      logoPosition: 'LEFT'
    }
    
    const formatStyles = getFormatStyles(finalDesign.format)
    const logoPositionClass = getLogoPositionClass(finalDesign.logoPosition)
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Pago ${payment.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background: white;
          }
          .receipt-container {
            max-width: ${formatStyles.maxWidth};
            margin: 0 auto;
            padding: ${formatStyles.padding};
            font-size: ${formatStyles.fontSize};
            background: white;
            border: 2px solid #059669;
          }
          .receipt-header {
            background: linear-gradient(135deg, #059669, #10b981);
            color: white;
            text-align: center;
            padding: 15px;
            margin: -2px -2px 15px -2px;
            border-radius: 5px 5px 0 0;
          }
          .receipt-title {
            font-size: ${finalDesign.format === '80MM' ? '18px' : '24px'};
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .receipt-subtitle {
            font-size: ${finalDesign.format === '80MM' ? '12px' : '16px'};
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          .header { 
            text-align: center; 
            margin-bottom: 10px; 
          }
          .business-name {
            font-weight: bold;
            font-size: ${finalDesign.format === '80MM' ? '14px' : '18px'};
            margin: 0;
          }
          .business-info {
            text-align: center;
            margin-bottom: 8px;
            font-size: ${finalDesign.format === '80MM' ? '9px' : '12px'};
            color: #666;
          }
          .separator {
            border-top: 1px solid #ccc;
            margin: 8px 0;
          }
          .receipt-info { 
            margin-bottom: 8px; 
            font-size: ${finalDesign.format === '80MM' ? '10px' : '12px'};
          }
          .receipt-info p {
            margin: 2px 0;
          }
          .payment-details {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .payment-details h3 {
            color: #059669;
            margin: 0 0 10px 0;
            font-size: ${finalDesign.format === '80MM' ? '14px' : '16px'};
          }
          .payment-amount {
            background: white;
            border: 1px solid #bbf7d0;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-weight: bold;
            font-size: ${finalDesign.format === '80MM' ? '14px' : '18px'};
            color: #059669;
            text-align: center;
          }
          .payment-method {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: ${finalDesign.format === '80MM' ? '10px' : '12px'};
          }
          .invoice-summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            font-size: ${finalDesign.format === '80MM' ? '9px' : '11px'};
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .summary-total {
            font-weight: bold;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            color: #059669;
          }
          .custom-message {
            text-align: center;
            margin-top: 15px;
            font-style: italic;
            font-size: ${finalDesign.format === '80MM' ? '8px' : '10px'};
            color: #666;
          }
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: ${logoPositionClass === 'justify-start' ? 'flex-start' : logoPositionClass === 'justify-center' ? 'center' : 'flex-end'};
            margin-bottom: 10px;
          }
          .logo {
            max-height: ${finalDesign.format === '80MM' ? '30px' : '50px'};
            max-width: ${finalDesign.format === '80MM' ? '60px' : '100px'};
            margin-right: 10px;
          }
          @media print {
            body { margin: 0; }
            .receipt-container { 
              max-width: none;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <h1 class="receipt-title">RECIBO DE PAGO</h1>
            <p class="receipt-subtitle">Comprobante de Pago Individual</p>
          </div>
          
          <div class="header">
            ${finalDesign.logoUrl ? `
              <div class="logo-container">
                <img src="${finalDesign.logoUrl}" alt="Logo" class="logo" />
                <h1 class="business-name">${finalDesign.businessName}</h1>
              </div>
            ` : `
              <h1 class="business-name">${finalDesign.businessName}</h1>
            `}
            
            ${(finalDesign.address || finalDesign.phone || finalDesign.taxId) ? `
              <div class="business-info">
                ${finalDesign.address ? `<div>${finalDesign.address}</div>` : ''}
                ${finalDesign.phone ? `<div>Tel: ${finalDesign.phone}</div>` : ''}
                ${finalDesign.taxId ? `<div>RNC: ${finalDesign.taxId}</div>` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="receipt-info">
            <p><strong>Recibo:</strong> REC-${payment.id}</p>
            <p><strong>Fecha del Pago:</strong> ${paymentDate}</p>
            <p><strong>Factura Ref:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Fecha Factura:</strong> ${invoiceDate}</p>
            ${invoice.patient ? `<p><strong>Paciente:</strong> ${invoice.patient.name}</p>` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="payment-details">
            <h3>Detalle del Pago</h3>
            <div class="payment-amount">
              Monto del Abono: $${payment.amount.toFixed(2)}
            </div>
            <div class="payment-method">
              <span><strong>Método de Pago:</strong></span>
              <span>${payment.paymentMethod || 'No especificado'}</span>
            </div>
            ${payment.notes ? `
              <div class="payment-method">
                <span><strong>Notas:</strong></span>
                <span>${payment.notes}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="invoice-summary">
            <div style="font-weight: bold; margin-bottom: 8px; color: #1e293b;">Resumen de Factura</div>
            <div class="summary-row">
              <span>Total Factura:</span>
              <span>$${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Total Pagado:</span>
              <span>$${(invoice.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Saldo Pendiente:</span>
              <span>$${(invoice.pendingAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          
          ${finalDesign.customMessage ? `
            <div class="separator"></div>
            <div class="custom-message">
              ${finalDesign.customMessage}
            </div>
          ` : ''}
          
          <div class="separator"></div>
          <div style="text-align: center; font-size: 10px; color: #666; margin-top: 10px;">
            <p>Este recibo certifica el pago realizado el ${paymentDate}</p>
            <p>Documento generado el ${currentDate} por el sistema KronusMed</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Función para generar el HTML de la factura con diseño personalizado
  const generateInvoiceHTMLWithDesign = async (invoice: Invoice, design: any) => {
    const currentDate = new Date().toLocaleDateString('es-ES')
    const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('es-ES')
    
    // Usar diseño personalizado o valores por defecto
    const finalDesign = design || {
      businessName: 'Sistema de Clínica Médica',
      address: 'Dirección no configurada',
      phone: 'Teléfono no configurado',
      taxId: 'RNC no configurado',
      customMessage: 'Gracias por su preferencia',
      format: '80MM',
      logoUrl: '',
      logoPosition: 'LEFT'
    }
    
    const formatStyles = getFormatStyles(finalDesign.format)
    const logoPositionClass = getLogoPositionClass(finalDesign.logoPosition)
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${invoice.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background: white;
          }
          .invoice-container {
            max-width: ${formatStyles.maxWidth};
            margin: 0 auto;
            padding: ${formatStyles.padding};
            font-size: ${formatStyles.fontSize};
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 10px; 
          }
          .business-name {
            font-weight: bold;
            font-size: ${finalDesign.format === '80MM' ? '14px' : '18px'};
            margin: 0;
          }
          .business-info {
            text-align: center;
            margin-bottom: 8px;
            font-size: ${finalDesign.format === '80MM' ? '9px' : '12px'};
            color: #666;
          }
          .separator {
            border-top: 1px solid #ccc;
            margin: 8px 0;
          }
          .invoice-info { 
            margin-bottom: 8px; 
            font-size: ${finalDesign.format === '80MM' ? '10px' : '12px'};
          }
          .invoice-info p {
            margin: 2px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: ${finalDesign.format === '80MM' ? '9px' : '12px'};
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: ${finalDesign.format === '80MM' ? '3px' : '8px'};
            text-align: left;
            font-size: ${finalDesign.format === '80MM' ? '8px' : '12px'};
          }
          .items-table th {
            background: #f5f5f5;
            font-weight: bold;
            text-align: center;
          }
          .items-table td {
            vertical-align: top;
          }
          .insurance-info {
            background: #f0f9ff;
            padding: ${finalDesign.format === '80MM' ? '6px' : '8px'};
            margin: ${finalDesign.format === '80MM' ? '6px 0' : '8px 0'};
            border-radius: 4px;
            border-left: 4px solid #0ea5e9;
            font-size: ${finalDesign.format === '80MM' ? '8px' : '10px'};
          }
          .insurance-summary {
            background: #f8fafc;
            padding: ${finalDesign.format === '80MM' ? '8px' : '10px'};
            margin: ${finalDesign.format === '80MM' ? '8px 0' : '10px 0'};
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            font-size: ${finalDesign.format === '80MM' ? '8px' : '10px'};
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: ${finalDesign.format === '80MM' ? '1px 0' : '2px 0'};
            font-size: ${finalDesign.format === '80MM' ? '8px' : '11px'};
          }
          .summary-total {
            font-weight: bold;
            border-top: 1px solid #e2e8f0;
            padding-top: ${finalDesign.format === '80MM' ? '2px' : '4px'};
            color: #dc2626;
          }
          .summary-savings {
            color: #059669;
            font-style: italic;
            font-size: ${finalDesign.format === '80MM' ? '7px' : '10px'};
          }
          .total { 
            text-align: right; 
            font-weight: bold; 
            font-size: ${finalDesign.format === '80MM' ? '12px' : '16px'}; 
            margin-top: 10px; 
            border-top: 2px solid #333;
            padding-top: 8px;
          }
          .custom-message {
            text-align: center;
            margin-top: 15px;
            font-style: italic;
            font-size: ${finalDesign.format === '80MM' ? '8px' : '10px'};
            color: #666;
          }
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: ${logoPositionClass === 'justify-start' ? 'flex-start' : logoPositionClass === 'justify-center' ? 'center' : 'flex-end'};
            margin-bottom: 10px;
          }
          .logo {
            max-height: ${finalDesign.format === '80MM' ? '30px' : '50px'};
            max-width: ${finalDesign.format === '80MM' ? '60px' : '100px'};
            margin-right: 10px;
          }
          @media print {
            body { margin: 0; }
            .invoice-container { 
              max-width: none;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            ${finalDesign.logoUrl ? `
              <div class="logo-container">
                <img src="${finalDesign.logoUrl}" alt="Logo" class="logo" />
                <h1 class="business-name">${finalDesign.businessName}</h1>
              </div>
            ` : `
              <h1 class="business-name">${finalDesign.businessName}</h1>
            `}
            
            ${(finalDesign.address || finalDesign.phone || finalDesign.taxId) ? `
              <div class="business-info">
                ${finalDesign.address ? `<div>${finalDesign.address}</div>` : ''}
                ${finalDesign.phone ? `<div>Tel: ${finalDesign.phone}</div>` : ''}
                ${finalDesign.taxId ? `<div>RNC: ${finalDesign.taxId}</div>` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="invoice-info">
            <p><strong>Factura:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Fecha:</strong> ${invoiceDate}</p>
            ${invoice.patient ? `<p><strong>Paciente:</strong> ${invoice.patient.name}</p>` : ''}
          </div>
          
          <div class="separator"></div>
          
          ${invoice.insuranceCalculation ? `
            <!-- Información del Seguro -->
            <div class="insurance-info">
              <div style="font-weight: bold; color: #0369a1; margin-bottom: 4px;">
                🛡️ Seguro Médico: ${invoice.patient?.insurance?.name || 'Seguro Médico'}
              </div>
            </div>
            
            <!-- Tabla de Servicios con Cobertura -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Cant.</th>
                  <th>Precio Base</th>
                  <th>Descuento</th>
                  <th>Paciente Paga</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map(item => {
                  const basePrice = item.unitPrice;
                  const itemData = invoice.insuranceCalculation?.items?.find(i => i.serviceId === item.service?.id) || {
                    serviceId: '',
                    serviceName: '',
                    basePrice: 0,
                    coveragePercent: 0,
                    insuranceCovers: 0,
                    patientPays: basePrice,
                    insuranceName: ''
                  };
                  const coveragePercent = itemData.coveragePercent || 0;
                  const insuranceCovers = itemData.insuranceCovers || 0;
                  const patientPays = itemData.patientPays || basePrice;
                  
                  return `
                    <tr>
                      <td>${item.service?.name || 'Servicio'}</td>
                      <td>${item.quantity}</td>
                      <td>$${basePrice.toFixed(2)}</td>
                      <td style="color: #16a34a; font-weight: bold;">-$${insuranceCovers.toFixed(2)}</td>
                      <td style="color: #dc2626; font-weight: bold;">$${patientPays.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('') || ''}
              </tbody>
            </table>
            
            <!-- Resumen de Seguros -->
            <div class="insurance-summary">
              <div style="font-weight: bold; margin-bottom: 6px; color: #1e293b;">Resumen de Cobertura</div>
              <div class="summary-row">
                <span>Total Base:</span>
                <span>$${invoice.insuranceCalculation?.totalBaseAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div class="summary-row" style="color: #16a34a;">
                <span>Seguro Cubre:</span>
                <span>-$${invoice.insuranceCalculation?.totalInsuranceCovers?.toFixed(2) || '0.00'}</span>
              </div>
              <div class="summary-row summary-total">
                <span>TOTAL A PAGAR:</span>
                <span>$${invoice.insuranceCalculation?.totalPatientPays?.toFixed(2) || invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div class="summary-row summary-savings">
                <span>Ahorro:</span>
                <span>$${((invoice.insuranceCalculation?.totalBaseAmount || 0) - (invoice.insuranceCalculation?.totalPatientPays || 0)).toFixed(2)}</span>
              </div>
            </div>
            
            ${(invoice.status === 'PARTIAL' || invoice.status === 'PENDING') ? `
              <div class="payment-summary">
                <div style="font-weight: bold; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
                  💳 Estado de Pago
                </div>
                <div class="payment-row">
                  <span>Monto Pagado:</span>
                  <span>$${(invoice.paidAmount || 0).toFixed(2)}</span>
                </div>
                <div class="payment-row payment-pending">
                  <span>Monto Pendiente:</span>
                  <span>$${(invoice.pendingAmount || invoice.totalAmount).toFixed(2)}</span>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: ${finalDesign.format === '80MM' ? '9px' : '12px'}; color: #6b7280;">
                  <div>💡 Nota: Los montos mostrados son del monto que paga el paciente (después del descuento del seguro)</div>
                </div>
              </div>
            ` : ''}
          ` : `
            <!-- Tabla de Servicios Sin Seguro -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map(item => `
                  <tr>
                    <td>${item.service?.name || 'Servicio'}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.unitPrice.toFixed(2)}</td>
                    <td>$${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
            
            <div class="total">
              Total: $${invoice.totalAmount.toFixed(2)}
            </div>
            
            ${(invoice.status === 'PARTIAL' || invoice.status === 'PENDING') ? `
              <div class="payment-summary">
                <div style="font-weight: bold; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
                  💳 Estado de Pago
                </div>
                <div class="payment-row">
                  <span>Monto Pagado:</span>
                  <span>$${(invoice.paidAmount || 0).toFixed(2)}</span>
                </div>
                <div class="payment-row payment-pending">
                  <span>Monto Pendiente:</span>
                  <span>$${(invoice.pendingAmount || invoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            ` : ''}
          `}
          
          ${finalDesign.customMessage ? `
            <div class="separator"></div>
            <div class="custom-message">
              ${finalDesign.customMessage}
            </div>
          ` : ''}
          
          <div class="separator"></div>
        </div>
      </body>
      </html>
    `
  }

  // Función para generar el HTML de la factura (mantener para compatibilidad)
  const generateInvoiceHTML = (invoice: Invoice) => {
    const currentDate = new Date().toLocaleDateString('es-ES')
    const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('es-ES')
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
          }
          .invoice-header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin: 0;
          }
          .invoice-number {
            font-size: 18px;
            color: #666;
            margin: 10px 0;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-section {
            flex: 1;
          }
          .info-title {
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .patient-info, .invoice-details {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background: #2563eb;
            color: white;
            font-weight: bold;
          }
          .items-table tr:nth-child(even) {
            background: #f8fafc;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid {
            background: #dcfce7;
            color: #166534;
          }
          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }
          .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1 class="invoice-title">FACTURA MÉDICA</h1>
          <div class="invoice-number">${invoice.invoiceNumber}</div>
        </div>

        <div class="invoice-info">
          <div class="info-section">
            <div class="info-title">Información del Paciente</div>
            <div class="patient-info">
              <p><strong>Nombre:</strong> ${invoice.patient?.name || 'N/A'}</p>
              <p><strong>Número de Paciente:</strong> ${invoice.patient?.patientNumber || 'N/A'}</p>
              <p><strong>Cédula:</strong> ${invoice.patient?.cedula || 'N/A'}</p>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-title">Detalles de la Factura</div>
            <div class="invoice-details">
              <p><strong>Fecha de Emisión:</strong> ${invoiceDate}</p>
              <p><strong>Fecha de Impresión:</strong> ${currentDate}</p>
              <p><strong>Estado:</strong> 
                <span class="status-badge status-${invoice.status.toLowerCase()}">
                  ${invoice.status === 'PAID' ? 'Pagada' : 
                    invoice.status === 'PENDING' ? 'Pendiente' : 
                    invoice.status === 'CANCELLED' ? 'Cancelada' : invoice.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map(item => `
              <tr>
                <td>${item.service?.name || 'Servicio'}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No hay servicios registrados</td></tr>'}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-amount">
            Total: $${invoice.totalAmount.toFixed(2)}
          </div>
        </div>

        <div class="footer">
          <p>Esta factura fue generada el ${currentDate} por el sistema KronusMed</p>
          <p>Para consultas, contacte al administrador del sistema</p>
        </div>
      </body>
      </html>
    `
  }

  // Handlers para crear factura
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setSelectedPatientInsurance(null)
    setInsuranceCalculation(null)
    setPatientSearchTerm(patient.name)
    setShowPatientResults(false)
  }

  const handleClearPatient = () => {
    setSelectedPatient(null)
    setPatientSearchTerm("")
    setShowPatientResults(false)
    setSelectedPatientInsurance(null)
    setInsuranceCalculation(null)
  }

  const addService = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName)
    if (service) {
      const uniqueId = Date.now()
      const newService = {
        ...service,
        uniqueId: uniqueId
      }
      
      // Si es un servicio dinámico, inicializar el precio dinámico
      if (service.priceType === 'DYNAMIC') {
        setDynamicPrices(prev => ({
          ...prev,
          [uniqueId.toString()]: service.price || 0 // Usar precio referencial o 0
        }))
      }
      
      setSelectedServices(prev => [...prev, newService])
    }
  }

  const removeService = (uniqueId: number) => {
    setSelectedServices(prev => prev.filter(s => s.uniqueId !== uniqueId))
    // Limpiar precio dinámico si existe
    setDynamicPrices(prev => {
      const newPrices = { ...prev }
      delete newPrices[uniqueId.toString()]
      return newPrices
    })
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => {
      if (service.priceType === 'DYNAMIC') {
        return total + (dynamicPrices[service.uniqueId!.toString()] || 0)
      }
      return total + service.price
    }, 0)
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
        items: selectedServices.map(s => {
          const unitPrice = s.priceType === 'DYNAMIC' ? (dynamicPrices[s.uniqueId!.toString()] || 0) : s.price
          return {
            serviceId: s.id,
            quantity: 1,
            unitPrice: unitPrice,
            totalPrice: unitPrice,
            dynamicPrice: s.priceType === 'DYNAMIC' ? unitPrice : undefined
          }
        }),
        totalAmount: insuranceCalculation ? insuranceCalculation.totalPatientPays : calculateTotal(),
        insuranceCalculation: insuranceCalculation
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
        setPatientSearchTerm("")
        setShowPatientResults(false)
        setDynamicPrices({})
        setEditingDynamicPrice(null)
        await refetch()
        await fetchGlobalStats()
      } else {
        const errorData = await response.json()
        console.error("Error al crear factura:", errorData)
        toast.error(errorData.error || `Error al crear la factura (${response.status})`)
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
                    <div className="relative patient-search-container">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar paciente por nombre, teléfono o cédula..."
                          value={patientSearchTerm}
                          onChange={(e) => setPatientSearchTerm(e.target.value)}
                          className="pl-10 pr-4"
                        />
                        {isSearchingPatients && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Resultados de búsqueda */}
                      {showPatientResults && patientSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {patientSearchResults.map((patient) => (
                            <div
                              key={patient.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                              onClick={() => handleSelectPatient(patient)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{patient.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {patient.patientNumber && `#${patient.patientNumber}`}
                                    {patient.phone && ` • ${patient.phone}`}
                                    {patient.cedula && ` • Cédula: ${patient.cedula}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Paciente seleccionado */}
                      {selectedPatient && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-blue-900">Paciente seleccionado:</div>
                              <div className="text-sm text-blue-700">
                                {selectedPatient.name}
                                {selectedPatient.patientNumber && ` (${selectedPatient.patientNumber})`}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleClearPatient}
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Sin resultados */}
                      {showPatientResults && patientSearchResults.length === 0 && patientSearchTerm.trim() && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                          <div className="text-sm text-gray-500 text-center">
                            No se encontraron pacientes
                          </div>
                        </div>
                      )}
                    </div>
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
                        {isLoadingServices && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
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
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate">{service.name}</span>
                                  {service.priceType === 'DYNAMIC' && (
                                    <Badge variant="outline" className="text-xs">
                                      Dinámico
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">ID: {service.id}</div>
                              </div>
                              <div className="text-right ml-3">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {service.priceType === 'DYNAMIC' ? 'Precio dinámico' : `$${service.price.toFixed(2)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            {isLoadingServices ? (
                              <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <div className="text-sm font-medium">Buscando servicios...</div>
                              </>
                            ) : serviceSearch.trim() ? (
                              <>
                                <FileText className="h-6 w-6 text-muted-foreground/50" />
                                <div className="text-sm font-medium">
                                  No se encontraron servicios que coincidan con "{serviceSearch}"
                                </div>
                              </>
                            ) : (
                              <>
                                <FileText className="h-6 w-6 text-muted-foreground/50" />
                                <div className="text-sm font-medium">No hay servicios disponibles</div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {selectedServices.length > 0 && (
                      <div className="border rounded-lg p-3 space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Servicios seleccionados:</h4>
                        {selectedServices.map((service) => (
                          <div key={service.uniqueId} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{service.name}</span>
                                {service.priceType === 'DYNAMIC' && (
                                  <Badge variant="outline" className="text-xs">
                                    Dinámico
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {service.priceType === 'DYNAMIC' ? (
                                <div className="flex items-center space-x-2">
                                  {editingDynamicPrice === service.uniqueId?.toString() ? (
                                    <div className="flex items-center space-x-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={dynamicPrices[service.uniqueId!.toString()] || 0}
                                        onChange={(e) => setDynamicPrices(prev => ({
                                          ...prev,
                                          [service.uniqueId!.toString()]: parseFloat(e.target.value) || 0
                                        }))}
                                        className="w-20 h-8 text-sm"
                                        onBlur={() => setEditingDynamicPrice(null)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            setEditingDynamicPrice(null)
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingDynamicPrice(null)}
                                        className="h-8 px-2"
                                      >
                                        ✓
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="font-semibold text-blue-600 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                                      onClick={() => setEditingDynamicPrice(service.uniqueId!.toString())}
                                    >
                                      ${(dynamicPrices[service.uniqueId!.toString()] || 0).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="font-semibold text-blue-600">${service.price.toFixed(2)}</span>
                              )}
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

                {/* Tabla de Cálculo de Seguros */}
                {selectedPatient && selectedServices.length > 0 && selectedPatientInsurance && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <div className="text-right pt-2">
                      <Label>Cálculo de Seguros</Label>
                    </div>
                    <div className="col-span-3">
                      <InsuranceBillingTable
                        patientId={selectedPatient.id}
                        services={selectedServices.map(service => ({
                          serviceId: service.id,
                          quantity: 1,
                          unitPrice: service.price
                        }))}
                        onCalculationChange={setInsuranceCalculation}
                        selectedInsuranceId={selectedPatientInsurance}
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

        {/* Diálogo de Edición de Factura */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Factura</DialogTitle>
              <DialogDescription>
                Cambiar el estado de la factura {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-4 pt-4">
                {/* Información de la factura */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Información de la Factura</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Número:</span> {selectedInvoice.invoiceNumber}
                    </div>
                    <div>
                      <span className="font-medium">Paciente:</span> {selectedInvoice.patient?.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Total:</span> 
                      <span className="font-bold text-blue-600">
                        ${calculatedTotal.toFixed(2)}
                      </span>
                      {isUpdatingServices && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Estado Actual:</span> 
                      <Badge className={`ml-2 ${
                        selectedInvoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        selectedInvoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        selectedInvoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {getStatusText(selectedInvoice.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Servicios de la factura - Solo para facturas PENDING */}
                {selectedInvoice.status === 'PENDING' && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Servicios de la Factura</Label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        {selectedInvoice.items?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div className="flex-1">
                              <div className="font-medium">{item.service.name}</div>
                              <div className="text-sm text-gray-600">
                                Cantidad: {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.totalPrice.toFixed(2)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveService(selectedInvoice.id, item.id)}
                              className="ml-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Agregar nuevo servicio */}
                      <div className="mt-4 pt-4 border-t">
                        <Label className="text-sm font-medium">Agregar Servicio</Label>
                        <div className="mt-2 space-y-2">
                          <Select onValueChange={(value) => {
                            setNewServiceId(value)
                            setNewServiceDynamicPrice(0) // Reset precio dinámico
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar servicio" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} - {service.priceType === 'DYNAMIC' ? 'Precio dinámico' : `$${service.price.toFixed(2)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Campo de precio dinámico */}
                          {newServiceId && services.find(s => s.id === newServiceId)?.priceType === 'DYNAMIC' && (
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">Precio del servicio</Label>
                              <Input
                                type="number"
                                placeholder="Ingrese el precio"
                                value={newServiceDynamicPrice}
                                onChange={(e) => setNewServiceDynamicPrice(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full"
                              />
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Cantidad"
                              value={newServiceQuantity}
                              onChange={(e) => setNewServiceQuantity(parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-24"
                            />
                            <Button
                              type="button"
                              onClick={() => handleAddService(selectedInvoice.id)}
                              disabled={!newServiceId || newServiceQuantity < 1 || (services.find(s => s.id === newServiceId)?.priceType === 'DYNAMIC' && newServiceDynamicPrice <= 0)}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cambio de estado */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Cambiar Estado</Label>
                  
                  {selectedInvoice.status === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleUpdateInvoiceStatus(selectedInvoice.id, 'PAID')}
                        disabled={isUpdatingStatus === selectedInvoice.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingStatus === selectedInvoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Marcar como Pagado
                      </Button>
                      
                      <Button
                        onClick={() => handleExonerateInvoice(selectedInvoice)}
                        disabled={isUpdatingStatus === selectedInvoice.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isUpdatingStatus === selectedInvoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Exonerar Factura
                      </Button>
                    </div>
                  )}

                  {selectedInvoice.status === 'PAID' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleUpdateInvoiceStatus(selectedInvoice.id, 'PENDING')}
                        disabled={isUpdatingStatus === selectedInvoice.id}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        {isUpdatingStatus === selectedInvoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Marcar como Pendiente
                      </Button>
                      
                      <Button
                        onClick={() => handleExonerateInvoice(selectedInvoice)}
                        disabled={isUpdatingStatus === selectedInvoice.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isUpdatingStatus === selectedInvoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Exonerar Factura
                      </Button>
                    </div>
                  )}

                  {selectedInvoice.status === 'EXONERATED' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleUpdateInvoiceStatus(selectedInvoice.id, 'PENDING')}
                        disabled={isUpdatingStatus === selectedInvoice.id}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        {isUpdatingStatus === selectedInvoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Marcar como Pendiente
                      </Button>
                      
                      <Button
                        onClick={() => handleUpdateInvoiceStatus(selectedInvoice.id, 'PAID')}
                        disabled={isUpdatingStatus === selectedInvoice.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingStatus === selectedInvoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Marcar como Pagado
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={() => handleUpdateInvoiceStatus(selectedInvoice.id, 'CANCELLED')}
                    disabled={isUpdatingStatus === selectedInvoice.id}
                    variant="destructive"
                    className="w-full"
                  >
                    {isUpdatingStatus === selectedInvoice.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Cancelar Factura
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Visualización de Factura */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ver Factura</DialogTitle>
              <DialogDescription>
                Detalles completos de la factura {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-6 pt-4">
                {/* Información general */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-lg mb-3">Información de la Factura</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Número:</span>
                          <span>{selectedInvoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Fecha:</span>
                          <span>{new Date(selectedInvoice.createdAt).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Estado:</span>
                          <Badge className={`${
                            selectedInvoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            selectedInvoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            selectedInvoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {getStatusText(selectedInvoice.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold text-lg">${selectedInvoice.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-lg mb-3">Información del Paciente</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Nombre:</span>
                          <span>{selectedInvoice.patient?.name}</span>
                        </div>
                        {selectedInvoice.patient?.patientNumber && (
                          <div className="flex justify-between">
                            <span className="font-medium">Número:</span>
                            <span>{selectedInvoice.patient.patientNumber}</span>
                          </div>
                        )}
                        {selectedInvoice.patient?.cedula && (
                          <div className="flex justify-between">
                            <span className="font-medium">Cédula:</span>
                            <span>{selectedInvoice.patient.cedula}</span>
                          </div>
                        )}
                        {selectedInvoice.patient?.phone && (
                          <div className="flex justify-between">
                            <span className="font-medium">Teléfono:</span>
                            <span>{selectedInvoice.patient.phone}</span>
                          </div>
                        )}
                        {selectedInvoice.patient?.nationality && (
                          <div className="flex justify-between">
                            <span className="font-medium">Nacionalidad:</span>
                            <span>{selectedInvoice.patient.nationality}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                <div>
                  <h4 className="font-medium text-lg mb-3">Servicios</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Servicio</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Cantidad</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Precio Unit.</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm">{item.service?.name || 'Servicio'}</td>
                            <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-sm">${item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-sm font-medium">${item.totalPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Información adicional */}
                {selectedInvoice.notes && (
                  <div>
                    <h4 className="font-medium text-lg mb-3">Notas</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm">{selectedInvoice.notes}</p>
                    </div>
                  </div>
                )}

                {/* Información de exoneración */}
                {selectedInvoice.exoneration && (
                  <div>
                    <h4 className="font-medium text-lg mb-3">Información de Exoneración</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Monto Exonerado:</span>
                          <span>${selectedInvoice.exoneration.exoneratedAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                        {selectedInvoice.exoneration.reason && (
                          <div>
                            <span className="font-medium">Motivo:</span>
                            <p className="mt-1">{selectedInvoice.exoneration.reason}</p>
                          </div>
                        )}
                        {selectedInvoice.exoneration.author?.name && (
                          <div className="flex justify-between">
                            <span className="font-medium">Autorizado por:</span>
                            <span>{selectedInvoice.exoneration.author.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handlePrintInvoice(selectedInvoice)}
                    className="flex-1"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Factura
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleEditInvoice(selectedInvoice)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Editar Estado
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Exoneración */}
        <Dialog open={isExonerationDialogOpen} onOpenChange={setIsExonerationDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Exonerar Factura</DialogTitle>
              <DialogDescription>
                Proporciona una razón para exonerar la factura {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-4 pt-4">
                {/* Información de la factura */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Información de la Factura</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Número:</span>
                      <span>{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Paciente:</span>
                      <span>{selectedInvoice.patient?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold">${selectedInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Razón de exoneración */}
                <div className="space-y-2">
                  <Label htmlFor="exoneration-reason" className="text-base font-medium">
                    Razón de Exoneración *
                  </Label>
                  <Textarea
                    id="exoneration-reason"
                    placeholder="Describe la razón por la cual se exonerará esta factura..."
                    value={exonerationReason}
                    onChange={(e) => setExonerationReason(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta información aparecerá en la factura de exoneración.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsExonerationDialogOpen(false)}
                disabled={isCreatingExoneration}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateExoneration}
                disabled={!exonerationReason.trim() || isCreatingExoneration}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingExoneration ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exonerando...
                  </>
                ) : (
                  "Exonerar Factura"
                )}
              </Button>
            </DialogFooter>
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
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                globalStats.totalInvoices
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Del día de hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `$${globalStats.totalFacturado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Facturado hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exonerados</CardTitle>
            <Gift className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                globalStats.exoneradasCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ${globalStats.exoneradasTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} total exonerado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                globalStats.pendientesCount + globalStats.parcialesCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(globalStats.pendientesTotal || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} pendiente
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
              onRegisterPayment={handleRegisterPayment}
              onPrintPaymentReceipt={handlePrintPaymentReceipt}
              onRefetch={refetch}
            />

      {/* Modal de Registro de Pagos */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoiceForPayment}
        onPaymentSuccess={handlePaymentSuccess}
        onPrintReceipt={handlePrintPaymentReceipt}
      />

    </div>
  )
}

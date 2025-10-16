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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  X 
} from 'lucide-react'

// Custom Components
import { InsuranceBillingTable } from '@/components/billing/insurance-billing-table'
import { PatientInsuranceSelector } from '@/components/billing/patient-insurance-selector'
import { getActiveInvoiceDesign, getFormatStyles, getLogoPositionClass } from "@/lib/invoice-design-utils"

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
  phone?: string
  nationality: string
  cedula: string
  patientNumber?: string
  insurance?: {
    name: string
  }
}

interface InvoiceItem {
  serviceId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  service?: {
    name: string
    id: string
  }
}

interface Invoice {
  id: string
  invoiceNumber: string
  patient?: Patient
  items?: InvoiceItem[]
  services?: string[]
  totalAmount: number
  amount?: number
  status: string
  createdAt: string
  date?: string
  insuranceCalculation?: any
  exoneration?: any
}

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [patients, setPatients] = useState<Patient[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const [invoicesPerPage] = useState(50)

  // UI state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isExonerationDialogOpen, setIsExonerationDialogOpen] = useState(false)
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)
  const [isDeletingInvoice, setIsDeletingInvoice] = useState<string | null>(null)
  const [isExoneratingInvoice, setIsExoneratingInvoice] = useState<string | null>(null)

  // Form state
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [selectedPatientInsurance, setSelectedPatientInsurance] = useState<string | null>(null)
  const [insuranceCalculation, setInsuranceCalculation] = useState<any>(null)

  // Search state
  const [serviceSearch, setServiceSearch] = useState("")
  const [serviceSearchResults, setServiceSearchResults] = useState(0)
  const [patientSearch, setPatientSearch] = useState("")
  const [patientSearchResults, setPatientSearchResults] = useState(0)
  const [invoiceSearch, setInvoiceSearch] = useState("")

  // Selected items
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [statusTargetInvoice, setStatusTargetInvoice] = useState<Invoice | null>(null)

  // Exoneration form
  const [exonerationReason, setExonerationReason] = useState("")
  const [exonerationAuthCode, setExonerationAuthCode] = useState("")
  const [exonerationNotes, setExonerationNotes] = useState("")

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Effects
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session && !["ADMIN", "BILLING"].includes(session.user.role)) {
      router.push("/dashboard")
      return
    }

    if (session) {
      fetchServices()
      fetchPatients()
      fetchInvoices(currentPage)
    }
  }, [session, status, router])

  // Funciones de paginación
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      fetchInvoices(newPage)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleFirstPage = () => {
    handlePageChange(1)
  }

  const handleLastPage = () => {
    handlePageChange(totalPages)
  }

  // Search Functions
  const searchServices = (services: Service[], searchTerm: string) => {
    // Validar que services sea un array
    if (!Array.isArray(services)) {
      console.warn("searchServices recibió datos que no son un array:", services)
      return []
    }

    if (!searchTerm.trim()) {
      return services
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return services.filter(service => {
      // Búsqueda por nombre
      const nameMatch = service.name && service.name.toLowerCase().includes(searchLower)
      
      // Búsqueda por categoría
      const categoryMatch = service.category && service.category.toLowerCase().includes(searchLower)
      
      // Búsqueda por descripción
      const descriptionMatch = service.description && service.description.toLowerCase().includes(searchLower)
      
      // Búsqueda por precio (formato numérico)
      const priceMatch = service.price && service.price.toString().includes(searchTerm)
      
      // Búsqueda por ID del servicio
      const idMatch = service.id && service.id.toLowerCase().includes(searchLower)
      
      return nameMatch || categoryMatch || descriptionMatch || priceMatch || idMatch
    })
  }

  const searchPatients = (patients: Patient[], searchTerm: string) => {
    // Validar que patients sea un array
    if (!Array.isArray(patients)) {
      console.warn("searchPatients recibió datos que no son un array:", patients)
      return []
    }

    if (!searchTerm.trim()) {
      return patients
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return patients.filter(patient => {
      // Búsqueda por nombre
      const nameMatch = patient.name && patient.name.toLowerCase().includes(searchLower)
      
      // Búsqueda por teléfono
      const phoneMatch = patient.phone && (
        patient.phone.includes(searchTerm) ||
        patient.phone.replace(/[\s\-\(\)]/g, '').includes(searchTerm.replace(/[\s\-\(\)]/g, ''))
      )
      
      // Búsqueda por cédula
      const cedulaMatch = patient.cedula && patient.cedula.toLowerCase().includes(searchLower)
      
      // Búsqueda por nacionalidad
      const nationalityMatch = patient.nationality && patient.nationality.toLowerCase().includes(searchLower)
      
      // Búsqueda por número de paciente
      const patientNumberMatch = patient.patientNumber && 
        patient.patientNumber.toLowerCase().includes(searchLower)
      
      return nameMatch || phoneMatch || cedulaMatch || nationalityMatch || patientNumberMatch
    })
  }

  // Filtered data
  const filteredServices = searchServices(services, serviceSearch)
  const filteredPatients = searchPatients(patients, patientSearch)

  // Update search result counters
  useEffect(() => {
    setServiceSearchResults(filteredServices.length)
  }, [filteredServices])

  useEffect(() => {
    setPatientSearchResults(filteredPatients.length)
  }, [filteredPatients])

  // API Functions
  const fetchServices = async () => {
    try {
      console.log("Cargando servicios...")
      const response = await fetch("/api/services?limit=250")
      console.log("Respuesta de servicios:", response.status)
      if (response.ok) {
        const data = await response.json()
        const services = data.services || data // Compatibilidad con formato anterior
        const activeServices = services.filter((service: Service) => service.isActive)
        console.log("Servicios activos cargados:", activeServices.length)
        setServices(activeServices)
      } else {
        console.error("Error al cargar servicios:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error)
    }
  }

  const fetchPatients = async () => {
    try {
      console.log("Cargando pacientes...")
      const response = await fetch("/api/patients")
      console.log("Respuesta de pacientes:", response.status)
      if (response.ok) {
        const data = await response.json()
        // La API devuelve { patients: [...], pagination: {...} }
        const patients = data.patients || data // Compatibilidad con formato anterior
        console.log("Pacientes cargados:", patients.length)
        setPatients(patients)
      } else {
        console.error("Error al cargar pacientes:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error al cargar pacientes:", error)
    }
  }

  const fetchInvoices = async (page = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Cargando facturas...")
      const response = await fetch(`/api/invoices?page=${page}&limit=${invoicesPerPage}`)
      console.log("Respuesta de facturas:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Facturas cargadas:", data.invoices.length)
        setInvoices(data.invoices)
        
        // Actualizar estado de paginación
        setCurrentPage(data.pagination.page)
        setTotalPages(data.pagination.totalPages)
        setTotalInvoices(data.pagination.total)
        console.log("Paginación:", data.pagination)
      } else {
        const errorText = await response.text()
        console.error("Error al cargar facturas:", response.status, response.statusText, errorText)
        setError(`Error al cargar facturas: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error al cargar facturas:", error)
      setError("Error de conexión al cargar facturas")
    } finally {
      setIsLoading(false)
    }
  }

  // Service Management Functions
  const addService = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName)
    if (service) {
      setSelectedServices([...selectedServices, { 
        ...service, 
        uniqueId: Date.now() // Para el frontend, mantenemos el id original de la DB
      }])
      setServiceSearch("") // Limpiar búsqueda después de agregar
    }
  }

  const removeService = (uniqueId: number) => {
    setSelectedServices(selectedServices.filter(s => s.uniqueId !== uniqueId))
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0)
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedServices.length === 0 || !selectedPatientId) {
      return
    }

    setIsLoading(true)
    try {
      // Usar el cálculo de seguros si está disponible, sino usar el total normal
      const totalAmount = insuranceCalculation?.items?.reduce((sum: number, item: any) => sum + (item.patientPays || 0), 0) || calculateTotal()
      
      const invoiceData = {
        patientId: selectedPatientId,
        items: selectedServices.map(service => ({
          serviceId: service.id,
          quantity: 1,
          unitPrice: service.price,
          totalPrice: service.price
        })),
        totalAmount,
        insuranceCalculation: insuranceCalculation || null
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setSelectedServices([])
        setSelectedPatientId("")
        setServiceSearch("")
        setInsuranceCalculation(null)
        setSelectedPatientInsurance(null)
        fetchInvoices() // Recargar facturas
      } else {
        const error = await response.json()
        console.error("Error al crear factura:", error)
      }
    } catch (error) {
      console.error("Error de conexión:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      console.log('🔄 Iniciando actualización de estado:', { invoiceId, newStatus })
      setIsUpdatingStatus(invoiceId)
      
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      console.log('📡 Respuesta del servidor:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Error en la respuesta:', error)
        throw new Error(error.error || 'Error al actualizar estado')
      }

      const updatedInvoice = await response.json()
      console.log('✅ Factura actualizada:', updatedInvoice)

      // Recargar facturas
      await fetchInvoices()
      
      // Actualizar también el invoice seleccionado en el modal
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          status: newStatus
        })
      }
      
      // Mostrar mensaje de éxito
      const statusText = {
        'PENDING': 'Pendiente',
        'PAID': 'Pagado',
        'CANCELLED': 'Cancelado',
        'EXONERATED': 'Exonerado'
      }[newStatus] || newStatus
      
      console.log('🎉 Estado actualizado exitosamente a:', statusText)
      alert(`Estado actualizado exitosamente a: ${statusText}`)
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error)
      alert('Error al actualizar estado: ' + (error as Error).message)
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta factura? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setIsDeletingInvoice(invoiceId)
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar factura')
      }

      // Recargar facturas
      await fetchInvoices()
    } catch (error) {
      console.error('Error al eliminar factura:', error)
      alert('Error al eliminar factura: ' + (error as Error).message)
    } finally {
      setIsDeletingInvoice(null)
    }
  }

  const handleExonerateInvoice = (invoiceId: string) => {
    setSelectedInvoice(invoices.find(inv => inv.id === invoiceId) || null)
    setIsExonerationDialogOpen(true)
  }

  const handleConfirmExoneration = async () => {
    if (!selectedInvoice || !exonerationReason.trim()) {
      alert('Por favor, ingresa una razón para la exoneración')
      return
    }

    setIsExoneratingInvoice(selectedInvoice.id)
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/exonerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: exonerationReason,
          authorizationCode: exonerationAuthCode || undefined,
          notes: exonerationNotes || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exonerar factura')
      }

      const result = await response.json()
      
      // Recargar facturas
      await fetchInvoices()
      
      // Limpiar formulario
      setExonerationReason("")
      setExonerationAuthCode("")
      setExonerationNotes("")
      setIsExonerationDialogOpen(false)
      setSelectedInvoice(null)
      
      alert(`Factura exonerada exitosamente. Monto exonerado: $${result.exoneration.exoneratedAmount.toFixed(2)}`)
    } catch (error) {
      console.error('Error al exonerar factura:', error)
      alert('Error al exonerar factura: ' + (error as Error).message)
    } finally {
      setIsExoneratingInvoice(null)
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsViewDialogOpen(true)
  }

  const openStatusDialog = (invoice: Invoice) => {
    setStatusTargetInvoice(invoice)
    setIsStatusDialogOpen(true)
  }

  const onUpdateStatusFromDialog = async () => {
    if (!statusTargetInvoice) return
    await handleUpdateStatus(statusTargetInvoice.id, statusTargetInvoice.status)
    setIsStatusDialogOpen(false)
  }


  const handlePrintInvoice = async (invoice: Invoice) => {
    try {
      // Obtener el diseño activo
      const design = await getActiveInvoiceDesign()
      
      // Forzar formato 80MM para terminales térmicas
      const finalDesign = { ...design, format: '80MM' }
      
      // Estilos base según el formato
      const formatStyles = getFormatStyles(finalDesign?.format || '80MM')
      const logoPositionClass = getLogoPositionClass(finalDesign?.logoPosition || 'LEFT')
      
      // Verificar si hay exoneración administrativa (completamente separada de seguros)
      const isExonerated = invoice.exoneration || invoice.status === 'EXONERATED'
      
      // Información de exoneración administrativa
      const exonerationInfo = isExonerated ? {
        reason: invoice.exoneration?.reason || 'Exoneración administrativa',
        authorizationCode: invoice.exoneration?.authorizationCode || null,
        notes: invoice.exoneration?.notes || null,
        originalAmount: invoice.exoneration?.originalAmount || invoice.totalAmount || 0,
        exoneratedAmount: invoice.exoneration?.exoneratedAmount || invoice.totalAmount || 0
      } : null
      
      // Información de seguros (solo si NO está exonerado y hay cálculo de seguros)
      const hasInsurance = invoice.patient?.insurance || invoice.insuranceCalculation
      const insuranceInfo = (invoice.insuranceCalculation && !isExonerated) ? {
        name: invoice.patient?.insurance?.name || invoice.insuranceCalculation.items?.[0]?.insuranceName || 'Seguro Médico',
        coverage: invoice.insuranceCalculation.items?.reduce((sum: number, item: any) => sum + (item.insuranceCovers || 0), 0) || 0,
        patientPays: invoice.insuranceCalculation.items?.reduce((sum: number, item: any) => sum + (item.patientPays || 0), 0) || 0,
        totalBase: invoice.insuranceCalculation.items?.reduce((sum: number, item: any) => sum + (item.basePrice || 0), 0) || 0
      } : null
      
      // Crear contenido HTML para imprimir con el diseño configurado
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
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
                padding: ${finalDesign?.format === '80MM' ? '1mm' : formatStyles.padding};
                font-size: ${formatStyles.fontSize};
                background: white;
              }
              .header { 
                text-align: left; 
                margin-bottom: ${finalDesign?.format === '80MM' ? '10px' : '20px'}; 
              }
              .logo-container {
                display: flex;
                align-items: center;
                ${logoPositionClass === 'justify-center' ? 'justify-content: center;' : ''}
                ${logoPositionClass === 'justify-end' ? 'justify-content: flex-end;' : ''}
                ${logoPositionClass === 'justify-start' ? 'justify-content: flex-start;' : ''}
                gap: 10px;
                margin-bottom: 15px;
              }
              .logo {
                max-height: 40px;
                max-width: 80px;
                object-fit: contain;
              }
              .business-name {
                font-weight: bold;
                font-size: ${finalDesign?.format === '80MM' ? '14px' : '18px'};
                margin: 0;
              }
              .business-info {
                text-align: left;
                margin-bottom: ${finalDesign?.format === '80MM' ? '8px' : '15px'};
                font-size: ${finalDesign?.format === '80MM' ? '10px' : '12px'};
                color: #666;
              }
              .separator {
                border-top: 1px solid #ccc;
                margin: ${finalDesign?.format === '80MM' ? '8px 0' : '15px 0'};
              }
              .invoice-info { 
                margin-bottom: ${finalDesign?.format === '80MM' ? '8px' : '15px'}; 
                font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};
              }
              .invoice-info p {
                margin: ${finalDesign?.format === '80MM' ? '2px 0' : '5px 0'};
              }
              .services-vertical {
                margin: 15px 0;
                font-size: ${finalDesign?.format === '80MM' ? '12px' : '12px'};
              }
              .service-item {
                border: 1px solid #ddd;
                margin-bottom: 8px;
                padding: 8px;
                border-radius: 4px;
                background: #f9f9f9;
              }
              .service-name {
                font-weight: bold;
                font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};
                margin-bottom: 4px;
                color: #333;
              }
              .service-details {
                display: flex;
                justify-content: space-between;
                font-size: ${finalDesign?.format === '80MM' ? '10px' : '11px'};
                color: #666;
              }
              .service-detail {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 60px;
              }
              .service-detail-label {
                font-weight: bold;
                margin-bottom: 2px;
                color: #555;
              }
              .service-detail-value {
                color: #333;
              }
              .insurance-section {
                background: #e8f4fd;
                border: 1px solid #b3d9ff;
                border-radius: 6px;
                padding: 10px;
                margin: 15px 0;
                font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};
              }
              .insurance-header {
                font-weight: bold;
                color: #0066cc;
                margin-bottom: 8px;
                text-align: center;
                font-size: ${finalDesign?.format === '80MM' ? '12px' : '13px'};
              }
              .insurance-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
              }
              .insurance-detail {
                text-align: center;
                flex: 1;
              }
              .insurance-detail-label {
                font-size: ${finalDesign?.format === '80MM' ? '9px' : '10px'};
                color: #666;
                margin-bottom: 2px;
              }
              .insurance-detail-value {
                font-weight: bold;
                color: #333;
                font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};
              }
              .insurance-total {
                border-top: 1px solid #b3d9ff;
                padding-top: 6px;
                margin-top: 6px;
                text-align: center;
                font-weight: bold;
                color: #0066cc;
                font-size: ${finalDesign?.format === '80MM' ? '12px' : '14px'};
              }
              .total { 
                text-align: left; 
                font-weight: bold; 
                font-size: ${finalDesign?.format === '80MM' ? '12px' : '16px'}; 
                margin-top: 15px; 
                border-top: 2px solid #333;
                padding-top: 10px;
              }
              .status { 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: ${finalDesign?.format === '80MM' ? '10px' : '12px'};
                display: inline-block;
              }
              .status-paid { background-color: #d4edda; color: #155724; }
              .status-pending { background-color: #fff3cd; color: #856404; }
              .status-exonerated { background-color: #e7f3ff; color: #0066cc; }
              .custom-message {
                text-align: center;
                margin-top: 20px;
                font-style: italic;
                font-size: ${finalDesign?.format === '80MM' ? '10px' : '12px'};
                color: #666;
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
                ${finalDesign?.logoUrl ? `
                  <div class="logo-container">
                    <img src="${finalDesign.logoUrl}" alt="Logo" class="logo" />
                    <h1 class="business-name">${finalDesign.businessName || 'Sistema de Clínica Médica'}</h1>
                  </div>
                ` : `
                  <h1 class="business-name">${finalDesign?.businessName || 'Sistema de Clínica Médica'}</h1>
                `}
                
                ${(finalDesign?.address || finalDesign?.phone || finalDesign?.taxId) ? `
                  <div class="business-info">
                    ${finalDesign.address ? `<div>${finalDesign.address}</div>` : ''}
                    ${finalDesign.phone ? `<div>Tel: ${finalDesign.phone}</div>` : ''}
                    ${finalDesign.taxId ? `<div>RNC: ${finalDesign.taxId}</div>` : ''}
                  </div>
                ` : ''}
              </div>
              
              <div class="separator"></div>
              
              <div class="invoice-info">
                <p><strong>FACTURA:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>FECHA:</strong> ${new Date(invoice.createdAt || invoice.date || '').toLocaleDateString('es-ES')}</p>
                <p><strong>PACIENTE:</strong> ${invoice.patient?.name || 'N/A'}</p>
                ${hasInsurance ? `<p><strong>SEGURO:</strong> ${invoice.patient?.insurance?.name || 'Seguro Médico'}</p>` : ''}
                <p><strong>ESTADO:</strong> <span class="status status-${(invoice.status || '').toLowerCase()}">${
                  invoice.status === 'PENDING' ? 'Pendiente' : 
                  invoice.status === 'PAID' ? 'Pagado' : 
                  invoice.status === 'EXONERATED' ? 'Exonerado' : 
                  invoice.status === 'CANCELLED' ? 'Cancelado' : invoice.status
                }</span></p>
              </div>
              
              <div class="separator"></div>
              
              <div class="services-vertical">
                <div style="text-align: left; font-weight: bold; margin-bottom: 8px; font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};">
                  DETALLES DE SERVICIOS
                </div>
                ${(invoice.items || invoice.services?.map((service: string) => ({
                  service: {name: service}, 
                  quantity: 1, 
                  unitPrice: (invoice.amount || invoice.totalAmount) / (invoice.services?.length || 1),
                  totalPrice: (invoice.amount || invoice.totalAmount) / (invoice.services?.length || 1)
                })) || []).map((item: any, index: number) => {
                  // Obtener información de seguro para este servicio si está disponible
                  const serviceInsuranceInfo = invoice.insuranceCalculation?.items?.find((insItem: any) => 
                    insItem.serviceId === item.serviceId || insItem.serviceName === item.service?.name
                  )
                  
                  if (finalDesign?.format === '80MM') {
                    // Formato ultra-compacto para 80MM
                    return `
                      <div style="border: 1px solid #ddd; padding: 6px; background: #f9f9f9; border-radius: 4px; margin-bottom: 4px; font-size: 10px;">
                        <div style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-bottom: 2px; font-size: 10px;">
                          ${item.service?.name || 'N/A'}
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #666; margin-bottom: 2px; font-size: 9px;">
                          <span>Cant:${item.quantity || 1}</span>
                          <span>Precio:$${(item.unitPrice || 0).toFixed(0)}</span>
                          ${serviceInsuranceInfo ? `<span>Cob:${Math.round(serviceInsuranceInfo.coveragePercent || 0)}%</span>` : ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 2px; font-size: 9px;">
                          ${serviceInsuranceInfo ? `
                            <span>Seg:$${serviceInsuranceInfo.insuranceCovers.toFixed(0)}</span>
                            <span style="color: #dc2626;">Pac:$${serviceInsuranceInfo.patientPays.toFixed(0)}</span>
                          ` : `
                            <span>Total:</span>
                            <span style="color: #dc2626;">$${(item.totalPrice || item.unitPrice || 0).toFixed(0)}</span>
                          `}
                        </div>
                      </div>
                    `
                  } else {
                    // Formato estándar para Letter
                    return `
                      <div style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9; border-radius: 4px; margin-bottom: 8px;">
                        <div style="font-weight: bold; margin-bottom: 4px; font-size: 12px;">
                          ${item.service?.name || 'N/A'}
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-bottom: 4px;">
                          <span>Cantidad: ${item.quantity || 1}</span>
                          <span>Precio Unit: $${(item.unitPrice || 0).toFixed(2)}</span>
                          ${serviceInsuranceInfo ? `<span>Cobertura: ${Math.round(serviceInsuranceInfo.coveragePercent || 0)}%</span>` : ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 4px; font-size: 11px;">
                          ${serviceInsuranceInfo ? `
                            <span>Seguro Cubre: $${serviceInsuranceInfo.insuranceCovers.toFixed(2)}</span>
                            <span style="color: #dc2626;">Paciente Paga: $${serviceInsuranceInfo.patientPays.toFixed(2)}</span>
                          ` : `
                            <span>Total:</span>
                            <span style="color: #dc2626;">$${(item.totalPrice || item.unitPrice || 0).toFixed(2)}</span>
                          `}
                        </div>
                      </div>
                    `
                  }
                }).join('')}
              </div>
              
              ${exonerationInfo ? `
                <div class="separator"></div>
                <div style="background: #e8f4fd; border: 1px solid #b3d9ff; border-radius: 6px; padding: 10px; margin: 15px 0; font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};">
                  <div style="font-weight: bold; color: #dc2626; margin-bottom: 8px; text-align: center; font-size: ${finalDesign?.format === '80MM' ? '12px' : '13px'};">
                    INFORMACIÓN DE EXONERACIÓN
                  </div>
                  <div style="text-align: center; padding: 15px 0;">
                    <div style="font-size: ${finalDesign?.format === '80MM' ? '14px' : '16px'}; color: #dc2626; font-weight: bold; margin-bottom: 8px;">
                      ✓ EXONERADO ADMINISTRATIVAMENTE
                    </div>
                    <div style="font-size: ${finalDesign?.format === '80MM' ? '10px' : '12px'}; color: #666; margin-bottom: 4px;">
                      Razón: ${exonerationInfo.reason}
                    </div>
                    ${exonerationInfo.authorizationCode ? `
                      <div style="font-size: ${finalDesign?.format === '80MM' ? '10px' : '12px'}; color: #666; margin-bottom: 4px;">
                        Código: ${exonerationInfo.authorizationCode}
                      </div>
                    ` : ''}
                    ${exonerationInfo.notes ? `
                      <div style="font-size: ${finalDesign?.format === '80MM' ? '9px' : '11px'}; color: #666; font-style: italic;">
                        ${exonerationInfo.notes}
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : insuranceInfo ? `
                <div class="separator"></div>
                <div style="background: #e8f4fd; border: 1px solid #b3d9ff; border-radius: 6px; padding: 10px; margin: 15px 0; font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};">
                  <div style="font-weight: bold; color: #0066cc; margin-bottom: 8px; text-align: center; font-size: ${finalDesign?.format === '80MM' ? '12px' : '13px'};">
                    DESGLOSE DE SEGURO MÉDICO
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <div style="text-align: center; flex: 1;">
                      <div style="font-size: ${finalDesign?.format === '80MM' ? '9px' : '10px'}; color: #666; margin-bottom: 2px;">Total Base</div>
                      <div style="font-weight: bold; color: #333; font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};">$${insuranceInfo.totalBase.toFixed(2)}</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                      <div style="font-size: ${finalDesign?.format === '80MM' ? '9px' : '10px'}; color: #666; margin-bottom: 2px;">Seguro Cubre</div>
                      <div style="font-weight: bold; color: #333; font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};">$${insuranceInfo.coverage.toFixed(2)}</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                      <div style="font-size: ${finalDesign?.format === '80MM' ? '9px' : '10px'}; color: #666; margin-bottom: 2px;">Paciente Paga</div>
                      <div style="font-weight: bold; color: #333; font-size: ${finalDesign?.format === '80MM' ? '11px' : '12px'};">$${insuranceInfo.patientPays.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style="border-top: 1px solid #b3d9ff; padding-top: 6px; margin-top: 6px; text-align: center; font-weight: bold; color: #0066cc; font-size: ${finalDesign?.format === '80MM' ? '12px' : '14px'};">
                    Total a Pagar: $${insuranceInfo.patientPays.toFixed(2)}
                  </div>
                </div>
              ` : ''}
              
              <div class="separator"></div>
              
              <div class="total">
                ${exonerationInfo ? `
                  <div style="text-align: center; padding: 15px 0;">
                    <div style="font-size: ${finalDesign?.format === '80MM' ? '14px' : '16px'}; color: #dc2626; font-weight: bold; margin-bottom: 8px;">
                      ✓ EXONERADO ADMINISTRATIVAMENTE
                    </div>
                    <div style="font-size: ${finalDesign?.format === '80MM' ? '12px' : '14px'}; color: #666; margin-bottom: 4px;">
                      Total Original: $${exonerationInfo.originalAmount.toFixed(2)}
                    </div>
                    <div style="font-size: ${finalDesign?.format === '80MM' ? '12px' : '14px'}; color: #dc2626; font-weight: bold;">
                      TOTAL A PAGAR: $0.00
                    </div>
                  </div>
                ` : insuranceInfo ? `
                  <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: ${finalDesign?.format === '80MM' ? '12px' : '14px'}; margin-bottom: 8px;">
                    <span>TOTAL BASE:</span>
                    <span>$${insuranceInfo.totalBase.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: ${finalDesign?.format === '80MM' ? '10px' : '12px'}; color: #666; margin-bottom: 4px;">
                    <span>Seguro cubre:</span>
                    <span>$${insuranceInfo.coverage.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: ${finalDesign?.format === '80MM' ? '14px' : '16px'}; color: #0066cc; border-top: 2px solid #333; padding-top: 8px;">
                    <span>TOTAL A PAGAR:</span>
                    <span>$${insuranceInfo.patientPays.toFixed(2)}</span>
                  </div>
                ` : `
                  <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: ${finalDesign?.format === '80MM' ? '12px' : '16px'}; border-top: 2px solid #333; padding-top: 10px;">
                    <span>TOTAL:</span>
                    <span>$${(invoice.totalAmount || invoice.amount || 0).toFixed(2)}</span>
                  </div>
                `}
              </div>
              
              ${finalDesign?.customMessage ? `
                <div class="separator"></div>
                <div style="text-align: center; margin-top: 15px;">
                  <p style="font-style: italic; font-size: ${finalDesign?.format === '80MM' ? '8px' : '10px'}; color: #666;">
                    ${finalDesign?.customMessage || ''}
                  </p>
                </div>
              ` : ''}
              
              <div class="separator"></div>
              <div style="text-align: center; margin-top: 15px;">
                <p style="font-size: ${finalDesign?.format === '80MM' ? '7px' : '9px'}; color: #999;">
                  Gracias por su preferencia
                </p>
                <p style="font-size: ${finalDesign?.format === '80MM' ? '7px' : '9px'}; color: #999;">
                  ${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                }
              }
            </script>
          </body>
        </html>
      `
      
      // Abrir ventana nueva para imprimir
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
      }
    } catch (error) {
      console.error('Error al generar factura:', error)
      // Fallback al diseño original si hay error
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Factura ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-info { margin-bottom: 20px; }
              .services-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .services-table th, .services-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .services-table th { background-color: #f5f5f5; }
              .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
              .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
              .status-paid { background-color: #d4edda; color: #155724; }
              .status-pending { background-color: #fff3cd; color: #856404; }
              .status-exonerated { background-color: #e7f3ff; color: #0066cc; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Sistema de Clínica Médica</h1>
              <h2>Factura ${invoice.invoiceNumber}</h2>
            </div>
            
            <div class="invoice-info">
              <p><strong>Paciente:</strong> ${invoice.patient?.name || 'N/A'}</p>
              <p><strong>Fecha:</strong> ${new Date(invoice.createdAt || invoice.date || '').toLocaleDateString('es-ES')}</p>
              <p><strong>Estado:</strong> <span class="status status-${(invoice.status || '').toLowerCase()}">${
                invoice.status === 'PENDING' ? 'Pendiente' : 
                invoice.status === 'PAID' ? 'Pagado' : 
                invoice.status === 'EXONERATED' ? 'Exonerado' : 
                invoice.status === 'CANCELLED' ? 'Cancelado' : invoice.status
              }</span></p>
            </div>
            
            <table class="services-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items || invoice.services?.map((service: string) => ({
                  service: {name: service}, 
                  quantity: 1, 
                  unitPrice: (invoice.amount || invoice.totalAmount) / (invoice.services?.length || 1),
                  totalPrice: (invoice.amount || invoice.totalAmount) / (invoice.services?.length || 1)
                })) || []).map((item: any) => `
                  <tr>
                    <td>${item.service?.name || 'N/A'}</td>
                    <td>${item.quantity || 1}</td>
                    <td>$${(item.unitPrice || 0).toFixed(2)}</td>
                    <td>$${(item.totalPrice || item.unitPrice || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <p>Total: $${(invoice.totalAmount || invoice.amount || 0).toFixed(2)}</p>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                }
              }
            </script>
          </body>
        </html>
      `
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
      }
    }
  }

  // Memoized data
  const memoizedServices = useMemo(() => 
    selectedServices.map(service => ({
      serviceId: service.id,
      quantity: 1,
      unitPrice: service.price
    })), [selectedServices]
  )

  // Utility Functions
  const getStatusColor = (invoice: Invoice) => {
    // Si es una factura exonerada (basada en el cálculo de seguros o exoneración)
    if (invoice.insuranceCalculation?.isExonerated || invoice.exoneration) {
      return "bg-blue-100 text-blue-800 border-blue-200"
    }
    
    switch (invoice.status) {
      case "PAID":
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "PENDING":
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "EXONERATED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "CANCELLED":
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const calculateStats = () => {
    const totalRevenue = invoices.reduce((sum, invoice) => {
      // Si tiene cálculo de seguros, usar el monto base
      if (invoice.insuranceCalculation?.items) {
        return sum + invoice.insuranceCalculation.items.reduce((itemSum: number, item: any) => itemSum + (item.basePrice || 0), 0)
      }
      return sum + invoice.totalAmount
    }, 0)
    
    const pendingInvoices = invoices.filter(invoice => invoice.status === "PENDING")
    const exoneratedInvoices = invoices.filter(invoice => 
      invoice.status === "EXONERATED" || 
      (invoice.insuranceCalculation?.items?.reduce((sum: number, item: any) => sum + (item.patientPays || 0), 0) === 0) || 
      invoice.exoneration
    )
    
    const pendingTotal = pendingInvoices.reduce((sum, invoice) => {
      // Si tiene cálculo de seguros, usar el monto que paga el paciente
      if (invoice.insuranceCalculation?.items) {
        return sum + invoice.insuranceCalculation.items.reduce((itemSum: number, item: any) => itemSum + (item.patientPays || 0), 0)
      }
      return sum + invoice.totalAmount
    }, 0)
    
    const exoneratedTotal = exoneratedInvoices.reduce((sum, invoice) => {
      // Si tiene exoneración, usar el monto original exonerado
      if (invoice.exoneration) {
        return sum + invoice.exoneration.originalAmount
      }
      // Si es exonerada por cálculo de seguros, usar el monto base
      if (invoice.insuranceCalculation?.items) {
        return sum + invoice.insuranceCalculation.items.reduce((itemSum: number, item: any) => itemSum + (item.basePrice || 0), 0)
      }
      return sum + invoice.totalAmount
    }, 0)

    return {
      totalRevenue,
      pendingCount: pendingInvoices.length,
      pendingTotal,
      exoneratedCount: exoneratedInvoices.length,
      exoneratedTotal
    }
  }

  // Filter invoices by search (búsqueda local para compatibilidad)
  const filteredInvoices = invoices.filter(invoice => {
    if (!invoiceSearch) return true
    
    const searchLower = invoiceSearch.toLowerCase()
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      invoice.patient?.name?.toLowerCase().includes(searchLower) ||
      invoice.items?.some((item: InvoiceItem) => 
        item.service?.name?.toLowerCase().includes(searchLower)
      )
    )
  })

  // Early returns for loading and auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
    return <div>Acceso denegado. Solo el personal de facturación puede acceder a este módulo.</div>
  }

  return (
    <div className="space-y-6 w-full">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null)
                      fetchInvoices()
                    }}
                    className="ml-3 bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">
            Gestionar facturas e información de facturación
          </p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/reports/exonerations')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Reportes de Exoneraciones
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
                <DialogTitle>Crear Nueva Factura</DialogTitle>
                <DialogDescription>
                  Generar una nueva factura para servicios del paciente.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice}>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right mt-2">Paciente</Label>
                    <div className="col-span-3 space-y-3">
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nombre, teléfono, email..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="pl-10 pr-4"
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-40 overflow-y-auto border rounded-lg">
                        {filteredPatients.length > 0 ? (
                          filteredPatients.map((patient) => (
                            <div 
                              key={patient.id} 
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                              onClick={() => setSelectedPatientId(patient.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">{patient.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {patient.patientNumber}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {patient.phone && (
                                      <span className="text-xs text-gray-500">{patient.phone}</span>
                                    )}
                                    {patient.cedula && (
                                      <span className="text-xs text-gray-500">Cédula: {patient.cedula}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            <div className="flex flex-col items-center space-y-2">
                              <FileText className="h-6 w-6 text-muted-foreground/50" />
                              <div className="text-sm font-medium">No hay pacientes disponibles</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedPatientId && (
                        <div className="border rounded-lg p-3 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-sm text-blue-900">Paciente seleccionado:</h4>
                              <div className="text-sm text-blue-700">
                                {patients.find(p => p.id === selectedPatientId)?.name}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPatientId("")}
                              className="h-6 w-6 p-0 text-blue-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

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
                  {selectedPatientId && (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <div className="text-right pt-2">
                        <Label>Seguro Médico</Label>
                      </div>
                      <div className="col-span-3 space-y-3">
                        <PatientInsuranceSelector
                          patientId={selectedPatientId}
                          currentInsuranceId={selectedPatientInsurance || undefined}
                          onInsuranceChange={setSelectedPatientInsurance}
                        />
                        
                        {/* Opción de sin seguro */}
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="no-insurance"
                              checked={!selectedPatientInsurance}
                              onChange={() => setSelectedPatientInsurance(null)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="no-insurance" className="text-sm text-gray-700 cursor-pointer">
                              Sin cobertura de seguro
                            </label>
                          </div>
                        </div>

                        {/* Mostrar seguro seleccionado */}
                        {selectedPatientInsurance && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-green-800">
                                <span className="font-medium">Seguro seleccionado:</span>
                                <span className="ml-1">
                                  {patients.find(p => p.id === selectedPatientId)?.insurance?.name || 'Seguro activo'}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPatientInsurance(null)}
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPatientId && selectedServices.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
                      <InsuranceBillingTable
                        patientId={selectedPatientId}
                        services={memoizedServices}
                        selectedInsuranceId={selectedPatientInsurance}
                        onCalculationChange={setInsuranceCalculation}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter className="sticky bottom-0 bg-white z-10 border-t pt-4 mt-6">
                  <Button type="submit" disabled={selectedServices.length === 0 || !selectedPatientId || isLoading}>
                    {isLoading ? (
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${calculateStats().totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.length} facturas en total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas por Cobrar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateStats().pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              ${calculateStats().pendingTotal.toFixed(2)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exoneradas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {calculateStats().exoneratedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              ${calculateStats().exoneratedTotal.toFixed(2)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div className="flex-1">
              <CardTitle>Historial de Facturas</CardTitle>
              <CardDescription>
                Todas las facturas generadas y su estado de pago
              </CardDescription>
            </div>
            <div className="w-80 flex-shrink-0">
              <Input
                placeholder="Buscar por ID, paciente o servicio..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Factura</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{invoice.patient?.name || 'N/A'}</div>
                          {invoice.patient?.insurance && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {invoice.patient.insurance.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {invoice.items?.map((item: InvoiceItem, index: number) => (
                            <div key={index} className="text-sm">
                              {item.service?.name}
                            </div>
                          )) || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${invoice.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={`${getStatusColor(invoice)} cursor-pointer`}
                            onClick={() => openStatusDialog(invoice)}
                            title="Cambiar estado"
                          >
                            {invoice.exoneration || invoice.insuranceCalculation?.isExonerated ? 'Exonerado' :
                             invoice.status === 'PENDING' ? 'Pendiente' : 
                             invoice.status === 'PAID' ? 'Pagado' : 
                             invoice.status === 'EXONERATED' ? 'Exonerado' : 
                             invoice.status === 'CANCELLED' ? 'Cancelado' : invoice.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="Ver factura"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePrintInvoice(invoice)}
                            title="Imprimir factura"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {session?.user.role === 'ADMIN' && (
                            <>
                              {invoice.status === 'PENDING' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleExonerateInvoice(invoice.id)}
                                  disabled={isExoneratingInvoice === invoice.id}
                                  title="Exonerar factura (100% descuento)"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {isExoneratingInvoice === invoice.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Gift className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                disabled={isDeletingInvoice === invoice.id}
                                title="Eliminar factura"
                                className="text-red-600 hover:text-red-700"
                              >
                                {isDeletingInvoice === invoice.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {invoiceSearch ? 'No se encontraron facturas que coincidan con la búsqueda' : 'No hay facturas registradas'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * invoicesPerPage) + 1} a {Math.min(currentPage * invoicesPerPage, totalInvoices)} de {totalInvoices} facturas
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFirstPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  Primera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Siguiente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Última
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Factura</DialogTitle>
            <DialogDescription>
              {statusTargetInvoice ? `Cambiar el estado de la factura ${statusTargetInvoice.invoiceNumber} para ${statusTargetInvoice.patient?.name || ''}` : ''}
            </DialogDescription>
          </DialogHeader>
          {statusTargetInvoice && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  value={statusTargetInvoice.status}
                  onChange={(e) => setStatusTargetInvoice({ ...statusTargetInvoice, status: e.target.value })}
                  className="w-48 h-9 px-2 border border-gray-300 rounded"
                >
                  <option value="PENDING">Programada/Pendiente</option>
                  <option value="PAID">Pagado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="EXONERATED">Exonerado</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancelar</Button>
                <Button onClick={onUpdateStatusFromDialog} disabled={isUpdatingStatus === statusTargetInvoice.id}>
                  {isUpdatingStatus === statusTargetInvoice.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Estado'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
            <DialogDescription>
              Información completa de la factura {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID de Factura</Label>
                  <p className="font-semibold">{selectedInvoice.invoiceNumber || selectedInvoice.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Paciente</Label>
                  <p className="font-semibold">{selectedInvoice.patient?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fecha</Label>
                  <p>{new Date(selectedInvoice.createdAt || selectedInvoice.date || '').toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Estado</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(selectedInvoice)}>
                      {selectedInvoice.exoneration || selectedInvoice.insuranceCalculation?.isExonerated ? 'Exonerado' :
                       selectedInvoice.status === 'PENDING' ? 'Pendiente' : 
                       selectedInvoice.status === 'PAID' ? 'Pagado' : 
                       selectedInvoice.status === 'EXONERATED' ? 'Exonerado' : 
                       selectedInvoice.status === 'CANCELLED' ? 'Cancelado' : selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-2 block">Servicios</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedInvoice.items || selectedInvoice.services?.map((service: string) => ({
                        serviceId: '',
                        service: {name: service, id: ''}, 
                        quantity: 1, 
                        unitPrice: (selectedInvoice.amount || selectedInvoice.totalAmount) / (selectedInvoice.services?.length || 1),
                        totalPrice: (selectedInvoice.amount || selectedInvoice.totalAmount) / (selectedInvoice.services?.length || 1)
                      })) || []).map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.service?.name || 'N/A'}</TableCell>
                          <TableCell>{item.quantity || 1}</TableCell>
                          <TableCell>${(item.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell>${(item.totalPrice || item.unitPrice || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-blue-600">${(selectedInvoice.totalAmount || selectedInvoice.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => selectedInvoice && handlePrintInvoice(selectedInvoice)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exoneration Dialog */}
      <Dialog open={isExonerationDialogOpen} onOpenChange={setIsExonerationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Exonerar Factura</DialogTitle>
            <DialogDescription>
              Exonerar factura {selectedInvoice?.invoiceNumber} - {selectedInvoice?.patient?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Detalles de la Factura</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Número:</span> {selectedInvoice?.invoiceNumber}
                </div>
                <div>
                  <span className="font-medium">Paciente:</span> {selectedInvoice?.patient?.name}
                </div>
                <div>
                  <span className="font-medium">Monto Original:</span> ${selectedInvoice?.totalAmount?.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Monto a Exonerar:</span> ${selectedInvoice?.totalAmount?.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="exoneration-reason">Razón de Exoneración *</Label>
                <Input
                  id="exoneration-reason"
                  value={exonerationReason}
                  onChange={(e) => setExonerationReason(e.target.value)}
                  placeholder="Ej: Exención por situación económica, emergencia médica, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="exoneration-auth-code">Código de Autorización</Label>
                <Input
                  id="exoneration-auth-code"
                  value={exonerationAuthCode}
                  onChange={(e) => setExonerationAuthCode(e.target.value)}
                  placeholder="Código de autorización (opcional)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="exoneration-notes">Notas Adicionales</Label>
                <Textarea
                  id="exoneration-notes"
                  value={exonerationNotes}
                  onChange={(e) => setExonerationNotes(e.target.value)}
                  placeholder="Notas adicionales sobre la exoneración"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Confirmación Requerida
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Esta acción aplicará un descuento del 100% a la factura y la marcará como pagada. Esta acción no se puede deshacer.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsExonerationDialogOpen(false)
                setExonerationReason("")
                setExonerationAuthCode("")
                setExonerationNotes("")
                setSelectedInvoice(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmExoneration}
              disabled={isExoneratingInvoice === selectedInvoice?.id || !exonerationReason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExoneratingInvoice === selectedInvoice?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exonerando...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Confirmar Exoneración
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

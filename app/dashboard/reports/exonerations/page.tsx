"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  DollarSign, 
  FileText,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react'
import { toast } from "sonner"

interface Exoneration {
  id: string
  originalAmount: number
  exoneratedAmount: number
  reason: string
  authorizationCode?: string
  notes?: string
  isPrinted: boolean
  printedAt?: string
  createdAt: string
  invoice: {
    id: string
    invoiceNumber: string
    patient: {
      id: string
      name: string
      email: string
    }
    items: Array<{
      id: string
      quantity: number
      unitPrice: number
      totalPrice: number
      service: {
        id: string
        name: string
      }
    }>
  }
  author: {
    id: string
    name: string
  }
}

interface ExonerationsSummary {
  totalExonerated: number
  totalCount: number
  printedCount: number
  pendingPrintCount: number
}

export default function ExonerationsReportPage() {
  const { data: session, status } = useSession()
  const [exonerations, setExonerations] = useState<Exoneration[]>([])
  const [summary, setSummary] = useState<ExonerationsSummary>({
    totalExonerated: 0,
    totalCount: 0,
    printedCount: 0,
    pendingPrintCount: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [includePrinted, setIncludePrinted] = useState(true)
  const [isMarkingPrinted, setIsMarkingPrinted] = useState<string | null>(null)
  const router = useRouter()

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
      fetchExonerations()
    }
  }, [session, status, router])

  const fetchExonerations = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (includePrinted) params.append("includePrinted", "true")

      const response = await fetch(`/api/exonerations?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setExonerations(data.exonerations)
        setSummary(data.summary)
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al cargar exoneraciones")
      }
    } catch (error) {
      console.error("Error al cargar exoneraciones:", error)
      toast.error("Error al cargar exoneraciones")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsPrinted = async (exonerationId: string) => {
    setIsMarkingPrinted(exonerationId)
    try {
      const response = await fetch(`/api/exonerations/${exonerationId}/mark-printed`, {
        method: "POST"
      })

      if (response.ok) {
        toast.success("Exoneración marcada como impresa")
        fetchExonerations()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al marcar como impresa")
      }
    } catch (error) {
      console.error("Error al marcar como impresa:", error)
      toast.error("Error al marcar como impresa")
    } finally {
      setIsMarkingPrinted(null)
    }
  }

  const handlePrintExoneration = async (exoneration: Exoneration) => {
    try {
      // Crear contenido HTML para imprimir
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Comprobante de Exoneración - ${exoneration.invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #1f2937; }
              .subtitle { font-size: 16px; color: #6b7280; margin-top: 5px; }
              .section { margin-bottom: 20px; }
              .section-title { font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 10px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
              .info-item { margin-bottom: 8px; }
              .info-label { font-weight: bold; color: #4b5563; }
              .info-value { color: #1f2937; }
              .amount { font-size: 20px; font-weight: bold; color: #dc2626; }
              .reason { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
              .exonerated-badge { background-color: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">COMPROBANTE DE EXONERACIÓN</div>
              <div class="subtitle">Clínica Médica</div>
            </div>

            <div class="section">
              <div class="section-title">Información de la Factura</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Número de Factura:</span><br>
                  <span class="info-value">${exoneration.invoice.invoiceNumber}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fecha de Exoneración:</span><br>
                  <span class="info-value">${new Date(exoneration.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Paciente:</span><br>
                  <span class="info-value">${exoneration.invoice.patient.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Autorizado por:</span><br>
                  <span class="info-value">${exoneration.author.name}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Detalles de la Exoneración</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Monto Original:</span><br>
                  <span class="info-value">$${exoneration.originalAmount.toFixed(2)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Monto Exonerado:</span><br>
                  <span class="amount">$${exoneration.exoneratedAmount.toFixed(2)}</span>
                </div>
                ${exoneration.authorizationCode ? `
                <div class="info-item">
                  <span class="info-label">Código de Autorización:</span><br>
                  <span class="info-value">${exoneration.authorizationCode}</span>
                </div>
                ` : ''}
              </div>
            </div>

            <div class="reason">
              <div class="info-label">Razón de la Exoneración:</div>
              <div class="info-value">${exoneration.reason}</div>
              ${exoneration.notes ? `
                <div style="margin-top: 10px;">
                  <div class="info-label">Notas Adicionales:</div>
                  <div class="info-value">${exoneration.notes}</div>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">Servicios Exonerados</div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Servicio</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">Cantidad</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Precio Unit.</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${exoneration.invoice.items.map(item => `
                    <tr>
                      <td style="padding: 8px; border: 1px solid #d1d5db;">${item.service.name}</td>
                      <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${item.quantity}</td>
                      <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${item.unitPrice.toFixed(2)}</td>
                      <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">$${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>Este comprobante certifica que la factura ${exoneration.invoice.invoiceNumber} ha sido exonerada en su totalidad.</p>
              <p>Impreso el ${new Date().toLocaleString('es-ES')}</p>
            </div>
          </body>
        </html>
      `

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }

      // Marcar como impresa
      await handleMarkAsPrinted(exoneration.id)
    } catch (error) {
      console.error("Error al imprimir exoneración:", error)
      toast.error("Error al imprimir exoneración")
    }
  }

  const filteredExonerations = exonerations.filter(exoneration => {
    const matchesSearch = 
      exoneration.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exoneration.invoice.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exoneration.reason.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
    return <div>Acceso denegado. Solo administradores y personal de facturación pueden ver este reporte.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Exoneraciones</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de facturas exoneradas
          </p>
        </div>
        <Button onClick={fetchExonerations} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exonerado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.totalExonerated.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exoneraciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impresas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.printedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Imprimir</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.pendingPrintCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Número de factura, paciente o razón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="includePrinted">Incluir Impresas</Label>
              <Select value={includePrinted.toString()} onValueChange={(value) => setIncludePrinted(value === "true")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Exoneraciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Exoneraciones</CardTitle>
          <CardDescription>
            {filteredExonerations.length} exoneraciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Monto Exonerado</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Autorizado por</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExonerations.map((exoneration) => (
                <TableRow key={exoneration.id}>
                  <TableCell className="font-medium">
                    {exoneration.invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{exoneration.invoice.patient.name}</TableCell>
                  <TableCell className="text-red-600 font-bold">
                    ${exoneration.exoneratedAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {exoneration.reason}
                  </TableCell>
                  <TableCell>{exoneration.author.name}</TableCell>
                  <TableCell>
                    <Badge variant={exoneration.isPrinted ? "default" : "secondary"}>
                      {exoneration.isPrinted ? "Impreso" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(exoneration.createdAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintExoneration(exoneration)}
                        disabled={isMarkingPrinted === exoneration.id}
                        title="Imprimir comprobante"
                      >
                        {isMarkingPrinted === exoneration.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Printer className="h-4 w-4" />
                        )}
                      </Button>
                      {!exoneration.isPrinted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPrinted(exoneration.id)}
                          disabled={isMarkingPrinted === exoneration.id}
                          title="Marcar como impresa"
                        >
                          {isMarkingPrinted === exoneration.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredExonerations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron exoneraciones con los filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

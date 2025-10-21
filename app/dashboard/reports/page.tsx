"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { extractInvoicesFromResponse, extractPatientsFromResponse, extractAppointmentsFromResponse } from "@/lib/api-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, 
  Users, 
  Download, 
  TrendingUp,
  FileSpreadsheet,
  Loader2,
  UserCheck,
  CreditCard,
  Stethoscope,
  Calendar,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  TrendingDown,
  FileText,
  UserCog,
  Building2,
  Clock,
  MapPin,
  Heart
} from 'lucide-react'
import { toast } from "sonner"
import { MetricCard, FinancialMetricCard, PercentageMetricCard, PatientMetricCard } from "@/components/reports/metric-card"
import { LineChart, BarChart, AreaChart } from "@/components/reports/minimal-chart"
import { DataTable, FinancialDataTable, PatientDataTable } from "@/components/reports/data-table"
import { PeriodComparator, FinancialPeriodComparator, TargetPeriodComparator } from "@/components/reports/period-comparator"

// Import diferido en vez de importar siempre
async function importExcelJS() {
  const m = await import('exceljs')
  return m
}

// Función nativa para descargar archivos
function downloadFile(blob: Blob, filename: string) {
  try {
    // Crear URL del blob
    const url = window.URL.createObjectURL(blob)
    
    // Crear elemento de descarga
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    // Agregar al DOM, hacer clic y limpiar
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Liberar memoria
    window.URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Error al descargar archivo:', error)
    
    // Fallback: abrir en nueva ventana
    try {
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      return true
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError)
      return false
    }
  }
}

// === Componentes SVG simples ===
function LineChartSVG({ points, width = 600, height = 220, color = "#2563eb", maxValue, labels = [] as string[] }: { points: number[]; width?: number; height?: number; color?: string; maxValue?: number; labels?: string[] }) {
  const padding = 32
  const w = width
  const h = height
  const n = points.length || 1
  const max = maxValue ?? Math.max(1, ...points)
  const scaleX = (i: number) => padding + (i * (w - padding * 2)) / Math.max(1, n - 1)
  const scaleY = (v: number) => padding + (h - padding * 2) * (1 - (v / (max * 1.1)))
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
  const gridYVals = [0, 0.25, 0.5, 0.75, 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56">
      {/* Grid Y */}
      {gridYVals.map((g, idx) => (
        <line key={idx} x1={padding} x2={w - padding} y1={padding + (h - padding * 2) * g} y2={padding + (h - padding * 2) * g} stroke="#e5e7eb" strokeWidth={1} />
      ))}
      {/* Eje X labels */}
      {labels.map((lab, i) => (
        <text key={i} x={scaleX(i)} y={h - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">{lab}</text>
      ))}
      {/* Línea */}
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
      {/* Puntos */}
      {points.map((v, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(v)} r={3} fill={color} />
      ))}
    </svg>
  )
}

function MultiLineChartSVG({ series, width = 600, height = 220, labels = [] as string[] }: { series: { name: string; color: string; points: number[] }[]; width?: number; height?: number; labels?: string[] }) {
  const padding = 32
  const w = width
  const h = height
  const allPoints = series.flatMap(s => s.points)
  const max = Math.max(1, ...allPoints)
  const scaleX = (i: number) => padding + (i * (w - padding * 2)) / Math.max(1, labels.length - 1)
  const scaleY = (v: number) => padding + (h - padding * 2) * (1 - (v / (max * 1.1)))
  
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56">
      {/* Grid Y */}
      {[0, 0.25, 0.5, 0.75, 1].map((g, idx) => (
        <line key={idx} x1={padding} x2={w - padding} y1={padding + (h - padding * 2) * g} y2={padding + (h - padding * 2) * g} stroke="#e5e7eb" strokeWidth={1} />
      ))}
      {/* Eje X labels */}
      {labels.map((lab, i) => (
        <text key={i} x={scaleX(i)} y={h - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">{lab}</text>
      ))}
      {/* Líneas */}
      {series.map((s, sIdx) => {
        const d = s.points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
        return (
          <g key={sIdx}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} />
            {s.points.map((v, i) => (
              <circle key={i} cx={scaleX(i)} cy={scaleY(v)} r={3} fill={s.color} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

// === Tipos ===
interface Invoice {
  id: string
  invoiceNumber: string
  patientId: string
  userId: string
  totalAmount: number
  status: string
  createdAt: string
  patient?: Patient
  user?: User
  items?: any[]
  exoneration?: {
    reason: string
    authorizationCode?: string
    notes?: string
    originalAmount?: number
    exoneratedAmount?: number
  }
}

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  nationality: string
  cedula: string
  status: string
  createdAt: string
}

interface User {
  id: string
  name: string
  role: string
}

interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string
  status: string
  patient?: Patient
  doctor?: User
}

interface ReportData {
  financial: {
    totalRevenue: number
    paidInvoices: number
    pendingInvoices: number
    partialInvoices: number
    exoneratedInvoices: number
    exoneratedAmount: number
    partialRevenue: number
    partialPendingRevenue: number
    monthlyRevenue: { month: string; revenue: number }[]
    monthlyExonerations: { month: string; count: number; amount: number }[]
    topServices: { name: string; revenue: number; count: number }[]
    exoneratedServices: { name: string; count: number; amount: number }[]
  }
  totals: {
    totalAppointments: number
    activePatients: number
    avgRevenuePerAppointment: number
    exoneratedPercentage: number
    collectionRate: number
  }
  doctorPatients: {
    doctorName: string
    patientCount: number
    appointmentCount: number
    completedAppointments: number
  }[]
  acquisitionTrends: {
    month: string
    newPatients: number
    returningPatients: number
  }[]
  exonerations: {
    totalExonerations: number
    totalExoneratedAmount: number
    exonerationsByReason: { reason: string; count: number; amount: number }[]
    monthlyExonerations: { month: string; count: number; amount: number }[]
  }
  global?: {
    totalInvoices: number
    totalRevenue: number
    totalPaidRevenue: number
    totalPendingRevenue: number
    totalPartialRevenue: number
    totalPartialPendingRevenue: number
    totalExoneratedRevenue: number
    paidInvoices: number
    pendingInvoices: number
    partialInvoices: number
    exoneratedInvoices: number
    activePatients: number
    totalAppointments: number
  }
  periodInfo?: {
    label: string
    startDate: string | null
    endDate: string | null
    months: number
  }
  // Nuevas propiedades para KPIs y comparaciones
  comparison?: {
    current: {
      revenue: number
      appointments: number
      patients: number
    }
    previous: {
      revenue: number
      appointments: number
      patients: number
    }
  }
  patientMetrics?: {
    retentionRate: number
    ltv: number
    noShowRate: number
    conversionRate: number
  }
  agingReport?: {
    current: number
    days31to60: number
    days61to90: number
    over90: number
    total: number
  }
}

// Nuevas interfaces para los reportes adicionales
interface DailySalesData {
  date: string
  summary: {
    totalFacturado: number
    totalFacturas: number
    totalPagado: number
    totalPendiente: number
    totalExonerado: number
    facturasPagadas: number
    facturasPendientes: number
    facturasParciales: number
    facturasExoneradas: number
    montoParcialPagado: number
    montoParcialPendiente: number
  }
  invoices: any[]
  exonerations: any[]
  serviceBreakdown: any[]
  invoicesByStatus: Record<string, { count: number; amount: number }>
}

interface DemographicsData {
  period: {
    startDate: string | null
    endDate: string | null
    groupBy: string
  }
  summary: {
    totalPatients: number
    totalAppointments: number
    totalRevenue: number
    avgAppointmentsPerPatient: string
    avgRevenuePerPatient: string
  }
  groupedData: any
  chartData: any[]
  rawData: any
}

interface InsuranceData {
  period: {
    startDate: string | null
    endDate: string | null
  }
  summary: {
    totalInsurances: number
    totalInsuredPatients: number
    totalInvoicesWithInsurance: number
    totalOriginalAmount: number
    totalPatientPays: number
    totalDiscounts: number
    avgDiscountPerInvoice: number
    savingsPercentage: number
  }
  insuranceReports: any[]
  topServicesByDiscount: any
}

// === Opciones de período ===
const periodOptions = [
  { value: 1, label: "Último mes" },
  { value: 3, label: "Últimos 3 meses" },
  { value: 6, label: "Últimos 6 meses" },
  { value: 12, label: "Último año" },
  { value: 24, label: "Últimos 2 años" }
]

const lastMonthsLabels = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
]

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [dailySalesData, setDailySalesData] = useState<DailySalesData | null>(null)
  const [demographicsData, setDemographicsData] = useState<DemographicsData | null>(null)
  const [insuranceData, setInsuranceData] = useState<InsuranceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("financial")
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [demographicsGroupBy, setDemographicsGroupBy] = useState<string>("age")
  const [dateRange, setDateRange] = useState<{start: string, end: string} | null>(null)
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false)
  const [showGlobalData, setShowGlobalData] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    
    if (session && session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    
    if (session) {
      fetchReportData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, selectedPeriod, useCustomRange, dateRange])

  // Cargar datos específicos según la pestaña activa
  useEffect(() => {
    if (session && activeTab === "daily-sales") {
      fetchDailySalesData()
    } else if (session && activeTab === "demographics") {
      fetchDemographicsData()
    } else if (session && activeTab === "insurance") {
      fetchInsuranceData()
    }
  }, [session, activeTab, selectedDate, demographicsGroupBy])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)

      // Construir URL con parámetros
      let url = '/api/reports/comprehensive?'
      if (useCustomRange && dateRange) {
        url += `startDate=${dateRange.start}&endDate=${dateRange.end}`
      } else {
        url += `period=${selectedPeriod}`
      }

      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error('Error al cargar datos del reporte')

      const data = await response.json()

      // Usar los datos directamente de la nueva API
      setReportData({
        financial: data.financial,
        totals: data.totals,
        doctorPatients: data.doctorPatients,
        acquisitionTrends: data.acquisitionTrends,
        exonerations: data.exonerations,
        global: data.global, // Agregar datos globales
        periodInfo: data.periodInfo // Agregar información del período
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Error al cargar datos del reporte')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDailySalesData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reports/daily-sales?date=${selectedDate}`)
      if (!response.ok) throw new Error('Error al cargar datos de ventas del día')
      const data = await response.json()
      setDailySalesData(data)
    } catch (error) {
      console.error('Error fetching daily sales data:', error)
      toast.error('Error al cargar datos de ventas del día')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDemographicsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reports/demographics?groupBy=${demographicsGroupBy}`)
      if (!response.ok) throw new Error('Error al cargar datos demográficos')
      const data = await response.json()
      setDemographicsData(data)
    } catch (error) {
      console.error('Error fetching demographics data:', error)
      toast.error('Error al cargar datos demográficos')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInsuranceData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reports/insurance')
      if (!response.ok) throw new Error('Error al cargar datos de seguros')
      const data = await response.json()
      setInsuranceData(data)
    } catch (error) {
      console.error('Error fetching insurance data:', error)
      toast.error('Error al cargar datos de seguros')
    } finally {
      setIsLoading(false)
    }
  }

  const exportFullReport = async () => {
    try {
      if (!reportData) {
        toast.error('No hay datos para exportar')
        return
      }

      // Obtener la configuración de diseño para el nombre comercial
      let businessName = "KRONUSMED"
      try {
        const designRes = await fetch('/api/invoice-design?isActive=true')
        if (designRes.ok) {
          const designs = await designRes.json()
          if (designs.length > 0 && designs[0].businessName) {
            businessName = designs[0].businessName
          }
        }
      } catch (error) {
        console.error('Error al obtener configuración de diseño:', error)
      }

      // Obtener todos los datos de reportes
      const startDate = reportData.periodInfo?.startDate || ''
      const endDate = reportData.periodInfo?.endDate || ''
      
      console.log('Fechas del período:', { startDate, endDate, periodInfo: reportData.periodInfo })
      
      const [dailySalesRes, demographicsRes, insuranceRes, kpisRes] = await Promise.all([
        fetch(`/api/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/reports/demographics?groupBy=${demographicsGroupBy}`),
        fetch('/api/reports/insurance'),
        fetch(`/api/reports/kpis?startDate=${startDate}&endDate=${endDate}`)
      ])

      const dailySalesData = dailySalesRes.ok ? await dailySalesRes.json() : null
      const demographicsData = demographicsRes.ok ? await demographicsRes.json() : null
      const insuranceData = insuranceRes.ok ? await insuranceRes.json() : null
      const kpisData = kpisRes.ok ? await kpisRes.json() : null

      const ExcelJS = await importExcelJS()

      const workbook = new ExcelJS.Workbook()
      workbook.creator = businessName
      workbook.lastModifiedBy = 'Sistema de Reportes'
      workbook.created = new Date()
      workbook.modified = new Date()

      // Importar utilidades de Excel
      const {
        createHeaderStyle,
        createSubtitleStyle,
        createDataStyle,
        createCurrencyStyle,
        createPercentStyle,
        createSectionTitleStyle,
        createTotalStyle,
        createPositiveStyle,
        createNegativeStyle,
        createWarningStyle,
        applyCollectionRateFormatting,
        applyGrowthFormatting,
        applyAgingFormatting,
        applyPatientMetricFormatting,
        getColumnWidth,
        getNumberFormat
      } = await import('@/lib/excel-utils')

      // === HOJA DE RESUMEN EJECUTIVO ===
      const resumenSheet = workbook.addWorksheet('Resumen Ejecutivo')

      // === HOJA 1: RESUMEN EJECUTIVO ===
      // Título principal
      resumenSheet.addRow([`🏥 REPORTE COMPLETO - ${businessName}`])
      resumenSheet.getCell('A1').style = createSectionTitleStyle()
      resumenSheet.mergeCells('A1:H1')
      
      resumenSheet.addRow([''])
      resumenSheet.addRow(['📅 Período:', reportData.periodInfo?.label || `Últimos ${selectedPeriod} meses`])
      resumenSheet.addRow(['📊 Fecha de generación:', new Date().toLocaleDateString('es-ES')])
      resumenSheet.addRow([''])

      // === KPIs PRINCIPALES ===
      resumenSheet.addRow(['💰 KPIs PRINCIPALES'])
      resumenSheet.getCell(`A${resumenSheet.rowCount}`).style = createSubtitleStyle()
      resumenSheet.mergeCells(`A${resumenSheet.rowCount}:H${resumenSheet.rowCount}`)
      
      resumenSheet.addRow([''])
      resumenSheet.addRow(['Métrica', 'Valor', 'Tendencia', 'Descripción'])
      resumenSheet.getRow(resumenSheet.rowCount).eachCell((cell, colNumber) => {
        cell.style = createHeaderStyle()
      })
      
      // Calcular tendencias
      const revenueGrowth = reportData.comparison ? 
        ((reportData.comparison.current.revenue - reportData.comparison.previous.revenue) / reportData.comparison.previous.revenue) * 100 : 0
      const collectionRateGrowth = 0 // Se puede calcular si se tiene datos históricos
      
      resumenSheet.addRow([
        'Total Facturado', 
        reportData.financial.totalRevenue, 
        revenueGrowth,
        'Ingresos totales del período'
      ])
      resumenSheet.addRow([
        'Facturas Pagadas', 
        reportData.financial.paidInvoices, 
        '', 
        'Facturas completadas'
      ])
      resumenSheet.addRow([
        'Cuentas por Cobrar', 
        reportData.financial.pendingInvoices + reportData.financial.partialInvoices, 
        '', 
        'Facturas pendientes y parciales'
      ])
      resumenSheet.addRow([
        'Tasa de Cobro', 
        reportData.totals.collectionRate, 
        collectionRateGrowth,
        'Porcentaje de facturas pagadas'
      ])
      resumenSheet.addRow([
        'Pacientes Activos', 
        reportData.totals.activePatients, 
        '', 
        'Base de pacientes actual'
      ])
      resumenSheet.addRow([
        'Total Citas', 
        reportData.totals.totalAppointments, 
        '', 
        'Citas en el período'
      ])
      
      // Aplicar estilos y formato condicional
      for (let i = 6; i <= resumenSheet.rowCount; i++) {
        const row = resumenSheet.getRow(i)
        row.eachCell((cell, colNumber) => {
          cell.style = createDataStyle()
          if (colNumber === 2 && (i >= 6 && i <= 9)) {
            cell.style = { ...createCurrencyStyle(), ...cell.style }
          }
          if (colNumber === 2 && i === 9) {
            cell.style = { ...createPercentStyle(), ...cell.style }
          }
          if (colNumber === 3 && i >= 6) {
            const value = cell.value as number
            if (typeof value === 'number') {
              cell.style = applyGrowthFormatting(value)
            }
          }
        })
      }

      resumenSheet.addRow([''])
      resumenSheet.addRow([''])

      // === NUEVOS KPIs DE CONSULTORIO ===
      if (kpisData) {
        resumenSheet.addRow(['🏥 KPIs DE CONSULTORIO'])
        resumenSheet.getCell(`A${resumenSheet.rowCount}`).style = createSubtitleStyle()
        resumenSheet.mergeCells(`A${resumenSheet.rowCount}:H${resumenSheet.rowCount}`)
        
        resumenSheet.addRow([''])
        resumenSheet.addRow(['Métrica', 'Valor', 'Objetivo', 'Estado'])
        resumenSheet.getRow(resumenSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        resumenSheet.addRow([
          'Tasa de Retención',
          kpisData.patientMetrics?.retentionRate || 0,
          80,
          kpisData.patientMetrics?.retentionRate >= 80 ? '✅ Excelente' : 
          kpisData.patientMetrics?.retentionRate >= 60 ? '⚠️ Regular' : '❌ Bajo'
        ])
        resumenSheet.addRow([
          'LTV Promedio',
          kpisData.patientMetrics?.ltv || 0,
          500,
          kpisData.patientMetrics?.ltv >= 500 ? '✅ Excelente' : 
          kpisData.patientMetrics?.ltv >= 300 ? '⚠️ Regular' : '❌ Bajo'
        ])
        resumenSheet.addRow([
          'Tasa de Ausentismo',
          kpisData.patientMetrics?.noShowRate || 0,
          10,
          kpisData.patientMetrics?.noShowRate <= 10 ? '✅ Excelente' : 
          kpisData.patientMetrics?.noShowRate <= 20 ? '⚠️ Regular' : '❌ Alto'
        ])
        resumenSheet.addRow([
          'Tasa de Conversión',
          kpisData.patientMetrics?.conversionRate || 0,
          70,
          kpisData.patientMetrics?.conversionRate >= 70 ? '✅ Excelente' : 
          kpisData.patientMetrics?.conversionRate >= 50 ? '⚠️ Regular' : '❌ Bajo'
        ])
        
        // Aplicar estilos a KPIs
        for (let i = resumenSheet.rowCount - 4; i <= resumenSheet.rowCount; i++) {
          const row = resumenSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber === 2) {
              if (i === resumenSheet.rowCount - 3) { // LTV
                cell.style = { ...createCurrencyStyle(), ...cell.style }
              } else {
                cell.style = { ...createPercentStyle(), ...cell.style }
              }
            }
            if (colNumber === 2 && i >= resumenSheet.rowCount - 4) {
              const metric = i === resumenSheet.rowCount - 4 ? 'retentionRate' :
                           i === resumenSheet.rowCount - 3 ? 'ltv' :
                           i === resumenSheet.rowCount - 2 ? 'noShowRate' : 'conversionRate'
              const value = cell.value as number
              cell.style = applyPatientMetricFormatting(metric, value)
            }
          })
        }
      }

      // Ajustar ancho de columnas
      resumenSheet.columns = [
        { width: getColumnWidth('extraWide') },
        { width: getColumnWidth('currency') },
        { width: getColumnWidth('percentage') },
        { width: getColumnWidth('normal') }
      ]

      // === HOJA 2: ANÁLISIS FINANCIERO DETALLADO ===
      const financialSheet = workbook.addWorksheet('Análisis Financiero')
      
      financialSheet.addRow(['💰 ANÁLISIS FINANCIERO DETALLADO'])
      financialSheet.getCell('A1').style = createSectionTitleStyle()
      financialSheet.mergeCells('A1:F1')
      
      financialSheet.addRow([''])
      financialSheet.addRow(['Período:', reportData.periodInfo?.label || `Últimos ${selectedPeriod} meses`])
      financialSheet.addRow(['Fecha de generación:', new Date().toLocaleDateString('es-ES')])
      financialSheet.addRow([''])

      // Ingresos mensuales
      if (reportData.financial.monthlyRevenue.length > 0) {
        financialSheet.addRow(['📈 INGRESOS MENSUALES'])
        financialSheet.getCell(`A${financialSheet.rowCount}`).style = createSubtitleStyle()
        financialSheet.mergeCells(`A${financialSheet.rowCount}:F${financialSheet.rowCount}`)
        
        financialSheet.addRow([''])
        financialSheet.addRow(['Mes', 'Ingresos', 'Tendencia', 'Crecimiento'])
        financialSheet.getRow(financialSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        reportData.financial.monthlyRevenue.forEach((month, index) => {
          const previousMonth = index > 0 ? reportData.financial.monthlyRevenue[index - 1].revenue : 0
          const growth = previousMonth > 0 ? ((month.revenue - previousMonth) / previousMonth) * 100 : 0
          financialSheet.addRow([
            month.month,
            month.revenue,
            growth > 0 ? '↗️' : growth < 0 ? '↘️' : '→',
            growth
          ])
        })
        
        // Aplicar estilos
        for (let i = financialSheet.rowCount - reportData.financial.monthlyRevenue.length; i <= financialSheet.rowCount; i++) {
          const row = financialSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber === 2) {
              cell.style = { ...createCurrencyStyle(), ...cell.style }
            }
            if (colNumber === 4) {
              cell.style = { ...createPercentStyle(), ...cell.style }
            }
          })
        }
      }

      // Aging Report
      if (reportData.agingReport) {
        financialSheet.addRow([''])
        financialSheet.addRow(['⏰ AGING REPORT - CUENTAS POR COBRAR'])
        financialSheet.getCell(`A${financialSheet.rowCount}`).style = createSubtitleStyle()
        financialSheet.mergeCells(`A${financialSheet.rowCount}:F${financialSheet.rowCount}`)
        
        financialSheet.addRow([''])
        financialSheet.addRow(['Período', 'Monto', 'Porcentaje', 'Estado'])
        financialSheet.getRow(financialSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        const aging = reportData.agingReport
        const total = aging.total
        financialSheet.addRow(['0-30 días', aging.current, total > 0 ? (aging.current / total) * 100 : 0, '✅ Actual'])
        financialSheet.addRow(['31-60 días', aging.days31to60, total > 0 ? (aging.days31to60 / total) * 100 : 0, '⚠️ Atención'])
        financialSheet.addRow(['61-90 días', aging.days61to90, total > 0 ? (aging.days61to90 / total) * 100 : 0, '🔴 Crítico'])
        financialSheet.addRow(['90+ días', aging.over90, total > 0 ? (aging.over90 / total) * 100 : 0, '🚨 Urgente'])
        financialSheet.addRow(['TOTAL', total, 100, ''])
        
        // Aplicar estilos con formato condicional
        for (let i = financialSheet.rowCount - 5; i <= financialSheet.rowCount; i++) {
          const row = financialSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber === 2 || colNumber === 3) {
              cell.style = { ...createCurrencyStyle(), ...cell.style }
            }
            if (colNumber === 2 && i < financialSheet.rowCount) {
              const days = i === financialSheet.rowCount - 4 ? 15 : 
                         i === financialSheet.rowCount - 3 ? 45 :
                         i === financialSheet.rowCount - 2 ? 75 : 120
              const amount = cell.value as number
              cell.style = applyAgingFormatting(days, amount)
            }
          })
        }
      }

      financialSheet.columns = [
        { width: getColumnWidth('normal') },
        { width: getColumnWidth('currency') },
        { width: getColumnWidth('percentage') },
        { width: getColumnWidth('normal') }
      ]

      // === HOJA 3: SERVICIOS Y RENTABILIDAD ===
      const servicesSheet = workbook.addWorksheet('Servicios y Rentabilidad')
      
      servicesSheet.addRow(['🏆 ANÁLISIS DE SERVICIOS'])
      servicesSheet.getCell('A1').style = createSectionTitleStyle()
      servicesSheet.mergeCells('A1:F1')
      
      servicesSheet.addRow([''])
      servicesSheet.addRow(['Período:', reportData.periodInfo?.label || `Últimos ${selectedPeriod} meses`])
      servicesSheet.addRow([''])

      if (reportData.financial.topServices.length > 0) {
        servicesSheet.addRow(['TOP 10 SERVICIOS MÁS POPULARES'])
        servicesSheet.getCell(`A${servicesSheet.rowCount}`).style = createSubtitleStyle()
        servicesSheet.mergeCells(`A${servicesSheet.rowCount}:F${servicesSheet.rowCount}`)
        
        servicesSheet.addRow([''])
        servicesSheet.addRow(['#', 'Servicio', 'Ingresos', 'Cantidad', 'Promedio/Unidad', 'Participación'])
        servicesSheet.getRow(servicesSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        const totalServiceRevenue = reportData.financial.topServices.reduce((sum, s) => sum + s.revenue, 0)
        
        reportData.financial.topServices.forEach((service, index) => {
          const participation = totalServiceRevenue > 0 ? (service.revenue / totalServiceRevenue) * 100 : 0
          servicesSheet.addRow([
            index + 1,
            service.name,
            service.revenue,
            service.count,
            service.count > 0 ? service.revenue / service.count : 0,
            participation
          ])
        })
        
        // Aplicar estilos
        for (let i = servicesSheet.rowCount - reportData.financial.topServices.length; i <= servicesSheet.rowCount; i++) {
          const row = servicesSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber >= 3 && colNumber <= 5) {
              cell.style = { ...createCurrencyStyle(), ...cell.style }
            }
            if (colNumber === 6) {
              cell.style = { ...createPercentStyle(), ...cell.style }
            }
          })
        }
      }

      servicesSheet.columns = [
        { width: getColumnWidth('narrow') },
        { width: getColumnWidth('extraWide') },
        { width: getColumnWidth('currency') },
        { width: getColumnWidth('number') },
        { width: getColumnWidth('currency') },
        { width: getColumnWidth('percentage') }
      ]

      // === HOJA 4: ANÁLISIS DE PACIENTES ===
      const patientsSheet = workbook.addWorksheet('Análisis de Pacientes')
      
      patientsSheet.addRow(['👥 ANÁLISIS DE PACIENTES'])
      patientsSheet.getCell('A1').style = createSectionTitleStyle()
      patientsSheet.mergeCells('A1:F1')
      
      patientsSheet.addRow([''])
      patientsSheet.addRow(['Período:', reportData.periodInfo?.label || `Últimos ${selectedPeriod} meses`])
      patientsSheet.addRow([''])

      // Métricas de pacientes
      if (kpisData?.patientMetrics) {
        patientsSheet.addRow(['📊 MÉTRICAS DE PACIENTES'])
        patientsSheet.getCell(`A${patientsSheet.rowCount}`).style = createSubtitleStyle()
        patientsSheet.mergeCells(`A${patientsSheet.rowCount}:F${patientsSheet.rowCount}`)
        
        patientsSheet.addRow([''])
        patientsSheet.addRow(['Métrica', 'Valor', 'Objetivo', 'Estado'])
        patientsSheet.getRow(patientsSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        const metrics = kpisData.patientMetrics
        patientsSheet.addRow(['Total Pacientes', metrics.totalPatients, '', ''])
        patientsSheet.addRow(['Pacientes Nuevos', metrics.newPatients, '', ''])
        patientsSheet.addRow(['Pacientes Recurrentes', metrics.returningPatients, '', ''])
        patientsSheet.addRow(['Tasa de Retención', metrics.retentionRate, 80, metrics.retentionRate >= 80 ? '✅' : '⚠️'])
        patientsSheet.addRow(['Promedio Visitas/Paciente', metrics.avgVisitsPerPatient, 3, metrics.avgVisitsPerPatient >= 3 ? '✅' : '⚠️'])
        patientsSheet.addRow(['LTV Promedio', metrics.ltv, 500, metrics.ltv >= 500 ? '✅' : '⚠️'])
        patientsSheet.addRow(['Tasa de Ausentismo', metrics.noShowRate, 10, metrics.noShowRate <= 10 ? '✅' : '⚠️'])
        patientsSheet.addRow(['Tasa de Conversión', metrics.conversionRate, 70, metrics.conversionRate >= 70 ? '✅' : '⚠️'])
        
        // Aplicar estilos
        for (let i = patientsSheet.rowCount - 8; i <= patientsSheet.rowCount; i++) {
          const row = patientsSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber === 2 && i >= patientsSheet.rowCount - 4) {
              if (i === patientsSheet.rowCount - 2) { // LTV
                cell.style = { ...createCurrencyStyle(), ...cell.style }
              } else {
                cell.style = { ...createPercentStyle(), ...cell.style }
              }
            }
          })
        }
      }

      patientsSheet.columns = [
        { width: getColumnWidth('wide') },
        { width: getColumnWidth('currency') },
        { width: getColumnWidth('number') },
        { width: getColumnWidth('narrow') }
      ]

      // === HOJA 5: RENDIMIENTO POR MÉDICO ===
      if (reportData.doctorPatients.length > 0) {
        const doctorsSheet = workbook.addWorksheet('Rendimiento por Médico')
        
        doctorsSheet.addRow(['👨‍⚕️ RENDIMIENTO POR MÉDICO'])
        doctorsSheet.getCell('A1').style = createSectionTitleStyle()
        doctorsSheet.mergeCells('A1:F1')
        
        doctorsSheet.addRow([''])
        doctorsSheet.addRow(['Médico', 'Pacientes Únicos', 'Total Citas', 'Citas Completadas', 'Tasa de Éxito', 'Ingresos'])
        doctorsSheet.getRow(doctorsSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        reportData.doctorPatients.forEach(doctor => {
          const successRate = doctor.appointmentCount > 0 ? (doctor.completedAppointments / doctor.appointmentCount) * 100 : 0
          doctorsSheet.addRow([
            doctor.doctorName,
            doctor.patientCount,
            doctor.appointmentCount,
            doctor.completedAppointments,
            successRate,
            0 // Se puede calcular si se tiene acceso a ingresos por médico
          ])
        })
        
        // Aplicar estilos
        for (let i = 4; i <= doctorsSheet.rowCount; i++) {
          const row = doctorsSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber === 5) {
              cell.style = { ...createPercentStyle(), ...cell.style }
            }
            if (colNumber === 6) {
              cell.style = { ...createCurrencyStyle(), ...cell.style }
            }
          })
        }
        
        doctorsSheet.columns = [
          { width: getColumnWidth('wide') },
          { width: getColumnWidth('number') },
          { width: getColumnWidth('number') },
          { width: getColumnWidth('number') },
          { width: getColumnWidth('percentage') },
          { width: getColumnWidth('currency') }
        ]
      }

      // === HOJA 6: SEGUROS MÉDICOS ===
      if (insuranceData) {
        const insuranceSheet = workbook.addWorksheet('Seguros Médicos')
        
        insuranceSheet.addRow(['🛡️ REPORTE DE SEGUROS MÉDICOS'])
        insuranceSheet.getCell('A1').style = createSectionTitleStyle()
        insuranceSheet.mergeCells('A1:F1')
        
        insuranceSheet.addRow([''])
        insuranceSheet.addRow(['Resumen General'])
        insuranceSheet.getCell(`A${insuranceSheet.rowCount}`).style = createSubtitleStyle()
        insuranceSheet.mergeCells(`A${insuranceSheet.rowCount}:F${insuranceSheet.rowCount}`)
        
        insuranceSheet.addRow([''])
        insuranceSheet.addRow(['Métrica', 'Valor'])
        insuranceSheet.getRow(insuranceSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        insuranceSheet.addRow(['Total Aseguradoras', insuranceData.summary.totalInsurances])
        insuranceSheet.addRow(['Pacientes Asegurados', insuranceData.summary.totalInsuredPatients])
        insuranceSheet.addRow(['Facturas con Seguro', insuranceData.summary.totalInvoicesWithInsurance])
        insuranceSheet.addRow(['Descuentos Totales', insuranceData.summary.totalDiscounts])
        insuranceSheet.addRow(['Porcentaje de Ahorro', insuranceData.summary.savingsPercentage])
        
        // Aplicar estilos
        for (let i = insuranceSheet.rowCount - 5; i <= insuranceSheet.rowCount; i++) {
          const row = insuranceSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber === 2 && i >= insuranceSheet.rowCount - 2) {
              if (i === insuranceSheet.rowCount - 1) {
                cell.style = { ...createPercentStyle(), ...cell.style }
              } else {
                cell.style = { ...createCurrencyStyle(), ...cell.style }
              }
            }
          })
        }
        
        insuranceSheet.columns = [
          { width: getColumnWidth('wide') },
          { width: getColumnWidth('currency') }
        ]
      }

      // === HOJA 7: EXONERACIONES ===
      if (reportData.exonerations.exonerationsByReason.length > 0) {
        const exonerationsSheet = workbook.addWorksheet('Exoneraciones')
        
        exonerationsSheet.addRow(['🛡️ REPORTE DE EXONERACIONES'])
        exonerationsSheet.getCell('A1').style = createSectionTitleStyle()
        exonerationsSheet.mergeCells('A1:F1')
        
        exonerationsSheet.addRow([''])
        exonerationsSheet.addRow(['Resumen'])
        exonerationsSheet.getCell(`A${exonerationsSheet.rowCount}`).style = createSubtitleStyle()
        exonerationsSheet.mergeCells(`A${exonerationsSheet.rowCount}:F${exonerationsSheet.rowCount}`)
        
        exonerationsSheet.addRow([''])
        exonerationsSheet.addRow(['Total Exoneraciones:', reportData.exonerations.totalExonerations])
        exonerationsSheet.addRow(['Monto Total Exonerado:', reportData.exonerations.totalExoneratedAmount])
        
        exonerationsSheet.addRow([''])
        exonerationsSheet.addRow(['EXONERACIONES POR RAZÓN'])
        exonerationsSheet.getCell(`A${exonerationsSheet.rowCount}`).style = createSubtitleStyle()
        exonerationsSheet.mergeCells(`A${exonerationsSheet.rowCount}:F${exonerationsSheet.rowCount}`)
        
        exonerationsSheet.addRow([''])
        exonerationsSheet.addRow(['Razón', 'Cantidad', 'Monto', 'Promedio', 'Participación'])
        exonerationsSheet.getRow(exonerationsSheet.rowCount).eachCell((cell, colNumber) => {
          cell.style = createHeaderStyle()
        })
        
        const totalExonerated = reportData.exonerations.totalExoneratedAmount
        reportData.exonerations.exonerationsByReason.forEach(reason => {
          const average = reason.count > 0 ? reason.amount / reason.count : 0
          const participation = totalExonerated > 0 ? (reason.amount / totalExonerated) * 100 : 0
          exonerationsSheet.addRow([
            reason.reason,
            reason.count,
            reason.amount,
            average,
            participation
          ])
        })
        
        // Aplicar estilos
        for (let i = 6; i <= exonerationsSheet.rowCount; i++) {
          const row = exonerationsSheet.getRow(i)
          row.eachCell((cell, colNumber) => {
            cell.style = createDataStyle()
            if (colNumber >= 3 && colNumber <= 4) {
              cell.style = { ...createCurrencyStyle(), ...cell.style }
            }
            if (colNumber === 5) {
              cell.style = { ...createPercentStyle(), ...cell.style }
            }
          })
        }
        
        exonerationsSheet.columns = [
          { width: getColumnWidth('extraWide') },
          { width: getColumnWidth('number') },
          { width: getColumnWidth('currency') },
          { width: getColumnWidth('currency') },
          { width: getColumnWidth('percentage') }
        ]
      }

      // === FINALIZAR Y DESCARGAR ===
      try {
        const buffer = await workbook.xlsx.writeBuffer()
        
        if (!buffer) {
          throw new Error('El archivo generado está vacío')
        }
        
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        if (blob.size === 0) {
          throw new Error('El archivo generado no tiene contenido')
        }
        
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Reporte_Completo_${businessName}_${new Date().toISOString().split('T')[0]}.xlsx`
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        
        // Limpiar después de un breve delay
        setTimeout(() => {
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 100)

        toast.success('Reporte completo exportado exitosamente')
      } catch (writeError) {
        console.error('Error al escribir el archivo Excel:', writeError)
        throw new Error('Error al generar el archivo Excel: ' + writeError.message)
      }
    } catch (error) {
      console.error('Error al exportar reporte completo:', error)
      toast.error('Error al exportar el reporte completo')
    }
  }

  const exportToPDF = async (reportType: string) => {
    try {
      let data = null
      
      switch (reportType) {
        case 'daily-sales':
          if (!dailySalesData) {
            toast.error('No hay datos de ventas del día para exportar')
            return
          }
          data = dailySalesData
          break
        case 'demographics':
          if (!demographicsData) {
            toast.error('No hay datos demográficos para exportar')
            return
          }
          data = demographicsData
          break
        case 'insurance':
          if (!insuranceData) {
            toast.error('No hay datos de seguros para exportar')
            return
          }
          data = insuranceData
          break
        default:
          toast.error('Tipo de reporte no válido')
          return
      }

      const response = await fetch('/api/reports/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          data,
          options: {
            date: selectedDate,
            groupBy: demographicsGroupBy
          }
        })
      })

      if (!response.ok) throw new Error('Error al generar PDF')

      const result = await response.json()
      
      // Crear y descargar el archivo HTML como PDF
      const blob = new Blob([result.htmlContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Reporte PDF generado exitosamente')
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      toast.error('Error al generar PDF')
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>No hay datos disponibles para mostrar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Minimalista */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  📊 Reportes
                </h1>
                <p className="text-gray-600">
                  Análisis y métricas del consultorio
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Selector de período */}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Select 
                    value={useCustomRange ? "custom" : selectedPeriod.toString()} 
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setUseCustomRange(true)
                      } else {
                        setUseCustomRange(false)
                        setSelectedPeriod(parseInt(value))
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] border-gray-300">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Rango personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón de exportar */}
                <Button 
                  onClick={exportFullReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Selector de rango personalizado */}
            {useCustomRange && (
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600">Rango personalizado:</span>
                <input
                  type="date"
                  value={dateRange?.start || ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">a</span>
                <input
                  type="date"
                  value={dateRange?.end || ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

        {/* Información del período */}
        {reportData && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Período de Análisis</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGlobalData(!showGlobalData)}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                {showGlobalData ? "Ver datos del período" : "Ver datos globales"}
              </Button>
            </div>
            <p className="text-blue-700">
              {useCustomRange && dateRange 
                ? `Del ${new Date(dateRange.start).toLocaleDateString('es-ES')} al ${new Date(dateRange.end).toLocaleDateString('es-ES')}`
                : `Últimos ${selectedPeriod} meses`
              }
            </p>
            <div className="mt-2 text-sm text-blue-600">
              {showGlobalData && reportData.global ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p><strong>💰 Total Facturado:</strong> ${reportData.global.totalRevenue.toLocaleString()}</p>
                    <p><strong>📄 Total Facturas:</strong> {reportData.global.totalInvoices}</p>
                  </div>
                  <div>
                    <p><strong>✅ Facturas Pagadas:</strong> {reportData.global.paidInvoices}</p>
                    <p><strong>⏳ Facturas por Cobrar:</strong> {reportData.global.pendingInvoices + reportData.global.partialInvoices}</p>
                    <p><strong>💰 En Efectivo:</strong> ${(reportData.global.totalPartialRevenue || 0).toLocaleString()}</p>
                    <p><strong>⏳ Pendiente:</strong> ${(reportData.global.totalPendingRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>👥 Pacientes Activos:</strong> {reportData.global.activePatients}</p>
                    <p><strong>📅 Total Citas:</strong> {reportData.global.totalAppointments}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p><strong>💰 Total Facturado:</strong> ${reportData.financial.totalRevenue.toLocaleString()}</p>
                    <p><strong>📄 Total Facturas:</strong> {reportData.financial.paidInvoices + reportData.financial.pendingInvoices + reportData.financial.exoneratedInvoices}</p>
                  </div>
                  <div>
                    <p><strong>✅ Facturas Pagadas:</strong> {reportData.financial.paidInvoices}</p>
                    <p><strong>⏳ Facturas por Cobrar:</strong> {reportData.financial.pendingInvoices + reportData.financial.partialInvoices}</p>
                    <p><strong>💰 En Efectivo:</strong> ${(reportData.financial.partialRevenue || 0).toLocaleString()}</p>
                    <p><strong>⏳ Pendiente:</strong> ${(reportData.financial.partialPendingRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>👥 Pacientes Activos:</strong> {reportData.totals.activePatients}</p>
                    <p><strong>📅 Total Citas:</strong> {reportData.totals.totalAppointments}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

          {/* Resumen Ejecutivo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen Ejecutivo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FinancialMetricCard
                title="Total Facturado"
                value={reportData.financial.totalRevenue}
                description="Ingresos totales del período"
                trend={reportData.comparison ? {
                  value: ((reportData.comparison.current.revenue - reportData.comparison.previous.revenue) / reportData.comparison.previous.revenue) * 100,
                  direction: reportData.comparison.current.revenue > reportData.comparison.previous.revenue ? 'up' : 'down'
                } : undefined}
                icon={<DollarSign className="h-5 w-5" />}
              />
              
              <PercentageMetricCard
                title="Tasa de Cobro"
                value={reportData.totals.collectionRate}
                description="Porcentaje de facturas pagadas"
                target={85}
                icon={<CheckCircle className="h-5 w-5" />}
              />
              
              <FinancialMetricCard
                title="Cuentas por Cobrar"
                value={reportData.financial.pendingInvoices + reportData.financial.partialInvoices}
                description="Facturas pendientes y parciales"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              
              <PatientMetricCard
                title="Pacientes Activos"
                value={reportData.totals.activePatients}
                description="Base de pacientes actual"
                icon={<Users className="h-5 w-5" />}
              />
            </div>
          </div>

          {/* KPIs de Consultorio */}
          {reportData.patientMetrics && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">KPIs de Consultorio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PercentageMetricCard
                  title="Tasa de Retención"
                  value={reportData.patientMetrics.retentionRate}
                  description="Pacientes que regresan"
                  target={80}
                  icon={<Heart className="h-5 w-5" />}
                />
                
                <FinancialMetricCard
                  title="LTV Promedio"
                  value={reportData.patientMetrics.ltv}
                  description="Valor promedio por paciente"
                  icon={<Target className="h-5 w-5" />}
                />
                
                <PercentageMetricCard
                  title="Tasa de Ausentismo"
                  value={reportData.patientMetrics.noShowRate}
                  description="Pacientes que no asisten"
                  target={10}
                  icon={<Clock className="h-5 w-5" />}
                />
                
                <PercentageMetricCard
                  title="Tasa de Conversión"
                  value={reportData.patientMetrics.conversionRate}
                  description="Primera cita → paciente recurrente"
                  target={70}
                  icon={<TrendingUp className="h-5 w-5" />}
                />
              </div>
            </div>
          )}

          {/* Comparación de Períodos */}
          {reportData.comparison && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Comparación de Períodos</h2>
              <FinancialPeriodComparator
                title="Análisis Comparativo"
                description="Comparación entre el período actual y el anterior"
                currentPeriod={{
                  label: reportData.periodInfo?.label || `Últimos ${selectedPeriod} meses`,
                  startDate: reportData.periodInfo?.startDate || '',
                  endDate: reportData.periodInfo?.endDate || ''
                }}
                previousPeriod={{
                  label: `Período anterior`,
                  startDate: '',
                  endDate: ''
                }}
                metrics={[
                  {
                    name: 'Ingresos',
                    current: reportData.comparison.current.revenue,
                    previous: reportData.comparison.previous.revenue,
                    change: reportData.comparison.current.revenue - reportData.comparison.previous.revenue,
                    changePercent: ((reportData.comparison.current.revenue - reportData.comparison.previous.revenue) / reportData.comparison.previous.revenue) * 100,
                    trend: reportData.comparison.current.revenue > reportData.comparison.previous.revenue ? 'up' : 'down',
                    format: 'currency'
                  },
                  {
                    name: 'Citas',
                    current: reportData.comparison.current.appointments,
                    previous: reportData.comparison.previous.appointments,
                    change: reportData.comparison.current.appointments - reportData.comparison.previous.appointments,
                    changePercent: ((reportData.comparison.current.appointments - reportData.comparison.previous.appointments) / reportData.comparison.previous.appointments) * 100,
                    trend: reportData.comparison.current.appointments > reportData.comparison.previous.appointments ? 'up' : 'down',
                    format: 'number'
                  },
                  {
                    name: 'Pacientes',
                    current: reportData.comparison.current.patients,
                    previous: reportData.comparison.previous.patients,
                    change: reportData.comparison.current.patients - reportData.comparison.previous.patients,
                    changePercent: ((reportData.comparison.current.patients - reportData.comparison.previous.patients) / reportData.comparison.previous.patients) * 100,
                    trend: reportData.comparison.current.patients > reportData.comparison.previous.patients ? 'up' : 'down',
                    format: 'number'
                  }
                ]}
              />
            </div>
          )}

        {/* Tabs de reportes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financiero
            </TabsTrigger>
            <TabsTrigger value="daily-sales" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ventas Día
            </TabsTrigger>
            <TabsTrigger value="demographics" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Demográfico
            </TabsTrigger>
            <TabsTrigger value="insurance" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Seguros
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="exonerations" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Exoneraciones
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Médicos
            </TabsTrigger>
            <TabsTrigger value="acquisition" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Adquisición
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Ingresos Mensuales
                  </CardTitle>
                  <CardDescription>
                    Tendencias de ingresos en los últimos {selectedPeriod} meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChartSVG
                    points={reportData.financial.monthlyRevenue.map(m => m.revenue)}
                    labels={reportData.financial.monthlyRevenue.map(m => m.month)}
                    color="#10b981"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Exoneraciones Mensuales
                  </CardTitle>
                  <CardDescription>
                    Tendencias de exoneraciones en los últimos {selectedPeriod} meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiLineChartSVG
                    series={[
                      {
                        name: "Cantidad",
                        color: "#ef4444",
                        points: reportData.financial.monthlyExonerations.map(m => m.count)
                      },
                      {
                        name: "Monto",
                        color: "#f97316",
                        points: reportData.financial.monthlyExonerations.map(m => m.amount / 1000) // Escalar para visualización
                      }
                    ]}
                    labels={reportData.financial.monthlyExonerations.map(m => m.month)}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Resumen Financiero
                </CardTitle>
                <CardDescription>
                  Comparación de ingresos vs exoneraciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                      ${reportData.financial.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Ingresos Totales</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-700">
                      ${reportData.financial.exoneratedAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">Monto Exonerado</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                      {reportData.totals.collectionRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-600">Tasa de Cobro</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Servicios Más Populares
                  </CardTitle>
                  <CardDescription>
                    Análisis de ingresos por servicio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.financial.topServices.map((service, index) => (
                      <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-green-900">{service.name}</p>
                            <p className="text-sm text-green-600">
                              {service.count} servicios realizados
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">
                            ${service.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-green-600">
                            ${(service.revenue / service.count).toFixed(2)} promedio
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Servicios Exonerados
                  </CardTitle>
                  <CardDescription>
                    Análisis de servicios exonerados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.financial.exoneratedServices.length > 0 ? (
                      reportData.financial.exoneratedServices.map((service, index) => (
                        <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-red-900">{service.name}</p>
                              <p className="text-sm text-red-600">
                                {service.count} servicios exonerados
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-700">
                              ${service.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-red-600">
                              ${(service.amount / service.count).toFixed(2)} promedio
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No hay servicios exonerados en este período</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exonerations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Exoneraciones por Razón
                  </CardTitle>
                  <CardDescription>
                    Análisis de exoneraciones por motivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.exonerations.exonerationsByReason.length > 0 ? (
                      reportData.exonerations.exonerationsByReason.map((reason, index) => (
                        <div key={reason.reason} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-red-900">{reason.reason}</p>
                              <p className="text-sm text-red-600">
                                {reason.count} exoneraciones
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-700">
                              ${reason.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-red-600">
                              ${(reason.amount / reason.count).toFixed(2)} promedio
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No hay exoneraciones en este período</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    Tendencias de Exoneraciones
                  </CardTitle>
                  <CardDescription>
                    Evolución mensual de exoneraciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiLineChartSVG
                    series={[
                      {
                        name: "Cantidad",
                        color: "#ef4444",
                        points: reportData.exonerations.monthlyExonerations.map(m => m.count)
                      },
                      {
                        name: "Monto (K$)",
                        color: "#f97316",
                        points: reportData.exonerations.monthlyExonerations.map(m => m.amount / 1000)
                      }
                    ]}
                    labels={reportData.exonerations.monthlyExonerations.map(m => m.month)}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  Resumen de Exoneraciones
                </CardTitle>
                <CardDescription>
                  Estadísticas generales de exoneraciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-700">
                      {reportData.exonerations.totalExonerations}
                    </div>
                    <div className="text-sm text-red-600">Total Exoneraciones</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">
                      ${reportData.exonerations.totalExoneratedAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-orange-600">Monto Total Exonerado</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">
                      {reportData.totals.exoneratedPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600">% de Exoneraciones</div>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <div className="text-2xl font-bold text-pink-700">
                      ${reportData.exonerations.totalExonerations > 0 ? (reportData.exonerations.totalExoneratedAmount / reportData.exonerations.totalExonerations).toFixed(0) : 0}
                    </div>
                    <div className="text-sm text-pink-600">Promedio por Exoneración</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  Rendimiento por Médico
                </CardTitle>
                <CardDescription>
                  Análisis de citas y pacientes por médico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.doctorPatients.map((doctor, index) => {
                    const completionRate = doctor.appointmentCount > 0 ? (doctor.completedAppointments / doctor.appointmentCount) * 100 : 0
                    return (
                      <div key={doctor.doctorName} className="flex items-center justify-between p-4 border rounded-lg bg-purple-50 border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900">{doctor.doctorName}</p>
                            <p className="text-sm text-purple-600">
                              {doctor.patientCount} pacientes únicos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-700">
                            {doctor.appointmentCount} citas
                          </p>
                          <p className="text-sm text-purple-600">
                            {doctor.completedAppointments} completadas ({completionRate.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acquisition" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Tendencias de Adquisición
                </CardTitle>
                <CardDescription>
                  Nuevos vs pacientes recurrentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiLineChartSVG
                  series={[
                    {
                      name: "Nuevos Pacientes",
                      color: "#10b981",
                      points: reportData.acquisitionTrends.map(t => t.newPatients)
                    },
                    {
                      name: "Pacientes Recurrentes",
                      color: "#3b82f6",
                      points: reportData.acquisitionTrends.map(t => t.returningPatients)
                    }
                  ]}
                  labels={reportData.acquisitionTrends.map(t => t.month)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Resumen de Adquisición
                </CardTitle>
                <CardDescription>
                  Estadísticas de crecimiento de pacientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                      {reportData.acquisitionTrends.reduce((sum, t) => sum + t.newPatients, 0)}
                    </div>
                    <div className="text-sm text-green-600">Total Nuevos Pacientes</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                      {reportData.acquisitionTrends.reduce((sum, t) => sum + t.returningPatients, 0)}
                    </div>
                    <div className="text-sm text-blue-600">Total Pacientes Recurrentes</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-700">
                      {reportData.totals.activePatients}
                    </div>
                    <div className="text-sm text-indigo-600">Pacientes Activos Actuales</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily-sales" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold">Reporte de Ventas del Día</h3>
                <p className="text-muted-foreground">
                  Análisis detallado de facturación, exoneraciones y servicios del día
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
                <Button onClick={() => exportToPDF('daily-sales')} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {dailySalesData ? (
              <>
                {/* Resumen del día */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">Total Facturado</CardTitle>
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900">${dailySalesData.summary.totalFacturado.toLocaleString()}</div>
                      <p className="text-xs text-blue-600">{dailySalesData.summary.totalFacturas} facturas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Facturas Pagadas</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">{dailySalesData.summary.facturasPagadas}</div>
                      <div className="mt-1">
                        <span className="text-xs text-green-600 font-medium">💰 Total en Efectivo:</span>
                        <p className="text-sm font-bold text-green-700">${dailySalesData.summary.totalPagado.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">Facturas por Cobrar</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-900">
                        {(dailySalesData.summary.facturasPendientes + dailySalesData.summary.facturasParciales)}
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-orange-600 font-medium">⏳ Pendiente:</span>
                          <span className="text-sm font-bold text-orange-700">
                            ${dailySalesData.summary.totalPendiente.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-red-700">Exoneraciones</CardTitle>
                      <Shield className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-900">{dailySalesData.summary.facturasExoneradas}</div>
                      <p className="text-xs text-red-600">${dailySalesData.summary.totalExonerado.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Servicios del día */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      Servicios del Día
                    </CardTitle>
                    <CardDescription>
                      Desglose de servicios utilizados en el día
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dailySalesData.serviceBreakdown.map((service, index) => (
                        <div key={service.serviceId} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">{service.name}</p>
                              <p className="text-sm text-blue-600">
                                {service.category || 'Sin categoría'} • {service.totalQuantity} servicios
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-700">
                              ${service.totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-blue-600">
                              {service.invoiceCount} facturas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Facturas del día */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Facturas del Día ({dailySalesData.invoices.length})
                    </CardTitle>
                    <CardDescription>
                      Lista detallada de todas las facturas del día
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dailySalesData.invoices.map((invoice) => (
                        <div key={invoice.id} className={`p-4 border rounded-lg ${
                          invoice.status === 'PARTIAL' ? 'border-blue-200 bg-blue-50' :
                          invoice.status === 'PAID' ? 'border-green-200 bg-green-50' :
                          invoice.status === 'PENDING' ? 'border-orange-200 bg-orange-50' :
                          'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                invoice.status === 'PARTIAL' ? 'bg-blue-100' :
                                invoice.status === 'PAID' ? 'bg-green-100' :
                                invoice.status === 'PENDING' ? 'bg-orange-100' :
                                'bg-red-100'
                              }`}>
                                <FileText className={`h-4 w-4 ${
                                  invoice.status === 'PARTIAL' ? 'text-blue-600' :
                                  invoice.status === 'PAID' ? 'text-green-600' :
                                  invoice.status === 'PENDING' ? 'text-orange-600' :
                                  'text-red-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-lg">{invoice.invoiceNumber}</p>
                                <p className="text-sm text-gray-600">
                                  {invoice.patientName} • {invoice.doctorName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {invoice.services || 'Servicios no especificados'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {invoice.status === 'PARTIAL' ? (
                                <div className="space-y-2">
                                  <div className="text-center">
                                    <p className="text-sm text-gray-600">Total Factura</p>
                                    <p className="font-bold text-lg">${invoice.totalAmount.toLocaleString()}</p>
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="text-center">
                                      <p className="text-xs text-green-600 font-medium">💰 EN EFECTIVO</p>
                                      <p className="font-bold text-green-700">${(invoice.paidAmount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-orange-600 font-medium">⏳ PENDIENTE</p>
                                      <p className="font-bold text-orange-700">${(invoice.pendingAmount || 0).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      💳 PAGO PARCIAL
                                    </span>
                                  </div>
                                </div>
                              ) : invoice.status === 'PAID' ? (
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Total Pagado</p>
                                  <p className="font-bold text-lg text-green-700">${invoice.totalAmount.toLocaleString()}</p>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                    ✅ PAGADO
                                  </span>
                                </div>
                              ) : invoice.status === 'PENDING' ? (
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Total Pendiente</p>
                                  <p className="font-bold text-lg text-orange-700">${invoice.totalAmount.toLocaleString()}</p>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                    ⏳ PENDIENTE
                                  </span>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Total</p>
                                  <p className="font-bold text-lg">${invoice.totalAmount.toLocaleString()}</p>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                    {invoice.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Cargando datos de ventas del día...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold">Reporte Demográfico</h3>
                <p className="text-muted-foreground">
                  Análisis de pacientes por edad, género y nacionalidad
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={demographicsGroupBy} onValueChange={setDemographicsGroupBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Agrupar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="age">Edad</SelectItem>
                    <SelectItem value="gender">Género</SelectItem>
                    <SelectItem value="nationality">Nacionalidad</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => exportToPDF('demographics')} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {demographicsData ? (
              <>
                {/* Resumen demográfico */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Total Pacientes</CardTitle>
                      <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-900">{demographicsData.summary.totalPatients}</div>
                      <p className="text-xs text-purple-600">Pacientes activos</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">Total Citas</CardTitle>
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900">{demographicsData.summary.totalAppointments}</div>
                      <p className="text-xs text-blue-600">Citas realizadas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Total Ingresos</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">${demographicsData.summary.totalRevenue.toLocaleString()}</div>
                      <p className="text-xs text-green-600">Ingresos totales</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">Promedio Citas/Paciente</CardTitle>
                      <Target className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-900">{demographicsData.summary.avgAppointmentsPerPatient}</div>
                      <p className="text-xs text-orange-600">Citas por paciente</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Distribución demográfica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Distribución por {demographicsGroupBy === 'age' ? 'Edad' : demographicsGroupBy === 'gender' ? 'Género' : 'Nacionalidad'}
                    </CardTitle>
                    <CardDescription>
                      Análisis detallado de la distribución demográfica
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {demographicsData.chartData.map((item, index) => (
                        <div key={item.group} className="flex items-center justify-between p-4 border rounded-lg bg-purple-50 border-purple-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-purple-900">{item.group}</p>
                              <p className="text-sm text-purple-600">
                                {item.count} pacientes • {item.appointments} citas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-700">
                              ${item.revenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-purple-600">
                              ${item.avgRevenuePerPatient} promedio
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <UserCog className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Cargando datos demográficos...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insurance" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold">Reporte de Seguros Médicos</h3>
                <p className="text-muted-foreground">
                  Análisis de cobertura de seguros, descuentos y servicios utilizados
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => exportToPDF('insurance')} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {insuranceData ? (
              <>
                {/* Resumen de seguros */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">Total Aseguradoras</CardTitle>
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900">{insuranceData.summary.totalInsurances}</div>
                      <p className="text-xs text-blue-600">Aseguradoras activas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Pacientes Asegurados</CardTitle>
                      <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">{insuranceData.summary.totalInsuredPatients}</div>
                      <p className="text-xs text-green-600">Con cobertura</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Facturas con Seguro</CardTitle>
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-900">{insuranceData.summary.totalInvoicesWithInsurance}</div>
                      <p className="text-xs text-purple-600">Con cobertura aplicada</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">Total Descuentos</CardTitle>
                      <DollarSign className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-900">${insuranceData.summary.totalDiscounts.toLocaleString()}</div>
                      <p className="text-xs text-orange-600">{insuranceData.summary.savingsPercentage.toFixed(1)}% ahorro</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Reportes por aseguradora */}
                <div className="space-y-6">
                  {insuranceData.insuranceReports.map((insurance) => (
                    <Card key={insurance.insurance.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          {insurance.insurance.name}
                        </CardTitle>
                        <CardDescription>
                          {insurance.insurance.patientCount} pacientes • {insurance.summary.totalInvoices} facturas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-700">
                              ${insurance.summary.totalOriginalAmount.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600">Monto Original</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-700">
                              ${insurance.summary.totalPatientPays.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-600">Paga Paciente</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-xl font-bold text-purple-700">
                              ${insurance.summary.totalInsuranceCovers.toLocaleString()}
                            </div>
                            <div className="text-sm text-purple-600">Cubre Seguro</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-xl font-bold text-orange-700">
                              ${insurance.summary.totalDiscounts.toLocaleString()}
                            </div>
                            <div className="text-sm text-orange-600">Descuentos</div>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-3">Servicios Más Utilizados</h4>
                        <div className="space-y-2">
                          {insurance.serviceUsage.slice(0, 5).map((service, index) => (
                            <div key={service.serviceId} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-xs">{index + 1}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{service.serviceName}</p>
                                  <p className="text-xs text-gray-600">
                                    {service.serviceCategory || 'Sin categoría'} • {service.totalQuantity} servicios
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">${service.totalDiscounts.toLocaleString()}</p>
                                <p className="text-xs text-gray-600">{service.coveragePercent}% cobertura</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Cargando datos de seguros...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}

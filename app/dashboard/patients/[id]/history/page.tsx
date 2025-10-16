"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Calendar, 
  User, 
  Activity,
  Download,
  Edit,
  Loader2
} from "lucide-react"
import { PatientInfoHeader } from "@/components/patients/patient-info-header"
import { ConsultationTable } from "@/components/patients/consultation-table"
import { ConsultationDetailModal } from "@/components/patients/consultation-detail-modal"
import { NewConsultationDialog } from "@/components/patients/new-consultation-dialog"
import { usePatientHistory } from "@/hooks/use-patient-history"
import { usePDFExport } from "@/hooks/use-pdf-export"
import { Consultation } from "@/hooks/use-patient-history"
import { toast } from "sonner"

export default function PatientHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isNewConsultationOpen, setIsNewConsultationOpen] = useState(false)
  const [isEditingConsultation, setIsEditingConsultation] = useState(false)

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
    addConsultation,
    updateConsultation,
    deleteConsultation
  } = usePatientHistory(patientId)

  const { exportToPDF, isExporting } = usePDFExport()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    
    // Verificar permisos específicos para historial médico
    if (status === "authenticated" && session?.user?.role === 'BILLING') {
      toast.error("El rol de Facturación no tiene acceso al historial médico")
      router.push("/dashboard/patients")
      return
    }
  }, [status, router, session])

  const handleViewConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    setIsDetailModalOpen(true)
  }

  const handleEditConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    setIsEditingConsultation(true)
    setIsDetailModalOpen(true)
  }

  const handleDeleteConsultation = async (consultation: Consultation) => {
    try {
      const success = await deleteConsultation(consultation.id)
      if (success) {
        toast.success("Consulta eliminada exitosamente")
        setIsDetailModalOpen(false)
        setSelectedConsultation(null)
      }
    } catch (error) {
      console.error("Error deleting consultation:", error)
      toast.error("Error al eliminar la consulta")
    }
  }

  const handleCreateConsultation = async (data: any) => {
    try {
      const success = await addConsultation(data)
      if (success) {
        toast.success("Consulta creada exitosamente")
        setIsNewConsultationOpen(false)
      }
      return success
    } catch (error) {
      console.error("Error creating consultation:", error)
      toast.error("Error al crear la consulta")
      return false
    }
  }

  const handleUpdateConsultation = async (consultationId: string, data: any) => {
    try {
      const success = await updateConsultation(consultationId, data)
      if (success) {
        toast.success("Consulta actualizada exitosamente")
        setIsDetailModalOpen(false)
        setSelectedConsultation(null)
        setIsEditingConsultation(false)
      }
      return success
    } catch (error) {
      console.error("Error updating consultation:", error)
      toast.error("Error al actualizar la consulta")
      return false
    }
  }

  const handleExportPDF = async (consultationIds?: string[]) => {
    if (!historyData) return

    try {
      await exportToPDF(patientId, {
        includePatientInfo: true,
        includeVitalSigns: true,
        includePrescriptions: true,
        consultationIds
      })
      toast.success("PDF exportado exitosamente")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Error al exportar PDF")
    }
  }

  const handleEditPatient = () => {
    // Navegar a la página de edición del paciente
    router.push(`/dashboard/patients/${patientId}/edit`)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando historial del paciente...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar el historial
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => refetch()} variant="outline">
              Reintentar
            </Button>
            <Button onClick={() => router.back()} variant="outline">
              Volver
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!historyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Paciente no encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            El paciente solicitado no existe o no tienes permisos para verlo.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const { patient, consultations, stats } = historyData

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Historial Médico
            </h1>
            <p className="text-muted-foreground">
              Registro completo de consultas y tratamientos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleExportPDF()}
            variant="outline"
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </Button>
          <Button
            onClick={() => setIsNewConsultationOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Consulta
          </Button>
        </div>
      </div>

      {/* Información del paciente */}
      <PatientInfoHeader
        patient={patient}
        onEdit={handleEditPatient}
        showEditButton={session?.user?.role === 'ADMIN' || session?.user?.role === 'DOCTOR'}
      />

      {/* Estadísticas del historial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Consultas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsultations}</div>
            <p className="text-xs text-muted-foreground">
              Consultas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Primera Consulta
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.firstConsultation 
                ? new Date(stats.firstConsultation).toLocaleDateString('es-ES')
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Fecha de inicio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Última Consulta
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastConsultation 
                ? new Date(stats.lastConsultation).toLocaleDateString('es-ES')
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Consulta más reciente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tipos de Consulta
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(stats.consultationTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {type === 'PRIMERA_CONSULTA' ? 'Primera' :
                     type === 'SEGUIMIENTO' ? 'Seguimiento' :
                     type === 'CONTROL' ? 'Control' : 'Urgencia'}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de consultas */}
      <ConsultationTable
        consultations={consultations}
        onViewConsultation={handleViewConsultation}
        onEditConsultation={handleEditConsultation}
        onDeleteConsultation={handleDeleteConsultation}
        onExportPDF={handleExportPDF}
        isLoading={isLoading}
        doctors={[]} // TODO: Obtener lista de doctores
      />

      {/* Modal de detalles de consulta */}
      <ConsultationDetailModal
        consultation={selectedConsultation}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedConsultation(null)
          setIsEditingConsultation(false)
        }}
        onEdit={handleEditConsultation}
        onDelete={handleDeleteConsultation}
        patientId={patientId}
      />

      {/* Diálogo de nueva consulta */}
      <NewConsultationDialog
        isOpen={isNewConsultationOpen}
        onClose={() => setIsNewConsultationOpen(false)}
        onSubmit={handleCreateConsultation}
        patientId={patientId}
        doctorId={session?.user?.id || ''}
      />
    </div>
  )
}

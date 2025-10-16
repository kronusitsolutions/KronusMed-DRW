"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  Pill,
  Heart,
  Thermometer,
  Activity,
  Weight,
  Ruler,
  AlertTriangle,
  Download,
  Edit,
  Trash2,
  X
} from "lucide-react"
import { Consultation } from "@/hooks/use-patient-history"
import { usePDFExport } from "@/hooks/use-pdf-export"

interface ConsultationDetailModalProps {
  consultation: Consultation | null
  isOpen: boolean
  onClose: () => void
  onEdit: (consultation: Consultation) => void
  onDelete: (consultation: Consultation) => void
  patientId: string
}

export function ConsultationDetailModal({
  consultation,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  patientId
}: ConsultationDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { exportToPDF, isExporting } = usePDFExport()

  if (!consultation) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta consulta? Esta acción no se puede deshacer.')) {
      setIsDeleting(true)
      try {
        await onDelete(consultation)
        onClose()
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleExportPDF = async () => {
    await exportToPDF(patientId, {
      includePatientInfo: true,
      includeVitalSigns: true,
      includePrescriptions: true,
      consultationIds: [consultation.id]
    })
  }

  const getVitalSignIcon = (key: string) => {
    switch (key) {
      case 'bloodPressure': return <Activity className="h-4 w-4" />
      case 'temperature': return <Thermometer className="h-4 w-4" />
      case 'heartRate': return <Heart className="h-4 w-4" />
      case 'weight': return <Weight className="h-4 w-4" />
      case 'height': return <Ruler className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getVitalSignLabel = (key: string) => {
    switch (key) {
      case 'bloodPressure': return 'Presión Arterial'
      case 'temperature': return 'Temperatura'
      case 'heartRate': return 'Frecuencia Cardíaca'
      case 'weight': return 'Peso'
      case 'height': return 'Altura'
      default: return key
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle de Consulta
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : 'PDF'}
              </Button>
              <Button
                onClick={() => onEdit(consultation)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                disabled={isDeleting}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header de la consulta */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    {getConsultationTypeLabel(consultation.type)}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(consultation.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(consultation.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {consultation.doctor?.name || 'Desconocido'}
                    </div>
                  </div>
                </div>
                <Badge variant={getConsultationTypeVariant(consultation.type)}>
                  {getConsultationTypeLabel(consultation.type)}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Información principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Motivo y diagnóstico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Motivo de Consulta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {consultation.reason || 'No especificado'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {consultation.diagnosis || 'No especificado'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Síntomas */}
          {consultation.symptoms && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Síntomas Reportados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{consultation.symptoms}</p>
              </CardContent>
            </Card>
          )}

          {/* Signos vitales */}
          {consultation.vitalSigns && Object.keys(consultation.vitalSigns).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Signos Vitales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(consultation.vitalSigns).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      {getVitalSignIcon(key)}
                      <div>
                        <div className="text-sm font-medium text-gray-600">
                          {getVitalSignLabel(key)}
                        </div>
                        <div className="text-lg font-semibold text-blue-700">
                          {value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notas médicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas Médicas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {consultation.notes}
              </p>
            </CardContent>
          </Card>

          {/* Tratamiento */}
          {consultation.treatment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tratamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {consultation.treatment}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Medicamentos recetados */}
          {consultation.prescriptions && consultation.prescriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicamentos Recetados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consultation.prescriptions.map((prescription, index) => (
                    <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800 mb-2">
                        {prescription.medication}
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <div><strong>Dosificación:</strong> {prescription.dosage}</div>
                        <div><strong>Frecuencia:</strong> {prescription.frequency}</div>
                        {prescription.duration && (
                          <div><strong>Duración:</strong> {prescription.duration}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Próxima cita */}
          {consultation.followUpDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próxima Cita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {formatDate(consultation.followUpDate)} a las {formatTime(consultation.followUpDate)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Duración de la consulta:</span>
                  <p className="text-gray-700">{consultation.duration}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Fecha de creación:</span>
                  <p className="text-gray-700">
                    {new Date(consultation.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

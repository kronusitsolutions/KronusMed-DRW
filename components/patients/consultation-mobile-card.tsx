"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  Clock,
  Stethoscope,
  AlertTriangle
} from "lucide-react"
import { Consultation } from "@/hooks/use-patient-history"

interface ConsultationMobileCardProps {
  consultation: Consultation
  onView: (consultation: Consultation) => void
  onEdit: (consultation: Consultation) => void
  onDelete: (consultation: Consultation) => void
}

export function ConsultationMobileCard({
  consultation,
  onView,
  onEdit,
  onDelete
}: ConsultationMobileCardProps) {
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

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'PRIMERA_CONSULTA': return <Stethoscope className="h-4 w-4" />
      case 'SEGUIMIENTO': return <Calendar className="h-4 w-4" />
      case 'CONTROL': return <User className="h-4 w-4" />
      case 'URGENCIA': return <AlertTriangle className="h-4 w-4" />
      default: return <Stethoscope className="h-4 w-4" />
    }
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getConsultationTypeIcon(consultation.type)}
              <Badge variant={getConsultationTypeVariant(consultation.type)}>
                {getConsultationTypeLabel(consultation.type)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(consultation.date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(consultation.date)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Información principal */}
        <div className="space-y-3 mb-4">
          {consultation.reason && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Motivo de Consulta
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {consultation.reason}
              </p>
            </div>
          )}

          {consultation.diagnosis && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Diagnóstico
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {consultation.diagnosis}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">
              Notas Médicas
            </h4>
            <p className="text-sm text-gray-600 line-clamp-3">
              {consultation.notes}
            </p>
          </div>
        </div>

        {/* Información del médico */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Dr. {consultation.doctor?.name || 'Desconocido'}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onView(consultation)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Ver
            </Button>
            <Button
              onClick={() => onEdit(consultation)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
          <Button
            onClick={() => onDelete(consultation)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

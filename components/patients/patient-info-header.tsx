"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Droplets, 
  AlertTriangle, 
  Heart,
  FileText,
  Edit
} from "lucide-react"
import { Patient } from "@/hooks/use-patient-history"
import { getDisplayAge, formatAge } from "@/lib/age-utils"

interface PatientInfoHeaderProps {
  patient: Patient
  onEdit?: () => void
  showEditButton?: boolean
}

export function PatientInfoHeader({ 
  patient, 
  onEdit, 
  showEditButton = false 
}: PatientInfoHeaderProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No especificada'
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Masculino'
      case 'FEMALE': return 'Femenino'
      default: return gender
    }
  }

  const getStatusVariant = (status: string) => {
    return status === 'ACTIVE' ? 'default' : 'secondary'
  }

  const getStatusLabel = (status: string) => {
    return status === 'ACTIVE' ? 'Activo' : 'Inactivo'
  }

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Información principal */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusVariant(patient.status)}>
                    {getStatusLabel(patient.status)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    #{patient.patientNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Información básica */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Edad:</span>
                  <span className="font-medium">{formatAge(getDisplayAge(patient.age || 0, patient.birthDate))}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Género:</span>
                  <span className="font-medium">{getGenderLabel(patient.gender)}</span>
                </div>

                {patient.birthDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Nacimiento:</span>
                    <span className="font-medium">{formatDate(patient.birthDate)}</span>
                  </div>
                )}
              </div>

              {/* Información médica */}
              <div className="space-y-3">
                {patient.bloodType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="h-4 w-4 text-red-400" />
                    <span className="text-gray-600">Grupo Sanguíneo:</span>
                    <span className="font-medium text-red-600">{patient.bloodType}</span>
                  </div>
                )}

                {patient.allergies && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Alergias:</span>
                      <div className="font-medium text-amber-600 mt-1">
                        {patient.allergies}
                      </div>
                    </div>
                  </div>
                )}

                {patient.emergencyContact && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Emergencia:</span>
                    <span className="font-medium">{patient.emergencyContact}</span>
                  </div>
                )}
              </div>

              {/* Información de contacto */}
              <div className="space-y-3">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-medium">{patient.phone}</span>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Dirección:</span>
                      <div className="font-medium mt-1">{patient.address}</div>
                    </div>
                  </div>
                )}

                {patient.nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Nacionalidad:</span>
                    <span className="font-medium">{patient.nationality}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Antecedentes médicos */}
            {patient.medicalHistory && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-800 mb-2">
                  Antecedentes Médicos
                </h3>
                <p className="text-sm text-amber-700">
                  {patient.medicalHistory}
                </p>
              </div>
            )}

            {/* Seguro médico */}
            {patient.insurance && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 mb-1">
                  Seguro Médico
                </h3>
                <p className="text-sm text-green-700">
                  {patient.insurance.name}
                </p>
              </div>
            )}
          </div>

          {/* Botón de edición */}
          {showEditButton && onEdit && (
            <div className="flex-shrink-0">
              <Button 
                onClick={onEdit}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar Paciente
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

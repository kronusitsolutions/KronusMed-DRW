"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, TrendingUp, Clock, AlertCircle } from "lucide-react"
import { VirtualizedPatientList } from "@/components/patients/virtualized-patient-list"
import { usePatients } from "@/hooks/use-patients"
import { Patient } from "@/hooks/use-patient-search"
import { toast } from "sonner"

/**
 * Página optimizada de pacientes con lista virtualizada
 * Maneja hasta 2000 registros con búsqueda instantánea y renderizado eficiente
 */
export default function OptimizedPatientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Estados para acciones
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Hook personalizado para cargar pacientes
  const { patients, isLoading, error, refetch, totalCount } = usePatients()

  // Redirigir si no está autenticado
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  // Handlers para acciones de pacientes
  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    toast.info(`Viendo detalles de ${patient.name}`)
    // Aquí puedes abrir un modal o navegar a una página de detalles
  }

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    toast.info(`Editando ${patient.name}`)
    // Aquí puedes abrir un modal de edición o navegar a una página de edición
  }

  const handleDeletePatient = async (patient: Patient) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${patient.name}?`)) {
      return
    }

    try {
      setIsActionLoading(true)
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Paciente eliminado exitosamente")
        await refetch() // Recargar la lista
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al eliminar paciente")
      }
    } catch (error) {
      console.error("Error al eliminar paciente:", error)
      toast.error("Error al eliminar paciente")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleViewMedicalNotes = (patient: Patient) => {
    setSelectedPatient(patient)
    toast.info(`Viendo notas médicas de ${patient.name}`)
    // Aquí puedes abrir un modal o navegar a las notas médicas
  }

  // Calcular estadísticas
  const activePatients = patients.filter(p => p.status === 'ACTIVE').length
  const inactivePatients = patients.filter(p => p.status === 'INACTIVE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes Optimizados</h1>
          <p className="text-muted-foreground">
            Lista virtualizada con búsqueda instantánea para hasta 2000 registros
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            Recargar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Registros cargados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePatients}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((activePatients / totalCount) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inactivePatients}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((inactivePatients / totalCount) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Optimizado</div>
            <p className="text-xs text-muted-foreground">
              Lista virtualizada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar pacientes: {error}
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="ml-2"
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando pacientes...</p>
          </div>
        </div>
      )}

      {/* Lista Virtualizada */}
      {!isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pacientes</CardTitle>
            <CardDescription>
              Búsqueda instantánea y renderizado optimizado para máximo rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VirtualizedPatientList
              patients={patients}
              onViewPatient={handleViewPatient}
              onEditPatient={handleEditPatient}
              onDeletePatient={handleDeletePatient}
              onViewMedicalNotes={handleViewMedicalNotes}
              height={600}
              itemHeight={100}
            />
          </CardContent>
        </Card>
      )}

      {/* Información de rendimiento */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Optimizaciones Aplicadas</h3>
              <div className="mt-2 text-sm text-blue-800 space-y-1">
                <p>• <strong>Lista Virtualizada:</strong> Solo renderiza elementos visibles</p>
                <p>• <strong>Búsqueda Instantánea:</strong> Filtrado en tiempo real sin llamadas al servidor</p>
                <p>• <strong>Carga Única:</strong> Todos los datos se cargan una sola vez al inicio</p>
                <p>• <strong>Memoria Optimizada:</strong> Maneja eficientemente hasta 2000 registros</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
